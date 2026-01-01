#!/bin/bash

# D7 Card Game - Test Runner Script
# Usage:
#   ./scripts/runt-test.sh          - Run all tests
#   ./scripts/runt-test.sh coverage  - Run tests with coverage
#   ./scripts/runt-test.sh ui        - Run tests with UI
#   ./scripts/runt-test.sh watch     - Run tests in watch mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Determine test mode
MODE="${1:-test}"

case "$MODE" in
  coverage)
    echo -e "${GREEN}Running tests with coverage...${NC}"
    npm run test:coverage
    ;;
  ui)
    echo -e "${GREEN}Running tests with UI...${NC}"
    npm run test:ui
    ;;
  watch)
    echo -e "${GREEN}Running tests in watch mode...${NC}"
    npm test -- --watch
    ;;
  test|*)
    echo -e "${GREEN}Running all tests...${NC}"
    npm test -- --run
    ;;
esac

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}✓ All tests passed!${NC}"
else
  echo -e "\n${RED}✗ Tests failed with exit code $EXIT_CODE${NC}"
fi

exit $EXIT_CODE
