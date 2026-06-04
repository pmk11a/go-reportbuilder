# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/login.spec.ts >> Authentication Flow >> should display login page and perform login
- Location: e2e/auth/login.spec.ts:4:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should display login page and perform login', async ({ page }) => {
  5  |     // Navigate to the login page
> 6  |     await page.goto('http://localhost:5173/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  7  | 
  8  |     // Wait for the skeleton loader to finish (assuming it disappears when page is ready)
  9  |     // In our implementation, the skeleton replaces the form content until isInitialized is true
  10 |     
  11 |     // Verify the page title (Helmet)
  12 |     await expect(page).toHaveTitle(/DAPEN/);
  13 | 
  14 |     // Verify the form elements are present using aria-labels or roles
  15 |     const submitButton = page.getByRole('button', { name: /Masuk/i });
  16 |     await expect(submitButton).toBeVisible();
  17 | 
  18 |     const usernameInput = page.getByPlaceholder('namapengguna');
  19 |     const passwordInput = page.getByPlaceholder('••••••••');
  20 |     
  21 |     await expect(usernameInput).toBeVisible();
  22 |     await expect(passwordInput).toBeVisible();
  23 | 
  24 |     // Fill the form (invalid credentials to test validation)
  25 |     await usernameInput.fill('wronguser');
  26 |     await passwordInput.fill('wrongpass');
  27 |     await submitButton.click();
  28 | 
  29 |     // Wait for toast notification or form message indicating failure
  30 |     // We expect a toast with destructive variant or a form message
  31 |     // Note: The specific error message might come from the API
  32 |     // We just verify that an error state is reached or API call is made.
  33 |   });
  34 | });
  35 | 
```