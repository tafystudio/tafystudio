# Documentation Build Specification

This document defines how documentation is extracted from the Tafy Studio monorepo and built into the documentation site at `docs.tafy.studio`.

## Overview

The Tafy Studio project maintains documentation in two locations:

1. **Source Documentation** - Lives in the main monorepo (`tafystudio/tafystudio`)
2. **Documentation Site** - Built and deployed from `tafystudio/tafystudio-docs` using Docusaurus

## Documentation Structure in Monorepo

### Static Documentation Files

Location: `/docs/`

Required files:

- `VISION.md` - Project philosophy and goals
- `ARCHITECTURE.md` - System design and technical architecture
- `CONCEPTS.md` - Key terminology and concepts
- `DEVELOPMENT_SETUP.md` - Getting started guide for developers
- `TESTING.md` - Testing strategy and guidelines
- `SECURITY.md` - Security policies and practices
- `HAL_SPEC.md` - Hardware Abstraction Layer specification
- `QUICKSTART.md` - Quick start guide for users
- `TROUBLESHOOTING.md` - Common issues and solutions
- `DOCUMENTATION_BUILD_SPEC.md` - This file

Additional files:

- `/README.md` - Main project README (root of repository)
- `/CLAUDE.md` - AI assistant instructions (optional for docs)
- `/packages/*/README.md` - Package-specific documentation
- `/apps/*/README.md` - Application-specific documentation

### API Documentation Sources

#### TypeScript/JavaScript

- **Source**: `/packages/sdk-ts/`, `/packages/hal-schemas/src/`
- **Tool**: TypeDoc
- **Output**: Markdown or HTML API reference

#### Python

- **Source**: `/apps/hub-api/app/`, `/packages/sdk-python/`
- **Tool**: Sphinx with autodoc
- **Configuration**: `/apps/hub-api/docs/conf.py`
- **Output**: HTML/Markdown API reference

#### Go

- **Source**: `/apps/tafyd/`, `/packages/sdk-go/`
- **Tool**: godoc (external - pkg.go.dev)
- **Output**: Link to pkg.go.dev

### Dynamic Content Generation

#### HAL Schema Documentation

- **Source**: `/packages/hal-schemas/schemas/*.json`
- **Process**: Generate markdown tables from JSON Schema files
- **Output**: Schema reference documentation

#### Examples and Tutorials

- **Source**: `/examples/`, `/firmware/*/examples/`
- **Process**: Extract and format example code with explanations
- **Output**: Tutorial pages

## Documentation Build Process

### 1. Local Documentation Build (Monorepo)

Add to `/Makefile`:

```makefile
# Documentation build targets
.PHONY: docs-build docs-build-api docs-build-schemas docs-build-examples docs-prepare

# Prepare documentation for external build
docs-prepare: ## Prepare all documentation for docs site build
	@echo "$(YELLOW)Preparing documentation for build...$(NC)"
	@mkdir -p .docs-build
	@make docs-build-static
	@make docs-build-api
	@make docs-build-schemas
	@make docs-build-examples
	@echo "$(GREEN)Documentation prepared in .docs-build/$(NC)"

# Copy static documentation
docs-build-static:
	@echo "$(YELLOW)Copying static documentation...$(NC)"
	@mkdir -p .docs-build/content
	@cp -r docs/* .docs-build/content/
	@cp README.md .docs-build/content/
	@# Copy package READMEs
	@mkdir -p .docs-build/content/packages
	@for pkg in packages/*/README.md; do \
		if [ -f "$$pkg" ]; then \
			dir=$$(dirname "$$pkg"); \
			name=$$(basename "$$dir"); \
			cp "$$pkg" ".docs-build/content/packages/$$name.md"; \
		fi; \
	done
	@# Copy app READMEs
	@mkdir -p .docs-build/content/apps
	@for app in apps/*/README.md; do \
		if [ -f "$$app" ]; then \
			dir=$$(dirname "$$app"); \
			name=$$(basename "$$dir"); \
			cp "$$app" ".docs-build/content/apps/$$name.md"; \
		fi; \
	done

# Build API documentation
docs-build-api:
	@echo "$(YELLOW)Building API documentation...$(NC)"
	@mkdir -p .docs-build/api
	@# TypeScript API docs
	@if command -v typedoc >/dev/null 2>&1; then \
		echo "Building TypeScript API docs..."; \
		cd packages/sdk-ts && typedoc --out ../../.docs-build/api/typescript || true; \
		cd ../..; \
	else \
		echo "TypeDoc not found, skipping TypeScript API docs"; \
	fi
	@# Python API docs
	@if [ -d "apps/hub-api/docs" ]; then \
		echo "Building Python API docs..."; \
		cd apps/hub-api && \
		uv venv .venv-docs && \
		. .venv-docs/bin/activate && \
		uv pip install sphinx sphinx-rtd-theme sphinx-autodoc-typehints && \
		cd docs && \
		sphinx-build -b markdown . ../../../.docs-build/api/python && \
		deactivate && \
		cd ../../..; \
	else \
		echo "Python docs not configured, skipping"; \
	fi

# Generate schema documentation
docs-build-schemas:
	@echo "$(YELLOW)Generating HAL schema documentation...$(NC)"
	@mkdir -p .docs-build/schemas
	@if [ -d "packages/hal-schemas" ]; then \
		cd packages/hal-schemas && \
		pnpm run generate:docs || echo "Schema docs generation not configured"; \
		cd ../..; \
	fi

# Extract examples
docs-build-examples:
	@echo "$(YELLOW)Extracting examples...$(NC)"
	@mkdir -p .docs-build/examples
	@# Copy example files with proper formatting
	@if [ -d "examples" ]; then \
		find examples -name "*.md" -o -name "*.py" -o -name "*.ts" -o -name "*.go" | \
		while read -r file; do \
			rel=$${file#examples/}; \
			dir=$$(dirname ".docs-build/examples/$$rel"); \
			mkdir -p "$$dir"; \
			cp "$$file" ".docs-build/examples/$$rel"; \
		done; \
	fi

# Clean documentation build
docs-clean:
	@echo "$(YELLOW)Cleaning documentation build...$(NC)"
	@rm -rf .docs-build
```

### 2. Documentation Extraction Script

Create `/scripts/extract-docs.sh`:

```bash
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
    "troubleshooting": "content/TROUBLESHOOTING.md"
  },
  "api": {
    "typescript": "api/typescript/index.html",
    "python": "api/python/index.md",
    "go": "https://pkg.go.dev/github.com/tafystudio/tafystudio"
  },
  "packages": [
    $(find "$OUTPUT_DIR/content/packages" -name "*.md" 2>/dev/null | \
      sed 's|.*/||; s|\.md$||' | \
      awk '{printf "\"%s\"", $0} END {printf ""}' | \
      sed 's/,$//')
  ],
  "apps": [
    $(find "$OUTPUT_DIR/content/apps" -name "*.md" 2>/dev/null | \
      sed 's|.*/||; s|\.md$||' | \
      awk '{printf "\"%s\"", $0} END {printf ""}' | \
      sed 's/,$//')
  ]
}
EOF
```

Make it executable:

```bash
chmod +x scripts/extract-docs.sh
```

### 3. Documentation Site Build Process

The `tafystudio-docs` repository should:

1. Clone the monorepo
2. Run `./scripts/extract-docs.sh output-dir`
3. Process the extracted documentation according to `index.json`
4. Build the Docusaurus site

Example workflow snippet:

```yaml
- name: Extract documentation
  run: |
    cd tafystudio-main
    ./scripts/extract-docs.sh ../extracted-docs
    cd ..
    
- name: Process extracted documentation
  run: |
    # Copy static content
    cp -r extracted-docs/content/* docs/
    
    # Copy API documentation
    mkdir -p static/api
    cp -r extracted-docs/api/* static/api/ || true
    
    # Process any generated content
    if [ -f "extracted-docs/schemas/hal-schemas.md" ]; then
      cp extracted-docs/schemas/hal-schemas.md docs/hal-schemas-reference.md
    fi
```

## Documentation Standards

### Markdown Files

All markdown files should include frontmatter:

```markdown
---
title: Document Title
description: Brief description for SEO
sidebar_position: 1
---

# Document Title

Content...
```

### File Naming

- Use UPPERCASE for top-level concept docs (e.g., `ARCHITECTURE.md`)
- Use lowercase with hyphens for generated docs (e.g., `api-reference.md`)
- Package/app specific docs use their directory name

### Cross-References

- Use relative links within the monorepo: `[See Architecture](./ARCHITECTURE.md)`
- The docs site build process will convert these to proper Docusaurus links

## Versioning

Documentation versions are tied to the monorepo releases:

1. Main branch = "next" version (latest development)
2. Tagged releases = versioned documentation
3. The docs site can maintain multiple versions using Docusaurus versioning

## Local Development

Developers can preview documentation locally:

```bash
# In monorepo
make docs-prepare
python -m http.server 8080 -d .docs-build

# Or clone docs repo and run full build
git clone https://github.com/tafystudio/tafystudio-docs.git
cd tafystudio-docs
npm install
npm start
```

## CI/CD Integration

1. **Monorepo CI**: Validates documentation on every PR
   - Runs `make docs-lint`
   - Checks required files exist
   - Validates links

2. **Trigger on Changes**: When docs change in main branch
   - Triggers `repository_dispatch` to docs repo
   - Docs repo rebuilds and deploys

3. **Scheduled Builds**: Docs repo rebuilds periodically
   - Catches any missed triggers
   - Ensures docs stay fresh

## Future Enhancements

1. **Automated API Extraction**:
   - Extract API docs from code comments
   - Generate OpenAPI specs from FastAPI
   - Create interactive API playground

2. **Interactive Examples**:
   - Embed runnable code examples
   - Link to CodeSandbox/StackBlitz

3. **Search Integration**:
   - Index all documentation
   - Add Algolia DocSearch

4. **Metrics**:
   - Track which docs are most viewed
   - Identify documentation gaps

## Maintenance

Regular tasks:

1. **Weekly**: Review and update documentation
2. **Per Release**: Tag documentation version
3. **Monthly**: Audit for broken links and outdated content
4. **Quarterly**: Review documentation architecture and organization
