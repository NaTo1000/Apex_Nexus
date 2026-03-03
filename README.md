# Apex Nexus

A custom, high-performance hardware project for remote control, monitoring, and AI-powered applications.

## Overview

Apex Nexus is a powerful and versatile hardware platform designed for a wide range of applications, from advanced remote monitoring and control to edge AI and network routing. This project integrates a Raspberry Pi 5 with a Hailo-8 AI accelerator, high-speed networking, and extensive storage, all while providing a flexible interface for hardware interaction through a Flipper Zero and a standard RS232 serial port.

This project is inspired by the ESP-IO project [1] and aims to provide a more powerful and feature-rich solution for demanding applications.

## Features

*   **High-Performance Computing:** At the core of Apex Nexus is a Raspberry Pi 5, providing a powerful and flexible platform for a wide range of applications.
*   **AI Acceleration:** The integrated Hailo-8 AI accelerator provides up to 26 TOPS of inferencing performance, enabling real-time AI and machine learning applications at the edge [2].
*   **High-Speed Networking:** Dual 2.5GbE RJ45 ports with VLAN support provide high-speed, flexible networking capabilities for routing, network-attached storage (NAS), and other network-intensive applications [3].
*   **Extensive Storage:** Dual 1TB NVMe SSDs provide ample, high-speed storage for the operating system, applications, and data [4].
*   **Versatile I/O:** The project includes a Flipper Zero for a wide range of hardware interaction and a standard RS232 serial port for communication with legacy devices [5], [6].
*   **Web Interface:** A web interface for configuration, control, and monitoring of the system.

## Hardware Components

| Component                 | Description                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mainboard**             | Raspberry Pi 5                                                                                                                             |
| **AI Accelerator**        | Hailo-8 M.2 AI Acceleration Module (via Raspberry Pi AI Kit) [2]                                                                           |
| **Storage**               | 2x 1TB NVMe SSDs (M.2 2280) [4]                                                                                                            |
| **Networking**            | Dual 2.5GbE RJ45 ports (via a PCIe switch HAT) [3]                                                                                         |
| **Hardware Interface**    | Flipper Zero (connected via GPIO for UART communication) [5]                                                                               |
| **Serial Port**           | 1x RS232 (DB9) port (via a GPIO to RS232 adapter) [6]                                                                                      |
| **Power Supply**          | Official Raspberry Pi 27W USB-C Power Adapter (5.1V, 5A) [7]                                                                               |

## System Architecture

The system is built around the Raspberry Pi 5, which serves as the central processing unit. The Hailo-8 AI accelerator, NVMe SSDs, and dual 2.5GbE networking are all connected to the Raspberry Pi 5 via a PCIe switch HAT. The Flipper Zero and RS232 port are connected to the Raspberry Pi 5's GPIO pins.

### PCIe Configuration

A crucial aspect of this design is the utilization of a **PCIe switch HAT** to expand the Raspberry Pi 5's single PCIe 2.0 lane. This switch will enable the simultaneous connection and operation of the Hailo-8 AI accelerator, two 1TB NVMe SSDs, and the dual 2.5GbE network interface. While the Raspberry Pi 5 natively supports PCIe Gen 2, some PCIe HATs can automatically switch to PCIe Gen 3 mode, which is beneficial for maximizing the performance of the Hailo-8L module and NVMe drives [8]. Careful selection of a compatible PCIe switch HAT is essential to ensure stable and high-bandwidth operation across all connected peripherals.

### Flipper Zero Integration

The Flipper Zero will be integrated with the Raspberry Pi 5 primarily through a **UART serial connection** via the GPIO pins. This connection will allow for bidirectional communication, enabling the Flipper Zero to act as a versatile control and display interface. Specific GPIO pins on the Raspberry Pi 5 (e.g., GPIO 14 for TX and GPIO 15 for RX) will be configured for UART communication [9]. The Flipper Zero's GPIO application will be used to enable its USB-UART bridge functionality, facilitating easy data exchange [5]. This setup will allow for:

*   **System Status Display:** Real-time display of system metrics, network status, and AI inference results on the Flipper Zero's screen.
*   **Control Interface:** Sending commands from the Flipper Zero's buttons to the Raspberry Pi 5 to trigger specific actions or modes.
*   **Hardware Interaction:** Utilizing the Flipper Zero's various radio and I/O capabilities to interact with external devices, with the Raspberry Pi 5 acting as a central processing hub.

### RS232 Integration

A dedicated **GPIO to RS232 adapter** (e.g., based on the MAX3232 IC) will be used to provide a standard DB9 serial port. This adapter will connect to the Raspberry Pi 5's UART GPIO pins, converting the TTL-level signals to RS232-compatible voltage levels [6]. This integration ensures compatibility with a wide array of legacy industrial equipment, sensors, and other devices that rely on the RS232 protocol for communication. The specific GPIO pins used for UART on the Raspberry Pi 5 will be shared with the Flipper Zero integration, requiring careful multiplexing or dedicated UART channels if simultaneous operation is needed.

### Power Management

The entire system will be powered by the **Official Raspberry Pi 27W USB-C Power Adapter (5.1V, 5A)** [7]. Given the power demands of the Raspberry Pi 5 itself, along with the Hailo-8 AI accelerator, two NVMe SSDs, and the dual 2.5GbE network card, it is crucial to ensure that the chosen PCIe HAT and all connected peripherals are designed for efficient power consumption and that the 27W power supply is sufficient. In some configurations, an additional power input for the PCIe HAT might be necessary to provide stable power to the NVMe drives and other high-draw components.

## Software

The software for this project will be based on the ESP-IO project [1], with significant modifications to support the new hardware and features. The software will provide a web interface for configuring and controlling the system, as well as a WebSocket API for real-time communication with other devices and applications. The operating system will likely be a customized version of Raspberry Pi OS, optimized for performance and security, with necessary drivers and libraries for the Hailo-8 AI accelerator and other peripherals.

## Getting Started

This project is currently in the design and documentation phase. This README will be updated with more detailed instructions on how to build and configure the system as the project progresses.

## References

[1]: [ESP-IO - Remote control and monitoring of inputs and outputs](https://github.com/Pako2/EventGhostPlugins/raw/master/ESP-IO/Arduino/demo/index.png)
[2]: [Raspberry Pi AI HAT+ 2 Enables Generative AI on Raspberry Pi 5](https://linuxgizmos.com/raspberry-pi-ai-hat-2-enables-generative-ai-on-raspberry-pi-5/)
[3]: [Add four Gigabit or 2.5Gbps Ethernet ports to the Raspberry Pi 5 with this expansion board](https://www.cnx-software.com/2025/12/30/add-four-gigabit-or-2-5gbps-ethernet-ports-to-the-raspberry-pi-5-with-this-expansion-board/)
[4]: [X1005 PCIe to Bottom Dual M.2 HAT NVMe SSD PCIe Peripheral Board for Raspberry Pi 5](https://www.newegg.com/p/2SW-00BA-00003?srsltid=AfmBOorfbZEWDrWME1PCBugy__AwlF7v7YzsDQPkLdzglj5UNdg8RzXE)
[5]: [GPIO & Modules - Flipper Zero Documentation](https://docs.flipper.net/zero/gpio-and-modules)
[6]: [PiShop Serial HAT (RS232) for Raspberry Pi](https://www.pishop.us/product/serial-hat-rs232/?srsltid=AfmBOopoWRFQe_qkp-m53JZC_Js5WuN45Joq0s266sn1Pp9I53NuiX)
[7]: [Raspberry Pi 5 Power Adapter, PD 27W USB Type-C 5V 5A Power](https://www.aliexpress.com/i/1005006308560684.html)
[8]: [PCIe3.0 Switch to dual M.2 hat for Raspberry Pi 5, Support NVMe](https://www.seeedstudio.com/PCIe3-0-to-dual-M-2-hat-for-Raspberry-Pi-5-p-6358.html?srsltid=AfmBOorKz9NFiidL4rpn8GsIDU5MbRRE7VIm0E1yUxPJlKmqBLPTWaIc)
[9]: [How To Setup UART with GPIO On Raspberry Pi 5 - YouTube](https://www.youtube.com/watch?v=muOwRRSm2do)
