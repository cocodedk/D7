#!/bin/bash

# Hook script that runs tests/coverage and prompts for docs + commit after task completion
# This hook is called when the agent loop ends

# Read JSON input from stdin
input=$(cat)

# Parse the status and workspace root
status=$(echo "$input" | jq -r '.status')
loop_count=$(echo "$input" | jq -r '.loop_count // 0')
workspace_root=$(echo "$input" | jq -r '.workspace_roots[0]')

# Only trigger if task completed successfully and we haven't looped too many times
if [ "$status" = "completed" ] && [ "$loop_count" -lt 2 ]; then
  # Change to workspace root
  cd "$workspace_root" || exit 1

  echo "Update tests hook: status=$status loop_count=$loop_count workspace_root=$workspace_root" >&2

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Update tests hook: not a git repo, exiting" >&2
    echo "{}"
    exit 0
  fi

  if git diff --quiet && git diff --cached --quiet; then
    echo "Update tests hook: working tree clean, exiting" >&2
    echo "{}"
    exit 0
  fi

  # Run tests using the existing test script
  # Output to stderr so it doesn't interfere with JSON output
  test_status=0
  if [ -f "scripts/run-tests.sh" ]; then
    echo "Running tests to verify changes..." >&2
    bash scripts/run-tests.sh >&2
    test_status=$?
  else
    echo "Update tests hook: scripts/run-tests.sh not found, skipping tests" >&2
    test_status=1
  fi

  # Run coverage check after tests
  coverage_status=0
  if [ "$test_status" -eq 0 ]; then
    if npm run -s test:coverage >/dev/null 2>&1; then
      echo "Coverage check passed." >&2
      coverage_status=0
    else
      echo "Coverage check failed." >&2
      coverage_status=1
    fi
  else
    coverage_status=1
  fi

  # Return a followup message that will be automatically submitted
  # The agent can use /update-tests and /update-docs commands
  if [ "$test_status" -ne 0 ]; then
    cat <<EOF
{
  "followup_message": "Tests failed. Please fix tests for the refactor, then re-run tests. After they pass, ensure coverage is high with `npm run test:coverage`, update docs in docs/, and commit with a good message."
}
EOF
  elif [ "$coverage_status" -ne 0 ]; then
    cat <<EOF
{
  "followup_message": "Coverage check failed. Please improve coverage (see `npm run test:coverage`), then update docs in docs/ and commit with a good message."
}
EOF
  else
    cat <<EOF
{
  "followup_message": "Tests and coverage passed. Please update docs in docs/ to reflect changes and then commit with a good message."
}
EOF
  fi
else
  # No followup message
  echo "{}"
fi

exit 0
