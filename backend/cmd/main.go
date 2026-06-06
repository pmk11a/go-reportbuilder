package main

import (
	"flag"
	"log"

	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"github.com/masza1/dapen-backend/internal/infrastructure/database"
	"github.com/masza1/dapen-backend/internal/infrastructure/database/seeders"
	"github.com/masza1/dapen-backend/internal/infrastructure/logger"
	"github.com/masza1/dapen-backend/internal/app"

	_ "github.com/masza1/dapen-backend/docs"
)

// @title DAPEN System API
// @version 1.0
// @description Backend API for DAPEN management of employee retirement funds
// @host localhost:8080
// @BasePath /api

func main() {
	// 0. Parse CLI Flags
	runMigrate := flag.Bool("migrate", false, "Run database migrations")
	runSeed := flag.Bool("seed", false, "Run database seeds")
	flag.Parse()

	// 0.5 Initialize Logger
	if err := logger.InitLogger(); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Close()

	// 1. Load SConfig
	cfg := config.LoadConfig()

	// 2. Initialize Database Connection
	dbConn := database.InitDB(cfg)

	// 3. Initialize Redis Connection (for BFF session storage)
	database.InitRedis(cfg)

	// 4. Conditional DB Operations
	if *runMigrate {
		database.RunMigrations(dbConn)
	}

	if *runSeed {
		seeders.SeedDatabase(dbConn)
	}

	// 5. Initialize Server (DI & Routing)
	engine := app.NewApp(dbConn, cfg)

	// 10. Start server
	log.Printf("Starting server on port 8080...")
	if err := engine.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
