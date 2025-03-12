const mqtt = require('mqtt');
const senseHat = require('sense-hat-led');

// Clear the display initially
senseHat.clear();

// MQTT connection configuration
const mqttConfig = {
    host: '10.1.3.200',        // Your Home Assistant IP
    port: 1883,                // Default MQTT port
    username: 'mqtt', // Your MQTT username
    password: 'm1q2t3t4!', // Your MQTT password
};

// Connect to the MQTT broker
const client = mqtt.connect(`mqtt://${mqttConfig.host}:${mqttConfig.port}`, {
    username: mqttConfig.username,
    password: mqttConfig.password,
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
        // Parse the JSON message
        const data = JSON.parse(message.toString());

        // Handle text message
        if (data.message) {
            console.log(`Displaying message: ${data.message}`);
            senseHat.showMessage(data.message, 0.1);
        }

        // Handle color change
        if (data.color && Array.isArray(data.color) && data.color.length === 3) {
            const [r, g, b] = data.color;
            console.log(`Setting background color to RGB(${r}, ${g}, ${b})`);
            senseHat.clear([r, g, b]);
        }

        // Handle patterns (optional feature)
        if (data.pattern && Array.isArray(data.pattern)) {
            console.log('Displaying custom pattern');
            senseHat.setPixels(data.pattern);
        }
    } catch (error) {
        console.error('Error processing message:', error);
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