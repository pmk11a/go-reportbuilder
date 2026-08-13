-- ============================================================
-- Seed Laporan KODEMENU: 03031101 - Laporan KP Per No. Bukti
-- ============================================================

-- 1. Hapus data lama untuk idemponent
DELETE FROM dbKomponenLaporan WHERE id_laporan IN (SELECT id_laporan FROM dbMasterLaporan WHERE KODEMENU = '03031101');
DELETE FROM dbQueryLaporan   WHERE id_laporan IN (SELECT id_laporan FROM dbMasterLaporan WHERE KODEMENU = '03031101');
DELETE FROM dbParameterLaporan WHERE id_laporan IN (SELECT id_laporan FROM dbMasterLaporan WHERE KODEMENU = '03031101');
DELETE FROM dbMasterLaporan  WHERE KODEMENU = '03031101';

PRINT 'Cleared existing entries for 03031101';

-- 2. Master Laporan
INSERT INTO dbMasterLaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('03031101', 'Laporan KP Per No. Bukti', 1, '[]');

PRINT 'Inserted dbMasterLaporan for 03031101';

-- 3. Query Dataset
-- SP: Sp_reportOutSoDet
-- Params: :0=Type('T'), :1=Grouping('N'/'B'/'C'), :2=FilterList
-- Dates hardcoded di SQL Delphi, perlu filter tanggal di backend
INSERT INTO dbQueryLaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_reportOutSoDet :0,:1,:2',
       '{"static_params": {"type": "T", "grouping": "N"}, "display_role": "detail", "sp_signature": "Sp_reportOutSoDet", "param_mapping": {"type": "param_type", "grouping": "param_grouping"}}'
FROM dbMasterLaporan
WHERE KODEMENU = '03031101';

PRINT 'Inserted dbQueryLaporan for 03031101';

PRINT 'Seed completed for KODEMENU 03031101';
GO
