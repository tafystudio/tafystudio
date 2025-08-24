module.exports = function(RED) {
    const axios = require('axios');
    
    function TafyCameraDiscoveryNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.discoveryUrl = config.discoveryUrl || 'http://localhost:8080';
        this.autoDiscover = config.autoDiscover === true;
        this.discoveryInterval = parseInt(config.discoveryInterval) || 30000; // 30 seconds
        this.outputFormat = config.outputFormat || 'full'; // full, simple, count
        
        // State
        let discoveryTimer = null;
        let lastDiscoveryResult = null;
        
        // Perform discovery
        async function discover() {
            node.status({ fill: 'yellow', shape: 'ring', text: 'Discovering...' });
            
            try {
                const response = await axios.get(`${node.discoveryUrl}/api/v1/discovery`, {
                    timeout: 10000
                });
                
                lastDiscoveryResult = response.data;
                
                // Format output based on configuration
                let output;
                switch (node.outputFormat) {
                    case 'simple':
                        // Simple array of device paths
                        output = (response.data.cameras || []).map(cam => ({
                            device: cam.device,
                            name: cam.name,
                            formats: cam.formats ? cam.formats.map(f => f.name) : []
                        }));
                        break;
                        
                    case 'count':
                        // Just the count
                        output = {
                            count: response.data.camera_count || 0,
                            devices: (response.data.cameras || []).map(cam => cam.device)
                        };
                        break;
                        
                    case 'full':
                    default:
                        // Full discovery data
                        output = response.data;
                        break;
                }
                
                const msg = {
                    payload: output,
                    topic: 'camera/discovery',
                    _msgid: RED.util.generateId()
                };
                
                node.send(msg);
                
                const count = response.data.camera_count || 0;
                node.status({ 
                    fill: 'green', 
                    shape: 'dot', 
                    text: `Found ${count} camera${count !== 1 ? 's' : ''}`
                });
                
            } catch (error) {
                const errorMsg = error.response ? 
                    `HTTP ${error.response.status}` : 
                    error.code || error.message;
                
                node.error(`Discovery failed: ${errorMsg}`);
                node.status({ fill: 'red', shape: 'dot', text: errorMsg });
                
                // Send error message
                node.send({
                    payload: null,
                    error: errorMsg,
                    topic: 'camera/discovery/error',
                    _msgid: RED.util.generateId()
                });
            }
        }
        
        // Find best camera from discovery results
        function findBestCamera() {
            if (!lastDiscoveryResult || !lastDiscoveryResult.cameras) {
                return null;
            }
            
            const cameras = lastDiscoveryResult.cameras;
            
            // Prefer cameras with MJPEG support
            for (const camera of cameras) {
                if (camera.formats && camera.formats.some(f => 
                    f.name && (f.name.includes('MJPEG') || f.name.includes('Motion-JPEG'))
                )) {
                    return camera;
                }
            }
            
            // Return first available camera
            return cameras[0] || null;
        }
        
        // Start auto-discovery
        function startAutoDiscovery() {
            if (discoveryTimer) {
                clearInterval(discoveryTimer);
            }
            
            // Initial discovery
            discover();
            
            // Periodic discovery
            discoveryTimer = setInterval(() => {
                discover();
            }, node.discoveryInterval);
        }
        
        // Stop auto-discovery
        function stopAutoDiscovery() {
            if (discoveryTimer) {
                clearInterval(discoveryTimer);
                discoveryTimer = null;
            }
        }
        
        // Handle input messages
        node.on('input', async (msg) => {
            const command = msg.payload || 'discover';
            
            if (command === 'discover' || command === true) {
                await discover();
            } else if (command === 'best') {
                // Find and output best camera
                const best = findBestCamera();
                node.send({
                    payload: best,
                    topic: 'camera/best',
                    _msgid: RED.util.generateId()
                });
            } else if (command === 'start') {
                startAutoDiscovery();
            } else if (command === 'stop') {
                stopAutoDiscovery();
                node.status({});
            } else if (typeof command === 'object' && command.command) {
                // Handle command object
                switch (command.command) {
                    case 'discover':
                        await discover();
                        break;
                    case 'best':
                        const best = findBestCamera();
                        node.send({
                            payload: best,
                            topic: 'camera/best',
                            _msgid: RED.util.generateId()
                        });
                        break;
                    case 'start':
                        startAutoDiscovery();
                        break;
                    case 'stop':
                        stopAutoDiscovery();
                        node.status({});
                        break;
                }
            }
        });
        
        // Clean up on node removal
        node.on('close', (done) => {
            stopAutoDiscovery();
            done();
        });
        
        // Auto-start if configured
        if (node.autoDiscover) {
            startAutoDiscovery();
        } else {
            node.status({});
        }
    }
    
    RED.nodes.registerType('tafy-camera-discovery', TafyCameraDiscoveryNode);
}