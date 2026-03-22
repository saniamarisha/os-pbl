"""
simulation.py — Scenario Runner for Deadlock Prevention Demonstration.

Provides pre-built simulation scenarios that demonstrate:
  1. Safe execution with Banker's Algorithm
  2. Unsafe request denial
  3. Insufficient resources (process must wait)
  4. Circular wait / deadlock detection via RAG

Each scenario walks through the system step-by-step with matrix
snapshots and colored terminal output.
"""

from __future__ import annotations
from simulator.models import SystemState
from simulator.resource_manager import ResourceManager
from simulator.rag import ResourceAllocationGraph
from simulator import visualization as viz


def run_scenario_1_safe_execution() -> None:
    """Scenario 1: Normal Safe Execution.

    5 processes, 3 resource types. All requests are safe.
    Demonstrates Banker's Algorithm finding a safe sequence.

    Initial Configuration (classic textbook example):
        Processes: P0, P1, P2, P3, P4
        Resources: A(10), B(5), C(7)

        Allocation    Max         Available
        P0: 0 1 0    7 5 3       3 3 2
        P1: 2 0 0    3 2 2
        P2: 3 0 2    9 0 2
        P3: 2 1 1    2 2 2
        P4: 0 0 2    4 3 3
    """
    viz.print_scenario_banner(1, "Safe Execution — Banker's Algorithm")
    viz.print_event("Setting up system with 5 processes and 3 resource types (A, B, C)", "info")
    viz.print_event("Total resources: A=10, B=5, C=7", "info")
    print()

    state = SystemState(
        num_processes=5,
        num_resources=3,
        available=[3, 3, 2],
        max_claim=[
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3],
        ],
        allocation=[
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2],
        ],
        resource_names=["A", "B", "C"],
    )

    manager = ResourceManager(state)

    # Display initial state
    viz.print_subheader("Initial System State")
    viz.print_matrices(manager.get_state())

    # Check initial safety
    viz.print_subheader("Initial Safety Check")
    safe, seq = manager.check_safety()
    if safe:
        viz.print_safe_sequence(seq, manager.get_state().process_names)
    else:
        viz.print_unsafe_state()

    # P1 requests [1, 0, 2]
    viz.print_subheader("P1 Requests Resources [1, 0, 2]")
    granted, msg = manager.request(1, [1, 0, 2])
    viz.print_event(msg, "success" if granted else "error")

    if granted:
        viz.print_matrices(manager.get_state())
        safe, seq = manager.check_safety()
        if safe:
            viz.print_safe_sequence(seq, manager.get_state().process_names)

    # P3 completes and releases all resources
    viz.print_subheader("P3 Completes — Releasing All Resources")
    release_msg = manager.release(3, [2, 1, 1])
    viz.print_event(release_msg, "success")
    viz.print_matrices(manager.get_state())

    viz.print_event("Scenario 1 complete — all operations successful!", "success")


def run_scenario_2_unsafe_denial() -> None:
    """Scenario 2: Unsafe Request Denied.

    Same initial setup. A process makes a request that would put the
    system in an unsafe state — Banker's Algorithm denies it.
    """
    viz.print_scenario_banner(2, "Unsafe Request — Denial by Banker's Algorithm")
    viz.print_event("Same system configuration as Scenario 1", "info")
    print()

    state = SystemState(
        num_processes=5,
        num_resources=3,
        available=[3, 3, 2],
        max_claim=[
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3],
        ],
        allocation=[
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2],
        ],
        resource_names=["A", "B", "C"],
    )

    manager = ResourceManager(state)
    viz.print_matrices(manager.get_state())

    # P0 makes an aggressive request that leads to unsafe state
    viz.print_subheader("P0 Requests Resources [3, 3, 0] — Aggressive Request!")
    viz.print_event("This request would consume most available resources...", "warning")
    granted, msg = manager.request(0, [3, 3, 0])
    viz.print_event(msg, "success" if granted else "error")

    if not granted:
        viz.print_unsafe_state()
        viz.print_event(
            "Banker's Algorithm correctly prevented a potential deadlock!",
            "success",
        )

    # Show state is unchanged
    viz.print_subheader("System State (Unchanged — Request Was Denied)")
    viz.print_matrices(manager.get_state())


def run_scenario_3_insufficient_resources() -> None:
    """Scenario 3: Insufficient Resources — Process Must Wait.

    A process requests more resources than currently available.
    The request is valid (within max claim) but cannot be fulfilled now.
    """
    viz.print_scenario_banner(3, "Insufficient Resources — Process Must Wait")

    state = SystemState(
        num_processes=3,
        num_resources=2,
        available=[1, 0],
        max_claim=[
            [4, 2],
            [3, 3],
            [2, 1],
        ],
        allocation=[
            [2, 1],
            [1, 2],
            [1, 0],
        ],
        resource_names=["A", "B"],
    )

    manager = ResourceManager(state)
    viz.print_event("System with very limited available resources", "info")
    viz.print_matrices(manager.get_state())

    # P2 requests [1, 1] — needs 1 of B but 0 available
    viz.print_subheader("P2 Requests [1, 1] — But Resource B Has 0 Available")
    granted, msg = manager.request(2, [1, 1])
    viz.print_event(msg, "success" if granted else "warning")

    if not granted:
        viz.print_event(
            "Process P2 must wait until resources become available.",
            "warning",
        )


def run_scenario_4_deadlock_detection() -> None:
    """Scenario 4: Circular Wait — RAG Deadlock Detection.

    Manually constructs a resource allocation graph with a circular wait
    to demonstrate cycle-based deadlock detection.

    Setup:
        P1 holds R1, waits for R2
        P2 holds R2, waits for R1
        This creates a cycle: P1 → R2 → P2 → R1 → P1
    """
    viz.print_scenario_banner(4, "Circular Wait — RAG Deadlock Detection")
    viz.print_event("Constructing a Resource Allocation Graph with circular wait", "info")
    print()

    rag = ResourceAllocationGraph()

    # Add nodes
    rag.add_process("P1")
    rag.add_process("P2")
    rag.add_resource("R1")
    rag.add_resource("R2")

    # P1 holds R1
    rag.add_assignment("R1", "P1")
    viz.print_event("R1 assigned to P1 (P1 holds R1)", "action")

    # P2 holds R2
    rag.add_assignment("R2", "P2")
    viz.print_event("R2 assigned to P2 (P2 holds R2)", "action")

    # P1 requests R2 (waiting)
    rag.add_request("P1", "R2")
    viz.print_event("P1 requests R2 (P1 is waiting for R2)", "warning")

    # P2 requests R1 (waiting) — creates the cycle!
    rag.add_request("P2", "R1")
    viz.print_event("P2 requests R1 (P2 is waiting for R1) — CIRCULAR WAIT!", "error")

    # Display RAG
    print()
    print(rag.get_ascii_representation())
    print()

    # Detect cycle
    viz.print_subheader("Running Deadlock Detection (DFS Cycle Check)")
    has_cycle, cycle = rag.detect_cycle()

    if has_cycle:
        viz.print_deadlock_detected(cycle)
        viz.print_event(
            "All four Coffman conditions are met — this is a TRUE deadlock!",
            "error",
        )
        print()
        viz.print_event("Conditions present:", "info")
        viz.print_event("  1. Mutual Exclusion: R1, R2 are non-shareable", "info")
        viz.print_event("  2. Hold and Wait: P1 holds R1, waits for R2", "info")
        viz.print_event("  3. No Preemption: Resources can't be forcibly taken", "info")
        viz.print_event("  4. Circular Wait: P1→R2→P2→R1→P1", "info")
    else:
        viz.print_event("No cycle detected — system is deadlock-free.", "success")


def run_all_scenarios() -> None:
    """Run all four demonstration scenarios in sequence."""
    viz.print_header("DEADLOCK PREVENTION SIMULATOR", 60)
    viz.print_event("Preventing Application Freezes Caused by Resource Deadlocks", "info")
    viz.print_event("Demonstrating Banker's Algorithm & RAG Cycle Detection", "info")
    print()

    run_scenario_1_safe_execution()
    run_scenario_2_unsafe_denial()
    run_scenario_3_insufficient_resources()
    run_scenario_4_deadlock_detection()

    viz.print_header("SIMULATION COMPLETE", 60)
    viz.print_event("All 4 scenarios executed successfully!", "success")
    viz.print_event("The system correctly:", "info")
    viz.print_event("  ✅ Found safe sequences (Scenario 1)", "success")
    viz.print_event("  🚫 Denied unsafe requests (Scenario 2)", "success")
    viz.print_event("  ⏳ Identified resource shortages (Scenario 3)", "success")
    viz.print_event("  💀 Detected circular waits (Scenario 4)", "success")
    print()
