/* eslint-disable */

/**
 * Standard envelope for all HAL messages
 */
export interface HALMessageEnvelope {
  /**
   * Major version of HAL specification
   */
  hal_major: number;
  /**
   * Minor version of HAL specification
   */
  hal_minor: number;
  /**
   * Schema identifier for payload (e.g., tafylabs/hal/motor/differential/1.0)
   */
  schema: string;
  /**
   * Unique device identifier
   */
  device_id: string;
  /**
   * Array of capability strings with versions (e.g., motor.differential:v1.0)
   */
  caps: string[];
  /**
   * ISO 8601 timestamp
   */
  ts: string;
  /**
   * Message payload conforming to schema
   */
  payload: {
    [k: string]: unknown;
  };
  /**
   * Optional sequence number for ordering
   */
  seq?: number;
  /**
   * Optional correlation ID for request/response patterns
   */
  correlation_id?: string;
}
