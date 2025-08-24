module.exports = function(RED) {
    function TafyGamepadInputNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.deadzone = parseFloat(config.deadzone) || 0.1;
        this.pollInterval = parseInt(config.pollInterval) || 50; // 20Hz default
        this.controllerIndex = parseInt(config.controllerIndex) || 0;
        this.outputMode = config.outputMode || 'differential'; // differential, raw, normalized
        
        // State
        let pollTimer = null;
        let lastState = null;
        let isActive = false;
        
        // Gamepad mapping (Xbox/standard layout)
        const BUTTON_MAP = {
            0: 'a',
            1: 'b', 
            2: 'x',
            3: 'y',
            4: 'lb',
            5: 'rb',
            6: 'lt',
            7: 'rt',
            8: 'back',
            9: 'start',
            10: 'leftStick',
            11: 'rightStick',
            12: 'up',
            13: 'down',
            14: 'left',
            15: 'right',
            16: 'home'
        };
        
        // Apply deadzone to axis value
        function applyDeadzone(value) {
            if (Math.abs(value) < node.deadzone) {
                return 0;
            }
            // Scale the value to maintain full range after deadzone
            const sign = value > 0 ? 1 : -1;
            const magnitude = Math.abs(value);
            return sign * ((magnitude - node.deadzone) / (1 - node.deadzone));
        }
        
        // Convert gamepad state to differential drive commands
        function toDifferentialDrive(axes) {
            const forward = -applyDeadzone(axes[1]); // Left stick Y (inverted)
            const turn = applyDeadzone(axes[0]);     // Left stick X
            
            // Calculate wheel speeds
            const left = Math.max(-1, Math.min(1, forward + turn));
            const right = Math.max(-1, Math.min(1, forward - turn));
            
            return {
                left: left,
                right: right,
                forward: forward,
                turn: turn
            };
        }
        
        // Process gamepad state
        function processGamepad() {
            if (typeof navigator === 'undefined' || !navigator.getGamepads) {
                node.error('Gamepad API not available');
                return;
            }
            
            const gamepads = navigator.getGamepads();
            const gamepad = gamepads[node.controllerIndex];
            
            if (!gamepad) {
                if (isActive) {
                    isActive = false;
                    node.status({ fill: 'red', shape: 'ring', text: 'No gamepad' });
                    node.send({
                        payload: { connected: false },
                        topic: 'gamepad/disconnected'
                    });
                }
                return;
            }
            
            if (!isActive) {
                isActive = true;
                node.status({ fill: 'green', shape: 'dot', text: gamepad.id });
                node.send({
                    payload: { 
                        connected: true,
                        id: gamepad.id,
                        mapping: gamepad.mapping
                    },
                    topic: 'gamepad/connected'
                });
            }
            
            // Build current state
            const currentState = {
                axes: gamepad.axes.slice(),
                buttons: gamepad.buttons.map(b => ({
                    pressed: b.pressed,
                    value: b.value
                })),
                timestamp: gamepad.timestamp
            };
            
            // Check if state changed
            const stateChanged = !lastState || 
                JSON.stringify(currentState) !== JSON.stringify(lastState);
            
            if (stateChanged) {
                let payload;
                
                switch (node.outputMode) {
                case 'differential':
                    payload = toDifferentialDrive(currentState.axes);
                    break;
                    
                case 'normalized':
                    payload = {
                        axes: currentState.axes.map(applyDeadzone),
                        buttons: {}
                    };
                    // Add named buttons
                    currentState.buttons.forEach((btn, idx) => {
                        const name = BUTTON_MAP[idx];
                        if (name && btn.pressed) {
                            payload.buttons[name] = btn.value;
                        }
                    });
                    break;
                    
                case 'raw':
                default:
                    payload = currentState;
                    break;
                }
                
                node.send({
                    payload: payload,
                    topic: 'gamepad/input',
                    _msgid: RED.util.generateId()
                });
                
                lastState = currentState;
            }
        }
        
        // Start polling
        function startPolling() {
            if (pollTimer) {
                return;
            }
            
            node.status({ fill: 'yellow', shape: 'ring', text: 'Waiting for gamepad...' });
            
            pollTimer = setInterval(processGamepad, node.pollInterval);
        }
        
        // Stop polling
        function stopPolling() {
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
            isActive = false;
            lastState = null;
            node.status({});
        }
        
        // Handle input messages
        node.on('input', (msg) => {
            if (msg.payload === 'start' || msg.payload === true) {
                startPolling();
            } else if (msg.payload === 'stop' || msg.payload === false) {
                stopPolling();
            }
        });
        
        // Clean up
        node.on('close', () => {
            stopPolling();
        });
        
        // Note: This node requires browser context
        if (typeof navigator === 'undefined') {
            node.warn('Gamepad node requires browser context (dashboard)');
            node.status({ fill: 'red', shape: 'ring', text: 'No browser context' });
        }
    }
    
    RED.nodes.registerType('tafy-gamepad-input', TafyGamepadInputNode);
};