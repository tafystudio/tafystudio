const helper = require('node-red-node-test-helper');
const natsConfigNode = require('../../nodes/nats-config');
const natsPubNode = require('../../nodes/nats-pub');
const motorControlNode = require('../../nodes/motor-control');
const obstacleAvoidNode = require('../../nodes/obstacle-avoid');
const colorFollowNode = require('../../nodes/color-follow');

helper.init(require.resolve('node-red'));

describe('Complete Robot Flow Integration', function() {
    
    beforeEach(function(done) {
        helper.startServer(done);
    });
    
    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });
    
    it('should measure Time-to-First-Motion', function(done) {
        const startTime = Date.now();
        
        const flow = [
            {
                id: 'motor-node',
                type: 'tafy-motor-control',
                name: 'Motor Controller',
                motorType: 'differential',
                maxSpeed: 1.0,
                acceleration: 0.5,
                wires: [['nats-node']]
            },
            {
                id: 'nats-node',
                type: 'tafy-nats-pub',
                name: 'NATS Publisher',
                topic: 'hal.v1.motor.cmd',
                natsConfig: 'nats-config',
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            },
            {
                id: 'nats-config',
                type: 'tafy-nats-config',
                name: 'NATS Config',
                server: 'nats://localhost:4222'
            }
        ];
        
        helper.load([motorControlNode, natsPubNode, natsConfigNode], flow, function() {
            const motorNode = helper.getNode('motor-node');
            const outputNode = helper.getNode('output-node');
            
            outputNode.on('input', function(msg) {
                const timeToMotion = Date.now() - startTime;
                
                try {
                    msg.should.have.property('topic', 'hal.v1.motor.cmd');
                    msg.payload.should.have.property('hal_major', 1);
                    msg.payload.should.have.property('payload');
                    msg.payload.payload.should.have.property('left', 0.5);
                    msg.payload.payload.should.have.property('right', 0.5);
                    
                    // Log Time-to-First-Motion
                    console.log(`Time-to-First-Motion: ${timeToMotion}ms`);
                    timeToMotion.should.be.below(100); // Should be fast
                    done();
                } catch(err) {
                    done(err);
                }
            });
            
            // Send simple forward command
            motorNode.receive({
                payload: {
                    left: 0.5,
                    right: 0.5
                }
            });
        });
    });
    
    it('should prioritize obstacle avoidance over color following', function(done) {
        const flow = [
            {
                id: 'obstacle-node',
                type: 'tafy-obstacle-avoid',
                name: 'Obstacle Avoider',
                mode: 'simple',
                stopDistance: 30,
                wires: [['priority-node']]
            },
            {
                id: 'color-follow-node',
                type: 'tafy-color-follow',
                name: 'Color Follow',
                wires: [['priority-node']]
            },
            {
                id: 'priority-node',
                type: 'function',
                name: 'Priority Handler',
                func: `
                    // Store commands by type
                    context.commands = context.commands || {};
                    
                    if (msg.topic === 'obstacle/avoidance') {
                        context.commands.obstacle = msg.payload;
                    } else if (msg.topic === 'motor/command') {
                        context.commands.follow = msg.payload;
                    }
                    
                    // Obstacle avoidance takes priority
                    if (context.commands.obstacle && 
                        context.commands.obstacle.action !== 'clear') {
                        return { payload: context.commands.obstacle };
                    } else if (context.commands.follow) {
                        return { payload: context.commands.follow };
                    }
                    
                    return null;
                `,
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load([obstacleAvoidNode, colorFollowNode], flow, function() {
            const obstacleNode = helper.getNode('obstacle-node');
            const colorFollowNode = helper.getNode('color-follow-node');
            const outputNode = helper.getNode('output-node');
            
            let lastAction = '';
            outputNode.on('input', function(msg) {
                lastAction = msg.payload.action;
            });
            
            // Send color tracking (robot wants to follow)
            colorFollowNode.receive({
                topic: 'color/tracking',
                payload: {
                    tracking: true,
                    targets: [{ centered_x: 0.3, width: 0.2 }]
                }
            });
            
            // Wait then send obstacle detection
            setTimeout(() => {
                obstacleNode.receive({
                    topic: 'sensor/front',
                    payload: { distance: 25 }
                });
                
                // Verify obstacle avoidance took priority
                setTimeout(() => {
                    try {
                        lastAction.should.equal('stop');
                        done();
                    } catch(err) {
                        done(err);
                    }
                }, 50);
            }, 50);
        });
    });
    
    it('should handle complete autonomous behavior flow', function(done) {
        this.timeout(5000);
        
        const flow = [
            {
                id: 'obstacle-node',
                type: 'tafy-obstacle-avoid',
                name: 'Obstacle Avoider',
                mode: 'simple',
                stopDistance: 30,
                slowDistance: 60,
                wires: [['motor-node']]
            },
            {
                id: 'color-follow-node',
                type: 'tafy-color-follow',
                name: 'Color Follow',
                followMode: 'both',
                wires: [['motor-node']]
            },
            {
                id: 'motor-node',
                type: 'tafy-motor-control',
                name: 'Motor Controller',
                motorType: 'differential',
                wires: [['output-node']]
            },
            {
                id: 'output-node',
                type: 'helper'
            }
        ];
        
        helper.load([obstacleAvoidNode, colorFollowNode, motorControlNode], flow, function() {
            const obstacleNode = helper.getNode('obstacle-node');
            const colorFollowNode = helper.getNode('color-follow-node');
            const outputNode = helper.getNode('output-node');
            
            const behaviors = [];
            outputNode.on('input', function(msg) {
                if (msg.payload.payload && msg.payload.payload.action) {
                    behaviors.push(msg.payload.payload.action);
                }
            });
            
            // Scenario: Follow color, encounter obstacle, avoid, resume following
            
            // 1. Start following color
            colorFollowNode.receive({
                topic: 'color/tracking',
                payload: {
                    tracking: true,
                    targets: [{ centered_x: 0, width: 0.2 }]
                }
            });
            
            // 2. Obstacle appears
            setTimeout(() => {
                obstacleNode.receive({
                    topic: 'sensor/front',
                    payload: { distance: 35 }
                });
            }, 100);
            
            // 3. Obstacle clears
            setTimeout(() => {
                obstacleNode.receive({
                    topic: 'sensor/front',
                    payload: { distance: 100 }
                });
            }, 200);
            
            // 4. Color target moves
            setTimeout(() => {
                colorFollowNode.receive({
                    topic: 'color/tracking',
                    payload: {
                        tracking: true,
                        targets: [{ centered_x: 0.5, width: 0.15 }]
                    }
                });
            }, 300);
            
            // Check behaviors
            setTimeout(() => {
                try {
                    behaviors.should.include('follow');
                    behaviors.should.include('turn_left');
                    behaviors.should.include('clear');
                    done();
                } catch(err) {
                    done(err);
                }
            }, 400);
        });
    });
});