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

// Initialize sensors after MQTT client is created
const sensors = require('./lib/sensor').init(display, mqttClient);

// Set up joystick events if supported by the Sense HAT library
if (typeof display.on === 'function') {
    display.on('joystick', (event) => {
        console.log('Joystick event:', event);

        // Publish joystick event to MQTT
        mqttClient.publish(config.mqtt.topics.joystick, JSON.stringify({
            action: event.action,
            direction: event.direction,
            timestamp: new Date().toISOString()
        }));
    });
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (sensors) {
        sensors.stopPublishing();
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