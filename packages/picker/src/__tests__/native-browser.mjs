import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-picker-native-'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Native Picker</title><link rel="icon" href="data:,"><style>
.apollo-picker-time-panel-column{list-style:none;margin:0;padding:0 0 48px;height:72px;overflow-y:scroll;position:relative;width:100px}
.apollo-picker-time-panel-column li{height:24px}.apollo-picker-content{display:flex}
</style></head><body><main id="app"></main><script type="module">
import {createApp} from 'vue';
import Fixture from '/@fs${repo}/packages/picker/src/__tests__/fixtures/NativePicker.vue';
createApp(Fixture).mount('#app');
</script></body></html>`,
);

let server;
let browser;
try {
  server = await createServer({
    root: fixture,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: {
        vue: path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js'),
        '@apollo-design/utils': path.join(repo, 'packages/utils/src'),
      },
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, fixture] } },
  });
  await server.listen();
  const launched = await launchBrowser();
  browser = launched.browser;
  const page = await browser.newPage();
  const diagnostics = [];
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  const hour = page.locator('[data-type="hour"]');
  await page.waitForFunction(
    () => Math.abs(document.querySelector('[data-type="hour"]')?.scrollTop - 240) < 1,
  );
  assert.equal(await page.locator('#state').getAttribute('data-element'), 'true');
  assert.equal(await hour.locator('.native-cell').count(), 24);
  await page.locator('#slot').click();
  assert.equal(await hour.locator('.native-cell').count(), 0);
  assert.equal(await hour.locator('li').first().textContent(), '00');
  await page.locator('#slot').click();
  assert.equal(await hour.locator('.native-cell').count(), 24);
  await page.locator('#zero').click();
  await page.waitForFunction(() => document.querySelector('[data-type="hour"]')?.scrollTop === 0);
  await page.locator('#late').click();
  await page.waitForFunction(
    () => Math.abs(document.querySelector('[data-type="hour"]')?.scrollTop - 432) < 1,
  );
  await page.locator('#scroll-on').click();
  await hour.evaluate((node) => {
    node.scrollTop = 70;
    node.dispatchEvent(new Event('scroll'));
    document.querySelector('#scroll-off').click();
  });
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#state').getAttribute('data-selections'), '0');
  assert.equal(await page.locator('#state').getAttribute('data-value'), '18:15');
  await page.locator('#scroll-on').click();
  await hour.evaluate((node) => {
    node.scrollTop = 90;
    node.dispatchEvent(new Event('scroll'));
  });
  await page.waitForFunction(
    () => document.querySelector('#state')?.getAttribute('data-value') === '04:15',
  );
  await page.locator('#late').click();
  await page.locator('#unmount').click();
  await page.waitForTimeout(350);
  assert.equal(await hour.count(), 0);
  assert.equal(await page.locator('#state').getAttribute('data-element'), 'false');
  assert.deepEqual(diagnostics, []);
  console.log(
    JSON.stringify({
      ok: true,
      browser: launched.channel,
      elapsedMs: Math.round(performance.now() - started),
      scope:
        'template models/ref, dynamic slot presence, mounted time alignment, first/later values, scroll cancel/select and unmount',
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
