# Product Requirements Document (PRD)
# Preventing Application Freezes Caused by Resource Deadlocks

## 1. Overview

### 1.1 Project Title
**Preventing Application Freezes Caused by Resource Deadlocks**

### 1.2 Purpose
Build an academic + practical simulation system that demonstrates how operating systems prevent application freezes caused by resource deadlocks. The system uses **Banker's Algorithm** for deadlock avoidance and **Resource Allocation Graphs (RAG)** for visualization and cycle-based deadlock detection.

### 1.3 Target Audience
- OS coursework / academic submission & viva preparation
- Students learning deadlock handling concepts
- Demonstratio-level simulation (not production-grade, but realistic)

---

## 2. Problem Understanding

### 2.1 What is a Deadlock?
A **deadlock** occurs when two or more processes are each waiting for a resource held by another, creating a circular dependency. No process can proceed — the application "freezes."

### 2.2 Real-World Examples

| Scenario | Description |
|---|---|
| **Database Locks** | Transaction A locks Row 1 and waits for Row 2; Transaction B locks Row 2 and waits for Row 1. Both freeze. |
| **Printer + Scanner** | Process A holds the printer, needs the scanner. Process B holds the scanner, needs the printer. Neither can proceed. |
| **OS Threads** | Thread 1 locks Mutex A, waits for Mutex B. Thread 2 locks Mutex B, waits for Mutex A. Classic circular wait. |

### 2.3 The Four Necessary Conditions (Coffman Conditions)

| # | Condition | Description |
|---|---|---|
| 1 | **Mutual Exclusion** | At least one resource must be held in a non-shareable mode |
| 2 | **Hold and Wait** | A process holds at least one resource while waiting for others |
| 3 | **No Preemption** | Resources cannot be forcibly taken from a process |
| 4 | **Circular Wait** | A circular chain of processes exists, each waiting for a resource held by the next |

---

## 3. Core Concepts

### 3.1 Banker's Algorithm

The Banker's Algorithm is a **deadlock avoidance** strategy. Before granting a resource request, it simulates the allocation and checks if the system remains in a **safe state** — meaning there exists at least one sequence in which all processes can finish.

**Key Data Structures:**
- **Available[m]** — vector of available instances for each of m resource types
- **Max[n][m]** — maximum demand of each process
- **Allocation[n][m]** — resources currently allocated to each process
- **Need[n][m]** — remaining resources needed (`Need = Max - Allocation`)

**Safety Algorithm (Step-by-Step):**
1. Let `Work = Available`, `Finish[i] = false` for all i
2. Find process i where `Finish[i] == false` AND `Need[i] <= Work`
3. If found: `Work = Work + Allocation[i]`, `Finish[i] = true`, go to step 2
4. If all `Finish[i] == true` → **SAFE state** (the order found is the safe sequence)
5. Otherwise → **UNSAFE state** (request denied)

**Resource Request Algorithm:**
1. If `Request[i] > Need[i]` → Error (process exceeded claim)
2. If `Request[i] > Available` → Process must wait
3. Pretend to allocate: update Available, Allocation, Need
4. Run Safety Algorithm on the pretend state
5. If safe → grant request; if unsafe → rollback and deny

### 3.2 Resource Allocation Graph (RAG)

A directed graph where:
- **Process nodes** (circles) represent processes
- **Resource nodes** (rectangles) represent resource types
- **Request edge** (P → R): Process P is waiting for Resource R
- **Assignment edge** (R → P): Resource R is assigned to Process P

**Deadlock Detection via RAG:** If the RAG contains a **cycle**, a deadlock *may* exist (guaranteed for single-instance resources).

### 3.3 Safe vs Unsafe States

| State | Meaning |
|---|---|
| **Safe** | ∃ at least one sequence where all processes can complete |
| **Unsafe** | No such sequence exists — potential deadlock |
| **Deadlocked** | Processes are actually waiting in a cycle (subset of unsafe) |

> **Important:** Unsafe ≠ Deadlocked. Unsafe *may* lead to deadlock; it is a superset.

---

## 4. Functional Requirements

### FR-1: Python CLI Simulation
- Simulate N processes competing for M resource types
- Run Banker's Algorithm for each resource request
- Print colored matrix tables (Allocation, Max, Need, Available)
- Show safe sequences or deny unsafe requests
- Detect cycles in Resource Allocation Graph

### FR-2: Interactive Web Dashboard
- Modern, glassmorphism-styled React dashboard
- Panels: Processes, Resources, System State, Event Log
- Interactive RAG visualization (force-directed graph)
- Step-by-step simulation controls (Play/Pause/Step/Reset)
- Real-time matrix display and safe sequence indicator

### FR-3: Multiple Simulation Scenarios
- **Scenario 1:** All requests are safe → processes complete normally
- **Scenario 2:** A request leads to unsafe state → denied by Banker's
- **Scenario 3:** Request exceeds available resources → process waits
- **Scenario 4:** Circular wait detected in RAG

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Language** | Python 3.10+ (CLI), TypeScript/React (Dashboard) |
| **Dependencies** | Minimal — `colorama` for terminal colors; Vite + React for frontend |
| **Performance** | Handles up to 10 processes × 5 resource types smoothly |
| **Portability** | Cross-platform (Windows, macOS, Linux) |
| **Usability** | Clear terminal output; intuitive dashboard UI |

---

## 6. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    os_pbl Project                        │
├───────────────────────┬──────────────────────────────────┤
│   Python Backend      │     React Frontend (Dashboard)   │
│                       │                                  │
│  ┌─────────────────┐  │  ┌────────────────────────────┐  │
│  │   main.py       │  │  │  App.tsx                   │  │
│  │   (CLI entry)   │  │  │  ├── ProcessPanel          │  │
│  └────────┬────────┘  │  │  ├── ResourcePanel         │  │
│           │           │  │  ├── MatrixDisplay         │  │
│  ┌────────▼────────┐  │  │  ├── RAGVisualization      │  │
│  │  simulation.py  │  │  │  ├── SystemState           │  │
│  │  (scenario      │  │  │  ├── SimulationControls    │  │
│  │   runner)       │  │  │  └── EventLog              │  │
│  └────────┬────────┘  │  └────────────────────────────┘  │
│           │           │                                  │
│  ┌────────▼────────┐  │                                  │
│  │resource_manager │  │                                  │
│  │  .py            │  │                                  │
│  └──┬──────────┬───┘  │                                  │
│     │          │      │                                  │
│  ┌──▼───┐ ┌───▼────┐  │                                  │
│  │banker│ │  rag   │  │                                  │
│  │s.py  │ │ .py    │  │                                  │
│  └──────┘ └────────┘  │                                  │
│                       │                                  │
│  ┌─────────────────┐  │                                  │
│  │ visualization   │  │                                  │
│  │ .py (terminal)  │  │                                  │
│  └─────────────────┘  │                                  │
└───────────────────────┴──────────────────────────────────┘
```

---

## 7. Deadlock Prevention Strategy

### Comparison of Approaches

| Strategy | How it Works | Pros | Cons |
|---|---|---|---|
| **Prevention** | Negate one of 4 conditions | Simple | Restrictive, low utilization |
| **Avoidance** (Banker's) | Check safety before granting | Allows more concurrency | Requires advance max claims |
| **Detection + Recovery** | Detect cycles, kill/rollback | Maximum concurrency | Overhead of detection + recovery cost |

**Our Approach:** Primarily **Avoidance** (Banker's Algorithm), supplemented by **Detection** (RAG cycle analysis) for visualization.

---

## 8. Edge Cases & Limitations

| Edge Case | Handling |
|---|---|
| Request exceeds max claim | Rejected with error message |
| Request exceeds available | Process enters wait state |
| All processes in unsafe state | System reports deadlock risk |
| Single-instance resources | RAG cycle = definite deadlock |
| Multi-instance resources | RAG cycle = possible deadlock (need Banker's to confirm) |
| Large N × M matrices | Banker's is O(n² × m) — impractical for very large systems |

---

## 9. Extensions / Innovations

1. **GUI Visualization** — Interactive RAG with D3.js force graph
2. **Real-time Dashboard** — Live matrix updates and event log
3. **Thread Simulation** — Map processes to actual Python threads
4. **Animated Step-Through** — Watch the safety algorithm execute step by step
5. **Custom Scenarios** — User builds their own process/resource configuration
6. **Export Reports** — Generate PDF/HTML simulation report

---

## 10. Success Criteria

- [ ] Python simulation runs 4 distinct scenarios with correct output
- [ ] Banker's Algorithm correctly identifies safe/unsafe states
- [ ] RAG correctly detects circular waits
- [ ] Web dashboard renders and is interactive
- [ ] Project is well-documented and suitable for academic submission
