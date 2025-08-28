#!/bin/bash
#
# Tafy Studio Installation Verification Script
# 
# This script verifies that all Tafy Studio components are correctly installed
# and functioning as expected.
#

set -euo pipefail

# Constants
readonly REQUIRED_COMMANDS=(
    "k3s:Kubernetes runtime"
    "kubectl:Kubernetes CLI"
    "helm:Helm package manager"
    "tafy:Tafy CLI"
)

readonly REQUIRED_DIRS=(
    "/opt/tafy:Tafy installation directory"
    "/var/lib/tafy:Tafy data directory"
    "/etc/tafy:Tafy configuration directory"
)

readonly REQUIRED_K8S_DEPLOYMENTS=(
    "nats:NATS messaging server"
    "hub-api:Tafy Hub API"
    "hub-ui:Tafy Hub UI"
    "node-red:Node-RED flow editor"
)

readonly REQUIRED_SERVICES=(
    "k3s:k3s.service"
)

# Colors
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_header() {
    echo
    echo "=== $1 ==="
    echo
}

check_system_requirements() {
    print_header "System Requirements"
    
    # Check OS
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        check_pass "Operating System: $NAME $VERSION"
    else
        check_fail "Cannot determine operating system"
    fi
    
    # Check memory
    local total_mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_mem_mb=$((total_mem_kb / 1024))
    if [[ $total_mem_mb -ge 2048 ]]; then
        check_pass "Memory: ${total_mem_mb}MB (minimum 2048MB)"
    else
        check_fail "Memory: ${total_mem_mb}MB (minimum 2048MB required)"
    fi
    
    # Check disk space
    local available_gb=$(df -BG /opt | tail -1 | awk '{print $4}' | sed 's/G//')
    if [[ $available_gb -ge 10 ]]; then
        check_pass "Disk space: ${available_gb}GB available (minimum 10GB)"
    else
        check_fail "Disk space: ${available_gb}GB available (minimum 10GB required)"
    fi
    
    # Check CPU
    local cpu_count=$(nproc)
    if [[ $cpu_count -ge 2 ]]; then
        check_pass "CPU cores: $cpu_count (minimum 2)"
    else
        check_warn "CPU cores: $cpu_count (2+ recommended)"
    fi
}

check_commands() {
    print_header "Required Commands"
    
    for cmd_desc in "${REQUIRED_COMMANDS[@]}"; do
        IFS=':' read -r cmd description <<< "$cmd_desc"
        if command -v "$cmd" &> /dev/null; then
            local version=$("$cmd" version 2>/dev/null | head -1 || echo "unknown")
            check_pass "$description ($cmd): $version"
        else
            check_fail "$description ($cmd): not found"
        fi
    done
}

check_directories() {
    print_header "Required Directories"
    
    for dir_desc in "${REQUIRED_DIRS[@]}"; do
        IFS=':' read -r dir description <<< "$dir_desc"
        if [[ -d "$dir" ]]; then
            local size=$(du -sh "$dir" 2>/dev/null | cut -f1 || echo "unknown")
            check_pass "$description: exists (size: $size)"
        else
            check_fail "$description: not found"
        fi
    done
}

check_services() {
    print_header "System Services"
    
    for svc_desc in "${REQUIRED_SERVICES[@]}"; do
        IFS=':' read -r name service <<< "$svc_desc"
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            check_pass "$name service: active"
        elif systemctl is-enabled --quiet "$service" 2>/dev/null; then
            check_warn "$name service: enabled but not active"
        else
            check_fail "$name service: not running"
        fi
    done
}

check_kubernetes() {
    print_header "Kubernetes Cluster"
    
    # Check if kubectl can connect
    if kubectl cluster-info &> /dev/null; then
        check_pass "Kubernetes cluster: accessible"
        
        # Check nodes
        local node_count=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
        if [[ $node_count -gt 0 ]]; then
            check_pass "Kubernetes nodes: $node_count node(s) ready"
        else
            check_fail "Kubernetes nodes: no nodes found"
        fi
        
        # Check system pods
        local system_pods=$(kubectl get pods -n kube-system --no-headers 2>/dev/null | grep -c Running || echo 0)
        if [[ $system_pods -gt 0 ]]; then
            check_pass "System pods: $system_pods running"
        else
            check_fail "System pods: none running"
        fi
    else
        check_fail "Kubernetes cluster: not accessible"
    fi
}

check_deployments() {
    print_header "Tafy Components"
    
    if ! kubectl cluster-info &> /dev/null; then
        check_warn "Skipping deployment checks - Kubernetes not accessible"
        return
    fi
    
    for deploy_desc in "${REQUIRED_K8S_DEPLOYMENTS[@]}"; do
        IFS=':' read -r deployment description <<< "$deploy_desc"
        
        # Check if deployment exists
        if kubectl get deployment "$deployment" &> /dev/null; then
            # Check if deployment is ready
            local ready=$(kubectl get deployment "$deployment" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
            local desired=$(kubectl get deployment "$deployment" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo 1)
            
            if [[ "$ready" == "$desired" ]] && [[ "$ready" -gt 0 ]]; then
                check_pass "$description: $ready/$desired replicas ready"
            else
                check_fail "$description: $ready/$desired replicas ready"
            fi
        else
            check_fail "$description: not deployed"
        fi
    done
}

check_network() {
    print_header "Network Configuration"
    
    # Check NATS connectivity
    if command -v nats &> /dev/null; then
        if nats rtt &> /dev/null; then
            check_pass "NATS connectivity: OK"
        else
            check_fail "NATS connectivity: cannot connect"
        fi
    else
        check_warn "NATS CLI not installed - skipping connectivity check"
    fi
    
    # Check if services are exposed
    local hub_ui_port=$(kubectl get svc hub-ui -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")
    if [[ -n "$hub_ui_port" ]]; then
        check_pass "Hub UI exposed on port: $hub_ui_port"
        
        # Check if UI is accessible
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$hub_ui_port" | grep -q "200\|301\|302"; then
            check_pass "Hub UI accessible at http://localhost:$hub_ui_port"
        else
            check_fail "Hub UI not responding at http://localhost:$hub_ui_port"
        fi
    else
        check_fail "Hub UI service not exposed"
    fi
}

check_configuration() {
    print_header "Configuration Files"
    
    # Check for main config file
    if [[ -f /etc/tafy/config.yaml ]]; then
        check_pass "Main configuration file exists"
        
        # Validate YAML syntax
        if command -v yq &> /dev/null; then
            if yq eval '.' /etc/tafy/config.yaml &> /dev/null; then
                check_pass "Configuration file syntax valid"
            else
                check_fail "Configuration file has syntax errors"
            fi
        fi
    else
        check_warn "Main configuration file not found at /etc/tafy/config.yaml"
    fi
    
    # Check for kubeconfig
    if [[ -f /etc/rancher/k3s/k3s.yaml ]]; then
        check_pass "Kubernetes config exists"
    else
        check_fail "Kubernetes config not found"
    fi
}

generate_report() {
    print_header "Verification Summary"
    
    local status="PASS"
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        status="FAIL"
    elif [[ $WARNINGS -gt 0 ]]; then
        status="WARN"
    fi
    
    echo "Status: $status"
    echo "Total checks: $TOTAL_CHECKS"
    echo "Passed: $PASSED_CHECKS"
    echo "Failed: $FAILED_CHECKS"
    echo "Warnings: $WARNINGS"
    echo
    
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        echo "Installation verification FAILED. Please check the errors above."
        exit 1
    elif [[ $WARNINGS -gt 0 ]]; then
        echo "Installation verification completed with warnings."
        exit 0
    else
        echo "Installation verification PASSED. All components are properly installed."
        exit 0
    fi
}

# Main execution
main() {
    echo "Tafy Studio Installation Verification"
    echo "===================================="
    echo "Date: $(date)"
    echo "Host: $(hostname)"
    echo
    
    check_system_requirements
    check_commands
    check_directories
    check_services
    check_kubernetes
    check_deployments
    check_network
    check_configuration
    
    generate_report
}

# Run main function
main "$@"