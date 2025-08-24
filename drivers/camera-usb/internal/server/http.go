package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/camera"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/config"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/discovery"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/nats"
)

// HTTP represents the HTTP server for camera streaming
type HTTP struct {
	config           config.ServerConfig
	camera           *camera.Camera
	nats             *nats.Client
	server           *http.Server
	upgrader         websocket.Upgrader
	webrtcServer     *WebRTCServer
	discoveryService interface{} // Will be set if discovery service is available
}

// NewHTTP creates a new HTTP server
func NewHTTP(cfg config.ServerConfig, webrtcCfg config.WebRTCConfig, cam *camera.Camera, nc *nats.Client) *HTTP {
	h := &HTTP{
		config: cfg,
		camera: cam,
		nats:   nc,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Check CORS origins
				if cfg.CORSOrigins == "*" {
					return true
				}
				origin := r.Header.Get("Origin")
				for _, allowed := range strings.Split(cfg.CORSOrigins, ",") {
					if strings.TrimSpace(allowed) == origin {
						return true
					}
				}
				return false
			},
		},
	}
	
	// Initialize WebRTC server if enabled
	if webrtcCfg.Enabled {
		webrtcServer, err := NewWebRTCServer(cam, webrtcCfg)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create WebRTC server")
			// Continue without WebRTC support
		} else {
			h.webrtcServer = webrtcServer
		}
	}
	
	// Set up routes
	router := mux.NewRouter()
	
	// API routes
	api := router.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/status", h.handleStatus).Methods("GET")
	api.HandleFunc("/info", h.handleInfo).Methods("GET")
	api.HandleFunc("/discovery", h.handleDiscovery).Methods("GET")
	
	// Streaming routes
	router.HandleFunc("/stream", h.handleMJPEGStream).Methods("GET")
	router.HandleFunc("/snapshot", h.handleSnapshot).Methods("GET")
	router.HandleFunc("/ws", h.handleWebSocket)
	
	// Health check
	router.HandleFunc("/health", h.handleHealth).Methods("GET")
	
	// Configure server
	h.server = &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.WriteTimeout) * time.Second,
	}
	
	return h
}

// Start starts the HTTP server
func (h *HTTP) Start() error {
	log.Info().Int("port", h.config.HTTPPort).Msg("Starting HTTP server")
	return h.server.ListenAndServe()
}

// Shutdown gracefully shuts down the server
func (h *HTTP) Shutdown(ctx context.Context) error {
	return h.server.Shutdown(ctx)
}

// handleHealth handles health check requests
func (h *HTTP) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

// handleStatus handles camera status requests
func (h *HTTP) handleStatus(w http.ResponseWriter, r *http.Request) {
	frameCount, errorCount, lastUpdate, lastError := h.camera.GetStats()
	
	status := map[string]interface{}{
		"running":     true,
		"frame_count": frameCount,
		"error_count": errorCount,
		"last_update": lastUpdate,
		"fps":         h.camera.Config.FPS,
	}
	
	if lastError != nil {
		status["last_error"] = lastError.Error()
	}
	
	// Add WebRTC stats if available
	if h.webrtcServer != nil {
		status["webrtc"] = h.webrtcServer.GetStats()
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// handleInfo handles camera info requests
func (h *HTTP) handleInfo(w http.ResponseWriter, r *http.Request) {
	info := map[string]interface{}{
		"device":     h.camera.Device,
		"resolution": fmt.Sprintf("%dx%d", h.camera.Config.Width, h.camera.Config.Height),
		"format":     h.camera.Config.Format,
		"fps":        h.camera.Config.FPS,
		"stream_url": fmt.Sprintf("http://%s/stream", r.Host),
		"ws_url":     fmt.Sprintf("ws://%s/ws", r.Host),
		"webrtc_url": fmt.Sprintf("ws://%s/webrtc", r.Host),
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

// handleSnapshot handles single frame snapshot requests
func (h *HTTP) handleSnapshot(w http.ResponseWriter, r *http.Request) {
	frame, err := h.camera.GetFrame()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "image/jpeg")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(frame)))
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Write(frame)
}

// handleMJPEGStream handles MJPEG streaming requests
func (h *HTTP) handleMJPEGStream(w http.ResponseWriter, r *http.Request) {
	log.Info().Str("remote", r.RemoteAddr).Msg("New MJPEG stream client")
	defer log.Info().Str("remote", r.RemoteAddr).Msg("MJPEG stream client disconnected")
	
	// Set headers for MJPEG stream
	w.Header().Set("Content-Type", "multipart/x-mixed-replace; boundary=frame")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "close")
	w.Header().Set("Pragma", "no-cache")
	
	// Get flusher for live streaming
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}
	
	// Create stop channel
	stop := make(chan struct{})
	defer close(stop)
	
	// Handle client disconnect
	go func() {
		<-r.Context().Done()
		stop <- struct{}{}
	}()
	
	// Stream frames
	for {
		select {
		case <-stop:
			return
		default:
			frame, err := h.camera.GetFrame()
			if err != nil {
				log.Debug().Err(err).Msg("Failed to get frame")
				time.Sleep(50 * time.Millisecond)
				continue
			}
			
			// Write MJPEG boundary and headers
			fmt.Fprintf(w, "\r\n--frame\r\n")
			fmt.Fprintf(w, "Content-Type: image/jpeg\r\n")
			fmt.Fprintf(w, "Content-Length: %d\r\n\r\n", len(frame))
			
			// Write frame
			if _, err := w.Write(frame); err != nil {
				log.Debug().Err(err).Msg("Failed to write frame")
				return
			}
			
			// Flush to send immediately
			flusher.Flush()
			
			// Simple frame rate limiting
			time.Sleep(time.Second / time.Duration(h.camera.Config.FPS))
		}
	}
}

// handleWebSocket handles WebSocket connections for frame streaming
func (h *HTTP) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to upgrade WebSocket")
		return
	}
	defer conn.Close()
	
	log.Info().Str("remote", r.RemoteAddr).Msg("New WebSocket client")
	defer log.Info().Str("remote", r.RemoteAddr).Msg("WebSocket client disconnected")
	
	// Create channels
	stop := make(chan struct{})
	defer close(stop)
	
	// Handle incoming messages
	go func() {
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				stop <- struct{}{}
				return
			}
			
			// Handle control messages
			var cmd map[string]interface{}
			if err := json.Unmarshal(message, &cmd); err == nil {
				// Process command
				log.Debug().Interface("cmd", cmd).Msg("Received WebSocket command")
			}
		}
	}()
	
	// Send frames
	ticker := time.NewTicker(time.Second / time.Duration(h.camera.Config.FPS))
	defer ticker.Stop()
	
	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			frame, err := h.camera.GetFrame()
			if err != nil {
				continue
			}
			
			// Send frame as binary message
			if err := conn.WriteMessage(websocket.BinaryMessage, frame); err != nil {
				log.Debug().Err(err).Msg("Failed to send frame via WebSocket")
				return
			}
		}
	}
}

// handleWebRTC handles WebRTC signaling connections
func (h *HTTP) handleWebRTC(w http.ResponseWriter, r *http.Request) {
	if h.webrtcServer == nil {
		http.Error(w, "WebRTC not available", http.StatusServiceUnavailable)
		return
	}
	
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to upgrade WebRTC WebSocket")
		return
	}
	defer conn.Close()
	
	// Generate peer ID
	peerID := fmt.Sprintf("peer-%d", time.Now().UnixNano())
	
	// Handle WebRTC signaling
	h.webrtcServer.HandleWebRTCSignaling(conn, peerID)
}

// handleDiscovery handles camera discovery requests
func (h *HTTP) handleDiscovery(w http.ResponseWriter, r *http.Request) {
	// Run discovery
	cameras, err := discovery.DiscoverCameras()
	if err != nil {
		http.Error(w, fmt.Sprintf("Discovery failed: %v", err), http.StatusInternalServerError)
		return
	}
	
	// Build response
	response := map[string]interface{}{
		"camera_count": len(cameras),
		"cameras":      cameras,
		"current": map[string]string{
			"device": h.camera.Device,
			"name":   h.camera.Config.Format,
		},
		"timestamp": time.Now(),
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}