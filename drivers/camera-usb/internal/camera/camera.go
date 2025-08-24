package camera

import (
	"fmt"
	"image"
	"image/jpeg"
	"io"
	"sync"
	"time"

	"github.com/blackjack/webcam"
	"github.com/rs/zerolog/log"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/config"
)

// Camera represents a V4L2 camera device
type Camera struct {
	Device   string
	Config   config.CameraConfig
	webcam   *webcam.Webcam
	format   webcam.PixelFormat
	
	// Frame buffer
	frameSize uint32
	frameBuf  []byte
	
	// State
	mu       sync.RWMutex
	running  bool
	lastFrame []byte
	frameCount uint64
	errorCount uint64
	lastError  error
	lastUpdate time.Time
}

// New creates a new camera instance
func New(device string, cfg config.CameraConfig) (*Camera, error) {
	cam, err := webcam.Open(device)
	if err != nil {
		return nil, fmt.Errorf("failed to open camera: %w", err)
	}
	
	c := &Camera{
		Device: device,
		Config: cfg,
		webcam: cam,
	}
	
	// Configure camera
	if err := c.configure(); err != nil {
		cam.Close()
		return nil, err
	}
	
	return c, nil
}

// configure sets up the camera with desired settings
func (c *Camera) configure() error {
	// Get supported formats
	formats := c.webcam.GetSupportedFormats()
	log.Debug().Interface("formats", formats).Msg("Supported formats")
	
	// Select format based on config
	var selectedFormat webcam.PixelFormat
	switch c.Config.Format {
	case "MJPEG":
		selectedFormat = webcam.PixelFormat(formats["Motion-JPEG"])
	case "YUYV":
		selectedFormat = webcam.PixelFormat(formats["YUYV 4:2:2"])
	default:
		// Try to find MJPEG first, then fall back to first available
		if mjpeg, ok := formats["Motion-JPEG"]; ok {
			selectedFormat = webcam.PixelFormat(mjpeg)
		} else {
			for name, format := range formats {
				selectedFormat = webcam.PixelFormat(format)
				log.Warn().Str("format", name).Msg("Using fallback format")
				break
			}
		}
	}
	
	c.format = selectedFormat
	
	// Set format and resolution
	_, _, _, err := c.webcam.SetImageFormat(selectedFormat, uint32(c.Config.Width), uint32(c.Config.Height))
	if err != nil {
		return fmt.Errorf("failed to set image format: %w", err)
	}
	
	// Set frame rate
	if err := c.webcam.SetFramerate(float32(c.Config.FPS)); err != nil {
		log.Warn().Err(err).Int("fps", c.Config.FPS).Msg("Failed to set frame rate")
	}
	
	// Get actual frame size
	c.frameSize = c.webcam.GetFrameSize()
	c.frameBuf = make([]byte, c.frameSize)
	
	log.Info().
		Str("device", c.Device).
		Uint32("format", uint32(c.format)).
		Int("width", c.Config.Width).
		Int("height", c.Config.Height).
		Int("fps", c.Config.FPS).
		Uint32("frame_size", c.frameSize).
		Msg("Camera configured")
	
	return nil
}

// Start begins capturing frames
func (c *Camera) Start() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	if c.running {
		return fmt.Errorf("camera already running")
	}
	
	// Start streaming
	if err := c.webcam.StartStreaming(); err != nil {
		return fmt.Errorf("failed to start streaming: %w", err)
	}
	
	c.running = true
	
	// Start capture goroutine
	go c.captureLoop()
	
	return nil
}

// Stop stops capturing frames
func (c *Camera) Stop() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	if !c.running {
		return nil
	}
	
	c.running = false
	
	// Stop streaming
	if err := c.webcam.StopStreaming(); err != nil {
		return fmt.Errorf("failed to stop streaming: %w", err)
	}
	
	return nil
}

// Close closes the camera device
func (c *Camera) Close() error {
	c.Stop()
	return c.webcam.Close()
}

// captureLoop continuously captures frames
func (c *Camera) captureLoop() {
	log.Info().Msg("Starting capture loop")
	defer log.Info().Msg("Capture loop stopped")
	
	for {
		c.mu.RLock()
		if !c.running {
			c.mu.RUnlock()
			break
		}
		c.mu.RUnlock()
		
		// Wait for frame
		err := c.webcam.WaitForFrame(5) // 5 second timeout
		if err != nil {
			if err == webcam.ErrTimeout {
				log.Debug().Msg("Frame timeout")
				continue
			}
			c.mu.Lock()
			c.errorCount++
			c.lastError = err
			c.mu.Unlock()
			log.Error().Err(err).Msg("Error waiting for frame")
			continue
		}
		
		// Read frame
		frame, err := c.webcam.ReadFrame()
		if err != nil {
			c.mu.Lock()
			c.errorCount++
			c.lastError = err
			c.mu.Unlock()
			log.Error().Err(err).Msg("Error reading frame")
			continue
		}
		
		if len(frame) == 0 {
			log.Debug().Msg("Empty frame")
			continue
		}
		
		// Process frame based on format
		processedFrame := frame
		if c.format != webcam.PixelFormat(formats["Motion-JPEG"]) {
			// Convert to JPEG if not already MJPEG
			processedFrame, err = c.convertToJPEG(frame)
			if err != nil {
				log.Error().Err(err).Msg("Error converting frame")
				continue
			}
		}
		
		// Update last frame
		c.mu.Lock()
		c.lastFrame = processedFrame
		c.frameCount++
		c.lastUpdate = time.Now()
		c.mu.Unlock()
		
		log.Debug().
			Int("size", len(processedFrame)).
			Uint64("count", c.frameCount).
			Msg("Frame captured")
	}
}

// GetFrame returns the latest captured frame
func (c *Camera) GetFrame() ([]byte, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	
	if !c.running {
		return nil, fmt.Errorf("camera not running")
	}
	
	if c.lastFrame == nil {
		return nil, fmt.Errorf("no frame available")
	}
	
	// Return copy of frame
	frame := make([]byte, len(c.lastFrame))
	copy(frame, c.lastFrame)
	
	return frame, nil
}

// GetStats returns camera statistics
func (c *Camera) GetStats() (frameCount, errorCount uint64, lastUpdate time.Time, lastError error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	
	return c.frameCount, c.errorCount, c.lastUpdate, c.lastError
}

// StreamFrames streams frames to a writer
func (c *Camera) StreamFrames(w io.Writer, stop <-chan struct{}) error {
	for {
		select {
		case <-stop:
			return nil
		default:
			frame, err := c.GetFrame()
			if err != nil {
				// Wait a bit if no frame available
				time.Sleep(10 * time.Millisecond)
				continue
			}
			
			// Write frame with MJPEG boundary
			boundary := "\r\n--frame\r\n"
			header := fmt.Sprintf("Content-Type: image/jpeg\r\nContent-Length: %d\r\n\r\n", len(frame))
			
			if _, err := w.Write([]byte(boundary)); err != nil {
				return err
			}
			if _, err := w.Write([]byte(header)); err != nil {
				return err
			}
			if _, err := w.Write(frame); err != nil {
				return err
			}
		}
	}
}

// convertToJPEG converts raw frame data to JPEG
func (c *Camera) convertToJPEG(frame []byte) ([]byte, error) {
	// This is a simplified conversion - in practice, you'd need to handle
	// different pixel formats (YUYV, RGB, etc.) properly
	
	// For now, just return an error - proper implementation would require
	// format-specific conversion
	return nil, fmt.Errorf("non-MJPEG format conversion not yet implemented")
}

// Supported format constants
var formats = map[string]uint32{
	"Motion-JPEG": 1196444237, // 'MJPG'
	"YUYV 4:2:2":  1448695129, // 'YUYV'
}