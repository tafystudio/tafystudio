#include <gtest/gtest.h>
#include "config.hpp"
#include "hal_message.hpp"

TEST(ConfigTest, LoadDefault) {
    auto config = Config::load();
    EXPECT_FALSE(config.device_id.empty());
    EXPECT_GT(config.sample_rate, 0);
    EXPECT_FALSE(config.nats.url.empty());
}

TEST(HALMessageTest, Serialization) {
    HALMessage msg;
    msg.hal_major = 1;
    msg.hal_minor = 0;
    msg.schema = "test/schema/1.0";
    msg.device_id = "test-device";
    msg.caps = {"test:v1.0"};
    msg.ts = "2024-01-01T00:00:00Z";
    msg.payload = R"({"test": "value"})";

    std::string json = msg.toJson();
    EXPECT_FALSE(json.empty());

    HALMessage parsed = HALMessage::fromJson(json);
    EXPECT_EQ(parsed.device_id, msg.device_id);
    EXPECT_EQ(parsed.schema, msg.schema);
}

// TODO: Add more tests
