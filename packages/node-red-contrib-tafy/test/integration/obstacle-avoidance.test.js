const helper = require('node-red-node-test-helper');
const obstacleAvoidNode = require('../../nodes/obstacle-avoid');
const sensorFusionNode = require('../../nodes/sensor-fusion');

helper.init(require.resolve('node-red'));

describe('Obstacle Avoidance Integration', function() {
    
    beforeEach(function(done) {
        helper.startServer(done);
    });
    
    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });
    
    it('should stop when obstacle detected at close range', function(done) {
        const flow = [
            {
                id: 'obstacle-node',
                type: 'tafy-obstacle-avoid',
                name: 'Obstacle Avoider',
                mode: 'simple',
                stopDistance: 30,
                slowDistance: 60,
                turnThreshold: 40,
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load(obstacleAvoidNode, flow, function() {
            const obstacleNode = helper.getNode('obstacle-node');
            const outputNode = helper.getNode('output-node');
            
            outputNode.on('input', function(msg) {
                try {
                    msg.should.have.property('payload');
                    msg.payload.should.have.property('action', 'stop');
                    msg.payload.should.have.property('reason', 'obstacle_too_close');
                    msg.payload.should.have.property('left', 0);
                    msg.payload.should.have.property('right', 0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
            
            // Send close obstacle detection
            obstacleNode.receive({
                topic: 'sensor/front',
                payload: { distance: 20, position: 'front' }
            });
        });
    });
    
    it('should turn when obstacle in turn threshold', function(done) {
        const flow = [
            {
                id: 'obstacle-node',
                type: 'tafy-obstacle-avoid',
                name: 'Obstacle Avoider',
                mode: 'simple',
                stopDistance: 30,
                slowDistance: 60,
                turnThreshold: 40,
                turnDirection: 'left',
                turnSpeed: 0.3,
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load(obstacleAvoidNode, flow, function() {
            const obstacleNode = helper.getNode('obstacle-node');
            const outputNode = helper.getNode('output-node');
            
            outputNode.on('input', function(msg) {
                try {
                    msg.payload.should.have.property('action', 'turn_left');
                    msg.payload.should.have.property('left', -0.3);
                    msg.payload.should.have.property('right', 0.3);
                    done();
                } catch(err) {
                    done(err);
                }
            });
            
            // Send obstacle in turn range
            obstacleNode.receive({
                topic: 'sensor/front',
                payload: { distance: 35 }
            });
        });
    });
    
    it('should integrate with sensor fusion', function(done) {
        const flow = [
            {
                id: 'fusion-node',
                type: 'tafy-sensor-fusion',
                name: 'Sensor Fusion',
                algorithm: 'weighted',
                timeout: 500,
                wires: [['obstacle-node']]
            },
            {
                id: 'obstacle-node',
                type: 'tafy-obstacle-avoid',
                name: 'Obstacle Avoider',
                mode: 'simple',
                stopDistance: 30,
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load([sensorFusionNode, obstacleAvoidNode], flow, function() {
            const fusionNode = helper.getNode('fusion-node');
            const outputNode = helper.getNode('output-node');
            
            let messageCount = 0;
            outputNode.on('input', function(msg) {
                messageCount++;
                
                // Should get stop command after all sensors report close
                if (messageCount === 3) {
                    try {
                        msg.payload.should.have.property('action', 'stop');
                        done();
                    } catch(err) {
                        done(err);
                    }
                }
            });
            
            // Send multiple sensor readings
            fusionNode.receive({
                topic: 'sensor/ultrasonic1',
                payload: { 
                    position: 'front',
                    distance: 25,
                    confidence: 0.9
                }
            });
            
            fusionNode.receive({
                topic: 'sensor/ultrasonic2',
                payload: { 
                    position: 'front',
                    distance: 22,
                    confidence: 0.8
                }
            });
            
            fusionNode.receive({
                topic: 'sensor/ultrasonic3',
                payload: { 
                    position: 'front',
                    distance: 28,
                    confidence: 0.7
                }
            });
        });
    });
    
    it('should handle advanced mode state transitions', function(done) {
        const flow = [
            {
                id: 'obstacle-node',
                type: 'tafy-obstacle-avoid',
                name: 'Obstacle Avoider',
                mode: 'advanced',
                stopDistance: 30,
                backupDistance: 20,
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load(obstacleAvoidNode, flow, function() {
            const obstacleNode = helper.getNode('obstacle-node');
            const outputNode = helper.getNode('output-node');
            
            const actions = [];
            outputNode.on('input', function(msg) {
                actions.push(msg.payload.action);
                
                if (actions.length === 3) {
                    try {
                        actions.should.eql(['emergency_stop', 'backup', 'turn_left']);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }
            });
            
            // Simulate obstacle detection sequence
            // 1. Very close obstacle
            obstacleNode.receive({
                topic: 'sensor/front',
                payload: { distance: 15 }
            });
            
            // 2. Add back sensor data for backup
            setTimeout(() => {
                obstacleNode.receive({
                    topic: 'sensor/back',
                    payload: { distance: 50, position: 'back' }
                });
            }, 50);
            
            // 3. Add side sensor data for turning
            setTimeout(() => {
                obstacleNode.receive({
                    topic: 'sensor/left',
                    payload: { distance: 60, position: 'left' }
                });
                obstacleNode.receive({
                    topic: 'sensor/right',
                    payload: { distance: 40, position: 'right' }
                });
            }, 100);
        });
    });
});