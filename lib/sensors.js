// lib/sensors.js
const config = require('../config');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs');

// Store dependencies
let senseHat;
let mqttClient;
let publishInterval;

function init(displayInstance, mqttClientInstance) {
    console.log('Initializing sensor module with comprehensive data collection...');

    senseHat = displayInstance;
    mqttClient = mqttClientInstance;

    return {
        publishSensorData,
        startPublishing,
        stopPublishing
    };
}

// Function to read sensor data using the command-line
async function readSensorData() {
    return new Promise((resolve, reject) => {
        // Create a temporary Python script to get all sensor readings
        const tempScriptPath = './temp_sensor_script.py';
        
        // Comprehensive Python script to read all Sense HAT V2 sensors
        const pythonScript = `
from sense_hat import SenseHat
import json
import time

try:
    s = SenseHat()
    time.sleep(0.1)  # Small delay for sensors to stabilize
    
    # Read environmental sensors
    temp = s.get_temperature()
    humidity = s.get_humidity()
    pressure = s.get_pressure()
    
    # Read orientation sensors
    orientation = s.get_orientation()
    
    # Read raw accelerometer data
    accel = s.get_accelerometer_raw()
    
    # Read raw gyroscope data
    gyro = s.get_gyroscope_raw()
    
    # Read raw magnetometer data
    mag = s.get_compass_raw()
    
    # Compile all data
    data = {
        "temperature": round(temp, 2),
        "humidity": round(humidity, 2),
        "pressure": round(pressure, 2),
        "orientation": {
            "roll": round(orientation["roll"], 2),
            "pitch": round(orientation["pitch"], 2),
            "yaw": round(orientation["yaw"], 2)
        },
        "accelerometer": {
            "x": round(accel["x"], 4),
            "y": round(accel["y"], 4),
            "z": round(accel["z"], 4)
        },
        "gyroscope": {
            "x": round(gyro["x"], 4),
            "y": round(gyro["y"], 4),
            "z": round(gyro["z"], 4)
        },
        "magnetometer": {
            "x": round(mag["x"], 4),
            "y": round(mag["y"], 4),
            "z": round(mag["z"], 4)
        }
    }
    
    print(json.dumps(data))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

        try {
            // Write the Python script to a temporary file
            fs.writeFileSync(tempScriptPath, pythonScript);
            
            // Execute the Python script
            exec(`python3 ${tempScriptPath}`, (error, stdout, stderr) => {
                // Clean up the temporary file
                try { fs.unlinkSync(tempScriptPath); } catch (e) { console.error('Error removing temp file:', e); }
                
                if (error) {
                    console.error(`Error reading sensors: ${error.message}`);
                    return reject(error);
                }
                if (stderr) {
                    console.error(`Stderr: ${stderr}`);
                    return reject(new Error(stderr));
                }

                try {
                    // Parse the JSON output
                    const sensorData = JSON.parse(stdout.trim());
                    
                    if (sensorData.error) {
                        console.error(`Python script error: ${sensorData.error}`);
                        return reject(new Error(sensorData.error));
                    }
                    
                    console.log(`Read comprehensive sensor data via Python`);
                    return resolve(sensorData);
                } catch (err) {
                    console.error('Error parsing sensor data:', err, 'Raw output:', stdout);
                    reject(err);
                }
            });
        } catch (err) {
            console.error('Error writing temporary Python script:', err);
            reject(err);
        }
    });
}

// Function to read and publish sensor data
async function publishSensorData() {
    try {
        console.log('Reading and publishing sensor data...');

        // Read comprehensive sensor data using Python
        const sensorData = await readSensorData();

        // Add timestamp to the data
        const data = {
            ...sensorData,
            timestamp: new Date().toISOString()
        };

        console.log('Prepared sensor data:', JSON.stringify(data));

        // Publish to MQTT
        mqttClient.publish(config.mqtt.topics.sensors, JSON.stringify(data));
        console.log('Published sensor data to MQTT');

        return data;
    } catch (error) {
        console.error('Error publishing sensor data:', error);
        return null;
    }
}

// Start publishing sensor data at regular intervals
function startPublishing() {
    // Stop any existing interval
    stopPublishing();

    // Publish initial data immediately
    publishSensorData();

    // Set up interval for regular publishing
    publishInterval = setInterval(publishSensorData, config.sensors.publishInterval);
    console.log(`Started publishing sensor data every ${config.sensors.publishInterval}ms`);

    return publishInterval;
}

// Stop publishing sensor data
function stopPublishing() {
    if (publishInterval) {
        clearInterval(publishInterval);
        publishInterval = null;
        console.log('Stopped publishing sensor data');
    }
}

// Start Python joystick monitor if enabled in config
if (config.sensors.joystickEnabled) {
    console.log('Starting Python joystick monitor...');
    const joystickProcess = spawn('python3', ['joystick_monitor.py']);

    joystickProcess.stdout.on('data', (data) => {
        const outputLines = data.toString().trim().split('\n');

        outputLines.forEach(line => {
            try {
                // Check if this is a joystick event (JSON)
                if (line.includes('"action"') && line.includes('"direction"')) {
                    const event = JSON.parse(line);
                    console.log('Joystick event from Python:', event);

                    // Publish to MQTT
                    mqttClient.publish(config.mqtt.topics.joystick, JSON.stringify(event));

                    // Flash the display if available
                    if (senseHat && typeof senseHat.setPixels === 'function') {
                        // Create a green flash pattern
                        const greenPattern = Array(64).fill([0, 255, 0]);
                        senseHat.setPixels(greenPattern);
                        setTimeout(() => senseHat.clear(), 200);
                    }
                } else {
                    console.log('Python output:', line);
                }
            } catch (err) {
                console.log('Non-JSON output from Python:', line);
            }
        });
    });

    joystickProcess.stderr.on('data', (data) => {
        console.error('Python error:', data.toString());
    });

    joystickProcess.on('close', (code) => {
        console.log(`Python joystick monitor exited with code ${code}`);
    });

    // Clean up the Python process on exit
    process.on('SIGINT', () => {
        console.log('Shutting down...');
        if (joystickProcess) {
            joystickProcess.kill();
        }
        if (publishInterval) {
            clearInterval(publishInterval);
        }
        if (senseHat && typeof senseHat.clear === 'function') {
            senseHat.clear();
        }
        if (mqttClient && typeof mqttClient.end === 'function') {
            mqttClient.end();
        }
        process.exit(0);
    });
}

module.exports = { init };
