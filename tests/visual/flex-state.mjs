import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const near = (actual, expected, label) =>
  assert.ok(Math.abs(actual - expected) < 0.1, `${label}: ${actual} != ${expected}`);
const measure = (stage, name) =>
  stage.locator(`[data-flex-specimen="${name}"]`).evaluate((node) => {
    const style = getComputedStyle(node),
      rect = node.getBoundingClientRect();
    const x = rect.x + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
      y = rect.y + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
    return {
      direction: style.flexDirection,
      wrap: style.flexWrap,
      justify: style.justifyContent,
      align: style.alignItems,
      columnGap: style.columnGap,
      rowGap: style.rowGap,
      content: {
        x,
        y,
        width:
          rect.width -
          parseFloat(style.borderLeftWidth) -
          parseFloat(style.borderRightWidth) -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight),
        height:
          rect.height -
          parseFloat(style.borderTopWidth) -
          parseFloat(style.borderBottomWidth) -
          parseFloat(style.paddingTop) -
          parseFloat(style.paddingBottom),
      },
      children: [...node.children].map((child) => {
        const box = child.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      }),
    };
  });
const checkFlow = (value, direction, gap) => {
  assert.equal(value.direction, direction);
  assert.equal(value.rowGap, `${gap}px`);
  assert.equal(value.columnGap, `${gap}px`);
  assert.ok(value.children.length > 1);
  for (let index = 1; index < value.children.length; index++) {
    const previous = value.children[index - 1],
      current = value.children[index];
    assert.ok(current.width > 0 && current.height > 0);
    if (direction === 'column') {
      near(current.y - previous.y - previous.height, gap, 'actual vertical gap');
      near(current.x, previous.x, 'vertical cross-axis alignment');
    } else {
      near(current.x - previous.x - previous.width, gap, 'actual horizontal gap');
      near(current.y, previous.y, 'horizontal cross-axis alignment');
    }
  }
};

export async function prepareFlexVisual(page, variant) {
  const stage = page.locator('#stage');
  const geometry = {};
  assert.ok(await stage.locator('.apollo-flex').count());
  if (variant === 'basic' || variant === 'vertical') {
    const flows =
      variant === 'basic'
        ? [
            ['basic-vertical', 'column', 16],
            ['basic-horizontal', 'row', 16],
          ]
        : [
            ['vertical-prop', 'column', 8],
            ['orientation-vertical', 'column', 8],
            ['orientation-wins', 'row', 8],
          ];
    for (const [name, direction, gap] of flows) {
      geometry[name] = await measure(stage, name);
      checkFlow(geometry[name], direction, gap);
    }
  }
  if (variant === 'gap') {
    for (const [name, gap] of [
      ['small', 8],
      ['medium', 16],
      ['middle', 16],
      ['large', 24],
      ['16px', 16],
    ]) {
      geometry[name] = await measure(stage, `gap-${name}`);
      checkFlow(geometry[name], 'row', gap);
    }
  }
  if (variant === 'wrap') {
    const value = await measure(stage, 'wrap');
    assert.equal(value.direction, 'row');
    assert.equal(value.wrap, 'wrap');
    assert.equal(value.children.length, 12);
    const rows = [];
    for (const child of value.children) {
      near(child.width, 120, 'wrap item width');
      near(child.height, 54, 'wrap item height');
      const row = rows.find((items) => Math.abs(items[0].y - child.y) < 0.1);
      if (row) row.push(child);
      else rows.push([child]);
    }
    assert.ok(rows.length > 1, 'Expected actual wrapping');
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      for (let item = 1; item < row.length; item++)
        near(row[item].x - row[item - 1].x - row[item - 1].width, 8, 'wrapped column gap');
      if (index > 0) near(row[0].y - rows[index - 1][0].y - 54, 8, 'wrapped row gap');
    }
    geometry.wrap = value;
  }
  if (variant === 'justify-align') {
    for (const [name, direction, justify, align] of [
      ['justify-between', 'row', 'space-between', 'center'],
      ['justify-center', 'row', 'center', 'flex-end'],
      ['justify-around', 'column', 'space-around', 'center'],
    ]) {
      const value = await measure(stage, name),
        { content, children } = value;
      assert.equal(value.direction, direction);
      assert.equal(value.justify, justify);
      assert.equal(value.align, align);
      assert.equal(children.length, 3);
      const first = children[0],
        last = children[2];
      if (direction === 'column') {
        const free = content.height - children.reduce((sum, child) => sum + child.height, 0);
        assert.ok(free > 0, 'Vertical space-around requires positive free space');
        const edge = free / 6;
        near(first.y - content.y, edge, 'space-around start');
        near(content.y + content.height - last.y - last.height, edge, 'space-around end');
        for (let index = 1; index < children.length; index++)
          near(
            children[index].y - children[index - 1].y - children[index - 1].height,
            edge * 2,
            'space-around separation',
          );
        for (const child of children)
          near(
            child.x + child.width / 2,
            content.x + content.width / 2,
            'vertical center alignment',
          );
      } else {
        const free = content.width - children.reduce((sum, child) => sum + child.width, 0);
        assert.ok(free > 0, 'Horizontal justify requires positive free space');
        if (justify === 'space-between') {
          near(first.x, content.x, 'space-between start');
          near(last.x + last.width, content.x + content.width, 'space-between end');
          for (let index = 1; index < children.length; index++)
            near(
              children[index].x - children[index - 1].x - children[index - 1].width,
              free / 2,
              'space-between separation',
            );
          for (const child of children)
            near(
              child.y + child.height / 2,
              content.y + content.height / 2,
              'horizontal center alignment',
            );
        } else {
          near(
            first.x - content.x,
            content.x + content.width - last.x - last.width,
            'centered group',
          );
          for (let index = 1; index < children.length; index++)
            near(
              children[index].x - children[index - 1].x - children[index - 1].width,
              8,
              'centered group gap',
            );
          for (const child of children)
            near(child.y + child.height, content.y + content.height, 'horizontal end alignment');
        }
      }
      geometry[name] = value;
    }
  }
  if (variant === 'current-provider') {
    const draft = stage.locator('#flex-provider-draft'),
      original = await draft.elementHandle();
    await draft.fill('Preserved draft');
    await draft.focus();
    await draft.evaluate((n) => n.setSelectionRange(2, 7));
    await page.evaluate(() => window.flexVisual.next());
    assert.equal(
      await draft.evaluate(
        (n, o) =>
          n === o &&
          n === document.activeElement &&
          n.value === 'Preserved draft' &&
          n.selectionStart === 2 &&
          n.selectionEnd === 7,
        original,
      ),
      true,
    );
    assert.equal(await page.evaluate(() => window.flexVisual.snapshot()), true);
    assert.equal(await stage.locator('.flex-after').count(), 1);
    assert.equal(
      await stage.locator('#flex-provider-owner').evaluate((n) => getComputedStyle(n).direction),
      'rtl',
    );
  }
  if (variant === 'empty-host') {
    const button = stage.locator('#flex-empty-button');
    assert.equal(await button.isVisible(), true);
    await button.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.flexEmptySnapshot()), 1);
  }
  if (variant === 'native-focus') {
    await stage.locator('#flex-focus-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await stage
        .locator('#flex-focus-input')
        .evaluate((n) => n === document.activeElement && n.matches(':focus-visible')),
      true,
    );
  }
  if (variant === 'custom-component')
    assert.equal(await stage.locator('.apollo-flex').evaluate((n) => n.tagName), 'ARTICLE');
  if (variant === 'complete-content')
    assert.ok((await stage.textContent()).includes('Complete text 0fragment tail'));
  if (variant === 'default-and-stretch') {
    const roots = stage.locator('.apollo-flex');
    assert.equal(await roots.nth(0).evaluate((n) => getComputedStyle(n).alignItems), 'flex-start');
    assert.equal(await roots.nth(1).evaluate((n) => getComputedStyle(n).alignItems), 'stretch');
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  assert.deepEqual(
    await stage.evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    ),
    [],
  );
  const state = await stage.evaluate((n) => ({
    roots: n.querySelectorAll('.apollo-flex').length,
    width: n.clientWidth,
    scrollWidth: n.scrollWidth,
    invalidText: /NaN|\[object Object\]/.test(n.textContent),
  }));
  assert.equal(state.invalidText, false);
  assert.ok(state.scrollWidth <= state.width + 1, JSON.stringify(state));
  return { ...state, geometry };
}
