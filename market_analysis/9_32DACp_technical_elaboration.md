# Technical Elaboration on the 9/32DACp Initiative and the Necessity of NVIDIA-AMD Collaboration

**Author:** Manus AI
**Date:** December 28, 2025

The **9/32DACp** initiative is a hypothetical, but technically grounded, proposal for an open, cross-vendor reference stack designed to accelerate data-centric compute. The initiative's specific technical goals are so deeply intertwined with the proprietary, low-level architectures of NVIDIA and AMD that they cannot be achieved without direct, high-level collaboration between the two companies.

The core problem 9/32DACp seeks to solve is the **cross-vendor variance** and **ecosystem fragmentation** that plagues modern GPU development, particularly in the high-growth areas of real-time graphics and AI inference [1].

## The Technical Pillars of 9/32DACp

The initiative proposes a vendor-neutral, modular reference stack built on three critical low-level components: the Execution Graph IR, the Memory Orchestration Layer, and Determinism & Pacing Hooks [1].

### 1. Execution Graph IR (Intermediate Representation)

The goal of the Execution Graph IR is to create a single, unified language for describing complex GPU workloads that can be efficiently translated to both NVIDIA and AMD hardware.

| Component Goal | Technical Challenge Requiring Collaboration |
| :--- | :--- |
| **Unified Graph IR** | **Bridging CUDA and HIP Backends:** NVIDIA's CUDA and AMD's HIP (Heterogeneous-Compute Interface for Portability) are fundamentally different compute models. While HIP is designed to be source-compatible with CUDA, the underlying hardware execution models—NVIDIA's **Warp** (32 threads) and AMD's **Wavefront** (64 threads)—differ in size and scheduling [2]. A truly efficient, unified IR must be able to generate optimal **scheduler hints** (e.g., wave/warp occupancy targets) that are sensitive to the specific microarchitecture of the target GPU, a task that requires proprietary knowledge from both vendors. |
| **Cross-API Mapping** | **Standardizing Low-Level Primitives:** The IR must map high-level APIs like DX12 and Vulkan to the vendors' proprietary compute primitives. This requires both companies to agree on a common set of **static and dynamic node types** for rasterization, ray tracing (RT), and machine learning (ML) kernels, ensuring that a single graph definition yields deterministic results on both architectures. |

### 2. Memory Orchestration Layer

This layer is arguably the most critical and difficult component, as it deals with the physical and virtual memory management on the GPU, which is highly proprietary. The goal is to achieve a **15% improvement in performance-per-watt for AI inference** through shared memory residency policies [1].

| Component Goal | Technical Challenge Requiring Collaboration |
| :--- | :--- |
| **Shared Residency Policy** | **Unifying Memory Tiers:** The proposal calls for a **Residency State Machine (HOT/WARM/COLD)** with hints from the runtime. This is a memory tiering concept typically used in data storage, but applied here to GPU memory. Implementing this efficiently requires both NVIDIA and AMD to expose low-level **driver hooks** that allow the 9/32DACp runtime to influence their respective memory managers. This includes deciding which data should reside in fast VRAM (HOT), which can be moved to system RAM (WARM), and which can be paged out (COLD). |
| **BAR-aware Paging and Peer-to-Peer** | **Exposing Proprietary Interconnects:** The layer must implement **BAR-aware paging** (Base Address Register) and **peer-to-peer** (P2P) communication over high-speed interconnects like NVIDIA's **NVLink** and AMD's **xGMI** [3]. P2P access allows one GPU to directly read/write another GPU's memory, bypassing the CPU. For this to work in a cross-vendor environment, both companies must agree on a standardized, IP-safe interface for their P2P memory access and address translation mechanisms, which are currently proprietary and vendor-specific. |

### 3. Determinism & Pacing Hooks

This component aims to solve the problem of inconsistent frame delivery, or "jank," by improving **frame pacing stability (1% low FPS) by 20%** [1].

| Component Goal | Technical Challenge Requiring Collaboration |
| :--- | :--- |
| **Deterministic Timing Hooks** | **Synchronizing Asynchronous Compute:** Modern GPUs use **Asynchronous Compute** to overlap graphics and compute tasks, but this can lead to **microbursts**—short, intense spikes in processing load that cause frame-time variance [4]. The 9/32DACp initiative proposes **Explicit fences and timestamp domains** for cross-queue alignment and **microburst protection**. This requires both vendors to expose precise, low-overhead **event streams** and **pluggable counters** mapped to their respective **Performance Monitoring Units (PMUs)**. Without this shared, low-level telemetry, the runtime cannot accurately predict and mitigate frame-critical intervals. |
| **OEM Firmware Guidelines** | **Standardizing Thermal and Power Profiles:** The goal of providing **thermally predictable profiles** and **predictable firmware behavior** for OEMs requires a joint agreement on how the GPU driver interacts with the system BIOS and firmware. This is necessary to implement features like **power-state pre-warm** for frame-critical intervals, ensuring that the GPU is ready to deliver peak performance when needed, a task that currently falls under the purview of proprietary vendor drivers and OEM-specific firmware. |

## Conclusion: Why Collaboration is Necessary

The 9/32DACp initiative is not merely about creating a new API; it is about establishing a **shared, low-level operating contract** between the software runtime and the proprietary hardware of two fierce competitors.

The collaboration is necessitated by the fact that the most significant performance and stability gains in modern GPU computing—in areas like memory management, execution scheduling, and power efficiency—are locked behind proprietary architectural details. To achieve the ambitious goals of **35–50% reduction in cross-vendor variance** and **20% better frame pacing**, NVIDIA and AMD must agree to:

1.  **Share Proprietary Knowledge:** Expose low-level details about their execution models (Warps vs. Wavefronts) and memory management systems (BARs, NVLink/xGMI).
2.  **Unify Control:** Agree on a common set of driver hooks and telemetry counters to allow a single, open-source runtime to influence their hardware's scheduling and memory residency decisions.

Without this direct, high-level technical collaboration, any attempt to build a cross-vendor stack would be limited to high-level, least-common-denominator APIs, failing to deliver the performance and stability improvements that the 9/32DACp initiative promises.

## References

[1] User-provided document. *pasted_content.txt*.
[2] DZone. *All About GPU Threads, Warps, and Wavefronts*.
[3] Medium. *Inter-GPU Communication with PCIe, NVLink, and BARs*.
[4] Cpacket. *Did You Know? The Hidden Impact of Microbursts*.
