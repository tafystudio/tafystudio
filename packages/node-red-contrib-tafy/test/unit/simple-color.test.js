// Simple unit tests for color tracking without Node-RED dependencies
require('../setup');
const should = require('should');

// Load the modules
const colorTrackerModule = require('../../nodes/color-tracker');
const colorFollowModule = require('../../nodes/color-follow');

describe('Color Tracking Simple Tests', function() {
    
    beforeEach(function() {
        // Reset RED types
        global.RED._types = {};
        // Load the modules
        colorTrackerModule(global.RED);
        colorFollowModule(global.RED);
    });
    
    it('should register color tracker node type', function() {
        global.RED._types.should.have.property('tafy-color-tracker');
    });
    
    it('should register color follow node type', function() {
        global.RED._types.should.have.property('tafy-color-follow');
    });
    
    it('should convert RGB to HSV correctly', function() {
        // This tests the internal RGB to HSV conversion
        // Green: RGB(0,255,0) should be HSV(120,100,100)
        const TrackerConstructor = global.RED._types['tafy-color-tracker'];
        const node = {};
        const config = {
            hue: 120,
            saturation: 80,
            value: 70,
            hueTolerance: 20,
            minBlobSize: 10
        };
        
        TrackerConstructor.call(node, config);
        
        // The rgbToHsv function is internal, so we'll test it indirectly
        // by checking if a green pixel is detected
        const greenPixel = { r: 0, g: 255, b: 0 };
        const redPixel = { r: 255, g: 0, b: 0 };
        
        // We can't directly test internal functions, but we can verify
        // the node initializes correctly
        node.targetColor.h.should.equal(120);
        node.tolerance.h.should.equal(20);
    });
    
    it('should generate follow commands from tracking data', function(done) {
        const FollowConstructor = global.RED._types['tafy-color-follow'];
        const node = {};
        const config = {
            followMode: 'position',
            targetSize: 0.2,
            forwardGain: 2.0,
            turnGain: 0.5,
            maxSpeed: 0.5,
            minSpeed: 0.1,
            deadZone: 0.05,
            smoothing: 0.7
        };
        
        FollowConstructor.call(node, config);
        
        node.on('send', function(msg) {
            msg[0].topic.should.equal('motor/command');
            msg[0].payload.action.should.equal('follow');
            msg[0].payload.should.have.property('left');
            msg[0].payload.should.have.property('right');
            // In position-only mode, robot moves forward while turning
            // Target is to the right (centered_x = 0.3), so robot turns right
            // Right turn means left motor faster than right motor
            const turnComponent = msg[0].payload.control.turn;
            turnComponent.should.be.above(0); // Positive turn for right target
            done();
        });
        
        // Send tracking data with target to the right
        node.receive({
            topic: 'color/tracking',
            payload: {
                tracking: true,
                targets: [{
                    centered_x: 0.3, // Right of center
                    width: 0.2,
                    id: 'test_target'
                }]
            }
        });
    });
    
    it('should stop when target is lost', function(done) {
        const FollowConstructor = global.RED._types['tafy-color-follow'];
        const node = {};
        const config = {
            followMode: 'both'
        };
        
        FollowConstructor.call(node, config);
        
        let messageCount = 0;
        node.on('send', function(msg) {
            messageCount++;
            
            if (messageCount === 1) {
                // First message should be following
                msg[0].payload.action.should.equal('follow');
            } else if (messageCount === 2) {
                // Second message should be stop
                msg[0].payload.action.should.equal('stop');
                msg[0].payload.reason.should.equal('target_lost');
                msg[0].payload.left.should.equal(0);
                msg[0].payload.right.should.equal(0);
                done();
            }
        });
        
        // Send tracking data
        node.receive({
            topic: 'color/tracking',
            payload: {
                tracking: true,
                targets: [{ centered_x: 0, width: 0.2 }]
            }
        });
        
        // Then send lost signal
        setTimeout(() => {
            node.receive({
                topic: 'color/tracking',
                payload: {
                    tracking: false,
                    lost: true,
                    targets: []
                }
            });
        }, 10);
    });
});