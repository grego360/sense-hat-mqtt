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

module.exports = {
    parseMessagePayload
};