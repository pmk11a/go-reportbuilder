# Bab 9 — Transaksi Memorial (Jurnal Entry)

## Overview

Menu **Memorial** di bawah modul **Akunting** digunakan untuk transaksi **jurnal entry manual** yang tidak melalui jalur kas/bank langsung. Memorial menangani empat jenis transaksi utama: **jurnal perkiraan biasa** (beban vs sumber dana), **penambahan dan penghapusan aktiva**, **penambahan dan pelunasan utang**, serta **penambahan dan pelunasan piutang**. Memorial juga mampu **auto-create** record baru di Master Aktiva saat input.

[SCREENSHOT: transaksi-memorial-menu]

---

## 9.1 Jurnal Perkiraan Biasa

Jurnal umum untuk pencatatan transaksi harian non-kas.

### Pola Umum

- **Debit** → akun beban/biaya
- **Kredit** → akun sumber dana (kas, bank, atau akun lainnya)

### Tabel Field — Baris Memorial

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Perkiraan (Debit) | Dropdown | Ya* | Pilih dari COA — sisi debit |
| Perkiraan (Kredit) | Dropdown | Ya* | Pilih dari COA — sisi kredit |
| Nominal | Angka | Ya* | Jumlah debit = kredit (balance) |
| Keterangan | Teks | Ya* | Deskripsi transaksi |

[SCREENSHOT: memorial-jurnal-biasa]

---

## 9.2 Aktiva: Penambahan

Menambahkan aktiva tetap baru (mesin, kendaraan, dll) melalui jurnal entry.

### Alur Penambahan Aktiva

```
[Input Memorial] --> [Pilih Perkiraan Aktiva di sisi DEBIT (misal: "Mesin")]
                               --> [Muncul list data aktiva yang sudah ada]
                               │
                               ├-- Pakai aktiva existing → Pilih dari list
                               │
                               └-- Tambah aktiva baru
                                        --> [Klik tombol "Tambah"]
                                        --> [Input data seperti form Master Aktiva (Bab 3)]
                                        --> [Simpan] → AUTO-CREATE record baru di Master Aktiva
                               --> [Pilih aktiva (existing atau baru)]
                               --> [Input nominal di kolom "Biaya Masih Harus Dibayar"]
                               --> [Kredit = Kas/Bank (pilih akun di sisi kredit)]
                               --> [Simpan]
```

### Posting Otomatis

| Sisi | Akun | Deskripsi |
|------|------|-----------|
| Debit | Perkiraan Aktiva (sesuai grup) | Nilai perolehan aktiva |
| Kredit | Kas/Bank | Pembayaran aktiva |

**Impact:** Record baru **secara otomatis** di-insert ke **Master Aktiva** saat simpan. Ini adalah **Jalur 2** dari dua jalur input aktiva (Jalur 1 = langsung via menu Master Aktiva di [Bab 3](03-master-accounting.md)).

---

## 9.3 Aktiva: Penghapusan

Menghilangkan aktiva dari perusahaan (penjualan atau pengeluaran).

### Alur Penghapusan Aktiva

```
[Input Memorial] --> [Pilih Kas/Bank di sisi DEBIT (uang diterima dari penjualan)]
                               --> [Pilih Perkiraan Aktiva di sisi KREDIT]
                               --> [Pilih aktiva yang dihapus dari list]
                               --> [Simpan]
```

**Posting Otomatis:**
| Sisi | Akun | Deskripsi |
|------|------|-----------|
| Debit | Kas/Bank | Uang yang diterima |
| Kredit | Perkiraan Aktiva | Menghilangkan aktiva dari daftar |

**Catatan:** Aktiva yang dihapus **tidak lagi tampil** di Master Aktiva setelah proses ini.

---

## 9.4 Utang: Penambahan

Mencatat penambahan utang baru (pembelian non-kas, utang internal, dll).

### Alur Penambahan Utang

```
[Input Memorial] --> [Pilih perkiraan beban/biaya atau kas/bank di sisi DEBIT]
                               --> [Pilih perkiraan "Utang Dagang" di sisi KREDIT]
                               --> [Muncul popup Master Supplier (pilih supplier)]
                               --> [Pilih supplier → muncul daftar TAGIHAN UTANG YANG AKAN DITAMBAHKAN]
                               --> [Isi nominal & keterangan]
                               --> [Simpan]
```

### Posting Otomatis

| Sisi | Akun | Deskripsi |
|------|------|-----------|
| Debit | Akun Beban / Kas / Bank | Sumber/use of funds |
| Kredit | Utang Dagang | Penambahan liabilitas |

Sub-ledger supplier juga mencatat tagihan baru ini.

---

## 9.5 Utang: Pelunasan

Pelunasan utang melalui memorial (bukan jalur kas bank). Mirip dengan **BKK di Kas Bank** ([Bab 8](08-kasbank.md)), digunakan untuk transaksi utang yang **tidak melalui kas/bank langsung** (misal: pembayaran non-kas, pelunasan internal).

**Logika:** Sama seperti alur sub-ledger settlement di [Bab 8](08-kasbank.md) — pilih akun utang → pilih supplier → pilih tagihan → klik "Pelunasan" → simpan.

---

## 9.6 Piutang: Penambahan & Pelunasan

Prinsip identik dengan utang (double-entry accounting).

### Penambahan Piutang

```
[Input Memorial] --> [Pilih sumber dana/bayaran di sisi DEBIT]
                               --> [Pilih perkiraan "Piutang Dagang" di sisi KREDIT]
                               --> [Muncul popup Master Customer (pilih customer)]
                               --> [Pilih customer → muncul daftar PIUTANG YANG AKAN DITAMBAHKAN]
                               --> [Simpan]
```

### Pelunasan Piutang

Logika sama dengan BKM sub-ledger di [Bab 8](08-kasbank.md).

---

## Ringkasan Alur Memorial (Visual)

```
Memorial (Journal Entry)
├── 1. Jurnal Perkiraan Biasa
│   ├── Debit: Akun Beban
│   └── Kredit: Akun Sumber Dana
│
├── 2. Aktiva — Penambahan
│   ├── Debit: Perkiraan Aktiva → Pilih/Tambah aktiva baru
│   │         → Auto-create ke Master Aktiva ✓
│   ├── Kredit: Kas/Bank
│   └── Kolom: "Biaya Masih Harus Dibayar"
│
├── 3. Aktiva — Penghapusan
│   ├── Debit: Kas/Bank (uang diterima)
│   └── Kredit: Perkiraan Aktiva (hilangkan dari master)
│
├── 4. Utang — Penambahan
│   ├── Debit: Akun Beban/Kas/Bank
│   ├── Kredit: Utang Dagang
│   └── Pilih Supplier → Tambah tagihan
│
├── 5. Utang — Pelunasan
│   └── Sama seperti BKK sub-ledger (Bab 8)
│
└── 6. Piutang — Penambahan & Pelunasan
    ├── Pilih Customer → Tambah atau lunasi tagihan
    └── Posting ke sub-ledger + historis kartu
```

---

## Perbedaan Memorial vs Kas Bank

| Aspek | Memorial | Kas Bank |
|-------|----------|----------|
| Penggunaan utama | Jurnal umum (non-tunai/non-bank langsung) | Transaksi tunai/bank langsung |
| Pembayaran di muka | Ya (prepayment) | Tidak |
| Tambah Aktiva | Ya (auto-create Master Aktiva) | Tidak (hanya lewat Master) |
| Piutang/Utang | Ya (off-cash adjustment) | Ya (lewat BKK/BKM) |
| Default lawan | Bebas (manual jurnal) | Kas/Bank default |

---

## Validation Rules

- **Total debit harus sama dengan total kredit** (balance per transaksi).
- Periode kerja **harus terbuka** (belum dikunci).
- Perkiraan yang dipilih harus aktif dan terdefinisi di COA (Bab 3).
- Auto-create aktiva hanya terjadi saat perkiraan **sisi debit** adalah akun aktiva.
- Sub-detail akun supplier/customer harus sudah di-setup (Bab 5) agar sub-ledger muncul.
- Otorisasi berjenjang berlaku (Bab 2).

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Debit ≠ Kredit | "Total debit harus sama dengan total kredit" |
| Periode sudah dikunci | "Periode tidak dapat dibuka. Hubungi administrator" |
| Perkiraan tidak ditemukan | "Pilih perkiraan dari Chart of Accounts" |
| Pilih supplier tapi tidak ada Sub-Detail Akun | "Supplier belum memiliki sub-detail akun. Hubungi admin" |
| Hapus aktiva yang sudah diurus memorial | "Aktiva tidak dapat dihapus karena ada riwayat transaksi memorial" |

---

## Catatan Operator

> **Jalur Input Aktiva:** Terdapat dua cara menambahkan aktiva: (1) langsung via **Master Aktiva** di modul Accounting ([Bab 3](03-master-accounting.md)), atau (2) **auto-create dari Memorial** saat input jurnal dengan perkiraan aktiva di sisi debit. Jalur 2 lebih efisien karena menggabungkan pencatatan aktiva dan jurnal sekaligus.
