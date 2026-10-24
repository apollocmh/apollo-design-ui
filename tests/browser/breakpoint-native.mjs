/** Native reactive breakpoint publication against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-breakpoint-native-'));
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
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=breakpoint-native`);
  const steps = page.locator('[data-breakpoint-steps]');
  const avatar = page.locator('[data-breakpoint-avatar]');
  const list = page.locator('[data-breakpoint-list]');
  const cell = list.locator('.apollo-row > div').first();
  const input = page.getByRole('textbox', { name: 'Breakpoint Alpha', exact: true });
  const node = await input.elementHandle();
  await input.fill('kept through breakpoints');
  assert.match(await steps.getAttribute('class'), /apollo-steps-horizontal/);
  assert.equal(await page.locator('#breakpoint-state').innerText(), 'paused');
  assert.equal(await avatar.evaluate((node) => node.style.width), '32px');
  assert.equal(await cell.evaluate((node) => node.style.width), '100%');
  await page.getByRole('button', { name: 'Toggle responsive updates', exact: true }).click();
  assert.equal(await page.locator('#breakpoint-state').innerText(), 'xs');
  assert.match(await steps.getAttribute('class'), /apollo-steps-vertical/);
  assert.equal(await avatar.evaluate((node) => node.style.width), '24px');
  assert.equal(await cell.evaluate((node) => node.style.width), '50%');
  await page.getByRole('button', { name: 'Toggle responsive updates', exact: true }).click();
  await page.setViewportSize({ width: 700, height: 900 });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#breakpoint-state').innerText(), 'xs');
  assert.match(await steps.getAttribute('class'), /apollo-steps-horizontal/);
  await page.getByRole('button', { name: 'Toggle responsive updates', exact: true }).click();
  assert.equal(await page.locator('#breakpoint-state').innerText(), 'wide');
  assert.match(await steps.getAttribute('class'), /apollo-steps-horizontal/);
  assert.equal(await avatar.evaluate((node) => node.style.width), '48px');
  assert.ok(
    Math.abs((await cell.evaluate((node) => parseFloat(node.style.width))) - 100 / 3) < 0.01,
  );
  assert.equal(await input.inputValue(), 'kept through breakpoints');
  assert.equal(await input.evaluate((current, old) => current === old, node), true);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForFunction(
    () => document.querySelector('#breakpoint-state').textContent === 'xs',
  );
  assert.match(await steps.getAttribute('class'), /apollo-steps-vertical/);
  assert.equal(await avatar.evaluate((node) => node.style.width), '24px');
  assert.equal(await cell.evaluate((node) => node.style.width), '50%');
  assert.deepEqual(errors, []);
  console.log(
    `PASS native breakpoint reactivity: enable at current viewport without resize, paused media changes published on resume, live resize, Steps/Avatar/List current values and input identity, zero browser/Vue errors; ${await browser.version()}`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
