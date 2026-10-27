import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { compactAlgorithm, getDesignToken } from '@apollo-design/theme';

export async function prepareEmptyVisual(page, variant) {
  const frame = page.locator('[data-empty-visual-case]');
  assert.equal(await frame.getAttribute('data-empty-visual-case'), variant);
  if (variant === 'config-current') {
    const input = page.locator('#empty-image-draft');
    await input.fill('Saved business draft');
    const original = await input.elementHandle();
    await page.evaluate(() => window.emptyVisual.updateProvider());
    assert.equal(
      await original.evaluate(
        (n) => n === document.querySelector('#empty-image-draft') && n.isConnected,
      ),
      true,
    );
    assert.equal(await input.inputValue(), 'Saved business draft');
    assert.equal(
      await page
        .locator('#empty-main')
        .evaluate(
          (n) =>
            n.classList.contains('provider-current') &&
            !n.classList.contains('apollo-empty-normal'),
        ),
      true,
    );
  }
  if (variant === 'native-focus') {
    await page.locator('#empty-before').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .locator('#empty-image-draft')
        .evaluate(
          (n) => n === document.activeElement && getComputedStyle(n).outlineStyle !== 'none',
        ),
      true,
    );
  }
  const state = await frame.evaluate((n) => {
    const root = n.querySelector('#empty-main'),
      image = root?.querySelector('.apollo-empty-image');
    return {
      roots: n.querySelectorAll('.apollo-empty').length,
      inputs: n.querySelectorAll('input').length,
      svgs: n.querySelectorAll('svg').length,
      images: n.querySelectorAll('img').length,
      description: root?.querySelector('.apollo-empty-description')?.textContent ?? null,
      footer: root?.querySelector('.apollo-empty-footer')?.textContent ?? null,
      normal: root?.classList.contains('apollo-empty-normal'),
      imageHeight: image ? getComputedStyle(image).height : null,
      content: image?.classList.contains('apollo-empty-image-content'),
      imageBottom: image?.getBoundingClientRect().bottom ?? null,
      contentBottom: image
        ? Math.max(...Array.from(image.children).map((x) => x.getBoundingClientRect().bottom))
        : null,
      nativeData: root?.getAttribute('data-native-empty'),
      direction: root ? getComputedStyle(root).direction : null,
      width: n.clientWidth,
      scrollWidth: n.scrollWidth,
      background: getComputedStyle(n).backgroundColor,
    };
  });
  assert.equal(state.roots, 1);
  assert.equal(state.nativeData, 'yes');
  assert.ok(
    state.width > 200 && state.scrollWidth <= state.width + 1,
    'real content must fit its viewport',
  );
  assert.equal(
    state.background,
    variant.includes('dark') ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
  );
  const complete = ['complete-content', 'config-current', 'rtl', 'native-focus'].includes(variant);
  assert.equal(state.inputs, complete ? 2 : 0);
  if (variant === 'empty-slots') {
    assert.equal(state.imageHeight, null);
    assert.equal(state.description, null);
    assert.equal(state.footer, null);
    assert.equal(state.svgs, 0);
  } else if (complete) {
    assert.equal(state.content, true);
    assert.equal(state.normal, false);
    assert.ok(state.contentBottom <= state.imageBottom + 1);
    assert.ok(state.footer.includes('Footer tail0'));
  } else {
    const token = getDesignToken({
      algorithm: variant.includes('compact') ? compactAlgorithm : undefined,
    });
    assert.equal(
      state.imageHeight,
      `${['simple', 'semantic'].includes(variant) ? token.controlHeightLG : token.controlHeightLG * 2.5}px`,
    );
    assert.equal(state.normal, ['simple', 'semantic'].includes(variant));
    assert.equal(state.description === null, variant === 'no-description');
  }
  if (variant === 'rtl') assert.equal(state.direction, 'rtl');
  if (variant === 'custom-image') assert.equal(state.images, 1);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const issues = await frame.evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(issues, [], 'actual Empty content must pass axe');
  return state;
}
