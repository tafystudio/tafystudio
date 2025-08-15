#!/bin/bash
# Generate Python API documentation using Sphinx (industry standard)

set -e

echo "🔧 Setting up Sphinx documentation generation..."

# Check if we're in the right directory
if [ ! -d "apps/hub-api" ]; then
    echo "❌ Please run this script from the root of the tafystudio repository"
    exit 1
fi

# Navigate to hub-api
cd apps/hub-api

# Create docs directory if it doesn't exist
mkdir -p docs/_static docs/_templates

# Create a temporary virtual environment
echo "📦 Creating documentation virtual environment..."
if command -v uv &> /dev/null; then
    uv venv .venv-docs --python 3.12
    source .venv-docs/bin/activate
    echo "📥 Installing Sphinx and dependencies..."
    uv pip install sphinx sphinx-rtd-theme sphinx-autodoc-typehints
else
    python -m venv .venv-docs
    source .venv-docs/bin/activate
    echo "📥 Installing Sphinx and dependencies..."
    pip install sphinx sphinx-rtd-theme sphinx-autodoc-typehints
fi

# Build documentation
echo "📚 Building documentation with Sphinx..."
cd docs
sphinx-build -b html . ../../docs-build/api/python -W --keep-going || {
    echo "⚠️  Some warnings occurred during documentation build"
}

# Clean up
cd ..
deactivate
rm -rf .venv-docs

echo "✅ Python documentation generated at: docs-build/api/python/"
echo "📖 Open docs-build/api/python/index.html to view the documentation"