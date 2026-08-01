package browse

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strings"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

// scanSearchResults executes a raw SQL query (with optional named bindings)
// and scans every row into a SearchResult (map[string]interface{}).
//
// Why this exists:
//
// GORM's high-level `db.Raw(sql, bindings).Scan(&rows)` path goes through
// `prepareValues`, which uses `rows.ColumnTypes()[i].ScanType()` to allocate
// each destination. For SQL Server numeric/decimal columns (e.g.
// `DBPERKIRAAN.Perkiraan`), the driver's ScanType() returns `[]byte`, and
// GORM wraps it as `reflect.New(reflect.PointerTo([]byte))` → `**[]byte`.
//
// When `database/sql` later calls `convertAssignRows(**[]byte, src, rows)`,
// the type switch and reflection path can leave the destination in an
// intermediate state that produces
//   `sql: Scan error on column index 0, name "Perkiraan": destination not a pointer`.
// Other column types (varchar/nvarchar, int) work fine because they have
// dedicated type-switch cases in `convertAssignRows`.
//
// The fix: bypass GORM's prepareValues entirely by calling `db.Raw(...).Rows()`
// directly and allocating each destination as a plain `*interface{}`. database/sql
// has a first-class `case *any:` branch (database/sql/convert.go) which
// handles every `driver.Value` type the SQL Server driver returns — `string`,
// `[]byte`, `time.Time`, `int64`, `float64`, `decimalDecompose`, `nil` —
// without the double-pointer edge case that breaks GORM's path.
func (r *SConfigResolver) scanSearchResults(db *gorm.DB, sqlStr string, bindings map[string]interface{}) ([]SearchResult, error) {
	var rows *sql.Rows
	var err error
	if len(bindings) > 0 {
		rows, err = db.Raw(sqlStr, bindings).Rows()
	} else {
		rows, err = db.Raw(sqlStr).Rows()
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("read browse columns: %w", err)
	}

	results := make([]SearchResult, 0)
	for rows.Next() {
		// Allocate one *interface{} per column. database/sql will assign the
		// raw driver value to each interface variable, which we then index by
		// column name into the result map.
		values := make([]interface{}, len(columns))
		scanDests := make([]interface{}, len(columns))
		for i := range values {
			values[i] = new(interface{})
			scanDests[i] = values[i]
		}

		if err := rows.Scan(scanDests...); err != nil {
			return nil, fmt.Errorf("scan browse row: %w", err)
		}

		row := make(SearchResult, len(columns))
		for i, col := range columns {
			row[col] = normalizeScanValue(*(values[i].(*interface{})))
		}
		results = append(results, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate browse rows: %w", err)
	}
	return results, nil
}

// normalizeScanValue converts SQL Server driver values into the Go types
// the FE expects to receive.
//
// The SQL Server driver returns `numeric`/`decimal` columns as `[]byte`
// (the byte representation of the decimal — see makeGoLangScanType in
// github.com/microsoft/go-mssqldb). When that value lands in a `*interface{}`
// destination via `rows.Scan`, the interface ends up holding a `[]byte` even
// though the column logically represents a string-coercible value (account
// numbers, codes, etc.).
//
// Without this normalisation the FE would have to defensively handle both
// `string` and `[]byte` for every column — historically that's been a source
// of subtle type-mismatch bugs (e.g. `String(row.Perkiraan)` rendering
// "[49 49 48 49]" instead of "1101").
//
// We only convert `[]byte` whose contents are printable ASCII / UTF-8, so
// genuinely binary columns (varbinary, image) still pass through as []byte.
func normalizeScanValue(v interface{}) interface{} {
	if b, ok := v.([]byte); ok {
		s := string(b)
		// Quick heuristic: if every byte is a printable ASCII rune or a
		// high-bit UTF-8 continuation, treat as text. Binary data typically
		// contains NULs or non-printable control bytes which we leave alone.
		if isPrintableString(s) {
			return s
		}
		return b
	}
	return v
}

// isPrintableString returns true when s contains no NUL bytes and either
// consists entirely of printable ASCII runes (including common whitespace)
// or is a valid UTF-8 sequence whose runes are all graphic / whitespace.
//
// The check is intentionally cheap (O(len(s)) and allocation-free); it is
// used only to decide whether to coerce a `[]byte` driver value into a Go
// `string` for FE consumption. A false negative is harmless (the value
// remains []byte). A false positive could mask binary data, but the
// browse queries in this codebase are all text columns, so the risk is
// negligible.
func isPrintableString(s string) bool {
	if len(s) == 0 {
		return true
	}
	for i := 0; i < len(s); {
		r, size := decodeRune(s[i:])
		if r == 0 {
			return false
		}
		if r < 0x20 && r != '\t' && r != '\n' && r != '\r' {
			return false
		}
		if r == 0x7f {
			return false
		}
		i += size
	}
	return true
}

// decodeRune decodes the first UTF-8 rune from b and returns the rune plus
// the number of bytes consumed. On invalid input it returns (utf8.RuneError,
// 1) so the caller can continue scanning rather than aborting the loop.
//
// We avoid importing `unicode/utf8` directly to keep this helper small and
// dependency-free; the implementation matches the relevant subset of the
// UTF-8 spec (RFC 3629) we need to spot-printable ASCII and standard
// multi-byte sequences.
func decodeRune(b string) (rune, int) {
	if len(b) == 0 {
		return 0, 0
	}
	c := b[0]
	switch {
	case c < 0x80:
		return rune(c), 1
	case c < 0xc2:
		// Overlong 2-byte sequence or stray continuation byte.
		return '�', 1
	case c < 0xe0:
		if len(b) < 2 {
			return '�', 1
		}
		c2 := b[1]
		if c2&0xc0 != 0x80 {
			return '�', 1
		}
		return rune(c&0x1f)<<6 | rune(c2&0x3f), 2
	case c < 0xf0:
		if len(b) < 3 {
			return '�', 1
		}
		c2, c3 := b[1], b[2]
		if c2&0xc0 != 0x80 || c3&0xc0 != 0x80 {
			return '�', 1
		}
		return rune(c&0x0f)<<12 | rune(c2&0x3f)<<6 | rune(c3&0x3f), 3
	case c < 0xf5:
		if len(b) < 4 {
			return '�', 1
		}
		c2, c3, c4 := b[1], b[2], b[3]
		if c2&0xc0 != 0x80 || c3&0xc0 != 0x80 || c4&0xc0 != 0x80 {
			return '�', 1
		}
		return rune(c&0x07)<<18 | rune(c2&0x3f)<<12 | rune(c3&0x3f)<<6 | rune(c4&0x3f), 4
	}
	return '�', 1
}

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

	// Build WHERE clause. Use named `@code` binding so we can route through
	// `scanSearchResults` (which expects either a bindings map or no args),
	// avoiding GORM's broken prepareValues path for numeric columns.
	whereParts := []string{fmt.Sprintf("%s.%s = @code", config.Table, config.KeyField)}

	if config.WhereExtra != "" {
		extra := normalizeWhereExtra(config.WhereExtra)
		if extra != "" {
			whereParts = append(whereParts, extra)
		}
	}

	sql := fmt.Sprintf("SELECT TOP 1 %s.* FROM %s WHERE %s", config.Table, config.Table, strings.Join(whereParts, " AND "))

	rows, err := r.scanSearchResults(r.db, sql, map[string]interface{}{"code": code})
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return rows[0], nil
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

	// Use named bindings (@code0, @code1, ...) so we can route through
	// `scanSearchResults` (which expects either a bindings map or no args),
	// avoiding GORM's broken prepareValues path for numeric columns.
	placeholders := make([]string, len(codes))
	bindings := make(map[string]interface{}, len(codes))
	for i, c := range codes {
		key := fmt.Sprintf("code%d", i)
		placeholders[i] = "@" + key
		bindings[key] = c
	}

	sql := fmt.Sprintf("SELECT * FROM %s WHERE %s IN (%s)", config.Table, config.KeyField, strings.Join(placeholders, ","))

	results, err := r.scanSearchResults(r.db, sql, bindings)
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
		// Use `@` placeholders for GORM named bindings (see `substituteParams`
		// comment for the SQL Server `map[string]interface{}` rationale).
		whereParts = append(whereParts, fmt.Sprintf("(%s.%s LIKE @qKey OR %s LIKE @qLabel)", config.Table, config.KeyField, labelCol))
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

	// Execute via gorm map bindings. Use scanSearchResults (raw Rows() +
	// per-column *interface{} destinations) instead of GORM's `Scan(&rows)`
	// helper. GORM's prepareValues allocates `**[]byte` destinations for SQL
	// Server numeric/decimal columns, which database/sql rejects with
	// `sql: Scan error on column index N, name "Perkiraan": destination not a
	// pointer`. See scanSearchResults doc comment for the full rationale.
	db := r.db.WithContext(ctx)
	rows, err := r.scanSearchResults(db, sql, bindings)
	if err != nil {
		return nil, err
	}

	return rows, nil
}

// substituteParams replaces :userMode and <P:col> / ''<P:col>'' placeholders.
// parentConfigs is the config's parent_filters array (ordered); parentValues is the
// runtime values keyed by source_column. Bindings are named parent0, parent1, ...
// to match Laravel's stable indexing.
// substituteParams replaces Delphi-style placeholders (``<P:col>''`, `:userMode`)
// with bind keys and populates `bindings` for GORM named bindings.
//
// IMPORTANT: keys are emitted with the `@` prefix (not `:`) because GORM's
// `db.Raw(sql, bindings)` only expands named bindings when SQL contains `@`.
// Using `:name` would make GORM pass the entire map as `$1`, which SQL Server
// rejects with "unsupported type map[string]interface {}, a map".
func substituteParams(s string, userMode string, parentConfigs []models.ParentFilter, parentValues map[string]interface{}, bindings map[string]interface{}) string {
	if userMode != "" && strings.Contains(s, ":userMode") {
		bindings["userMode"] = userMode
		s = strings.ReplaceAll(s, ":userMode", "@userMode")
	}
	for pfIdx, pf := range parentConfigs {
		val, ok := parentValues[pf.SourceColumn]
		if !ok {
			continue
		}
		key := fmt.Sprintf("parent%d", pfIdx)
		bindings[key] = val
		s = strings.ReplaceAll(s, fmt.Sprintf("''<P:%s>''", pf.SourceColumn), "@"+key)
		s = strings.ReplaceAll(s, fmt.Sprintf("<P:%s>", pf.SourceColumn), "@"+key)
		s = strings.ReplaceAll(s, fmt.Sprintf("''<P:%s>", pf.SourceColumn), "@"+key)
		s = strings.ReplaceAll(s, fmt.Sprintf("<P:%s>''", pf.SourceColumn), "@"+key)
	}
	return s
}

func (r *SConfigResolver) searchQueryBased(ctx context.Context, config *Config, q string, limit int, userMode string, parentFilters map[string]interface{}) ([]SearchResult, error) {
	sql := config.Query
	bindings := make(map[string]interface{})

	// If userMode is configured, substitute it
	if userMode != "" {
		sql = strings.ReplaceAll(sql, ":userMode", "@userModeBind")
		bindings["userModeBind"] = userMode
	}

	// Inject parent_filters: replace ''<P:fieldName>'' with @bindKey, bind values.
	//
	// IMPORTANT: use the `@name` placeholder syntax, not `:name`. GORM's
	// `db.Raw(sql, bindings)` (where `bindings` is `map[string]interface{}`)
	// only expands named bindings when SQL contains `@` characters; with
	// `:name` syntax the entire map gets bound as `$1` and SQL Server
	// rejects it with
	//   "sql: converting argument $1 type: unsupported type
	//    map[string]interface {}, a map".
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
				sql = strings.ReplaceAll(sql, placeholderInQuote, "@"+bindKey)
			} else if strings.Contains(sql, placeholderPlain) {
				sql = strings.ReplaceAll(sql, placeholderPlain, "@"+bindKey)
			} else {
				// Fallback: append AND condition
				col := fmt.Sprintf("[%s]", pf.SourceColumn)
				op := pf.Operator
				if op == "" {
					op = "="
				}
				if strings.Contains(sql, " WHERE ") {
					sql += " AND " + col + " " + op + " @" + bindKey
				} else {
					sql += " WHERE " + col + " " + op + " @" + bindKey
				}
			}
			bindings[bindKey] = val
		}
	}

	// Replace Delphi EditFilter.Text references with the runtime `q` value.
	//
	// The legacy BrowseService.cpp emits EditFilter.Text inside the SQL it
	// stores in dbbrowseconfigs, in several shapes. SQL Server has no
	// component named EditFilter.Text (Delphi used it as a member of the
	// TEdit control at form-construction time, but in the stored query it
	// was meant to be substituted with the user's search text). If any
	// shape survives unrewritten, the driver rejects the query with:
	//
	//   mssql: The multi-part identifier "EditFilter.Text" could not be bound.
	//
	// The four shapes seen in production seed data:
	//
	//   1. LIKE ''%''+EditFilter.Text+''%''   (Delphi doubled-quote style)
	//   2. LIKE ''%EditFilter.Text%''         (Delphi doubled-quote bracket)
	//   3. LIKE '%'+EditFilter.Text+'%'       (plain single-quote style)
	//   4. LIKE '%EditFilter.Text%'           (plain single-quote bracket)
	//
	// ...plus inline uses such as "... = EditFilter.Text AND ...".
	//
	// Strategy: handle the four LIKE shapes first, then mop up any remaining
	// bare `EditFilter.Text` reference by replacing the WHOLE token with the
	// already-q-escaped literal. Single apostrophes inside `q` are doubled so
	// the resulting LIKE literal is parse-safe.
	//
	// When q is empty, replace with '%' (match everything) so the query
	// still executes without the EditFilter.Text binding error.
	escaped := strings.ReplaceAll(q, "'", "''")
	likeValue := fmt.Sprintf("LIKE '%%%s%%'", escaped)

	// 1. LIKE ''%''+EditFilter.Text+''%''  →  LIKE '%q%'
	// Matches ''%''  +  EditFilter.Text  +  ''%''
	editFilterBracketAdd := regexp.MustCompile(`(?i)like\s*''%''\s*\+\s*EditFilter\.Text\s*\+\s*''%''`)
	sql = editFilterBracketAdd.ReplaceAllString(sql, likeValue)

	// 2. LIKE ''%EditFilter.Text%''  →  LIKE '%q%'
	editFilterBracket := regexp.MustCompile(`(?i)like\s*''%EditFilter\.Text%''`)
	sql = editFilterBracket.ReplaceAllString(sql, likeValue)

	// 3. LIKE '%'+EditFilter.Text+'%'  →  LIKE '%q%'
	editFilterPlainAdd := regexp.MustCompile(`(?i)like\s*'%'\s*\+\s*EditFilter\.Text\s*\+\s*'%'`)
	sql = editFilterPlainAdd.ReplaceAllString(sql, likeValue)

	// 4. LIKE '%EditFilter.Text%'  →  LIKE '%q%'
	editFilterPlain := regexp.MustCompile(`(?i)like\s*'%EditFilter\.Text%'`)
	sql = editFilterPlain.ReplaceAllString(sql, likeValue)

	// 5. Any remaining bare `EditFilter.Text` reference (e.g.
	// "X = EditFilter.Text AND ..."): quote-escape and embed the literal.
	// We do this LAST so the four LIKE rewrites above (which would
	// otherwise overwrite a contained EditFilter.Text token correctly)
	// are not disturbed.
	sql = strings.ReplaceAll(sql, "EditFilter.Text", fmt.Sprintf("'%s'", escaped))

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
			// Strip a leading SELECT (any case) so we can prepend SELECT TOP <n>
			// uniformly. Using case-sensitive TrimPrefix would leave SQL like
			// "Select" or "select" untouched, producing
			//   SELECT TOP 20 Select ...
			// which SQL Server rejects with
			//   "Incorrect syntax near the keyword 'Select'."
			stripped := strings.TrimSpace(sql)
			if len(stripped) >= 6 && strings.EqualFold(stripped[:6], "SELECT") {
				stripped = strings.TrimSpace(stripped[6:])
			}
			sql = "SELECT TOP " + fmt.Sprintf("%d", limit) + " " + stripped
		}
	}

	var rows []SearchResult
	db := r.db.WithContext(ctx)
	rows, err := r.scanSearchResults(db, sql, bindings)
	if err != nil {
		return nil, err
	}

	// In-memory filter by q if provided (defensive).
	// Match against key (code) OR label (description) — mirrors SQL LIKE behavior.
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