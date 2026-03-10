import math
import time
import json
from typing import Dict, Any, List

class BufferZoneSystem:
    """
    Spatial Buffer Zone System with Expandable Radius.
    Defines a physical safety perimeter (1.5m x 1.5m) and tracks threats within it.
    """
    def __init__(self, initial_radius: float = 1.5):
        self.radius = initial_radius
        self.center = (0, 0)  # Local coordinates of the protected device
        self.tracked_threats = {}
        self.is_active = False
        self.expansion_factor = 1.2

    def activate(self):
        """Activates the spatial buffer zone system."""
        self.is_active = True
        print(f"[BufferZone] Safety shield activated. Radius: {self.radius}m")

    def deactivate(self):
        """Deactivates the spatial buffer zone system."""
        self.is_active = False
        print("[BufferZone] Safety shield deactivated.")

    def track_threat(self, threat_id: str, rssi: int, angle: float = 0.0):
        """
        Tracks a threat's position relative to the buffer zone.
        In a real-world scenario, this would use RSSI and ToF for distance estimation.
        """
        # Simplified distance estimation based on RSSI (Free-space path loss model)
        # distance = 10 ^ ((Measured Power - RSSI) / (10 * Path Loss Exponent))
        # For this logic, we'll use a simplified linear mapping for demonstration
        distance = max(0.1, (abs(rssi) - 30) / 20)
        
        # Calculate local coordinates (x, y)
        x = distance * math.cos(math.radians(angle))
        y = distance * math.sin(math.radians(angle))
        
        self.tracked_threats[threat_id] = {
            "distance": distance,
            "coords": (x, y),
            "rssi": rssi,
            "timestamp": time.time()
        }
        
        return self._check_breach(threat_id)

    def _check_breach(self, threat_id: str) -> bool:
        """Checks if a tracked threat has breached the buffer zone."""
        threat = self.tracked_threats.get(threat_id)
        if not threat:
            return False
        
        if threat["distance"] <= self.radius:
            print(f"[BufferZone] ALERT: Threat {threat_id} breached the {self.radius}m buffer zone!")
            return True
        return False

    def expand_radius(self, factor: float = None):
        """Expands the buffer zone radius based on threat levels."""
        if factor is None:
            factor = self.expansion_factor
        self.radius *= factor
        print(f"[BufferZone] Radius expanded to {self.radius:.2f}m")

    def contract_radius(self, factor: float = 0.8):
        """Contracts the buffer zone radius to conserve resources or focus defense."""
        self.radius *= factor
        print(f"[BufferZone] Radius contracted to {self.radius:.2f}m")

    def get_zone_status(self) -> Dict[str, Any]:
        """Returns the current status of the buffer zone and tracked threats."""
        return {
            "active": self.is_active,
            "radius": self.radius,
            "tracked_threats_count": len(self.tracked_threats),
            "threats": self.tracked_threats
        }

if __name__ == "__main__":
    # Example usage of the Buffer Zone System
    zone = BufferZoneSystem(initial_radius=1.5)
    zone.activate()
    
    # Simulate threat tracking
    threats = [
        {'id': 'T1', 'rssi': -65, 'angle': 45},  # Outside
        {'id': 'T2', 'rssi': -40, 'angle': 120}, # Inside
        {'id': 'T3', 'rssi': -55, 'angle': 270}, # Near boundary
    ]
    
    for t in threats:
        breached = zone.track_threat(t['id'], t['rssi'], t['angle'])
        print(f"Threat {t['id']} - Distance: {zone.tracked_threats[t['id']]['distance']:.2f}m - Breached: {breached}")
    
    # Expand radius due to high threat activity
    zone.expand_radius()
    
    print(f"\nZone Status:\n{json.dumps(zone.get_zone_status(), indent=2)}")
    zone.deactivate()
