# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: professionals.spec.js >> Professionals Form — Input sanitization >> strips HTML tags from name field
- Location: tests\professionals.spec.js:162:3

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for getByLabel(/full name/i)

```

```
Error: browserContext.close: Target page, context or browser has been closed
```