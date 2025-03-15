#!/usr/bin/python3
from sense_hat import SenseHat
import json
import time
import sys

sense = SenseHat()

# Clear the screen
sense.clear()

print("Joystick monitor started")

try:
    while True:
        for event in sense.stick.get_events():
            # Convert event to JSON format
            event_data = {
                "action": event.action,
                "direction": event.direction,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ", time.gmtime())
            }
            
            # Output as JSON for Node.js to read
            print(json.dumps(event_data))
            sys.stdout.flush()  # Make sure it's output immediately
            
            # Optional: Provide visual feedback
            if event.action == "pressed":
                sense.clear(0, 255, 0)  # Green
                time.sleep(0.1)
                sense.clear()
        
        # Brief pause to reduce CPU usage
        time.sleep(0.1)
except KeyboardInterrupt:
    sense.clear()
    print("Joystick monitor stopped")