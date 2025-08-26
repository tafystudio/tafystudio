// Simple unit tests for PID controller without Node-RED dependencies
require('../setup');
const should = require('should');

// Load the module
const pidModule = require('../../nodes/pid-controller');

describe('PID Controller Simple Tests', function() {
    
    beforeEach(function() {
        // Reset RED types
        global.RED._types = {};
        // Load the module
        pidModule(global.RED);
    });
    
    it('should register the node type', function() {
        global.RED._types.should.have.property('tafy-pid-controller');
    });
    
    it('should calculate P-only control correctly', function(done) {
        const PIDConstructor = global.RED._types['tafy-pid-controller'];
        const node = {};
        const config = {
            kp: 2.0,
            ki: 0,
            kd: 0,
            setpoint: 10,
            outputMin: -100,
            outputMax: 100,
            sampleTime: 10
        };
        
        PIDConstructor.call(node, config);
        
        // Set up output handler
        node.on('send', function(msg) {
            msg[0].payload.output.should.equal(-10); // (10-15) * 2.0 = -10
            msg[0].payload.error.should.equal(-5);
            done();
        });
        
        // Send input
        node.receive({ payload: 15 });
    });
    
    it('should clamp output to limits', function(done) {
        const PIDConstructor = global.RED._types['tafy-pid-controller'];
        const node = {};
        const config = {
            kp: 10.0,
            ki: 0,
            kd: 0,
            setpoint: 0,
            outputMin: -1,
            outputMax: 1,
            sampleTime: 10
        };
        
        PIDConstructor.call(node, config);
        
        node.on('send', function(msg) {
            msg[0].payload.output.should.equal(-1); // Clamped to min
            done();
        });
        
        // Send large error
        node.receive({ payload: 5 }); // Error = -5, output would be -50 but clamped
    });
    
    it('should handle deadband correctly', function(done) {
        const PIDConstructor = global.RED._types['tafy-pid-controller'];
        const node = {};
        const config = {
            kp: 1.0,
            ki: 0,
            kd: 0,
            setpoint: 10,
            deadband: 1.0,
            outputMin: -10,
            outputMax: 10,
            sampleTime: 10
        };
        
        PIDConstructor.call(node, config);
        
        node.on('send', function(msg) {
            msg[0].payload.error.should.equal(0); // Within deadband
            msg[0].payload.output.should.equal(0);
            done();
        });
        
        // Send input within deadband
        node.receive({ payload: 10.5 }); // Error = -0.5, within deadband of 1.0
    });
});