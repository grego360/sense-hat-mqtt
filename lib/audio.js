const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Function to play sounds through the HDMI audio
function playSound(soundType) {
    // Base directory for sound files
    const soundDir = path.resolve(config.audio.soundsDir);
    let soundFile;

    switch (soundType) {
        case 'connect':
            soundFile = 'success.wav';
            break;
        case 'message':
            soundFile = 'notification.wav';
            break;
        case 'alert':
            soundFile = 'alert.wav';
            break;
        case 'bell':
            soundFile = 'bell.wav';
            break;
        case 'error':
            soundFile = 'alert.wav'; // Using alert for error if no specific error sound
            break;
        default:
            soundFile = 'notification.wav'; // Default sound
    }

    // Full path to the sound file
    const fullPath = path.join(soundDir, soundFile);

    // Check if the file exists before trying to play it
    if (fs.existsSync(fullPath)) {
        exec(`aplay "${fullPath}"`, (error) => {
            if (error) {
                console.error(`Error playing sound ${fullPath}:`, error);
                // Fall back to system sounds if custom sound fails
                exec('aplay /usr/share/sounds/alsa/Front_Right.wav');
            }
        });
    } else {
        console.error(`Sound file not found: ${fullPath}`);
        // Fall back to system sounds
        exec('aplay /usr/share/sounds/alsa/Front_Right.wav');
    }
}

// Function to speak text
function speakText(text) {
    const safeText = text.replace(/"/g, '\\"'); // Escape quotes for shell safety
    exec(`echo "${safeText}" | festival --tts`, (error) => {
        if (error) {
            console.error('Error with text-to-speech:', error);
        }
    });
}

// Function to set system volume (0-100)
function setVolume(level) {
    const volumeLevel = Math.min(100, Math.max(0, level)); // Ensure between 0-100
    exec(`amixer set Master ${volumeLevel}%`, (error) => {
        if (error) console.error('Error setting volume:', error);
    });
}

module.exports = {
    playSound,
    speakText,
    setVolume
};