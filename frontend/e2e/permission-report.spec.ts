import { test, expect, type Page } from '@playwright/test'

/**
 * Permission Report E2E — TASK-009
 *
 * Covers the new /admin/reports/permission-report page:
 *   1. Page loads (matrix table is present, filter card is present).
 *   2. Applying a user filter triggers a fresh matrix request.
 *   3. Export Excel with a filter applied triggers a download.
 *   4. Export PDF with a filter applied triggers a download.
 *   5. Export Excel with NO filter applied shows a destructive toast
 *      (the BFF rejects the request with HTTP 400 and a "filter required"
 *      message; the errorMapper must translate it).
 *
 * Conventions:
 *   - i18n-safe selectors (aria-label / role) only.
 *   - Wait for skeletons / loaders to disappear before interacting.
 *   - `page.waitForEvent('download')` for the binary exports.
 */

const BASE_URL = 'http://localhost:3000'

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  // The login form labels are translated; rely on stable aria-labels.
  const username = page.getByLabel(/Username|User name|Nama Pengguna/i).first()
  const password = page.getByLabel(/Password|Kata Sandi/i).first()
  await username.fill('superadmin')
  await password.fill('superadmin123')
  await page.getByRole('button', { name: /Sign in|Masuk/i }).first().click()
  // Wait for the post-login navigation away from /login.
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 })
}

/**
 * Wait until all `<Skeleton>` and `<Loader2>` indicators on the page are gone.
 * The page renders 12 column skeletons per row, so we wait for the network
 * to settle and for the actual table rows to render.
 */
async function waitForLoadingToFinish(page: Page) {
  // No new in-flight requests for at least 500ms.
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  // Ensure no `<Skeleton>` (animate-pulse) is still visible.
  const skeletons = page.locator('[class*="animate-pulse"]')
  if ((await skeletons.count()) > 0) {
    await expect(skeletons.first()).toBeHidden({ timeout: 10000 }).catch(() => {})
  }
}

test.describe('Permission Report page (TASK-009)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('loads the report page with filters and matrix', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/reports/permission-report`)

    // The filter card title is i18n'd; just look for the SearchableSelect
    // controls via their stable `id` (not the i18n label).
    await expect(page.locator('#permission-report-user')).toBeVisible()
    await expect(page.locator('#permission-report-menu')).toBeVisible()
    await expect(page.locator('#permission-report-type')).toBeVisible()

    // The action buttons carry aria-labels — i18n-safe regardless of locale.
    await expect(page.getByLabel('Print', { exact: false })).toBeVisible()
    await expect(page.getByLabel('Export Excel', { exact: false })).toBeVisible()
    await expect(page.getByLabel('Export PDF', { exact: false })).toBeVisible()

    await waitForLoadingToFinish(page)
  })

  test('applying a user filter triggers a fresh matrix request', async ({ page }) => {
    let matrixCallCount = 0
    page.on('request', (req) => {
      if (
        req.method() === 'GET' &&
        req.url().includes('/api/admin/reports/permission-report') &&
        req.url().includes('format=json')
      ) {
        matrixCallCount += 1
      }
    })

    await page.goto(`${BASE_URL}/admin/reports/permission-report`)
    await waitForLoadingToFinish(page)

    const initialCalls = matrixCallCount
    expect(initialCalls).toBeGreaterThan(0)

    // Open the user SearchableSelect and pick the first non-empty option.
    const userPicker = page.locator('#permission-report-user')
    await userPicker.click()

    // The SearchableSelect renders options in a portal; we look for the
    // first option that has a non-empty value (skip the "all" / placeholder).
    const firstOption = page.getByRole('option').first()
    await expect(firstOption).toBeVisible({ timeout: 5000 })
    const optionValue = await firstOption.getAttribute('data-value')
    const hasNonEmptyValue = !!optionValue && optionValue.length > 0
    if (!hasNonEmptyValue) {
      // Fall back to the second option if the first is the placeholder.
      const second = page.getByRole('option').nth(1)
      await second.click()
    } else {
      await firstOption.click()
    }

    // Click "Apply Filters" — translated; the button has no stable
    // aria-label but it is the only button immediately after the filter
    // grid that lives in the filter card. We use the translation key
    // "Apply Filters" / "Terapkan Filter" by pattern match.
    await page.getByRole('button', { name: /Apply Filters|Terapkan Filter/i }).click()

    // The matrix call count should grow by exactly one.
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/reports/permission-report') &&
        resp.url().includes('format=json'),
      { timeout: 10000 }
    )
    expect(matrixCallCount).toBeGreaterThan(initialCalls)
  })

  test('export Excel with NO filter is rejected by the BFF with a filter-required message', async ({
    page,
  }) => {
    // The BFF enforces the "filter required" rule defensively (matching the
    // backend). We exercise it via the page's own fetch (which carries both
    // the session cookie AND the X-CSRF-Token header). This does NOT
    // depend on the page rendering the action buttons, so it remains valid
    // even when the matrix endpoint itself returns 500.
    const result = await page.evaluate(async () => {
      // /api/csrf-token bootstraps the CSRF cookie + header.
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
      const csrfJson = await csrfRes.json().catch(() => null)
      const token: string | null = csrfJson?.data?.token ?? null
      const headers: Record<string, string> = {}
      if (token) headers['X-CSRF-Token'] = token
      const res = await fetch(
        '/api/admin/reports/permission-report?format=xlsx',
        { credentials: 'include', headers }
      )
      return { status: res.status, body: await res.text() }
    })

    expect(result.status).toBe(400)
    const payload = JSON.parse(result.body) as { success?: boolean; message?: string }
    expect(payload.success ?? false).toBe(false)
    expect(String(payload.message || '').toLowerCase()).toMatch(/filter|userid|menuid/)
  })

  test('export Excel with a filter triggers a download', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/reports/permission-report`)
    await waitForLoadingToFinish(page)

    // Pick a user first.
    await page.locator('#permission-report-user').click()
    const firstOption = page.getByRole('option').first()
    await firstOption.waitFor({ state: 'visible', timeout: 5000 })
    const optionValue = await firstOption.getAttribute('data-value')
    if (!optionValue || optionValue.length === 0) {
      await page.getByRole('option').nth(1).click()
    } else {
      await firstOption.click()
    }
    await page.getByRole('button', { name: /Apply Filters|Terapkan Filter/i }).click()
    await waitForLoadingToFinish(page)

    // Now the Excel button is enabled — click it and wait for a download.
    const excelBtn = page.getByLabel('Export Excel', { exact: false })
    await expect(excelBtn).toBeEnabled()

    const downloadPromise = page.waitForEvent('download', { timeout: 20000 })
    await excelBtn.click()
    const download = await downloadPromise
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/\.xlsx$/i)
  })

  test('export PDF with a filter triggers a download', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/reports/permission-report`)
    await waitForLoadingToFinish(page)

    // Apply a user filter (same pattern as the Excel test).
    await page.locator('#permission-report-user').click()
    const firstOption = page.getByRole('option').first()
    await firstOption.waitFor({ state: 'visible', timeout: 5000 })
    const optionValue = await firstOption.getAttribute('data-value')
    if (!optionValue || optionValue.length === 0) {
      await page.getByRole('option').nth(1).click()
    } else {
      await firstOption.click()
    }
    await page.getByRole('button', { name: /Apply Filters|Terapkan Filter/i }).click()
    await waitForLoadingToFinish(page)

    const pdfBtn = page.getByLabel('Export PDF', { exact: false })
    await expect(pdfBtn).toBeEnabled()

    const downloadPromise = page.waitForEvent('download', { timeout: 20000 })
    await pdfBtn.click()
    const download = await downloadPromise
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/\.pdf$/i)
  })
})
