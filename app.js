const { spawn } = require('child_process');

// Main application entry point
const config = require('./config');

// Initialize display module
const display = require('./lib/display').init();

// Initialize audio module
const audio = require('./lib/audio');

// Initialize MQTT client
const mqttClient = require('./lib/mqtt-client').createClient({
    display,
    audio
});

// Joystick monitoring is now handled in the sensors module

// Test MQTT publishing function
function testMqttPublish() {
    const testData = {
        temperature: 22.5,
        humidity: 45.0,
        pressure: 1013.25,
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

    console.log('Sending test data to MQTT:', JSON.stringify(testData));
    mqttClient.publish(config.mqtt.topics.sensors, JSON.stringify(testData));
    console.log('Test data published');
}

// Initialize sensors after MQTT client is created
console.log('Initializing sensor module...');
const sensors = require('./lib/sensors').init(display, mqttClient);

// Explicitly start publishing sensor data
console.log('Starting sensor data publishing...');
if (sensors && typeof sensors.startPublishing === 'function') {
    sensors.startPublishing();
    console.log('Sensor publishing started successfully');
} else {
    console.error('Failed to start sensor publishing - sensors object:', sensors);
}

// Schedule a test MQTT publish after 5 seconds
console.log('Scheduling test MQTT publish...');
setTimeout(testMqttPublish, 5000);

// Log available methods on display object for debugging
console.log('Checking display capabilities:');
console.log('- clearDisplay:', typeof display.clearDisplay === 'function');
console.log('- on method:', typeof display.on === 'function');
console.log('- getPixels:', typeof display.getPixels === 'function');
console.log('- setPixels:', typeof display.setPixels === 'function');
console.log('- getTemperature:', typeof display.getTemperature === 'function');
console.log('- getHumidity:', typeof display.getHumidity === 'function');
console.log('- getPressure:', typeof display.getPressure === 'function');

// Check direct access to senseHat if it exists
if (display.senseHat) {
    console.log('Found senseHat object, checking capabilities:');
    console.log('- getTemperature:', typeof display.senseHat.getTemperature === 'function');
    console.log('- on method:', typeof display.senseHat.on === 'function');
}

// Joystick events are now handled in the sensors module

// Joystick event publishing is now handled in the sensors module

// Joystick event handling is now centralized in the sensors module

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (sensors) {
        if (typeof sensors.stopPublishing === 'function') {
            sensors.stopPublishing();
        }
        if (typeof sensors.stopJoystickMonitoring === 'function') {
            sensors.stopJoystickMonitoring();
        }
    }
    display.clearDisplay();
    mqttClient.end();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    audio.playSound('error');
    display.displayMessage('Error', config.display.errorColor);

    // Clear before exiting
    display.clearDisplay();
    mqttClient.end();
    process.exit(1);
});

console.log('MQTT client started and waiting for messages...');