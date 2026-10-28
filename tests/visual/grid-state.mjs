import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareGridVisual(page, variant) {
  const stage = page.locator('#stage');
  assert.ok(await stage.locator('.apollo-row').count());
  assert.ok(await stage.locator('.apollo-col').count());
  if (variant === 'current-provider') {
    const draft = stage.locator('#grid-provider-draft'),
      previous = await draft.elementHandle();
    await draft.fill('Preserved draft');
    await draft.focus();
    await page.evaluate(() => window.gridVisual.next());
    assert.equal(
      await draft.evaluate(
        (node, previous) => node === previous && node === document.activeElement,
        previous,
      ),
      true,
    );
    assert.equal(await draft.inputValue(), 'Preserved draft');
    assert.equal(await stage.locator('.grid-provider-after').count(), 1);
    assert.deepEqual(await page.evaluate(() => window.gridVisual.snapshot()), {
      row: true,
      col: true,
    });
    assert.equal(
      await stage
        .locator('#grid-provider-row')
        .evaluate((node) => getComputedStyle(node).direction),
      'rtl',
    );
  }
  if (variant === 'native-focus') {
    await stage.locator('#grid-focus-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await stage
        .locator('#grid-focus-input')
        .evaluate((node) => node === document.activeElement && node.matches(':focus-visible')),
      true,
    );
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  assert.deepEqual(
    await stage.evaluate(async (node) =>
      (await window.axe.run(node)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    ),
    [],
  );
  const state = await stage.evaluate((node) => ({
    rows: node.querySelectorAll('.apollo-row').length,
    cols: node.querySelectorAll('.apollo-col').length,
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
    invalidText: /NaN|\[object Object\]/.test(node.textContent),
  }));
  assert.equal(state.invalidText, false);
  assert.ok(state.scrollWidth <= state.width + 1, JSON.stringify(state));
  return state;
}
