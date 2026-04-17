package api

import (
	"context"
	"log"
	"sync"
	"time"

	"strings"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/sshping/sshping/internal/models"
	"github.com/sshping/sshping/internal/tester"
)

var (
	// Very simple event bus for sessions
	sessions = make(map[string]chan models.LogMessage)
	mu       sync.Mutex
)

func SetupRoutes(app *fiber.App, authTokens []string) {
	// Middleware for checking tokens
	authMiddleware := func(c *fiber.Ctx) error {
		if len(authTokens) > 0 {
			token := c.Cookies("sshping_auth")
			if token == "" {
				token = c.Get("Authorization")
				if strings.HasPrefix(token, "Bearer ") {
					token = strings.TrimPrefix(token, "Bearer ")
				}
			}

			// for websockets we pass it in query because typical browser WS API can't send headers easily
			if token == "" {
				token = c.Query("token")
			}

			valid := false
			for _, t := range authTokens {
				if t == token && t != "" {
					valid = true
					break
				}
			}

			if !valid {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized. Missing or invalid secret token."})
			}
		}
		return c.Next()
	}

	app.Post("/api/test", authMiddleware, HandleTest)
	
	app.Get("/api/config", func(c *fiber.Ctx) error {
		loggedIn := false
		if len(authTokens) > 0 {
			if cookieToken := c.Cookies("sshping_auth"); cookieToken != "" {
				for _, t := range authTokens {
					if t == cookieToken {
						loggedIn = true
						break
					}
				}
			}
		}

		return c.JSON(fiber.Map{
			"auth_required": len(authTokens) > 0,
			"logged_in":     loggedIn,
		})
	})

	app.Post("/api/login", func(c *fiber.Ctx) error {
		type LoginReq struct {
			Token string `json:"token"`
		}
		var req LoginReq
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
		}

		if len(authTokens) > 0 {
			valid := false
			for _, t := range authTokens {
				if t == req.Token && t != "" {
					valid = true
					break
				}
			}
			if !valid {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
			}
		}

		c.Cookie(&fiber.Cookie{
			Name:     "sshping_auth",
			Value:    req.Token,
			Path:     "/",
			HTTPOnly: true,
			SameSite: "Strict",
		})

		return c.JSON(fiber.Map{"status": "ok"})
	})
	
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws/log/:session_id", authMiddleware, websocket.New(HandleWebSocket))
}

func HandleTest(c *fiber.Ctx) error {
	var req models.TestRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	sessionID := uuid.New().String()
	ch := make(chan models.LogMessage, 100)
	
	mu.Lock()
	sessions[sessionID] = ch
	mu.Unlock()

	go func(id string, req models.TestRequest) {
		// Cleanup when done
		defer func() {
			time.Sleep(1 * time.Second) // wait for ws to drain
			mu.Lock()
			close(ch)
			delete(sessions, id)
			mu.Unlock()
		}()

		var runner tester.Runner
		if req.Protocol == "ssh" {
			runner = &tester.SSHRunner{}
		} else if req.Protocol == "sftp" {
			runner = &tester.SFTPRunner{}
		} else if req.Protocol == "ftp" || req.Protocol == "ftps" {
			runner = &tester.FTPRunner{}
		} else {
			ch <- models.LogMessage{Level: "error", Stage: "init", Message: "Unsupported protocol yet"}
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		runner.Run(ctx, req, func(msg models.LogMessage) {
			select {
			case ch <- msg:
			case <-time.After(2 * time.Second):
				log.Println("dropped log message due to blocked channel")
			}
		})
	}(sessionID, req)

	return c.Status(fiber.StatusAccepted).JSON(models.SessionStatus{
		SessionID: sessionID,
		Status:    "running",
	})
}

func HandleWebSocket(c *websocket.Conn) {
	sessionID := c.Params("session_id")
	
	mu.Lock()
	ch, ok := sessions[sessionID]
	mu.Unlock()

	if !ok {
		c.WriteJSON(models.LogMessage{Level: "error", Message: "Session not found or already finished"})
		return
	}

	for msg := range ch {
		if err := c.WriteJSON(msg); err != nil {
			log.Println("write:", err)
			break
		}
	}
}
