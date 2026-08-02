package execution

import (
	"context"

	"github.com/masza1/dapen-backend/internal/features/reports"
	"gorm.io/gorm"
)

// ReportExecutionRepository implements IReportExecutionRepository for report execution
type ReportExecutionRepository struct {
	db *gorm.DB
}

// NewReportExecutionRepository constructs the report execution repository
func NewReportExecutionRepository(db *gorm.DB) IReportExecutionRepository {
	return &ReportExecutionRepository{db: db}
}

func (r *ReportExecutionRepository) GetReportByKodeMenu(ctx context.Context, kodeMenu string) (*reports.SDBMasterLaporan, error) {
	var report reports.SDBMasterLaporan
	err := r.db.WithContext(ctx).Raw(`
		SELECT m.[id_laporan], m.[KODEMENU], m.[nama_laporan], m.[deskripsi],
			   m.[status_aktif], m.[footer_bands], m.[created_at], m.[updated_at],
			   menu.[Keterangan], menu.[L0]
		FROM dbmasterlaporan m
		LEFT JOIN DBMENUREPORT menu ON menu.[KODEMENU] = m.[KODEMENU]
		WHERE m.[KODEMENU] = ? AND m.[status_aktif] = 1`, kodeMenu).Scan(&report).Error

	if err != nil {
		return nil, err
	}
	if report.IDLaporan == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &report, nil
}

func (r *ReportExecutionRepository) GetFilters(ctx context.Context, idLaporan int) ([]reports.SDBParameterLaporan, error) {
	var filters []reports.SDBParameterLaporan
	err := r.db.WithContext(ctx).
		Where("[id_laporan] = ?", idLaporan).
		Order("[posisi] ASC").
		Find(&filters).Error
	return filters, err
}

func (r *ReportExecutionRepository) GetDatasets(ctx context.Context, idLaporan int) ([]reports.SDBQueryLaporan, error) {
	var datasets []reports.SDBQueryLaporan
	err := r.db.WithContext(ctx).
		Where("[id_laporan] = ?", idLaporan).
		Order("[urutan] ASC").
		Find(&datasets).Error
	return datasets, err
}

func (r *ReportExecutionRepository) GetAllColumns(ctx context.Context, idLaporan int) (map[string][]reports.SDBKolomLaporan, error) {
	var columns []reports.SDBKolomLaporan
	err := r.db.WithContext(ctx).
		Where("[id_laporan] = ?", idLaporan).
		Order("[nama_dataset] ASC, [urutan_tampil] ASC").
		Find(&columns).Error

	if err != nil {
		return nil, err
	}

	result := make(map[string][]reports.SDBKolomLaporan)
	for _, col := range columns {
		result[col.NamaDataset] = append(result[col.NamaDataset], col)
	}
	return result, nil
}

func (r *ReportExecutionRepository) GetGroups(ctx context.Context, idLaporan int) ([]reports.SDBGroupLaporan, error) {
	var groups []reports.SDBGroupLaporan
	err := r.db.WithContext(ctx).
		Where("[id_laporan] = ?", idLaporan).
		Order("[group_level] ASC, [sort_order] ASC").
		Find(&groups).Error
	return groups, err
}

func (r *ReportExecutionRepository) ExecuteQuery(ctx context.Context, sql string, filters map[string]interface{}, userId string) ([]map[string]interface{}, error) {
	results := make([]map[string]interface{}, 0)
	err := r.db.WithContext(ctx).Raw(sql).Scan(&results).Error
	
	if err == nil {
		for i := range results {
			for key, value := range results[i] {
				if bVal, ok := value.([]byte); ok {
					results[i][key] = string(bVal)
				}
			}
		}
	}
	
	return results, err
}

func (r *ReportExecutionRepository) GetLabelMapping(ctx context.Context, field string) (map[string]string, error) {
	var labels []reports.SLabelGrup
	err := r.db.WithContext(ctx).
		Where("[field_name] = ?", field).
		Find(&labels).Error

	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, l := range labels {
		result[l.FieldValue] = l.Label
	}
	return result, nil
}
