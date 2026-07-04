# language: id
# File: test-suite/kas-bank.feature
# Modul: Transaksi Kas Bank (BKM, BKK, BBM, BBK + sub-ledger)

Fitur: Transaksi Kas Bank
  Sebagai staff akunting
  Saya ingin mencatat semua transaksi kas dan bank
  Agar buku besar ter-update otomatis dan posisi kas/bank selalu akurat

  Latar Belakang:
    Given saya login sebagai staff akunting dengan akses modul Akunting
    And periode "Juni 2026" aktif dan tidak terkunci
    And Master Supplier "PT Maju Jaya" punya utang Rp 5.000.000
    And Master Customer "CV Sentosa" punya piutang Rp 3.000.000
    And COA tersedia: 1-1001 Kas, 1-1101 Bank BCA, 1-1201 Piutang Dagang, 2-1001 Utang Dagang

  # ============================================================
  # BKM - BUKTI KAS MASUK
  # ============================================================

  @smoke @regression
  Skenario: Buat transaksi Kas Masuk (BKM) baru
    Given saya di Akunting > Transaksi Kas Bank
    When saya pilih jenis "BKM", tanggal "2026-06-26"
    And tujuan "CV Sentosa"
    And saya tambah detail: Valas "IDR", Kurs (otomatis), Jumlah "Rp 1.500.000", Lawan "Piutang Dagang"
    And klik Simpan
    Then transaksi tersimpan dengan nomor urut "0001/BKM-..."
    Dan posting: Debit Kas (1-1001) Rp 1.500.000 / Credit Piutang Dagang (1-1201) Rp 1.500.000

  @regression
  Skenario: Terima piutang customer via BKM
    Given saya pilih BKM
    When saya input nominal Rp 3.000.000, Lawan "Piutang Dagang"
    And pilih customer "CV Sentosa"
    Then sistem tampilkan daftar piutang terbuka
    When saya klik Pelunasan dan pilih invoice
    Then posting: Debit Kas / Credit Piutang Dagang
    Dan histori kartu piutang customer bertambah 1 record

  @regression
  Skenario: Nama SPK otomatis muncul
    Given SPK "SPK-100" sudah ada
    When saya input nomor SPK "SPK-100" di detail
    Then kolom Nama SPK otomatis terisi

  # ============================================================
  # BKK - BUKTI KAS KELUAR
  # ============================================================

  @smoke @regression
  Skenario: Buat BKK dengan nominal positif (bukan minus)
    Given saya pilih BKK
    When saya input jumlah "Rp 2.000.000" (positif — BKK ditentukan oleh Jenis Transaksi, bukan tanda minus)
    And Lawan "Beban ATK"
    And klik Simpan
    Then transaksi tersimpan sebagai BKK (bukan BKM)
    Dan posting: Debit Beban ATK / Credit Kas

  @smoke @regression @requires-otorisasi
  Skenario: Bayar utang supplier via BKK + sub-ledger
    Given saya pilih BKK
    When saya input nominal Rp 5.000.000
    And Lawan "Utang Dagang"
    And pilih supplier "PT Maju Jaya"
    Then sistem tampilkan daftar utang terbuka
    When saya klik Pelunasan → pilih invoice → klik Tutup → Simpan
    Then jurnal: Debit Utang Dagang / Credit Kas
    Dan histori kartu utang supplier bertambah record

  @regression
  Skenario: Sub-ledger kosong munculkan pesan
    Given saya pilih Lawan "Utang Dagang"
    When saya pilih supplier yang tidak punya utang
    Then muncul pesan "Tidak ditemukan data utang/piutang"

  # ============================================================
  # BBM & BBK (BUKTI BANK)
  # ============================================================

  @smoke @regression
  Skenario: Buat BBM (Bank Masuk)
    Given saya pilih BBM
    When saya isi tanggal dan detail: Valas "IDR", Kurs (otomatis), Lawan "Piutang Dagang"
    And klik Simpan
    Then transaksi tersimpan
    Dan posting: Debit Bank / Credit Lawan

  @smoke @regression
  Skenario: Buat BBK (Bank Keluar)
    Given saya pilih BBK
    When saya isi detail: Valas "IDR", Lawan "Beban Operasional"
    And klik Simpan
    Then transaksi tersimpan
    Dan posting: Debit Lawan / Credit Bank

  # ============================================================
  # MULTI-VALAS & DETAIL
  # ============================================================

  @regression
  Skenario: Multi-detail multi-currency
    Given saya buat BKM dengan 2 baris detail
    When baris 1: Valas "USD", Kurs 15.500, Jumlah 100 → Rp 1.550.000
    And baris 2: Valas "IDR", Jumlah 500.000
    And Simpan
    Then kedua baris tersimpan
    Dan total konversi ke IDR = Rp 2.050.000

  @regression
  Skenario: Detail tidak balance ditolak
    Given saya buat BKM dengan 2 baris
    When Debit total Rp 1.000.000 dan Credit total Rp 500.000
    Then saat Simpan muncul pesan
      "Total debit (1.000.000) tidak sama dengan total credit (500.000)"

  # ============================================================
  # VALIDASI & OTORISASI
  # ============================================================

  @regression
  Skenario: Nominal nol ditolak
    Given saya buat transaksi Kas Bank
    When saya input Jumlah "0"
    Then saat Simpan muncul pesan "Nominal tidak boleh 0"

  @regression
  Skenario: Periode terkunci memblokir CRUD
    Given periode "Juni 2026" sudah dikunci
    When saya coba tambah BKM untuk tanggal "2026-06-15"
    Then muncul pesan "Periode Juni 2026 sudah terkunci"

  @regression
  Skenario: Akun lawan sama dengan akun kas ditolak
    Given saya buat BKM
    When saya pilih Lawan "Kas" (sama dengan debit)
    Then muncul pesan "Akun lawan harus berbeda"

  @requires-otorisasi
  Skenario: Otorisasi Level 2 tanpa Level 1 ditolak
    Given transaksi BKM nominal Rp 50.000.000 butuh L1+L2
    When user Level 2 langsung Approve
    Then muncul pesan "Otorisasi Level 1 belum dilakukan"

  @requires-otorisasi
  Skenario: Hapus transaksi yang sudah diotorisasi penuh
    Given transaksi BKM sudah L1+L2 approved
    When saya coba Hapus
    Then sistem menolak
    Dan pesan "Transaksi sudah diotorisasi. Batalkan otorisasi dulu."

  @regression
  Skenario: Kurs valas belum di-setup munculkan warning
    Given saya buat transaksi dengan mata uang "SGD"
    And kurs SGD untuk tanggal "2026-06-26" belum ada di master valas
    When saya pilih SGD
    Then muncul pesan "Kurs belum di-set, gunakan kurs terakhir?"
    Dan tersedia opsi "Ya, gunakan kurs lama" atau "Batal"

  @regression
  Skenario: User tanpa akses COA lawan
    Given user "staff_akunting" hanya punya akses COA Kas IDR
    When dia coba pilih Lawan "Kas USD"
    Then combo tidak menampilkan opsi Kas USD

  # ============================================================
  # PARTIAL PAYMENT / MULTI-PAYMENT
  # ============================================================

  @regression
  Skenario: Bayar utang supplier secara bertahap (partial payment)
    Given supplier "PT Maju Jaya" punya faktur "INV-001" dengan saldo Rp 10.000.000
    And belum ada pembayaran sebelumnya
    When saya buat BKK pertama: nominal Rp 3.000.000, Lawan "Utang Dagang"
    And pilih faktur "INV-001" → klik Pelunasan
    And klik Simpan
    Then insert ke dbTempHutPiut dengan Urut=1, JumlahSaldo=7.000.000
    Dan posting: Debit Utang Dagang / Credit Kas
    And faktur "INV-001" masih memiliki sisa Rp 7.000.000

  @regression
  Skenario: Lanjutkan pelunasan faktur yang sama di transaksi berikutnya
    Given faktur "INV-001" sisa saldo Rp 7.000.000
    When saya buat BKK kedua: nominal Rp 5.000.000, Lawan "Utang Dagang"
    And pilih faktur "INV-001" → klik Pelunasan
    And klik Simpan
    Then insert ke dbTempHutPiut dengan Urut=2, JumlahSaldo=2.000.000
    Dan posting: Debit Utang Dagang / Credit Kas
    And faktur "INV-001" masih memiliki sisa Rp 2.000.000

  @regression
  Skenario: Lunasi faktur sepenuhnya dengan transaksi terakhir
    Given faktur "INV-001" sisa saldo Rp 2.000.000
    When saya buat BKK ketiga: nominal Rp 2.000.000, Lawan "Utang Dagang"
    And pilih faktur "INV-001" → klik Pelunasan
    And klik Simpan
    Then insert ke dbTempHutPiut dengan Urut=3, JumlahSaldo=0
    Dan faktur "INV-001" LUNAS (JumlahSaldo = 0)
    Dan di sub-ledger supplier muncul 3 record pelunasan bertahap

  @regression
  Skenario: Bayar piutang customer bertahap (partial payment)
    Given customer "CV Sentosa" punya faktur "INV-100" dengan piutang Rp 6.000.000
    When saya buat BKM pertama: nominal Rp 2.000.000, Lawan "Piutang Dagang"
    And pilih customer → pilih faktur "INV-100" → klik Pelunasan
    And klik Simpan
    Then insert ke dbTempHutPiut dengan Urut=1, TipeTrans='L', StatusHutPiut='PT-'
    Dan JumlahSaldo tersisa: Rp 4.000.000
    And histori kartu piutang customer bertambah 1 record

  # ============================================================
  # CROSS-CURRENCY SETTLEMENT
  # ============================================================

  @regression
  Skenario: Bayar utang USD dengan pembayaran IDR (cross-currency)
    Given supplier "PT Import" punya faktur "INV-200" dalam USD 1.000 (kurs 15.500 = Rp 15.500.000)
    When saya buat BKK dengan Valas "IDR" di baris detail, kurs "15.800"
    And saya input nominal pembayaran "Rp 15.800.000"
    And Lawan "Utang Dagang" → pilih supplier → pilih faktur "INV-200"
    Then sistem detect Valas_='USD' <> Valas='IDR'
    Dan sistem hitung JumlahD = 1.000 USD (konversi dari Rp 15.800.000 / kurs 15.800)
    Dan insert ke dbTempHutPiut dengan Valas_='USD', Kurs_=15.500, Valas='IDR', Kurs=15.800
    Dan selisih kurs (Rp 300.000) dicatat sebagai selisih valuta asing
    And posting: Debit Utang Dagang / Credit Kas

  @regression
  Skenario: Bayar piutang SGD dengan pembayaran IDR (cross-currency)
    Given customer "CV Export" punya piutang "INV-300" dalam SGD 500 (kurs 11.200 = Rp 5.600.000)
    When saya buat BKM dengan Valas "IDR" di baris detail, kurs "11.400"
    And input nominal "Rp 5.700.000"
    And Lawan "Piutang Dagang" → pilih customer → pilih faktur "INV-300"
    Then sistem detect cross-currency
    Dan JumlahD = 500 SGD (dari Rp 5.700.000 / 11.400)
    Dan insert ke dbTempHutPiut dengan Valas_='SGD', Kurs_=11.200, Valas='IDR', Kurs=11.400
    And faktur "INV-300" LUNAS