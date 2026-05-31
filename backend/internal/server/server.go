package server

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/config"
	"github.com/masza1/dapen-backend/internal/handlers"
	"github.com/masza1/dapen-backend/internal/middleware"
	"github.com/masza1/dapen-backend/internal/repositories"
	"github.com/masza1/dapen-backend/internal/routes"
	"github.com/masza1/dapen-backend/internal/services"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
)

// NewServer initializes all dependencies, middlewares, and routes, returning a configured Gin engine
func NewServer(database *gorm.DB, cfg *config.SConfig) *gin.Engine {
	// 1. Initialize Layers (Dependency Injection)
	userRepo := repositories.NewUserRepository(database)
	filterRepo := repositories.NewFilterRepository(database)
	menuRepo := repositories.NewMenuRepository(database)
	activityLogRepo := repositories.NewActivityLogRepository(database)
	periodeRepo := repositories.NewPeriodeRepository(database)

	authService := services.NewAuthService(userRepo, cfg)
	filterService := services.NewFilterService(filterRepo)
	menuService := services.NewMenuService(menuRepo)
	activityLogService := services.NewActivityLogService(activityLogRepo)
	periodeService := services.NewPeriodeService(periodeRepo)

	authHandler := handlers.NewAuthHandler(authService)
	dashboardHandler := handlers.NewDashboardHandler(database)
	filterHandler := handlers.NewFilterHandler(filterService)
	menuHandler := handlers.NewMenuHandler(menuService)
	activityLogHandler := handlers.NewActivityLogHandler(activityLogService)
	periodeHandler := handlers.NewPeriodeHandler(periodeService)

	// 2. Initialize Gin router
	engine := gin.Default()

	// 3. Security Configurations
	engine.SetTrustedProxies(nil)

	// 4. Middlewares
	engine.Use(gin.Recovery())
	engine.Use(gin.Logger())

	// Apply Global Security Middlewares
	// Rate Limit: 10 req/sec per IP with burst of 20
	// Using Industry Standard Token Bucket (golang.org/x/time/rate)
	limiter := middleware.NewIPBasedLimiter(rate.Limit(10), 20)
	engine.Use(limiter.RateLimitMiddleware())

	// Timeout: 60 seconds (Wait for backend logic)
	engine.Use(middleware.TimeoutMiddleware(60 * time.Second))

	// 5. Setup Routes
	routes.SetupRoutes(routes.SRouterConfig{
		Engine:              engine,
		SAuthHandler:        authHandler,
		SDashboardHandler:   dashboardHandler,
		SFilterHandler:      filterHandler,
		SMenuHandler:        menuHandler,
		SActivityLogHandler: activityLogHandler,
		SPeriodeHandler:     periodeHandler,
		SConfig:             cfg,
		DB:                  database,
	})

	return engine
}
