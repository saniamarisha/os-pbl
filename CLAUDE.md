# CLAUDE.md — Project Conventions

## Project: Preventing Application Freezes Caused by Resource Deadlocks

### Language & Runtime
- **Backend:** Python 3.10+ (no external deps except `colorama`)
- **Frontend:** TypeScript + React 18 via Vite

### Directory Structure
```
os_pbl/
├── CLAUDE.md              # This file
├── PRD.md                 # Product Requirements Document
├── README.md              # Project overview and setup instructions
├── simulator/             # Python simulation package
│   ├── __init__.py
│   ├── models.py          # Data classes (SystemState)
│   ├── bankers.py         # Banker's Algorithm implementation
│   ├── rag.py             # Resource Allocation Graph + cycle detection
│   ├── resource_manager.py# Orchestrator holding matrices
│   ├── visualization.py   # Terminal colored output
│   ├── simulation.py      # Scenario runner
│   └── main.py            # CLI entry point
└── dashboard/             # React web dashboard
    ├── package.json
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   ├── hooks/
    │   └── types/
    └── ...
```

### Code Conventions — Python
- Use type hints everywhere (`def foo(x: int) -> bool:`)
- Docstrings on all public functions (Google style)
- snake_case for functions/variables, PascalCase for classes
- Matrices represented as `list[list[int]]`
- Zero-indexed processes (P0, P1, ...) and resources (R0, R1, ...)

### Code Conventions — TypeScript/React
- Functional components only
- Custom hooks in `hooks/` directory
- Interfaces/types in `types/` directory
- camelCase for variables, PascalCase for components

### Key Algorithms
- **Banker's Safety Algorithm:** O(n² × m) — iterate processes finding completable ones
- **Resource Request Algorithm:** Simulate allocation → run safety check → grant or rollback
- **RAG Cycle Detection:** DFS-based cycle detection on directed graph

### Running the Project
```bash
# Python CLI simulation
cd os_pbl
python -m simulator.main

# Web dashboard
cd os_pbl/dashboard
npm install
npm run dev
```

### Testing
- Python: Run `python -m simulator.main` and verify console output
- Dashboard: Visual verification in browser at localhost:5173
