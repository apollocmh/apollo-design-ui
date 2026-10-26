import assert from 'node:assert/strict';

/** Verify the actual Image state before a screenshot can become a candidate. */
export async function prepareImageVisual(page, variant) {
  const hasDialog = ['preview', 'group', 'theme-dark', 'theme-compact'].includes(variant);
  if (hasDialog) {
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5000 });
    const frame = await page.locator('#stage').boundingBox();
    const dialog = await page.getByRole('dialog').boundingBox();
    assert.ok(frame && dialog, 'the preview and screenshot region must have real geometry');
    assert.ok(
      dialog.x >= frame.x - 1 &&
        dialog.y >= frame.y - 1 &&
        dialog.x + dialog.width <= frame.x + frame.width + 1 &&
        dialog.y + dialog.height <= frame.y + frame.height + 1,
      'the entire preview must fit inside the screenshot region',
    );
  }
  if (variant === 'cover') {
    await page.locator('.apollo-image').first().hover();
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector('.apollo-image-cover')).opacity === '1',
      null,
      { timeout: 5000 },
    );
  }
  await page.waitForFunction(
    () => {
      const images = [...document.querySelectorAll('.apollo-image-img,.apollo-image-preview-img')];
      return images.every((image) => image.complete && image.naturalWidth > 0);
    },
    null,
    { timeout: 5000 },
  );
  const state = await page.evaluate(() => ({
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    images: document.querySelectorAll('.apollo-image-img,.apollo-image-preview-img').length,
    nativeActions: document.querySelectorAll('button[data-apollo-image-preview-trigger]').length,
    progress: document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),
    counter: document.querySelector('.apollo-image-preview-progress')?.textContent,
  }));
  assert.equal(state.dialogs, hasDialog ? 1 : 0);
  if (variant === 'rich') assert.equal(state.nativeActions, 1);
  if (variant === 'progress') assert.equal(state.progress, '65');
  else assert.ok(state.images > 0, 'a loaded photograph must be visible in this scenario');
  if (variant === 'group') assert.equal(state.counter, '2 / 2');
  return state;
}
