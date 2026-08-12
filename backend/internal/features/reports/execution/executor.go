package execution

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"

	"github.com/masza1/dapen-backend/internal/features/reports"
)

// IReportExecutionRepository defines the data access contract for report execution.
type IReportExecutionRepository interface {
	GetReportByKodeMenu(ctx context.Context, kodeMenu string) (*reports.SDBMasterLaporan, error)
	GetFilters(ctx context.Context, idLaporan int) ([]reports.SDBParameterLaporan, error)
	GetDatasets(ctx context.Context, idLaporan int) ([]reports.SDBQueryLaporan, error)
	GetAllColumns(ctx context.Context, idLaporan int) (map[string][]reports.SDBKolomLaporan, error)
	GetGroups(ctx context.Context, idLaporan int) ([]reports.SDBGroupLaporan, error)
	ExecuteQuery(ctx context.Context, sql string, filters map[string]interface{}, userId string) ([]map[string]interface{}, error)
	ExecuteQueryMulti(ctx context.Context, sql string) ([][]map[string]interface{}, error)
	GetLabelMapping(ctx context.Context, field string) (map[string]string, error)
}

// SReportExecutionService handles report generation for end users.
type SReportExecutionService struct {
	repo IReportExecutionRepository
}

// NewReportExecutionService constructs the report execution service.
func NewReportExecutionService(repo IReportExecutionRepository) *SReportExecutionService {
	return &SReportExecutionService{repo: repo}
}

// ExecuteReportParams holds parameters for executing a report
type ExecuteReportParams struct {
	KodeMenu string
	Filters  map[string]interface{}
	UserID   string
}

// ExecuteReportResult holds the result of executing a report
type ExecuteReportResult struct {
	Datasets       map[string][]map[string]interface{}
	GroupedData    map[string]interface{}
	GrandTotal     map[string]interface{}
	GroupingConfig map[string]interface{}
	Errors         []string
}

// GenerateReport executes a report by KODEMENU and returns all datasets with optional grouping.
func (s *SReportExecutionService) GenerateReport(ctx context.Context, params ExecuteReportParams) (*ExecuteReportResult, error) {
	// Get report config
	report, err := s.repo.GetReportByKodeMenu(ctx, params.KodeMenu)
	if err != nil {
		return nil, fmt.Errorf("report not found: %w", err)
	}

	// Get datasets
	datasets, err := s.repo.GetDatasets(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get datasets: %w", err)
	}

	// Get columns
	columns, err := s.repo.GetAllColumns(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %w", err)
	}

	// Get grouping config
	groups, err := s.repo.GetGroups(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get groups: %w", err)
	}

	// Execute all visible datasets
	results := make(map[string][]map[string]interface{})
	var errors []string

	// Detect shared EXEC SPs (same QuerySumberData) and use multi-result-set execution
	sortedDatasets := make([]reports.SDBQueryLaporan, 0)
	for _, d := range datasets {
		if d.Visible {
			sortedDatasets = append(sortedDatasets, d)
		}
	}

	spGroups := make(map[string][]reports.SDBQueryLaporan) // normalized SQL -> datasets using it
	for _, d := range sortedDatasets {
		normSql := strings.TrimSpace(d.QuerySumberData)
		if strings.HasPrefix(strings.ToUpper(normSql), "EXEC ") {
			spGroups[normSql] = append(spGroups[normSql], d)
		}
	}

	usedDatasets := make(map[string]bool)
	for _, d := range sortedDatasets {
		if usedDatasets[d.NamaDataset] {
			continue
		}
		normSql := strings.TrimSpace(d.QuerySumberData)
		if strings.HasPrefix(strings.ToUpper(normSql), "EXEC ") {
			shared := spGroups[normSql]
			if len(shared) > 1 {
				// Shared SP: execute once, split result sets by dataset order
				resultSets, err := s.ExecuteDatasetQueryMulti(ctx, &d, params.Filters, params.UserID)
				if err != nil {
					errors = append(errors, fmt.Sprintf("Dataset %s: %s", d.NamaDataset, err.Error()))
					for _, sd := range shared {
						results[sd.NamaDataset] = []map[string]interface{}{}
						usedDatasets[sd.NamaDataset] = true
					}
					continue
				}
				// Assign each result set to its corresponding dataset
				for i, sd := range shared {
					var data []map[string]interface{}
					if i < len(resultSets) {
						data = resultSets[i]
					} else if len(resultSets) == 1 {
						// Fallback: If SP returned only 1 result set but used in multiple datasets,
						// duplicate the data so they don't get empty results.
						data = make([]map[string]interface{}, len(resultSets[0]))
						for rIdx, row := range resultSets[0] {
							newRow := make(map[string]interface{})
							for k, v := range row {
								newRow[k] = v
							}
							data[rIdx] = newRow
						}
					} else {
						data = []map[string]interface{}{}
					}
					
					data = s.computeRunningBalance(data, sd.NamaDataset)
					results[sd.NamaDataset] = data
					usedDatasets[sd.NamaDataset] = true
				}
				continue
			}
		}

		// Not a shared SP: execute normally
		data, err := s.ExecuteDatasetQuery(ctx, &d, params.Filters, params.UserID)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Dataset %s: %s", d.NamaDataset, err.Error()))
			results[d.NamaDataset] = []map[string]interface{}{}
			continue
		}
		data = s.computeRunningBalance(data, d.NamaDataset)
		results[d.NamaDataset] = data
		usedDatasets[d.NamaDataset] = true
	}

	// Apply label mapping for grouping fields
	results = s.applyLabelMapping(ctx, results, groups)

	// Build grouped data if grouping is configured
	var groupedData map[string]interface{}
	if len(groups) > 0 {
		groupedData = s.buildGroupedData(results, groups, columns)
	}

	// Calculate grand totals
	grandTotal := s.calculateGrandTotal(results, columns)

	// Build grouping config (used for building hierarchical structure)
	groupingCfg := s.buildGroupingConfig(groups)

	return &ExecuteReportResult{
		Datasets:       results,
		GroupedData:    groupedData,
		GrandTotal:     grandTotal,
		GroupingConfig: groupingCfg,
		Errors:         errors,
	}, nil
}

// ExecuteDatasetQuery executes a single dataset query with parameter substitution.
func (s *SReportExecutionService) ExecuteDatasetQuery(ctx context.Context, dataset *reports.SDBQueryLaporan, filters map[string]interface{}, userId string) ([]map[string]interface{}, error) {
	sql := dataset.QuerySumberData

	// Parse config_json for static params
	staticParams := s.parseStaticParams(dataset.ConfigJSON)

	// Replace static params from config_json (sorted by length desc)
	for key, value := range staticParams {
		sql = s.replacePlaceholder(sql, "@"+key, fmt.Sprintf("'%s'", s.escapeSQLString(fmt.Sprintf("%v", value))))
	}

	// Replace filter parameters
	for key, value := range filters {
		placeholder := "@" + key
		if !s.hasPlaceholder(sql, placeholder) {
			continue
		}
		sql = s.replaceFilterValue(sql, placeholder, value)
	}

	// Handle @IDUser and @UserID
	if userId != "" {
		sql = s.replacePlaceholder(sql, "@IDUser", fmt.Sprintf("'%s'", s.escapeSQLString(userId)))
		sql = s.replacePlaceholder(sql, "@UserID", fmt.Sprintf("'%s'", s.escapeSQLString(userId)))
	} else {
		sql = s.replacePlaceholder(sql, "@IDUser", "''")
		sql = s.replacePlaceholder(sql, "@UserID", "''")
	}

	// For EXEC SP queries, replace remaining placeholders with NULL
	if matched, _ := regexp.MatchString(`^\s*EXEC\s+`, sql); matched {
		sql = s.replaceRemainingPlaceholders(sql)
	}

	// Strip residual placeholders in SELECT queries (fallback safety)
	if matched, _ := regexp.MatchString(`(?i)^\s*SELECT`, sql); matched {
		if hasRemaining, _ := regexp.MatchString(`(?i)@\w+`, sql); hasRemaining {
			// Remove WHERE clause with residual placeholders
			sql = regexp.MustCompile(`(?i)\s*WHERE\s+.*?(ORDER|GROUP|HAVING|OPTION|$)`).ReplaceAllString(sql, " $1")
			sql = strings.TrimSpace(sql)
			// Clean dangling AND/OR
			sql = regexp.MustCompile(`(?i)^\s*(AND|OR)\s+`).ReplaceAllString(sql, "")
		}
	}

	log.Printf("DEBUG EXECUTE DATASET %s: %s", dataset.NamaDataset, sql)

	return s.repo.ExecuteQuery(ctx, sql, nil, userId)
}

// ExecuteDatasetQueryMulti executes a SP that returns multiple result sets (e.g. sp_LapBankHarian).
// It returns a slice where index i corresponds to the i-th result set.
func (s *SReportExecutionService) ExecuteDatasetQueryMulti(ctx context.Context, dataset *reports.SDBQueryLaporan, filters map[string]interface{}, userId string) ([][]map[string]interface{}, error) {
	sql := dataset.QuerySumberData

	// Parse config_json for static params
	staticParams := s.parseStaticParams(dataset.ConfigJSON)
	for key, value := range staticParams {
		sql = s.replacePlaceholder(sql, "@"+key, fmt.Sprintf("'%s'", s.escapeSQLString(fmt.Sprintf("%v", value))))
	}

	// Replace filter parameters
	for key, value := range filters {
		placeholder := "@" + key
		if !s.hasPlaceholder(sql, placeholder) {
			continue
		}
		sql = s.replaceFilterValue(sql, placeholder, value)
	}

	// Handle @IDUser and @UserID
	if userId != "" {
		sql = s.replacePlaceholder(sql, "@IDUser", fmt.Sprintf("'%s'", s.escapeSQLString(userId)))
		sql = s.replacePlaceholder(sql, "@UserID", fmt.Sprintf("'%s'", s.escapeSQLString(userId)))
	} else {
		sql = s.replacePlaceholder(sql, "@IDUser", "''")
		sql = s.replacePlaceholder(sql, "@UserID", "''")
	}

	// For EXEC SP queries, replace remaining placeholders with NULL
	if matched, _ := regexp.MatchString(`^\s*EXEC\s+`, sql); matched {
		sql = s.replaceRemainingPlaceholders(sql)
	}

	log.Printf("DEBUG EXECUTE DATASET MULTI %s: %s", dataset.NamaDataset, sql)

	resultSets, err := s.repo.ExecuteQueryMulti(ctx, sql)
	if err != nil {
		log.Printf("DEBUG EXECUTE MULTI ERROR %s: %v", dataset.NamaDataset, err)
		return nil, err
	}
	log.Printf("DEBUG EXECUTE MULTI RESULT %s: %d result sets", dataset.NamaDataset, len(resultSets))
	for i, rs := range resultSets {
		log.Printf("DEBUG RESULT SET %d: %d rows", i, len(rs))
		if len(rs) > 0 {
			log.Printf("DEBUG RESULT SET %d ROW 0 keys: %v", i, func() []string { keys := make([]string, 0, len(rs[0])); for k := range rs[0] { keys = append(keys, k) }; return keys }())
		}
	}
	return resultSets, nil
}

// parseStaticParams extracts static parameters from config_json
func (s *SReportExecutionService) parseStaticParams(configJSON *string) map[string]interface{} {
	if configJSON == nil || *configJSON == "" {
		return nil
	}

	var decoded map[string]interface{}
	if err := json.Unmarshal([]byte(*configJSON), &decoded); err != nil {
		return nil
	}

	// Check for nested static_params
	if staticParams, ok := decoded["static_params"].(map[string]interface{}); ok {
		return staticParams
	}

	// Flat form: top-level keys are static params
	result := make(map[string]interface{})
	for k, v := range decoded {
		if k != "display_role" && k != "config" {
			result[k] = v
		}
	}
	return result
}

// replacePlaceholder replaces a placeholder case-insensitively with word boundaries
func (s *SReportExecutionService) replacePlaceholder(sql, placeholder, replacement string) string {
	re := regexp.MustCompile(`(?i)@[A-Za-z_]\w*`)
	return re.ReplaceAllStringFunc(sql, func(match string) string {
		if strings.EqualFold(match, placeholder) {
			return replacement
		}
		return match
	})
}

// hasPlaceholder checks if a placeholder exists in the SQL
func (s *SReportExecutionService) hasPlaceholder(sql, placeholder string) bool {
	re := regexp.MustCompile(`(?i)@[A-Za-z_]\w*`)
	matches := re.FindAllString(sql, -1)
	for _, m := range matches {
		if strings.EqualFold(m, placeholder) {
			return true
		}
	}
	return false
}

// replaceFilterValue replaces a filter placeholder with proper SQL value
func (s *SReportExecutionService) replaceFilterValue(sql, placeholder string, value interface{}) string {
	switch v := value.(type) {
	case []interface{}:
		if len(v) == 0 {
			return s.replacePlaceholder(sql, placeholder, "NULL")
		}
		var parts []string
		for _, item := range v {
			if str, ok := item.(string); ok {
				parts = append(parts, fmt.Sprintf("'%s'", s.escapeSQLString(str)))
			} else {
				parts = append(parts, fmt.Sprintf("'%v'", item))
			}
		}
		return s.replacePlaceholder(sql, placeholder, strings.Join(parts, ","))
	case string:
		if v == "" {
			return s.replacePlaceholder(sql, placeholder, "NULL")
		}
		return s.replacePlaceholder(sql, placeholder, fmt.Sprintf("'%s'", s.escapeSQLString(v)))
	case nil:
		return s.replacePlaceholder(sql, placeholder, "NULL")
	default:
		return s.replacePlaceholder(sql, placeholder, fmt.Sprintf("'%v'", v))
	}
}

// replaceRemainingPlaceholders replaces all remaining @placeholders with NULL for SP calls
func (s *SReportExecutionService) replaceRemainingPlaceholders(sql string) string {
	re := regexp.MustCompile(`(?i)@[A-Za-z_]\w*`)
	return re.ReplaceAllString(sql, "NULL")
}

// escapeSQLString escapes single quotes for SQL
func (s *SReportExecutionService) escapeSQLString(str string) string {
	return strings.ReplaceAll(str, "'", "''")
}

// computeRunningBalance computes running balance for datasets with SaldoRp or SaldoAkhir columns
func (s *SReportExecutionService) computeRunningBalance(data []map[string]interface{}, datasetName string) []map[string]interface{} {
	if len(data) == 0 {
		return data
	}

	// Determine delta column
	deltaCol := ""
	if _, ok := data[0]["SaldoRp"]; ok {
		deltaCol = "SaldoRp"
	} else if _, ok := data[0]["SaldoAkhir"]; ok {
		deltaCol = "SaldoAkhir"
	}

	if deltaCol == "" {
		return data
	}

	running := 0.0
	for i := range data {
		val, err := s.parseFloat(data[i][deltaCol])
		if err == nil {
			running += val
			data[i][deltaCol] = running
		}
	}

	return data
}

// parseFloat safely parses a value as float
func (s *SReportExecutionService) parseFloat(val interface{}) (float64, error) {
	switch v := val.(type) {
	case float64:
		return v, nil
	case float32:
		return float64(v), nil
	case int:
		return float64(v), nil
	case int64:
		return float64(v), nil
	case string:
		// Remove formatting like commas
		sanitized := strings.ReplaceAll(v, ",", "")
		sanitized = strings.ReplaceAll(sanitized, " ", "")
		return strconv.ParseFloat(sanitized, 64)
	default:
		return 0, fmt.Errorf("cannot parse %T as float", val)
	}
}

// applyLabelMapping applies label mapping from dbLabelGrup to grouping fields
func (s *SReportExecutionService) applyLabelMapping(ctx context.Context, datasets map[string][]map[string]interface{}, groups []reports.SDBGroupLaporan) map[string][]map[string]interface{} {
	// Collect unique grouping fields
	fieldsToMap := make(map[string]map[string]string)
	for _, g := range groups {
		field := ""
		if g.GroupField != nil {
			field = *g.GroupField
		}
		if field == "" {
			continue
		}
		if _, exists := fieldsToMap[field]; !exists {
			mapping, err := s.repo.GetLabelMapping(ctx, field)
			if err == nil {
				fieldsToMap[field] = mapping
			}
		}
	}

	// Apply mapping to all datasets
	for datasetName := range datasets {
		for i := range datasets[datasetName] {
			for field, mapping := range fieldsToMap {
				rawKey := field
				if val, ok := datasets[datasetName][i][rawKey]; ok {
					raw := fmt.Sprintf("%v", val)
					if label, exists := mapping[raw]; exists {
						datasets[datasetName][i][field+"_label"] = label
					}
				}
			}
		}
	}

	return datasets
}

// buildGroupedData organizes flat data by grouping levels
func (s *SReportExecutionService) buildGroupedData(datasets map[string][]map[string]interface{}, groups []reports.SDBGroupLaporan, columns map[string][]reports.SDBKolomLaporan) map[string]interface{} {
	// Build label map and level fields
	labelMap := make(map[string]string)
	levelFields := make(map[int]string)
	for _, g := range groups {
		key := fmt.Sprintf("%d-%s", g.GroupLevel, s.stringPtrToStr(g.FieldValue))
		labelMap[key] = g.Label
		levelFields[g.GroupLevel] = s.stringPtrToStr(g.GroupField)
	}

	// Build grouping config (used for building hierarchical structure)
	_ = s.buildGroupingConfig(groups)

	// Determine which dataset to use (first visible one)
	firstDataset := ""
	for name, data := range datasets {
		if len(data) > 0 {
			firstDataset = name
			break
		}
	}

	if firstDataset == "" {
		return nil
	}

	data := datasets[firstDataset]
	if len(data) == 0 {
		return nil
	}

	// Get columns for this dataset
	datasetColumns := columns[firstDataset]

	// Sort data by level fields
	data = s.sortByLevelFields(data, levelFields)

	// Build hierarchical grouping
	grouped := make(map[string]interface{})
	for _, row := range data {
		l1Value := s.getFieldValue(row, levelFields[1])
		l2Value := ""
		if levelFields[2] != "" {
			l2Value = s.getFieldValue(row, levelFields[2])
		}

		// Level 1
		if _, exists := grouped[l1Value]; !exists {
			grouped[l1Value] = map[string]interface{}{
				"label":     labelMap[fmt.Sprintf("1-%s", l1Value)],
				"items":     []map[string]interface{}{},
				"subgroups": map[string]interface{}{},
				"subtotal":  make(map[string]float64),
			}
		}
		l1Group := grouped[l1Value].(map[string]interface{})

		// Level 2
		if l2Value != "" {
			if _, exists := l1Group["subgroups"].(map[string]interface{})[l2Value]; !exists {
				l1Group["subgroups"].(map[string]interface{})[l2Value] = map[string]interface{}{
					"label":    labelMap[fmt.Sprintf("2-%s", l2Value)],
					"items":    []map[string]interface{}{},
					"subtotal": make(map[string]float64),
				}
			}
			l2Group := l1Group["subgroups"].(map[string]interface{})[l2Value].(map[string]interface{})

			// Add row
			items := l2Group["items"].([]map[string]interface{})
			l2Group["items"] = append(items, row)

			// Update subtotals
			s.updateSubtotals(l2Group["subtotal"].(map[string]float64), row, datasetColumns)
		}

		// Update level 1 subtotals
		s.updateSubtotals(l1Group["subtotal"].(map[string]float64), row, datasetColumns)
	}

	return grouped
}

// sortByLevelFields sorts data by level fields
func (s *SReportExecutionService) sortByLevelFields(data []map[string]interface{}, levelFields map[int]string) []map[string]interface{} {
	// Simple bubble sort for sorting by level fields
	for i := 0; i < len(data); i++ {
		for j := i + 1; j < len(data); j++ {
			for level := 1; level <= len(levelFields); level++ {
				field := levelFields[level]
				if field == "" {
					continue
				}
				v1 := s.getFieldValue(data[i], field)
				v2 := s.getFieldValue(data[j], field)
				if v1 > v2 {
					data[i], data[j] = data[j], data[i]
					break
				} else if v1 < v2 {
					break
				}
			}
		}
	}
	return data
}

// getFieldValue safely gets a field value from a row
func (s *SReportExecutionService) getFieldValue(row map[string]interface{}, field string) string {
	if field == "" {
		return ""
	}
	val, ok := row[field]
	if !ok {
		return ""
	}
	return fmt.Sprintf("%v", val)
}

// updateSubtotals updates subtotal values for summable columns
func (s *SReportExecutionService) updateSubtotals(subtotal map[string]float64, row map[string]interface{}, columns []reports.SDBKolomLaporan) {
	for _, col := range columns {
		if !col.IsSummable || !col.IsVisible {
			continue
		}
		if val, err := s.parseFloat(row[col.NamaKolom]); err == nil {
			subtotal[col.NamaKolom] += val
		}
	}
}

// calculateGrandTotal calculates grand totals across all datasets
func (s *SReportExecutionService) calculateGrandTotal(datasets map[string][]map[string]interface{}, columns map[string][]reports.SDBKolomLaporan) map[string]interface{} {
	total := make(map[string]float64)

	for datasetName, data := range datasets {
		datasetColumns := columns[datasetName]
		for _, col := range datasetColumns {
			if !col.IsSummable || !col.IsVisible {
				continue
			}
			for _, row := range data {
				if val, err := s.parseFloat(row[col.NamaKolom]); err == nil {
					total[col.NamaKolom] += val
				}
			}
		}
	}

	// Convert to interface{}
	result := make(map[string]interface{})
	for k, v := range total {
		result[k] = v
	}
	return result
}

// buildGroupingConfig builds the grouping configuration from database config
func (s *SReportExecutionService) buildGroupingConfig(groups []reports.SDBGroupLaporan) map[string]interface{} {
	specialHandling := "default"
	var specialConfig map[string]interface{}
	var groupsData []map[string]interface{}

	for _, g := range groups {
		if g.SpecialHandling != "" && g.SpecialHandling != "default" {
			specialHandling = g.SpecialHandling
		}
		if g.ConfigJSON != nil && *g.ConfigJSON != "" {
			var cfg map[string]interface{}
			if err := json.Unmarshal([]byte(*g.ConfigJSON), &cfg); err == nil {
				specialConfig = cfg
			}
		}
		groupsData = append(groupsData, map[string]interface{}{
			"id_group":         g.IDGroup,
			"group_level":      g.GroupLevel,
			"group_field":      g.GroupField,
			"field_value":      g.FieldValue,
			"label":            g.Label,
			"sort_order":       g.SortOrder,
			"show_subtotal":    g.ShowSubtotal,
			"style_config":     g.StyleConfig,
			"special_handling": g.SpecialHandling,
			"config_json":      g.ConfigJSON,
		})
	}

	return map[string]interface{}{
		"specialHandling": specialHandling,
		"config":          specialConfig,
		"groups":          groupsData,
	}
}

// stringPtrToStr safely converts *string to string
func (s *SReportExecutionService) stringPtrToStr(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}
