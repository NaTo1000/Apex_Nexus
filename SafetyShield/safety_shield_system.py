import time
import json
from typing import Dict, Any, List

# Import our custom modules
from pecs_engine import PECSEngine
from naydoe_orchestrator import NayDoeV1Orchestrator
from reflection_manager import ReflectionManager
from buffer_zone_system import BufferZoneSystem

class SafetyShieldSystem:
    """
    AI-Powered Autonomous Wireless Defense System (Safety Shield).
    Integrates PECS, NayDoeV1 Orchestration, Reflection, and Buffer Zone.
    """
    def __init__(self, initial_radius: float = 1.5, open_ports: List[int] = [80, 443]):
        self.pecs = PECSEngine()
        self.orchestrator = NayDoeV1Orchestrator()
        self.reflection = ReflectionManager(open_ports=open_ports)
        self.buffer_zone = BufferZoneSystem(initial_radius=initial_radius)
        self.is_running = False

    def start(self):
        """Activates the entire safety shield system."""
        print("="*50)
        print("STARTING AI-POWERED AUTONOMOUS WIRELESS DEFENSE SHIELD")
        print("="*50)
        self.pecs.start()
        self.reflection.activate_reflection()
        self.buffer_zone.activate()
        self.is_running = True
        print("[System] Safety shield is now fully operational.")

    def stop(self):
        """Deactivates the entire safety shield system."""
        self.pecs.stop()
        self.reflection.deactivate_reflection()
        self.buffer_zone.deactivate()
        self.is_running = False
        print("[System] Safety shield has been deactivated.")

    def process_event(self, event_data: Dict[str, Any]):
        """
        Processes a wireless event through the integrated defense layers.
        """
        if not self.is_running:
            return "SYSTEM_OFFLINE"

        print(f"\n[Event] Processing wireless event from {event_data.get('src_mac', 'UNKNOWN')}")

        # 1. PECS: Predictive Threat Detection
        is_threat, threat_score = self.pecs.analyze_packet(event_data)
        event_data['is_malicious'] = is_threat
        event_data['threat_score'] = threat_score

        # 2. Buffer Zone: Spatial Tracking
        breached = self.buffer_zone.track_threat(
            event_data.get('src_mac'), 
            event_data.get('rssi', -100),
            event_data.get('angle', 0.0)
        )

        # 3. NayDoeV1 Orchestration: AI Decision Making
        if is_threat or breached:
            print(f"[System] Threat detected (Score: {threat_score:.2f}) or Buffer breached. Orchestrating defense...")
            defense_report = self.orchestrator.orchestrate(event_data)
            print(f"[NayDoeV1] Defense Action: {defense_report['response_action']}")
            
            # 4. Reflection Manager: Execute Deflection
            action = self.reflection.process_traffic(event_data)
            print(f"[Reflection] Final Action: {action}")
            
            # Adaptive Response: Expand buffer if threat is persistent
            if threat_score > 0.9:
                self.buffer_zone.expand_radius()
        else:
            # Legitimate traffic processing
            action = self.reflection.process_traffic(event_data)
            print(f"[System] Legitimate traffic allowed. Action: {action}")

        return action

    def get_system_report(self) -> Dict[str, Any]:
        """Generates a comprehensive system status report."""
        return {
            "system": "Safety Shield v1.0",
            "orchestrator": self.orchestrator.get_system_status(),
            "pecs_state": self.pecs.get_predictive_state(),
            "reflection_stats": self.reflection.get_stats(),
            "buffer_zone": self.buffer_zone.get_zone_status()
        }

if __name__ == "__main__":
    # Example usage of the integrated Safety Shield System
    shield = SafetyShieldSystem(initial_radius=1.5, open_ports=[80, 443, 22])
    shield.start()
    
    # Simulate a series of wireless events
    events = [
        # Legitimate traffic to an open port
        {'src_mac': 'AA:BB:CC:DD:EE:FF', 'src_ip': '192.168.1.5', 'dst_port': 80, 'rssi': -45, 'type': 'DATA'},
        
        # Malicious deauth attack from outside the buffer zone
        {'src_mac': 'DE:AD:BE:EF:00:11', 'src_ip': '10.0.0.15', 'dst_port': 22, 'rssi': -70, 'type': 'DEAUTH'},
        
        # Malicious deauth attack breaching the buffer zone
        {'src_mac': 'DE:AD:BE:EF:00:11', 'src_ip': '10.0.0.15', 'dst_port': 22, 'rssi': -35, 'type': 'DEAUTH'},
        
        # Legitimate traffic to a closed port
        {'src_mac': 'AA:BB:CC:DD:EE:FF', 'src_ip': '192.168.1.5', 'dst_port': 8080, 'rssi': -46, 'type': 'DATA'},
    ]
    
    for e in events:
        shield.process_event(e)
        time.sleep(0.5)
    
    print("\n" + "="*50)
    print("FINAL SYSTEM REPORT")
    print("="*50)
    print(json.dumps(shield.get_system_report(), indent=2))
    
    shield.stop()
