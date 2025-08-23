#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <VL53L0X.h>
#include <ArduinoJson.h>
#include "nats_client.h"

class SensorManager {
private:
    VL53L0X tofSensor;
    bool tofAvailable;
    
    // Raw measurements
    uint16_t lastRange;
    uint16_t currentRange;
    uint8_t rangeQuality;
    unsigned long lastReadTime;
    
    // Filtering
    static const int FILTER_SIZE = 5;
    uint16_t rangeBuffer[FILTER_SIZE];
    uint8_t bufferIndex;
    uint16_t filteredRange;
    
    // Calibration
    int16_t calibrationOffset;
    float calibrationScale;
    
    // Configuration
    enum MeasurementMode {
        MODE_DEFAULT,      // Default accuracy/speed
        MODE_HIGH_SPEED,   // Fast but less accurate
        MODE_HIGH_ACCURACY, // Slow but more accurate
        MODE_LONG_RANGE    // Extended range
    };
    MeasurementMode currentMode;
    
    // Statistics
    uint32_t totalReadings;
    uint32_t validReadings;
    uint32_t timeouts;
    
    // Methods
    uint16_t applyMedianFilter();
    uint16_t applyCalibration(uint16_t rawValue);
    
public:
    SensorManager();
    void begin();
    void update();
    
    float getRange();  // Returns range in mm, -1 if error
    float getFilteredRange();  // Returns filtered range in mm
    uint8_t getRangeQuality();  // 0-100 quality score
    bool hasSignificantChange();
    
    bool isTofAvailable() { return tofAvailable; }
    
    // Configuration
    void setMeasurementMode(MeasurementMode mode);
    void calibrate(uint16_t actualDistance);
    void setCalibration(int16_t offset, float scale);
    
    // Telemetry
    void publishTelemetry(NATSClient* natsClient, const String& deviceId);
    void handleCommand(JsonDocument& command);
    
    // Statistics
    void getStatistics(uint32_t& total, uint32_t& valid, uint32_t& timeoutCount) {
        total = totalReadings;
        valid = validReadings;
        timeoutCount = timeouts;
    }
};

#endif // SENSOR_MANAGER_H