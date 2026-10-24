/** F11: real Vue Drawer slots and ARIA against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-drawer-slots-'));
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
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=drawer-slots`);
  await page.waitForFunction(() =>
    document.querySelector('[role="dialog"]')?.getAttribute('aria-labelledby'),
  );
  const input = await page.getByRole('textbox', { name: 'Drawer body' }).elementHandle();
  await page.getByRole('textbox', { name: 'Drawer body' }).fill('edited body');
  const checkIdentity = async () => {
    assert.equal(
      await page.evaluate(
        (node) => node === document.querySelector('input[aria-label="Drawer body"]'),
        input,
      ),
      true,
    );
    assert.equal(
      await page.getByRole('textbox', { name: 'Drawer body' }).inputValue(),
      'edited body',
    );
  };
  await page.getByRole('button', { name: 'Toggle Drawer slots' }).click();
  assert.equal(await page.locator('.apollo-drawer-title b').textContent(), 'first');
  assert.equal(await page.locator('.apollo-drawer-footer small').textContent(), 'first');
  assert.equal(await page.locator('.apollo-drawer-extra aside').textContent(), 'first');
  await checkIdentity();
  await page.getByRole('button', { name: 'Update Drawer label' }).click();
  assert.equal(await page.locator('.apollo-drawer-title b').textContent(), 'second');
  await checkIdentity();
  await page.getByRole('button', { name: 'Toggle Drawer empty' }).click();
  assert.equal(
    await page.locator('.apollo-drawer-title, .apollo-drawer-footer, .apollo-drawer-extra').count(),
    0,
  );
  assert.equal(await page.getByRole('dialog').getAttribute('aria-labelledby'), null);
  await checkIdentity();
  await page.getByRole('button', { name: 'Toggle external label' }).click();
  assert.equal(await page.getByRole('dialog').getAttribute('aria-labelledby'), 'external-heading');
  await page.getByRole('button', { name: 'Toggle external label' }).click();
  await page.getByRole('button', { name: 'Toggle Drawer slots' }).click();
  assert.equal(await page.locator('.apollo-drawer-title').textContent(), 'fallback');
  assert.equal(
    await page.getByRole('dialog').getAttribute('aria-labelledby'),
    await page.locator('.apollo-drawer-title').getAttribute('id'),
  );
  await checkIdentity();
  assert.deepEqual(errors, []);
  console.log(
    `PASS F11 Drawer: conditional/empty content slots, current ARIA and explicit external label, body DOM and input value preserved; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
