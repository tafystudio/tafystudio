#!/bin/bash
#
# Basic installer validation tests
#

set -euo pipefail

# Colors
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test functions
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TESTS_RUN=$((TESTS_RUN + 1))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_RUN=$((TESTS_RUN + 1))
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Tests
echo "=== Tafy Studio Installer Basic Tests ==="
echo

echo "1. Testing installer script syntax..."
if bash -n scripts/get.tafy.sh; then
    test_pass "Installer syntax is valid"
else
    test_fail "Installer syntax has errors"
fi

echo
echo "2. Testing installer help..."
if timeout 5 bash scripts/get.tafy.sh --help > /dev/null 2>&1; then
    test_pass "Installer help works"
else
    test_fail "Installer help failed"
fi

echo
echo "3. Testing shellcheck (if available)..."
if command -v shellcheck &> /dev/null; then
    if shellcheck -x scripts/get.tafy.sh 2>&1 | grep -q "error"; then
        test_fail "Shellcheck found errors"
    else
        test_pass "Shellcheck passed (or only warnings)"
    fi
else
    test_warn "Shellcheck not available"
fi

echo
echo "4. Testing installer permissions..."
if [[ -r scripts/get.tafy.sh ]]; then
    test_pass "Installer is readable"
else
    test_fail "Installer is not readable"
fi

echo
echo "5. Testing installer structure..."
if grep -q "detect_os()" scripts/get.tafy.sh && \
   grep -q "install_k3s()" scripts/get.tafy.sh && \
   grep -q "install_nats()" scripts/get.tafy.sh; then
    test_pass "Installer has required functions"
else
    test_fail "Installer missing required functions"
fi

echo
echo "6. Testing installer constants..."
if grep -q "TAFY_VERSION=" scripts/get.tafy.sh && \
   grep -q "K3S_VERSION=" scripts/get.tafy.sh && \
   grep -q "MIN_MEMORY_MB=" scripts/get.tafy.sh; then
    test_pass "Installer has required constants"
else
    test_fail "Installer missing required constants"
fi

echo
echo "7. Testing documentation references..."
# Extract URLs but exclude variable expansions like ${VAR}
installer_urls=$(grep -oE 'https?://[^ $]+' scripts/get.tafy.sh | grep -v '\${' | sort -u)
valid_domains=0
invalid_domains=0

while IFS= read -r url; do
    # Skip empty lines
    [[ -z "$url" ]] && continue
    
    if [[ $url =~ (tafy\.studio|get\.k3s\.io|github\.com|nats-io\.github\.io|tafy\.local) ]]; then
        valid_domains=$((valid_domains + 1))
    else
        echo "   Unknown domain: $url"
        invalid_domains=$((invalid_domains + 1))
    fi
done <<< "$installer_urls"

if [[ $invalid_domains -eq 0 ]]; then
    test_pass "All URLs use expected domains ($valid_domains URLs)"
else
    test_warn "Found $invalid_domains URLs with unexpected domains"
fi

echo
echo "8. Testing error handling..."
if grep -q "set -euo pipefail" scripts/get.tafy.sh && \
   grep -q "trap cleanup EXIT" scripts/get.tafy.sh; then
    test_pass "Installer has proper error handling"
else
    test_fail "Installer missing error handling"
fi

# Summary
echo
echo "=== Test Summary ==="
echo "Tests run: $TESTS_RUN"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo

if [[ $TESTS_FAILED -gt 0 ]]; then
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi