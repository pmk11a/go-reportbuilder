package e2e

import (
	"net/http"
	"net/http/httptest"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"github.com/masza1/dapen-backend/internal/infrastructure/database"
	"github.com/masza1/dapen-backend/internal/infrastructure/middleware"
	"github.com/masza1/dapen-backend/internal/app/routes"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
	"github.com/joho/godotenv"
)

func SetupTestServer() (*gin.Engine, *gorm.DB, *config.SConfig) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Load .env from root backend directory
	_ = godotenv.Load("../../.env")

	// 1. Load Config
	cfg := config.LoadConfig()

	// We use the real DB (development dbConn) since this is an E2E test.
	// In the future, this can be switched to a SQLite in-memory instance for isolation.
	dbConn := database.InitDB(cfg)

	// 2. Init Redis
	database.InitRedis(cfg)

	// 3. Initialize Gin
	engine := gin.Default()

	// Rate Limiter
	limiter := middleware.NewIPBasedLimiter(rate.Limit(100), 200) // Higher limit for tests
	engine.Use(limiter.RateLimitMiddleware())

	// Timeout
	engine.Use(middleware.TimeoutMiddleware(60 * time.Second))

	// 4. Setup Routes using the app router
	// (handlers and services are now organized by features domain)
	routes.SetupRoutes(routes.SRouterConfig{
		Engine:  engine,
		SConfig: cfg,
	})

	return engine, dbConn, cfg
}

func ExecuteRequest(req *http.Request, engine *gin.Engine) *httptest.ResponseRecorder {
	rr := httptest.NewRecorder()
	engine.ServeHTTP(rr, req)
	return rr
}