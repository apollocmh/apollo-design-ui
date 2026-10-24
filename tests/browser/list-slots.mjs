/** F11: generic Vue templates against the production List build. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-list-slots-'));
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
  const base = `${server.resolvedUrls.local[0]}vue-reactivity.html?demo=`;
  await page.goto(`${base}list-slots`);
  assert.equal(await page.locator('output').textContent(), 'slot-list');
  const list = await page.locator('#slot-list').elementHandle();
  assert.equal(await page.locator('#slot-list input').count(), 0);
  await page.getByRole('button', { name: 'Toggle slots' }).click();
  const input = await page.getByRole('textbox', { name: 'Alpha' }).elementHandle();
  assert.equal(await page.getByRole('textbox', { name: 'Alpha' }).inputValue(), '0:Alpha:first');
  await page.getByRole('button', { name: 'Update label' }).click();
  assert.equal(await page.locator('.apollo-list-header b').textContent(), 'second');
  assert.equal(await page.locator('.apollo-list-footer small').textContent(), 'second');
  await page.getByRole('button', { name: 'Reverse rows' }).click();
  assert.equal(await page.getByRole('textbox', { name: 'Alpha' }).inputValue(), '1:Alpha:second');
  assert.equal(
    await page.evaluate(
      (node) => node === document.querySelector('input[aria-label="Alpha"]'),
      input,
    ),
    true,
  );
  await page.getByRole('button', { name: 'Toggle empty' }).click();
  assert.equal(await page.locator('.apollo-list-header, .apollo-list-footer').count(), 0);
  assert.equal(await page.locator('.apollo-list-something-after-last-item').count(), 0);
  assert.doesNotMatch(await page.locator('#slot-list').innerText(), /prop/);
  await page.getByRole('button', { name: 'Toggle slots' }).click();
  assert.equal(await page.locator('.apollo-list-footer').textContent(), 'prop footer');
  assert.equal(
    await page.evaluate((node) => node === document.querySelector('#slot-list'), list),
    true,
  );

  await page.goto(`${base}list-loadmore`);
  assert.equal(await page.locator('.apollo-list-items > li').count(), 2);
  await page.getByRole('button', { name: 'loading more' }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('.apollo-list-items > li').length === 4,
  );
  await page.getByRole('button', { name: 'loading more' }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('.apollo-list-items > li').length === 5,
  );
  assert.match(await page.locator('.apollo-list').innerText(), /没有更多了/);

  await page.goto(`${base}list-pagination`);
  assert.equal(await page.locator('.apollo-list-pagination').count(), 2);
  await page.locator('.apollo-pagination-item-2').first().click();
  assert.deepEqual(await page.locator('.apollo-list-items > li').allTextContents(), [
    'item 4',
    'item 5',
    'item 6',
  ]);
  await page.goto(`${base}list-likes`);
  await page.locator('.apollo-list-item-action button').first().click();
  assert.match(await page.locator('main').innerText(), /当前总点赞：42/);
  assert.match(await page.locator('.apollo-list-item-action button').first().innerText(), /13/);
  await page.goto(`${base}list-responsive`);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForFunction(
    () => document.querySelector('.apollo-list-container > div')?.style.width === '100%',
  );
  await page.setViewportSize({ width: 900, height: 812 });
  await page.waitForFunction(
    () => document.querySelector('.apollo-list-container > div')?.style.width === '25%',
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS F11 List: conditional/empty/reactive slots, ref and keyed DOM identity, loadMore, pagination, likes, responsive grid; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
