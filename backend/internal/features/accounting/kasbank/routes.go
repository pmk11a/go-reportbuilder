// Package kasbank — route registration for Accounting > Kas Bank.
//
// All routes live under /api/accounting/kasbank. Each endpoint is gated
// by RequireMenuAccess("02001", <field>) so the frontend can rely on a
// 403 Forbidden to detect "no permission" without separate client logic.
//
// The permission middleware expects InjectUserContext to have run
// upstream (it reads userID from the Gin context). The composition root
// is responsible for ordering — see internal/app/app.go.
package kasbank

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/middleware"
)

// kasBankMenuCode is the DBMENU.KODEMENU value for Accounting > Kas Bank.
// Centralised so a future menu re-numbering only touches this file.
const kasBankMenuCode = "02001"

// RegisterKasBankRoutes attaches all kasbank routes to the given router
// group. The caller decides the parent path (typically "/api/accounting").
// permMW is required — without it every call would 500.
func RegisterKasBankRoutes(rg *gin.RouterGroup, h *SKasBankHandler, permMW *middleware.PermissionMiddleware) {
	g := rg.Group("/kasbank")
	{
		// Read endpoints — gated by HASACCESS.
		g.GET("", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermHasAccess), h.ListKasBank)
		g.GET("/generate-no-bukti", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermHasAccess), h.GenerateNoBukti)
		g.GET("/lookup-perkiraan", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermHasAccess), h.LookupPerkiraan)
		g.GET("/:noBukti", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermHasAccess), h.GetKasBank)
		g.GET("/:noBukti/detail", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermHasAccess), h.ListKasBankDetail)
		g.GET("/:noBukti/detail/:urut", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermHasAccess), h.GetKasBankDetail)
		g.GET("/:noBukti/pdf", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsCetak), h.DownloadPDF)

		// Create — gated by ISTAMBAH.
		g.POST("", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsTambah), h.CreateKasBank)
		g.POST("/:noBukti/detail", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsTambah), h.AddKasBankDetail)

		// Update — gated by ISKOREKSI.
		g.PUT("/:noBukti", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsKoreksi), h.UpdateKasBank)
		g.PUT("/:noBukti/detail/:urut", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsKoreksi), h.UpdateKasBankDetail)

		// Delete — gated by ISHAPUS.
		g.DELETE("/:noBukti", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsHapus), h.DeleteKasBank)
		g.DELETE("/:noBukti/detail/:urut", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsHapus), h.DeleteKasBankDetail)

		// Otorisasi — gated by IsOtorisasi1 / IsOtorisasi2.
		// We mount the SAME handler on two routes with different middleware
		// so the user can call /otorisasi with the right level without
		// knowing the permission name in advance. The handler reads the
		// level from the request body.
		g.POST("/:noBukti/otorisasi", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsOtorisasi1), h.SetOtorisasiKasBank)
		g.POST("/:noBukti/batal-otorisasi", permMW.RequireMenuAccess(kasBankMenuCode, middleware.PermIsBatal), h.BatalOtorisasiKasBank)
	}
}
