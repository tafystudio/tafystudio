#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <VL53L0X.h>

class SensorManager {
private:
    VL53L0X tofSensor;
    bool tofAvailable;
    
    uint16_t lastRange;
    uint16_t currentRange;
    uint8_t rangeQuality;
    unsigned long lastReadTime;
    
public:
    SensorManager();
    void begin();
    void update();
    
    float getRange();  // Returns range in mm, -1 if error
    uint8_t getRangeQuality();  // 0-100 quality score
    bool hasSignificantChange();
    
    bool isTofAvailable() { return tofAvailable; }
};

#endif // SENSOR_MANAGER_H