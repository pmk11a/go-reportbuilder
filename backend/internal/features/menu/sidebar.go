package menu

import (
	"github.com/masza1/dapen-backend/internal/features/identity/permission"
	"gorm.io/gorm"
)

// BuildSidebarTree assembles the full sidebar tree for the given legacy user ID.
// The caller pre-loads the per-user granular permission map (dbflmenu) for O(1)
// lookup inside the recursive descent — passing it in avoids a second round-trip
// per node.
//
// The function is a pure helper: no service-level caching happens here; the
// dashboard handler wraps this with its Redis cache layer.
func BuildSidebarTree(gormDB *gorm.DB, userID string, parentCode string, level int, flmenuMap map[string]permission.SDbFlmenu) []SMenuResponseItem {
	var dbMenus []SDbMenu
	query := gormDB.Where("L0 = ?", level)
	if parentCode != "" {
		query = query.Where("KODEMENU LIKE ?", parentCode+"%")
	}

	// "SA" is the legacy super-admin; they get all menus with full permissions.
	// Otherwise JOIN against dbflmenu to filter to menus the user has HASACCESS=1.
	if userID != "SA" {
		query = query.Joins("JOIN dbflmenu ON dbflmenu.L1 = dbmenu.KODEMENU").
			Where("dbflmenu.USERID = ? AND dbflmenu.HASACCESS = 1", userID)
	}

	if err := query.Order("KODEMENU").Find(&dbMenus).Error; err != nil {
		return nil
	}

	var items []SMenuResponseItem
	for _, item := range dbMenus {
		// Recurse into children at the next L0 level.
		children := BuildSidebarTree(gormDB, userID, item.KODEMENU, level+1, flmenuMap)

		menuItem := SMenuResponseItem{
			Code:    item.KODEMENU,
			Icon:    item.Icon,
			Title:   item.Keterangan,
		}
		if item.Routename != nil {
			menuItem.Route = *item.Routename
		}
		if item.TipeTrans != nil {
			menuItem.TipeTrans = *item.TipeTrans
		}

		if len(children) > 0 {
			menuItem.Type = "group"
			menuItem.Items = children
		} else {
			menuItem.Type = "item"
			menuItem.Permissions = buildItemPermissions(userID, item.KODEMENU, flmenuMap)
		}
		items = append(items, menuItem)
	}
	return items
}

// buildItemPermissions derives the 6-flag permission object for a single menu leaf.
// Centralized so the SA "all true" path and the "user has dbflmenu row" path
// are both visible at a glance.
func buildItemPermissions(userID, kodeMenu string, flmenuMap map[string]permission.SDbFlmenu) *SMenuPermissions {
	if userID == "SA" {
		return &SMenuPermissions{Access: true, Add: true, Edit: true, Delete: true, Print: true, Export: true}
	}
	if fl, ok := flmenuMap[kodeMenu]; ok {
		return &SMenuPermissions{
			Access: fl.HASACCESS,
			Add:    fl.ISTAMBAH,
			Edit:   fl.ISKOREKSI,
			Delete: fl.ISHAPUS,
			Print:  fl.ISCETAK,
			Export: fl.ISEXPORT,
		}
	}
	// No dbflmenu row → user has no permission for this menu.
	return &SMenuPermissions{}
}
