package cmd

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "tafy",
	Short: "Tafy Studio CLI - Build robots faster",
	Long: `Tafy Studio CLI provides tools for building and managing robot systems.
	
This includes scaffolding drivers, managing deployments, and more.`,
	Version: "0.1.0",
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.CompletionOptions.DisableDefaultCmd = true
}