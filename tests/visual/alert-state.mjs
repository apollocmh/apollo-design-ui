import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
/** Validate actual content/paint/state before a candidate can be captured. */
export async function prepareAlertVisual(page, variant) {
  const frame = page.locator('[data-alert-visual-case]');
  assert.equal(await frame.getAttribute('data-alert-visual-case'), variant);
  if (variant === 'provider-current') {
    const input = frame.locator('#alert-draft'),
      original = await input.elementHandle();
    await input.fill('Saved draft');
    await input.focus();
    await page.evaluate(() => window.alertVisual.update());
    assert.equal(
      await input.evaluate(
        (node, old) =>
          node === old && node.value === 'Saved draft' && node === document.activeElement,
        original,
      ),
      true,
    );
    assert.match(await frame.locator('#alert-main').getAttribute('class'), /current-provider/);
    assert.equal(
      await frame.locator('.apollo-alert-title').evaluate((n) => getComputedStyle(n).fontWeight),
      '700',
    );
  }
  if (variant === 'closed') {
    await page.evaluate(() => window.alertVisual.dismiss());
    await page.locator('#alert-main').waitFor({ state: 'detached' });
    assert.equal(await frame.locator('#alert-completed').innerText(), 'Completed 1');
    assert.equal(await frame.locator('#alert-sibling').count(), 1);
  }
  if (variant === 'native-focus') {
    await frame.locator('#alert-before').focus();
    await page.keyboard.press('Tab');
    const actual = await frame.locator('.apollo-alert-close-icon').evaluate((n) => ({
      focused: n === document.activeElement,
      outline: getComputedStyle(n).outlineStyle,
      name: n.getAttribute('aria-label'),
    }));
    assert.equal(actual.focused, true);
    assert.notEqual(actual.outline, 'none');
    assert.equal(actual.name, 'Close');
  }
  const state = await frame.evaluate((n) => ({
    alerts: n.querySelectorAll('.apollo-alert').length,
    titles: [...n.querySelectorAll('.apollo-alert-title')].map((n) => n.textContent),
    descriptions: [...n.querySelectorAll('.apollo-alert-description')].map((n) => n.textContent),
    close: [...n.querySelectorAll('.apollo-alert-close-icon')].map((n) => ({
      name: n.getAttribute('aria-label'),
      text: n.textContent,
      width: n.getBoundingClientRect().width,
      height: n.getBoundingClientRect().height,
    })),
    direction: n.querySelector('.apollo-alert')
      ? getComputedStyle(n.querySelector('.apollo-alert')).direction
      : null,
    background: getComputedStyle(n).backgroundColor,
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
    fontSize: n.querySelector('.apollo-alert')
      ? getComputedStyle(n.querySelector('.apollo-alert')).fontSize
      : null,
  }));
  assert.ok(state.alerts > 0);
  assert.ok(state.width > 200 && state.scrollWidth <= state.width + 1, JSON.stringify(state));
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  assert.equal(state.fontSize, variant.includes('compact') ? '12px' : '14px');
  if (variant === 'empty-slots') {
    assert.deepEqual(state.titles, []);
    assert.deepEqual(state.descriptions, []);
    assert.equal(await frame.locator('.apollo-alert-icon,.apollo-alert-actions').count(), 0);
  }
  if (variant === 'close-content') {
    assert.equal(state.close.length, 4);
    assert.equal(state.close[0].text, '0');
    assert.ok(state.close.every((n) => n.name === 'Close' && n.width >= 12 && n.height >= 12));
  }
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  if (variant === 'error-boundary') assert.match(state.titles[0], /Task panel could not render/);
  if (variant === 'tokens') {
    assert.equal(
      await frame.locator('#alert-main').evaluate((n) => getComputedStyle(n).padding),
      '15px 21px',
    );
    assert.equal(
      await frame.locator('.apollo-alert-icon').evaluate((n) => getComputedStyle(n).fontSize),
      '31px',
    );
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => ({ html: x.html, summary: x.failureSummary })),
    })),
  );
  assert.deepEqual(violations, []);
  return state;
}
