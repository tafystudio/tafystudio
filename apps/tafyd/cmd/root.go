package cmd

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/tafystudio/tafystudio/apps/tafyd/pkg/agent"
	"go.uber.org/zap"
)

var (
	cfgFile string
	debug   bool
)

var rootCmd = &cobra.Command{
	Use:   "tafyd",
	Short: "Tafy Studio Node Agent",
	Long: `Tafyd is the node agent for Tafy Studio Robot Distributed Operation System.
It handles device discovery, driver management, and cluster coordination.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAgent(cmd.Context())
	},
}

func Execute(ctx context.Context) error {
	return rootCmd.ExecuteContext(ctx)
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.tafyd.yaml)")
	rootCmd.PersistentFlags().BoolVar(&debug, "debug", false, "enable debug logging")

	// Bind flags to viper
	viper.BindPFlag("debug", rootCmd.PersistentFlags().Lookup("debug"))

	// Agent configuration flags
	rootCmd.Flags().String("node-id", "", "unique node identifier (auto-generated if empty)")
	rootCmd.Flags().String("nats-url", "nats://localhost:4222", "NATS server URL")
	rootCmd.Flags().String("role", "agent", "node role (agent, hub)")
	rootCmd.Flags().Int("mdns-port", 5353, "mDNS port")

	// Bind flags to viper
	viper.BindPFlag("node_id", rootCmd.Flags().Lookup("node-id"))
	viper.BindPFlag("nats_url", rootCmd.Flags().Lookup("nats-url"))
	viper.BindPFlag("role", rootCmd.Flags().Lookup("role"))
	viper.BindPFlag("mdns_port", rootCmd.Flags().Lookup("mdns-port"))
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.AddConfigPath("$HOME")
		viper.AddConfigPath(".")
		viper.SetConfigName(".tafyd")
		viper.SetConfigType("yaml")
	}

	viper.SetEnvPrefix("TAFY")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil {
		fmt.Println("Using config file:", viper.ConfigFileUsed())
	}

	// Update logger based on debug flag
	if viper.GetBool("debug") {
		logger, _ := zap.NewDevelopment()
		zap.ReplaceGlobals(logger)
	}
}

func runAgent(ctx context.Context) error {
	logger := zap.L()
	
	config := agent.Config{
		NodeID:   viper.GetString("node_id"),
		NATSUrl:  viper.GetString("nats_url"),
		Role:     viper.GetString("role"),
		MDNSPort: viper.GetInt("mdns_port"),
	}

	logger.Info("Starting Tafy node agent",
		zap.String("node_id", config.NodeID),
		zap.String("role", config.Role),
		zap.String("nats_url", config.NATSUrl),
	)

	a, err := agent.New(config)
	if err != nil {
		return fmt.Errorf("failed to create agent: %w", err)
	}

	return a.Run(ctx)
}