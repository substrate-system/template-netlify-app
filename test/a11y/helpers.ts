import { Page, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { AxeResults, Result as AxeResult, ImpactValue } from 'axe-core'

/**
 * Default axe configuration for WCAG 2.1 Level AA compliance
 * This is what most organizations should target
 */
export const DEFAULT_AXE_CONFIG = {
    rules: {
        // Disable color-contrast temporarily if your design is still in progress
        // 'color-contrast': { enabled: false },
    },
}

/**
 * WCAG conformance levels
 * - A: Minimum level of conformance
 * - AA: Mid-range level (most common target for websites)
 * - AAA: Highest level of conformance
 */
export const WCAG_TAGS = {
    A: ['wcag2a', 'wcag21a'],
    AA: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    AAA: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa'],
}

/**
 * Common axe rule tags for different testing scenarios
 */
export const AXE_TAGS = {
    bestPractice: ['best-practice'],
    experimental: ['experimental'],
    wcagAA: WCAG_TAGS.AA,
    wcagAAA: WCAG_TAGS.AAA,
}

/**
 * Run axe accessibility scan on a page
 *
 * @param page - Playwright page object
 * @param options - Optional configuration
 * @returns Axe results
 */
export async function scanPage (
    page: Page,
    options?: {
        /**
         * CSS selector to limit scanning to a specific region
         * Useful for component-level testing
         */
        include?: string[]
        /**
         * CSS selectors to exclude from scanning
         * Useful for third-party widgets or known issues
         */
        exclude?: string[]
        /**
         * Tags to filter which rules to run
         * e.g., ['wcag2a', 'wcag2aa'] for WCAG 2.0 Level AA
         */
        tags?: string[]
        /**
         * Disable specific rules by ID
         */
        disableRules?: string[]
    }
): Promise<AxeResults> {
    let builder = new AxeBuilder({ page })

    if (options?.include) {
        builder = builder.include(options.include)
    }

    if (options?.exclude) {
        builder = builder.exclude(options.exclude)
    }

    if (options?.tags) {
        builder = builder.withTags(options.tags)
    }

    if (options?.disableRules) {
        builder = builder.disableRules(options.disableRules)
    }

    return await builder.analyze()
}

/**
 * Assert that a page has no accessibility violations
 * This is the primary assertion you'll use in most tests
 *
 * @param page - Playwright page object
 * @param options - Optional configuration
 */
export async function expectNoA11yViolations (
    page: Page,
    options?: Parameters<typeof scanPage>[1]
): Promise<void> {
    const results = await scanPage(page, options)

    // If there are violations, format them nicely for the error message
    if (results.violations.length > 0) {
        const violationMessages = formatViolations(results.violations)
        expect(
            results.violations,
            `Expected no accessibility violations but found ${results.violations.length}:\n\n${violationMessages}`
        ).toHaveLength(0)
    }
}

/**
 * Check for specific accessibility issue types
 * Useful when you want to verify specific WCAG criteria
 *
 * @param page - Playwright page object
 * @param ruleIds - Specific axe rule IDs to check
 */
export async function checkSpecificRules (
    page: Page,
    ruleIds: string[]
): Promise<AxeResults> {
    const builder = new AxeBuilder({ page })
    return await builder.withRules(ruleIds).analyze()
}

/**
 * Format violation results into a readable string for test output
 */
export function formatViolations (violations: AxeResults['violations']): string {
    return violations
        .map((violation, index) => {
            const nodeMessages = violation.nodes
                .map((node) => {
                    const selector = node.target.join(', ')
                    return `    Target: ${selector}\n    ${node.failureSummary}`
                })
                .join('\n\n')

            return `${index + 1}. [${violation.impact}] ${violation.id}: ${violation.help}
   ${violation.helpUrl}

   Found in ${violation.nodes.length} location(s):
${nodeMessages}`
        })
        .join('\n\n')
}

/**
 * Get all violations grouped by impact level
 * Useful for reporting or when you want to handle different severity levels differently
 */
export function groupViolationsByImpact (
    violations: AxeResults['violations']
): Record<ImpactValue, AxeResults['violations']> {
    const grouped: Record<string, AxeResults['violations']> = {
        critical: [],
        serious: [],
        moderate: [],
        minor: [],
    }

    violations.forEach(violation => {
        if (violation.impact) {
            grouped[violation.impact].push(violation)
        }
    })

    return grouped as Record<ImpactValue, AxeResults['violations']>
}

/**
 * Test keyboard navigation for a sequence of interactive elements
 * Verifies that Tab key moves focus in the expected order
 *
 * @param page - Playwright page object
 * @param selectors - Array of CSS selectors in expected focus order
 */
export async function testKeyboardNavigation (
    page: Page,
    selectors: string[]
): Promise<void> {
    for (const selector of selectors) {
        await page.keyboard.press('Tab')
        const focusedElement = await page.evaluate(() => {
            const el = document.activeElement
            return {
                tagName: el?.tagName,
                id: (el as HTMLElement)?.id,
                className: (el as HTMLElement)?.className,
            }
        })

        // Verify the focused element matches the expected selector
        const element = page.locator(selector)
        await expect(element).toBeFocused()
    }
}

/**
 * Test that an element is properly labeled for screen readers
 * Checks for aria-label, aria-labelledby, or associated <label>
 *
 * @param page - Playwright page object
 * @param selector - CSS selector for the element
 */
export async function expectProperLabel (
    page: Page,
    selector: string
): Promise<void> {
    const element = page.locator(selector)

    const labelInfo = await element.evaluate((el: HTMLElement) => {
        // Check for aria-label
        if (el.getAttribute('aria-label')) {
            return { type: 'aria-label', value: el.getAttribute('aria-label') }
        }

        // Check for aria-labelledby
        const labelledBy = el.getAttribute('aria-labelledby')
        if (labelledBy) {
            const labelEl = document.getElementById(labelledBy)
            return { type: 'aria-labelledby', value: labelEl?.textContent }
        }

        // Check for associated label element (for form inputs)
        if (el.id) {
            const label = document.querySelector(`label[for="${el.id}"]`)
            if (label) {
                return { type: 'label', value: label.textContent }
            }
        }

        // Check if wrapped in a label
        const parentLabel = el.closest('label')
        if (parentLabel) {
            return { type: 'label-wrap', value: parentLabel.textContent }
        }

        return { type: 'none', value: null }
    })

    expect(
        labelInfo.type,
        `Element ${selector} has no accessible label. Found: ${JSON.stringify(labelInfo)}`
    ).not.toBe('none')

    expect(
        labelInfo.value,
        `Element ${selector} has an empty label`
    ).toBeTruthy()
}

/**
 * Check that sufficient color contrast exists between text and background
 * Note: This is also checked by axe, but this helper can be used for
 * specific elements when needed
 *
 * @param page - Playwright page object
 * @param selector - CSS selector for the text element
 * @param expectedRatio - Minimum contrast ratio (4.5:1 for normal text, 3:1 for large text)
 */
export async function checkColorContrast (
    page: Page,
    selector: string,
    expectedRatio: number = 4.5
): Promise<void> {
    // Run axe specifically for color-contrast on this element
    const results = await new AxeBuilder({ page })
        .include([selector])
        .withRules(['color-contrast'])
        .analyze()

    if (results.violations.length > 0) {
        const violation = results.violations[0]
        throw new Error(
            `Color contrast violation on ${selector}: ${violation.help}\n${violation.helpUrl}`
        )
    }
}

/**
 * Verify that all images have appropriate alt text
 *
 * @param page - Playwright page object
 */
export async function checkImageAltText (page: Page): Promise<void> {
    const results = await new AxeBuilder({ page })
        .withRules(['image-alt'])
        .analyze()

    expect(
        results.violations,
        `Found images without alt text:\n${formatViolations(results.violations)}`
    ).toHaveLength(0)
}

/**
 * Check that the page has proper heading structure (h1-h6)
 * Ensures headings are in logical order and no levels are skipped
 *
 * @param page - Playwright page object
 */
export async function checkHeadingStructure (page: Page): Promise<void> {
    const headings = await page.evaluate(() => {
        const headingElements = Array.from(
            document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        )
        return headingElements.map(h => ({
            level: parseInt(h.tagName[1]),
            text: h.textContent?.trim(),
        }))
    })

    // Check that there's exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length
    expect(h1Count, 'Page should have exactly one h1 element').toBe(1)

    // Check that heading levels don't skip (e.g., h2 -> h4)
    for (let i = 1; i < headings.length; i++) {
        const current = headings[i].level
        const previous = headings[i - 1].level
        const diff = current - previous

        if (diff > 1) {
            throw new Error(
                `Heading level skip detected: ${previous} -> ${current} (${headings[i - 1].text} -> ${headings[i].text})`
            )
        }
    }
}

/**
 * Verify ARIA attributes are used correctly
 * Focuses on common ARIA violations
 *
 * @param page - Playwright page object
 */
export async function checkARIAUsage (page: Page): Promise<void> {
    const results = await new AxeBuilder({ page })
        .withTags(['cat.aria'])
        .analyze()

    expect(
        results.violations,
        `Found ARIA violations:\n${formatViolations(results.violations)}`
    ).toHaveLength(0)
}
