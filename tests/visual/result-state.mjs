import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { compactAlgorithm, getDesignToken } from '@apollo-design/theme';
export async function prepareResultVisual(page, variant) {
  const frame = page.locator('[data-result-visual-case]');
  assert.equal(await frame.getAttribute('data-result-visual-case'), variant);
  if (variant === 'native-focus') {
    await page.locator('#result-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator('#result-icon-draft').evaluate((n) => n === document.activeElement),
      true,
    );
    assert.notEqual(
      await page.locator('#result-icon-draft').evaluate((n) => getComputedStyle(n).outlineStyle),
      'none',
    );
  }
  const state = await frame.evaluate((n) => {
    const root = n.querySelector('#result-main'),
      title = root?.querySelector('.apollo-result-title'),
      subtitle = root?.querySelector('.apollo-result-subtitle'),
      icon = root?.querySelector('.apollo-result-icon'),
      graphic = icon?.querySelector('.apollo-icon'),
      extra = root?.querySelector('.apollo-result-extra');
    const image = root?.querySelector('.apollo-result-image');
    return {
      roots: n.querySelectorAll('.apollo-result').length,
      inputs: n.querySelectorAll('input').length,
      svgs: n.querySelectorAll('svg').length,
      nativeId: root?.getAttribute('id'),
      nativeData: root?.getAttribute('data-native-result'),
      titleSize: title ? getComputedStyle(title).fontSize : null,
      subtitleSize: subtitle ? getComputedStyle(subtitle).fontSize : null,
      iconSize: graphic ? getComputedStyle(graphic).fontSize : null,
      extraMargin: extra ? getComputedStyle(extra).marginTop : null,
      imageWidth: image?.getBoundingClientRect().width ?? null,
      imageHeight: image?.getBoundingClientRect().height ?? null,
      imageHidden: image?.querySelector('svg')?.getAttribute('aria-hidden') ?? null,
      imageFocusable: image?.querySelector('svg')?.getAttribute('focusable') ?? null,
      direction: root ? getComputedStyle(root).direction : null,
      directContainers: root?.children.length,
      width: n.clientWidth,
      scrollWidth: n.scrollWidth,
      background: getComputedStyle(n).backgroundColor,
    };
  });
  assert.ok(state.width > 200 && state.scrollWidth <= state.width + 1);
  assert.equal(state.nativeId, 'result-main');
  assert.equal(state.nativeData, 'yes');
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  const pair = ['info-success', 'warning-error'].includes(variant),
    complete = ['complete-content', 'rtl', 'native-focus'].includes(variant),
    empty = variant === 'empty-slots',
    exception = variant.startsWith('exception-');
  assert.equal(state.roots, pair ? 2 : 1);
  assert.equal(state.inputs, complete ? 2 : 0);
  assert.equal(state.svgs, empty ? 0 : pair ? 2 : 1);
  if (exception) {
    assert.equal(state.imageWidth, 250);
    assert.equal(state.imageHeight, 295);
    assert.equal(state.imageHidden, 'true');
    assert.equal(state.imageFocusable, 'false');
  } else assert.equal(state.imageWidth, null);
  if (empty) assert.equal(state.directContainers, 0);
  else {
    const base = getDesignToken({
      algorithm: variant.includes('compact') ? compactAlgorithm : undefined,
    });
    assert.equal(state.titleSize, variant === 'tokens' ? '32px' : `${base.fontSizeHeading3}px`);
    assert.equal(state.subtitleSize, variant === 'tokens' ? '18px' : `${base.fontSize}px`);
    if (!exception)
      assert.equal(
        state.iconSize,
        variant === 'tokens' ? '96px' : `${base.fontSizeHeading3 * 3}px`,
      );
    assert.equal(state.extraMargin, variant === 'tokens' ? '16px' : `${base.paddingLG}px`);
  }
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const issues = await frame.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(issues, [], 'actual Result content and pixels must pass axe');
  return state;
}
