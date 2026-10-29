import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
export async function prepareTagVisual(page, variant) {
  const frame = page.locator('[data-tag-visual-case]');
  assert.equal(await frame.getAttribute('data-tag-visual-case'), variant);
  if (variant === 'current-provider') {
    const editor = page.locator('#tag-draft');
    await editor.fill('Saved draft');
    const old = await editor.elementHandle();
    await page.evaluate(() => window.tagVisual.update());
    assert.equal(
      await old.evaluate(
        (n) =>
          n === document.getElementById('tag-draft') &&
          n.isConnected &&
          n === document.activeElement &&
          n.selectionStart === n.value.length &&
          n.selectionEnd === n.value.length,
      ),
      true,
    );
    assert.equal(await editor.inputValue(), 'Saved draft');
    assert.ok((await page.locator('#tag-main').getAttribute('class')).includes('provider-current'));
  }
  if (['close-action', 'close-canceled'].includes(variant)) {
    const root = page.locator('#tag-main'),
      glyph = page.locator('[data-tag-glyph]');
    assert.equal(await glyph.getAttribute('role'), 'img');
    await root.getByRole('button', { name: 'Close', exact: true }).click();
    assert.equal((await page.evaluate(() => window.tagVisual.snapshot())).closes, 1);
    assert.equal(
      (await root.getAttribute('class')).includes('apollo-tag-hidden'),
      variant === 'close-action',
    );
    assert.equal(await root.count(), 1);
  }
  if (variant === 'checkable') {
    await page.locator('#tag-choice').focus();
    await page.keyboard.press(' ');
    assert.equal((await page.evaluate(() => window.tagVisual.snapshot())).checked, true);
  }
  if (variant === 'group-models') {
    await page
      .getByRole('group', { name: 'Single interest', exact: true })
      .getByRole('checkbox', { name: 'Music', exact: true })
      .click();
    await page
      .getByRole('group', { name: 'Multiple interests', exact: true })
      .getByRole('checkbox', { name: 'Books', exact: true })
      .click();
    const state = await page.evaluate(() => window.tagVisual.snapshot());
    assert.equal(state.single, 'Music');
    assert.deepEqual(state.multiple, ['Movies', 'Books']);
  }
  if (variant === 'native-focus') {
    await page.locator('#tag-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .getByRole('link', { name: 'Focus link', exact: true })
        .evaluate((n) => n === document.activeElement),
      true,
    );
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .getByRole('button', { name: 'Close', exact: true })
        .evaluate(
          (n) => n === document.activeElement && getComputedStyle(n).outlineStyle !== 'none',
        ),
      true,
    );
  }
  const state = await frame.evaluate((n) => ({
    roots: n.querySelectorAll('.apollo-tag').length,
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
    background: getComputedStyle(n).backgroundColor,
    complete: n.querySelector('#tag-draft')?.value ?? null,
  }));
  assert.ok(state.roots > 0);
  assert.ok(
    state.width > 200 && state.scrollWidth <= state.width + 1,
    'content fits the actual viewport',
  );
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  if (['complete-content', 'semantic', 'current-provider', 'rtl'].includes(variant)) {
    assert.ok((await page.locator('#tag-main .apollo-tag-icon').textContent()).includes('Itail'));
    assert.ok(
      (await page.locator('#tag-main .apollo-tag-content').textContent()).includes('Tail0'),
    );
    assert.equal(await page.locator('#tag-main button').evaluate((n) => n.tagName), 'BUTTON');
  }
  if (variant === 'rtl') assert.equal(await page.locator('#tag-main').getAttribute('dir'), 'rtl');
  if (variant === 'semantic')
    for (const region of ['root', 'icon', 'content', 'close'])
      assert.equal(await page.locator(`.tag-owned-${region}`).count(), 1);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(violations, [], 'actual Tag state must pass axe');
  return state;
}
