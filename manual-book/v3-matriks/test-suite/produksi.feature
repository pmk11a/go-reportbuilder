# language: id
# File: test-suite/produksi.feature
# Modul: Produksi — SPK, Mesin & TK, Hasil Produksi, Finishing, Permintaan Bahan

Fitur: Produksi (Production)
  Sebagai staff produksi
  Saya ingin mengelola alur produksi dari SPK sampai barang jadi
  Agar perintah kerja tercatat, stok barang jadi bertambah, dan permintaan bahan terkirim ke gudang

  Latar Belakang:
    Given saya login sebagai staff produksi
    And SO "SO-001" sudah L1 approved (status: Outstanding Produksi)
    And Master Mesin "M-001" tersedia
    And Master Bahan "BRG-001" tersedia
    And Master Karyawan "K-001" tersedia

  # ============================================================
  # SPK (SURAT PERINTAH KERJA)
  # ============================================================

  @smoke @regression
  Skenario: Buat SPK dari SO Outstanding
    Given saya buka menu Produksi > SPK
    And saya klik SO-001 dari sheet Outstanding
    Then SPK auto-generated dengan kode barang dari SO
    When saya isi tanggal mulai/selesai + shift
    And klik Simpan
    Then SPK tersimpan

  @smoke @regression
  Skenario: Tambah detail mesin di SPK
    Given SPK sudah dibuat dari SO
    When saya tambah detail mesin "M-001"
    And isi qty 100, jam kerja 8, jam lembur 2
    And pilih karyawan "K-001"
    Then detail mesin tersimpan

  @regression
  Skenario: Browse tenaga kerja di SPK (multiple karyawan per mesin)
    Given saya tambah detail mesin "M-001" di SPK
    When saya klik field Tenaga Kerja
    Then muncul modal browse karyawan
    And saya bisa pilih multiple karyawan

  # ============================================================
  # DEPENDENCY CHAIN (MESIN → BAHAN)
  # ============================================================

  @smoke @regression
  Skenario: Detail bahan tanpa isi mesin → tombol disabled
    Given SPK belum punya detail mesin
    When saya coba klik tombol "Tambah Bahan"
    Then tombol disabled
    And muncul tooltip: "Isi detail mesin dulu"

  @smoke @regression
  Skenario: Tambah detail bahan setelah mesin
    Given SPK sudah punya detail mesin "M-001"
    When saya klik "Tambah Bahan" untuk M-001
    Then sistem tampilkan bahan yang digunakan M-001 dari master
    When saya tambah kode bahan BRG-001, qty 50, berapa kali 2
    Then detail bahan tersimpan

  # ============================================================
  # HASIL PRODUKSI
  # ============================================================

  @smoke @regression
  Skenario: Entry hasil produksi — pisah baik vs rusak
    Given SPK sudah selesai
    When saya buat Hasil Produksi linked ke SPK
    And isi Hasil Baik = 95, Hasil Rusak = 5
    Then stok barang jadi bertambah 95 (bagus saja)
    And tercatat di kartu stok (rusak tidak menambah stok)

  @regression
  Skenario: Hasil Rusak > Hasil Produksi ditolak
    Given SPK sudah selesai
    When saya buat Hasil Produksi
    And isi Hasil Baik = 50, Hasil Rusak = 60 (total > 100)
    Then sistem menolak: "Rusak tidak boleh > total produksi"

  @regression
  Skenario: Hasil Produksi duplicate untuk SPK yang sama ditolak
    Given SPK-100 sudah punya Hasil Produksi
    When saya coba buat Hasil Produksi lagi untuk SPK-100
    Then sistem menolak: "SPK sudah punya Hasil Produksi"

  @regression
  Skenario: Hasil Rusak 100% munculkan warning
    Given SPK sudah selesai
    When saya buat Hasil Produksi dengan Hasil Baik = 0, Hasil Rusak = 100
    Then muncul warning: "Semua barang rusak, cek kualitas produksi"

  # ============================================================
  # SPK FINALISASI (TANPA OTORISASI)
  # ============================================================

  @smoke @regression
  Skenario: SPK selesai tanpa otorisasi → langsung final
    Given SPK sudah lengkap (header + detail mesin + detail bahan)
    When saya klik "Selesai"
    Then status SPK langsung "Selesai" (tanpa perlu L1/L2)

  @regression
  Skenario: Edit SPK yang sudah Selesai ditolak
    Given SPK status "Selesai"
    When saya coba edit SPK
    Then sistem menolak: "SPK sudah selesai, tidak bisa diedit"

  @regression
  Skenario: SPK tanpa detail mesin tidak bisa disimpan
    Given saya buat SPK tanpa detail mesin
    When saya klik Simpan
    Then sistem menolak: "SPK harus punya minimal 1 detail mesin"

  # ============================================================
  # PERMINTAAN BAHAN
  # ============================================================

  @smoke @regression
  Skenario: Permintaan Bahan ke gudang (auto kuantitas dari SPK)
    Given SPK sudah punya detail mesin + bahan
    When saya buat Permintaan Bahan linked ke SPK
    Then kuantitas auto-fill dari total bahan di SPK
    And dokumen terkirim ke menu Gudang

  @regression
  Skenario: Permintaan Bahan tanpa SPK ref → ditolak
    Given saya buat Permintaan Bahan
    When saya tidak pilih SPK referensi
    And klik Simpan
    Then sistem menolak: "Pilih SPK referensi"

  @smoke @regression
  Skenario: Permintaan Bahan Tambahan (kedua)
    Given Permintaan Bahan pertama sudah dibuat dari SPK
    When stok bahan masih kurang
    And saya buat Permintaan Bahan Tambahan
    Then linked ke SPK yang sama

  # ============================================================
  # CROSS-MODULE
  # ============================================================

  @smoke @regression
  Skenario: Cross-check — SPK ada di Marketing (Outstanding) vs Produksi (Sedang Jalan)
    Given SO sudah L1 approved
    When saya cek di Marketing
    Then SO tidak ada di sheet Outstanding (sudah dibuat SPK)
    And di Produksi: SPK muncul dengan status "Sedang Jalan"

  @regression
  Skenario: Finishing tanpa Hasil Produksi → ditolak
    Given SPK belum punya Hasil Produksi
    When saya coba buat Finishing
    Then sistem menolak: "Belum ada Hasil Produksi untuk SPK ini"

  @smoke @regression
  Skenario: Finishing setelah hasil produksi → status barang jadi "siap jual"
    Given SPK sudah punya Hasil Produksi
    When saya buat Finishing
    Then status barang jadi berubah ke "siap jual"
    Dan tercatat di kartu stok
