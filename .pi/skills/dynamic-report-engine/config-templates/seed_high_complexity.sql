-- =====================================================
-- Config JSON Templates for High Complexity Reports
-- Dynamic Report Engine - SQL Seed File
-- =====================================================

-- =====================================================
-- 1. Laporan Neraca - Labels Only
-- =====================================================

-- Master Laporan
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-NERACA',
    'Laporan Neraca',
    'Neraca dengan grouping akun berdasarkan kategori',
    1,
    '{"bands":{"signature":{"enabled":true,"rows":[{"label":"Dibuat oleh:","field":null,"position":"left"},{"label":"Diperiksa oleh:","field":null,"position":"center"},{"label":"Disetujui oleh:","field":null,"position":"right"}]},"summary":{"footer_table":false,"chgb_panel":{"enabled":false}}}}'
);

-- Parameters
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-NERACA', 'Periode', 'Periode Laporan', 'date_range', 1, NULL, 1, NULL),
    ('RPT-NERACA', 'KodeCabang', 'Cabang', 'browse', 0, NULL, 2, NULL);

-- Query
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-NERACA', 'neraca_data', 1,
     'SELECT k.Kdaccount, a.NamaAkun, k.Kdgroup, g.NamaGroup FROM Akun k JOIN MasterAkun a ON k.Kdaccount=a.Kdaccount JOIN GroupAkun g ON k.Kdgroup=g.Kdgroup WHERE k.Status=''A'' ORDER BY k.Kdgroup, k.Kdaccount',
     '{"display_role":"detail","is_labels_only":true,"static_params":{}}');

-- Grouping
INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-NERACA', 1, 'Kdgroup', 'group', 'Kelompok Akun', 1, 0, 'labels-only', '{"font_weight":"bold","background":"secondary-50"}',
     '{"field_name":"Kdgroup","label_mapping":{"1":"Aset","2":"Liabilitas","3":"Ekuitas","4":"Pendapatan","5":"Beban"},"render_mode":"labels_only"}'),
    ('RPT-NERACA', 2, 'Kdaccount', 'account', 'Nama Akun', 2, 0, 'labels-only', '{"font_weight":"normal","padding_left":20}',
     '{"field_name":"Kdaccount","render_mode":"labels_only"}');

-- =====================================================
-- 2. Kartu Persediaan Multi-Level (4 Level)
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-KPML',
    'Kartu Persediaan',
    'Movement barang per warehouse, kategori, item, dan batch',
    1,
    '{"bands":{"summary":{"footer_table":true,"chgb_panel":{"enabled":false}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-KPML', 'TanggalDari', 'Tanggal Awal', 'date', 1, NULL, 1, NULL),
    ('RPT-KPML', 'TanggalSampai', 'Tanggal Akhir', 'date', 1, NULL, 2, NULL),
    ('RPT-KPML', 'KodeWarehouse', 'Gudang', 'browse', 0, NULL, 3, NULL);

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-KPML', 'kartu_data', 1,
     'SELECT w.KodeWarehouse, w.NamaWarehouse, c.KodeCategory, c.NamaCategory, i.KodeItem, i.NamaItem, b.KodeBatch, t.Tanggal, t.JenisTransaksi, t.Masuk, t.Keluar FROM transaksipersediaan t JOIN item i ON t.KodeItem=i.KodeItem JOIN category c ON i.KodeCategory=c.KodeCategory JOIN warehouse w ON t.KodeWarehouse=w.KodeWarehouse JOIN batch b ON t.KodeBatch=b.KodeBatch WHERE t.Tanggal BETWEEN @TanggalDari AND @TanggalSampai {{AND t.KodeWarehouse=@KodeWarehouse}} ORDER BY w.KodeWarehouse, c.KodeCategory, i.KodeItem, b.KodeBatch, t.Tanggal',
     '{"display_role":"detail","static_params":{"@TanggalDari":"","@TanggalSampai":"","@KodeWarehouse":""}}');

INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
VALUES
    ('RPT-KPML', 'kartu_data', 'NamaWarehouse', 'Gudang', 'text', 'left', 0, 1, 1),
    ('RPT-KPML', 'kartu_data', 'NamaCategory', 'Kategori', 'text', 'left', 0, 1, 2),
    ('RPT-KPML', 'kartu_data', 'NamaItem', 'Item', 'text', 'left', 0, 1, 3),
    ('RPT-KPML', 'kartu_data', 'KodeBatch', 'Batch', 'text', 'left', 0, 1, 4),
    ('RPT-KPML', 'kartu_data', 'Tanggal', 'Tanggal', 'date', 'center', 0, 1, 5),
    ('RPT-KPML', 'kartu_data', 'JenisTransaksi', 'Jenis', 'text', 'center', 0, 1, 6),
    ('RPT-KPML', 'kartu_data', 'Masuk', 'Masuk', 'currency', 'right', 1, 1, 7),
    ('RPT-KPML', 'kartu_data', 'Keluar', 'Keluar', 'currency', 'right', 1, 1, 8),
    ('RPT-KPML', 'kartu_data', 'Balance', 'Saldo', 'currency', 'right', 1, 1, 9);

INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-KPML', 1, 'KodeWarehouse', 'warehouse', 'Gudang', 1, 1, 'default', '{"font_weight":"bold","background":"secondary-50"}', '{"field_name":"KodeWarehouse","label_mapping":{"W01":"Gudang Utama","W02":"Gudang Cabang"},"running_total":false,"show_subtotal":true}'),
    ('RPT-KPML', 2, 'KodeCategory', 'category', 'Kategori', 2, 1, 'default', '{"font_weight":"medium","background":"blue-50"}', '{"field_name":"KodeCategory","label_mapping":{"C01":"Elektronik","C02":"Pakaian","C03":"Makanan"},"show_subtotal":true}'),
    ('RPT-KPML', 3, 'KodeItem', 'item', 'Item', 3, 1, 'default', '{"font_weight":"medium","background":"green-50"}', '{"field_name":"KodeItem","show_subtotal":true}'),
    ('RPT-KPML', 4, 'KodeBatch', 'batch', 'Batch', 4, 0, 'default', '{"font_weight":"normal","padding_left":32}', '{"field_name":"KodeBatch","show_subtotal":false}');

-- =====================================================
-- 3. Jurnal General 3 Dataset
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-JG3D',
    'Jurnal General 3 Dataset',
    'Menggabungkan 3 jenis jurnal dengan side-by-side layout',
    1,
    '{"bands":{"summary":{"footer_table":true,"chgb_panel":{"enabled":true,"rows":[{"label":"Total Debit","field":"total_debit"},{"label":"Total Kredit","field":"total_kredit"},{"label":"Selisih","field":"selisih"}]}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-JG3D', 'Periode', 'Periode', 'date_range', 1, NULL, 1, NULL),
    ('RPT-JG3D', 'Cabang', 'Cabang', 'browse', 0, NULL, 2, NULL);

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-JG3D', 'JurnalUmum', 1, 'SELECT no_jurnal, tgl_jurnal, kd_akun, nama_akun, uraian, debit, kredit FROM jurnal_um WHERE tgl_jurnal BETWEEN @PeriodeDari AND @PeriodeSampai {{AND kd_cabang=@Cabang}} ORDER BY tgl_jurnal, no_jurnal', '{"display_role":"detail","detail_layout":"side_by_side","static_params":{"@PeriodeDari":"","@PeriodeSampai":"","@Cabang":""}}'),
    ('RPT-JG3D', 'JurnalPenyesuaian', 2, 'SELECT no_jurnal, tgl_jurnal, kd_akun, nama_akun, uraian, debit, kredit FROM jurnal_penyesuaian WHERE tgl_jurnal BETWEEN @PeriodeDari AND @PeriodeSampai {{AND kd_cabang=@Cabang}} ORDER BY tgl_jurnal, no_jurnal', '{"display_role":"detail","detail_layout":"side_by_side","static_params":{"@PeriodeDari":"","@PeriodeSampai":"","@Cabang":""}}'),
    ('RPT-JG3D', 'JurnalClosure', 3, 'SELECT no_jurnal, tgl_jurnal, kd_akun, nama_akun, uraian, debit, kredit FROM jurnal_closure WHERE tgl_jurnal BETWEEN @PeriodeDari AND @PeriodeSampai {{AND kd_cabang=@Cabang}} ORDER BY tgl_jurnal, no_jurnal', '{"display_role":"detail","detail_layout":"side_by_side","static_params":{"@PeriodeDari":"","@PeriodeSampai":"","@Cabang":""}}');

-- =====================================================
-- 4. Aging dengan Running Balance
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-AGING-RB',
    'Aging Piutang - Running Balance',
    'Aging piutang dengan running balance calculation per customer',
    1,
    '{"bands":{"summary":{"footer_table":true,"chgb_panel":{"enabled":false}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-AGING-RB', 'PeriodeSampai', 'Periode Sampai', 'date', 1, NULL, 1, NULL),
    ('RPT-AGING-RB', 'CustomerGroup', 'Grup Pelanggan', 'browse', 0, NULL, 2, NULL);

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-AGING-RB', 'aging_data', 1,
     'SELECT c.KodeCustomer, c.NamaCustomer, c.Kdgroup, inv.NoInvoice, inv.Tanggal, inv.Total, inv.Saldo, DATEDIFF(@PeriodeSampai, inv.Tanggal) AS AgeDays FROM invoice inv JOIN customer c ON inv.KodeCustomer=c.KodeCustomer WHERE inv.Saldo > 0 {{AND c.Kdgroup=@CustomerGroup}} ORDER BY c.Kdgroup, c.KodeCustomer, inv.Tanggal',
     '{"display_role":"detail","static_params":{"@PeriodeSampai":"","@CustomerGroup":""},"running_balance":{"enabled":true,"balance_column":"Saldo","start_marker":"BEGIN","marker_column":"Marker","group_by":"KodeCustomer"}}');

INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
VALUES
    ('RPT-AGING-RB', 'aging_data', 'NamaCustomer', 'Pelanggan', 'text', 'left', 0, 1, 1),
    ('RPT-AGING-RB', 'aging_data', 'NoInvoice', 'No. Invoice', 'text', 'center', 0, 1, 2),
    ('RPT-AGING-RB', 'aging_data', 'Tanggal', 'Tanggal', 'date', 'center', 0, 1, 3),
    ('RPT-AGING-RB', 'aging_data', 'Total', 'Total', 'currency', 'right', 1, 1, 4),
    ('RPT-AGING-RB', 'aging_data', 'Saldo', 'Saldo', 'currency', 'right', 1, 1, 5),
    ('RPT-AGING-RB', 'aging_data', 'RunningBalance', 'Running Bal', 'currency', 'right', 0, 1, 6),
    ('RPT-AGING-RB', 'aging_data', 'AgeDays', 'Umur (Hari)', 'number', 'center', 0, 1, 7);

INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-AGING-RB', 1, 'KodeCustomer', 'customer', 'Pelanggan', 1, 1, 'running-balance', '{"font_weight":"bold","background":"secondary-50"}',
     '{"field_name":"KodeCustomer","running_total":true,"balance_column":"Saldo","show_subtotal":true,"show_running_balance":true}');

-- =====================================================
-- 5. Cash Flow dengan Footer Kompleks
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-CF-FC',
    'Cash Flow Statement',
    'Laporan arus kas dengan comparison panel dan summary',
    1,
    '{"bands":{"summary":{"footer_table":true,"rows":[{"label":"Arus Kas dari Operasi","field":"operating_cash","format":"currency"},{"label":"Arus Kas dari Investasi","field":"investing_cash","format":"currency"},{"label":"Arus Kas dari Pendanaan","field":"financing_cash","format":"currency"},{"label":"Kenaikan (Penurunan) Kas","field":"net_cash_change","format":"currency"},{"label":"Saldo Kas Awal","field":"opening_cash","format":"currency"},{"label":"Saldo Kas Akhir","field":"closing_cash","format":"currency","bold":true}],"chgb_panel":{"enabled":true,"comparison_type":"year_over_year","rows":[{"label":"Arus Kas Operasi","current_field":"operating_cash","prior_field":"operating_cash_prior"},{"label":"Arus Kas Investasi","current_field":"investing_cash","prior_field":"investing_cash_prior"},{"label":"Arus Kas Pendanaan","current_field":"financing_cash","prior_field":"financing_cash_prior"},{"label":"Selisih","current_field":"net_cash_change","prior_field":"net_cash_change_prior","highlight_diff":true}]}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-CF-FC', 'TahunLaporan', 'Tahun', 'number', 1, '2024', 1, NULL);

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-CF-FC', 'cashflow_data', 1,
     'SELECT kd_kas, nama_kas, jenis_arus, uraian, debit, kredit, saldo FROM cashflow WHERE tahun=@TahunLaporan ORDER BY jenis_arus, kd_kas',
     '{"display_role":"detail","static_params":{"@TahunLaporan":"2024"}}');

INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
VALUES
    ('RPT-CF-FC', 'cashflow_data', 'nama_kas', 'Kas', 'text', 'left', 0, 1, 1),
    ('RPT-CF-FC', 'cashflow_data', 'jenis_arus', 'Jenis Arus', 'text', 'center', 0, 1, 2),
    ('RPT-CF-FC', 'cashflow_data', 'uraian', 'Uraian', 'text', 'left', 0, 1, 3),
    ('RPT-CF-FC', 'cashflow_data', 'debit', 'Debit', 'currency', 'right', 1, 1, 4),
    ('RPT-CF-FC', 'cashflow_data', 'kredit', 'Kredit', 'currency', 'right', 1, 1, 5),
    ('RPT-CF-FC', 'cashflow_data', 'saldo', 'Saldo', 'currency', 'right', 1, 1, 6);

INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-CF-FC', 1, 'jenis_arus', 'operasi', 'Arus Operasi', 1, 1, 'default', '{"font_weight":"bold","background":"blue-50"}',
     '{"field_name":"jenis_arus","label_mapping":{"OPERASI":"Arus Kas dari Operasi","INVESTASI":"Arus Kas dari Investasi","PENDANAAN":"Arus Kas dari Pendanaan"},"show_subtotal":true}'),
    ('RPT-CF-FC', 2, 'kd_kas', 'kas', 'Kas', 2, 0, 'default', '{"font_weight":"normal"}',
     '{"field_name":"kd_kas","show_subtotal":false}');

-- =====================================================
-- 6. Konsolidasi Keuangan 3 Level
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-KONSOL3',
    'Konsolidasi Keuangan 3 Level',
    'Konsolidasi laporan keuangan per entity, division, dan department',
    1,
    '{"bands":{"summary":{"footer_table":true,"chgb_panel":{"enabled":false}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-KONSOL3', 'Tahun', 'Tahun Laporan', 'number', 1, '2024', 1, NULL),
    ('RPT-KONSOL3', 'Periode', 'Periode', 'browse', 0, NULL, 2, NULL);

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-KONSOL3', 'konsolidasi_data', 1,
     'SELECT e.KodeEntity, e.NamaEntity, d.KodeDivision, d.NamaDivision, dept.KodeDepartment, dept.NamaDepartment, a.KodeAkun, a.NamaAkun, COALESCE(s.Debit,0) AS Debit, COALESCE(s.Kredit,0) AS Kredit FROM entity e LEFT JOIN division d ON e.KodeEntity=d.KodeEntity LEFT JOIN department dept ON d.KodeDivision=dept.KodeDivision LEFT JOIN akun a ON dept.KodeAkun=a.KodeAkun LEFT JOIN saldo s ON a.KodeAkun=s.KodeAkun AND s.Tahun=@Tahun AND s.Periode=@Periode WHERE e.Status=''A'' ORDER BY e.KodeEntity, d.KodeDivision, dept.KodeDepartment, a.KodeAkun',
     '{"display_role":"detail","static_params":{"@Tahun":"2024","@Periode":"12"}}');

INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-KONSOL3', 1, 'KodeEntity', 'entity', 'Entity', 1, 1, 'default', '{"font_weight":"bold","background":"secondary-50","font_size":12}',
     '{"field_name":"KodeEntity","label_mapping":{"E01":"PT Pusat","E02":"PT Cabang Jakarta","E03":"PT Cabang Surabaya"},"show_subtotal":true}'),
    ('RPT-KONSOL3', 2, 'KodeDivision', 'division', 'Division', 2, 1, 'default', '{"font_weight":"medium","background":"blue-50"}',
     '{"field_name":"KodeDivision","show_subtotal":true}'),
    ('RPT-KONSOL3', 3, 'KodeDepartment', 'department', 'Department', 3, 0, 'default', '{"font_weight":"normal","padding_left":24}',
     '{"field_name":"KodeDepartment","show_subtotal":false}');

-- =====================================================
-- 7. Budget vs Actual
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-BVA',
    'Budget vs Actual',
    'Perbandingan anggaran vs realisasi dengan analisis varian',
    1,
    '{"bands":{"summary":{"footer_table":true,"chgb_panel":{"enabled":true,"rows":[{"label":"Total Budget","current_field":"total_budget"},{"label":"Total Actual","current_field":"total_actual"},{"label":"Variance","current_field":"variance","highlight_diff":true},{"label":"% Variance","current_field":"variance_percent","format":"percent"}]}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-BVA', 'Tahun', 'Tahun', 'number', 1, '2024', 1, NULL),
    ('RPT-BVA', 'BudgetType', 'Tipe Budget', 'dropdown', 0, 'Annual', 2, '{"options":["Annual","Quarterly","Monthly"]}');

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-BVA', 'bva_data', 1,
     'SELECT a.KodeAkun, a.NamaAkun, COALESCE(b.Budget,0) AS Budget, COALESCE(r.Realisasi,0) AS Actual FROM akun a LEFT JOIN budget b ON a.KodeAkun=b.KodeAkun AND b.Tahun=@Tahun AND b.TipeBudget=@BudgetType LEFT JOIN realisasi r ON a.KodeAkun=r.KodeAkun AND r.Tahun=@Tahun ORDER BY a.KodeAkun',
     '{"display_role":"detail","static_params":{"@Tahun":"2024","@BudgetType":"Annual"},"calculated_fields":[{"nama_kolom":"Variance","expression":"Budget - Actual","format_type":"currency"},{"nama_kolom":"VariancePercent","expression":"(Budget - Actual) / NULLIF(Budget, 0) * 100","format_type":"percent"}]}');

INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-BVA', 1, 'KodeAkun', 'account', 'Akun', 1, 0, 'conditional-format', '{"font_weight":"normal"}',
     '{"field_name":"KodeAkun","conditional_formatting":{"Variance":{"rule":"absolute","threshold":1000000,"positive_color":"green","negative_color":"red","apply_to":"cell"},"VariancePercent":{"rule":"relative","threshold":10,"over_budget_color":"red","under_budget_color":"green"}}}');

-- =====================================================
-- 8. Warehouse Movement Detail
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-WMD',
    'Warehouse Movement Detail',
    'Detail movement barang per warehouse dengan sub-total per kategori',
    1,
    '{"bands":{"summary":{"footer_table":true,"rows":[{"label":"Total Masuk","field":"total_masuk","format":"number"},{"label":"Total Keluar","field":"total_keluar","format":"number"},{"label":"Net Movement","field":"net_movement","format":"number"}],"chgb_panel":{"enabled":false}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-WMD', 'TanggalDari', 'Tanggal Dari', 'date', 1, NULL, 1, NULL),
    ('RPT-WMD', 'TanggalSampai', 'Tanggal Sampai', 'date', 1, NULL, 2, NULL),
    ('RPT-WMD', 'Warehouse', 'Warehouse', 'browse', 0, NULL, 3, NULL);

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-WMD', 'movement_data', 1,
     'SELECT w.KodeWarehouse, w.NamaWarehouse, c.KodeCategory, c.NamaCategory, i.KodeItem, i.NamaItem, t.Tanggal, t.JenisTransaksi, t.Quantity, t.Satuan FROM warehouse w JOIN category c ON w.KodeCategory=c.KodeCategory JOIN item i ON c.KodeCategory=i.KodeCategory JOIN movement t ON i.KodeItem=t.KodeItem WHERE t.Tanggal BETWEEN @TanggalDari AND @TanggalSampai {{AND t.KodeWarehouse=@Warehouse}} ORDER BY w.KodeWarehouse, c.KodeCategory, i.KodeItem, t.Tanggal',
     '{"display_role":"detail","static_params":{"@TanggalDari":"","@TanggalSampai":"","@Warehouse":""},"special_features":{"virtual_columns":[{"nama_kolom":"InOut","expression":"CASE WHEN JenisTransaksi=''IN'' THEN ''+'' ELSE ''-'' END","is_formula":true}]}}');

INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-WMD', 1, 'KodeWarehouse', 'warehouse', 'Warehouse', 1, 1, 'default', '{"font_weight":"bold","background":"secondary-50"}',
     '{"field_name":"KodeWarehouse","label_mapping":{"WH01":"Gudang Utama","WH02":"Gudang Cabang 1","WH03":"Gudang Cabang 2"},"show_subtotal":true}'),
    ('RPT-WMD', 2, 'KodeCategory', 'category', 'Kategori', 2, 1, 'default', '{"font_weight":"medium","background":"green-50","padding_left":16}',
     '{"field_name":"KodeCategory","show_subtotal":true}'),
    ('RPT-WMD', 3, 'KodeItem', 'item', 'Item', 3, 0, 'default', '{"font_weight":"normal","padding_left":32}',
     '{"field_name":"KodeItem","show_subtotal":false}');

-- =====================================================
-- 9. Multi-Currency Report
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-MC',
    'Multi-Currency Report',
    'Laporan dengan display dalam USD, EUR, dan IDR',
    1,
    '{"bands":{"summary":{"footer_table":true,"chgb_panel":{"enabled":false}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-MC', 'TanggalDari', 'Tanggal Dari', 'date', 1, NULL, 1, NULL),
    ('RPT-MC', 'TanggalSampai', 'Tanggal Sampai', 'date', 1, NULL, 2, NULL),
    ('RPT-MC', 'Currency', 'Currency Display', 'dropdown', 0, 'USD', 3, '{"options":["USD","EUR","IDR"]}');

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-MC', 'multi_curr_data', 1,
     'SELECT t.Tanggal, c.KodeCurrency, c.NamaCurrency, t.AmountOriginal, t.AmountConverted, er.Rate FROM transaksi t JOIN currency c ON t.KodeCurrency=c.KodeCurrency JOIN exchangerate er ON c.KodeCurrency=er.KodeCurrency AND er.Tanggal=t.Tanggal WHERE t.Tanggal BETWEEN @TanggalDari AND @TanggalSampai ORDER BY t.Tanggal, c.KodeCurrency',
     '{"display_role":"detail","static_params":{"@TanggalDari":"","@TanggalSampai":""},"multi_currency":{"enabled":true,"base_currency":"IDR","display_currencies":["USD","EUR","IDR"],"conversion_rates":{"USD":15000,"EUR":16500}}}');

INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-MC', 1, 'KodeCurrency', 'currency', 'Mata Uang', 1, 1, 'multi-currency', '{"font_weight":"bold","background":"purple-50"}',
     '{"field_name":"KodeCurrency","label_mapping":{"USD":"US Dollar","EUR":"Euro","IDR":"Indonesian Rupiah"},"show_subtotal":true,"currency_converted":true}');

-- =====================================================
-- 10. Hierarchical Account Report
-- =====================================================

INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, status_aktif, footer_bands)
VALUES (
    'RPT-HIER',
    'Hierarchical Chart of Accounts',
    'CoA dengan hierarki 5 level',
    1,
    '{"bands":{"summary":{"footer_table":false,"chgb_panel":{"enabled":false}}}}'
);

INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi)
VALUES
    ('RPT-HIER', 'StatusAkun', 'Status Akun', 'dropdown', 0, 'A', 1, '{"options":["A","I"]}'),
    ('RPT-HIER', 'LevelMin', 'Level Minimum', 'number', 0, 1, 2, NULL);

INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
VALUES
    ('RPT-HIER', 'coa_data', 1,
     'SELECT Kdaccount, NamaAkun, Kdgroup, Level, SaldoNormal, COALESCE(Saldo,0) AS Saldo FROM akun a LEFT JOIN saldo s ON a.Kdaccount=s.Kdaccount AND s.Tahun=@Tahun WHERE a.Level >= @LevelMin ORDER BY a.Kdaccount',
     '{"display_role":"detail","static_params":{"@Tahun":"2024"},"hierarchical":{"enabled":true,"level_field":"Level","parent_field":"Kdgroup","max_depth":5}}');

INSERT INTO dbgrouplaporan (id_laporan, group_level, group_field, field_value, label, sort_order, show_subtotal, special_handling, style_config, config_json)
VALUES
    ('RPT-HIER', 1, 'Kdaccount', 'level1', 'Level 1', 1, 0, 'hierarchical', '{"font_weight":"bold","background":"secondary-50"}',
     '{"field_name":"Kdaccount","level":1,"show_subtotal":false}'),
    ('RPT-HIER', 2, 'Kdaccount', 'level2', 'Level 2', 2, 1, 'hierarchical', '{"font_weight":"medium","background":"blue-50"}',
     '{"field_name":"Kdaccount","level":2,"show_subtotal":true}'),
    ('RPT-HIER', 3, 'Kdaccount', 'level3', 'Level 3', 3, 1, 'hierarchical', '{"font_weight":"medium","background":"green-50"}',
     '{"field_name":"Kdaccount","level":3,"show_subtotal":true}'),
    ('RPT-HIER', 4, 'Kdaccount', 'level4', 'Level 4', 4, 0, 'hierarchical', '{"font_weight":"normal","padding_left":32}',
     '{"field_name":"Kdaccount","level":4,"show_subtotal":false}'),
    ('RPT-HIER', 5, 'Kdaccount', 'level5', 'Level 5', 5, 0, 'hierarchical', '{"font_weight":"normal","padding_left":48}',
     '{"field_name":"Kdaccount","level":5,"show_subtotal":false}');
