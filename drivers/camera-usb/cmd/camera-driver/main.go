package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/camera"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/config"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/discovery"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/nats"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/server"
)

var (
	cfgFile string
	rootCmd = &cobra.Command{
		Use:   "camera-driver",
		Short: "USB Camera driver for Tafy RDOS",
		Long:  `Provides V4L2-based USB camera access with MJPEG streaming and HAL integration`,
		Run:   run,
	}
)

func init() {
	cobra.OnInitialize(initConfig)
	
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ./config/config.yaml)")
	rootCmd.PersistentFlags().String("device", "/dev/video0", "V4L2 device path")
	rootCmd.PersistentFlags().String("nats-url", "nats://localhost:4222", "NATS server URL")
	rootCmd.PersistentFlags().String("node-id", "", "Node ID (auto-generated if empty)")
	rootCmd.PersistentFlags().Int("http-port", 8080, "HTTP server port for MJPEG streaming")
	rootCmd.PersistentFlags().Int("metrics-port", 8081, "Metrics server port")
	rootCmd.PersistentFlags().String("log-level", "info", "Log level (debug, info, warn, error)")
	rootCmd.PersistentFlags().Bool("discover", false, "Run camera discovery and exit")
	rootCmd.PersistentFlags().Bool("auto-select", false, "Automatically select best available camera")
	
	// Bind flags to viper
	viper.BindPFlag("device", rootCmd.PersistentFlags().Lookup("device"))
	viper.BindPFlag("nats.url", rootCmd.PersistentFlags().Lookup("nats-url"))
	viper.BindPFlag("node.id", rootCmd.PersistentFlags().Lookup("node-id"))
	viper.BindPFlag("server.http_port", rootCmd.PersistentFlags().Lookup("http-port"))
	viper.BindPFlag("server.metrics_port", rootCmd.PersistentFlags().Lookup("metrics-port"))
	viper.BindPFlag("log.level", rootCmd.PersistentFlags().Lookup("log-level"))
}

func initConfig() {
	// Set up config search paths
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.AddConfigPath("./config")
		viper.AddConfigPath(".")
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
	}
	
	// Environment variables
	viper.SetEnvPrefix("TAFY_CAMERA")
	viper.AutomaticEnv()
	
	// Read config
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			log.Warn().Err(err).Msg("Error reading config file")
		}
	}
	
	// Set up logging
	setupLogging()
}

func setupLogging() {
	// Configure zerolog
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	
	// Set log level
	level := viper.GetString("log.level")
	switch level {
	case "debug":
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	case "info":
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	case "warn":
		zerolog.SetGlobalLevel(zerolog.WarnLevel)
	case "error":
		zerolog.SetGlobalLevel(zerolog.ErrorLevel)
	default:
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}
	
	// Pretty console output for development
	if viper.GetBool("log.pretty") {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}
}

func run(cmd *cobra.Command, args []string) {
	// Check if running discovery mode
	if viper.GetBool("discover") {
		runDiscovery()
		return
	}
	
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}
	
	// Auto-select camera if requested
	if viper.GetBool("auto-select") {
		device, err := autoSelectCamera()
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to auto-select camera")
		}
		cfg.Device = device
		log.Info().Str("device", device).Msg("Auto-selected camera")
	}
	
	log.Info().
		Str("device", cfg.Device).
		Str("node_id", cfg.Node.ID).
		Msg("Starting camera driver")
	
	// Initialize camera
	cam, err := camera.New(cfg.Device, cfg.Camera)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize camera")
	}
	defer cam.Close()
	
	// Start camera capture
	if err := cam.Start(); err != nil {
		log.Fatal().Err(err).Msg("Failed to start camera capture")
	}
	
	// Initialize NATS client
	nc, err := nats.Connect(cfg.NATS)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to NATS")
	}
	defer nc.Close()
	
	// Start discovery service
	discoveryService := discovery.NewService(nc, cfg.Node.ID, 30*time.Second)
	if err := discoveryService.Start(); err != nil {
		log.Error().Err(err).Msg("Failed to start discovery service")
		// Continue without discovery
	}
	defer discoveryService.Stop()
	
	// Start HTTP server for MJPEG streaming
	httpServer := server.NewHTTP(cfg.Server, cfg.WebRTC, cam, nc)
	go func() {
		if err := httpServer.Start(); err != nil {
			log.Error().Err(err).Msg("HTTP server error")
			cancel()
		}
	}()
	
	// Start metrics server
	metricsServer := server.NewMetrics(cfg.Server.MetricsPort)
	go func() {
		if err := metricsServer.Start(); err != nil {
			log.Error().Err(err).Msg("Metrics server error")
		}
	}()
	
	// Handle shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	
	select {
	case <-sigChan:
		log.Info().Msg("Shutdown signal received")
	case <-ctx.Done():
		log.Info().Msg("Context cancelled")
	}
	
	// Graceful shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("Error shutting down HTTP server")
	}
	
	if err := metricsServer.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("Error shutting down metrics server")
	}
	
	log.Info().Msg("Camera driver stopped")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

// runDiscovery runs camera discovery and exits
func runDiscovery() {
	log.Info().Msg("Running camera discovery")
	
	cameras, err := discovery.DiscoverCameras()
	if err != nil {
		log.Fatal().Err(err).Msg("Discovery failed")
	}
	
	if len(cameras) == 0 {
		log.Warn().Msg("No cameras found")
		return
	}
	
	// Print results
	fmt.Printf("\nFound %d camera(s):\n\n", len(cameras))
	
	for i, cam := range cameras {
		fmt.Printf("Camera %d:\n", i+1)
		fmt.Printf("  Device:   %s\n", cam.Device)
		fmt.Printf("  Name:     %s\n", cam.Name)
		fmt.Printf("  Driver:   %s\n", cam.Driver)
		fmt.Printf("  Bus Info: %s\n", cam.BusInfo)
		fmt.Printf("  Version:  %s\n", cam.Version)
		
		if len(cam.Formats) > 0 {
			fmt.Printf("  Formats:\n")
			for _, f := range cam.Formats {
				fmt.Printf("    - %s (%s)\n", f.Name, f.FourCC)
			}
		}
		
		if len(cam.Resolutions) > 0 {
			fmt.Printf("  Resolutions:\n")
			for _, r := range cam.Resolutions {
				fmt.Printf("    - %dx%d\n", r.Width, r.Height)
			}
		}
		
		fmt.Println()
	}
	
	// Find best camera
	best := discovery.FindBestCamera(cameras)
	if best != nil {
		fmt.Printf("Recommended camera: %s (%s)\n", best.Device, best.Name)
	}
}

// autoSelectCamera automatically selects the best available camera
func autoSelectCamera() (string, error) {
	cameras, err := discovery.DiscoverCameras()
	if err != nil {
		return "", fmt.Errorf("discovery failed: %w", err)
	}
	
	if len(cameras) == 0 {
		return "", fmt.Errorf("no cameras found")
	}
	
	best := discovery.FindBestCamera(cameras)
	if best == nil {
		return cameras[0].Device, nil
	}
	
	return best.Device, nil
}