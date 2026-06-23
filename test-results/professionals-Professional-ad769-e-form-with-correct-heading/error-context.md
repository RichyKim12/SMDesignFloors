# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: professionals.spec.js >> Professionals Form — Page load >> renders the form with correct heading
- Location: tests\professionals.spec.js:51:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /join our network/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /join our network/i })

```

```yaml
- navigation:
  - link "SM Design Floors logo S . M Design Floors":
    - /url: /
    - img "SM Design Floors logo"
    - text: S . M Design Floors
  - list:
    - listitem:
      - link "About Us":
        - /url: /#services
    - listitem:
      - link "ProServices":
        - /url: /proservices
    - listitem:
      - link "Contact":
        - /url: /#contact
    - listitem:
      - button "Contractor Login"
- text: Monday — Closed · Opens Tomorrow at 10:00 AM
- button "✕"
- paragraph: SM Design Floors
- heading "Sign In" [level=2]
- text: Email
- textbox "yourname@example.com"
- text: Password
- textbox "••••••••"
- button "Sign In"
- paragraph:
  - text: Don't have an account?
  - button "Create one here"
- heading "404" [level=1]
- paragraph: This page doesn't exist.
- button "Go Home"
- text: Our Trusted Brands
- img "Brand 1"
- img "Brand 2"
- img "Brand 3"
- img "Brand 4"
- img "Brand 5"
- img "Brand 6"
- img "Brand 7"
- img "Brand 8"
- img "Brand 9"
- img "Brand 10"
- img "Brand 11"
- img "Brand 12"
- img "Brand 13"
- img "Brand 14"
- img "Brand 15"
- img "Brand 16"
- img "Brand 17"
- img "Brand 18"
- img "Brand 19"
- img "Brand 20"
- img "Brand 21"
- img "Brand 22"
- img "Brand 23"
- img "Brand 24"
- contentinfo:
  - text: SM Design Floors
  - paragraph: © 2026 SM Design Floors. All rights reserved.
```

# Test source

```ts
  1   | /**
  2   |  * professionals.spec.js
  3   |  * ─────────────────────────────────────────────────────────────
  4   |  * Playwright tests for the Professionals registration form.
  5   |  *
  6   |  * Run:
  7   |  *   npx playwright test professionals.spec.js
  8   |  *
  9   |  * Prerequisites:
  10  |  *   npm install -D @playwright/test
  11  |  *   npx playwright install
  12  |  *
  13  |  * The tests assume the dev server is running on http://localhost:5173
  14  |  * and the page with the form is at /professionals.
  15  |  * Adjust BASE_URL and FORM_PATH as needed.
  16  |  */
  17  | 
  18  | import { test, expect } from '@playwright/test';
  19  | 
  20  | const BASE_URL  = 'http://localhost:5173';
  21  | const FORM_PATH = '/professionals';
  22  | const FORM_URL  = `${BASE_URL}${FORM_PATH}`;
  23  | 
  24  | // ─── Helpers ──────────────────────────────────────────────────
  25  | 
  26  | /** Fill required fields with valid data */
  27  | async function fillValidForm(page, overrides = {}) {
  28  |   const values = {
  29  |     name:     'Jane Smith',
  30  |     email:    `test+${Date.now()}@example.com`,
  31  |     password: 'SecurePass1',
  32  |     confirm:  'SecurePass1',
  33  |     ...overrides,
  34  |   };
  35  | 
  36  |   await page.getByLabel(/full name/i).fill(values.name);
  37  |   await page.getByLabel(/email address/i).fill(values.email);
  38  | 
  39  |   // Select at least one profession checkbox
  40  |   await page.getByLabel('Hardwood Flooring').check();
  41  | 
  42  |   await page.getByLabel(/^password/i).fill(values.password);
  43  |   await page.getByLabel(/confirm password/i).fill(values.confirm);
  44  | 
  45  |   return values;
  46  | }
  47  | 
  48  | // ─── Test suites ──────────────────────────────────────────────
  49  | 
  50  | test.describe('Professionals Form — Page load', () => {
  51  |   test('renders the form with correct heading', async ({ page }) => {
  52  |     await page.goto(FORM_URL);
> 53  |     await expect(page.getByRole('heading', { name: /join our network/i })).toBeVisible();
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  54  |   });
  55  | 
  56  |   test('has no detectable WCAG violations (basic landmark check)', async ({ page }) => {
  57  |     await page.goto(FORM_URL);
  58  |     // Each fieldset must have a legend (ADA grouping)
  59  |     const fieldsets = page.locator('fieldset');
  60  |     const count     = await fieldsets.count();
  61  |     expect(count).toBeGreaterThan(0);
  62  |     for (let i = 0; i < count; i++) {
  63  |       await expect(fieldsets.nth(i).locator('legend')).toBeVisible();
  64  |     }
  65  |   });
  66  | 
  67  |   test('all form inputs have associated labels', async ({ page }) => {
  68  |     await page.goto(FORM_URL);
  69  |     const inputs = page.locator('input:not([type="hidden"]):not([type="file"]):not([style*="display: none"])');
  70  |     const n      = await inputs.count();
  71  |     for (let i = 0; i < n; i++) {
  72  |       const inp = inputs.nth(i);
  73  |       const id  = await inp.getAttribute('id');
  74  |       if (id) {
  75  |         // label[for=id] must exist OR input is inside a label
  76  |         const labelFor   = page.locator(`label[for="${id}"]`);
  77  |         const hasLabelFor = await labelFor.count() > 0;
  78  |         expect(hasLabelFor, `Input #${id} must have a <label for="...">`).toBe(true);
  79  |       }
  80  |     }
  81  |   });
  82  | });
  83  | 
  84  | // ─── Validation ───────────────────────────────────────────────
  85  | 
  86  | test.describe('Professionals Form — Validation', () => {
  87  |   test.beforeEach(async ({ page }) => {
  88  |     await page.goto(FORM_URL);
  89  |   });
  90  | 
  91  |   test('shows error when submitted with no fields filled', async ({ page }) => {
  92  |     await page.getByRole('button', { name: /create account/i }).click();
  93  |     await expect(page.getByRole('alert').first()).toBeVisible();
  94  |   });
  95  | 
  96  |   test('shows error for invalid email', async ({ page }) => {
  97  |     await page.getByLabel(/full name/i).fill('Jane Smith');
  98  |     await page.getByLabel(/email address/i).fill('not-an-email');
  99  |     await page.getByLabel('Hardwood Flooring').check();
  100 |     await page.getByLabel(/^password/i).fill('SecurePass1');
  101 |     await page.getByLabel(/confirm password/i).fill('SecurePass1');
  102 |     await page.getByRole('button', { name: /create account/i }).click();
  103 |     await expect(page.getByRole('alert').first()).toContainText(/valid email/i);
  104 |   });
  105 | 
  106 |   test('shows error when passwords do not match', async ({ page }) => {
  107 |     await fillValidForm(page, { password: 'SecurePass1', confirm: 'Different1' });
  108 |     await page.getByRole('button', { name: /create account/i }).click();
  109 |     await expect(page.getByRole('alert').first()).toContainText(/do not match/i);
  110 |   });
  111 | 
  112 |   test('shows error for password shorter than 8 characters', async ({ page }) => {
  113 |     await fillValidForm(page, { password: 'Ab1', confirm: 'Ab1' });
  114 |     await page.getByRole('button', { name: /create account/i }).click();
  115 |     await expect(page.getByRole('alert').first()).toContainText(/8 characters/i);
  116 |   });
  117 | 
  118 |   test('shows error for password with no uppercase letter', async ({ page }) => {
  119 |     await fillValidForm(page, { password: 'securepass1', confirm: 'securepass1' });
  120 |     await page.getByRole('button', { name: /create account/i }).click();
  121 |     await expect(page.getByRole('alert').first()).toContainText(/uppercase/i);
  122 |   });
  123 | 
  124 |   test('shows error for password with no number', async ({ page }) => {
  125 |     await fillValidForm(page, { password: 'SecurePassword', confirm: 'SecurePassword' });
  126 |     await page.getByRole('button', { name: /create account/i }).click();
  127 |     await expect(page.getByRole('alert').first()).toContainText(/number/i);
  128 |   });
  129 | 
  130 |   test('shows error when no profession is selected', async ({ page }) => {
  131 |     await page.getByLabel(/full name/i).fill('Jane Smith');
  132 |     await page.getByLabel(/email address/i).fill('jane@example.com');
  133 |     // Skip profession selection
  134 |     await page.getByLabel(/^password/i).fill('SecurePass1');
  135 |     await page.getByLabel(/confirm password/i).fill('SecurePass1');
  136 |     await page.getByRole('button', { name: /create account/i }).click();
  137 |     await expect(page.getByRole('alert').first()).toContainText(/profession/i);
  138 |   });
  139 | 
  140 |   test('rejects invalid phone format', async ({ page }) => {
  141 |     await page.getByLabel(/phone/i).fill('1234');
  142 |     await fillValidForm(page);
  143 |     await page.getByRole('button', { name: /create account/i }).click();
  144 |     await expect(page.getByRole('alert').first()).toContainText(/phone/i);
  145 |   });
  146 | 
  147 |   test('rejects website without https://', async ({ page }) => {
  148 |     await page.getByLabel(/website/i).fill('www.badurl.com');
  149 |     await fillValidForm(page);
  150 |     await page.getByRole('button', { name: /create account/i }).click();
  151 |     await expect(page.getByRole('alert').first()).toContainText(/https/i);
  152 |   });
  153 | });
```