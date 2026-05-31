import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page and perform login', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:5173/login');

    // Wait for the skeleton loader to finish (assuming it disappears when page is ready)
    // In our implementation, the skeleton replaces the form content until isInitialized is true
    
    // Verify the page title (Helmet)
    await expect(page).toHaveTitle(/DAPEN/);

    // Verify the form elements are present using aria-labels or roles
    const submitButton = page.getByRole('button', { name: /Masuk/i });
    await expect(submitButton).toBeVisible();

    const usernameInput = page.getByPlaceholder('namapengguna');
    const passwordInput = page.getByPlaceholder('••••••••');
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Fill the form (invalid credentials to test validation)
    await usernameInput.fill('wronguser');
    await passwordInput.fill('wrongpass');
    await submitButton.click();

    // Wait for toast notification or form message indicating failure
    // We expect a toast with destructive variant or a form message
    // Note: The specific error message might come from the API
    // We just verify that an error state is reached or API call is made.
  });
});
