import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareBadgeVisual(page, variant) {
  const stage = page.locator('#stage');
  assert.ok(await stage.locator('.apollo-badge,.apollo-ribbon-wrapper').count());
  if (variant === 'current-provider') {
    const input = stage.locator('#badge-provider-draft'),
      previous = await input.elementHandle();
    await input.fill('Current draft');
    await input.focus();
    await page.evaluate(() => window.badgeVisual.next());
    assert.equal(
      await input.evaluate((n, old) => n === old && document.activeElement === n, previous),
      true,
    );
    assert.equal(await input.inputValue(), 'Current draft');
    assert.equal((await stage.locator('.visual-badge-after').count()) > 0, true);
    assert.deepEqual(await page.evaluate(() => window.badgeVisual.snapshot()), {
      roots: [true, true],
    });
  }
  if (variant === 'native-focus') {
    await stage.locator('#badge-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await stage
        .locator('#badge-focus')
        .evaluate((n) => n === document.activeElement && n.matches(':focus-visible')),
      true,
    );
  }
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await stage.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.failureSummary),
    })),
  );
  assert.deepEqual(violations, []);
  const state = await stage.evaluate((n) => ({
    roots: n.querySelectorAll('.apollo-badge').length,
    ribbons: n.querySelectorAll('.apollo-ribbon-wrapper').length,
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
    invalidText: /NaN|\[object Object\]/.test(n.textContent),
  }));
  assert.equal(state.invalidText, false);
  assert.ok(state.scrollWidth <= state.width + 1, JSON.stringify(state));
  return state;
}
