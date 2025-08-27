package scaffold

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/template"
)

type DriverGenerator struct {
	Name     string
	Type     string
	Language string
	Output   string
}

type TemplateData struct {
	Name           string
	NameLower      string
	NameUpper      string
	Type           string
	TypeCapitalized string
	Language       string
	HALCapability  string
	Description    string
	Year           int
}

func NewDriverGenerator(name, driverType, language, output string) *DriverGenerator {
	return &DriverGenerator{
		Name:     name,
		Type:     driverType,
		Language: language,
		Output:   output,
	}
}

func (g *DriverGenerator) Generate() error {
	// Create output directory
	if err := os.MkdirAll(g.Output, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Prepare template data
	data := TemplateData{
		Name:            g.Name,
		NameLower:       strings.ToLower(g.Name),
		NameUpper:       strings.ToUpper(g.Name),
		Type:            g.Type,
		TypeCapitalized: strings.Title(g.Type),
		Language:        g.Language,
		HALCapability:   g.getHALCapability(),
		Description:     g.getDescription(),
		Year:            2024,
	}

	// Generate files based on language
	switch g.Language {
	case "go":
		return g.generateGoDriver(data)
	case "python":
		return g.generatePythonDriver(data)
	case "cpp":
		return g.generateCppDriver(data)
	default:
		return fmt.Errorf("unsupported language: %s", g.Language)
	}
}

func (g *DriverGenerator) getHALCapability() string {
	switch g.Type {
	case "sensor":
		return fmt.Sprintf("sensor.%s", strings.ToLower(g.Name))
	case "actuator":
		return fmt.Sprintf("actuator.%s", strings.ToLower(g.Name))
	case "camera":
		return "sensor.camera.rgb"
	case "complex":
		return fmt.Sprintf("device.%s", strings.ToLower(g.Name))
	default:
		return "device.unknown"
	}
}

func (g *DriverGenerator) getDescription() string {
	switch g.Type {
	case "sensor":
		return fmt.Sprintf("%s sensor driver for Tafy RDOS", g.Name)
	case "actuator":
		return fmt.Sprintf("%s actuator driver for Tafy RDOS", g.Name)
	case "camera":
		return fmt.Sprintf("%s camera driver for Tafy RDOS", g.Name)
	case "complex":
		return fmt.Sprintf("%s complex device driver for Tafy RDOS", g.Name)
	default:
		return fmt.Sprintf("%s driver for Tafy RDOS", g.Name)
	}
}

func (g *DriverGenerator) writeTemplate(filename, tmplContent string, data TemplateData) error {
	fullPath := filepath.Join(g.Output, filename)
	
	// Create directory if needed
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", dir, err)
	}

	tmpl, err := template.New(filename).Parse(tmplContent)
	if err != nil {
		return fmt.Errorf("failed to parse template: %w", err)
	}

	file, err := os.Create(fullPath)
	if err != nil {
		return fmt.Errorf("failed to create file %s: %w", fullPath, err)
	}
	defer file.Close()

	if err := tmpl.Execute(file, data); err != nil {
		return fmt.Errorf("failed to execute template: %w", err)
	}

	return nil
}