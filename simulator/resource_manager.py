"""
resource_manager.py — Central Resource Manager.

Orchestrates the system state, Banker's Algorithm checks, and RAG updates.
Provides a high-level API for processes to request and release resources.
"""

from __future__ import annotations
from simulator.models import SystemState
from simulator.bankers import is_safe_state, request_resources
from simulator.rag import ResourceAllocationGraph


class ResourceManager:
    """Manages resource allocation across all processes.

    Holds the current system state (matrices) and a Resource Allocation
    Graph instance. Validates requests through Banker's Algorithm before
    granting them.
    """

    def __init__(self, state: SystemState) -> None:
        """Initialize the Resource Manager with a given system state.

        Args:
            state: Initial system state with all matrices configured.
        """
        self.state = state
        self.rag = ResourceAllocationGraph()
        self.event_log: list[str] = []

        # Initialize RAG nodes
        for name in state.process_names:
            self.rag.add_process(name)
        for name in state.resource_names:
            self.rag.add_resource(name)

        # Add initial assignment edges from the allocation matrix
        for i in range(state.num_processes):
            for j in range(state.num_resources):
                if state.allocation[i][j] > 0:
                    self.rag.add_assignment(
                        state.resource_names[j],
                        state.process_names[i],
                    )

    def request(self, process_id: int, request_vector: list[int]) -> tuple[bool, str]:
        """Process a resource request from a process.

        Runs Banker's Algorithm to check safety. If safe, updates the
        state and RAG. If unsafe, denies the request.

        Args:
            process_id: Index of the requesting process.
            request_vector: Vector of requested resource instances.

        Returns:
            Tuple of (granted, message).
        """
        p_name = self.state.process_names[process_id]
        self._log(f"📥 {p_name} requests resources: {request_vector}")

        granted, new_state, message = request_resources(
            process_id, request_vector, self.state
        )

        if granted and new_state is not None:
            self.state = new_state
            # Update RAG: add assignment edges for newly allocated resources
            for j in range(self.state.num_resources):
                if request_vector[j] > 0:
                    self.rag.add_assignment(
                        self.state.resource_names[j],
                        p_name,
                    )
                    # Remove any request edge that was pending
                    self.rag.remove_request(p_name, self.state.resource_names[j])
        else:
            # Add request edges for denied/waiting requests (show waiting)
            for j in range(self.state.num_resources):
                if request_vector[j] > 0:
                    self.rag.add_request(p_name, self.state.resource_names[j])

        self._log(message)
        return granted, message

    def release(self, process_id: int, release_vector: list[int]) -> str:
        """Release resources from a process back to the system.

        Args:
            process_id: Index of the releasing process.
            release_vector: Vector of resource instances to release.

        Returns:
            Human-readable message about the release.
        """
        p_name = self.state.process_names[process_id]

        # Validate: cannot release more than allocated
        for j in range(self.state.num_resources):
            if release_vector[j] > self.state.allocation[process_id][j]:
                msg = (
                    f"❌ ERROR: {p_name} trying to release {release_vector} "
                    f"but only holds {self.state.allocation[process_id]}"
                )
                self._log(msg)
                return msg

        # Update state
        for j in range(self.state.num_resources):
            self.state.available[j] += release_vector[j]
            self.state.allocation[process_id][j] -= release_vector[j]

        # Update RAG: remove assignment edges for fully released resources
        for j in range(self.state.num_resources):
            if self.state.allocation[process_id][j] == 0:
                self.rag.remove_assignment(
                    self.state.resource_names[j],
                    p_name,
                )

        msg = f"🔓 RELEASED: {p_name} released resources {release_vector}"
        self._log(msg)
        return msg

    def check_safety(self) -> tuple[bool, list[int]]:
        """Check if the current system state is safe.

        Returns:
            Tuple of (is_safe, safe_sequence).
        """
        return is_safe_state(self.state)

    def check_deadlock(self) -> tuple[bool, list[str]]:
        """Check for deadlock using RAG cycle detection.

        Returns:
            Tuple of (has_deadlock, cycle_path).
        """
        return self.rag.detect_cycle()

    def get_state(self) -> SystemState:
        """Return the current system state."""
        return self.state

    def _log(self, message: str) -> None:
        """Add an event to the log."""
        self.event_log.append(message)
