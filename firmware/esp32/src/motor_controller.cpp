#include "motor_controller.h"
#include "config.h"

MotorController::MotorController() : leftSpeed(0), rightSpeed(0), targetLeftSpeed(0), targetRightSpeed(0),
                                       lastCommandTime(0), lastUpdateTime(0), emergencyStop(false),
                                       wheelBase(0.2), wheelRadius(0.035), maxLinearVel(1.0), maxAngularVel(2.0),
                                       rampRate(200.0), x(0), y(0), theta(0), lastOdometryTime(0) {
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
    unsigned long now = millis();
    
    // Check for timeout
    if (lastCommandTime > 0 && now - lastCommandTime > MOTOR_TIMEOUT_MS) {
        Serial.println("Motor timeout - stopping");
        stop();
        lastCommandTime = 0;
    }
    
    // Apply speed ramping
    if (now - lastUpdateTime >= 10) {  // Update every 10ms
        applySpeedRamping();
        updateOdometry();
        lastUpdateTime = now;
    }
}

void MotorController::setSpeed(int left, int right) {
    if (emergencyStop) {
        Serial.println("Emergency stop active - ignoring command");
        return;
    }
    
    targetLeftSpeed = constrainSpeed(left);
    targetRightSpeed = constrainSpeed(right);
    lastCommandTime = millis();
}

void MotorController::stop() {
    targetLeftSpeed = 0;
    targetRightSpeed = 0;
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
        
        int leftPercent, rightPercent;
        differentialDriveIK(linear, angular, leftPercent, rightPercent);
        
        setSpeed(leftPercent, rightPercent);
        
        Serial.println("Motor command: L=" + String(leftPercent) + "% R=" + String(rightPercent) + "%");
    }
    
    // Handle direct wheel speeds
    if (command.containsKey("left_percent") && command.containsKey("right_percent")) {
        int left = command["left_percent"].as<int>();
        int right = command["right_percent"].as<int>();
        setSpeed(left, right);
    }
    
    // Handle robot parameters update
    if (command.containsKey("robot_params")) {
        JsonObject params = command["robot_params"];
        if (params.containsKey("wheel_base")) wheelBase = params["wheel_base"].as<float>();
        if (params.containsKey("wheel_radius")) wheelRadius = params["wheel_radius"].as<float>();
        if (params.containsKey("max_linear_vel")) maxLinearVel = params["max_linear_vel"].as<float>();
        if (params.containsKey("max_angular_vel")) maxAngularVel = params["max_angular_vel"].as<float>();
    }
    
    // Handle odometry reset
    if (command.containsKey("reset_odometry") && command["reset_odometry"].as<bool>()) {
        resetOdometry();
    }
}

void MotorController::publishTelemetry(NATSClient* natsClient, const String& deviceId) {
    if (!natsClient || !natsClient->connected()) {
        return;
    }
    
    StaticJsonDocument<512> doc;
    
    // HAL envelope
    doc["hal_major"] = 1;
    doc["hal_minor"] = 0;
    doc["schema"] = "tafylabs/hal/motor/differential-telemetry/1.0";
    doc["device_id"] = deviceId;
    doc["ts"] = millis();
    
    // Payload matching the schema
    JsonObject payload = doc.createNestedObject("payload");
    
    // Calculate actual velocities
    float leftVel = (leftSpeed / 100.0) * maxLinearVel;
    float rightVel = (rightSpeed / 100.0) * maxLinearVel;
    float linearVel = (leftVel + rightVel) / 2.0;
    float angularVel = (rightVel - leftVel) / wheelBase;
    
    // Required fields
    payload["actual_linear_meters_per_sec"] = linearVel;
    payload["actual_angular_rad_per_sec"] = angularVel;
    
    // Commanded velocities (from targets)
    float targetLeftVel = (targetLeftSpeed / 100.0) * maxLinearVel;
    float targetRightVel = (targetRightSpeed / 100.0) * maxLinearVel;
    float targetLinearVel = (targetLeftVel + targetRightVel) / 2.0;
    float targetAngularVel = (targetRightVel - targetLeftVel) / wheelBase;
    
    payload["commanded_linear_meters_per_sec"] = targetLinearVel;
    payload["commanded_angular_rad_per_sec"] = targetAngularVel;
    
    // Odometry (required)
    JsonObject odometry = payload.createNestedObject("odometry");
    odometry["x_meters"] = x;
    odometry["y_meters"] = y;
    odometry["theta_rad"] = theta;
    
    // Wheel velocities
    JsonObject wheelVel = payload.createNestedObject("wheel_velocities");
    wheelVel["left_meters_per_sec"] = leftVel;
    wheelVel["right_meters_per_sec"] = rightVel;
    
    // Status
    if (emergencyStop) {
        payload["status"] = "emergency_stop";
    } else if (abs(leftSpeed) > 0 || abs(rightSpeed) > 0) {
        payload["status"] = "moving";
    } else {
        payload["status"] = "idle";
    }
    
    // Publish to NATS
    String subject = "hal.v1.motor.telemetry." + deviceId;
    natsClient->publish(subject.c_str(), doc);
}

void MotorController::setRobotParameters(float wb, float wr, float mlv, float mav) {
    wheelBase = wb;
    wheelRadius = wr;
    maxLinearVel = mlv;
    maxAngularVel = mav;
}

void MotorController::differentialDriveIK(float linear, float angular, int& leftOut, int& rightOut) {
    // Constrain inputs
    linear = constrain(linear, -maxLinearVel, maxLinearVel);
    angular = constrain(angular, -maxAngularVel, maxAngularVel);
    
    // Calculate wheel velocities using differential drive kinematics
    float leftVel = linear - (angular * wheelBase / 2.0);
    float rightVel = linear + (angular * wheelBase / 2.0);
    
    // Find the maximum velocity to scale appropriately
    float maxVel = max(abs(leftVel), abs(rightVel));
    
    // Scale down if exceeding max velocity
    if (maxVel > maxLinearVel) {
        leftVel = (leftVel / maxVel) * maxLinearVel;
        rightVel = (rightVel / maxVel) * maxLinearVel;
    }
    
    // Convert to percentage (-100 to 100)
    leftOut = (leftVel / maxLinearVel) * 100;
    rightOut = (rightVel / maxLinearVel) * 100;
}

void MotorController::applySpeedRamping() {
    // Calculate time delta in seconds
    float dt = 0.01;  // 10ms update rate
    
    // Maximum change per update based on ramp rate
    float maxChange = rampRate * dt;
    
    // Ramp left motor
    if (abs(targetLeftSpeed - leftSpeed) > maxChange) {
        if (targetLeftSpeed > leftSpeed) {
            leftSpeed += maxChange;
        } else {
            leftSpeed -= maxChange;
        }
    } else {
        leftSpeed = targetLeftSpeed;
    }
    
    // Ramp right motor
    if (abs(targetRightSpeed - rightSpeed) > maxChange) {
        if (targetRightSpeed > rightSpeed) {
            rightSpeed += maxChange;
        } else {
            rightSpeed -= maxChange;
        }
    } else {
        rightSpeed = targetRightSpeed;
    }
    
    // Apply the ramped speeds to motors
    applyMotorSpeeds();
}

void MotorController::applyMotorSpeeds() {
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

void MotorController::updateOdometry() {
    unsigned long now = millis();
    if (lastOdometryTime == 0) {
        lastOdometryTime = now;
        return;
    }
    
    float dt = (now - lastOdometryTime) / 1000.0;  // Convert to seconds
    lastOdometryTime = now;
    
    // Convert motor speeds (percent) to wheel velocities (m/s)
    float leftVel = (leftSpeed / 100.0) * maxLinearVel;
    float rightVel = (rightSpeed / 100.0) * maxLinearVel;
    
    // Calculate robot velocities
    float linearVel = (leftVel + rightVel) / 2.0;
    float angularVel = (rightVel - leftVel) / wheelBase;
    
    // Update position using simple integration
    if (abs(angularVel) < 0.001) {
        // Straight line motion
        x += linearVel * cos(theta) * dt;
        y += linearVel * sin(theta) * dt;
    } else {
        // Arc motion
        float radius = linearVel / angularVel;
        x += radius * (sin(theta + angularVel * dt) - sin(theta));
        y += radius * (cos(theta) - cos(theta + angularVel * dt));
        theta += angularVel * dt;
    }
    
    // Normalize theta to [-pi, pi]
    while (theta > M_PI) theta -= 2 * M_PI;
    while (theta < -M_PI) theta += 2 * M_PI;
}