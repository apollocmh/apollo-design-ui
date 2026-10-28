import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
export async function prepareTypographyVisual(page, variant) {
  const stage = page.locator('#stage');
  assert.ok(await stage.locator('.apollo-typography').count());
  if (variant === 'copy-feedback') {
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.typographyVisualCopied = text;
          },
        },
      }),
    );
    const copy = stage.locator('.apollo-typography-copy').first();
    await copy.hover();
    const tooltip = page.getByRole('tooltip');
    await tooltip.waitFor({ state: 'visible' });
    assert.equal(await tooltip.textContent(), 'Copy the payload');
    await copy.click();
    await page.waitForFunction(() =>
      Boolean(document.querySelector('.apollo-typography-copy-success')),
    );
    assert.equal(await page.evaluate(() => window.typographyVisualCopied), 'Clipboard payload');
    await copy.evaluate((n) => n.blur());
    await page.mouse.move(0, 0);
    await tooltip.waitFor({ state: 'hidden' });
  }
  if (variant === 'current-provider') {
    const input = stage.locator('#typography-provider-draft');
    const old = await input.elementHandle();
    await input.fill('Current draft');
    await input.focus();
    await page.evaluate(() => window.typographyVisual.next());
    assert.equal(
      await input.evaluate((n, old) => n === old && document.activeElement === n, old),
      true,
    );
    assert.equal(await input.inputValue(), 'Current draft');
    assert.ok(await stage.locator('.visual-current-provider').count());
  }
  if (variant === 'native-focus') {
    await page.locator('#typography-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await stage
        .locator('#typography-focus .apollo-typography-edit')
        .evaluate((n) => n === document.activeElement && n.matches(':focus-visible')),
      true,
    );
  }
  if (variant === 'native-editing') {
    const geometry = await stage.locator('textarea').evaluateAll((nodes) =>
      nodes.map((n) => ({
        name: n.getAttribute('aria-label'),
        width: n.getBoundingClientRect().width,
        rootWidth: n.parentElement.getBoundingClientRect().width,
        clientHeight: n.clientHeight,
        lineHeight: parseFloat(getComputedStyle(n).lineHeight),
      })),
    );
    assert.equal(geometry.length, 5);
    assert.deepEqual(
      geometry.filter(
        (n) => Math.abs(n.width - n.rootWidth) > 1 || n.clientHeight + 1 < n.lineHeight,
      ),
      [],
    );
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await stage.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(violations, []);
  if (variant === 'copy-feedback')
    assert.equal(await stage.locator('.apollo-typography-copy-success').count(), 1);
  const state = await stage.evaluate((n) => ({
    roots: n.querySelectorAll('.apollo-typography').length,
    editors: n.querySelectorAll('textarea').length,
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
  }));
  assert.ok(state.scrollWidth <= state.width + 1, JSON.stringify(state));
  return state;
}
