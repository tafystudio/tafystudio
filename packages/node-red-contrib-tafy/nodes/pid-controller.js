module.exports = function(RED) {
    function TafyPIDControllerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.kp = parseFloat(config.kp) || 1.0;          // Proportional gain
        this.ki = parseFloat(config.ki) || 0.0;          // Integral gain
        this.kd = parseFloat(config.kd) || 0.0;          // Derivative gain
        this.setpoint = parseFloat(config.setpoint) || 0; // Target value
        this.outputMin = parseFloat(config.outputMin) || -1.0;
        this.outputMax = parseFloat(config.outputMax) || 1.0;
        this.integralMax = parseFloat(config.integralMax) || 10.0;
        this.deadband = parseFloat(config.deadband) || 0.0;
        this.sampleTime = parseInt(config.sampleTime) || 100; // ms
        this.mode = config.mode || 'auto'; // auto, manual
        this.direction = config.direction || 'direct'; // direct, reverse
        
        // PID state
        let lastInput = 0;
        let integral = 0;
        let _lastError = 0;
        let lastTime = Date.now();
        let isFirstRun = true;
        let manualOutput = 0;
        
        // Reset PID state
        function reset() {
            integral = 0;
            _lastError = 0;
            lastInput = 0;
            isFirstRun = true;
            lastTime = Date.now();
        }
        
        // Anti-windup clamp
        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }
        
        // Calculate PID output
        function calculatePID(input, setpoint, dt) {
            // Calculate error
            let error = setpoint - input;
            
            // Reverse direction if needed
            if (node.direction === 'reverse') {
                error = -error;
            }
            
            // Apply deadband
            if (Math.abs(error) < node.deadband) {
                error = 0;
            }
            
            // Proportional term
            const pTerm = node.kp * error;
            
            // Integral term with anti-windup
            integral += error * dt;
            integral = clamp(integral, -node.integralMax, node.integralMax);
            const iTerm = node.ki * integral;
            
            // Derivative term with derivative on measurement
            let dTerm = 0;
            if (!isFirstRun) {
                const inputDerivative = (input - lastInput) / dt;
                dTerm = -node.kd * inputDerivative; // Negative because we use derivative on measurement
            }
            
            // Calculate output
            let output = pTerm + iTerm + dTerm;
            
            // Clamp output
            const rawOutput = output;
            output = clamp(output, node.outputMin, node.outputMax);
            
            // Back-calculation anti-windup
            if (output !== rawOutput && node.ki !== 0) {
                integral -= (rawOutput - output) / node.ki * 0.5;
            }
            
            // Update state
            lastInput = input;
            _lastError = error;
            isFirstRun = false;
            
            return {
                output: output,
                error: error,
                pTerm: pTerm,
                iTerm: iTerm,
                dTerm: dTerm,
                integral: integral
            };
        }
        
        // Handle input
        node.on('input', (msg) => {
            const now = Date.now();
            const dt = (now - lastTime) / 1000; // Convert to seconds
            
            // Handle control commands
            if (msg.topic === 'control') {
                if (msg.payload.mode) {
                    node.mode = msg.payload.mode;
                    if (node.mode === 'manual' && msg.payload.output !== undefined) {
                        manualOutput = clamp(msg.payload.output, node.outputMin, node.outputMax);
                    }
                }
                if (msg.payload.reset) {
                    reset();
                }
                if (msg.payload.setpoint !== undefined) {
                    node.setpoint = msg.payload.setpoint;
                }
                if (msg.payload.kp !== undefined) {
                    node.kp = msg.payload.kp;
                }
                if (msg.payload.ki !== undefined) {
                    node.ki = msg.payload.ki;
                }
                if (msg.payload.kd !== undefined) {
                    node.kd = msg.payload.kd;
                }
                return;
            }
            
            // Skip if not enough time has passed
            if (dt < node.sampleTime / 1000 && !isFirstRun) {
                return;
            }
            
            // Get input value
            let input = 0;
            if (typeof msg.payload === 'number') {
                input = msg.payload;
            } else if (typeof msg.payload === 'object' && msg.payload.value !== undefined) {
                input = msg.payload.value;
            }
            
            // Get setpoint (can be overridden by message)
            let setpoint = node.setpoint;
            if (msg.setpoint !== undefined) {
                setpoint = msg.setpoint;
            } else if (typeof msg.payload === 'object' && msg.payload.setpoint !== undefined) {
                setpoint = msg.payload.setpoint;
            }
            
            let output;
            let pidResult;
            
            if (node.mode === 'auto') {
                // Calculate PID
                pidResult = calculatePID(input, setpoint, dt);
                output = pidResult.output;
            } else {
                // Manual mode
                output = manualOutput;
                pidResult = {
                    output: output,
                    error: setpoint - input,
                    pTerm: 0,
                    iTerm: 0,
                    dTerm: 0,
                    integral: integral
                };
            }
            
            // Update time
            lastTime = now;
            
            // Send output
            const result = {
                output: output,
                input: input,
                setpoint: setpoint,
                error: pidResult.error,
                mode: node.mode,
                pid: {
                    p: pidResult.pTerm,
                    i: pidResult.iTerm,
                    d: pidResult.dTerm,
                    integral: pidResult.integral
                },
                timestamp: now
            };
            
            node.send({
                payload: result,
                topic: 'pid/output'
            });
            
            // Update status
            const statusText = `${node.mode} | Out: ${output.toFixed(3)} | Err: ${pidResult.error.toFixed(3)}`;
            node.status({
                fill: node.mode === 'auto' ? 'green' : 'blue',
                shape: 'dot',
                text: statusText
            });
        });
        
        // Initialize
        reset();
        node.status({
            fill: 'grey',
            shape: 'ring',
            text: 'Ready'
        });
    }
    
    RED.nodes.registerType('tafy-pid-controller', TafyPIDControllerNode);
};