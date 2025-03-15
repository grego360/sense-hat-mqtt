# Raspberry Pi Sense HAT MQTT Client

This Node.js application connects your Raspberry Pi Sense HAT V2 to Home Assistant (or any other MQTT broker) to display messages, control the LED matrix remotely, and publish sensor data.

## Version 2.0.0

### What's New in 2.0.0

- **Complete Sensor Data Integration**: Now publishes data from all Sense HAT V2 sensors:
  - Temperature sensor
  - Humidity sensor
  - Pressure sensor
  - Accelerometer
  - Gyroscope
  - Magnetometer
  - Joystick input
- **Enhanced Joystick Support**: Improved joystick event handling with Python integration
- **Display Improvements**: Fixed rotation issues and added message queue to prevent overlapping text
- **Command Extensions**: Added new commands for on-demand sensor data and interval adjustment
- **Improved Error Handling**: Better error recovery and reporting
- **Code Refactoring**: Modular code structure for easier maintenance and extensions

#### Previous Features

- Custom display rotation (0, 90, 180, 270 degrees)
- Custom sound support with fallback to system sounds
- Volume control functionality
- Text-to-speech functionality with Festival engine
- Automatic message display clearing
- Enhanced JSON message parsing
- Unique client ID for reliable MQTT connections

## Prerequisites

- Raspberry Pi with Sense HAT V2 attached
- Node.js 18+ installed on your Raspberry Pi
- MQTT broker (such as Home Assistant or Mosquitto)
- Python 3 with sense-hat library installed
- Festival text-to-speech engine (for speech functionality)

## Installation

1. Clone this repository to your Raspberry Pi:

   ```bash
   git clone https://github.com/grego360/sense-hat-mqtt.git
   cd sense-hat-mqtt
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Install Python dependencies:

   ```bash
   pip3 install sense-hat
   ```

4. Install Festival text-to-speech engine (for speech functionality):

   ```bash
   sudo apt-get update
   sudo apt-get install festival
   ```

## Configuration

Edit the `config.js` file to update the MQTT connection details and other settings:

```javascript
module.exports = {
    mqtt: {
        host: "10.1.3.200", // Your MQTT broker IP
        port: 1883, // Default MQTT port
        username: "mqtt", // Your MQTT username
        password: "mqtt123", // Your MQTT password
        topics: {
            message: "home/sensehat/message",
            command: "home/sensehat/command",
            sensors: "home/sensehat/sensors",
            joystick: "home/sensehat/joystick"
        }
    },
    display: {
        // Display settings...
        defaultColor: [255, 255, 255],
        defaultRotation: 0
    },
    audio: {
        // Audio settings...
        defaultVolume: 80
    },
    sensors: {
        publishInterval: 30000, // Publish sensor data every 30 seconds
        joystickEnabled: true, // Enable joystick monitoring
        joystickDebounceTime: 300 // Debounce time in milliseconds to prevent duplicate events
    }
};
```

## Running the Application

Start the application:

```bash
npm start
```

The application will connect to your MQTT broker and subscribe to the `home/sensehat/message` topic.

## MQTT Topics

The application uses the following MQTT topics:

- `home/sensehat/message` - Send messages to display on the Sense HAT
- `home/sensehat/command` - Send commands to control the device
- `home/sensehat/sensors` - Receive sensor data from the Sense HAT
- `home/sensehat/joystick` - Receive joystick events from the Sense HAT

## Message Format

Send messages to the `home/sensehat/message` topic in JSON format:

### Display Text

```json
{
  "text": "Hello World!",
  "color": [255, 0, 0],
  "rotation": 0,
  "speed": 0.1
}
```

All fields except `text` are optional. Default values are:

- `color`: [255, 255, 255] (white)
- `rotation`: 0 (degrees, can be 0, 90, 180, or 270)
- `speed`: 0.1 (scrolling speed, lower is faster)

### Text with Speech

```json
{
  "text": "Hello World!",
  "speak": true
}
```

When the `speak` parameter is set to `true`, the message will be spoken aloud using the Festival text-to-speech engine.

### Text with Custom Rotation

```json
{
  "text": "Hello World!",
  "rotation": 90
}
```

The `rotation` parameter accepts values of 0, 90, 180, or 270 degrees to control the orientation of the display.

### Custom Sound

```json
{
  "text": "Hello World!",
  "sound": "bell"
}
```

The `sound` parameter accepts values: "connect", "message", "alert", "bell", or "error".

### Volume Control

```json
{
  "volume": 75
}
```

The `volume` parameter accepts values from 0-100 to set the system volume level.

### Change Background Color

```json
{
  "color": [255, 0, 0]
}
```

### Display Custom Pattern

```json
{
  "pattern": [
    [255, 0, 0],
    [255, 0, 0],
    [255, 87, 0],
    [255, 196, 0],
    [205, 255, 0],
    [95, 255, 0],
    [0, 255, 13],
    [0, 255, 122],
    [255, 0, 0],
    [255, 96, 0],
    [255, 205, 0],
    [196, 255, 0],
    [87, 255, 0],
    [0, 255, 22],
    [0, 255, 131],
    [0, 255, 240],
    [255, 105, 0],
    [255, 214, 0],
    [187, 255, 0],
    [78, 255, 0],
    [0, 255, 30],
    [0, 255, 140],
    [0, 255, 248],
    [0, 152, 255],
    [255, 223, 0],
    [178, 255, 0],
    [70, 255, 0],
    [0, 255, 40],
    [0, 255, 148],
    [0, 253, 255],
    [0, 144, 255],
    [0, 34, 255],
    [170, 255, 0],
    [61, 255, 0],
    [0, 255, 48],
    [0, 255, 157],
    [0, 243, 255],
    [0, 134, 255],
    [0, 26, 255],
    [83, 0, 255],
    [52, 255, 0],
    [0, 255, 57],
    [0, 255, 166],
    [0, 235, 255],
    [0, 126, 255],
    [0, 17, 255],
    [92, 0, 255],
    [201, 0, 255],
    [0, 255, 66],
    [0, 255, 174],
    [0, 226, 255],
    [0, 117, 255],
    [0, 8, 255],
    [100, 0, 255],
    [210, 0, 255],
    [255, 0, 192],
    [0, 255, 183],
    [0, 217, 255],
    [0, 109, 255],
    [0, 0, 255],
    [110, 0, 255],
    [218, 0, 255],
    [255, 0, 183],
    [255, 0, 74]
  ]
}
```

## Sensor Data Format

The application publishes sensor data to the `home/sensehat/sensors` topic in the following JSON format:

```json
{
  "temperature": 24.57,
  "humidity": 45.32,
  "pressure": 1013.25,
  "orientation": {
    "roll": 0.23,
    "pitch": 1.56,
    "yaw": 178.34
  },
  "accelerometer": {
    "x": 0.0012,
    "y": 0.0034,
    "z": 0.9987
  },
  "gyroscope": {
    "x": 0.0023,
    "y": 0.0045,
    "z": 0.0067
  },
  "magnetometer": {
    "x": 23.45,
    "y": 34.56,
    "z": 45.67
  },
  "timestamp": "2025-03-15T11:45:30.123Z"
}
```

## Joystick Event Format

The application publishes joystick events to the `home/sensehat/joystick` topic in the following JSON format:

```json
{
  "action": "pressed",
  "direction": "up",
  "timestamp": "2025-03-15T11:45:30.123Z"
}
```

Possible values for `action` are: `pressed`, `released`, `held`

Possible values for `direction` are: `up`, `down`, `left`, `right`, `middle`

### Joystick Debouncing

To prevent duplicate events when a single joystick action occurs, debouncing is implemented at both the Python and Node.js levels:

1. The Python script (`joystick_monitor.py`) applies a 300ms debounce filter to raw joystick events
2. The Node.js application (`sensors.js`) applies an additional 300ms debounce filter

You can adjust the debounce time in the `config.js` file by changing the `joystickDebounceTime` value (in milliseconds).

## Commands

Send commands to the `home/sensehat/command` topic in JSON format:

### Clear Display

```json
{
  "action": "clear"
}
```

### Play Sound

```json
{
  "action": "sound",
  "sound": "beep"
}
```

Built-in sounds: `beep`, `alert`, `confirm`

### Speak Text

```json
{
  "action": "speak",
  "text": "Hello, I am your Raspberry Pi"
}
```

### Set Volume

```json
{
  "action": "volume",
  "level": 80
}
```

Volume level should be between 0 and 100.

### Get Sensor Data On Demand

```json
{
  "action": "get_sensors"
}
```

### Change Sensor Publishing Interval

```json
{
  "action": "set_interval",
  "interval": 60000
}
```

## Home Assistant Integration

Add the following to your Home Assistant `configuration.yaml`:

```yaml
mqtt:
  sensor:
    - name: "SenseHat Message"
      state_topic: "home/sensehat/message"
      value_template: "{{ value_json.text }}"
      
    - name: "SenseHat Temperature"
      state_topic: "home/sensehat/sensors"
      value_template: "{{ value_json.temperature }}"
      unit_of_measurement: "°C"
      device_class: "temperature"
      
    - name: "SenseHat Humidity"
      state_topic: "home/sensehat/sensors"
      value_template: "{{ value_json.humidity }}"
      unit_of_measurement: "%"
      device_class: "humidity"
      
    - name: "SenseHat Pressure"
      state_topic: "home/sensehat/sensors"
      value_template: "{{ value_json.pressure }}"
      unit_of_measurement: "hPa"
      device_class: "pressure"
      
    # Add more sensors as needed for accelerometer, gyroscope, etc.

input_text:
  sensehat_message:
    name: "Sense HAT Message"
    initial: ""

automation:
  - alias: "Send message to Sense HAT"
    trigger:
      platform: state
      entity_id: input_text.sensehat_message
    action:
      service: mqtt.publish
      data:
        topic: "home/sensehat/message"
        payload_template: '{"text": "{{ states.input_text.sensehat_message.state }}"}'
        
  - alias: "React to SenseHat Joystick"
    trigger:
      platform: mqtt
      topic: home/sensehat/joystick
    condition:
      template: '{{ trigger.payload_json.action == "pressed" }}'
    action:
      service: notify.mobile_app
      data:
        title: "Joystick Event"
        message: "Direction: {{ trigger.payload_json.direction }}"
```

## Running as a Service

To run the application as a systemd service that starts automatically on boot:

1. Create a systemd service file:

   ```bash
   sudo nano /etc/systemd/system/sense-hat-mqtt.service
   ```

2. Add the following content (adjust paths if needed):

   ```ini
   [Unit]
   Description=Sense HAT MQTT Client
   After=network.target

   [Service]
   ExecStart=/usr/bin/node /home/pi/sense-hat-mqtt/app.js
   WorkingDirectory=/home/pi/sense-hat-mqtt
   StandardOutput=inherit
   StandardError=inherit
   Restart=always
   User=pi

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:

   ```bash
   sudo systemctl enable sense-hat-mqtt.service
   sudo systemctl start sense-hat-mqtt.service
   ```

4. Check the status:

   ```bash
   sudo systemctl status sense-hat-mqtt.service
   ```

## Troubleshooting

### Python Sensor Access

If you encounter issues with sensor readings, ensure the Python sense-hat library is correctly installed:

```bash
pip3 install --upgrade sense-hat
```

Also make sure your user has the necessary permissions to access the Sense HAT hardware:

```bash
sudo usermod -a -G i2c,input,gpio $USER
```

### Joystick Issues

If joystick events aren't being detected, check that the Python joystick monitor is running correctly. You can test it manually:

```bash
python3 joystick_monitor.py
```

Press the joystick in different directions and verify that JSON events are printed to the console.

If you're experiencing duplicate joystick events (multiple events triggered by a single press):

1. Increase the debounce time in `config.js` by setting a higher value for `joystickDebounceTime` (default is 300ms)
2. You can also adjust the Python-level debouncing by modifying the `debounce_time` variable in `joystick_monitor.py`
3. Make sure you're using the latest version of the sense-hat Python library

### MQTT Connection Issues

- Verify your MQTT broker credentials and ensure the broker is running
- Check network connectivity between your Raspberry Pi and the MQTT broker

### Service Logs

Check the application logs if you encounter issues:

```bash
sudo journalctl -u sense-hat-mqtt.service
```

## License

MIT
