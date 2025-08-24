module.exports = function(RED) {
    const axios = require('axios');
    
    function TafyCameraSnapshotNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.cameraUrl = config.cameraUrl || 'http://localhost:8080';
        this.outputType = config.outputType || 'buffer'; // buffer, base64, url
        this.includeMetadata = config.includeMetadata === true;
        
        // Take a snapshot
        async function takeSnapshot() {
            node.status({ fill: 'yellow', shape: 'dot', text: 'Capturing...' });
            
            try {
                const snapshotUrl = `${node.cameraUrl}/snapshot`;
                
                if (node.outputType === 'url') {
                    // Just output the URL
                    const msg = {
                        payload: snapshotUrl,
                        topic: 'camera/snapshot',
                        _msgid: RED.util.generateId()
                    };
                    
                    if (node.includeMetadata) {
                        msg.metadata = {
                            timestamp: Date.now(),
                            camera: node.cameraUrl,
                            type: 'url'
                        };
                    }
                    
                    node.send(msg);
                    node.status({ fill: 'green', shape: 'dot', text: 'URL sent' });
                    
                } else {
                    // Fetch the actual image
                    const response = await axios.get(snapshotUrl, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    
                    let payload;
                    if (node.outputType === 'base64') {
                        payload = Buffer.from(response.data).toString('base64');
                    } else {
                        payload = Buffer.from(response.data);
                    }
                    
                    const msg = {
                        payload: payload,
                        topic: 'camera/snapshot',
                        _msgid: RED.util.generateId()
                    };
                    
                    if (node.includeMetadata) {
                        msg.metadata = {
                            timestamp: Date.now(),
                            camera: node.cameraUrl,
                            type: node.outputType,
                            size: response.data.byteLength,
                            contentType: response.headers['content-type'] || 'image/jpeg'
                        };
                    }
                    
                    node.send(msg);
                    node.status({ fill: 'green', shape: 'dot', text: `Captured (${Math.round(response.data.byteLength / 1024)}KB)` });
                }
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    node.status({});
                }, 3000);
                
            } catch (error) {
                const errorMsg = error.response ? 
                    `HTTP ${error.response.status}: ${error.response.statusText}` : 
                    error.message;
                
                node.error(`Failed to capture snapshot: ${errorMsg}`);
                node.status({ fill: 'red', shape: 'dot', text: errorMsg });
                
                // Send error message
                node.send({
                    payload: null,
                    error: errorMsg,
                    topic: 'camera/snapshot/error',
                    _msgid: RED.util.generateId()
                });
            }
        }
        
        // Get camera info
        async function getCameraInfo() {
            try {
                const response = await axios.get(`${node.cameraUrl}/api/v1/info`, {
                    timeout: 5000
                });
                
                node.send({
                    payload: response.data,
                    topic: 'camera/info',
                    _msgid: RED.util.generateId()
                });
                
            } catch (error) {
                node.error(`Failed to get camera info: ${error.message}`);
            }
        }
        
        // Handle input messages
        node.on('input', async (msg) => {
            const command = msg.payload || 'snapshot';
            
            if (command === 'snapshot' || command === true) {
                await takeSnapshot();
            } else if (command === 'info') {
                await getCameraInfo();
            } else if (typeof command === 'object' && command.command) {
                // Handle command object
                switch (command.command) {
                    case 'snapshot':
                        await takeSnapshot();
                        break;
                    case 'info':
                        await getCameraInfo();
                        break;
                    default:
                        node.warn(`Unknown command: ${command.command}`);
                }
            }
        });
        
        // Initialize status
        node.status({});
    }
    
    RED.nodes.registerType('tafy-camera-snapshot', TafyCameraSnapshotNode);
}