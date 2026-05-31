package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/config"
	"github.com/masza1/dapen-backend/internal/handlers"
	"github.com/masza1/dapen-backend/internal/middleware"
	"github.com/masza1/dapen-backend/internal/utils"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

type SRouterConfig struct {
	Engine           *gin.Engine
	SAuthHandler      *handlers.SAuthHandler
	SDashboardHandler    *handlers.SDashboardHandler
	SFilterHandler       *handlers.SFilterHandler
	SMenuHandler         *handlers.SMenuHandler
	SActivityLogHandler  *handlers.SActivityLogHandler
	SPeriodeHandler      *handlers.SPeriodeHandler
	SConfig              *config.SConfig
	DB                  *gorm.DB
}

func SetupRoutes(rc SRouterConfig) {
	// Root routes
	rc.Engine.GET("/health", func(c *gin.Context) {
		utils.Success(c, "DAPEN Backend is running", gin.H{"status": "ok"})
	})

	// Swagger route
	rc.Engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := rc.Engine.Group("/api")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", rc.SAuthHandler.Login)
			auth.POST("/refresh", rc.SAuthHandler.RefreshToken)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(rc.SConfig))
		{
			protected.POST("/auth/change-password", rc.SAuthHandler.ChangePassword)
			protected.GET("/menus/sidebar", rc.SDashboardHandler.GetSidebarMenu)
			protected.GET("/dashboard/stats", rc.SDashboardHandler.GetStats)
			protected.GET("/dashboard/pensiunan-without-files", rc.SDashboardHandler.GetPensiunanWithoutFiles)
			
			// Berkas / Shared Routes
			protected.GET("/berkas/get-periode", rc.SPeriodeHandler.GetPeriode)
			protected.PUT("/berkas/set-periode", rc.SPeriodeHandler.SetPeriode)

			setupProtectedRoutes(protected, rc)
		}
	}
}

func setupProtectedRoutes(rg *gin.RouterGroup, rc SRouterConfig) {
	// Admin only routes
	admin := rg.Group("/admin")
	admin.Use(middleware.RoleMiddleware("admin"))
	{
		admin.GET("/stats", func(c *gin.Context) {
			utils.Success(c, "Admin stats - Authorized", nil)
		})
		
		// Menu CRUD
		admin.GET("/menu", rc.SMenuHandler.GetAllMenus)
		admin.GET("/menu/parents", rc.SMenuHandler.GetParentMenus)
		admin.GET("/menu/:kode", rc.SMenuHandler.GetMenuByID)
		admin.POST("/menu", rc.SMenuHandler.CreateMenu)
		admin.PUT("/menu/:kode", rc.SMenuHandler.UpdateMenu)
		admin.DELETE("/menu/:kode", rc.SMenuHandler.DeleteMenu)

		// Activity Logs
		admin.GET("/activity-logs", rc.SActivityLogHandler.GetLogs)
		admin.GET("/activity-logs/configs", rc.SActivityLogHandler.GetConfigs)
		admin.GET("/activity-logs/configs/:table_name", rc.SActivityLogHandler.GetConfigByTableName)
		admin.POST("/activity-logs/configs", rc.SActivityLogHandler.SaveConfig)
		admin.GET("/database/tables", rc.SActivityLogHandler.GetTables)
		admin.GET("/database/tables/:table_name/columns", rc.SActivityLogHandler.GetTableColumns)
	}

	// Filter / Shared API routes
	rg.GET("/customers", rc.SFilterHandler.GetCustomers)
	rg.GET("/perkiraan", rc.SFilterHandler.GetPerkiraan)
	rg.GET("/perkiraan/kelompok-kas", rc.SFilterHandler.GetKelompokKas)

	// Employee/General routes
	rg.GET("/me", rc.SAuthHandler.GetMe)
}
