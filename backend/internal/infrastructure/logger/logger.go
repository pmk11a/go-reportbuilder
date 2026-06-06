package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/sirupsen/logrus"
)

var (
	log      *logrus.Logger
	logFile  *os.File
	logLevel string
)

// InitLogger initialize logrus logger with daily file rotation + console output
// Configuration via environment variables (like Laravel):
//
// LOG_LEVEL=info              # debug, info, warn, error
// LOG_CHANNEL=daily           # daily (rotate daily), single (one file)
// LOG_PATH=./logs             # Directory to store logs
//
// Example .env:
// LOG_LEVEL=info
// LOG_CHANNEL=daily
// LOG_PATH=./logs
//
func InitLogger() error {
	log = logrus.New()

	// Create logs directory
	logsDir := os.Getenv("LOG_PATH")
	if logsDir == "" {
		logsDir = "logs"
	}
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return fmt.Errorf("failed to create logs directory: %w", err)
	}

	// Determine log level from env (like Laravel)
	logLevel = os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}

	// Get log channel from env (daily, single, stack, etc)
	logChannel := os.Getenv("LOG_CHANNEL")
	if logChannel == "" {
		logChannel = "daily"
	}

	// Open daily log file with date in filename
	var logFilePath string
	if logChannel == "daily" {
		// Daily rotation: app-2026-06-06.log
		dateStr := time.Now().Format("2006-01-02")
		logFilePath = filepath.Join(logsDir, fmt.Sprintf("app-%s.log", dateStr))
	} else {
		// Single file: app.log
		logFilePath = filepath.Join(logsDir, "app.log")
	}

	var err error
	logFile, err = os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	// JSON formatter untuk structured logging
	log.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
		PrettyPrint:     false,
	})

	// Write ke file dan stdout
	log.SetOutput(logFile)
	log.AddHook(&ConsoleHook{})

	// Set log level
	if level, err := logrus.ParseLevel(logLevel); err == nil {
		log.SetLevel(level)
	}

	log.WithFields(logrus.Fields{
		"file":    logFilePath,
		"channel": logChannel,
		"level":   logLevel,
		"mode":    "file+console",
	}).Info("✅ Logger initialized")

	return nil
}

// GetLogger return logger instance
func GetLogger() *logrus.Logger {
	if log == nil {
		log = logrus.New()
	}
	return log
}

// ConsoleHook untuk print ke stdout juga
type ConsoleHook struct{}

func (hook *ConsoleHook) Levels() []logrus.Level {
	return logrus.AllLevels
}

func (hook *ConsoleHook) Fire(entry *logrus.Entry) error {
	// Print ke stdout dengan colors
	formatter := &logrus.TextFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
		FullTimestamp:   true,
		ForceColors:     true,
	}
	msg, _ := formatter.Format(entry)
	fmt.Print(string(msg))
	return nil
}

// Close logger resources
func Close() {
	if log != nil {
		// Logrus handles file closing internally
	}
}
