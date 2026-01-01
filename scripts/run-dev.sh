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

# Check if Netlify CLI is available
NETLIFY_CMD=""
if command -v netlify &> /dev/null; then
  NETLIFY_CMD="netlify"
elif [ -f "node_modules/.bin/netlify" ]; then
  NETLIFY_CMD="node_modules/.bin/netlify"
elif command -v npx &> /dev/null; then
  NETLIFY_CMD="npx netlify"
else
  echo -e "${YELLOW}Netlify CLI not found. Installing locally...${NC}"
  npm install --save-dev netlify-cli
  NETLIFY_CMD="node_modules/.bin/netlify"
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

# Check if --offline flag is already in arguments
OFFLINE_FLAG=""
if [[ ! "$*" =~ --offline ]]; then
  OFFLINE_FLAG="--offline"
fi

# Run Netlify dev with offline mode to avoid linking to other projects
# This ensures it uses only the local netlify.toml configuration
$NETLIFY_CMD dev $OFFLINE_FLAG "$@"
