/** F10: native Masonry attrs and image layout against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-masonry-native-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=masonry-native`);
  const masonry = page.locator('[data-native-masonry]');
  const tiles = masonry.locator('.apollo-masonry-item');
  await page.waitForFunction(() => {
    const items = document.querySelectorAll('[data-native-masonry] .apollo-masonry-item');
    const image = document.querySelector('[data-native-masonry] img');
    return items.length === 3 && image?.complete && items[2].style.top !== '';
  });
  assert.equal(await masonry.getAttribute('id'), 'masonry-native');
  assert.equal(await masonry.evaluate((node) => node.getBoundingClientRect().width), 320);
  const element = await masonry.elementHandle();
  const state = async () => JSON.parse(await page.locator('#masonry-native-state').innerText());
  await page.getByRole('button', { name: 'Reset masonry counters', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Masonry input', exact: true });
  const inputNode = await input.elementHandle();
  await input.click();
  await input.fill('kept state');
  assert.equal((await state()).clicks, 1);
  const initialLeft = await tiles.nth(0).evaluate((node) => node.getBoundingClientRect().left);
  assert.equal(
    await tiles.nth(2).evaluate((node) => node.getBoundingClientRect().left),
    initialLeft,
  );
  await page.getByRole('button', { name: 'Load taller image', exact: true }).click();
  await page.waitForFunction(() => {
    const items = document.querySelectorAll('[data-native-masonry] .apollo-masonry-item');
    return items[2].getBoundingClientRect().left > items[0].getBoundingClientRect().left + 10;
  });
  assert.deepEqual(await state(), { loads: 1, bubbles: 0, errors: 0, layouts: 1, clicks: 1 });
  assert.equal(await input.inputValue(), 'kept state');
  assert.equal(await input.evaluate((current, old) => current === old, inputNode), true);
  await masonry.locator('img').evaluate((image) => {
    image.style.height = '4px';
    image.dispatchEvent(new Event('error', { bubbles: false }));
  });
  await page.waitForFunction(() => {
    const items = document.querySelectorAll('[data-native-masonry] .apollo-masonry-item');
    return items[2].getBoundingClientRect().left === items[0].getBoundingClientRect().left;
  });
  assert.deepEqual(await state(), { loads: 1, bubbles: 0, errors: 1, layouts: 2, clicks: 1 });
  await page.getByRole('button', { name: 'Update masonry attrs', exact: true }).click();
  assert.equal(await masonry.getAttribute('id'), 'masonry-new');
  assert.match(await masonry.getAttribute('class'), /second/);
  assert.doesNotMatch(await masonry.getAttribute('class'), /(?:^| )first(?: |$)/);
  assert.match(await masonry.getAttribute('style'), /color:\s*blue/);
  assert.equal(await masonry.evaluate((current, old) => current === old, element), true);
  assert.equal(await input.inputValue(), 'kept state');
  assert.equal(await input.evaluate((current, old) => current === old, inputNode), true);
  const scoped = page.locator('[data-slot-masonry]');
  assert.deepEqual(await scoped.locator('.apollo-masonry-item').allTextContents(), [
    'fallback',
    'fallback',
  ]);
  await page.getByRole('button', { name: 'Toggle item slot', exact: true }).click();
  const slotInput = scoped.getByRole('textbox', { name: 'Slot a', exact: true });
  await slotInput.fill('slot state');
  const slotNode = await slotInput.elementHandle();
  await page.getByRole('button', { name: 'Replace same keys', exact: true }).click();
  await page.waitForFunction(() =>
    document.querySelector('[data-slot-masonry] b')?.textContent?.startsWith('BETA!:0:'),
  );
  assert.equal(await slotInput.inputValue(), 'slot state');
  assert.equal(await slotInput.evaluate((current, old) => current === old, slotNode), true);
  assert.match(await scoped.innerText(), /ALPHA!:1:/);
  await page.getByRole('button', { name: 'Toggle empty slot', exact: true }).click();
  assert.equal(await scoped.innerText(), '');
  await page.getByRole('button', { name: 'Toggle item slot', exact: true }).click();
  assert.deepEqual(await scoped.locator('.apollo-masonry-item').allTextContents(), [
    'fallback',
    'fallback',
  ]);
  assert.deepEqual(errors, []);
  console.log(
    `PASS F10/F11 Masonry: typed native slots, conditional/empty/removal, same-key replacement/reorder and input preservation; native/current attrs/style/click, natural non-bubbling image load, explicit non-bubbling error, measured column changes without fresh, single layout callbacks and root/input identity; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
