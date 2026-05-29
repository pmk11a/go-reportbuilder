# CLAUDE.md - Backend Development Guide

This file provides guidance for AI assistants (Claude) when working with the Go backend project.

---

## ⚡ Quick Start Commands

```bash
# Development
go mod download         # Download dependencies
go run ./cmd/main.go   # Start dev server on http://localhost:8080

# Building
go build -o bin/dapen-backend ./cmd/main.go    # Build binary
go build -ldflags="-s -w" -o bin/dapen ./cmd   # Build optimized

# Code Quality
go fmt ./...            # Format code
go vet ./...            # Lint code
go test ./...           # Run tests

# Database & Migrations
# (Add migration commands when migrations are implemented)
```

---

## 🌍 Environment Variables

Create `.env` in the project root with:

```env
# Server Configuration
PORT=8080
GIN_MODE=debug                  # Set to "release" for production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=dapen

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization
```

**Key Points:**
- Never commit `.env` with real secrets
- `GIN_MODE=debug` for development, `release` for production
- JWT_SECRET should be strong and unique
- CORS origins must match frontend URL

---

## 🏗️ Project Structure

```
golang-next/backend/
├── cmd/
│   └── main.go                 # Entry point - initializes app & server
│
├── internal/                   # Private packages (not importable from outside)
│   ├── config/
│   │   └── config.go          # Load & parse environment variables
│   │
│   ├── models/
│   │   ├── user.go            # User struct with BSON tags
│   │   ├── auth.go            # Auth-related types (LoginRequest, etc.)
│   │   └── response.go        # Standard API response types
│   │
│   ├── handlers/              # HTTP route handlers (feature-based)
│   │   ├── auth.go            # Login, register, logout handlers
│   │   ├── user.go            # User CRUD handlers
│   │   ├── dashboard.go       # Dashboard data handlers
│   │   └── [feature].go       # Additional feature handlers
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth_service.go    # Authentication logic
│   │   ├── user_service.go    # User operations
│   │   └── [feature].go       # Feature-specific logic
│   │
│   ├── repositories/          # Data access layer
│   │   ├── user_repository.go # Database queries for users
│   │   └── [feature].go       # Feature-specific queries
│   │
│   ├── middleware/
│   │   ├── cors.go            # CORS middleware
│   │   ├── auth.go            # JWT authentication middleware
│   │   ├── error.go           # Error handling middleware
│   │   └── logging.go         # Request/response logging
│   │
│   ├── utils/
│   │   ├── jwt.go             # JWT token generation & validation
│   │   ├── password.go        # Password hashing & verification
│   │   ├── errors.go          # Error response utilities
│   │   └── validator.go       # Input validation helpers
│   │
│   ├── database/
│   │   └── mongodb.go         # MongoDB connection & initialization
│   │
│   └── app.go                 # App struct & route setup
│
├── pkg/                        # Public packages (reusable)
│   └── logger/
│       └── logger.go          # Structured logging
│
├── tests/
│   ├── integration/           # Integration tests
│   └── unit/                  # Unit tests
│
├── go.mod                     # Module definition & dependencies
├── go.sum                     # Dependency checksums
├── main.go                    # Symlink or wrapper for cmd/main.go
├── Makefile                   # Build & run commands
├── Dockerfile                 # Docker container config
├── docker-compose.yml         # Docker Compose for local dev
├── README.md                  # Project documentation
└── CLAUDE.md                  # This file
```

---

## 🎨 Architecture & Patterns

### 1. Project Layout: internal/ vs pkg/

**`internal/` - Private packages:**
- Cannot be imported from outside this project
- Used for application-specific logic
- Example: `internal/handlers`, `internal/services`

**`pkg/` - Public packages:**
- Can be imported from other projects
- Reusable components
- Example: `pkg/logger`, `pkg/validator`

### 2. Handler Pattern (HTTP Layer)

**Handler responsibilities:**
- Parse HTTP request
- Call service layer
- Return HTTP response

```go
// internal/handlers/auth.go
package handlers

import (
  "github.com/gin-gonic/gin"
  "golang-next/internal/models"
  "golang-next/internal/services"
)

type AuthHandler struct {
  authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
  return &AuthHandler{authService: authService}
}

// Login godoc
// @Summary Login with email and password
// @Description Authenticate user and return JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.SuccessResponse{data=models.LoginResponse}
// @Failure 401 {object} models.ErrorResponse
// @Router /api/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
  var req models.LoginRequest
  
  // Validate request
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, models.ErrorResponse{
      Success: false,
      Message: "Invalid request format",
      Error:   err.Error(),
    })
    return
  }

  // Call service
  loginResp, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
  if err != nil {
    c.JSON(401, models.ErrorResponse{
      Success: false,
      Message: "Invalid credentials",
      Error:   err.Error(),
    })
    return
  }

  // Success response
  c.JSON(200, models.SuccessResponse{
    Success: true,
    Message: "Login successful",
    Data:    loginResp,
  })
}
```

### 3. Service Pattern (Business Logic Layer)

**Service responsibilities:**
- Implement business logic
- Coordinate between handlers and repositories
- Validate business rules

```go
// internal/services/auth_service.go
package services

import (
  "context"
  "errors"
  "golang-next/internal/models"
  "golang-next/internal/repositories"
  "golang-next/internal/utils"
)

type AuthService struct {
  userRepo *repositories.UserRepository
}

func NewAuthService(userRepo *repositories.UserRepository) *AuthService {
  return &AuthService{userRepo: userRepo}
}

// Login authenticates user and returns JWT token
func (s *AuthService) Login(ctx context.Context, email, password string) (*models.LoginResponse, error) {
  // Find user by email
  user, err := s.userRepo.FindByEmail(ctx, email)
  if err != nil {
    return nil, errors.New("user not found")
  }

  // Verify password
  if !utils.VerifyPassword(user.Password, password) {
    return nil, errors.New("invalid password")
  }

  // Generate JWT token
  token, err := utils.GenerateJWT(user.ID.Hex())
  if err != nil {
    return nil, errors.New("failed to generate token")
  }

  return &models.LoginResponse{
    User:  user,
    Token: token,
  }, nil
}
```

### 4. Repository Pattern (Data Access Layer)

**Repository responsibilities:**
- Query database
- Return domain objects
- Abstract database implementation

```go
// internal/repositories/user_repository.go
package repositories

import (
  "context"
  "golang-next/internal/models"
  "go.mongodb.org/mongo-driver/bson"
  "go.mongodb.org/mongo-driver/mongo"
)

type UserRepository struct {
  collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) *UserRepository {
  return &UserRepository{
    collection: db.Collection("users"),
  }
}

// FindByEmail retrieves user by email
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
  var user models.User
  
  err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
  if err != nil {
    return nil, err
  }
  
  return &user, nil
}

// Create inserts new user
func (r *UserRepository) Create(ctx context.Context, user *models.User) (*mongo.InsertOneResult, error) {
  return r.collection.InsertOne(ctx, user)
}

// FindByID retrieves user by ID
func (r *UserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
  objectID, _ := primitive.ObjectIDFromHex(id)
  var user models.User
  
  err := r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
  if err != nil {
    return nil, err
  }
  
  return &user, nil
}
```

### 5. Middleware Pattern

**Middleware responsibilities:**
- Process request before handler
- Authentication/Authorization
- Logging, error handling, CORS

```go
// internal/middleware/auth.go
package middleware

import (
  "github.com/gin-gonic/gin"
  "golang-next/internal/utils"
)

// AuthMiddleware validates JWT token from Authorization header
func AuthMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    tokenString := c.GetHeader("Authorization")
    
    if tokenString == "" {
      c.JSON(401, gin.H{
        "success": false,
        "message": "Missing authorization token",
      })
      c.Abort()
      return
    }

    // Extract token from "Bearer <token>"
    if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
      tokenString = tokenString[7:]
    }

    // Validate token
    claims, err := utils.ValidateJWT(tokenString)
    if err != nil {
      c.JSON(401, gin.H{
        "success": false,
        "message": "Invalid token",
        "error":   err.Error(),
      })
      c.Abort()
      return
    }

    // Store user ID in context
    c.Set("userID", claims.UserID)
    c.Next()
  }
}
```

### 6. Models with BSON Tags

**All MongoDB documents must have BSON tags:**

```go
// internal/models/user.go
package models

import (
  "time"
  "go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
  ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  Email     string             `bson:"email" json:"email"`
  Name      string             `bson:"name" json:"name"`
  Password  string             `bson:"password" json:"-"`  // Never expose in JSON
  Role      string             `bson:"role" json:"role"`
  CreatedAt time.Time          `bson:"created_at" json:"created_at"`
  UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type LoginRequest struct {
  Email    string `json:"email" binding:"required,email"`
  Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
  User  *User  `json:"user"`
  Token string `json:"token"`
}
```

**BSON Tag Rules:**
- Field must have both `bson` and `json` tags
- Use `bson:"_id,omitempty"` for MongoDB ID field
- Use `json:"-"` to hide sensitive fields (passwords)
- Use `binding:"required"` for request validation in Gin

---

## 📝 Code Style & Conventions

### File Naming

| Type | Example | Pattern |
|------|---------|---------|
| Handler | `auth.go` | lowercase, feature name |
| Service | `auth_service.go` | lowercase with `_service` suffix |
| Repository | `user_repository.go` | lowercase with `_repository` suffix |
| Model | `user.go` | lowercase, singular |
| Middleware | `auth.go` | lowercase, feature name |
| Utils | `jwt.go` | lowercase, utility name |
| Tests | `auth_test.go` | `_test.go` suffix |

### Package Organization

```go
// ✅ GOOD: Related functions in same file
// internal/handlers/auth.go
type AuthHandler struct { ... }

func (h *AuthHandler) Login(c *gin.Context) { ... }
func (h *AuthHandler) Register(c *gin.Context) { ... }
func (h *AuthHandler) Logout(c *gin.Context) { ... }

// ❌ AVOID: Random file splitting
// One function per file - causes maintenance issues
```

### Receiver Names

```go
// ✅ USE: One or two character receiver names
type AuthHandler struct { ... }
func (h *AuthHandler) Login(c *gin.Context) { ... }

func (u *User) IsAdmin() bool { ... }

// ❌ AVOID: Long receiver names
type AuthHandler struct { ... }
func (authHandler *AuthHandler) Login(c *gin.Context) { ... }
```

### Error Handling

```go
// ✅ GOOD: Handle all errors
user, err := r.FindByEmail(ctx, email)
if err != nil {
  c.JSON(500, ErrorResponse{...})
  return
}

// ❌ AVOID: Ignoring errors
user, _ := r.FindByEmail(ctx, email)  // ERROR IGNORED!

// ✅ GOOD: Wrap errors with context
data, err := someFunc()
if err != nil {
  return fmt.Errorf("failed to fetch data: %w", err)
}
```

### Context Usage

```go
// ✅ GOOD: Always pass context
func (s *Service) GetUser(ctx context.Context, id string) (*User, error) {
  return s.repo.FindByID(ctx, id)
}

// ✅ GOOD: Use context for database operations
user := &User{}
err := collection.FindOne(ctx, filter).Decode(&user)

// ✅ GOOD: Pass context from handler to service
func (h *Handler) GetUser(c *gin.Context) {
  user, err := h.service.GetUser(c.Request.Context(), id)
  // ...
}

// ❌ AVOID: Ignoring context
func (s *Service) GetUser(id string) (*User, error) {
  // No context = no timeout/cancellation support
}
```

---

## 🔌 API Endpoints & Routes

### Setup Routes in main.go

```go
// cmd/main.go
func main() {
  config := internal.LoadConfig()
  db := internal.ConnectMongoDB(config)
  
  app := internal.NewApp(db)
  
  // Setup routes
  v1 := app.Router.Group("/api")
  
  // Auth routes (public)
  auth := v1.Group("/auth")
  {
    auth.POST("/login", app.AuthHandler.Login)
    auth.POST("/register", app.AuthHandler.Register)
    auth.POST("/logout", app.AuthHandler.Logout)
  }
  
  // Protected routes
  v1.Use(middleware.AuthMiddleware())
  {
    v1.GET("/auth/me", app.AuthHandler.GetMe)
    v1.GET("/dashboard", app.DashboardHandler.GetStats)
    v1.GET("/users", app.UserHandler.List)
  }
  
  // Start server
  app.Router.Run(":" + config.Port)
}
```

### Current Endpoints

**Status:**
- `GET /health` - Health check (returns 200 OK)

**Authentication (TODO):**
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

**Dashboard (TODO):**
- `GET /api/dashboard/stats` - Dashboard statistics

---

## 🗄️ Database (MongoDB)

### Connection Setup

```go
// internal/database/mongodb.go
package database

import (
  "context"
  "os"
  "go.mongodb.org/mongo-driver/mongo"
  "go.mongodb.org/mongo-driver/mongo/options"
)

func ConnectMongoDB(uri string) (*mongo.Database, error) {
  client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(uri))
  if err != nil {
    return nil, err
  }

  // Ping to verify connection
  ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
  defer cancel()
  
  if err := client.Ping(ctx, nil); err != nil {
    return nil, err
  }

  return client.Database("dapen"), nil
}
```

### BSON Queries

```go
// Finding users
user := &User{}
err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)

// Finding multiple users
cursor, err := collection.Find(ctx, bson.M{"role": "admin"})
defer cursor.Close(ctx)

var users []User
if err := cursor.All(ctx, &users); err != nil {
  return nil, err
}

// Updating user
result, err := collection.UpdateOne(
  ctx,
  bson.M{"_id": userID},
  bson.M{"$set": bson.M{"name": newName}},
)

// Deleting user
result, err := collection.DeleteOne(ctx, bson.M{"_id": userID})
```

### Indexes

```go
// Create unique email index
indexModel := mongo.IndexModel{
  Keys: bson.D{{Key: "email", Value: 1}},
  Options: options.Index().SetUnique(true),
}

_, err := collection.Indexes().CreateOne(ctx, indexModel)
```

---

## 🔐 Authentication & JWT

### JWT Generation

```go
// internal/utils/jwt.go
package utils

import (
  "github.com/golang-jwt/jwt/v5"
  "time"
  "os"
)

type Claims struct {
  UserID string `json:"user_id"`
  jwt.RegisteredClaims
}

// GenerateJWT creates a JWT token
func GenerateJWT(userID string) (string, error) {
  claims := &Claims{
    UserID: userID,
    RegisteredClaims: jwt.RegisteredClaims{
      ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
      IssuedAt:  jwt.NewNumericDate(time.Now()),
    },
  }

  token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
  return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// ValidateJWT verifies a JWT token
func ValidateJWT(tokenString string) (*Claims, error) {
  claims := &Claims{}
  
  token, err := jwt.ParseWithClaims(
    tokenString,
    claims,
    func(token *jwt.Token) (interface{}, error) {
      return []byte(os.Getenv("JWT_SECRET")), nil
    },
  )

  if err != nil {
    return nil, err
  }

  if !token.Valid {
    return nil, errors.New("invalid token")
  }

  return claims, nil
}
```

### Password Hashing

```go
// internal/utils/password.go
package utils

import "golang.org/x/crypto/bcrypt"

// HashPassword hashes a password with bcrypt
func HashPassword(password string) (string, error) {
  hashedPassword, err := bcrypt.GenerateFromPassword(
    []byte(password),
    bcrypt.DefaultCost,
  )
  return string(hashedPassword), err
}

// VerifyPassword compares hashed password with plain password
func VerifyPassword(hashedPassword, plainPassword string) bool {
  return bcrypt.CompareHashAndPassword(
    []byte(hashedPassword),
    []byte(plainPassword),
  ) == nil
}
```

---

## 🧪 Testing

### Unit Tests

```go
// internal/utils/password_test.go
package utils

import "testing"

func TestHashPassword(t *testing.T) {
  password := "myPassword123"
  hashed, err := HashPassword(password)
  
  if err != nil {
    t.Fatalf("expected no error, got %v", err)
  }
  
  if !VerifyPassword(hashed, password) {
    t.Error("password verification failed")
  }
}

func TestVerifyPassword_WrongPassword(t *testing.T) {
  password := "myPassword123"
  hashed, _ := HashPassword(password)
  
  if VerifyPassword(hashed, "wrongPassword") {
    t.Error("should not verify wrong password")
  }
}
```

### Integration Tests

```go
// tests/integration/auth_test.go
package integration

import (
  "context"
  "testing"
  "golang-next/internal/models"
  "golang-next/internal/repositories"
)

func TestUserRepository_Create(t *testing.T) {
  // Setup: Connect to test database
  db, cleanup := setupTestDB(t)
  defer cleanup()

  repo := repositories.NewUserRepository(db)
  
  user := &models.User{
    Email:    "test@example.com",
    Password: "hashedPassword",
    Name:     "Test User",
  }

  result, err := repo.Create(context.Background(), user)
  if err != nil {
    t.Fatalf("failed to create user: %v", err)
  }

  if result.InsertedID == nil {
    t.Error("expected inserted ID, got nil")
  }
}
```

---

## 🚀 Deployment

### Build Binary

```bash
# Development build
go build -o bin/dapen-backend ./cmd/main.go

# Production build (optimized)
go build -ldflags="-s -w" -o bin/dapen ./cmd/main.go
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM golang:1.25.5 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o dapen ./cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/dapen .
EXPOSE 8080
CMD ["./dapen"]
```

### Environment for Production

```env
PORT=8080
GIN_MODE=release
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dapen
JWT_SECRET=<STRONG-SECRET-KEY>
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## ✅ Common Tasks

### Add New Handler

```go
// 1. Create handler file
// internal/handlers/product.go

package handlers

import (
  "github.com/gin-gonic/gin"
  "golang-next/internal/services"
)

type ProductHandler struct {
  service *services.ProductService
}

func NewProductHandler(service *services.ProductService) *ProductHandler {
  return &ProductHandler{service: service}
}

func (h *ProductHandler) List(c *gin.Context) {
  products, err := h.service.GetAll(c.Request.Context())
  if err != nil {
    c.JSON(500, gin.H{"error": err.Error()})
    return
  }
  c.JSON(200, products)
}

// 2. Register in main.go
router.GET("/api/products", h.ProductHandler.List)
```

### Add New Service

```go
// 1. Create service file
// internal/services/product_service.go

package services

import (
  "context"
  "golang-next/internal/repositories"
)

type ProductService struct {
  repo *repositories.ProductRepository
}

func NewProductService(repo *repositories.ProductRepository) *ProductService {
  return &ProductService{repo: repo}
}

func (s *ProductService) GetAll(ctx context.Context) ([]Product, error) {
  return s.repo.FindAll(ctx)
}
```

### Add Middleware

```go
// 1. Create middleware file
// internal/middleware/logging.go

package middleware

import (
  "fmt"
  "github.com/gin-gonic/gin"
  "time"
)

func LoggingMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    start := time.Now()
    
    c.Next() // Process request
    
    duration := time.Since(start)
    fmt.Printf("[%s] %s %s %d %v\n",
      time.Now().Format("2006-01-02 15:04:05"),
      c.Request.Method,
      c.Request.RequestURI,
      c.Writer.Status(),
      duration,
    )
  }
}

// 2. Register in main.go
router.Use(middleware.LoggingMiddleware())
```

---

## 🐛 Debugging

### Enable Logging

```go
import "log"

// Basic logging
log.Printf("User login: %s\n", email)

// Structured logging (for production)
type Logger struct { ... }
logger.Info("User login", "email", email, "timestamp", time.Now())
```

### Debug Database Queries

```go
// Print MongoDB query
log.Printf("Query: %+v", bson.M{"email": email})

// Count results
count, err := collection.CountDocuments(ctx, filter)
log.Printf("Found %d documents", count)
```

### Test API Endpoints

```bash
# Using curl
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Health check
curl http://localhost:8080/health
```

---

## 📚 Key Files Reference

| File | Purpose | When to Edit |
|------|---------|--------------|
| `cmd/main.go` | Application entry point | Add routes, configure app |
| `internal/config/config.go` | Load environment variables | Never directly (use .env) |
| `internal/app.go` | App initialization & routes | Add new route groups |
| `internal/handlers/*.go` | HTTP request handlers | Implement API endpoints |
| `internal/services/*service.go` | Business logic | Implement business rules |
| `internal/repositories/*_repo.go` | Database queries | Implement data access |
| `internal/models/*.go` | Data structures | Add fields to models |
| `internal/middleware/*.go` | HTTP middleware | Add cross-cutting concerns |
| `internal/utils/*.go` | Helper functions | Add reusable utilities |
| `internal/database/mongodb.go` | DB connection | Never (unless changing DB) |
| `go.mod` | Dependencies | Add new packages (go get) |

---

## 🔗 Useful Resources

- [Go Official Documentation](https://golang.org/doc)
- [Gin Web Framework](https://gin-gonic.com/docs)
- [MongoDB Go Driver](https://www.mongodb.com/docs/drivers/go)
- [Go Best Practices](https://golang.org/doc/effective_go)
- [JWT for Go](https://github.com/golang-jwt/jwt)
- [Bcrypt for Password Hashing](https://pkg.go.dev/golang.org/x/crypto/bcrypt)

---

**Last Updated:** April 2026  
**Status:** Production Ready  
**Version:** 1.0
