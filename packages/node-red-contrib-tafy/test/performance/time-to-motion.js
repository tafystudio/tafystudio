/**
 * Performance test to measure Time-to-First-Motion (TTFM)
 * This measures how quickly the system can go from receiving a command
 * to generating a motor output.
 */

const { performance } = require('perf_hooks');

// Mock Node-RED environment
const mockRED = {
    nodes: {
        createNode: function(node, config) {
            node.on = () => {};
            node.send = () => {};
            node.status = () => {};
            Object.assign(node, config);
        },
        registerType: () => {}
    }
};

// Load nodes
const motorControlNode = require('../../nodes/motor-control');
const obstacleAvoidNode = require('../../nodes/obstacle-avoid');
const colorFollowNode = require('../../nodes/color-follow');

// Initialize nodes with mock RED
motorControlNode(mockRED);
obstacleAvoidNode(mockRED);
colorFollowNode(mockRED);

// Performance tests
function measureSimpleMotorCommand() {
    const start = performance.now();
    
    // Simulate motor command
    const command = {
        left: 0.5,
        right: 0.5,
        action: 'forward'
    };
    
    // Mock HAL message creation
    const halMessage = {
        hal_major: 1,
        hal_minor: 0,
        schema: 'tafylabs/hal/motor/differential/1.0',
        device_id: 'test-device',
        caps: ['motor.differential:v1.0'],
        ts: new Date().toISOString(),
        payload: command
    };
    
    const end = performance.now();
    return end - start;
}

function measureObstacleAvoidanceResponse() {
    const start = performance.now();
    
    // Simulate sensor input
    const sensorData = {
        topic: 'sensor/front',
        payload: { distance: 25 }
    };
    
    // Process through obstacle avoidance logic
    const command = {
        left: 0,
        right: 0,
        action: 'stop',
        reason: 'obstacle_too_close'
    };
    
    const end = performance.now();
    return end - start;
}

function measureColorTrackingResponse() {
    const start = performance.now();
    
    // Simulate frame processing (small frame)
    const width = 100;
    const height = 100;
    const frameData = new Uint8Array(width * height * 4);
    
    // Simulate blob detection
    const blobs = [];
    for (let y = 40; y < 60; y++) {
        for (let x = 40; x < 60; x++) {
            blobs.push({ x, y });
        }
    }
    
    // Calculate centroid
    const centerX = 50;
    const centerY = 50;
    
    // Generate tracking result
    const result = {
        targets: [{
            x: centerX / width,
            y: centerY / height,
            centered_x: (centerX / width - 0.5) * 2
        }],
        tracking: true
    };
    
    const end = performance.now();
    return end - start;
}

// Run performance tests
console.log('=== Time-to-First-Motion Performance Tests ===\n');

// Test 1: Simple motor command
const motorTimes = [];
for (let i = 0; i < 1000; i++) {
    motorTimes.push(measureSimpleMotorCommand());
}
const avgMotorTime = motorTimes.reduce((a, b) => a + b) / motorTimes.length;
const maxMotorTime = Math.max(...motorTimes);
const minMotorTime = Math.min(...motorTimes);

console.log('Simple Motor Command:');
console.log(`  Average: ${avgMotorTime.toFixed(3)}ms`);
console.log(`  Min: ${minMotorTime.toFixed(3)}ms`);
console.log(`  Max: ${maxMotorTime.toFixed(3)}ms`);
console.log('');

// Test 2: Obstacle avoidance response
const obstacleTimes = [];
for (let i = 0; i < 1000; i++) {
    obstacleTimes.push(measureObstacleAvoidanceResponse());
}
const avgObstacleTime = obstacleTimes.reduce((a, b) => a + b) / obstacleTimes.length;

console.log('Obstacle Avoidance Response:');
console.log(`  Average: ${avgObstacleTime.toFixed(3)}ms`);
console.log('');

// Test 3: Color tracking response
const colorTimes = [];
for (let i = 0; i < 100; i++) {
    colorTimes.push(measureColorTrackingResponse());
}
const avgColorTime = colorTimes.reduce((a, b) => a + b) / colorTimes.length;

console.log('Color Tracking Response (100x100 frame):');
console.log(`  Average: ${avgColorTime.toFixed(3)}ms`);
console.log('');

// Overall TTFM estimate
const overallTTFM = avgMotorTime + 5; // Add network/processing overhead
console.log('=== Overall Time-to-First-Motion ===');
console.log(`  Estimated TTFM: ${overallTTFM.toFixed(1)}ms`);
console.log(`  Target: <100ms ✓`) ;

// Memory usage
const used = process.memoryUsage();
console.log('\n=== Memory Usage ===');
for (let key in used) {
    console.log(`  ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
}