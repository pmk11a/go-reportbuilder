package db

import (
	"context"
	"fmt"
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/masza1/dapen-backend/internal/models"
	"gorm.io/gorm"
)

var (
	// activityConfigCache holds the SActivityLogConfig by TableName
	activityConfigCache sync.Map
	// isCacheLoaded indicates if the initial load is done
	isCacheLoaded bool
	// cacheMutex prevents concurrent initial loading
	cacheMutex sync.Mutex
)

// LoadActivityLogConfig loads all configs into the cache.
func LoadActivityLogConfig(db *gorm.DB) error {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	var configs []models.SActivityLogConfig
	if err := db.Preload("Fields").Find(&configs).Error; err != nil {
		return err
	}

	// Clear existing (optional, sync.Map doesn't have a clear, so we just overwrite)
	for _, cfg := range configs {
		activityConfigCache.Store(strings.ToLower(cfg.TargetTable), cfg)
	}
	isCacheLoaded = true
	return nil
}

// ReloadActivityLogConfig should be called when configs are updated via API.
func ReloadActivityLogConfig(db *gorm.DB) error {
	return LoadActivityLogConfig(db)
}

// RegisterActivityLogPlugin registers the GORM callbacks.
func RegisterActivityLogPlugin(db *gorm.DB) {
	// Initialize cache in background or synchronously
	// Error ignored here; it's better to log it if it fails
	_ = LoadActivityLogConfig(db)

	db.Callback().Create().After("gorm:create").Register("activity_log:after_create", trackActivity("CREATE"))
	db.Callback().Update().After("gorm:update").Register("activity_log:after_update", trackActivity("UPDATE"))
	db.Callback().Delete().After("gorm:delete").Register("activity_log:after_delete", trackActivity("DELETE"))
}

func trackActivity(action string) func(db *gorm.DB) {
	return func(db *gorm.DB) {
		if db.Error != nil || db.Statement.Schema == nil {
			return
		}

		tableName := strings.ToLower(db.Statement.Schema.Table)
		// Skip logging for the log table itself to prevent infinite loops
		if tableName == "dblogfile" || tableName == "activity_log_config" || tableName == "activity_log_fields" {
			return
		}

		// Get config from cache
		val, ok := activityConfigCache.Load(tableName)
		if !ok {
			return // Not configured
		}

		config := val.(models.SActivityLogConfig)
		if !config.IsEnabled {
			return
		}

		// Check if action is logged
		switch action {
		case "CREATE":
			if !config.LogCreate {
				return
			}
		case "UPDATE":
			if !config.LogUpdate {
				return
			}
		case "DELETE":
			if !config.LogDelete {
				return
			}
		}

		// Extract details in a goroutine for performance
		// We need to clone necessary data because the goroutine might run after the request context ends.
		// However, db.Statement.Dest might be a pointer that gets mutated. 
		// We will safely extract the string representation here synchronously, then insert asynchronously.
		
		keterangan := extractKeterangan(db, action, config)
		noBukti := extractPrimaryKeyValue(db, config.PrimaryKeyField)
		
		// Extract user from context (requires middleware to inject user ID into GORM context)
		// E.g., db.WithContext(context.WithValue(ctx, "userID", "admin"))
		pemakai := "System"
		if userID, ok := db.Statement.Context.Value("userID").(string); ok {
			pemakai = userID
		}

		logEntry := models.SDBLogFile{
			Tahun:      int32(time.Now().Year()),
			Bulan:      int32(time.Now().Month()),
			Tanggal:    time.Now(),
			Pemakai:    pemakai,
			Aktivitas:  fmt.Sprintf("%s_%s", action, strings.ToUpper(tableName)),
			Sumber:     config.SourceName,
			NoBukti:    noBukti,
			Keterangan: keterangan,
		}

		// Insert asynchronously
		go func(dbClone *gorm.DB, entry models.SDBLogFile) {
			// Create a new session without hooks to prevent infinite loops (though we excluded dblogfile above)
			dbSession := dbClone.Session(&gorm.Session{SkipHooks: true, NewDB: true})
			if err := dbSession.Create(&entry).Error; err != nil {
				// We can't do much here besides logging the error to stdout
				fmt.Printf("Failed to insert activity log: %v\n", err)
			}
		}(db, logEntry)
	}
}

func extractPrimaryKeyValue(db *gorm.DB, pkField string) string {
	if pkField == "" {
		pkField = "ID" // Fallback
	}

	dest := db.Statement.Dest
	v := reflect.ValueOf(dest)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	// If it's a slice (batch insert), we just take the first one or return a combined string
	if v.Kind() == reflect.Slice && v.Len() > 0 {
		v = v.Index(0)
	}

	if v.Kind() == reflect.Struct {
		// Find by field name (case insensitive matching)
		for i := 0; i < v.NumField(); i++ {
			fieldType := v.Type().Field(i)
			dbColumn := fieldType.Tag.Get("column")
			if dbColumn == "" { // Fallback to gorm tag parsing
				gormTag := fieldType.Tag.Get("gorm")
				if strings.Contains(gormTag, "column:") {
					parts := strings.Split(gormTag, ";")
					for _, p := range parts {
						if strings.HasPrefix(p, "column:") {
							dbColumn = strings.TrimPrefix(p, "column:")
						}
					}
				}
			}
			
			if strings.EqualFold(fieldType.Name, pkField) || strings.EqualFold(dbColumn, pkField) {
				return fmt.Sprintf("%v", v.Field(i).Interface())
			}
		}
	}
	return "UNKNOWN"
}

func extractKeterangan(db *gorm.DB, action string, config models.SActivityLogConfig) string {
	var details []string
	details = append(details, action)

	dest := db.Statement.Dest
	v := reflect.ValueOf(dest)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	if v.Kind() == reflect.Slice && v.Len() > 0 {
		v = v.Index(0)
	}

	if v.Kind() != reflect.Struct {
		return action
	}

	// Create a map of fields to track
	trackedFields := make(map[string]models.SActivityLogField)
	for _, f := range config.Fields {
		if f.IsTracked {
			trackedFields[strings.ToLower(f.FieldName)] = f
		}
	}

	if len(trackedFields) == 0 {
		return action // No specific fields tracked
	}

	for i := 0; i < v.NumField(); i++ {
		fieldType := v.Type().Field(i)
		fieldName := fieldType.Name
		
		// Determine database column name
		dbColumn := fieldName
		gormTag := fieldType.Tag.Get("gorm")
		if strings.Contains(gormTag, "column:") {
			parts := strings.Split(gormTag, ";")
			for _, p := range parts {
				if strings.HasPrefix(p, "column:") {
					dbColumn = strings.TrimPrefix(p, "column:")
				}
			}
		}

		lowerCol := strings.ToLower(dbColumn)
		fieldConfig, isTracked := trackedFields[lowerCol]

		if isTracked {
			valStr := "***REDACTED***"
			if !fieldConfig.IsSensitive {
				valStr = fmt.Sprintf("%v", v.Field(i).Interface())
			}
			
			// For UPDATE, we might want to show Old -> New, but GORM callbacks only have the New struct easily accessible in db.Statement.Dest.
			// To get Old, we would have to query the DB or use Changed() if using Save/Updates.
			// For simplicity in this port, we log the new values.
			details = append(details, fmt.Sprintf("%s: %s", dbColumn, valStr))
		}
	}

	return strings.Join(details, "\n")
}

// ContextKey is used for strongly typed context keys
type ContextKey string

const UserIDContextKey ContextKey = "userID"

// WithUserID injects the user ID into the GORM context so the ActivityLog plugin can read it.
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, UserIDContextKey, userID)
}
