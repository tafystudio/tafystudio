import { HALRequestReplyClient, NATSHALRequestReplyClient } from "../request-reply";
import { HALMessageEnvelope } from "../types/common/envelope";

// Mock NATS client
class MockNATSClient {
  private handlers: Map<string, (msg: any) => void> = new Map();
  private published: Array<{ subject: string; data: string }> = [];

  publish(subject: string, data: string) {
    this.published.push({ subject, data });
    // Simulate message delivery
    setTimeout(() => {
      const handler = this.handlers.get(subject);
      if (handler) {
        handler({ data });
      }
    }, 10);
  }

  subscribe(subject: string, cb: (msg: any) => void) {
    this.handlers.set(subject, cb);
  }

  getPublished() {
    return this.published;
  }
}

describe("HALRequestReplyClient", () => {
  describe("Basic functionality", () => {
    class TestClient extends HALRequestReplyClient {
      public sentRequests: HALMessageEnvelope[] = [];

      protected async sendRequest(message: HALMessageEnvelope): Promise<void> {
        this.sentRequests.push(message);
      }

      // Expose handleMessage for testing
      public testHandleMessage(message: HALMessageEnvelope): boolean {
        return this.handleMessage(message);
      }
    }

    it("should add correlation ID to requests", async () => {
      const client = new TestClient();
      const request = {
        hal_major: 1,
        hal_minor: 0,
        schema: "test/hal/command/test/1.0",
        device_id: "test-device",
        caps: ["test.command:v1.0"],
        ts: new Date().toISOString(),
        payload: { command: "test" },
      };

      // Start request (don't await)
      const promise = client.request(request);

      // Check that correlation ID was added
      expect(client.sentRequests.length).toBe(1);
      expect(client.sentRequests[0].correlation_id).toBeDefined();
      expect(typeof client.sentRequests[0].correlation_id).toBe("string");

      // Clean up
      client.cancelAll();
      await expect(promise).rejects.toThrow("Cancelled");
    });

    it("should resolve promise when matching reply is received", async () => {
      const client = new TestClient();
      const request = {
        hal_major: 1,
        hal_minor: 0,
        schema: "test/hal/command/test/1.0",
        device_id: "test-device",
        caps: ["test.command:v1.0"],
        ts: new Date().toISOString(),
        payload: { command: "test" },
      };

      // Start request
      const promise = client.request(request);
      const correlationId = client.sentRequests[0].correlation_id!;

      // Simulate reply
      const reply: HALMessageEnvelope = {
        ...request,
        correlation_id: correlationId,
        payload: { result: "success" },
      };

      client.testHandleMessage(reply);

      // Should resolve with reply
      const result = await promise;
      expect(result.payload).toEqual({ result: "success" });
    });

    it("should timeout if no reply is received", async () => {
      const client = new TestClient();
      const request = {
        hal_major: 1,
        hal_minor: 0,
        schema: "test/hal/command/test/1.0",
        device_id: "test-device",
        caps: ["test.command:v1.0"],
        ts: new Date().toISOString(),
        payload: { command: "test" },
      };

      // Use short timeout for test
      const promise = client.request(request, { timeout: 100 });

      await expect(promise).rejects.toThrow("Request timeout after 100ms");
    });

    it("should retry on timeout if retries are specified", async () => {
      const client = new TestClient();
      const request = {
        hal_major: 1,
        hal_minor: 0,
        schema: "test/hal/command/test/1.0",
        device_id: "test-device",
        caps: ["test.command:v1.0"],
        ts: new Date().toISOString(),
        payload: { command: "test" },
      };

      // Use short timeout and 1 retry
      const promise = client.request(request, { timeout: 50, retries: 1 });

      // Wait for first timeout
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should have sent 2 requests (original + 1 retry)
      expect(client.sentRequests.length).toBe(2);

      // Clean up
      client.cancelAll();
      await expect(promise).rejects.toThrow("Cancelled");
    });

    it("should create reply with correlation ID", () => {
      const client = new TestClient();
      const request: HALMessageEnvelope = {
        hal_major: 1,
        hal_minor: 0,
        schema: "test/hal/command/test/1.0",
        device_id: "test-device",
        caps: ["test.command:v1.0"],
        ts: new Date().toISOString(),
        payload: { command: "test" },
        correlation_id: "test-correlation-id",
      };

      const reply = client.createReply(request, { result: "success" });

      expect(reply.correlation_id).toBe("test-correlation-id");
      expect(reply.payload).toEqual({ result: "success" });
      expect(reply.device_id).toBe("test-device");
    });
  });

  describe("NATS integration", () => {
    it("should publish and handle messages through NATS", async () => {
      const natsClient = new MockNATSClient();
      const client = new NATSHALRequestReplyClient(
        natsClient,
        "hal.v1.command"
      );

      // Subscribe to replies
      client.subscribeToReplies("hal.v1.reply");

      const request = {
        hal_major: 1,
        hal_minor: 0,
        schema: "test/hal/command/test/1.0",
        device_id: "test-device",
        caps: ["test.command:v1.0"],
        ts: new Date().toISOString(),
        payload: { command: "test" },
      };

      // Start request
      const promise = client.request(request);

      // Check message was published
      const published = natsClient.getPublished();
      expect(published.length).toBe(1);
      expect(published[0].subject).toBe("hal.v1.command");

      const sentMessage = JSON.parse(published[0].data);
      expect(sentMessage.correlation_id).toBeDefined();

      // Simulate reply handler
      natsClient.subscribe("hal.v1.reply", (msg: any) => {
        const message = JSON.parse(msg.data);
        if (message.correlation_id === sentMessage.correlation_id) {
          const reply = {
            ...message,
            payload: { result: "success" },
          };
          // Simulate publishing reply back
          setTimeout(() => {
            const handler = (natsClient as any).handlers.get("hal.v1.reply");
            if (handler) {
              handler({ data: JSON.stringify(reply) });
            }
          }, 10);
        }
      });

      // Trigger the reply
      const handler = (natsClient as any).handlers.get("hal.v1.command");
      handler({ data: published[0].data });

      // Wait for reply
      const result = await promise;
      expect(result.payload).toEqual({ result: "success" });
    });
  });
});