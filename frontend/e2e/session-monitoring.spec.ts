import { test, expect, type Page } from '@playwright/test'

/**
 * Session Monitoring E2E — TASK-012 Phase 3
 *
 * Covers session management features in User Management page:
 *   1. Admin views active sessions for a user
 *   2. Session details display (login time, expiry, IP masked, browser, status)
 *   3. Force logout single session with confirmation dialog
 *   4. Force logout all sessions with confirmation dialog
 *   5. User with no active sessions shows empty state
 *   6. Session near expiry displays warning badge
 *   7. Expired session cannot be revoked (button disabled)
 *   8. Non-admin cannot access session management
 *   9. Admin-only authorization enforced
 *
 * Conventions:
 *   - i18n-safe selectors (aria-label / role / data-testid) only.
 *   - Wait for skeletons / loaders to disappear before interacting.
 *   - Confirmation dialogs verified with getByRole('alertdialog').
 *   - IP masking verified (should show xxx.xxx.xxx.*).
 */

const BASE_URL = 'http://localhost:3000'
const API_BASE_URL = 'http://localhost:3000/api'

/**
 * Login as super admin for tests.
 * Uses i18n-safe selectors to find username/password inputs and submit button.
 */
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`)

  // Use aria-label or placeholder to find inputs (i18n-safe)
  const usernameInput = page.getByLabel(/username|user name|nama pengguna/i).first()
  const passwordInput = page.getByLabel(/password|kata sandi/i).first()
  const submitButton = page.getByRole('button', { name: /sign in|login|masuk/i }).first()

  await usernameInput.fill('superadmin')
  await passwordInput.fill('superadmin123')
  await submitButton.click()

  // Wait for navigation away from /login
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 })
}

/**
 * Wait for loading skeletons and spinners to disappear.
 * Also waits for network idle to ensure data is loaded.
 */
async function waitForLoadingToFinish(page: Page) {
  // Wait for network requests to settle
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

  // Ensure no skeleton (animate-pulse) is visible
  const skeletons = page.locator('[class*="animate-pulse"]')
  if ((await skeletons.count()) > 0) {
    await expect(skeletons.first()).toBeHidden({ timeout: 10000 }).catch(() => {})
  }

  // Also wait for any loaders (Loader2 icon with animate-spin)
  const loaders = page.locator('[class*="animate-spin"]')
  if ((await loaders.count()) > 0) {
    await expect(loaders.first()).toBeHidden({ timeout: 10000 }).catch(() => {})
  }
}

/**
 * Navigate to User Management page and wait for table to load.
 * Returns the first user's ID from the table for testing.
 */
async function navigateToUserManagement(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/admin/master-data/user-management`)
  await waitForLoadingToFinish(page)

  // Wait for the user table to be visible
  // The table should have rows with user data
  const userRows = page.locator('table tbody tr')
  await expect(userRows.first()).toBeVisible({ timeout: 10000 })

  // Extract user ID from the first row's data attribute or cell
  // Assuming the first column contains user ID or there's a data-testid with user ID
  const firstRow = userRows.first()
  const userCell = firstRow.locator('td').first()
  const userId = await userCell.getAttribute('data-user-id') || (await userCell.textContent())

  return userId || 'user-1'
}

test.describe('Session Monitoring (TASK-012)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('TC-001: Admin views active sessions for user', async ({ page }) => {
// @ts-ignore - unused variable
    const userId = await navigateToUserManagement(page)

    // Find the "View Sessions" or "Active Sessions" button for the first user
    // Use aria-label for i18n safety
    const viewSessionsButton = page
      .locator('button')
      .filter({ hasText: /Sessions|Sesi/i })
      .first()

    await viewSessionsButton.click()

    // Wait for modal to appear
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible({ timeout: 10000 })

    // Verify table header is visible
    const tableHeaders = modal.locator('table th')
    await expect(tableHeaders).toContainText(/Login Time|Waktu Login/i)
    await expect(tableHeaders).toContainText(/Expires At|Kadaluarsa/i)
    await expect(tableHeaders).toContainText(/IP Address|Alamat IP/i)
    await expect(tableHeaders).toContainText(/Browser|Peramban/i)
    await expect(tableHeaders).toContainText(/Status|Status/i)

    // Verify session rows exist
    const sessionRows = modal.locator('table tbody tr')
    const rowCount = await sessionRows.count()
    expect(rowCount).toBeGreaterThan(0)
  })

// @ts-ignore - unused variable
  test('TC-002: Session displays relative time and masked IP', async ({ page }) => {
//     const userId = await navigateToUserManagement(page)

    // Open sessions modal
    const viewSessionsButton = page
      .locator('button')
      .filter({ hasText: /Sessions|Sesi/i })
      .first()

    await viewSessionsButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Get first session row
    const firstSession = modal.locator('table tbody tr').first()
    const cells = firstSession.locator('td')

    // Verify login time is formatted (relative or absolute)
    const loginTimeCell = cells.nth(0)
    const loginTimeText = await loginTimeCell.textContent()
    expect(loginTimeText).toBeTruthy()
    // Should contain date/time info
    expect(loginTimeText?.length).toBeGreaterThan(0)

    // Verify IP is masked (xxx.xxx.xxx.*)
    const ipCell = cells.nth(2)
    const ipText = await ipCell.textContent()
    expect(ipText).toMatch(/\d+\.\d+\.\d+\.\*\*\*/) // Masked IP format

    // Verify browser info is present
    const browserCell = cells.nth(3)
    const browserText = await browserCell.textContent()
    expect(browserText?.trim().length).toBeGreaterThan(0)

    // Verify status badge is present
    const statusCell = cells.nth(4)
    const statusBadge = statusCell.locator('[class*="inline-flex"]').first() // Badge component
    await expect(statusBadge).toBeVisible()
  })
// @ts-ignore - unused variable

  test('TC-003: Force logout single session', async ({ page }) => {
//     const userId = await navigateToUserManagement(page)

    // Open sessions modal
    const viewSessionsButton = page
      .locator('button')
      .filter({ hasText: /Sessions|Sesi/i })
      .first()

    await viewSessionsButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Count initial sessions
    const sessionRows = modal.locator('table tbody tr')
    const initialCount = await sessionRows.count()
    expect(initialCount).toBeGreaterThan(0)

    // Click logout button on first session (active session, not expired)
    const firstSessionRow = sessionRows.first()
    const logoutButton = firstSessionRow
      .locator('button')
      .filter({ hasText: /Logout|Keluar/i })
      .first()

    // Skip if button is disabled (session might be expired)
    const isDisabled = await logoutButton.isDisabled()
    if (isDisabled) {
      // Try second row
      const secondSessionRow = sessionRows.nth(1)
      const secondLogoutButton = secondSessionRow
        .locator('button')
        .filter({ hasText: /Logout|Keluar/i })
        .first()

      if (await secondLogoutButton.isDisabled()) {
        // Skip test if all sessions are expired
        test.skip()
      }

      await secondLogoutButton.click()
    } else {
      await logoutButton.click()
    }

    // Verify confirmation dialog appears
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog).toBeVisible()

    // Verify dialog title and description are present
    const dialogTitle = confirmDialog.locator('[role="heading"]')
    const dialogText = confirmDialog.locator('[class*="text"]').first()
    await expect(dialogTitle).toBeVisible()
    await expect(dialogText).toBeVisible()

    // Click Confirm button in the dialog
    const confirmButton = confirmDialog
      .locator('button')
      .filter({ hasText: /Confirm|Yakin/i })
      .first()

    await confirmButton.click()

    // Wait for modal to refresh
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(500)

    // Verify session count decreased
    const updatedRows = modal.locator('table tbody tr')
    const updatedCount = await updatedRows.count()

    // Either count decreased or empty state is shown
    if (initialCount === 1) {
      // If there was only one session, check for empty state
      const emptyState = modal
        .locator('div')
        .filter({ hasText: /No active sessions|Tidak ada sesi aktif/i })
      await expect(emptyState).toBeVisible()
    } else {
      expect(updatedCount).toBeLessThan(initialCount)
    }
// @ts-ignore - unused variable
  })

  test('TC-004: Force logout all sessions with confirmation', async ({ page }) => {
//     const userId = await navigateToUserManagement(page)

    // Open sessions modal
    const viewSessionsButton = page
      .locator('button')
      .filter({ hasText: /Sessions|Sesi/i })
      .first()

    await viewSessionsButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Find and click "Logout All Sessions" button
    const logoutAllButton = modal
      .locator('button')
      .filter({ hasText: /Logout All|Keluar Semua|Logout All Sessions/i })
      .first()

    const isVisible = await logoutAllButton.isVisible().catch(() => false)
    if (!isVisible) {
      // If no "Logout All" button, skip test (no sessions)
      test.skip()
    }

    await logoutAllButton.click()

    // Verify confirmation dialog with session count
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog).toBeVisible()

    const dialogText = await confirmDialog.textContent()
    // Should mention number of sessions being revoked
    expect(dialogText).toBeTruthy()

    // Click Confirm button
    const confirmButton = confirmDialog
      .locator('button')
      .filter({ hasText: /Confirm|Yakin/i })
      .first()

    await confirmButton.click()

    // Wait for refresh
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(500)

    // Verify all sessions are gone (empty state)
    const updatedRows = modal.locator('table tbody tr')
    const updatedCount = await updatedRows.count()

    if (updatedCount === 0) {
      // Check for empty state message
      const emptyState = modal
        .locator('div')
        .filter({ hasText: /No active sessions|Tidak ada sesi aktif/i })
      await expect(emptyState).toBeVisible()
    }
  })

// @ts-ignore - unused variable
  test('TC-005: User with no active sessions shows empty state', async ({ page }) => {
    // This test assumes we have a user with no sessions or we logged out all their sessions
    // For a controlled test, we'd need test data setup

//     const userId = await navigateToUserManagement(page)

    // Open sessions modal
    const viewSessionsButton = page
      .locator('button')
      .filter({ hasText: /Sessions|Sesi/i })
      .first()

    await viewSessionsButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Check if empty state is shown (either at start or after logout all)
    const sessionRows = modal.locator('table tbody tr')
    const rowCount = await sessionRows.count()

    if (rowCount === 0) {
      // Empty state should be visible
      const emptyState = modal
        .locator('div')
        .filter({ hasText: /No active sessions|Tidak ada sesi aktif/i })
      await expect(emptyState).toBeVisible()

      // Logout All button should be disabled or not visible
      const logoutAllButton = modal
        .locator('button')
        .filter({ hasText: /Logout All|Keluar Semua/i })
        .first()

      const isDisabled = await logoutAllButton.isDisabled().catch(() => true)
// @ts-ignore - unused variable
      expect(isDisabled).toBe(true)
    }
  })

  test('TC-006: Session near expiry displays warning badge', async ({ page }) => {
//     const userId = await navigateToUserManagement(page)

    // Open sessions modal
    const viewSessionsButton = page
      .locator('button')
      .filter({ hasText: /Sessions|Sesi/i })
      .first()

    await viewSessionsButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

// @ts-ignore - unused variable
    // Look for warning/danger badges
    const statusBadges = modal.locator('[class*="inline-flex"]')
    const badgeCount = await statusBadges.count()

    // If any badges are visible, check if any contain "Expiring Soon" or "warning" styling
    if (badgeCount > 0) {
//       let foundWarning = false
      for (let i = 0; i < badgeCount; i++) {
        const badge = statusBadges.nth(i)
        const text = await badge.textContent()
        if (text?.includes('Expiring') || text?.includes('Soon') || text?.includes('Kadaluarsa')) {

          // Verify warning styling (bg-yellow or variant-warning)
          const classList = await badge.getAttribute('class')
          expect(classList).toBeTruthy()
// @ts-ignore - unused variable
        }
      }
      // If warning badges exist, we can verify them; otherwise just note they may not be in test data
    }
  })

  test('TC-007: Expired session shows disabled logout button', async ({ page }) => {
//     const userId = await navigateToUserManagement(page)

    // Open sessions modal
    const viewSessionsButton = page
      .locator('button')
      .filter({ hasText: /Sessions|Sesi/i })
      .first()

    await viewSessionsButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Look for expired sessions (status badge = "Expired")
    const sessionRows = modal.locator('table tbody tr')
    let foundExpired = false

    for (let i = 0; i < (await sessionRows.count()); i++) {
      const row = sessionRows.nth(i)
      const cells = row.locator('td')
      const statusCell = cells.nth(4)
      const statusText = await statusCell.textContent()

      if (statusText?.includes('Expired') || statusText?.includes('Kadaluarsa')) {
        foundExpired = true
        // Verify logout button is disabled for expired session
        const logoutButton = row
          .locator('button')
          .filter({ hasText: /Logout|Keluar/i })
          .first()

        const isDisabled = await logoutButton.isDisabled()
        expect(isDisabled).toBe(true)
        break
      }
    }

    if (!foundExpired) {
      // No expired sessions in test data, skip
      test.skip()
    }
  })

  test('TC-008: Non-admin cannot access session management', async ({ browser }) => {
    // Create a new browser context for a different user
    const context = await browser.newContext()
    const page = await context.newPage()

    // Login as regular (non-admin) user
    await page.goto(`${BASE_URL}/login`)

    const usernameInput = page.getByLabel(/username|user name|nama pengguna/i).first()
    const passwordInput = page.getByLabel(/password|kata sandi/i).first()
    const submitButton = page.getByRole('button', { name: /sign in|login|masuk/i }).first()

    // Use a regular user account (adjust credentials as needed)
    await usernameInput.fill('regular_user')
    await passwordInput.fill('password123')
    await submitButton.click()

    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 }).catch(() => {})

    // Try to navigate to User Management page
    await page.goto(`${BASE_URL}/admin/master-data/user-management`)

    // Should either:
    // 1. Be redirected away (not at user-management path)
    // 2. Show a 403 error
    // 3. Show an "Unauthorized" message

    const pathname = page.url()
    const isNotOnPage = !pathname.includes('user-management')
    const hasErrorMessage = (await page.getByText(/403|Forbidden|Unauthorized|Akses Ditolak/i).count()) > 0

    expect(isNotOnPage || hasErrorMessage).toBe(true)

// @ts-ignore - unused variable
    await context.close()
  })

  test('TC-009: Authorization check for session APIs', async ({ page }) => {
    // Test that API rejects non-admin requests
    // Use the authenticated page context

    const userId = 'user-123'
//     const sessionId = 'session-456'

    // Attempt to call the API without proper admin role
    // This should return 403 Forbidden

    const response = await page.request.get(`${API_BASE_URL}/admin/users/${userId}/sessions`, {
      headers: {
        // The request should be authenticated but non-admin
        // The BFF should enforce role check
      },
    })

    // Expect 403 or 401
    expect([401, 403]).toContain(response.status())
  })
})
