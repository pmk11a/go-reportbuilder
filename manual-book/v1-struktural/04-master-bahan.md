# Bab 4 — Master Bahan & Barang

## Overview

Modul **Master Bahan & Barang** mengelola seluruh referensi inventaris perusahaan: gudang, pengelompokan barang, dan item-item bahan maupun barang jadi. Sebelum transaksi stok atau produksi, master ini harus terisi.

[SCREENSHOT: master-bahan-menu]

---

## 4.1 Master Gudang

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Gudang | Teks | Ya* | Identifier unik (misal GD-01) |
| Nama Gudang | Teks | Ya* | Nama deskriptif gudang |
| Alamat | Teks | Ya* | Lokasi gudang |

[SCREENSHOT: master-gudang]

---

## 4.2 Group Bahan / Barang

Pengelompokan barang berdasarkan jenis dan fungsinya.

### Kategori Group

| Group | Penggunaan |
|-------|------------|
| Bahan Baku | Material utama produksi |
| Bahan Bantu | Material pendukung produksi |
| Bahan Bantu Lain | Material pendukung non-utama |
| Barang Jadi Beli | Produk yang dibeli jadi dari supplier |
| Barang Jadi Produksi | Produk hasil produksi sendiri |
| Barang Langsung Biaya | Barang yang langsung menjadi beban biaya |

### Tabel Field — Group

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Group | Teks | Ya* | Identifier group |
| Nama Group | Teks | Ya* | Deskripsi group |
| Kategori | Dropdown | Ya* | Salah satu dari daftar di atas |

### Subgroup (Nested di Bawah Group)

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Subgroup | Teks | Ya* | Identifier subgroup |
| Nama Subgroup | Teks | Ya* | Sub-kategori dalam group |
| Group Induk | Dropdown | Ya* | Pilih group yang menaungi |

**Contoh hierarki:** Group: Bahan Baku → Subgroup: Bahan Baku Kertas → Subgroup: Bahan Baku Kimia.

[SCREENSHOT: group-subgroup]

---

## 4.3 Master Bahan (Item / Produk)

Daftar lengkap item/barang yang digunakan dalam operasional.

### Tabel Field Utama

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Barang | Teks | Ya* | Kode unik item (SKU) |
| Nama Barang | Teks | Ya* | Nama item |
| Group | Dropdown | Ya* | Pilih dari Master Group |
| Subgroup | Dropdown | Ya* | Auto-filter sesuai group |
| Kode Satuan | Dropdown | Ya* | Unit of measure (kg, pcs, m, dll) |
| Keterangan | Teks | Tidak* | Catatan tambahan |

### Konversi Satuan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Satuan 1 | Dropdown | Ya* | Satuan utama |
| Satuan 2 | Dropdown | Ya* | Satuan konversi terkecil |
| Konversi | Angka | Ya* | 1 satuan atas = ? satuan terkecil |

**Contoh:** 1 Box = 12 Pcs → Satuan 1: Box, Satuan 2: Pcs, Konversi: 12.

[SCREENSHOT: master-bahan-form]

### Hubungan ke Akun Perkiraan

Setiap master bahan terkait dengan **4 akun perkiraan** (otomatis ter-setup di Master Accounting):

```
Master Bahan --> 1. Akun Persediaan (di Neraca)
              -> 2. Akun Hutang Dagang (saat pembelian)
              -> 3. Akun HPP / Beban Pokok Penjualan
              -> 4. Akun Lain (penyesuaian)
```

---

## 4.4 Barang Jadi Beli

Item yang dibeli dalam bentuk sudah jadi (bukan hasil produksi sendiri). Field sama dengan Master Bahan dengan flag/kategori otomatis = "Barang Jadi Beli".

---

## 4.5 Barang Jadi Produksi

Item yang dihasilkan dari proses produksi internal. Field sama dengan Master Bahan, dengan flag/kategori = "Barang Jadi Produksi".

---

## 4.6 Barang Langsung Biaya

Barang yang langsung dibebankan sebagai biaya pada periode pembelian (tidak masuk persediaan).

---

## Flow Setup Master Bahan

```
[Setup Group] --> [Setup Subgroup di bawah group]
                            --> [Setup Master Bahan (item)]
                            --> [Pilih Group & Subgroup]
                            --> [Tentukan Satuan & Konversi]
                            --> [Simpan]
```

---

## Validation Rules

- Kode barang harus **unik** dalam sistem.
- Subgroup hanya dapat dipilih setelah Group ditentukan.
- Konversi satuan 1 dan satuan 2 tidak boleh sama.
- Group kategori menentukan akun-akun perkiraan yang akan terhubung otomatis.

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Duplikat kode barang | "Kode barang sudah ada dalam sistem" |
| Subgroup tanpa group | "Pilih group terlebih dahulu" |
| Satuan 1 = Satuan 2 | "Satuan 1 dan Satuan 2 tidak boleh sama" |
| Group dihapus masih punya item | "Group tidak dapat dihapus karena masih ada item terkait" |

---

## Catatan

> Master Bahan adalah fondasi untuk transaksi Purchasing, Produksi, dan Gudang. Pastikan semua data terisi lengkap dan konsisten untuk menghindari error di transaksi selanjutnya.