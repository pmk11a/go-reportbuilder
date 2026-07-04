# Bab 5 — Master Supplier & Customer

## Overview

Modul **Master Supplier & Customer** mengelola seluruh referensi pihak ketiga yang melakukan transaksi dengan perusahaan: supplier (pemasok barang/jasa), customer (pelanggan), beserta struktur geografis (Area, Kota) dan tenaga penjualan (Sales). Modul ini wajib terisi sebelum transaksi utang-piutang, purchasing, maupun marketing dapat diproses. Setiap supplier/customer memiliki detail akun (sub-ledger) yang menentukan rekening posting otomatis.

[SCREENSHOT: master-supplier-customer-menu]

---

## 5.1 Master Area

Pengelompokan geografis level tertinggi untuk supplier/customer.

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Area | Teks | Ya* | Identifier unik area (region/wilayah) |
| Nama Area | Teks | Ya* | Nama deskriptif area (misal: Jawa, Sumatera, Kalimantan) |

[SCREENSHOT: master-area]

---

## 5.2 Master Kota

Berada di bawah Area, merepresentasikan Kabupaten/Kota.

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Kota | Teks | Ya* | Identifier unik kota/kabupaten |
| Nama Kota | Teks | Ya* | Nama kota atau kabupaten |
| Area | Dropdown | Ya* | Pilih dari Master Area (induk hierarki) |

**Hierarki:** Area → Kota. Satu Area dapat memiliki banyak Kota; satu Kota hanya boleh berada di satu Area.

[SCREENSHOT: master-kota]

### Flow Setup Geografis

```
[Setup Area] --> [Setup Kota] --> [Pilih Area Induk]
                                     --> [Simpan]
```

---

## 5.3 Master Supplier

Daftar seluruh pemasok barang/jasa yang bertransaksi dengan perusahaan.

### Tabel Field Utama

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Supplier | Teks | Ya* | Identifier unik supplier |
| Nama Supplier | Teks | Ya* | Nama perusahaan supplier |
| Alamat | Teks | Ya* | Alamat lengkap supplier |
| Telepon | Teks | Ya* | Nomor telepon supplier |
| NPWP | Teks | Ya* | Nomor Pokok Wajib Pajak supplier |
| Kota | Dropdown | Ya* | Pilih dari Master Kota |
| Kontak Person | Teks | - | Nama narahubung di supplier |

### Sub-Detail Akun (RCC — Receivable/Payable Control)

Setiap supplier **wajib** memiliki minimal satu rekening posting utang/piutang.

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Akun | Dropdown | Ya* | Pilih dari Master Perkiraan (COA) |
| Kategori | Dropdown | Ya* | Harta Dagang / Harta Deposito / Harta Lain-Lain |
| Default | Checkbox | Ya* | Tandai sebagai akun default supplier ini |

**Pengaruh:** Ketika transaksi pembelian atau pembayaran utang diinput, sistem akan mem-posting ke rekening yang ditandai **Default** untuk supplier terkait.

[SCREENSHOT: master-supplier]

---

## 5.4 Master Customer

Daftar pelanggan yang membeli produk/jasa perusahaan. Struktur field identik dengan Supplier, dengan perbedaan pada sisi akun.

### Tabel Field Utama

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Customer | Teks | Ya* | Identifier unik customer |
| Nama Customer | Teks | Ya* | Nama perusahaan/customer |
| Alamat | Teks | Ya* | Alamat lengkap customer |
| Telepon | Teks | Ya* | Nomor telepon customer |
| NPWP | Teks | Ya* | NPWP customer |
| Kota | Dropdown | Ya* | Pilih dari Master Kota |
| Kontak Person | Teks | - | Nama narahubung di customer |

### Sub-Detail Akun (Piutang)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Akun | Dropdown | Ya* | Pilih dari Master Perkiraan (COA) — khusus piutang |
| Kategori | Dropdown | Ya* | Piutang Dagang / Piutang Dagang Lain-Lain / Piutang Lain |
| Default | Checkbox | Ya* | Tandai sebagai akun default customer ini |

**Pengaruh:** Penjualan dan penerimaan piutang akan terposting otomatis ke akun default customer ini.

[SCREENSHOT: master-customer]

---

## 5.5 Master Sales (Tenaga Penjualan)

Daftar tenaga penjualan yang berwenang membuat **Sales Order**.

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Sales | Teks | Ya* | Identifier unik sales |
| Nama Sales | Teks | Ya* | Nama lengkap sales |
| Telepon | Teks | Ya* | Nomor telepon sales |
| NPWP | Teks | Ya* | NPWP sales |

### Koneksi ke Master Karyawan

Data sales **diambil/dirujuk** dari **Master Karyawan** dengan filter kategori = **Sales**. Sales Order hanya dapat dibuat oleh karyawan yang berkategori Sales.

[SCREENSHOT: master-sales]

---

## Validation Rules

- Kode Area, Kota, Supplier, Customer, Sales harus **unik** dalam sistem.
- Kota hanya dapat dipilih setelah Area terkait sudah ada di master.
- Setiap supplier/customer **wajib** memiliki minimal satu Sub-Detail Akun.
- Sub-Detail Akun pada supplier/customer harus merujuk ke akun perkiraan yang sesuai (piutang untuk customer, utang untuk supplier).
- Kategori akun harus konsisten: Supplier → utang/dagang; Customer → piutang/dagang.
- Sales hanya dapat dipilih jika karyawan terkait sudah di-setup dengan kategori "Sales" di Master Karyawan (lihat [Bab 7](07-master-lain.md)).

---

## Flow Setup Master Supplier & Customer

```
[Setup Area] --> [Setup Kota (pilih Area)]
                            --> [Setup Supplier / Customer]
                                    --> [Isi data utama]
                                    --> [Setup Sub-Detail Akun (wajib)]
                                    --> [Tandai akun Default]
                            --> [Simpan]
```

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Kode supplier/customer duplikat | "Kode supplier/customer sudah ada dalam sistem" |
| Kota dipilih sebelum Area di-setup | "Pilih area terlebih dahulu" |
| Supplier tanpa Sub-Detail Akun | "Supplier harus memiliki minimal satu akun perkiraan" |
| Akun default customer bukan piutang | "Akun default harus termasuk kategori piutang" |
| Sales tidak terhubung ke karyawan berkategori Sales | "Sales harus terkait dengan karyawan berkategori Sales" |
| Hapus supplier/customer yang masih punya transaksi | "Tidak dapat menghapus: masih ada transaksi terkait" |

---

## Hubungan dengan Modul Lain

- **Master Accounting (COA)** → menyediakan daftar akun piutang/utang yang dipilih di Sub-Detail Akun.
- **Master Karyawan** → Sales harus berasal dari karyawan berkategori "Sales" (lihat [Bab 7](07-master-lain.md)).
- **Transaksi Kas Bank** → Sub-Detail Akun supplier/customer menjadi target posting BKK/BKM saat pelunasan (lihat [Bab 8](08-kasbank.md)).
- **Transaksi Memorial** → jurnal utang/piutang memilih supplier/customer dari master ini (lihat [Bab 9](09-memorial.md)).
- **Master Area → Kota** → dipakai juga di alamat supplier/customer untuk pelaporan geografis.