# --- Build frontend ---
FROM node:alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Build backend ---
FROM golang:alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
COPY --from=frontend-builder /app/frontend/out ./static
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o sshping ./cmd/sshping/main.go

# --- Final image ---
FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=backend-builder /app/backend/sshping .
COPY --from=frontend-builder /app/frontend/out ./static
EXPOSE 3000
CMD ["./sshping"]
