# DAPEN Backend

Scalable REST API server built with **Golang** and **Gin Framework**. This is a **Backend For Frontend (BFF)** architecture serving the DAPEN web application frontend.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Features](#features)
- [Configuration](#configuration)

---

## 🎯 Project Overview

DAPEN Backend is a RESTful API server that:
- Handles authentication & authorization
- Manages business logic & data operations
- Provides data validation & error handling
- Communicates with database (MongoDB)
- Supports multiple clients (frontend, mobile, etc.)

### Architecture
- **Language**: Go 1.25.5
- **Framework**: Gin Web Framework
- **Database**: MongoDB (planned)
- **API Style**: RESTful with JSON

---

## 🛠️ Tech Stack

### Core
- **Golang** 1.25.5 - Backend language
- **Gin Web Framework** 1.12.0 - HTTP server & routing

### Data Validation & Serialization
- **Validator** 10.30.1 - Struct validation
- **JSON Processing** - Native encoding/json + go-json (fast JSON)

### Database (Planned)
- **MongoDB Driver** 2.5.0 - MongoDB connectivity

### HTTP & Protocol Support
- **HTTP/2 & HTTP/3** - Modern protocols
- **QUIC** - QUIC protocol support
- **TLS/Crypto** - Secure communications

### Utilities
- **YAML** - Configuration parsing
- **UUID** - Unique identifiers
- **MIME Type Detection** - File type validation

---

## 📦 Dependencies

### Direct Dependencies (via go.mod)

**Web Framework:**
- `github.com/gin-gonic/gin` - HTTP web framework with routing, middleware, etc.
- `github.com/gin-contrib/sse` - Server-Sent Events support

**Data Validation:**
- `github.com/go-playground/validator/v10` - Struct validation
- `github.com/go-playground/universal-translator` - Validator translations
- `github.com/go-playground/locales` - Locale support

**JSON Processing:**
- `github.com/goccy/go-json` - Fast JSON encoder/decoder
- `github.com/json-iterator/go` - JSON compatibility layer
- `github.com/ugorji/go/codec` - Encoding support

**Database:**
- `go.mongodb.org/mongo-driver/v2` - MongoDB official driver

**Cryptography & Security:**
- `golang.org/x/crypto` - Cryptographic functions
- `crypto/sha256`, `crypto/rand` - Built-in crypto (Go std lib)

**Network Protocols:**
- `github.com/quic-go/quic-go` - QUIC protocol
- `github.com/quic-go/qpack` - QPACK compression
- `golang.org/x/net` - Extended networking
- `google.golang.org/protobuf` - Protocol buffers

**Configuration & Parsing:**
- `github.com/goccy/go-yaml` - YAML parsing
- `github.com/pelletier/go-toml/v2` - TOML parsing

**Utilities & Optimization:**
- `github.com/bytedance/sonic` - Fast JSON serialization
- `github.com/bytedance/gopkg` - Bytedance utilities
- `github.com/gabriel-vasile/mimetype` - MIME type detection
- `github.com/modern-go/reflect2` - Reflection utilities
- `github.com/twitchyliquid64/golang-asm` - Assembly utilities
- `golang.org/x/arch` - Architecture-specific optimizations
- `golang.org/x/text` - Text processing
- `golang.org/x/sys` - System calls
- `golang.org/x/sync` - Synchronization primitives

**Others:**
- `github.com/leodido/go-urn` - URN parsing
- `github.com/klauspost/cpuid/v2` - CPU feature detection
- `github.com/cloudwego/base64x` - Base64 encoding

### Build & Development
- No external build tools required (native Go build)
- Go 1.25.5+ includes all needed build tools

---

## 💾 Installation

### Prerequisites

- **Go** 1.25.5+ (download from [golang.org](https://golang.org/dl))
- **Git** for version control
- **MongoDB** (for database operations)

### Setup Instructions

1. **Verify Go installation:**
```bash
go version
```

2. **Navigate to backend directory:**
```bash
cd golang-next/backend
```

3. **Download dependencies:**
```bash
go mod download
```

4. **Verify dependencies:**
```bash
go mod verify
```

5. **Build the application:**
```bash
go build -o bin/dapen-backend ./cmd/main.go
```

6. **Verify build:**
```bash
./bin/dapen-backend &
# Check: curl http://localhost:8080/health
```

---

## 🚀 Development

### Start Development Server

```bash
go run ./cmd/main.go
```

The API will be available at `http://localhost:8080`

**Features:**
- Automatic reload on code changes (use air for hot reload)
- Debug logging
- Gin debug mode

### Using Air for Hot Reload (Optional)

```bash
# Install air
go install github.com/cosmtrek/air@latest

# Run with hot reload
air
```

### Available Commands

| Command | Description |
|---------|-------------|
| `go run ./cmd/main.go` | Start dev server |
| `go build -o bin/dapen-backend ./cmd` | Build binary |
| `go test ./...` | Run tests |
| `go fmt ./...` | Format code |
| `go vet ./...` | Run linter |
| `go mod tidy` | Clean up dependencies |

---

## 🏗️ Building

### Compile Binary

```bash
go build -o bin/dapen-backend ./cmd/main.go
```

### Cross-Platform Build

```bash
# Linux x86_64
GOOS=linux GOARCH=amd64 go build -o bin/dapen-backend-linux ./cmd

# macOS ARM64 (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o bin/dapen-backend-mac ./cmd

# Windows
GOOS=windows GOARCH=amd64 go build -o bin/dapen-backend.exe ./cmd
```

### Optimized Release Build

```bash
go build -ldflags="-s -w" -o bin/dapen-backend ./cmd
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Health Check

```http
GET /health
```

### Authentication (TODO)

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Dashboard (TODO)

```http
GET /api/dashboard/stats
GET /api/dashboard/users
GET /api/dashboard/reports
```

---

## 📁 Project Structure

```
backend/
├── cmd/
│   └── main.go              # Application entry point
├── internal/                # Private application code
│   ├── handlers/            # HTTP request handlers
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── middleware/          # HTTP middleware
│   ├── repository/          # Database access layer
│   ├── config/              # Configuration
│   └── utils/               # Helper functions
├── pkg/                     # Public packages (reusable)
│   ├── errors/              # Error handling
│   └── response/            # Response formatting
├── go.mod                   # Dependency manifest
├── go.sum                   # Dependency checksums
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

---

## ✨ Features

### 🔐 Authentication
- JWT token support (to be implemented)
- Password hashing with bcrypt
- Session management
- Refresh token rotation

### 👥 User Management
- User registration & profile
- Role-based access control (RBAC)
- User preferences & settings

### 📊 Dashboard
- Statistics & analytics
- User analytics
- System metrics

### 📝 Data Validation
- Input validation on all endpoints
- Struct validation with validator/v10
- Custom validation rules

### 🛡️ Security
- CORS support
- Rate limiting (planned)
- Input sanitization
- Password hashing
- JWT authentication

### 🔍 Logging & Monitoring
- Structured logging
- Request/response logging
- Error tracking
- Performance metrics (planned)

### 🗄️ Database
- MongoDB integration
- Repository pattern for data access
- Connection pooling
- Query optimization

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in backend directory:

```env
# Server
PORT=8080
GIN_MODE=debug

# Database
MONGO_URI=mongodb://localhost:27017
MONGO_DB=dapen

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Others
LOG_LEVEL=info
```

---

## 🐛 Troubleshooting

### Port 8080 already in use
```bash
# Find process using port
lsof -i :8080

# Use different port
PORT=8081 go run ./cmd/main.go
```

### MongoDB connection error
```bash
# Ensure MongoDB is running
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Docker: docker run -d -p 27017:27017 mongo:latest
```

### Dependency issues
```bash
# Clean module cache
go clean -modcache

# Re-download dependencies
go mod download

# Tidy dependencies
go mod tidy
```

---

## 📊 Performance Tips

1. **Use Connection Pooling**: MongoDB driver handles this automatically
2. **Implement Caching**: Cache frequently accessed data
3. **Use Pagination**: Limit data returned per request
4. **Index Database**: Create indexes on frequently queried fields
5. **Compress Responses**: Use gzip middleware in Gin
6. **Monitor Goroutines**: Keep track of goroutine leaks

---

## 📚 Resources

- [Golang Official Docs](https://golang.org/doc)
- [Gin Framework Docs](https://gin-gonic.com/)
- [MongoDB Go Driver](https://www.mongodb.com/docs/drivers/go/)

---

## 📝 License

This project is part of DAPEN application.

---

**Last Updated**: April 22, 2026
**Version**: 0.1.0
**Go Version**: 1.25.5+
**Status**: Active Development 🚀
