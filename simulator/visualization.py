"""
visualization.py — Terminal Output Formatting with Colors.

Provides beautiful, colored terminal output for:
  - System state matrices (Allocation, Max, Need, Available)
  - Safe sequence display
  - Event log entries
  - Section headers and dividers

Uses colorama for cross-platform terminal color support.
"""

from __future__ import annotations
import sys
import io

# Force UTF-8 output on Windows to support box-drawing characters
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

try:
    from colorama import init, Fore, Style, Back
    init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    # Fallback: no colors if colorama is not installed
    HAS_COLOR = False

    class _NoColor:
        """Stub for when colorama is not available."""
        def __getattr__(self, name: str) -> str:
            return ""

    Fore = _NoColor()  # type: ignore
    Style = _NoColor()  # type: ignore
    Back = _NoColor()  # type: ignore

from simulator.models import SystemState


# ─── Color Theme ─────────────────────────────────────────────────────────────

HEADER_COLOR = Fore.CYAN + Style.BRIGHT
LABEL_COLOR = Fore.YELLOW + Style.BRIGHT
VALUE_COLOR = Fore.WHITE
SAFE_COLOR = Fore.GREEN + Style.BRIGHT
UNSAFE_COLOR = Fore.RED + Style.BRIGHT
WAIT_COLOR = Fore.YELLOW
PROCESS_COLOR = Fore.BLUE + Style.BRIGHT
RESOURCE_COLOR = Fore.MAGENTA + Style.BRIGHT
DIVIDER_COLOR = Fore.CYAN
RESET = Style.RESET_ALL if HAS_COLOR else ""


# ─── Dividers & Headers ─────────────────────────────────────────────────────

def print_divider(char: str = "═", width: int = 60) -> None:
    """Print a horizontal divider line."""
    print(f"{DIVIDER_COLOR}{char * width}{RESET}")


def print_header(title: str, width: int = 60) -> None:
    """Print a centered section header with borders."""
    print()
    print_divider("═", width)
    padding = (width - len(title) - 2) // 2
    print(f"{HEADER_COLOR}{'║'}{' ' * padding}{title}{' ' * (width - padding - len(title) - 2)}{'║'}{RESET}")
    print_divider("═", width)


def print_subheader(title: str) -> None:
    """Print a smaller section subheader."""
    print(f"\n{LABEL_COLOR}▸ {title}{RESET}")
    print(f"{DIVIDER_COLOR}{'─' * 50}{RESET}")


# ─── Matrix Display ─────────────────────────────────────────────────────────

def print_matrices(state: SystemState) -> None:
    """Print all resource allocation matrices in a formatted table.

    Displays: Allocation, Max, Need, and Available matrices with
    process and resource labels.

    Args:
        state: The system state to display.
    """
    need = state.need
    res_names = state.resource_names
    proc_names = state.process_names

    # Calculate column width
    col_w = max(5, max(len(r) for r in res_names) + 1)

    # Header row with resource names
    header = f"{'':>8}"
    for section_name in ["Allocation", "Maximum", "Need"]:
        for r in res_names:
            header += f"{r:>{col_w}}"
        header += "  │  "
    # Available header
    for r in res_names:
        header += f"{r:>{col_w}}"

    section_header = f"{'':>8}"
    for section_name in ["Allocation", "Maximum", "Need"]:
        section_w = col_w * len(res_names)
        section_header += f"{section_name:^{section_w}}"
        section_header += "  │  "
    section_header += f"{'Available':^{col_w * len(res_names)}}"

    print_subheader("System State Matrices")
    print(f"{LABEL_COLOR}{section_header}{RESET}")
    print(f"{RESOURCE_COLOR}{header}{RESET}")
    print(f"{DIVIDER_COLOR}{'─' * len(header)}{RESET}")

    for i in range(state.num_processes):
        row = f"{PROCESS_COLOR}{proc_names[i]:>8}{RESET}"

        # Allocation
        for j in range(state.num_resources):
            row += f"{VALUE_COLOR}{state.allocation[i][j]:>{col_w}}{RESET}"
        row += "  │  "

        # Max
        for j in range(state.num_resources):
            row += f"{VALUE_COLOR}{state.max_claim[i][j]:>{col_w}}{RESET}"
        row += "  │  "

        # Need
        for j in range(state.num_resources):
            val = need[i][j]
            color = UNSAFE_COLOR if val > state.available[j] else VALUE_COLOR
            row += f"{color}{val:>{col_w}}{RESET}"
        row += "  │  "

        # Available (only on first row)
        if i == 0:
            for j in range(state.num_resources):
                row += f"{SAFE_COLOR}{state.available[j]:>{col_w}}{RESET}"
        print(row)

    print()


def print_available(state: SystemState) -> None:
    """Print only the Available vector."""
    res_names = state.resource_names
    col_w = max(5, max(len(r) for r in res_names) + 1)

    header = "Available: "
    for j in range(state.num_resources):
        header += f"{res_names[j]}={state.available[j]}  "
    print(f"{SAFE_COLOR}{header}{RESET}")


# ─── Safety & Sequence Display ──────────────────────────────────────────────

def print_safe_sequence(sequence: list[int], process_names: list[str]) -> None:
    """Print the safe execution sequence with formatting.

    Args:
        sequence: List of process indices in safe order.
        process_names: Names of the processes.
    """
    names = [process_names[i] for i in sequence]
    seq_str = " → ".join(names)
    print(f"\n{SAFE_COLOR}✅ SAFE STATE CONFIRMED{RESET}")
    print(f"{SAFE_COLOR}   Safe Sequence: < {seq_str} >{RESET}")
    print()


def print_unsafe_state() -> None:
    """Print an unsafe state warning."""
    print(f"\n{UNSAFE_COLOR}🚫 UNSAFE STATE DETECTED{RESET}")
    print(f"{UNSAFE_COLOR}   No safe sequence exists — potential deadlock!{RESET}")
    print()


def print_deadlock_detected(cycle: list[str]) -> None:
    """Print a deadlock detection message with the circular wait cycle.

    Args:
        cycle: List of node names forming the cycle.
    """
    cycle_str = " → ".join(cycle) + " → " + cycle[0]
    print(f"\n{UNSAFE_COLOR}💀 DEADLOCK DETECTED — Circular Wait!{RESET}")
    print(f"{UNSAFE_COLOR}   Cycle: {cycle_str}{RESET}")
    print()


# ─── Event Logging ──────────────────────────────────────────────────────────

def print_event(message: str, event_type: str = "info") -> None:
    """Print a colored event log entry.

    Args:
        message: The event message.
        event_type: One of 'info', 'success', 'warning', 'error', 'action'.
    """
    color_map = {
        "info": Fore.WHITE,
        "success": SAFE_COLOR,
        "warning": WAIT_COLOR,
        "error": UNSAFE_COLOR,
        "action": PROCESS_COLOR,
    }
    color = color_map.get(event_type, Fore.WHITE)
    print(f"{color}  ▪ {message}{RESET}")


def print_scenario_banner(number: int, title: str) -> None:
    """Print a large banner for a simulation scenario.

    Args:
        number: Scenario number.
        title: Scenario description.
    """
    print("\n")
    print(f"{HEADER_COLOR}{'╔' + '═' * 58 + '╗'}{RESET}")
    print(f"{HEADER_COLOR}{'║'}{f'  SCENARIO {number}: {title}':<58}{'║'}{RESET}")
    print(f"{HEADER_COLOR}{'╚' + '═' * 58 + '╝'}{RESET}")
    print()
