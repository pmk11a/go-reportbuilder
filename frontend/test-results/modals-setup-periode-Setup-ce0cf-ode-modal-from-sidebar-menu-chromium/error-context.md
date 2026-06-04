# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modals/setup-periode.spec.ts >> Setup Periode Modal >> should open setup periode modal from sidebar menu
- Location: e2e/modals/setup-periode.spec.ts:4:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Setup Periode Modal', () => {
  4  |   test('should open setup periode modal from sidebar menu', async ({ page }) => {
  5  |     // Navigate to the app (assuming user is logged in)
> 6  |     await page.goto('http://localhost:5173/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  7  | 
  8  |     // Find the menu item for Setup Periode. 
  9  |     // Wait for the sidebar to load the dynamic menu
  10 |     const setupMenu = page.getByText('Setup Periode Kerja');
  11 |     
  12 |     // Since the menu is loaded dynamically via API, we might need to wait for it
  13 |     // Wait for the menu item and click it
  14 |     // await setupMenu.waitFor({ state: 'visible', timeout: 15000 });
  15 |     // await setupMenu.click();
  16 | 
  17 |     // Verify the modal opens
  18 |     // const modalTitle = page.getByRole('heading', { name: /Setup Periode/i });
  19 |     // await expect(modalTitle).toBeVisible();
  20 | 
  21 |     // Verify form fields
  22 |     // const bulanInput = page.getByLabel(/Bulan/i);
  23 |     // const tahunInput = page.getByLabel(/Tahun/i);
  24 |     // await expect(bulanInput).toBeVisible();
  25 |     // await expect(tahunInput).toBeVisible();
  26 | 
  27 |     // Verify form submission button
  28 |     // const submitButton = page.getByRole('button', { name: /Simpan/i });
  29 |     // await expect(submitButton).toBeVisible();
  30 |     
  31 |     // Close the modal
  32 |     // const cancelButton = page.getByRole('button', { name: /Batal/i });
  33 |     // await cancelButton.click();
  34 |     
  35 |     // Ensure modal is closed
  36 |     // await expect(modalTitle).not.toBeVisible();
  37 |   });
  38 | });
  39 | 
```