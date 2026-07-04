# API Reference — ERP Trade Exchange

> Pemetaan UI Form (spec files) → Database Tables
> Untuk developer automation, migrasi data, dan integrasi

## Index Spec Files

| Modul | Spec File |
|-------|-----------|
| Navigasi | [specs/spec-menu-navigasi.md](specs/spec-menu-navigasi.md) |
| Setup Berkas | [specs/spec-setup-berkas.md](specs/spec-setup-berkas.md) |
| Master Accounting | [specs/spec-master-accounting.md](specs/spec-master-accounting.md) |
| Master Bahan | [specs/spec-master-bahan.md](specs/spec-master-bahan.md) |
| Master Supplier/Customer | [specs/spec-master-supplier-customer.md](specs/spec-master-supplier-customer.md) |
| Master Produksi | [specs/spec-master-produksi.md](specs/spec-master-produksi.md) |
| Master Lain | [specs/spec-master-lain.md](specs/spec-master-lain.md) |
| Kas Bank | [specs/spec-kas-bank.md](specs/spec-kas-bank.md) |
| Memorial | [specs/spec-memorial.md](specs/spec-memorial.md) |
| Pengadaan | [specs/spec-pengadaan.md](specs/spec-pengadaan.md) |
| Marketing | [specs/spec-marketing.md](specs/spec-marketing.md) |
| Produksi | [specs/spec-produksi.md](specs/spec-produksi.md) |
| Gudang | [specs/spec-gudang.md](specs/spec-gudang.md) |
| Utilitas | [specs/spec-utilitas.md](specs/spec-utilitas.md) |

---

## 1. Modul: Setup Berkas (Menu Berkas)

### UI Form → Tabel

| Form | Tabel Affected | Aksi |
|------|---------------|------|
| Setup Periode Kerja | `tbl_periode_kerja` | INSERT/UPDATE |
| Kunci Periode Kerja | `tbl_periode_kerja` | UPDATE flag is_locked |
| Set Perusahaan | `tbl_perusahaan` | INSERT/UPDATE |
| Set Nomor Transaksi | `tbl_format_nomor`, `tbl_running_number` | INSERT + reset counter |
| Set Pemakaian > User | `tbl_user`, `tbl_user_access`, `tbl_user_otorisasi` | INSERT/UPDATE/DELETE |
| Set Pemakaian > Report | `tbl_user_report_access` | INSERT/UPDATE |
| Set Pemakaian > COA | `tbl_user_coa_access` | INSERT/DELETE |
| Ganti Password | `tbl_user` | UPDATE field password |
| Lock | `tbl_session` | DELETE session_id |

### Field Reference Tabel User

| Field | Tipe | Constraint |
|-------|------|-----------|
| user_id | UUID | PK |
| username | VARCHAR(50) | UNIQUE NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| nama_lengkap | VARCHAR(100) | NOT NULL |
| jabatan_id | UUID | FK → tbl_jabatan |
| level | INTEGER (1-5) | NOT NULL CHECK (1-5) |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 2. Modul: Master Accounting

### UI Form → Tabel

| Form | Tabel Affected | Aksi |
|------|---------------|------|
| Pergiroan (COA) | `tbl_coa` | INSERT/UPDATE/DELETE |
| Aktiva Fisikal | `tbl_aktiva`, `tbl_coa` (akumulasi) | INSERT/UPDATE |
| Saldo Awal | `tbl_saldo_awal` | INSERT (hanya awal periode) |
| Posting Rule | `tbl_posting_rule` | INSERT/UPDATE |
| Penyusutan periodik | `tbl_penyusutan` | INSERT (auto by cron) |
| Setting Lampiran | `tbl_lampiran_rule` | INSERT/UPDATE |

### Field Reference Tabel COA

| Field | Tipe | Constraint |
|-------|------|-----------|
| coa_id | UUID | PK |
| kode | VARCHAR(20) | UNIQUE NOT NULL |
| keterangan | VARCHAR(100) | NOT NULL |
| kelompok | ENUM | ('Aktiva','Kewajiban','Modal','Pendapatan','Beban') |
| tipe | ENUM | ('General','Detail') |
| saldo_normal | ENUM | ('Debit','Credit') |
| parent_id | UUID | FK → tbl_coa (nullable) |

### Auto-Posting COA per Kelompok

| Kelompok | Saldo Normal |
|----------|--------------|
| Aktiva | Debit |
| Kewajiban | Credit |
| Modal | Credit |
| Pendapatan | Credit |
| Beban | Debit |

---

## 3. Modul: Master Bahan & Barang

### UI Form → Tabel

| Form | Tabel Affected |
|------|---------------|
| Master Gudang | `tbl_gudang` |
| Group Barang | `tbl_group_barang` |
| Subgroup | `tbl_subgroup_barang` |
| Master Bahan | `tbl_item`, `tbl_item_satuan` |
| Barang Jadi Produksi | `tbl_item_produksi`, `tbl_bom` |

### Field Reference Tabel Item

| Field | Tipe | Constraint |
|-------|------|-----------|
| item_id | UUID | PK |
| kode | VARCHAR(50) | UNIQUE NOT NULL |
| nama | VARCHAR(100) | NOT NULL |
| group_id | UUID | FK → tbl_group_barang |
| subgroup_id | UUID | FK → tbl_subgroup_barang |
| satuan_1 | VARCHAR(20) | NOT NULL |
| satuan_2 | VARCHAR(20) | nullable |
| konversi | INTEGER | nullable, >0 jika satuan_2 diisi |
| is_active | BOOLEAN | DEFAULT true |

---

## 4. Modul: Master Supplier & Customer

### UI Form → Tabel

| Form | Tabel Affected |
|------|---------------|
| Area | `tbl_area` |
| Kota | `tbl_kota` |
| Supplier | `tbl_supplier`, `tbl_supplier_akun` |
| Customer | `tbl_customer`, `tbl_customer_akun` |
| Sales | `tbl_sales` (FK ke `tbl_karyawan`) |

### Field Reference Tabel Supplier

| Field | Tipe | Constraint |
|-------|------|-----------|
| supplier_id | UUID | PK |
| kode | VARCHAR(20) | UNIQUE NOT NULL |
| nama | VARCHAR(100) | NOT NULL |
| alamat | TEXT | |
| telepon | VARCHAR(20) | |
| npwp | VARCHAR(20) | regex validation |
| coa_id | UUID | FK → tbl_coa (perkiraan utang) |
| jenis_harta | ENUM | ('Harta Dagang','Harta Deposito','Harta Lain-lain') |

### Field Reference Tabel Customer

| Field | Tipe | Constraint |
|-------|------|-----------|
| customer_id | UUID | PK |
| kode | VARCHAR(20) | UNIQUE NOT NULL |
| nama | VARCHAR(100) | NOT NULL |
| alamat | TEXT | |
| telepon | VARCHAR(20) | |
| npwp | VARCHAR(20) | regex validation |
| coa_id | UUID | FK → tbl_coa (perkiraan piutang) |
| kategori_piutang | ENUM | ('Harta Dagang Lain-lain','Piutang Lain') |

---

## 5. Modul: Master Produksi

### UI Form → Tabel

| Form | Tabel Affected |
|------|---------------|
| Master Machine & Tarif | `tbl_mesin`, `tbl_tarif_mesin` |
| Tarif Tenaga Kerja | `tbl_tarif_tk` (FK ke `tbl_karyawan`) |

### Field Reference Tabel Mesin

| Field | Tipe | Constraint |
|-------|------|-----------|
| mesin_id | UUID | PK |
| kode | VARCHAR(20) | UNIQUE NOT NULL |
| nama | VARCHAR(100) | NOT NULL |
| tarif | DECIMAL(15,2) | CHECK (tarif > 0) |
| alokasi | ENUM | ('Sentral','Departemen') |

### Field Reference Tabel Tarif TK

| Field | Tipe | Constraint |
|-------|------|-----------|
| tarif_tk_id | UUID | PK |
| kode | VARCHAR(20) | UNIQUE NOT NULL |
| karyawan_id | UUID | FK → tbl_karyawan (kategori=Produksi) |
| tarif | DECIMAL(15,2) | CHECK (tarif > 0) |
| nickname | VARCHAR(50) | nullable |

---

## 6. Modul: Master Lain-Lain

### UI Form → Tabel

| Form | Tabel Affected |
|------|---------------|
| Departemen | `tbl_departemen` |
| Jabatan | `tbl_jabatan` |
| Master Karyawan | `tbl_karyawan` |
| Valas | `tbl_valas`, `tbl_kurs_history` |
| Daftar Desain | `tbl_daftar_desain` (placeholder) |

### Field Reference Tabel Karyawan

| Field | Tipe | Constraint |
|-------|------|-----------|
| karyawan_id | UUID | PK |
| kode | VARCHAR(20) | UNIQUE NOT NULL |
| nama_lengkap | VARCHAR(100) | NOT NULL |
| tempat_lahir | VARCHAR(50) | |
| tanggal_lahir | DATE | |
| kategori | ENUM | ('Sales','Produksi','Lainnya') |
| is_active | BOOLEAN | DEFAULT true |

---

## 7. Modul: Transaksi Kas Bank

### UI Form → Tabel

| Form | Tabel Affected |
|------|---------------|
| Header Transaksi Kas Bank | `tbl_transaksi_kas`, `tbl_jurnal_header` |
| Detail Sub-Grid | `tbl_transaksi_kas_detail`, `tbl_jurnal_detail` |
| Pelunasan Utang | `tbl_pelunasan_utang`, `tbl_kartu_utang` |
| Pelunasan Piutang | `tbl_pelunasan_piutang`, `tbl_kartu_piutang` |
| Otorisasi | `tbl_otorisasi_transaksi` |

### Auto-Posting Reference

| Kode Transaksi | Debit | Credit |
|---------------|-------|--------|
| BKM (Kas Masuk) | Kas (1-1001) | Lawan (per baris) |
| BKK (Kas Keluar) | Lawan (per baris) | Kas (1-1001) |
| BBM (Bank Masuk) | Bank (1-1101) | Lawan |
| BBK (Bank Keluar) | Lawan | Bank (1-1101) |

### Field Reference Tabel Transaksi Kas

| Field | Tipe | Constraint |
|-------|------|-----------|
| transaksi_id | UUID | PK |
| nomor_bukti | VARCHAR(50) | UNIQUE NOT NULL |
| jenis | ENUM | ('BKM','BKK','BBM','BBK') |
| tanggal | DATE | NOT NULL |
| mata_uang_id | UUID | FK → tbl_valas |
| kurs | DECIMAL(15,4) | NOT NULL |
| tujuan | VARCHAR(100) | NOT NULL |
| user_id | UUID | FK → tbl_user |
| status | ENUM | ('Draft','L1','L2','L3','L4','L5','Final') |

---

## 8. Modul: Memorial (Journal Entry)

### UI Form → Tabel

| Form | Tabel Affected |
|------|---------------|
| Memorial Header | `tbl_jurnal_header` |
| Memorial Detail | `tbl_jurnal_detail` |
| Auto-create Aktiva | `tbl_aktiva` (INSERT saat sisi debit = perkiraan aktiva) |
| Soft-delete Aktiva | `tbl_aktiva` (UPDATE flag saat kredit aktiva) |
| Penambahan Utang | `tbl_utang`, `tbl_kartu_utang` |
| Pelunasan Utang | `tbl_pelunasan_utang`, `tbl_kartu_utang` |
| Penambahan Piutang | `tbl_piutang`, `tbl_kartu_piutang` |
| Pelunasan Piutang | `tbl_pelunasan_piutang`, `tbl_kartu_piutang` |

### Field Reference Tabel Jurnal Detail

| Field | Tipe | Constraint |
|-------|------|-----------|
| jurnal_detail_id | UUID | PK |
| jurnal_header_id | UUID | FK → tbl_jurnal_header |
| coa_id | UUID | FK → tbl_coa (tipe=Detail) |
| debit | DECIMAL(15,2) | CHECK (debit >= 0) |
| credit | DECIMAL(15,2) | CHECK (credit >= 0) |
| CHECK | | (debit = 0) OR (credit = 0) |
| CHECK | | debit != credit (no self-balancing) |
| sub_ledger_ref | UUID | nullable (FK ke supplier/customer/aktiva) |

### Sub-Proses Memorial & Tabel Target

| Sub-Proses | Trigger | Tabel Target |
|-----------|---------|--------------|
| Jurnal Biasa | Simpan memorial | `tbl_jurnal_header/detail` |
| Tambah Aktiva | Debit perkiraan aktiva + Simpan | + INSERT ke `tbl_aktiva` |
| Hapus Aktiva | Credit perkiraan aktiva + Simpan | + UPDATE `tbl_aktiva` (is_deleted) |
| Tambah Utang | Credit perkiraan utang + supplier dipilih | + INSERT ke `tbl_utang`, `tbl_kartu_utang` |
| Pelunasan Utang | Debit perkiraan utang + invoice dipilih | + INSERT ke `tbl_pelunasan_utang` |
| Tambah Piutang | Debit perkiraan piutang + customer dipilih | + INSERT ke `tbl_piutang`, `tbl_kartu_piutang` |
| Pelunasan Piutang | Credit perkiraan piutang + invoice dipilih | + INSERT ke `tbl_pelunasan_piutang` |

---

## Cross-Module Integration Map

| Trigger di Modul A | Effect di Modul B |
|-------------------|-------------------|
| COA baru (tipe=Detail) | Tersedia sebagai opsi lookup di Memorial |
| Tambah Supplier | Tersedia di lookup BKK sub-ledger utang |
| Tambah Customer | Tersedia di lookup BKM sub-ledger piutang |
| Karyawan kategori=Sales | Bisa dibuat di Master Sales |
| Karyawan kategori=Produksi | Bisa dibuat di Tarif TK |
| User dengan akses modul X | Modul X visible di header menu |
| Lock user COA | Filter COA di transaksi sesuai akses |
| Otorisasi Level N | Unlock tombol Level N+1 |

---

## Catatan untuk Developer

1. **Naming convention**: prefix `tbl_` untuk semua tabel master/transaksi; `vw_` untuk view; `sp_` untuk stored procedure
2. **Primary key**: Gunakan UUID untuk distributed-friendly ID
3. **Soft delete**: Tabel master umumnya pakai `is_active` flag, bukan hard DELETE
4. **Audit log**: Setiap aksi otorisasi, batal otorisasi, kunci periode → catat ke `tbl_audit_log`
5. **Auto-posting**: Transaksi Kas Bank & Memorial selalu menghasilkan jurnal di `tbl_jurnal_header/detail`. Laporan keuangan membaca dari tabel jurnal.
6. **Periode**: Selalu cek `tbl_periode_kerja.is_locked` sebelum INSERT ke tabel transaksi

---

## 9. Modul: Pengadaan (Procurement)

### UI Form → Tabel

| Form | Tabel Affected | Aksi |
|------|---------------|------|
| Header PR | `tbl_pr`, `tbl_pr_detail` | INSERT/UPDATE |
| Header PO | `tbl_po`, `tbl_po_detail`, `tbl_outstanding_pr` (update) | INSERT/UPDATE |
| Penerimaan ASC | `tbl_penerimaan_asc`, `tbl_asc_detail` (harga saja) | INSERT/UPDATE |
| Penerimaan Gudang (LPB) | `tbl_lpb`, `tbl_lpb_detail` | INSERT/UPDATE |
| Otorisasi LPB L2 | `tbl_jurnal_header`, `tbl_jurnal_detail`, `tbl_kartu_utang` | INSERT + UPDATE |
| Informasi Pembelian (Faktur Pajak) | `tbl_faktur_pajak`, `tbl_faktur_pajak_detail` | INSERT |
| Otorisasi Faktur Pajak L2 | `tbl_jurnal_header`, `tbl_jurnal_detail`, `tbl_kartu_utang` | INSERT + UPDATE |
| Laporan Outstanding PR/PO | `tbl_outstanding_pr`, `tbl_outstanding_po` | SELECT |

### Field Reference Tabel PR

| Field | Tipe | Constraint |
|-------|------|-----------|
| pr_id | UUID | PK |
| nomor_pr | VARCHAR(50) | UNIQUE NOT NULL |
| tanggal | DATE | NOT NULL |
| pemohon_id | UUID | FK → tbl_karyawan |
| status | ENUM | ('Draft','L1','L2','Final') |

### Field Reference Tabel PO

| Field | Tipe | Constraint |
|-------|------|-----------|
| po_id | UUID | PK |
| nomor_po | VARCHAR(50) | UNIQUE NOT NULL |
| supplier_id | UUID | FK → tbl_supplier |
| pr_id | UUID | FK → tbl_pr (nullable) |
| tanggal | DATE | NOT NULL |

### Field Reference Tabel LPB

| Field | Tipe | Constraint |
|-------|------|-----------|
| lpb_id | UUID | PK |
| nomor_lpb | VARCHAR(50) | UNIQUE NOT NULL |
| po_id | UUID | FK → tbl_po |
| supplier_id | UUID | FK → tbl_supplier |
| gudang_id | UUID | FK → tbl_gudang |

---

## 10. Modul: Marketing (Sales Order)

### UI Form → Tabel

| Form | Tabel Affected | Aksi |
|------|---------------|------|
| Header Sales Order | `tbl_so`, `tbl_so_detail` | INSERT/UPDATE |
| Otorisasi SO L1 | `tbl_otorisasi_transaksi`, `tbl_outstanding_so` | INSERT + UPDATE |
| Surat Perintah Kirim | `tbl_surat_perintah_kirim`, `tbl_spk_detail` | INSERT |
| Surat Jalan | `tbl_surat_jalan`, `tbl_sj_detail`, `tbl_stok_keluar` | INSERT + UPDATE |
| Invoice Penjualan + Otorisasi | `tbl_invoice_penjualan`, `tbl_jurnal_header/detail`, `tbl_kartu_piutang` | INSERT |
| Faktur Pajak Penjualan | `tbl_faktur_pajak_jual` | INSERT |
| Retur Surat Jalan | `tbl_retur_sj`, `tbl_kartu_piutang` (koreksi) | INSERT |
| Retur Penjualan | `tbl_retur_penjualan`, `tbl_kartu_piutang` | INSERT |
| Credit Note | `tbl_credit_note`, `tbl_kartu_piutang` | INSERT |
| Retur Gudang | `tbl_retur_gudang`, `tbl_stok_masuk` | INSERT |

### Field Reference Tabel Sales Order

| Field | Tipe | Constraint |
|-------|------|-----------|
| so_id | UUID | PK |
| nomor_so | VARCHAR(50) | UNIQUE NOT NULL |
| sales_id | UUID | FK → tbl_karyawan (kategori=Sales) |
| customer_id | UUID | FK → tbl_customer |
| tanggal | DATE | NOT NULL |
| status | ENUM | ('Draft','L1','L2','Final') |

---

## 11. Modul: Produksi (Production)

### UI Form → Tabel

| Form | Tabel Affected | Aksi |
|------|---------------|------|
| Header SPK | `tbl_spk`, `tbl_spk_detail_mesin`, `tbl_spk_detail_bahan` | INSERT/UPDATE |
| Update Status SPK | `tbl_spk.status` (Draft→Sedang Jalan→Selesai) | UPDATE |
| Entry Hasil Produksi | `tbl_hasil_produksi`, `tbl_stok_barang_jadi` | INSERT + UPDATE |
| Permintaan Bahan | `tbl_permintaan_bahan`, `tbl_permintaan_bahan_detail` | INSERT |
| Permintaan Bahan Tambahan | `tbl_permintaan_bahan_tambahan` | INSERT |
| Finishing | `tbl_finishing`, `tbl_status_barang` | INSERT + UPDATE |
| Update Kartu Mesin | `tbl_kartu_mesin` (history jam kerja) | INSERT |
| Update Kartu Karyawan | `tbl_kartu_karyawan` (history kerja) | INSERT |

### Field Reference Tabel SPK

| Field | Tipe | Constraint |
|-------|------|-----------|
| spk_id | UUID | PK |
| nomor_spk | VARCHAR(50) | UNIQUE NOT NULL |
| so_id | UUID | FK → tbl_so (nullable) |
| kode_barang | UUID | FK → tbl_item |
| shift | ENUM | ('1','2','3') |
| tanggal_mulai | DATE | NOT NULL |
| tanggal_selesai | DATE | NOT NULL |
| status | ENUM | ('Draft','Sedang Jalan','Selesai') |

### Catatan Penting

> SPK **TIDAK butuh otorisasi** setelah selesai — langsung final setelah entry, beda dengan transaksi keuangan.

---

## 12. Modul: Gudang (Warehouse)

### UI Form → Tabel

| Form | Tabel Affected | Aksi |
|------|---------------|------|
| Simpan Pengeluaran Bahan | `tbl_penyerahan_bahan`, `tbl_penyerahan_detail` | INSERT |
| Otorisasi L1 Pengeluaran | `tbl_penyerahan_bahan.status`, `tbl_stok_bahan`, `tbl_jurnal_header/detail`, `tbl_kartu_bahan` | UPDATE + INSERT |
| Simpan Retur Bahan | `tbl_retur_bahan`, `tbl_retur_bahan_detail` | INSERT |
| Otorisasi L1 Retur | `tbl_retur_bahan.status`, `tbl_stok_bahan`, `tbl_jurnal_header/detail`, `tbl_kartu_bahan` | UPDATE + INSERT |
| Koreksi Bahan | `tbl_koreksi_bahan`, `tbl_stok_bahan`, `tbl_jurnal_header/detail` | INSERT + UPDATE |
| Opname | `tbl_opname`, `tbl_opname_detail`, `tbl_koreksi_bahan` (auto-generate) | INSERT + trigger |

### Field Reference Tabel Penyerahan Bahan

| Field | Tipe | Constraint |
|-------|------|-----------|
| penyerahan_id | UUID | PK |
| nomor_penyerahan | VARCHAR(50) | UNIQUE NOT NULL |
| spk_id | UUID | FK → tbl_spk |
| gudang_id | UUID | FK → tbl_gudang |
| tanggal | DATE | NOT NULL |
| status | ENUM | ('Draft','L1','L2','Final') |

### Constraint Penting

- **Bahan**: hanya yang ada di sub-detail SPK/Permintaan Bahan yang sudah diotorisasi
- **Qty Retur**: TIDAK BOLEH > qty pernah dikeluarkan sebelumnya
- **Semua mutasi**: butuh otorisasi L1 sebelum sah

---

## 13. Modul: Utilitas (Utility)

### UI Form → Tabel

| Form | Tabel Affected | Aksi |
|------|---------------|------|
| Hitung Ulang Stock | `tbl_item.stok`, `tbl_kartu_stok`, `tbl_stok_adjustment` | UPDATE + recalculate |
| Hitung HPP | `tbl_item.hpp`, `tbl_hpp_log` | UPDATE |
| Proses Posting — Jurnal | `tbl_jurnal_header`, `tbl_jurnal_detail` | INSERT |
| Proses Posting — Kartu | `tbl_kartu_piutang`, `tbl_kartu_utang`, `tbl_kartu_bahan`, `tbl_kartu_stok` | UPDATE |
| Proses Posting — Auto-Posting | `tbl_posting_rule` (execute rules) | INSERT |
| Proses Posting — HPP | `tbl_item.hpp` | UPDATE |
| Buku Aktivitas Pemakai | `tbl_audit_log`, `tbl_audit_log_detail` | SELECT (audit query) |

### Field Reference Tabel Audit Log

| Field | Tipe | Constraint |
|-------|------|-----------|
| audit_id | UUID | PK |
| tanggal | TIMESTAMP | NOT NULL |
| user_id | UUID | FK → tbl_user (nullable jika user dihapus) |
| form_modul | VARCHAR(100) | NOT NULL |
| tipe_aksi | ENUM | ('Tambah','Koreksi','Hapus','Otorisasi') |
| nilai_sebelum | TEXT | nullable |
| nilai_sesudah | TEXT | nullable |
| ref_transaksi | VARCHAR(50) | nullable |

### Aturan Penting

- **Proses Posting**: hanya transaksi **sudah diotorisasi** yang diproses (Draft di-skip)
- **Hitung Ulang Stock**: scope = Semua barang / Per barang
- **HPP**: sumber data = master bahan + proses produksi + mesin + karyawan
- **Audit Trail**: filter by tanggal, user, form/modul, nomor transaksi, tipe aksi

---

## Cross-Module Integration Map (Updated)

| Trigger di Modul A | Effect di Modul B |
|-------------------|-------------------|
| COA baru (tipe=Detail) | Tersedia sebagai opsi lookup di Memorial |
| Tambah Supplier | Tersedia di lookup BKK sub-ledger utang, Pengadaan LPB |
| Tambah Customer | Tersedia di lookup BKM sub-ledger piutang, Marketing SO |
| Karyawan kategori=Sales | Bisa dibuat di Master Sales, muncul di combo SO |
| Karyawan kategori=Produksi | Bisa dibuat di Tarif TK, muncul di SPK |
| User dengan akses modul X | Modul X visible di header menu |
| Lock user COA | Filter COA di transaksi sesuai akses |
| Otorisasi Level N | Unlock tombol Level N+1 |
| **SO otorisasi L1 (Marketing)** | **Muncul di Outstanding Produksi → bisa dibuat SPK** |
| **SPK selesai (Produksi)** | **Bisa buat Permintaan Bahan ke Gudang** |
| **Permintaan Bahan disetujui (Gudang)** | **Stok bahan berkurang + jurnal otomatis** |
| **LPB otorisasi L2 (Pengadaan)** | **Kartu hutang supplier ter-update** |
| **Invoice Penjualan otorisasi (Marketing)** | **Kartu piutang customer ter-update** |
| **Hasil Produksi (Produksi)** | **Stok barang jadi bertambah** |
| **Proses Posting (Utilitas)** | **Batch posting jurnal + update semua sub-ledger** |
| **Hitung Ulang Stock (Utilitas)** | **Recalculate stok akhir periode per barang** |
| **Buku Aktivitas (Utilitas)** | **Track semua perubahan dari modul manapun** |
