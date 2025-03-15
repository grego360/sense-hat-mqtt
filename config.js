// Configuration settings for the application
module.exports = {
    mqtt: {
        host: '10.1.3.200',
        port: 1883,
        username: 'mqtt',
        password: 'mqtt123',
        clientId: 'rpi-sense-hat-' + Math.random().toString(16).substring(2, 8),
        topics: {
            message: 'home/sensehat/message',
            command: 'home/sensehat/command',
            sensors: 'home/sensehat/sensors',
            joystick: 'home/sensehat/joystick'
        }
    },
    display: {
        defaultRotation: 180,
        defaultColor: [255, 255, 255],
        errorColor: [255, 0, 0],
        successColor: [0, 255, 0],
        warningColor: [255, 165, 0]
    },
    audio: {
        defaultVolume: 80,
        soundsDir: './sounds'
    },
    sensors: {
        publishInterval: 30000,  // Every 30 seconds
        joystickEnabled: true,
        joystickDebounceTime: 300  // Debounce time in milliseconds to prevent duplicate events
    }
};
