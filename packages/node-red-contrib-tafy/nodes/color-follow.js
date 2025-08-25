module.exports = function(RED) {
    function TafyColorFollowNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.followMode = config.followMode || 'position'; // position, size, both
        this.targetSize = parseFloat(config.targetSize) || 0.2; // 0-1 normalized
        this.forwardGain = parseFloat(config.forwardGain) || 2.0;
        this.turnGain = parseFloat(config.turnGain) || 0.5;
        this.maxSpeed = parseFloat(config.maxSpeed) || 0.5;
        this.minSpeed = parseFloat(config.minSpeed) || 0.1;
        this.deadZone = parseFloat(config.deadZone) || 0.05;
        this.smoothing = parseFloat(config.smoothing) || 0.7;
        
        // State
        let lastTarget = null;
        let lastCommand = {
            left: 0,
            right: 0
        };
        let isFollowing = false;
        
        // Calculate following command from target position
        function calculateFollowCommand(target) {
            let turnSpeed = 0;
            let forwardSpeed = 0;
            
            // Position-based turning (keep target centered)
            if (node.followMode === 'position' || node.followMode === 'both') {
                // centered_x is -1 to 1, where 0 is centered
                if (Math.abs(target.centered_x) > node.deadZone) {
                    // Turn proportional to how far off-center the target is
                    turnSpeed = target.centered_x * node.turnGain;
                }
            }
            
            // Size-based forward/backward (maintain distance)
            if (node.followMode === 'size' || node.followMode === 'both') {
                const sizeError = node.targetSize - target.width;
                if (Math.abs(sizeError) > node.deadZone) {
                    // Move forward if target too small, backward if too large
                    forwardSpeed = sizeError * node.forwardGain;
                    forwardSpeed = Math.max(-node.maxSpeed, Math.min(node.maxSpeed, forwardSpeed));
                    
                    // Don't go below minimum speed when moving forward
                    if (forwardSpeed > 0 && forwardSpeed < node.minSpeed) {
                        forwardSpeed = node.minSpeed;
                    } else if (forwardSpeed < 0 && forwardSpeed > -node.minSpeed) {
                        forwardSpeed = -node.minSpeed;
                    }
                }
            } else if (node.followMode === 'position') {
                // In position-only mode, move forward slowly
                forwardSpeed = node.minSpeed;
            }
            
            // Calculate differential drive speeds
            let leftSpeed = forwardSpeed - turnSpeed;
            let rightSpeed = forwardSpeed + turnSpeed;
            
            // Normalize if exceeding max speed
            const maxMagnitude = Math.max(Math.abs(leftSpeed), Math.abs(rightSpeed));
            if (maxMagnitude > node.maxSpeed) {
                const scale = node.maxSpeed / maxMagnitude;
                leftSpeed *= scale;
                rightSpeed *= scale;
            }
            
            return {
                left: leftSpeed,
                right: rightSpeed,
                forward: forwardSpeed,
                turn: turnSpeed
            };
        }
        
        // Handle input messages
        node.on('input', (msg) => {
            // Handle color tracking results
            if (msg.topic === 'color/tracking') {
                const trackingData = msg.payload;
                
                if (trackingData.tracking && trackingData.targets.length > 0) {
                    // Use the first (largest) target
                    const target = trackingData.targets[0];
                    
                    // Apply smoothing if we have a previous target
                    if (lastTarget) {
                        target.centered_x = lastTarget.centered_x * node.smoothing + 
                                          target.centered_x * (1 - node.smoothing);
                        target.width = lastTarget.width * node.smoothing + 
                                     target.width * (1 - node.smoothing);
                    }
                    lastTarget = target;
                    
                    // Calculate motor commands
                    const command = calculateFollowCommand(target);
                    
                    // Apply command smoothing
                    command.left = lastCommand.left * node.smoothing + 
                                 command.left * (1 - node.smoothing);
                    command.right = lastCommand.right * node.smoothing + 
                                  command.right * (1 - node.smoothing);
                    lastCommand = command;
                    
                    // Send motor command
                    const output = {
                        left: command.left,
                        right: command.right,
                        action: 'follow',
                        target: {
                            id: target.id,
                            x: target.x,
                            y: target.y,
                            centered_x: target.centered_x,
                            width: target.width,
                            confidence: target.confidence
                        },
                        control: {
                            forward: command.forward,
                            turn: command.turn
                        },
                        timestamp: Date.now()
                    };
                    
                    // Update status
                    isFollowing = true;
                    node.status({
                        fill: 'green',
                        shape: 'dot',
                        text: `Following (F:${command.forward.toFixed(2)}, T:${command.turn.toFixed(2)})`
                    });
                    
                    // Send output
                    node.send({
                        payload: output,
                        topic: 'motor/command'
                    });
                    
                } else if (trackingData.lost || !trackingData.tracking) {
                    // Target lost
                    if (isFollowing) {
                        isFollowing = false;
                        lastTarget = null;
                        
                        // Send stop command
                        const stopCommand = {
                            left: 0,
                            right: 0,
                            action: 'stop',
                            reason: 'target_lost',
                            timestamp: Date.now()
                        };
                        
                        node.send({
                            payload: stopCommand,
                            topic: 'motor/command'
                        });
                        
                        node.status({
                            fill: 'yellow',
                            shape: 'ring',
                            text: 'Target lost'
                        });
                    }
                }
            } else if (msg.topic === 'pid/output') {
                // Handle PID output (alternative input method)
                // Convert PID output to motor commands
                const pid = msg.payload;
                const turnSpeed = pid.output * node.turnGain;
                const forwardSpeed = node.minSpeed;
                
                const output = {
                    left: forwardSpeed - turnSpeed,
                    right: forwardSpeed + turnSpeed,
                    action: 'pid_follow',
                    pid: {
                        error: pid.error,
                        output: pid.output
                    },
                    timestamp: Date.now()
                };
                
                node.send({
                    payload: output,
                    topic: 'motor/command'
                });
            }
        });
        
        // Initialize
        node.status({
            fill: 'grey',
            shape: 'ring',
            text: `Ready (${node.followMode} mode)`
        });
    }
    
    RED.nodes.registerType('tafy-color-follow', TafyColorFollowNode);
};