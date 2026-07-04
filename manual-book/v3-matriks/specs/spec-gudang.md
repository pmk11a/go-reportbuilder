# Spec: Gudang (Warehouse)

> Alur: **Pengeluaran Bahan** (linked dari SPK/Permintaan Bahan) → **Retur Bahan**, plus **Koreksi Bahan** & **Opname**

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Gudang > Pengeluaran Bahan / Retur Bahan / Koreksi Bahan / Ubah Ukuran / Opname |
| **Akses** | Staff Gudang + Otorisasi L1 |
| **CRUD Ops** | Tambah, Koreksi, Otorisasi L1, Batal Otorisasi |
| **Validasi** | Bahan harus ada di sub-detail SPK/Permintaan Bahan Tambahan (sudah diotorisasi) |
| **Sub-Ledger** | Stok Bahan, Kartu Bahan, Buku Besar |

### Submenu Gudang (5 menu)

| # | Submenu | Fungsi |
|---|---------|--------|
| 1 | **Pengeluaran Bahan** | Bahan keluar ke produksi (linked dari SPK/Permintaan Bahan) |
| 2 | **Retur Bahan** | Pengembalian bahan ke gudang |
| 3 | **Koreksi Bahan** | Adjustment stok (masuk/keluar non-produksi) |
| 4 | **Ubah Ukuran Bahan** | Konversi satuan/ukuran |
| 5 | **Opname Barang** | Stok opname (penghitungan fisik) |

### Otorisasi

| Aksi | Level | Effect |
|------|-------|--------|
| Pengeluaran Bahan | L1 | Stok berkurang + jurnal |
| Retur Bahan | L1 | Stok bertambah + jurnal |
| Koreksi Bahan | L1 (per adjustment) | Stok ter-adjust + jurnal |
| Ubah Ukuran Bahan | (skip di transkrip) | — |
| Opname | via Koreksi Bahan | Auto-generate koreksi |

## 2. Field Reference Table

### 2a. Header Pengeluaran Bahan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Gudang | Lookup Gudang | Ya | Pilih gudang asal (dropdown) |
| Nomor SPK | Lookup SPK | Ya | Auto-link dari SPK yang butuh bahan |
| Nomor Penyerahan | String | Auto | Auto-generated |
| Tanggal | Date | Ya | Default: hari ini |

### 2b. Detail Pengeluaran Bahan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kelompok Bahan | String | Auto | Auto dari master |
| Kode Bahan | Lookup Item | Ya | **Hanya dari sub-detail SPK/Permintaan Bahan yang sudah diotorisasi** |
| Kuantitas | Decimal | Ya | Jumlah yang akan keluar |
| Keterangan | Text | Tidak | Tujuan penggunaan |

### 2c. Header Retur Bahan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor Penyerahan Asal | Lookup Penyerahan | Ya | Pilih penyerahan bahan asal yang akan diretur |
| Tanggal Retur | Date | Ya | — |
| Keterangan | Text | Ya | Alasan retur |

### 2d. Detail Retur Bahan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Bahan | Lookup Item | Ya | — |
| Kuantitas Retur | Decimal | Ya | **TIDAK BOLEH > qty pernah dikeluarkan** |
| Keterangan | Text | Tidak | — |

### 2e. Koreksi Bahan (Adjustment)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor Penyerahan | String | Auto | Auto-generated |
| Gudang | Lookup Gudang | Ya | — |
| Tipe Koreksi | Enum | Ya | Masuk (+) / Keluar (−) |
| Keterangan | Text | Ya | Alasan (rusak, selisih opname, dll) |
| Sub-detail Bahan | Grid | Ya | List bahan yang di-adjust |

### 2f. Opname Barang

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Tanggal Opname | Date | Ya | — |
| Gudang | Lookup Gudang | Ya | — |
| Hasil Opname | Grid | Ya | Qty fisik per barang |
| Selisih | Auto | — | Positif = kurang di sistem, negatif = lebih |

## 3. Test Scenarios

### Skenario 1: Buat Pengeluaran Bahan dari SPK
```
Given SPK "SPK-100" sudah punya detail bahan (sudah diotorisasi)
When saya buka Pengeluaran Bahan
And pilih SPK-100
Then detail bahan auto-fill dari sub-detail SPK
When saya isi kuantitas + Gudang
And klik Simpan + Otorisasi L1
Then stok bahan berkurang
And jurnal: Debit WIP / Credit Stok Bahan
```

### Skenario 2: Pilih bahan di luar SPK → ditolak
```
Given SPK-100 punya detail bahan [BRG-A, BRG-B]
When saya coba tambah bahan "BRG-C" (bukan di SPK)
Then sistem menolak: "Bahan harus ada di sub-detail SPK"
```

### Skenario 3: Pengeluaran Bahan tanpa otorisasi → stok belum berkurang
```
Given saya sudah simpan Pengeluaran Bahan (status: Draft)
When saya cek stok bahan
Then stok belum berkurang (masih menunggu otorisasi)
```

### Skenario 4: Otorisasi Pengeluaran Bahan L1 → stok berkurang + jurnal
```
Given Pengeluaran Bahan status Draft
When user L1 klik Otorisasi
Then status: L1 approved
And stok bahan berkurang sesuai qty
And jurnal terbentuk di buku besar
```

### Skenario 5: Retur Bahan dengan qty > qty ambil → ditolak
```
Given saya pernah ambil BRG-A qty 100 dari SPK
When saya buat Retur Bahan qty 150
Then sistem menolak: "Qty retur tidak boleh > qty pernah keluar"
```

### Skenario 6: Retur Bahan valid → stok bertambah
```
Given Penyerahan BRG-A qty 100 sudah diotorisasi
When saya buat Retur Bahan qty 30
And otorisasi L1
Then stok BRG-A bertambah 30
And jurnal retur terbentuk
```

### Skenario 7: Koreksi Bahan masuk (qty +)
```
Given saya buat Koreksi Bahan dengan tipe "Masuk"
And isi BRG-A qty +50, alasan "Barang ditemukan di gudang lain"
When otorisasi L1
Then stok BRG-A bertambah 50
And jurnal terbentuk
```

### Skenario 8: Koreksi Bahan keluar (qty −)
```
Given saya buat Koreksi Bahan dengan tipe "Keluar"
And isi BRG-A qty -20, alasan "Barang rusak"
When otorisasi L1
Then stok BRG-A berkurang 20
And jurnal terbentuk
```

### Skenario 9: Opname menghasilkan selisih
```
Given saya jalankan Opname Gudang
And stok sistem BRG-A = 100
And stok fisik = 95 (selisih -5)
When opname selesai
Then sistem auto-generate Koreksi Bahan qty -5
And tunggu otorisasi L1
```

### Skenario 10: Pengeluaran Bahan dari multi-gudang
```
Given saya buat Pengeluaran Bahan dengan 2 gudang (G1, G2)
When saya isi qty dari G1 dan G2
Then masing-masing gudang track terpisah
And total qty keluar = qty G1 + qty G2
```

## 4. Database Impact

| Aksi | Tabel Affected | Posting Debit/Credit |
|------|---------------|---------------------|
| Simpan Pengeluaran Bahan | `tbl_penyerahan_bahan`, `tbl_penyerahan_detail` | — (Draft) |
| Otorisasi L1 Pengeluaran | `tbl_penyerahan_bahan.status`, `tbl_stok_bahan` (kurang), `tbl_jurnal_header`, `tbl_jurnal_detail`, `tbl_kartu_bahan` | Debit WIP / Credit Stok Bahan |
| Simpan Retur Bahan | `tbl_retur_bahan`, `tbl_retur_bahan_detail` | — (Draft) |
| Otorisasi L1 Retur | `tbl_retur_bahan.status`, `tbl_stok_bahan` (tambah), `tbl_jurnal_header`, `tbl_jurnal_detail`, `tbl_kartu_bahan` | Debit Stok Bahan / Credit WIP (reverse) |
| Koreksi Bahan | `tbl_koreksi_bahan`, `tbl_stok_bahan` (adjust), `tbl_jurnal_header`, `tbl_jurnal_detail` | Debit/Credit adjustment account |
| Opname | `tbl_opname`, `tbl_opname_detail`, `tbl_koreksi_bahan` (auto-generate) | — (trigger koreksi) |

## 5. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Pilih bahan di luar sub-detail SPK | Tolak: "Bahan harus ada di sub-detail SPK" |
| Qty retur > qty pernah keluar | Tolak: "Qty retur tidak boleh > qty pernah keluar" |
| Pengeluaran tanpa otorisasi | Stok belum berkurang |
| Multi-gudang salah satu tidak valid | Tolak: "Salah satu gudang tidak valid" |
| Opname tanpa hasil input | Tolak: "Hasil opname belum lengkap" |
| Koreksi Bahan tanpa alasan | Tolak: "Alasan koreksi wajib diisi" |
| Bahan yang sudah close-period | Tolak: "Bahan sudah di-close period ini" |
| Otorisasi L1 tanpa ada L0 entry | Tolak: "Harus entry dulu sebelum otorisasi" |
| Edit Pengeluaran Bahan yang sudah diotorisasi | Tolak: "Batalkan otorisasi dulu" |
| Qty pengambilan > qty rencana SPK | Tolak: "Tidak bisa melebihi rencana SPK" |
