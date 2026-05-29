package main

import (
	"flag"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/config"
	"github.com/masza1/dapen-backend/internal/db"
	"github.com/masza1/dapen-backend/internal/handlers"
	"github.com/masza1/dapen-backend/internal/handlers/berkas"
	"github.com/masza1/dapen-backend/internal/middleware"
	"github.com/masza1/dapen-backend/internal/repositories"
	"github.com/masza1/dapen-backend/internal/routes"
	"github.com/masza1/dapen-backend/internal/services"
	"golang.org/x/time/rate"
)

func main() {
	// 0. Parse CLI Flags
	runMigrate := flag.Bool("migrate", false, "Run database migrations")
	runSeed := flag.Bool("seed", false, "Run database seeds")
	flag.Parse()

	// 1. Load SConfig
	cfg := config.LoadConfig()

	// 2. Initialize Database Connection
	database := db.InitDB(cfg)

	// 3. Initialize Redis Connection (for BFF session storage)
	db.InitRedis(cfg)

	// 4. Conditional DB Operations
	if *runMigrate {
		db.RunMigrations(database)
	}

	if *runSeed {
		db.SeedDatabase(database)
	}

	// 5. Initialize Layers (Dependency Injection)
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
	periodeHandler := berkas.NewPeriodeHandler(periodeService)

	// 6. Initialize Gin router
	engine := gin.Default()

	// 7. Security Configurations
	engine.SetTrustedProxies(nil)

	// 8. Middlewares
	engine.Use(gin.Recovery())
	engine.Use(gin.Logger())

	// Apply Global Security Middlewares
	// Rate Limit: 10 req/sec per IP with burst of 20
	// Using Industry Standard Token Bucket (golang.org/x/time/rate)
	limiter := middleware.NewIPBasedLimiter(rate.Limit(10), 20)
	engine.Use(limiter.RateLimitMiddleware())

	// Timeout: 60 seconds (Wait for backend logic)
	engine.Use(middleware.TimeoutMiddleware(60 * time.Second))

	// 9. Setup Routes
	routes.SetupRoutes(routes.SRouterConfig{
		Engine:           engine,
		SAuthHandler:      authHandler,
		SDashboardHandler: dashboardHandler,
		SFilterHandler:    filterHandler,
		SMenuHandler:        menuHandler,
		SActivityLogHandler: activityLogHandler,
		SPeriodeHandler:     periodeHandler,
		SConfig:             cfg,
		DB:               database,
	})

	// 10. Start server
	log.Printf("Starting server on port 8080...")
	if err := engine.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
