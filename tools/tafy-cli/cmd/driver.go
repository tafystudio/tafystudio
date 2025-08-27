package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/tafystudio/tafy-cli/internal/scaffold"
)

var (
	driverName     string
	driverType     string
	driverLanguage string
	outputPath     string
)

var driverCmd = &cobra.Command{
	Use:   "driver",
	Short: "Manage and create HAL-compliant drivers",
	Long:  `Create, test, and manage HAL-compliant drivers for Tafy Studio.`,
}

var createCmd = &cobra.Command{
	Use:   "create [name]",
	Short: "Create a new driver from template",
	Long: `Create a new HAL-compliant driver from a template.
	
Available driver types:
  - sensor: For sensor drivers (ultrasonic, ToF, IMU, etc.)
  - actuator: For actuator drivers (motor, servo, LED, etc.)
  - camera: For camera/vision drivers
  - complex: For complex drivers with multiple capabilities

Available languages:
  - go: Go driver (recommended)
  - python: Python driver
  - cpp: C++ driver (for performance-critical applications)`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		driverName = args[0]

		// Validate inputs
		if err := validateDriverInputs(); err != nil {
			return err
		}

		// Set default output path if not specified
		if outputPath == "" {
			outputPath = filepath.Join("drivers", driverName)
		}

		// Check if directory exists
		if _, err := os.Stat(outputPath); !os.IsNotExist(err) {
			return fmt.Errorf("directory %s already exists", outputPath)
		}

		fmt.Printf("Creating %s driver '%s' in %s at %s...\n", 
			driverType, driverName, driverLanguage, outputPath)

		// Create the driver
		generator := scaffold.NewDriverGenerator(driverName, driverType, driverLanguage, outputPath)
		if err := generator.Generate(); err != nil {
			return fmt.Errorf("failed to generate driver: %w", err)
		}

		fmt.Println("\n✅ Driver created successfully!")
		fmt.Printf("\nNext steps:\n")
		fmt.Printf("1. cd %s\n", outputPath)
		fmt.Printf("2. Review and edit driver.yaml for your hardware\n")
		fmt.Printf("3. Implement the TODO sections in the code\n")
		fmt.Printf("4. Run 'make test' to test your driver\n")
		fmt.Printf("5. Run 'make build' to build the container\n")

		return nil
	},
}

var listTemplatesCmd = &cobra.Command{
	Use:   "list-templates",
	Short: "List available driver templates",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("Available Driver Templates:")
		fmt.Println("\nSensor Drivers:")
		fmt.Println("  - ultrasonic: HC-SR04 style ultrasonic sensor")
		fmt.Println("  - tof: Time-of-Flight sensor (VL53L0X)")
		fmt.Println("  - imu: Inertial Measurement Unit (MPU6050)")
		fmt.Println("  - temperature: Temperature/humidity sensor")
		
		fmt.Println("\nActuator Drivers:")
		fmt.Println("  - motor: DC motor with PWM control")
		fmt.Println("  - servo: Servo motor control")
		fmt.Println("  - led: LED strip/matrix control")
		
		fmt.Println("\nComplex Drivers:")
		fmt.Println("  - camera: Video streaming with motion detection")
		fmt.Println("  - lidar: 2D LIDAR scanning")
		fmt.Println("  - gps: GPS/GNSS receiver")
		
		return nil
	},
}

func init() {
	rootCmd.AddCommand(driverCmd)
	driverCmd.AddCommand(createCmd)
	driverCmd.AddCommand(listTemplatesCmd)

	createCmd.Flags().StringVarP(&driverType, "type", "t", "sensor", 
		"Driver type (sensor, actuator, camera, complex)")
	createCmd.Flags().StringVarP(&driverLanguage, "language", "l", "go", 
		"Programming language (go, python, cpp)")
	createCmd.Flags().StringVarP(&outputPath, "output", "o", "", 
		"Output directory (default: drivers/[name])")
}

func validateDriverInputs() error {
	validTypes := []string{"sensor", "actuator", "camera", "complex"}
	validLanguages := []string{"go", "python", "cpp"}

	typeValid := false
	for _, t := range validTypes {
		if t == driverType {
			typeValid = true
			break
		}
	}
	if !typeValid {
		return fmt.Errorf("invalid driver type: %s", driverType)
	}

	langValid := false
	for _, l := range validLanguages {
		if l == driverLanguage {
			langValid = true
			break
		}
	}
	if !langValid {
		return fmt.Errorf("invalid language: %s", driverLanguage)
	}

	return nil
}