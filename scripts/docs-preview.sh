#!/usr/bin/env bash
# Preview documentation locally using the docs site
# This script helps developers preview documentation changes before pushing

set -euo pipefail

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m'

# Configuration
DOCS_REPO_PATH="../tafystudio-docs"
DOCS_BUILD_DIR=".docs-build"

echo -e "${YELLOW}Tafy Studio Documentation Preview${NC}"
echo ""

# Check if docs repo exists
if [ ! -d "$DOCS_REPO_PATH" ]; then
    echo -e "${YELLOW}Documentation repository not found at $DOCS_REPO_PATH${NC}"
    echo "Would you like to clone it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Cloning tafystudio-docs..."
        git clone https://github.com/tafystudio/tafystudio-docs.git "$DOCS_REPO_PATH"
    else
        echo -e "${RED}Cannot preview without docs repository${NC}"
        exit 1
    fi
fi

# Build documentation
echo -e "${YELLOW}Building documentation...${NC}"
make docs-prepare

# Check if build was successful
if [ ! -d "$DOCS_BUILD_DIR" ]; then
    echo -e "${RED}Documentation build failed${NC}"
    exit 1
fi

# Copy built docs to docs repo
echo -e "${YELLOW}Copying documentation to preview site...${NC}"
rm -rf "$DOCS_REPO_PATH/extracted-docs"
cp -r "$DOCS_BUILD_DIR" "$DOCS_REPO_PATH/extracted-docs"

# Navigate to docs repo
cd "$DOCS_REPO_PATH"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing documentation site dependencies...${NC}"
    npm install
fi

# Start preview server
echo -e "${GREEN}Starting documentation preview server...${NC}"
echo -e "${GREEN}Documentation will be available at: http://localhost:3000${NC}"
echo ""
echo "Press Ctrl+C to stop the preview server"
npm start