-- ==========================================================
-- COMPLETE MIGRASI 20 LAPORAN - DENGAN KOLOM
-- Database: dbbcagroup (SQL Server)
-- Generated: 2026-08-02 12:48:06
-- ==========================================================


======================================================================
-- LAPORAN: 01298 - Daftar Pelanggan
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '01298';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('01298', 'Daftar Pelanggan', 'master report - Daftar Pelanggan', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '01298');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'SELECT * FROM vwBrowsCust', 'Dataset utama dari view', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '01298');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '01298');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
GO

PRINT 'Created report: 01298 - Daftar Pelanggan';
GO


======================================================================
-- LAPORAN: 01304 - Daftar Valas
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '01304';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('01304', 'Daftar Valas', 'master report - Daftar Valas', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '01304');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'SELECT * FROM vwValas', 'Dataset utama dari view', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '01304');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '01304');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Bulan', 'Bulan', 'month', 1, '', 1, NULL),
    (@IdLap, 'Tahun', 'Tahun', 'year', 1, '', 2, NULL),
    (@IdLap, 'Devisi', 'Divisi', 'browse', 0, '', 3, '{"kode_browse":"1004"}');
GO

PRINT 'Created report: 01304 - Daftar Valas';
GO


======================================================================
-- LAPORAN: 020101 - Kas Harian
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020101';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020101', 'Kas Harian', 'transaction report - Kas Harian', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020101');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_LapKasHarian @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020101');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'NAMA', 'NAMA', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'tanggal', 'tanggal', 2, 'date', 'left', 0, 1),
    (@IdLap, 'QuView', 'nobukti', 'nobukti', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Keterangan', 'Keterangan', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'lawan', 'lawan', 5, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'kredit', 'kredit', 6, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'debet', 'debet', 7, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'kredit2', 'kredit2', 8, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Debet2', 'Debet2', 9, 'currency', 'right', 1, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020101');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'TanggalAwal', 'Tanggal Awal', 'date', 1, '', 1, NULL),
    (@IdLap, 'TanggalAkhir', 'Tanggal Akhir', 'date', 1, '', 1, NULL),
    (@IdLap, 'Devisi', 'Divisi', 'browse', 0, '', 2, '{"kode_browse":"1004"}');
GO

PRINT 'Created report: 020101 - Kas Harian';
GO


======================================================================
-- LAPORAN: 020102 - Bank Harian
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020102';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020102', 'Bank Harian', 'transaction report - Bank Harian', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020102');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_LapBankHarian @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020102');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'Perkiraan', 'Perkiraan', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Tanggal', 'Tanggal', 2, 'date', 'left', 0, 1),
    (@IdLap, 'QuView', 'NoBukti', 'NoBukti', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Keterangan', 'Keterangan', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'lawan', 'lawan', 5, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SaldoUS', 'SaldoUS', 6, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'CHGB', 'CHGB', 7, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SaldoRp', 'SaldoRp', 8, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'SaldoTotalRp', 'SaldoTotalRp', 9, 'currency', 'right', 1, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020102');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'TanggalAwal', 'Tanggal Awal', 'date', 1, '', 1, NULL),
    (@IdLap, 'TanggalAkhir', 'Tanggal Akhir', 'date', 1, '', 1, NULL),
    (@IdLap, 'Devisi', 'Divisi', 'browse', 0, '', 2, '{"kode_browse":"1004"}');
GO

PRINT 'Created report: 020102 - Bank Harian';
GO


======================================================================
-- LAPORAN: 020103 - Posisi Bank, Kas & Piutang
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020103';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020103', 'Posisi Bank, Kas & Piutang', 'summary report - Posisi Bank, Kas & Piutang', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020103');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_LapPosisiBankKasHarian @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020103');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'LOGO', 'LOGO', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Keterangan', 'Keterangan', 2, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'JumlahRp', 'JumlahRp', 3, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'JumlahD', 'JumlahD', 4, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Valas', 'Valas', 5, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Kurs', 'Kurs', 6, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020103');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020103 - Posisi Bank, Kas & Piutang';
GO


======================================================================
-- LAPORAN: 020109 - Bon Sementara
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020109';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020109', 'Bon Sementara', 'transaction report - Bon Sementara', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020109');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC sp_ReportBon @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020109');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'LOGO', 'LOGO', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'debet', 'debet', 2, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'kredit', 'kredit', 3, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'nobukti', 'nobukti', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'tanggal', 'tanggal', 5, 'date', 'left', 0, 1),
    (@IdLap, 'QuView', 'penerima', 'penerima', 6, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'keterangan', 'keterangan', 7, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020109');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'TanggalAwal', 'Tanggal Awal', 'date', 1, '', 1, NULL),
    (@IdLap, 'TanggalAkhir', 'Tanggal Akhir', 'date', 1, '', 1, NULL),
    (@IdLap, 'Devisi', 'Divisi', 'browse', 0, '', 2, '{"kode_browse":"1004"}');
GO

PRINT 'Created report: 020109 - Bon Sementara';
GO


======================================================================
-- LAPORAN: 020204 - Biaya
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020204';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020204', 'Biaya', 'summary report - Biaya', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020204');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_LapBiaya @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020204');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'keterangan', 'keterangan', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'BulanKini', 'BulanKini', 2, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'BulanLalu', 'BulanLalu', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'sdBulanini', 'sdBulanini', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'perkiraan', 'perkiraan', 5, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020204');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020204 - Biaya';
GO


======================================================================
-- LAPORAN: 020301 - Kartu
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020301';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020301', 'Kartu', 'ledger report - Kartu', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020301');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_ReportKartuHutang @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020301');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'NoBukti', 'NoBukti', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'kredit1', 'kredit1', 2, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Tanggal', 'Tanggal', 3, 'date', 'left', 0, 1),
    (@IdLap, 'QuView', 'NoFaktur', 'NoFaktur', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'debet1', 'debet1', 5, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'NoRetur', 'NoRetur', 6, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SelisihKurs', 'SelisihKurs', 7, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'NoPO', 'NoPO', 8, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020301');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020301 - Kartu';
GO


======================================================================
-- LAPORAN: 020302 - Sisa
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020302';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020302', 'Sisa', 'aging report - Sisa', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020302');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_ReportSisaHutang @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020302');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'Terbayar', 'Terbayar', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Nofaktur', 'Nofaktur', 2, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Jumlah', 'Jumlah', 3, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'sisa', 'sisa', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'JatuhTempo', 'JatuhTempo', 5, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020302');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020302 - Sisa';
GO


======================================================================
-- LAPORAN: 020305 - Umur
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020305';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020305', 'Umur', 'aging report - Umur', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020305');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC sp_ReportUmurHutang @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020305');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'Saldo30', 'Saldo30', 1, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'tanggal', 'tanggal', 2, 'date', 'left', 0, 1),
    (@IdLap, 'QuView', 'Nofaktur', 'Nofaktur', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Saldo', 'Saldo', 4, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Saldo60', 'Saldo60', 5, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Saldo90', 'Saldo90', 6, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Saldo120', 'Saldo120', 7, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Saldo121', 'Saldo121', 8, 'currency', 'right', 1, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020305');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020305 - Umur';
GO


======================================================================
-- LAPORAN: 020401 - Kartu
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020401';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020401', 'Kartu', 'ledger report - Kartu', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020401');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_ReportKartuPiutang @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020401');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'NoBukti', 'NoBukti', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'kredit1', 'kredit1', 2, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Tanggal', 'Tanggal', 3, 'date', 'left', 0, 1),
    (@IdLap, 'QuView', 'NoFaktur', 'NoFaktur', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'debet1', 'debet1', 5, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'NoRetur', 'NoRetur', 6, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SelisihKurs', 'SelisihKurs', 7, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020401');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020401 - Kartu';
GO


======================================================================
-- LAPORAN: 020402 - Sisa
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020402';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020402', 'Sisa', 'aging report - Sisa', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020402');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_ReportSisaPiutang @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020402');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'Terbayar', 'Terbayar', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Jumlah', 'Jumlah', 2, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'JatuhTempo', 'JatuhTempo', 3, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020402');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020402 - Sisa';
GO


======================================================================
-- LAPORAN: 020405 - Umur
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020405';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020405', 'Umur', 'aging report - Umur', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020405');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC sp_ReportUmurPiutang @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020405');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'Saldo30', 'Saldo30', 1, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'tanggal', 'tanggal', 2, 'date', 'left', 0, 1),
    (@IdLap, 'QuView', 'Nofaktur', 'Nofaktur', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Saldo', 'Saldo', 4, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Saldo60', 'Saldo60', 5, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Saldo90', 'Saldo90', 6, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Saldo120', 'Saldo120', 7, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Saldo121', 'Saldo121', 8, 'currency', 'right', 1, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020405');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020405 - Umur';
GO


======================================================================
-- LAPORAN: 020501 - Neraca Lajur
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020501';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020501', 'Neraca Lajur', 'financial report - Neraca Lajur', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020501');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC sp_NerajaLajur @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020501');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'keterangan', 'keterangan', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SaldoAwD', 'SaldoAwD', 2, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'SaldoAwk', 'SaldoAwk', 3, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'Perkiraan', 'Perkiraan', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'MD', 'MD', 5, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'MK', 'MK', 6, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'JPD', 'JPD', 7, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'JPK', 'JPK', 8, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'RLD', 'RLD', 9, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'RLK', 'RLK', 10, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SaldoAkD', 'SaldoAkD', 11, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'SaldoAkK', 'SaldoAkK', 12, 'currency', 'right', 1, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020501');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Bulan', 'Bulan', 'month', 1, '', 1, NULL),
    (@IdLap, 'Tahun', 'Tahun', 'year', 1, '', 2, NULL),
    (@IdLap, 'Devisi', 'Divisi', 'browse', 0, '', 3, '{"kode_browse":"1004"}');
GO

PRINT 'Created report: 020501 - Neraca Lajur';
GO


======================================================================
-- LAPORAN: 020503 - Laba Rugi
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020503';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020503', 'Laba Rugi', 'financial report - Laba Rugi', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020503');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC sp_ReportLabaRugi @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020503');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'keterangan', 'keterangan', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'P1', 'P1', 2, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'P2', 'P2', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'P3', 'P3', 4, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020503');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Bulan', 'Bulan', 'month', 1, '', 1, NULL),
    (@IdLap, 'Tahun', 'Tahun', 'year', 1, '', 2, NULL),
    (@IdLap, 'Devisi', 'Divisi', 'browse', 0, '', 3, '{"kode_browse":"1004"}');
GO

PRINT 'Created report: 020503 - Laba Rugi';
GO


======================================================================
-- LAPORAN: 020504 - Neraca
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020504';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020504', 'Neraca', 'financial report - Neraca', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020504');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC sp_ReportNeracaAktiva @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020504');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020504');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Bulan', 'Bulan', 'month', 1, '', 1, NULL),
    (@IdLap, 'Tahun', 'Tahun', 'year', 1, '', 2, NULL),
    (@IdLap, 'Devisi', 'Divisi', 'browse', 0, '', 3, '{"kode_browse":"1004"}');
GO

PRINT 'Created report: 020504 - Neraca';
GO


======================================================================
-- LAPORAN: 020506 - Mutasi
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '020506';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('020506', 'Mutasi', 'summary report - Mutasi', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020506');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_ReportMutasi @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020506');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'Keterangan', 'Keterangan', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'MK', 'MK', 2, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Perkiraan', 'Perkiraan', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'MD', 'MD', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SaldoAwal', 'SaldoAwal', 5, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'JPK', 'JPK', 6, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'JPD', 'JPD', 7, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '020506');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 020506 - Mutasi';
GO


======================================================================
-- LAPORAN: 050101 - Stock Quantity
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '050101';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('050101', 'Stock Quantity', 'inventory report - Stock Quantity', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050101');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_reportStockQtyRp @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050101');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'KodeBrg', 'KodeBrg', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'KODEGDG', 'KODEGDG', 2, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qntpbl', 'qntpbl', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qntrpj', 'qntrpj', 4, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'qntadi', 'qntadi', 5, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qnttri', 'qnttri', 6, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTPNJ', 'QNTPNJ', 7, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTPMK', 'QNTPMK', 8, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qntado', 'qntado', 9, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qnttro', 'qnttro', 10, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SALDOQNT', 'SALDOQNT', 11, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'QNTAWAL', 'QNTAWAL', 12, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'NamaBrg', 'NamaBrg', 13, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Satuan', 'Satuan', 14, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QntHPrd', 'QntHPrd', 15, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050101');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 050101 - Stock Quantity';
GO


======================================================================
-- LAPORAN: 050102 - Stock Rupiah
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '050102';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('050102', 'Stock Rupiah', 'inventory report - Stock Rupiah', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050102');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_reportStockQtyRp @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050102');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'NAMA', 'NAMA', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'KodeBrg', 'KodeBrg', 2, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'KODEGDG', 'KODEGDG', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGPBL', 'HRGPBL', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGRPJ', 'HRGRPJ', 5, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'HRGADI', 'HRGADI', 6, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGTRI', 'HRGTRI', 7, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGPNJ', 'HRGPNJ', 8, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGPMK', 'HRGPMK', 9, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGRPB', 'HRGRPB', 10, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'HRGADO', 'HRGADO', 11, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGTRO', 'HRGTRO', 12, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SALDORP', 'SALDORP', 13, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'HRGAWAL', 'HRGAWAL', 14, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'NamaBrg', 'NamaBrg', 15, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'Satuan', 'Satuan', 16, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGRPK', 'HRGRPK', 17, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'HRGHPrd', 'HRGHPrd', 18, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050102');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 050102 - Stock Rupiah';
GO


======================================================================
-- LAPORAN: 050103 - Stock Qty + Rupiah
======================================================================

-- 1. dbmasterlaporan
DELETE FROM dbmasterlaporan WHERE KODEMENU = '050103';
INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, deskripsi, query_sumber_data, status_aktif, footer_bands)
VALUES ('050103', 'Stock Qty + Rupiah', 'inventory report - Stock Qty + Rupiah', NULL, 1, NULL);
GO

-- 2. dbquerylaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050103');
DELETE FROM dbquerylaporan WHERE id_laporan = @IdLap;
INSERT INTO dbquerylaporan (id_laporan, nama_dataset, query_sumber_data, deskripsi, urutan, visible, config_json) VALUES
    (@IdLap, 'QuView', 'EXEC Sp_reportStockQtyRp @Param1, @Param2', 'Dataset dari stored procedure', 1, 1, '{"display_role":"detail"}');
GO

-- 3. dbkolomlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050103');
DELETE FROM dbkolomlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, urutan_tampil, format_type, alignment, is_summable, is_visible) VALUES
    (@IdLap, 'QuView', 'KODEBRG', 'KODEBRG', 1, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTRPJ', 'QNTRPJ', 2, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'QNTADI', 'QNTADI', 3, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTTRI', 'QNTTRI', 4, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTPNJ', 'QNTPNJ', 5, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTRBP', 'QNTRBP', 6, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTADO', 'QNTADO', 7, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SALDOQNT', 'SALDOQNT', 8, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'QNTPBL', 'QNTPBL', 9, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTAWAL', 'QNTAWAL', 10, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGAWAL', 'HRGAWAL', 11, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGPBL', 'HRGPBL', 12, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGRPJ', 'HRGRPJ', 13, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'HRGADI', 'HRGADI', 14, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGTRI', 'HRGTRI', 15, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTRPK', 'QNTRPK', 16, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'HRGRPK', 'HRGRPK', 17, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'HRGPNJ', 'HRGPNJ', 18, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGADO', 'HRGADO', 19, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTTRO', 'QNTTRO', 20, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGTRO', 'HRGTRO', 21, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QNTPMK', 'QNTPMK', 22, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGPMK', 'HRGPMK', 23, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'SALDORP', 'SALDORP', 24, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'KODEGDG', 'KODEGDG', 25, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QntHPrd', 'QntHPrd', 26, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HRGHPrd', 'HRGHPrd', 27, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'NAMABRG', 'NAMABRG', 28, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'KODEGRP', 'KODEGRP', 29, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'NamaGrp', 'NamaGrp', 30, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'KODESUBGRP', 'KODESUBGRP', 31, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'NamaSubGrp', 'NamaSubGrp', 32, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'hrgpbl', 'hrgpbl', 33, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qntpbl', 'qntpbl', 34, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'hrgrpj', 'hrgrpj', 35, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'qntrpj', 'qntrpj', 36, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'hrgtri', 'hrgtri', 37, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qnttri', 'qnttri', 38, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'hrgadi', 'hrgadi', 39, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qntadi', 'qntadi', 40, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'hrgpnj', 'hrgpnj', 41, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qntpnj', 'qntpnj', 42, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'hrgrpb', 'hrgrpb', 43, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'qntrpb', 'qntrpb', 44, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'hrgtro', 'hrgtro', 45, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qnttro', 'qnttro', 46, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'hrgado', 'hrgado', 47, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'qntado', 'qntado', 48, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'RPIN', 'RPIN', 49, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'QntIN', 'QntIN', 50, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'RPOUT', 'RPOUT', 51, 'currency', 'right', 1, 1),
    (@IdLap, 'QuView', 'QntOUT', 'QntOUT', 52, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HrgUKI', 'HrgUKI', 53, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QntUKI', 'QntUKI', 54, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'HrgUKO', 'HrgUKO', 55, 'text', 'left', 0, 1),
    (@IdLap, 'QuView', 'QntUKO', 'QntUKO', 56, 'text', 'left', 0, 1);
GO

-- 4. dbparameterlaporan
DECLARE @IdLap INT;
SET @IdLap = (SELECT id_laporan FROM dbmasterlaporan WHERE KODEMENU = '050103');
DELETE FROM dbparameterlaporan WHERE id_laporan = @IdLap;
INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, nilai_default, posisi, konfigurasi) VALUES
    (@IdLap, 'Param1', 'Parameter 1', 'text', 0, '', 1, NULL);
GO

PRINT 'Created report: 050103 - Stock Qty + Rupiah';
GO
