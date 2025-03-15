const config = require('../config');

// lib/sensors.js - modify the init function
function init(displayInstance, mqttClientInstance) {
    console.log('Initializing sensor module with dependencies...');

    // Check if displayInstance has direct sensor methods or contains a senseHat object
    let senseHatInstance = displayInstance;

    // If display wraps a senseHat object, use that instead
    if (displayInstance.senseHat && typeof displayInstance.senseHat.getTemperature === 'function') {
        console.log('Using wrapped senseHat object for sensor readings');
        senseHatInstance = displayInstance.senseHat;
    }

    // Log available sensor methods
    console.log('Sensor methods available:');
    console.log('- getTemperature:', typeof senseHatInstance.getTemperature === 'function');
    console.log('- getHumidity:', typeof senseHatInstance.getHumidity === 'function');
    console.log('- getPressure:', typeof senseHatInstance.getPressure === 'function');

    // Store dependencies
    senseHat = senseHatInstance;
    mqttClient = mqttClientInstance;

    // Return API
    return {
        publishSensorData: () => publishSensorData(),
        startPublishing: () => startPublishing(),
        stopPublishing: () => stopPublishing()
    };
}

// Variable to store the interval ID
let publishInterval;

// Function to read and publish sensor data
function publishSensorData() {
    try {
        // Read sensor data
        const temperature = this.senseHat.getTemperature();
        const humidity = this.senseHat.getHumidity();
        const pressure = this.senseHat.getPressure();
        const orientation = this.senseHat.getOrientation();
        const accelerometer = this.senseHat.getAccelerometer();

        // Format data as JSON
        const data = {
            temperature: parseFloat(temperature.toFixed(2)),
            humidity: parseFloat(humidity.toFixed(2)),
            pressure: parseFloat(pressure.toFixed(2)),
            orientation: {
                roll: parseFloat(orientation.roll.toFixed(2)),
                pitch: parseFloat(orientation.pitch.toFixed(2)),
                yaw: parseFloat(orientation.yaw.toFixed(2))
            },
            accelerometer: {
                x: parseFloat(accelerometer.x.toFixed(2)),
                y: parseFloat(accelerometer.y.toFixed(2)),
                z: parseFloat(accelerometer.z.toFixed(2))
            },
            timestamp: new Date().toISOString()
        };

        // Publish to MQTT
        this.mqttClient.publish(config.mqtt.topics.sensors, JSON.stringify(data));
        console.log('Published sensor data to MQTT');

    } catch (error) {
        console.error('Error publishing sensor data:', error);
    }
}

// Start publishing sensor data at regular intervals
function startPublishing() {
    // Publish initial data
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
        console.log('Stopped publishing sensor data');
    }
}

module.exports = { init };