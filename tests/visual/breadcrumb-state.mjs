import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareBreadcrumbVisual(page, variant) {
  const settle = async () => {
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => Number.isFinite(animation.effect?.getTiming().iterations ?? 1))
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
  };
  const frame = page.locator('[data-breadcrumb-visual]');
  assert.equal(await frame.getAttribute('data-breadcrumb-visual'), variant);
  if (variant === 'current-provider') {
    const input = frame.locator('#breadcrumb-current-draft'),
      previous = await input.elementHandle();
    await input.fill('Saved draft');
    await input.focus();
    await page.evaluate(() => window.breadcrumbVisual.updateProvider());
    await settle();
    assert.equal(
      await input.evaluate(
        (node, old) => node === old && node === document.activeElement,
        previous,
      ),
      true,
    );
    assert.equal(await input.inputValue(), 'Saved draft');
    assert.deepEqual(await page.evaluate(() => window.breadcrumbVisual.snapshot()), { root: true });
    assert.equal(await frame.locator('.current-provider-after').count(), 2);
    const root = frame.locator('#breadcrumb-current-root');
    const values = await root.evaluate((node) => ({
      direction: getComputedStyle(node).direction,
      color: getComputedStyle(node).color,
      last: getComputedStyle(node.querySelector('li:last-child')).color,
      link: getComputedStyle(node.querySelector('a')).color,
      separator: getComputedStyle(node.querySelector('.apollo-breadcrumb-separator')).color,
      margin: getComputedStyle(node.querySelector('.apollo-breadcrumb-separator'))
        .marginInlineStart,
      icon: getComputedStyle(node.querySelector('.apollo-icon')).fontSize,
    }));
    assert.deepEqual(values, {
      direction: 'rtl',
      color: 'rgb(22, 76, 126)',
      last: 'rgb(135, 56, 0)',
      link: 'rgb(7, 86, 33)',
      separator: 'rgb(117, 69, 0)',
      margin: '17px',
      icon: '23px',
    });
    await root.locator('a').first().hover();
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector('#breadcrumb-current-root a')).color ===
        'rgb(97, 16, 140)',
    );
    await page.mouse.move(0, 0);
    assert.equal(await frame.locator('[data-current-icon]').textContent(), '↓');
  }
  if (variant === 'conditional-content') {
    const input = frame.locator('#breadcrumb-conditional-draft'),
      previous = await input.elementHandle();
    const trigger = frame.getByRole('button', { name: 'Open breadcrumb menu' }),
      originalTrigger = await trigger.elementHandle();
    await input.fill('Saved draft');
    await input.focus();
    await page.evaluate(() => window.breadcrumbVisual.setStage(1));
    assert.equal(await frame.locator('.apollo-breadcrumb-separator').count(), 0);
    assert.equal(await trigger.textContent(), '');
    await page.evaluate(() => window.breadcrumbVisual.setStage(2));
    assert.equal(await frame.locator('.apollo-breadcrumb-separator').textContent(), '/');
    assert.equal(await trigger.locator('svg').count(), 1);
    assert.equal(
      await input.evaluate(
        (node, old) => node === old && node === document.activeElement,
        previous,
      ),
      true,
    );
    assert.equal(await trigger.evaluate((node, old) => node === old, originalTrigger), true);
    assert.equal(await input.inputValue(), 'Saved draft');
  }
  if (variant === 'keyboard-menu' || variant === 'no-title-menu') {
    const trigger = frame.getByRole('button', { name: 'Open breadcrumb menu' });
    if (variant === 'no-title-menu')
      assert.equal(await trigger.locator('..').locator('.apollo-breadcrumb-link').count(), 0);
    await trigger.focus();
    await trigger.press('ArrowDown');
    const menu = frame.getByRole('menu');
    await menu.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menuitem');
    assert.equal(await page.evaluate(() => document.activeElement.matches(':focus-visible')), true);
    assert.equal(
      await menu.getByRole('link', { name: 'New product' }).getAttribute('href'),
      '#products/new',
    );
    assert.equal(
      await menu
        .getByRole('menuitem', { name: 'Unavailable product' })
        .getAttribute('aria-disabled'),
      'true',
    );
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  }
  if (variant === 'native-focus') {
    await frame.locator('#breadcrumb-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await frame
        .getByRole('link', { name: 'Home', exact: true })
        .evaluate(
          (node) =>
            node === document.activeElement &&
            node.matches(':focus-visible') &&
            getComputedStyle(node).outlineStyle !== 'none',
        ),
      true,
    );
  }
  await settle();
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) =>
    (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ failureSummary }) => failureSummary),
    })),
  );
  assert.deepEqual(violations, []);
  const state = await frame.evaluate((node) => ({
    roots: node.querySelectorAll('.apollo-breadcrumb').length,
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
    background: getComputedStyle(node).backgroundColor,
    invalidText: /NaN|\[object Object\]/.test(node.textContent),
    menus: [...node.querySelectorAll('[role="menu"]')].filter(
      (menu) => menu.getBoundingClientRect().height > 0,
    ).length,
    clippedMenus: [...node.querySelectorAll('[role="menu"]')].filter((menu) => {
      const bounds = menu.getBoundingClientRect(),
        host = node.getBoundingClientRect();
      return (
        bounds.height > 0 &&
        (bounds.left < host.left ||
          bounds.right > host.right + 1 ||
          bounds.bottom > host.bottom + 1)
      );
    }).length,
  }));
  assert.ok(state.roots > 0);
  assert.equal(state.invalidText, false);
  assert.ok(state.width > 200 && state.scrollWidth <= state.width + 1, JSON.stringify(state));
  assert.equal(state.clippedMenus, 0, 'Open menus must remain inside the captured frame');
  assert.equal(state.menus, ['keyboard-menu', 'no-title-menu'].includes(variant) ? 1 : 0);
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  return state;
}
