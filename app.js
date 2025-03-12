const mqtt = require('mqtt');
const senseHat = require('sense-hat-led');

// Clear the display initially
senseHat.clear();

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

// Handle connection events
client.on('connect', () => {
    console.log('Connected to MQTT broker successfully!');

    // Subscribe to the topic where Home Assistant will publish messages
    const topic = 'home/sensehat/message';
    client.subscribe(topic);
    console.log(`Subscribed to topic: ${topic}`);

    // Display confirmation on the Sense HAT
    senseHat.showMessage('Connected!', 0.1, [0, 255, 0]);
});

// Handle incoming messages
client.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);

    try {
        // Clean up the message string - remove ALL extra quotes
        let messageStr = message.toString().trim();

        // If it starts with a quote (single or double), try to find matching end quote
        if ((messageStr.startsWith("'") && messageStr.endsWith("'")) ||
            (messageStr.startsWith('"') && messageStr.endsWith('"'))) {
            messageStr = messageStr.substring(1, messageStr.length - 1);
        }

        // Handle case where JSON might still be escaped within quotes
        try {
            // Try parsing as is first
            const data = JSON.parse(messageStr);
            processMessage(data);
        } catch (innerError) {
            // If that fails, it might be a string representation of JSON
            const unescaped = messageStr.replace(/\\"/g, '"');
            const data = JSON.parse(unescaped);
            processMessage(data);
        }

        function processMessage(data) {
            // Set orientation to ensure proper display
            senseHat.setRotation(0); // Try different values if needed

            // Handle text message
            if (data.message) {
                console.log(`Displaying message: ${data.message}`);
                // Clear display first
                senseHat.clear();
                // Show message with specified color if available
                const textColor = data.color && Array.isArray(data.color) && data.color.length === 3
                    ? data.color : [255, 255, 255]; // Default to white
                senseHat.showMessage(data.message, 0.1, textColor);

                // Clear after a delay
                setTimeout(() => {
                    senseHat.clear();
                }, data.message.length * 500); // Adjust timing based on message length
            }

            // Handle color change (separate from message)
            if (data.color && Array.isArray(data.color) && data.color.length === 3 && !data.message) {
                const [r, g, b] = data.color;
                console.log(`Setting background color to RGB(${r}, ${g}, ${b})`);

                // Fill the entire display with the color
                const pixels = [];
                for (let i = 0; i < 64; i++) {
                    pixels.push([r, g, b]);
                }
                senseHat.setPixels(pixels);
            }

            // Handle patterns (optional feature)
            if (data.pattern && Array.isArray(data.pattern)) {
                console.log('Displaying custom pattern');
                senseHat.setPixels(data.pattern);
            }
        }

    } catch (error) {
        console.error('Error processing message:', error);
        console.error('Message was:', message.toString());
        senseHat.showMessage('Error', 0.1, [255, 0, 0]);
    }
});

// Handle error events
client.on('error', (error) => {
    console.error('MQTT connection error:', error);
    senseHat.showMessage('MQTT Error', 0.1, [255, 0, 0]);
});

// Handle disconnection
client.on('close', () => {
    console.log('Disconnected from MQTT broker');
    senseHat.showMessage('Disconnected', 0.1, [255, 165, 0]);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    senseHat.clear();
    client.end();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    senseHat.showMessage('Error', 0.1, [255, 0, 0]);
    senseHat.clear();
    client.end();
    process.exit(1);
});

console.log('MQTT client started and waiting for messages...');