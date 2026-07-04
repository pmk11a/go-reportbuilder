# Analisis Gap: Transaksi Kas Bank (Manual Book vs Implementasi)

> Dokumen ini membandingkan spesifikasi di **08-kasbank.md** (Manual Book) dengan implementasi saat ini di `backend/internal/features/accounting/kasbank/`.
>
> **Koreksi resmi:** Pada Manual Book versi lama disebutkan *"BKK harus menggunakan nilai negatif (uang keluar)"* (§8.5 Error Cases). Koreksi ini menyatakan bahwa **BKK TIDAK BOLEH menggunakan nilai negatif**. Penentuan sisi Debet/Kredit dilakukan berdasarkan jenis transaksi (BKM/BKK/BBM/BBK) melalui mekanisme **TipeDK / StatusDK** yang mengisi otomatis kolom Debet **atau** Kredit di baris detail — bukan dengan tanda minus pada nominal. Seluruh analisis di bawah telah disesuaikan dengan aturan ini.

---

## Ringkasan

| Kategori | Hasil |
|----------|-------|
| Validasi double-entry | ✅ Ada |
| Validasi periode | ✅ Ada |
| Enkripsi password & JWT | ✅ Ada (infrastruktur umum) |
| Rate-limiting | ✅ Ada (infrastruktur umum) |
| Nomor bukti auto-gen | ✅ Ada |
| Format nomor bukti (NoUrut/Bulan/Tahun) | ❌ Belum |
| Otorisasi berjenjang (5 level) | ✅ Ada |
| Lock setelah otorisasi 1 | ✅ Ada |
| Self-otorisasi prevented | ✅ Ada |
| Sub-ledger settlement (UTG/PTG) | ❌ Belum |
| Staging dbTempHutPiut | ❌ Belum |
| Partial / cross-currency payment | ❌ Belum |
| Sub-modul Aktiva (AKV) | ❌ Belum |
| Sub-modul Giro (Buka/Cair) | ❌ Belum |
| Validasi nominal vs saldo faktur | ❌ Belum |
| Soft-delete settlement (StatusUID='D') | ❌ Belum |
| Laporan kartuUtang/kartuPiutang | ❌ Belum |
| Laporan kartuGiro | ❌ Belum |
| PDF / print transaksi | ✅ Ada |
| TampilanStatusDK otomatis (BKK=Balik) | ⚠️ Service layer belum mengaktifkan `TipeDK` di `buildDetailRow` |

---

## 1. Jenis Transaksi (§8.1)

**Manual Book:** 4 jenis — BKM, BKK, BBM, BBK.

**Implementasi:**
- `ValidTipeTrans()` di `nomor.go:70-73` memeriksa `BKM|BKK|BBM|BBK` → ✅ benar.
- Handler menolak tipe tidak valid dengan 400 Bad Request → ✅ benar.

---

## 2. Validasi Nominal (Koreksi BKK)

**Manual Book (§8.3):**
> Field input di grid adalah **Jumlah** (bilangan positif). Jangan input negatif.
> Penentuan sisi Debet/Kredit dilakukan oleh field `TipeDK` ... sesuai jenis transaksi.
> **BKM (Masuk):** kolom Debet terisi, Kredit kosong.
> **BKK (Keluar):** kolom Kredit terisi, Debet kosong.

**Implementasi:**
- `validateDoubleEntry()` di `service.go:681-697` menolak `Debet < 0 || Kredit < 0` → ✅ konsisten (nominal wajib positif).
- `validateDoubleEntry()` memastikan sum(Debet) == sum(Kredit) → ✅ double-entry enforced.
- `buildDetailRow()` di `service.go:701-733` meneruskan `d.Debet` dan `d.Kredit` dari input **tanpa** mengubahnya berdasarkan `TipeTrans`. Artinya, handler/form harus mengisi sisi yang benar (BKM → Debet, BKK → Kredit), bukan service layer.

**Gap:** Service layer (`buildDetailRow`) tidak secara eksplisit memaksa aturan Debet/Kredit per tipe transaksi. Validasi ini diandalkan di handler/form. Perlu ditambahkan validasi di `CreateHeader` / `AddDetail` / `UpdateDetail`:
- BKM/BBM → detail harus memiliki Debet > 0 dan Kredit = 0
- BKK/BBK → detail harus memiliki Kredit > 0 dan Debet = 0

---

## 3. Format Nomor Bukti (§8.2)

**Manual Book:** Format: `urut + separator + kode + separator + bulan + separator + tahun`
Contoh: `00001/BKK/07/2026`

**Implementasi:**
- `GenerateNoBukti()` di `nomor.go:93-147` hanya menghasilkan format `BKK/07/2026/00001` (kode/bulan/tahun/urut) — urutan elemen berbeda dan pemisah berbeda.
- `GenerateNoBukti()` juga mengambil nomor urut langsung dari DBNOMOR table `LastNoBukti` (bukan increment per-jenis-transaksi).

**Gap:** Format nomor bukti tidak sesuai spec. Perlu:
1. Format ulang menjadi `00001/BKK/07/2026` (urut/kode/bulan/tahun)
2. Nomor urut harus direset per jenis transaksi per bulan
3. Padding 5 digit untuk nomor urut

---

## 4. Sub-Ledger Settlement (§8.4)

Ini adalah gap terbesar. Manual Book mendeskripsikan 3 fitur sub-ledger yang **sama sekali belum diimplementasikan**:

### 4.1 Alur Bayar Utang / Terima Piutang

**Manual Book (§8.4.1-8.4.2):**
- Saat memilih akun lawan (piutang/utang), muncul daftar supplier/customer.
- Pilih supplier → muncul daftar **utang belum lunas**.
- Pilih tagihan → klik **"Pelunasan"** → input nominal.
- Sistem hitung: Dibayar vs Sisa vs Total.
- Posting ke Buku Besar + sub-ledger + historis kartu.

**Implementasi:**
- ❌ Tidak ada endpoint untuk fetch daftar tagihan terbuka (open invoices) per supplier/customer.
- ❌ Tidak ada endpoint untuk submit pelunasan.
- ❌ Tidak ada tabel staging (`dbTempHutPiut`) yang dipakai.
- ❌ Tidak ada validasi pembayaran vs saldo faktur.
- ❌ Tidak ada posting ke buku besar / sub-ledger.

### 4.2 Staging Table `dbTempHutPiut`

**Manual Book (§8.4.3):**
- Pelunasan tidak langsung menulis ke kartu hutang/piutang.
- Menggunakan `dbTempHutPiut` sebagai staging area per-user.
- Mendukung **partial payment** (bertahap), **multi-payment**, **cross-currency settlement**.
- Soft-delete dengan `StatusUID = 'D'`.

**Implementasi:**
- ❌ Model `SDBTempHutPiut` ada di `models/dbtemphutpiut.go`, tapi:
  - ❌ Tidak ada repository method untuk CRUD `dbTempHutPiut`.
  - ❌ Tidak ada logic partial payment (hitung remaining saldo faktur).
  - ❌ Tidak ada logic cross-currency (konversi kurs faktur vs kurs bayar).
  - ❌ Tidak ada soft-delete (StatusUID).

### 4.3 Validasi Pembayaran vs Saldo Faktur

**Manual Book (§8.4):**
> Jumlah pembayaran tidak boleh melebihi saldo hut/piutang.
> Sistem memvalidasi via `CekPelunasanMax()`.

**Implementasi:**
- ❌ `CekPelunasanMax()` belum ada di codebase.
- ❌ Tidak ada validasi total pembayaran vs saldo terbuka faktur.
- ❌ Tidak ada pesan error: *"Jumlah pembayaran melebihi saldo faktur"*.
- ❌ Tidak ada pengecekan: *"Faktur sudah lunas"*.

---

## 5. Sub-Modul Giro (§8.4.4)

**Manual Book:**
- THPC = `[H]utang Giro` / `[P]iutang Giro` mengaktifkan form Giro.
- **Buka Giro (H+):** BKK → THPC H → form Giro (Bank, No. Giro, Tgl, Jatuh Tempo).
- **Cair Giro (H-):** BBK → THPC H → pilih giro yang belum cair.
- **Terima Giro Customer (P+):** BKM → THPC P → form Giro.
- **Cair Giro Customer (P-):** BKK/BBM → THPC P → pilih giro yang belum cair.

**Implementasi:**
- ❌ Tidak ada entitas giro (table/model `DBGIRO` belum ditemukan).
- ❌ Tidak ada logic Buka/Cair Giro.
- ❌ Tidak ada link antara THPC dan form Giro.

---

## 6. Sub-Modul Aktiva (Aset Tetap) (§8.5)

**Manual Book:**
- Saat akun Lawan/Perkiraan terdaftar di `dbPostHutPiut` dengan kode **AKV**.
- Muncul sub-modul `FrKasBankAktiva` untuk input: Keterangan, Qty, % Susut, Tgl Pengakuan, Tipe (Lurus/Menurun), Akumulasi Susut, Biaya Susut.
- Posting ke `dbAktiva` + `dbTransaksi`.

**Implementasi:**
- ✅ Model `SDBAKTIVA` dan `SDBAKTIVADET` sudah ada.
- ❌ Tidak ada logic di service untuk mendeteksi kode AKV.
- ❌ Tidak ada endpoint untuk submit data aktiva.
- ❌ Tidak ada cascade delete (hapus transaksi → hapus aktiva terkait).
- ❌ Tidak ada logic penyusutan (straight-line vs declining balance).

---

## 7. Kode Sub-Ledger Lengkap (PWT) (§8.4.5)

**Manual Book:** 7 jenis sub-ledger via `dbPostHutPiut`:
| Kode | Nama | Implementasi |
|------|------|-------------|
| PT | Piutang Dagang | ❌ Belum |
| HT | Hutang Dagang | ❌ Belum |
| UPT | Uang Muka Piutang | ❌ Belum |
| UHT | Uang Muka Hutang | ❌ Belum |
| AKV | Aktiva | ❌ Belum |
| AKM | Akumulasi Penyusutan | ❌ Belum |
| GIRO | Giro | ❌ Belum |

**Implementasi:**
- ❌ Semua belum ada (kecuali AKV model table-nya sudah ada).
- ❌ Tidak ada integrasi dengan `dbPostHutPiut` untuk routing sub-ledger.

---

## 8. Validasi Periode (§8.4)

**Manual Book:**
> Periode kerja harus terbuka. Transaksi ditolak jika periode sudah dikunci.

**Implementasi:**
- `assertTanggalInPeriode()` di `service.go:665-677` memanggil `repo.GetPeriode()` → ✅ ada.
- Mengembalikan `ErrTanggalDiLuarPeriode` jika tanggal di luar bulan/periode aktif → ✅ benar.
- Mengembalikan `ErrPeriodeNotSet` jika user belum punya DBPERIODE → ✅ benar.

---

## 9. Otorisasi Berjenjang (§8.4)

**Manual Book:**
> Otorisasi berjenjang berlaku sesuai level user — Level 2 butuh otorisasi Level 1.

**Implementasi:**
- `SetOtorisasi()` di `service.go:565-586` → ✅ enforced.
- Level N memerlukan level N-1 sudah disetujui → ✅ ada (`ErrOtorisasiPrevLevelMissing`).
- Approver level N tidak boleh sama dengan level N-1 → ✅ ada (`ErrSelfOtorisasi`).
- `CancelOtorisasi()` menolak jika level berikutnya sudah disetujui → ✅ ada.
- `DeleteHeader()` dan `UpdateHeader()` ditolak jika `IsOtorisasi1` aktif → ✅ ada.
- Support hingga 5 level (IsOtorisasi1-5) → ✅ benar.

---

## 10. TampilanStatusDK Otomatis

**Manual Book (§8.3):**
> Penentuan sisi Debet/Kredit dilakukan oleh field `TipeDK` ... diisi otomatis oleh `TampilanStatusDK()` sesuai jenis transaksi.

**Implementasi:**
- `buildDetailRow()` di `service.go:701-733` mengisi `TipeTrans` dari header, tetapi **tidak** menghitung/mengatur nilai Debet atau Kredit berdasarkan tipe transaksi.
- `TipeDK` / `StatusDK` tidak muncul di `SDetailInput` atau `SDbTransaksi`.

**Gap:** Perlu logic untuk auto-fill sisi Debet/Kredit:
- BKM/BBM → detail wajib Debet > 0, Kredit = 0
- BKK/BBK → detail wajib Kredit > 0, Debet = 0

---

## 11. Mata Uang & Kurs (§8.3)

**Manual Book:**
> Nilai kurs otomatis dari dbValas; default 1 untuk IDR.

**Implementasi:**
- `buildDetailRow()` di `service.go:717-727` menangani valas: jika tidak IDR, kalikan dengan kurs untuk DebetRp/KreditRp → ✅ benar.
- Kurs default = 1 jika input 0 → ✅ benar.
- ❌ Tidak ada fetch otomatis kurs dari `dbValas` (handler menerima nilai dari client-side).

---

## 12. Error Cases (§8.5)

| Pesan di Manual Book | Implementasi | Status |
|----------------------|-------------|--------|
| "Periode tidak dapat dibuka..." | `ErrTanggalDiLuarPeriode` | ✅ |
| ~~"BKK harus menggunakan nilai negatif"~~ | ~~(berlaku koreksi: BKK tidak boleh negatif)~~ | ✅ (nominal wajib positif) |
| "Pilih akun lawan ..." | Validasi di handler/detail | ⚠️ Sebagian |
| "Anda tidak memiliki akses..." | Middleware `RequireAnyRole` | ✅ |
| "Tidak ditemukan tagihan terbuka" | ❌ Belum ada | ❌ |
| "Akun lawan tidak terkait sub-ledger" | ❌ Belum ada validasi | ❌ |
| "Jumlah pembayaran melebihi saldo faktur" | ❌ `CekPelunasanMax` belum ada | ❌ |
| "Pembayaran total melebihi saldo hut/piutang" | ❌ Belum ada | ❌ |
| "Faktur ini sudah lunas" | ❌ Belum ada | ❌ |
| "Nomor SPK duplikat" | ❌ Belum ada | ❌ |
| "Level 1 harus diotorisasi terlebih dahulu" | `ErrOtorisasiPrevLevelMissing` | ✅ |

---

## 12. Catatan Prasyarat (§8.4 - Catatan Operator)

Prasyarat yang harus dipenuhi sebelum transaksi kasbank:

| Prasyarat | Implementasi | Status |
|-----------|-------------|--------|
| Chart of Accounts (COA) | `SDbPerkiraan` model, `LookupPerkiraan` endpoint | ✅ |
| Posting Perkiraan | Model `SDbPostHutPiut` ada | ⚠️ Model ada, integrasi belum |
| Master Devisi | Model `SDBDEVISI` ada | ⚠️ Model ada, validasi belum |
| Master Valas | Model `dbValas` belum diperiksa integrasinya | ❌ |
| Master Supplier/Customer | Model `SDbCustSupp` ada | ⚠️ Model ada, sub-detail belum |
| Master User | Auth sudah terpasang | ✅ |
| Saldo Awal Periode | Model `SDbPeriode` ada | ⚠️ Model ada, validasi saldo belum |

---

## Kesimpulan

| Prioritas | Gap | Est. Effort |
|-----------|-----|-------------|
| **P1 (Core)** | Format nomor bukti (`00001/BKK/07/2026`) | Sedang |
| **P1 (Core)** | Auto-fill Debet/Kredit per tipe transaksi (TipeDK) | Mudah |
| **P1 (Core)** | Validasi strict: BKM/BBM wajib Debet>0, BKK/BBK wajib Kredit>0 | Mudah |
| **P2 (Major)** | Sub-ledger settlement (open invoices, pelunasan, staging `dbTempHutPiut`) | Besar |
| **P2 (Major)** | Validasi `CekPelunasanMax` (pembayaran vs saldo faktur) | Sedang |
| **P2 (Major)** | Partial payment & cross-currency settlement | Besar |
| **P3 (Nice-to-have)** | Sub-modul Giro (Buka/Cair) | Sedang |
| **P3 (Nice-to-have)** | Sub-modul Aktiva (AKV) + penyusutan | Besar |
| **P3 (Nice-to-have)** | Laporan kartuUtang/kartuPiutang/kartuGiro | Sedang |
| **P3 (Nice-to-have)** | Soft-delete settlement (StatusUID) | Mudah |
| **P3 (Nice-to-have)** | Validasi SPK duplikat | Mudah |
