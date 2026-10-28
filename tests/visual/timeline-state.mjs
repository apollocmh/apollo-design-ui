import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export async function prepareTimelineVisual(page, variant) {
  const frame = page.locator('[data-timeline-visual]');
  assert.equal(await frame.getAttribute('data-timeline-visual'), variant);
  const native = [
    'conditional-slots',
    'current-provider',
    'reverse-edit',
    'pending-zero',
    'native-focus',
  ].includes(variant);
  if (native) {
    const editor = page.locator('#timeline-draft');
    await editor.fill('Saved native draft');
    const old = await editor.elementHandle();
    if (variant === 'native-focus') {
      await page.locator('#timeline-before').focus();
      await page.keyboard.press('Tab');
      assert.equal(
        await editor.evaluate(
          (n) => n === document.activeElement && getComputedStyle(n).outlineStyle !== 'none',
        ),
        true,
      );
      // Filling then moving focus commits one real native change on blur.
      assert.deepEqual((await page.evaluate(() => window.timelineVisual.snapshot())).events, [
        { domEvent: true, type: 'change' },
      ]);
      await editor.dispatchEvent('change');
      assert.deepEqual((await page.evaluate(() => window.timelineVisual.snapshot())).events, [
        { domEvent: true, type: 'change' },
        { domEvent: true, type: 'change' },
      ]);
    } else {
      await editor.focus();
      await page.evaluate(() => window.timelineVisual.update());
      if (variant === 'conditional-slots') {
        assert.equal(await page.locator('#timeline-main').innerText(), '');
        assert.equal(await page.locator('#timeline-draft').count(), 0);
      } else {
        assert.equal(
          await old.evaluate(
            (n) => n === document.getElementById('timeline-draft') && n.isConnected,
          ),
          true,
        );
        assert.equal(await editor.inputValue(), 'Saved native draft');
        assert.equal(await editor.evaluate((n) => n === document.activeElement), true);
      }
    }
    assert.equal((await page.evaluate(() => window.timelineVisual.snapshot())).nativeRoot, true);
    if (variant === 'reverse-edit')
      assert.deepEqual(await page.locator('#timeline-main time').allTextContents(), [
        '11:30',
        '10:05',
        '09:10',
      ]);
    if (variant === 'pending-zero')
      assert.equal(
        await page
          .locator('#timeline-main > li')
          .last()
          .locator('.apollo-timeline-item-content')
          .textContent(),
        '0',
      );
    if (variant === 'current-provider') {
      assert.ok(
        (await page.locator('#timeline-main').getAttribute('class')).includes(
          'timeline-config-current',
        ),
      );
      assert.ok(
        (await page.locator('#timeline-main').getAttribute('class')).includes(
          'apollo-timeline-rtl',
        ),
      );
    }
  }
  if (variant === 'scalar-content') {
    assert.deepEqual(await frame.locator('.apollo-timeline-item-icon').allTextContents(), [
      '0',
      '',
      '',
    ]);
    assert.equal(await frame.locator('.apollo-icon-spin').count(), 0);
  }
  if (variant === 'token-overrides') {
    assert.equal(
      await frame
        .locator('.apollo-timeline-item-icon')
        .last()
        .evaluate((n) => getComputedStyle(n).width),
      '18px',
    );
    assert.equal(
      await frame
        .locator('.apollo-timeline-item-icon')
        .last()
        .evaluate((n) => getComputedStyle(n).borderTopWidth),
      '3px',
    );
  }
  const state = await frame.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    return {
      roots: node.querySelectorAll('ol.apollo-timeline').length,
      passive: node.querySelectorAll('li[role="button"],li[tabindex]').length,
      width: node.clientWidth,
      background: getComputedStyle(node).backgroundColor,
      railOffsets: [
        ...node.querySelectorAll('.apollo-timeline-horizontal .apollo-timeline-item'),
      ].flatMap((item) => {
        const icon = item.querySelector('.apollo-timeline-item-icon')?.getBoundingClientRect();
        const rail = item.querySelector('.apollo-timeline-item-rail')?.getBoundingClientRect();
        return icon && rail
          ? [Math.abs(icon.top + icon.height / 2 - rail.top - rail.height / 2)]
          : [];
      }),
      overflow: [
        ...node.querySelectorAll('.apollo-timeline-item-title,.apollo-timeline-item-content'),
      ]
        .filter((n) => {
          const rect = n.getBoundingClientRect();
          return rect.left < bounds.left - 1 || rect.right > bounds.right + 1;
        })
        .map((n) => n.textContent),
    };
  });
  assert.ok(state.roots > 0);
  assert.equal(state.passive, 0);
  assert.ok(
    state.railOffsets.every((offset) => offset < 1),
    `rails connect actual dot centers: ${state.railOffsets}`,
  );
  assert.deepEqual(state.overflow, [], 'all real text regions fit the viewport');
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await frame.evaluate(async (node) =>
    (await window.axe.run(node)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.failureSummary),
    })),
  );
  assert.deepEqual(violations, [], 'actual Timeline visual state must pass axe');
  return state;
}
