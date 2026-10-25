/** Native preview slots through production exports, actual editors and the real demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import axe from 'axe-core';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-preview-slots-'));
let server;
let browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'vue-reactivity.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-preview-slots`);
  await page.addScriptTag({ content: axe.source });
  const fixture = page.locator('[data-image-preview-slots-fixture]');
  const target = fixture.locator('[data-image-preview-slots-target]');
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-preview-slots-state]').textContent());
  const click = (name) =>
    fixture
      .locator('[data-image-preview-slots-controls]')
      .getByRole('button', { name, exact: true })
      .click();
  const waitState = async (key, value) =>
    page.waitForFunction(
      ({ key, value }) => {
        const text = document.querySelector('[data-image-preview-slots-state]')?.textContent;
        return text && JSON.parse(text)[key] === value;
      },
      { key, value },
    );
  const waitTransform = async (key, value) =>
    page.waitForFunction(
      ({ key, value }) => {
        const text = document.querySelector('[data-image-preview-slots-state]')?.textContent;
        return text && JSON.parse(text).transformed?.[key] === value;
      },
      { key, value },
    );
  const dialog = () => page.getByRole('dialog');
  const image = () => dialog().locator('.apollo-image-preview-img');
  const action = (name) => dialog().getByRole('button', { name, exact: true });
  const waitLoaded = async (image) => {
    const node = await image.elementHandle();
    if (!node) throw new Error('Expected a mounted image');
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
    );
  };
  const open = async (opener, custom = true) => {
    await opener.click({ position: { x: 6, y: 6 } });
    await dialog().waitFor({ state: 'visible' });
    if (custom) await waitLoaded(image());
    const node = await dialog().elementHandle();
    if (!node) throw new Error('Expected the real preview root');
    await page.waitForFunction(
      (node) => node.isConnected && getComputedStyle(node).opacity === '1',
      node,
    );
    assert.equal(await dialog().evaluate((node) => node.contains(document.activeElement)), true);
  };
  const same = async (locator, saved) =>
    assert.equal(await locator.evaluate((node, original) => node === original, saved), true);
  const close = async (opener) => {
    await action('Close preview').click();
    await dialog().waitFor({ state: 'hidden' });
    assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  };

  for (const kind of ['image', 'group']) {
    assert.equal(await dialog().count(), 0);
    const session = (await state()).session;
    await click(`Mount preview slot ${kind}`);
    await waitState('session', session + 1);
    const opener = target.locator('[data-preview-slots-trigger]');
    await waitLoaded(opener.locator('img'));
    await open(opener);
    assert.equal(await dialog().locator('[data-preview-custom-image]').count(), 1);
    assert.equal(await dialog().locator('[data-preview-custom-actions]').count(), 1);
    if (kind === 'group')
      assert.equal(await dialog().locator('[data-preview-custom-count]').textContent(), '1 of 2');
    const violations = await dialog().evaluate(
      async (node) => (await window.axe.run(node)).violations,
    );
    assert.deepEqual(violations, [], 'the actual rich preview passes axe without exclusions');

    const originalImage = await image().elementHandle();
    const input = dialog().getByRole('textbox', { name: 'Live preview note', exact: true });
    await input.fill('Draft preview caption');
    await page.keyboard.press('ArrowRight');
    assert.equal((await state()).current, 0, 'native input arrows retain editing behavior');
    const originalInput = await input.elementHandle();
    await input.evaluate((node) => node.setSelectionRange(2, 6));
    const previousSource = await image().getAttribute('src');
    await click('Update live preview content');
    await waitState('revision', 1);
    await waitLoaded(image());
    await same(input, originalInput);
    await same(image(), originalImage);
    assert.notEqual(await image().getAttribute('src'), previousSource);
    assert.equal(await input.inputValue(), 'Draft preview caption');
    assert.deepEqual(
      await input.evaluate((node) => [node.selectionStart, node.selectionEnd]),
      [2, 6],
    );
    assert.equal(await input.evaluate((node) => document.activeElement === node), true);
    assert.match(await dialog().locator('figcaption').textContent(), /^1:Slot first 1/);

    const rich = dialog().getByRole('textbox', { name: 'Rich preview note', exact: true });
    await rich.fill('Rich draft');
    await page.keyboard.press('ArrowLeft');
    assert.equal(
      (await state()).current,
      0,
      'native contenteditable arrows do not navigate the group',
    );
    assert.equal(await rich.textContent(), 'Rich draft');
    await image().dblclick();
    await waitTransform('scale', 1.5);
    await image().dblclick();
    await waitTransform('scale', 1);
    await action('Slot rotate').click();
    await waitTransform('rotate', 90);
    assert.match(await image().getAttribute('style'), /rotate\(90deg\)/);
    if (kind === 'group') {
      await action('Next image').click();
      await waitState('current', 1);
      assert.equal(await image().getAttribute('alt'), 'Slot second');
      assert.equal(await dialog().locator('[data-preview-custom-count]').textContent(), '2 of 2');
      await same(input, originalInput);
      assert.equal(await input.inputValue(), 'Draft preview caption');
      assert.equal(await dialog().evaluate((node) => node.contains(document.activeElement)), true);
    }
    await action('Slot reset').click();
    await waitTransform('rotate', 0);
    const last = action('Slot close');
    await last.focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await input.evaluate((node) => document.activeElement === node),
      true,
      'last Tab wraps to the first native focusable, the editor before the close button',
    );
    await page.keyboard.press('Shift+Tab');
    assert.equal(await last.evaluate((node) => document.activeElement === node), true);

    await click('Toggle preview slot presence');
    await waitState('present', false);
    assert.equal(await dialog().locator('[data-preview-custom-image]').count(), 0);
    assert.equal(await dialog().locator('[data-preview-custom-actions]').count(), 0);
    await waitLoaded(image());
    assert.equal(await action('rotateRight').count(), 1);
    await click('Toggle preview slot presence');
    await waitState('present', true);
    assert.equal(
      await dialog().getByRole('textbox', { name: 'Live preview note', exact: true }).inputValue(),
      'Draft preview caption',
    );
    await click('Toggle empty preview slots');
    await waitState('empty', true);
    assert.equal(await image().count(), 0);
    assert.equal(await dialog().locator('.apollo-image-preview-actions').count(), 0);
    assert.equal(await dialog().locator('.apollo-image-preview-progress').count(), 0);
    assert.equal(await dialog().locator('.apollo-image-preview-body').textContent(), '');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await dialog().evaluate((node) => node.contains(document.activeElement)), true);
    await click('Toggle preview slot presence');
    await waitState('present', false);
    await waitLoaded(image());
    assert.equal(await action('rotateRight').count(), 1);
    if (kind === 'group')
      assert.equal(await dialog().locator('.apollo-image-preview-progress').textContent(), '2 / 2');
    await close(opener);
  }

  const demo = fixture.locator('[data-image-preview-slots-demo]');
  const demoState = async () =>
    JSON.parse(await demo.locator('[data-image-preview-slots-demo-state]').textContent());
  const demoOpener = demo.locator('[data-preview-demo-first]');
  await waitLoaded(demoOpener.locator('img'));
  await open(demoOpener);
  assert.equal(await dialog().locator('[data-preview-demo-image]').count(), 1);
  const demoViolations = await dialog().evaluate(
    async (node) => (await window.axe.run(node)).violations,
  );
  assert.deepEqual(demoViolations, [], 'the actual three-slot demo passes the full axe rules');
  await dialog().getByRole('textbox', { name: 'Preview caption', exact: true }).fill('Demo draft');
  await page.keyboard.press('ArrowRight');
  assert.equal((await demoState()).current, 0);
  await action('Next image').click();
  assert.equal(await dialog().locator('[data-preview-demo-count]').textContent(), 'Image 2 of 2');
  assert.equal(
    await dialog().getByRole('textbox', { name: 'Preview caption', exact: true }).inputValue(),
    'Demo draft',
  );
  await action('Custom preview zoom').click();
  assert.equal((await demoState()).transformed.scale, 1.5);
  await action('Reset preview transform').click();
  assert.equal((await demoState()).transformed.scale, 1);
  await close(demoOpener);
  assert.equal((await demoState()).note, 'Demo draft');
  await demo.getByRole('button', { name: 'Toggle custom preview slots', exact: true }).click();
  await open(demoOpener);
  assert.equal(await dialog().locator('[data-preview-demo-image]').count(), 0);
  assert.equal(await action('rotateRight').count(), 1);
  await close(demoOpener);
  await demo.getByRole('button', { name: 'Toggle custom preview slots', exact: true }).click();
  await demo.getByRole('button', { name: 'Empty preview slots', exact: true }).click();
  await open(demoOpener, false);
  assert.equal(await image().count(), 0);
  assert.equal(await dialog().locator('.apollo-image-preview-actions').count(), 0);
  await close(demoOpener);
  assert.deepEqual(errors, [], 'zero Vue warnings, console errors and page errors');
  console.log(
    `PASS Chrome ${browser.version()}: Image/Group preview slots, axe without exclusions, live source/scope updates, stable editor/image/selection, native input/contenteditable keys, original image gestures, typed actions, counter/navigation, empty/remove/default restoration, Tab loops, close focus and the actual three-slot demo.`,
  );
} finally {
  await browser?.close();
  await server?.httpServer?.close();
  rmSync(outDir, { recursive: true, force: true });
}
