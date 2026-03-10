import time
import json
from typing import List, Dict, Any

class ReflectionManager:
    """
    Wireless Attack Reflection and Smart Port Management Layer.
    Handles the deflection of malicious packets and dynamic port whitelisting.
    """
    def __init__(self, open_ports: List[int] = [80, 443, 22]):
        self.open_ports = set(open_ports)
        self.blocked_ips = set()
        self.reflection_active = False
        self.reflection_stats = {"reflected_packets": 0, "blocked_threats": 0}

    def activate_reflection(self):
        """Activates the attack reflection mechanism."""
        self.reflection_active = True
        print("[Reflection] Attack reflection layer activated.")

    def deactivate_reflection(self):
        """Deactivates the attack reflection mechanism."""
        self.reflection_active = False
        print("[Reflection] Attack reflection layer deactivated.")

    def process_traffic(self, packet: Dict[str, Any]) -> str:
        """
        Processes incoming traffic and applies reflection or port management rules.
        """
        src_ip = packet.get('src_ip')
        dst_port = packet.get('dst_port')
        is_malicious = packet.get('is_malicious', False)

        # 1. Check if source is already blocked
        if src_ip in self.blocked_ips:
            return "BLOCKED"

        # 2. Smart Port Management: Allow legitimate traffic to open ports
        if dst_port in self.open_ports and not is_malicious:
            return "ALLOWED"

        # 3. Attack Reflection: Deflect malicious traffic
        if is_malicious and self.reflection_active:
            self._reflect_attack(packet)
            self.blocked_ips.add(src_ip)
            return "REFLECTED"

        # 4. Default: Drop unauthorized traffic to closed ports
        return "DROPPED"

    def _reflect_attack(self, packet: Dict[str, Any]):
        """
        Internal logic for reflecting an attack back to the source.
        In a real-world scenario, this would involve packet injection (e.g., Scapy).
        """
        src_ip = packet.get('src_ip')
        print(f"[Reflection] Reflecting attack back to source: {src_ip}")
        self.reflection_stats["reflected_packets"] += 1
        self.reflection_stats["blocked_threats"] += 1

    def update_open_ports(self, new_ports: List[int]):
        """Updates the list of open ports for legitimate traffic."""
        self.open_ports = set(new_ports)
        print(f"[Reflection] Updated open ports: {list(self.open_ports)}")

    def get_stats(self) -> Dict[str, Any]:
        """Returns the current reflection and port management statistics."""
        return {
            "reflection_active": self.reflection_active,
            "open_ports": list(self.open_ports),
            "blocked_ips_count": len(self.blocked_ips),
            "stats": self.reflection_stats
        }

if __name__ == "__main__":
    # Example usage of the Reflection Manager
    manager = ReflectionManager(open_ports=[80, 443])
    manager.activate_reflection()
    
    # Simulate incoming traffic
    traffic_samples = [
        {'src_ip': '192.168.1.5', 'dst_port': 80, 'is_malicious': False},
        {'src_ip': '10.0.0.15', 'dst_port': 22, 'is_malicious': True},
        {'src_ip': '192.168.1.10', 'dst_port': 443, 'is_malicious': False},
        {'src_ip': '10.0.0.15', 'dst_port': 80, 'is_malicious': False}, # Already blocked
    ]
    
    for t in traffic_samples:
        action = manager.process_traffic(t)
        print(f"Traffic from {t['src_ip']} to port {t['dst_port']} - Action: {action}")
    
    print(f"\nSystem Stats:\n{json.dumps(manager.get_stats(), indent=2)}")
    manager.deactivate_reflection()
