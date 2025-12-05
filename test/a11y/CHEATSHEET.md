# Accessibility Testing Cheat Sheet

## Quick Commands

```bash
npm run test-a11y        # Run tests (headless)
npm run test-a11y-ui     # Interactive UI mode
npm run test-a11y-headed # Watch browser
npm run test-a11y-debug  # Debug mode
npm run test-all         # All tests (unit + a11y)
```

## Test Template

```ts
import { test } from '@playwright/test'
import { expectNoA11yViolations } from './helpers.js'

test('my page is accessible', async ({ page }) => {
  await page.goto('/my-route')
  await page.waitForSelector('h1')
  await expectNoA11yViolations(page)
})
```

## Common Helpers

```ts
// Basic scan
await expectNoA11yViolations(page)

// Scan with WCAG level
await expectNoA11yViolations(page, {
  tags: AXE_TAGS.wcagAA  // or wcagA, wcagAAA
})

// Scan specific region
await expectNoA11yViolations(page, {
  include: ['#main-content']
})

// Exclude areas
await expectNoA11yViolations(page, {
  exclude: ['#third-party-widget']
})

// Check keyboard navigation
await testKeyboardNavigation(page, [
  'a[href]',
  'button.primary',
  'button.secondary'
])

// Check heading structure
await checkHeadingStructure(page)

// Check ARIA usage
await checkARIAUsage(page)

// Check specific label
await expectProperLabel(page, 'input[name="email"]')
```

## WCAG Conformance Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| **A** | Minimum | Basic accessibility |
| **AA** | Mid-range | **Most websites (recommended)** |
| **AAA** | Highest | Government, specialized needs |

## Common Violations & Fixes

### Color Contrast

```ts
// FAIL: Insufficient contrast
.button { color: #999; background: #fff; } // 2.8:1

// PASS: Sufficient contrast
.button { color: #595959; background: #fff; } // 4.6:1
```

**Ratios Required:**
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

### Button Labels

```ts
// FAIL: No accessible name
<button onClick={close}><CloseIcon /></button>

// PASS: Has aria-label
<button aria-label="Close dialog" onClick={close}>
  <CloseIcon />
</button>

// PASS: Has visible text
<button onClick={close}>Close</button>
```

### Form Labels

```ts
// FAIL: No label
<input name="email" type="email" />

// PASS: Explicit association
<label for="email">Email</label>
<input id="email" name="email" type="email" />

// PASS: Wrapping label
<label>
  Email
  <input name="email" type="email" />
</label>

// PASS: ARIA label
<input
  name="email"
  type="email"
  aria-label="Email address"
/>
```

### Heading Hierarchy

```ts
// FAIL: Skips levels
<h1>Page Title</h1>
<h4>Subsection</h4>  // Skipped h2, h3!

// PASS: Logical order
<h1>Page Title</h1>
  <h2>Section</h2>
    <h3>Subsection</h3>
```

### ARIA Roles

```ts
// Common roles
<div role="dialog" aria-modal="true" aria-labelledby="title">
  <h2 id="title">Dialog Title</h2>
</div>

<div role="alert">Error message</div>

<div role="status" aria-live="polite">Loading...</div>

<nav role="navigation" aria-label="Main">
  <ul>...</ul>
</nav>

<button role="button" aria-pressed="false">Toggle</button>
```

### Live Regions

```ts
// Polite announcements (doesn't interrupt)
<div role="status" aria-live="polite">
  {statusMessage}
</div>

// Urgent announcements (interrupts)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

## Keyboard Navigation

### Essential Keys
- **Tab**: Move forward
- **Shift+Tab**: Move backward
- **Enter**: Activate buttons/links
- **Space**: Activate buttons, toggle checkboxes
- **Esc**: Close modals/menus
- **Arrow keys**: Navigate within widgets (tabs, menus)

### Testing Pattern

```ts
test('keyboard navigation works', async ({ page }) => {
  await page.goto('/')

  // Tab to first interactive element
  await page.keyboard.press('Tab')

  // Verify focus
  const button = page.locator('button').first()
  await expect(button).toBeFocused()

  // Activate with Enter
  await page.keyboard.press('Enter')
})
```

## Focus Management

```ts
// Always visible focus indicator
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

// Trap focus in modal
const focusableElements = modal.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
)
```

## Semantic HTML

```ts
// Good semantic structure
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</main>

<aside aria-label="Related content">
  <h2>Related</h2>
</aside>

<footer>
  <p>&copy; 2025</p>
</footer>
```

## Mobile Touch Targets

```css
/* Minimum size: 44x44 CSS pixels (WCAG AAA) */
/* Recommended: 48x48 pixels */

button, a {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
}
```

## Testing Different Viewports

```ts
// In test file
test.use({ viewport: { width: 375, height: 667 } })

test('mobile accessible', async ({ page }) => {
  await page.goto('/')
  await expectNoA11yViolations(page)
})

// Or in playwright.config.ts
projects: [
  { name: 'Mobile Chrome', use: devices['Pixel 5'] },
  { name: 'Mobile Safari', use: devices['iPhone 12'] },
]
```

## Filtering Tests

```bash
# Run specific file
npx playwright test app.test.ts

# Run tests matching pattern
npx playwright test -g "keyboard"

# Run single test
npx playwright test -g "should have no violations on home"

# Debug specific test
npx playwright test --debug -g "home page"
```

## Excluding Rules (Use Sparingly!)

```ts
// Temporarily disable a rule while fixing
await expectNoA11yViolations(page, {
  disableRules: ['color-contrast']
})

// Better: Fix the issue!
```

## Impact Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **critical** | Prevents access | **Fix immediately** |
| **serious** | Major barrier | Fix before release |
| **moderate** | Significant difficulty | Fix soon |
| **minor** | Slight inconvenience | Fix when possible |

## Useful Selectors

```ts
// Get interactive elements
page.locator('button, a[href], input, select, textarea')

// Get by role (preferred!)
page.getByRole('button', { name: 'Submit' })
page.getByRole('heading', { level: 1 })
page.getByRole('link', { name: 'Home' })
page.getByRole('textbox', { name: 'Email' })

// Get by label text
page.getByLabel('Email address')

// Get by accessible name
page.getByRole('button', { name: /close|dismiss/i })
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run accessibility tests
  run: npm run test-a11y

- name: Upload report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Resources

**Test faster:**
- Use `test.only()` during development
- Run `npm run test-a11y-ui` for interactive debugging

**Learn more:**
- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

**Get help:**
- Check `test/a11y/README.md` for detailed docs
- Review violation URLs in test output
- Search [axe-core issues](https://github.com/dequelabs/axe-core/issues)
