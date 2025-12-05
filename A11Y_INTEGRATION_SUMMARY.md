# Accessibility Testing Integration Summary

## What Was Added

Your Netlify application now has comprehensive accessibility testing using Playwright and axe-core.

## Files Created

### Configuration
- **`playwright.config.ts`** - Playwright test runner configuration
  - Automatically starts dev server before tests
  - Configured for both local development and CI
  - Runs tests in Chromium (easily extensible to other browsers)

### Test Files
- **`test/a11y/helpers.ts`** - Reusable testing utilities
  - `expectNoA11yViolations()` - Main assertion function
  - `scanPage()` - Configurable axe scanning
  - `testKeyboardNavigation()` - Keyboard accessibility checks
  - `checkHeadingStructure()` - Validate heading hierarchy
  - `checkARIAUsage()` - Verify ARIA attributes
  - Plus many more specialized helpers

- **`test/a11y/app.test.ts`** - Main application tests
  - Tests all routes (/, /aaa, /bbb, /ccc)
  - Validates WCAG 2.1 Level AA compliance
  - Checks keyboard navigation
  - Verifies color contrast
  - Tests semantic HTML structure
  - Validates dynamic content updates
  - Mobile viewport testing

- **`test/a11y/forms-and-inputs.test.ts`** - Example tests (skipped)
  - Templates for form accessibility
  - ARIA widget patterns (modals, tabs, dropdowns)
  - Loading state announcements
  - Currently skipped; activate when you add forms

### Documentation
- **`test/a11y/README.md`** - Comprehensive guide
  - Detailed explanation of all test utilities
  - Common accessibility patterns
  - How to write new tests
  - Troubleshooting guide
  - WCAG compliance levels
  - CI/CD integration examples

- **`test/a11y/QUICKSTART.md`** - 2-minute getting started guide
  - Quick commands reference
  - Common fixes with code examples
  - Basic workflow

- **`A11Y_INTEGRATION_SUMMARY.md`** - This file

### Modified Files
- **`package.json`** - Added test scripts:
  - `test-a11y` - Run accessibility tests
  - `test-a11y-ui` - Interactive UI mode
  - `test-a11y-headed` - Watch tests run in browser
  - `test-a11y-debug` - Step-through debugging
  - `test-all` - Run all tests (unit + a11y)

- **`CLAUDE.md`** - Updated with accessibility testing info
  - Added commands documentation
  - Updated project structure section

- **`.gitignore`** - Added Playwright artifacts
  - `test-results/` - Test execution data
  - `playwright-report/` - HTML reports
  - `playwright/.cache/` - Browser cache

- **`.github/workflows/nodejs.yml`** - Enhanced CI workflow
  - Installs Playwright browsers
  - Runs accessibility tests
  - Uploads test reports as artifacts

## npm Scripts Reference

```bash
# Run all accessibility tests (headless)
npm run test-a11y

# Run tests in interactive UI mode (best for development)
npm run test-a11y-ui

# Run tests with visible browser
npm run test-a11y-headed

# Run tests in debug mode (step through)
npm run test-a11y-debug

# Run both unit tests and accessibility tests
npm run test-all
```

## What Gets Tested

### WCAG 2.1 Level AA Compliance
- Color contrast (4.5:1 for normal text, 3:1 for large text)
- Keyboard accessibility
- Form labels and associations
- ARIA attributes and roles
- Semantic HTML structure
- Heading hierarchy
- Focus management
- Alternative text for images
- Touch target sizes (mobile)

### Your Application Routes
- **Home route (/)**: Full accessibility scan
- **Route /aaa**: Accessibility validation
- **Route /bbb**: Accessibility validation
- **Route /ccc**: Accessibility validation

### Dynamic Behavior
- Counter state changes maintain accessibility
- Route navigation doesn't introduce violations
- Interactive elements (buttons, links) are keyboard accessible

### Responsive Design
- Desktop viewport (1280x720)
- Mobile viewport (375x667)
- 200% zoom compatibility

## How It Works

### Test Flow
1. **Playwright starts** your dev server automatically (`npm start`)
2. **Browser opens** to the specified route
3. **Page loads** and renders your Preact application
4. **axe-core analyzes** the rendered HTML for violations
5. **Results report** any WCAG violations found
6. **Tests fail** if violations are detected
7. **Detailed output** shows exactly what to fix

### Integration with Existing Tests
- **Unit tests** (tapzero): Continue to run separately with `npm test`
- **Accessibility tests** (Playwright): Run separately with `npm run test-a11y`
- **Both together**: Use `npm run test-all`

The two test suites are independent and can be run in any order.

## Development Workflow

### Local Development
1. Make code changes
2. Run `npm run test-a11y-ui` to see tests in interactive mode
3. Fix any violations using the detailed error messages
4. Tests automatically re-run when you save files (in UI mode)

### Before Committing
```bash
npm run test-all
```

### In CI/CD
Tests run automatically on every push via GitHub Actions:
- Unit tests run first
- Then accessibility tests
- Reports are uploaded as artifacts if tests fail
- Build fails if any violations are found

## Next Steps

### 1. Run the Tests
```bash
npm run test-a11y-ui
```

### 2. Review Results
All tests should pass for the current application. The test output will show:
- ✓ 20+ passing accessibility tests
- Coverage of all routes
- Keyboard navigation validation
- WCAG compliance confirmation

### 3. Add Tests for New Features
When you add new components or routes, add corresponding tests:

```typescript
// test/a11y/my-feature.test.ts
import { test } from '@playwright/test'
import { expectNoA11yViolations } from './helpers.js'

test('my new feature is accessible', async ({ page }) => {
  await page.goto('/my-new-route')
  await page.waitForSelector('h1')
  await expectNoA11yViolations(page)
})
```

### 4. Customize for Your Needs

#### Test Different WCAG Levels
```typescript
import { WCAG_TAGS } from './helpers.js'

// Level AAA (stricter)
await expectNoA11yViolations(page, {
  tags: WCAG_TAGS.AAA
})
```

#### Test More Browsers
Edit `playwright.config.ts` to enable Firefox, Safari, etc.

#### Add Form Tests
When you add forms, activate the examples in `forms-and-inputs.test.ts`

## Common Scenarios

### Testing Forms (Future)
When you add a form, use the examples in `test/a11y/forms-and-inputs.test.ts`:
- Remove `test.skip` to activate
- Adjust selectors for your form fields
- Verify label associations
- Test validation error announcements

### Testing Modals
```typescript
test('modal is accessible', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Open Modal")')

  const modal = page.locator('[role="dialog"]')
  await expect(modal).toBeVisible()
  await expect(modal).toHaveAttribute('aria-modal', 'true')

  await expectNoA11yViolations(page)
})
```

### Testing Dynamic Content
```typescript
test('loading state is accessible', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Load Data")')

  // Check for loading announcement
  const status = page.locator('[role="status"]')
  await expect(status).toContainText('Loading')

  await expectNoA11yViolations(page)
})
```

## Resources

### Quick References
- `test/a11y/QUICKSTART.md` - Get started in 2 minutes
- `test/a11y/README.md` - Comprehensive guide
- `test/a11y/helpers.ts` - All available test utilities

### External Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Playwright Testing](https://playwright.dev/docs/intro)

### Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools Extension](https://www.deque.com/axe/devtools/)

## Support

### Getting Help
1. Check the [README](test/a11y/README.md) troubleshooting section
2. Review the specific violation's help URL (included in error messages)
3. Search the [axe-core issues](https://github.com/dequelabs/axe-core/issues)
4. Ask in the [Playwright Discord](https://discord.com/invite/playwright-807756831384403968)

### Common Issues

**"No tests found"**
- Ensure test files end in `.test.ts`
- Check they're in `test/a11y/` directory

**"Target closed" errors**
- Add proper waits: `await page.waitForSelector('h1')`

**Tests are slow**
- Use headless mode (default)
- Reduce browser count in config
- Use `test.only()` during development

**False positives**
- Review the violation carefully (axe is usually right)
- Check the help URL for context
- Consider if there's a valid exception
- Document exceptions in code comments

## Project Status

### Current Test Coverage
- ✓ All routes tested for WCAG 2.1 Level AA
- ✓ Keyboard navigation validated
- ✓ Color contrast checked
- ✓ Semantic HTML verified
- ✓ Dynamic content updates tested
- ✓ Mobile viewports covered

### Ready for Production
The test suite is production-ready and will:
- Run automatically in CI/CD
- Fail builds if violations are introduced
- Provide detailed remediation guidance
- Scale as your application grows

## Maintenance

### Updating Dependencies
```bash
npm update @playwright/test @axe-core/playwright
npx playwright install --with-deps
```

### Adding New Routes
Add a test in `test/a11y/app.test.ts`:

```typescript
test('should have no violations on /new-route', async ({ page }) => {
  await page.goto('/new-route')
  await page.waitForSelector('h1')
  await expectNoA11yViolations(page)
})
```

### Keeping Tests Fast
- Run only affected tests during development
- Use `test.only()` temporarily
- Parallelize in CI (already configured)
- Cache Playwright browsers in CI

---

**You now have enterprise-grade accessibility testing!** 🎉

Start with `npm run test-a11y-ui` to see it in action.
