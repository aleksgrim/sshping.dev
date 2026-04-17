package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/encryptcookie"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/sshping/sshping"
	"github.com/sshping/sshping/internal/api"
)

func main() {
	// Try to load .env file if it exists, without external dependencies
	if envFileData, err := os.ReadFile(".env"); err == nil {
		lines := strings.Split(string(envFileData), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				val := strings.TrimSpace(parts[1])
				val = strings.Trim(val, `"'`) // removing quotes
				
				if os.Getenv(key) == "" { // Don't override existing real env vars
					os.Setenv(key, val)
				}
			}
		}
	}

	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New()) // For local dev with separate frontend next dev server
	app.Use(encryptcookie.New(encryptcookie.Config{
		Key: encryptcookie.GenerateKey(),
	}))

	// API Routes
	authTokensStr := os.Getenv("AUTH_TOKENS")
	var authTokens []string
	if authTokensStr != "" {
		parts := strings.Split(authTokensStr, ",")
		for _, p := range parts {
			if trimmed := strings.TrimSpace(p); trimmed != "" {
				authTokens = append(authTokens, trimmed)
			}
		}
	}
	api.SetupRoutes(app, authTokens)

	// Serve static Next.js frontend files from embedded FS
	sub, err := fs.Sub(sshping.EmbedDir, "static")
	if err != nil {
		log.Fatalf("failed to sub embed dir: %v", err)
	}

	// Fallback for Next.js clean URLs (e.g. /bulk -> /bulk.html)
	// Must be BEFORE filesystem middleware to avoid directory Browse=false 403 errors
	app.Use(func(c *fiber.Ctx) error {
		path := c.Path()
		if c.Method() == "GET" && !strings.HasPrefix(path, "/api") && !strings.HasPrefix(path, "/ws") {
			htmlPath := path[1:] + ".html"
			if path == "/" {
				htmlPath = "index.html"
			}
			if file, err := sub.Open(htmlPath); err == nil {
				file.Close()
				data, _ := fs.ReadFile(sub, htmlPath)
				c.Set("Content-Type", "text/html")
				return c.Send(data)
			}
		}
		return c.Next()
	})

	app.Use("/", filesystem.New(filesystem.Config{
		Root:   http.FS(sub),
		Browse: false,
	}))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // default to 8080 for local dev
	}
	
	log.Printf("SSHping core running on :%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
