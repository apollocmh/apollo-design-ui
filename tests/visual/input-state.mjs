import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareInputVisual(page, variant) {
  const frame = page.locator('[data-input-visual]');
  assert.equal(await frame.getAttribute('data-input-visual'), variant);
  if (variant === 'current-provider' || variant === 'dynamic-wrappers') {
    const input = page.locator(
      variant === 'current-provider' ? '#input-provider-draft' : '#input-dynamic-draft',
    );
    await input.fill('Saved business draft');
    await input.focus();
    await input.evaluate((node) => node.setSelectionRange(2, 7));
    const original = await input.elementHandle();
    const before = await input.evaluate((node) => ({
      height: node.getBoundingClientRect().height,
      font: parseFloat(getComputedStyle(node).fontSize),
    }));
    await page.evaluate(() => window.inputVisual.update());
    assert.equal(
      await input.evaluate(
        (node, old) =>
          node === old &&
          node.value === 'Saved business draft' &&
          node === document.activeElement &&
          node.selectionStart === 2 &&
          node.selectionEnd === 7,
        original,
      ),
      true,
    );
    if (variant === 'current-provider') {
      const after = await input.evaluate((node) => ({
        height: node.getBoundingClientRect().height,
        font: parseFloat(getComputedStyle(node).fontSize),
        direction: getComputedStyle(node).direction,
      }));
      assert.ok(after.height > before.height && after.font > before.font);
      assert.equal(after.direction, 'rtl');
    } else {
      assert.equal(await frame.locator('.apollo-input-group-addon').count(), 1);
      assert.equal(await frame.locator('.apollo-input-suffix').textContent(), '0');
    }
  }
  if (variant === 'controlled-rejected') {
    await page.locator('#input-controlled').fill('Rejected proposal');
    await page.waitForFunction(
      () => document.querySelector('#input-controlled').value === 'Approved',
    );
    assert.equal(await page.locator('#input-requests').textContent(), 'Requests: 1');
  }
  if (variant === 'clear') {
    const buttons = frame.locator('button.apollo-input-clear-icon');
    assert.equal(await buttons.count(), 3);
    for (const button of await buttons.all()) {
      const rect = await button.boundingBox();
      assert.ok(
        rect.width >= 24 && rect.height >= 24,
        'Each custom clear action retains its native pointer target',
      );
      assert.ok(await button.getAttribute('aria-label'));
    }
    const input = page.locator('#input-clear');
    await input.focus();
    await page.keyboard.press('Tab');
    assert.equal(await buttons.first().evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () =>
        document.querySelector('#input-clear').value === '' &&
        document.activeElement === document.querySelector('#input-clear'),
    );
  }
  if (variant === 'password' || variant === 'password-icon') {
    const first = frame.locator('section').first();
    await first.getByRole('button').click();
    assert.equal(await first.locator('input').getAttribute('type'), 'text');
    if (variant === 'password-icon')
      assert.equal(await first.getByRole('button').textContent(), 'Hide');
  }
  if (variant === 'search-loading') {
    for (const button of await frame.getByRole('button').all())
      assert.equal(await button.isDisabled(), true);
  }
  if (variant === 'textarea-autosize') {
    const textarea = page.locator('#input-autosize');
    const before = await textarea.evaluate((node) => node.getBoundingClientRect().height);
    await textarea.fill('Line one\nLine two\nLine three\nLine four\nLine five\nLine six');
    await page.waitForFunction((height) => {
      const node = document.querySelector('#input-autosize');
      return node.getBoundingClientRect().height > height && node.scrollHeight > node.clientHeight;
    }, before);
  }
  if (variant === 'textarea-resize') {
    await page.locator('#input-resizable').evaluate((node) => {
      node.style.height = '90px';
    });
    await page.waitForFunction(() => {
      const node = document.querySelector('#input-resizable'),
        report = window.inputVisual.reported();
      return (
        report &&
        report.width === node.offsetWidth &&
        report.height === node.offsetHeight &&
        report.height === 90
      );
    });
  }
  if (variant === 'otp') {
    const inputs = page.locator('#input-otp input');
    assert.equal(await inputs.count(), 6);
    for (let index = 0; index < 6; index++) await inputs.nth(index).fill(String(index + 3));
    assert.equal(
      await inputs.evaluateAll((nodes) => nodes.map((node) => node.value).join('')),
      '345678',
    );
  }
  if (variant === 'native-focus') {
    const input = page.locator('#input-focus');
    const before = await input.evaluate((node) => ({
      border: getComputedStyle(node.closest('.apollo-input-affix-wrapper') ?? node).borderColor,
      shadow: getComputedStyle(node.closest('.apollo-input-affix-wrapper') ?? node).boxShadow,
    }));
    await page.locator('#input-before').focus();
    await page.keyboard.press('Tab');
    const focus = await input.evaluate((node) => {
      const style = getComputedStyle(node.closest('.apollo-input-affix-wrapper') ?? node);
      return {
        active: node === document.activeElement,
        border: style.borderColor,
        shadow: style.boxShadow,
        outline: style.outlineStyle,
      };
    });
    assert.ok(
      focus.active &&
        (focus.border !== before.border ||
          focus.shadow !== before.shadow ||
          focus.outline !== 'none'),
      'The real editor has visible native keyboard focus',
    );
  }
  const state = await frame.evaluate((node) => ({
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
    background: getComputedStyle(node).backgroundColor,
    editors: [...node.querySelectorAll('input,textarea')].map((editor) => ({
      tag: editor.tagName,
      type: editor.type,
      value: editor.value,
      width: editor.getBoundingClientRect().width,
      height: editor.getBoundingClientRect().height,
      disabled: editor.disabled,
      readOnly: editor.readOnly,
      direction: getComputedStyle(editor).direction,
    })),
    clearActions: node.querySelectorAll(
      'button.apollo-input-clear-icon,button.apollo-input-textarea-clear-icon',
    ).length,
  }));
  assert.ok(
    state.width > 200 && state.scrollWidth <= state.width + 1,
    'Native field content fits the actual viewport',
  );
  assert.ok(state.editors.length > 0);
  assert.ok(state.editors.every((editor) => editor.width > 0 && editor.height > 0));
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  if (variant === 'rtl') assert.ok(state.editors.every((editor) => editor.direction === 'rtl'));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) =>
    (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((item) => item.target),
    })),
  );
  assert.deepEqual(violations, [], `Input ${variant} has real accessible native controls`);
  return state;
}
