package server

import (
	"context"
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog/log"
)

var (
	// Frame metrics
	framesTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "camera_frames_total",
		Help: "Total number of frames captured",
	})
	
	framesErrors = promauto.NewCounter(prometheus.CounterOpts{
		Name: "camera_frames_errors_total",
		Help: "Total number of frame capture errors",
	})
	
	frameSize = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "camera_frame_size_bytes",
		Help:    "Size of captured frames in bytes",
		Buckets: prometheus.ExponentialBuckets(1024, 2, 10), // 1KB to 1MB
	})
	
	// Stream metrics
	activeStreams = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "camera_active_streams",
		Help: "Number of active streaming clients",
	})
	
	streamDuration = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "camera_stream_duration_seconds",
		Help:    "Duration of streaming sessions",
		Buckets: prometheus.ExponentialBuckets(1, 2, 10), // 1s to 1024s
	})
	
	// WebSocket metrics
	wsConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "camera_websocket_connections",
		Help: "Number of active WebSocket connections",
	})
)

// Metrics represents the metrics server
type Metrics struct {
	server *http.Server
}

// NewMetrics creates a new metrics server
func NewMetrics(port int) *Metrics {
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())
	
	return &Metrics{
		server: &http.Server{
			Addr:    fmt.Sprintf(":%d", port),
			Handler: mux,
		},
	}
}

// Start starts the metrics server
func (m *Metrics) Start() error {
	log.Info().Str("addr", m.server.Addr).Msg("Starting metrics server")
	return m.server.ListenAndServe()
}

// Shutdown gracefully shuts down the server
func (m *Metrics) Shutdown(ctx context.Context) error {
	return m.server.Shutdown(ctx)
}

// RecordFrame records a captured frame
func RecordFrame(size int) {
	framesTotal.Inc()
	frameSize.Observe(float64(size))
}

// RecordFrameError records a frame capture error
func RecordFrameError() {
	framesErrors.Inc()
}

// RecordStreamStart records a new stream client
func RecordStreamStart() {
	activeStreams.Inc()
}

// RecordStreamEnd records a stream client disconnect
func RecordStreamEnd(duration float64) {
	activeStreams.Dec()
	streamDuration.Observe(duration)
}

// RecordWSConnect records a WebSocket connection
func RecordWSConnect() {
	wsConnections.Inc()
}

// RecordWSDisconnect records a WebSocket disconnection
func RecordWSDisconnect() {
	wsConnections.Dec()
}