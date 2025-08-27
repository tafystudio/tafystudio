package main

import (
	"fmt"
	"strings"
	"text/template"
)

const cppTest = `messages_published_ = &messages_published_family.Add({{"{"}}"driver", "{{.NameLower}}"{{"}"}});`

func main() {
	tmpl, err := template.New("test").Parse(cppTest)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		lines := strings.Split(cppTest, "\n")
		for i, line := range lines {
			fmt.Printf("%d: %s\n", i+1, line)
		}
		return
	}
	fmt.Println("Template parsed successfully")
	_ = tmpl
}