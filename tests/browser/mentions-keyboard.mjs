/** Mentions standard native keyboard against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-mentions-keyboard-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=mentions-keyboard`);
  const editor = page.getByRole('textbox', { name: 'Standard mention keyboard', exact: true });
  const original = await editor.elementHandle();
  const state = async () => JSON.parse(await page.locator('#mention-keyboard').innerText());
  const active = () => page.locator('.apollo-mentions-dropdown-menu-item-active').innerText();
  const dispatch = (key, type = 'keydown', which = 0, isComposing = false) =>
    editor.evaluate(
      (node, init) => {
        const event = new KeyboardEvent(init.type, {
          key: init.key,
          which: init.which,
          isComposing: init.isComposing,
          bubbles: true,
          cancelable: true,
        });
        node.dispatchEvent(event);
        return { which: event.which, prevented: event.defaultPrevented };
      },
      { key, type, which, isComposing },
    );
  const open = async () => {
    await editor.fill('');
    await editor.press('@');
    await page.getByRole('menuitem').first().waitFor();
  };
  await open();
  assert.equal(await active(), 'Alpha');
  assert.deepEqual(await dispatch('ArrowDown'), { which: 0, prevented: true });
  assert.equal(await active(), 'Beta');
  const searches = (await state()).searches;
  await dispatch('ArrowDown', 'keyup');
  assert.equal(await active(), 'Beta');
  assert.equal((await state()).searches, searches);
  await dispatch('ArrowUp');
  assert.equal(await active(), 'Alpha');
  await dispatch('Enter');
  assert.equal(await editor.inputValue(), '@alpha ');
  assert.equal(await editor.evaluate((node) => node.selectionStart), 7);
  assert.deepEqual((await state()).selections, ['alpha']);
  await open();
  const beforeEscape = (await state()).searches;
  await dispatch('Escape');
  await dispatch('Escape', 'keyup');
  assert.equal(await page.getByRole('menu').count(), 0);
  assert.equal((await state()).searches, beforeEscape);
  await open();
  await dispatch('ArrowDown', 'keydown', 13);
  assert.equal(await active(), 'Beta');
  await dispatch('F2', 'keydown', 13);
  assert.deepEqual((await state()).selections, ['alpha']);
  await dispatch('Enter');
  assert.equal(await editor.inputValue(), '@beta ');
  await open();
  for (const [key, which] of [
    ['ArrowDown', 40],
    ['Enter', 13],
  ]) {
    assert.equal((await dispatch(key, 'keydown', which, true)).prevented, false);
    assert.equal(await active(), 'Alpha');
    assert.equal(await editor.inputValue(), '@');
  }
  assert.deepEqual((await state()).selections, ['alpha', 'beta']);
  assert.equal((await state()).keys.at(-1).isComposing, true);
  await dispatch('Enter');
  assert.equal(await editor.inputValue(), '@alpha ');
  assert.deepEqual((await state()).selections, ['alpha', 'beta', 'alpha']);
  assert.equal(await editor.evaluate((node, saved) => node === saved, original), true);
  assert.equal(await editor.evaluate((node) => document.activeElement === node), true);
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: key-only arrows/Enter/Escape, disabled skipping, no keyup re-search/reopen, authoritative key over which, composing control keys untouched, stable editor/focus/caret and single selection; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
