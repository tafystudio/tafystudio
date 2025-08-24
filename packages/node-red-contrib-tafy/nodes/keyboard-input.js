module.exports = function(RED) {
    function TafyKeyboardInputNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.keyMap = config.keyMap || 'wasd'; // wasd, arrows, custom
        this.outputMode = config.outputMode || 'differential';
        this.speed = parseFloat(config.speed) || 0.5;
        this.turnSpeed = parseFloat(config.turnSpeed) || 0.5;
        this.acceleration = parseFloat(config.acceleration) || 0.1;
        this.customKeys = config.customKeys || {};
        
        // State
        let keysPressed = {};
        let currentSpeed = { forward: 0, turn: 0 };
        let updateTimer = null;
        let isActive = false;
        
        // Key mappings
        const KEY_MAPS = {
            wasd: {
                forward: 'w',
                backward: 's',
                left: 'a',
                right: 'd',
                boost: 'shift',
                stop: ' '
            },
            arrows: {
                forward: 'arrowup',
                backward: 'arrowdown',
                left: 'arrowleft',
                right: 'arrowright',
                boost: 'shift',
                stop: ' '
            }
        };
        
        // Get active key mapping
        function getKeyMap() {
            if (node.keyMap === 'custom') {
                return node.customKeys;
            }
            return KEY_MAPS[node.keyMap] || KEY_MAPS.wasd;
        }
        
        // Update movement based on keys pressed
        function updateMovement() {
            const keyMap = getKeyMap();
            const boost = keysPressed[keyMap.boost] ? 2.0 : 1.0;
            
            // Target speeds based on keys
            let targetForward = 0;
            let targetTurn = 0;
            
            if (keysPressed[keyMap.forward]) {
                targetForward = node.speed * boost;
            } else if (keysPressed[keyMap.backward]) {
                targetForward = -node.speed * boost;
            }
            
            if (keysPressed[keyMap.left]) {
                targetTurn = -node.turnSpeed;
            } else if (keysPressed[keyMap.right]) {
                targetTurn = node.turnSpeed;
            }
            
            if (keysPressed[keyMap.stop]) {
                targetForward = 0;
                targetTurn = 0;
                currentSpeed.forward = 0;
                currentSpeed.turn = 0;
            }
            
            // Apply acceleration
            if (node.acceleration > 0) {
                const accel = node.acceleration;
                
                // Forward/backward
                if (Math.abs(targetForward - currentSpeed.forward) > accel) {
                    currentSpeed.forward += Math.sign(targetForward - currentSpeed.forward) * accel;
                } else {
                    currentSpeed.forward = targetForward;
                }
                
                // Turn
                if (Math.abs(targetTurn - currentSpeed.turn) > accel) {
                    currentSpeed.turn += Math.sign(targetTurn - currentSpeed.turn) * accel;
                } else {
                    currentSpeed.turn = targetTurn;
                }
            } else {
                currentSpeed.forward = targetForward;
                currentSpeed.turn = targetTurn;
            }
            
            // Generate output
            let output;
            if (node.outputMode === 'differential') {
                const left = Math.max(-1, Math.min(1, currentSpeed.forward + currentSpeed.turn));
                const right = Math.max(-1, Math.min(1, currentSpeed.forward - currentSpeed.turn));
                
                output = {
                    left: left,
                    right: right,
                    forward: currentSpeed.forward,
                    turn: currentSpeed.turn
                };
            } else {
                output = {
                    forward: currentSpeed.forward,
                    turn: currentSpeed.turn,
                    boost: boost > 1
                };
            }
            
            // Send output
            node.send({
                payload: output,
                topic: 'keyboard/input',
                keys: Object.keys(keysPressed).filter(k => keysPressed[k])
            });
            
            // Update status
            if (currentSpeed.forward !== 0 || currentSpeed.turn !== 0) {
                const direction = [];
                if (currentSpeed.forward > 0) {
                    direction.push('↑');
                }
                if (currentSpeed.forward < 0) {
                    direction.push('↓');
                }
                if (currentSpeed.turn < 0) {
                    direction.push('←');
                }
                if (currentSpeed.turn > 0) {
                    direction.push('→');
                }
                node.status({ 
                    fill: 'green', 
                    shape: 'dot', 
                    text: direction.join('') + (boost > 1 ? ' BOOST' : '')
                });
            } else {
                node.status({ fill: 'yellow', shape: 'dot', text: 'Ready' });
            }
        }
        
        // Handle keyboard events
        function handleKeyDown(event) {
            const key = event.key.toLowerCase();
            if (!keysPressed[key]) {
                keysPressed[key] = true;
                event.preventDefault();
            }
        }
        
        function handleKeyUp(event) {
            const key = event.key.toLowerCase();
            delete keysPressed[key];
            event.preventDefault();
        }
        
        // Start keyboard capture
        function startCapture() {
            if (isActive) {
                return;
            }
            
            isActive = true;
            keysPressed = {};
            currentSpeed = { forward: 0, turn: 0 };
            
            // Add event listeners
            if (typeof document !== 'undefined') {
                document.addEventListener('keydown', handleKeyDown);
                document.addEventListener('keyup', handleKeyUp);
                
                // Start update loop
                updateTimer = setInterval(updateMovement, 50); // 20Hz update
                
                node.status({ fill: 'yellow', shape: 'dot', text: 'Ready' });
                node.log('Keyboard capture started');
            } else {
                node.error('Keyboard input requires browser context');
                node.status({ fill: 'red', shape: 'ring', text: 'No browser' });
            }
        }
        
        // Stop keyboard capture
        function stopCapture() {
            if (!isActive) {
                return;
            }
            
            isActive = false;
            keysPressed = {};
            currentSpeed = { forward: 0, turn: 0 };
            
            // Remove event listeners
            if (typeof document !== 'undefined') {
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('keyup', handleKeyUp);
            }
            
            // Stop update loop
            if (updateTimer) {
                clearInterval(updateTimer);
                updateTimer = null;
            }
            
            // Send stop command
            node.send({
                payload: { left: 0, right: 0, forward: 0, turn: 0 },
                topic: 'keyboard/stop'
            });
            
            node.status({});
            node.log('Keyboard capture stopped');
        }
        
        // Handle input messages
        node.on('input', (msg) => {
            if (msg.payload === 'start' || msg.payload === true) {
                startCapture();
            } else if (msg.payload === 'stop' || msg.payload === false) {
                stopCapture();
            }
        });
        
        // Clean up
        node.on('close', () => {
            stopCapture();
        });
        
        // Warn if not in browser context
        if (typeof document === 'undefined') {
            node.warn('Keyboard input requires browser context (dashboard)');
            node.status({ fill: 'red', shape: 'ring', text: 'No browser context' });
        }
    }
    
    RED.nodes.registerType('tafy-keyboard-input', TafyKeyboardInputNode);
};