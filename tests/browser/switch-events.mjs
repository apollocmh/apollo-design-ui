/** D02: real Vue Switch native events against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-switch-events-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=switch-events`);
  const toggle = page.getByRole('switch', { name: 'Native switch', exact: true });
  const state = async () => JSON.parse(await page.locator('#switch-event-state').innerText());
  await toggle.click();
  assert.deepEqual(await state(), {
    checked: true,
    clicks: 1,
    changes: 1,
    captures: 1,
    once: 1,
    bubbles: 0,
    lastClick: 'true:click:true:true',
    lastChange: 'true:click',
  });
  await toggle.press('ArrowLeft');
  assert.equal((await state()).checked, false);
  assert.equal((await state()).changes, 2);
  assert.equal((await state()).lastChange, 'false:keydown');
  assert.equal((await state()).clicks, 1);
  await toggle.press('Enter');
  assert.equal((await state()).checked, true);
  assert.equal((await state()).clicks, 2);
  assert.equal((await state()).changes, 3);
  await toggle.press('Space');
  assert.deepEqual(await state(), {
    checked: false,
    clicks: 3,
    changes: 4,
    captures: 3,
    once: 1,
    bubbles: 0,
    lastClick: 'true:click:true:true',
    lastChange: 'false:click',
  });
  const uncontrolled = page.getByRole('switch', { name: 'Uncontrolled switch', exact: true });
  await uncontrolled.press('Enter');
  assert.equal(await uncontrolled.getAttribute('aria-checked'), 'true');
  await uncontrolled.press('Space');
  assert.equal(await uncontrolled.getAttribute('aria-checked'), 'false');
  await page.getByRole('button', { name: 'Toggle Switch disabled' }).click();
  const before = await state();
  assert.equal(await toggle.isDisabled(), true);
  await toggle.evaluate((button) => button.click());
  await toggle.dispatchEvent('keydown', { key: 'ArrowRight' });
  assert.deepEqual(await state(), before);
  assert.deepEqual(errors, []);
  console.log(
    `PASS D02 Switch: native click modifiers/capture/once, currentTarget, controlled/uncontrolled Enter/Space single activation, arrows and disabled; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
