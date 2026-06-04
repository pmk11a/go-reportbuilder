package e2e

import (
	"net/http"
	"net/http/httptest"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/shared/config"
	"github.com/masza1/dapen-backend/internal/shared/database"
	"github.com/masza1/dapen-backend/internal/handlers"
	"github.com/masza1/dapen-backend/internal/shared/middleware"
	"github.com/masza1/dapen-backend/internal/repositories"
	"github.com/masza1/dapen-backend/internal/routes"
	"github.com/masza1/dapen-backend/internal/services"
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

	// 3. Initialize Repositories
	userRepo := repositories.NewUserRepository(dbConn)
	filterRepo := repositories.NewFilterRepository(dbConn)
	menuRepo := repositories.NewMenuRepository(dbConn)
	activityLogRepo := repositories.NewActivityLogRepository(dbConn)
	periodeRepo := repositories.NewPeriodeRepository(dbConn)

	// 4. Initialize Services
	authService := services.NewAuthService(userRepo, cfg)
	filterService := services.NewFilterService(filterRepo)
	menuService := services.NewMenuService(menuRepo)
	activityLogService := services.NewActivityLogService(activityLogRepo)
	periodeService := services.NewPeriodeService(periodeRepo)

	// 5. Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService)
	dashboardHandler := handlers.NewDashboardHandler(dbConn)
	filterHandler := handlers.NewFilterHandler(filterService)
	menuHandler := handlers.NewMenuHandler(menuService)
	activityLogHandler := handlers.NewActivityLogHandler(activityLogService)
	periodeHandler := handlers.NewPeriodeHandler(periodeService)

	// 6. Initialize Gin
	engine := gin.Default()

	// Rate Limiter
	limiter := middleware.NewIPBasedLimiter(rate.Limit(100), 200) // Higher limit for tests
	engine.Use(limiter.RateLimitMiddleware())

	// Timeout
	engine.Use(middleware.TimeoutMiddleware(60 * time.Second))

	// 7. Setup Routes
	routes.SetupRoutes(routes.SRouterConfig{
		Engine:              engine,
		SAuthHandler:        authHandler,
		SDashboardHandler:   dashboardHandler,
		SFilterHandler:      filterHandler,
		SMenuHandler:        menuHandler,
		SActivityLogHandler: activityLogHandler,
		SPeriodeHandler:     periodeHandler,
		SConfig:             cfg,
		DB:                  dbConn,
	})

	return engine, dbConn, cfg
}

func ExecuteRequest(req *http.Request, engine *gin.Engine) *httptest.ResponseRecorder {
	rr := httptest.NewRecorder()
	engine.ServeHTTP(rr, req)
	return rr
}