# Accessibility Testing Guide

This directory contains automated accessibility tests using Playwright and
`axe-core` to ensure WCAG 2.1 Level AA compliance.

## Quick Start

```sh
# Run all accessibility tests
npm run test-a11y

# Run tests in UI mode (interactive, great for development)
npm run test-a11y-ui

# Run tests in headed mode (see the browser)
npm run test-a11y-headed

# Run tests in debug mode (step through tests)
npm run test-a11y-debug

# Run both unit tests and accessibility tests
npm run test-all
```

## What Gets Tested

Core WCAG 2.1 Level AA Requirements:

- **Color Contrast**: Text and interactive elements have sufficient contrast
  ratios (4.5:1 for normal text, 3:1 for large text)
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Form Labels**: All form inputs have associated labels
- **ARIA Attributes**: Proper use of ARIA roles, states, and properties
- **Semantic HTML**: Correct use of heading structure, lists, and landmarks
- **Focus Management**: Visible focus indicators and logical focus order
- **Alternative Text**: Images have appropriate alt text
- **Touch Targets**: Interactive elements are large enough for touch (mobile)

### Dynamic Content

- Accessibility is maintained when state changes (e.g., counter updates)
- Route navigation doesn't introduce violations
- Loading states are announced to screen readers

### Responsive Design

- Tests run on both desktop and mobile viewports
- Content reflows properly at 200% zoom

## Test Structure

### `/test/a11y/helpers.ts`

Reusable testing utilities:
- `expectNoA11yViolations()` - Main assertion for checking violations
- `scanPage()` - Run axe scan with custom configuration
- `testKeyboardNavigation()` - Verify tab order
- `expectProperLabel()` - Check form label associations
- `checkHeadingStructure()` - Validate h1-h6 hierarchy
- `checkARIAUsage()` - Verify ARIA attributes
- `formatViolations()` - Pretty-print violations for debugging

### `/test/a11y/app.test.ts`

Main application tests covering:
- Home route accessibility
- Navigation between routes
- Interactive elements (buttons, links)
- Color contrast and visual accessibility
- Semantic HTML structure
- Dynamic content updates
- Mobile viewport testing

### `/test/a11y/forms-and-inputs.test.ts`

Example tests for forms and complex widgets (currently skipped):
- Form labels and validation
- Custom ARIA widgets (modals, tabs, dropdowns)
- Loading states and announcements
- Error messaging

## Understanding Test Results

### When Tests Pass
```
✓ should have no axe violations on home page (1.2s)
✓ should support keyboard navigation (543ms)
```

Your application meets WCAG 2.1 Level AA standards for the tested scenarios.


### When Tests Fail

Failed tests will show detailed violation information:

```
Error: Expected no accessibility violations but found 2:

1. [serious] color-contrast: Elements must have sufficient color contrast
   https://dequeuniversity.com/rules/axe/4.4/color-contrast

   Found in 1 location(s):
    Target: button.primary
    Fix any of the following:
      Element has insufficient color contrast of 2.5 (foreground color: #999999,
      background color: #ffffff, font size: 12.0pt (16px), font weight: normal).
      Expected contrast ratio of 4.5:1

2. [critical] button-name: Buttons must have discernible text
   https://dequeuniversity.com/rules/axe/4.4/button-name

   Found in 1 location(s):
    Target: button#submit-btn
    Fix any of the following:
      Element does not have inner text that is visible to screen readers
      aria-label attribute does not exist or is empty
      aria-labelledby attribute does not exist, references elements that do not exist
```

Each violation includes:
- **Impact level**: critical, serious, moderate, or minor
- **Rule ID**: The specific WCAG criterion violated
- **Description**: What's wrong
- **Help URL**: Link to detailed remediation guidance
- **Target**: CSS selector for the problematic element
- **Fix instructions**: How to resolve the issue

## Common Accessibility Patterns

### Adding Proper Labels to Forms

```typescript
// Good - explicit label association
<label for="email">Email Address</label>
<input id="email" name="email" type="email" />

// Good - wrapping label
<label>
  Email Address
  <input name="email" type="email" />
</label>

// Good - aria-label for icon buttons
<button aria-label="Close dialog">
  <CloseIcon />
</button>

// Bad - no label
<input name="email" type="email" />
```

### Announcing Dynamic Content

```typescript
// Status updates (polite, doesn't interrupt)
<div role="status" aria-live="polite">
  {loadingMessage}
</div>

// Critical alerts (interrupts screen reader)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Keyboard Navigation

```typescript
// Ensure all interactive elements are keyboard accessible
function MyButton({ onClick }) {
  return (
    <button onClick={onClick} onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick(e)
      }
    }}>
      Click me
    </button>
  )
}

// For custom interactive elements, add tabIndex
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
>
  Custom button
</div>
```

### Proper Heading Structure

```typescript
// Good - logical heading hierarchy
<h1>Page Title</h1>
  <h2>Main Section</h2>
    <h3>Subsection</h3>
    <h3>Another Subsection</h3>
  <h2>Another Section</h2>

// Bad - skipping levels
<h1>Page Title</h1>
  <h4>This skips h2 and h3!</h4>
```

## Writing New Accessibility Tests

### Basic Test Template

```typescript
import { test } from '@playwright/test'
import { expectNoA11yViolations } from './helpers.js'

test('my new page is accessible', async ({ page }) => {
  // 1. Navigate to the page
  await page.goto('/my-new-page')

  // 2. Wait for content to load
  await page.waitForSelector('h1')

  // 3. Run accessibility scan
  await expectNoA11yViolations(page)
})
```

### Testing Specific WCAG Rules

```typescript
import { checkSpecificRules } from './helpers.js'

test('images have alt text', async ({ page }) => {
  await page.goto('/')

  // Only check image-alt rule
  const results = await checkSpecificRules(page, ['image-alt'])

  expect(results.violations).toHaveLength(0)
})
```

### Testing Component Regions

```typescript
import { expectNoA11yViolations } from './helpers.js'

test('navigation component is accessible', async ({ page }) => {
  await page.goto('/')

  // Only scan the navigation region
  await expectNoA11yViolations(page, {
    include: ['nav', '[role="navigation"]']
  })
})
```

### Excluding Known Issues

```typescript
// Temporarily exclude third-party widgets
await expectNoA11yViolations(page, {
  exclude: ['#third-party-widget']
})

// Disable specific rules (use sparingly!)
await expectNoA11yViolations(page, {
  disableRules: ['color-contrast'] // Only while fixing design
})
```

## CI/CD Integration

### GitHub Actions Example

Add to `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test-a11y
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Netlify Build Plugin

Tests run automatically in the `npm run test-a11y` command. To fail builds on violations, update `netlify.toml`:

```toml
[build]
  command = "npm run build && npm run test-a11y"
```

## Advanced Configuration

### Testing Different WCAG Levels

```typescript
import { WCAG_TAGS } from './helpers.js'

// WCAG 2.1 Level A (minimum)
await expectNoA11yViolations(page, {
  tags: WCAG_TAGS.A
})

// WCAG 2.1 Level AA (recommended)
await expectNoA11yViolations(page, {
  tags: WCAG_TAGS.AA
})

// WCAG 2.1 Level AAA (highest)
await expectNoA11yViolations(page, {
  tags: WCAG_TAGS.AAA
})
```

### Custom Axe Configuration

Edit `test/a11y/helpers.ts` to customize default rules:

```typescript
export const DEFAULT_AXE_CONFIG = {
  rules: {
    // Adjust color contrast threshold
    'color-contrast': {
      enabled: true,
      options: { contrastRatio: { large: 3, normal: 4.5 } }
    },

    // Disable experimental rules
    'landmark-complementary-is-top-level': { enabled: false }
  }
}
```

### Testing Multiple Browsers

Edit `playwright.config.ts` to enable more browsers:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
]
```

## Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM WCAG Checklist](https://webaim.org/standards/wcag/checklist)

### Axe Documentation
- [Axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [@axe-core/playwright API](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

### Playwright
- [Playwright Testing](https://playwright.dev/docs/intro)
- [Accessibility Testing with Playwright](https://playwright.dev/docs/accessibility-testing)

### General Accessibility
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Deque University](https://dequeuniversity.com/)

## Troubleshooting

### "No tests found"
Make sure your test files end in `.test.ts` or `.spec.ts` and are in the `test/a11y` directory.

### "baseURL not available"
The dev server isn't running. Playwright will start it automatically, or you can start it manually:
```bash
npm start
```

### "Target closed" errors
The page closed before the test finished. Add proper waits:
```typescript
await page.waitForSelector('h1')
await page.waitForLoadState('networkidle')
```

### Tests are slow
- Run in headless mode (default): `npm run test-a11y`
- Reduce the number of browsers in `playwright.config.ts`
- Use `test.only()` to run specific tests during development

### Color contrast failures you disagree with
Axe might flag issues that appear fine visually but fail WCAG math. Options:
1. Adjust your colors to meet the ratio (recommended)
2. Verify with actual users who have vision impairments
3. Use a [contrast checker](https://webaim.org/resources/contrastchecker/) to confirm
4. Document exceptions if there's a strong design reason

## Getting Help

- Check the [Playwright Discord](https://discord.com/invite/playwright-807756831384403968)
- File issues on [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/issues)
- Review [existing axe violations](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
