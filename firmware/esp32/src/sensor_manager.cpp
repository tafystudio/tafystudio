#include "sensor_manager.h"
#include "config.h"

SensorManager::SensorManager() : tofAvailable(false), lastRange(0), currentRange(0), 
                                 rangeQuality(0), lastReadTime(0) {
}

void SensorManager::begin() {
    // Initialize I2C
    Wire.begin(TOF_SDA, TOF_SCL);
    
    // Initialize ToF sensor
    pinMode(TOF_XSHUT, OUTPUT);
    digitalWrite(TOF_XSHUT, HIGH);
    delay(10);
    
    tofSensor.setTimeout(500);
    if (tofSensor.init()) {
        tofAvailable = true;
        
        // Configure for high speed measurements
        tofSensor.setMeasurementTimingBudget(20000); // 20ms
        
        Serial.println("ToF sensor initialized");
    } else {
        Serial.println("ToF sensor not found");
        tofAvailable = false;
    }
}

void SensorManager::update() {
    if (!tofAvailable) return;
    
    // Read ToF sensor
    uint16_t reading = tofSensor.readRangeSingleMillimeters();
    
    if (!tofSensor.timeoutOccurred()) {
        lastRange = currentRange;
        currentRange = reading;
        
        // Calculate quality based on signal strength and consistency
        if (reading < SENSOR_RANGE_MIN_MM || reading > SENSOR_RANGE_MAX_MM) {
            rangeQuality = 0;  // Out of range
        } else {
            rangeQuality = 100;  // Simplified - could use sensor's signal rate
        }
        
        lastReadTime = millis();
    } else {
        rangeQuality = 0;
        Serial.println("ToF timeout");
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
    int change = abs((int)currentRange - (int)lastRange);
    return change > SENSOR_CHANGE_THRESHOLD;
}