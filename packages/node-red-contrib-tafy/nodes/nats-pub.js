module.exports = function(RED) {
    const { StringCodec } = require('nats');
    
    function TafyNatsPublishNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const sc = StringCodec();
        
        node.server = RED.nodes.getNode(config.server);
        node.subject = config.subject;
        node.subjectType = config.subjectType || 'str';
        
        if (node.server) {
            node.status({ fill: 'yellow', shape: 'ring', text: 'connecting...' });
            
            node.server.on('connected', () => {
                node.status({ fill: 'green', shape: 'dot', text: 'connected' });
            });
            
            node.server.on('disconnected', () => {
                node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
            });
            
            node.on('input', async (msg, send, done) => {
                try {
                    // Determine subject
                    let subject = node.subject;
                    if (node.subjectType === 'msg') {
                        subject = RED.util.getMessageProperty(msg, node.subject);
                    } else if (node.subjectType === 'flow' || node.subjectType === 'global') {
                        subject = RED.util.evaluateNodeProperty(node.subject, node.subjectType, node, msg);
                    }
                    
                    if (!subject) {
                        throw new Error('Subject is required');
                    }
                    
                    // Prepare payload
                    let payload = msg.payload;
                    if (typeof payload === 'object') {
                        payload = JSON.stringify(payload);
                    } else {
                        payload = String(payload);
                    }
                    
                    // Publish to NATS
                    if (node.server.nc) {
                        await node.server.nc.publish(subject, sc.encode(payload));
                        node.log(`Published to ${subject}`);
                        
                        if (done) {
                            done();
                        }
                    } else {
                        throw new Error('NATS not connected');
                    }
                } catch (err) {
                    node.error(err, msg);
                    if (done) {
                        done(err);
                    }
                }
            });
        } else {
            node.status({ fill: 'red', shape: 'ring', text: 'no server' });
            node.error('NATS server not configured');
        }
        
        node.on('close', () => {
            node.status({});
        });
    }
    
    RED.nodes.registerType('tafy-nats-pub', TafyNatsPublishNode);
};