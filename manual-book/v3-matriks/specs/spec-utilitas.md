# Spec: Utilitas (Utility Module)

> Modul **maintenance & utility**: Hitung Ulang Stock, HPP, Proses Posting, Audit Trail

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Utilitas > Hitung Ulang Stock / HPP / Proses Posting / Buku Aktivitas Pemakai |
| **Akses** | Administrator / Manager (kebanyakan modul Utilitas) |
| **CRUD Ops** | Jalankan proses (execute), lihat log/hasil |
| **Validasi** | Hanya transaksi **sudah diotorisasi** yang ikut Proses Posting |
| **Trigger** | Recalculate, recalculate ulang, posting otomatis, audit query |

### Submenu Utilitas (4 menu utama)

| # | Submenu | Fungsi |
|---|---------|--------|
| 1 | **Hitung Ulang Stock** | Recalculate stok per bulan (semua barang atau per barang) |
| 2 | **HPP** | Hitung Harga Pokok Penjualan / harga barang jadi |
| 3 | **Proses Posting** | Posting otomatis jurnal & kartu ke laporan keuangan |
| 4 | **Buku Aktivitas Pemakai** | Audit trail perubahan data per user |

### Multi-Proses dalam Posting

Proses Posting bisa menjalankan **beberapa sub-proses sekaligus**:
- Proses Jurnal (ke Buku Besar)
- Proses Kartu (ke Sub-Ledger)
- Proses Auto-Posting (aturan otomatis)
- Proses HPP (recalculate)

## 2. Field Reference Table

### 2a. Hitung Ulang Stock

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Scope | Enum | Ya | Semua barang / Per barang |
| Kode Barang | Lookup Item | Kondisional | Required jika scope = per barang |
| Periode | Date | Ya | Bulanan (misal: 2026-06) |
| Trigger Mutasi | Multi-check | Ya | Pembelian, Penjualan, Pengeluaran Gudang |
| Tanggal Mulai | Date | Ya | Default: awal periode |
| Tanggal Selesai | Date | Ya | Default: akhir periode |

### 2b. HPP (Harga Pokok Penjualan)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Scope | Enum | Ya | Semua barang / Per barang |
| Kode Barang | Lookup Item | Kondisional | Required jika scope = per barang |
| Periode | Date | Ya | Periode perhitungan HPP |
| Sumber Data | Multi-check | Ya | Master Bahan, Proses Produksi, Mesin, TK |

### 2c. Proses Posting

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Periode | Date | Ya | Periode yang akan di-posting |
| Sub-Proses | Multi-check | Ya | Jurnal / Kartu / Auto-Posting / HPP |
| Filter Status | Enum | Ya | "Sudah diotorisasi" (default only) |
| Preview | Boolean | Tidak | Centang untuk lihat preview sebelum commit |

### 2d. Buku Aktivitas Pemakai (Audit Trail)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Filter Tanggal | Date Range | Tidak | Periode waktu |
| Filter User | Lookup User | Tidak | User tertentu |
| Filter Form/Modul | Lookup Form | Tidak | Modul tertentu |
| Filter Transaksi | String | Tidak | Nomor transaksi tertentu |
| Filter Tipe Aksi | Enum | Tidak | Tambah / Koreksi / Hapus |

## 3. Test Scenarios

### Skenario 1: Hitung Ulang Stock per bulan — semua barang
```
Given ada mutasi stok Juni 2026 (pembelian, penjualan, pengeluaran)
When saya buka Utilitas > Hitung Ulang Stock
And pilih scope "Semua barang"
And pilih periode "2026-06"
And klik "Hitung"
Then stok akhir Juni ter-update sesuai mutasi
And adjustment tercatat jika ada selisih
```

### Skenario 2: Hitung Ulang Stock per barang
```
Given saya ingin recalculate stok BRG-A saja
When saya pilih scope "Per barang"
And pilih BRG-A + periode "2026-06"
And klik "Hitung"
Then hanya BRG-A yang ter-update
```

### Skenario 3: Hitung HPP semua barang
```
Given saya buka Utilitas > HPP
When saya pilih scope "Semua barang"
And pilih periode "2026-06"
And klik "Hitung"
Then HPP ter-recalculate untuk semua barang jadi
And tersimpan di master item.hpp
```

### Skenario 4: HPP per barang
```
Given saya ingin hitung HPP BRG-A saja
When saya pilih scope "Per barang" + BRG-A
And klik "Hitung"
Then HPP BRG-A ter-update
```

### Skenario 5: Proses Posting — hanya transaksi terotorisasi
```
Given ada transaksi Draft (belum otorisasi) dan L1 approved
When saya jalankan Proses Posting
Then hanya transaksi L1+ yang ter-posting
And transaksi Draft di-skip
```

### Skenario 6: Proses Posting invoice penjualan → jurnal + kartu piutang
```
Given Invoice "INV-001" sudah L1+L2 approved
When saya jalankan Proses Posting + sub-proses Jurnal + Kartu
Then jurnal terbentuk di buku besar
And kartu piutang customer ter-update +1 record
```

### Skenario 7: Buku Aktivitas filter by user
```
Given ada perubahan data oleh user "Andi" hari ini
When saya buka Buku Aktivitas
And filter User = "Andi"
And filter Tanggal = hari ini
Then tampil hanya perubahan oleh Andi
```

### Skenario 8: Buku Aktivitas filter by tanggal
```
Given ada perubahan di banyak tanggal
When saya filter Tanggal = 2026-06-26
Then tampil hanya perubahan hari itu
```

### Skenario 9: Audit trail edit master (before/after)
```
Given master item BRG-A diedit: harga dari 50.000 → 55.000
When saya cari di Buku Aktivitas dengan keyword "BRG-A"
Then tampil entry: Tipe=Koreksi, Form=Master Bahan, Nilai Sebelum=50000, Nilai Sesudah=55000
```

### Skenario 10: Posting multi-sub-proses sekaligus
```
Given saya centang Jurnal + Kartu + Auto-Posting + HPP
When saya klik "Proses Posting"
Then semua sub-proses jalan sekaligus
Dan hasil tercatat di log masing-masing
```

## 4. Database Impact

| Aksi | Tabel Affected | Effect |
|------|---------------|--------|
| Hitung Ulang Stock | `tbl_item.stok`, `tbl_kartu_stok` (recalculate), `tbl_stok_adjustment` | Update stok akhir |
| Hitung HPP | `tbl_item.hpp`, `tbl_hpp_log` | Update HPP barang jadi |
| Proses Posting — Jurnal | `tbl_jurnal_header`, `tbl_jurnal_detail` (INSERT) | Generate jurnal |
| Proses Posting — Kartu | `tbl_kartu_piutang`, `tbl_kartu_utang`, `tbl_kartu_bahan`, `tbl_kartu_stok` | Update sub-ledger |
| Proses Posting — Auto-Posting | `tbl_posting_rule` (execute rules) | Generate jurnal otomatis |
| Audit Trail | `tbl_audit_log`, `tbl_audit_log_detail` | Track semua perubahan |

## 5. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Hitung Ulang Stock tanpa pilih scope | Tolak: "Pilih scope (semua/per barang)" |
| HPP tanpa periode | Tolak: "Periode wajib diisi" |
| Proses Posting dengan periode terkunci | Tolak: "Periode sudah terkunci" |
| Proses Posting tanpa sub-proses dipilih | Tolak: "Pilih minimal 1 sub-proses" |
| Buku Aktivitas tanpa filter | Tampilkan semua (performa mungkin lambat) |
| Transaksi Draft ikut Proses Posting | Otomatis di-skip (sesuai aturan) |
| Hitung ulang untuk barang yang di-close | Tolak: "Barang sudah di-close period ini" |
| Posting gagal di tengah jalan | Rollback semua sub-proses |
| HPP untuk barang tanpa history produksi | Warning: "Tidak ada history produksi, HPP = 0" |
| Audit log untuk user yang sudah dihapus | Tampilkan "User: [deleted - id:xxx]" |
