#!/usr/bin/env python3
"""
Forex Factory Full Calendar Refresh
- Runs every 4 hours
- Processes all events (high, medium, low impact)
- Updates economic scores for macro background
"""
import subprocess
import sys

# Run FF feed (all events)
result = subprocess.run(
    ["python", "forexfactory_feed.py"],
    capture_output=True,
    text=True
)

# Print output
print(result.stdout, end="")
if result.stderr:
    print(result.stderr, file=sys.stderr, end="")

sys.exit(result.returncode)
