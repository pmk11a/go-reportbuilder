package middleware

import (
	"errors"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
	"gorm.io/gorm"
)

// FieldPermission is the set of granular permission columns we check on
// dbflmenu. We use a typed enum (rather than a free string) so a typo in
// a route registration is a compile error.
type FieldPermission string

const (
	// PermHasAccess is the read flag.
	PermHasAccess FieldPermission = "HASACCESS"
	// PermIsTambah is the create flag.
	PermIsTambah FieldPermission = "ISTAMBAH"
	// PermIsKoreksi is the update flag.
	PermIsKoreksi FieldPermission = "ISKOREKSI"
	// PermIsHapus is the delete flag.
	PermIsHapus FieldPermission = "ISHAPUS"
	// PermIsCetak is the print/PDF flag.
	PermIsCetak FieldPermission = "ISCETAK"
	// PermIsExport is the export flag (xlsx, csv, ...).
	PermIsExport FieldPermission = "ISEXPORT"
	// PermIsOtorisasi1 is the level-1 approval flag.
	PermIsOtorisasi1 FieldPermission = "IsOtorisasi1"
	// PermIsOtorisasi2 is the level-2 approval flag.
	PermIsOtorisasi2 FieldPermission = "IsOtorisasi2"
	// PermIsBatal is the cancel-approval flag.
	PermIsBatal FieldPermission = "IsBatal"
)

// validFields is the allow-list used by RequireMenuAccess to validate the
// `field` argument at request time. Centralising it keeps a typo from
// silently passing the middleware.
var validFields = map[FieldPermission]bool{
	PermHasAccess: true, PermIsTambah: true, PermIsKoreksi: true,
	PermIsHapus: true, PermIsCetak: true, PermIsExport: true,
	PermIsOtorisasi1: true, PermIsOtorisasi2: true, PermIsBatal: true,
}

// PermissionMiddleware is the runtime-checker for menu-level granular
// permissions. It holds a *gorm.DB so the same instance can be reused
// across many routes. Construct one at composition root and pass it
// to RegisterKasBankRoutes (or any other domain's RegisterRoutes).
type PermissionMiddleware struct {
	db *gorm.DB
}

// NewPermissionMiddleware constructs the permission middleware backed by
// the given GORM connection. The DB is used to query dbflmenu for the
// caller's granular permission flags.
func NewPermissionMiddleware(db *gorm.DB) *PermissionMiddleware {
	return &PermissionMiddleware{db: db}
}

// RequireMenuAccess returns a gin.HandlerFunc that allows the request
// through only if the calling user has the given permission column set
// to 1 in dbflmenu for the given menu code.
//
// menuCode is the DBMENU.KODEMENU value (e.g. "02001" for Accounting >
// Kas Bank). field is one of the Perm* constants; any other string is
// rejected at request time as a misconfiguration.
//
// Behaviour:
//   - UserID missing from context → 401 Unauthorized.
//   - No dbflmenu row for (USERID, L1=menuCode) → 403 Forbidden.
//   - Permission column = 0 → 403 Forbidden.
//   - Permission column = 1 → c.Next().
//   - DB query fails → 500 Internal Error.
//
// We do NOT cache the lookup in-process: the user may have their
// permissions changed mid-session and the cost of one indexed lookup
// on a small table is negligible. If the table grows large, swap this
// for a Redis-backed cache keyed by "perm:{userID}:{menuCode}:{field}".
func (m *PermissionMiddleware) RequireMenuAccess(menuCode string, field FieldPermission) gin.HandlerFunc {
	if !validFields[field] {
		// Misconfiguration: fail closed. Returning 500 makes the bug visible
		// during route registration smoke-tests.
		return func(c *gin.Context) {
			response.InternalErrorWithMap(c,
				fmt.Sprintf("permission middleware: unknown field %q for menu %q", field, menuCode),
				response.SErrorMap{
					Code:      "PERMISSION_MISCONFIGURED",
					ErrorName: "Konfigurasi Permission Tidak Valid",
					Reason:    fmt.Sprintf("Field permission %q bukan field yang dikenali untuk menu %q.", field, menuCode),
					Action:    "Hubungi developer untuk memperbaiki konfigurasi route permission.",
				},
			)
			c.Abort()
		}
	}

	return func(c *gin.Context) {
		userID, ok := getUserIDFromContext(c)
		if !ok || userID == "" {
			response.UnauthorizedWithMap(c,
				"User identity is not available in request context",
				response.SErrorMap{
					Code:      "AUTH_USER_MISSING",
					ErrorName: "Identitas User Tidak Ditemukan",
					Reason:    "Middleware permission tidak dapat menemukan userID pada konteks request. Session kemungkinan tidak valid atau middleware InjectUserContext belum dijalankan.",
					Action:    "Muat ulang halaman dan login ulang. Jika masalah berlanjut, hubungi administrator.",
				},
			)
			c.Abort()
			return
		}

		// 1. Quick path: missing or misconfigured DB → fail closed.
		if m == nil || m.db == nil {
			response.InternalErrorWithMap(c,
				"permission middleware: database is not configured",
				response.SErrorMap{
					Code:      "PERMISSION_DB_NOT_CONFIGURED",
					ErrorName: "Database Permission Belum Dikonfigurasi",
					Reason:    "Middleware permission menerima request tetapi koneksi database (GORM) belum diinisialisasi saat composition root.",
					Action:    "Hubungi administrator server. Ini adalah kesalahan konfigurasi backend, bukan kesalahan user.",
				},
			)
			c.Abort()
			return
		}

		// 2. Read the granular flag. We do not need the full join with
		// DBMENU; dbflmenu.L1 alone is enough to identify the menu row.
		var hasFlag int
		sql := fmt.Sprintf(
			"SELECT CASE WHEN [%s] = 1 THEN 1 ELSE 0 END FROM dbflmenu WHERE USERID = ? AND L1 = ?",
			field,
		)
		err := m.db.WithContext(c.Request.Context()).Raw(sql, userID, menuCode).Scan(&hasFlag).Error
		if err != nil {
			// GORM returns gorm.ErrRecordNotFound when Scan finds zero rows
			// on a single-row query; we treat both as "no permission".
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				response.InternalErrorWithMap(c,
					"permission middleware: failed to query dbflmenu: "+err.Error(),
					response.SErrorMap{
						Code:      "PERMISSION_QUERY_FAILED",
						ErrorName: "Gagal Mengecek Permission",
						Reason:    "Middleware permission gagal menjalankan query ke tabel dbflmenu: " + err.Error(),
						Action:    "Coba lagi dalam beberapa saat. Jika masalah berlanjut, hubungi administrator.",
					},
				)
				c.Abort()
				return
			}
			hasFlag = 0
		}

		if hasFlag != 1 {
			response.ForbiddenWithMap(c,
				"Anda tidak memiliki akses untuk menu ini",
				response.SErrorMap{
					Code:      "PERMISSION_DENIED",
					ErrorName: "Akses Ditolak",
					Reason:    fmt.Sprintf("Anda tidak memiliki izin %q pada menu %q.", permissionDisplayName(field), menuCode),
					Action:    fmt.Sprintf("Hubungi administrator untuk meminta akses %s.", permissionDisplayName(field)),
				},
			)
			c.Abort()
			return
		}

		c.Next()
	}
}

// permissionDisplayName mengembalikan label ramah-pengguna (Indonesia) untuk
// tiap FieldPermission. Dipakai di reason/action agar frontend tidak perlu
// menerjemahkan kode enum teknis menjadi kalimat.
//
// Jika field tidak dikenal (which seharusnya tidak terjadi karena validFields
// sudah divalidasi saat route registration), kembalikan nilai field apa adanya
// sebagai fallback.
func permissionDisplayName(field FieldPermission) string {
	switch field {
	case PermHasAccess:
		return "Akses Lihat"
	case PermIsTambah:
		return "Tambah"
	case PermIsKoreksi:
		return "Koreksi"
	case PermIsHapus:
		return "Hapus"
	case PermIsCetak:
		return "Cetak"
	case PermIsExport:
		return "Export"
	case PermIsOtorisasi1:
		return "Otorisasi Level 1"
	case PermIsOtorisasi2:
		return "Otorisasi Level 2"
	case PermIsBatal:
		return "Batal Otorisasi"
	default:
		return string(field)
	}
}

// getUserIDFromContext extracts the userID populated by InjectUserContext.
// We accept both the typed key (UserIDContextKey) and the string key
// "userID" so the middleware works with either legacy or new callers.
func getUserIDFromContext(c *gin.Context) (string, bool) {
	if v, exists := c.Get(string(UserIDContextKey)); exists {
		if s, ok := v.(string); ok && s != "" {
			return s, true
		}
	}
	// Fallback: read from the request's context (set by InjectUserContext).
	if v := c.Request.Context().Value("userID"); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return s, true
		}
	}
	return "", false
}
