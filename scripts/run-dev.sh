#!/bin/bash

# D7 Card Game - Development Server Script
# Runs Netlify dev server for local development
# Usage:
#   ./scripts/run-dev.sh          - Run Netlify dev server
#   ./scripts/run-dev.sh --port 8888  - Run on custom port

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

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
  npm install -g netlify-cli
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Check for .env file
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}Warning: No .env file found.${NC}"
  echo -e "${BLUE}You may need to create a .env file with:${NC}"
  echo -e "${BLUE}  DATABASE_URL=your_database_url${NC}"
  echo -e "${BLUE}  ADMIN_PASSWORD=your_admin_password${NC}"
  echo ""
fi

echo -e "${GREEN}Starting Netlify dev server...${NC}"
echo -e "${BLUE}The server will start on http://localhost:8888 by default${NC}"
echo -e "${BLUE}API functions will be available at http://localhost:8888/api/*${NC}"
echo ""

# Run Netlify dev with any passed arguments
netlify dev "$@"
