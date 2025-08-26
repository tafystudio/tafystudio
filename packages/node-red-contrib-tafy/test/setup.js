// Test setup to handle monorepo structure
const path = require('path');

// Mock Node-RED test helper when not available
if (!process.env.NODE_RED_HOME) {
    // Set NODE_RED_HOME to the package's node_modules
    process.env.NODE_RED_HOME = path.join(__dirname, '..', 'node_modules', 'node-red');
}

// Mock the RED object for unit testing
global.RED = {
    nodes: {
        createNode: function(node, config) {
            node.on = function(event, handler) {
                node._events = node._events || {};
                node._events[event] = handler;
            };
            node.send = function(msg) {
                if (node._events && node._events.send) {
                    // Ensure msg is wrapped in array if not already
                    const msgArray = Array.isArray(msg) ? msg : [msg];
                    node._events.send(msgArray);
                }
            };
            node.status = function(status) {
                node._status = status;
            };
            node.receive = function(msg) {
                if (node._events && node._events.input) {
                    node._events.input(msg);
                }
            };
            Object.assign(node, config);
        },
        registerType: function(type, constructor) {
            // Store for later use
            global.RED._types = global.RED._types || {};
            global.RED._types[type] = constructor;
        }
    },
    _types: {}
};