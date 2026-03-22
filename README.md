# 🛡️ Preventing Application Freezes Caused by Resource Deadlocks

An academic + practical simulation project demonstrating how operating systems prevent application freezes caused by resource deadlocks, using **Banker's Algorithm** and **Resource Allocation Graphs (RAG)**.

---

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Core Concepts](#core-concepts)
- [Project Structure](#project-structure)
- [Setup & Run](#setup--run)
- [Simulation Scenarios](#simulation-scenarios)
- [System Design](#system-design)
- [Screenshots](#screenshots)
- [Extensions](#extensions)

---

## 🔍 Problem Statement

A **deadlock** occurs when two or more processes are each waiting for a resource held by another, creating a circular dependency — the application "freezes."

**Real-world examples:**
| Scenario | Description |
|---|---|
| Database Locks | Transaction A locks Row 1, waits for Row 2. Transaction B locks Row 2, waits for Row 1. |
| Printer + Scanner | Process A holds printer, needs scanner. Process B holds scanner, needs printer. |
| OS Thread Mutexes | Thread 1 locks Mutex A, waits for B. Thread 2 locks Mutex B, waits for A. |

**Four Necessary Conditions (Coffman Conditions):**
1. **Mutual Exclusion** — resources are non-shareable
2. **Hold and Wait** — process holds resources while waiting for others
3. **No Preemption** — resources cannot be forcibly taken
4. **Circular Wait** — circular chain of processes waiting

---

## 🧠 Core Concepts

### Banker's Algorithm (Deadlock Avoidance)
Before granting a resource request, the system simulates the allocation and checks if a **safe sequence** exists — an order in which all processes can complete.

**Key Matrices:**
- `Available[m]` — free instances per resource type
- `Max[n][m]` — maximum demand per process
- `Allocation[n][m]` — currently allocated resources
- `Need[n][m]` = `Max - Allocation` — remaining need

**Safety Algorithm:**
1. `Work = Available`, `Finish[i] = false`
2. Find process i where `Finish[i] == false` AND `Need[i] ≤ Work`
3. `Work += Allocation[i]`, `Finish[i] = true` → repeat
4. If all finish → **SAFE** ✅ | Otherwise → **UNSAFE** 🚫

### Resource Allocation Graph (Deadlock Detection)
A directed graph where cycles indicate potential deadlock:
- **Process → Resource** = request (waiting)
- **Resource → Process** = assignment (held)
- **Cycle** = circular wait = deadlock (for single-instance resources)

---

## 📁 Project Structure

```
os_pbl/
├── CLAUDE.md              ← Project conventions
├── PRD.md                 ← Product Requirements Document
├── README.md              ← This file
├── simulator/             ← Python CLI simulation
│   ├── __init__.py
│   ├── __main__.py        ← python -m simulator
│   ├── main.py            ← Entry point
│   ├── models.py          ← SystemState dataclass
│   ├── bankers.py         ← Banker's Algorithm
│   ├── rag.py             ← Resource Allocation Graph + DFS cycle detection
│   ├── resource_manager.py← Central resource orchestrator
│   ├── visualization.py   ← Colored terminal output
│   └── simulation.py      ← 4 demonstration scenarios
└── dashboard/             ← React web dashboard
    ├── package.json
    └── src/
        ├── App.tsx         ← Main dashboard component
        ├── App.css         ← Glassmorphism dark theme
        ├── hooks/
        │   └── useDeadlockSimulation.ts  ← Core logic hook
        └── types/
            └── index.ts    ← TypeScript interfaces
```

---

## 🚀 Setup & Run

### Python CLI Simulation
```bash
# No external dependencies needed (colorama optional for colors)
pip install colorama

# Run all 4 scenarios
cd os_pbl
python -m simulator.main
```

### Web Dashboard
```bash
cd os_pbl/dashboard
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🎯 Simulation Scenarios

| # | Scenario | What It Demonstrates |
|---|---|---|
| 1 | **Safe Execution** | 5 processes, 3 resources. Banker's finds safe sequence `<P1, P3, P4, P0, P2>` |
| 2 | **Unsafe Request Denied** | P0 makes aggressive request → Banker's detects unsafe state → DENIED |
| 3 | **Insufficient Resources** | P2 requests resources exceeding available → must WAIT |
| 4 | **Circular Wait (RAG)** | P1 holds R1, waits R2. P2 holds R2, waits R1. Cycle detected → DEADLOCK |

---

## 🏗️ System Design

```
┌──────────────────────────────────────────────┐
│                 main.py                       │
│              (Entry Point)                    │
├──────────────────────────────────────────────┤
│              simulation.py                    │
│          (Scenario Runner)                    │
├──────────────────────────────────────────────┤
│          resource_manager.py                  │
│     (Orchestrator: matrices + RAG)            │
├─────────────────┬────────────────────────────┤
│   bankers.py    │        rag.py              │
│  (Safety Check  │  (Graph + DFS             │
│   + Request)    │   Cycle Detection)         │
├─────────────────┴────────────────────────────┤
│              models.py                        │
│          (SystemState data)                   │
├──────────────────────────────────────────────┤
│           visualization.py                    │
│       (Colored terminal output)               │
└──────────────────────────────────────────────┘
```

---

## 🔄 Deadlock Prevention Strategy

| Strategy | How It Works | Used In This Project |
|---|---|---|
| **Prevention** | Negate one of 4 Coffman conditions | ❌ |
| **Avoidance** (Banker's) | Check safety before granting requests | ✅ Primary |
| **Detection** (RAG cycles) | DFS cycle detection on resource graph | ✅ Secondary |
| **Recovery** | Kill/rollback on deadlock detection | ❌ |

---

## 🚀 Extensions

- [x] Interactive web dashboard with glassmorphism UI
- [x] SVG-based RAG visualization
- [x] Real-time event logging
- [ ] Thread-based simulation (map processes to real threads)
- [ ] PDF report generation
- [ ] Multi-scenario comparison view

---

## 👩‍💻 Author

OS Coursework Project — Preventing Application Freezes Caused by Resource Deadlocks
