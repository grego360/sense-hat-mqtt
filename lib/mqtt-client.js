const mqtt = require('mqtt');
const config = require('../config');
const { parseMessagePayload } = require('./message-parser');

// Main MQTT client module
function createClient(dependencies) {
    const { display, audio, sensors } = dependencies;

    // Connect to the MQTT broker
    const client = mqtt.connect(`mqtt://${config.mqtt.host}:${config.mqtt.port}`, {
        username: config.mqtt.username,
        password: config.mqtt.password,
        clientId: config.mqtt.clientId
    });

    console.log('Attempting to connect to MQTT broker...');

    // Set up event handlers
    setupEventHandlers(client, dependencies);

    return client;
}

// Set up all MQTT event handlers
function setupEventHandlers(client, { display, audio, sensors }) {
    // Handle connection events
    client.on('connect', () => {
        console.log('Connected to MQTT broker successfully!');

        // Subscribe to the topic where Home Assistant will publish messages
        client.subscribe(config.mqtt.topics.message);
        console.log(`Subscribed to topic: ${config.mqtt.topics.message}`);

        // Subscribe to command topic
        client.subscribe(config.mqtt.topics.command);
        console.log(`Subscribed to topic: ${config.mqtt.topics.command}`);

        // Play connection sound
        audio.playSound('connect');

        // Display confirmation on the Sense HAT
        display.displayMessage('Connected!', config.display.successColor);

        // Start sending sensor data
        if (sensors) {
            sensors.startPublishing();
        }
    });

    // Handle incoming messages
    client.on('message', (topic, message) => {
        console.log(`Received message on topic ${topic}: ${message.toString()}`);

        try {
            const data = parseMessagePayload(message);

            if (topic === config.mqtt.topics.message) {
                processMessage(data, { display, audio });
            } else if (topic === config.mqtt.topics.command) {
                processCommand(data, { display, audio, sensors, client });
            }
        } catch (error) {
            console.error('Error processing message:', error);
            console.error('Message was:', message.toString());

            audio.playSound('error');
            display.displayMessage('Error', config.display.errorColor);
        }
    });

    // Handle error events
    client.on('error', (error) => {
        console.error('MQTT connection error:', error);
        audio.playSound('error');
        display.displayMessage('MQTT Error', config.display.errorColor);
    });

    // Handle disconnection
    client.on('close', () => {
        console.log('Disconnected from MQTT broker');
        display.displayMessage('Disconnected', config.display.warningColor);
    });
}

// Process regular messages
function processMessage(data, { display, audio }) {
    // Always clear the display first to prevent double text
    display.clearDisplay();

    // Always set display rotation explicitly
    const rotation = data.rotation !== undefined ?
        data.rotation :
        display.getCurrentRotation();

    display.setRotation(rotation);

    // Handle volume adjustment if specified
    if (data.volume !== undefined && typeof data.volume === 'number') {
        audio.setVolume(data.volume);
    }

    // Handle text message
    if (data.message) {
        const textColor = data.color && Array.isArray(data.color) && data.color.length === 3
            ? data.color : config.display.defaultColor;

        // Display message
        display.displayMessage(data.message, textColor);

        // Play sound based on message type or specific sound request
        if (data.sound) {
            audio.playSound(data.sound);
        } else {
            audio.playSound('message');
        }

        // If speech is requested, also speak the message
        if (data.speak) {
            audio.speakText(data.message);
        }
    }

    // Handle color change (separate from message)
    if (data.color && Array.isArray(data.color) && data.color.length === 3 && !data.message) {
        display.setBackgroundColor(data.color);
    }

    // Handle patterns (optional feature)
    if (data.pattern && Array.isArray(data.pattern)) {
        console.log('Displaying custom pattern');
        display.senseHat.setPixels(data.pattern);
    }
}

// Process command messages
function processCommand(data, { display, audio, sensors, client }) {
    switch (data.action) {
        case 'get_sensors':
            // Immediately publish sensor data on demand
            if (sensors) {
                console.log('Received command to publish sensor data immediately');
                const sensorData = sensors.publishSensorData();

                // Optionally provide visual feedback
                if (sensorData) {
                    display.displayMessage('Sensors sent', [0, 255, 0]);
                }
            } else {
                console.log('Sensor module not available');
            }
            break;

        case 'set_interval':
            // Change the sensor publishing interval
            if (sensors && data.interval && typeof data.interval === 'number') {
                console.log(`Changing sensor publish interval to ${data.interval}ms`);
                // Update config
                config.sensors.publishInterval = data.interval;
                // Restart publishing with new interval
                sensors.stopPublishing();
                sensors.startPublishing();
            }
            break;

        // Your existing commands...
        case 'clear':
            // Clear the display
            display.clearDisplay();
            break;

        case 'reboot':
            // Reboot the Raspberry Pi (requires sudo)
            const { exec } = require('child_process');
            exec('sudo reboot', (error) => {
                if (error) console.error('Error rebooting:', error);
            });
            break;

        default:
            console.log(`Unknown command action: ${data.action}`);
    }
}

module.exports = {
    createClient
};