/* eslint-disable */

/**
 * Standard envelope for all HAL messages in Tafy Studio
 */
export interface HALMessageEnvelope {
  /**
   * Major version of HAL specification (breaking changes)
   */
  hal_major: number;
  /**
   * Minor version of HAL specification (additions only)
   */
  hal_minor: number;
  /**
   * Full schema identifier for payload
   */
  schema: string;
  /**
   * Unique device identifier
   */
  device_id: string;
  /**
   * Array of capability strings with versions
   */
  caps: string[];
  /**
   * ISO 8601 timestamp
   */
  ts: string;
  /**
   * The actual message data conforming to the specified schema
   */
  payload: {
    [k: string]: unknown;
  };
}
