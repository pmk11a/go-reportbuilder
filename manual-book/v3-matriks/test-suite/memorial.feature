# language: id
# File: test-suite/memorial.feature
# Modul: Memorial (Journal Entry) - jurnal umum, aktiva, utang, piutang

Fitur: Memorial (Journal Entry)
  Sebagai staff akunting
  Saya ingin membuat jurnal penyesuaian dan transaksi non-tunai
  Agar pencatatan akuntansi selalu balance dan aktiva/utang/piutang ter-update

  Latar Belakang:
    Given saya login sebagai staff akunting dengan akses Memorial
    And periode "Juni 2026" aktif dan tidak terkunci
    And COA tipe Detail tersedia: 1-1500 Mesin, 1-1501 Akumulasi Mesin,
      2-1001 Utang Dagang, 1-1201 Piutang Dagang, 4-1001 Pendapatan,
      6-1001 Beban ATK
    And Master Supplier "PT Maju Jaya" dan Customer "CV Sentosa" tersedia

  # ============================================================
  # JURNAL PERKIRAAN BIASA
  # ============================================================

  @smoke @regression
  Skenario: Buat jurnal beban biasa
    Given saya di Akunting > Memorial
    When saya tambah baris:
      | Perkiraan  | Debit       | Credit     |
      | Beban ATK  | 500.000     | 0          |
      | Kas        | 0           | 500.000    |
    And saya klik Simpan
    Then jurnal tersimpan sebagai BNM
    Dan total debit = total credit = Rp 500.000

  @regression
  Skenario: Jurnal tidak balance ditolak
    Given saya input jurnal Debit Rp 1.000.000 Credit Rp 500.000
    When saya klik Simpan
    Then muncul pesan
      "Total debit (1.000.000) tidak sama dengan total credit (500.000)"

  @regression
  Skenario: COA tipe General di memorial ditolak
    Given saya coba pilih COA "1-1000" (tipe General)
    When saya klik Simpan memorial
    Then muncul pesan "Memorial hanya boleh pakai COA tipe Detail"

  @regression
  Skenario: Debit dan Credit keduanya kosong
    Given saya tambah baris tanpa isi debit/credit
    When saya klik Simpan
    Then muncul pesan "Isi debit atau credit"

  @regression
  Skenario: Debit dan Credit keduanya terisi
    Given saya tambah baris dengan Debit 100.000 DAN Credit 100.000
    When saya klik Simpan
    Then muncul pesan "Pilih hanya debit atau credit per baris"

  # ============================================================
  # PENAMBAHAN AKTIVA VIA MEMORIAL
  # ============================================================

  @smoke @regression
  Skenario: Tambah aktiva baru via memorial
    Given saya input memorial debit sisi "Aktiva - Mesin"
    When saya pilih perkiraan aktiva "1-1500"
    Then sistem tampilkan daftar aktiva existing
    When saya klik "Tambah" → input kode "AST-002" nama "Mesin Lipat"
    And saya input nominal debit Rp 50.000.000 di "Biaya Masih Harus Dibayar"
    And saya klik Simpan memorial
    Then auto-create record baru di Master Aktiva "AST-002"
    Dan memorial jurnal: Debit Aktiva / Credit Kas

  @smoke @regression
  Skenario: Pilih aktiva existing untuk memorial penambahan
    Given aktiva "AST-001" (Mesin Cetak) sudah ada
    When saya input memorial Debit Perkiraan Aktiva
    And saya pilih "AST-001" dari list
    Then aktiva ter-select
    Dan saya tinggal input nominal + Credit Kas → Simpan

  @regression
  Skenario: Tambah aktiva via memorial tanpa hak Master
    Given user saya tidak punya akses Master Aktiva
    When saya coba klik "Tambah" di daftar aktiva
    Then tombol disabled
    Dan muncul pesan "Hubungi admin untuk tambah master"

  # ============================================================
  # PENGHAPUSAN AKTIVA VIA MEMORIAL
  # ============================================================

  @regression
  Skenario: Hapus/lepas aktiva via memorial (penjualan)
    Given saya input memorial: Debit Kas Rp 10.000.000 / Credit Perkiraan Aktiva
    When saya pilih aktiva existing "AST-001"
    And saya klik Simpan
    Then aktiva "AST-001" di-soft-delete dari Master Aktiva
    Dan memorial terbentuk dengan jurnal: Debit Kas / Credit Aktiva

  @regression
  Skenario: Aktiva sudah dijual tidak bisa dijual lagi
    Given aktiva "AST-001" sudah dijual (soft-delete)
    When saya coba pilih aktiva "AST-001" lagi di memorial
    Then sistem menolak "Aktiva tidak aktif / sudah dihapus"

  # ============================================================
  # PENAMBAHAN UTANG
  # ============================================================

  @smoke @regression
  Skenario: Tambah utang via memorial
    Given saya input memorial: Debit Beban Rp 5.000.000 / Credit Utang Dagang
    When saya pilih COA "Utang Dagang" (2-1001)
    Then sistem tampilkan Master Supplier
    When saya pilih supplier "PT Maju Jaya"
    And muncul daftar utang yang akan ditambah
    And saya klik Simpan
    Then utang supplier bertambah
    Dan kartu supplier ter-update

  # ============================================================
  # PELUNASAN UTANG
  # ============================================================

  @smoke @regression
  Skenario: Pelunasan utang via memorial (non-tunai)
    Given supplier "PT Maju Jaya" punya utang Rp 3.000.000
    When saya input memorial: Debit Utang Dagang / Credit Kas
    And saya pilih supplier dan invoice utang
    And saya klik Simpan
    Then jurnal: Debit Utang / Credit Kas
    Dan kartu utang supplier ter-update (saldo berkurang)

  # ============================================================
  # PIUTANG
  # ============================================================

  @smoke @regression
  Skenario: Tambah piutang via memorial
    Given saya input memorial: Debit Piutang Dagang / Credit Pendapatan
    When saya pilih COA "Piutang Dagang"
    Then sistem tampilkan Master Customer
    When saya pilih customer "CV Sentosa"
    And klik Simpan
    Then piutang customer bertambah
    Dan kartu customer ter-update

  @smoke @regression
  Skenario: Pelunasan piutang via memorial
    Given customer "CV Sentosa" punya piutang Rp 2.000.000
    When saya input memorial: Debit Kas / Credit Piutang Dagang
    And saya pilih customer dan invoice piutang
    And klik Simpan
    Then jurnal: Debit Kas / Credit Piutang
    Dan kartu piutang customer ter-update

  # ============================================================
  # VALIDASI
  # ============================================================

  @regression
  Skenario: Hapus memorial yang sudah refer ke kartu piutang/utang
    Given memorial sudah terkait dengan kartu piutang customer
    When saya coba Hapus memorial
    Then sistem menolak "Buat memorial reverse, bukan hapus langsung"

  @regression
  Skenario: Tanggal di luar periode aktif ditolak
    Given periode aktif "Juni 2026"
    When saya buat memorial tanggal "2026-07-01"
    Then muncul pesan "Tanggal di luar periode aktif"

  @regression
  Skenario: Self-referencing debit = credit account
    Given saya input memorial Debit "Kas" dan Credit "Kas" (akun sama)
    When saya klik Simpan
    Then muncul pesan "Akun debit dan credit harus berbeda"

  @requires-otorisasi
  Skenario: Otorisasi memorial multi-level
    Given memorial nominal Rp 25.000.000 butuh L1
    When Level 1 user approve
    Then tombol Level 2 (jika ada threshold) menjadi aktif
    Dan memorial terotorisasi penuh setelah semua level approve