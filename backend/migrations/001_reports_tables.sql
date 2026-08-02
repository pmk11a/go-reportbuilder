-- ============================================
-- Migration: Dynamic Reports Tables
-- Database: SQL Server 2008 R2
-- ============================================

-- 1. dbmasterlaporan - Master report definition
IF EXISTS (SELECT * FROM sysobjects WHERE name = 'dbmasterlaporan' AND xtype = 'U')
    DROP TABLE [dbmasterlaporan];
CREATE TABLE [dbmasterlaporan] (
    [id_laporan] INT IDENTITY(1,1) PRIMARY KEY,
    [KODEMENU] NVARCHAR(50) NOT NULL,
    [nama_laporan] NVARCHAR(200) NOT NULL,
    [deskripsi] TEXT NULL,
    [footer_bands] TEXT NULL,
    [status_aktif] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME NULL,
    [updated_at] DATETIME NULL
)
CREATE INDEX [idx_dbmasterlaporan_kodemenu] ON [dbmasterlaporan] ([KODEMENU]);

-- 2. dbquerylaporan - Report datasets/queries
IF EXISTS (SELECT * FROM sysobjects WHERE name = 'dbquerylaporan' AND xtype = 'U')
    DROP TABLE [dbquerylaporan];
CREATE TABLE [dbquerylaporan] (
    [id_query] INT IDENTITY(1,1) PRIMARY KEY,
    [id_laporan] INT NOT NULL,
    [nama_dataset] NVARCHAR(50) NOT NULL,
    [query_sumber_data] TEXT NOT NULL,
    [deskripsi] NVARCHAR(200) NULL,
    [urutan] INT NOT NULL DEFAULT 0,
    [visible] BIT NOT NULL DEFAULT 1,
    [config_json] TEXT NULL
)
CREATE INDEX [idx_dbquerylaporan_laporan] ON [dbquerylaporan] ([id_laporan]);

-- 3. dbparameterlaporan - Report filter parameters
IF EXISTS (SELECT * FROM sysobjects WHERE name = 'dbparameterlaporan' AND xtype = 'U')
    DROP TABLE [dbparameterlaporan];
CREATE TABLE [dbparameterlaporan] (
    [id_parameter] INT IDENTITY(1,1) PRIMARY KEY,
    [id_laporan] INT NOT NULL,
    [nama_filter] NVARCHAR(100) NOT NULL,
    [label] NVARCHAR(100) NULL,
    [tipe_input] NVARCHAR(50) NOT NULL DEFAULT 'text',
    [wajib_isi] BIT NOT NULL DEFAULT 0,
    [nilai_default] NVARCHAR(200) NULL,
    [posisi] INT NOT NULL DEFAULT 0,
    [konfigurasi] TEXT NULL
)
CREATE INDEX [idx_dbparameterlaporan_laporan] ON [dbparameterlaporan] ([id_laporan]);

-- 4. dbkolomlaporan - Report columns display configuration
IF EXISTS (SELECT * FROM sysobjects WHERE name = 'dbkolomlaporan' AND xtype = 'U')
    DROP TABLE [dbkolomlaporan];
CREATE TABLE [dbkolomlaporan] (
    [id_kolom] INT IDENTITY(1,1) PRIMARY KEY,
    [id_laporan] INT NOT NULL,
    [nama_dataset] NVARCHAR(50) NOT NULL,
    [nama_kolom] NVARCHAR(100) NOT NULL,
    [label_tampil] NVARCHAR(100) NULL,
    [urutan_tampil] INT NOT NULL DEFAULT 0,
    [format_type] NVARCHAR(20) NOT NULL DEFAULT 'text',
    [alignment] NVARCHAR(10) NOT NULL DEFAULT 'left',
    [is_summable] BIT NOT NULL DEFAULT 0,
    [is_visible] BIT NOT NULL DEFAULT 1
)
CREATE INDEX [idx_dbkolomlaporan_laporan] ON [dbkolomlaporan] ([id_laporan]);

-- 5. dbgrouplaporan - Report grouping levels
IF EXISTS (SELECT * FROM sysobjects WHERE name = 'dbgrouplaporan' AND xtype = 'U')
    DROP TABLE [dbgrouplaporan];
CREATE TABLE [dbgrouplaporan] (
    [id_group] INT IDENTITY(1,1) PRIMARY KEY,
    [id_laporan] INT NOT NULL,
    [group_level] INT NOT NULL DEFAULT 1,
    [group_field] NVARCHAR(100) NULL,
    [field_value] NVARCHAR(50) NULL,
    [label] NVARCHAR(200) NOT NULL,
    [sort_order] INT NOT NULL DEFAULT 0,
    [show_subtotal] BIT NOT NULL DEFAULT 1,
    [style_config] TEXT NULL,
    [special_handling] NVARCHAR(50) NOT NULL DEFAULT 'default',
    [config_json] TEXT NULL
)
CREATE INDEX [idx_dbgrouplaporan_laporan] ON [dbgrouplaporan] ([id_laporan]);

-- 6. dbLabelGrup - Label group mapping
IF EXISTS (SELECT * FROM sysobjects WHERE name = 'dbLabelGrup' AND xtype = 'U')
    DROP TABLE [dbLabelGrup];
CREATE TABLE [dbLabelGrup] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [Kelompok] NVARCHAR(50) NOT NULL,
    [Kode] NVARCHAR(50) NOT NULL,
    [Label] NVARCHAR(200) NOT NULL
)
CREATE INDEX [idx_dbLabelGrup_kelompok] ON [dbLabelGrup] ([Kelompok]);

-- 7. dbkomponenlaporan - Konfigurasi layout komponen dinamis
IF EXISTS (SELECT * FROM sysobjects WHERE name = 'dbkomponenlaporan' AND xtype = 'U')
    DROP TABLE [dbkomponenlaporan];
CREATE TABLE [dbkomponenlaporan] (
    [id_komponen] INT IDENTITY(1,1) PRIMARY KEY,
    [id_laporan] INT NOT NULL,
    [nama_komponen] NVARCHAR(128) NOT NULL,
    [konfigurasi_layout] TEXT NOT NULL,
    [urutan] INT NOT NULL DEFAULT 0,
    [is_active] BIT NOT NULL DEFAULT 1
)
CREATE INDEX [idx_dbkomponenlaporan_laporan] ON [dbkomponenlaporan] ([id_laporan]);

PRINT 'Report tables migration completed successfully.'
