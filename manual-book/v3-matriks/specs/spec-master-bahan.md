# Spec: Master Bahan & Barang

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Master Data > Master Bahan Barang > [submenu] |
| **Akses** | User dengan akses Master Data + Gudang |
| **CRUD Ops** | Tambah, Koreksi, Hapus per submenu |
| **Validasi** | Group & Subgroup harus konsisten hierarki; konversi satuan valid |

## 2. Submenu Overview

| No | Submenu | Fungsi |
|----|---------|--------|
| 1 | Master Gudang | Lokasi penyimpanan |
| 2 | Group Bahan/Barang | Kategori utama + Subgroup |
| 3 | Master Bahan | Item/produk (bahan baku, bantu, dll) |
| 4 | Barang Jadi Beli | Item finished good yang dibeli jadi |
| 5 | Barang Jadi Produksi | Item hasil produksi |
| 6 | Barang Langsung Biaya | Item yang langsung jadi beban |

## 3. Field Reference Table

### 3a. Master Gudang

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Gudang | String | Ya | Unique |
| Nama Gudang | String | Ya | — |
| Alamat | String | Tidak | — |

### 3b. Group Barang

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Group | String | Ya | Unique |
| Nama Group | String | Ya | Salah satu: Bahan Baku, Bahan Bantu, Bahan Bantu Lain, Barang Jadi Beli, Barang Jadi Produksi |
| Tipe | Enum | Ya | Bahan / Barang |

### 3c. Subgroup (nested di Group)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Subgroup | String | Ya | Unique dalam Group |
| Nama Subgroup | String | Ya | Mis. "Bahan Baku Kertas" |
| Induk | Lookup Group | Ya | Parent group |

### 3d. Master Bahan (Item)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Barang | String | Ya | Unique |
| Nama Barang | String | Ya | — |
| Kode Satuan | Lookup | Ya | Referensi unit of measure |
| Keterangan | Text | Tidak | — |
| Group | Lookup | Ya | Pilih dari master group |
| Subgroup | Lookup | Ya | Auto-filter sesuai group |
| Satuan 1 | String | Ya | Satuan utama |
| Satuan 2 | String | Tidak | Satuan konversi terkecil |
| Konversi | Integer | Tidak | 1 satuan 1 = N satuan 2 |

### 3e. Barang Jadi Produksi

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Item | String | Ya | Unique |
| Bill of Material | Lookup | Ya | Komposisi (referensi master produksi) |
| Akun Persediaan | Lookup COA | Ya | Untuk posting stok |
| Akun HPP | Lookup COA | Ya | Untuk posting HPP saat penjualan |
| Akun Hutang | Lookup COA | Ya | Untuk pembelian bahan |

## 4. Test Scenarios

### Skenario 1: Tambah gudang baru
```
Given saya di Master Gudang
When saya input kode "GD-01", nama "Gudang Pusat", alamat "Jl. Industri 1"
And klik Simpan
Then gudang baru tersimpan dan muncul di lookup transaksi
```

### Skenario 2: Tambah group "Bahan Baku"
```
Given saya di Master Group Barang
When saya input kode "GRP-01", nama "Bahan Baku"
And saya pilih tipe "Bahan"
And klik Simpan
Then group baru muncul sebagai opsi di Master Bahan
```

### Skenario 3: Tambah subgroup di bawah group
```
Given group "Bahan Baku" sudah ada
When saya buat Subgroup "Bahan Baku Kertas"
And saya pilih induk = group "Bahan Baku"
Then subgroup tersimpan
Dan di Master Bahan, saat pilih Group="Bahan Baku"
  → Subgroup otomatis filter ke "Bahan Baku Kertas" saja
```

### Skenario 4: Tambah item dengan 2 satuan
```
Given saya di Master Bahan
When saya input kode "BRG-001", nama "Kertas HVS A4"
And saya pilih Group "Bahan Baku", Subgroup "Kertas"
And Satuan 1 = "Rim", Satuan 2 = "Lembar", Konversi = 500
And klik Simpan
Then item tersimpan dengan relasi konversi 1 Rim = 500 Lembar
```

### Skenario 5: Pilih subgroup yang bukan turunan group
```
Given Group "Bahan Bantu" aktif
When saya coba pilih Subgroup "Bahan Baku Kertas" (yang induknya Bahan Baku)
Then sistem menolak dengan pesan
  "Subgroup tidak sesuai dengan Group yang dipilih"
```

### Skenario 6: Koreksi item yang sudah dipakai transaksi
```
Given item "BRG-001" sudah dipakai di 10 transaksi pembelian
When saya coba hapus item tersebut
Then sistem menolak dengan pesan
  "Item sudah dipakai di transaksi aktif. Nonaktifkan saja."
And field "Status Aktif" di-set false sebagai gantinya
```

### Skenario 7: Buat Barang Jadi Produksi lengkap
```
Given saya di Barang Jadi Produksi
When saya pilih item "BRG-100", tentukan BoM, dan set 3 akun COA
  (Persediaan, HPP, Hutang)
And klik Simpan
Then item jadi produksi tersimpan
Dan bisa dipakai di transaksi produksi & penjualan
```

### Skenario 8: Konversi satuan invalid
```
Given saya input item dengan Satuan 2 = "Lembar"
When saya input Konversi = 0 atau negatif
Then sistem menolak dengan pesan "Konversi harus lebih dari 0"
```

## 5. Database Impact

| Aksi | Tabel Affected | Posting |
|------|---------------|---------|
| Tambah gudang | `tbl_gudang` | — |
| Tambah group/subgroup | `tbl_group_barang`, `tbl_subgroup_barang` | — |
| Tambah item | `tbl_item`, `tbl_item_satuan` | — |
| Koreksi status aktif | `tbl_item` (flag) | — |
| Tambah Barang Jadi Produksi | `tbl_item_produksi`, `tbl_bom` | — |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Kode barang duplikat | Tolak + pesan "Kode sudah ada" |
| Hapus group yang punya subgroup | Tolak + tampilkan "X subgroup masih aktif" |
| Hapus subgroup yang punya item | Tolak + tampilkan daftar item |
| Konversi satuan tanpa Satuan 2 | Tidak perlu divalidasi (boleh kosong) |
| Item tidak punya akun COA | Warning saat coba pakai di transaksi jual/beli |
| Status item nonaktif | Tersembunyi dari lookup transaksi baru, tapi history tetap |
