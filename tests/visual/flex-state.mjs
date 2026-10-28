import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareFlexVisual(page, variant) {
  const stage = page.locator('#stage');
  assert.ok(await stage.locator('.apollo-flex').count());
  if (variant === 'current-provider') {
    const draft = stage.locator('#flex-provider-draft'),
      original = await draft.elementHandle();
    await draft.fill('Preserved draft');
    await draft.focus();
    await draft.evaluate((n) => n.setSelectionRange(2, 7));
    await page.evaluate(() => window.flexVisual.next());
    assert.equal(
      await draft.evaluate(
        (n, o) =>
          n === o &&
          n === document.activeElement &&
          n.value === 'Preserved draft' &&
          n.selectionStart === 2 &&
          n.selectionEnd === 7,
        original,
      ),
      true,
    );
    assert.equal(await page.evaluate(() => window.flexVisual.snapshot()), true);
    assert.equal(await stage.locator('.flex-after').count(), 1);
    assert.equal(
      await stage.locator('#flex-provider-owner').evaluate((n) => getComputedStyle(n).direction),
      'rtl',
    );
  }
  if (variant === 'empty-host') {
    const button = stage.locator('#flex-empty-button');
    assert.equal(await button.isVisible(), true);
    await button.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.flexEmptySnapshot()), 1);
  }
  if (variant === 'native-focus') {
    await stage.locator('#flex-focus-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await stage
        .locator('#flex-focus-input')
        .evaluate((n) => n === document.activeElement && n.matches(':focus-visible')),
      true,
    );
  }
  if (variant === 'custom-component')
    assert.equal(await stage.locator('.apollo-flex').evaluate((n) => n.tagName), 'ARTICLE');
  if (variant === 'complete-content')
    assert.ok((await stage.textContent()).includes('Complete text 0fragment tail'));
  if (variant === 'default-and-stretch') {
    const roots = stage.locator('.apollo-flex');
    assert.equal(await roots.nth(0).evaluate((n) => getComputedStyle(n).alignItems), 'flex-start');
    assert.equal(await roots.nth(1).evaluate((n) => getComputedStyle(n).alignItems), 'stretch');
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  assert.deepEqual(
    await stage.evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    ),
    [],
  );
  const state = await stage.evaluate((n) => ({
    roots: n.querySelectorAll('.apollo-flex').length,
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
    invalidText: /NaN|\[object Object\]/.test(n.textContent),
  }));
  assert.equal(state.invalidText, false);
  assert.ok(state.scrollWidth <= state.width + 1, JSON.stringify(state));
  return state;
}
