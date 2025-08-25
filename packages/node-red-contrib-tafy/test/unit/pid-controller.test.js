const helper = require('node-red-node-test-helper');
const pidControllerNode = require('../../nodes/pid-controller');

helper.init(require.resolve('node-red'));

describe('PID Controller Unit Tests', function() {
    
    beforeEach(function(done) {
        helper.startServer(done);
    });
    
    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });
    
    it('should calculate proportional control correctly', function(done) {
        const flow = [
            {
                id: 'pid-node',
                type: 'tafy-pid-controller',
                name: 'PID Test',
                kp: 2.0,
                ki: 0,
                kd: 0,
                setpoint: 10,
                outputMin: -100,
                outputMax: 100,
                wires: [['helper-node']]
            },
            { id: 'helper-node', type: 'helper' }
        ];
        
        helper.load(pidControllerNode, flow, function() {
            const pidNode = helper.getNode('pid-node');
            const helperNode = helper.getNode('helper-node');
            
            helperNode.on('input', function(msg) {
                try {
                    msg.payload.should.have.property('output', -10); // (10-15) * 2.0
                    msg.payload.should.have.property('error', -5);
                    msg.payload.pid.should.have.property('p', -10);
                    msg.payload.pid.should.have.property('i', 0);
                    msg.payload.pid.should.have.property('d', 0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
            
            pidNode.receive({ payload: 15 }); // Input > setpoint
        });
    });
    
    it('should handle integral windup protection', function(done) {
        const flow = [
            {
                id: 'pid-node',
                type: 'tafy-pid-controller',
                name: 'PID Test',
                kp: 1.0,
                ki: 1.0,
                kd: 0,
                setpoint: 0,
                outputMin: -1,
                outputMax: 1,
                integralMax: 2,
                sampleTime: 10,
                wires: [['helper-node']]
            },
            { id: 'helper-node', type: 'helper' }
        ];
        
        helper.load(pidControllerNode, flow, function() {
            const pidNode = helper.getNode('pid-node');
            const helperNode = helper.getNode('helper-node');
            
            let messageCount = 0;
            helperNode.on('input', function(msg) {
                messageCount++;
                
                if (messageCount === 10) {
                    try {
                        // Output should be clamped
                        msg.payload.output.should.equal(1);
                        // Integral should be limited
                        msg.payload.pid.integral.should.be.below(2.1);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }
            });
            
            // Send multiple high errors to build up integral
            const interval = setInterval(() => {
                pidNode.receive({ payload: -10 }); // Large error
                if (messageCount >= 10) {
                    clearInterval(interval);
                }
            }, 15);
        });
    });
    
    it('should handle mode switching correctly', function(done) {
        const flow = [
            {
                id: 'pid-node',
                type: 'tafy-pid-controller',
                name: 'PID Test',
                kp: 1.0,
                ki: 0.1,
                kd: 0,
                mode: 'auto',
                wires: [['helper-node']]
            },
            { id: 'helper-node', type: 'helper' }
        ];
        
        helper.load(pidControllerNode, flow, function() {
            const pidNode = helper.getNode('pid-node');
            const helperNode = helper.getNode('helper-node');
            
            let step = 0;
            helperNode.on('input', function(msg) {
                step++;
                
                if (step === 1) {
                    msg.payload.mode.should.equal('auto');
                    // Switch to manual
                    pidNode.receive({
                        topic: 'control',
                        payload: { mode: 'manual', output: 0.75 }
                    });
                    // Send another input
                    pidNode.receive({ payload: 5 });
                } else if (step === 2) {
                    try {
                        msg.payload.mode.should.equal('manual');
                        msg.payload.output.should.equal(0.75);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }
            });
            
            pidNode.receive({ payload: 5 });
        });
    });
    
    it('should apply deadband correctly', function(done) {
        const flow = [
            {
                id: 'pid-node',
                type: 'tafy-pid-controller',
                name: 'PID Test',
                kp: 1.0,
                ki: 0,
                kd: 0,
                setpoint: 10,
                deadband: 0.5,
                wires: [['helper-node']]
            },
            { id: 'helper-node', type: 'helper' }
        ];
        
        helper.load(pidControllerNode, flow, function() {
            const pidNode = helper.getNode('pid-node');
            const helperNode = helper.getNode('helper-node');
            
            helperNode.on('input', function(msg) {
                try {
                    // Error is within deadband, should be treated as 0
                    msg.payload.error.should.equal(0);
                    msg.payload.output.should.equal(0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
            
            pidNode.receive({ payload: 10.3 }); // Within deadband of setpoint
        });
    });
});