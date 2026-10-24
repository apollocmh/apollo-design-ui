/** F06: compile real Vue template demos against production dist, then select and move items. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-f06-browser-'));
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
      rollupOptions: { input: path.join(root, 'transfer-slots.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  const launched = await launchBrowser();
  browser = launched.browser;
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const base = server.resolvedUrls.local[0];
  await page.goto(`${base}transfer-slots.html?demo=custom`);
  const first = page
    .locator('.apollo-transfer-section')
    .first()
    .locator('.apollo-transfer-list-content-item')
    .first();
  const text = await first.locator('.apollo-transfer-list-content-item-text').innerText();
  await first.click();
  await page.waitForFunction(() =>
    document.querySelector('.apollo-transfer-list-content-item-text')?.textContent?.includes('✓'),
  );
  assert.match(await page.locator('.apollo-transfer-list-footer').first().innerText(), /1\//);
  await page.locator('.apollo-transfer-actions button').first().click();
  assert.ok((await page.locator('.apollo-transfer-section').nth(1).innerText()).includes(text));
  console.log('PASS F06 #item/#footer: current selection, count, move');

  await page.goto(`${base}transfer-slots.html?demo=table`);
  const source = page.locator('.apollo-transfer-section').first();
  const target = page.locator('.apollo-transfer-section').nth(1);
  const row = source
    .locator('.apollo-table-tbody tr')
    .filter({ has: page.locator('input[type=checkbox]:enabled') })
    .first();
  const moved = await row.locator('td').nth(1).innerText();
  await row.locator('input[type=checkbox]').check();
  await page.locator('.apollo-transfer-actions button').first().click();
  assert.ok((await target.innerText()).includes(moved));
  const pageCount = await source
    .locator('.apollo-table-tbody input[type=checkbox]:enabled')
    .count();
  await source.locator('.apollo-table-thead input[type=checkbox]').check();
  assert.match(
    await source.locator('.apollo-transfer-list-header-selected').innerText(),
    new RegExp(`^${pageCount}/`),
  );
  await source.locator('.apollo-pagination-next').click();
  assert.equal(await source.locator('.apollo-table-tbody input[type=checkbox]:checked').count(), 0);
  console.log(
    'PASS F06 #list Table: checkbox selection, controlled movement, per-panel pagination',
  );

  await page.goto(`${base}transfer-slots.html?demo=tree`);
  const treeSource = page.locator('.apollo-transfer-section').first();
  await treeSource.locator('.apollo-tree-checkbox').first().click();
  await page.locator('.apollo-transfer-actions button').first().click();
  await page.waitForFunction(() =>
    document.querySelectorAll('.apollo-transfer-section')[1]?.textContent?.includes('内容一'),
  );
  assert.ok(!(await treeSource.innerText()).includes('内容一'));
  console.log('PASS F06 #list Tree: strict selection, controlled movement, distinct panel data');
  assert.deepEqual(errors, []);
  console.log(
    `PASS F06 browser: ${process.platform}/${process.arch}, ${await browser.version()}, ${launched.channel}`,
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => (server ? server.httpServer.close(resolve) : resolve()));
  rmSync(outDir, { recursive: true, force: true });
}
