# Bab 7 — Master Lain-Lain

## Overview

Modul **Master Lain-Lain** mengelompokkan semua referensi yang tidak terikat langsung ke modul accounting, bahan, maupun supplier/customer: **Departemen**, **Jabatan**, **Karyawan**, dan **Daftar Desain**. Modul ini menjadi fondasi organisasi perusahaan — digunakan oleh Setup User (Bab 2), validasi Sales Order (Sales), dan perhitungan biaya produksi (Tarif Tenaga Kerja).

[SCREENSHOT: master-lain-menu]

---

## 7.1 Master Departemen

Pengelolaan unit organisasi perusahaan.

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Departemen | Teks | Ya* | Identifier unik departemen (misal: DEP-01) |
| Nama Departemen | Teks | Ya* | Nama unit organisasi (misal: Produksi, Akuntansi) |

[SCREENSHOT: master-departemen]

---

## 7.2 Master Jabatan

Pengelolaan posisi/role dalam struktur organisasi.

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Jabatan | Teks | Ya* | Identifier unik jabatan |
| Nama Jabatan | Teks | Ya* | Nama posisi (misal: Staff Gudang, Supervisor Produksi) |

[SCREENSHOT: master-jabatan]

---

## 7.3 Master Karyawan

Pusat data seluruh karyawan. Data ini menjadi sumber referensi untuk **Set Pemakaian** (otorisasi level), validasi pembuatan **Sales Order** (kategori), dan pengisian **Tarif Tenaga Kerja** (Bab 6).

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Karyawan | Teks | Ya* | Identifier unik karyawan |
| Nama Lengkap | Teks | Ya* | Nama sesuai KTP/surat resmi |
| Tempat Lahir | Teks | Ya* | Kota tempat lahir |
| Tanggal Lahir | Date | Ya* | Tanggal lahir |
| Alamat | Teks | Ya* | Alamat lengkap |
| Nomor Telepon | Teks | Ya* | Nomor telepon/handphone |
| Gender | Dropdown | Ya* | Laki-laki / Perempuan |
| Departemen | Dropdown | Ya* | Pilih dari Master Departemen |
| Jabatan | Dropdown | Ya* | Pilih dari Master Jabatan |
| Kategori Karyawan | Dropdown | Ya* | Sales / Produksi / Lainnya |
| Status | Dropdown | Ya* | Aktif / Tidak Aktif |

### Pengaruh Kategori Karyawan

| Kategori | Implikasi |
|----------|-----------|
| **Sales** | Berwenang membuat **Sales Order**; juga tampil di dropdown Master Sales (Bab 5) |
| **Produksi** | Dapat ditugaskan ke job order produksi; nama muncul di Tarif Tenaga Kerja (Bab 6) |
| **Lainnya** | Tidak memiliki implikasi khusus selain sebagai referensi data karyawan |

### Pengaruh Status

- **Aktif**: karyawan tampil di dropdown dan dapat terlibat dalam transaksi.
- **Tidak Aktif**: karyawan **tidak tampil** di dropdown pilihan, namun data historisnya tetap tersimpan di laporan masa lalu.

[SCREENSHOT: master-karyawan]

### Flow Setup Karyawan

```
[Setup Departemen] + [Setup Jabatan] --> [Buka Master Karyawan]
                                                       --> [Isi Kode & Nama Lengkap]
                                                       --> [Isi Tempat & Tanggal Lahir]
                                                       --> [Pilih Departemen & Jabatan]
                                                       --> [Pilih Kategori (Sales/Produksi/Lainnya)]
                                                       --> [Set Status: Aktif/Tidak Aktif]
                                                       --> [Simpan]
```

---

## 7.4 Daftar Desain

Daftar desain layout/cetakan yang digunakan untuk mencetak laporan, faktur, SPK, atau dokumen resmi lainnya.

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Desain | Teks | Ya* | Identifier unik desain |
| Nama Desain | Teks | Ya* | Deskripsi desain (misal: "Faktur Standar") |
| Tipe Dokumen | Dropdown | Ya* | Jenis dokumen: Faktur, SPK, PO, Laporan, dll |
| File/Layout | Teks | Ya* | Path atau referensi template desain |
| Keterangan | Teks | - | Catatan tambahan |

> **Catatan:** Detail teknis Daftar Desain tidak dijelaskan secara rinci dalam transkrip audio. Field di atas adalah inferensi berdasarkan fungsi setup report di [Bab 2](02-setup.md) yang menyebutkan hak akses "Desain Report".

[SCREENSHOT: master-desain]

---

## Validation Rules

- Kode departemen, jabatan, dan karyawan harus **unik** dalam sistem.
- Kategori karyawan tidak dapat diubah setelah karyawan memiliki riwayat transaksi (historis harus terjaga).
- Status karyawan yang beralih ke "Tidak Aktif" **tidak menghapus** data — hanya menyembunyikan dari dropdown.
- Karyawan hanya dapat masuk ke **satu departemen** dan **satu jabatan** per record.
- Sub-Detail Akun COA di [Bab 2](02-setup.md) membatasi user mana yang boleh melihat perkiraan mana — pengaruh ini berlaku seragam di seluruh modul.

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Kode karyawan duplikat | "Kode karyawan sudah ada dalam sistem" |
| Karyawan belum pilih departemen | "Pilih departemen terlebih dahulu" |
| Mengubah kategori Sales jadi non-Sale setelah ada SO | "Tidak dapat mengubah kategori: karyawan sudah membuat Sales Order" |
| Hapus departemen yang masih punya karyawan | "Tidak dapat menghapus: masih ada karyawan di departemen ini" |
| Hapus jabatan yang masih ada karyawan | "Tidak dapat menghapus: masih ada karyawan dengan jabatan ini" |

---

## Hubungan dengan Modul Lain

- **Master Supplier/Customer (Bab 5)** → Sales dipilih dari karyawan berkategori "Sales".
- **Master Produksi (Bab 6)** → Nama karyawan di Tarif Tenaga Kerja diambil dari master ini.
- **Setup Pemakaian (Bab 2)** → Jabatan karyawan dipakai saat setup user management dan validasi otorisasi.
- **Set Report (Bab 2)** → Akses report diberikan per user yang linked ke karyawan.
- **Otorisasi Berjenjang (Bab 2)** → orang yang mengotorisasi berdasarkan data karyawan ini.