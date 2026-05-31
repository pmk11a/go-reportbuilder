package main

import (
	"flag"
	"log"

	"github.com/masza1/dapen-backend/internal/config"
	"github.com/masza1/dapen-backend/internal/db"
	"github.com/masza1/dapen-backend/internal/db/seeders"
	"github.com/masza1/dapen-backend/internal/server"

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
		seeders.SeedDatabase(database)
	}

	// 5. Initialize Server (DI & Routing)
	engine := server.NewServer(database, cfg)

	// 10. Start server
	log.Printf("Starting server on port 8080...")
	if err := engine.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
