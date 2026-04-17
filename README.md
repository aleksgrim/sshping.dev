# SSHping ⚡

**Ping your servers. Trust your setup.**

🌐 **[sshping.dev](https://sshping.dev)**

A self-hosted web tool for testing SSH, SFTP, and FTP(S) connections. Run it locally or on a server via Docker to verify the reachability of your nodes through a clean web interface—without storing credentials or databases.

## Technology Stack

- **Backend**: Go (Fiber, WebSocket)
- **Frontend**: Next.js 16 (App Router, Tailwind CSS 4, Zustand)
- **Deployment**: Docker

## Quick Start

### Docker (Recommended)
```bash
cp docker-compose.example.yml docker-compose.yml
# Set your secure AUTH_TOKENS inside docker-compose.yml or .env!
docker compose up --build -d
```
Navigate to http://localhost:3000

### Local Development

- **Backend**: `make dev-backend` (or `cd backend && go run ./cmd/sshping/main.go`)
- **Frontend**: `make dev-frontend` (or `cd frontend && npm run dev`)

### Standalone Binaries (Embedded Frontend)

The Go backend is configured to automatically embed (`go:embed`) the entire Next.js static frontend within itself! The result is a single executable file of ~18 MB that runs anywhere without requiring Node.js or Nginx.

```bash
# This command builds the frontend, copies it to backend/static, and compiles binaries for Linux, macOS, and Windows:
make build-binaries

# The compiled binaries will appear in the build/ directory. You can run them directly:
chmod +x ./build/sshping-linux-amd64
AUTH_TOKENS="my_secret_token_123" PORT="8080" ./build/sshping-linux-amd64
```

## Security & Privacy 🔒

**SSHping is a 100% Stateless application.** 
- ❌ We have no database (no SQLite, Postgres, Redis, etc.).
- ❌ We do not log, cache, or save IP addresses, usernames, passwords, or SSH keys.
- ✅ All credentials live exclusively in the RAM of the running process for exactly the few seconds the connection test lasts, and are immediately destroyed by the Go Garbage Collector.
- ✅ The project is fully open-source, so you can audit all of the claims above yourself!

> [!WARNING]
> **This is an incredibly powerful networking tool.**
> DO NOT expose it to the public internet without proper authentication. You **MUST** define `AUTH_TOKENS` in your environment to protect the API endpoints. 
> If you plan to run this as an open SaaS tool without token-protection, you absolutely must implement a Rate Limiter (by IP), Captcha, and a strict firewall block prohibiting pings to internal/private subnets (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, cloud metadata endpoints). Without these protections, bad actors will abuse your public instance as a botnet proxy for brute-force attacks and internal port scanning.

## Support

For any questions, issues, or business inquiries, feel free to contact me directly at:  
📫 **alexgrimdev@gmail.com**
