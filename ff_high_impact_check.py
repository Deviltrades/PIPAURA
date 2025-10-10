#!/usr/bin/env python3
"""
Forex Factory High-Impact Event Check
- Runs every 15 minutes
- Checks for new high-impact (red folder) events
- Triggers instant bias recalculation if new events found
"""
import subprocess
import sys

# Run FF feed with high-impact filter
result = subprocess.run(
    ["python", "forexfactory_feed.py", "--high-impact"],
    capture_output=True,
    text=True
)

# Print output
print(result.stdout, end="")
if result.stderr:
    print(result.stderr, file=sys.stderr, end="")

# If exit code 1, high-impact events were found → trigger bias recalc
if result.returncode == 1:
    print("🚨 High-impact events detected! Triggering instant bias update...")
    
    # Run hourly update to recalculate biases
    recalc_result = subprocess.run(
        ["python", "hourly_update.py"],
        capture_output=True,
        text=True
    )
    
    print(recalc_result.stdout, end="")
    if recalc_result.stderr:
        print(recalc_result.stderr, file=sys.stderr, end="")
    
    sys.exit(0)
else:
    # No high-impact events, normal exit
    sys.exit(0)
