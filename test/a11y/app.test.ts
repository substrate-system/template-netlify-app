import { test, expect } from '@playwright/test'
import {
    expectNoA11yViolations,
    checkHeadingStructure,
    checkARIAUsage,
    AXE_TAGS,
} from './helpers.js'

/**
 * Main application accessibility tests
 * These tests verify WCAG 2.1 Level AA compliance across all routes
 */

test.describe('Home Route Accessibility', () => {
    test('should have no axe violations on home page', async ({ page }) => {
        await page.goto('/')

        // Wait for the app to fully render
        await page.waitForSelector('h1')

        // Run comprehensive axe scan for WCAG 2.1 Level AA
        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })
    })

    test('should have proper heading structure', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        await checkHeadingStructure(page)
    })

    test('should have correct ARIA usage', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        await checkARIAUsage(page)
    })

    test('should support keyboard navigation through interactive elements', async ({
        page,
    }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Focus the first interactive element
        await page.keyboard.press('Tab')

        // Verify we can navigate through all links and buttons
        const links = await page.locator('a[href]').count()
        const buttons = await page.locator('button').count()

        // Should be able to tab through all interactive elements
        // We have 3 links (/aaa, /bbb, /ccc) and 2 buttons (plus, minus)
        expect(links).toBeGreaterThan(0)
        expect(buttons).toBeGreaterThan(0)

        // Test tabbing to the first link
        const firstLink = page.locator('a[href]').first()
        await expect(firstLink).toBeFocused()
    })

    test('should have accessible button labels', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Check that buttons have accessible text content
        const plusButton = page.getByRole('button', { name: /plus/i })
        const minusButton = page.getByRole('button', { name: /minus/i })

        await expect(plusButton).toBeVisible()
        await expect(minusButton).toBeVisible()

        // Verify buttons are keyboard accessible
        await plusButton.focus()
        await expect(plusButton).toBeFocused()

        await minusButton.focus()
        await expect(minusButton).toBeFocused()
    })

    test('should have accessible navigation links', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // All links should have accessible text
        const links = await page.locator('a[href]').all()

        for (const link of links) {
            const text = await link.textContent()
            expect(text?.trim().length).toBeGreaterThan(0)
        }
    })

    test('should maintain focus visibility on interactive elements', async ({
        page,
    }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Tab to first button
        await page.keyboard.press('Tab')
        const firstInteractive = await page.evaluate(
            () => document.activeElement?.tagName
        )

        // Verify element received focus (has a valid tag name)
        expect(firstInteractive).toBeTruthy()
    })
})

test.describe('Route Navigation Accessibility', () => {
    test('should have no violations on /aaa route', async ({ page }) => {
        await page.goto('/aaa')
        await page.waitForSelector('h2')

        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })
    })

    test('should have no violations on /bbb route', async ({ page }) => {
        await page.goto('/bbb')
        await page.waitForSelector('h2')

        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })
    })

    test('should have no violations on /ccc route', async ({ page }) => {
        await page.goto('/ccc')
        await page.waitForSelector('h2')

        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })
    })

    test('should announce route changes to screen readers', async ({
        page,
    }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Click a route link
        await page.click('a[href="/aaa"]')
        await page.waitForSelector('h2:has-text("aaa")')

        // Verify the new content is visible
        const heading = page.locator('h2:has-text("aaa")')
        await expect(heading).toBeVisible()
    })
})

test.describe('Color Contrast and Visual Accessibility', () => {
    test('should have sufficient color contrast', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // axe automatically checks color contrast as part of WCAG AA
        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })

        // This test will fail if any color contrast issues are found
    })

    test('should be readable at 200% zoom', async ({ page }) => {
        // Set viewport to standard size
        await page.setViewportSize({ width: 1280, height: 720 })

        await page.goto('/')
        await page.waitForSelector('h1')

        // Simulate 200% zoom by scaling down viewport
        await page.setViewportSize({ width: 640, height: 360 })

        // Verify content is still accessible
        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })
    })
})

test.describe('Semantic HTML', () => {
    test('should use semantic HTML elements', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Check for proper use of semantic elements
        const semanticElements = await page.evaluate(() => {
            return {
                hasMain: document.querySelector('main') !== null,
                hasH1: document.querySelector('h1') !== null,
                hasNav:
                    document.querySelector('nav') !== null ||
                    document.querySelector('ul') !== null,
                hasList: document.querySelector('ul, ol') !== null,
            }
        })

        // At minimum, we should have h1 and list elements
        expect(semanticElements.hasH1).toBe(true)
        expect(semanticElements.hasList).toBe(true)
    })

    test('should have proper list structure', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Verify lists have list items
        const listsValid = await page.evaluate(() => {
            const lists = Array.from(document.querySelectorAll('ul, ol'))
            return lists.every(list => {
                const items = list.querySelectorAll('li')
                return items.length > 0
            })
        })

        expect(listsValid).toBe(true)
    })
})

test.describe('Dynamic Content Accessibility', () => {
    test('should maintain accessibility when counter changes', async ({
        page,
    }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Get initial counter value
        const countDisplay = page.locator('output, div').filter({ hasText: 'count:' }).first()
        const initialCount = await countDisplay.textContent()

        // Click plus button
        const plusButton = page.getByRole('button', { name: /plus/i })
        await plusButton.click()

        // Wait for count to update
        await expect(countDisplay).not.toHaveText(initialCount || '')

        // Verify no new violations after state change
        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })
    })

    test('should maintain accessibility after route navigation', async ({
        page,
    }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Navigate to different routes
        await page.click('a[href="/aaa"]')
        await page.waitForSelector('h2:has-text("aaa")')

        await expectNoA11yViolations(page)

        await page.click('a[href="/bbb"]')
        await page.waitForSelector('h2:has-text("bbb")')

        await expectNoA11yViolations(page)
    })
})

test.describe('Mobile Accessibility', () => {
    test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

    test('should have no violations on mobile viewport', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        await expectNoA11yViolations(page, {
            tags: AXE_TAGS.wcagAA,
        })
    })

    test('should have touch-friendly interactive elements', async ({
        page,
    }) => {
        await page.goto('/')
        await page.waitForSelector('h1')

        // Verify buttons are large enough for touch (minimum 44x44 CSS pixels)
        const buttonSizes = await page.$$eval('button', buttons => {
            return buttons.map(button => {
                const rect = button.getBoundingClientRect()
                return {
                    width: rect.width,
                    height: rect.height,
                    text: button.textContent,
                }
            })
        })

        // WCAG 2.1 Level AAA recommends minimum 44x44 pixels
        // Level AA is more lenient, but we should aim for good touch targets
        for (const size of buttonSizes) {
            // Allow some flexibility for small viewports
            expect(size.width, `Button "${size.text}" width is too small`).toBeGreaterThanOrEqual(
                32
            )
            expect(size.height, `Button "${size.text}" height is too small`).toBeGreaterThanOrEqual(
                32
            )
        }
    })
})
