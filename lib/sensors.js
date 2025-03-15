// lib/sensors.js
const config = require('../config');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs');

// Store dependencies
let senseHat;
let mqttClient;
let publishInterval;
let joystickProcess;

function init(displayInstance, mqttClientInstance) {
    console.log('Initializing sensor module with comprehensive data collection...');

    senseHat = displayInstance;
    mqttClient = mqttClientInstance;

    // Start joystick monitoring if enabled
    if (config.sensors.joystickEnabled) {
        startJoystickMonitoring();
    }

    return {
        publishSensorData,
        startPublishing,
        stopPublishing,
        startJoystickMonitoring,
        stopJoystickMonitoring,
        publishJoystickEvent
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

// Function to publish joystick events to MQTT
function publishJoystickEvent(event) {
    // Ensure event has required fields
    const eventData = {
        action: event.action,
        direction: event.direction,
        timestamp: new Date().toISOString()
    };

    console.log('Publishing joystick event:', eventData);
    mqttClient.publish(config.mqtt.topics.joystick, JSON.stringify(eventData));

    // Flash the display to provide visual feedback
    try {
        // Get current pixels if supported
        let currentPixels = null;
        try {
            if (senseHat && typeof senseHat.getPixels === 'function') {
                currentPixels = senseHat.getPixels();
            }
        } catch (err) {
            console.log('Could not get current pixels:', err.message);
        }

        // Flash green
        if (senseHat && typeof senseHat.setPixels === 'function') {
            // Create a green flash pattern
            const greenPattern = Array(64).fill([0, 255, 0]);
            senseHat.setPixels(greenPattern);
        } else if (senseHat && typeof senseHat.clear === 'function') {
            senseHat.clear([0, 255, 0]);
        }

        // Restore previous state
        setTimeout(() => {
            if (currentPixels && senseHat && typeof senseHat.setPixels === 'function') {
                senseHat.setPixels(currentPixels);
            } else if (senseHat && typeof senseHat.clear === 'function') {
                senseHat.clear();
            }
        }, 200);
    } catch (err) {
        console.error('Error providing visual feedback:', err);
    }
}

// Function to start the Python joystick monitor
function startJoystickMonitoring() {
    // Don't start if already running
    if (joystickProcess) {
        console.log('Joystick monitoring already running');
        return joystickProcess;
    }

    console.log('Starting Python joystick monitor...');
    joystickProcess = spawn('python3', ['joystick_monitor.py']);

    joystickProcess.stdout.on('data', (data) => {
        const outputLines = data.toString().trim().split('\n');

        outputLines.forEach(line => {
            try {
                // Skip non-JSON lines like "Joystick monitor started"
                if (!line.startsWith('{')) {
                    console.log('Python output:', line);
                    return;
                }

                // Parse the JSON
                const event = JSON.parse(line);

                // Only process actual event data
                if (event.action && event.direction) {
                    console.log('Joystick event from Python:', event);
                    publishJoystickEvent(event);
                }
            } catch (err) {
                console.log('Error processing Python output:', err.message);
                console.log('Raw output:', line);
            }
        });
    });

    joystickProcess.stderr.on('data', (data) => {
        console.error('Python error:', data.toString());
    });

    joystickProcess.on('close', (code) => {
        console.log(`Python joystick monitor exited with code ${code}`);
        joystickProcess = null;
    });

    return joystickProcess;
}

// Function to stop the Python joystick monitor
function stopJoystickMonitoring() {
    if (joystickProcess) {
        console.log('Stopping Python joystick monitor...');
        joystickProcess.kill();
        joystickProcess = null;
    }
}

// Clean up resources on exit
process.on('SIGINT', () => {
    console.log('Shutting down sensors module...');
    if (joystickProcess) {
        joystickProcess.kill();
    }
    if (publishInterval) {
        clearInterval(publishInterval);
    }
    if (senseHat && typeof senseHat.clear === 'function') {
        senseHat.clear();
    }
});

// Handle direct joystick events from the Sense HAT library if available
function setupDirectJoystickEvents() {
    try {
        console.log('Setting up direct joystick event handling...');

        // Approach 1: Try using senseHat.on method
        if (senseHat && typeof senseHat.on === 'function') {
            senseHat.on('joystick', (event) => {
                console.log('Joystick event detected (direct):', event);
                publishJoystickEvent(event);
            });
            console.log('Direct joystick event handler registered');
            return true;
        }
    } catch (error) {
        console.error('Error setting up direct joystick events:', error);
    }
    return false;
}

module.exports = { init };
