#include "sensor_manager.h"
#include "config.h"

SensorManager::SensorManager() : tofAvailable(false), lastRange(0), currentRange(0), 
                                 rangeQuality(0), lastReadTime(0), bufferIndex(0),
                                 filteredRange(0), calibrationOffset(0), calibrationScale(1.0),
                                 currentMode(MODE_DEFAULT), totalReadings(0), 
                                 validReadings(0), timeouts(0) {
    // Initialize filter buffer
    for (int i = 0; i < FILTER_SIZE; i++) {
        rangeBuffer[i] = 0;
    }
}

void SensorManager::begin() {
    // Initialize I2C
    Wire.begin(TOF_SDA, TOF_SCL);
    Wire.setClock(400000); // 400kHz I2C
    
    // Initialize ToF sensor
    pinMode(TOF_XSHUT, OUTPUT);
    digitalWrite(TOF_XSHUT, HIGH);
    delay(10);
    
    tofSensor.setTimeout(500);
    if (tofSensor.init()) {
        tofAvailable = true;
        
        // Set default measurement mode
        setMeasurementMode(MODE_DEFAULT);
        
        // Start continuous measurements
        tofSensor.startContinuous();
        
        Serial.println("ToF sensor initialized");
        Serial.println("Mode: Default (balanced speed/accuracy)");
    } else {
        Serial.println("ToF sensor not found");
        tofAvailable = false;
    }
}

void SensorManager::update() {
    if (!tofAvailable) return;
    
    totalReadings++;
    
    // Read ToF sensor (continuous mode)
    uint16_t reading = tofSensor.readRangeContinuousMillimeters();
    
    if (!tofSensor.timeoutOccurred()) {
        validReadings++;
        lastRange = currentRange;
        
        // Apply calibration
        currentRange = applyCalibration(reading);
        
        // Add to filter buffer
        rangeBuffer[bufferIndex] = currentRange;
        bufferIndex = (bufferIndex + 1) % FILTER_SIZE;
        
        // Apply median filter
        filteredRange = applyMedianFilter();
        
        // Calculate quality based on signal/noise ratio
        uint8_t signalRate = tofSensor.readReg(VL53L0X::RESULT_RANGE_STATUS) >> 3;
        
        if (currentRange < SENSOR_RANGE_MIN_MM || currentRange > SENSOR_RANGE_MAX_MM) {
            rangeQuality = 0;  // Out of range
        } else if (signalRate < 2) {
            rangeQuality = 25;  // Weak signal
        } else if (signalRate < 5) {
            rangeQuality = 50;  // Moderate signal
        } else if (signalRate < 10) {
            rangeQuality = 75;  // Good signal
        } else {
            rangeQuality = 100;  // Excellent signal
        }
        
        lastReadTime = millis();
    } else {
        timeouts++;
        rangeQuality = 0;
        
        // Restart continuous mode after timeout
        tofSensor.stopContinuous();
        delay(10);
        tofSensor.startContinuous();
    }
}

float SensorManager::getRange() {
    if (!tofAvailable || rangeQuality == 0) {
        return -1;
    }
    
    return currentRange;
}

uint8_t SensorManager::getRangeQuality() {
    return rangeQuality;
}

bool SensorManager::hasSignificantChange() {
    if (!tofAvailable) return false;
    
    // Check if change exceeds threshold
    int change = abs((int)filteredRange - (int)lastRange);
    return change > SENSOR_CHANGE_THRESHOLD;
}

float SensorManager::getFilteredRange() {
    if (!tofAvailable || rangeQuality == 0) {
        return -1;
    }
    
    return filteredRange;
}

uint16_t SensorManager::applyMedianFilter() {
    // Copy buffer for sorting
    uint16_t sorted[FILTER_SIZE];
    int validCount = 0;
    
    for (int i = 0; i < FILTER_SIZE; i++) {
        if (rangeBuffer[i] > 0) {
            sorted[validCount++] = rangeBuffer[i];
        }
    }
    
    if (validCount == 0) return currentRange;
    
    // Simple bubble sort for small array
    for (int i = 0; i < validCount - 1; i++) {
        for (int j = 0; j < validCount - i - 1; j++) {
            if (sorted[j] > sorted[j + 1]) {
                uint16_t temp = sorted[j];
                sorted[j] = sorted[j + 1];
                sorted[j + 1] = temp;
            }
        }
    }
    
    // Return median
    return sorted[validCount / 2];
}

uint16_t SensorManager::applyCalibration(uint16_t rawValue) {
    // Apply linear calibration: corrected = (raw * scale) + offset
    int32_t calibrated = (int32_t)(rawValue * calibrationScale) + calibrationOffset;
    
    // Ensure positive and within uint16_t range
    if (calibrated < 0) calibrated = 0;
    if (calibrated > 65535) calibrated = 65535;
    
    return (uint16_t)calibrated;
}

void SensorManager::setMeasurementMode(MeasurementMode mode) {
    if (!tofAvailable) return;
    
    currentMode = mode;
    
    // Stop continuous mode to change settings
    tofSensor.stopContinuous();
    
    switch (mode) {
        case MODE_HIGH_SPEED:
            // 20ms timing budget, reduced accuracy
            tofSensor.setMeasurementTimingBudget(20000);
            Serial.println("ToF mode: High Speed (20ms)");
            break;
            
        case MODE_HIGH_ACCURACY:
            // 200ms timing budget, high accuracy
            tofSensor.setMeasurementTimingBudget(200000);
            Serial.println("ToF mode: High Accuracy (200ms)");
            break;
            
        case MODE_LONG_RANGE:
            // 33ms timing budget with different settings
            tofSensor.setMeasurementTimingBudget(33000);
            // Could add VCSEL pulse period adjustments here
            Serial.println("ToF mode: Long Range (33ms)");
            break;
            
        case MODE_DEFAULT:
        default:
            // 30ms timing budget, balanced
            tofSensor.setMeasurementTimingBudget(30000);
            Serial.println("ToF mode: Default (30ms)");
            break;
    }
    
    // Restart continuous mode
    tofSensor.startContinuous();
}

void SensorManager::calibrate(uint16_t actualDistance) {
    if (!tofAvailable || currentRange == 0) return;
    
    // Calculate offset based on current reading vs actual
    calibrationOffset = actualDistance - currentRange;
    
    Serial.print("Calibration: Measured ");
    Serial.print(currentRange);
    Serial.print("mm, Actual ");
    Serial.print(actualDistance);
    Serial.print("mm, Offset ");
    Serial.println(calibrationOffset);
}

void SensorManager::setCalibration(int16_t offset, float scale) {
    calibrationOffset = offset;
    calibrationScale = scale;
    
    Serial.print("Calibration set: Offset=");
    Serial.print(offset);
    Serial.print(", Scale=");
    Serial.println(scale);
}

void SensorManager::publishTelemetry(NATSClient* natsClient, const String& deviceId) {
    if (!natsClient || !natsClient->connected() || !tofAvailable) {
        return;
    }
    
    StaticJsonDocument<512> doc;
    
    // HAL envelope
    doc["hal_major"] = 1;
    doc["hal_minor"] = 0;
    doc["schema"] = "tafylabs/hal/sensor/range-tof/1.0";
    doc["device_id"] = deviceId;
    doc["ts"] = millis();
    
    // Payload
    JsonObject payload = doc.createNestedObject("payload");
    payload["sensor_id"] = "tof-front";
    payload["range_meters"] = filteredRange / 1000.0;  // Convert mm to meters
    payload["raw_mm"] = currentRange;
    payload["filtered_mm"] = filteredRange;
    payload["quality"] = rangeQuality;
    payload["status"] = rangeQuality > 0 ? "ok" : "error";
    
    // Additional telemetry
    JsonObject stats = payload.createNestedObject("statistics");
    stats["total_readings"] = totalReadings;
    stats["valid_readings"] = validReadings;
    stats["timeouts"] = timeouts;
    stats["success_rate"] = totalReadings > 0 ? (float)validReadings / totalReadings : 0;
    
    // Calibration info
    JsonObject cal = payload.createNestedObject("calibration");
    cal["offset"] = calibrationOffset;
    cal["scale"] = calibrationScale;
    
    // Publish to NATS
    String subject = "hal.v1.sensor.range.telemetry." + deviceId;
    natsClient->publish(subject.c_str(), doc);
}

void SensorManager::handleCommand(JsonDocument& command) {
    // Handle sensor configuration commands
    if (command.containsKey("mode")) {
        String mode = command["mode"].as<String>();
        if (mode == "high_speed") {
            setMeasurementMode(MODE_HIGH_SPEED);
        } else if (mode == "high_accuracy") {
            setMeasurementMode(MODE_HIGH_ACCURACY);
        } else if (mode == "long_range") {
            setMeasurementMode(MODE_LONG_RANGE);
        } else {
            setMeasurementMode(MODE_DEFAULT);
        }
    }
    
    // Handle calibration command
    if (command.containsKey("calibrate")) {
        uint16_t actualDist = command["calibrate"]["actual_distance_mm"];
        calibrate(actualDist);
    }
    
    // Handle manual calibration values
    if (command.containsKey("calibration")) {
        JsonObject cal = command["calibration"];
        if (cal.containsKey("offset") && cal.containsKey("scale")) {
            setCalibration(cal["offset"], cal["scale"]);
        }
    }
}