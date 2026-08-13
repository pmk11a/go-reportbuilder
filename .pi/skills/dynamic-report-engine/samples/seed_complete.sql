-- =====================================================
-- COMPLETE SEED SCRIPT
-- Source: DBMENUREPORT → dbmasterlaporan
-- Generated: 2026-08-06 11:10:13
-- Total Reports: 70
-- =====================================================

-- =====================================================
-- DBMASTERLAPORAN SEED
-- Source: DBMENUREPORT (L0=3)
-- Generated: 2026-08-06 11:10:13
-- =====================================================

-- Update existing: 020101
UPDATE dbmasterlaporan
SET nama_laporan = 'Kas Harian',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020101';
GO

-- Update existing: 020102
UPDATE dbmasterlaporan
SET nama_laporan = 'Bank Harian',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020102';
GO

-- Update existing: 020103
UPDATE dbmasterlaporan
SET nama_laporan = 'Posisi Bank, Kas & Piutang',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020103';
GO

-- Insert new: 020106
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020106', 'Daftar Deposito', 1, '[]');
GO

-- Insert new: 020107
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020107', 'Daftar Giro diterima', 1, '[]');
GO

-- Insert new: 020108
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020108', 'Daftar Giro dibuka', 1, '[]');
GO

-- Update existing: 020109
UPDATE dbmasterlaporan
SET nama_laporan = 'Bon Sementara',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020109';
GO

-- Insert new: 020201
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020201', 'Jurnal', 1, '[]');
GO

-- Update existing: 020204
UPDATE dbmasterlaporan
SET nama_laporan = 'Biaya',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020204';
GO

-- Insert new: 020205
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020205', 'Aktiva', 1, '[]');
GO

-- Insert new: 020206
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020206', 'Biaya Penyusutan', 1, '[]');
GO

-- Update existing: 020302
UPDATE dbmasterlaporan
SET nama_laporan = 'Sisa',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020302';
GO

-- Insert new: 020303
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020303', 'Pelunasan', 1, '[]');
GO

-- Insert new: 020304
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020304', 'Saldo', 1, '[]');
GO

-- Update existing: 020305
UPDATE dbmasterlaporan
SET nama_laporan = 'Umur',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020305';
GO

-- Update existing: 020402
UPDATE dbmasterlaporan
SET nama_laporan = 'Sisa',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020402';
GO

-- Insert new: 020403
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020403', 'Pelunasan', 1, '[]');
GO

-- Insert new: 020404
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020404', 'Saldo', 1, '[]');
GO

-- Update existing: 020405
UPDATE dbmasterlaporan
SET nama_laporan = 'Umur',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020405';
GO

-- Update existing: 020406
UPDATE dbmasterlaporan
SET nama_laporan = 'Kartu Piutang Detail',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020406';
GO

-- Insert new: 020407
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020407', 'Monitoring Pembayaran Piutang', 1, '[]');
GO

-- Update existing: 020501
UPDATE dbmasterlaporan
SET nama_laporan = 'Neraca Lajur',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020501';
GO

-- Insert new: 020502
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020502', 'HPP', 1, '[]');
GO

-- Update existing: 020503
UPDATE dbmasterlaporan
SET nama_laporan = 'Laba Rugi',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020503';
GO

-- Update existing: 020504
UPDATE dbmasterlaporan
SET nama_laporan = 'Neraca',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020504';
GO

-- Insert new: 020505
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('020505', 'Laporan Neraca Penunjang', 1, '[]');
GO

-- Update existing: 020506
UPDATE dbmasterlaporan
SET nama_laporan = 'Mutasi',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020506';
GO

-- Update existing: 020507
UPDATE dbmasterlaporan
SET nama_laporan = 'Laporan Mutasi Keuangan',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '020507';
GO

-- Insert new: 025711
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('025711', 'Penerimaan ACC Per. Nobukti', 1, '[]');
GO

-- Insert new: 025712
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('025712', 'Penerimaan ACC Per Barang', 1, '[]');
GO

-- Insert new: 025713
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('025713', 'Penerimaan ACC Per Supplier', 1, '[]');
GO

-- Insert new: 025731
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('025731', 'Retur Pembelian ACC Per. Nobukti', 1, '[]');
GO

-- Insert new: 025732
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('025732', 'Retur Pembelian ACC Per Barang', 1, '[]');
GO

-- Insert new: 025733
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('025733', 'Retur Pembelian ACC Per Supplier', 1, '[]');
GO

-- Insert new: 025741
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('025741', 'Retur Pembelian GDG Per No. Bukti', 1, '[]');
GO

-- Insert new: 025743
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('025743', 'Retur Pembelian GDGPer Supplier', 1, '[]');
GO

-- Update existing: 025801
UPDATE dbmasterlaporan
SET nama_laporan = 'Transfer In Detail',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '025801';
GO

-- Update existing: 025802
UPDATE dbmasterlaporan
SET nama_laporan = 'Transfer Out Detail',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '025802';
GO

-- Update existing: 025902
UPDATE dbmasterlaporan
SET nama_laporan = 'Pembelian ACC Rekening',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '025902';
GO

-- Insert new: 030201
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030201', 'Laporan Penawaran Per No.Bukti', 1, '[]');
GO

-- Insert new: 030202
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030202', 'Laporan Penawaran Per Barang', 1, '[]');
GO

-- Insert new: 030203
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030203', 'Laporan Penawaran Per Customer', 1, '[]');
GO

-- Insert new: 030204
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030204', 'Laporan Penawaran Per Marketing', 1, '[]');
GO

-- Insert new: 030314
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030314', 'Laporan CashBack', 1, '[]');
GO

-- Insert new: 030325
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030325', 'Retur Surat Jalan', 1, '[]');
GO

-- Insert new: 030326
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030326', ' Retur Surat Jalan ACC', 1, '[]');
GO

-- Insert new: 030351
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030351', 'Laporan Target Sales', 1, '[]');
GO

-- Insert new: 030361
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030361', 'Komisi Pelunasan', 1, '[]');
GO

-- Insert new: 030362
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('030362', 'Komisi Sales', 1, '[]');
GO

-- Insert new: 040361
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040361', 'Trasfer Barang Per Nobukti', 1, '[]');
GO

-- Insert new: 040362
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040362', 'Trasfer Barang Per Barang', 1, '[]');
GO

-- Insert new: 040501
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040501', 'Laporan Ubah Kemasan Bahan Per Nobukti', 1, '[]');
GO

-- Insert new: 040502
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040502', 'Laporan Ubah Kemasan Bahan Per Barang', 1, '[]');
GO

-- Insert new: 040701
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040701', 'Laporan Opname Bahan Per Nobukti', 1, '[]');
GO

-- Insert new: 040702
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040702', 'Laporan Opname Bahan Per Barang', 1, '[]');
GO

-- Insert new: 040801
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040801', 'Laporan Opname Barang Per Nobukti', 1, '[]');
GO

-- Insert new: 040802
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040802', 'Laporan Opname Barang Per Barang', 1, '[]');
GO

-- Insert new: 040851
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040851', 'Hasil Produksi Per NObukti', 1, '[]');
GO

-- Insert new: 040852
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040852', 'Hasil Produksi Per Barang', 1, '[]');
GO

-- Insert new: 040861
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040861', 'Hasil Produksi ACC Per Nobukti', 1, '[]');
GO

-- Insert new: 040862
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('040862', 'Hasil Produksi ACC Per Barang', 1, '[]');
GO

-- Update existing: 050101
UPDATE dbmasterlaporan
SET nama_laporan = 'Stock Quantity',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '050101';
GO

-- Update existing: 050102
UPDATE dbmasterlaporan
SET nama_laporan = 'Stock Rupiah',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '050102';
GO

-- Update existing: 050103
UPDATE dbmasterlaporan
SET nama_laporan = 'Stock Qty + Rupiah',
    status_aktif = 1,
    updated_at = GETDATE()
WHERE KODEMENU = '050103';
GO

-- Insert new: 050104
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('050104', 'Stock Akhir Barang Produksi', 1, '[]');
GO

-- Insert new: 050105
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('050105', 'Stock Fisik Gudang', 1, '[]');
GO

-- Insert new: 050106
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('050106', 'Stock Harian', 1, '[]');
GO

-- Insert new: 050107
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('050107', 'Laporan Katalog Barang (Satuan PCS)', 1, '[]');
GO

-- Insert new: 050201
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('050201', 'Kartu Stock Qnt', 1, '[]');
GO

-- Insert new: 050202
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)
VALUES ('050202', 'Kartu Stock Qnt dan Rupiah', 1, '[]');
GO

-- =====================================================
-- DBQUERYLAPORAN SEED
-- Generated: 2026-08-06 11:10:13
-- =====================================================

-- Query for 020101: Sp_LapKasHarian
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapKasHarian', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapKasHarian"}'
FROM dbmasterlaporan WHERE KODEMENU = '020101';
GO

-- Query for 020102: Sp_LapBankHarian
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapBankHarian', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapBankHarian"}'
FROM dbmasterlaporan WHERE KODEMENU = '020102';
GO

-- Query for 020103: Sp_LapPosisiBankKasPiutang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPosisiBankKasPiutang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPosisiBankKasPiutang"}'
FROM dbmasterlaporan WHERE KODEMENU = '020103';
GO

-- Query for 020106: Sp_LapDaftarDeposito
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapDaftarDeposito', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapDaftarDeposito"}'
FROM dbmasterlaporan WHERE KODEMENU = '020106';
GO

-- Query for 020107: Sp_LapDaftarGiroDiterima
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapDaftarGiroDiterima', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapDaftarGiroDiterima"}'
FROM dbmasterlaporan WHERE KODEMENU = '020107';
GO

-- Query for 020108: Sp_LapDaftarGiroDibuka
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapDaftarGiroDibuka', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapDaftarGiroDibuka"}'
FROM dbmasterlaporan WHERE KODEMENU = '020108';
GO

-- Query for 020109: Sp_LapBonSementara
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapBonSementara', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapBonSementara"}'
FROM dbmasterlaporan WHERE KODEMENU = '020109';
GO

-- Query for 020201: Sp_LapJurnal
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapJurnal', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapJurnal"}'
FROM dbmasterlaporan WHERE KODEMENU = '020201';
GO

-- Query for 020204: Sp_LapBiaya
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapBiaya', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapBiaya"}'
FROM dbmasterlaporan WHERE KODEMENU = '020204';
GO

-- Query for 020205: Sp_LapAktiva
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapAktiva', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapAktiva"}'
FROM dbmasterlaporan WHERE KODEMENU = '020205';
GO

-- Query for 020206: Sp_LapBiayaPenyusutan
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapBiayaPenyusutan', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapBiayaPenyusutan"}'
FROM dbmasterlaporan WHERE KODEMENU = '020206';
GO

-- Query for 020302: Sp_LapSisaPiutang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapSisaPiutang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapSisaPiutang"}'
FROM dbmasterlaporan WHERE KODEMENU = '020302';
GO

-- Query for 020303: Sp_LapPelunasanPiutang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPelunasanPiutang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPelunasanPiutang"}'
FROM dbmasterlaporan WHERE KODEMENU = '020303';
GO

-- Query for 020304: Sp_LapSaldoPiutang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapSaldoPiutang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapSaldoPiutang"}'
FROM dbmasterlaporan WHERE KODEMENU = '020304';
GO

-- Query for 020305: Sp_LapUmurPiutang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapUmurPiutang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapUmurPiutang"}'
FROM dbmasterlaporan WHERE KODEMENU = '020305';
GO

-- Query for 020402: Sp_LapSisaPiutangDetail
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapSisaPiutangDetail', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapSisaPiutangDetail"}'
FROM dbmasterlaporan WHERE KODEMENU = '020402';
GO

-- Query for 020403: Sp_LapPelunasanPiutangDetail
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPelunasanPiutangDetail', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPelunasanPiutangDetail"}'
FROM dbmasterlaporan WHERE KODEMENU = '020403';
GO

-- Query for 020404: Sp_LapSaldoPiutangDetail
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapSaldoPiutangDetail', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapSaldoPiutangDetail"}'
FROM dbmasterlaporan WHERE KODEMENU = '020404';
GO

-- Query for 020405: Sp_LapUmurPiutangDetail
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapUmurPiutangDetail', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapUmurPiutangDetail"}'
FROM dbmasterlaporan WHERE KODEMENU = '020405';
GO

-- Query for 020406: Sp_LapKartuPiutangDetail
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapKartuPiutangDetail', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapKartuPiutangDetail"}'
FROM dbmasterlaporan WHERE KODEMENU = '020406';
GO

-- Query for 020407: Sp_LapMonitoringPembayaranPiutang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapMonitoringPembayaranPiutang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapMonitoringPembayaranPiutang"}'
FROM dbmasterlaporan WHERE KODEMENU = '020407';
GO

-- Query for 020501: Sp_LapNeracaLajur
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapNeracaLajur', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapNeracaLajur"}'
FROM dbmasterlaporan WHERE KODEMENU = '020501';
GO

-- Query for 020502: Sp_LapHPP
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapHPP', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapHPP"}'
FROM dbmasterlaporan WHERE KODEMENU = '020502';
GO

-- Query for 020503: Sp_LapLabaRugi
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapLabaRugi', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapLabaRugi"}'
FROM dbmasterlaporan WHERE KODEMENU = '020503';
GO

-- Query for 020504: Sp_LapNeraca
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapNeraca', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapNeraca"}'
FROM dbmasterlaporan WHERE KODEMENU = '020504';
GO

-- Query for 020505: Sp_LapNeracaPenunjang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapNeracaPenunjang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapNeracaPenunjang"}'
FROM dbmasterlaporan WHERE KODEMENU = '020505';
GO

-- Query for 020506: Sp_LapMutasi
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapMutasi', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapMutasi"}'
FROM dbmasterlaporan WHERE KODEMENU = '020506';
GO

-- Query for 020507: Sp_LapMutasiKeuangan
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapMutasiKeuangan', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapMutasiKeuangan"}'
FROM dbmasterlaporan WHERE KODEMENU = '020507';
GO

-- Query for 025711: Sp_LapPenerimaanACCPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPenerimaanACCPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPenerimaanACCPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '025711';
GO

-- Query for 025712: Sp_LapPenerimaanACCPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPenerimaanACCPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPenerimaanACCPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '025712';
GO

-- Query for 025713: Sp_LapPenerimaanACCPerSupplier
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPenerimaanACCPerSupplier', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPenerimaanACCPerSupplier"}'
FROM dbmasterlaporan WHERE KODEMENU = '025713';
GO

-- Query for 025731: Sp_LapReturPembelianACCPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapReturPembelianACCPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapReturPembelianACCPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '025731';
GO

-- Query for 025732: Sp_LapReturPembelianACCPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapReturPembelianACCPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapReturPembelianACCPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '025732';
GO

-- Query for 025733: Sp_LapReturPembelianACCPerSupplier
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapReturPembelianACCPerSupplier', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapReturPembelianACCPerSupplier"}'
FROM dbmasterlaporan WHERE KODEMENU = '025733';
GO

-- Query for 025741: Sp_LapReturPembelianGDGPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapReturPembelianGDGPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapReturPembelianGDGPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '025741';
GO

-- Query for 025743: Sp_LapReturPembelianGDGPerSupplier
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapReturPembelianGDGPerSupplier', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapReturPembelianGDGPerSupplier"}'
FROM dbmasterlaporan WHERE KODEMENU = '025743';
GO

-- Query for 025801: Sp_LapTransferInDetail
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapTransferInDetail', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapTransferInDetail"}'
FROM dbmasterlaporan WHERE KODEMENU = '025801';
GO

-- Query for 025802: Sp_LapTransferOutDetail
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapTransferOutDetail', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapTransferOutDetail"}'
FROM dbmasterlaporan WHERE KODEMENU = '025802';
GO

-- Query for 025902: Sp_LapPembelianACCRekening
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPembelianACCRekening', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPembelianACCRekening"}'
FROM dbmasterlaporan WHERE KODEMENU = '025902';
GO

-- Query for 030201: Sp_LapPenawaranPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPenawaranPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPenawaranPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '030201';
GO

-- Query for 030202: Sp_LapPenawaranPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPenawaranPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPenawaranPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '030202';
GO

-- Query for 030203: Sp_LapPenawaranPerCustomer
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPenawaranPerCustomer', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPenawaranPerCustomer"}'
FROM dbmasterlaporan WHERE KODEMENU = '030203';
GO

-- Query for 030204: Sp_LapPenawaranPerMarketing
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapPenawaranPerMarketing', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapPenawaranPerMarketing"}'
FROM dbmasterlaporan WHERE KODEMENU = '030204';
GO

-- Query for 030314: Sp_LapCashBack
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapCashBack', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapCashBack"}'
FROM dbmasterlaporan WHERE KODEMENU = '030314';
GO

-- Query for 030325: Sp_LapReturSuratJalan
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapReturSuratJalan', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapReturSuratJalan"}'
FROM dbmasterlaporan WHERE KODEMENU = '030325';
GO

-- Query for 030326: Sp_LapReturSuratJalanACC
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapReturSuratJalanACC', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapReturSuratJalanACC"}'
FROM dbmasterlaporan WHERE KODEMENU = '030326';
GO

-- Query for 030351: Sp_LapTargetSales
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapTargetSales', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapTargetSales"}'
FROM dbmasterlaporan WHERE KODEMENU = '030351';
GO

-- Query for 030361: Sp_LapKomisiPelunasan
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapKomisiPelunasan', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapKomisiPelunasan"}'
FROM dbmasterlaporan WHERE KODEMENU = '030361';
GO

-- Query for 030362: Sp_LapKomisiSales
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapKomisiSales', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapKomisiSales"}'
FROM dbmasterlaporan WHERE KODEMENU = '030362';
GO

-- Query for 040361: Sp_LapTransferBarangPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapTransferBarangPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapTransferBarangPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '040361';
GO

-- Query for 040362: Sp_LapTransferBarangPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapTransferBarangPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapTransferBarangPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '040362';
GO

-- Query for 040501: Sp_LapUbahKemasanBahanPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapUbahKemasanBahanPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapUbahKemasanBahanPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '040501';
GO

-- Query for 040502: Sp_LapUbahKemasanBahanPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapUbahKemasanBahanPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapUbahKemasanBahanPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '040502';
GO

-- Query for 040701: Sp_LapOpnameBahanPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapOpnameBahanPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapOpnameBahanPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '040701';
GO

-- Query for 040702: Sp_LapOpnameBahanPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapOpnameBahanPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapOpnameBahanPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '040702';
GO

-- Query for 040801: Sp_LapOpnameBarangPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapOpnameBarangPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapOpnameBarangPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '040801';
GO

-- Query for 040802: Sp_LapOpnameBarangPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapOpnameBarangPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapOpnameBarangPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '040802';
GO

-- Query for 040851: Sp_LapHasilProduksiPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapHasilProduksiPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapHasilProduksiPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '040851';
GO

-- Query for 040852: Sp_LapHasilProduksiPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapHasilProduksiPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapHasilProduksiPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '040852';
GO

-- Query for 040861: Sp_LapHasilProduksiACCPerNobukti
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapHasilProduksiACCPerNobukti', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapHasilProduksiACCPerNobukti"}'
FROM dbmasterlaporan WHERE KODEMENU = '040861';
GO

-- Query for 040862: Sp_LapHasilProduksiACCPerBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapHasilProduksiACCPerBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapHasilProduksiACCPerBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '040862';
GO

-- Query for 050101: Sp_LapStockQuantity
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapStockQuantity', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapStockQuantity"}'
FROM dbmasterlaporan WHERE KODEMENU = '050101';
GO

-- Query for 050102: Sp_LapStockRupiah
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapStockRupiah', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapStockRupiah"}'
FROM dbmasterlaporan WHERE KODEMENU = '050102';
GO

-- Query for 050103: Sp_LapStockQtyRupiah
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapStockQtyRupiah', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapStockQtyRupiah"}'
FROM dbmasterlaporan WHERE KODEMENU = '050103';
GO

-- Query for 050104: Sp_LapStockAkhirBarangProduksi
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapStockAkhirBarangProduksi', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapStockAkhirBarangProduksi"}'
FROM dbmasterlaporan WHERE KODEMENU = '050104';
GO

-- Query for 050105: Sp_LapStockFisikGudang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapStockFisikGudang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapStockFisikGudang"}'
FROM dbmasterlaporan WHERE KODEMENU = '050105';
GO

-- Query for 050106: Sp_LapStockHarian
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapStockHarian', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapStockHarian"}'
FROM dbmasterlaporan WHERE KODEMENU = '050106';
GO

-- Query for 050107: Sp_LapKatalogBarang
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapKatalogBarang', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapKatalogBarang"}'
FROM dbmasterlaporan WHERE KODEMENU = '050107';
GO

-- Query for 050201: Sp_LapKartuStockQnt
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapKartuStockQnt', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapKartuStockQnt"}'
FROM dbmasterlaporan WHERE KODEMENU = '050201';
GO

-- Query for 050202: Sp_LapKartuStockQntRupiah
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)
SELECT id_laporan, 'dataset_utama', 1, 'EXEC Sp_LapKartuStockQntRupiah', '{"static_params": {}, "display_role": "detail", "sp_signature": "Sp_LapKartuStockQntRupiah"}'
FROM dbmasterlaporan WHERE KODEMENU = '050202';
GO

-- =====================================================
-- DBPARAMETERLAPORAN SEED
-- Generated: 2026-08-06 11:10:13
-- =====================================================

-- =====================================================
-- DBKOLOMLAPORAN SEED
-- Note: Columns are templates, needs manual refinement
-- Generated: 2026-08-06 11:10:13
-- =====================================================

-- Column for 020101: Tanggal
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Tanggal', 'Tanggal', 'date', 'center', 0, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020101';
GO

-- Column for 020101: NoBukti
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'NoBukti', 'No. Bukti', 'text', 'left', 0, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020101';
GO

-- Column for 020101: Keterangan
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Keterangan', 'Keterangan', 'text', 'left', 0, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020101';
GO

-- Column for 020101: Debit
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Debit', 'Debit', 'currency', 'right', 1, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020101';
GO

-- Column for 020101: Kredit
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Kredit', 'Kredit', 'currency', 'right', 1, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020101';
GO

-- Column for 020101: Saldo
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Saldo', 'Saldo', 'currency', 'right', 1, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020101';
GO

-- Column for 020102: Tanggal
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Tanggal', 'Tanggal', 'date', 'center', 0, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020102';
GO

-- Column for 020102: NoBukti
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'NoBukti', 'No. Bukti', 'text', 'left', 0, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020102';
GO

-- Column for 020102: Perkiraan
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Perkiraan', 'Perkiraan', 'text', 'left', 0, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020102';
GO

-- Column for 020102: Debit
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Debit', 'Debit', 'currency', 'right', 1, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020102';
GO

-- Column for 020102: Kredit
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Kredit', 'Kredit', 'currency', 'right', 1, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020102';
GO

-- Column for 020102: Saldo
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)
SELECT id_laporan, 'dataset_utama', 'Saldo', 'Saldo', 'currency', 'right', 1, 1, 1
FROM dbmasterlaporan WHERE KODEMENU = '020102';
GO

-- WARNING: No column template for Sp_LapPosisiBankKasPiutang (020103)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapDaftarDeposito (020106)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapDaftarGiroDiterima (020107)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapDaftarGiroDibuka (020108)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapBonSementara (020109)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapJurnal (020201)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapBiaya (020204)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapAktiva (020205)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapBiayaPenyusutan (020206)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapSisaPiutang (020302)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPelunasanPiutang (020303)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapSaldoPiutang (020304)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapUmurPiutang (020305)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapSisaPiutangDetail (020402)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPelunasanPiutangDetail (020403)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapSaldoPiutangDetail (020404)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapUmurPiutangDetail (020405)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapKartuPiutangDetail (020406)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapMonitoringPembayaranPiutang (020407)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapNeracaLajur (020501)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapHPP (020502)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapLabaRugi (020503)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapNeraca (020504)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapNeracaPenunjang (020505)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapMutasi (020506)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapMutasiKeuangan (020507)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPenerimaanACCPerNobukti (025711)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPenerimaanACCPerBarang (025712)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPenerimaanACCPerSupplier (025713)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapReturPembelianACCPerNobukti (025731)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapReturPembelianACCPerBarang (025732)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapReturPembelianACCPerSupplier (025733)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapReturPembelianGDGPerNobukti (025741)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapReturPembelianGDGPerSupplier (025743)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapTransferInDetail (025801)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapTransferOutDetail (025802)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPembelianACCRekening (025902)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPenawaranPerNobukti (030201)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPenawaranPerBarang (030202)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPenawaranPerCustomer (030203)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapPenawaranPerMarketing (030204)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapCashBack (030314)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapReturSuratJalan (030325)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapReturSuratJalanACC (030326)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapTargetSales (030351)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapKomisiPelunasan (030361)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapKomisiSales (030362)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapTransferBarangPerNobukti (040361)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapTransferBarangPerBarang (040362)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapUbahKemasanBahanPerNobukti (040501)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapUbahKemasanBahanPerBarang (040502)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapOpnameBahanPerNobukti (040701)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapOpnameBahanPerBarang (040702)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapOpnameBarangPerNobukti (040801)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapOpnameBarangPerBarang (040802)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapHasilProduksiPerNobukti (040851)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapHasilProduksiPerBarang (040852)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapHasilProduksiACCPerNobukti (040861)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapHasilProduksiACCPerBarang (040862)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapStockQuantity (050101)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapStockRupiah (050102)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapStockQtyRupiah (050103)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapStockAkhirBarangProduksi (050104)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapStockFisikGudang (050105)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapStockHarian (050106)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapKatalogBarang (050107)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapKartuStockQnt (050201)
-- Manual mapping required
GO

-- WARNING: No column template for Sp_LapKartuStockQntRupiah (050202)
-- Manual mapping required
GO

-- =====================================================
-- END OF SEED
-- =====================================================