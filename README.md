# Raspberry Pi Sense HAT MQTT Client

This Node.js application connects your Raspberry Pi Sense HAT V2 to Home Assistant (or any other MQTT broker) to display messages and control the LED matrix remotely.

## Version 1.0.6

### What's New

- Added support for custom display rotation (0, 90, 180, 270 degrees)
- Added custom sound support with fallback to system sounds
- Added volume control functionality
- Added text-to-speech functionality with Festival engine
- Improved message display with automatic clearing
- Enhanced JSON message parsing with better error handling
- Added unique client ID for more reliable MQTT connections
- Better error reporting and handling

## Prerequisites

- Raspberry Pi with Sense HAT V2 attached
- Node.js installed on your Raspberry Pi
- MQTT broker (such as Home Assistant or Mosquitto)
- Festival text-to-speech engine (for speech functionality)

## Installation

1. Clone this repository to your Raspberry Pi:

   ```bash
   git clone https://github.com/yourusername/sense-hat-mqtt.git
   cd sense-hat-mqtt
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Install Festival text-to-speech engine (for speech functionality):

   ```bash
   sudo apt-get update
   sudo apt-get install festival
   ```

## Configuration

Edit the `app.js` file to update the MQTT connection details:

```javascript
// MQTT connection configuration
const mqttConfig = {
  host: "10.1.3.200", // Your MQTT broker IP
  port: 1883, // Default MQTT port
  username: "mqtt", // Your MQTT username
  password: "mqtt123", // Your MQTT password
};

// The client ID is automatically generated for uniqueness
// clientId: 'rpi-sense-hat-' + Math.random().toString(16).substring(2, 8)
```

## Running the Application

Start the application:

```bash
npm start
```

The application will connect to your MQTT broker and subscribe to the `home/sensehat/message` topic.

## MQTT Message Format

Send messages to the `home/sensehat/message` topic in JSON format:

### Display Text

```json
{
  "message": "Hello World!"
}
```

### Text with Speech

```json
{
  "message": "Hello World!",
  "speak": true
}
```

When the `speak` parameter is set to `true`, the message will be spoken aloud using the Festival text-to-speech engine.

### Text with Custom Rotation

```json
{
  "message": "Hello World!",
  "rotation": 90
}
```

The `rotation` parameter accepts values of 0, 90, 180, or 270 degrees to control the orientation of the display.

### Custom Sound

```json
{
  "message": "Hello World!",
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

## Home Assistant Integration

Add the following to your Home Assistant `configuration.yaml`:

```yaml
mqtt:
  broker: 10.1.3.200 # Your MQTT broker IP
  port: 1883
  username: mqtt
  password: mqtt123

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
        payload_template: '{"message": "{{ states.input_text.sensehat_message.state }}"}'
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
   ExecStart=/usr/bin/node /home/strot/sense-hat-mqtt/app.js
   WorkingDirectory=/home/strot/sense-hat-mqtt
   StandardOutput=inherit
   StandardError=inherit
   Restart=always
   User=strot

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

- **Permission issues**: Add your user to the required groups:

  ```bash
  sudo usermod -a -G i2c,gpio,spi strot
  ```

- **MQTT connection errors**: Verify your MQTT broker credentials and ensure the broker is running

- **Service logs**: Check the application logs if you encounter issues:

  ```bash
  sudo journalctl -u sense-hat-mqtt.service
  ```

## License

MIT
