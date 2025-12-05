# Accessibility Testing Quick Start

## 1. Install (One-time setup)

If you need to reinstall browsers:

```sh
npx playwright install --with-deps
```

## 2. Run Tests

```sh
# Headless mode (fast, for CI)
npm run test-a11y

# UI mode (recommended for development)
npm run test-a11y-ui
```

## 3. Understanding Results

### All Green?

Your app is accessible. No action needed.

```
✓ should have no axe violations on home page (542ms)
✓ should support keyboard navigation (234ms)
```

### Red? Fix the Issues

```
✗ should have no axe violations on home page
  Expected no accessibility violations but found 1:

  1. [serious] color-contrast
     https://dequeuniversity.com/rules/axe/4.4/color-contrast

     Target: button.primary
     Element has insufficient color contrast of 3.2 (expected 4.5:1)
```

**How to fix:**
1. Click the help URL for detailed guidance
2. Update the CSS to meet the contrast ratio
3. Re-run tests to verify

## Common First Fixes

### Issue: "Buttons must have discernible text"
```tsx
// Before
<button onClick={handleClick}>
  <CloseIcon />
</button>

// After
<button aria-label="Close dialog" onClick={handleClick}>
  <CloseIcon />
</button>
```

### Issue: "Form elements must have labels"

```tsx
// Before
<input name="email" type="email" />

// After
<label for="email">Email Address</label>
<input id="email" name="email" type="email" />
```

### Issue: "Color contrast must be at least 4.5:1"
```css
/* Before */
.button {
  color: #999; /* Too light */
  background: #fff;
}

/* After */
.button {
  color: #595959; /* Meets 4.5:1 ratio */
  background: #fff;
}
```

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
to find compliant colors.

## Testing Workflow

1. **Make changes** to your component
2. **Run tests** with `npm run test-a11y-ui`
3. **See results** in real-time in the Playwright UI
4. **Fix violations** using the help links
5. **Repeat** until all tests pass

## Next Steps

- Read the [full guide](./README.md) for advanced patterns
- Add new tests when creating new pages/components
- Run `npm run test-all` before committing

## Help

**Tests won't start?**
- Make sure dev server isn't already running on port 8888
- Playwright will start it automatically

**Need to test a specific file?**

```sh
npx playwright test app.test.ts
```

**Want to debug a specific test?**

```sh
npx playwright test --debug -g "should have no violations"
```

**Tests passing locally but failing in CI?**
- Check the uploaded Playwright report artifact in GitHub Actions
- Look for viewport/browser-specific issues

## Resources

- [README.md](./README.md) - Full documentation
- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Playwright Docs](https://playwright.dev)
