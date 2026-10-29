import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareCollapseVisual(page, variant) {
  const frame = page.locator('[data-collapse-visual]');
  assert.equal(await frame.getAttribute('data-collapse-visual'), variant);
  if (variant === 'current-provider' || variant === 'retained-content') {
    const input = page.locator(
      variant === 'current-provider' ? '#collapse-provider-draft' : '#collapse-retained-draft',
    );
    await input.fill('Saved panel draft');
    await input.focus();
    await input.evaluate((node) => node.setSelectionRange(2, 7));
    const original = await input.elementHandle();
    if (variant === 'current-provider') {
      await page.evaluate(() => window.collapseVisual.update());
      assert.equal(
        await page
          .locator('#collapse-current')
          .evaluate(
            (node) =>
              node.classList.contains('collapse-current') &&
              getComputedStyle(node).direction === 'rtl',
          ),
        true,
      );
      assert.equal(
        await page
          .locator('#collapse-current .apollo-collapse-header')
          .evaluate((node) => getComputedStyle(node).padding),
        '18px',
      );
    } else {
      await page.evaluate(() => window.collapseVisual.close());
      await page.waitForFunction(
        () => document.querySelector('#collapse-retained .apollo-collapse-panel')?.hidden === true,
      );
      assert.equal(
        await page
          .locator('#collapse-retained .apollo-collapse-trigger')
          .evaluate((node) => node === document.activeElement),
        true,
        'Closing an owned editor restores its trigger focus',
      );
      assert.equal(
        await input.evaluate((node, before) => node === before && node.isConnected, original),
        true,
      );
      await page.evaluate(() => window.collapseVisual.open());
      await input.waitFor({ state: 'visible' });
      await input.focus();
    }
    assert.equal(
      await input.evaluate(
        (node, before) =>
          node === before &&
          node.value === 'Saved panel draft' &&
          node === document.activeElement &&
          node.selectionStart === 2 &&
          node.selectionEnd === 7,
        original,
      ),
      true,
    );
  }
  if (variant === 'controlled-rejected') {
    await page.locator('#collapse-controlled .apollo-collapse-trigger').first().click();
    assert.equal(await page.locator('#collapse-requests').textContent(), 'Requests: 1');
    assert.equal(
      await page
        .locator('#collapse-controlled .apollo-collapse-trigger')
        .first()
        .getAttribute('aria-expanded'),
      'true',
    );
  }
  if (variant === 'native-focus') {
    await page.locator('#collapse-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .locator('#collapse-focus .apollo-collapse-trigger')
        .first()
        .evaluate(
          (node) =>
            node === document.activeElement && getComputedStyle(node).outlineStyle !== 'none',
        ),
      true,
    );
  }
  if (variant === 'semantic-tokens') {
    assert.equal(
      await page
        .locator('#collapse-token .apollo-collapse-header')
        .first()
        .evaluate((node) => getComputedStyle(node).padding),
      '20px',
    );
    assert.equal(
      await page
        .locator('#collapse-token .apollo-collapse-body')
        .first()
        .evaluate((node) => getComputedStyle(node).padding),
      '24px',
    );
  }
  const state = await frame.evaluate((node) => ({
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
    background: getComputedStyle(node).backgroundColor,
    roots: node.querySelectorAll('.apollo-collapse').length,
    expanded: node.querySelectorAll('button[aria-expanded="true"]').length,
    disabled: node.querySelectorAll('button.apollo-collapse-trigger:disabled').length,
    headings: [...node.querySelectorAll('.apollo-collapse-heading')].map(
      (heading) => heading.tagName,
    ),
    direction: getComputedStyle(node.querySelector('.apollo-collapse')).direction,
    triggers: [...node.querySelectorAll('.apollo-collapse-trigger')].map((button) => ({
      tag: button.tagName,
      controls: button.getAttribute('aria-controls'),
      hasRegion: Boolean(document.getElementById(button.getAttribute('aria-controls'))),
    })),
  }));
  assert.ok(
    state.width > 200 && state.scrollWidth <= state.width + 1,
    'Disclosure content fits its actual viewport',
  );
  assert.ok(state.roots > 0 && state.triggers.length > 0);
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  for (const trigger of state.triggers) {
    assert.equal(trigger.tag, 'BUTTON');
    assert.ok(trigger.controls && trigger.hasRegion);
  }
  if (variant === 'accordion') assert.equal(state.expanded, 1);
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  if (variant === 'nested') assert.deepEqual(state.headings, ['H2', 'H3']);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) =>
    (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((item) => item.target),
    })),
  );
  assert.deepEqual(violations, [], `Collapse ${variant} has accessible native disclosures`);
  return state;
}
