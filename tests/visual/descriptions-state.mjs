import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareDescriptionsVisual(page, variant) {
  const frame = page.locator('[data-descriptions-visual]');
  assert.equal(await frame.getAttribute('data-descriptions-visual'), variant);
  if (variant === 'current-geometry' || variant === 'current-provider') {
    const editor = frame.locator('#descriptions-editor'),
      original = await editor.elementHandle();
    await editor.fill('Saved business draft');
    await editor.focus();
    await editor.evaluate((n) => n.setSelectionRange(2, 6));
    for (let i = 0; i < (variant === 'current-geometry' ? 3 : 1); i++) {
      await page.evaluate(() => window.descriptionsVisual.next());
      assert.equal(
        await editor.evaluate(
          (n, old) =>
            n === old &&
            document.activeElement === n &&
            n.value === 'Saved business draft' &&
            n.selectionStart === 2 &&
            n.selectionEnd === 6,
          original,
        ),
        true,
      );
    }
    assert.deepEqual(await page.evaluate(() => window.descriptionsVisual.snapshot()), {
      root: true,
    });
    if (variant === 'current-provider') {
      assert.equal(await frame.locator('.descriptions-provider-current').count(), 1);
      assert.equal(await frame.locator('.descriptions-label-small').count(), 3);
      assert.equal(
        await frame.locator('.apollo-descriptions').evaluate((n) => getComputedStyle(n).direction),
        'rtl',
      );
      assert.equal(
        await frame
          .locator('.apollo-descriptions-header')
          .evaluate((n) => getComputedStyle(n).marginBottom),
        '31px',
      );
    }
  }
  if (variant === 'native-focus') {
    await frame.locator('#descriptions-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await frame
        .locator('#descriptions-editor')
        .evaluate(
          (n) =>
            n === document.activeElement &&
            n.matches(':focus-visible') &&
            getComputedStyle(n).outlineStyle !== 'none',
        ),
      true,
    );
  }
  const state = await frame.evaluate((n) => ({
    roots: n.querySelectorAll('.apollo-descriptions').length,
    lists: n.querySelectorAll('dl').length,
    items: n.querySelectorAll('dl > div').length,
    labels: n.querySelectorAll('dl > div > dt').length,
    contents: n.querySelectorAll('dl > div > dd').length,
    text: n.textContent,
    headers: n.querySelectorAll('.apollo-descriptions-header').length,
    inputs: n.querySelectorAll('input').length,
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
    background: getComputedStyle(n).backgroundColor,
    itemOverflow: [...n.querySelectorAll('dl > div > dt,dl > div > dd')].filter(
      (node) => node.scrollWidth > node.clientWidth + 1,
    ).length,
  }));
  assert.ok(state.roots > 0 && state.items > 0);
  assert.equal(state.roots, state.lists);
  assert.equal(state.items, state.labels);
  assert.equal(state.items, state.contents);
  assert.equal(/NaN|\[object Object\]/.test(state.text), false);
  assert.ok(state.width > 200 && state.scrollWidth <= state.width + 1, JSON.stringify(state));
  assert.equal(state.itemOverflow, 0, 'Native fields fit their allocated columns');
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  if (variant === 'empty-slots') {
    assert.equal(state.headers, 0);
    assert.equal(state.text.includes('Suppressed'), false);
    assert.ok(state.text.includes('Unlabelled value0') && state.text.includes('Zero0'));
  }
  if (variant === 'complete-content' || variant === 'current-provider') {
    assert.ok(
      state.text.includes('Native title0') &&
        state.text.includes('Complete content0') &&
        state.text.includes('Extra tail'),
    );
  }
  if (variant === 'sizes') assert.equal(state.roots, 3);
  if (variant === 'nested') assert.equal(state.roots, 2);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const issues = await frame.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((node) => node.failureSummary),
    })),
  );
  assert.deepEqual(issues, [], 'Actual Descriptions visual state passes axe');
  return state;
}
