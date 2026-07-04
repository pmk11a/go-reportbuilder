# Spec: Memorial (Journal Entry)

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Akunting > Transaksi Memorial |
| **Akses** | User dengan akses Akunting + jurnal |
| **CRUD Ops** | Tambah, Koreksi, Hapus, Otorisasi |
| **Validasi** | Debit = Credit (balance); COA tipe Detail; periode terbuka |

## 2. Sub-Proses Memorial

| No | Sub-Proses | Pola Jurnal |
|----|-----------|-------------|
| 1 | Jurnal Perkiraan Biasa | Debit Beban / Credit Sumber Dana |
| 2 | Penambahan Aktiva | Debit Perkiraan Aktiva / Credit Kas-Bank |
| 3 | Penghapusan Aktiva | Debit Kas-Bank / Credit Perkiraan Aktiva |
| 4 | Penambahan Utang | Debit Kas-Beban / Credit Utang Dagang (+ pilih supplier) |
| 5 | Pelunasan Utang | Debit Utang / Credit Kas-Bank (non-tunai) |
| 6 | Penambahan Piutang | Debit Piutang / Credit Pendapatan (+ pilih customer) |
| 7 | Pelunasan Piutang | Debit Kas-Bank / Credit Piutang |

## 3. Field Reference Table

### 3a. Header Memorial

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor Bukti (BNM) | String | Auto | Dari Set Nomor Transaksi |
| Tanggal | Date | Ya | Default: hari ini |
| Keterangan | Text | Ya | Narasi jurnal |

### 3b. Detail Baris Jurnal

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Perkiraan | Lookup COA | Ya | Tipe Detail |
| Debit | Decimal | Salah satu harus terisi | — |
| Credit | Decimal | Salah satu harus terisi | — |
| Keterangan Baris | Text | Tidak | — |
| Referensi Sub-Ledger | Lookup | Kondisional | Wajib jika COA = Utang/Piutang/Aktiva |
| Nominal Sub-Ledger | Decimal | Kondisional | Mis. Biaya Masih Harus Dibayar untuk aktiva |

## 4. Test Scenarios

### Skenario 1: Jurnal beban biasa (pola umum)
```
Given saya di Memorial
When saya buat jurnal: Debit "Beban ATK" Rp 500.000
                     Credit "Kas" Rp 500.000
And klik Simpan
Then jurnal tersimpan sebagai BNM (Bukti Memorial)
Dan total debit = total credit (balance)
```

### Skenario 2: Pembelian mesin (tambah aktiva via memorial)
```
Given saya input memorial debit sisi "Aktiva - Mesin"
When saya pilih perkiraan aktiva "1-1500"
Then sistem tampilkan daftar aktiva existing
When saya klik "Tambah" → input data mesin baru → Simpan
Then auto-create record baru di Master Aktiva
And saya kembali ke memorial dengan aktiva baru ter-select
```

### Skenario 3: Tambah aktiva dengan nominal "Biaya Masih Harus Dibayar"
```
Given saya tambah aktiva baru di memorial
When saya input nominal debit = Rp 50.000.000 di kolom
  "Biaya Masih Harus Dibayar"
Then saat Simpan memorial:
  - Master Aktiva bertambah 1 record
  - Memorial jurnal: Debit Aktiva / Credit Kas
```

### Skenario 4: Penghapusan aktiva (penjualan/pengeluaran)
```
Given saya input memorial: Debit "Kas" Rp 10.000.000
                          Credit "Aktiva - Mesin" Rp 10.000.000
And saya pilih aktiva existing "AST-001"
And Simpan
Then aktiva "AST-001" dihilangkan dari daftar Master Aktiva
Dan memorial terbentuk dengan jurnal yang benar
```

### Skenario 5: Penambahan utang (pilih supplier)
```
Given saya input memorial: Debit "Kas/Beban" Rp 5.000.000
                          Credit "Utang Dagang" Rp 5.000.000
When saya pilih COA "Utang Dagang" (2-1001)
Then sistem tampilkan Master Supplier
When saya pilih supplier "PT Maju Jaya"
Then muncul daftar utang yang akan ditambah
And klik Simpan → utang bertambah di kartu supplier
```

### Skenario 6: Pelunasan utang via memorial (non-tunai)
```
Given saya punya utang ke supplier Rp 3.000.000
When saya buat memorial: Debit "Utang Dagang" Rp 3.000.000
                        Credit "Kas" Rp 3.000.000
And pilih supplier dan invoice utang yang dilunasi
Then kartu utang supplier ter-update
And posting: Debit Utang / Credit Kas (sama dengan BKK tapi via memorial)
```

### Skenario 7: Jurnal tidak balance
```
Given saya input Debit Rp 1.000.000 dan Credit Rp 500.000
When saya klik Simpan
Then sistem menolak dengan pesan
  "Total debit (1.000.000) tidak sama dengan total credit (500.000)"
```

### Skenario 8: COA tipe General dipakai di memorial
```
Given saya coba pilih COA "1-1000" (Kas, tipe General)
When saya gunakan di memorial detail
Then sistem menolak dengan pesan
  "Memorial hanya boleh pakai COA tipe Detail"
```

### Skenario 9: Penambahan piutang (pilih customer)
```
Given saya input memorial: Debit "Piutang Dagang" Rp 2.000.000
                          Credit "Pendapatan" Rp 2.000.000
When saya pilih COA "Piutang Dagang"
Then sistem tampilkan Master Customer
When saya pilih customer "CUST-001"
And Simpan
Then kartu piutang customer bertambah
Dan Pendapatan ter-posting sesuai master posting
```

### Skenario 10: Otorisasi memorial
```
Given memorial nominal Rp 25.000.000
When Level 1 user approve
Then tombol Level 2 aktif
And memorial baru bisa diproses lebih lanjut
```

## 5. Database Impact

| Aksi | Tabel Affected | Posting Debit/Credit |
|------|---------------|---------------------|
| Simpan memorial | `tbl_jurnal_header`, `tbl_jurnal_detail` | Per baris (debit/credit) |
| Tambah aktiva via memorial | `tbl_aktiva` (INSERT) + jurnal | Debit Aktiva / Credit Kas |
| Hapus aktiva via memorial | `tbl_aktiva` (SOFT-DELETE) + jurnal | Debit Kas / Credit Aktiva |
| Penambahan utang | `tbl_utang`, `tbl_kartu_utang` | Credit Utang |
| Pelunasan utang | `tbl_pelunasan_utang`, `tbl_kartu_utang` | Debit Utang / Credit Kas |
| Penambahan piutang | `tbl_piutang`, `tbl_kartu_piutang` | Debit Piutang |
| Pelunasan piutang | `tbl_pelunasan_piutang`, `tbl_kartu_piutang` | Debit Kas / Credit Piutang |
| Otorisasi | `tbl_otorisasi_transaksi` | — |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Debit dan Credit kosong di satu baris | Tolak + pesan "Isi debit atau credit" |
| Debit dan Credit keduanya terisi di satu baris | Tolak + pesan "Pilih hanya debit atau credit per baris" |
| Tanggal di luar periode aktif | Tolak |
| Aktiva baru via memorial tapi user tidak punya akses Master Aktiva | Tolak + pesan "Hubungi admin untuk tambah master" |
| Aktiva sudah dijual (sudah di memorial hapus) | Tidak boleh dijual lagi |
| Sub-ledger kosong (tidak ada customer/supplier) | Tampilkan "Tidak ditemukan data" |
| Hapus memorial yang sudah refer ke kartu piutang/utang | Tolak (harus buat memorial reverse) |
| Self-referencing (Debit=COA X, Credit=COA X) | Tolak |
