import { HALMessageEnvelope } from "./types/common/envelope";
import { v4 as uuidv4 } from "uuid";

interface RequestOptions {
  timeout?: number;
  retries?: number;
}

interface ReplyHandler<T> {
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  timer?: NodeJS.Timeout;
  retries: number;
}

export class HALRequestReplyClient {
  private pendingRequests = new Map<string, ReplyHandler<any>>();
  private defaultTimeout = 5000; // 5 seconds
  private defaultRetries = 0;

  /**
   * Send a request and wait for a reply
   */
  async request<T extends HALMessageEnvelope>(
    message: Omit<T, "correlation_id">,
    options: RequestOptions = {}
  ): Promise<T> {
    const correlationId = uuidv4();
    const timeout = options.timeout ?? this.defaultTimeout;
    const retries = options.retries ?? this.defaultRetries;

    // Add correlation ID to message
    const requestMessage = {
      ...message,
      correlation_id: correlationId,
    } as T;

    // Create promise for reply
    const replyPromise = new Promise<T>((resolve, reject) => {
      const handler: ReplyHandler<T> = {
        resolve,
        reject,
        retries,
      };

      // Set timeout
      handler.timer = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        if (handler.retries > 0) {
          // Retry
          handler.retries--;
          this.request<T>(message, { ...options, retries: handler.retries })
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }
      }, timeout);

      this.pendingRequests.set(correlationId, handler);
    });

    // Send the request (caller must implement actual sending)
    await this.sendRequest(requestMessage);

    return replyPromise;
  }

  /**
   * Handle an incoming message that might be a reply
   */
  handleMessage<T extends HALMessageEnvelope>(message: T): boolean {
    if (!message.correlation_id) {
      return false;
    }

    const handler = this.pendingRequests.get(message.correlation_id);
    if (!handler) {
      return false;
    }

    // Clear timeout and remove from pending
    if (handler.timer) {
      clearTimeout(handler.timer);
    }
    this.pendingRequests.delete(message.correlation_id);

    // Resolve the promise
    handler.resolve(message);
    return true;
  }

  /**
   * Create a reply message for a request
   */
  createReply<T extends HALMessageEnvelope>(
    request: T,
    replyPayload: any,
    overrides?: Partial<T>
  ): T {
    return {
      ...request,
      ...overrides,
      payload: replyPayload,
      ts: new Date().toISOString(),
      correlation_id: request.correlation_id,
    } as T;
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(reason = "Cancelled"): void {
    for (const [id, handler] of this.pendingRequests) {
      if (handler.timer) {
        clearTimeout(handler.timer);
      }
      handler.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  /**
   * Override this method to implement actual message sending
   */
  protected async sendRequest(message: HALMessageEnvelope): Promise<void> {
    throw new Error("sendRequest must be implemented by subclass");
  }
}

// NATS-specific implementation
export class NATSHALRequestReplyClient extends HALRequestReplyClient {
  constructor(
    private natsClient: any, // NATS client instance
    private requestSubject: string
  ) {
    super();
  }

  protected async sendRequest(message: HALMessageEnvelope): Promise<void> {
    const data = JSON.stringify(message);
    this.natsClient.publish(this.requestSubject, data);
  }

  /**
   * Subscribe to reply subjects and handle incoming messages
   */
  subscribeToReplies(replySubject: string): void {
    this.natsClient.subscribe(replySubject, (msg: any) => {
      try {
        const message = JSON.parse(msg.data);
        this.handleMessage(message);
      } catch (err) {
        console.error("Failed to parse reply message:", err);
      }
    });
  }
}