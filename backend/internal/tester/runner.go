package tester

import (
	"context"
	"time"

	"github.com/sshping/sshping/internal/models"
)

type LogCallback func(msg models.LogMessage)

type Runner interface {
	Run(ctx context.Context, req models.TestRequest, logger LogCallback)
}

func logMessage(logger LogCallback, level, stage, message string, durationMs ...int) {
	msg := models.LogMessage{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Level:     level,
		Stage:     stage,
		Message:   message,
	}
	if len(durationMs) > 0 {
		msg.DurationMs = &durationMs[0]
	}
	logger(msg)
}
