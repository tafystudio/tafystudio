#include "motor_controller.h"
#include "config.h"

MotorController::MotorController() : leftSpeed(0), rightSpeed(0), lastCommandTime(0), emergencyStop(false) {
}

void MotorController::begin() {
    // Configure motor pins
    pinMode(MOTOR_LEFT_DIR1, OUTPUT);
    pinMode(MOTOR_LEFT_DIR2, OUTPUT);
    pinMode(MOTOR_RIGHT_DIR1, OUTPUT);
    pinMode(MOTOR_RIGHT_DIR2, OUTPUT);
    
    // Configure PWM channels
    ledcSetup(CHANNEL_LEFT, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION);
    ledcSetup(CHANNEL_RIGHT, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION);
    
    ledcAttachPin(MOTOR_LEFT_PWM, CHANNEL_LEFT);
    ledcAttachPin(MOTOR_RIGHT_PWM, CHANNEL_RIGHT);
    
    // Start with motors stopped
    stop();
    
    Serial.println("Motor controller initialized");
}

void MotorController::update() {
    // Check for timeout
    if (lastCommandTime > 0 && millis() - lastCommandTime > MOTOR_TIMEOUT_MS) {
        Serial.println("Motor timeout - stopping");
        stop();
        lastCommandTime = 0;
    }
}

void MotorController::setSpeed(int left, int right) {
    if (emergencyStop) {
        Serial.println("Emergency stop active - ignoring command");
        return;
    }
    
    leftSpeed = constrainSpeed(left);
    rightSpeed = constrainSpeed(right);
    lastCommandTime = millis();
    
    // Set left motor
    if (leftSpeed > 0) {
        digitalWrite(MOTOR_LEFT_DIR1, HIGH);
        digitalWrite(MOTOR_LEFT_DIR2, LOW);
        setMotorPWM(CHANNEL_LEFT, leftSpeed);
    } else if (leftSpeed < 0) {
        digitalWrite(MOTOR_LEFT_DIR1, LOW);
        digitalWrite(MOTOR_LEFT_DIR2, HIGH);
        setMotorPWM(CHANNEL_LEFT, -leftSpeed);
    } else {
        digitalWrite(MOTOR_LEFT_DIR1, LOW);
        digitalWrite(MOTOR_LEFT_DIR2, LOW);
        setMotorPWM(CHANNEL_LEFT, 0);
    }
    
    // Set right motor
    if (rightSpeed > 0) {
        digitalWrite(MOTOR_RIGHT_DIR1, HIGH);
        digitalWrite(MOTOR_RIGHT_DIR2, LOW);
        setMotorPWM(CHANNEL_RIGHT, rightSpeed);
    } else if (rightSpeed < 0) {
        digitalWrite(MOTOR_RIGHT_DIR1, LOW);
        digitalWrite(MOTOR_RIGHT_DIR2, HIGH);
        setMotorPWM(CHANNEL_RIGHT, -rightSpeed);
    } else {
        digitalWrite(MOTOR_RIGHT_DIR1, LOW);
        digitalWrite(MOTOR_RIGHT_DIR2, LOW);
        setMotorPWM(CHANNEL_RIGHT, 0);
    }
}

void MotorController::stop() {
    leftSpeed = 0;
    rightSpeed = 0;
    
    // Stop both motors
    digitalWrite(MOTOR_LEFT_DIR1, LOW);
    digitalWrite(MOTOR_LEFT_DIR2, LOW);
    digitalWrite(MOTOR_RIGHT_DIR1, LOW);
    digitalWrite(MOTOR_RIGHT_DIR2, LOW);
    
    setMotorPWM(CHANNEL_LEFT, 0);
    setMotorPWM(CHANNEL_RIGHT, 0);
}

void MotorController::emergencyStopTrigger() {
    emergencyStop = true;
    stop();
    Serial.println("EMERGENCY STOP ACTIVATED");
}

void MotorController::emergencyStopClear() {
    emergencyStop = false;
    Serial.println("Emergency stop cleared");
}

void MotorController::setMotorPWM(int channel, int speed) {
    int pwmValue = map(speed, 0, 100, 0, MOTOR_MAX_PWM);
    ledcWrite(channel, pwmValue);
}

int MotorController::constrainSpeed(int speed) {
    // Apply deadzone
    if (abs(speed) < MOTOR_DEADZONE) {
        return 0;
    }
    
    // Constrain to -100 to 100
    return constrain(speed, -100, 100);
}

void MotorController::handleCommand(JsonDocument& command) {
    // Handle differential drive command
    if (command.containsKey("linear_meters_per_sec") && command.containsKey("angular_rad_per_sec")) {
        float linear = command["linear_meters_per_sec"].as<float>();
        float angular = command["angular_rad_per_sec"].as<float>();
        
        // Convert to differential speeds (simplified kinematics)
        // Assuming wheel base of 0.2m and max speed of 1 m/s
        const float WHEEL_BASE = 0.2;
        const float MAX_SPEED = 1.0;
        
        float leftVel = linear - (angular * WHEEL_BASE / 2.0);
        float rightVel = linear + (angular * WHEEL_BASE / 2.0);
        
        // Convert to percentage
        int leftPercent = (leftVel / MAX_SPEED) * 100;
        int rightPercent = (rightVel / MAX_SPEED) * 100;
        
        setSpeed(leftPercent, rightPercent);
        
        Serial.println("Motor command: L=" + String(leftPercent) + "% R=" + String(rightPercent) + "%");
    }
    
    // Handle duration
    if (command.containsKey("duration_ms")) {
        int duration = command["duration_ms"];
        // TODO: Implement timed commands
    }
}

void MotorController::publishTelemetry() {
    // TODO: Publish motor telemetry via NATS
}