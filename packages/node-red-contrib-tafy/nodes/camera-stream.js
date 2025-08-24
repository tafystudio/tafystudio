module.exports = function(RED) {
    const WebSocket = require('ws');
    
    function TafyCameraStreamNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.cameraUrl = config.cameraUrl || 'http://localhost:8080';
        this.streamType = config.streamType || 'mjpeg'; // mjpeg, websocket, webrtc
        this.autoReconnect = config.autoReconnect !== false;
        this.reconnectInterval = parseInt(config.reconnectInterval) || 5000;
        
        // State
        let ws = null;
        let reconnectTimer = null;
        let isConnected = false;
        
        // Update node status
        function updateStatus(status, text) {
            switch (status) {
            case 'connected':
                node.status({ fill: 'green', shape: 'dot', text: text || 'Connected' });
                break;
            case 'connecting':
                node.status({ fill: 'yellow', shape: 'ring', text: text || 'Connecting...' });
                break;
            case 'disconnected':
                node.status({ fill: 'red', shape: 'ring', text: text || 'Disconnected' });
                break;
            case 'error':
                node.status({ fill: 'red', shape: 'dot', text: text || 'Error' });
                break;
            }
        }
        
        // Connect to camera stream
        function connect() {
            updateStatus('connecting');
            
            if (node.streamType === 'mjpeg') {
                // For MJPEG, just output the stream URL
                isConnected = true;
                updateStatus('connected', 'MJPEG Stream');
                
                const streamUrl = `${node.cameraUrl}/stream`;
                node.send({
                    payload: {
                        type: 'mjpeg',
                        url: streamUrl,
                        camera: node.cameraUrl
                    },
                    topic: 'camera/stream'
                });
                
            } else if (node.streamType === 'websocket') {
                // WebSocket connection for frame streaming
                const wsUrl = node.cameraUrl.replace(/^http/, 'ws') + '/ws';
                
                try {
                    ws = new WebSocket(wsUrl);
                    
                    ws.on('open', () => {
                        isConnected = true;
                        updateStatus('connected', 'WebSocket Stream');
                        node.log(`Connected to camera WebSocket: ${wsUrl}`);
                    });
                    
                    ws.on('message', (data) => {
                        // Emit frame data
                        node.send({
                            payload: data,
                            topic: 'camera/frame',
                            _msgid: RED.util.generateId()
                        });
                    });
                    
                    ws.on('error', (err) => {
                        node.error(`WebSocket error: ${err.message}`);
                        updateStatus('error', err.message);
                    });
                    
                    ws.on('close', () => {
                        isConnected = false;
                        updateStatus('disconnected');
                        node.log('WebSocket connection closed');
                        
                        // Auto-reconnect if enabled
                        if (node.autoReconnect && !reconnectTimer) {
                            reconnectTimer = setTimeout(() => {
                                reconnectTimer = null;
                                connect();
                            }, node.reconnectInterval);
                        }
                    });
                    
                } catch (err) {
                    node.error(`Failed to connect: ${err.message}`);
                    updateStatus('error', err.message);
                }
                
            } else if (node.streamType === 'webrtc') {
                // WebRTC connection
                updateStatus('connected', 'WebRTC Ready');
                
                // Output WebRTC signaling URL
                const webrtcUrl = node.cameraUrl.replace(/^http/, 'ws') + '/webrtc';
                node.send({
                    payload: {
                        type: 'webrtc',
                        signalingUrl: webrtcUrl,
                        camera: node.cameraUrl
                    },
                    topic: 'camera/webrtc'
                });
            }
        }
        
        // Disconnect from stream
        function disconnect() {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            
            if (ws) {
                ws.close();
                ws = null;
            }
            
            isConnected = false;
            updateStatus('disconnected');
        }
        
        // Handle input messages
        node.on('input', (msg) => {
            if (msg.payload === 'connect' || msg.payload === true) {
                if (!isConnected) {
                    connect();
                }
            } else if (msg.payload === 'disconnect' || msg.payload === false) {
                disconnect();
            } else if (msg.payload === 'reconnect') {
                disconnect();
                setTimeout(connect, 100);
            }
        });
        
        // Clean up on node removal
        node.on('close', (done) => {
            disconnect();
            done();
        });
        
        // Auto-connect on deploy if configured
        if (config.autoConnect !== false) {
            connect();
        }
    }
    
    RED.nodes.registerType('tafy-camera-stream', TafyCameraStreamNode);
};