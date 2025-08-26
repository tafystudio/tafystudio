// Simple unit tests for obstacle avoidance without Node-RED dependencies
require('../setup');
const should = require('should');

// Load the module
const obstacleModule = require('../../nodes/obstacle-avoid');

describe('Obstacle Avoidance Simple Tests', function() {
    
    beforeEach(function() {
        // Reset RED types
        global.RED._types = {};
        // Load the module
        obstacleModule(global.RED);
    });
    
    it('should register the node type', function() {
        global.RED._types.should.have.property('tafy-obstacle-avoid');
    });
    
    it('should stop when obstacle is too close', function(done) {
        const ObstacleConstructor = global.RED._types['tafy-obstacle-avoid'];
        const node = {};
        const config = {
            mode: 'simple',
            stopDistance: 30,
            slowDistance: 60,
            turnThreshold: 40,
            maxSpeed: 0.5,
            turnSpeed: 0.3
        };
        
        ObstacleConstructor.call(node, config);
        
        // Set up output handler
        node.on('send', function(msg) {
            msg[0].payload.action.should.equal('stop');
            msg[0].payload.reason.should.equal('obstacle_too_close');
            msg[0].payload.left.should.equal(0);
            msg[0].payload.right.should.equal(0);
            done();
        });
        
        // Send close obstacle
        node.receive({
            topic: 'sensor/front',
            payload: { distance: 20, position: 'front' }
        });
    });
    
    it('should turn when obstacle in turn range', function(done) {
        const ObstacleConstructor = global.RED._types['tafy-obstacle-avoid'];
        const node = {};
        const config = {
            mode: 'simple',
            stopDistance: 30,
            slowDistance: 60,
            turnThreshold: 40,
            turnDirection: 'left',
            maxSpeed: 0.5,
            turnSpeed: 0.3
        };
        
        ObstacleConstructor.call(node, config);
        
        node.on('send', function(msg) {
            msg[0].payload.action.should.equal('turn_left');
            msg[0].payload.left.should.equal(-0.3);
            msg[0].payload.right.should.equal(0.3);
            done();
        });
        
        // Send obstacle in turn range
        node.receive({
            topic: 'sensor/front',
            payload: { distance: 35 }
        });
    });
    
    it('should slow down when approaching obstacle', function(done) {
        const ObstacleConstructor = global.RED._types['tafy-obstacle-avoid'];
        const node = {};
        const config = {
            mode: 'simple',
            stopDistance: 30,
            slowDistance: 60,
            turnThreshold: 40,
            maxSpeed: 0.5
        };
        
        ObstacleConstructor.call(node, config);
        
        node.on('send', function(msg) {
            msg[0].payload.action.should.equal('slow');
            msg[0].payload.reason.should.equal('approaching_obstacle');
            msg[0].payload.left.should.be.above(0);
            msg[0].payload.left.should.be.below(0.5);
            msg[0].payload.left.should.equal(msg[0].payload.right);
            done();
        });
        
        // Send obstacle in slow range
        node.receive({
            topic: 'sensor/front',
            payload: { distance: 45 }
        });
    });
});