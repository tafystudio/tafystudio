module.exports = function(RED) {
    function TafyJoystickUINode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.size = parseInt(config.size) || 200;
        this.returnToCenter = config.returnToCenter !== false;
        this.outputMode = config.outputMode || 'differential';
        this.deadzone = parseFloat(config.deadzone) || 0.1;
        this.maxSpeed = parseFloat(config.maxSpeed) || 1.0;
        
        // Generate unique ID for this instance
        const widgetId = 'joystick_' + node.id.replace(/\./g, '_');
        
        // Create the joystick widget HTML
        const html = `
        <div id="${widgetId}" class="tafy-joystick-container" style="width:${node.size}px; height:${node.size}px; margin:auto;">
            <canvas id="${widgetId}_canvas" width="${node.size}" height="${node.size}" style="border:2px solid #333; border-radius:50%; background:#f0f0f0;"></canvas>
        </div>
        <script>
        (function() {
            const canvas = document.getElementById('${widgetId}_canvas');
            const ctx = canvas.getContext('2d');
            const size = ${node.size};
            const center = size / 2;
            const maxRadius = size / 2 - 20;
            const deadzone = ${node.deadzone};
            const returnToCenter = ${node.returnToCenter};
            
            let isDragging = false;
            let knobX = center;
            let knobY = center;
            let lastOutput = null;
            
            // Draw joystick
            function draw() {
                ctx.clearRect(0, 0, size, size);
                
                // Draw base circle
                ctx.beginPath();
                ctx.arc(center, center, maxRadius, 0, 2 * Math.PI);
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw center cross
                ctx.beginPath();
                ctx.moveTo(center - 10, center);
                ctx.lineTo(center + 10, center);
                ctx.moveTo(center, center - 10);
                ctx.lineTo(center, center + 10);
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Draw deadzone circle
                if (deadzone > 0) {
                    ctx.beginPath();
                    ctx.arc(center, center, maxRadius * deadzone, 0, 2 * Math.PI);
                    ctx.strokeStyle = '#ddd';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                
                // Draw knob
                ctx.beginPath();
                ctx.arc(knobX, knobY, 20, 0, 2 * Math.PI);
                ctx.fillStyle = isDragging ? '#4CAF50' : '#2196F3';
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Calculate joystick position
            function updatePosition(x, y) {
                const dx = x - center;
                const dy = y - center;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= maxRadius) {
                    knobX = x;
                    knobY = y;
                } else {
                    // Constrain to circle
                    const angle = Math.atan2(dy, dx);
                    knobX = center + Math.cos(angle) * maxRadius;
                    knobY = center + Math.sin(angle) * maxRadius;
                }
                
                draw();
                sendOutput();
            }
            
            // Send output
            function sendOutput() {
                const dx = (knobX - center) / maxRadius;
                const dy = (knobY - center) / maxRadius;
                
                // Apply deadzone
                let x = dx;
                let y = dy;
                const magnitude = Math.sqrt(x * x + y * y);
                
                if (magnitude < deadzone) {
                    x = 0;
                    y = 0;
                } else if (deadzone > 0) {
                    // Scale to maintain full range after deadzone
                    const scale = (magnitude - deadzone) / (1 - deadzone) / magnitude;
                    x *= scale;
                    y *= scale;
                }
                
                // Create output based on mode
                let output;
                if ('${node.outputMode}' === 'differential') {
                    const forward = -y; // Invert Y for forward
                    const turn = x;
                    const left = Math.max(-1, Math.min(1, forward + turn));
                    const right = Math.max(-1, Math.min(1, forward - turn));
                    
                    output = {
                        left: left * ${node.maxSpeed},
                        right: right * ${node.maxSpeed},
                        forward: forward * ${node.maxSpeed},
                        turn: turn * ${node.maxSpeed}
                    };
                } else {
                    output = {
                        x: x * ${node.maxSpeed},
                        y: -y * ${node.maxSpeed}, // Invert Y
                        magnitude: Math.min(1, magnitude) * ${node.maxSpeed}
                    };
                }
                
                // Only send if changed
                const outputStr = JSON.stringify(output);
                if (outputStr !== lastOutput) {
                    lastOutput = outputStr;
                    window.tafyJoystickSend('${node.id}', output);
                }
            }
            
            // Mouse events
            canvas.addEventListener('mousedown', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                isDragging = true;
                updatePosition(x, y);
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    updatePosition(x, y);
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    if (returnToCenter) {
                        knobX = center;
                        knobY = center;
                        draw();
                        sendOutput();
                    }
                }
            });
            
            // Touch events
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                isDragging = true;
                updatePosition(x, y);
            });
            
            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (isDragging && e.touches.length > 0) {
                    const rect = canvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;
                    updatePosition(x, y);
                }
            });
            
            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (isDragging) {
                    isDragging = false;
                    if (returnToCenter) {
                        knobX = center;
                        knobY = center;
                        draw();
                        sendOutput();
                    }
                }
            });
            
            // Initial draw
            draw();
        })();
        </script>
        `;
        
        // Store the HTML for the UI node
        node.html = html;
        
        // This would typically integrate with Node-RED's dashboard
        // For now, we'll set up the message passing
        if (RED.comms) {
            // Register handler for joystick data
            RED.comms.subscribe('joystick/' + node.id, function(topic, data) {
                node.send({
                    payload: data,
                    topic: 'joystick/input'
                });
            });
        }
        
        // Clean up
        node.on('close', () => {
            if (RED.comms) {
                RED.comms.unsubscribe('joystick/' + node.id);
            }
        });
    }
    
    RED.nodes.registerType('tafy-joystick-ui', TafyJoystickUINode);
    
    // Register UI widget
    if (RED.plugins) {
        RED.plugins.registerPlugin('tafy-joystick-ui', {
            type: 'tafy-joystick-ui',
            widget: true
        });
    }
};