# Spec: Pengadaan (Procurement)

> Alur: **PR → PO → LPB / Penerimaan ASC → Faktur Pajak (Informasi Pembelian)**

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Pengadaan > PR / PO / Penerimaan / Informasi Pembelian |
| **Akses** | Staff Pengadaan + Otorisasi L1 (entry) & L2 (final, trigger jurnal) |
| **CRUD Ops** | Tambah, Koreksi, Hapus (dengan constraint), Otorisasi L1/L2, Batal Otorisasi |
| **Validasi** | Quantity carry-through (PR→PO→LPB), Outstanding tracking, dependency chain penghapusan |
| **Sub-Ledger** | Hutang Supplier, Stok Gudang, Buku Besar |

### Tipe Penerimaan

| Tipe | Tombol | Fungsi |
|------|--------|--------|
| **Penerimaan ASC** (Sub-Contract) | Koreksi harga | Edit hanya kolom **harga** saja |
| **Penerimaan Gudang (LPB)** | Otorisasi L1 → L2 | Trigger jurnal otomatis ke buku besar |

### Otorisasi

| Level | Aksi | Effect |
|-------|------|--------|
| L1 | Otorisasi awal (entry) | Status: Draft → L1 |
| L2 | Approval final | Jurnal otomatis ke buku besar + kartu hutang supplier |

## 2. Field Reference Table

### 2a. Header PR (Purchase Request)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor PR | String | Auto | Format: urut + kode + tgl |
| Tanggal | Date | Ya | Default: hari ini |
| Pemohon | Lookup Karyawan | Ya | User yang request |
| Keterangan | Text | Tidak | Tujuan PR |

### 2b. Detail PR / PO / LPB

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Bahan | Lookup Item | Ya | Dari Master Bahan |
| Kuantitas | Decimal | Ya | qty yang diminta/diorder/diterima |
| Satuan | String | Auto | Default dari master |
| Harga | Decimal | Ya | Harga satuan |
| Gudang | Lookup Gudang | Ya | Untuk LPB: gudang tujuan |
| Keterangan | Text | Tidak | — |

### 2c. Header Faktur Pajak (Informasi Pembelian)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Sub-Ledger (Supplier) | Lookup Supplier | Ya | Pilih supplier |
| Nomor Faktur Pajak | String | Ya | Nomor faktur dari supplier |
| Tanggal Faktur | Date | Ya | Tanggal dokumen |
| Daftar LPB | Lookup LPB (multi) | Ya | Pilih LPB yang akan di-faktur-kan (centang) |

### 2d. Penerimaan ASC — Edit Constraint

| Field | Editable? | Keterangan |
|-------|-----------|------------|
| Harga | ✅ Ya | Satu-satunya field yang bisa dikoreksi |
| Datang | ❌ Read-only | Auto dari PO |
| Supplier | ❌ Read-only | Auto dari PO |
| Item | ❌ Read-only | Auto dari PO |
| Qty | ❌ Read-only | Auto dari PO |

## 3. Test Scenarios

### Skenario 1: Alur lengkap PR → PO → LPB → Faktur Pajak
```
Given saya di Pengadaan > PR
When saya buat PR dengan 1 item qty 100
And klik Simpan
Then PR tersimpan dengan nomor "0001/PR-.../202606"

When saya buat PO dari PR tersebut
And otorisasi PO L1
Then PO ter-link ke PR, qty carry-through

When LPB dibuat dari PO dengan qty 100 (penuh)
And otorisasi L1 + L2
Then jurnal terbentuk: Debit Stok / Credit Hutang Supplier
And kartu hutang supplier bertambah

When saya buat Faktur Pajak dengan pilih LPB di atas
And otorisasi L1 + L2
Then jurnal terbentuk dan kartu hutang supplier update
```

### Skenario 2: Edit harga di Penerimaan ASC (hanya harga)
```
Given Penerimaan ASC sudah muncul otomatis dari PO
When saya coba edit field "Datang" / "Supplier" / "Qty"
Then field read-only, edit ditolak
When saya edit field "Harga" saja
Then perubahan tersimpan
```

### Skenario 3: Otorisasi LPB L2 → jurnal + kartu hutang
```
Given LPB status L1 approved
When user L2 klik Otorisasi
Then jurnal terbentuk ke buku besar
And kartu hutang supplier ter-update +1 record
```

### Skenario 4: Faktur Pajak tanpa centang LPB → gagal
```
Given saya buka Informasi Pembelian
When saya pilih supplier
And saya tidak centang LPB manapun
And klik Proses
Then sistem menolak: "Pilih minimal 1 LPB"
```

### Skenario 5: Centang LPB yang sudah punya faktur → duplicate
```
Given LPB-001 sudah punya Faktur Pajak
When saya buka Informasi Pembelian dan centang LPB-001 lagi
Then LPB-001 tidak muncul di daftar (filter: belum punya faktur)
```

### Skenario 6: Hapus PO yang punya LPB reference → ditolak
```
Given PO-001 sudah punya LPB reference
When saya coba Hapus PO-001
Then sistem menolak: "PO tidak bisa dihapus, sudah ada LPB reference"
```

### Skenario 7: Hapus PO tanpa LPB reference → berhasil
```
Given PO-002 belum punya LPB reference
When saya klik Hapus
Then PO-002 terhapus dari daftar
```

### Skenario 8: Hapus PR yang punya PO reference → ditolak
```
Given PR-001 sudah punya PO
When saya coba Hapus PR
Then sistem menolak: "PR sudah punya PO reference"
```

### Skenario 9: Lihat Outstanding PR
```
Given saya buka laporan Outstanding PR
Then tampil daftar PR yang belum dibuat PO (qty masih outstanding)
```

### Skenario 10: Kuantitas parsial — PO 100, LPB 60, outstanding 40
```
Given PO dibuat dengan qty 100
When saya buat LPB qty 60 (parsial)
And otorisasi L1 + L2
Then LPB tersimpan qty 60
And Outstanding PO = 40 (status: parsial)
```

## 4. Database Impact

| Aksi | Tabel Affected | Posting Debit/Credit |
|------|---------------|---------------------|
| Tambah PR | `tbl_pr`, `tbl_pr_detail` | — (belum ada jurnal) |
| Tambah PO | `tbl_po`, `tbl_po_detail`, `tbl_outstanding_pr` (update) | — (belum ada jurnal) |
| Otorisasi LPB L2 | `tbl_lpb`, `tbl_lpb_detail`, `tbl_jurnal_header`, `tbl_jurnal_detail`, `tbl_kartu_utang` | Debit Stok Bahan / Credit Hutang Supplier |
| Otorisasi Faktur Pajak L2 | `tbl_faktur_pajak`, `tbl_faktur_pajak_detail`, `tbl_jurnal_header`, `tbl_jurnal_detail`, `tbl_kartu_utang` | Debit Hutang Supplier / Credit (per faktur) |
| Koreksi ASC | `tbl_penerimaan_asc`, `tbl_asc_detail` (harga saja) | — |
| Otorisasi L1/L2 | `tbl_otorisasi_transaksi` | — (audit log) |

## 5. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Hapus PO yang sudah punya LPB reference | Tolak + pesan "PO sudah ada LPB, tidak bisa dihapus" |
| Hapus PR yang sudah punya PO reference | Tolak + pesan "PR sudah ada PO reference" |
| Hapus LPB yang sudah punya Faktur Pajak | Tolak + pesan "LPB sudah ada Faktur Pajak" |
| Qty LPB > qty PO | Tolak + pesan "Qty LPB tidak boleh > qty PO" |
| Faktur Pajak tanpa centang LPB | Tolak + pesan "Pilih minimal 1 LPB" |
| Centang LPB yang sudah punya faktur | LPB tidak muncul di daftar (filter otomatis) |
| Edit non-harga di Penerimaan ASC | Field read-only, edit ditolak |
| Quantity carry-through tidak cocok (misal PO < PR) | Warning: "Qty PO < Qty PR, lanjutkan?" |
| Otorisasi L2 tanpa L1 | Tolak: "Otorisasi L1 belum dilakukan" |
| Hapus transaksi sudah diotorisasi penuh | Tolak, harus Batal Otorisasi dulu |
