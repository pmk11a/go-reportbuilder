/**
 * Playwright Test — Transaksi Kas Bank (BKM, BKK, BBM, BBK)
 *
 * Generated from: v3-matriks/test-suite/kas-bank.feature
 * Source spec:    v3-matriks/specs/spec-kas-bank.md
 * Target app:     ERP Trade Exchange (Laravel + Nuxt 3 + SQL Server)
 *
 * ⚠️ TEST INI BELUM DIJALANKAN — ini executable artifact siap pakai,
 *    bukan output test. Sebelum dijalankan:
 *    1. Set BASE_URL env ke server Laravel yang running
 *    2. Sesuaikan locator dengan DOM real aplikasi
 *    3. Konfigurasi globalSetup.ts untuk login + seed data
 *    4. Verifikasi selector table & field sesuai form master ERP
 *
 * Cara jalankan (NANTI, bukan sekarang):
 *   npx playwright test kas-bank.playwright.spec.ts --headed
 *
 * Asumsi:
 *   - URL pattern: /akunting/kas-bank
 *   - Authentication via session cookie atau login page
 *   - Selector mengikuti Nuxt UI component naming (el-input, el-select, dll)
 *   - Backend API di Laravel untuk verify journal posting
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const TEST_DATA = {
  tanggal: '2026-06-26',
  tanggalLocked: '2026-06-15', // Juni 2026 = locked di skenario 6
  customer: {
    kode: 'CUST-001',
    nama: 'CV Sentosa',
    piutang: 3_000_000,
  },
  supplier: {
    kode: 'SUPP-001',
    nama: 'PT Maju Jaya',
    utang: 5_000_000,
  },
  coa: {
    kas_idr: '1-1001',
    bank_bca: '1-1101',
    piutang_dagang: '1-1201',
    utang_dagang: '2-1001',
    beban_atk: '5-1001',
    beban_operasional: '5-2001',
    kas_usd: '1-1002',
  },
  user: {
    staffAkunting: { username: 'staff_akunting', password: 'Test@123', level: 1 },
    supervisor: { username: 'supervisor', password: 'Test@123', level: 2 },
    staffLimitedCoa: { username: 'staff_limited', password: 'Test@123', level: 1 },
  },
  spk: {
    nomor: 'SPK-100',
    nama: 'SPK Pembelian ATK Juni 2026',
  },
  valas: {
    idr: 'IDR',
    usd: 'USD',
    sgd: 'SGD',
  },
  kurs: {
    usd: 15_500,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Login sebagai user tertentu. Panggil di setiap test yang butuh auth.
 */
async function login(page: Page, user: typeof TEST_DATA.user.staffAkunting): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="input-username"]', user.username);
  await page.fill('[data-testid="input-password"]', user.password);
  await page.click('[data-testid="btn-login"]');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10_000 });
}

/**
 * Navigate ke halaman Transaksi Kas Bank
 */
async function gotoKasBank(page: Page): Promise<void> {
  await page.click('[data-testid="menu-akunting"]');
  await page.click('[data-testid="submenu-kas-bank"]');
  await expect(page).toHaveURL(/\/akunting\/kas-bank/);
  await expect(page.locator('[data-testid="form-header-transaksi"]')).toBeVisible();
}

/**
 * Isi header transaksi
 */
async function fillHeader(
  page: Page,
  options: {
    jenis?: string;
    tanggal?: string;
    tujuan?: string;
  },
): Promise<void> {
  if (options.jenis) {
    await page.selectOption('[data-testid="select-jenis-transaksi"]', options.jenis);
  }
  // NOTE: Tidak ada field mata uang di header kas bank. Valas & Kurs ada di detail row.
  if (options.tanggal) {
    await page.fill('[data-testid="input-tanggal"]', options.tanggal);
  }
  if (options.tujuan) {
    await page.fill('[data-testid="input-tujuan"]', options.tujuan);
  }
}

/**
 * Tambah baris detail transaksi
 */
async function addDetailRow(
  page: Page,
  options: {
    palas?: string;
    jumlah?: string;
    sumber?: string;
    keterangan?: string;
    nomorSpk?: string;
    lawan?: string;
  },
): Promise<void> {
  await page.click('[data-testid="btn-tambah-detail"]');
  await expect(page.locator('[data-testid="detail-row"]:last-child')).toBeVisible();

  const row = page.locator('[data-testid="detail-row"]').last();

  if (options.palas) {
    await row.locator('[data-testid="select-palas"]').selectOption(options.palas);
  }
  if (options.jumlah) {
    await row.locator('[data-testid="input-jumlah"]').fill(options.jumlah);
  }
  if (options.sumber) {
    await row.locator('[data-testid="input-sumber"]').fill(options.sumber);
  }
  if (options.keterangan) {
    await row.locator('[data-testid="input-keterangan"]').fill(options.keterangan);
  }
  if (options.nomorSpk !== undefined) {
    await row.locator('[data-testid="input-nomor-spk"]').fill(options.nomorSpk);
  }
  if (options.lawan) {
    await row.locator('[data-testid="select-lawan"]').selectOption(options.lawan);
  }
}

/**
 * Verifikasi jurnal terbentuk via API/backend query
 * CATATAN: Implementasi tergantung backend yang dipakai
 */
async function verifyJurnalPosting(
  page: Page,
  expected: { debit: string; credit: string; amount: number },
): Promise<void> {
  // Verifikasi via response network — biasanya aplikasi panggil API setelah save
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes('/api/jurnal') && resp.status() === 200,
    { timeout: 5_000 },
  );
  await page.click('[data-testid="btn-simpan"]');
  const response = await responsePromise;
  const body = await response.json();

  expect(body).toMatchObject({
    debit_account: expected.debit,
    credit_account: expected.credit,
    amount: expected.amount,
  });
}

// ============================================================================
// Tests
// ============================================================================

test.describe('Transaksi Kas Bank', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_DATA.user.staffAkunting);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 1: Buat BKM baru
  // --------------------------------------------------------------------------
  test('@smoke @regression Skenario 1: Buat transaksi BKM baru', async ({ page }) => {
    await gotoKasBank(page);

    // Isi header
    await fillHeader(page, {
      jenis: 'BKM',
      tanggal: TEST_DATA.tanggal,
      tujuan: TEST_DATA.customer.nama,
    });

    // Tambah 1 baris detail
    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '1500000',
      keterangan: 'Terima pembayaran piutang customer',
      lawan: TEST_DATA.coa.piutang_dagang,
    });

    // Simpan & verify response
    await verifyJurnalPosting(page, {
      debit: TEST_DATA.coa.kas_idr,
      credit: TEST_DATA.coa.piutang_dagang,
      amount: 1_500_000,
    });

    // Verifikasi nomor bukti ter-generate
    await expect(page.locator('[data-testid="nomor-bukti"]')).toContainText(/0001\/BKM-/);

    // Verifikasi success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="toast-success"]')).toContainText(
      'Transaksi berhasil disimpan',
    );
  });

  // --------------------------------------------------------------------------
  // SKENARIO 2: BKK — nominal positif, ditentukan oleh Jenis Transaksi
  // --------------------------------------------------------------------------
  test('@smoke @regression Skenario 2: Buat BKK (uang keluar)', async ({ page }) => {
    await gotoKasBank(page);

    await fillHeader(page, {
      jenis: 'BKK',
      tanggal: TEST_DATA.tanggal,
    });

    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '2000000', // positif — BKK ditentukan oleh Jenis Transaksi, bukan minus
      keterangan: 'Bayar utang supplier',
      lawan: TEST_DATA.coa.utang_dagang,
    });

    await verifyJurnalPosting(page, {
      debit: TEST_DATA.coa.utang_dagang,
      credit: TEST_DATA.coa.kas_idr,
      amount: 2_000_000,
    });

    // Pastikan transaksi tersimpan sebagai BKK (bukan BKM)
    await expect(page.locator('[data-testid="jenis-transaksi-display"]')).toContainText('BKK');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 3: Pilih SPK yang sudah ada
  // --------------------------------------------------------------------------
  test('@regression Skenario 3: Nama SPK otomatis muncul', async ({ page }) => {
    await gotoKasBank(page);

    await fillHeader(page, {
      jenis: 'BKK',
      tanggal: TEST_DATA.tanggal,
    });

    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '500000',
      nomorSpk: TEST_DATA.spk.nomor,
      keterangan: 'Pembayaran sesuai SPK',
      lawan: TEST_DATA.coa.piutang_dagang,
    });

    // Tunggu auto-fill dari API
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/spk/') && resp.status() === 200,
    );

    // Verify kolom Nama SPK auto-filled
    const namaSpkField = page.locator('[data-testid="detail-row"]').last().locator('[data-testid="input-nama-spk"]');
    await expect(namaSpkField).toHaveValue(TEST_DATA.spk.nama);
    await expect(namaSpkField).toBeDisabled(); // Field auto, read-only
  });

  // --------------------------------------------------------------------------
  // SKENARIO 4: Bayar utang supplier via BKK + sub-ledger
  // --------------------------------------------------------------------------
  test('@smoke @regression @requires-otorisasi Skenario 4: Bayar utang supplier', async ({
    page,
  }) => {
    await gotoKasBank(page);

    await fillHeader(page, {
      jenis: 'BKK',
      tanggal: TEST_DATA.tanggal,
      tujuan: TEST_DATA.supplier.nama,
    });

    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '-5000000',
      keterangan: 'Pelunasan utang supplier',
      lawan: TEST_DATA.coa.utang_dagang,
    });

    // Pilih supplier di sub-ledger picker
    await page.click('[data-testid="btn-pilih-sub-ledger"]');
    await page.fill('[data-testid="search-supplier"]', TEST_DATA.supplier.nama);
    await page.click(`[data-testid="supplier-option-${TEST_DATA.supplier.kode}"]`);

    // Tunggu daftar utang terbuka tampil
    await expect(page.locator('[data-testid="modal-daftar-utang"]')).toBeVisible();
    await expect(page.locator('[data-testid="row-utang-terbuka"]')).toHaveCount(1);

    // Klik Pelunasan
    await page.click('[data-testid="btn-pelunasan"]');
    await page.click('[data-testid="btn-tutup-modal-utang"]');
    await page.click('[data-testid="btn-simpan"]');

    // Verify jurnal & histori kartu supplier
    await expect(page.locator('[data-testid="toast-success"]')).toContainText(
      'Pelunasan utang berhasil',
    );

    // Verify histori kartu utang supplier ter-update
    // Asumsi: ada halaman /master/supplier/{kode}/history-utang
    await page.goto(`/master/supplier/${TEST_DATA.supplier.kode}/history-utang`);
    const historiRows = page.locator('[data-testid="histori-utang-row"]');
    await expect(historiRows.first()).toContainText('Pelunasan');
    await expect(historiRows.first()).toContainText('5.000.000');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 5: Terima piutang customer via BKM
  // --------------------------------------------------------------------------
  test('@regression Skenario 5: Terima piutang customer via BKM', async ({ page }) => {
    await gotoKasBank(page);

    await fillHeader(page, {
      jenis: 'BKM',
      tanggal: TEST_DATA.tanggal,
      tujuan: TEST_DATA.customer.nama,
    });

    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '3000000',
      keterangan: 'Terima pembayaran piutang',
      lawan: TEST_DATA.coa.piutang_dagang,
    });

    // Pilih customer
    await page.click('[data-testid="btn-pilih-sub-ledger"]');
    await page.click(`[data-testid="customer-option-${TEST_DATA.customer.kode}"]`);

    // Modal daftar piutang terbuka
    await expect(page.locator('[data-testid="modal-daftar-piutang"]')).toBeVisible();

    // Pelunasan
    await page.click('[data-testid="btn-pelunasan"]');
    await page.click('[data-testid="btn-tutup-modal-piutang"]');
    await page.click('[data-testid="btn-simpan"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText(
      'Pelunasan piutang berhasil',
    );

    // Verify histori kartu piutang
    await page.goto(`/master/customer/${TEST_DATA.customer.kode}/history-piutang`);
    const historiRows = page.locator('[data-testid="histori-piutang-row"]');
    await expect(historiRows.first()).toContainText('Pelunasan');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 6: Periode terkunci memblokir CRUD
  // --------------------------------------------------------------------------
  test('@regression Skenario 6: Periode terkunci memblokir CRUD', async ({ page }) => {
    await gotoKasBank(page);

    // Tanggal di periode terkunci (Juni 2026)
    await fillHeader(page, {
      jenis: 'BKK',
      tanggal: TEST_DATA.tanggal,
    });

    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '100000',
      keterangan: 'Test periode terkunci',
      lawan: TEST_DATA.coa.piutang_dagang,
    });

    await page.click('[data-testid="btn-simpan"]');

    // Verifikasi pesan error
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="toast-error"]')).toContainText(
      'Periode Juni 2026 sudah terkunci',
    );

    // Verifikasi tombol save disabled atau error muncul
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toContainText(/terkunci/i);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 7: Otorisasi Level 2 tanpa Level 1 ditolak
  // --------------------------------------------------------------------------
  test('@requires-otorisasi Skenario 7: Otorisasi L2 tanpa L1 ditolak', async ({ page }) => {
    // Login sebagai supervisor (level 2)
    await login(page, TEST_DATA.user.supervisor);

    await gotoKasBank(page);

    // Cari transaksi BKM existing yang butuh L1+L2 (nominal besar)
    await page.goto('/akunting/kas-bank/daftar-transaksi');
    await page.click('[data-testid="filter-status"]:has-text("Menunggu Otorisasi")');
    await page.click('[data-testid="row-transaksi-bkm-50jt"]');

    // Langsung coba approve sebagai L2 tanpa ada L1
    await page.click('[data-testid="btn-approve-level-2"]');

    // Verifikasi error
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Otorisasi Level 1 belum dilakukan',
    );

    // Verifikasi status tidak berubah
    await expect(page.locator('[data-testid="status-transaksi"]')).toContainText(
      'Menunggu Otorisasi Level 1',
    );
  });

  // --------------------------------------------------------------------------
  // SKENARIO 8: Hapus transaksi yang sudah diotorisasi penuh
  // --------------------------------------------------------------------------
  test('@requires-otorisasi Skenario 8: Hapus transaksi berotorisasi penuh ditolak', async ({
    page,
  }) => {
    await gotoKasBank(page);

    // Buka transaksi yang sudah L1+L2 approved
    await page.goto('/akunting/kas-bank/daftar-transaksi');
    await page.click('[data-testid="row-transaksi-approved"]');

    // Coba hapus
    await page.click('[data-testid="btn-hapus"]');
    await page.click('[data-testid="btn-confirm-hapus"]');

    // Verifikasi error
    await expect(page.locator('[data-testid="toast-error"]')).toContainText(
      'Transaksi sudah diotorisasi',
    );
    await expect(page.locator('[data-testid="toast-error"]')).toContainText(
      'Batalkan otorisasi dulu',
    );

    // Verifikasi transaksi masih ada
    await expect(page.locator('[data-testid="row-transaksi-approved"]')).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // SKENARIO 9: Multi-detail multi-currency
  // --------------------------------------------------------------------------
  test('@regression Skenario 9: Multi-detail multi-currency', async ({ page }) => {
    await gotoKasBank(page);

    await fillHeader(page, {
      jenis: 'BKM',
      tanggal: TEST_DATA.tanggal,
      tujuan: 'Multi-currency test',
    });

    // Baris 1: USD 100
    await addDetailRow(page, {
      palas: TEST_DATA.valas.usd,
      jumlah: '100',
      keterangan: 'Bayar USD',
      lawan: TEST_DATA.coa.piutang_dagang,
    });

    // Baris 2: IDR 500.000
    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '500000',
      keterangan: 'Bayar IDR',
      lawan: TEST_DATA.coa.piutang_dagang,
    });

    await page.click('[data-testid="btn-simpan"]');

    // Verifikasi total konversi ke IDR
    // 100 USD × 15.500 + 500.000 IDR = 1.550.000 + 500.000 = 2.050.000
    await expect(page.locator('[data-testid="total-konversi-idr"]')).toContainText('2.050.000');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 10: Detail tidak balance ditolak
  // --------------------------------------------------------------------------
  test('@regression Skenario 10: Detail tidak balance ditolak', async ({ page }) => {
    await gotoKasBank(page);

    await fillHeader(page, {
      jenis: 'BKK',
      tanggal: TEST_DATA.tanggal,
    });

    // Setup detail dengan debit ≠ credit (1.000.000 vs 500.000)
    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '1000000',
      keterangan: 'Debit side',
      lawan: TEST_DATA.coa.piutang_dagang,
    });

    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '500000',
      keterangan: 'Credit side',
      lawan: TEST_DATA.coa.kas_idr, // self-posting simulasi
    });

    await page.click('[data-testid="btn-simpan"]');

    // Verifikasi error balance
    await expect(page.locator('[data-testid="toast-error"]')).toContainText(
      'Total debit tidak sama dengan total credit',
    );
  });

  // --------------------------------------------------------------------------
  // SKENARIO TAMBAHAN: Kurs valas belum di-setup
  // --------------------------------------------------------------------------
  test('@regression Skenario 11: Kurs valas belum di-setup muncul warning', async ({ page }) => {
    await gotoKasBank(page);

    // Pilih SGD di baris detail (Valas TEdit)
    await page.fill('[data-testid="detail-row"].last() [data-testid="input-valas"]', TEST_DATA.valas.sgd);

    // Warning dialog muncul
    await expect(page.locator('[data-testid="warning-kurs"]')).toBeVisible();
    await expect(page.locator('[data-testid="warning-kurs"]')).toContainText(
      'Kurs belum di-set',
    );

    // Pilih opsi "Ya, gunakan kurs lama"
    await page.click('[data-testid="btn-gunakan-kurs-lama"]');

    // Form lanjut normal
    await expect(page.locator('[data-testid="warning-kurs"]')).not.toBeVisible();
  });

  // --------------------------------------------------------------------------
  // SKENARIO TAMBAHAN: User tanpa akses COA lawan
  // --------------------------------------------------------------------------
  test('@regression Skenario 12: User tanpa akses COA lawan', async ({ page }) => {
    // Login sebagai user dengan akses COA terbatas
    await login(page, TEST_DATA.user.staffLimitedCoa);
    await gotoKasBank(page);

    await fillHeader(page, {
      jenis: 'BKK',
      tanggal: TEST_DATA.tanggal,
    });

    await addDetailRow(page, {
      palas: TEST_DATA.valas.idr,
      jumlah: '100000',
      keterangan: 'Test COA filter',
      // Tidak pilih lawan — akan buka combo
    });

    // Buka combo lawan
    const lawanCombo = page.locator('[data-testid="detail-row"]').last().locator('[data-testid="select-lawan"]');
    await lawanCombo.click();

    // Verifikasi opsi "Kas USD" tidak ada
    const options = await lawanCombo.locator('option').allTextContents();
    expect(options).not.toContain('Kas USD');
    expect(options).toContain('Kas IDR'); // Yang boleh diakses user

    // Coba force-select (jika ada bug)
    const kasUsdVisible = await lawanCombo.locator('option[value="1-1002"]').count();
    expect(kasUsdVisible).toBe(0);
  });
});

// ============================================================================
// Custom Matchers / Helpers untuk verifikasi jurnal
// ============================================================================

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveJurnalPosting(expected: { debit: string; credit: string; amount: number }): R;
    }
  }
}

expect.extend({
  async toHaveJurnalPosting(received: any, expected: any) {
    // Custom matcher: verifikasi jurnal via API
    // Asumsi: ada endpoint GET /api/jurnal/{nomor_bukti}
    const pass = received && received.debit === expected.debit && received.credit === expected.credit && received.amount === expected.amount;
    return {
      pass,
      message: () => `Expected jurnal ${pass ? 'not ' : ''}to match ${JSON.stringify(expected)}, got ${JSON.stringify(received)}`,
    };
  },
});
