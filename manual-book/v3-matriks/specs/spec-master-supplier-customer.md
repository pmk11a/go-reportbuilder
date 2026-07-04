# Spec: Master Supplier & Customer

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Master Data > Master Supplier Customer > [submenu] |
| **Akses** | User dengan akses Master Data + Accounting/Purchasing/Sales |
| **CRUD Ops** | Tambah, Koreksi, Hapus per submenu |
| **Validasi** | NPWP format; detail akun harus sesuai klasifikasi; sales harus linked ke karyawan |

## 2. Submenu Overview

| No | Submenu | Fungsi |
|----|---------|--------|
| 1 | Area | Wilayah/region |
| 2 | Kota | Kabupaten/Kota (hierarki Area) |
| 3 | Supplier | Vendor / pemberi barang-jasa |
| 4 | Customer | Pembeli / penerima barang-jasa |
| 5 | Sales | Personel sales (linked ke Master Karyawan) |

## 3. Field Reference Table

### 3a. Area

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Area | String | Ya | Unique |
| Nama Area | String | Ya | Mis. "Jawa Barat" |

### 3b. Kota

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Kota | String | Ya | Unique |
| Nama Kota | String | Ya | — |
| Kabupaten | String | Tidak | — |
| Area | Lookup | Ya | Referensi Master Area |

### 3c. Supplier

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Supplier | String | Ya | Unique |
| Nama Supplier | String | Ya | — |
| Alamat | String | Ya | — |
| Telepon | String | Tidak | — |
| NPWP | String (15 digit) | Tidak | Validasi format |
| Perkiraan Kas/Piutang | Lookup COA | Ya | Akun default posting |
| Jenis Harta | Enum | Ya | Harta Dagang / Harta Deposito / Harta Lain-lain |

### 3d. Customer

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Customer | String | Ya | Unique |
| Nama Customer | String | Ya | — |
| Alamat | String | Ya | — |
| Telepon | String | Tidak | — |
| NPWP | String (15 digit) | Tidak | Validasi format |
| Perkiraan Piutang | Lookup COA | Ya | Akun piutang customer |
| Kategori Piutang | Enum | Ya | Harta Dagang Lain-lain / Piutang Lain |

### 3e. Sales

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Sales | String | Ya | Unique |
| Nama Sales | String | Ya | — |
| Telepon | String | Tidak | — |
| NPWP | String (15 digit) | Tidak | — |
| Link ke Karyawan | Lookup | Ya | Referensi Master Karyawan (kategori=Sales) |

## 4. Test Scenarios

### Skenario 1: Tambah area baru
```
Given saya di Master Area
When saya input kode "AR-01", nama "DKI Jakarta"
And klik Simpan
Then area tersimpan
Dan muncul sebagai opsi di Master Kota
```

### Skenario 2: Tambah kota di bawah area
```
Given area "DKI Jakarta" sudah ada
When saya input kode "KOTA-01", nama "Jakarta Selatan", area = "DKI Jakarta"
And klik Simpan
Then kota tersimpan dengan relasi ke area
```

### Skenario 3: Tambah supplier dengan NPWP valid
```
Given saya di Master Supplier
When saya input kode "SUP-001", nama "PT Maju Jaya", NPWP "01.234.567.8-901.000"
And saya pilih perkiraan "2-1001" (Utang Dagang)
And jenis "Harta Dagang"
And klik Simpan
Then supplier tersimpan
Dan saat transaksi pembelian, otomatis posting ke akun Utang Dagang
```

### Skenario 4: NPWP format invalid
```
Given saya input NPWP "12345678"
Then sistem menolak dengan pesan "Format NPWP tidak valid (contoh: 01.234.567.8-901.000)"
```

### Skenario 5: Hapus customer yang punya piutang aktif
```
Given customer "CUST-001" punya piutang belum lunas Rp 5.000.000
When saya klik Hapus
Then sistem menolak dengan pesan
  "Customer masih punya piutang aktif. Lunasi dulu."
```

### Skenario 6: Sales harus linked ke karyawan kategori Sales
```
Given saya di Master Sales
When saya pilih karyawan "KRY-005" (kategori="Sales")
Then field otomatis terisi dengan data karyawan (nama, telepon, NPWP)
And sales tersimpan
```

### Skenario 7: Coba link sales ke karyawan non-Sales
```
Given saya pilih karyawan "KRY-010" (kategori="Produksi")
When saya klik Simpan
Then sistem menolak dengan pesan
  "Karyawan bukan kategori Sales. Pilih dari master karyawan yang berkategori Sales."
```

### Skenario 8: Sales Order hanya bisa dibuat oleh user berkategori Sales
```
Given user "KRY-005" adalah sales (kategori Sales)
When dia membuat Sales Order
Then sistem menerima dan otorisasi normal
And jika user lain (non-sales) coba buat SO → ditolak
```

## 5. Database Impact

| Aksi | Tabel Affected | Posting |
|------|---------------|---------|
| Tambah area | `tbl_area` | — |
| Tambah kota | `tbl_kota` | — |
| Tambah supplier | `tbl_supplier`, `tbl_supplier_akun` | — |
| Tambah customer | `tbl_customer`, `tbl_customer_akun` | — |
| Tambah sales | `tbl_sales` (link ke `tbl_karyawan`) | — |
| Koreksi NPWP | `tbl_supplier` / `tbl_customer` | — |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Area punya kota aktif | Tidak bisa hapus area |
| Supplier tanpa NPWP | Boleh (NPWP opsional), tapi warning saat transaksi > Rp 5 juta |
| Customer duplikat nama | Boleh (tidak unique), hanya kode yang unique |
| Hapus sales yang punya SO aktif | Tolak + tampilkan daftar SO |
| Karyawan yang sudah jadi sales, ubah kategori ke non-Sales | Warning: "Sales ini akan kehilangan akses buat SO" |
| Jenis harta supplier diubah setelah ada transaksi | Tolak (perlu buat supplier baru) |
