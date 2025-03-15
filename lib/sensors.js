// lib/sensors.js
const config = require('../config');
const { exec } = require('child_process');
const { spawn } = require('child_process');

// Store dependencies
let senseHat;
let mqttClient;
let publishInterval;

function init(displayInstance, mqttClientInstance) {
    console.log('Initializing sensor module with fallback methods...');

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
        // Use the Python sense_hat library via command-line
        exec('python3 -c "from sense_hat import SenseHat; s=SenseHat(); print(s.get_temperature(), s.get_humidity(), s.get_pressure())"', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error reading sensors: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return reject(new Error(stderr));
            }

            try {
                // Parse the output - should be three numbers separated by spaces
                const [temperature, humidity, pressure] = stdout.trim().split(' ').map(Number);
                console.log(`Read sensor data via Python: temp=${temperature}°C, humidity=${humidity}%, pressure=${pressure}hPa`);

                resolve({ temperature, humidity, pressure });
            } catch (err) {
                reject(err);
            }
        });
    });
}

// Function to read and publish sensor data
async function publishSensorData() {
    try {
        console.log('Reading and publishing sensor data...');

        // Read sensor data using Python since Node.js library isn't working
        const { temperature, humidity, pressure } = await readSensorData();

        // Format data as JSON
        const data = {
            temperature: parseFloat(temperature.toFixed(2)),
            humidity: parseFloat(humidity.toFixed(2)),
            pressure: parseFloat(pressure.toFixed(2)),
            // We'll use fixed values for orientation and accelerometer since we can't access them
            orientation: {
                roll: 0,
                pitch: 0,
                yaw: 0
            },
            accelerometer: {
                x: 0,
                y: 0,
                z: 0
            },
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

// Start Python joystick monitor
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

                // Flash the display
                if (typeof display.setBackgroundColor === 'function') {
                    display.setBackgroundColor([0, 255, 0]);
                    setTimeout(() => display.clearDisplay(), 200);
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
    if (sensors && typeof sensors.stopPublishing === 'function') {
        sensors.stopPublishing();
    }
    display.clearDisplay();
    mqttClient.end();
    process.exit(0);
});

module.exports = { init };