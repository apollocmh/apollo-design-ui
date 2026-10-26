import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/** Reject empty, clipped or inaccessible states before accepting their pixels. */
export async function prepareSpinVisual(page, variant) {
  const frame = page.locator('[data-spin-visual-case]');
  assert.equal(await frame.getAttribute('data-spin-visual-case'), variant);
  await page.locator('#spin-main').waitFor({ state: 'visible' });
  if (variant === 'native-focus') {
    await page.locator('#spin-focus-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator('#spin-draft').evaluate((node) => node === document.activeElement),
      true,
    );
    assert.notEqual(
      await page.locator('#spin-draft').evaluate((node) => getComputedStyle(node).outlineStyle),
      'none',
    );
  }
  const state = await frame.evaluate((node) => {
    const root = node.querySelector('#spin-main');
    const indicator = root.querySelector('.apollo-spin-indicator');
    const section = root.querySelector('.apollo-spin-section');
    const css = getComputedStyle(root);
    return {
      rootHeight: root.getBoundingClientRect().height,
      sectionHeight: section.getBoundingClientRect().height,
      indicatorWidth: indicator?.getBoundingClientRect().width ?? 0,
      indicatorText: indicator?.textContent ?? '',
      description: root.querySelector('.apollo-spin-description')?.textContent ?? '',
      busy: root.getAttribute('aria-busy'),
      progress: [...node.querySelectorAll('[role="progressbar"]')].map((bar) =>
        bar.getAttribute('aria-valuenow'),
      ),
      sizes: [...node.querySelectorAll('.apollo-spin-dot-holder')].map(
        (holder) => getComputedStyle(holder).fontSize,
      ),
      direction: css.direction,
      fontSize: css.fontSize,
      background: getComputedStyle(node).backgroundColor,
      width: node.clientWidth,
      scrollWidth: node.scrollWidth,
    };
  });
  assert.ok(state.rootHeight > 0 && state.width > 200);
  assert.ok(state.scrollWidth <= state.width + 1, `overflow: ${JSON.stringify(state)}`);
  assert.equal(state.busy, variant === 'fullscreen-idle' ? 'false' : 'true');
  if (variant !== 'fullscreen-idle') assert.ok(state.indicatorWidth > 0);
  if (variant === 'empty-body') assert.ok(state.rootHeight >= state.sectionHeight);
  if (variant === 'custom-indicator') {
    assert.equal(state.indicatorText, 'Current progress37%');
    assert.equal(state.description, 'Complete native content');
  }
  if (variant === 'percent') assert.deepEqual(state.progress, ['0', '37', '100']);
  if (variant === 'size') assert.deepEqual(state.sizes, ['14px', '20px', '32px']);
  if (variant === 'tokens') {
    assert.deepEqual(state.sizes, ['13px', '31px', '47px', '31px']);
    assert.equal(
      (await page.locator('#spin-token-body>.apollo-spin-section').boundingBox()).height,
      96,
    );
    assert.equal(
      (await page.locator('#spin-token-body>.apollo-spin-container').boundingBox()).height,
      200,
    );
  }
  if (variant === 'semantic') {
    assert.equal(
      await page.locator('.spin-owned-indicator').evaluate((node) => getComputedStyle(node).color),
      'rgb(139, 43, 70)',
    );
    assert.equal(await page.locator('.spin-owned-container').count(), 1);
  }
  if (variant === 'fullscreen') {
    const stage = await page.locator('#stage').boundingBox();
    const mask = await page.locator('.apollo-spin-mask').boundingBox();
    assert.ok(mask.width > 200 && mask.height > 200);
    assert.ok(
      mask.x >= stage.x - 1 &&
        mask.y >= stage.y - 1 &&
        mask.x + mask.width <= stage.x + stage.width + 1 &&
        mask.y + mask.height <= stage.y + stage.height + 1,
      'capture includes the full fixed mask',
    );
  }
  if (variant === 'fullscreen-idle') {
    assert.equal(await page.locator('.apollo-spin-mask').getAttribute('inert'), '');
    assert.equal(await page.getByRole('textbox', { name: 'Loading draft' }).isVisible(), true);
  }
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  if (variant.startsWith('theme-')) {
    assert.equal(
      state.background,
      variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
    );
    assert.equal(state.fontSize, variant.includes('compact') ? '12px' : '14px');
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) =>
    (await window.axe.run(node)).violations.map((issue) => ({
      id: issue.id,
      nodes: issue.nodes.map((item) => item.failureSummary),
    })),
  );
  assert.deepEqual(violations, [], 'actual Spin screenshot content must pass axe');
  return state;
}
