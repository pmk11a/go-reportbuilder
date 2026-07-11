# 📊 Analisa GAP: Modul Transaksi Kas Bank

> Dokumen ini membandingkan **apa yang seharusnya dibangun** (berdasarkan file [09-kasbank-migration.md](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/09-kasbank-migration.md)) dengan **apa yang sudah ada** di codebase saat ini, baik backend (Go) maupun frontend (React/TanStack).

---

## Cara Membaca Dokumen Ini

| Simbol | Artinya |
|--------|---------|
| ✅ | **Sudah selesai** — fitur sudah dibangun dan berfungsi |
| ⚠️ | **Sebagian ada** — sudah ada dasarnya tapi belum lengkap |
| ❌ | **Belum ada sama sekali** — perlu dibangun dari nol |

---

## Daftar Isi

1. [Form Buat / Edit Transaksi](#1-form-buat--edit-transaksi)
2. [Daftar Data (List)](#2-daftar-data-list)
3. [Detail Transaksi](#3-detail-transaksi)
4. [Hapus Transaksi](#4-hapus-transaksi)
5. [Otorisasi (Persetujuan)](#5-otorisasi-persetujuan)
6. [Cetak Laporan (PDF)](#6-cetak-laporan-pdf)
7. [Ringkasan GAP Keseluruhan](#7-ringkasan-gap-keseluruhan)

---

## 1. Form Buat / Edit Transaksi

> [!NOTE]
> **Apa yang dimaksud?** Form ini adalah halaman dimana pengguna mengisi data transaksi kas/bank baru, atau mengubah transaksi yang sudah ada. Bayangkan seperti mengisi formulir di bank — ada kolom tanggal, jenis transaksi, jumlah uang, dan sebagainya.

### 1.1 Field Header (Bagian Atas Form)

Header adalah informasi umum transaksi yang harus diisi terlebih dahulu sebelum mengisi detail.

| Field | Penjelasan Sederhana | Spesifikasi | Backend | Frontend | Status |
|-------|---------------------|-------------|---------|----------|--------|
| **Jenis Transaksi** (Mode) | Pilihan: Kas Masuk (BKM), Kas Keluar (BKK), Bank Masuk (BBM), Bank Keluar (BBK) | Wajib, dropdown 4 pilihan | ✅ [entity.go](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/entity.go#L124-L130) | ✅ [KasBankFormDialog.tsx](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/frontend/src/domains/accounting/components/accounting/kasbank/KasBankFormDialog.tsx#L42) | ✅ |
| **Tanggal** | Tanggal transaksi | Wajib, harus di dalam periode aktif | ✅ [service.go](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L262-L268) | ✅ | ✅ |
| **No Bukti** | Nomor unik transaksi, dibuat otomatis | Auto-generated | ✅ [nomor.go](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/nomor.go) | ✅ | ✅ |
| **Akun Kas/Bank** (PerkiraanHd) | Akun kas atau bank yang digunakan | Wajib, dari daftar akun | ✅ | ✅ | ✅ |
| **Catatan** (Note / Terima Dari / Kepada) | Nama pihak yang memberi/menerima uang | Label berubah sesuai jenis transaksi | ✅ | ✅ Label dinamis sudah ada | ✅ |
| **THPC** (Tipe Pembayaran) | Cara bayar: Cash, Transfer, Hutang Giro, Piutang Giro | Wajib — 4 pilihan: C/T/H/P. Menentukan apakah sub-form Giro muncul | ⚠️ Field `TPHC` ada di DBTRANSAKSI model, tapi **hanya disimpan di level detail, bukan di level header**. Logika `StatusGiro` (perhitungan THPC × Mode) **belum ada** | ⚠️ TPHC ada sebagai dropdown di detail form, tapi **seharusnya di header**. Belum ada logika trigger Giro | ⚠️ |
| **Devisi** | Unit bisnis | Wajib | ⚠️ Field ada di model [dbtransaksi.go:11](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L11), tapi **tidak ada** di form frontend | ❌ Tidak ada di form | ⚠️ |
| **NoBon** | Nomor bon/referensi eksternal | Opsional | ⚠️ Field ada di model [dbtransaksi.go:35](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L35), tapi **tidak ada** di form frontend | ❌ Tidak ada di form | ⚠️ |
| **KodeBag / No SPK** | Nomor Surat Perintah Kerja, dipilih dari daftar SPK | Opsional — browsing `dbspk.nobukti` | ⚠️ Ada di level detail sebagai text input, tapi **tidak ada browser SPK** | ⚠️ Ada text input manual, tapi seharusnya dari lookup SPK | ⚠️ |
| **Batas Waktu** (TglJurnal) | Tanggal jatuh tempo | Opsional | ✅ | ✅ | ✅ |
| **No. Order** (NoJurnal) | Nomor order | Opsional | ✅ | ✅ | ✅ |
| **No. Invoice** (NoBuktiSem) | Nomor invoice/referensi | Opsional | ✅ | ✅ | ✅ |

### 1.2 Field Detail (Baris Jurnal — Bagian Bawah Form)

Detail adalah baris-baris rincian transaksi. Setiap baris menunjukkan berapa uang masuk (debet) atau keluar (kredit) ke akun mana.

| Field | Penjelasan Sederhana | Spesifikasi | Backend | Frontend | Status |
|-------|---------------------|-------------|---------|----------|--------|
| **Akun** (Perkiraan) | Kode akun dari Daftar Akun (COA) | Wajib, autocomplete | ✅ | ✅ SearchableSelect | ✅ |
| **Lawan** | Akun pasangan | Otomatis sama dengan Akun yang dipilih | ⚠️ Disimpan, tapi **tidak ada logika `CekLawanDiPosting`** | ⚠️ Auto-fill dari perkiraan, tapi **tidak trigger sub-form** | ⚠️ |
| **Valas** | Mata uang | Pilihan: IDR/USD/SGD/EUR/JPY | ✅ | ✅ Dropdown statis | ✅ |
| **Kurs** | Nilai tukar | Default 1 untuk IDR | ✅ [service.go:721-723](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L721-L723) | ✅ | ✅ |
| **Jumlah** | Nominal uang | Wajib, otomatis dihitung Debet/Kredit sesuai Mode | ✅ | ✅ Auto D/K berdasarkan tipe | ✅ |
| **Keterangan** | Penjelasan baris | Opsional | ✅ | ✅ | ✅ |
| **Sumber** (TPHC di detail) | Cara bayar per baris | C/T/H/P | ✅ | ✅ | ✅ |
| **NoSPK** (KodeBag) | Referensi SPK per baris | Opsional | ✅ | ✅ Text input | ✅ |

### 1.3 Sub-Transaksi — Fitur Otomatis yang Muncul Berdasarkan Akun

> [!IMPORTANT]
> **Apa yang dimaksud?** Di aplikasi lama (Delphi), ketika pengguna memilih akun "Lawan" tertentu, sistem **secara otomatis** membuka form tambahan (popup/modal). Misalnya, kalau akun lawan terdaftar sebagai "Hutang Dagang", sistem otomatis membuka form pelunasan hutang. Ini BUKAN tab yang dipilih manual — ini muncul sendiri.

| Sub-Transaksi | Penjelasan Sederhana | Kapan Muncul | Backend | Frontend | Status |
|---------------|---------------------|-------------|---------|----------|--------|
| **Resolver Sub-Transaksi** | Mesin yang mendeteksi apakah akun lawan memerlukan form tambahan | Saat user pilih akun Lawan → sistem cek ke tabel `dbPostHutPiut` | ❌ **Belum ada sama sekali**. Backend tidak punya fungsi `CekLawanDiPosting` atau lookup ke `dbPostHutPiut` untuk menentukan sub-form | ❌ **Belum ada**. Frontend tidak melakukan pengecekan apakah akun lawan memerlukan sub-form | ❌ |
| **Perhitungan DK** | Menentukan sisi Debet/Kredit berdasarkan Mode | Otomatis saat Mode dipilih: BKK/BBK → D, BKM/BBM → K | ❌ Tidak ada logika `calculateDK(mode)` | ⚠️ Frontend menentukan D/K berdasarkan `isMasuk` (BKM/BBM), tapi **tidak disimpan sebagai field DK eksplisit** | ⚠️ |
| **StatusGiro** | Status giro dihitung dari THPC × Mode | Otomatis saat THPC berubah: P+BKM→P+, P+BKK→P-, H+BKM→H+, H+BKK→H- | ❌ **Belum ada logika `calculateStatusGiro(thpc, mode)`** | ❌ **Belum ada** | ❌ |

#### 1.3.1 Sub-Form Giro (untuk pembukaan/pencairan giro)

> **Penjelasan:** Giro adalah surat berharga seperti cek. Kalau transaksi melibatkan giro, pengguna harus mengisi data giro (nomor giro, bank, tanggal, nilai). Ada 2 aksi: **Buka Giro** (buat giro baru) dan **Cairkan Giro** (cairkan giro yang sudah ada).

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Form input Giro | Popup untuk isi nomor giro, bank, tanggal giro, nilai | ❌ Tidak ada endpoint API untuk Giro | ❌ Tidak ada komponen form Giro | ❌ |
| Simpan data Giro ke `dbGiro` | Insert/Update tabel giro di database | ❌ Tidak ada repository/service untuk `dbGiro` | — | ❌ |
| Validasi duplikat Giro | Cek apakah giro dengan nomor sama sudah ada | ❌ | — | ❌ |
| Logika IDR vs Valas | Kalau IDR → Debet/Kredit/Jumlah = 0; Kalau bukan IDR → isi sesuai status | ❌ | — | ❌ |

#### 1.3.2 Sub-Form Deposito (untuk pembukaan/pencairan deposito)

> **Penjelasan:** Deposito berjangka — mirip giro tapi ada tanggal jatuh tempo tambahan. Buka deposito = simpan uang, cairkan deposito = tarik uang.

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Form input Deposito | Popup untuk isi nomor deposito, bank, tanggal, jatuh tempo, nilai | ❌ Tidak ada endpoint API untuk Deposito | ❌ Tidak ada komponen form Deposito | ❌ |
| Simpan data Deposito ke `dbDeposito` | Insert/Update tabel deposito | ❌ Tidak ada repository/service untuk `dbDeposito` | — | ❌ |
| Validasi duplikat Deposito | Cek duplikat berdasarkan NoDeposito+Bank+Tanggal | ❌ | — | ❌ |

#### 1.3.3 Sub-Form Hutang/Piutang (untuk pelunasan atau penambahan hutang/piutang)

> **Penjelasan:** Ini adalah fitur yang paling kompleks. Ketika transaksi melibatkan pelunasan hutang ke supplier atau penerimaan piutang dari customer, sistem harus:
> 1. Membuka daftar tagihan yang belum lunas
> 2. Membiarkan user memilih tagihan mana yang mau dibayar
> 3. Menghitung sisa yang belum lunas
> 4. Menyimpan riwayat pembayaran

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Browser Customer/Supplier | Popup untuk memilih customer/supplier dari daftar | ❌ Tidak ada endpoint lookup customer/supplier untuk KasBank | ❌ Tidak ada komponen browser CS | ❌ |
| Load tagihan belum lunas | Mengisi tabel sementara (`dbTempHutPiut`) dengan tagihan dari `vwHutPiut` | ❌ Tidak ada endpoint/service untuk ini. Model `SDBTempHUTPIUT` sudah ada di [dbtemphutpiut.go](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtemphutpiut.go) tapi **belum dipakai** | ❌ | ❌ |
| Form Pelunasan | User pilih tagihan → isi jumlah bayar → simpan | ❌ | ❌ | ❌ |
| Form Penambahan Hutang/Piutang Baru | User input hutang/piutang baru | ❌ | ❌ | ❌ |
| Validasi pelunasan maks | Tidak boleh bayar lebih dari sisa tagihan | ❌ | ❌ | ❌ |
| Partial Payment (Bayar Bertahap) | Satu tagihan bisa dibayar sebagian di beberapa transaksi | ❌ | ❌ | ❌ |
| Auto-Pay All | Tombol untuk melunasi semua tagihan sekaligus | ❌ | ❌ | ❌ |
| Hitung Sisa Saldo | Kalkulasi running balance per faktur | ❌ | ❌ | ❌ |
| Promosi `dbTempHutPiut` → `dbHutPiut` | Data dari tabel sementara dipindah ke tabel permanen saat transaksi disimpan | ❌ Model `SDBHUTPIUT` ada di [dbhutpiut.go](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbhutpiut.go) tapi belum ada service | ❌ | ❌ |
| Cross-Currency Settlement | Bayar tagihan dalam mata uang berbeda | ❌ | ❌ | ❌ |

#### 1.3.4 Sub-Form Aktiva Tetap (untuk pencatatan aset tetap)

> **Penjelasan:** Kalau transaksi melibatkan pembelian mesin, kendaraan, bangunan dll (aktiva tetap), pengguna harus mengisi data aset tersebut — kode aktiva, persentase penyusutan, tanggal pengakuan, dan lainnya.

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Form input Aktiva | Popup untuk isi data aset tetap | ❌ Tidak ada endpoint API. Model `SDBAKTIVA` ada di [dbaktiva.go](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbaktiva.go) tapi belum ada service | ❌ | ❌ |
| Koreksi Aktiva | Edit data aset yang sudah ada | ❌ | ❌ | ❌ |
| Pencatatan detail penyusutan | Data penyusutan per aset | ❌ Model `SDBAKTIVADET` ada di [dbaktivadet.go](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbaktivadet.go) tapi belum ada service | ❌ | ❌ |

### 1.4 Field Sub-Transaksi di DBTRANSAKSI

> [!NOTE]
> **Apa yang dimaksud?** Beberapa kolom di tabel detail transaksi dikhususkan untuk sub-transaksi. Kolom-kolom ini diisi **secara otomatis** oleh sistem berdasarkan pengecekan akun lawan, bukan diisi manual oleh pengguna.

| Field | Penjelasan | Spesifikasi | Backend (Model) | Backend (Logika) | Frontend | Status |
|-------|-----------|-------------|-----------------|------------------|----------|--------|
| `CustSuppP` | Kode customer/supplier sisi Perkiraan | Dari browser customer | ✅ [dbtransaksi.go:26](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L26) | ⚠️ Disimpan dari DTO (`KodeCustSupp`), tapi **tidak ada logika otomatis dari CekLawanDiPosting** | ⚠️ Ada field `kode_cust_supp` di payload tapi harus diisi manual | ⚠️ |
| `CustSuppL` | Kode customer/supplier sisi Lawan | Dari browser customer | ✅ [dbtransaksi.go:27](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L27) | ❌ Tidak pernah diisi | ❌ | ❌ |
| `KodeP` | Kode sub-tipe sisi Perkiraan (PT/HT/UPT/UHT/AKV/AKM/DP) | Dari `CekLawanDiPosting` | ✅ [dbtransaksi.go:29](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L29) | ❌ Tidak pernah diisi | ❌ | ❌ |
| `KodeL` | Kode sub-tipe sisi Lawan | Dari `CekLawanDiPosting` | ✅ [dbtransaksi.go:30](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L30) | ❌ Tidak pernah diisi | ❌ | ❌ |
| `NoAktivaP` | Nomor aktiva sisi Perkiraan | Dari sub-form Aktiva | ✅ [dbtransaksi.go:31](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L31) | ❌ Tidak pernah diisi | ❌ | ❌ |
| `NoAktivaL` | Nomor aktiva sisi Lawan | Dari sub-form Aktiva | ✅ [dbtransaksi.go:32](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L32) | ❌ Tidak pernah diisi | ❌ | ❌ |
| `StatusAktivaP` | Status aktiva sisi Perkiraan (AKV+/AKV-/AKM+/AKM-) | Dari `CekLawanDiPosting` | ✅ [dbtransaksi.go:33](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L33) | ❌ Tidak pernah diisi | ❌ | ❌ |
| `StatusAktivaL` | Status aktiva sisi Lawan | Dari `CekLawanDiPosting` | ✅ [dbtransaksi.go:34](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L34) | ❌ Tidak pernah diisi | ❌ | ❌ |
| `StatusGiro` | Status giro (P+/P-/H+/H-) | Dari perhitungan THPC × Mode | ✅ [dbtransaksi.go:37](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/infrastructure/persistence/models/dbtransaksi.go#L37) | ❌ Tidak pernah diisi | ❌ | ❌ |

### 1.5 Validasi Saat Simpan

> [!NOTE]
> **Apa yang dimaksud?** Sebelum transaksi bisa disimpan, sistem harus mengecek beberapa hal penting. Ini seperti pemeriksaan keamanan — memastikan data benar dan tidak merusak catatan yang sudah ada.

| Validasi | Penjelasan | Spesifikasi | Backend | Frontend | Status |
|----------|-----------|-------------|---------|----------|--------|
| **Gate 1: Cek Periode** | Tanggal transaksi harus di dalam periode akuntansi yang sedang aktif | Selalu dicek | ✅ [service.go:266-268](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L266-L268) `assertTanggalInPeriode` | ✅ (server-side validation) | ✅ |
| **Gate 2: Lock Periode** | Periode akuntansi tidak boleh sudah dikunci | Selalu dicek, terpisah dari Gate 1 | ❌ **Belum ada**. Backend hanya cek tanggal dalam periode, **tidak cek apakah periode terkunci** (`IsLockPeriode`) | ❌ | ❌ |
| **Gate 3: Cek Otorisasi** | Transaksi yang sudah diotorisasi tidak boleh diubah/dihapus | Untuk Update dan Delete saja | ✅ [service.go:354-356](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L354-L356) `IsOtorisasi1` check | ✅ (server-side) | ✅ |
| **Double Entry** | Total Debet harus sama dengan total Kredit | Selalu dicek | ✅ [service.go:681-699](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L681-L699) `validateDoubleEntry` | ✅ Cek balance di form | ✅ |
| **Jumlah > 0** | Nominal tidak boleh nol | Selalu dicek | ✅ (implisit dari double-entry — total harus > 0) | ✅ | ✅ |
| **Minimal 1 Detail** | Harus ada minimal satu baris jurnal | Selalu dicek | ✅ [service.go:274-276](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L274-L276) | ✅ | ✅ |

---

## 2. Daftar Data (List)

> [!NOTE]
> **Apa yang dimaksud?** Ini adalah halaman utama yang menampilkan semua transaksi kas/bank dalam bentuk tabel. Pengguna bisa mencari, memfilter berdasarkan tanggal atau jenis, dan melihat ringkasan setiap transaksi.

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Tampilkan daftar transaksi dengan paginasi | Menampilkan data per halaman (misal 10 per halaman) | ✅ [handler.go:77-95](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/handler.go#L77-L95) | ✅ [KasBankDataTable.tsx](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/frontend/src/domains/accounting/components/accounting/kasbank/KasBankDataTable.tsx) | ✅ |
| Filter berdasarkan jenis transaksi | BKM / BKK / BBM / BBK | ✅ | ✅ | ✅ |
| Filter berdasarkan tanggal | Rentang tanggal dari-sampai | ✅ | ✅ | ✅ |
| Pencarian teks | Cari berdasarkan nomor bukti atau catatan | ✅ | ✅ | ✅ |
| Urutan data (Sort) | Bisa diurutkan berdasarkan tanggal, no bukti | ✅ | ✅ | ✅ |
| Default periode otomatis | Kalau tidak ada filter tanggal, tampilkan data sesuai periode aktif user | ✅ `UserID` dikirim ke repo untuk resolve default period | ✅ | ✅ |
| Tampilkan total Debet/Kredit per baris | Ringkasan jumlah di setiap baris tabel | ✅ [service.go:134](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L134) `GetAggregateTotals` batch query | ✅ | ✅ |
| Tampilkan status Otorisasi | Ikon/badge menunjukkan sudah diotorisasi atau belum | ✅ | ✅ [OtorisasiButton.tsx](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/frontend/src/domains/accounting/components/accounting/kasbank/OtorisasiButton.tsx) | ✅ |
| Tampilkan info Valas & Rupiah | Kolom jumlah valas dan rupiah terpisah | ✅ `jumlahvalas`, `jumlahrupiah` | ✅ | ✅ |
| Badge tipe transaksi | Warna berbeda untuk BKM/BKK/BBM/BBK | ✅ | ✅ [KasBankTypeBadge.tsx](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/frontend/src/domains/accounting/components/accounting/kasbank/KasBankTypeBadge.tsx) | ✅ |

> **Kesimpulan:** Fitur daftar data **sudah cukup lengkap** untuk transaksi dasar (jurnal biasa tanpa sub-transaksi).

---

## 3. Detail Transaksi

> [!NOTE]
> **Apa yang dimaksud?** Halaman yang menampilkan informasi lengkap satu transaksi — header (ringkasan) di atas, dan baris-baris jurnal (detail) di bawah.

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Tampilkan header transaksi | No Bukti, Tanggal, Tipe, Akun, Catatan | ✅ [handler.go:107-119](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/handler.go#L107-L119) | ✅ [KasBankDetailPage.tsx](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/frontend/src/domains/accounting/components/accounting/kasbank/KasBankDetailPage.tsx) | ✅ |
| Tampilkan daftar detail (baris jurnal) | Tabel dengan kolom: No, Akun, Lawan, Debet, Kredit, Keterangan | ✅ [handler.go:205-216](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/handler.go#L205-L216) | ✅ [KasBankDetailTable.tsx](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/frontend/src/domains/accounting/components/accounting/kasbank/KasBankDetailTable.tsx) | ✅ |
| Tambah baris detail | Tombol untuk menambah baris baru | ✅ [handler.go:264-276](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/handler.go#L264-L276) | ✅ | ✅ |
| Edit baris detail | Ubah data satu baris | ✅ [handler.go:291-308](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/handler.go#L291-L308) | ✅ | ✅ |
| Hapus baris detail | Hapus satu baris | ✅ [handler.go:321-333](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/handler.go#L321-L333) | ✅ | ✅ |
| Tampilkan info sub-transaksi | Menampilkan data Giro/Deposito/HutPiut/Aktiva terkait | ❌ Tidak ada endpoint untuk mengambil data sub-transaksi | ❌ Tidak ada tampilan info sub-transaksi | ❌ |
| Tampilkan field sub-transaksi | KodeP, KodeL, StatusGiro, CustSuppP, dll | ❌ Field ada di model tapi **tidak diekspos** ke response `SKasBankDetail` | ❌ Tidak ada di interface `IKasBankDetail` | ❌ |

---

## 4. Hapus Transaksi

> [!NOTE]
> **Apa yang dimaksud?** Fitur untuk menghapus transaksi yang sudah dibuat. Ada aturan ketat — transaksi yang sudah disetujui (diotorisasi) TIDAK BOLEH dihapus.

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Hapus header + semua detail | Menghapus transaksi beserta semua barisnya | ✅ [handler.go:186-193](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/handler.go#L186-L193) + [service.go:430-445](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L430-L445) | ✅ | ✅ |
| Cek Otorisasi sebelum hapus | Tidak boleh hapus kalau sudah diotorisasi level 1 atau 2 | ✅ [service.go:441-443](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L441-L443) | ✅ Error ditangani | ✅ |
| Cascade hapus sub-transaksi | Kalau transaksi punya data Giro/HutPiut/Aktiva, harus dihapus juga | ❌ **Belum ada** — karena sub-transaksi belum diimplementasi, cascade delete juga belum ada | — | ❌ |
| Cek Lock Periode | Tidak boleh hapus kalau periode sudah dikunci | ❌ **Belum ada** pengecekan `IsLockPeriode` | ❌ | ❌ |
| Konfirmasi hapus | Dialog konfirmasi sebelum hapus | — | ✅ | ✅ |

---

## 5. Otorisasi (Persetujuan)

> [!NOTE]
> **Apa yang dimaksud?** Otorisasi adalah proses persetujuan bertingkat. Bayangkan seperti tanda tangan berjenjang — level 1 harus ditandatangani dulu sebelum level 2, dan seterusnya. Tujuannya untuk keamanan — transaksi yang sudah disetujui tidak bisa diubah lagi.
>
> Di sistem ini, ada **5 level otorisasi**. Berapa level yang aktif tergantung dari pengaturan (MaxOL). Aturan pentingnya:
> - Level harus berurutan (1, 2, 3, dst)
> - Orang yang menyetujui level 1 TIDAK BOLEH menyetujui level 2 (harus orang berbeda)
> - Kalau mau membatalkan, harus dari atas ke bawah (batal level 3 dulu, baru level 2)

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Set Otorisasi (5 level) | Menyetujui transaksi di level tertentu | ✅ [service.go:567-588](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L567-L588) | ✅ | ✅ |
| Batal Otorisasi | Membatalkan persetujuan | ✅ [service.go:594-612](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L594-L612) | ✅ | ✅ |
| Aturan berurutan (Sequential) | Level N memerlukan level N-1 sudah disetujui | ✅ [service.go:578-586](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L578-L586) | ✅ | ✅ |
| Aturan beda orang (Different Approver) | Yang menyetujui level N harus berbeda dari level N-1 | ✅ `ErrSelfOtorisasi` check | ✅ Error ditangani | ✅ |
| Effective MaxOL | Jumlah level efektif: dari kolom MaxOL, atau default 2 | ✅ [service.go:642-647](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L642-L647) | ✅ | ✅ |
| Status Locked | Transaksi terkunci setelah semua level disetujui | ✅ [service.go:654-662](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/service.go#L654-L662) | ✅ | ✅ |
| Proteksi: blokir edit/hapus setelah otorisasi | Tidak boleh ubah/hapus transaksi yang sudah diotorisasi | ✅ | ✅ | ✅ |
| Simpan User & Tanggal per level | Menyimpan siapa dan kapan menyetujui | ✅ `OtoUser1..5`, `TglOto1..5` | ✅ Tooltip detail otorisasi | ✅ |
| Permission gate per aksi | Set → `IsOtorisasi1`, Batal → `IsBatal` | ✅ [routes.go:55-56](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/routes.go#L55-L56) | ✅ | ✅ |

> **Kesimpulan:** Fitur otorisasi **sudah sangat lengkap** dan sesuai spesifikasi.

---

## 6. Cetak Laporan (PDF)

> [!NOTE]
> **Apa yang dimaksud?** Fitur untuk mencetak bukti transaksi dalam format PDF. PDF ini berisi header transaksi, tabel detail, dan kotak tanda tangan.

| Fitur | Penjelasan | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| Generate PDF | Membuat file PDF dari data transaksi | ✅ [pdf.go](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/pdf.go) | ✅ Download button | ✅ |
| Header PDF | Nama perusahaan, tipe bukti, no bukti, tanggal, akun | ✅ [pdf.go:63-88](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/pdf.go#L63-L88) | ✅ | ✅ |
| Tabel detail PDF | Kolom: No, Uraian, Perkiraan, Debet, Kredit | ✅ [pdf.go:93-127](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/pdf.go#L93-L127) | ✅ | ✅ |
| Total di PDF | Baris total Debet dan Kredit | ✅ | ✅ | ✅ |
| Kotak tanda tangan | 3 kotak: Dibuat oleh, Otorisasi 1, Otorisasi 2 | ✅ [pdf.go:132-158](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/pdf.go#L132-L158) | ✅ | ✅ |
| Format Rupiah di PDF | Format angka Indonesia (titik ribuan, koma desimal) | ✅ [pdf.go:178-204](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/pdf.go#L178-L204) | ✅ | ✅ |
| Permission cetak | Hanya user dengan izin `IsCetak` yang bisa cetak | ✅ [routes.go:34](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/routes.go#L34) | ✅ | ✅ |
| Nama perusahaan dinamis | Membaca dari konfigurasi, bukan hardcode | ❌ Masih hardcode `"DANA PENSIUN"` [pdf.go:24](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/pdf.go#L24) | — | ⚠️ |
| Nama otorisator di PDF | Menampilkan nama user yang mengotorisasi di kotak tanda tangan | ❌ Header `h` diterima tapi **tidak dipakai** untuk isi nama [pdf.go:157](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/backend/internal/features/accounting/kasbank/pdf.go#L157) | — | ⚠️ |
| Kotak tanda tangan 3-5 level | Menyesuaikan jumlah kotak sesuai MaxOL | ❌ Selalu 3 kotak (hardcode) | — | ⚠️ |
| Info sub-transaksi di PDF | Menampilkan data Giro/Deposito/HutPiut jika ada | ❌ | — | ❌ |

---

## 7. Ringkasan GAP Keseluruhan

### Statistik GAP

```
┌──────────────────────────────┬─────┬─────┬─────┐
│ Area                         │ ✅  │ ⚠️  │ ❌  │
├──────────────────────────────┼─────┼─────┼─────┤
│ Form Header                  │  7  │  4  │  0  │
│ Form Detail                  │  8  │  1  │  0  │
│ Sub-Transaksi Resolver       │  0  │  1  │  2  │
│ Sub-Form Giro                │  0  │  0  │  4  │
│ Sub-Form Deposito            │  0  │  0  │  3  │
│ Sub-Form HutPiut             │  0  │  0  │ 10  │
│ Sub-Form Aktiva              │  0  │  0  │  3  │
│ Field Sub-Transaksi di DB    │  0  │  1  │  8  │
│ Validasi                     │  4  │  0  │  1  │
│ Daftar Data (List)           │ 10  │  0  │  0  │
│ Detail Transaksi             │  5  │  0  │  2  │
│ Hapus Transaksi              │  3  │  0  │  2  │
│ Otorisasi                    │  9  │  0  │  0  │
│ Cetak Laporan (PDF)          │  7  │  3  │  1  │
├──────────────────────────────┼─────┼─────┼─────┤
│ TOTAL                        │ 53  │ 10  │ 36  │
│ Persentase                   │ 54% │ 10% │ 36% │
└──────────────────────────────┴─────┴─────┴─────┘
```

### Kesimpulan dalam Bahasa Sederhana

````carousel
#### ✅ Yang Sudah Berjalan Baik (54%)

Fitur-fitur dasar sudah **solid dan berfungsi**:
- **Jurnal biasa** (tanpa sub-transaksi) sudah bisa dibuat, diedit, dihapus
- **Daftar transaksi** lengkap dengan filter, pencarian, paginasi, sorting
- **Otorisasi 5 level** sudah sangat lengkap dengan aturan keamanan
- **Cetak PDF** sudah bisa menghasilkan bukti transaksi
- **Validasi dasar** (periode, double-entry, minimal 1 detail) sudah ada
- **Permission per menu** (tambah, koreksi, hapus, cetak, otorisasi) sudah diterapkan
<!-- slide -->
#### ❌ Yang Belum Ada Sama Sekali (36%)

**Seluruh sistem sub-transaksi belum dibangun.** Ini adalah "otak" dari modul KasBank yang membedakannya dari jurnal memorial biasa:

1. **Resolver Sub-Transaksi** — mesin pengecekan otomatis yang menentukan apakah suatu transaksi memerlukan form tambahan (cek ke tabel `dbPostHutPiut`)
2. **Form Giro** — untuk mencatat pembukaan dan pencairan giro
3. **Form Deposito** — untuk mencatat pembukaan dan pencairan deposito berjangka
4. **Form Hutang/Piutang** — fitur paling kompleks untuk pelunasan tagihan, pembayaran bertahap, staging table
5. **Form Aktiva Tetap** — untuk mencatat pembelian/penjualan aset perusahaan
6. **Validasi Lock Periode** — pengecekan apakah periode akuntansi sudah dikunci
7. **Cascade delete sub-transaksi** — saat hapus transaksi, data terkait (giro/deposito/dll) harus ikut terhapus
<!-- slide -->
#### ⚠️ Yang Sudah Ada Tapi Belum Lengkap (10%)

Beberapa fondasi sudah ada, tapi belum terhubung ke logika bisnis:

- **THPC** — dropdown ada di frontend tapi di posisi yang salah (di detail, seharusnya di header) dan belum ada logika `StatusGiro`
- **Devisi** — kolom ada di database tapi tidak ada di form input
- **NoBon** — kolom ada di database tapi tidak ada di form input
- **KodeBag/NoSPK** — ada sebagai text input manual tapi seharusnya dari lookup browser SPK
- **Model database** — model Go untuk `dbHutPiut`, `dbTempHutPiut`, `dbAktiva`, `dbAktivaDet`, `dbPostHutPiut` **sudah ada**, tapi belum ada service/repository yang menggunakannya
````

### Prioritas Pengerjaan yang Disarankan

| Prioritas | Pekerjaan | Kompleksitas | Dampak |
|-----------|-----------|-------------|--------|
| 🔴 **1 — Wajib** | Validasi Lock Periode (`IsLockPeriode`) | Kecil | Mencegah data korup di periode yang sudah ditutup |
| 🔴 **2 — Wajib** | THPC pindah ke header + logika `StatusGiro` | Sedang | Field dasar yang salah posisi |
| 🔴 **3 — Wajib** | Resolver Sub-Transaksi (`CekLawanDiPosting`) | Sedang | Fondasi untuk SEMUA sub-transaksi |
| 🟠 **4 — Penting** | Sub-Form Hutang/Piutang (pelunasan) | Besar | Fitur bisnis paling sering dipakai |
| 🟠 **5 — Penting** | Sub-Form Giro (buka/cairkan) | Sedang | Diperlukan untuk transaksi giro |
| 🟡 **6 — Sedang** | Sub-Form Deposito (buka/cairkan) | Sedang | Mirip Giro, bisa paralel |
| 🟡 **7 — Sedang** | Sub-Form Aktiva Tetap | Sedang | Untuk pencatatan aset |
| 🟢 **8 — Nice-to-have** | PDF: nama otorisator, kotak dinamis, info sub-transaksi | Kecil | Penyempurnaan cetak |
| 🟢 **9 — Nice-to-have** | Field form: Devisi, NoBon, Browser SPK | Kecil | Kelengkapan form |

> [!CAUTION]
> **Peringatan Integritas Data:** Tanpa Resolver Sub-Transaksi, semua transaksi yang melibatkan hutang/piutang, giro, deposito, atau aktiva tetap **tidak akan tercatat dengan benar**. Field-field `KodeP`, `KodeL`, `StatusGiro`, `CustSuppP`, dll akan selalu kosong, yang berarti laporan keuangan sub-ledger (kartu hutang, kartu piutang, daftar giro, daftar aktiva) tidak akan menghasilkan data yang akurat.
