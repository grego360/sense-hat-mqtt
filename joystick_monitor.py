#!/usr/bin/python3
from sense_hat import SenseHat
import json
import time
import sys
import datetime

sense = SenseHat()

# Clear the screen
sense.clear()

# Debouncing variables
last_events = {}
debounce_time = 0.3  # seconds

print("Joystick monitor started")

try:
    while True:
        for event in sense.stick.get_events():
            # Create a unique key for this event type
            event_key = f"{event.action}-{event.direction}"
            current_time = time.time()
            
            # Check if we should debounce this event
            if event_key in last_events:
                time_diff = current_time - last_events[event_key]
                if time_diff < debounce_time:
                    # Skip this event as it's within the debounce period
                    continue
            
            # Update the last event time
            last_events[event_key] = current_time
            
            # Get current timestamp in ISO format
            timestamp = datetime.datetime.now().isoformat()
            
            # Convert event to JSON format
            event_data = {
                "action": event.action,
                "direction": event.direction,
                "timestamp": timestamp
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