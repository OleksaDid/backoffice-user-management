import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** NFR-25: no serious or critical axe violations against WCAG 2.2 A/AA rules. */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`);
  expect(blocking, 'accessibility violations').toEqual([]);
}
