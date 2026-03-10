# AI-Powered Autonomous Wireless Defense Shield (Safety Shield)

The **Safety Shield** is an advanced, AI-driven wireless defense system designed to protect local environments from malicious wireless activities. Orchestrated by the **NayDoeV1** engine, it integrates multiple specialized AI models to provide predictive threat detection, autonomous attack reflection, and spatial buffer zone management.

## Core Features

*   **PECS (Predictive Error Control System)**: Anticipates and mitigates wireless threats before they impact the system using advanced signal analysis.
*   **Multi-AI Orchestration (NayDoeV1)**: Coordinates specialized models including Codex, Llama, Flash, and Gemini for intelligent decision-making.
*   **Autonomous Attack Reflection**: Identifies and deflects malicious wireless packets back to the source or neutralizes them at the perimeter.
*   **Spatial Buffer Zone**: Maintains a 1.5m x 1.5m expandable safety radius using signal triangulation (RSSI/ToF).
*   **Smart Port Management**: Keeps essential ports (e.g., 80, 443, 22) open for legitimate traffic while shielding all other entry points.

## System Components

| Component | File | Description |
| :--- | :--- | :--- |
| **Main System** | `safety_shield_system.py` | The central integration point for all defense layers. |
| **PECS Engine** | `pecs_engine.py` | Predictive threat detection and packet analysis core. |
| **Orchestrator** | `naydoe_orchestrator.py` | NayDoeV1 multi-AI coordination layer. |
| **Reflection** | `reflection_manager.py` | Attack deflection and port management logic. |
| **Buffer Zone** | `buffer_zone_system.py` | Spatial tracking and expandable radius management. |

## Usage Instructions

1.  **Environment**: Designed for local deployment, ideally within a **NetHunter** or similar wireless monitoring environment.
2.  **Execution**: Run the main system script to activate the shield:
    ```bash
    python3 safety_shield_system.py
    ```
3.  **Configuration**: Open ports and initial buffer radius can be configured in the `SafetyShieldSystem` constructor within `safety_shield_system.py`.

## Deployment Notes

This system is built for real-world application logic and metrics. For full deployment, ensure your wireless interface supports monitor mode and packet injection. The AI models are designed to interface with standard APIs for real-time protocol analysis and threat classification.
