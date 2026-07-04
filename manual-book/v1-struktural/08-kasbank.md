# Bab 8 — Transaksi Kas Bank

## Overview

Menu **Transaksi Kas Bank** di bawah modul **Akunting** merupakan pusat pencatatan semua arus kas perusahaan: penerimaan (masuk) dan pengeluaran (keluar) baik dalam bentuk tunai maupun bank. Terdapat empat jenis transaksi: **BKM** (Bank Masuk/Kas Masuk), **BKK** (Bank Keluar/Kas Keluar), **BBM** (Buku Masuk), dan **BBK** (Buku Keluar). Selain input transaksi langsung, modul ini juga menyediakan fitur **sub-ledger settlement** untuk melunasi piutang dan utang supplier/customer.

[SCREENSHOT: transaksi-kas-bank-menu]

---

## 8.1 Jenis Transaksi

| Kode | Kepanjangan | Fungsi | Pengaruh Buku Besar |
|------|-------------|--------|---------------------|
| **BKM** | Bank/Kas Masuk | Penerimaan kas/bank | Debit Kas/Bank |
| **BKK** | Bank/Kas Keluar | Pengeluaran kas/bank | Kredit Kas/Bank |
| **BBM** | Buku Masuk | Penerimaan non-tunai | Debit akun target |
| **BBK** | Buku Keluar | Pengeluaran non-tunai | Kredit akun target |

> **Catatan:** Dalam implementasi, BKM dan BBM sering dipisah: BKM untuk kas/bank fisik (tunai/rekening), BBM untuk penerimaan melalui jalur buku (piutang, penyesuaian).

---

## 8.2 Form Header Transaksi Kas Bank

### Tabel Field — Header

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Jenis Transaksi | Dropdown (BKM/BKK/BBM/BBK) | Ya* | Pilih kode transaksi |
| Tanggal | Date | Ya* | Tanggal transaksi |
| Tujuan/Aliases | Teks | Ya* | "Tulisan kepada" — tujuan/transferees (customer/supplier alias) |
| Devisi | Lookup | Ya* | Unit bisnis/devisi tujuan transaksi |
| No. Urut | Number (5 digit) | Ya* | Nomor urut transaksi per jenis, auto-generated |
| No. Bukti | String | Auto | Format: urut + separator + kode + separator + bulan + separator + tahun (ex: 00001/BKK/07/2026) |
| Kode Bagian | Lookup | Tidak | Kode departemen/bagian |
| THPC (Tipe Pembayaran) | Dropdown | Ya* | Lihat tabel THPC di bawah |
| No. Bon | Teks | Tidak | Nomor bon/referensi eksternal |
| Lampiran | Number | Tidak | Jumlah dokumen lampiran (mis: kwitansi, invoice) |
| Tgl Input | DateTime | Auto | Timestamp saat user simpan transaksi (audit trail) |
| User ID | String | Auto | Kode user yang input transaksi (audit trail) |
| No. Reg | String | Auto | Nomor registrasi internal (auto-generated, untuk tracking internal) |

### THPC — Tipe Pembayaran / Penerimaan

THPC (Tunai/Hutang/Piutang/Cash) menentukan **sumber/destinasi dana** dan mengaktifkan sub-modul terkait:

| Item | Kode Internal | Arti | Sub-Modul Aktif |
|------|---------------|------|-----------------|
| **[C]ash** | C | Tunai/Kas langsung | Tidak ada |
| **[T]ransfer** | T | Transfer antar bank/rekening | Tidak ada |
| **[H]utang Giro** | H | Pembayaran via giro (utang) | Giro (Buka/Cair Giro) |
| **[P]iutang Giro** | P | Penerimaan via giro (piutang) | Giro (Buka/Cair Giro) |

**Aturan THPC per Jenis Transaksi:**

| Mode | THPC | Status Giro | Arti |
|------|------|-------------|------|
| BKM | [P] | `P+` | Terima giro dari customer (piutang giro bertambah) |
| BKK / BBM | [P] | `P-` | Cairkan giro customer (piutang giro berkurang) |
| BKK | [H] | `H+` | Buka giro ke supplier (hutang giro bertambah) |
| BBM / BBK | [H] | `H-` | Cairkan giro supplier (hutang giro berkurang) |

[SCREENSHOT: kas-bank-header]

---

## 8.3 Form Detail Transaksi (Sub-Grid)

Setelah header diisi, klik tombol **Tambah** untuk memasukkan baris detail transaksi.

### Tabel Field — Baris Detail

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Valas | TEdit (teks) | Ya* | Kode mata uang (IDR/USD/SGD); opsional — kosong berarti IDR |
| Kurs | TPBNumEdit (angka) | Opsional | Nilai kurs otomatis dari dbValas; default 1 untuk IDR |
| Jumlah/Nominal | Angka | Ya* | Nominal transaksi dalam mata uang Valas |
| Sumber | Teks | Ya* | Sumber transaksi (manual/otomatis) |
| Keterangan | Teks | Ya* | Tujuan penggunaan dana — kegunaan apa transaksi ini |
| Nomor SPK | Teks | - | Surat Pesanan Kerja (opsional; tanda minus jika tidak ada) |
| Nama SPK | Teks | Auto | Muncul otomatis jika SPK sudah terdaftar sebelumnya |
| Lawan/Pasangan | Dropdown | Ya* | Sisi debit/credit lawan dari posisi kas/bank |
| Lampiran | Number | Tidak | Jumlah lampiran per baris (mis: bukti transfer per baris) |
| Tgl Input | DateTime | Auto | Timestamp baris di-input atau di-edit terakhir (audit trail) |
| User ID | String | Auto | Kode user yang terakhir edit baris ini (audit trail) |
| No. Reg | String | Auto | Nomor registrasi baris (auto-generated) |
| Flag | String | Auto | Status flag baris (mis: 'A'=aktif, 'D'=soft-delete, 'R'=revisi) |
| Key Urut | String | Auto | Composite key: NoBukti + Tgl + Urut — untuk identifikasi unik per baris |

**Aturan Nominal:**
- Field input di grid adalah **Jumlah** (bilangan positif). Jangan input negatif.
- Penentuan sisi Debet/Kredit dilakukan oleh field `TipeDK` (StatusDK di .pas) yang nilainya diisi otomatis oleh `TampilanStatusDK()` (FrmKasBank.pas baris 474) sesuai jenis transaksi.
- **BKM (Masuk):** kolom Debet terisi, Kredit kosong → mengartikan kas/bank bertambah
- **BKK (Keluar):** kolom Kredit terisi, Debet kosong → mengartikan kas/bank berkurang
- Jenis BBM/BBK mengikuti logika yang sama (D/K convention, bukan tanda minus)

---

## 8.4 Fitur Sub-Ledger Settlement (Pelunasan Utang/Piutang)

Modul ini juga menangani pelunasan utang dan piutang secara sub-detail.

### 8.4.1 Alur Bayar Utang (BKK — Bank Keluar)

```
[Pilih BKK] --> [Input nominal MINUS] --> [Pilih Lawan = Perkiraan Utang Dagang]
                                                      --> [Muncul daftar supplier dengan sub-ledger terkait]
                                                              --> [Pilih Supplier]
                                                                      --> [Muncul daftar UTANG BELUM LUNAS]
                                                                              --> [Pilih tagihan → klik "Pelunasan"]
                                                                                      --> [Muncul pembayaran dari kas bank sebelumnya]
                                                                                              --> [Klik "Tutup" → Simpan]
```

**Posting Setelah Simpan:**
1. Posting ke **Buku Besar** (debit/credit otomatis)
2. Di **sub-ledger supplier** muncul catatan pelunasan
3. **Historis kartu piutang/utang** bertambah record baru

### 8.4.2 Alur Terima Piutang Jatuh Tempo (BKM — Bank Masuk)

```
[Pilih BKM] --> [Input nominal] --> [Pilih Lawan = Perkiraan Piutang Dagang]
                                                     --> [Muncul daftar customer dengan sub-ledger terkait]
                                                             --> [Pilih Customer]
                                                                     --> [Muncul daftar PIUTANG JATUH TEMPO]
                                                                             --> [Pilih tagihan → klik "Pelunasan"]
                                                                                     --> [Klik "Tutup" → Simpan]
```

**Posting Setelah Simpan:**
1. Posting ke **Buku Besar**
2. Di **sub-ledger customer** muncul catatan pelunasan piutang
3. **Historis kartu** bertambah record baru

### 8.4.3 Mekanisme dbTempHutPiut (Staging Table Settlement)

Pelunasan utang/piutang tidak langsung menulis ke tabel kartu utang/piutang. Sistem menggunakan **dbTempHutPiut** sebagai staging area — sebuah temporary table per-user yang menampung detail pembayaran sebelum di-finalize. Ini memungkinkan:

- **Partial payment** — satu faktur bisa dilunasi bertahap (misal utang 10jt, bayar 3jt dulu, sisa 7jt bayar lain waktu)
- **Multi-payment** — beberapa transaksi kasbank bisa digunakan untuk melunasi satu faktur
- **Cross-currency settlement** — hut/piutang dalam USD bisa dilunasi dengan pembayaran IDR (dengan kurs berbeda)
- **Soft-delete** — pembatalan pembayaran tidak menghapus record, hanya set flag `StatusUID = 'D'`

#### Struktur dbTempHutPiut

| Field | Tipe | Keterangan |
|-------|------|------------|
| NoFaktur | String | Nomor faktur/tagihan asal (invoice, PO, dll) |
| NoRetur | String | Nomor retur (kosong jika bukan retur) |
| TipeTrans | String | Jenis transaksi asal (INV, RET, dll) |
| KodeCustSupp | String | Kode customer/supplier |
| NoBukti | String | No. Bukti transaksi kasbank yang bayar |
| NoMsk | Integer | Nomor masuk (internal sequence) |
| Urut | Integer | Urutan pembayaran per faktur |
| Tanggal | Date | Tanggal transaksi |
| JatuhTempo | Date | Jatuh tempo faktur |
| Debet | Decimal | Nilai debit (untuk PT+, HT-) |
| Kredit | Decimal | Nilai kredit (untuk PT-, HT+) |
| Saldo | Decimal | Saldo berjalan per faktur |
| Valas | String | Mata uang transaksi |
| Kurs | Decimal | Kurs saat transaksi |
| DebetD | Decimal | Nilai debit dalam valuta asing |
| KreditD | Decimal | Nilai kredit dalam valuta asing |
| SaldoD | Decimal | Saldo dalam valuta asing |
| Tipe | String | Tipe sub-ledger (PT, HT, UPT, UHT) |
| Perkiraan | String | Akun COA yang terkait |
| Catatan | String | Catatan tambahan |
| IDUser | String | User yang input (untuk isolation per-user) |
| StatusUID | String | `'D'` = dihapus (soft-delete), `NULL` = aktif |
| JumlahSaldo | Decimal | Running balance total per faktur (computed) |
| JumlahSaldoD | Decimal | Running balance valas per faktur (computed) |
| NoInvoice | String | Nomor invoice referensi |
| Valas_ | String | Mata uang faktur asal (bisa beda dengan Valas header) |
| Kurs_ | Decimal | Kurs faktur asal |
| TipeDK | String | `D` = Debit (piutang), `K` = Kredit (utang) |

#### Flow dbTempHutPiut

```
[Pilih supplier/customer di sub-ledger]
    --> [Sistem insert tagihan terbuka ke dbTempHutPiut via QuHutPiut query]
    --> [User pilih faktur → klik "Pelunasan"]
    --> [Input nominal pembayaran]
    --> [Sistem hitung: Dibayar vs Sisa vs Total]
    --> [Klik "Tambah" → insert record baru ke dbTempHutPiut (Choice='I')]
    --> [Record baru: TipeTrans='L' (Lunas), NoBukti=no bukti kasbank]
    --> [Running balance JumlahSaldo di-update otomatis]
    --> [Simpan transaksi kasbank → record dipromote dari dbTempHutPiut ke dbKartuUtang/dbKartuPiutang]
```

#### Partial Payment (Bertahap)

```
Faktur: INV-001, Saldo: Rp 10.000.000

Transaksi 1: BKK Rp 3.000.000 → insert ke dbTempHutPiut (Urut=1)
    → JumlahSaldo tersisa: Rp 7.000.000

Transaksi 2: BKK Rp 5.000.000 → insert ke dbTempHutPiut (Urut=2)
    → JumlahSaldo tersisa: Rp 2.000.000

Transaksi 3: BKK Rp 2.000.000 → insert ke dbTempHutPiut (Urut=3)
    → Faktur INV-001 LUNAS (JumlahSaldo = 0)
```

#### Cross-Currency Settlement

Jika faktur dalam USD (kurs 15.500) tapi dibayar dalam IDR:
- `Valas_` = USD (mata uang faktur)
- `Kurs_` = 15.500 (kurs faktur)
- `Valas` = IDR (mata uang pembayaran)
- `Kurs` = 15.800 (kurs bayar)
- `JumlahD` = nominal dalam USD (konversi dari IDR)
- Selisih kurs dicatat sebagai selisih valuta asing

> **Penting:** Saat pembayaran dibatalkan (`StatusUID='D'`), record tetap ada di dbTempHutPiut tapi tidak masuk perhitungan running balance. Ini memungkinkan reaktivasi pembayaran tanpa kehilangan histori.

### 8.4.4 Alur Giro (Buka / Cair Giro)

Sistem menangani giro melalui sub-modul **FrKasBankGiro** yang aktif jika THPC = [H] atau [P].

**Buka Giro (H+):**
```
[Pilih BKK] --> [THPC = [H]utang Giro] --> [Muncul form Giro: isi Bank, No. Giro, Tgl Giro, Jatuh Tempo]
    --> [Simpan → Status Giro = H+]
    --> [Posting: Debit Utang Dagang / Kredit Bank]
```

**Cair Giro (H-):**
```
[Pilih BBK] --> [THPC = [H]utang Giro] --> [Muncul daftar giro supplier yang belum cair]
    --> [Pilih giro → Isi tanggal cair → Simpan → Status Giro = H-]
```

**Terima Giro Customer (P+):**
```
[Pilih BKM] --> [THPC = [P]iutang Giro] --> [Muncul form Giro: isi Bank, No. Giro, Tgl Giro]
    --> [Simpan → Status Giro = P+]
```

**Cair Giro Customer (P-):**
```
[Pilih BKK/BBM] --> [THPC = [P]iutang Giro] --> [Muncul daftar giro customer yang belum cair]
    --> [Pilih giro → Isi tanggal cair → Simpan → Status Giro = P-]
```

### 8.4.5 Kode Sub-Ledger Lengkap (PWT)

Sistem PWT mendukung 7 jenis sub-ledger yang diidentifikasi via `dbPostHutPiut`:

| Kode | Nama | Debit Arti | Kredit Arti |
|------|------|------------|-------------|
| **PT** | Piutang Dagang | `PT+` (piutang bertambah) | `PT-` (pelunasan) |
| **HT** | Hutang Dagang | `HT-` (pelunasan) | `HT+` (hutang bertambah) |
| **UPT** | Uang Muka Piutang | `UPT+` (terima DP) | `UPT-` (pengembalian) |
| **UHT** | Uang Muka Hutang | `UHT-` (bayar DP) | `UHT+` (pengembalian DP) |
| **AKV** | Aktiva (Aset Tetap) | `AKV+` (perolehan) | `AKV-` (pelepasan) |
| **AKM** | Akumulasi Penyusutan | `AKM+` | `AKM-` |
| **GIRO** | Giro | Ditangani terpisah via sub-modul Giro | `H+`/`H-`/`P+`/`P-` |

> **Catatan:** Kode `UHT` dan `UPT` adalah varian Uang Muka dari Hutang/Piutang dagang. Proses settlement-nya identik dengan Hutang/Piutang biasa, hanya beda di akun perkiraan.

### Sub-Detail Akun (Settingan di Master Supplier/Customer)

Daftar rekening posting muncul di **Master Posting** (Bab 3). Setiap supplier/customer punya **sub-detail akun** yang dikonfigurasi di Master masing-masing (Bab 5).

[SCREENSHOT: subledger-settlement]

---

## Validation Rules

- **Periode kerja harus terbuka.** Transaksi ditolak jika periode sudah dikunci (lihat [Bab 2](02-setup.md)).
- **Nominal harus sesuai jenis transaksi:** BKK menggunakan nilai negatif, BKM positif.
- **Lawan harus dipilih** dan merujuk ke akun yang sesuai (kas/bank untuk BKM/BKK, utang/piutang untuk sub-ledger).
- **Otorisasi berjenjang** berlaku sesuai level user (lihat [Bab 2](02-setup.md)) — Level 2 butuh otorisasi Level 1 terlebih dahulu.
- Mata uang yang dipilih **mengikuti kurs otomatis** yang tersimpan di sistem.
- Nomor SPK bersifat opsional; jika kosong isi dengan tanda minus `-`.
- Nama SPK muncul otomatis hanya bila SPK sudah terdaftar di sistem.
- **Jumlah pembayaran tidak boleh melebihi saldo hut/piutang.** Sistem memvalidasi via `CekPelunasanMax()` — total pembayaran (termasuk yang sudah dibayar sebelumnya di dbTempHutPiut) tidak boleh melebihi saldo terbuka faktur.
- **Sub-ledger settlement hanya bisa dilakukan jika akun lawan terdaftar di dbPostHutPiut.** Jika akun COA lawan tidak punya mapping sub-ledger (PT, HT, UPT, UHT, dll), form sub-ledger tidak akan muncul.

---

## 8.5 Sub-Modul Aktiva (Aset Tetap)

Saat akun Lawan/Perkiraan terdaftar di `dbPostHutPiut` dengan kode **AKV** (Aktiva), sistem mengaktifkan sub-modul **FrKasBankAktiva** untuk pencatatan aset tetap.

### Field Sub-Modul Aktiva

| Nama Field | Tipe | Keterangan |
|------------|------|------------|
| Kode Aktiva | String (Auto) | Kode unik aset — auto-generated |
| Perkiraan | Lookup COA | Akun aktiva tetap |
| Keterangan | Text | Nama/deskripsi aset |
| Kuantum (Qty) | Number | Jumlah unit |
| % Susut | Number | Persentase penyusutan per tahun |
| Tgl Pengakuan | Date | Tanggal perolehan/diakui |
| Tipe Aktiva | Dropdown | [L]urus / [M]enurun (metode penyusutan) |
| Akumulasi Susut | Lookup COA | Akun akumulasi penyusutan |
| Biaya Susut | Lookup COA | Akun biaya penyusutan |
| Devisi | Lookup | Unit bisnis pemilik aset |
| Kode Bagian | Lookup | Departemen pemilik aset |

### Alur Input Aktiva

```
[Pilih BKM/BBM] --> [Input nominal] --> [Pilih Lawan = Akun Aktiva]
    --> [Sistem deteksi kode AKV → tampil tombol "Aktiva"]
    --> [Klik "Aktiva" → FrKasBankAktiva.ShowModal]
    --> [Isi: Keterangan, Qty, % Susut, Tgl Pengakuan, Tipe, Akumulasi, Biaya]
    --> [OK → Simpan ke dbAktiva + posting ke dbTransaksi]
```

> **Catatan:** Jika transaksi dihapus, data Aktiva terkait juga ikut dihapus (cascade). Sub-modul Aktiva hanya muncul jika akun Lawan terdaftar dengan kode `AKV` di Master Posting.

---

## Flow Lengkap Transaksi Kas Bank

```
[Buka Menu Akunting > Transaksi Kas Bank]
                              --> [Pilih Jenis: BKM / BKK / BBM / BBK]
                              --> [Pilih Mata Uang → kurs otomatis]
                              --> [Input Tanggal & Tujuan]
                              --> [Klik "Tambah" → Isi Detail Baris]
                              --> [Isi: Mata Uang, Jumlah, Sumber, Keterangan, SPK (opsional), Lawan]
                                              │
                                              ├-- Tanpa Sub-Ledger → [Simpan → Posting ke Buku Besar]
                                              │
                                              └-- Dengan Sub-Ledger (Utang/Piutang)
                                                      --> [Pilih Akun Utang/Piutang sebagai Lawan]
                                                      --> [Muncul daftar supplier/customer]
                                                      --> [Pilih entitas → muncul daftar terbuka]
                                                      --> [Pilih tagihan → Klik "Pelunasan"]
                                                      --> [Klik "Tutup" → Simpan]
                                                              --> [Posting Buku Besar]
                                                              --> [Update sub-ledger]
                                                              --> [Update historis kartu]
```

---

## Hak CRUD & Otorisasi

- **Tambah:** Buat transaksi baru
- **Koreksi:** Edit transaksi yang belum diotorisasi final
- **Hapus:** Hapus transaksi (hanya user level tinggi)
- **Batal Otorisasi:** Reset semua level otorisasi yang telah disetujui
- **Otorisasi:** Validasi per level (1→2→3→4→5) sesuai [Bab 2](02-setup.md)

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Periode sudah dikunci | "Periode tidak dapat dibuka. Hubungi administrator" |
| Nominal BKK tidak negatif | "BKK harus menggunakan nilai negatif (uang keluar)" |
| Lawan tidak dipilih | "Pilih akun lawan (debit/credit partner) terlebih dahulu" |
| User tanpa hak akses | "Anda tidak memiliki akses untuk modul Transaksi Kas Bank" |
| Sub-ledger kosong (tidak ada utang terbuka) | "Tidak ditemukan tagihan terbuka untuk entitas ini" |
| Akun lawan tidak punya mapping sub-ledger | "Akun lawan tidak terkait sub-ledger hut/piut. Pilih akun lawan yang sesuai (mis: Piutang Dagang, Utang Dagang)" |
| Overpayment (pembayaran > saldo faktur) | "Jumlah pembayaran melebihi saldo faktur. Sisa tagihan: Rp X. Coba kurangi nominal atau pilih faktur lain" |
| Overpayment detected oleh CekPelunasanMax | "Pembayaran total (existing + baru) melebihi saldo hut/piutang. Maximum pembayaran: Rp X" |
| Faktur sudah lunas tapi coba bayar lagi | "Faktur ini sudah lunas. Tidak bisa diproses" |
| Nomor SPK duplikat (jika SPK aktif) | "Nomor SPK sudah digunakan dalam transaksi ini" |
| Otorisasi gagal (level tidak berurutan) | "Level 1 harus diotorisasi terlebih dahulu" |

---

## Catatan Operator

### Prasyarat Sebelum Input Transaksi Kas Bank

Sebelum user bisa input transaksi kas/bank, beberapa data master **wajib** sudah diisi. Kalau tidak, transaksi bisa jadi tidak bisa disimpan, lookup tidak muncul, atau fitur sub-detail tidak aktif:

| Prasyarat | Modul Setup | Lokasi | Wajib? | Keterangan |
|-----------|-------------|--------|--------|------------|
| **Chart of Accounts (COA)** | Master Accounting → Perkiraan | [Bab 3.1](03-master-accounting.md) | Ya | Akun kas, bank, perkiraan lawan, akun beban — semua harus ada |
| **Posting Perkiraan** | Setting → Posting → Post Perkiraan | [Bab 3.3.1](03-master-accounting.md) | Ya, untuk sub-ledger | Akun lawan yang dipakai untuk bayar piutang/hutang **wajib** sudah di-posting di sini dengan centang "Kas dan Bank?" |
| **Master Devisi** | Master Accounting → Devisi | [Bab 3](03-master-accounting.md) | Ya | Unit bisnis/devisi tujuan transaksi |
| **Master Valas** | Master Accounting → Valas | [Bab 3](03-master-accounting.md) | Ya, kalau pakai valas | Kurs otomatis mengacu tabel ini. Kalau valas belum diset, transaksi multi-currency akan gagal |
| **Master Supplier** | Master → Supplier/Customer | [Bab 5](05-master-supplier-customer.md) | Ya, untuk bayar hutang | Sub-detail akun supplier (sub-ledger) harus sudah terisi |
| **Master Customer** | Master → Supplier/Customer | [Bab 5](05-master-supplier-customer.md) | Ya, untuk terima piutang | Sub-detail akun customer (sub-ledger) harus sudah terisi |
| **Master User** | Setting → User | - | Ya | User ID akan terisi otomatis dari login, tapi user harus sudah dibuat dulu oleh admin |
| **Saldo Awal Periode** | Master Accounting → Saldo Awal | [Bab 3](03-master-accounting.md) | Ya, untuk saldo berjalan | Akun kas/bank harus punya saldo awal agar valid |

**Cara cepat verifikasi prasyarat sebelum input:**
1. Coba buat 1 transaksi dummy BKM nominal Rp 1
2. Kalau lookup "Lawan" mau auto-pick akun piutang/hutang, berarti posting Perkiraan sudah benar
3. Kalau form sub-ledger settlement (pilih faktur) muncul, berarti Master Supplier/Customer + sub-detail sudah terisi
4. Kalau kurs valas muncul otomatis, berarti Master Valas sudah terisi

> **Urutan Transaksi:** Pastikan semua master (COA, posting Perkiraan, supplier/customer, gudang) sudah ter-setup sebelum melakukan transaksi kas bank. Sub-detail akun supplier/customer harus sudah diisi (lihat [Bab 5](05-master-supplier-customer.md)) agar fitur sub-ledger settlement berfungsi.
