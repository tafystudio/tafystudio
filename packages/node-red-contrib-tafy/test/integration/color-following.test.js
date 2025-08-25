const helper = require('node-red-node-test-helper');
const colorTrackerNode = require('../../nodes/color-tracker');
const colorFollowNode = require('../../nodes/color-follow');
const pidControllerNode = require('../../nodes/pid-controller');

helper.init(require.resolve('node-red'));

describe('Color Following Integration', function() {
    
    beforeEach(function(done) {
        helper.startServer(done);
    });
    
    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });
    
    it('should track and follow colored target', function(done) {
        const flow = [
            {
                id: 'tracker-node',
                type: 'tafy-color-tracker',
                name: 'Color Tracker',
                hue: 120,
                saturation: 80,
                value: 70,
                hueTolerance: 20,
                satTolerance: 30,
                valTolerance: 30,
                minBlobSize: 100,
                wires: [['follow-node']]
            },
            {
                id: 'follow-node',
                type: 'tafy-color-follow',
                name: 'Color Follow',
                followMode: 'both',
                targetSize: 0.2,
                forwardGain: 2.0,
                turnGain: 0.5,
                maxSpeed: 0.5,
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load([colorTrackerNode, colorFollowNode], flow, function() {
            const trackerNode = helper.getNode('tracker-node');
            const outputNode = helper.getNode('output-node');
            
            outputNode.on('input', function(msg) {
                try {
                    msg.should.have.property('topic', 'motor/command');
                    msg.payload.should.have.property('action', 'follow');
                    msg.payload.should.have.property('left');
                    msg.payload.should.have.property('right');
                    msg.payload.should.have.property('target');
                    
                    // Should turn right since target is at x=0.7 (right of center)
                    msg.payload.left.should.be.above(msg.payload.right);
                    done();
                } catch(err) {
                    done(err);
                }
            });
            
            // Create mock green image data with target on right side
            const width = 640;
            const height = 480;
            const imageData = new Uint8Array(width * height * 4);
            
            // Fill with non-matching background
            for (let i = 0; i < imageData.length; i += 4) {
                imageData[i] = 100;     // R
                imageData[i + 1] = 100; // G
                imageData[i + 2] = 100; // B
                imageData[i + 3] = 255; // A
            }
            
            // Add green blob on right side (x=400-500, y=200-300)
            for (let y = 200; y < 300; y++) {
                for (let x = 400; x < 500; x++) {
                    const idx = (y * width + x) * 4;
                    imageData[idx] = 0;       // R
                    imageData[idx + 1] = 255; // G
                    imageData[idx + 2] = 0;   // B
                    imageData[idx + 3] = 255; // A
                }
            }
            
            trackerNode.receive({
                payload: {
                    data: imageData,
                    width: width,
                    height: height
                }
            });
        });
    });
    
    it('should stop when target is lost', function(done) {
        const flow = [
            {
                id: 'tracker-node',
                type: 'tafy-color-tracker',
                name: 'Color Tracker',
                hue: 0, // Red
                lostTimeout: 100,
                wires: [['follow-node']]
            },
            {
                id: 'follow-node',
                type: 'tafy-color-follow',
                name: 'Color Follow',
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load([colorTrackerNode, colorFollowNode], flow, function() {
            const trackerNode = helper.getNode('tracker-node');
            const outputNode = helper.getNode('output-node');
            
            let messageCount = 0;
            outputNode.on('input', function(msg) {
                messageCount++;
                
                if (messageCount === 1) {
                    // First message should be following
                    msg.payload.action.should.equal('follow');
                } else if (messageCount === 2) {
                    // Second message should be stop after target lost
                    try {
                        msg.payload.should.have.property('action', 'stop');
                        msg.payload.should.have.property('reason', 'target_lost');
                        msg.payload.should.have.property('left', 0);
                        msg.payload.should.have.property('right', 0);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }
            });
            
            // Send frame with red target
            const width = 100;
            const height = 100;
            const redFrame = new Uint8Array(width * height * 4);
            
            // Add red blob
            for (let i = 0; i < redFrame.length; i += 4) {
                redFrame[i] = 255;     // R
                redFrame[i + 1] = 0;   // G
                redFrame[i + 2] = 0;   // B
                redFrame[i + 3] = 255; // A
            }
            
            trackerNode.receive({
                payload: { data: redFrame, width, height }
            });
            
            // Send frame without target after timeout
            setTimeout(() => {
                const emptyFrame = new Uint8Array(width * height * 4);
                // Fill with blue (no red)
                for (let i = 0; i < emptyFrame.length; i += 4) {
                    emptyFrame[i] = 0;       // R
                    emptyFrame[i + 1] = 0;   // G
                    emptyFrame[i + 2] = 255; // B
                    emptyFrame[i + 3] = 255; // A
                }
                
                trackerNode.receive({
                    payload: { data: emptyFrame, width, height }
                });
            }, 150);
        });
    });
    
    it('should integrate with PID controller', function(done) {
        const flow = [
            {
                id: 'tracker-node',
                type: 'tafy-color-tracker',
                name: 'Color Tracker',
                wires: [['extract-node']]
            },
            {
                id: 'extract-node',
                type: 'function',
                name: 'Extract X',
                func: 'if (msg.payload.tracking && msg.payload.targets.length > 0) { return { payload: msg.payload.targets[0].centered_x }; }',
                wires: [['pid-node']]
            },
            {
                id: 'pid-node',
                type: 'tafy-pid-controller',
                name: 'Turn PID',
                kp: 0.8,
                ki: 0.05,
                kd: 0.2,
                setpoint: 0,
                outputMin: -0.5,
                outputMax: 0.5,
                wires: [['follow-node']]
            },
            {
                id: 'follow-node',
                type: 'tafy-color-follow',
                name: 'Color Follow',
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load([colorTrackerNode, pidControllerNode, colorFollowNode], flow, function() {
            const trackerNode = helper.getNode('tracker-node');
            const outputNode = helper.getNode('output-node');
            
            outputNode.on('input', function(msg) {
                try {
                    msg.should.have.property('topic', 'motor/command');
                    msg.payload.should.have.property('action', 'pid_follow');
                    msg.payload.should.have.property('pid');
                    done();
                } catch(err) {
                    done(err);
                }
            });
            
            // Send tracking result
            trackerNode.receive({
                payload: {
                    tracking: true,
                    targets: [{
                        centered_x: 0.3,
                        width: 0.15
                    }]
                },
                topic: 'color/tracking'
            });
        });
    });
});