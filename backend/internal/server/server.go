package server

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/shared/config"
	"github.com/masza1/dapen-backend/internal/shared/database"
	"github.com/masza1/dapen-backend/internal/shared/middleware"
	"github.com/masza1/dapen-backend/internal/handlers"
	"github.com/masza1/dapen-backend/internal/identity/permission"
	"github.com/masza1/dapen-backend/internal/identity/user"
	"github.com/masza1/dapen-backend/internal/repositories"
	"github.com/masza1/dapen-backend/internal/routes"
	"github.com/masza1/dapen-backend/internal/services"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
)

// NewServer initializes all dependencies, middlewares, and routes, returning a configured Gin engine
func NewServer(dbConn *gorm.DB, cfg *config.SConfig) *gin.Engine {
	// 1. Initialize Layers (Dependency Injection)
	userRepo := repositories.NewUserRepository(dbConn)
	filterRepo := repositories.NewFilterRepository(dbConn)
	menuRepo := repositories.NewMenuRepository(dbConn)
	activityLogRepo := repositories.NewActivityLogRepository(dbConn)
	periodeRepo := repositories.NewPeriodeRepository(dbConn)

	authService := services.NewAuthService(userRepo, cfg)
	filterService := services.NewFilterService(filterRepo)
	menuService := services.NewMenuService(menuRepo)
	activityLogService := services.NewActivityLogService(activityLogRepo)
	periodeService := services.NewPeriodeService(periodeRepo)
	userService := user.NewUserService(userRepo)
	permissionRepo := permission.NewPermissionRepository(dbConn)
	permissionService := permission.NewPermissionService(permissionRepo)

	authHandler := handlers.NewAuthHandler(authService)
	dashboardHandler := handlers.NewDashboardHandler(dbConn)
	filterHandler := handlers.NewFilterHandler(filterService)
	menuHandler := handlers.NewMenuHandler(menuService)
	activityLogHandler := handlers.NewActivityLogHandler(activityLogService)
	periodeHandler := handlers.NewPeriodeHandler(periodeService)
	settingHandler := handlers.NewSettingHandler(dbConn)
	userHandler := user.NewUserHandler(userRepo, userService)
	permissionHandler := permission.NewPermissionHandler(permissionRepo, permissionService)

	// 2. Initialize Gin router
	engine := gin.Default()

	// 3. Security Configurations
	engine.SetTrustedProxies(nil)

	// 4. Middlewares
	engine.Use(gin.Recovery())
	engine.Use(gin.Logger())

	// Apply Global Security Middlewares
	// Rate Limit: 10 req/sec per IP with burst of 20
	// Using GetRateLimiter factory to dynamically load in-memory or Redis limiter (TASK-007)
	limiter := middleware.GetRateLimiter(database.RedisClient, rate.Limit(10), 20)
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
		SSettingHandler:     settingHandler,
		SUserHandler:        userHandler,
		SPermissionHandler:  permissionHandler,
		SConfig:             cfg,
		DB:                  dbConn,
	})

	return engine
}
