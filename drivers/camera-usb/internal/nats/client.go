package nats

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/rs/zerolog/log"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/config"
)

// Client represents a NATS client for HAL communication
type Client struct {
	conn   *nats.Conn
	config config.NATSConfig
	nodeID string
}

// HALMessage represents a HAL message envelope
type HALMessage struct {
	HALMajor  int         `json:"hal_major"`
	HALMinor  int         `json:"hal_minor"`
	Schema    string      `json:"schema"`
	DeviceID  string      `json:"device_id"`
	Caps      []string    `json:"caps"`
	Timestamp time.Time   `json:"ts"`
	Payload   interface{} `json:"payload"`
}

// CameraFramePayload represents camera frame metadata
type CameraFramePayload struct {
	CameraID   string  `json:"camera_id"`
	Resolution string  `json:"resolution"`
	Format     string  `json:"format"`
	FPS        int     `json:"fps"`
	Timestamp  int64   `json:"timestamp"`
	FrameCount uint64  `json:"frame_count"`
	Size       int     `json:"size"`
	URL        string  `json:"url,omitempty"`
}

// CameraStatusPayload represents camera status
type CameraStatusPayload struct {
	CameraID    string  `json:"camera_id"`
	Status      string  `json:"status"`
	Resolution  string  `json:"resolution"`
	FPS         int     `json:"fps"`
	FrameCount  uint64  `json:"frame_count"`
	ErrorCount  uint64  `json:"error_count"`
	LastError   string  `json:"last_error,omitempty"`
	StreamURL   string  `json:"stream_url"`
}

// Connect establishes connection to NATS server
func Connect(cfg config.NATSConfig) (*Client, error) {
	opts := []nats.Option{
		nats.Name(cfg.Name),
		nats.ReconnectWait(time.Duration(cfg.ReconnectMS) * time.Millisecond),
		nats.MaxReconnects(-1),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			log.Warn().Err(err).Msg("NATS disconnected")
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			log.Info().Str("url", nc.ConnectedUrl()).Msg("NATS reconnected")
		}),
		nats.ErrorHandler(func(nc *nats.Conn, sub *nats.Subscription, err error) {
			log.Error().
				Err(err).
				Str("subject", sub.Subject).
				Msg("NATS error")
		}),
	}
	
	conn, err := nats.Connect(cfg.URL, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}
	
	client := &Client{
		conn:   conn,
		config: cfg,
	}
	
	log.Info().Str("url", cfg.URL).Msg("Connected to NATS")
	
	return client, nil
}

// SetNodeID sets the node ID for HAL messages
func (c *Client) SetNodeID(nodeID string) {
	c.nodeID = nodeID
}

// Close closes the NATS connection
func (c *Client) Close() {
	if c.conn != nil {
		c.conn.Close()
	}
}

// PublishFrameMetadata publishes camera frame metadata
func (c *Client) PublishFrameMetadata(cameraID string, resolution string, format string, fps int, frameCount uint64, frameSize int, streamURL string) error {
	msg := HALMessage{
		HALMajor:  1,
		HALMinor:  0,
		Schema:    "tafylabs/hal/camera/frame/1.0",
		DeviceID:  c.nodeID,
		Caps:      []string{"camera.usb:v1.0"},
		Timestamp: time.Now(),
		Payload: CameraFramePayload{
			CameraID:   cameraID,
			Resolution: resolution,
			Format:     format,
			FPS:        fps,
			Timestamp:  time.Now().UnixMilli(),
			FrameCount: frameCount,
			Size:       frameSize,
			URL:        streamURL,
		},
	}
	
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}
	
	subject := fmt.Sprintf("hal.v1.camera.frame.%s", c.nodeID)
	return c.conn.Publish(subject, data)
}

// PublishStatus publishes camera status
func (c *Client) PublishStatus(cameraID string, status string, resolution string, fps int, frameCount, errorCount uint64, lastError string, streamURL string) error {
	msg := HALMessage{
		HALMajor:  1,
		HALMinor:  0,
		Schema:    "tafylabs/hal/camera/status/1.0",
		DeviceID:  c.nodeID,
		Caps:      []string{"camera.usb:v1.0"},
		Timestamp: time.Now(),
		Payload: CameraStatusPayload{
			CameraID:   cameraID,
			Status:     status,
			Resolution: resolution,
			FPS:        fps,
			FrameCount: frameCount,
			ErrorCount: errorCount,
			LastError:  lastError,
			StreamURL:  streamURL,
		},
	}
	
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}
	
	subject := fmt.Sprintf("hal.v1.camera.status.%s", c.nodeID)
	return c.conn.Publish(subject, data)
}

// SubscribeCommands subscribes to camera commands
func (c *Client) SubscribeCommands(handler func(cmd interface{})) error {
	subject := fmt.Sprintf("hal.v1.camera.cmd.%s", c.nodeID)
	
	_, err := c.conn.Subscribe(subject, func(msg *nats.Msg) {
		var halMsg HALMessage
		if err := json.Unmarshal(msg.Data, &halMsg); err != nil {
			log.Error().Err(err).Msg("Failed to unmarshal HAL message")
			return
		}
		
		// Handle based on schema
		switch halMsg.Schema {
		case "tafylabs/hal/camera/control/1.0":
			handler(halMsg.Payload)
		default:
			log.Warn().Str("schema", halMsg.Schema).Msg("Unknown command schema")
		}
	})
	
	if err != nil {
		return fmt.Errorf("failed to subscribe to commands: %w", err)
	}
	
	log.Info().Str("subject", subject).Msg("Subscribed to camera commands")
	return nil
}