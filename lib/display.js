const senseHat = require('sense-hat-led');
const config = require('../config');

// Track current rotation state
let currentRotation = config.display.defaultRotation;

let messageInProgress = false;

// Initialize display
function init() {
    // Clear display on startup
    clearDisplay();

    // Set initial rotation
    setRotation(currentRotation);

    // Return an object with all the display functions and the senseHat object
    return {
        ...senseHat,
        clearDisplay,
        scheduleClear,
        displayMessage,
        setBackgroundColor,
        setRotation,
        getCurrentRotation: () => currentRotation
    };
}

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
    return setTimeout(clearDisplay, delay);
}

// Function to handle displaying messages on Sense HAT
function displayMessage(message, color = config.display.defaultColor) {
    // Check if a message is already in progress
    if (messageInProgress) {
        console.log('Message display already in progress, skipping new message');
        return -1; // Return a negative value to indicate message was skipped
    }

    console.log(`Displaying message: ${message}`);

    // Set the lock
    messageInProgress = true;

    // Clear display first
    clearDisplay();

    // Calculate a reasonable scroll time based on message length
    const scrollTime = message.length * 110 + 2000;

    try {
        // Force rotation before showing message
        senseHat.setRotation(currentRotation);

        // Show the message
        senseHat.showMessage(message, 0.1, color);

        // Schedule clearing the display
        const clearTimer = scheduleClear(scrollTime);

        // Release the lock after the message display should be complete
        setTimeout(() => {
            messageInProgress = false;
            console.log('Message display completed, lock released');
        }, scrollTime + 100); // Give a little extra time
    } catch (e) {
        console.error('Error displaying message:', e);
        senseHat.showMessage('Error', 0.1, config.display.errorColor);
        setTimeout(() => {
            messageInProgress = false;
        }, 1500);
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

// Function to set display rotation
function setRotation(rotation) {
    const validRotation = [0, 90, 180, 270].includes(rotation) ? rotation : config.display.defaultRotation;
    console.log(`Setting display rotation to ${validRotation} degrees`);
    currentRotation = validRotation;
    senseHat.setRotation(validRotation);
}

module.exports = {
    init,
    clearDisplay,
    scheduleClear,
    displayMessage,
    setBackgroundColor,
    setRotation
};