"""
main.py — CLI Entry Point for the Deadlock Prevention Simulator.

Run with: python -m simulator.main
"""

from simulator.simulation import run_all_scenarios


def main() -> None:
    """Main entry point."""
    try:
        run_all_scenarios()
    except KeyboardInterrupt:
        print("\n\nSimulation interrupted by user.")


if __name__ == "__main__":
    main()
