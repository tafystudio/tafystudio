module.exports = function(RED) {
    function TafyObstacleAvoidNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.mode = config.mode || 'simple'; // simple, advanced, learning
        this.stopDistance = parseFloat(config.stopDistance) || 30; // cm
        this.slowDistance = parseFloat(config.slowDistance) || 60; // cm
        this.turnThreshold = parseFloat(config.turnThreshold) || 40; // cm
        this.backupDistance = parseFloat(config.backupDistance) || 20; // cm
        this.turnDirection = config.turnDirection || 'auto'; // auto, left, right
        this.maxSpeed = parseFloat(config.maxSpeed) || 0.5;
        this.turnSpeed = parseFloat(config.turnSpeed) || 0.3;
        this.sensorTimeout = parseInt(config.sensorTimeout) || 500; // ms
        
        // State
        const sensorData = {
            front: { distance: Infinity, timestamp: 0 },
            left: { distance: Infinity, timestamp: 0 },
            right: { distance: Infinity, timestamp: 0 },
            back: { distance: Infinity, timestamp: 0 }
        };
        let isAvoiding = false;
        let avoidanceState = 'scanning'; // scanning, stopping, backing, turning, clear
        let overrideActive = false;
        
        // Update sensor data
        function updateSensor(position, distance) {
            if (sensorData[position]) {
                sensorData[position] = {
                    distance: distance,
                    timestamp: Date.now()
                };
            }
        }
        
        // Check if sensor data is fresh
        function isSensorFresh(position) {
            const age = Date.now() - sensorData[position].timestamp;
            return age < node.sensorTimeout;
        }
        
        // Get minimum distance from all fresh sensors
        function _getMinDistance() {
            let minDist = Infinity;
            for (const pos in sensorData) {
                if (isSensorFresh(pos) && sensorData[pos].distance < minDist) {
                    minDist = sensorData[pos].distance;
                }
            }
            return minDist;
        }
        
        // Simple obstacle avoidance logic
        function simpleAvoidance() {
            const front = sensorData.front.distance;
            const left = sensorData.left.distance;
            const right = sensorData.right.distance;
            
            // Check if we need to stop
            if (front <= node.stopDistance) {
                avoidanceState = 'stopping';
                return {
                    left: 0,
                    right: 0,
                    action: 'stop',
                    reason: 'obstacle_too_close'
                };
            }
            
            // Check if we need to slow down
            if (front <= node.slowDistance) {
                const speedFactor = (front - node.stopDistance) / (node.slowDistance - node.stopDistance);
                const speed = node.maxSpeed * speedFactor;
                
                // Check if we should turn
                if (front <= node.turnThreshold) {
                    avoidanceState = 'turning';
                    
                    // Determine turn direction
                    let turnDir = node.turnDirection;
                    if (turnDir === 'auto') {
                        // Turn toward side with more space
                        turnDir = (left > right) ? 'left' : 'right';
                    }
                    
                    if (turnDir === 'left') {
                        return {
                            left: -node.turnSpeed,
                            right: node.turnSpeed,
                            action: 'turn_left',
                            reason: 'avoiding_obstacle'
                        };
                    } else {
                        return {
                            left: node.turnSpeed,
                            right: -node.turnSpeed,
                            action: 'turn_right',
                            reason: 'avoiding_obstacle'
                        };
                    }
                }
                
                // Just slow down
                avoidanceState = 'slowing';
                return {
                    left: speed,
                    right: speed,
                    action: 'slow',
                    reason: 'approaching_obstacle'
                };
            }
            
            // All clear
            avoidanceState = 'clear';
            return null; // No avoidance needed
        }
        
        // Advanced avoidance with state machine
        function advancedAvoidance() {
            const front = sensorData.front.distance;
            const left = sensorData.left.distance;
            const right = sensorData.right.distance;
            const back = sensorData.back.distance;
            
            switch (avoidanceState) {
            case 'scanning':
                if (front <= node.stopDistance) {
                    avoidanceState = 'stopping';
                } else if (front <= node.turnThreshold) {
                    avoidanceState = 'planning';
                }
                break;
                
            case 'stopping':
                // Emergency stop
                return {
                    left: 0,
                    right: 0,
                    action: 'emergency_stop',
                    reason: 'obstacle_detected'
                };
                
            case 'planning':
                // Decide best action
                if (back > node.backupDistance * 2 && front < node.backupDistance) {
                    avoidanceState = 'backing';
                } else if (left > right && left > node.turnThreshold) {
                    avoidanceState = 'turning_left';
                } else if (right > left && right > node.turnThreshold) {
                    avoidanceState = 'turning_right';
                } else if (back > node.backupDistance) {
                    avoidanceState = 'backing';
                } else {
                    avoidanceState = 'stuck';
                }
                break;
                
            case 'backing':
                if (back <= node.backupDistance || front > node.turnThreshold) {
                    avoidanceState = 'planning';
                }
                return {
                    left: -node.maxSpeed * 0.5,
                    right: -node.maxSpeed * 0.5,
                    action: 'backup',
                    reason: 'creating_space'
                };
                
            case 'turning_left':
                if (front > node.slowDistance) {
                    avoidanceState = 'scanning';
                }
                return {
                    left: -node.turnSpeed,
                    right: node.turnSpeed,
                    action: 'turn_left',
                    reason: 'finding_path'
                };
                
            case 'turning_right':
                if (front > node.slowDistance) {
                    avoidanceState = 'scanning';
                }
                return {
                    left: node.turnSpeed,
                    right: -node.turnSpeed,
                    action: 'turn_right',
                    reason: 'finding_path'
                };
                
            case 'stuck':
                // Can't find a way out
                return {
                    left: 0,
                    right: 0,
                    action: 'stuck',
                    reason: 'no_path_found',
                    suggestion: 'manual_intervention_required'
                };
            }
            
            // Default to simple avoidance
            return simpleAvoidance();
        }
        
        // Process obstacle avoidance
        function processAvoidance() {
            if (overrideActive) {
                return null; // Override active, don't avoid
            }
            
            let command;
            if (node.mode === 'advanced') {
                command = advancedAvoidance();
            } else {
                command = simpleAvoidance();
            }
            
            if (command) {
                isAvoiding = true;
                
                // Add metadata
                command.mode = node.mode;
                command.state = avoidanceState;
                command.sensors = {
                    front: sensorData.front.distance,
                    left: sensorData.left.distance,
                    right: sensorData.right.distance,
                    back: sensorData.back.distance
                };
                
                // Update status
                let statusColor = 'yellow';
                if (command.action === 'emergency_stop' || command.action === 'stuck') {
                    statusColor = 'red';
                } else if (command.action === 'clear') {
                    statusColor = 'green';
                }
                
                node.status({
                    fill: statusColor,
                    shape: 'dot',
                    text: `${command.action} (F:${Math.round(sensorData.front.distance)}cm)`
                });
                
                return command;
            } else {
                if (isAvoiding) {
                    isAvoiding = false;
                    node.status({
                        fill: 'green',
                        shape: 'dot',
                        text: 'Path clear'
                    });
                    
                    // Send clear signal
                    return {
                        action: 'clear',
                        reason: 'path_clear',
                        mode: node.mode,
                        state: avoidanceState
                    };
                }
            }
            
            return null;
        }
        
        // Handle input messages
        node.on('input', (msg) => {
            // Handle sensor data
            if (msg.topic && msg.topic.includes('sensor')) {
                if (msg.payload && typeof msg.payload.distance === 'number') {
                    // Determine sensor position from topic or payload
                    let position = 'front'; // default
                    if (msg.topic.includes('left')) {
                        position = 'left';
                    } else if (msg.topic.includes('right')) {
                        position = 'right';
                    } else if (msg.topic.includes('back')) {
                        position = 'back';
                    } else if (msg.payload.position) {
                        position = msg.payload.position;
                    }
                    
                    updateSensor(position, msg.payload.distance);
                }
            }
            
            // Handle control commands
            if (msg.topic && msg.topic.includes('control')) {
                if (msg.payload === 'override_on') {
                    overrideActive = true;
                    node.status({
                        fill: 'blue',
                        shape: 'ring',
                        text: 'Override active'
                    });
                } else if (msg.payload === 'override_off') {
                    overrideActive = false;
                }
            }
            
            // Process avoidance logic
            const command = processAvoidance();
            if (command) {
                node.send({
                    payload: command,
                    topic: 'obstacle/avoidance',
                    _msgid: msg._msgid
                });
            }
        });
        
        // Initialize
        node.status({
            fill: 'grey',
            shape: 'ring',
            text: 'Waiting for sensor data'
        });
    }
    
    RED.nodes.registerType('tafy-obstacle-avoid', TafyObstacleAvoidNode);
};