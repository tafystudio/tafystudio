#!/bin/bash
#
# Tafy Studio Installer Script
# https://tafy.studio
#
# This script installs the Tafy Studio Robot Distributed Operation System (RDOS)
# Usage: curl -fsSL get.tafy.sh | bash
#        curl -fsSL get.tafy.sh | bash -s -- --join <JOIN-CODE>
#

set -euo pipefail

# Constants
readonly TAFY_VERSION="${TAFY_VERSION:-latest}"
readonly TAFY_INSTALL_DIR="${TAFY_INSTALL_DIR:-/opt/tafy}"
readonly TAFY_DATA_DIR="${TAFY_DATA_DIR:-/var/lib/tafy}"
readonly TAFY_CONFIG_DIR="${TAFY_CONFIG_DIR:-/etc/tafy}"
readonly K3S_VERSION="${K3S_VERSION:-v1.29.0+k3s1}"
readonly NATS_CHART_VERSION="${NATS_CHART_VERSION:-1.1.5}"
readonly MIN_MEMORY_MB=2048
readonly MIN_DISK_GB=10

# Color output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_step() {
    echo -e "\n${BLUE}==>${NC} $*"
}

# Error handling
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Installation failed with exit code $exit_code"
        log_error "Check logs at /tmp/tafy-install.log for details"
    fi
}
trap cleanup EXIT

# Parse command line arguments
INSTALL_MODE="host"
JOIN_CODE=""
SKIP_PREFLIGHT=false
OFFLINE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --join)
            INSTALL_MODE="agent"
            JOIN_CODE="$2"
            shift 2
            ;;
        --skip-preflight)
            SKIP_PREFLIGHT=true
            shift
            ;;
        --offline)
            OFFLINE=true
            shift
            ;;
        --version)
            TAFY_VERSION="$2"
            shift 2
            ;;
        --help)
            cat <<EOF
Tafy Studio Installer

Usage:
    curl -fsSL get.tafy.sh | bash [OPTIONS]

Options:
    --join <CODE>      Join existing cluster as agent node
    --skip-preflight   Skip preflight checks
    --offline          Use offline installation bundle
    --version <VER>    Install specific version (default: latest)
    --help             Show this help message

Examples:
    # Install as primary host
    curl -fsSL get.tafy.sh | bash

    # Join existing cluster
    curl -fsSL get.tafy.sh | bash -s -- --join ABC123

EOF
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# System detection
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/debian_version ]; then
        OS="debian"
        OS_VERSION=$(cat /etc/debian_version)
    else
        log_error "Cannot detect operating system"
        exit 1
    fi

    case "$OS" in
        ubuntu|debian|raspbian)
            PKG_MANAGER="apt-get"
            ;;
        fedora|centos|rhel|rocky|almalinux)
            PKG_MANAGER="yum"
            ;;
        *)
            log_error "Unsupported operating system: $OS"
            exit 1
            ;;
    esac
}

# Architecture detection
detect_arch() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64|amd64)
            ARCH="amd64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        armv7l|armhf)
            ARCH="arm"
            ;;
        *)
            log_error "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac
}

# Preflight checks
preflight_checks() {
    if [ "$SKIP_PREFLIGHT" = true ]; then
        log_warn "Skipping preflight checks"
        return
    fi

    log_step "Running preflight checks"

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root"
        log_info "Try: curl -fsSL get.tafy.sh | sudo bash"
        exit 1
    fi

    # Check system resources
    local memory_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local memory_mb=$((memory_kb / 1024))
    if [ "$memory_mb" -lt "$MIN_MEMORY_MB" ]; then
        log_warn "System has ${memory_mb}MB RAM, recommended minimum is ${MIN_MEMORY_MB}MB"
    fi

    # Check disk space
    local disk_gb=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$disk_gb" -lt "$MIN_DISK_GB" ]; then
        log_error "Insufficient disk space: ${disk_gb}GB available, need at least ${MIN_DISK_GB}GB"
        exit 1
    fi

    # Check kernel modules
    if ! lsmod | grep -q br_netfilter; then
        log_info "Loading br_netfilter kernel module"
        modprobe br_netfilter || log_warn "Failed to load br_netfilter module"
    fi

    # Check for conflicting services
    for service in docker k3s microk8s; do
        if systemctl is-active --quiet $service 2>/dev/null; then
            log_warn "Found running $service service, this may cause conflicts"
        fi
    done

    log_info "Preflight checks passed"
}

# Install system dependencies
install_dependencies() {
    log_step "Installing system dependencies"

    case "$PKG_MANAGER" in
        apt-get)
            apt-get update -qq
            apt-get install -y -qq \
                curl \
                wget \
                avahi-daemon \
                avahi-utils \
                ca-certificates \
                gnupg \
                lsb-release \
                iptables \
                jq
            ;;
        yum)
            yum install -y -q \
                curl \
                wget \
                avahi \
                avahi-tools \
                ca-certificates \
                gnupg \
                iptables \
                jq
            ;;
    esac

    # Enable and start Avahi for mDNS
    systemctl enable avahi-daemon
    systemctl start avahi-daemon
}

# Install k3s
install_k3s() {
    log_step "Installing k3s"

    local k3s_args=""
    
    if [ "$INSTALL_MODE" = "host" ]; then
        # Primary host installation
        k3s_args="--disable traefik --write-kubeconfig-mode 644"
        
        # Generate node token for agents
        mkdir -p "$TAFY_CONFIG_DIR"
        openssl rand -hex 16 > "$TAFY_CONFIG_DIR/node-token"
        chmod 600 "$TAFY_CONFIG_DIR/node-token"
        
        export K3S_TOKEN=$(cat "$TAFY_CONFIG_DIR/node-token")
    else
        # Agent installation
        if [ -z "$JOIN_CODE" ]; then
            log_error "Join code required for agent installation"
            exit 1
        fi
        
        # Parse join code (format: HOST_IP:TOKEN)
        K3S_URL="https://${JOIN_CODE%:*}:6443"
        K3S_TOKEN="${JOIN_CODE#*:}"
        
        export K3S_URL K3S_TOKEN
        k3s_args="agent"
    fi

    # Install k3s
    if [ "$OFFLINE" = true ]; then
        log_info "Installing k3s from offline bundle"
        # TODO: Implement offline installation
    else
        curl -sfL https://get.k3s.io | \
            K3S_VERSION="$K3S_VERSION" \
            sh -s - $k3s_args
    fi

    # Wait for k3s to be ready
    if [ "$INSTALL_MODE" = "host" ]; then
        log_info "Waiting for k3s to be ready..."
        kubectl wait --for=condition=Ready nodes --all --timeout=300s
    fi
}

# Install NATS
install_nats() {
    if [ "$INSTALL_MODE" != "host" ]; then
        return
    fi

    log_step "Installing NATS"

    # Add NATS Helm repository
    helm repo add nats https://nats-io.github.io/k8s/helm/charts/
    helm repo update

    # Create NATS namespace
    kubectl create namespace nats-system --dry-run=client -o yaml | kubectl apply -f -

    # Install NATS with custom values
    cat <<EOF > /tmp/nats-values.yaml
cluster:
  enabled: true
  replicas: 1

nats:
  jetstream:
    enabled: false  # Disabled by default in Phase 1
    
  limits:
    maxConnections: 1000
    maxPayload: 8MB
    maxPending: 1GB
    
  logging:
    debug: false
    trace: false
    
monitoring:
  enabled: true
  
auth:
  enabled: false  # Enable in Phase 4
EOF

    helm upgrade --install nats nats/nats \
        --namespace nats-system \
        --version "$NATS_CHART_VERSION" \
        --values /tmp/nats-values.yaml \
        --wait

    # Wait for NATS to be ready
    kubectl wait --for=condition=Ready pods -l app.kubernetes.io/name=nats -n nats-system --timeout=300s
}

# Install Tafy services
install_tafy_services() {
    if [ "$INSTALL_MODE" != "host" ]; then
        return
    fi

    log_step "Installing Tafy services"

    # Create tafy namespace
    kubectl create namespace tafy-system --dry-run=client -o yaml | kubectl apply -f -

    # TODO: Deploy Hub UI and Hub API when Helm charts are ready
    # For now, we'll create placeholder deployments
    
    # Generate join code for other nodes
    local host_ip=$(hostname -I | awk '{print $1}')
    local token=$(cat "$TAFY_CONFIG_DIR/node-token")
    local join_code="${host_ip}:${token}"
    
    log_info "Cluster join code: $join_code"
    echo "$join_code" > "$TAFY_CONFIG_DIR/join-code"
}

# Configure firewall
configure_firewall() {
    log_step "Configuring firewall"

    # Required ports
    # 6443: k3s API
    # 10250: kubelet
    # 4222: NATS client
    # 8222: NATS monitoring
    # 443: Hub UI HTTPS
    # 5353: mDNS

    if command -v ufw >/dev/null 2>&1; then
        log_info "Configuring UFW firewall"
        ufw allow 6443/tcp
        ufw allow 10250/tcp
        ufw allow 4222/tcp
        ufw allow 8222/tcp
        ufw allow 443/tcp
        ufw allow 5353/udp
    elif command -v firewall-cmd >/dev/null 2>&1; then
        log_info "Configuring firewalld"
        firewall-cmd --permanent --add-port=6443/tcp
        firewall-cmd --permanent --add-port=10250/tcp
        firewall-cmd --permanent --add-port=4222/tcp
        firewall-cmd --permanent --add-port=8222/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=5353/udp
        firewall-cmd --reload
    else
        log_warn "No firewall detected, please manually open required ports"
    fi
}

# Install completion
install_complete() {
    log_step "Installation complete!"

    if [ "$INSTALL_MODE" = "host" ]; then
        local hub_url="https://tafy.local"
        local join_code=$(cat "$TAFY_CONFIG_DIR/join-code")
        
        cat <<EOF

${GREEN}✓ Tafy Studio installed successfully!${NC}

Hub UI: ${BLUE}${hub_url}${NC}
Join Code: ${YELLOW}${join_code}${NC}

Next steps:
1. Open the Hub UI in your browser
2. Flash your ESP32 devices
3. Add compute nodes with: curl -fsSL get.tafy.sh | bash -s -- --join ${join_code}

For help, visit: https://docs.tafy.studio

EOF
    else
        cat <<EOF

${GREEN}✓ Agent node joined successfully!${NC}

This node is now part of your Tafy cluster.
Check the Hub UI on your primary node to see this device.

EOF
    fi
}

# Main installation flow
main() {
    log_info "Starting Tafy Studio installation"
    log_info "Version: $TAFY_VERSION"
    log_info "Mode: $INSTALL_MODE"

    # Create log file
    exec > >(tee -a /tmp/tafy-install.log)
    exec 2>&1

    # System detection
    detect_os
    detect_arch
    log_info "Detected: $OS $OS_VERSION on $ARCH"

    # Run installation steps
    preflight_checks
    install_dependencies
    install_k3s
    install_nats
    install_tafy_services
    configure_firewall
    install_complete
}

# Run main function
main "$@"