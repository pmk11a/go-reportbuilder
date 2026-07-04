# Spec: Master Produksi

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Master Data > Master Produksi > [submenu] |
| **Akses** | User dengan akses Master Data + Produksi |
| **CRUD Ops** | Tambah, Koreksi, Hapus per submenu |
| **Validasi** | Karyawan di Tarif TK harus sudah ada di Master Karyawan; tarif harus > 0 |

## 2. Submenu Overview

| No | Submenu | Fungsi |
|----|---------|--------|
| 1 | Master Machine & Tarif | Daftar mesin produksi + biaya pakai |
| 2 | Tarif Tenaga Kerja | Upah per karyawan/kategori |

## 3. Field Reference Table

### 3a. Master Machine & Tarif

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Mesin | String | Ya | Unique |
| Nama Mesin | String | Ya | — |
| Tarif | Decimal | Ya | Biaya pemakaian per satuan (jam / unit) |
| Peminjaman/Alokasi | Enum | Tidak | Sentral / Departemen |

### 3b. Tarif Tenaga Kerja

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Tarif | String | Ya | Unique |
| Keterangan | String | Tidak | — |
| Nama | Lookup | Ya | Dari Master Karyawan (kategori=Produksi) |
| Nick Name | String | Tidak | Nama singkat |
| Tarif | Decimal | Ya | Upah per jam/hari |

## 4. Test Scenarios

### Skenario 1: Tambah mesin baru
```
Given saya di Master Machine & Tarif
When saya input kode "MCH-001", nama "Mesin Cetak Offset"
And tarif "Rp 50.000/jam"
And klik Simpan
Then mesin tersimpan dan muncul di lookup produksi
```

### Skenario 2: Tarif mesin nol
```
Given saya input tarif "0"
When saya klik Simpan
Then sistem menolak dengan pesan "Tarif harus lebih dari 0"
```

### Skenario 3: Tambah tarif TK linked ke karyawan
```
Given Master Karyawan punya "KRY-020" (Andi, kategori Produksi)
When saya di Tarif TK pilih Nama = "KRY-020"
Then field Nick Name otomatis terisi
And saya tinggal input tarif "Rp 25.000/jam"
And klik Simpan → tarif TK tersimpan
```

### Skenario 4: Pilih karyawan non-Produksi di Tarif TK
```
Given saya pilih karyawan "KRY-005" (kategori Sales)
When saya klik Simpan
Then sistem menolak dengan pesan
  "Tarif TK hanya untuk karyawan kategori Produksi"
```

### Skenario 5: Hapus mesin yang sedang dipakai produksi aktif
```
Given mesin "MCH-001" dipakai di SPK aktif
When saya coba hapus
Then sistem menolak + tampilkan "Sedang dipakai di SPK #XYZ"
```

### Skenario 6: Update tarif tidak mempengaruhi history produksi lama
```
Given saya ubah tarif mesin dari Rp 50.000 ke Rp 60.000
When saya Simpan
Then perubahan hanya berlaku untuk produksi baru
Dan laporan historis (completed SPK) tidak berubah
```

## 5. Database Impact

| Aksi | Tabel Affected | Posting |
|------|---------------|---------|
| Tambah mesin | `tbl_mesin`, `tbl_tarif_mesin` | — |
| Tambah tarif TK | `tbl_tarif_tk` | — |
| Update tarif | `tbl_tarif_mesin` / `tbl_tarif_tk` (timestamp) | — |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Kode mesin duplikat | Tolak |
| Karyawan di TK di-nonaktifkan | Tarif TK tetap ada (historical), tapi tidak muncul di lookup TK baru |
| Tarif diubah saat ada produksi berjalan | Tidak retroaktif; produksi berjalan pakai tarif lama |
| Peminjaman/alokasi mesin bentrok | Warning (jika fitur scheduling aktif) |
| Hapus karyawan yang sudah ada di Tarif TK | Tolak atau soft-delete (nonaktifkan di kedua tabel) |
