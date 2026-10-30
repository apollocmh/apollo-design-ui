/** Source-only browser check; no dist build. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-overlay-native-'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Overlay native lifecycle</title><link rel="icon" href="data:,"></head><body><main><div id="first"></div><div id="second"></div><div id="cross"></div><button id="outside">Outside</button><iframe title="Popup owner document" id="frame"></iframe></main><script type="module" src="/@fs${repo}/packages/overlay/src/__tests__/fixtures/native-overlay.mjs"></script></body></html>`,
);

let server;
let browser;
try {
  server = await createServer({
    root: fixture,
    configFile: false,
    logLevel: 'warn',
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
      alias: [
        { find: /^vue$/, replacement: path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js') },
        ...['utils', 'overlay'].map((name) => ({
          find: `@apollo-design/${name}`,
          replacement: path.join(repo, 'packages', name, 'src'),
        })),
      ],
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, fixture] } },
  });
  await server.listen();
  const launched = await launchBrowser();
  browser = launched.browser;
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.apolloOverlay);
  const read = () => page.evaluate(() => window.apolloOverlay.read());
  // Warm up Playwright's own hit-target listeners while all overlays are closed.
  await page.frameLocator('#frame').getByRole('heading', { name: 'Popup document' }).click();
  await page
    .frameLocator('#frame')
    .getByRole('heading', { name: 'Popup document' })
    .evaluate((node) => node.nodeType);
  await page.locator('#outside').click();
  await page.locator('#outside').evaluate((node) => node.nodeType);
  await page.evaluate(() => window.apolloOverlay.markListenerBaseline());
  await page.evaluate(() => window.apolloOverlay.openPrimary());
  assert.equal((await read()).stack, 2);
  await page.keyboard.press('Escape');
  assert.equal((await read()).first, true);
  assert.equal((await read()).second, false);
  await page.evaluate(() => window.apolloOverlay.unmountSecond());
  assert.equal((await read()).stack, 1);
  await page.keyboard.press('Escape');
  assert.equal((await read()).stack, 0);
  assert.equal((await read()).parentListeners, 0);

  await page.evaluate(() => window.apolloOverlay.mountCross());
  const editor = page.frameLocator('#frame').getByLabel('Frame editor');
  await page.locator('#cross-trigger').click();
  await editor.fill('draft in another document');
  assert.equal((await read()).cross, true);
  await page.keyboard.press('Escape');
  await editor.waitFor({ state: 'detached' });
  assert.equal((await read()).cross, false);
  assert.equal(
    await page.locator('#cross-trigger').evaluate((node) => node === document.activeElement),
    true,
  );

  await page.locator('#cross-trigger').click();
  await editor.fill('outside close');
  await page.locator('#outside').click();
  await editor.waitFor({ state: 'detached' });
  assert.equal((await read()).cross, false);
  assert.equal(
    await page.locator('#outside').evaluate((node) => node === document.activeElement),
    true,
  );

  await page.evaluate(() => window.apolloOverlay.mountCross(true));
  await editor.fill('refused close');
  await page.keyboard.press('Escape');
  assert.equal((await read()).cross, true);
  assert.deepEqual((await read()).requests, [false]);
  assert.equal(await editor.evaluate((node) => node === node.ownerDocument.activeElement), true);
  await page.evaluate(() => window.apolloOverlay.acceptClose());
  await editor.waitFor({ state: 'detached' });
  assert.equal(
    await page.locator('#cross-trigger').evaluate((node) => node === document.activeElement),
    true,
  );

  await page.evaluate(() => window.apolloOverlay.mountCross());
  for (let i = 0; i < 3; i += 1) {
    await page.locator('#cross-trigger').click();
    await editor.fill(`repeat ${i}`);
    await page.keyboard.press('Escape');
    await editor.waitFor({ state: 'detached' });
    const closed = await read();
    assert.equal(closed.parentListeners, 0);
    assert.equal(closed.frameListeners, 0);
  }
  await page.evaluate(() => window.apolloOverlay.dispose());
  const disposed = await read();
  assert.equal(disposed.parentListeners, 0);
  assert.equal(disposed.frameListeners, 0);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      ok: true,
      browser: launched.channel,
      elapsedMs: Math.round(performance.now() - started),
      scope:
        'multi-app Esc, iframe focus/controlled rejection/outside close, reopen and unmount listeners',
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
