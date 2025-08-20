module.exports = function(RED) {
    const { connect, StringCodec } = require('nats');
    
    function TafyNatsConfigNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        node.url = config.url;
        node.name = config.name;
        node.username = config.username;
        node.password = config.password;
        
        node.nc = null;
        node.sc = StringCodec();
        
        node.connect = async function() {
            try {
                const options = {
                    servers: node.url,
                    name: `node-red-${node.id}`,
                    reconnect: true,
                    maxReconnectAttempts: -1,
                    reconnectTimeWait: 2000,
                    pingInterval: 20000,
                    maxPingOut: 3
                };
                
                if (node.username && node.password) {
                    options.user = node.username;
                    options.pass = node.password;
                }
                
                node.nc = await connect(options);
                node.log(`Connected to NATS at ${node.url}`);
                node.emit('connected');
                
                // Monitor connection status
                (async () => {
                    for await (const status of node.nc.status()) {
                        switch (status.type) {
                            case 'disconnect':
                                node.emit('disconnected');
                                node.warn(`Disconnected from NATS: ${status.data}`);
                                break;
                            case 'reconnect':
                                node.emit('connected');
                                node.log('Reconnected to NATS');
                                break;
                            case 'error':
                                node.error(`NATS error: ${status.data}`);
                                break;
                        }
                    }
                })();
                
            } catch (err) {
                node.error(`Failed to connect to NATS: ${err.message}`);
                node.emit('error', err);
            }
        };
        
        node.on('close', async (done) => {
            if (node.nc) {
                try {
                    await node.nc.drain();
                    await node.nc.close();
                    node.log('NATS connection closed');
                } catch (err) {
                    node.error(`Error closing NATS connection: ${err.message}`);
                }
            }
            if (done) done();
        });
        
        // Start connection
        node.connect();
    }
    
    RED.nodes.registerType("tafy-nats-config", TafyNatsConfigNode);
}