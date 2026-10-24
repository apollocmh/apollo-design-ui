/** F11/F10: native Pagination slots and container forwarding against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-pagination-slots-'));
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
  const base = server.resolvedUrls.local[0];
  await page.goto(`${base}vue-reactivity.html?demo=pagination-slots`);
  const pager = page.locator('#native-pagination');
  const rootNode = await pager.elementHandle();
  const state = async () => JSON.parse(await page.locator('#pagination-state').innerText());
  await pager.locator('.apollo-pagination-item-2').click();
  assert.deepEqual(await state(), {
    current: 2,
    pageSize: 10,
    changes: 1,
    sizes: 0,
    rootClicks: 1,
    nativeEvent: 'click',
  });
  await page.getByRole('button', { name: 'Toggle page slots', exact: true }).click();
  assert.equal(
    await pager.locator('[data-page-type="page"][data-page="2"] b').innerText(),
    'Page 2',
  );
  await pager.locator('[data-page-type="page"][data-page="3"]').click();
  assert.equal((await state()).changes, 2);
  assert.equal((await state()).current, 3);
  assert.equal(await pager.locator('[data-native-total]').innerText(), '21-30 / 85');
  await page.getByRole('button', { name: 'Update page label', exact: true }).click();
  assert.equal(
    await pager.locator('[data-page-type="page"][data-page="3"] b').innerText(),
    'Current 3',
  );
  await page.getByRole('button', { name: 'Toggle size slot', exact: true }).click();
  await pager.locator('[data-native-size]').click();
  assert.deepEqual(await state(), {
    current: 3,
    pageSize: 20,
    changes: 3,
    sizes: 1,
    rootClicks: 3,
    nativeEvent: 'click',
  });
  assert.equal(await pager.locator('[data-native-total]').innerText(), '41-60 / 85');
  assert.equal(await pager.locator('[data-native-size]').innerText(), 'Size 20');
  await page.getByRole('button', { name: 'Toggle empty pages', exact: true }).click();
  assert.equal(await pager.locator('[data-page-type]').count(), 0);
  assert.equal(await pager.locator('.apollo-pagination-prev button').count(), 0);
  await page.getByRole('button', { name: 'Toggle empty pages', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle page slots', exact: true }).click();
  assert.equal(await pager.locator('.apollo-pagination-item-3 a').innerText(), '3');
  await page.getByRole('button', { name: 'Toggle total slot', exact: true }).click();
  assert.equal(await pager.locator('[data-native-total]').count(), 0);
  await page.getByRole('button', { name: 'Update pagination attrs', exact: true }).click();
  assert.match(await pager.getAttribute('style'), /color:\s*blue/);
  assert.equal(await pager.evaluate((current, previous) => current === previous, rootNode), true);
  await page.getByRole('button', { name: 'Toggle pagination disabled', exact: true }).click();
  const before = await state();
  assert.equal(await pager.locator('[data-native-size]').isDisabled(), true);
  await pager.locator('[data-native-size]').evaluate((button) => button.click());
  assert.deepEqual(await state(), before);

  await page.goto(`${base}vue-reactivity.html?demo=pagination-containers`);
  await page.getByRole('button', { name: 'Toggle container slots', exact: true }).click();
  const list = page.locator('[data-pagination-container="list"]');
  const table = page.locator('[data-pagination-container="table"]');
  assert.equal(await list.locator('[data-container-total]').innerText(), '1-5 / 12');
  assert.deepEqual(await table.locator('[data-container-total]').allInnerTexts(), [
    '1-5 / 12',
    '1-5 / 12',
  ]);
  await list.locator('[data-container-page="2"]').click();
  assert.equal(await list.locator('[data-container-total]').innerText(), '6-10 / 12');
  await table.locator('[data-container-page="2"]').first().click();
  assert.deepEqual(await table.locator('[data-container-total]').allInnerTexts(), [
    '6-10 / 12',
    '6-10 / 12',
  ]);
  await list.locator('[data-container-size]').click();
  await table.locator('[data-container-size]').first().click();
  assert.equal(await list.locator('[data-container-total]').innerText(), '11-12 / 12');
  assert.deepEqual(await table.locator('[data-container-total]').allInnerTexts(), [
    '11-12 / 12',
    '11-12 / 12',
  ]);
  assert.deepEqual(JSON.parse(await page.locator('#container-change-state').innerText()), {
    listChanges: 2,
    tableChanges: 2,
  });
  await page.getByRole('button', { name: 'Toggle container slots', exact: true }).click();
  assert.equal(
    await page
      .locator('[data-container-total], [data-container-size], [data-container-page]')
      .count(),
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS F11/F10 Pagination: named/conditional/empty/current slots, size/page single delivery, native attrs/style/events and stable root; all three List/Table slots, top/bottom scopes and single business callbacks; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
