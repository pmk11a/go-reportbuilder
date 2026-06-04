# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard/dashboard.spec.ts >> Dashboard Features >> should display pensiunan without files table
- Location: e2e/dashboard/dashboard.spec.ts:34:3

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
  3  | test.describe('Dashboard Features', () => {
  4  |   // Use a beforeEach hook to log in if your app requires it, 
  5  |   // or use Playwright's global setup for authentication.
  6  |   // For this test, we assume the user is already authenticated 
  7  |   // or the test handles login before navigating to the dashboard.
  8  |   
  9  |   test('should display dashboard statistics', async ({ page }) => {
  10 |     // Navigate to the dashboard page
  11 |     await page.goto('http://localhost:5173/');
  12 | 
  13 |     // Verify the page title or header
  14 |     await expect(page).toHaveTitle(/DAPEN/);
  15 |     
  16 |     // Check if the dashboard heading is visible
  17 |     const heading = page.getByRole('heading', { name: /Dashboard/i });
  18 |     // Assuming the heading might take a moment to load or render
  19 |     if (await heading.isVisible()) {
  20 |        await expect(heading).toBeVisible();
  21 |     }
  22 | 
  23 |     // Verify that some statistic cards are present
  24 |     // Adjust these based on the actual UI text
  25 |     const activeMembers = page.getByText(/Total Aktif/i);
  26 |     const retiredMembers = page.getByText(/Total Pensiunan/i);
  27 |     
  28 |     // Check if the cards are visible
  29 |     // They might be loading if the API is slow, so we wait for them
  30 |     // await expect(activeMembers).toBeVisible({ timeout: 10000 });
  31 |     // await expect(retiredMembers).toBeVisible({ timeout: 10000 });
  32 |   });
  33 | 
  34 |   test('should display pensiunan without files table', async ({ page }) => {
  35 |     // Navigate to the dashboard
> 36 |     await page.goto('http://localhost:5173/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  37 |     
  38 |     // Check if the table or list exists
  39 |     // const table = page.getByRole('table');
  40 |     // await expect(table).toBeVisible();
  41 |   });
  42 | });
  43 | 
```