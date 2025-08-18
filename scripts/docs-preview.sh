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
rm -rf "$DOCS_REPO_PATH/docs"
mkdir -p "$DOCS_REPO_PATH/docs"
# Copy content as docs
cp -r "$DOCS_BUILD_DIR/content/"* "$DOCS_REPO_PATH/docs/" 2>/dev/null || true

# Create API documentation index pages
mkdir -p "$DOCS_REPO_PATH/docs/api"
cat > "$DOCS_REPO_PATH/docs/api/index.md" << 'EOF'
# API Reference

The Tafy Studio platform provides APIs in multiple languages:

- [TypeScript API](/api/typescript) - For web and Node.js applications
- [Python API](/api/python) - For backend services and automation
- [Go API](/api/go) - For high-performance agents and services

## TypeScript SDK

The TypeScript SDK provides HAL schema definitions and utilities for building Tafy applications.

## Python SDK

The Python SDK includes FastAPI services, NATS integration, and HAL message handling.

## Go SDK

The Go SDK powers the Tafyd agent and provides high-performance HAL communication.
EOF

cat > "$DOCS_REPO_PATH/docs/api/typescript.md" << 'EOF'
# TypeScript API

[View TypeScript API Documentation](/api/typescript/README)

The TypeScript API includes:
- HAL message type definitions
- NATS client utilities
- Schema validation helpers
EOF

cat > "$DOCS_REPO_PATH/docs/api/python.md" << 'EOF'
# Python API

[View Python API Documentation](/api/python/html/index.html)

The Python API includes:
- FastAPI endpoints
- NATS service integration
- Device and flow management
- HAL message handling
EOF

cat > "$DOCS_REPO_PATH/docs/api/go.md" << 'EOF'
# Go API

[View Go API Documentation](/api/go/tafyd.html)

The Go API includes:
- Tafyd agent implementation
- High-performance HAL messaging
- Device discovery and management
- K3s integration utilities
EOF

# Copy API docs to static
mkdir -p "$DOCS_REPO_PATH/static/api"
cp -r "$DOCS_BUILD_DIR/api/"* "$DOCS_REPO_PATH/static/api/" 2>/dev/null || true
# Copy schemas to static
mkdir -p "$DOCS_REPO_PATH/static/schemas"
cp -r "$DOCS_BUILD_DIR/schemas/"* "$DOCS_REPO_PATH/static/schemas/" 2>/dev/null || true
# Copy examples to static
mkdir -p "$DOCS_REPO_PATH/static/examples"
cp -r "$DOCS_BUILD_DIR/examples/"* "$DOCS_REPO_PATH/static/examples/" 2>/dev/null || true

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