# API Documentation Configuration

This document describes how API documentation is generated for Tafy Studio projects across different languages.

## Overview

Tafy Studio uses language-specific documentation generators to create comprehensive API documentation:

- **TypeScript**: TypeDoc with markdown plugin
- **Python**: Sphinx with autodoc and markdown builder
- **Go**: godoc and gomarkdoc

All documentation is built into the `.docs-build` directory and then integrated into the documentation site.

## TypeScript Documentation

### Configuration

TypeScript projects use TypeDoc configured in:

- Root: `/typedoc.json` - Main configuration
- Packages: `packages/*/typedoc.json` - Package-specific overrides

### Key Features

- Markdown output for Docusaurus compatibility
- Automatic type extraction from TypeScript
- JSDoc comment support
- Cross-package linking

### Building

```bash
# Install dependencies
pnpm install

# Build TypeScript docs
pnpm run docs:build
```

## Python Documentation

### Configuration

Python projects use Sphinx configured in:

- `apps/hub-api/docs/conf.py` - Sphinx configuration
- `apps/hub-api/pyproject.toml` - Documentation dependencies

### Key Features

- Automatic API extraction using autodoc
- Support for Google and NumPy docstring styles
- Markdown output via sphinx-markdown-builder
- Type hints documentation

### Building

```bash
# Install documentation dependencies
cd apps/hub-api
uv pip install -e ".[docs]"

# Build Python docs
cd docs
sphinx-build -b markdown . ../../../.docs-build/api/python/markdown
```

## Go Documentation

### Configuration

Go documentation uses standard Go doc comments with:

- `godoc` for HTML generation
- `gomarkdoc` for Markdown generation

### Key Features

- Standard Go documentation format
- Package and function documentation
- Example code support
- Automatic linking

### Building

```bash
# Install tools
go install golang.org/x/tools/cmd/godoc@latest
go install github.com/princjef/gomarkdoc/cmd/gomarkdoc@latest

# Build Go docs
cd apps/tafyd
gomarkdoc -o ../../.docs-build/api/go/tafyd.md ./...
```

## Integration with Documentation Site

The documentation build process:

1. **Extract**: Run `make docs-prepare` to build all API docs
2. **Copy**: The `extract-docs.sh` script copies to `.docs-build`
3. **Deploy**: GitHub Actions triggers the docs site build
4. **Publish**: Docusaurus integrates and publishes to GitHub Pages

## Local Development

### Preview Documentation

```bash
# Build and preview documentation locally
make docs-preview

# This will:
# 1. Build all documentation
# 2. Copy to local docs site
# 3. Start preview server at http://localhost:3000
```

### Validate Documentation

```bash
# Run documentation validation
pnpm run docs:validate

# Check markdown formatting
make docs-lint

# Fix markdown issues
make docs-fix
```

## Best Practices

### TypeScript

- Use JSDoc comments for all public APIs
- Include `@example` blocks for complex functions
- Document type parameters and return types
- Keep comments concise but complete

### Python

- Use Google-style docstrings
- Include type hints in function signatures
- Document class attributes
- Provide usage examples in docstrings

### Go

- Follow standard Go documentation conventions
- First sentence should be a complete summary
- Use package-level doc.go files
- Include runnable examples

## Troubleshooting

### Common Issues

1. **Missing dependencies**: Install with appropriate package manager
2. **Build failures**: Check language-specific configuration files
3. **Broken links**: Run link checker before pushing
4. **Formatting issues**: Use language-specific formatters

### Debug Commands

```bash
# Check TypeDoc version
npx typedoc --version

# Test Sphinx build
cd apps/hub-api/docs && sphinx-build -b html . _build

# Verify Go installation
go version && which godoc
```
