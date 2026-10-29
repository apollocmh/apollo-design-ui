import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareConfigProviderVisual(page, variant) {
  const frame = page.locator('[data-config-visual]');
  assert.equal(await frame.getAttribute('data-config-visual'), variant);
  if (variant === 'current-provider') {
    const input = page.locator('#config-draft');
    const before = await input.evaluate((node) => node.getBoundingClientRect().height);
    await input.fill('Saved provider draft');
    await input.focus();
    await input.evaluate((node) => node.setSelectionRange(2, 7));
    const original = await input.elementHandle();
    await page.evaluate(() => window.configVisual.update());
    const current = await input.evaluate(
      (node, old) => ({
        retained:
          node === old &&
          node.value === 'Saved provider draft' &&
          node === document.activeElement &&
          node.selectionStart === 2 &&
          node.selectionEnd === 7,
        height: node.getBoundingClientRect().height,
        direction: getComputedStyle(node).direction,
        current: node.classList.contains('config-current'),
      }),
      original,
    );
    assert.ok(current.retained && current.current && current.height > before);
    assert.equal(current.direction, 'rtl');
    assert.match(await frame.locator('.apollo-empty-description').textContent(), /暂无数据/);
  }
  if (variant === 'locale') {
    assert.match(
      await page.locator('#config-english .apollo-empty-description').textContent(),
      /No data/,
    );
    assert.match(
      await page.locator('#config-chinese .apollo-empty-description').textContent(),
      /暂无数据/,
    );
  }
  if (variant === 'size-disabled') {
    assert.equal(await page.locator('#config-disabled').isDisabled(), true);
    assert.equal(await page.locator('#config-enabled').isDisabled(), false);
    assert.ok(
      await page
        .locator('#config-large')
        .evaluate(
          (large) =>
            large.getBoundingClientRect().height >
            document.querySelector('#config-disabled').getBoundingClientRect().height,
        ),
    );
  }
  if (variant === 'component-defaults') {
    assert.ok(
      await page
        .locator('#config-component')
        .evaluate(
          (node) =>
            node.classList.contains('configured-input') &&
            getComputedStyle(node).paddingInlineStart === '20px',
        ),
    );
  }
  if (variant === 'scope-tag')
    assert.equal(await page.locator('#config-scope').evaluate((node) => node.tagName), 'SECTION');
  if (variant === 'native-parents') {
    assert.equal(
      await page.locator('#config-table-row').evaluate((node) => node.parentElement.tagName),
      'TBODY',
    );
    assert.equal(await frame.locator('svg g text').count(), 1);
  }
  if (variant === 'empty-reset')
    assert.equal(
      await page
        .locator('#config-reset')
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(255, 255, 255)',
    );
  if (variant === 'css-only')
    assert.equal(
      await page
        .locator('#config-css-only')
        .evaluate((node) => getComputedStyle(node).getPropertyValue('--apollo-font-size').trim()),
      '18px',
    );
  if (variant === 'native-focus') {
    const input = page.locator('#config-focus');
    const before = await input.evaluate((node) => getComputedStyle(node).boxShadow);
    await page.locator('#config-before').focus();
    await page.keyboard.press('Tab');
    assert.ok(
      await input.evaluate(
        (node, shadow) =>
          node === document.activeElement && getComputedStyle(node).boxShadow !== shadow,
        before,
      ),
    );
  }
  const state = await frame.evaluate((node) => ({
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
    background: getComputedStyle(node).backgroundColor,
    editors: [...node.querySelectorAll('input')].map((input) => ({
      width: input.getBoundingClientRect().width,
      height: input.getBoundingClientRect().height,
      direction: getComputedStyle(input).direction,
      disabled: input.disabled,
    })),
    emptyStates: [...node.querySelectorAll('.apollo-empty-description')].map(
      (element) => element.textContent,
    ),
  }));
  assert.ok(
    state.width > 200 && state.scrollWidth <= state.width + 1,
    'Provider consumers fit their actual viewport',
  );
  assert.equal(
    state.background,
    variant.includes('dark') || variant === 'empty-reset'
      ? 'rgb(20, 20, 20)'
      : 'rgb(255, 255, 255)',
  );
  assert.ok(state.editors.every((input) => input.width > 0 && input.height > 0));
  if (variant === 'rtl') assert.ok(state.editors.every((input) => input.direction === 'rtl'));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) =>
    (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((item) => item.target),
    })),
  );
  assert.deepEqual(violations, [], `ConfigProvider ${variant} has accessible real consumers`);
  return state;
}
