# Hari 3: Transaksi Harian

> *"Hari ketiga — sekarang bagian yang paling banyak Anda habiskan sebagai operator. Setelah fondasi (setup) dan stok dapur (master data) siap, sekarang waktunya memasak — melakukan transaksi harian. Hari ini kita akan mempraktikkan empat jenis transaksi utama: Kas Masuk, Kas Keluar, Memorial, dan Pelunasan Utang/Piutang."*

Fokus utama hari ini: **Menu Akunting**. Di sini terdapat 2 submenu utama: **Transaksi Kas Bank** dan **Transaksi Memorial**.

---

## Checklist Hari 3

- [ ] Memahami form Transaksi Kas Bank
- [ ] Membuat transaksi BKM (Bank Masuk)
- [ ] Membuat transaksi BKK (Bank Keluar)
- [ ] Menggunakan sub-ledger untuk pelunasan utang/piutang
- [ ] Membuat transaksi Memorial (Jurnal Umum)
- [ ] Menambah aktiva melalui Memorial
- [ ] Melakukan posting jurnal

---

## 1. Membuka Form Transaksi Kas Bank

**Menu: Akunting > Transaksi Kas Bank**

Form ini memiliki area **Header** (data utama) dan **Detail** (baris-baris transaksi).

### Tombol Aksi yang Tersedia:

| Tombol | Fungsi |
|--------|--------|
| **Tambah** | Buat transaksi baru |
| **Koreksi** | Edit transaksi yang sudah ada |
| **Hapus** | Hapus transaksi |
| **Otorisasi** | Validasi transaksi (per level) |
| **Batal Otorisasi** | Reset otorisasi (hati-hati!) |

### Combo Box Jenis Transaksi

Sistem mendukung 4 jenis transaksi utama:

| Kode | Nama | Kapan Dipakai |
|------|------|---------------|
| BKM | Bank Masuk | Menerima pembayaran dari customer |
| BKK | Bank Keluar | Bayar ke supplier |
| BBM | Buku Masuk | Catatan uang masuk non-bank |
| BBK | Bukti Bank Keluar | Catatan uang keluar non-bank |

---

## 2. Membuat Transaksi Bank Masuk (BKM)

**Studi kasus:** Customer "PT Maju Jaya" membayar invoice Juni mereka sebesar Rp 5.000.000 ke rekening bank perusahaan.

### Langkah:

1. Buka **Akunting > Transaksi Kas Bank**
2. Klik tombol **Tambah**
3. Di Header:
   - Pilih jenis transaksi: **BKM**
   - Pilih mata uang: **IDR** → kurs otomatis terisi
   - Pilih tanggal: misalnya 26 Juni 2026
   - Isi "Tulisan Kepada": PT Maju Jaya
4. Klik **Tambah** di sub-grid Detail untuk memasukkan baris:
   - Mata uang: **IDR**
   - Jumlah: **5.000.000**
   - Sumber: Manual / Invoice Juni
   - Keterangan: Pembayaran invoice Juni
   - Nomor SPK: (kosong atau isi jika ada)
   - **Lawan**: Pilih akun piutang dagang (misalnya "1-1201 Piutang Dagang")
5. Klik **Simpan**

> **Apa yang terjadi di belakang layar?**  
> Setelah disimpan, sistem akan otomatis **posting ke buku besar**:
> - Debit: Kas/Bank Rp 5.000.000
> - Credit: Piutang Dagang Rp 5.000.000

### Pertanyaan Umum

**Pertanyaan:** Kenapa kurs tidak muncul otomatis?  
**Jawaban:** Pastikan mata uang sudah diinput di master dan tanggal transaksi valid. Kurs harian biasanya otomatis ter-update.

**Pertanyaan:** Apakah transaksi langsung terposting ke buku besar?  
**Jawaban:** Bisa, tergantung apakah level otorisasi Anda sudah cukup. Jika belum, status akan "Pending" sampai diotorisasi.

---

## 3. Membuat Transaksi Bank Keluar (BKK)

**Studi kasus:** Membayar supplier "CV Sumber Rezeki" sebesar Rp 3.000.000 untuk pembelian bahan baku.

### Langkah:

1. Buka **Akunting > Transaksi Kas Bank**
2. Klik **Tambah**
3. Di Header:
   - Pilih jenis: **BKK**
   - Mata uang: **IDR**
   - Tanggal: hari ini
   - Tulisan Kepada: CV Sumber Rezeki
4. Di Detail sub-grid:
   - Mata uang: IDR
   - Jumlah: **3.000.000** (input dengan **minus** untuk menandakan uang keluar)
   - Sumber: Manual / Pembelian Bahan
   - Keterangan: Pembelian bahan baku Juni
   - Lawan: Pilih akun Utang Dagang (misalnya "1-2001 Utang Dagang")
5. Simpan

> **Penting!** Nilai minus (-) pada kolom Jumlah menandakan aliran dana keluar. Ini membantu sistem membedakan posisi debit/credit dengan benar.

---

## 4. Sub-Ledger & Pelunasan Utang/Piutang

Ini adalah fitur powerful dari sistem — menghubungkan transaksi Kas Bank dengan Master Supplier/Customer.

### Alur Pelunasan Utang via BKK:

Misalkan Anda punya utang ke supplier CV Sumber Rezeki sebesar Rp 5.000.000 dari pembelian bulan lalu. Anda baru akan membayar Rp 3.000.000 sebagian.

1. Pilih transaksi **BKK**
2. Input nominal: **3.000.000** (minus)
3. Pilih **Lawan**: Akun Utang Dagang (1-2001)
4. **Muncul daftar sub-ledger** yang menggunakan kode rekening utang dagang tersebut
5. Pilih **CV Sumber Rezeki** dari daftar supplier
6. Sistem akan menampilkan **daftar utang yang belum lunas** dari supplier tersebut
7. Pilih utang mana yang akan dilunasi (sebagian atau seluruhnya)
8. Klik **Pelunasan**
9. Muncul daftar pembayaran yang tersedia dari Kas Bank sebelumnya
10. Klik **Tutup** untuk menyimpan

### Apa yang Terjadi Setelah Simpan:

- ✅ **Buku besar** ter-update otomatis (debit Kas, kredit Utang)
- ✅ **Sub-ledger** catatan pelunasan bertambah
- ✅ **Historis kartu utang** mendapat record baru (kapan utang, kapan pelunasan)

> **Apa yang terjadi di belakang layar?**  
> Setiap kali Anda melakukan pembayaran utang atau piutang, sistem otomatis merekam historis pelunasan. Ini adalah rekonsiliasi otomatis yang bisa Anda gunakan saat audit atau laporan.

### Pertanyaan Umum

**Pertanyaan:** Daftar sub-ledger tidak muncul saat saya pilih lawan. Kenapa?  
**Jawaban:** Pastikan akun yang Anda pilih di COA terhubung dengan supplier/customer melalui **Master Supplier > Sub-Detail Akun**. Jika belum, tambahkan dulu.

**Pertanyaan:** Saya salah input pelunasan. Bisa dibatalkan?  
**Jawaban:** Sebelum otorisasi final, Anda bisa **Koreksi** transaksi. Setelah terotorisasi, hanya admin level tinggi yang bisa membatalkan via tombol **Batal Otorisasi**.

---

## 5. Transaksi Memorial (Jurnal Entry)

**Menu: Akunting > Transaksi Memorial**

Memorial adalah jurnal entry manual untuk transaksi yang tidak melalui kas/bank. Misalnya pembayaran di muka, penambahan aktiva, atau penyesuaian.

### Jenis Transaksi Memorial:

1. **Jurnal Perkiraan Biasa** (beban → sumber dana)
2. **Penambahan Aktiva** (beli mesin, dll)
3. **Penghapusan Aktiva** (jual aktiva)
4. **Penambahan Utang** (utang non-tunai)
5. **Pelunasan Utang** (di luar Kas Bank)
6. **Penambahan & Pelunasan Piutang**

---

### Sub-Proses 1: Jurnal Perkiraan Biasa

**Pola:** Debit akun beban → Kredit akun sumber dana.

**Contoh:** Bayar gaji Juni sebesar Rp 10.000.000 dari bank.

1. Buka **Transaksi Memorial**
2. Klik **Tambah**
3. Baris 1 (Debit):
   - Perkiraan: Akun Beban Gaji (misal 5-3001)
   - Nominal: 10.000.000
4. Baris 2 (Kredit):
   - Perkiraan: Akun Bank (misal 1-1101)
   - Nominal: 10.000.000
5. Simpan

---

### Sub-Proses 2: Penambahan Aktiva

**Studi kasus:** Membeli mesin produksi seharga Rp 50.000.000 dari bank.

1. Buka **Transaksi Memorial**
2. Klik **Tambah**
3. Baris 1 (Debit):
   - Perkiraan: Akun **Aktiva** (misal 1-1501 Mesin)
   - Klik → muncul **list data aktiva** yang ada
   - Pilih aktiva existing, atau klik **Tambah** untuk input baru:
     - Nama aktiva
     - Tanggal perolehan
     - Persentase penyusutan
     - Periode penyusutan
     - Kuantitas
   - Simpan → otomatis ter-create di **Master Aktiva**
   - Pilih aktiva yang baru dibuat tadi
   - Isi kolom **Biaya Masih Harus Dibayar** dengan nominal: 50.000.000
4. Baris 2 (Kredit):
   - Perkiraan: Akun Bank (1-1101)
   - Nominal: 50.000.000
5. Simpan

> **Apa yang terjadi di belakang layar?**  
> Sistem otomatis menambahkan record baru ke **Master Aktiva**. Data aktiva ini akan masuk ke perhitungan **Penyusutan** sesuai metode garis lurus.

> **Penting!** Ada dua jalur untuk input Master Aktiva:
> - **Jalur 1:** Manual melalui **Master Accounting > Aktiva**
> - **Jalur 2:** Auto-create saat input Memorial dengan debit perkiraan aktiva (jalur ini)

---

### Sub-Proses 3: Penghapusan Aktiva (Penjualan)

**Pola:** Debit Kas/Bank → Kredit Akun Aktiva.

1. Input jurnal seperti biasa
2. Debit: Akun Bank (uang diterima dari penjualan)
3. Kredit: Akun Aktiva (untuk menghilangkan aktiva)
4. Simpan → aktiva akan tereliminasi dari daftar Master Aktiva

---

### Sub-Proses 4 & 5: Utang dan Piutang

Logikanya sama persis dengan yang ada di Kas Bank, hanya saja melalui jalur Memorial (di luar kas).

**Penambahan Utang:**
1. Input memorial dengan Kredit akun Utang Dagang
2. Pilih supplier dari daftar Master Supplier
3. Pilih utang yang akan ditambah
4. Simpan → posting otomatis

**Pelunasan Utang (di Memorial):**
- Dipakai ketika pelunasan tidak melalui Kas Bank
- Pilih akun Utang Dagang
- Pilih supplier
- Lunaskan utang

**Piutang** → Sama logikanya dengan utang, tetapi menggunakan Master Customer dan akun Piutang.

---

## 6. Status Otorisasi

Setiap transaksi bisa memiliki status:

| Status | Keterangan |
|--------|-----------|
| **Draft** | Baru diinput, belum otorisasi |
| **Pending Otorisasi** | Menunggu validasi level atas |
| **Otorisasi Level 1** | Level 1 sudah validasi |
| **Otorisasi Level 2** | Level 2 sudah validasi |
| **Otorisasi Level 3** | Level 3 sudah validasi |
| **Final** | Sudah terotorisasi lengkap |

### Tombol Batal Otorisasi

Jika Level 1 dan 2 sudah diotorisasi, klik **Batal Otorisasi** maka keduanya di-reset.

> **Penting!** Tombol ini biasanya hanya diakses admin senior atau saat ada kesalahan besar yang perlu dikoreksi.

---

## Ringkasan Hari 3

Anda telah mempraktikkan:
- ✅ Transaksi Kas Masuk (BKM) untuk terima pembayaran customer
- ✅ Transaksi Kas Keluar (BKK) untuk bayar supplier
- ✅ Sub-ledger untuk pelunasan utang/piutang
- ✅ Memorial untuk jurnal umum
- ✅ Penambahan aktiva via Memorial (auto-create Master Aktiva)
- ✅ Posting otomatis ke buku besar

> **Tips untuk besok:** Sekarang semua transaksi sudah masuk ke jurnal. Besok kita akan memverifikasi hasilnya melalui laporan keuangan.

---

## Troubleshooting Q&A

**Pertanyaan:** Transaksi saya tidak bisa disimpan. Kenapa?  
**Jawaban:** Periksa apakah periode kerja aktif dan semua field required sudah diisi, terutama **Lawan** (akun pasangan).

**Pertanyaan:** Sub-ledger tidak menampilkan supplier yang saya cari.  
**Jawaban:** Pastikan supplier sudah didaftarkan di **Master Supplier** dan akun utang dagang-nya sudah diset di **Sub-Detail Akun**.

**Pertanyaan:** Transaksi sudah tersimpan tapi buku besar tidak ter-update.  
**Jawaban:** Cek status otorisasi. Mungkin transaksi belum diotorisasi. Atau periode sudah dikunci.

**Pertanyaan:** Saya input Memorial dengan debit aktiva, tapi Master Aktiva tidak ter-create.  
**Jawaban:** Pastikan Anda mengklik tombol **Tambah** dan menyimpan data aktiva baru. Hanya transaksi yang tersimpan penuh yang akan auto-create.

**Pertanyaan:** Kenapa tombol "Tambah" tidak aktif?  
**Jawaban:** Hak akses user Anda mungkin tidak termasuk **Tambah**. Cek di **Menu Berkas > Set Pemakaian**.

**Pertanyaan:** Apakah transaksi bisa diedit setelah disimpan?  
**Jawaban:** Bisa, selama belum otorisasi final dan periode belum dikunci. Gunakan **Koreksi**.
