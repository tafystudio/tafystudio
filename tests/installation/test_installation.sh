#!/bin/bash
#
# Tafy Studio Installation Test Suite
# 
# This script tests the complete installation flow of Tafy Studio
# It can be run in different modes:
#   - Local: Test on current machine
#   - Docker: Test in isolated containers
#   - CI: Automated testing in CI/CD pipelines
#

set -euo pipefail

# Constants
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
readonly INSTALLER_SCRIPT="$PROJECT_ROOT/scripts/get.tafy.sh"
readonly TEST_LOG_DIR="${TEST_LOG_DIR:-$SCRIPT_DIR/logs}"
readonly TEST_MODE="${TEST_MODE:-docker}"

# Test configuration
readonly PLATFORMS_TO_TEST=(
    "ubuntu:22.04"
    "ubuntu:20.04"
    "debian:11"
    "debian:12"
    "rockylinux:9"
    "almalinux:9"
)

# Color output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Test results
declare -A TEST_RESULTS
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $*"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $*"
    ((PASSED_TESTS++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $*"
    ((FAILED_TESTS++))
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

# Create test log directory
mkdir -p "$TEST_LOG_DIR"

# Test functions
test_prerequisites() {
    log_test "Checking prerequisites..."
    
    local prereqs_ok=true
    
    # Check Docker if in docker mode
    if [[ "$TEST_MODE" == "docker" ]]; then
        if ! command -v docker &> /dev/null; then
            log_fail "Docker not found"
            prereqs_ok=false
        else
            log_pass "Docker available"
        fi
    fi
    
    # Check installer script exists
    if [[ ! -f "$INSTALLER_SCRIPT" ]]; then
        log_fail "Installer script not found at $INSTALLER_SCRIPT"
        prereqs_ok=false
    else
        log_pass "Installer script found"
    fi
    
    # Check network connectivity
    if ! curl -s --head https://get.k3s.io > /dev/null; then
        log_fail "Cannot reach k3s download site"
        prereqs_ok=false
    else
        log_pass "Network connectivity OK"
    fi
    
    if [[ "$prereqs_ok" == "false" ]]; then
        log_fail "Prerequisites check failed"
        exit 1
    fi
    
    log_pass "All prerequisites met"
}

test_installer_syntax() {
    log_test "Checking installer script syntax..."
    
    if bash -n "$INSTALLER_SCRIPT"; then
        log_pass "Installer script syntax is valid"
    else
        log_fail "Installer script has syntax errors"
        return 1
    fi
}

test_installer_shellcheck() {
    log_test "Running shellcheck on installer..."
    
    if command -v shellcheck &> /dev/null; then
        if shellcheck -x "$INSTALLER_SCRIPT"; then
            log_pass "Shellcheck passed"
        else
            log_warn "Shellcheck found issues (non-fatal)"
        fi
    else
        log_warn "Shellcheck not available, skipping"
    fi
}

create_docker_test_script() {
    local platform=$1
    cat > "$TEST_LOG_DIR/test_install_${platform//[:\/]/_}.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

# Install dependencies based on distro
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y curl sudo systemd-sysv
elif command -v yum &> /dev/null; then
    yum install -y curl sudo systemd
fi

# Run installer
export TAFY_TEST_MODE=1
export TAFY_SKIP_SYSTEMD=1
bash /installer/get.tafy.sh

# Verify installation
echo "Verifying installation..."

# Check k3s
if command -v k3s &> /dev/null; then
    echo "✓ k3s installed"
else
    echo "✗ k3s not found"
    exit 1
fi

# Check helm
if command -v helm &> /dev/null; then
    echo "✓ helm installed"
else
    echo "✗ helm not found"
    exit 1
fi

# Check tafy CLI
if command -v tafy &> /dev/null; then
    echo "✓ tafy CLI installed"
else
    echo "✗ tafy CLI not found"
    exit 1
fi

# Check directories
for dir in /opt/tafy /var/lib/tafy /etc/tafy; do
    if [[ -d "$dir" ]]; then
        echo "✓ $dir exists"
    else
        echo "✗ $dir not found"
        exit 1
    fi
done

echo "Installation verification complete!"
EOF
    chmod +x "$TEST_LOG_DIR/test_install_${platform//[:\/]/_}.sh"
}

test_platform_installation() {
    local platform=$1
    local container_name="tafy-test-${platform//[:\/]/-}"
    local log_file="$TEST_LOG_DIR/${platform//[:\/]/_}_install.log"
    
    log_test "Testing installation on $platform..."
    
    # Create test script for this platform
    create_docker_test_script "$platform"
    
    # Run test in Docker container
    if docker run --rm \
        --name "$container_name" \
        -v "$PROJECT_ROOT:/installer:ro" \
        -v "$TEST_LOG_DIR:/test:rw" \
        "$platform" \
        /test/test_install_${platform//[:\/]/_}.sh \
        &> "$log_file"; then
        
        log_pass "Installation successful on $platform"
        TEST_RESULTS["$platform"]="PASS"
    else
        log_fail "Installation failed on $platform (see $log_file)"
        TEST_RESULTS["$platform"]="FAIL"
    fi
}

test_all_platforms() {
    log_test "Testing installation on all platforms..."
    
    if [[ "$TEST_MODE" != "docker" ]]; then
        log_warn "Platform testing requires docker mode"
        return
    fi
    
    for platform in "${PLATFORMS_TO_TEST[@]}"; do
        ((TOTAL_TESTS++))
        test_platform_installation "$platform"
    done
}

test_uninstall() {
    log_test "Testing uninstall functionality..."
    
    # TODO: Implement uninstall testing
    log_warn "Uninstall testing not yet implemented"
}

test_upgrade() {
    log_test "Testing upgrade functionality..."
    
    # TODO: Implement upgrade testing
    log_warn "Upgrade testing not yet implemented"
}

test_join_cluster() {
    log_test "Testing join cluster functionality..."
    
    # TODO: Implement cluster join testing
    log_warn "Cluster join testing not yet implemented"
}

generate_test_report() {
    local report_file="$TEST_LOG_DIR/test_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Tafy Studio Installation Test Report

Date: $(date)
Test Mode: $TEST_MODE
Total Tests: $TOTAL_TESTS
Passed: $PASSED_TESTS
Failed: $FAILED_TESTS

## Test Results by Platform

| Platform | Result | Log File |
|----------|--------|----------|
EOF
    
    for platform in "${!TEST_RESULTS[@]}"; do
        local result="${TEST_RESULTS[$platform]}"
        local log_file="${platform//[:\/]/_}_install.log"
        echo "| $platform | $result | $log_file |" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

## Test Details

### Prerequisites
- Docker: $(command -v docker &> /dev/null && echo "✓" || echo "✗")
- Network: $(curl -s --head https://get.k3s.io > /dev/null && echo "✓" || echo "✗")
- Installer: $([ -f "$INSTALLER_SCRIPT" ] && echo "✓" || echo "✗")

### Known Issues
$(grep -h "FAIL\|ERROR" "$TEST_LOG_DIR"/*.log 2>/dev/null | head -10 || echo "None detected")

### Recommendations
EOF
    
    if [[ $FAILED_TESTS -gt 0 ]]; then
        echo "- Fix failing installations before release" >> "$report_file"
    fi
    
    log_info "Test report generated: $report_file"
}

# Main test execution
main() {
    log_info "Starting Tafy Studio installation tests..."
    log_info "Test mode: $TEST_MODE"
    log_info "Log directory: $TEST_LOG_DIR"
    
    # Run tests
    test_prerequisites
    test_installer_syntax
    test_installer_shellcheck
    
    if [[ "$TEST_MODE" == "docker" ]]; then
        test_all_platforms
    else
        log_warn "Local mode testing not yet implemented"
    fi
    
    # Generate report
    generate_test_report
    
    # Summary
    echo
    log_info "Test Summary:"
    log_info "Total tests: $TOTAL_TESTS"
    log_info "Passed: $PASSED_TESTS"
    log_info "Failed: $FAILED_TESTS"
    
    if [[ $FAILED_TESTS -gt 0 ]]; then
        exit 1
    fi
}

# Run main function
main "$@"