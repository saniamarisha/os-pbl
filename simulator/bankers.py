"""
bankers.py — Banker's Algorithm for Deadlock Avoidance.

Implements:
  1. Safety Algorithm — determines if the current state is safe
  2. Resource Request Algorithm — checks if granting a request keeps the system safe

The Banker's Algorithm works by simulating resource allocation and checking
whether all processes can still complete. If yes, the state is "safe" and
the request is granted. If not, the request is denied to prevent deadlock.
"""

from __future__ import annotations
from simulator.models import SystemState


def is_safe_state(state: SystemState) -> tuple[bool, list[int]]:
    """Run the Banker's Safety Algorithm on the given system state.

    Algorithm:
        1. Let Work = Available (copy), Finish[i] = False for all i
        2. Find a process i such that Finish[i] == False AND Need[i] <= Work
        3. If found: Work = Work + Allocation[i], Finish[i] = True → go to step 2
        4. If all Finish[i] == True → SAFE (return the safe sequence)
        5. Otherwise → UNSAFE

    Args:
        state: Current system state containing Available, Allocation, Max matrices.

    Returns:
        Tuple of (is_safe, safe_sequence).
        - is_safe: True if a safe sequence exists.
        - safe_sequence: List of process indices in safe execution order.
                         Empty if unsafe.
    """
    n = state.num_processes
    m = state.num_resources
    need = state.need

    # Step 1: Initialize Work and Finish
    work = state.available[:]  # copy
    finish = [False] * n
    safe_sequence: list[int] = []

    # Step 2-3: Iteratively find completable processes
    while True:
        found = False
        for i in range(n):
            if not finish[i]:
                # Check if Need[i] <= Work (for all resource types)
                if all(need[i][j] <= work[j] for j in range(m)):
                    # This process can finish — release its resources
                    for j in range(m):
                        work[j] += state.allocation[i][j]
                    finish[i] = True
                    safe_sequence.append(i)
                    found = True
                    break  # restart the search from the beginning

        if not found:
            break

    # Step 4-5: Check if all processes finished
    is_safe = all(finish)
    if not is_safe:
        safe_sequence = []

    return is_safe, safe_sequence


def request_resources(
    process_id: int,
    request: list[int],
    state: SystemState,
) -> tuple[bool, SystemState | None, str]:
    """Evaluate a resource request using the Banker's Resource Request Algorithm.

    Algorithm:
        1. If Request > Need → ERROR (process exceeded its max claim)
        2. If Request > Available → process must WAIT
        3. Pretend to allocate:
           - Available -= Request
           - Allocation[i] += Request
           - Need[i] -= Request  (via Max - Allocation recalculation)
        4. Run Safety Algorithm on the pretend state
        5. If safe → grant (return new state)
           If unsafe → rollback (return None)

    Args:
        process_id: Index of the requesting process.
        request: Vector of requested resource instances.
        state: Current system state.

    Returns:
        Tuple of (granted, new_state, message).
        - granted: True if request was granted.
        - new_state: Updated SystemState if granted, None otherwise.
        - message: Human-readable explanation of the decision.
    """
    n = state.num_processes
    m = state.num_resources
    need = state.need
    p_name = state.process_names[process_id]

    # Step 1: Check if request exceeds maximum claim
    for j in range(m):
        if request[j] > need[process_id][j]:
            return (
                False,
                None,
                f"❌ ERROR: {p_name} requested {request} which exceeds its "
                f"remaining need {need[process_id]}. Process exceeded its max claim!",
            )

    # Step 2: Check if request exceeds available resources
    for j in range(m):
        if request[j] > state.available[j]:
            return (
                False,
                None,
                f"⏳ WAIT: {p_name} requested {request} but only {state.available} "
                f"is available. Process must wait.",
            )

    # Step 3: Pretend to allocate (work on a copy)
    new_state = state.deep_copy()
    for j in range(m):
        new_state.available[j] -= request[j]
        new_state.allocation[process_id][j] += request[j]
        # Need is recomputed dynamically via property, so we update max_claim indirectly
        # Actually, Need = Max - Allocation, so updating Allocation is enough

    # Step 4: Run safety algorithm on pretend state
    safe, sequence = is_safe_state(new_state)

    # Step 5: Grant or rollback
    if safe:
        seq_names = [new_state.process_names[i] for i in sequence]
        return (
            True,
            new_state,
            f"✅ GRANTED: {p_name}'s request {request} is safe. "
            f"Safe sequence: < {', '.join(seq_names)} >",
        )
    else:
        return (
            False,
            None,
            f"🚫 DENIED: {p_name}'s request {request} would lead to an "
            f"UNSAFE state. Request denied to prevent potential deadlock!",
        )
