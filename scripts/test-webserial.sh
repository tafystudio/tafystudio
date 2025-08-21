#!/bin/bash
#
# Test WebSerial functionality across browsers
# Requires ESP32 connected via USB for hardware tests

set -euo pipefail

# Color output
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

echo -e "${GREEN}WebSerial Multi-Browser Testing${NC}"
echo "=================================="

# Check if ESP32 is connected
if ls /dev/tty.usbserial-* 2>/dev/null || ls /dev/ttyUSB* 2>/dev/null; then
    echo -e "${GREEN}✓ ESP32 device detected${NC}"
    HARDWARE_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ No ESP32 detected - will run mock tests only${NC}"
    HARDWARE_AVAILABLE=false
fi

# Install Playwright browsers if needed
cd apps/hub-ui
if [ ! -d "node_modules/@playwright/test" ]; then
    echo "Installing Playwright..."
    pnpm add -D @playwright/test
    pnpm exec playwright install
fi

# Run tests based on hardware availability
if [ "$HARDWARE_AVAILABLE" = true ]; then
    echo -e "\n${GREEN}Running full test suite with hardware...${NC}"
    pnpm exec playwright test webserial.spec.ts --headed
else
    echo -e "\n${YELLOW}Running mock tests only...${NC}"
    pnpm exec playwright test webserial.spec.ts --grep-invert @hardware
fi

# Generate report
echo -e "\n${GREEN}Generating test report...${NC}"
pnpm exec playwright show-report

echo -e "\n${GREEN}Test Summary:${NC}"
echo "- Chrome/Edge: WebSerial API tested"
echo "- Firefox/Safari: Fallback behavior verified"
if [ "$HARDWARE_AVAILABLE" = true ]; then
    echo "- Hardware: ESP32 flashing tested"
fi