.PHONY: frontend backend build run dev

run:
	docker-compose up --build

dev-backend:
	cd backend && go run ./cmd/sshping/main.go

dev-frontend:
	cd frontend && npm run dev

build:
	docker build -t sshping/sshping .

build-binaries:
	@echo "Building frontend..."
	cd frontend && npm ci && npm run build
	@echo "Copying to backend/static..."
	rm -rf backend/static
	mkdir -p backend/static
	cp -r frontend/out/* backend/static/
	find backend/static -type d -exec touch {}/.keep \;
	@echo "Compiling Standalone Binaries..."
	mkdir -p build
	
	@echo "-> Linux (amd64 & arm64)"
	cd backend && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o ../build/sshping-linux-amd64 ./cmd/sshping/main.go
	cd backend && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-w -s" -o ../build/sshping-linux-arm64 ./cmd/sshping/main.go
	
	@echo "-> macOS (Intel & Apple Silicon)"
	cd backend && CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags="-w -s" -o ../build/sshping-darwin-amd64 ./cmd/sshping/main.go
	cd backend && CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags="-w -s" -o ../build/sshping-darwin-arm64 ./cmd/sshping/main.go
	
	@echo "-> Windows (amd64 & arm64)"
	cd backend && CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="-w -s" -o ../build/sshping-windows-amd64.exe ./cmd/sshping/main.go
	cd backend && CGO_ENABLED=0 GOOS=windows GOARCH=arm64 go build -ldflags="-w -s" -o ../build/sshping-windows-arm64.exe ./cmd/sshping/main.go
	
	@echo "Done! Binaries are in the ./build directory"
