#!/usr/bin/env bash
# Extract and prepare documentation for the docs site
# This script is used by the tafystudio-docs repository

set -euo pipefail

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m'

# Configuration
OUTPUT_DIR="${1:-.docs-build}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${YELLOW}Extracting documentation from Tafy Studio monorepo...${NC}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Create metadata file
cat > "$OUTPUT_DIR/metadata.json" << EOF
{
  "source": "tafystudio/tafystudio",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

# Run make target to prepare documentation
cd "$REPO_ROOT"
make docs-prepare

# Copy prepared documentation to output directory
if [ -d ".docs-build" ]; then
    cp -r .docs-build/* "$OUTPUT_DIR/"
    echo -e "${GREEN}Documentation extracted successfully to $OUTPUT_DIR${NC}"
else
    echo -e "${RED}Documentation build failed${NC}"
    exit 1
fi

# Generate index file for Docusaurus
cat > "$OUTPUT_DIR/index.json" << EOF
{
  "static": {
    "vision": "content/VISION.md",
    "architecture": "content/ARCHITECTURE.md",
    "concepts": "content/CONCEPTS.md",
    "quickstart": "content/QUICKSTART.md",
    "development": "content/DEVELOPMENT_SETUP.md",
    "testing": "content/TESTING.md",
    "security": "content/SECURITY.md",
    "hal_spec": "content/HAL_SPEC.md",
    "troubleshooting": "content/TROUBLESHOOTING.md",
    "documentation_build": "content/DOCUMENTATION_BUILD_SPEC.md"
  },
  "api": {
    "typescript": "api/typescript/index.html",
    "python": "api/python/index.html",
    "go": "https://pkg.go.dev/github.com/tafystudio/tafystudio"
  },
  "packages": [
EOF

# Add package list
first=true
for pkg in "$OUTPUT_DIR"/content/packages/*.md 2>/dev/null; do
    if [ -f "$pkg" ]; then
        name=$(basename "$pkg" .md)
        if [ "$first" = true ]; then
            printf '    "%s"' "$name" >> "$OUTPUT_DIR/index.json"
            first=false
        else
            printf ',\n    "%s"' "$name" >> "$OUTPUT_DIR/index.json"
        fi
    fi
done

cat >> "$OUTPUT_DIR/index.json" << EOF

  ],
  "apps": [
EOF

# Add apps list
first=true
for app in "$OUTPUT_DIR"/content/apps/*.md 2>/dev/null; do
    if [ -f "$app" ]; then
        name=$(basename "$app" .md)
        if [ "$first" = true ]; then
            printf '    "%s"' "$name" >> "$OUTPUT_DIR/index.json"
            first=false
        else
            printf ',\n    "%s"' "$name" >> "$OUTPUT_DIR/index.json"
        fi
    fi
done

cat >> "$OUTPUT_DIR/index.json" << EOF

  ],
  "examples": [
EOF

# Add examples list
first=true
if [ -d "$OUTPUT_DIR/examples" ]; then
    find "$OUTPUT_DIR/examples" -type f | while read -r file; do
        rel="${file#$OUTPUT_DIR/examples/}"
        if [ "$first" = true ]; then
            printf '    "%s"' "$rel" >> "$OUTPUT_DIR/index.json"
            first=false
        else
            printf ',\n    "%s"' "$rel" >> "$OUTPUT_DIR/index.json"
        fi
    done
fi

cat >> "$OUTPUT_DIR/index.json" << EOF

  ]
}
EOF

echo -e "${GREEN}Documentation extraction complete!${NC}"
echo -e "Output directory: ${YELLOW}$OUTPUT_DIR${NC}"
echo -e "Metadata file: ${YELLOW}$OUTPUT_DIR/metadata.json${NC}"
echo -e "Index file: ${YELLOW}$OUTPUT_DIR/index.json${NC}"