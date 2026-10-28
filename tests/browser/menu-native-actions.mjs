import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.join(repository, 'tests/browser/fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-menu-native-'));
const source = process.env.MENU_NATIVE_SOURCE === '1';
const results = [],
  errors = [];
let server, browser;
try {
  const alias = source
    ? [
        'ui',
        'theme',
        'utils',
        'icons',
        'motion',
        'portal',
        'position',
        'overlay',
        'a11y',
        'virtual-list',
        'form-core',
        'picker',
        'locale',
      ].map((name) => ({
        find: new RegExp(`^@apollo-design/${name}$`),
        replacement: path.join(repository, `packages/${name}/src/index.ts`),
      }))
    : [];
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'MenuNativeActions.html') },
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
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}MenuNativeActions.html`);
  await page.waitForFunction(() => Boolean(window.menuNative));
  const menu = page.getByRole('menu', { name: 'Primary menu', exact: true });
  const snapshot = () => page.evaluate(() => window.menuNative.snapshot());
  const check = async (name, run) => {
    await page.evaluate(() => window.menuNative.reset());
    try {
      await run();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    }
  };
  const once = async (field) => {
    const state = await snapshot();
    assert.equal(state[field], 1);
    assert.equal(state.menu, 1);
    assert.equal(state.selected, 1);
    assert.equal(state.open, 0);
  };
  await check('container Enter follows its owned href once', async () => {
    const row = menu.getByRole('menuitem', { name: 'Native destination', exact: true });
    await row.focus();
    await row.press('Enter');
    await page.waitForURL((url) => url.hash === '#native-destination');
    await once('nativeLink');
  });
  await check('focused link Enter uses one browser click', async () => {
    const link = menu.getByRole('link', { name: 'Native destination', exact: true });
    await link.focus();
    await link.press('Enter');
    await page.waitForURL((url) => url.hash === '#native-destination');
    await once('nativeLink');
  });
  for (const focused of [false, true])
    for (const key of ['Enter', 'Space']) {
      await check(`${focused ? 'native button' : 'container'} ${key} runs once`, async () => {
        const row = menu.getByRole('menuitem', { name: 'Native action', exact: true });
        const target = focused ? row.getByRole('button') : row;
        await target.focus();
        await target.press(key);
        await once('nativeButton');
      });
    }
  await check('preventDefault cancels real link navigation', async () => {
    await page.evaluate(() => window.menuNative.set({ cancel: true }));
    const row = menu.getByRole('menuitem', { name: 'Cancellable destination', exact: true });
    await row.focus();
    await row.press('Enter');
    const state = await snapshot();
    assert.equal(state.hash, '');
    assert.equal(state.menu, 1);
  });
  await check('disabled item blocks real pointer navigation', async () => {
    await menu
      .getByRole('link', { name: 'Disabled destination', exact: true })
      .click({ force: true });
    const state = await snapshot();
    assert.equal(state.hash, '');
    assert.equal(state.menu, 0);
  });
  await check('global disabled also blocks its owned link', async () => {
    await page.evaluate(() => window.menuNative.set({ disabled: true }));
    await menu
      .getByRole('link', { name: 'Native destination', exact: true })
      .click({ force: true });
    const state = await snapshot();
    assert.equal(state.hash, '');
    assert.equal(state.nativeLink, 0);
    assert.equal(state.menu, 0);
    await page.evaluate(() => window.menuNative.set({ disabled: false }));
  });
  await check('plain Space selects once and does not scroll', async () => {
    const row = menu.getByRole('menuitem', { name: 'Plain action', exact: true });
    await row.focus();
    const before = await page.evaluate(() => scrollY);
    await row.press('Space');
    const state = await snapshot();
    assert.equal(state.menu, 1);
    assert.equal(state.selected, 1);
    assert.equal(state.open, 0);
    assert.equal(await page.evaluate(() => scrollY), before);
  });
  await check('roving arrows reach the button item and Enter activates it', async () => {
    const row = menu.getByRole('menuitem', { name: 'Native destination', exact: true });
    await row.focus();
    await row.press('ArrowDown');
    await page.waitForFunction(() => document.activeElement?.textContent === 'Native action');
    const target = menu.getByRole('menuitem', { name: 'Native action', exact: true });
    assert.equal(await target.evaluate((n) => n === document.activeElement), true);
    await target.press('Enter');
    await once('nativeButton');
  });
  assert.deepEqual(errors, []);
  assert.ok(
    results.every((r) => r.passed),
    JSON.stringify(results.filter((r) => !r.passed)),
  );
  console.log(JSON.stringify({ source, checks: results.length, errors }));
} finally {
  writeFileSync(
    process.env.MENU_NATIVE_EVIDENCE ?? '/tmp/apollo-menu-native-browser.json',
    JSON.stringify({ source, results, errors }, null, 2),
  );
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
