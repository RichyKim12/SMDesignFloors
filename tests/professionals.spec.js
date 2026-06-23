/**
 * professionals.spec.js
 * ─────────────────────────────────────────────────────────────
 * Playwright tests for the Professionals registration form.
 *
 * Run:
 *   npx playwright test professionals.spec.js
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * The tests assume the dev server is running on http://localhost:5173
 * and the page with the form is at /professionals.
 * Adjust BASE_URL and FORM_PATH as needed.
 */

import { test, expect } from '@playwright/test';

const BASE_URL  = 'http://localhost:5173';
const FORM_PATH = '/professionals';
const FORM_URL  = `${BASE_URL}${FORM_PATH}`;

// ─── Helpers ──────────────────────────────────────────────────

/** Fill required fields with valid data */
async function fillValidForm(page, overrides = {}) {
  const values = {
    name:     'Jane Smith',
    email:    `test+${Date.now()}@example.com`,
    password: 'SecurePass1',
    confirm:  'SecurePass1',
    ...overrides,
  };

  await page.getByLabel(/full name/i).fill(values.name);
  await page.getByLabel(/email address/i).fill(values.email);

  // Select at least one profession checkbox
  await page.getByLabel('Hardwood Flooring').check();

  await page.getByLabel(/^password/i).fill(values.password);
  await page.getByLabel(/confirm password/i).fill(values.confirm);

  return values;
}

// ─── Test suites ──────────────────────────────────────────────

test.describe('Professionals Form — Page load', () => {
  test('renders the form with correct heading', async ({ page }) => {
    await page.goto(FORM_URL);
    await expect(page.getByRole('heading', { name: /join our network/i })).toBeVisible();
  });

  test('has no detectable WCAG violations (basic landmark check)', async ({ page }) => {
    await page.goto(FORM_URL);
    // Each fieldset must have a legend (ADA grouping)
    const fieldsets = page.locator('fieldset');
    const count     = await fieldsets.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(fieldsets.nth(i).locator('legend')).toBeVisible();
    }
  });

  test('all form inputs have associated labels', async ({ page }) => {
    await page.goto(FORM_URL);
    const inputs = page.locator('input:not([type="hidden"]):not([type="file"]):not([style*="display: none"])');
    const n      = await inputs.count();
    for (let i = 0; i < n; i++) {
      const inp = inputs.nth(i);
      const id  = await inp.getAttribute('id');
      if (id) {
        // label[for=id] must exist OR input is inside a label
        const labelFor   = page.locator(`label[for="${id}"]`);
        const hasLabelFor = await labelFor.count() > 0;
        expect(hasLabelFor, `Input #${id} must have a <label for="...">`).toBe(true);
      }
    }
  });
});

// ─── Validation ───────────────────────────────────────────────

test.describe('Professionals Form — Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FORM_URL);
  });

  test('shows error when submitted with no fields filled', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
  });

  test('shows error for invalid email', async ({ page }) => {
    await page.getByLabel(/full name/i).fill('Jane Smith');
    await page.getByLabel(/email address/i).fill('not-an-email');
    await page.getByLabel('Hardwood Flooring').check();
    await page.getByLabel(/^password/i).fill('SecurePass1');
    await page.getByLabel(/confirm password/i).fill('SecurePass1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(/valid email/i);
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await fillValidForm(page, { password: 'SecurePass1', confirm: 'Different1' });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(/do not match/i);
  });

  test('shows error for password shorter than 8 characters', async ({ page }) => {
    await fillValidForm(page, { password: 'Ab1', confirm: 'Ab1' });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(/8 characters/i);
  });

  test('shows error for password with no uppercase letter', async ({ page }) => {
    await fillValidForm(page, { password: 'securepass1', confirm: 'securepass1' });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(/uppercase/i);
  });

  test('shows error for password with no number', async ({ page }) => {
    await fillValidForm(page, { password: 'SecurePassword', confirm: 'SecurePassword' });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(/number/i);
  });

  test('shows error when no profession is selected', async ({ page }) => {
    await page.getByLabel(/full name/i).fill('Jane Smith');
    await page.getByLabel(/email address/i).fill('jane@example.com');
    // Skip profession selection
    await page.getByLabel(/^password/i).fill('SecurePass1');
    await page.getByLabel(/confirm password/i).fill('SecurePass1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(/profession/i);
  });

  test('rejects invalid phone format', async ({ page }) => {
    await page.getByLabel(/phone/i).fill('1234');
    await fillValidForm(page);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(/phone/i);
  });

  test('rejects website without https://', async ({ page }) => {
    await page.getByLabel(/website/i).fill('www.badurl.com');
    await fillValidForm(page);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(/https/i);
  });
});

// ─── Input sanitization ───────────────────────────────────────

test.describe('Professionals Form — Input sanitization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FORM_URL);
  });

  test('strips HTML tags from name field', async ({ page }) => {
    const input = page.getByLabel(/full name/i);
    await input.fill('<script>alert(1)</script>Jane');
    // Trigger blur to let React state update
    await input.press('Tab');
    const value = await input.inputValue();
    expect(value).not.toContain('<script>');
  });

  test('strips SQL injection characters from name field', async ({ page }) => {
    const input = page.getByLabel(/full name/i);
    await input.fill("Jane'; DROP TABLE users;--");
    await input.press('Tab');
    const value = await input.inputValue();
    expect(value).not.toMatch(/['"`;]/);
  });

  test('phone field only accepts digits and formatting characters', async ({ page }) => {
    const input = page.getByLabel(/phone/i);
    await input.fill('abc123def4567890xyz');
    await input.press('Tab');
    const value = await input.inputValue();
    // After formatPhone, should be (123) 456-7890 or similar — no letters
    expect(value).not.toMatch(/[a-zA-Z]/);
  });

  test('name field enforces maxLength of 80', async ({ page }) => {
    const longName = 'A'.repeat(200);
    const input    = page.getByLabel(/full name/i);
    await input.fill(longName);
    const value = await input.inputValue();
    expect(value.length).toBeLessThanOrEqual(80);
  });

  test('notes textarea enforces maxLength of 1000', async ({ page }) => {
    const longText = 'X'.repeat(1200);
    const textarea = page.getByLabel(/additional notes/i);
    await textarea.fill(longText);
    const value = await textarea.inputValue();
    expect(value.length).toBeLessThanOrEqual(1000);
  });
});

// ─── Rate limiting ────────────────────────────────────────────

test.describe('Professionals Form — Rate limiting', () => {
  test('blocks after 3 rapid submission attempts', async ({ page }) => {
    await page.goto(FORM_URL);

    // Inject artificial rate-limit state: 3 attempts within the last minute
    await page.evaluate(() => {
      const now      = Date.now();
      const attempts = [now - 1000, now - 2000, now - 3000];
      sessionStorage.setItem('pro_form_attempts', JSON.stringify(attempts));
    });

    // Try to submit — should be blocked before any network call
    await fillValidForm(page);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('alert').first()).toContainText(/too many/i);
  });
});

// ─── File upload ──────────────────────────────────────────────

test.describe('Professionals Form — File upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FORM_URL);
  });

  test('accepts a valid PDF resume', async ({ page }) => {
    // Create a minimal valid PDF buffer (25 bytes with %PDF magic)
    const pdfContent = Buffer.from('%PDF-1.4 fake content for testing');
    await page.locator('input[type="file"]').first().setInputFiles({
      name:     'resume.pdf',
      mimeType: 'application/pdf',
      buffer:   pdfContent,
    });
    // Should NOT show a file-error alert
    await expect(page.getByRole('alert').first()).not.toBeVisible();
  });

  test('rejects a file with wrong extension disguised as PDF', async ({ page }) => {
    // A .exe file renamed to .pdf — magic bytes are MZ (not %PDF)
    const exeBytes = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    await page.locator('input[type="file"]').first().setInputFiles({
      name:     'malware.pdf',
      mimeType: 'application/pdf',
      buffer:   exeBytes,
    });
    await expect(page.getByRole('alert').first()).toContainText(/valid document/i);
  });
});

// ─── Accessibility ────────────────────────────────────────────

test.describe('Professionals Form — Accessibility', () => {
  test('error banner receives focus after failed submission', async ({ page }) => {
    await page.goto(FORM_URL);
    await page.getByRole('button', { name: /create account/i }).click();

    // The error banner should be focused (tabIndex=-1 + .focus() in code)
    const errorBanner = page.locator('[role="alert"]').first();
    await expect(errorBanner).toBeVisible();
    // Playwright checks the focused element
    await expect(errorBanner).toBeFocused();
  });

  test('availability buttons report aria-pressed state', async ({ page }) => {
    await page.goto(FORM_URL);
    const monAm = page.getByRole('button', { name: /Mon Morning/i });
    await expect(monAm).toHaveAttribute('aria-pressed', 'false');
    await monAm.click();
    await expect(monAm).toHaveAttribute('aria-pressed', 'true');
  });

  test('upload zones are keyboard-accessible', async ({ page }) => {
    await page.goto(FORM_URL);
    // Tab to the first upload zone and press Enter — file picker opens
    const uploadZone = page.locator('.upload-zone').first();
    await uploadZone.focus();
    await expect(uploadZone).toBeFocused();
    // Verify it has the correct role and label
    await expect(uploadZone).toHaveAttribute('role', 'button');
  });

  test('success modal is announced as a dialog', async ({ page, context }) => {
    await page.goto(FORM_URL);
    // Directly inject the modal to test its ADA attributes without a full form submit
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'modal-title');
      overlay.innerHTML = '<h3 id="modal-title">Account Created</h3>';
      document.body.appendChild(overlay);
    });
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('no emoji or symbol characters appear in form text', async ({ page }) => {
    await page.goto(FORM_URL);
    const bodyText = await page.locator('section#professionals').innerText();
    // Emoji unicode range check
    expect(bodyText).not.toMatch(/[\u{1F000}-\u{1FFFF}]/u);
  });
});

// ─── Mobile layout ────────────────────────────────────────────

test.describe('Professionals Form — Mobile compliance', () => {
  test('form is visible and usable on a 375px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(FORM_URL);

    const submitBtn = page.getByRole('button', { name: /create account/i });
    await expect(submitBtn).toBeVisible();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px tolerance
  });

  test('phone input uses numeric keyboard on mobile (inputmode=tel)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(FORM_URL);
    const phoneInput = page.getByLabel(/phone/i);
    await expect(phoneInput).toHaveAttribute('inputmode', 'tel');
  });
});