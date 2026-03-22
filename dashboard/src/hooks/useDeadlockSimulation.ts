/**
 * useDeadlockSimulation.ts — Core simulation logic hook.
 *
 * Implements the Banker's Algorithm and Resource Allocation Graph
 * management entirely in the browser for real-time interaction.
 */

import { useState, useCallback, useRef } from 'react';
import type {
  ProcessInfo,
  ResourceInfo,
  SystemState,
  RAGData,
  GraphEdge,
  GraphNode,
  EventLog,
} from '../types';

// ─── Banker's Safety Algorithm ──────────────────────────────────────────────

function runSafetyCheck(
  available: number[],
  processes: ProcessInfo[],
  numResources: number
): { isSafe: boolean; safeSequence: number[] } {
  const n = processes.length;
  const work = [...available];
  const finish = new Array(n).fill(false);
  const safeSequence: number[] = [];

  let found = true;
  while (found) {
    found = false;
    for (let i = 0; i < n; i++) {
      if (!finish[i] && !processes[i].finished) {
        const need = processes[i].need;
        if (need.every((val, j) => val <= work[j])) {
          for (let j = 0; j < numResources; j++) {
            work[j] += processes[i].allocation[j];
          }
          finish[i] = true;
          safeSequence.push(i);
          found = true;
          break;
        }
      }
    }
  }

  const allFinished = processes.every((p, i) => finish[i] || p.finished);
  return { isSafe: allFinished, safeSequence };
}

// ─── DFS Cycle Detection ────────────────────────────────────────────────────

function detectCycle(
  nodes: GraphNode[],
  edges: GraphEdge[]
): { hasCycle: boolean; cyclePath: string[] } {
  const adj: Record<string, string[]> = {};
  for (const node of nodes) {
    adj[node.id] = [];
  }
  for (const edge of edges) {
    if (!adj[edge.source]) adj[edge.source] = [];
    adj[edge.source].push(edge.target);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color: Record<string, number> = {};
  const parent: Record<string, string | null> = {};
  for (const node of nodes) {
    color[node.id] = WHITE;
    parent[node.id] = null;
  }

  function dfs(u: string): string[] | null {
    color[u] = GRAY;
    for (const v of (adj[u] || [])) {
      if (color[v] === GRAY) {
        const cycle = [v, u];
        let node: string | null = u;
        while (node && node !== v) {
          node = parent[node];
          if (node && node !== v) cycle.push(node);
        }
        cycle.reverse();
        return cycle;
      } else if (color[v] === WHITE) {
        parent[v] = u;
        const result = dfs(v);
        if (result) return result;
      }
    }
    color[u] = BLACK;
    return null;
  }

  for (const node of nodes) {
    if (color[node.id] === WHITE) {
      const cycle = dfs(node.id);
      if (cycle) return { hasCycle: true, cyclePath: cycle };
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

const DEFAULT_RESOURCES = ['A', 'B', 'C'];
const DEFAULT_TOTAL = [10, 5, 7];

const DEFAULT_PROCESSES: ProcessInfo[] = [
  { id: 0, name: 'P0', allocation: [0, 1, 0], maxClaim: [7, 5, 3], need: [7, 4, 3], finished: false },
  { id: 1, name: 'P1', allocation: [2, 0, 0], maxClaim: [3, 2, 2], need: [1, 2, 2], finished: false },
  { id: 2, name: 'P2', allocation: [3, 0, 2], maxClaim: [9, 0, 2], need: [6, 0, 0], finished: false },
  { id: 3, name: 'P3', allocation: [2, 1, 1], maxClaim: [2, 2, 2], need: [0, 1, 1], finished: false },
  { id: 4, name: 'P4', allocation: [0, 0, 2], maxClaim: [4, 3, 3], need: [4, 3, 1], finished: false },
];

export function useDeadlockSimulation() {
  const eventIdRef = useRef(0);

  const [processes, setProcesses] = useState<ProcessInfo[]>(DEFAULT_PROCESSES);
  const [resourceNames] = useState<string[]>(DEFAULT_RESOURCES);
  const [resourceTotals] = useState<number[]>(DEFAULT_TOTAL);
  const [events, setEvents] = useState<EventLog[]>([
    { id: 0, timestamp: getTimestamp(), message: 'System initialized with 5 processes and 3 resource types', type: 'info' },
  ]);

  // Compute available from totals - sum of allocations
  const computeAvailable = useCallback(
    (procs: ProcessInfo[]): number[] => {
      const avail = [...resourceTotals];
      for (const p of procs) {
        for (let j = 0; j < avail.length; j++) {
          avail[j] -= p.allocation[j];
        }
      }
      return avail;
    },
    [resourceTotals]
  );

  const addEvent = useCallback((message: string, type: EventLog['type']) => {
    eventIdRef.current += 1;
    setEvents(prev => [
      { id: eventIdRef.current, timestamp: getTimestamp(), message, type },
      ...prev,
    ]);
  }, []);

  // Get current system state
  const getSystemState = useCallback((): SystemState => {
    const available = computeAvailable(processes);
    const { isSafe, safeSequence } = runSafetyCheck(available, processes, resourceNames.length);
    const resources: ResourceInfo[] = resourceNames.map((name, i) => ({
      id: i,
      name,
      total: resourceTotals[i],
      available: available[i],
    }));
    return { processes, resources, available, isSafe, safeSequence };
  }, [processes, resourceNames, resourceTotals, computeAvailable]);

  // Get RAG data
  const getRAGData = useCallback((): RAGData => {
    const nodes: GraphNode[] = [
      ...processes.map(p => ({ id: p.name, type: 'process' as const })),
      ...resourceNames.map(r => ({ id: r, type: 'resource' as const })),
    ];

    const edges: GraphEdge[] = [];
    for (const p of processes) {
      for (let j = 0; j < resourceNames.length; j++) {
        if (p.allocation[j] > 0) {
          edges.push({ source: resourceNames[j], target: p.name, type: 'assignment' });
        }
      }
    }

    const { hasCycle, cyclePath } = detectCycle(nodes, edges);
    return { nodes, edges, hasCycle, cyclePath };
  }, [processes, resourceNames]);

  // Request resources for a process
  const requestResources = useCallback(
    (processId: number, request: number[]): boolean => {
      const available = computeAvailable(processes);
      const proc = processes[processId];

      // Check if request exceeds need
      for (let j = 0; j < request.length; j++) {
        if (request[j] > proc.need[j]) {
          addEvent(`❌ ${proc.name}: Request ${JSON.stringify(request)} exceeds need ${JSON.stringify(proc.need)}`, 'error');
          return false;
        }
      }

      // Check if request exceeds available
      for (let j = 0; j < request.length; j++) {
        if (request[j] > available[j]) {
          addEvent(`⏳ ${proc.name}: Request ${JSON.stringify(request)} exceeds available ${JSON.stringify(available)} — must wait`, 'warning');
          return false;
        }
      }

      // Simulate allocation
      const newProcs = processes.map((p, i) => {
        if (i !== processId) return { ...p };
        const newAlloc = p.allocation.map((a, j) => a + request[j]);
        const newNeed = p.maxClaim.map((m, j) => m - newAlloc[j]);
        return { ...p, allocation: newAlloc, need: newNeed };
      });

      const newAvailable = computeAvailable(newProcs);
      const { isSafe, safeSequence } = runSafetyCheck(newAvailable, newProcs, resourceNames.length);

      if (isSafe) {
        setProcesses(newProcs);
        const seqNames = safeSequence.map(i => newProcs[i].name).join(' → ');
        addEvent(`✅ ${proc.name}: Request ${JSON.stringify(request)} GRANTED. Safe sequence: < ${seqNames} >`, 'success');
        return true;
      } else {
        addEvent(`🚫 ${proc.name}: Request ${JSON.stringify(request)} DENIED — would cause UNSAFE state`, 'error');
        return false;
      }
    },
    [processes, computeAvailable, resourceNames, addEvent]
  );

  // Release resources
  const releaseResources = useCallback(
    (processId: number, release: number[]) => {
      setProcesses(prev =>
        prev.map((p, i) => {
          if (i !== processId) return p;
          const newAlloc = p.allocation.map((a, j) => a - release[j]);
          const newNeed = p.maxClaim.map((m, j) => m - newAlloc[j]);
          return { ...p, allocation: newAlloc, need: newNeed };
        })
      );
      addEvent(`🔓 ${processes[processId].name}: Released ${JSON.stringify(release)}`, 'success');
    },
    [processes, addEvent]
  );

  // Reset to defaults
  const resetSimulation = useCallback(() => {
    setProcesses(DEFAULT_PROCESSES);
    eventIdRef.current = 0;
    setEvents([
      { id: 0, timestamp: getTimestamp(), message: 'System reset to initial state', type: 'info' },
    ]);
  }, []);

  return {
    systemState: getSystemState(),
    ragData: getRAGData(),
    events,
    requestResources,
    releaseResources,
    resetSimulation,
    addEvent,
  };
}

function getTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
