import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
export async function prepareStatisticVisual(page, variant) {
  const frame = page.locator('[data-statistic-visual-case]');
  assert.equal(await frame.getAttribute('data-statistic-visual-case'), variant);
  await page.locator('#stat-main').waitFor({ state: 'visible' });
  if (variant === 'native-focus') {
    await page.locator('#stat-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator('#stat-focus-draft').evaluate((n) => n === document.activeElement),
      true,
    );
    assert.notEqual(
      await page.locator('#stat-focus-draft').evaluate((n) => getComputedStyle(n).outlineStyle),
      'none',
    );
  }
  const state = await frame.evaluate((n) => {
    const root = n.querySelector('#stat-main'),
      title = root.querySelector('.apollo-statistic-title'),
      content = root.querySelector('.apollo-statistic-content'),
      value = root.querySelector('.apollo-statistic-content-value');
    return {
      roots: n.querySelectorAll('.apollo-statistic').length,
      title: title?.textContent ?? null,
      titleFont: title ? getComputedStyle(title).fontSize : null,
      contentFont: content ? getComputedStyle(content).fontSize : null,
      text: value?.textContent ?? null,
      inputs: root.querySelectorAll('input').length,
      loading: !!root.querySelector('.apollo-skeleton'),
      prefix: root.querySelector('.apollo-statistic-content-prefix')?.textContent ?? null,
      suffix: root.querySelector('.apollo-statistic-content-suffix')?.textContent ?? null,
      background: getComputedStyle(n).backgroundColor,
      width: n.clientWidth,
      scrollWidth: n.scrollWidth,
      rootWidth: root.getBoundingClientRect().width,
    };
  });
  assert.equal(state.roots, 1);
  assert.ok(state.width > 200 && state.scrollWidth <= state.width + 1);
  assert.ok(state.rootWidth > 200);
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  assert.equal(state.loading, variant === 'loading');
  assert.equal(state.inputs, ['value-content', 'native-focus'].includes(variant) ? 1 : 0);
  assert.equal(state.prefix, variant === 'units' ? '↑' : null);
  assert.equal(state.suffix, variant === 'units' ? '%' : null);
  if (variant === 'empty-slot') {
    assert.equal(state.title, null);
    assert.equal(state.text, '');
  } else {
    assert.equal(
      state.titleFont,
      variant === 'tokens' ? '18px' : variant.includes('compact') ? '12px' : '14px',
    );
    if (variant !== 'loading') {
      assert.equal(
        state.contentFont,
        variant === 'tokens' ? '42px' : variant.includes('compact') ? '20px' : '24px',
      );
      assert.equal(
        state.text,
        variant.startsWith('timer-') || variant === 'native-focus' ? '2 days' : '112,893.25',
      );
    } else assert.equal(state.text, null);
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const issues = await frame.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(issues, [], 'actual statistic content must pass axe');
  return state;
}
