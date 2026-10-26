import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/** Verify real graphic geometry and accessible content before pixel acceptance. */
export async function prepareQRCodeVisual(page, variant) {
  const frame = page.locator('[data-qrcode-visual-case]');
  assert.equal(await frame.getAttribute('data-qrcode-visual-case'), variant);
  await page.locator('#qr-main').waitFor({ state: 'visible' });
  if (variant === 'icon')
    await page.waitForFunction(() => {
      const image = document.querySelector('#qr-main img');
      return image.complete && image.naturalWidth > 0;
    });
  if (variant === 'native-focus') {
    await page.locator('#qr-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator('#qr-focus-draft').evaluate((node) => node === document.activeElement),
      true,
    );
    assert.notEqual(
      await page.locator('#qr-focus-draft').evaluate((node) => getComputedStyle(node).outlineStyle),
      'none',
    );
  }
  const state = await frame.evaluate((node) => {
    const root = node.querySelector('#qr-main'),
      graphic = root.querySelector(':scope>canvas,:scope>svg'),
      cover = root.querySelector('.apollo-qrcode-cover');
    const css = getComputedStyle(root),
      box = root.getBoundingClientRect(),
      g = graphic.getBoundingClientRect();
    return {
      graphics: node.querySelectorAll('.apollo-qrcode>[role="img"]').length,
      mode: graphic.tagName.toLowerCase(),
      name: graphic.getAttribute('aria-label'),
      paper: css.backgroundColor,
      root: [box.width, box.height],
      graphic: [g.width, g.height],
      inner: [
        box.width -
          Number.parseFloat(css.paddingLeft) -
          Number.parseFloat(css.paddingRight) -
          Number.parseFloat(css.borderLeftWidth) -
          Number.parseFloat(css.borderRightWidth),
        box.height -
          Number.parseFloat(css.paddingTop) -
          Number.parseFloat(css.paddingBottom) -
          Number.parseFloat(css.borderTopWidth) -
          Number.parseFloat(css.borderBottomWidth),
      ],
      cover: !!cover,
      coverColor: cover ? getComputedStyle(cover).backgroundColor : null,
      refreshButtons: cover?.querySelectorAll('.apollo-btn').length ?? 0,
      inputs: root.querySelectorAll('input').length,
      background: getComputedStyle(node).backgroundColor,
      fontSize: css.fontSize,
      width: node.clientWidth,
      scrollWidth: node.scrollWidth,
    };
  });
  assert.ok(state.width > 200 && state.scrollWidth <= state.width + 1);
  assert.equal(state.graphics, variant === 'icon' ? 2 : 1);
  assert.equal(state.mode, variant === 'svg' ? 'svg' : 'canvas');
  assert.equal(state.name, 'Workspace access');
  assert.deepEqual(state.root, [160, 160]);
  assert.deepEqual(state.graphic, state.inner);
  assert.equal(state.paper, 'rgb(255, 255, 255)');
  assert.equal(state.cover, !['basic', 'svg', 'icon'].includes(variant));
  assert.equal(state.inputs, ['custom-status', 'native-focus'].includes(variant) ? 1 : 0);
  assert.equal(state.refreshButtons, variant === 'expired' || variant.startsWith('theme-') ? 1 : 0);
  if (variant === 'tokens') assert.equal(state.coverColor, 'rgb(232, 244, 236)');
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
  assert.deepEqual(violations, [], 'actual QRCode screenshot content must pass axe');
  return state;
}
