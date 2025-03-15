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

// Set up joystick events if supported by the Sense HAT library
try {
    console.log('Setting up joystick event handling...');

    // Approach 1: Try using display.on method
    if (typeof display.on === 'function') {
        display.on('joystick', (event) => {
            console.log('Joystick event detected (approach 1):', event);
            publishJoystickEvent(event);
        });
        console.log('Joystick event handler registered using display.on');
    }
    // Approach 2: Try using display.senseHat.on method if available
    else if (display.senseHat && typeof display.senseHat.on === 'function') {
        display.senseHat.on('joystick', (event) => {
            console.log('Joystick event detected (approach 2):', event);
            publishJoystickEvent(event);
        });
        console.log('Joystick event handler registered using display.senseHat.on');
    }
    // Approach 3: Set up polling for joystick if other methods aren't available
    else {
        console.log('No event-based joystick support found, setting up polling...');

        const pollMethod = display.getJoystick ||
            (display.senseHat && display.senseHat.getJoystick);

        if (typeof pollMethod === 'function') {
            console.log('Setting up joystick polling');
            const joystickInterval = setInterval(() => {
                try {
                    const joystick = pollMethod.call(display.senseHat || display);
                    if (joystick && joystick.isPressed) {
                        const event = {
                            action: 'press',
                            direction: joystick.direction || 'middle',
                            timestamp: new Date().toISOString()
                        };
                        console.log('Joystick event detected (polling):', event);
                        publishJoystickEvent(event);
                    }
                } catch (err) {
                    console.error('Error polling joystick:', err);
                }
            }, 100); // Poll every 100ms
        } else {
            console.log('WARNING: No supported joystick methods found');
        }
    }
} catch (error) {
    console.error('Error setting up joystick events:', error);
}

// Function to publish joystick events to MQTT
function publishJoystickEvent(event) {
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
            if (typeof display.getPixels === 'function') {
                currentPixels = display.getPixels();
            }
        } catch (err) {
            console.log('Could not get current pixels:', err.message);
        }

        // Flash green
        if (typeof display.setBackgroundColor === 'function') {
            display.setBackgroundColor([0, 255, 0]);
        } else if (typeof display.clear === 'function') {
            display.clear([0, 255, 0]);
        }

        // Restore previous state
        setTimeout(() => {
            if (currentPixels && typeof display.setPixels === 'function') {
                display.setPixels(currentPixels);
            } else if (typeof display.clearDisplay === 'function') {
                display.clearDisplay();
            } else if (typeof display.clear === 'function') {
                display.clear();
            }
        }, 200);
    } catch (err) {
        console.error('Error providing visual feedback:', err);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (sensors && typeof sensors.stopPublishing === 'function') {
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