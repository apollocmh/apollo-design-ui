/** Mentions native empty content against production dist and its actual async demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-mentions-empty-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=mentions-empty`);
  const editor = page.getByRole('textbox', { name: 'Search mention users', exact: true });
  const original = await editor.elementHandle();
  const menu = page.getByRole('menu');
  const message = page.locator('[data-native-empty-message]');
  const waitText = async (locator, text) => {
    await page.waitForFunction(
      ({ selector, expected }) => document.querySelector(selector)?.textContent === expected,
      { selector: locator, expected: text },
    );
  };
  const keepEditor = async (value) => {
    assert.equal(await editor.evaluate((node, saved) => node === saved, original), true);
    assert.equal(await editor.evaluate((node) => document.activeElement === node), true);
    assert.equal(await editor.inputValue(), value);
  };
  await editor.press('@');
  await message.waitFor();
  assert.equal(await message.innerText(), 'No users for all users · 0');
  for (const key of 'missing') await editor.press(key);
  await waitText('[data-native-empty-message]', 'No users for missing · 0');
  const originalMessage = await message.elementHandle();
  await page.getByRole('button', { name: 'Update empty message', exact: true }).click();
  await waitText('[data-native-empty-message]', 'No users for missing · 1');
  assert.equal(await message.evaluate((node, saved) => node === saved, originalMessage), true);
  await keepEditor('@missing');
  await page.getByRole('button', { name: 'Empty custom message', exact: true }).click();
  assert.equal(await message.count(), 0);
  assert.equal(await menu.innerText(), '');
  assert.equal(await menu.getByRole('menuitem').getAttribute('aria-disabled'), 'true');
  await keepEditor('@missing');
  await page.getByRole('button', { name: 'Toggle custom empty message', exact: true }).click();
  await waitText('[role="menu"]', 'Default empty message for missing');
  await editor.press('x');
  await waitText('[role="menu"]', 'Default empty message for missingx');
  await keepEditor('@missingx');
  await page.getByRole('button', { name: 'Toggle custom empty message', exact: true }).click();
  assert.equal(await menu.innerText(), '');
  await page.getByRole('button', { name: 'Empty custom message', exact: true }).click();
  await waitText('[data-native-empty-message]', 'No users for missingx · 1');
  await keepEditor('@missingx');
  await editor.fill('');
  await editor.press('@');
  for (const key of 'afc') await editor.press(key);
  await page.getByRole('menuitem').filter({ hasText: 'afc163' }).waitFor();
  assert.equal(await message.count(), 0);
  await editor.press('Enter');
  await keepEditor('@afc163 ');
  assert.equal(await page.locator('[data-async-mention-selections]').innerText(), 'Selections: 1');
  assert.equal(await page.locator('[data-async-mention-value]').textContent(), '@afc163 ');
  await page.locator('.apollo-mentions-clear-icon').click();
  await keepEditor('');
  await editor.press('@');
  await waitText('[data-native-empty-message]', 'No users for all users · 1');
  assert.equal(await page.locator('[data-async-mention-selections]').innerText(), 'Selections: 1');
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: actual async demo current/empty/removed native empty slot, current prop fallback, stable message/editor/value/focus, async candidates/one selection and clear; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
