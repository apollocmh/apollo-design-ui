/** F11: native Tabs overflow slots against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-tabs-popup-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=tabs-popup`);
  const more = page.locator('.apollo-tabs-nav-more');
  await more.hover();
  await page.waitForFunction(
    () => document.querySelector('.apollo-tabs-nav-more')?.getAttribute('aria-expanded') === 'true',
  );
  await page.getByRole('listbox').waitFor({ state: 'visible' });
  const trigger = await more.elementHandle();
  const clickControl = async (name) =>
    page.getByRole('button', { name, exact: true }).evaluate((button) => button.click());
  await clickControl('Toggle popup slot');
  await page.locator('[data-tabs-popup-summary]').waitFor({ state: 'visible' });
  const options = await page.locator('[data-tabs-popup] [role="option"]').count();
  assert.ok(options > 0);
  assert.equal(
    await page.locator('[data-tabs-popup-summary]').innerText(),
    `Hidden tabs: ${options}`,
  );
  await clickControl('Update popup label');
  await page.waitForFunction(() =>
    document.querySelector('[data-tabs-popup-summary]')?.textContent?.startsWith('More tabs:'),
  );
  await clickControl('Toggle empty popup');
  assert.equal(await page.locator('[data-tabs-popup]').count(), 0);
  assert.equal(await page.getByRole('listbox').count(), 0);
  await clickControl('Toggle empty popup');
  await page.locator('[data-tabs-popup-summary]').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Close tabs popup', exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('.apollo-tabs-nav-more')?.getAttribute('aria-expanded') === 'false',
  );
  await more.hover();
  await page.waitForFunction(
    () => document.querySelector('.apollo-tabs-nav-more')?.getAttribute('aria-expanded') === 'true',
  );
  await page.locator('[data-tabs-popup-summary]').waitFor({ state: 'visible' });
  const option = page.locator('[data-tabs-popup] [role="option"]').first();
  const name = (await option.innerText()).trim();
  await option.click();
  assert.equal(await page.locator('[data-tabs-active]').innerText(), name.replace('Tab ', ''));
  await more.hover();
  await page.waitForFunction(
    () => document.querySelector('.apollo-tabs-nav-more')?.getAttribute('aria-expanded') === 'true',
  );
  await page.locator('[data-tabs-popup-summary]').waitFor({ state: 'visible' });
  await clickControl('Toggle popup slot');
  assert.equal(await page.locator('[data-tabs-popup]').count(), 0);
  await page.getByRole('listbox').waitFor({ state: 'visible' });
  assert.ok((await page.getByRole('listbox').count()) > 0);
  assert.equal(
    await page.evaluate(
      (node) => node === document.querySelector('.apollo-tabs-nav-more'),
      trigger,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS F11 Tabs: real overflow, single named slot object, hidden count, original menu selection, onClose, conditional/empty/live slots and stable trigger; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
