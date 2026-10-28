import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareSpaceVisual(page, variant) {
  const frame = page.locator('[data-space-visual-case]');
  assert.equal(await frame.getAttribute('data-space-visual-case'), variant);
  if (variant === 'current-provider' || variant === 'keyed-fragments') {
    const input = page.locator(variant === 'current-provider' ? '#space-draft' : '#space-draft-1');
    await input.fill('Saved business draft');
    await input.focus();
    const original = await input.elementHandle();
    await page.evaluate(() => window.spaceVisual.update());
    assert.equal(
      await input.evaluate(
        (node, before) =>
          node === before &&
          node.value === 'Saved business draft' &&
          document.activeElement === node,
        original,
      ),
      true,
    );
    if (variant === 'current-provider')
      assert.equal(
        await page.locator('#space-main').evaluate((node) => getComputedStyle(node).columnGap),
        '20px',
      );
  }
  if (variant === 'native-focus') {
    await page.locator('#space-before').focus();
    const unfocusedBorder = await page
      .locator('#space-draft')
      .evaluate((node) => getComputedStyle(node).borderColor);
    await page.keyboard.press('Tab');
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    const focus = await page.locator('#space-draft').evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        focused: node === document.activeElement,
        tag: node.tagName,
        className: node.className,
        shadow: style.boxShadow,
        outline: style.outlineStyle,
        border: style.borderColor,
        activeBorder: style.getPropertyValue('--apollo-input-active-border-color').trim(),
      };
    });
    assert.equal(focus.focused, true, JSON.stringify(focus));
    assert.notEqual(focus.border, unfocusedBorder, 'The native input paints its focus border');
  }
  const state = await frame.evaluate((node) => ({
    case: node.getAttribute('data-space-visual-case'),
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
    spaces: node.querySelectorAll('.apollo-space').length,
    compact: node.querySelectorAll('.apollo-space-compact').length,
    addon: node.querySelectorAll('.apollo-space-addon').length,
    separators: node.querySelectorAll('.apollo-space-item-separator').length,
    background: getComputedStyle(node).backgroundColor,
    direction: node.querySelector('.apollo-space,.apollo-space-compact')
      ? getComputedStyle(node.querySelector('.apollo-space,.apollo-space-compact')).direction
      : null,
  }));
  assert.ok(state.spaces + state.compact > 0);
  assert.ok(
    state.width > 200 && state.scrollWidth <= state.width + 1,
    'Space business content fits the viewport',
  );
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  if (variant === 'empty-slot') assert.equal(state.separators, 0);
  if (variant === 'separator-data') assert.equal(state.separators, 2);
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  if (variant === 'addon-single') {
    const radius = await frame.locator('.apollo-space-addon').evaluate((node) => {
      const style = getComputedStyle(node);
      return [
        style.borderStartStartRadius,
        style.borderStartEndRadius,
        style.borderEndStartRadius,
        style.borderEndEndRadius,
      ];
    });
    assert.deepEqual(radius, ['6px', '6px', '6px', '6px']);
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) =>
    (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((item) => item.target),
    })),
  );
  assert.deepEqual(violations, [], `Space ${variant} has real accessible content`);
  return state;
}
