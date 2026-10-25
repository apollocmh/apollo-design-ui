/** Mentions native popup template and original keyboard menu against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-mentions-popup-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=mentions-popup`);
  const editor = page.getByRole('textbox', { name: 'Custom mention editor', exact: true });
  await editor.focus();
  const editorNode = await editor.elementHandle();
  await editor.press('@');
  const popup = page.locator('[data-native-mentions-popup]');
  await popup.waitFor();
  const items = page.getByRole('menuitem');
  assert.equal(await items.count(), 3);
  assert.match(await popup.innerText(), /Custom Header 0/);
  const popupNode = await popup.elementHandle();
  await page.getByRole('button', { name: 'Update mention header', exact: true }).click();
  assert.match(await popup.innerText(), /Custom Header 1/);
  assert.equal(await popup.evaluate((node, original) => node === original, popupNode), true);
  await page.getByRole('button', { name: 'Update mention options', exact: true }).click();
  assert.equal(await items.nth(1).innerText(), 'zombieJ updated');
  await page.getByRole('button', { name: 'Toggle mention popup slot', exact: true }).click();
  assert.equal(await popup.count(), 0);
  assert.equal(await items.count(), 3);
  await page.getByRole('button', { name: 'Toggle mention popup slot', exact: true }).click();
  await page.getByRole('button', { name: 'Empty mention popup slot', exact: true }).click();
  assert.equal(await popup.count(), 0);
  assert.equal(await items.count(), 0);
  await page.getByRole('button', { name: 'Toggle mention popup slot', exact: true }).click();
  assert.equal(await items.count(), 3);
  await page.getByRole('button', { name: 'Toggle mention popup slot', exact: true }).click();
  assert.equal(await items.count(), 0);
  await page.getByRole('button', { name: 'Empty mention popup slot', exact: true }).click();
  assert.equal(await items.count(), 3);
  assert.equal(await editor.inputValue(), '@');
  assert.equal(await editor.evaluate((node, original) => node === original, editorNode), true);
  assert.equal(await editor.evaluate((node) => document.activeElement === node), true);
  await editor.press('ArrowDown');
  await editor.press('Enter');
  assert.equal(await editor.inputValue(), '@zombieJ ');
  assert.equal(await page.locator('[data-mention-value]').textContent(), '@zombieJ ');
  assert.equal(await editor.evaluate((node) => node.selectionStart), 9);
  await page.locator('.apollo-mentions-clear-icon').click();
  assert.equal(await editor.inputValue(), '');
  assert.equal(await editor.evaluate((node, original) => node === original, editorNode), true);
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: current/empty/removed Mentions popup slots, updated origin menu, stable editor/value/focus, keyboard selection/caret and clear; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
