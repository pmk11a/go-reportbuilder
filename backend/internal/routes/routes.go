package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/shared/config"
	"github.com/masza1/dapen-backend/internal/handlers"
	"github.com/masza1/dapen-backend/internal/identity/permission"
	"github.com/masza1/dapen-backend/internal/identity/user"
	authpkg "github.com/masza1/dapen-backend/internal/shared/auth"
	"github.com/masza1/dapen-backend/internal/shared/response"
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
	SSettingHandler      *handlers.SSettingHandler
	SPermissionHandler  *permission.SPermissionHandler
	SUserHandler         *user.SUserHandler
	SConfig              *config.SConfig
	DB                  *gorm.DB
}

func SetupRoutes(rc SRouterConfig) {
	// Root routes
	rc.Engine.GET("/health", func(c *gin.Context) {
		response.Success(c, "DAPEN Backend is running", gin.H{"status": "ok"})
	})

	// Swagger route
	rc.Engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := rc.Engine.Group("/api")
	{
		// Public routes
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", rc.SAuthHandler.Login)
			authGroup.POST("/refresh", rc.SAuthHandler.RefreshToken)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(authpkg.AuthMiddleware(rc.SConfig))
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
	admin.Use(authpkg.RoleMiddleware("admin"))
	{
		admin.GET("/stats", func(c *gin.Context) {
			response.Success(c, "Admin stats - Authorized", nil)
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

		// Settings
		admin.GET("/settings/company", rc.SSettingHandler.GetCompany)
		admin.PUT("/settings/company", rc.SSettingHandler.UpdateCompany)
		admin.GET("/settings/numbers", rc.SSettingHandler.GetNumbers)
		admin.PUT("/settings/numbers", rc.SSettingHandler.UpdateNumbers)

		// User Management CRUD (TASK-004)
		admin.GET("/users", rc.SUserHandler.GetUsers)
		admin.POST("/users", rc.SUserHandler.CreateUser)
		admin.PUT("/users/:id", rc.SUserHandler.UpdateUser)
		admin.DELETE("/users/:id", rc.SUserHandler.DeleteUser)
		admin.GET("/users/:id/permissions", rc.SPermissionHandler.GetUserPermissions)
		admin.PUT("/users/:id/permissions", rc.SPermissionHandler.UpdateUserPermissions)

		// Per-tab permission endpoints (TASK-009) — enable per-tab caching
		// on the frontend dialog by exposing the three permission tables
		// as independent GET endpoints.
		admin.GET("/users/:id/permissions/menu", rc.SPermissionHandler.GetUserMenuPermissions)
		admin.GET("/users/:id/permissions/report", rc.SPermissionHandler.GetUserReportPermissions)
		admin.GET("/users/:id/permissions/coa", rc.SPermissionHandler.GetUserCoaAccess)

		// Permission Report (TASK-009) — supports JSON, xlsx, and pdf outputs
		admin.GET("/reports/permissions", rc.SPermissionHandler.GetPermissionReport)
	}

	// Filter / Shared API routes
	rg.GET("/customers", rc.SFilterHandler.GetCustomers)
	rg.GET("/perkiraan", rc.SFilterHandler.GetPerkiraan)
	rg.GET("/perkiraan/kelompok-kas", rc.SFilterHandler.GetKelompokKas)

	// Employee/General routes
	rg.GET("/me", rc.SAuthHandler.GetMe)
}
