/** F11: scoped items/keyed children against source aliases or published dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-breadcrumb-slots-'));
let server;
let browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias:
        process.env.BREADCRUMB_SOURCE === '1'
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
              find: new RegExp('^@apollo-design/' + name + '$'),
              replacement: path.resolve(root, '../../../packages/' + name + '/src/index.ts'),
            }))
          : [],
    },
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=breadcrumb-slots`);
  const nav = page.getByRole('navigation', { name: 'Scoped breadcrumb' });
  const links = () =>
    nav.locator('a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
  assert.deepEqual(await links(), ['#/apps', '#/apps/42']);
  await page.getByRole('button', { name: 'Toggle item slot', exact: true }).click();
  assert.deepEqual(
    await nav
      .locator('[data-route-path]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-route-path'))),
    ['apps', 'apps/42'],
  );
  assert.deepEqual(await links(), ['#/apps', '#/apps/42']);
  await page.getByRole('button', { name: 'Update route params', exact: true }).click();
  assert.deepEqual(await links(), ['#/apps', '#/apps/43']);
  await page.getByRole('button', { name: 'Toggle empty item', exact: true }).click();
  assert.equal(await nav.locator('a').count(), 0);
  await page.getByRole('button', { name: 'Toggle item slot', exact: true }).click();
  assert.deepEqual(await links(), ['#/apps', '#/apps/43']);
  const input = page.getByRole('textbox', { name: 'Crumb a', exact: true });
  const node = await input.elementHandle();
  await input.fill('typed state');
  await page.getByRole('button', { name: 'Reorder native crumbs', exact: true }).click();
  const native = page.getByRole('navigation', { name: 'Native breadcrumb' });
  assert.deepEqual(
    await native
      .locator('input')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label'))),
    ['Crumb b', 'Crumb a'],
  );
  assert.equal(await input.inputValue(), 'typed state');
  assert.equal(await input.evaluate((current, previous) => current === previous, node), true);
  assert.deepEqual(errors, []);
  console.log(
    `PASS F11 Breadcrumb: named item slot, per-route paths and href, current params, conditional/empty/restored rendering and keyed native child input state; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
