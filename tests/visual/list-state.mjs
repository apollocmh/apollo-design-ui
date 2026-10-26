import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/** Reject wrong/blank states and real accessibility failures before capture. */
export async function prepareListVisual(page, variant) {
  const frame = page.locator('[data-list-visual-case]');
  assert.equal(await frame.getAttribute('data-list-visual-case'), variant);
  await page.locator('#list-main').waitFor({ state: 'visible', timeout: 5000 });
  if (variant === 'loading-fullscreen')
    await page.locator('.apollo-spin-mask').waitFor({ state: 'visible', timeout: 5000 });
  if (variant === 'grid') {
    const expected = page.viewportSize().width < 768 ? '100%' : '33.3333%';
    await page.waitForFunction(
      (expected) =>
        document.querySelector('#list-main .apollo-list-container>div')?.style.width === expected,
      expected,
    );
  }
  if (variant === 'native-focus') {
    await page.locator('#list-focus-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator('#list-draft').evaluate((node) => node === document.activeElement),
      true,
    );
    assert.notEqual(
      await page.locator('#list-draft').evaluate((node) => getComputedStyle(node).outlineStyle),
      'none',
    );
  }
  const state = await frame.evaluate((node) => {
    const main = document.querySelector('#list-main');
    const item = main.querySelector('.apollo-list-item');
    const css = getComputedStyle(main);
    return {
      lists: node.querySelectorAll('.apollo-list').length,
      rows: main.querySelectorAll('.apollo-list-items>.apollo-list-item,.apollo-list-item-grid')
        .length,
      pagers: main.querySelectorAll('.apollo-pagination').length,
      loading: main.classList.contains('apollo-list-loading'),
      empty: main.querySelectorAll('.apollo-list-empty-text').length,
      rootExtra: main.querySelectorAll(':scope>.apollo-list-extra').length,
      foreground: css.color,
      background: getComputedStyle(node).backgroundColor,
      padding: item ? getComputedStyle(item).padding : null,
      fontSize: css.fontSize,
      direction: css.direction,
      width: node.clientWidth,
      scrollWidth: node.scrollWidth,
    };
  });
  assert.ok(state.width > 200, 'capture needs a real nonempty content region');
  assert.ok(state.scrollWidth <= state.width + 1, `horizontal overflow: ${JSON.stringify(state)}`);
  assert.equal(
    state.rows,
    variant === 'empty'
      ? 0
      : variant === 'native-focus'
        ? 1
        : variant === 'pagination'
          ? 2
          : variant === 'nested'
            ? 4
            : variant === 'grid'
              ? 6
              : 3,
  );
  assert.equal(state.pagers, variant === 'pagination' ? 2 : 0);
  assert.equal(state.loading, variant === 'loading' || variant === 'loading-fullscreen');
  assert.equal(state.empty, variant === 'empty' ? 1 : 0);
  assert.equal(
    state.rootExtra,
    ['extra', 'rtl', 'theme-dark', 'theme-compact', 'theme-dark-compact'].includes(variant) ? 1 : 0,
  );
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  if (variant === 'tokens') assert.equal(state.padding, '21px 23px');
  if (variant === 'loading-fullscreen') {
    const stageBox = await page.locator('#stage').boundingBox();
    const overlay = await page.locator('.apollo-spin-mask').boundingBox();
    const firstRow = await page.locator('#list-main .apollo-list-item').first().boundingBox();
    const heading = await frame.locator('h3').boundingBox();
    assert.ok(
      firstRow && heading && firstRow.y >= heading.y + heading.height,
      'fullscreen loading must retain rows below the heading in native document flow',
    );
    assert.ok(stageBox && overlay && overlay.width > 0 && overlay.height > 0);
    assert.ok(
      overlay.x >= stageBox.x - 1 &&
        overlay.y >= stageBox.y - 1 &&
        overlay.x + overlay.width <= stageBox.x + stageBox.width + 1 &&
        overlay.y + overlay.height <= stageBox.y + stageBox.height + 1,
      'the screenshot must include the complete fullscreen loading state',
    );
  }
  if (variant.startsWith('theme-')) {
    const dark = variant.includes('dark');
    assert.equal(state.background, dark ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)');
    assert.equal(state.fontSize, variant.includes('compact') ? '12px' : '14px');
    assert.equal(state.padding, variant.includes('compact') ? '8px 16px' : '12px 24px');
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) => {
    const result = await window.axe.run(node);
    return result.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
    }));
  });
  assert.deepEqual(violations, [], 'actual List screenshot content must pass axe');
  return state;
}
