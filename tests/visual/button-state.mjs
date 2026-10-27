import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareButtonVisual(page, variant) {
  const root = page.locator('#stage');
  if (variant !== 'type')
    assert.equal(await root.locator('main').getAttribute('data-button-visual-case'), variant);
  if (variant === 'native-focus') {
    await page.locator('#button-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator('#button-focus').evaluate((n) => document.activeElement === n),
      true,
    );
    assert.notEqual(
      await page.locator('#button-focus').evaluate((n) => getComputedStyle(n).outlineStyle),
      'none',
    );
  }
  const state = await root.evaluate((n) => ({
    buttons: n.querySelectorAll('.apollo-btn').length,
    contentHosts: n.querySelectorAll('.apollo-btn-content').length,
    busy: n.querySelectorAll('[aria-busy="true"]').length,
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
    direction: getComputedStyle(n.querySelector('.apollo-btn')).direction,
  }));
  assert.ok(state.buttons > 0 && state.width > 200 && state.scrollWidth <= state.width + 1);
  assert.ok(state.contentHosts > 0);
  if (variant === 'loading-states') assert.equal(state.busy, 3);
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const issues = await root.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(issues, [], 'actual Button pixels and content must pass axe');
  return state;
}
