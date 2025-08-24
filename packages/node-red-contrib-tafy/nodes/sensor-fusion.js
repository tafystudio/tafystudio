module.exports = function(RED) {
    function TafySensorFusionNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.sensors = config.sensors || []; // Array of sensor configurations
        this.fusionMethod = config.fusionMethod || 'weighted'; // weighted, kalman, minimum
        this.outputFormat = config.outputFormat || 'unified'; // unified, individual, both
        this.timeout = parseInt(config.timeout) || 1000; // ms
        this.updateRate = parseInt(config.updateRate) || 100; // ms
        
        // Sensor storage
        const sensorData = new Map();
        let updateTimer = null;
        
        // Kalman filter state (simplified 1D)
        const kalmanState = {
            estimate: 50,
            errorCovariance: 100,
            processNoise: 0.1,
            measurementNoise: 5
        };
        
        // Initialize sensors from config
        function initializeSensors() {
            node.sensors.forEach(sensor => {
                sensorData.set(sensor.id, {
                    id: sensor.id,
                    position: sensor.position || 'front',
                    weight: parseFloat(sensor.weight) || 1.0,
                    offset: parseFloat(sensor.offset) || 0,
                    scale: parseFloat(sensor.scale) || 1.0,
                    minValid: parseFloat(sensor.minValid) || 0,
                    maxValid: parseFloat(sensor.maxValid) || 400,
                    lastValue: null,
                    lastTimestamp: 0,
                    history: [],
                    isValid: false
                });
            });
        }
        
        // Update sensor reading
        function updateSensor(sensorId, value, timestamp) {
            const sensor = sensorData.get(sensorId);
            if (!sensor) {
                // Auto-register unknown sensors
                sensorData.set(sensorId, {
                    id: sensorId,
                    position: 'unknown',
                    weight: 1.0,
                    offset: 0,
                    scale: 1.0,
                    minValid: 0,
                    maxValid: 400,
                    lastValue: value,
                    lastTimestamp: timestamp || Date.now(),
                    history: [value],
                    isValid: true
                });
                return;
            }
            
            // Apply calibration
            const calibratedValue = (value * sensor.scale) + sensor.offset;
            
            // Validate reading
            sensor.isValid = calibratedValue >= sensor.minValid && 
                           calibratedValue <= sensor.maxValid &&
                           (Date.now() - (timestamp || Date.now())) < node.timeout;
            
            // Update sensor data
            sensor.lastValue = calibratedValue;
            sensor.lastTimestamp = timestamp || Date.now();
            
            // Maintain history (last 10 readings)
            sensor.history.push(calibratedValue);
            if (sensor.history.length > 10) {
                sensor.history.shift();
            }
        }
        
        // Simple weighted average fusion
        function weightedFusion(position) {
            let totalWeight = 0;
            let weightedSum = 0;
            let validSensors = 0;
            
            sensorData.forEach(sensor => {
                if (sensor.position === position && sensor.isValid) {
                    const age = Date.now() - sensor.lastTimestamp;
                    const ageFactor = Math.max(0, 1 - (age / node.timeout));
                    const weight = sensor.weight * ageFactor;
                    
                    weightedSum += sensor.lastValue * weight;
                    totalWeight += weight;
                    validSensors++;
                }
            });
            
            if (totalWeight > 0) {
                return {
                    value: weightedSum / totalWeight,
                    confidence: Math.min(1, validSensors / 3), // Assume 3 sensors ideal
                    sensors: validSensors
                };
            }
            
            return null;
        }
        
        // Simplified Kalman filter fusion
        function kalmanFusion(position) {
            const measurements = [];
            
            sensorData.forEach(sensor => {
                if (sensor.position === position && sensor.isValid) {
                    measurements.push(sensor.lastValue);
                }
            });
            
            if (measurements.length === 0) {
                return null;
            }
            
            // Average measurements
            const measurement = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            
            // Kalman filter update
            const kalmanGain = kalmanState.errorCovariance / 
                             (kalmanState.errorCovariance + kalmanState.measurementNoise);
            
            kalmanState.estimate = kalmanState.estimate + 
                                  kalmanGain * (measurement - kalmanState.estimate);
            
            kalmanState.errorCovariance = (1 - kalmanGain) * kalmanState.errorCovariance + 
                                         kalmanState.processNoise;
            
            return {
                value: kalmanState.estimate,
                confidence: 1 - (kalmanState.errorCovariance / 100),
                sensors: measurements.length
            };
        }
        
        // Minimum distance fusion (most conservative)
        function minimumFusion(position) {
            let minDistance = Infinity;
            let validSensors = 0;
            
            sensorData.forEach(sensor => {
                if (sensor.position === position && sensor.isValid) {
                    minDistance = Math.min(minDistance, sensor.lastValue);
                    validSensors++;
                }
            });
            
            if (validSensors > 0) {
                return {
                    value: minDistance,
                    confidence: Math.min(1, validSensors / 3),
                    sensors: validSensors
                };
            }
            
            return null;
        }
        
        // Process fusion based on method
        function processFusion() {
            const positions = ['front', 'left', 'right', 'back'];
            const results = {};
            
            positions.forEach(position => {
                let result;
                
                switch (node.fusionMethod) {
                case 'kalman':
                    result = kalmanFusion(position);
                    break;
                case 'minimum':
                    result = minimumFusion(position);
                    break;
                case 'weighted':
                default:
                    result = weightedFusion(position);
                    break;
                }
                
                if (result) {
                    results[position] = result;
                }
            });
            
            return results;
        }
        
        // Send fusion results
        function sendResults() {
            const fusedData = processFusion();
            const output = {
                timestamp: Date.now(),
                method: node.fusionMethod
            };
            
            if (node.outputFormat === 'unified' || node.outputFormat === 'both') {
                // Unified output with best estimate for each position
                output.distances = {};
                output.confidence = {};
                
                Object.keys(fusedData).forEach(position => {
                    output.distances[position] = fusedData[position].value;
                    output.confidence[position] = fusedData[position].confidence;
                });
            }
            
            if (node.outputFormat === 'individual' || node.outputFormat === 'both') {
                // Individual sensor data
                output.sensors = {};
                
                sensorData.forEach((sensor, id) => {
                    output.sensors[id] = {
                        position: sensor.position,
                        value: sensor.lastValue,
                        isValid: sensor.isValid,
                        age: Date.now() - sensor.lastTimestamp
                    };
                });
            }
            
            // Add summary statistics
            output.summary = {
                activeSensors: Array.from(sensorData.values()).filter(s => s.isValid).length,
                totalSensors: sensorData.size,
                oldestReading: Math.max(...Array.from(sensorData.values())
                    .map(s => Date.now() - s.lastTimestamp))
            };
            
            // Update node status
            const activeSensors = output.summary.activeSensors;
            let statusColor = 'green';
            if (activeSensors === 0) {
                statusColor = 'red';
            } else if (activeSensors < sensorData.size / 2) {
                statusColor = 'yellow';
            }
            
            node.status({
                fill: statusColor,
                shape: 'dot',
                text: `${activeSensors}/${sensorData.size} sensors active`
            });
            
            // Send output
            node.send({
                payload: output,
                topic: 'sensor/fusion'
            });
        }
        
        // Handle input messages
        node.on('input', (msg) => {
            // Extract sensor ID from topic or payload
            let sensorId = null;
            let value = null;
            let timestamp = Date.now();
            
            if (msg.topic) {
                // Try to extract sensor ID from topic
                const matches = msg.topic.match(/sensor[./](\w+)/);
                if (matches) {
                    sensorId = matches[1];
                }
            }
            
            if (msg.payload) {
                if (typeof msg.payload === 'number') {
                    value = msg.payload;
                } else if (typeof msg.payload === 'object') {
                    sensorId = sensorId || msg.payload.id || msg.payload.sensor;
                    value = msg.payload.distance || msg.payload.value;
                    timestamp = msg.payload.timestamp || timestamp;
                }
            }
            
            if (sensorId && value !== null) {
                updateSensor(sensorId, value, timestamp);
            }
        });
        
        // Start update timer
        function startUpdates() {
            if (updateTimer) {
                clearInterval(updateTimer);
            }
            
            updateTimer = setInterval(() => {
                sendResults();
            }, node.updateRate);
        }
        
        // Stop updates
        function stopUpdates() {
            if (updateTimer) {
                clearInterval(updateTimer);
                updateTimer = null;
            }
        }
        
        // Initialize
        initializeSensors();
        startUpdates();
        
        // Clean up
        node.on('close', () => {
            stopUpdates();
        });
        
        // Initial status
        node.status({
            fill: 'grey',
            shape: 'ring',
            text: 'Waiting for sensors'
        });
    }
    
    RED.nodes.registerType('tafy-sensor-fusion', TafySensorFusionNode);
};