package activity

import (
	"context"
	"fmt"
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/masza1/dapen-backend/internal/infrastructure/logger"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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
// If the activity_log_config table does not yet exist (e.g. migrations have not
// been run, or fresh database before --migrate), the function returns nil
// silently and the cache stays empty. Registered GORM callbacks still fire —
// they simply find no match in the cache and no-op.
func LoadActivityLogConfig(db *gorm.DB) error {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	if !activityLogConfigTableExists(db) {
		// Table not present yet — mark cache as loaded (with zero entries) so
		// the plugin still operates without spamming "table not in cache" warnings.
		isCacheLoaded = true
		return nil
	}

	var configs []SActivityLogConfig
	if err := db.Preload("Fields").Find(&configs).Error; err != nil {
		// Defensive: if the query still fails (race, dropped table, etc.) do
		// not propagate the error — keep the app running and let an explicit
		// ReloadActivityLogConfig after migration fix things.
		if isMissingTableError(err) {
			isCacheLoaded = true
			return nil
		}
		return err
	}

	// Clear existing (optional, sync.Map doesn't have a clear, so we just overwrite)
	for _, cfg := range configs {
		activityConfigCache.Store(strings.ToLower(cfg.TargetTable), cfg)
	}
	isCacheLoaded = true
	return nil
}

// activityLogConfigTableExists returns true if the activity_log_config table is
// present in the current database. Uses sys.tables (SQL Server). Returns false
// on any error so callers treat absence as "not yet migrated".
func activityLogConfigTableExists(db *gorm.DB) bool {
	var count int64
	err := db.Raw(
		"SELECT count(*) FROM sys.tables WHERE name = ?",
		"activity_log_config",
	).Scan(&count).Error
	if err != nil || count == 0 {
		return false
	}
	return true
}

// isMissingTableError detects GORM/SQL Server errors that indicate the
// activity_log_config table is missing or otherwise unreachable, so we can
// suppress those instead of returning them to the caller.
func isMissingTableError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "invalid object name") ||
		strings.Contains(msg, "object name 'activity_log_config'") ||
		strings.Contains(msg, "doesn't exist") ||
		strings.Contains(msg, "does not exist")
}

// ReloadActivityLogConfig should be called when configs are updated via API.
func ReloadActivityLogConfig(db *gorm.DB) error {
	return LoadActivityLogConfig(db)
}

// RegisterActivityLogPlugin registers the GORM callbacks.
func RegisterActivityLogPlugin(db *gorm.DB) {
	log := logger.GetLogger()

	// Initialize cache in background or synchronously
	if err := LoadActivityLogConfig(db); err != nil {
		log.WithError(err).Error("failed to load activity log config")
	} else if activityLogConfigTableExists(db) {
		log.Info("✅ Activity log config loaded successfully")
	} else {
		log.Info("ℹ️  activity_log_config table not present yet (run --migrate to create) — plugin registered with empty config cache")
	}

	db.Callback().Create().After("gorm:create").Register("activity_log:after_create", trackActivity("CREATE"))
	db.Callback().Update().After("gorm:update").Register("activity_log:after_update", trackActivity("UPDATE"))
	db.Callback().Delete().After("gorm:delete").Register("activity_log:after_delete", trackActivity("DELETE"))

	log.Info("✅ Activity logging plugin registered (CREATE, UPDATE, DELETE hooks)")
}

func trackActivity(action string) func(db *gorm.DB) {
	return func(db *gorm.DB) {
		log := logger.GetLogger()

		log.WithField("action", action).Debug("🔍 trackActivity callback triggered")

		if db.Error != nil {
			log.WithField("error", db.Error).Debug("❌ DB has error, skipping")
			return
		}
		if db.Statement.Schema == nil {
			log.WithField("action", action).Debug("❌ Statement.Schema is nil, skipping")
			return
		}

		tableName := strings.ToLower(db.Statement.Schema.Table)
		log.WithFields(map[string]interface{}{
			"action":    action,
			"table":     tableName,
			"tableName": db.Statement.Schema.Table,
		}).Info("📋 processing %s on table: %s", action, tableName)

		// Skip logging for the log table itself to prevent infinite loops
		if tableName == "dblogfile" || tableName == "activity_log_config" || tableName == "activity_log_fields" {
			log.WithField("table", tableName).Debug("⏭️  skipping internal logging tables")
			return
		}

		// Get config from cache
		val, ok := activityConfigCache.Load(tableName)
		if !ok {
			log.WithFields(map[string]interface{}{
				"table":       tableName,
				"cacheLoaded": isCacheLoaded,
			}).Warn("⚠️  table NOT in cache - either not configured or cache not loaded yet")
			return // Not configured
		}

		config := val.(SActivityLogConfig)

		log.WithFields(map[string]interface{}{
			"table":       tableName,
			"isEnabled":   config.IsEnabled,
			"logCreate":   config.LogCreate,
			"logUpdate":   config.LogUpdate,
			"logDelete":   config.LogDelete,
		}).Info("📊 config settings for %s", tableName)

		if !config.IsEnabled {
			log.WithField("table", tableName).Warn("⚠️  config disabled for this table")
			return
		}

		// Check if action is logged
		switch action {
		case "CREATE":
			if !config.LogCreate {
				log.WithField("table", tableName).Debug("❌ LogCreate disabled")
				return
			}
		case "UPDATE":
			if !config.LogUpdate {
				log.WithField("table", tableName).Debug("❌ LogUpdate disabled")
				return
			}
		case "DELETE":
			if !config.LogDelete {
				log.WithField("table", tableName).Debug("❌ LogDelete disabled")
				return
			}
		}

		// Extract details in a goroutine for performance
		// We need to clone necessary data because the goroutine might run after the request context ends.
		// However, db.Statement.Dest might be a pointer that gets mutated. 
		// We will safely extract the string representation here synchronously, then insert asynchronously.
		
		keterangan := extractKeterangan(db, action, config)
		noBukti := extractPrimaryKeyValue(db, config.PrimaryKeyField)
		
		// Extract user from context (middleware injects user ID via InjectUserContext)
		pemakai := "System"
		if userID, ok := db.Statement.Context.Value("userID").(string); ok {
			pemakai = userID
		}

		logEntry := SDBLogFile{
			Tahun:      int32(time.Now().Year()),
			Bulan:      int32(time.Now().Month()),
			Tanggal:    time.Now(),
			Pemakai:    pemakai,
			Aktivitas:  fmt.Sprintf("%s_%s", action, strings.ToUpper(tableName)),
			Sumber:     config.SourceName,
			NoBukti:    noBukti,
			Keterangan: keterangan,
		}

		log.WithFields(map[string]interface{}{
			"activity": logEntry.Aktivitas,
			"user":     pemakai,
			"table":    tableName,
			"pk":       noBukti,
		}).Info("logging activity")

		// Insert asynchronously with background context (not request context which may be cancelled)
		go func(dbClone *gorm.DB, entry SDBLogFile) {
			// Use background context instead of request context which gets cancelled
			bgCtx := context.Background()
			dbSession := dbClone.WithContext(bgCtx).Session(&gorm.Session{SkipHooks: true, NewDB: true})

			// Explicitly avoid constraints check (for composite key)
			dbSession = dbSession.Omit(clause.Associations)

			if err := dbSession.Create(&entry).Error; err != nil {
				logger.GetLogger().WithError(err).WithFields(map[string]interface{}{
					"activity": entry.Aktivitas,
					"table":    entry.Sumber,
				}).Error("❌ failed to insert activity log")
			} else {
				logger.GetLogger().WithField("activity", entry.Aktivitas).Info("✅ activity log inserted successfully")
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

func extractKeterangan(db *gorm.DB, action string, config SActivityLogConfig) string {
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
	trackedFields := make(map[string]SActivityLogField)
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
