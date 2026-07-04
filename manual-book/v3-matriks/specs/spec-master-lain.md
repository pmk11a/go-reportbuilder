# Spec: Master Lain-Lain

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Master Data > Master Lain-Lain > [submenu] |
| **Akses** | User dengan akses Master Data + HR/Admin |
| **CRUD Ops** | Tambah, Koreksi, Hapus per submenu |
| **Validasi** | Kode unique per submenu; kategori karyawan menentukan hak sistem |

## 2. Submenu Overview

| No | Submenu | Fungsi |
|----|---------|--------|
| 1 | Departemen | Struktur organisasi |
| 2 | Jabatan | Posisi/jabatan |
| 3 | Master Karyawan | Data personel |
| 4 | Daftar Desain | Katalog desain produk (detail belum ditranskrip) |
| 5 | Valas | Master kurs mata uang (di Line-Line Lain) |

## 3. Field Reference Table

### 3a. Departemen

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Departemen | String | Ya | Unique |
| Nama Departemen | String | Ya | — |

### 3b. Jabatan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Jabatan | String | Ya | Unique |
| Nama Jabatan | String | Ya | — |

### 3c. Master Karyawan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Karyawan | String | Ya | Unique |
| Nama Lengkap | String | Ya | — |
| Tempat Lahir | String | Tidak | — |
| Tanggal Lahir | Date | Tidak | — |
| Alamat | String | Tidak | — |
| Telepon | String | Tidak | — |
| Status Aktif | Boolean | Ya | Default: Aktif |
| Kategori | Enum | Ya | Sales / Produksi / Lainnya |
| Gender | Enum | Tidak | L/P |

### 3d. Valas (Mata Uang)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Valas | String (3 char) | Ya | ISO 4217 (IDR, USD, SGD, dll) |
| Nama Valas | String | Ya | — |
| Kurs | Decimal | Ya | Rate terhadap mata uang dasar |
| Tanggal Kurs | Date | Ya | Tanggal kurs berlaku |

## 4. Test Scenarios

### Skenario 1: Tambah departemen baru
```
Given saya di Master Departemen
When saya input kode "DEPT-01", nama "Produksi"
And klik Simpan
Then departemen tersimpan
Dan muncul di pilihan saat tambah karyawan
```

### Skenario 2: Tambah jabatan baru
```
Given saya di Master Jabatan
When saya input kode "JBT-01", nama "Supervisor Produksi"
And klik Simpan
Then jabatan tersimpan
```

### Skenario 3: Tambah karyawan kategori Sales
```
Given saya di Master Karyawan
When saya input kode "KRY-005", nama "Budi Santoso"
And saya pilih kategori "Sales"
And klik Simpan
Then karyawan tersimpan
Dan otomatis eligible untuk dibuat Sales di Master Supplier Customer
```

### Skenario 4: Karyawan non-Sales tidak bisa buat Sales Order
```
Given karyawan "KRY-010" kategori "Produksi"
When dia coba akses menu buat Sales Order
Then sistem menolak dengan pesan
  "Hanya karyawan kategori Sales yang bisa membuat Sales Order"
```

### Skenario 5: Set kurs valas baru
```
Given saya di Master Valas
When saya input kode "USD", nama "US Dollar", kurs "Rp 15.500"
And tanggal kurs "2026-06-26"
And klik Simpan
Then valas tersimpan
Dan saat transaksi pakai USD, kurs otomatis terisi 15.500
```

### Skenario 6: Nonaktifkan karyawan
```
Given karyawan "KRY-005" sudah tidak aktif
When saya ubah status ke "Tidak Aktif" dan Simpan
Then karyawan tidak muncul di lookup SO baru
Dan jika ada SO aktif yang dibuatnya, tetap valid (tidak auto-cancel)
```

### Skenario 7: Update kurs tanpa tanggal
```
Given saya input kurs tanpa isi tanggal
When saya klik Simpan
Then sistem menolak dengan pesan "Tanggal kurs wajib diisi"
```

### Skenario 8: Daftar Desain (placeholder)
```
Given submenu Daftar Desain
When saya akses
Then sistem menampilkan katalog desain (detail input/output
  belum ditranskrip — placeholder untuk iterasi berikutnya)
```

## 5. Database Impact

| Aksi | Tabel Affected | Posting |
|------|---------------|---------|
| Tambah departemen | `tbl_departemen` | — |
| Tambah jabatan | `tbl_jabatan` | — |
| Tambah karyawan | `tbl_karyawan` | — |
| Update status karyawan | `tbl_karyawan` (flag is_active) | — |
| Set kurs valas | `tbl_valas`, `tbl_kurs_history` | — |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Hapus departemen yang punya karyawan aktif | Tolak + tampilkan jumlah karyawan terkait |
| Kode karyawan duplikat | Tolak |
| Karyawan Sales dijadikan kategori Produksi | Warning: "Sales Order yang sudah ada tetap valid" |
| Kurs valas duplikat di tanggal sama | Tolak (hanya 1 kurs aktif per valas per tanggal) |
| Valas IDR (mata uang dasar) | Tidak perlu kurs |
| Karyawan sudah linked ke Tarif TK, lalu dihapus | Soft-delete saja (nonaktifkan, jangan hard delete) |
