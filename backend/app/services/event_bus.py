from datetime import datetime
from typing import List, Dict
import collections

class EventBus:
    _instance = None
    _events: collections.deque = collections.deque(maxlen=50) # Keep last 50 events

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventBus, cls).__new__(cls)
        return cls._instance

    def publish(self, event_type: str, message: str, level: str = "INFO"):
        """Publish a new event to the bus."""
        event = {
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "type": event_type,
            "message": message,
            "level": level
        }
        self._events.appendleft(event) # Newest first
        print(f"[{level}] {event_type}: {message}") # Also print to console

    def get_recent(self) -> List[Dict]:
        """Get recent events."""
        return list(self._events)

# Global Instance
bus = EventBus()
