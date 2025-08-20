module.exports = function(RED) {
    function TafyMotorControlNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        node.deviceId = config.deviceId;
        node.deviceIdType = config.deviceIdType || "str";
        node.driveType = config.driveType || "differential";
        
        node.on('input', (msg, send, done) => {
            try {
                // Get device ID
                let deviceId = node.deviceId;
                if (node.deviceIdType === 'msg') {
                    deviceId = RED.util.getMessageProperty(msg, node.deviceId);
                } else if (node.deviceIdType === 'flow' || node.deviceIdType === 'global') {
                    deviceId = RED.util.evaluateNodeProperty(node.deviceId, node.deviceIdType, node, msg);
                }
                
                if (!deviceId) {
                    throw new Error("Device ID is required");
                }
                
                // Build HAL message based on drive type
                let halMessage;
                if (node.driveType === "differential") {
                    // Extract speeds from payload
                    let linear = 0;
                    let angular = 0;
                    
                    if (typeof msg.payload === 'object') {
                        linear = msg.payload.linear || msg.payload.x || 0;
                        angular = msg.payload.angular || msg.payload.rotation || msg.payload.z || 0;
                    } else if (Array.isArray(msg.payload) && msg.payload.length >= 2) {
                        linear = msg.payload[0];
                        angular = msg.payload[1];
                    }
                    
                    // Create HAL envelope
                    halMessage = {
                        hal_major: 1,
                        hal_minor: 0,
                        schema: "tafylabs/hal/motor/differential/1.0",
                        device_id: deviceId,
                        caps: ["motor.differential:v1.0"],
                        ts: new Date().toISOString(),
                        payload: {
                            linear_meters_per_sec: linear,
                            angular_rad_per_sec: angular,
                            priority: msg.priority || "normal"
                        }
                    };
                    
                    // Add optional fields
                    if (msg.duration_ms) {
                        halMessage.payload.duration_ms = msg.duration_ms;
                    }
                    if (msg.command_id) {
                        halMessage.payload.command_id = msg.command_id;
                    }
                }
                
                // Send the HAL message
                msg.payload = halMessage;
                msg.topic = `hal.v1.motor.cmd`;
                
                send(msg);
                if (done) done();
                
                // Update node status
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: `sent: ${linear.toFixed(2)}m/s, ${angular.toFixed(2)}rad/s`
                });
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    node.status({});
                }, 3000);
                
            } catch (err) {
                node.error(err, msg);
                node.status({ fill: "red", shape: "ring", text: err.message });
                if (done) done(err);
            }
        });
        
        node.on('close', () => {
            node.status({});
        });
    }
    
    RED.nodes.registerType("tafy-motor-control", TafyMotorControlNode);
}