package browse

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

// SConfigResolver resolves browse configurations.
// Priority: database (dbbrowseconfigs) > hardcoded map.
type SConfigResolver struct {
	db *gorm.DB
}

// NewConfigResolver creates a new resolver.
func NewConfigResolver(db *gorm.DB) *SConfigResolver {
	return &SConfigResolver{db: db}
}

// GetConfig returns the browse config for a kodeBrowse.
func (r *SConfigResolver) GetConfig(kodeBrowse string) (*Config, error) {
	// 1. Try database-driven config first
	dbConfig, err := r.getDBConfig(kodeBrowse)
	if err != nil {
		return nil, fmt.Errorf("failed to get DB config: %w", err)
	}
	if dbConfig != nil {
		// Merge with hardcoded fallback for missing fields
		hardcoded := r.getHardcodedConfig(kodeBrowse)
		if hardcoded != nil {
			r.mergeConfig(dbConfig, hardcoded)
		}
		return dbConfig, nil
	}

	// 2. Fall back to hardcoded config
	hardcoded := r.getHardcodedConfig(kodeBrowse)
	if hardcoded != nil {
		return hardcoded, nil
	}

	return nil, fmt.Errorf("no browse config for kode: %s", kodeBrowse)
}

// ListTypes returns all available browse types.
func (r *SConfigResolver) ListTypes() []BrowseType {
	hardcoded := r.getAllHardcodedTypes()
	dbMap := r.getAllDBTypes()

	// Merge: hardcoded as base, DB overrides
	merged := make(map[string]BrowseType)
	for _, t := range hardcoded {
		merged[t.KodeBrowse] = t
	}
	for _, t := range dbMap {
		merged[t.KodeBrowse] = t
	}

	result := make([]BrowseType, 0, len(merged))
	for _, t := range merged {
		result = append(result, t)
	}
	return result
}

// Search executes a browse search.
func (r *SConfigResolver) Search(ctx context.Context, kodeBrowse, q string, limit int, userMode string, parentFilters map[string]interface{}) ([]SearchResult, error) {
	config, err := r.GetConfig(kodeBrowse)
	if err != nil {
		return nil, err
	}

	if limit <= 0 {
		limit = 20
	}
	if limit > 1000 {
		limit = 1000
	}

	// Decide: query-based or table-based
	if config.Query != "" {
		return r.searchQueryBased(ctx, config, q, limit, userMode, parentFilters)
	}
	return r.searchTableBased(ctx, config, q, limit, userMode, parentFilters)
}

// ValidateCode validates a single code for a browse type.
func (r *SConfigResolver) ValidateCode(ctx context.Context, kodeBrowse, code string) (SearchResult, error) {
	config, err := r.GetConfig(kodeBrowse)
	if err != nil {
		return nil, err
	}

	if config.Table == "" {
		return nil, fmt.Errorf("validate requires table-based config")
	}

	// Build WHERE clause
	whereParts := []string{fmt.Sprintf("%s.%s = ?", config.Table, config.KeyField)}
	args := []interface{}{code}

	if config.WhereExtra != "" {
		extra := normalizeWhereExtra(config.WhereExtra)
		if extra != "" {
			whereParts = append(whereParts, extra)
		}
	}

	sql := fmt.Sprintf("SELECT TOP 1 %s.* FROM %s WHERE %s", config.Table, config.Table, strings.Join(whereParts, " AND "))

	var row SearchResult
	err = r.db.Raw(sql, args...).Scan(&row).Error
	if err != nil {
		if strings.Contains(err.Error(), "ErrRecordNotFound") {
			return nil, nil
		}
		return nil, err
	}
	return row, nil
}

// ValidateBatch validates multiple codes.
func (r *SConfigResolver) ValidateBatch(ctx context.Context, kodeBrowse string, codes []string) ([]SearchResult, error) {
	if len(codes) == 0 {
		return []SearchResult{}, nil
	}

	config, err := r.GetConfig(kodeBrowse)
	if err != nil {
		return nil, err
	}

	if config.Table == "" {
		return nil, fmt.Errorf("batch validate requires table-based config")
	}

	placeholders := make([]string, len(codes))
	args := make([]interface{}, len(codes))
	for i, c := range codes {
		placeholders[i] = "?"
		args[i] = c
	}

	sql := fmt.Sprintf("SELECT * FROM %s WHERE %s IN (%s)", config.Table, config.KeyField, strings.Join(placeholders, ","))

	var results []SearchResult
	err = r.db.Raw(sql, args...).Scan(&results).Error
	if err != nil {
		return nil, err
	}
	return results, nil
}

// GetAll returns all records for a browse type (no search filter).
func (r *SConfigResolver) GetAll(ctx context.Context, kodeBrowse string, limit int, userMode string) ([]SearchResult, error) {
	if limit <= 0 {
		limit = 500
	}
	return r.Search(ctx, kodeBrowse, "", limit, userMode, nil)
}

// ---- internal helpers ----

func (r *SConfigResolver) getDBConfig(kodeBrowse string) (*Config, error) {
	var cfg models.SDbBrowseConfig
	err := r.db.WithContext(context.Background()).
		Where("kodebrowse = ? AND is_active = ?", kodeBrowse, 1).
		First(&cfg).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	additional := []string(cfg.AdditionalFields)
	joins := []string(cfg.Joins)
	aliasFields := map[string]string(cfg.AliasFields)
	parentFilters := []models.ParentFilter(cfg.ParentFilters)
	params := map[string]string(cfg.Params)

	return &Config{
		Table:            stringPtrToStr(cfg.TargetTable),
		KeyField:         stringPtrToStr(cfg.KeyField),
		LabelField:       stringPtrToStr(cfg.LabelField),
		Query:            stringPtrToStr(cfg.Query),
		AdditionalFields: additional,
		Joins:            joins,
		WhereExtra:       stringPtrToStr(cfg.WhereExtra),
		AliasFields:      aliasFields,
		ParentFilters:    parentFilters,
		Params:           params,
	}, nil
}

func stringPtrToStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func (r *SConfigResolver) getAllDBTypes() []BrowseType {
	var configs []models.SDbBrowseConfig
	r.db.WithContext(context.Background()).
		Where("is_active = ?", 1).
		Order("kodebrowse ASC").
		Find(&configs)

	types := make([]BrowseType, 0, len(configs))
	for _, c := range configs {
		group := BrowseGroups[c.KodeBrowse]
		if group == "" {
			group = stringPtrToStr(c.LabelField)
		}
		if group == "" {
			group = c.KodeBrowse
		}
		types = append(types, BrowseType{
			KodeBrowse: c.KodeBrowse,
			KeyField:   stringPtrToStr(c.KeyField),
			LabelField: stringPtrToStr(c.LabelField),
			Group:      group,
			Source:     "database",
		})
	}
	return types
}

func (r *SConfigResolver) getHardcodedConfig(kodeBrowse string) *Config {
	cfg, ok := hardcodedConfigs[kodeBrowse]
	if !ok {
		return nil
	}
	cp := *cfg // shallow copy
	return &cp
}

func (r *SConfigResolver) getAllHardcodedTypes() []BrowseType {
	types := make([]BrowseType, 0, len(hardcodedConfigs))
	for kode, cfg := range hardcodedConfigs {
		group := BrowseGroups[kode]
		types = append(types, BrowseType{
			KodeBrowse: kode,
			KeyField:   cfg.KeyField,
			LabelField: cfg.LabelField,
			Group:      group,
			Source:     "hardcoded",
		})
	}
	return types
}

func (r *SConfigResolver) mergeConfig(target *Config, source *Config) {
	if len(source.AdditionalFields) > 0 {
		// Merge additionalFields (deduplicate)
		existing := make(map[string]bool)
		for _, f := range target.AdditionalFields {
			existing[f] = true
		}
		for _, f := range source.AdditionalFields {
			if !existing[f] {
				target.AdditionalFields = append(target.AdditionalFields, f)
			}
		}
	}
	if len(source.Joins) > 0 && len(target.Joins) == 0 {
		target.Joins = source.Joins
	}
	if target.WhereExtra == "" && source.WhereExtra != "" {
		target.WhereExtra = source.WhereExtra
	}
	if len(source.AliasFields) > 0 && len(target.AliasFields) == 0 {
		target.AliasFields = source.AliasFields
	}
	if len(source.ParentFilters) > 0 && len(target.ParentFilters) == 0 {
		target.ParentFilters = source.ParentFilters
	}
}

func (r *SConfigResolver) searchTableBased(ctx context.Context, config *Config, q string, limit int, userMode string, parentFilters map[string]interface{}) ([]SearchResult, error) {
	// Build SELECT columns
	selectCols := []string{
		fmt.Sprintf("%s.%s", config.Table, config.KeyField),
		fmt.Sprintf("%s.%s", config.Table, config.LabelField),
	}
	for _, field := range config.AdditionalFields {
		if aliasExpr, ok := config.AliasFields[field]; ok {
			selectCols = append(selectCols, fmt.Sprintf("%s AS %s", aliasExpr, field))
		} else {
			selectCols = append(selectCols, fmt.Sprintf("%s.%s", config.Table, field))
		}
	}

	sql := fmt.Sprintf("SELECT TOP %d %s FROM %s", limit, strings.Join(selectCols, ", "), config.Table)

	// Build bindings map (GORM named bindings via map)
	bindings := make(map[string]interface{})

	// Add joins — substitute :userMode / :parentN placeholders
	if len(config.Joins) > 0 {
		processed := make([]string, 0, len(config.Joins))
		for _, j := range config.Joins {
			j = substituteParams(j, userMode, config.ParentFilters, parentFilters, bindings)
			processed = append(processed, j)
		}
		sql += " " + strings.Join(processed, " ")
	}

	// Build WHERE
	var whereParts []string
	if q != "" {
		labelCol := config.LabelField
		if aliasExpr, ok := config.AliasFields[labelCol]; ok {
			labelCol = aliasExpr
		}
		whereParts = append(whereParts, fmt.Sprintf("(%s.%s LIKE :qKey OR %s LIKE :qLabel)", config.Table, config.KeyField, labelCol))
		bindings["qKey"] = "%" + q + "%"
		bindings["qLabel"] = "%" + q + "%"
	}

	// whereExtra
	extra := normalizeWhereExtra(config.WhereExtra)
	if extra != "" {
		extra = substituteParams(extra, userMode, config.ParentFilters, parentFilters, bindings)
		whereParts = append(whereParts, extra)
	}

	if len(whereParts) > 0 {
		sql += " WHERE " + strings.Join(whereParts, " AND ")
	}

	// Order by key field
	sql += fmt.Sprintf(" ORDER BY %s.%s", config.Table, config.KeyField)

	// Execute via gorm map bindings
	var rows []SearchResult
	db := r.db.WithContext(ctx)
	err := db.Raw(sql, bindings).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	return rows, nil
}

// substituteParams replaces :userMode and <P:col> / ''<P:col>'' placeholders.
// parentConfigs is the config's parent_filters array (ordered); parentValues is the
// runtime values keyed by source_column. Bindings are named parent0, parent1, ...
// to match Laravel's stable indexing.
func substituteParams(s string, userMode string, parentConfigs []models.ParentFilter, parentValues map[string]interface{}, bindings map[string]interface{}) string {
	if userMode != "" && strings.Contains(s, ":userMode") {
		bindings["userMode"] = userMode
	}
	for pfIdx, pf := range parentConfigs {
		val, ok := parentValues[pf.SourceColumn]
		if !ok {
			continue
		}
		key := fmt.Sprintf("parent%d", pfIdx)
		bindings[key] = val
		s = strings.ReplaceAll(s, fmt.Sprintf("''<P:%s>''", pf.SourceColumn), ":"+key)
		s = strings.ReplaceAll(s, fmt.Sprintf("<P:%s>", pf.SourceColumn), ":"+key)
		s = strings.ReplaceAll(s, fmt.Sprintf("''<P:%s>", pf.SourceColumn), ":"+key)
		s = strings.ReplaceAll(s, fmt.Sprintf("<P:%s>''", pf.SourceColumn), ":"+key)
	}
	return s
}

func (r *SConfigResolver) searchQueryBased(ctx context.Context, config *Config, q string, limit int, userMode string, parentFilters map[string]interface{}) ([]SearchResult, error) {
	sql := config.Query
	bindings := make(map[string]interface{})

	// If userMode is configured, substitute it
	if userMode != "" {
		sql = strings.ReplaceAll(sql, ":userMode", ":userModeBind")
		bindings["userModeBind"] = userMode
	}

	// Inject parent_filters: replace ''<P:fieldName>'' with :bindKey, bind values
	if len(config.ParentFilters) > 0 && len(parentFilters) > 0 {
		for pfIdx, pf := range config.ParentFilters {
			val, ok := parentFilters[pf.SourceColumn]
			if !ok {
				continue
			}
			placeholderInQuote := fmt.Sprintf("''<P:%s>''", pf.SourceColumn)
			placeholderPlain := fmt.Sprintf("<P:%s>", pf.SourceColumn)
			bindKey := fmt.Sprintf("qparent%d", pfIdx)

			if strings.Contains(sql, placeholderInQuote) {
				sql = strings.ReplaceAll(sql, placeholderInQuote, ":"+bindKey)
			} else if strings.Contains(sql, placeholderPlain) {
				sql = strings.ReplaceAll(sql, placeholderPlain, ":"+bindKey)
			} else {
				// Fallback: append AND condition
				col := fmt.Sprintf("[%s]", pf.SourceColumn)
				op := pf.Operator
				if op == "" {
					op = "="
				}
				if strings.Contains(sql, " WHERE ") {
					sql += " AND " + col + " " + op + " :" + bindKey
				} else {
					sql += " WHERE " + col + " " + op + " :" + bindKey
				}
			}
			bindings[bindKey] = val
		}
	}

	// Handle EditFilter.Text patterns: like ''%''+EditFilter.Text+''%''
	// → simple LIKE on q
	if q != "" {
		escaped := strings.ReplaceAll(q, "'", "''")
		// Replace Delphi-style filter
		re := regexp.MustCompile(`(?i)like\s*''%'\s*\+[\w.]+\.\w+\s*\+\s*'%''`)
		sql = re.ReplaceAllString(sql, fmt.Sprintf("LIKE '%%%s%%'", escaped))
		// Also replace any remaining ''%EditFilter.Text%'' or similar
		sql = strings.ReplaceAll(sql, "like ''%EditFilter.Text%''", fmt.Sprintf("LIKE '%%%s%%'", escaped))
	}

	sql = strings.TrimSpace(sql)
	upperSQL := strings.ToUpper(sql)
	if !strings.HasPrefix(upperSQL, "SELECT") && !strings.HasPrefix(upperSQL, "EXEC") {
		// It's a table name, convert to table-based
		config.Table = sql
		config.Query = ""
		return r.searchTableBased(ctx, config, q, limit, userMode, parentFilters)
	}

	if strings.HasPrefix(upperSQL, "SELECT") {
		prefix := upperSQL
		if len(prefix) > 20 {
			prefix = prefix[:20]
		}
		if !strings.Contains(prefix, "TOP") {
			sql = "SELECT TOP " + fmt.Sprintf("%d", limit) + " " + strings.TrimPrefix(sql, "SELECT")
		}
	}

	var rows []SearchResult
	db := r.db.WithContext(ctx)
	if len(bindings) > 0 {
		err := db.Raw(sql, bindings).Scan(&rows).Error
		if err != nil {
			return nil, err
		}
	} else {
		err := db.Raw(sql).Scan(&rows).Error
		if err != nil {
			return nil, err
		}
	}

	// In-memory filter by q if provided (defensive)
	if q != "" && len(rows) > 0 {
		filtered := make([]SearchResult, 0)
		search := strings.ToLower(q)
		for _, row := range rows {
			keyVal := strings.ToLower(fmt.Sprintf("%v", row[config.KeyField]))
			labelVal := strings.ToLower(fmt.Sprintf("%v", row[config.LabelField]))
			if strings.Contains(keyVal, search) || strings.Contains(labelVal, search) {
				filtered = append(filtered, row)
			}
			if len(filtered) >= limit {
				break
			}
		}
		rows = filtered
	}

	return rows, nil
}

func normalizeWhereExtra(extra string) string {
	if extra == "" {
		return ""
	}
	// Strip leading WHERE/AND/OR keywords
	extracted := strings.TrimSpace(extra)
	lower := strings.ToLower(extracted)
	if strings.HasPrefix(lower, "where ") || lower == "where" {
		extracted = strings.TrimSpace(extracted[5:])
	} else if strings.HasPrefix(lower, "and ") || lower == "and" {
		extracted = strings.TrimSpace(extracted[3:])
	} else if strings.HasPrefix(lower, "or ") || lower == "or" {
		extracted = strings.TrimSpace(extracted[2:])
	}
	return extracted
}

// SearchPaged executes the browse query with pagination (offset/limit) and
// search filter. It returns a BrowsePagedResponse containing items and
// pagination metadata (total, limit, offset, hasMore).
//
// Semantics:
//   - Paged query: SELECT ... LIMIT ? OFFSET ?
//   - Count query: SELECT COUNT(*) for metadata
//   - search: ILIKE on labelField
//   - sort: sortBy/sortDir (default: labelField ASC)
//   - jenis: kodeBrowse-specific discriminator (e.g., 1004 kelompok, 1009 Hutang/Piutang)
//
// This is the canonical method used by /api/browse/search.
func (r *SConfigResolver) SearchPaged(
	ctx context.Context,
	filter SearchFilter,
) (*BrowsePagedResponse, error) {
	// Validate and default limit/offset
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 20
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	cfg, err := r.GetConfig(filter.KodeBrowse)
	if err != nil {
		return nil, fmt.Errorf("failed to get browse config: %w", err)
	}

	// Normalize column aliases from AdditionalFields into projection list
	projection := []string{cfg.KeyField, cfg.LabelField}
	projection = append(projection, cfg.AdditionalFields...)

	selectClause := strings.Join(projection, ", ")
	fromClause := cfg.Table

	var whereParts []string
	var args []interface{}

	// Apply WhereExtra if defined
	if cfg.WhereExtra != "" {
		whereParts = append(whereParts, cfg.WhereExtra)
	}

	// Apply jenis filter based on kodeBrowse
	switch filter.KodeBrowse {
	case "1004": // perkiraan
		if filter.Jenis == "Y" {
			whereParts = append(whereParts, "Kelompok LIKE 'K%'")
		} else if filter.Jenis == "T" {
			whereParts = append(whereParts, "Kelompok NOT LIKE 'K%'")
		}
	case "1009": // custsupp
		// "Hutang" -> kdgroup = 'H', "Piutang" -> kdgroup = 'P'
		if filter.Jenis == "Hutang" {
			whereParts = append(whereParts, "kdgroup = 'H'")
		} else if filter.Jenis == "Piutang" {
			whereParts = append(whereParts, "kdgroup = 'P'")
		}
	}

	// Apply search term (case-insensitive ILIKE on labelField)
	if filter.Search != "" {
		whereParts = append(whereParts, fmt.Sprintf("%s ILIKE ?", cfg.LabelField))
		args = append(args, "%"+filter.Search+"%")
	}

	whereClause := ""
	if len(whereParts) > 0 {
		whereClause = "WHERE " + strings.Join(whereParts, " AND ")
	}

	// Normalize sortBy (default to labelField)
	sortCol := filter.SortBy
	if sortCol == "" || sortCol == "text" {
		sortCol = cfg.LabelField
	}
	// Validate sort direction (default ASC)
	sortDir := filter.SortDir
	if sortDir != "ASC" && sortDir != "DESC" {
		sortDir = "ASC"
	}
	orderClause := fmt.Sprintf("ORDER BY %s %s", sortCol, sortDir)

	// Build the count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s %s", fromClause, whereClause)
	var total int64
	if err := r.db.WithContext(ctx).Raw(countQuery, args...).Scan(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count browse results: %w", err)
	}

	// Build the data query with pagination
	dataQuery := fmt.Sprintf("SELECT %s FROM %s %s %s LIMIT ? OFFSET ?",
		selectClause, fromClause, whereClause, orderClause)

	pagedArgs := append(args, filter.Limit, filter.Offset)

	var items []SearchResult
	if err := r.db.WithContext(ctx).Raw(dataQuery, pagedArgs...).Scan(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to execute browse paged query: %w", err)
	}

	// Compute hasMore for infinite scroll
	hasMore := int64(filter.Offset+len(items)) < total

	return &BrowsePagedResponse{
		Items:   items,
		Total:   total,
		Limit:   filter.Limit,
		Offset:  filter.Offset,
		HasMore: hasMore,
	}, nil
}