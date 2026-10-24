/** Timeline native item slots against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-timeline-slots-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=timeline-slots`);
  const timeline = page.locator('.apollo-timeline');
  const input = page.getByRole('textbox', { name: 'Note created', exact: true });
  await input.fill('native slot state');
  const node = await input.elementHandle();
  const rootNode = await timeline.elementHandle();
  assert.deepEqual(await timeline.locator('time').allTextContents(), ['2026-10-24', '2026-10-25']);
  assert.deepEqual(
    await timeline.locator('.apollo-timeline-item-content strong').allTextContents(),
    ['Created · 0', 'Reviewed · 1'],
  );
  await page.getByRole('button', { name: 'Reverse items', exact: true }).click();
  assert.deepEqual(
    await timeline.locator('.apollo-timeline-item-content strong').allTextContents(),
    ['Reviewed · 0', 'Created · 1'],
  );
  await page.getByRole('button', { name: 'Update item data', exact: true }).click();
  assert.deepEqual(
    await timeline.locator('.apollo-timeline-item-content strong').allTextContents(),
    ['Reviewed! · 0', 'Created! · 1'],
  );
  assert.equal(await input.inputValue(), 'native slot state');
  assert.equal(await input.evaluate((current, old) => current === old, node), true);
  assert.equal(await timeline.evaluate((current, old) => current === old, rootNode), true);
  await page.getByRole('button', { name: 'Toggle empty content', exact: true }).click();
  assert.equal(await timeline.innerText(), '');
  assert.equal(await timeline.locator('time, input, strong').count(), 0);
  assert.doesNotMatch(await timeline.getAttribute('class'), /apollo-timeline-layout-alternate/);
  await page.getByRole('button', { name: 'Toggle item slots', exact: true }).click();
  assert.match(await timeline.innerText(), /Reviewed!/);
  assert.match(await timeline.innerText(), /Created!/);
  assert.equal(await timeline.locator('input').count(), 0);
  await page.getByRole('button', { name: 'Toggle empty content', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle item slots', exact: true }).click();
  assert.equal(await timeline.locator('input').count(), 2);
  assert.deepEqual(errors, []);
  console.log(
    `PASS Timeline native item slots: actual Vue template current scope, conditional/empty/removal/restoration, reverse/display indices, same-key replacement and input/root identity; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
