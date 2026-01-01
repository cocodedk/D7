#!/bin/bash

# Hook script that prompts the agent to follow the refactor command guidance
# This hook is called when the agent loop ends

# Check if jq is installed
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not installed. Please install jq to use this hook." >&2
  echo "Installation: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)" >&2
  exit 1
fi

# Read JSON input from stdin
input=$(cat)

# Parse the status and loop count
status=$(echo "$input" | jq -r '.status')
loop_count=$(echo "$input" | jq -r '.loop_count // 0')
workspace_root=$(echo "$input" | jq -r '.workspace_roots[0]')

# Only trigger if task completed successfully and we haven't looped too many times
echo "Refactor hook: status=$status loop_count=$loop_count workspace_root=$workspace_root" >&2

if [ "$status" = "completed" ] && [ "$loop_count" -lt 2 ]; then
  cat <<EOF
{
  "followup_message": "Please apply the /refactor command and follow the guidance in .cursor/commands/refactor.md (split into smaller files, keep ~135–160 lines, run tests, and update docs)."
}
EOF
else
  echo "Refactor hook: no action (status not completed or loop_count too high)" >&2
  echo "{}"
fi

exit 0
