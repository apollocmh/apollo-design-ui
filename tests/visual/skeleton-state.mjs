import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { compactAlgorithm, getDesignToken } from '@apollo-design/theme';

export async function prepareSkeletonVisual(page, variant) {
  const frame = page.locator('[data-skeleton-visual-case]');
  assert.equal(await frame.getAttribute('data-skeleton-visual-case'), variant);
  if (variant === 'native-focus') {
    await page.locator('#bone-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator('#bone-focus-draft').evaluate((n) => n === document.activeElement),
      true,
    );
    assert.notEqual(
      await page.locator('#bone-focus-draft').evaluate((n) => getComputedStyle(n).outlineStyle),
      'none',
    );
  }
  const state = await frame.evaluate((n) => {
    const root = n.querySelector('#bone-main'),
      title = root?.querySelector('.apollo-skeleton-title'),
      paragraph = root?.querySelector('.apollo-skeleton-paragraph'),
      avatar = root?.querySelector('.apollo-skeleton-avatar');
    const box = root?.getBoundingClientRect();
    return {
      roots: n.querySelectorAll('.apollo-skeleton').length,
      inputs: n.querySelectorAll('input').length,
      svgs: n.querySelectorAll('svg').length,
      busy: root?.getAttribute('aria-busy') ?? null,
      hidden: root?.querySelector('.apollo-skeleton-section')?.getAttribute('aria-hidden') ?? null,
      titleHeight: title ? getComputedStyle(title).height : null,
      lineHeight: paragraph?.firstElementChild
        ? getComputedStyle(paragraph.firstElementChild).height
        : null,
      paragraphRows: paragraph?.children.length ?? 0,
      direction: root ? getComputedStyle(root).direction : null,
      rootWidth: box?.width ?? null,
      rootHeight: box?.height ?? null,
      rightAvatar: !!(
        avatar &&
        title &&
        avatar.getBoundingClientRect().x > title.getBoundingClientRect().x
      ),
      width: n.clientWidth,
      scrollWidth: n.scrollWidth,
      background: getComputedStyle(n).backgroundColor,
    };
  });
  assert.ok(state.width > 200 && state.scrollWidth <= state.width + 1);
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  const roots = { avatar: 2, elements: 6, 'image-content': 3, 'loaded-content': 0 };
  assert.equal(state.roots, roots[variant] ?? 1);
  assert.equal(
    state.inputs,
    ['loaded-content', 'image-content', 'node-content', 'native-focus'].includes(variant) ? 1 : 0,
  );
  assert.equal(state.svgs, variant === 'image-content' ? 1 : 0);
  const decorative = [
    'basic',
    'avatar',
    'paragraph',
    'tokens',
    'rtl',
    'theme-dark',
    'theme-compact',
    'theme-dark-compact',
  ].includes(variant);
  assert.equal(state.busy, decorative ? 'true' : null);
  assert.equal(state.hidden, decorative ? 'true' : null);
  if (decorative) {
    const base = getDesignToken({
      algorithm: variant.includes('compact') ? compactAlgorithm : undefined,
    });
    assert.equal(state.titleHeight, variant === 'tokens' ? '24px' : `${base.controlHeight / 2}px`);
    assert.equal(state.lineHeight, variant === 'tokens' ? '18px' : `${base.controlHeight / 2}px`);
    assert.ok(state.rootWidth > 200);
  }
  if (variant === 'rtl') {
    assert.equal(state.direction, 'rtl');
    assert.equal(state.rightAvatar, true);
  }
  if (variant === 'elements') {
    assert.equal(state.rootWidth, 40);
    assert.equal(state.rootHeight, 40);
  }
  if (variant === 'image-content') assert.equal(state.rootWidth, 96);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const issues = await frame.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(issues, [], 'actual Skeleton pixels and native content must pass axe');
  return state;
}
