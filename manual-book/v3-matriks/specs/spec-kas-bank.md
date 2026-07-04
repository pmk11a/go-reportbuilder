# Spec: Transaksi Kas Bank

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Akunting > Transaksi Kas Bank |
| **Akses** | User dengan akses Akunting + level otorisasi |
| **CRUD Ops** | Tambah, Koreksi, Hapus, Batal Otorisasi |
| **Validasi** | Periode terbuka, mata uang valid, sub-ledger cocok COA, otorisasi per level |

## 2. Kode Transaksi Kas Bank

| Kode | Kepanjangan | Default Posisi |
|------|-------------|----------------|
| BKM | Bukti Kas Masuk | Debit Kas |
| BKK | Bukti Kas Keluar | Kredit Kas |
| BBM | Bukti Bank Masuk | Debit Bank |
| BBK | Bukti Bank Keluar | Kredit Bank |

## 3. Field Reference Table

### 3a. Header Transaksi

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Jenis Transaksi | Enum (BKM/BKK/BBM/BBK) | Ya | Combo box pilih |
| Tanggal | Date | Ya | Default: hari ini |
| Tulisan Kepada | String | Ya | Nama customer/supplier/alias tujuan |
| Devisi | Lookup | Ya | Unit bisnis/devisi tujuan transaksi |
| Nomor Bukti | String | Auto | Format: urut + kode + tgl |
| Lampiran | Number | Tidak | Jumlah dokumen lampiran (kwitansi, invoice) |
| Tgl Input | DateTime | Auto | Timestamp user simpan transaksi (audit trail) |
| User ID | String | Auto | Kode user yang input (audit trail) |
| No. Reg | String | Auto | Nomor registrasi internal (auto-generated) |

> **Catatan:** TIDAK ada field "Mata Uang" atau "Kurs" di header transaksi kas/bank. Mata uang dan kurs didefinisikan **per baris detail** (lihat 3b), karena satu transaksi bisa multi-currency. Penentuan sisi Debet/Kredit dilakukan oleh field `TipeDK` (di-set otomatis sesuai jenis transaksi), bukan dengan input nominal minus.

### 3b. Detail Sub-Grid (tiap baris)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Valas | TEdit (teks) | Ya | Kode mata uang (IDR/USD/SGD); kosong = IDR |
| Kurs | TPBNumEdit | Opsional | Otomatis dari master valas; default 1 untuk IDR |
| Jumlah | Decimal (positif) | Ya | Nominal transaksi dalam Valas baris. **Selalu positif** — penentuan Debet/Kredit pakai `TipeDK`, bukan sign |
| Sumber | String | Tidak | Sumber dana |
| Keterangan | Text | Ya | Tujuan penggunaan dana |
| Nomor SPK | String | Tidak | Tanda minus jika tidak ada |
| Nama SPK | String | Auto | Muncul jika SPK ada |
| Lawan (Pasangan) | Lookup COA | Ya | Akun debit/credit partner. Jika akun Lawan terdaftar di `dbPostHutPiut` dengan centang "Kas dan Bank?", sub-form settlement muncul otomatis |
| Lampiran | Number | Tidak | Jumlah lampiran per baris (mis: bukti transfer) |
| Tgl Input | DateTime | Auto | Timestamp baris di-input/edit terakhir (audit trail) |
| User ID | String | Auto | User yang terakhir edit baris ini (audit trail) |
| No. Reg | String | Auto | Nomor registrasi baris (auto-generated) |
| Flag | String | Auto | Status flag baris (A=aktif, D=soft-delete, R=revisi) |
| Key Urut | String | Auto | Composite key NoBukti+Tgl+Urut — identifikasi unik per baris |

## 4. Test Scenarios

### Skenario 1: Buat transaksi BKM baru (kas masuk)
```
Given saya di Transaksi Kas Bank
When saya pilih jenis "BKM", tanggal "2026-06-26"
And tujuan "PT Maju Jaya"
And saya tambah detail: Valas "IDR", Kurs (otomatis), Jumlah "Rp 1.500.000", Lawan "Piutang Dagang"
And klik Simpan
Then transaksi tersimpan dengan nomor "0001/BKM-ABC/202606"
Dan posting: Debit Kas (1-1001) Rp 1.500.000
             Credit Piutang Dagang (1-1201) Rp 1.500.000
```

### Skenario 2: Buat BKK (uang keluar)
```
Given saya pilih jenis "BKK"
When saya input jumlah "Rp 2.000.000" (positif)
And Lawan = "Utang Dagang"
And klik Simpan
Then sistem kenali sebagai BKK karena Jenis = BKK (bukan karena nilai minus)
Dan posting: Debit Utang Dagang / Credit Kas
```

### Skenario 3: Pilih SPK yang sudah ada
```
Given SPK "SPK-100" sudah ada di master
When saya input nomor SPK di detail transaksi
Then kolom Nama SPK otomatis terisi dengan data SPK
```

### Skenario 4: Bayar utang supplier (BKK + sub-ledger)
```
Given saya pilih BKK, supplier "PT Maju Jaya" punya utang Rp 5.000.000
When saya pilih Lawan "Utang Dagang" (2-1001)
Then sistem tampilkan daftar utang terbuka supplier
When saya klik "Pelunasan"
Then pilih invoice utang yang akan dilunasi
And klik Tutup → Simpan
Then jurnal terbentuk: Debit Utang Dagang / Credit Kas
Dan historis kartu utang supplier bertambah 1 record pelunasan
```

### Skenario 5: Terima piutang customer (BKM)
```
Given saya pilih BKM, customer "CUST-001" punya piutang Rp 3.000.000
When saya input nominal Rp 3.000.000, Lawan "Piutang Dagang"
And pilih customer
Then sistem tampilkan daftar piutang terbuka
When saya klik Pelunasan
Then posting: Debit Kas / Credit Piutang Dagang
Dan histori kartu piutang customer ter-update
```

### Skenario 6: Periode terkunci → CRUD ditolak
```
Given periode "Juni 2026" sudah di-kunci (locked)
When saya coba tambah transaksi Kas Bank untuk tanggal "2026-06-15"
Then sistem menolak dengan pesan "Periode Juni 2026 sudah terkunci"
```

### Skenario 7: Otorisasi level 2 tanpa level 1
```
Given transaksi BKM nominal Rp 50.000.000 (butuh otorisasi L1+L2)
When user dengan level 2 langsung coba Approve
Then sistem menolak dengan pesan
  "Otorisasi Level 1 belum dilakukan. Level 2 tidak bisa menyetujui."
```

### Skenario 8: Batal otorisasi
```
Given transaksi sudah L1 + L2 approved
When user dengan hak "Batal Otorisasi" klik tombol
Then kedua level di-reset, status kembali ke "Draft"
Dan transaksi bisa diedit/dihapus lagi (jika periode terbuka)
```

### Skenario 9: Mata uang beda per baris detail
```
Given saya buat transaksi BKM multi-detail
When baris 1 Jumlah "USD 100" kurs 15.500 = Rp 1.550.000
And baris 2 Jumlah "IDR 500.000"
And Simpan
Then kedua baris tersimpan
Dan total konversi ke IDR dihitung otomatis
```

### Skenario 10: User tanpa akses COA lawan
```
Given user "staff_akunting" hanya punya akses COA Kas IDR
When dia coba pilih Lawan "Kas USD" di transaksi
Then sistem menolak / combo tidak menampilkan opsi tersebut
```

## 5. Database Impact

| Aksi | Tabel Affected | Posting Debit/Credit |
|------|---------------|---------------------|
| Tambah BKM | tbl_transaksi_kas, tbl_jurnal_header, tbl_jurnal_detail | Debit Kas / Credit Lawan |
| Tambah BKK | tbl_transaksi_kas, tbl_jurnal_header, tbl_jurnal_detail | Debit Lawan / Credit Kas |
| Pelunasan utang | tbl_pelunasan_utang, tbl_kartu_utang | Update saldo utang supplier |
| Pelunasan piutang | tbl_pelunasan_piutang, tbl_kartu_piutang | Update saldo piutang customer |
| Otorisasi | tbl_otorisasi_transaksi | — (audit log) |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Kurs valas belum di-setup untuk tanggal transaksi | Warning: "Kurs belum di-set, gunakan kurs terakhir?" |
| Jumlah = 0 | Tolak + pesan "Nominal tidak boleh 0" |
| Lawan = akun Kas yang sama (self-posting) | Tolak + pesan "Akun lawan harus berbeda" |
| Hapus transaksi yang sudah diotorisasi penuh | Tolak, harus Batal Otorisasi dulu |
| Sub-ledger kosong (tidak ada supplier/customer cocok) | Tampilkan "Tidak ditemukan data utang/piutang" |
| Tanggal transaksi beda periode | Tolak + minta koreksi tanggal |
| Transaksi multi-detail dengan total tidak balance | Tolak sebelum simpan |

## 7. Prasyarat Setup (Wajib Sebelum Transaksi)

| Data | Modul | Wajib? | Keterangan |
|------|-------|--------|------------|
| COA (Perkiraan) | Master Accounting → Pergiroan | Ya | Semua akun kas, bank, lawan harus ada |
| Posting Perkiraan (dbPostHutPiut) | Setting → Posting → Post Perkiraan | Ya, untuk sub-ledger | Akun lawan harus terdaftar + centang "Kas dan Bank?" |
| Master Devisi | Master Accounting | Ya | Unit bisnis tujuan transaksi |
| Master Valas | Master Lain → Valas | Ya, kalau valas | Kurs otomatis dari sini |
| Master Supplier | Master → Supplier | Ya, untuk bayar hutang | Sub-detail akun supplier harus terisi |
| Master Customer | Master → Customer | Ya, untuk terima piutang | Sub-detail akun customer harus terisi |
| Saldo Awal | Master Accounting → Saldo Awal | Ya | Akun kas/bank harus punya saldo awal |
