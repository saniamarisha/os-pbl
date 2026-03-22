"""
models.py — Data classes for system state representation.

Holds the core matrices used by the Banker's Algorithm:
  - Available: resources currently free
  - Max: maximum claim of each process
  - Allocation: resources currently held by each process
  - Need: remaining resources each process may request (Max - Allocation)
"""

from __future__ import annotations
import copy
from dataclasses import dataclass, field


@dataclass
class SystemState:
    """Represents the complete state of the resource allocation system.

    Attributes:
        num_processes: Number of processes in the system.
        num_resources: Number of distinct resource types.
        available: Vector of available instances per resource type.
        max_claim: Matrix[n][m] — max demand of each process.
        allocation: Matrix[n][m] — currently allocated to each process.
        process_names: Optional human-readable names for processes.
        resource_names: Optional human-readable names for resources.
    """

    num_processes: int
    num_resources: int
    available: list[int]
    max_claim: list[list[int]]
    allocation: list[list[int]]
    process_names: list[str] = field(default_factory=list)
    resource_names: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        """Generate default names if not provided and validate dimensions."""
        if not self.process_names:
            self.process_names = [f"P{i}" for i in range(self.num_processes)]
        if not self.resource_names:
            self.resource_names = [f"R{j}" for j in range(self.num_resources)]
        self._validate()

    def _validate(self) -> None:
        """Validate matrix dimensions are consistent."""
        assert len(self.available) == self.num_resources, \
            f"Available vector length {len(self.available)} != num_resources {self.num_resources}"
        assert len(self.max_claim) == self.num_processes, \
            f"Max matrix has {len(self.max_claim)} rows, expected {self.num_processes}"
        assert len(self.allocation) == self.num_processes, \
            f"Allocation matrix has {len(self.allocation)} rows, expected {self.num_processes}"
        for i in range(self.num_processes):
            assert len(self.max_claim[i]) == self.num_resources, \
                f"Max row {i} has {len(self.max_claim[i])} cols, expected {self.num_resources}"
            assert len(self.allocation[i]) == self.num_resources, \
                f"Allocation row {i} has {len(self.allocation[i])} cols, expected {self.num_resources}"

    @property
    def need(self) -> list[list[int]]:
        """Compute the Need matrix: Need[i][j] = Max[i][j] - Allocation[i][j]."""
        return [
            [self.max_claim[i][j] - self.allocation[i][j]
             for j in range(self.num_resources)]
            for i in range(self.num_processes)
        ]

    def deep_copy(self) -> SystemState:
        """Return a deep copy of this state for simulation."""
        return SystemState(
            num_processes=self.num_processes,
            num_resources=self.num_resources,
            available=copy.deepcopy(self.available),
            max_claim=copy.deepcopy(self.max_claim),
            allocation=copy.deepcopy(self.allocation),
            process_names=copy.deepcopy(self.process_names),
            resource_names=copy.deepcopy(self.resource_names),
        )

    def to_dict(self) -> dict:
        """Serialize state to dictionary."""
        return {
            "num_processes": self.num_processes,
            "num_resources": self.num_resources,
            "available": self.available,
            "max_claim": self.max_claim,
            "allocation": self.allocation,
            "need": self.need,
            "process_names": self.process_names,
            "resource_names": self.resource_names,
        }
