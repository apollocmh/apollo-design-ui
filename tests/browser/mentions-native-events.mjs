/** Mentions native Vue events against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-mentions-native-events-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=mentions-native-events`);
  const editor = page.getByRole('textbox', { name: 'Native mention events', exact: true });
  const state = async () => JSON.parse(await page.locator('#native-mention-events').innerText());
  await editor.focus();
  assert.equal((await state()).focus, 1);
  assert.equal(
    await editor.evaluate((node) =>
      node.closest('.apollo-mentions').classList.contains('apollo-mentions-focused'),
    ),
    true,
  );
  await editor.press('F2');
  assert.equal((await state()).prevented, true);
  assert.equal((await state()).down, 1);
  assert.equal((await state()).up, 1);
  assert.equal((await state()).bubbles, 0);
  await page.getByRole('button', { name: 'Leave mentions', exact: true }).click();
  await page.waitForFunction(
    () => JSON.parse(document.querySelector('#native-mention-events').textContent).blur === 1,
  );
  assert.equal(
    await editor.evaluate((node) =>
      node.closest('.apollo-mentions').classList.contains('apollo-mentions-focused'),
    ),
    false,
  );
  await page.getByRole('button', { name: 'Replace native listeners', exact: true }).click();
  await editor.focus();
  await editor.press('Enter');
  await editor.press('Enter');
  assert.equal((await state()).enter, 2);
  assert.equal((await state()).enterOnce, 1);
  await editor.fill('');
  await editor.press('@');
  const menu = page.getByRole('menu');
  await menu.waitFor();
  await menu.dispatchEvent('scroll');
  await menu.dispatchEvent('scroll');
  assert.equal((await state()).scroll, 2);
  assert.equal((await state()).scrollOnce, 1);
  await editor.press('Enter');
  assert.equal(await editor.inputValue(), '@alpha ');
  assert.equal((await state()).enter, 2);
  await page.locator('.apollo-mentions-clear-icon').click();
  await editor.fill('again');
  await page.locator('.apollo-mentions-clear-icon').click();
  assert.equal(await editor.inputValue(), '');
  await page.getByRole('button', { name: 'Leave mentions', exact: true }).click();
  await page.waitForFunction(
    () =>
      JSON.parse(document.querySelector('#native-mention-events').textContent).currentBlur === 1,
  );
  const result = await state();
  assert.equal(result.currentFocus, 1);
  assert.equal(result.focusOnce, 1);
  assert.equal(result.blurOnce, 1);
  assert.equal(result.clear, 2);
  assert.equal(result.clearOnce, 1);
  assert.equal(result.inputOnce, 1);
  assert.ok(result.input >= 3);
  assert.ok(result.resize >= 2);
  assert.equal(result.resizeOnce, 1);
  assert.equal(result.bubbles, 0);
  for (const key of [
    'validFocus',
    'validBlur',
    'validKeys',
    'validInput',
    'validScroll',
    'validResize',
  ])
    assert.equal(result[key], true, key);
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: native focus/blur/input/key payloads and modifiers, current listener arrays, once for clear/pressEnter/popupScroll/resize, wrapped focus class; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
