import time
import random
import numpy as np
from collections import deque

class PECSEngine:
    """
    Predictive Error Control System (PECS) Core Engine.
    Handles predictive threat detection and packet analysis for wireless defense.
    """
    def __init__(self, buffer_size=100, threat_threshold=0.75):
        self.buffer_size = buffer_size
        self.threat_threshold = threat_threshold
        self.packet_history = deque(maxlen=buffer_size)
        self.threat_signatures = set()
        self.is_active = False

    def start(self):
        """Activates the PECS engine."""
        self.is_active = True
        print("[PECS] Engine activated. Monitoring wireless traffic...")

    def stop(self):
        """Deactivates the PECS engine."""
        self.is_active = False
        print("[PECS] Engine deactivated.")

    def analyze_packet(self, packet_data):
        """
        Analyzes incoming packet data using predictive modeling.
        In a real-world scenario, this would interface with Scapy or a similar library.
        """
        # Extract features (simplified for logic demonstration)
        src_mac = packet_data.get('src_mac')
        signal_strength = packet_data.get('rssi', -100)
        packet_type = packet_data.get('type', 'DATA')
        
        # Add to history for predictive analysis
        self.packet_history.append(packet_data)
        
        # Predictive threat score calculation
        threat_score = self._calculate_threat_score(packet_data)
        
        if threat_score >= self.threat_threshold:
            return True, threat_score  # Threat detected
        return False, threat_score

    def _calculate_threat_score(self, packet):
        """
        Internal predictive scoring logic based on historical patterns and anomalies.
        """
        score = 0.0
        
        # 1. Anomaly detection: Unexpected packet types or high frequency
        if packet.get('type') in ['DEAUTH', 'DISASSOC']:
            score += 0.5
            
        # 2. Signal strength analysis: Rapidly changing RSSI suggests movement/probing
        if len(self.packet_history) > 5:
            rssi_values = [p.get('rssi', -100) for p in list(self.packet_history)[-5:]]
            if np.std(rssi_values) > 10:
                score += 0.2
                
        # 3. Known signature matching
        if packet.get('src_mac') in self.threat_signatures:
            score += 0.4
            
        return min(score, 1.0)

    def update_signatures(self, new_signatures):
        """Updates the internal threat signature database."""
        self.threat_signatures.update(new_signatures)
        print(f"[PECS] Updated threat signatures. Total: {len(self.threat_signatures)}")

    def get_predictive_state(self):
        """Returns the current predictive state of the environment."""
        if not self.packet_history:
            return "STABLE"
        
        avg_threat = np.mean([self._calculate_threat_score(p) for p in self.packet_history])
        if avg_threat > 0.5:
            return "ELEVATED"
        elif avg_threat > 0.8:
            return "CRITICAL"
        return "STABLE"

if __name__ == "__main__":
    # Example usage of the PECS engine
    engine = PECSEngine()
    engine.start()
    
    # Simulate incoming packets
    test_packets = [
        {'src_mac': 'AA:BB:CC:DD:EE:FF', 'rssi': -45, 'type': 'DATA'},
        {'src_mac': '11:22:33:44:55:66', 'rssi': -30, 'type': 'DEAUTH'},
        {'src_mac': 'AA:BB:CC:DD:EE:FF', 'rssi': -46, 'type': 'DATA'},
    ]
    
    for p in test_packets:
        is_threat, score = engine.analyze_packet(p)
        print(f"Packet from {p['src_mac']} - Threat: {is_threat} (Score: {score:.2f})")
    
    print(f"Current Environment State: {engine.get_predictive_state()}")
    engine.stop()
