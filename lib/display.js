const senseHat = require('sense-hat-led');
const config = require('../config');

// Track current rotation state
let currentRotation = config.display.defaultRotation;

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
    console.log(`Displaying message: ${message}`);

    // Clear display first
    clearDisplay();

    // Calculate a reasonable scroll time based on message length
    const scrollTime = message.length * 110 + 2000;

    try {
        // Show the message - this internally modifies rotation temporarily
        senseHat.showMessage(message, 0.1, color);
        
        // Explicitly restore rotation after message is shown
        // This is necessary because showMessage internally changes rotation
        setRotation(currentRotation);

        // Schedule clearing the display
        scheduleClear(scrollTime);
    } catch (e) {
        console.error('Error displaying message:', e);
        senseHat.showMessage('Error', 0.1, config.display.errorColor);
        
        // Restore rotation even after error
        setRotation(currentRotation);
        
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