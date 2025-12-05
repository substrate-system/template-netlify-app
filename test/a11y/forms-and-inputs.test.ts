import { test, expect } from '@playwright/test'
import {
    expectNoA11yViolations,
    expectProperLabel,
    AXE_TAGS,
} from './helpers.js'

/**
 * Form and input accessibility tests
 *
 * This file demonstrates how to test forms and inputs when you add them.
 * These tests are currently skipped since the app doesn't have forms yet.
 * Remove test.skip when you add form elements to your application.
 */

test.describe.skip('Form Accessibility Examples', () => {
    test('should have properly labeled form inputs', async ({ page }) => {
        await page.goto('/contact')  // Replace with your actual form route
        await page.waitForSelector('form')

        // Test that all inputs have labels
        await expectProperLabel(page, 'input[name="email"]')
        await expectProperLabel(page, 'input[name="name"]')
        await expectProperLabel(page, 'textarea[name="message"]')

        // Run full accessibility scan
        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })
    })

    test('should show validation errors accessibly', async ({ page }) => {
        await page.goto('/contact')
        await page.waitForSelector('form')

        // Submit form without filling required fields
        await page.click('button[type="submit"]')

        // Wait for error messages
        await page.waitForSelector('[role="alert"]', { timeout: 5000 })

        // Verify errors are announced to screen readers
        const errorRegion = page.locator('[role="alert"]')
        await expect(errorRegion).toBeVisible()

        // Check that errors don't introduce new a11y violations
        await expectNoA11yViolations(page)
    })

    test('should associate error messages with inputs', async ({ page }) => {
        await page.goto('/contact')
        await page.waitForSelector('form')

        // Submit to trigger validation
        await page.click('button[type="submit"]')
        await page.waitForSelector('[role="alert"]')

        // Check that errors are associated via aria-describedby
        // or aria-errormessage
        const inputWithError = page.locator('input').first()
        const ariaDescribedBy = await inputWithError.getAttribute(
            'aria-describedby'
        )
        const ariaErrorMessage = await inputWithError.getAttribute(
            'aria-errormessage'
        )
        const ariaInvalid = await inputWithError.getAttribute('aria-invalid')

        const hasProperErrorAssociation =
            (ariaDescribedBy !== null || ariaErrorMessage !== null) &&
            ariaInvalid === 'true'

        expect(hasProperErrorAssociation).toBe(true)
    })

    test('should support keyboard form submission', async ({ page }) => {
        await page.goto('/contact')
        await page.waitForSelector('form')

        // Fill form using keyboard
        await page.keyboard.press('Tab')
        await page.keyboard.type('John Doe')

        await page.keyboard.press('Tab')
        await page.keyboard.type('john@example.com')

        await page.keyboard.press('Tab')
        await page.keyboard.type('Test message')

        // Submit with Enter key
        await page.keyboard.press('Enter')

        // Verify submission (adjust based on your app's behavior)
        // This is just an example
        await page.waitForSelector('[role="status"]', { timeout: 5000 })
    })

    test('should have accessible select dropdowns', async ({ page }) => {
        await page.goto('/form-with-select')
        await page.waitForSelector('select')

        // Verify select has a label
        await expectProperLabel(page, 'select[name="category"]')

        // Check that select is keyboard navigable
        await page.focus('select[name="category"]')
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')

        // Run accessibility scan
        await expectNoA11yViolations(page)
    })

    test('should have accessible radio button groups', async ({ page }) => {
        await page.goto('/form-with-radio')
        await page.waitForSelector('input[type="radio"]')

        // Verify fieldset and legend for radio group
        const hasFieldset = await page.locator('fieldset').count()
        expect(hasFieldset).toBeGreaterThan(0)

        const hasLegend = await page.locator('legend').count()
        expect(hasLegend).toBeGreaterThan(0)

        // Test keyboard navigation within radio group
        const firstRadio = page.locator('input[type="radio"]').first()
        await firstRadio.focus()

        // Arrow keys should navigate between radio options
        await page.keyboard.press('ArrowDown')
        const secondRadio = page.locator('input[type="radio"]').nth(1)
        await expect(secondRadio).toBeFocused()

        await expectNoA11yViolations(page)
    })

    test('should have accessible checkboxes', async ({ page }) => {
        await page.goto('/form-with-checkbox')
        await page.waitForSelector('input[type="checkbox"]')

        // Each checkbox should have a label
        const checkboxes = await page.locator('input[type="checkbox"]').all()

        for (const checkbox of checkboxes) {
            const id = await checkbox.getAttribute('id')
            if (id) {
                await expectProperLabel(page, `#${id}`)
            }
        }

        // Should be toggleable with Space key
        const firstCheckbox = page.locator('input[type="checkbox"]').first()
        await firstCheckbox.focus()

        const initialState = await firstCheckbox.isChecked()
        await page.keyboard.press('Space')
        const newState = await firstCheckbox.isChecked()

        expect(newState).toBe(!initialState)

        await expectNoA11yViolations(page)
    })

    test('should handle autocomplete attributes correctly', async ({
        page,
    }) => {
        await page.goto('/contact')
        await page.waitForSelector('form')

        // Verify appropriate autocomplete attributes for common fields
        const emailInput = page.locator('input[name="email"]')
        const emailAutocomplete = await emailInput.getAttribute('autocomplete')
        expect(emailAutocomplete).toBe('email')

        const nameInput = page.locator('input[name="name"]')
        const nameAutocomplete = await nameInput.getAttribute('autocomplete')

        // Should have some autocomplete value
        expect(nameAutocomplete).toBeTruthy()
    })
})

test.describe.skip('ARIA Widget Examples', () => {
    test('should have accessible custom dropdown', async ({ page }) => {
        await page.goto('/custom-dropdown')

        // Custom dropdowns should use appropriate ARIA
        const dropdown = page.locator('[role="combobox"]')
        await expect(dropdown).toBeVisible()

        // Should have aria-expanded
        const ariaExpanded = await dropdown.getAttribute('aria-expanded')
        expect(ariaExpanded).toBe('false')

        // Open dropdown
        await dropdown.click()

        // aria-expanded should update
        const expandedState = await dropdown.getAttribute('aria-expanded')
        expect(expandedState).toBe('true')

        // Should have aria-controls pointing to listbox
        const controls = await dropdown.getAttribute('aria-controls')
        expect(controls).toBeTruthy()

        const listbox = page.locator(`#${controls}`)
        await expect(listbox).toBeVisible()
        await expect(listbox).toHaveAttribute('role', 'listbox')

        await expectNoA11yViolations(page)
    })

    test('should have accessible modal dialog', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Open modal
        await page.click('button:has-text("Open Modal")')

        // Modal should trap focus
        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeVisible()

        // Should have aria-modal
        await expect(modal).toHaveAttribute('aria-modal', 'true')

        // Should have aria-labelledby or aria-label
        const labelledBy = await modal.getAttribute('aria-labelledby')
        const label = await modal.getAttribute('aria-label')
        expect(labelledBy || label).toBeTruthy()

        // Verify focus is moved into modal
        // const focusedElement = page.locator(':focus')
        const focusIsInModal = await page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"]')
            const focused = document.activeElement
            return modal?.contains(focused)
        })
        expect(focusIsInModal).toBe(true)

        // Escape key should close modal
        await page.keyboard.press('Escape')
        await expect(modal).toBeHidden()

        await expectNoA11yViolations(page)
    })

    test('should have accessible tabs widget', async ({ page }) => {
        await page.goto('/tabs')

        // Verify ARIA roles
        const tablist = page.locator('[role="tablist"]')
        await expect(tablist).toBeVisible()

        const tabs = page.locator('[role="tab"]')
        const tabCount = await tabs.count()
        expect(tabCount).toBeGreaterThan(0)

        // First tab should be selected
        const firstTab = tabs.first()
        await expect(firstTab).toHaveAttribute('aria-selected', 'true')

        // Arrow key navigation
        await firstTab.focus()
        await page.keyboard.press('ArrowRight')

        const secondTab = tabs.nth(1)
        await expect(secondTab).toBeFocused()
        await expect(secondTab).toHaveAttribute('aria-selected', 'true')

        // Verify associated tabpanel is visible
        const panelId = await secondTab.getAttribute('aria-controls')
        if (panelId) {
            const panel = page.locator(`#${panelId}`)
            await expect(panel).toBeVisible()
            await expect(panel).toHaveAttribute('role', 'tabpanel')
        }

        await expectNoA11yViolations(page)
    })
})

test.describe.skip('Complex Interaction Examples', () => {
    test('should announce loading states to screen readers', async ({
        page,
    }) => {
        await page.goto('/')

        // Trigger an async action
        await page.click('button:has-text("Load Data")')

        // Check for loading indicator with proper ARIA
        const loadingIndicator = page.locator('[role="status"]', {
            hasText: /loading/i,
        })
        await expect(loadingIndicator).toBeVisible()

        // Or check for aria-live region
        const liveRegion = page.locator('[aria-live="polite"]')
        const liveText = await liveRegion.textContent()
        expect(liveText).toMatch(/loading/i)

        // Wait for loading to complete
        await page.waitForSelector('[role="status"]:has-text("loading")', {
            state: 'hidden',
        })

        await expectNoA11yViolations(page)
    })

    test('should announce success/error messages', async ({ page }) => {
        await page.goto('/form')

        // Submit form successfully
        await page.fill('input[name="email"]', 'test@example.com')
        await page.click('button[type="submit"]')

        // Success message should be announced
        const successMessage = page.locator('[role="status"]', {
            hasText: /success/i,
        })
        await expect(successMessage).toBeVisible()

        // Or check for alert role for errors
        // const errorMessage = page.locator('[role="alert"]');
        // await expect(errorMessage).toBeVisible();

        await expectNoA11yViolations(page)
    })

    test('should handle infinite scroll accessibly', async ({ page }) => {
        await page.goto('/infinite-scroll')

        // Initial load should be accessible
        await expectNoA11yViolations(page)

        // Scroll to trigger more content
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

        // Wait for new content
        await page.waitForTimeout(1000)

        // New content should maintain accessibility
        await expectNoA11yViolations(page)

        // Should announce to screen readers when new content loads
        const liveRegion = page.locator('[aria-live]')
        await expect(liveRegion).toBeVisible()
    })
})
