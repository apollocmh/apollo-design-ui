import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareDividerVisual(page, variant) {
  const frame = page.locator('[data-divider-visual]');
  assert.equal(await frame.getAttribute('data-divider-visual'), variant);
  if (variant === 'current-provider') {
    const input = page.locator('#divider-draft');
    await input.fill('Saved section draft');
    await input.focus();
    const original = await input.elementHandle();
    await page.evaluate(() => window.dividerVisual.update());
    assert.equal(
      await input.evaluate(
        (node, before) =>
          node === before &&
          node.value === 'Saved section draft' &&
          node === document.activeElement,
        original,
      ),
      true,
    );
    assert.equal(
      await page
        .locator('#divider-current')
        .evaluate(
          (node) =>
            node.classList.contains('provider-current') &&
            getComputedStyle(node).direction === 'rtl',
        ),
      true,
    );
    assert.equal(
      await page
        .locator('#divider-current .apollo-divider-inner-text')
        .evaluate((node) => getComputedStyle(node).paddingInlineStart),
      '20px',
    );
  }
  if (variant === 'native-focus') {
    await page.locator('#divider-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator('#divider-focus').evaluate((node) => node === document.activeElement),
      true,
    );
  }
  if (variant === 'semantic-tokens') {
    assert.equal(
      await page
        .locator('#divider-token .apollo-divider-inner-text')
        .evaluate((node) => getComputedStyle(node).paddingInlineStart),
      '24px',
    );
    assert.equal(
      await page
        .locator('#divider-token-vertical')
        .evaluate((node) => getComputedStyle(node).marginInlineStart),
      '20px',
    );
  }
  const state = await frame.evaluate((node) => ({
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
    background: getComputedStyle(node).backgroundColor,
    groups: node.querySelectorAll('.apollo-divider[role="group"]').length,
    separators: node.querySelectorAll('[role="separator"]').length,
    vertical: [...node.querySelectorAll('.apollo-divider-vertical')].map((line) => ({
      axis: line.getAttribute('aria-orientation'),
      height: line.getBoundingClientRect().height,
    })),
    direction: getComputedStyle(node.querySelector('.apollo-divider')).direction,
  }));
  assert.ok(
    state.width > 200 && state.scrollWidth <= state.width + 1,
    'Divider content fits its actual viewport',
  );
  assert.ok(state.separators > 0);
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  for (const vertical of state.vertical) {
    assert.equal(vertical.axis, 'vertical');
    assert.ok(vertical.height > 0);
  }
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) =>
    (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((item) => item.target),
    })),
  );
  assert.deepEqual(violations, [], `Divider ${variant} has accessible real content`);
  return state;
}
