#!/bin/bash
# Generate Python API documentation locally

set -e

echo "🔧 Setting up Python documentation generation..."

# Check if we're in the right directory
if [ ! -d "apps/hub-api" ]; then
    echo "❌ Please run this script from the root of the tafystudio repository"
    exit 1
fi

# Navigate to hub-api
cd apps/hub-api

# Create a temporary virtual environment
echo "📦 Creating documentation virtual environment..."
if command -v uv &> /dev/null; then
    uv venv .venv-docs --python 3.12
    source .venv-docs/bin/activate
    echo "📥 Installing documentation dependencies..."
    uv pip install pdoc3 pydantic pydantic-settings sqlalchemy fastapi nats-py structlog httpx
else
    python -m venv .venv-docs
    source .venv-docs/bin/activate
    echo "📥 Installing documentation dependencies..."
    pip install pdoc3 pydantic pydantic-settings sqlalchemy fastapi nats-py structlog httpx
fi

# Create output directory
mkdir -p ../../docs-build/api/python

# Generate documentation
echo "📚 Generating Python API documentation..."
pdoc --html --force --output-dir ../../docs-build/api/python \
    --config show_source_code=True \
    --config show_type_annotations=True \
    app || {
        echo "⚠️  Some modules could not be documented"
        echo "This is expected if certain dependencies are not installed"
    }

# Clean up
deactivate
rm -rf .venv-docs

echo "✅ Python documentation generated at: docs-build/api/python/"
echo "📖 Open docs-build/api/python/app/index.html to view the documentation"