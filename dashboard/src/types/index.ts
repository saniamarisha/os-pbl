/**
 * types.ts — Type definitions for the Deadlock Prevention Simulator dashboard.
 */

export interface ProcessInfo {
  id: number;
  name: string;
  allocation: number[];
  maxClaim: number[];
  need: number[];
  finished: boolean;
}

export interface ResourceInfo {
  id: number;
  name: string;
  total: number;
  available: number;
}

export interface SystemState {
  processes: ProcessInfo[];
  resources: ResourceInfo[];
  available: number[];
  isSafe: boolean;
  safeSequence: number[];
}

export interface GraphNode {
  id: string;
  type: 'process' | 'resource';
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'assignment' | 'request';
}

export interface RAGData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hasCycle: boolean;
  cyclePath: string[];
}

export interface EventLog {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
}

export type SimulationSpeed = 'slow' | 'normal' | 'fast';
