module.exports = function(RED) {
    const axios = require('axios');
    
    function TafyCameraControlNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.cameraUrl = config.cameraUrl || 'http://localhost:8080';
        this.defaultCommand = config.defaultCommand || 'status';
        
        // Send camera control command
        async function sendCommand(command, _parameters) {
            try {
                // For now, most commands will be future implementations
                // This provides the structure for camera control
                
                switch (command) {
                case 'status':
                    // Get camera status
                    const statusResponse = await axios.get(`${node.cameraUrl}/api/v1/status`, {
                        timeout: 5000
                    });
                        
                    node.send({
                        payload: statusResponse.data,
                        topic: 'camera/status',
                        command: command,
                        _msgid: RED.util.generateId()
                    });
                        
                    node.status({ 
                        fill: 'green', 
                        shape: 'dot', 
                        text: `FPS: ${statusResponse.data.fps || 0}`
                    });
                    break;
                        
                case 'info':
                    // Get camera info
                    const infoResponse = await axios.get(`${node.cameraUrl}/api/v1/info`, {
                        timeout: 5000
                    });
                        
                    node.send({
                        payload: infoResponse.data,
                        topic: 'camera/info',
                        command: command,
                        _msgid: RED.util.generateId()
                    });
                        
                    node.status({ fill: 'green', shape: 'dot', text: 'Info retrieved' });
                    break;
                        
                case 'configure':
                    // Future: Configure camera settings
                    node.warn('Camera configuration not yet implemented');
                    node.status({ fill: 'yellow', shape: 'dot', text: 'Not implemented' });
                    break;
                        
                case 'start':
                case 'stop':
                    // Future: Start/stop camera
                    node.warn(`Camera ${command} command not yet implemented`);
                    node.status({ fill: 'yellow', shape: 'dot', text: 'Not implemented' });
                    break;
                        
                default:
                    node.error(`Unknown command: ${command}`);
                    node.status({ fill: 'red', shape: 'dot', text: 'Unknown command' });
                }
                
            } catch (error) {
                const errorMsg = error.response ? 
                    `HTTP ${error.response.status}` : 
                    error.message;
                
                node.error(`Camera control failed: ${errorMsg}`);
                node.status({ fill: 'red', shape: 'dot', text: errorMsg });
                
                // Send error message
                node.send({
                    payload: null,
                    error: errorMsg,
                    command: command,
                    topic: 'camera/control/error',
                    _msgid: RED.util.generateId()
                });
            }
        }
        
        // Handle input messages
        node.on('input', async (msg) => {
            let command = node.defaultCommand;
            let parameters = {};
            
            if (typeof msg.payload === 'string') {
                command = msg.payload;
            } else if (typeof msg.payload === 'object' && msg.payload !== null) {
                command = msg.payload.command || command;
                parameters = msg.payload.parameters || msg.payload.params || {};
            }
            
            await sendCommand(command, parameters);
        });
        
        // Initialize
        node.status({});
    }
    
    RED.nodes.registerType('tafy-camera-control', TafyCameraControlNode);
};