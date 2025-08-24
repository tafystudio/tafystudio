module.exports = function(RED) {
    const { connect, StringCodec, JSONCodec } = require('nats');
    
    function TafyNatsConfigNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.url = config.url || 'nats://localhost:4222';
        this.user = config.user;
        this.pass = config.pass;
        this.token = config.token;
        this.maxReconnectAttempts = parseInt(config.maxReconnectAttempts) || -1;
        this.reconnectTimeWait = parseInt(config.reconnectTimeWait) || 2000;
        
        // Codecs
        this.sc = StringCodec();
        this.jc = JSONCodec();
        
        // Connection state
        this.nc = null;
        this.connecting = false;
        
        // Connect to NATS
        async function doConnect() {
            if (node.connecting || node.nc) {
                return;
            }
            
            node.connecting = true;
            node.emit('connecting');
            
            try {
                const options = {
                    servers: node.url,
                    maxReconnectAttempts: node.maxReconnectAttempts,
                    reconnectTimeWait: node.reconnectTimeWait,
                    name: `node-red-${node.id}`
                };
                
                // Add authentication if configured
                if (node.token) {
                    options.token = node.token;
                } else if (node.user && node.pass) {
                    options.user = node.user;
                    options.pass = node.pass;
                }
                
                node.nc = await connect(options);
                node.connecting = false;
                
                node.log(`Connected to NATS at ${node.url}`);
                node.emit('connected');
                
                // Monitor connection events
                (async () => {
                    for await (const status of node.nc.status()) {
                        switch (status.type) {
                        case 'disconnect':
                            node.emit('disconnected');
                            break;
                        case 'reconnect':
                            node.emit('connected');
                            break;
                        case 'error':
                            node.error(`NATS error: ${status.data}`);
                            break;
                        }
                    }
                })();
                
            } catch (err) {
                node.connecting = false;
                node.error(`Failed to connect to NATS: ${err.message}`);
                node.emit('error', err);
            }
        }
        
        // Disconnect from NATS
        async function doDisconnect() {
            if (node.nc) {
                try {
                    await node.nc.drain();
                    await node.nc.close();
                } catch (err) {
                    node.error(`Error closing NATS connection: ${err.message}`);
                }
                node.nc = null;
                node.emit('disconnected');
            }
        }
        
        // Public methods
        this.connect = doConnect;
        this.disconnect = doDisconnect;
        
        // Auto-connect on creation
        doConnect();
        
        // Clean up on close
        node.on('close', async (done) => {
            await doDisconnect();
            done();
        });
    }
    
    RED.nodes.registerType('tafy-nats-config', TafyNatsConfigNode, {
        credentials: {
            user: { type: 'text' },
            pass: { type: 'password' },
            token: { type: 'password' }
        }
    });
};