# language: id
# File: test-suite/login.feature
# Modul: Login, Setup Periode, User Management (Menu Berkas)

Fitur: Login dan Setup Aplikasi
  Sebagai pengguna ERP Trade Exchange
  Saya ingin login dengan aman dan menyiapkan konfigurasi awal
  Agar bisa menggunakan sistem sesuai hak akses saya

  Latar Belakang:
    Given aplikasi ERP terbuka di halaman login
    And database sudah terisi data user default "admin" dengan password "admin123"

  # ============================================================
  # SKENARIO LOGIN
  # ============================================================

  @smoke
  Skenario: Login berhasil dengan kredensial valid
    Given saya di halaman login
    When saya input username "admin" dan password "admin123"
    And saya klik tombol "Login"
    Then saya diarahkan ke halaman utama
    And header menampilkan 9 modul ERP

  @smoke @regression
  Skenario: Login gagal dengan password salah
    Given saya di halaman login
    When saya input username "admin" dan password "salah123"
    And saya klik tombol "Login"
    Then muncul pesan error "Username atau password salah"
    And saya tetap di halaman login

  @regression
  Skenario: Login gagal dengan username kosong
    Given saya di halaman login
    When saya kosongkan field username
    And saya isi password "admin123"
    And saya klik tombol "Login"
    Then muncul pesan "Username wajib diisi"

  @regression
  Skenario: Login gagal setelah 3 kali percobaan salah
    Given saya sudah gagal login 2 kali
    When saya gagal login untuk ke-3 kalinya
    Then akun terkunci sementara selama 5 menit
    And muncul pesan "Terlalu banyak percobaan gagal. Coba lagi dalam 5 menit."

  @smoke
  Skenario: Logout via Menu Berkas > Lock
    Given saya sudah login sebagai "admin"
    When saya klik Menu Berkas > Lock
    Then aplikasi kembali ke halaman login
    And session token dihapus

  # ============================================================
  # SKENARIO SETUP PERIODE
  # ============================================================

  @smoke @regression
  Skenario: Setup periode kerja untuk pertama kali
    Given saya login sebagai admin
    When saya buka Menu Berkas > Setup Periode Kerja
    And saya input bulan "6" tahun "2026"
    And saya klik Simpan
    Then periode "Juni 2026" tersimpan dengan status Aktif
    And default transaksi di semua modul menjadi Juni 2026

  @regression
  Skenario: Setup periode duplikat ditolak
    Given periode "Juni 2026" sudah ada
    When saya coba setup ulang periode "Juni 2026"
    Then sistem menolak dengan pesan "Periode sudah ada"

  @regression @requires-otorisasi
  Skenario: Kunci periode Mei 2026 setelah tutup buku
    Given saya admin dengan akses "Kunci Periode"
    When saya centang checkbox bulan "Mei"
    And klik tombol "Kunci"
    Then periode Mei 2026 berstatus Terkunci
    And transaksi tertanggal Mei 2026 tidak bisa ditambah/diedit

  @regression
  Skenario: Transaksi gagal karena periode terkunci
    Given periode "Mei 2026" sudah dikunci
    When saya coba tambah transaksi Memorial untuk tanggal "2026-05-15"
    Then muncul pesan "Periode Mei 2026 sudah terkunci"

  # ============================================================
  # SKENARIO SET PERUSAHAAN
  # ============================================================

  @smoke @regression
  Skenario: Setup data perusahaan lengkap
    Given saya di Tab Perusahaan (Set Nomor Transaksi & Perusahaan)
    When saya isi Nama "PT Maju Sentosa", Alamat "Jl. Industri 1"
    And saya isi Kota "Jakarta", Telepon "021-12345", Fax "021-67890"
    And saya isi NPWP "01.234.567.8-901.000"
    And saya klik Simpan
    Then data perusahaan tersimpan
    And NPWP lolos validasi format

  @regression
  Skenario: NPWP format invalid ditolak
    Given saya di form perusahaan
    When saya input NPWP "12345"
    Then muncul pesan "Format NPWP tidak valid (contoh: 01.234.567.8-901.000)"

  # ============================================================
  # SKENARIO USER MANAGEMENT
  # ============================================================

  @smoke @requires-otorisasi
  Skenario: Buat user baru dengan hak akses terbatas
    Given saya admin dengan akses "Set Pemakaian"
    When saya tambah user "kasir01" password "rahasia123"
    And saya centang "Tampil" + "Tambah" di modul Kas Bank saja
    And saya klik Simpan
    Then user "kasir01" terdaftar di sistem
    And saat user "kasir01" login, hanya menu Berkas + Akunting yang tampil

  @regression
  Skenario: Username duplikat ditolak
    Given user "kasir01" sudah ada
    When saya coba buat user baru dengan username "kasir01"
    Then muncul pesan "Username sudah digunakan"

  @regression
  Skenario: Password terlalu pendek ditolak
    Given saya tambah user baru
    When saya input password "123"
    Then muncul pesan "Password minimal 6 karakter"

  @regression
  Skenario: User hanya boleh di 1 level otorisasi
    Given user "manager1" sudah di Level 3
    When saya coba assign user yang sama ke Level 4
    Then muncul pesan "User sudah memiliki level otorisasi. Batalkan dulu."

  @regression
  Skenario: Ganti password self-service
    Given saya login sebagai "kasir01"
    When saya buka Menu Berkas > Ganti Password
    And saya input password lama "rahasia123" dan baru "baru456"
    Then password berubah
    And saya diminta login ulang dengan password baru

  @regression
  Skenario: Set akses COA via 2-kolom interface
    Given saya admin, edit user "staff_akunting"
    When saya pindahkan akun "Kas USD" dari kiri ke kanan
    And klik Simpan
    Then user "staff_akunting" hanya bisa pilih COA Kas IDR di transaksi

  @requires-otorisasi
  Skenario: Otorisasi 5 level berjenjang
    Given transaksi BKM nominal Rp 50.000.000 butuh L1+L2
    When user Level 1 klik Approve
    Then tombol Approve Level 2 menjadi aktif
    And Level 2 tidak bisa approve sebelum Level 1

  @requires-otorisasi
  Skenario: Batal otorisasi reset semua level
    Given transaksi BKM sudah diotorisasi Level 1 dan Level 2
    When user dengan hak "Batal Otorisasi" klik tombol reset
    Then kedua level di-reset
    And status transaksi kembali ke "Draft"