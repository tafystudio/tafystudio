#!/bin/bash
#
# Test device discovery with multiple simulated devices
# This script creates mock mDNS services to test discovery

set -euo pipefail

# Color output
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

echo -e "${GREEN}Device Discovery Multi-Device Testing${NC}"
echo "====================================="

# Check for required tools
check_tools() {
    local missing=()
    
    if ! command -v avahi-publish &> /dev/null && ! command -v dns-sd &> /dev/null; then
        missing+=("mDNS tool (avahi-daemon or dns-sd)")
    fi
    
    if ! command -v nc &> /dev/null; then
        missing+=("netcat (nc)")
    fi
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}Missing required tools:${NC}"
        printf '%s\n' "${missing[@]}"
        echo -e "\n${YELLOW}Install on macOS:${NC}"
        echo "  brew install avahi netcat"
        echo -e "\n${YELLOW}Install on Ubuntu/Debian:${NC}"
        echo "  sudo apt-get install avahi-utils netcat"
        exit 1
    fi
}

# Publish mDNS service
publish_service() {
    local name=$1
    local port=$2
    local txt_records=$3
    
    if command -v dns-sd &> /dev/null; then
        # macOS
        dns-sd -R "$name" _tafynode._tcp local "$port" $txt_records &
    elif command -v avahi-publish &> /dev/null; then
        # Linux
        avahi-publish -s "$name" _tafynode._tcp "$port" $txt_records &
    fi
    
    echo $!  # Return PID
}

# Create mock device HTTP server
create_mock_server() {
    local port=$1
    local device_id=$2
    
    while true; do
        echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"id\":\"$device_id\",\"status\":\"online\"}" | nc -l "$port" > /dev/null 2>&1
    done &
    
    echo $!  # Return PID
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    
    # Kill all background processes
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    
    exit 0
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Array to store PIDs
PIDS=()

# Check tools
check_tools

echo -e "${GREEN}Starting mock devices...${NC}\n"

# Device 1: ESP32 with motors and sensors
echo -e "${BLUE}Device 1:${NC} ESP32 Differential Drive"
server_pid=$(create_mock_server 8001 "esp32-test-001")
PIDS+=($server_pid)
service_pid=$(publish_service "tafy-esp32-test-001" 8001 \
    "node_id=esp32-test-001 role=robot caps=motor.differential:v1.0,sensor.range-tof:v1.0")
PIDS+=($service_pid)
echo "  - Published on port 8001"

# Device 2: Raspberry Pi with camera
echo -e "${BLUE}Device 2:${NC} Raspberry Pi Camera Node"
server_pid=$(create_mock_server 8002 "pi-test-001")
PIDS+=($server_pid)
service_pid=$(publish_service "tafy-pi-test-001" 8002 \
    "node_id=pi-test-001 role=compute caps=camera.rgb:v1.0,compute.vision:v1.0")
PIDS+=($service_pid)
echo "  - Published on port 8002"

# Device 3: ESP32 sensor node
echo -e "${BLUE}Device 3:${NC} ESP32 Sensor Node"
server_pid=$(create_mock_server 8003 "esp32-test-002")
PIDS+=($server_pid)
service_pid=$(publish_service "tafy-esp32-test-002" 8003 \
    "node_id=esp32-test-002 role=sensor caps=sensor.range-tof:v1.0,sensor.imu:v1.0")
PIDS+=($service_pid)
echo "  - Published on port 8003"

# Device 4: Jetson Nano compute node
echo -e "${BLUE}Device 4:${NC} Jetson Nano Compute Node"
server_pid=$(create_mock_server 8004 "jetson-test-001")
PIDS+=($server_pid)
service_pid=$(publish_service "tafy-jetson-test-001" 8004 \
    "node_id=jetson-test-001 role=compute caps=compute.gpu:v1.0,camera.depth:v1.0")
PIDS+=($service_pid)
echo "  - Published on port 8004"

echo -e "\n${GREEN}Mock devices running!${NC}"
echo "Services published:"
echo "  - _tafynode._tcp on ports 8001-8004"

# Test discovery
echo -e "\n${YELLOW}Testing discovery...${NC}"
sleep 2

if command -v dns-sd &> /dev/null; then
    echo "Running: dns-sd -B _tafynode._tcp"
    timeout 5 dns-sd -B _tafynode._tcp || true
elif command -v avahi-browse &> /dev/null; then
    echo "Running: avahi-browse -t _tafynode._tcp"
    avahi-browse -t _tafynode._tcp || true
fi

echo -e "\n${GREEN}Test Instructions:${NC}"
echo "1. Start the hub-api: cd apps/hub-api && uv run uvicorn main:app"
echo "2. Start the hub-ui: cd apps/hub-ui && pnpm run dev"
echo "3. Navigate to http://localhost:3000/devices"
echo "4. Click 'Scan for Devices' - should find 4 devices"
echo "5. Check device details and capabilities"
echo ""
echo "Press Ctrl+C to stop mock devices..."

# Keep running
while true; do
    sleep 1
done