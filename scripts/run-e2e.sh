#!/bin/bash

# D7 Card Game - E2E Test Runner Script
# Runs Playwright E2E tests in headed mode with line reporter
# Usage:
#   ./scripts/run-e2e.sh          - Run all E2E tests
#   ./scripts/run-e2e.sh auth     - Run specific test file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check for Playwright
if [ ! -f "node_modules/.bin/playwright" ]; then
  echo -e "${YELLOW}Playwright not found. Installing...${NC}"
  npm install --save-dev @playwright/test
  npx playwright install firefox
fi

# Check for .env file
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}Warning: No .env file found.${NC}"
  echo -e "${BLUE}You may need to create a .env file with:${NC}"
  echo -e "${BLUE}  ADMIN_PASSWORD=your_admin_password${NC}"
  echo ""
fi

# Check if ADMIN_PASSWORD is set
if [ -z "$ADMIN_PASSWORD" ] && [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo -e "${RED}Error: ADMIN_PASSWORD not set and no .env file found${NC}"
  echo -e "${BLUE}Set ADMIN_PASSWORD environment variable or create .env file${NC}"
  exit 1
fi

echo -e "${YELLOW}Resetting test database...${NC}"
node scripts/reset-test-db.cjs || {
  echo -e "${RED}Warning: Database reset failed. Continuing anyway...${NC}"
}
echo ""

echo -e "${GREEN}Running Playwright E2E tests in headed mode...${NC}"
echo -e "${BLUE}Tests will run with visible browser windows${NC}"
echo -e "${BLUE}Using line reporter for output${NC}"
echo ""

# Run Playwright tests with headed mode and line reporter
# If a test file argument is provided, run that specific file
if [ -n "$1" ]; then
  TEST_FILE="tests/e2e/$1.spec.ts"
  if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}Error: Test file not found: $TEST_FILE${NC}"
    exit 1
  fi
  npx playwright test "$TEST_FILE" --headed --reporter=line
else
  npx playwright test --headed --reporter=line
fi
