import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareLayoutVisual(page, variant) {
  const frame = page.locator('[data-layout-visual]');
  assert.equal(await frame.getAttribute('data-layout-visual'), variant);
  const settle = () =>
    page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      );
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  if (variant === 'current-provider' || variant === 'conditional-trigger') {
    const draft = frame.getByRole('textbox', { name: 'Layout draft' }),
      old = await draft.elementHandle();
    await draft.fill('Saved layout draft');
    await draft.focus();
    const trigger = frame.locator('.apollo-layout-sider-trigger'),
      original = await trigger.elementHandle();
    await page.evaluate(() => window.layoutVisual.next());
    await settle();
    if (variant === 'conditional-trigger') {
      assert.equal(await trigger.textContent(), '');
      await page.evaluate(() => window.layoutVisual.next());
      assert.equal(await trigger.textContent(), 'Slot0');
      await page.evaluate(() => window.layoutVisual.next());
      assert.equal(await trigger.textContent(), 'Data0');
      await page.evaluate(() => window.layoutVisual.next());
      await page.evaluate(() => window.layoutVisual.next());
      assert.equal(await trigger.textContent(), 'Slot0');
      assert.equal(await trigger.evaluate((node, old) => node === old, original), true);
    } else {
      assert.equal(
        await frame
          .locator('#layout-visual-root')
          .evaluate((node) => getComputedStyle(node).direction),
        'rtl',
      );
      assert.equal(
        await frame.locator('header').evaluate((node) => node.getBoundingClientRect().height),
        70,
      );
      const snapshot = await page.evaluate(() => window.layoutVisual.snapshot());
      assert.equal(snapshot.root, true);
      assert.equal(snapshot.sider, true);
    }
    assert.equal(
      await draft.evaluate((node, old) => node === old && node === document.activeElement, old),
      true,
    );
    assert.equal(await draft.inputValue(), 'Saved layout draft');
  }
  if (variant === 'keyboard-trigger') {
    const trigger = frame.locator('.apollo-layout-sider-trigger');
    assert.equal(await trigger.getAttribute('aria-label'), 'Collapse sidebar');
    await trigger.focus();
    await trigger.press('Enter');
    await settle();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(await frame.locator('.apollo-menu-inline-collapsed').count(), 1);
    const events = (await page.evaluate(() => window.layoutVisual.snapshot())).events;
    assert.deepEqual(events, [[true, 'clickTrigger']]);
  }
  if (variant === 'native-focus') {
    const trigger = frame.getByRole('button', { name: 'Collapse sidebar' });
    await trigger.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await trigger.evaluate(
        (node) => node === document.activeElement && node.matches(':focus-visible'),
      ),
      true,
    );
  }
  if (variant === 'zero-width') {
    assert.equal(
      await frame.locator('.apollo-layout-sider-children').evaluate((node) => node.inert),
      true,
    );
    assert.equal(await frame.getByRole('button', { name: 'Expand sidebar' }).count(), 1);
  }
  if (variant === 'rtl') {
    const trigger = frame.locator('.apollo-layout-sider-zero-width-trigger');
    const corners = await trigger.evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.borderTopLeftRadius, style.borderTopRightRadius];
    });
    assert.deepEqual(corners, ['8px', '0px']);
  }
  if (variant === 'responsive') {
    const below = page.viewportSize().width < 992;
    assert.equal(
      await frame
        .locator('aside')
        .evaluate((node) => node.classList.contains('apollo-layout-sider-below')),
      below,
    );
    assert.equal(
      await frame.locator('aside').evaluate((node) => node.getBoundingClientRect().width),
      below ? 0 : 128,
    );
  }
  await settle();
  const geometry = await frame.evaluate((node) => ({
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
    invalid: /NaN|\[object Object\]/.test(node.textContent),
    root: node.getBoundingClientRect().toJSON(),
    triggers: [
      ...node.querySelectorAll(
        '.apollo-layout-sider-trigger,.apollo-layout-sider-zero-width-trigger',
      ),
    ].map((button) => ({
      rect: button.getBoundingClientRect().toJSON(),
      expanded: button.getAttribute('aria-expanded'),
      target: button.getAttribute('aria-controls'),
    })),
  }));
  assert.equal(geometry.invalid, false);
  assert.ok(geometry.scrollWidth <= geometry.width + 1, JSON.stringify(geometry));
  for (const trigger of geometry.triggers) {
    assert.ok(trigger.rect.width > 0 && trigger.rect.height > 0);
    assert.ok(
      trigger.rect.top >= 0 && trigger.rect.bottom <= page.viewportSize().height + 1,
      'Toggle must be visible within the captured viewport',
    );
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  assert.deepEqual(
    await frame.evaluate(async (node) =>
      (await window.axe.run(node)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ),
    [],
  );
  return geometry;
}
