import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
export async function prepareAvatarVisual(page, variant) {
  const stage = page.locator('#stage');
  assert.ok((await stage.locator('.apollo-avatar').count()) > 0);
  if (variant === 'native-focus') {
    await page.locator('#avatar-before').focus();
    await page.keyboard.press('Tab');
    const button = stage.locator('.apollo-avatar-group-overflow');
    assert.equal(
      await button.evaluate(
        (n) => n === document.activeElement && getComputedStyle(n).outlineStyle === 'solid',
      ),
      true,
    );
    await page.keyboard.press('Enter');
    await stage.locator('.apollo-avatar-group-popover').waitFor({ state: 'visible' });
    assert.equal(await stage.locator('.apollo-avatar-group-popover .apollo-avatar').count(), 2);
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await stage.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(violations, []);
  const state = await stage.evaluate((n) => ({
    avatars: n.querySelectorAll('.apollo-avatar').length,
    hiddenText: [...n.querySelectorAll('.apollo-avatar-string')].some(
      (x) => getComputedStyle(x).opacity === '0',
    ),
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
  }));
  assert.equal(state.hiddenText, false);
  assert.ok(state.scrollWidth <= state.width + 1);
  return state;
}
