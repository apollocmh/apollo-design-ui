/** Current provider direction, default/custom gallery icons and editor state in real Chrome. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-direction-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-direction`);
  const fixture = page.locator('[data-image-direction-fixture]');
  const target = fixture.locator('[data-image-direction-target]');
  const dialog = () => page.getByRole('dialog');
  const action = (name) => dialog().getByRole('button', { name, exact: true });
  const prev = () => action('Previous image');
  const next = () => action('Next image');
  const click = (name) =>
    fixture
      .locator('[data-image-direction-controls]')
      .getByRole('button', { name, exact: true })
      .click();
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-direction-state]').textContent());
  const waitState = async (key, value) =>
    page.waitForFunction(
      ({ key, value }) => {
        const text = document.querySelector('[data-image-direction-state]')?.textContent;
        return text && JSON.parse(text)[key] === value;
      },
      { key, value },
    );
  const svg = async (button) => button.locator('svg').evaluate((node) => node.innerHTML);
  const marker = async (button) =>
    button.locator('[data-direction-icon]').getAttribute('data-direction-icon');
  const waitLoaded = async (locator) => {
    const node = await locator.elementHandle();
    if (!node) throw new Error('Expected actual gallery image');
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
    );
  };
  const open = async (opener) => {
    await opener.click({ position: { x: 6, y: 6 } });
    await dialog().waitFor({ state: 'visible' });
    await waitLoaded(dialog().locator('img'));
    const node = await dialog().elementHandle();
    await page.waitForFunction((node) => node && getComputedStyle(node).opacity === '1', node);
  };
  let leftSvg;
  let rightSvg;
  for (const initial of ['LTR', 'RTL']) {
    await click(`Mount ${initial} gallery`);
    await waitState('direction', initial.toLowerCase());
    const opener = target.locator('[data-direction-trigger]');
    await waitLoaded(opener.locator('img'));
    await open(opener);
    assert.equal(await prev().locator('svg').count(), 1);
    assert.equal(await next().locator('svg').count(), 1);
    if (initial === 'LTR') {
      leftSvg = await svg(prev());
      rightSvg = await svg(next());
      assert.notEqual(leftSvg, rightSvg);
    } else {
      assert.equal(await svg(prev()), rightSvg);
      assert.equal(await svg(next()), leftSvg);
    }
    await action('rotateRight').click();
    const editor = dialog().getByRole('textbox', { name: 'Gallery direction note', exact: true });
    await editor.fill('Kept RTL draft');
    await editor.evaluate((node) => node.setSelectionRange(1, 4));
    const saved = {
      root: await dialog().elementHandle(),
      image: await dialog().locator('img').elementHandle(),
      editor: await editor.elementHandle(),
    };
    const stable = async () => {
      assert.equal(
        await dialog().evaluate((node, original) => node === original, saved.root),
        true,
      );
      assert.equal(
        await dialog()
          .locator('img')
          .evaluate((node, original) => node === original, saved.image),
        true,
      );
      assert.equal(
        await editor.evaluate((node, original) => node === original, saved.editor),
        true,
      );
      assert.equal(await editor.inputValue(), 'Kept RTL draft');
      assert.equal(await editor.evaluate((node) => document.activeElement === node), true);
      assert.deepEqual(
        await editor.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [1, 4],
      );
      assert.match(await dialog().locator('img').getAttribute('style'), /rotate\(90deg\)/);
    };
    for (let index = 0; index < 2; index++) {
      const expected = (await state()).direction === 'ltr' ? 'rtl' : 'ltr';
      await click('Toggle gallery direction');
      await waitState('direction', expected);
      assert.equal(await svg(prev()), expected === 'rtl' ? rightSvg : leftSvg);
      assert.equal(await svg(next()), expected === 'rtl' ? leftSvg : rightSvg);
      await stable();
    }
    if ((await state()).direction !== 'rtl') {
      await click('Toggle gallery direction');
      await waitState('direction', 'rtl');
    }
    await click('Use custom gallery icons');
    await waitState('mode', 'custom');
    assert.equal(await marker(prev()), 'right');
    assert.equal(await marker(next()), 'left');
    await stable();
    await click('Toggle gallery direction');
    await waitState('direction', 'ltr');
    assert.equal(await marker(prev()), 'left');
    assert.equal(await marker(next()), 'right');
    await stable();
    await click('Toggle gallery direction');
    await waitState('direction', 'rtl');
    await click('Use partial gallery icons');
    await waitState('mode', 'partial');
    assert.equal(await svg(prev()), rightSvg);
    assert.equal(await marker(next()), 'left');
    await stable();
    await click('Use empty gallery icon');
    await waitState('mode', 'empty');
    assert.equal(await svg(prev()), rightSvg);
    assert.equal(await next().evaluate((node) => node.childNodes.length), 0);
    await stable();
    await click('Use default gallery icons');
    await waitState('mode', 'default');
    assert.equal(await svg(prev()), rightSvg);
    assert.equal(await svg(next()), leftSvg);
    await stable();
    await next().click();
    await waitState('current', 1);
    assert.equal(await dialog().locator('img').getAttribute('alt'), 'Direction gallery second');
    await prev().click();
    await waitState('current', 0);
    await action('Close preview').click();
    await dialog().waitFor({ state: 'hidden' });
    assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  }
  const demo = fixture.locator('[data-image-popup-provider-demo]');
  const opener = demo.locator('[data-popup-demo-group]');
  await waitLoaded(opener.locator('img'));
  await open(opener);
  const directionButton = () => action('Toggle provider icon direction');
  assert.equal(await demo.locator('[data-popup-demo-direction]').textContent(), 'ltr');
  assert.equal(await svg(prev()), leftSvg);
  await directionButton().click();
  assert.equal(await demo.locator('[data-popup-demo-direction]').textContent(), 'rtl');
  assert.equal(await svg(prev()), rightSvg);
  assert.equal(await svg(next()), leftSvg);
  await action('Cycle popup provider').click();
  assert.equal(
    await dialog().evaluate((node) => node.style.getPropertyValue('--popup-demo-mode')),
    'A',
  );
  assert.equal(await svg(prev()), rightSvg);
  await directionButton().click();
  assert.equal(await svg(prev()), leftSvg);
  await page.keyboard.press('Escape');
  await dialog().waitFor({ state: 'hidden' });
  assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  assert.deepEqual(errors, [], 'zero Vue warnings, console errors and page errors');
  console.log(
    `PASS Chrome ${browser.version()}: initial LTR/RTL default SVGs, live default/custom/partial/empty icon mirroring, actual preview/editor/selection/focus/rotation preservation, adjacent-index navigation and real provider demo.`,
  );
} finally {
  await browser?.close();
  await server?.httpServer?.close();
  rmSync(outDir, { recursive: true, force: true });
}
