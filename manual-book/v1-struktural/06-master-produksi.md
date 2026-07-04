# Bab 6 — Master Produksi

## Overview

Modul **Master Produksi** berisi referensi yang mendukung proses produksi internal: **Master Machine & Tarif** (pengelolaan mesin dan biaya pemakaian) serta **Tarif Tenaga Kerja** (upah pekerja yang dirujuk dari Master Karyawan). Data ini digunakan oleh modul **Produksi** untuk perhitungan biaya produksi otomatis saat membuat job order atau production order.

[SCREENSHOT: master-produksi-menu]

---

## 6.1 Master Machine & Tarif

Pengelolaan mesin produksi beserta tarif biaya pemakaiannya.

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Mesin | Teks | Ya* | Identifier unik mesin |
| Nama Mesin | Teks | Ya* | Nama deskriptif mesin |
| Tarif | Angka | Ya* | Biaya pemakaian mesin (per jam/hari/batch) |
| Peminjaman/Alokasi | Teks | - | Info mesin yang dipinjam/dialokasikan ke departemen/proyek tertentu |

### Validasi

- Kode mesin harus **unik** di seluruh sistem.
- Tarif bernilai **positif** (angka > 0).
- Peminjaman/Alokasi bersifat opsional — hanya diisi bila ada instruksi khusus.

[SCREENSHOT: master-machine]

### Flow Setup Machine

```
[Buka Master Machine & Tarif] --> [Isi Kode Mesin]
                                       --> [Isi Nama Mesin]
                                       --> [Isi Tarif (nominal biaya)]
                                       --> [Isi Peminjaman/Alokasi (opsional)]
                                       --> [Simpan]
```

---

## 6.2 Tarif Tenaga Kerja

Pengelolaan tarif upah tenaga kerja, dengan nama karyawan **diambil secara otomatis** dari Master Karyawan (Bab 7).

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Tarif | Teks | Ya* | Identifier unik tarif |
| Keterangan | Teks | - | Deskripsi tarif (misal: "Upah borongan welding") |
| Nama Karyawan | Dropdown | Ya* | Diambil dari Master Karyawan |
| Nick Name | Teks | - | Nama singkat (alias) karyawan |
| Tarif | Angka | Ya* | Upah per jam/hari (nominal) |

**Integrasi:** Nama karyawan diambil langsung dari **Master Karyawan** di Bab 7 — memastikan konsistensi data karyawan di seluruh modul. Tidak dapat menambah karyawan baru di sini; karyawan harus sudah ada di master sebelum tarif bisa di-link.

[SCREENSHOT: master-tarif-tenaga-kerja]

### Flow Setup Tarif Tenaga Kerja

```
[Setup Master Karyawan terlebih dahulu (Bab 7)]
                                          --> [Buka Tarif Tenaga Kerja]
                                          --> [Isi Kode Tarif]
                                          --> [Pilih Nama Karyawan dari dropdown]
                                          --> [Isi Nick Name (opsional)]
                                          --> [Isi Tarif]
                                          --> [Simpan]
```

---

## Validation Rules

- Kode mesin dan kode tarif harus **unik** dalam sistem.
- Tarif (mesin maupun tenaga kerja) tidak boleh nol atau negatif.
- Nama karyawan di Tarif Tenaga Kerja **wajib** sudah terdaftar di Master Karyawan — sistem menolak input manual bebas.
- Mesin yang sudah ter-link ke job order produksi tidak dapat dihapus sebelum job tersebut selesai.
- Mengganti tarif tenaga kerja di masa depan **tidak mengubah** riwayat produksi yang sudah terjadi (tarif bersifat point-in-time per transaksi produksi).

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Kode mesin duplikat | "Kode mesin sudah ada dalam sistem" |
| Tarif bernilai nol atau negatif | "Tarif harus lebih besar dari nol" |
| Nama karyawan belum di Master Karyawan | "Pilih karyawan dari Master Karyawan terlebih dahulu" |
| Hapus mesin yang masih dipakai di job order | "Tidak dapat menghapus: mesin masih aktif pada job order" |
| Hapus tarif tenaga kerja yang masih ada riwayat produksi | "Tidak dapat menghapus: tarif masih digunakan di riwayat produksi" |

---

## Hubungan dengan Modul Lain

- **Master Karyawan (Bab 7)** → tarif tenaga kerja merujuk nama dari master ini.
- **Modul Produksi** → menggunakan tarif mesin dan tenaga kerja untuk menghitung **Biaya Produksi** (HPP produksi).
- **Memorial (Bab 9)** → biaya produksi yang belum dibayar dapat dicatat via jurnal utang.