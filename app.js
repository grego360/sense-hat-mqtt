const mqtt = require('mqtt');
const senseHat = require('sense-hat-led');
const { exec } = require('child_process');

// ===== Helper Functions =====

// Function to clear display
function clearDisplay() {
    console.log('Clearing display');
    senseHat.clear();

    // Explicitly turn off all pixels
    const offPixels = [];
    for (let i = 0; i < 64; i++) {
        offPixels.push([0, 0, 0]);
    }
    senseHat.setPixels(offPixels);
}

// Function to schedule display clearing after a delay
function scheduleClear(delay) {
    console.log(`Setting timer to clear display after ${delay}ms`);
    setTimeout(clearDisplay, delay);
}

// Function to play sounds through the HDMI audio
// function playSound(soundType) {
//     let command;

//     switch (soundType) {
//         case 'connect':
//             command = 'aplay /usr/share/sounds/alsa/Front_Center.wav';
//             break;
//         case 'message':
//             command = 'aplay /usr/share/sounds/alsa/Front_Right.wav';
//             break;
//         case 'error':
//             command = 'aplay /usr/share/sounds/alsa/Front_Left.wav';
//             break;
//         default:
//             command = 'aplay /usr/share/sounds/alsa/Noise.wav';
//     }

//     exec(command, (error) => {
//         if (error) {
//             console.error('Error playing sound:', error);
//         }
//     });
// }

// Function to speak text
function speakText(text) {
    const safeText = text.replace(/"/g, '\\"'); // Escape quotes for shell safety
    exec(`echo "${safeText}" | festival --tts`, (error) => {
        if (error) {
            console.error('Error with text-to-speech:', error);
        }
    });
}

// Function to handle displaying messages on Sense HAT
function displayMessage(message, color = [255, 255, 255]) {
    console.log(`Displaying message: ${message}`);

    // Clear display first
    clearDisplay();

    // Calculate a reasonable scroll time based on message length
    const scrollTime = message.length * 110 + 2000;

    try {
        // Show the message
        senseHat.showMessage(message, 0.1, color);

        // Schedule clearing the display
        scheduleClear(scrollTime);
    } catch (e) {
        console.error('Error displaying message:', e);
        senseHat.showMessage('Error', 0.1, [255, 0, 0]);
        scheduleClear(1500);
    }

    return scrollTime;
}

// Function to set background color
function setBackgroundColor(color) {
    const [r, g, b] = color;
    console.log(`Setting background color to RGB(${r}, ${g}, ${b})`);

    // Fill the entire display with the color
    const pixels = [];
    for (let i = 0; i < 64; i++) {
        pixels.push([r, g, b]);
    }
    senseHat.setPixels(pixels);
}

// Function to process MQTT messages
function processMessage(data) {
    // Set orientation to ensure proper display
    senseHat.setRotation(0);

    // Handle text message
    if (data.message) {
        const textColor = data.color && Array.isArray(data.color) && data.color.length === 3
            ? data.color : [255, 255, 255]; // Default to white

        // Display message
        displayMessage(data.message, textColor);

        // Play notification sound
        // playSound('message');

        // If speech is requested, also speak the message
        if (data.speak) {
            speakText(data.message);
        }
    }

    // Handle color change (separate from message)
    if (data.color && Array.isArray(data.color) && data.color.length === 3 && !data.message) {
        setBackgroundColor(data.color);
    }

    // Handle patterns (optional feature)
    if (data.pattern && Array.isArray(data.pattern)) {
        console.log('Displaying custom pattern');
        senseHat.setPixels(data.pattern);
    }
}

// Function to parse MQTT message payload
function parseMessagePayload(message) {
    // Clean up the message string - remove ALL extra quotes
    let messageStr = message.toString().trim();

    // If it starts with a quote (single or double), try to find matching end quote
    if ((messageStr.startsWith("'") && messageStr.endsWith("'")) ||
        (messageStr.startsWith('"') && messageStr.endsWith('"'))) {
        messageStr = messageStr.substring(1, messageStr.length - 1);
    }

    // Try parsing as is first
    try {
        return JSON.parse(messageStr);
    } catch (innerError) {
        // If that fails, it might be a string representation of JSON
        const unescaped = messageStr.replace(/\\"/g, '"');
        return JSON.parse(unescaped);
    }
}

// ===== Main MQTT Setup =====

// Clear the display initially
clearDisplay();

// MQTT connection configuration
const mqttConfig = {
    host: '10.1.3.200',
    port: 1883,
    username: 'mqtt',
    password: 'mqtt123'
};

// Connect to the MQTT broker
const client = mqtt.connect(`mqtt://${mqttConfig.host}:${mqttConfig.port}`, {
    username: mqttConfig.username,
    password: mqttConfig.password,
    clientId: 'rpi-sense-hat-' + Math.random().toString(16).substring(2, 8)
});

console.log('Attempting to connect to MQTT broker...');

// ===== Event Handlers =====

// Handle connection events
client.on('connect', () => {
    console.log('Connected to MQTT broker successfully!');

    // Subscribe to the topic where Home Assistant will publish messages
    const topic = 'home/sensehat/message';
    client.subscribe(topic);
    console.log(`Subscribed to topic: ${topic}`);

    // Play connection sound
    // playSound('connect');

    // Display confirmation on the Sense HAT
    displayMessage('Connected!', [0, 255, 0]);
});

// Handle incoming messages
client.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);

    try {
        const data = parseMessagePayload(message);
        processMessage(data);
    } catch (error) {
        console.error('Error processing message:', error);
        console.error('Message was:', message.toString());

        // playSound('error');
        displayMessage('Error', [255, 0, 0]);
    }
});

// Handle error events
client.on('error', (error) => {
    console.error('MQTT connection error:', error);
    // playSound('error');
    displayMessage('MQTT Error', [255, 0, 0]);
});

// Handle disconnection
client.on('close', () => {
    console.log('Disconnected from MQTT broker');
    displayMessage('Disconnected', [255, 165, 0]);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    clearDisplay();
    client.end();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // playSound('error');
    displayMessage('Error', [255, 0, 0]);

    // Clear before exiting
    clearDisplay();
    client.end();
    process.exit(1);
});

console.log('MQTT client started and waiting for messages...');