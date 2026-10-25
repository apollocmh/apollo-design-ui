/** Image native top-level render slot against production dist and the actual demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-render-'));
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
  const page = await browser.newPage();
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-render`);
  const demo = page.locator('[data-image-render-demo]');
  const rootImage = demo.locator('.apollo-image');
  const originalRoot = await rootImage.elementHandle();
  const figure = demo.locator('[data-native-image-render]');
  const image = () => rootImage.locator('img.apollo-image-img');
  const waitLoaded = async (locator) => {
    const node = await locator.elementHandle();
    if (!node) throw new Error('Expected a rendered image');
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
      { timeout: 10000 },
    );
  };
  await waitLoaded(image());
  const originalImage = await image().elementHandle();
  const originalSource = await image().getAttribute('src');
  const input = page.getByRole('textbox', { name: 'Image render note', exact: true });
  await input.fill('kept image note');
  const originalInput = await input.elementHandle();
  await input.click();
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.equal(await image().getAttribute('alt'), 'Custom image 0');
  assert.equal(await image().getAttribute('width'), '200');
  assert.equal(await image().getAttribute('height'), '120');
  assert.equal(await figure.getAttribute('data-image-src'), await image().getAttribute('src'));
  assert.equal(await figure.getAttribute('data-image-title'), 'Image title 0');
  assert.equal(await figure.getAttribute('data-image-class'), 'native-render-image-0');
  await demo.getByRole('button', { name: 'Update image content', exact: true }).click();
  await waitLoaded(image());
  assert.equal(await rootImage.evaluate((node, original) => node === original, originalRoot), true);
  assert.equal(await image().evaluate((node, original) => node === original, originalImage), true);
  assert.equal(await input.evaluate((node, original) => node === original, originalInput), true);
  assert.equal(await input.inputValue(), 'kept image note');
  assert.equal(await input.evaluate((node) => document.activeElement === node), true);
  assert.equal(await image().getAttribute('alt'), 'Custom image 1');
  assert.notEqual(await image().getAttribute('src'), originalSource);
  assert.equal(await image().getAttribute('width'), '220');
  assert.equal(await image().getAttribute('height'), '130');
  assert.equal(await figure.getAttribute('data-image-src'), await image().getAttribute('src'));
  assert.equal(await figure.getAttribute('data-image-title'), 'Image title 1');
  assert.equal(await figure.getAttribute('data-image-class'), 'native-render-image-1');
  assert.equal(
    await image().evaluate((node) => node.classList.contains('native-render-image-1')),
    true,
  );
  assert.equal(await image().evaluate((node) => node.style.objectFit), 'cover');
  assert.equal(
    await demo.locator('[data-native-image-caption]').innerText(),
    'Caption 1 · Custom image 1 · 220 × 130',
  );
  const loads = Number(await demo.locator('[data-image-render-loads]').innerText());
  const errorsBefore = Number(await demo.locator('[data-image-render-errors]').innerText());
  await image().dispatchEvent('load');
  await image().dispatchEvent('error');
  assert.equal(Number(await demo.locator('[data-image-render-loads]').innerText()), loads + 1);
  assert.equal(
    Number(await demo.locator('[data-image-render-errors]').innerText()),
    errorsBefore + 1,
  );
  await demo.getByRole('button', { name: 'Empty image render slot', exact: true }).click();
  assert.equal(await figure.count(), 0);
  assert.equal(await image().count(), 0, 'an existing empty slot must suppress the default img');
  await demo.getByRole('button', { name: 'Toggle image render slot', exact: true }).click();
  await waitLoaded(image());
  assert.equal(await figure.count(), 0);
  assert.equal(await image().count(), 1);
  assert.equal(await image().getAttribute('alt'), 'Custom image 1');
  await demo.getByRole('button', { name: 'Update image content', exact: true }).click();
  await waitLoaded(image());
  assert.equal(await image().getAttribute('alt'), 'Custom image 2');
  assert.equal(await image().getAttribute('src'), originalSource);
  assert.equal(await image().getAttribute('width'), '240');
  await demo.getByRole('button', { name: 'Toggle image render slot', exact: true }).click();
  assert.equal(await image().count(), 0);
  await demo.getByRole('button', { name: 'Empty image render slot', exact: true }).click();
  await waitLoaded(image());
  assert.equal(
    await demo.locator('[data-native-image-caption]').innerText(),
    'Caption 2 · Custom image 2 · 240 × 140',
  );
  assert.equal(await figure.getAttribute('data-image-src'), await image().getAttribute('src'));
  const standaloneRoot = page.locator('[data-standalone-preview] .apollo-image');
  await standaloneRoot.click({ position: { x: 10, y: 10 } });
  const standaloneDialog = page.getByRole('dialog', {
    name: 'Standalone render preview',
    exact: true,
  });
  await standaloneDialog.waitFor();
  assert.equal(
    await standaloneDialog.locator('.apollo-image-preview-img').getAttribute('alt'),
    'Standalone render preview',
  );
  await standaloneDialog.locator('.apollo-image-preview-close').click();
  await standaloneDialog.waitFor({ state: 'hidden' });
  const groupRoot = page.locator('[data-group-render-first] .apollo-image');
  const groupImage = groupRoot.locator('img.apollo-image-img');
  const originalGroupImage = await groupImage.elementHandle();
  await groupRoot.click({ position: { x: 10, y: 10 } });
  const firstDialog = page.getByRole('dialog', { name: 'Group rendered image 0', exact: true });
  await firstDialog.waitFor();
  assert.equal(
    await firstDialog.locator('.apollo-image-preview-img').getAttribute('src'),
    await groupImage.getAttribute('src'),
  );
  assert.match(await firstDialog.locator('.apollo-image-preview-progress').innerText(), /\/ 2$/);
  await firstDialog.press('Escape');
  await firstDialog.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Update group image', exact: true }).click();
  await waitLoaded(groupImage);
  assert.equal(
    await groupImage.evaluate((node, original) => node === original, originalGroupImage),
    true,
  );
  assert.equal(
    await groupRoot.locator('[data-group-image-render]').getAttribute('data-group-src'),
    await groupImage.getAttribute('src'),
  );
  await groupRoot.click({ position: { x: 10, y: 10 } });
  const currentDialog = page.getByRole('dialog', { name: 'Group rendered image 1', exact: true });
  await currentDialog.waitFor();
  assert.equal(
    await currentDialog.locator('.apollo-image-preview-img').getAttribute('src'),
    await groupImage.getAttribute('src'),
  );
  assert.match(await currentDialog.locator('.apollo-image-preview-progress').innerText(), /\/ 2$/);
  await currentDialog.locator('.apollo-image-preview-close').click();
  await currentDialog.waitFor({ state: 'hidden' });

  // Missing/disabled transitions must still finish leave without a DOM end event.
  await page.addStyleTag({
    content:
      '.apollo-image-preview-fade,.apollo-image-preview-fade *{transition:none!important;animation:none!important}',
  });
  await standaloneRoot.click({ position: { x: 10, y: 10 } });
  await standaloneDialog.waitFor();
  assert.equal(
    await standaloneDialog.evaluate((node) => getComputedStyle(node).transitionDuration),
    '0s',
  );
  const unexpectedEndEvents = [];
  await page.exposeFunction('recordImageMotionEnd', () => unexpectedEndEvents.push('end'));
  await standaloneDialog.evaluate((node) => {
    node.addEventListener('transitionend', () => window.recordImageMotionEnd());
    node.addEventListener('animationend', () => window.recordImageMotionEnd());
  });
  await standaloneDialog.locator('.apollo-image-preview-close').click();
  await standaloneDialog.waitFor({ state: 'hidden' });
  assert.deepEqual(unexpectedEndEvents, []);
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: actual native Image template current caption/src/alt/size/title/image class, stable img/input/draft/focus, empty-slot suppression and removal fallback, one DOM load/error dispatch, standalone preview and current PreviewGroup registration, leave completion with disabled transitions and no end event; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
