#!/bin/bash

# Alternative hook script that runs commands directly to update tests and docs
# This version executes commands instead of prompting the agent

# Check if jq is installed
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not installed" >&2
  exit 1
fi

# Read JSON input from stdin
input=$(cat)

# Parse the status
status=$(echo "$input" | jq -r '.status')
workspace_root=$(echo "$input" | jq -r '.workspace_roots[0]')

# Only run if task completed successfully
if [ "$status" = "completed" ]; then
  # Change to workspace root
  cd "$workspace_root" || exit 1

  # Run tests using the existing test script
  echo "Running tests to verify changes..." >&2
  if [ -f "scripts/run-tests.sh" ]; then
    bash scripts/run-tests.sh >&2 || true  # Don't fail the hook if tests fail
  else
    echo "Warning: scripts/run-tests.sh not found" >&2
  fi

  # Note: This hook runs tests but doesn't automatically update them.
  # For automatic updates, use the followup_message approach in update-tests-docs.sh
fi

# No followup message - this version just runs commands
echo "{}"

exit 0
