import { useDeadlockSimulation } from './hooks/useDeadlockSimulation';
import { useState } from 'react';
import type { EventLog } from './types';
import './App.css';

function App() {
  const {
    systemState,
    ragData,
    events,
    requestResources,
    releaseResources,
    resetSimulation,
  } = useDeadlockSimulation();

  const [requestInputs, setRequestInputs] = useState<Record<number, string>>({});
  const [selectedProcess, setSelectedProcess] = useState<number>(0);

  const handleRequest = (processId: number) => {
    const raw = requestInputs[processId] || '';
    const parts = raw.split(',').map(s => parseInt(s.trim(), 10));
    if (parts.length !== systemState.resources.length || parts.some(isNaN)) {
      alert(`Enter ${systemState.resources.length} comma-separated numbers (e.g., 1,0,2)`);
      return;
    }
    requestResources(processId, parts);
    setRequestInputs(prev => ({ ...prev, [processId]: '' }));
  };

  const handleRelease = (processId: number) => {
    const alloc = systemState.processes[processId].allocation;
    releaseResources(processId, alloc);
  };

  const safeSeqNames = systemState.safeSequence.map(i => systemState.processes[i]?.name || `P${i}`);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">🛡️</div>
          <div>
            <h1>Deadlock Prevention Simulator</h1>
            <p className="subtitle">Banker's Algorithm & Resource Allocation Graph</p>
          </div>
        </div>
        <button className="btn btn-reset" onClick={resetSimulation}>
          ↺ Reset
        </button>
      </header>

      {/* Status Banner */}
      <div className={`status-banner ${systemState.isSafe ? 'safe' : 'unsafe'}`}>
        <div className="status-icon">{systemState.isSafe ? '✅' : '🚫'}</div>
        <div className="status-text">
          <strong>System State: {systemState.isSafe ? 'SAFE' : 'UNSAFE'}</strong>
          {systemState.isSafe && safeSeqNames.length > 0 && (
            <span className="safe-seq">
              Safe Sequence: {'< '}{safeSeqNames.join(' → ')}{' >'}
            </span>
          )}
          {!systemState.isSafe && (
            <span className="unsafe-msg">No safe sequence exists — potential deadlock!</span>
          )}
        </div>
        {ragData.hasCycle && (
          <div className="cycle-badge">
            💀 Cycle: {ragData.cyclePath.join(' → ')} → {ragData.cyclePath[0]}
          </div>
        )}
      </div>

      <div className="dashboard">
        {/* Left Column */}
        <div className="col-left">
          {/* Processes Panel */}
          <section className="panel">
            <h2 className="panel-title">
              <span className="panel-icon">⚙️</span> Processes
            </h2>
            <div className="process-list">
              {systemState.processes.map((proc, idx) => (
                <div
                  key={proc.id}
                  className={`process-card ${selectedProcess === idx ? 'selected' : ''}`}
                  onClick={() => setSelectedProcess(idx)}
                >
                  <div className="process-header">
                    <span className="process-name">{proc.name}</span>
                    <span className={`process-badge ${proc.need.every(n => n === 0) ? 'done' : 'active'}`}>
                      {proc.need.every(n => n === 0) ? 'Complete' : 'Active'}
                    </span>
                  </div>
                  <div className="process-details">
                    <div className="detail-row">
                      <span className="detail-label">Alloc:</span>
                      <span className="detail-values">[{proc.allocation.join(', ')}]</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Max:</span>
                      <span className="detail-values">[{proc.maxClaim.join(', ')}]</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Need:</span>
                      <span className="detail-values need">[{proc.need.join(', ')}]</span>
                    </div>
                  </div>
                  <div className="process-actions">
                    <input
                      className="request-input"
                      placeholder={`e.g., ${systemState.resources.map(() => '0').join(',')}`}
                      value={requestInputs[idx] || ''}
                      onChange={e => setRequestInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => { if (e.key === 'Enter') handleRequest(idx); }}
                    />
                    <button className="btn btn-sm btn-request" onClick={(e) => { e.stopPropagation(); handleRequest(idx); }}>
                      Request
                    </button>
                    <button className="btn btn-sm btn-release" onClick={(e) => { e.stopPropagation(); handleRelease(idx); }}>
                      Release All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Resources Panel */}
          <section className="panel">
            <h2 className="panel-title">
              <span className="panel-icon">📦</span> Resources
            </h2>
            <div className="resource-grid">
              {systemState.resources.map(res => (
                <div key={res.id} className="resource-card">
                  <div className="resource-name">{res.name}</div>
                  <div className="resource-bar-container">
                    <div
                      className="resource-bar"
                      style={{ width: `${(res.available / res.total) * 100}%` }}
                    />
                  </div>
                  <div className="resource-stats">
                    <span>{res.available} / {res.total} free</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Center Column — Matrices */}
        <div className="col-center">
          <section className="panel matrix-panel">
            <h2 className="panel-title">
              <span className="panel-icon">📊</span> Allocation Matrix
            </h2>
            <MatrixTable
              processes={systemState.processes}
              resources={systemState.resources}
              field="allocation"
            />
          </section>

          <section className="panel matrix-panel">
            <h2 className="panel-title">
              <span className="panel-icon">📈</span> Maximum Claim Matrix
            </h2>
            <MatrixTable
              processes={systemState.processes}
              resources={systemState.resources}
              field="maxClaim"
            />
          </section>

          <section className="panel matrix-panel">
            <h2 className="panel-title">
              <span className="panel-icon">🔢</span> Need Matrix
            </h2>
            <MatrixTable
              processes={systemState.processes}
              resources={systemState.resources}
              field="need"
              available={systemState.available}
              highlightDanger
            />
          </section>
        </div>

        {/* Right Column — RAG + Event Log */}
        <div className="col-right">
          {/* RAG Visualization */}
          <section className="panel rag-panel">
            <h2 className="panel-title">
              <span className="panel-icon">🔗</span> Resource Allocation Graph
            </h2>
            <RAGVisualization ragData={ragData} />
          </section>

          {/* Event Log */}
          <section className="panel">
            <h2 className="panel-title">
              <span className="panel-icon">📋</span> Event Log
            </h2>
            <div className="event-log">
              {events.map(ev => (
                <EventEntry key={ev.id} event={ev} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="app-footer">
        <p>OS PBL — Preventing Application Freezes Caused by Resource Deadlocks</p>
      </footer>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MatrixTable({
  processes,
  resources,
  field,
  available,
  highlightDanger,
}: {
  processes: { name: string; allocation: number[]; maxClaim: number[]; need: number[] }[];
  resources: { name: string }[];
  field: 'allocation' | 'maxClaim' | 'need';
  available?: number[];
  highlightDanger?: boolean;
}) {
  return (
    <div className="matrix-table-wrapper">
      <table className="matrix-table">
        <thead>
          <tr>
            <th></th>
            {resources.map(r => (
              <th key={r.name}>{r.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processes.map(p => (
            <tr key={p.name}>
              <td className="process-label">{p.name}</td>
              {(p[field] as number[]).map((val, j) => {
                const isDanger = highlightDanger && available && val > available[j];
                return (
                  <td key={j} className={isDanger ? 'danger' : ''}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
          {available && (
            <tr className="available-row">
              <td className="process-label">Avail</td>
              {available.map((val, j) => (
                <td key={j} className="available-cell">{val}</td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RAGVisualization({ ragData }: { ragData: { nodes: { id: string; type: string }[]; edges: { source: string; target: string; type: string }[]; hasCycle: boolean; cyclePath: string[] } }) {
  const processNodes = ragData.nodes.filter(n => n.type === 'process');
  const resourceNodes = ragData.nodes.filter(n => n.type === 'resource');
  const width = 400;
  const height = 280;
  const cx = width / 2;

  // Position processes on left arc, resources on right arc
  const positions: Record<string, { x: number; y: number }> = {};
  processNodes.forEach((n, i) => {
    const angle = ((i + 1) / (processNodes.length + 1)) * Math.PI;
    positions[n.id] = { x: cx - 120 + Math.cos(angle) * 40, y: 40 + ((height - 80) * (i + 1)) / (processNodes.length + 1) };
  });
  resourceNodes.forEach((n, i) => {
    positions[n.id] = { x: cx + 120, y: 40 + ((height - 80) * (i + 1)) / (resourceNodes.length + 1) };
  });

  return (
    <div className="rag-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="rag-svg">
        <defs>
          <marker id="arrow-assign" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4ecdc4" />
          </marker>
          <marker id="arrow-request" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b6b" />
          </marker>
        </defs>

        {/* Edges */}
        {ragData.edges.map((edge, i) => {
          const from = positions[edge.source];
          const to = positions[edge.target];
          if (!from || !to) return null;
          const isAssign = edge.type === 'assignment';
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={`rag-edge ${isAssign ? 'assign' : 'request'}`}
              markerEnd={`url(#arrow-${isAssign ? 'assign' : 'request'})`}
            />
          );
        })}

        {/* Process Nodes (circles) */}
        {processNodes.map(n => {
          const pos = positions[n.id];
          const inCycle = ragData.cyclePath.includes(n.id);
          return (
            <g key={n.id}>
              <circle cx={pos.x} cy={pos.y} r="22" className={`rag-process ${inCycle ? 'in-cycle' : ''}`} />
              <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="rag-label">{n.id}</text>
            </g>
          );
        })}

        {/* Resource Nodes (rectangles) */}
        {resourceNodes.map(n => {
          const pos = positions[n.id];
          const inCycle = ragData.cyclePath.includes(n.id);
          return (
            <g key={n.id}>
              <rect x={pos.x - 20} y={pos.y - 16} width="40" height="32" rx="6" className={`rag-resource ${inCycle ? 'in-cycle' : ''}`} />
              <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="rag-label">{n.id}</text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(10, 250)">
          <circle cx="8" cy="0" r="6" fill="#6c5ce7" />
          <text x="20" y="4" className="rag-legend-text">Process</text>
          <rect x="80" y="-6" width="12" height="12" rx="2" fill="#00b894" />
          <text x="98" y="4" className="rag-legend-text">Resource</text>
          <line x1="170" y1="0" x2="190" y2="0" stroke="#4ecdc4" strokeWidth="2" />
          <text x="196" y="4" className="rag-legend-text">Assigned</text>
          <line x1="270" y1="0" x2="290" y2="0" stroke="#ff6b6b" strokeWidth="2" strokeDasharray="4,2" />
          <text x="296" y="4" className="rag-legend-text">Waiting</text>
        </g>
      </svg>
      {ragData.hasCycle && (
        <div className="rag-cycle-alert">
          💀 Cycle detected: {ragData.cyclePath.join(' → ')} → {ragData.cyclePath[0]}
        </div>
      )}
    </div>
  );
}

function EventEntry({ event }: { event: EventLog }) {
  const iconMap: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    action: '▶️',
  };
  return (
    <div className={`event-entry event-${event.type}`}>
      <span className="event-time">{event.timestamp}</span>
      <span className="event-icon">{iconMap[event.type] || '•'}</span>
      <span className="event-msg">{event.message}</span>
    </div>
  );
}

export default App;
