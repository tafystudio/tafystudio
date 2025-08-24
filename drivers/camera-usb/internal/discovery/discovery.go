package discovery

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"syscall"
	"unsafe"

	"github.com/blackjack/webcam"
	"github.com/rs/zerolog/log"
)

// Camera represents a discovered camera device
type Camera struct {
	Device       string              `json:"device"`
	Name         string              `json:"name"`
	Driver       string              `json:"driver"`
	Card         string              `json:"card"`
	BusInfo      string              `json:"bus_info"`
	Version      string              `json:"version"`
	Capabilities []string            `json:"capabilities"`
	Formats      []Format            `json:"formats"`
	Resolutions  []Resolution        `json:"resolutions"`
}

// Format represents a supported video format
type Format struct {
	Name        string `json:"name"`
	FourCC      string `json:"fourcc"`
	Description string `json:"description"`
}

// Resolution represents a supported resolution
type Resolution struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// V4L2 capability flags
const (
	V4L2_CAP_VIDEO_CAPTURE      = 0x00000001
	V4L2_CAP_VIDEO_OUTPUT       = 0x00000002
	V4L2_CAP_VIDEO_OVERLAY      = 0x00000004
	V4L2_CAP_STREAMING          = 0x04000000
	V4L2_CAP_DEVICE_CAPS        = 0x80000000
)

// V4L2 ioctl commands
const (
	VIDIOC_QUERYCAP = 0x80685600
)

// v4l2_capability structure
type v4l2Capability struct {
	Driver       [16]byte
	Card         [32]byte
	BusInfo      [32]byte
	Version      uint32
	Capabilities uint32
	DeviceCaps   uint32
	Reserved     [3]uint32
}

// DiscoverCameras finds all available V4L2 camera devices
func DiscoverCameras() ([]Camera, error) {
	var cameras []Camera
	
	// Look for video devices
	devices, err := filepath.Glob("/dev/video*")
	if err != nil {
		return nil, fmt.Errorf("failed to list video devices: %w", err)
	}
	
	// Check each device
	for _, device := range devices {
		cam, err := probeDevice(device)
		if err != nil {
			log.Debug().Str("device", device).Err(err).Msg("Failed to probe device")
			continue
		}
		
		if cam != nil {
			cameras = append(cameras, *cam)
		}
	}
	
	return cameras, nil
}

// probeDevice checks if a device is a valid camera
func probeDevice(device string) (*Camera, error) {
	// Check if device exists and is accessible
	info, err := os.Stat(device)
	if err != nil {
		return nil, fmt.Errorf("cannot stat device: %w", err)
	}
	
	// Check if it's a character device
	if info.Mode()&os.ModeCharDevice == 0 {
		return nil, fmt.Errorf("not a character device")
	}
	
	// Try to get device capabilities using ioctl
	cap, err := getDeviceCapabilities(device)
	if err != nil {
		// Fallback to webcam library
		return probeWithWebcam(device)
	}
	
	// Check if it's a video capture device
	if cap.Capabilities&V4L2_CAP_VIDEO_CAPTURE == 0 {
		return nil, fmt.Errorf("not a video capture device")
	}
	
	cam := &Camera{
		Device:  device,
		Name:    cleanString(cap.Card[:]),
		Driver:  cleanString(cap.Driver[:]),
		Card:    cleanString(cap.Card[:]),
		BusInfo: cleanString(cap.BusInfo[:]),
		Version: fmt.Sprintf("%d.%d.%d",
			(cap.Version>>16)&0xFF,
			(cap.Version>>8)&0xFF,
			cap.Version&0xFF),
		Capabilities: parseCapabilities(cap.Capabilities),
	}
	
	// Get supported formats and resolutions
	if err := getFormatsAndResolutions(cam); err != nil {
		log.Warn().Err(err).Str("device", device).Msg("Failed to get formats/resolutions")
	}
	
	return cam, nil
}

// getDeviceCapabilities uses ioctl to get device capabilities
func getDeviceCapabilities(device string) (*v4l2Capability, error) {
	// Open device
	fd, err := syscall.Open(device, syscall.O_RDWR, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to open device: %w", err)
	}
	defer syscall.Close(fd)
	
	// Query capabilities
	var cap v4l2Capability
	_, _, errno := syscall.Syscall(
		syscall.SYS_IOCTL,
		uintptr(fd),
		uintptr(VIDIOC_QUERYCAP),
		uintptr(unsafe.Pointer(&cap)),
	)
	
	if errno != 0 {
		return nil, fmt.Errorf("ioctl VIDIOC_QUERYCAP failed: %v", errno)
	}
	
	return &cap, nil
}

// probeWithWebcam uses the webcam library as fallback
func probeWithWebcam(device string) (*Camera, error) {
	// Try to open with webcam library
	cam, err := webcam.Open(device)
	if err != nil {
		return nil, fmt.Errorf("failed to open with webcam: %w", err)
	}
	defer cam.Close()
	
	// Extract device number from path
	re := regexp.MustCompile(`video(\d+)$`)
	matches := re.FindStringSubmatch(device)
	name := "USB Camera"
	if len(matches) > 1 {
		name = fmt.Sprintf("USB Camera %s", matches[1])
	}
	
	camera := &Camera{
		Device:       device,
		Name:         name,
		Driver:       "v4l2",
		Card:         name,
		BusInfo:      "usb",
		Version:      "unknown",
		Capabilities: []string{"video_capture", "streaming"},
	}
	
	// Get supported formats
	formats := cam.GetSupportedFormats()
	for formatName, formatCode := range formats {
		camera.Formats = append(camera.Formats, Format{
			Name:        formatName,
			FourCC:      fourCCToString(formatCode),
			Description: formatName,
		})
		
		// Get resolutions for this format
		if formatCode > 0 {
			framesizes := cam.GetSupportedFrameSizes(webcam.PixelFormat(formatCode))
			for _, size := range framesizes {
				// Only add discrete sizes
				if size.MinWidth == size.MaxWidth && size.MinHeight == size.MaxHeight {
					res := Resolution{
						Width:  int(size.MinWidth),
						Height: int(size.MinHeight),
					}
					
					// Check if resolution already exists
					exists := false
					for _, r := range camera.Resolutions {
						if r.Width == res.Width && r.Height == res.Height {
							exists = true
							break
						}
					}
					
					if !exists {
						camera.Resolutions = append(camera.Resolutions, res)
					}
				}
			}
		}
	}
	
	return camera, nil
}

// getFormatsAndResolutions gets supported formats and resolutions
func getFormatsAndResolutions(cam *Camera) error {
	// Open device with webcam library to get detailed info
	wcam, err := webcam.Open(cam.Device)
	if err != nil {
		return fmt.Errorf("failed to open for format detection: %w", err)
	}
	defer wcam.Close()
	
	// Get supported formats
	formats := wcam.GetSupportedFormats()
	for formatName, formatCode := range formats {
		cam.Formats = append(cam.Formats, Format{
			Name:        formatName,
			FourCC:      fourCCToString(formatCode),
			Description: formatName,
		})
		
		// Get resolutions for this format
		if formatCode > 0 {
			framesizes := wcam.GetSupportedFrameSizes(webcam.PixelFormat(formatCode))
			for _, size := range framesizes {
				// Only add discrete sizes
				if size.MinWidth == size.MaxWidth && size.MinHeight == size.MaxHeight {
					res := Resolution{
						Width:  int(size.MinWidth),
						Height: int(size.MinHeight),
					}
					
					// Check if resolution already exists
					exists := false
					for _, r := range cam.Resolutions {
						if r.Width == res.Width && r.Height == res.Height {
							exists = true
							break
						}
					}
					
					if !exists {
						cam.Resolutions = append(cam.Resolutions, res)
					}
				}
			}
		}
	}
	
	return nil
}

// parseCapabilities converts capability flags to string array
func parseCapabilities(caps uint32) []string {
	var capabilities []string
	
	if caps&V4L2_CAP_VIDEO_CAPTURE != 0 {
		capabilities = append(capabilities, "video_capture")
	}
	if caps&V4L2_CAP_VIDEO_OUTPUT != 0 {
		capabilities = append(capabilities, "video_output")
	}
	if caps&V4L2_CAP_VIDEO_OVERLAY != 0 {
		capabilities = append(capabilities, "video_overlay")
	}
	if caps&V4L2_CAP_STREAMING != 0 {
		capabilities = append(capabilities, "streaming")
	}
	
	return capabilities
}

// cleanString converts C string to Go string
func cleanString(b []byte) string {
	n := 0
	for i, v := range b {
		if v == 0 {
			n = i
			break
		}
	}
	return string(b[:n])
}

// fourCCToString converts FourCC code to string
func fourCCToString(code uint32) string {
	return fmt.Sprintf("%c%c%c%c",
		byte(code&0xFF),
		byte((code>>8)&0xFF),
		byte((code>>16)&0xFF),
		byte((code>>24)&0xFF))
}

// FindBestCamera finds the most suitable camera from available devices
func FindBestCamera(cameras []Camera) *Camera {
	if len(cameras) == 0 {
		return nil
	}
	
	// Prefer cameras with MJPEG support
	for i := range cameras {
		for _, format := range cameras[i].Formats {
			if strings.Contains(strings.ToLower(format.Name), "mjpeg") ||
				strings.Contains(strings.ToLower(format.Name), "jpeg") {
				return &cameras[i]
			}
		}
	}
	
	// Return first available camera
	return &cameras[0]
}

// GetCameraByDevice returns camera info for a specific device
func GetCameraByDevice(device string) (*Camera, error) {
	return probeDevice(device)
}