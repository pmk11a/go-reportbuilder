package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/features/accounting/kasbank"
	"github.com/masza1/dapen-backend/internal/features/accounting/periode"
	"github.com/masza1/dapen-backend/internal/features/activity"
	"github.com/masza1/dapen-backend/internal/features/browse"
	"github.com/masza1/dapen-backend/internal/features/dashboard"
	"github.com/masza1/dapen-backend/internal/features/filters"
	"github.com/masza1/dapen-backend/internal/legacy/handlers"
	"github.com/masza1/dapen-backend/internal/features/identity/auth"
	"github.com/masza1/dapen-backend/internal/features/identity/permission"
	"github.com/masza1/dapen-backend/internal/features/identity/user"
	"github.com/masza1/dapen-backend/internal/features/menu"
	"github.com/masza1/dapen-backend/internal/features/session"
	"github.com/masza1/dapen-backend/internal/features/settings"
	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	authpkg "github.com/masza1/dapen-backend/internal/infrastructure/auth"
	"github.com/masza1/dapen-backend/internal/infrastructure/middleware"
)

// SRouterConfig bundles every domain's handler so the routes setup can
// wire them all in one place. Each domain owns its own RegisterRoutes
// function — the routes file is just a composition root.
type SRouterConfig struct {
	Engine              *gin.Engine
	SAuthHandler        *auth.SAuthHandler
	SDashboardHandler   *dashboard.SDashboardHandler
	SFilterHandler      *filters.SFilterHandler
	SMenuHandler        *menu.SMenuHandler
	SActivityLogHandler *activity.SActivityLogHandler
	SPeriodeHandler     *handlers.SPeriodeHandler
	SSettingHandler     *handlers.SSettingHandler
	SSettingsHandler    *settings.SSettingHandler
	SUserHandler        *user.SUserHandler
	SPermissionHandler  *permission.SPermissionHandler
	SSessionHandler     *session.SSessionHandler
	SKasBankHandler     *kasbank.SKasBankHandler
	SKasBankPermMW      *middleware.PermissionMiddleware
	SBrowseHandler      *browse.Handler
	SConfig             *config.SConfig
}

// SetupRoutes wires every domain's routes into the given engine. The structure is:
//   - Public: /health, /swagger, /api/auth/*
//   - Protected: anything behind AuthMiddleware
//   - Admin: anything additionally behind RoleMiddleware("admin", "pengurus", "system_admin")
func SetupRoutes(rc SRouterConfig) {
	// Root-level diagnostics & docs
	rc.Engine.GET("/health", func(c *gin.Context) {
		response.Success(c, "DAPEN Backend is running", gin.H{"status": "ok"})
	})
	rc.Engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := rc.Engine.Group("/api")
	{
		// Public auth routes
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", rc.SAuthHandler.Login)
			authGroup.POST("/refresh", rc.SAuthHandler.RefreshToken)
		}

		// Protected routes (any authenticated user)
		protected := api.Group("/")
		protected.Use(authpkg.AuthMiddleware(rc.SConfig))
		protected.Use(middleware.InjectUserContext()) // Must be AFTER AuthMiddleware
		{
			protected.POST("/auth/change-password", rc.SAuthHandler.ChangePassword)
			protected.GET("/me", rc.SAuthHandler.GetMe)

			// Dashboard reads (sidebar + stats)
			protected.GET("/menus/sidebar", rc.SDashboardHandler.GetSidebarMenu)
			protected.GET("/dashboard/stats", rc.SDashboardHandler.GetStats)
			protected.GET("/dashboard/pensiunan-without-files", rc.SDashboardHandler.GetPensiunanWithoutFiles)

			// Berkas / periode (accounting/periode — owns the business logic eventually)
			periode.RegisterRoutes(protected, rc.SPeriodeHandler)

			// Shared filter widgets (per-domain registration)
			filters.RegisterRoutes(protected, rc.SFilterHandler)

			// Admin-only routes
			admin := protected.Group("/admin")
			// Role set kept in parity with frontend isAdmin() (frontend/src/shared/auth/auth.ts):
			// TINGKAT "1" (pengurus) and "5" (system_admin) are admin-equivalent for /admin/* access.
			admin.Use(authpkg.RoleMiddleware("admin", "pengurus", "system_admin"))
			{
				admin.GET("/stats", func(c *gin.Context) {
					response.Success(c, "Admin stats - Authorized", nil)
				})

				// Per-domain route registration — each domain owns its path space.
				// authMW is passed so domains can apply it to their nested groups
				// (the admin group is already protected by AuthMiddleware + RoleMiddleware).
				menu.RegisterRoutes(admin, rc.SMenuHandler)
				activity.RegisterRoutes(admin, rc.SActivityLogHandler)
				user.RegisterRoutes(admin, rc.SUserHandler, nil)
				permission.RegisterRoutes(admin, rc.SPermissionHandler, nil)
				session.RegisterRoutes(admin, rc.SSessionHandler)
				settings.RegisterRoutes(admin, rc.SSettingHandler, rc.SSettingsHandler)
			}

			// Accounting domain routes (kasbank is mounted under /api/accounting).
			// They live outside the /admin group because the legacy schema treats
			// accounting voucher posting as a regular authenticated activity
			// gated by the granular menu permission (02001), not by the
			// "admin" role alone.
			accounting := protected.Group("/accounting")
			{
				if rc.SKasBankHandler != nil && rc.SKasBankPermMW != nil {
					kasbank.RegisterKasBankRoutes(accounting, rc.SKasBankHandler, rc.SKasBankPermMW)
				}
			}

			// Browse domain (mounted at /api/browse). Browse is a
			// cross-cutting lookup facility used by every feature (e.g.
			// kasbank's /lookup-perkiraan). It lives outside /admin and
			// outside /accounting because it is not feature-specific.
			// Authentication is required (already enforced by protected
			// group); per-use-case permission gating is applied by the
			// calling endpoint (e.g. /lookup-perkiraan gates by 02001).
			if rc.SBrowseHandler != nil {
				browse.RegisterBrowseRoutes(protected, rc.SBrowseHandler)
			}
		}
	}
}
