/** Mentions core Vue events against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-mentions-events-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=mentions-events`);
  const editor = page.getByRole('textbox', { name: 'Core mention events', exact: true });
  const state = async () => JSON.parse(await page.locator('#mention-events').innerText());
  await editor.dispatchEvent('change');
  await editor.dispatchEvent('select');
  assert.deepEqual((await state()).once, { change: 0, search: 0, select: 0 });
  await editor.press('@');
  await page.getByRole('menuitem').first().waitFor();
  assert.equal((await state()).models, 1);
  assert.deepEqual((await state()).changes, ['@']);
  assert.equal((await state()).inputs, 1);
  await editor.press('Enter');
  assert.equal(await editor.inputValue(), '@alpha ');
  assert.deepEqual((await state()).selections, ['@alpha']);
  assert.equal((await state()).models, 2);
  await page.getByRole('button', { name: 'Replace change listener', exact: true }).click();
  await editor.fill('');
  await editor.press('@');
  await editor.press('b');
  await page.getByRole('menuitem').first().waitFor();
  await editor.press('Enter');
  const result = await state();
  assert.equal(result.value, '@beta ');
  assert.deepEqual(result.selections, ['@alpha', '@beta']);
  assert.deepEqual(result.once, { change: 1, search: 1, select: 1 });
  assert.equal(result.old, 2);
  assert.equal(result.current, 4);
  assert.equal(result.models, 6);
  assert.equal(result.inputs, 4);
  assert.equal(result.changes.length, 6);
  assert.ok(result.searches.includes('@b'));
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: single input/model/change, native-event isolation, typed once events, listener arrays/replacement, search and two candidate selections; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
