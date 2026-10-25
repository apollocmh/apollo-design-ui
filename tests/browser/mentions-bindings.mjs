/** Mentions outer-root styles and silent state against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-mentions-bindings-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=mentions-bindings`);
  const modes = ['bare', 'clear', 'feedback'];
  const editors = [];
  const roots = [];
  for (const mode of modes) {
    const field = page.locator(`.binding-${mode}`);
    const editor = field.locator('textarea');
    await editor.fill(`kept ${mode}`);
    editors.push(await editor.elementHandle());
    roots.push(await field.elementHandle());
    assert.equal(await field.evaluate((node) => getComputedStyle(node).maxWidth), '300px');
    assert.equal(await field.evaluate((node) => node.style.minHeight), '62px');
    assert.equal(
      await field.evaluate((node) => node.style.getPropertyValue('--native-phase')),
      'first',
    );
    assert.equal(await editor.evaluate((node) => node.style.maxWidth), '');
    assert.equal(
      await editor.evaluate((node) => node.classList.contains('native-mention-root')),
      false,
    );
    assert.equal(await editor.getAttribute('id'), `binding-${mode}-input`);
  }
  await page.getByRole('button', { name: 'Cycle mention root styles', exact: true }).click();
  for (const [index, mode] of modes.entries()) {
    const field = page.locator(`.binding-${mode}`);
    assert.equal(await field.evaluate((node, original) => node === original, roots[index]), true);
    assert.equal(await field.evaluate((node) => node.style.maxWidth), '340px');
    assert.equal(await field.evaluate((node) => node.style.paddingTop), '');
    assert.equal(await field.evaluate((node) => node.style.paddingBottom), '10px');
    assert.equal(await field.evaluate((node) => node.classList.contains('first')), false);
    assert.equal(await field.evaluate((node) => node.classList.contains('next')), true);
  }
  await page.getByRole('button', { name: 'Cycle mention root styles', exact: true }).click();
  for (const [index, mode] of modes.entries()) {
    const field = page.locator(`.binding-${mode}`);
    const editor = field.locator('textarea');
    assert.equal(await field.evaluate((node) => node.style.maxWidth), '240px');
    assert.equal(await field.evaluate((node) => node.style.minHeight), '62px');
    assert.equal(await field.evaluate((node) => node.style.paddingBottom), '');
    assert.equal(await field.evaluate((node) => node.style.getPropertyValue('--native-phase')), '');
    assert.equal(await editor.inputValue(), `kept ${mode}`);
    assert.equal(
      await editor.evaluate((node, original) => node === original, editors[index]),
      true,
    );
  }
  assert.equal(await page.locator('.binding-feedback .apollo-mentions-suffix').count(), 1);
  const editor = page.getByRole('textbox', { name: 'Clear mentions binding', exact: true });
  await editor.fill('');
  await editor.press('@');
  await page.getByRole('menuitem').first().waitFor();
  await editor.press('Enter');
  assert.equal(await editor.inputValue(), '@');
  assert.equal(await page.locator('[data-native-selections]').innerText(), '0');
  await page.getByRole('button', { name: 'Toggle mention loading', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle explicit silent', exact: true }).click();
  await editor.press('Enter');
  assert.equal(await editor.inputValue(), '@');
  assert.equal(await page.locator('[data-native-selections]').innerText(), '0');
  await page.getByRole('button', { name: 'Toggle mention loading', exact: true }).click();
  await editor.press('Enter');
  assert.equal(await editor.inputValue(), '@alpha ');
  assert.equal(await page.locator('[data-native-selections]').innerText(), '1');
  assert.equal(await editor.evaluate((node) => document.activeElement === node), true);
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: bare/clear/Form feedback root style forms and removal, stable roots/editors, inner id/ARIA routing, current silent/loading suppression and one selection; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
