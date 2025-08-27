#pragma once

#include <string>
#include <vector>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <nlohmann/json.hpp>

struct HALMessage {
    int hal_major;
    int hal_minor;
    std::string schema;
    std::string device_id;
    std::vector<std::string> caps;
    std::string ts;
    std::string payload; // JSON string

    std::string toJson() const {
        nlohmann::json j;
        j["hal_major"] = hal_major;
        j["hal_minor"] = hal_minor;
        j["schema"] = schema;
        j["device_id"] = device_id;
        j["caps"] = caps;
        j["ts"] = ts;
        j["payload"] = nlohmann::json::parse(payload);
        return j.dump();
    }

    static HALMessage fromJson(const std::string& jsonStr) {
        auto j = nlohmann::json::parse(jsonStr);
        HALMessage msg;
        msg.hal_major = j["hal_major"];
        msg.hal_minor = j["hal_minor"];
        msg.schema = j["schema"];
        msg.device_id = j["device_id"];
        msg.caps = j["caps"].get<std::vector<std::string>>();
        msg.ts = j["ts"];
        msg.payload = j["payload"].dump();
        return msg;
    }
};

inline std::string getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto itt = std::chrono::system_clock::to_time_t(now);
    std::ostringstream ss;
    ss << std::put_time(gmtime(&itt), "%FT%TZ");
    return ss.str();
}
