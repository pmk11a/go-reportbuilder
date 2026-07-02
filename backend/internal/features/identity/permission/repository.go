package permission

import (
	"gorm.io/gorm"

	"github.com/masza1/dapen-backend/internal/shared/pagination"
)

// IPermissionRepository defines the persistence contract for user
// permissions. Per the Domain-Based + DDD-Lite architecture, only the
// identity/permission domain depends on this interface; no other domain
// is allowed to call into dbflmenu / DBFLMENUREPORT / DBAKSESPERKIRAAN
// directly.
type IPermissionRepository interface {
	GetUserPermissions(userID string) ([]SUserPermission, []SUserPermission, []SUserCoaAccess, error)
	GetUserMenuPermissions(userID string) ([]SUserPermission, error)
	GetUserReportPermissions(userID string) ([]SUserPermission, error)
	GetUserCoaAccess(userID string) ([]SUserCoaAccess, error)
	GetPermissionReportMatrix(userID, menuCode, menuType string, page, pageSize int) ([]SPermissionReportRow, int64, error)
	UpdateUserPermissions(userID string, menuPerms []SUserPermission, reportPerms []SUserPermission, coaPerms []SUserCoaAccess) error
}

type permissionRepository struct {
	db *gorm.DB
}

// NewPermissionRepository constructs the concrete permission repository.
func NewPermissionRepository(db *gorm.DB) IPermissionRepository {
	return &permissionRepository{db: db}
}

// GetUserPermissions fetches menu permissions, report permissions, and COA access for a user.
//
// Schema note (TASK-009 fix): the per-user permission data lives in `dbflmenu` and
// `DBFLMENUREPORT`, not in the master `DBMENU` / `DBMENUREPORT` tables. The master
// tables hold menu metadata only (KODEMENU, Keterangan, L0, Icon, Routename, ...);
// the per-user tables hold USERID + boolean permission columns. We LEFT JOIN the
// per-user table to the master to get one row per (user, menu). Columns that do not
// exist in the production schema (checked, aktif, ACCESS, IsOtorisasi1..5, IsBatal)
// are emitted as 0.
func (r *permissionRepository) GetUserPermissions(userID string) ([]SUserPermission, []SUserPermission, []SUserCoaAccess, error) {
	var menuPerms []SUserPermission
	var reportPerms []SUserPermission
	var coaAccess []SUserCoaAccess

	// 1. Menu permissions: dbflmenu (per-user) LEFT JOIN DBMENU (master) on L1 = KODEMENU.
	// L1/L2/L3 of the SUserPermission model are not selected; GORM Scan leaves them
	// at their zero value, which is what we want.
	err := r.db.Raw(`
		SELECT p.L1 AS KODEMENU, m.Keterangan, m.L0,
			m.Icon, m.Routename,
			0 AS checked, 0 AS aktif, 0 AS ACCESS,
			CASE WHEN p.HASACCESS  = 1 THEN 1 ELSE 0 END AS HasAccess,
			CASE WHEN p.ISTAMBAH   = 1 THEN 1 ELSE 0 END AS IsCreate,
			CASE WHEN p.ISKOREKSI  = 1 THEN 1 ELSE 0 END AS IsUpdate,
			CASE WHEN p.ISHAPUS    = 1 THEN 1 ELSE 0 END AS IsDelete,
			CASE WHEN p.ISCETAK    = 1 THEN 1 ELSE 0 END AS IsPrint,
			CASE WHEN p.ISEXPORT   = 1 THEN 1 ELSE 0 END AS IsExport,
			0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
			0 AS IsCanceled
		FROM dbflmenu p
		LEFT JOIN DBMENU m ON m.KODEMENU = p.L1
		WHERE p.USERID = ?
		ORDER BY p.L1 ASC`, userID,
	).Scan(&menuPerms).Error
	if err != nil {
		return nil, nil, nil, err
	}

	// 2. Report permissions: DBFLMENUREPORT (per-user) LEFT JOIN DBMENUREPORT (master).
	// DBFLMENUREPORT only has 3 permission columns (Access, IsDesign, Isexport);
	// the menu-only fields (HASACCESS, ISTAMBAH, ISKOREKSI, ISHAPUS, ISCETAK) are
	// emitted as 0.
	err = r.db.Raw(`
		SELECT p.L1 AS KODEMENU, m.Keterangan, m.L0,
			NULL AS Icon, NULL AS Routename,
			0 AS checked, 0 AS aktif, m.ACCESS AS ACCESS,
			CASE WHEN p.Access    = 1 THEN 1 ELSE 0 END AS HasAccess,
			0 AS IsCreate, 0 AS IsUpdate, 0 AS IsDelete, 0 AS IsPrint,
			CASE WHEN p.Isexport  = 1 THEN 1 ELSE 0 END AS IsExport,
			0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
			0 AS IsCanceled
		FROM DBFLMENUREPORT p
		LEFT JOIN DBMENUREPORT m ON m.KODEMENU = p.L1
		WHERE p.UserID = ?
		ORDER BY p.L1 ASC`, userID,
	).Scan(&reportPerms).Error
	if err != nil {
		return nil, nil, nil, err
	}

	// 3. COA access (unchanged): left join DBPERKIRAAN with DBAKSESPERKIRAAN to show
	// all COA and mark which ones the user has access to.
	err = r.db.Raw(
		"SELECT p.Perkiraan, p.Keterangan, CASE WHEN a.UserID IS NOT NULL THEN 1 ELSE 0 END AS checked "+
			"FROM DBPERKIRAAN p "+
			"LEFT JOIN DBAKSESPERKIRAAN a ON a.Perkiraan = p.Perkiraan AND a.UserID = ? "+
			"ORDER BY p.Perkiraan ASC", userID,
	).Scan(&coaAccess).Error
	if err != nil {
		return nil, nil, nil, err
	}

	return menuPerms, reportPerms, coaAccess, nil
}

// GetUserMenuPermissions returns only menu permissions (dbflmenu) for the given user.
// Single-table query so the per-tab cache on the frontend can be refetched
// independently of the report / COA tabs.
func (r *permissionRepository) GetUserMenuPermissions(userID string) ([]SUserPermission, error) {
	var perms []SUserPermission
	err := r.db.Raw(`
		SELECT p.L1 AS KODEMENU, m.Keterangan, m.L0,
			m.Icon, m.Routename,
			0 AS checked, 0 AS aktif, 0 AS ACCESS,
			CASE WHEN p.HASACCESS  = 1 THEN 1 ELSE 0 END AS HasAccess,
			CASE WHEN p.ISTAMBAH   = 1 THEN 1 ELSE 0 END AS IsCreate,
			CASE WHEN p.ISKOREKSI  = 1 THEN 1 ELSE 0 END AS IsUpdate,
			CASE WHEN p.ISHAPUS    = 1 THEN 1 ELSE 0 END AS IsDelete,
			CASE WHEN p.ISCETAK    = 1 THEN 1 ELSE 0 END AS IsPrint,
			CASE WHEN p.ISEXPORT   = 1 THEN 1 ELSE 0 END AS IsExport,
			0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
			0 AS IsCanceled
		FROM dbflmenu p
		LEFT JOIN DBMENU m ON m.KODEMENU = p.L1
		WHERE p.USERID = ?
		ORDER BY p.L1 ASC`, userID,
	).Scan(&perms).Error
	if err != nil {
		return nil, err
	}
	return perms, nil
}

// GetUserReportPermissions returns only report permissions (DBFLMENUREPORT) for the given user.
func (r *permissionRepository) GetUserReportPermissions(userID string) ([]SUserPermission, error) {
	var perms []SUserPermission
	err := r.db.Raw(`
		SELECT p.L1 AS KODEMENU, m.Keterangan, m.L0,
			NULL AS Icon, NULL AS Routename,
			0 AS checked, 0 AS aktif, m.ACCESS AS ACCESS,
			CASE WHEN p.Access    = 1 THEN 1 ELSE 0 END AS HasAccess,
			0 AS IsCreate, 0 AS IsUpdate, 0 AS IsDelete, 0 AS IsPrint,
			CASE WHEN p.Isexport  = 1 THEN 1 ELSE 0 END AS IsExport,
			0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
			0 AS IsCanceled
		FROM DBFLMENUREPORT p
		LEFT JOIN DBMENUREPORT m ON m.KODEMENU = p.L1
		WHERE p.UserID = ?
		ORDER BY p.L1 ASC`, userID,
	).Scan(&perms).Error
	if err != nil {
		return nil, err
	}
	return perms, nil
}

// GetUserCoaAccess returns COA access for the given user (DBAKSESPERKIRAAN).
// Same LEFT JOIN pattern as GetUserPermissions but returns the COA slice only.
func (r *permissionRepository) GetUserCoaAccess(userID string) ([]SUserCoaAccess, error) {
	var coa []SUserCoaAccess
	err := r.db.Raw(
		"SELECT p.Perkiraan, p.Keterangan, CASE WHEN a.UserID IS NOT NULL THEN 1 ELSE 0 END AS checked "+
			"FROM DBPERKIRAAN p "+
			"LEFT JOIN DBAKSESPERKIRAAN a ON a.Perkiraan = p.Perkiraan AND a.UserID = ? "+
			"ORDER BY p.Perkiraan ASC", userID,
	).Scan(&coa).Error
	if err != nil {
		return nil, err
	}
	return coa, nil
}

// GetPermissionReportMatrix returns the full matrix of users x menus x permissions
// for the standalone Permission Report page. menuType selects "menu" (dbflmenu +
// DBMENU) or "report" (DBFLMENUREPORT + DBMENUREPORT). userID and menuCode are
// optional filters. If page or pageSize <= 0 the entire result set is returned
// (used by Excel/PDF export).
//
// Schema note (TASK-009 fix): the per-user permission rows live in `dbflmenu` and
// `DBFLMENUREPORT`, NOT in the master `DBMENU` / `DBMENUREPORT` tables. The query
// joins per-user (p) with master (m) on the menu code. Columns that do not exist
// in the production schema (IsOtorisasi1..5, IsBatal) are emitted as 0.
func (r *permissionRepository) GetPermissionReportMatrix(userID, menuCode, menuType string, page, pageSize int) ([]SPermissionReportRow, int64, error) {
	var (
		permsSelect    string
		masterJoin     string
		userIDCol      string
		menuCodeCol    string
		menuCodeUserCol string
		menuTypeLabel  string
	)
	menuTypeLabel = "menu"
	permsSelect = `CASE WHEN p.HASACCESS  = 1 THEN 1 ELSE 0 END AS HasAccess,
		CASE WHEN p.ISTAMBAH   = 1 THEN 1 ELSE 0 END AS IsCreate,
		CASE WHEN p.ISKOREKSI  = 1 THEN 1 ELSE 0 END AS IsUpdate,
		CASE WHEN p.ISHAPUS    = 1 THEN 1 ELSE 0 END AS IsDelete,
		CASE WHEN p.ISCETAK    = 1 THEN 1 ELSE 0 END AS IsPrint,
		CASE WHEN p.ISEXPORT   = 1 THEN 1 ELSE 0 END AS IsExport`
	masterJoin = "LEFT JOIN DBMENU m ON m.KODEMENU = p.L1"
	userIDCol = "p.USERID"
	menuCodeCol = "p.L1"
	menuCodeUserCol = "p.L1"
	if menuType == "report" {
		menuTypeLabel = "report"
		// DBFLMENUREPORT has only 3 permission columns (Access, IsDesign, Isexport);
		// map Access to HasAccess, Isexport to IsExport, others are 0.
		permsSelect = `CASE WHEN p.Access    = 1 THEN 1 ELSE 0 END AS HasAccess,
			0 AS IsCreate, 0 AS IsUpdate, 0 AS IsDelete, 0 AS IsPrint,
			CASE WHEN p.Isexport  = 1 THEN 1 ELSE 0 END AS IsExport`
		masterJoin = "LEFT JOIN DBMENUREPORT m ON m.KODEMENU = p.L1"
		userIDCol = "p.UserID"
		menuCodeCol = "p.L1"
		menuCodeUserCol = "p.L1"
	}

	// Build the optional WHERE clauses and args.
	where := "WHERE " + userIDCol + " IS NOT NULL AND " + userIDCol + " <> ''"
	args := []interface{}{}
	if userID != "" {
		where += " AND " + userIDCol + " = ?"
		args = append(args, userID)
	}
	if menuCode != "" {
		where += " AND " + menuCodeUserCol + " = ?"
		args = append(args, menuCode)
	}

	// 1. Count total
	var total int64
	permsTable := "dbflmenu"
	if menuType == "report" {
		permsTable = "DBFLMENUREPORT"
	}
	countSQL := "SELECT COUNT(*) FROM " + permsTable + " p " + where
	if err := r.db.Raw(countSQL, args...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	// 2. Fetch the joined matrix. Outer join DBFLPASS so we can display FullName
	// and TINGKAT (role). If no user joined, we still return the row with empty
	// user metadata (shouldn't happen in practice because we filter on USERID).
	var query string
	if page > 0 && pageSize > 0 {
		baseSQL := `
			SELECT ` + userIDCol + ` AS USERID, u.FullName, u.TINGKAT, ` + menuCodeCol + ` AS KODEMENU, m.Keterangan,
				` + permsSelect + `,
				0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
				0 AS IsCanceled
			FROM ` + permsTable + ` p
			` + masterJoin + `
			LEFT JOIN DBFLPASS u ON u.USERID = ` + userIDCol + `
			` + where
		orderBy := userIDCol + " ASC, " + menuCodeCol + " ASC"
		query = pagination.BuildRowNumberQuery(baseSQL, orderBy, page, pageSize)
	} else {
		query = `
			SELECT ` + userIDCol + ` AS USERID, u.FullName, u.TINGKAT, ` + menuCodeCol + ` AS KODEMENU, m.Keterangan,
				` + permsSelect + `,
				0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
				0 AS IsCanceled
			FROM ` + permsTable + ` p
			` + masterJoin + `
			LEFT JOIN DBFLPASS u ON u.USERID = ` + userIDCol + `
			` + where + " ORDER BY " + userIDCol + " ASC, " + menuCodeCol + " ASC"
	}

	type joinedRow struct {
		USERID     string
		FullName   *string
		TINGKAT    *string
		KODEMENU   string
		Keterangan *string
		HasAccess  int
		IsCreate   int
		IsUpdate   int
		IsDelete   int
		IsPrint    int
		IsExport   int
		IsApprove1 int
		IsApprove2 int
		IsApprove3 int
		IsApprove4 int
		IsApprove5 int
		IsCanceled int
	}

	var rows []joinedRow
	if err := r.db.Raw(query, args...).Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	// Map to the public matrix DTO/model
	out := make([]SPermissionReportRow, 0, len(rows))
	for _, r := range rows {
		fullName := ""
		if r.FullName != nil {
			fullName = *r.FullName
		}
		role := ""
		if r.TINGKAT != nil {
			switch *r.TINGKAT {
			case "2":
				role = "admin"
			case "0":
				role = "karyawan"
			default:
				role = *r.TINGKAT
			}
		}
		menuName := ""
		if r.Keterangan != nil {
			menuName = *r.Keterangan
		}
		out = append(out, SPermissionReportRow{
			UserID:      r.USERID,
			Username:    r.USERID,
			FullName:    fullName,
			Role:        role,
			MenuCode:    r.KODEMENU,
			MenuName:    menuName,
			MenuType:    menuTypeLabel,
			HasAccess:   r.HasAccess,
			IsCreate:    r.IsCreate,
			IsUpdate:    r.IsUpdate,
			IsDelete:    r.IsDelete,
			IsPrint:     r.IsPrint,
			IsExport:    r.IsExport,
			IsApprove1:  r.IsApprove1,
			IsApprove2:  r.IsApprove2,
			IsApprove3:  r.IsApprove3,
			IsApprove4:  r.IsApprove4,
			IsApprove5:  r.IsApprove5,
			IsCanceled:  r.IsCanceled,
		})
	}

	return out, total, nil
}

// UpdateUserPermissions updates menu, report, and COA permissions for a user within a single transaction.
// Supports both simple access model (checked/aktif/access) and granular permissions.
//
// Schema note (TASK-009 fix): UPDATEs target the per-user tables (dbflmenu,
// DBFLMENUREPORT), NOT the master tables (DBMENU, DBMENUREPORT). Only the columns
// that exist in the production schema are written. The model fields that have no
// backing column (IsOtorisasi1..5, IsBatal, checked, aktif, ACCESS) are ignored on
// write — they default to 0 (false) on the next read.
func (r *permissionRepository) UpdateUserPermissions(
	userID string,
	menuPerms []SUserPermission,
	reportPerms []SUserPermission,
	coaPerms []SUserCoaAccess,
) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Update dbflmenu rows. The per-user table has 6 permission columns
		// (HASACCESS, ISTAMBAH, ISKOREKSI, ISHAPUS, ISCETAK, ISEXPORT). Use
		// bool-to-bit casting (CASE WHEN) so we can write 0/1 from the int model.
		for _, p := range menuPerms {
			err := tx.Exec(`
				UPDATE dbflmenu SET
					HASACCESS  = CASE WHEN ? = 1 THEN 1 ELSE 0 END,
					ISTAMBAH   = CASE WHEN ? = 1 THEN 1 ELSE 0 END,
					ISKOREKSI  = CASE WHEN ? = 1 THEN 1 ELSE 0 END,
					ISHAPUS    = CASE WHEN ? = 1 THEN 1 ELSE 0 END,
					ISCETAK    = CASE WHEN ? = 1 THEN 1 ELSE 0 END,
					ISEXPORT   = CASE WHEN ? = 1 THEN 1 ELSE 0 END
				WHERE USERID = ? AND L1 = ?`,
				p.HasAccess, p.IsCreate, p.IsUpdate, p.IsDelete, p.IsPrint, p.IsExport,
				userID, p.KodeMenu,
			).Error
			if err != nil {
				return err
			}
		}

		// Update DBFLMENUREPORT rows. The per-user report table has only
		// (Access, IsDesign, Isexport). Map IsCreate→Access and IsExport→Isexport;
		// other fields are ignored.
		for _, p := range reportPerms {
			err := tx.Exec(`
				UPDATE DBFLMENUREPORT SET
					Access   = CASE WHEN ? = 1 THEN 1 ELSE 0 END,
					Isexport = CASE WHEN ? = 1 THEN 1 ELSE 0 END
				WHERE UserID = ? AND L1 = ?`,
				p.HasAccess, p.IsExport,
				userID, p.KodeMenu,
			).Error
			if err != nil {
				return err
			}
		}

		// Update COA access: delete existing, then insert all entries with checked=1
		if err := tx.Exec("DELETE FROM DBAKSESPERKIRAAN WHERE UserID = ?", userID).Error; err != nil {
			return err
		}
		for _, c := range coaPerms {
			if c.Checked == 1 {
				if err := tx.Exec(
					"INSERT INTO DBAKSESPERKIRAAN (UserID, Perkiraan) VALUES (?, ?)",
					userID, c.Perkiraan,
				).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}
