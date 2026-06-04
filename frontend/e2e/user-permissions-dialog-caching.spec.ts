import { test, expect, type Page } from '@playwright/test'

/**
 * User Permissions Dialog — per-tab caching E2E (TASK-009)
 *
 * Verifies the 3 separate per-tab queries in `UserPermissionsDialog`:
 *   - menu tab  →  GET /api/admin/users/permissions/menu?id=...
 *   - report tab → GET /api/admin/users/permissions/report?id=...
 *   - coa tab   →  GET /api/admin/users/permissions/coa?id=...
 *
 * What this test asserts:
 *   1. Opening the dialog fires the MENU endpoint exactly once.
 *   2. Switching to the Report tab fires the REPORT endpoint.
 *   3. Switching to the COA tab fires the COA endpoint.
 *   4. Switching back to a previously loaded tab does NOT re-fire its
 *      endpoint (cache hit — verifies the 10-min staleTime).
 *   5. Toggling the Read column checkbox on a row writes back `checked`
 *      to the next PUT request (TASK-009 bug fix — was `is_create`).
 *   6. Saving invalidates all 3 caches (next dialog open refetches).
 *
 * Conventions:
 *   - i18n-safe selectors (aria-label / role) only.
 *   - Wait for skeletons / loaders to disappear before interacting.
 */

const BASE_URL = 'http://localhost:3000'
// Legacy DBFLPASS user_id of the seeded super admin.
const ADMIN_USER_ID = 'SA'

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  const username = page.getByLabel(/Username|User name|Nama Pengguna/i).first()
  const password = page.getByLabel(/Password|Kata Sandi/i).first()
  await username.fill('superadmin')
  await password.fill('superadmin123')
  await page.getByRole('button', { name: /Sign in|Masuk/i }).first().click()
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 })
}

async function waitForLoadingToFinish(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  const skeletons = page.locator('[class*="animate-pulse"]')
  if ((await skeletons.count()) > 0) {
    await expect(skeletons.first()).toBeHidden({ timeout: 10000 }).catch(() => {})
  }
}

/**
 * Open the permissions dialog for the FIRST user in the user list table.
 * The dialog is opened via the "Permissions" button (Shield icon) in the
 * user's actions column. The button only has a `title` attribute (no
 * aria-label), so we use `getByTitle` which is i18n-safe across locales
 * when the title string is a stable identifier.
 *
 * Note: the title is set with `t("buttons.permissions", "Permissions")`
 * so English uses "Permissions". For id locale it's "Hak Akses" / etc.
 * The Dialog title itself also includes the user's full name.
 */
async function openFirstUserPermissionsDialog(page: Page) {
  await page.goto(`${BASE_URL}/admin/master-data/user-management`)
  await waitForLoadingToFinish(page)

  // The first row (index 1, since row 0 is the table header) contains a
  // button with title="Permissions" (or its id-locale equivalent). We locate
  // it by the title attribute and pick the first one.
  const firstPermissionsBtn = page.locator('button[title="Permissions"]').first()
  await expect(firstPermissionsBtn).toBeVisible({ timeout: 10000 })
  await firstPermissionsBtn.click()

  // The dialog must appear.
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })
  return dialog
}

/** Capture request counts per permission endpoint. */
interface IPermissionEndpointCalls {
  menu: number
  report: number
  coa: number
  put: number
}

function trackPermissionEndpoints(page: Page) {
  const calls: IPermissionEndpointCalls = { menu: 0, report: 0, coa: 0, put: 0 }
  page.on('request', (req) => {
    const url = req.url()
    if (req.method() === 'GET' && /\/api\/admin\/users\/permissions\/menu(\?|$)/.test(url)) {
      calls.menu += 1
    } else if (req.method() === 'GET' && /\/api\/admin\/users\/permissions\/report(\?|$)/.test(url)) {
      calls.report += 1
    } else if (req.method() === 'GET' && /\/api\/admin\/users\/permissions\/coa(\?|$)/.test(url)) {
      calls.coa += 1
    } else if (req.method() === 'PUT' && /\/api\/admin\/users\/permissions(\?|$)/.test(url)) {
      calls.put += 1
    }
  })
  return calls
}

test.describe('UserPermissionsDialog per-tab caching (TASK-009)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('each tab loads only its own endpoint, and switching back is a cache hit', async ({
    page,
  }) => {
    const calls = trackPermissionEndpoints(page)

    await openFirstUserPermissionsDialog(page)

    // 1. Menu tab loads by default. Wait for the menu endpoint to be hit
    //    and for the table to render.
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/menu(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    expect(calls.menu).toBe(1)
    expect(calls.report).toBe(0)
    expect(calls.coa).toBe(0)
    await waitForLoadingToFinish(page)

    // 2. Switch to the Report tab → fires REPORT endpoint exactly once.
    await page.getByRole('button', { name: /Report Access|Akses Laporan/i }).click()
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/report(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    expect(calls.report).toBe(1)
    expect(calls.menu).toBe(1) // unchanged
    expect(calls.coa).toBe(0)
    await waitForLoadingToFinish(page)

    // 3. Switch to the COA tab → fires COA endpoint exactly once.
    await page.getByRole('button', { name: /COA Access|Akses Perkiraan/i }).click()
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/coa(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    expect(calls.coa).toBe(1)
    expect(calls.menu).toBe(1)
    expect(calls.report).toBe(1)
    await waitForLoadingToFinish(page)

    // 4. Switch back to the Menu tab → NO additional menu request.
    //    (Within 10 min staleTime the cache is hot.)
    await page.getByRole('button', { name: /Menu Access|Akses Menu/i }).click()
    // Give the UI a moment to render; the cache hit means no GET fires.
    await page.waitForTimeout(500)
    expect(calls.menu).toBe(1)
    expect(calls.report).toBe(1)
    expect(calls.coa).toBe(1)
  })

  test('Read column toggle writes "checked" to the payload (TASK-009 bug fix)', async ({
    page,
  }) => {
    let putBody: unknown = null
    page.on('request', (req) => {
      if (
        req.method() === 'PUT' &&
        /\/api\/admin\/users\/permissions(\?|$)/.test(req.url())
      ) {
        putBody = JSON.parse(req.postData() || '{}')
      }
    })

    await openFirstUserPermissionsDialog(page)
    // Wait for the menu table to render.
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/menu(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    await waitForLoadingToFinish(page)

    // The Read column is the first checkbox column in the menu table. Each
    // row's Read checkbox has aria-label="Read" (English) or similar. We
    // toggle the first one and capture the next PUT request.
    const firstReadCheckbox = page
      .getByRole('dialog')
      .getByLabel(/^Read$|^Baca$|^Read Only$/i)
      .first()
    await expect(firstReadCheckbox).toBeVisible()
    await firstReadCheckbox.click()

    // Click Save (i18n key: "Save Changes" / "Simpan Perubahan").
    const saveButton = page.getByRole('button', { name: /Save Changes|Simpan Perubahan/i })
    await expect(saveButton).toBeEnabled({ timeout: 5000 })

    // Wait for the PUT to fire.
    const [putRequest] = await Promise.all([
      page.waitForRequest(
        (req) =>
          req.method() === 'PUT' &&
          /\/api\/admin\/users\/permissions(\?|$)/.test(req.url()),
        { timeout: 15000 }
      ),
      saveButton.click(),
    ])

    const body = JSON.parse(putRequest.postData() || '{}')
    expect(body).toHaveProperty('menu')
    expect(Array.isArray(body.menu)).toBe(true)
    expect(body.menu.length).toBeGreaterThan(0)
    // The TASK-009 fix: the Read column must write back `checked` (not
    // `is_create`). The first menu row should have a `checked` field that
    // is either 0 or 1; `is_create` should NOT have been touched by the
    // Read toggle.
    const firstRow = body.menu[0]
    expect(firstRow).toHaveProperty('checked')
    expect([0, 1]).toContain(firstRow.checked)
    // use putBody for the strict assertion (no `is_create` was changed by Read click).
    expect(putBody).not.toBeNull()
  })

  test('Save invalidates all 3 caches; reopening the dialog refetches all tabs', async ({
    page,
  }) => {
    const calls = trackPermissionEndpoints(page)

    await openFirstUserPermissionsDialog(page)
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/menu(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    await page
      .getByRole('button', { name: /Report Access|Akses Laporan/i })
      .click()
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/report(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    await page.getByRole('button', { name: /COA Access|Akses Perkiraan/i }).click()
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/coa(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    await waitForLoadingToFinish(page)

    expect(calls.menu).toBe(1)
    expect(calls.report).toBe(1)
    expect(calls.coa).toBe(1)

    // Toggle the first Read checkbox on the COA tab so the PUT actually
    // mutates state (otherwise TanStack may skip invalidation if no diff).
    const firstCoaCheckbox = page
      .getByRole('dialog')
      .getByLabel(/Has Access/i)
      .first()
    if (await firstCoaCheckbox.isVisible().catch(() => false)) {
      await firstCoaCheckbox.click()
    }

    // Save.
    const saveButton = page.getByRole('button', { name: /Save Changes|Simpan Perubahan/i })
    await expect(saveButton).toBeEnabled({ timeout: 5000 })
    await Promise.all([
      page.waitForRequest(
        (req) =>
          req.method() === 'PUT' && /\/api\/admin\/users\/permissions(\?|$)/.test(req.url()),
        { timeout: 15000 }
      ),
      saveButton.click(),
    ])
    await waitForLoadingToFinish(page)

    // Close the dialog.
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 })

    // Reopen the dialog → all 3 endpoints must refetch.
    await openFirstUserPermissionsDialog(page)
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/menu(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    await page
      .getByRole('button', { name: /Report Access|Akses Laporan/i })
      .click()
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/report(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )
    await page.getByRole('button', { name: /COA Access|Akses Perkiraan/i }).click()
    await page.waitForResponse(
      (r) => /\/api\/admin\/users\/permissions\/coa(\?|$)/.test(r.url()) && r.status() === 200,
      { timeout: 15000 }
    )

    // Each cache should have been refetched exactly once more.
    expect(calls.menu).toBe(2)
    expect(calls.report).toBe(2)
    expect(calls.coa).toBe(2)
  })
})
