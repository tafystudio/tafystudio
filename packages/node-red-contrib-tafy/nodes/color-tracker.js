module.exports = function(RED) {
    function TafyColorTrackerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.colorSpace = config.colorSpace || 'hsv'; // hsv, rgb, lab
        this.targetColor = {
            h: parseInt(config.hue) || 120,        // 0-360 for HSV
            s: parseInt(config.saturation) || 50,  // 0-100
            v: parseInt(config.value) || 50        // 0-100
        };
        this.tolerance = {
            h: parseInt(config.hueTolerance) || 20,
            s: parseInt(config.satTolerance) || 30,
            v: parseInt(config.valTolerance) || 30
        };
        this.minBlobSize = parseInt(config.minBlobSize) || 100; // pixels
        this.maxTargets = parseInt(config.maxTargets) || 1;
        this.smoothing = parseFloat(config.smoothing) || 0.7; // 0-1
        this.lostTimeout = parseInt(config.lostTimeout) || 1000; // ms
        
        // State
        let currentTargets = [];
        let lastSeen = 0;
        let frameCount = 0;
        let isTracking = false;
        
        // Convert RGB to HSV
        function rgbToHsv(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            let h = 0;
            const s = max === 0 ? 0 : delta / max;
            const v = max;
            
            if (delta !== 0) {
                if (max === r) {
                    h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
                } else if (max === g) {
                    h = ((b - r) / delta + 2) / 6;
                } else {
                    h = ((r - g) / delta + 4) / 6;
                }
            }
            
            return {
                h: Math.round(h * 360),
                s: Math.round(s * 100),
                v: Math.round(v * 100)
            };
        }
        
        // Check if color matches target
        function isColorMatch(pixel) {
            const hsv = rgbToHsv(pixel.r, pixel.g, pixel.b);
            
            // Handle hue wrapping
            let hueDiff = Math.abs(hsv.h - node.targetColor.h);
            if (hueDiff > 180) {
                hueDiff = 360 - hueDiff;
            }
            
            return hueDiff <= node.tolerance.h &&
                   Math.abs(hsv.s - node.targetColor.s) <= node.tolerance.s &&
                   Math.abs(hsv.v - node.targetColor.v) <= node.tolerance.v;
        }
        
        // Find connected components (blobs)
        function findBlobs(mask, width, height) {
            const visited = new Array(width * height).fill(false);
            const blobs = [];
            
            function floodFill(x, y, blob) {
                const stack = [[x, y]];
                
                while (stack.length > 0) {
                    const [cx, cy] = stack.pop();
                    const idx = cy * width + cx;
                    
                    if (cx < 0 || cx >= width || cy < 0 || cy >= height || 
                        visited[idx] || !mask[idx]) {
                        continue;
                    }
                    
                    visited[idx] = true;
                    blob.pixels.push({ x: cx, y: cy });
                    blob.sumX += cx;
                    blob.sumY += cy;
                    
                    // Check 8-connected neighbors
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx !== 0 || dy !== 0) {
                                stack.push([cx + dx, cy + dy]);
                            }
                        }
                    }
                }
            }
            
            // Find all blobs
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    if (mask[idx] && !visited[idx]) {
                        const blob = {
                            pixels: [],
                            sumX: 0,
                            sumY: 0,
                            minX: width,
                            maxX: 0,
                            minY: height,
                            maxY: 0
                        };
                        
                        floodFill(x, y, blob);
                        
                        if (blob.pixels.length >= node.minBlobSize) {
                            // Calculate blob properties
                            blob.centerX = blob.sumX / blob.pixels.length;
                            blob.centerY = blob.sumY / blob.pixels.length;
                            blob.size = blob.pixels.length;
                            
                            // Calculate bounding box
                            blob.pixels.forEach(p => {
                                blob.minX = Math.min(blob.minX, p.x);
                                blob.maxX = Math.max(blob.maxX, p.x);
                                blob.minY = Math.min(blob.minY, p.y);
                                blob.maxY = Math.max(blob.maxY, p.y);
                            });
                            
                            blob.width = blob.maxX - blob.minX + 1;
                            blob.height = blob.maxY - blob.minY + 1;
                            blob.aspectRatio = blob.width / blob.height;
                            
                            blobs.push(blob);
                        }
                    }
                }
            }
            
            // Sort by size (largest first)
            return blobs.sort((a, b) => b.size - a.size);
        }
        
        // Track targets across frames
        function updateTracking(newBlobs, width, _height) {
            const matchedTargets = [];
            const unmatchedBlobs = [...newBlobs];
            
            // Try to match existing targets with new blobs
            currentTargets.forEach(target => {
                let bestMatch = null;
                let bestDistance = Infinity;
                
                unmatchedBlobs.forEach((blob, _idx) => {
                    const dx = blob.centerX - target.predictedX;
                    const dy = blob.centerY - target.predictedY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < bestDistance && distance < width * 0.1) {
                        bestMatch = blob;
                        bestDistance = distance;
                    }
                });
                
                if (bestMatch) {
                    // Update target with smoothing
                    target.x = target.x * node.smoothing + bestMatch.centerX * (1 - node.smoothing);
                    target.y = target.y * node.smoothing + bestMatch.centerY * (1 - node.smoothing);
                    target.width = target.width * node.smoothing + bestMatch.width * (1 - node.smoothing);
                    target.height = target.height * node.smoothing + bestMatch.height * (1 - node.smoothing);
                    
                    // Update velocity
                    target.vx = target.x - target.lastX;
                    target.vy = target.y - target.lastY;
                    target.lastX = target.x;
                    target.lastY = target.y;
                    
                    // Predict next position
                    target.predictedX = target.x + target.vx;
                    target.predictedY = target.y + target.vy;
                    
                    target.lastSeen = Date.now();
                    target.confidence = Math.min(1, target.confidence + 0.1);
                    
                    matchedTargets.push(target);
                    unmatchedBlobs.splice(unmatchedBlobs.indexOf(bestMatch), 1);
                }
            });
            
            // Add new targets from unmatched blobs
            while (unmatchedBlobs.length > 0 && matchedTargets.length < node.maxTargets) {
                const blob = unmatchedBlobs.shift();
                matchedTargets.push({
                    id: `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    x: blob.centerX,
                    y: blob.centerY,
                    lastX: blob.centerX,
                    lastY: blob.centerY,
                    vx: 0,
                    vy: 0,
                    predictedX: blob.centerX,
                    predictedY: blob.centerY,
                    width: blob.width,
                    height: blob.height,
                    confidence: 0.5,
                    lastSeen: Date.now()
                });
            }
            
            // Remove lost targets
            currentTargets = matchedTargets.filter(target => 
                Date.now() - target.lastSeen < node.lostTimeout
            );
            
            return currentTargets;
        }
        
        // Process frame
        function processFrame(imageData, width, height) {
            frameCount++;
            
            // Create binary mask of matching colors
            const mask = new Array(width * height);
            
            for (let i = 0; i < imageData.length; i += 4) {
                const pixel = {
                    r: imageData[i],
                    g: imageData[i + 1],
                    b: imageData[i + 2]
                };
                
                mask[i / 4] = isColorMatch(pixel);
            }
            
            // Find blobs
            const blobs = findBlobs(mask, width, height);
            
            // Update tracking
            const targets = updateTracking(blobs, width, height);
            
            // Generate output
            const output = {
                targets: targets.map(t => ({
                    id: t.id,
                    x: t.x / width,          // Normalize to 0-1
                    y: t.y / height,         // Normalize to 0-1
                    width: t.width / width,
                    height: t.height / height,
                    vx: t.vx / width,
                    vy: t.vy / height,
                    confidence: t.confidence,
                    centered_x: (t.x / width - 0.5) * 2,  // -1 to 1
                    centered_y: (t.y / height - 0.5) * 2  // -1 to 1
                })),
                frameNumber: frameCount,
                timestamp: Date.now(),
                tracking: targets.length > 0
            };
            
            // Update tracking state
            if (targets.length > 0) {
                isTracking = true;
                lastSeen = Date.now();
                
                const mainTarget = targets[0];
                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: `Tracking (${mainTarget.centered_x.toFixed(2)}, ${mainTarget.centered_y.toFixed(2)})`
                });
            } else if (isTracking && Date.now() - lastSeen > node.lostTimeout) {
                isTracking = false;
                output.lost = true;
                node.status({
                    fill: 'yellow',
                    shape: 'ring',
                    text: 'Target lost'
                });
            }
            
            return output;
        }
        
        // Handle input
        node.on('input', (msg) => {
            if (msg.topic === 'config') {
                // Update color configuration
                if (msg.payload.color) {
                    if (msg.payload.color.h !== undefined) {
                        node.targetColor.h = msg.payload.color.h;
                    }
                    if (msg.payload.color.s !== undefined) {
                        node.targetColor.s = msg.payload.color.s;
                    }
                    if (msg.payload.color.v !== undefined) {
                        node.targetColor.v = msg.payload.color.v;
                    }
                }
                if (msg.payload.tolerance) {
                    if (msg.payload.tolerance.h !== undefined) {
                        node.tolerance.h = msg.payload.tolerance.h;
                    }
                    if (msg.payload.tolerance.s !== undefined) {
                        node.tolerance.s = msg.payload.tolerance.s;
                    }
                    if (msg.payload.tolerance.v !== undefined) {
                        node.tolerance.v = msg.payload.tolerance.v;
                    }
                }
                return;
            }
            
            // Process image frame
            if (msg.payload && msg.payload.data && msg.payload.width && msg.payload.height) {
                const result = processFrame(
                    msg.payload.data,
                    msg.payload.width,
                    msg.payload.height
                );
                
                node.send({
                    payload: result,
                    topic: 'color/tracking'
                });
            }
        });
        
        // Initialize
        node.status({
            fill: 'grey',
            shape: 'ring',
            text: 'Waiting for frames'
        });
    }
    
    RED.nodes.registerType('tafy-color-tracker', TafyColorTrackerNode);
};