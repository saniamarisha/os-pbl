"""
rag.py — Resource Allocation Graph (RAG) with Cycle Detection.

A RAG is a directed graph used to model the state of resource allocation:
  - Process nodes (circles) and Resource nodes (rectangles)
  - Assignment edge: Resource → Process (resource is held by process)
  - Request edge: Process → Resource (process is waiting for resource)

For single-instance resources, a cycle in the RAG implies deadlock.
For multi-instance resources, a cycle is necessary but not sufficient.

This module provides cycle detection via DFS to identify potential deadlocks.
"""

from __future__ import annotations
from enum import Enum


class NodeType(Enum):
    """Type of node in the Resource Allocation Graph."""
    PROCESS = "process"
    RESOURCE = "resource"


class EdgeType(Enum):
    """Type of edge in the Resource Allocation Graph."""
    REQUEST = "request"      # Process → Resource (process wants resource)
    ASSIGNMENT = "assignment" # Resource → Process (resource held by process)


class ResourceAllocationGraph:
    """Directed graph for modeling resource allocation and detecting deadlocks.

    Nodes are either processes or resources. Edges represent either
    a request (process waiting for resource) or an assignment (resource
    held by process).
    """

    def __init__(self) -> None:
        """Initialize an empty Resource Allocation Graph."""
        self.nodes: dict[str, NodeType] = {}
        self.edges: list[tuple[str, str, EdgeType]] = []
        # Adjacency list for cycle detection
        self._adj: dict[str, list[str]] = {}

    def add_process(self, name: str) -> None:
        """Add a process node to the graph."""
        self.nodes[name] = NodeType.PROCESS
        if name not in self._adj:
            self._adj[name] = []

    def add_resource(self, name: str) -> None:
        """Add a resource node to the graph."""
        self.nodes[name] = NodeType.RESOURCE
        if name not in self._adj:
            self._adj[name] = []

    def add_assignment(self, resource: str, process: str) -> None:
        """Add an assignment edge: Resource → Process (resource held by process).

        Args:
            resource: Name of the resource node.
            process: Name of the process node.
        """
        edge = (resource, process, EdgeType.ASSIGNMENT)
        if edge not in self.edges:
            self.edges.append(edge)
            self._adj.setdefault(resource, []).append(process)

    def add_request(self, process: str, resource: str) -> None:
        """Add a request edge: Process → Resource (process waiting for resource).

        Args:
            process: Name of the process node.
            resource: Name of the resource node.
        """
        edge = (process, resource, EdgeType.REQUEST)
        if edge not in self.edges:
            self.edges.append(edge)
            self._adj.setdefault(process, []).append(resource)

    def remove_assignment(self, resource: str, process: str) -> None:
        """Remove an assignment edge when a resource is released."""
        edge = (resource, process, EdgeType.ASSIGNMENT)
        if edge in self.edges:
            self.edges.remove(edge)
            if process in self._adj.get(resource, []):
                self._adj[resource].remove(process)

    def remove_request(self, process: str, resource: str) -> None:
        """Remove a request edge when a request is fulfilled or cancelled."""
        edge = (process, resource, EdgeType.REQUEST)
        if edge in self.edges:
            self.edges.remove(edge)
            if resource in self._adj.get(process, []):
                self._adj[process].remove(resource)

    def detect_cycle(self) -> tuple[bool, list[str]]:
        """Detect if there is a cycle in the RAG using DFS.

        A cycle in the RAG indicates a potential deadlock (definite for
        single-instance resources).

        Returns:
            Tuple of (has_cycle, cycle_path).
            - has_cycle: True if a cycle was found.
            - cycle_path: List of node names forming the cycle. Empty if no cycle.
        """
        WHITE, GRAY, BLACK = 0, 1, 2
        color: dict[str, int] = {node: WHITE for node in self.nodes}
        parent: dict[str, str | None] = {node: None for node in self.nodes}

        def dfs(u: str) -> list[str] | None:
            """DFS visit. Returns cycle path if found, None otherwise."""
            color[u] = GRAY
            for v in self._adj.get(u, []):
                if v not in color:
                    continue
                if color[v] == GRAY:
                    # Found a back edge → cycle detected!
                    # Reconstruct cycle path
                    cycle = [v, u]
                    node = u
                    while node != v:
                        node = parent.get(node)  # type: ignore
                        if node is None or node == v:
                            break
                        cycle.append(node)
                    cycle.reverse()
                    return cycle
                elif color[v] == WHITE:
                    parent[v] = u
                    result = dfs(v)
                    if result is not None:
                        return result
            color[u] = BLACK
            return None

        for node in self.nodes:
            if color[node] == WHITE:
                cycle = dfs(node)
                if cycle is not None:
                    return True, cycle

        return False, []

    def get_graph_data(self) -> dict:
        """Return graph data suitable for visualization.

        Returns:
            Dictionary with 'nodes' (list of {id, type}) and
            'edges' (list of {source, target, type}).
        """
        nodes = [
            {"id": name, "type": ntype.value}
            for name, ntype in self.nodes.items()
        ]
        edges = [
            {"source": src, "target": tgt, "type": etype.value}
            for src, tgt, etype in self.edges
        ]
        return {"nodes": nodes, "edges": edges}

    def get_ascii_representation(self) -> str:
        """Generate a simple ASCII representation of the RAG.

        Returns:
            Multi-line string showing nodes and edges.
        """
        lines: list[str] = []
        lines.append("╔══════════════════════════════════════════╗")
        lines.append("║     Resource Allocation Graph (RAG)      ║")
        lines.append("╠══════════════════════════════════════════╣")

        # Show nodes
        processes = [n for n, t in self.nodes.items() if t == NodeType.PROCESS]
        resources = [n for n, t in self.nodes.items() if t == NodeType.RESOURCE]
        lines.append(f"║ Processes: {', '.join(processes):<29}║")
        lines.append(f"║ Resources: {', '.join(resources):<29}║")
        lines.append("╠══════════════════════════════════════════╣")

        # Show edges
        lines.append("║ Edges:                                   ║")
        for src, tgt, etype in self.edges:
            if etype == EdgeType.ASSIGNMENT:
                arrow = f"  {src} ──▶ {tgt}  (assigned)"
            else:
                arrow = f"  {src} ──▶ {tgt}  (waiting)"
            lines.append(f"║ {arrow:<41}║")

        if not self.edges:
            lines.append("║   (no edges)                             ║")

        lines.append("╚══════════════════════════════════════════╝")
        return "\n".join(lines)
