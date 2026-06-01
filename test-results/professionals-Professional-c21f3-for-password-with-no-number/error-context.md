# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: professionals.spec.js >> Professionals Form — Validation >> shows error for password with no number
- Location: tests\professionals.spec.js:124:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/full name/i)

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - link "SM Design Floors logo S . M Design Floors" [ref=e4] [cursor=pointer]:
      - /url: /
      - img "SM Design Floors logo" [ref=e5]
      - generic [ref=e6]:
        - generic [ref=e7]: S
        - generic [ref=e8]: .
        - generic [ref=e9]: M
        - generic [ref=e10]: Design Floors
    - list [ref=e11]:
      - listitem [ref=e12]:
        - link "About Us" [ref=e13] [cursor=pointer]:
          - /url: /#services
      - listitem [ref=e14]:
        - link "ProServices" [ref=e15] [cursor=pointer]:
          - /url: /proservices
      - listitem [ref=e16]:
        - link "Contact" [ref=e17] [cursor=pointer]:
          - /url: /#contact
      - listitem [ref=e18]:
        - button "Contractor Login" [ref=e19] [cursor=pointer]
  - generic [ref=e22]: Monday — Closed · Opens Tomorrow at 10:00 AM
  - generic:
    - generic:
      - button "✕"
      - paragraph: SM Design Floors
      - heading "Sign In" [level=2]
      - generic:
        - generic:
          - generic: Email
          - textbox "yourname@example.com"
        - generic:
          - generic: Password
          - textbox "••••••••"
        - button "Sign In"
      - paragraph:
        - text: Don't have an account?
        - button "Create one here"
  - generic [ref=e23]:
    - heading "404" [level=1] [ref=e24]
    - paragraph [ref=e25]: This page doesn't exist.
    - button "Go Home" [ref=e26] [cursor=pointer]
  - generic [ref=e27]:
    - generic [ref=e28]: Our Trusted Brands
    - generic [ref=e30]:
      - img "Brand 1" [ref=e32]
      - img "Brand 2" [ref=e34]
      - img "Brand 3" [ref=e36]
      - img "Brand 4" [ref=e38]
      - img "Brand 5" [ref=e40]
      - img "Brand 6" [ref=e42]
      - img "Brand 7" [ref=e44]
      - img "Brand 8" [ref=e46]
      - img "Brand 9" [ref=e48]
      - img "Brand 10" [ref=e50]
      - img "Brand 11" [ref=e52]
      - img "Brand 12" [ref=e54]
      - img "Brand 13" [ref=e56]
      - img "Brand 14" [ref=e58]
      - img "Brand 15" [ref=e60]
      - img "Brand 16" [ref=e62]
      - img "Brand 17" [ref=e64]
      - img "Brand 18" [ref=e66]
      - img "Brand 19" [ref=e68]
      - img "Brand 20" [ref=e70]
      - img "Brand 21" [ref=e72]
      - img "Brand 22" [ref=e74]
      - img "Brand 23" [ref=e76]
      - img "Brand 24" [ref=e78]
  - contentinfo [ref=e79]:
    - generic [ref=e80]: SM Design Floors
    - paragraph [ref=e81]: © 2026 SM Design Floors. All rights reserved.
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
> 36  |   await page.getByLabel(/full name/i).fill(values.name);
      |                                       ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  53  |     await expect(page.getByRole('heading', { name: /join our network/i })).toBeVisible();
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
```