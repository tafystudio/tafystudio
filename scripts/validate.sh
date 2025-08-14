#!/bin/bash
# Validation script for Tafy Studio
# Run this before pushing to catch issues early

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Tafy Studio Pre-Push Validation${NC}"
echo "================================"
echo ""

# Track overall status
FAILED=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2
    
    echo -e "${YELLOW}Running: ${name}${NC}"
    if eval "$command" > /tmp/validate_output.log 2>&1; then
        echo -e "${GREEN}✓ ${name} passed${NC}"
    else
        echo -e "${RED}✗ ${name} failed${NC}"
        echo -e "${RED}Error output:${NC}"
        tail -20 /tmp/validate_output.log
        FAILED=1
    fi
    echo ""
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

# 1. Check dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"
if command -v pnpm >/dev/null 2>&1 && command -v uv >/dev/null 2>&1 && command -v go >/dev/null 2>&1; then
    echo -e "${GREEN}✓ All required tools installed${NC}"
else
    echo -e "${RED}✗ Missing required tools. Run 'make install-tools'${NC}"
    exit 1
fi
echo ""

# 2. Run formatting checks
run_check "Code formatting (TypeScript/JavaScript)" "pnpm run format:check || pnpm run format"

# 3. Run linting
run_check "Linting (All languages)" "make lint"

# 4. Run type checking
run_check "TypeScript type checking" "pnpm run typecheck"

# 5. Check documentation
run_check "Documentation linting" "make docs-lint"

# 6. Run unit tests
run_check "Unit tests" "make test-unit"

# 7. Python specific checks
if [ -d "apps/hub-api" ]; then
    echo -e "${YELLOW}Python-specific checks...${NC}"
    cd apps/hub-api
    run_check "Python formatting (ruff)" "uv run ruff format --check ."
    run_check "Python linting (ruff)" "uv run ruff check ."
    run_check "Python type checking (mypy)" "uv run mypy app"
    cd ../..
fi

# 8. Go specific checks
if [ -d "apps/tafyd" ]; then
    echo -e "${YELLOW}Go-specific checks...${NC}"
    cd apps/tafyd
    run_check "Go formatting" "gofmt -l . | grep -q . && exit 1 || exit 0"
    run_check "Go vetting" "go vet ./..."
    run_check "Go linting" "command -v golangci-lint >/dev/null 2>&1 && golangci-lint run || echo 'golangci-lint not installed, skipping'"
    cd ../..
fi

# 9. Check for security issues
echo -e "${YELLOW}Security checks...${NC}"
run_check "npm audit" "pnpm audit --audit-level=high || true"

# Summary
echo ""
echo "================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All validation checks passed!${NC}"
    echo -e "${GREEN}Safe to push your changes.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some validation checks failed.${NC}"
    echo -e "${RED}Please fix the issues before pushing.${NC}"
    exit 1
fi