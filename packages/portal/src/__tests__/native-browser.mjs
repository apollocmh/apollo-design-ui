/** Source-only SSR/hydration and owned-container cleanup checks. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const root = await mkdtemp(path.join(tmpdir(), 'apollo-portal-native-'));
let server;
let browser;
try {
  server = await createServer({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: [
        { find: '@apollo-design/utils', replacement: path.join(repo, 'packages/utils/src') },
        { find: /^vue$/, replacement: path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js') },
      ],
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, root] } },
  });
  assert.equal(typeof document, 'undefined');
  assert.equal(typeof window, 'undefined');
  const { Portal, useEscKeyDown, useScrollLocker } = await server.ssrLoadModule(
    path.join(repo, 'packages/portal/src/index.ts'),
  );
  let slots = 0;
  const Source = defineComponent({
    setup() {
      useScrollLocker(true);
      useEscKeyDown(true, () => {
        throw new Error('SSR must not register an Escape callback');
      });
      return () =>
        h(
          Portal,
          { open: false, autoLock: true },
          {
            default: () => {
              slots++;
              return h('input');
            },
          },
        );
    },
  });
  assert.equal(await renderToString(h(Source)), '<!---->');
  assert.equal(slots, 0);
  const { default: Fixture } = await server.ssrLoadModule(
    path.join(repo, 'packages/portal/src/__tests__/fixtures/NativePortal.vue'),
  );
  const markup = await renderToString(h(Fixture));
  await writeFile(
    path.join(root, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Portal native contracts</title><link rel="icon" href="data:,"></head><body><main id="app">${markup}</main><script type="module">
import {createSSRApp,defineComponent,h,ref} from 'vue';
import Fixture from '/@fs${repo}/packages/portal/src/__tests__/fixtures/NativePortal.vue';
const fixture=ref(null);
createSSRApp(defineComponent({setup:()=>()=>h(Fixture,{ref:fixture})})).mount('#app');
window.portalNativeProbe={snapshot:()=>fixture.value.snapshot()};
</script></body></html>`,
  );
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByRole('textbox', { name: 'Portal editor' }).waitFor();
  const locks = () =>
    page.evaluate(
      () =>
        [...document.head.querySelectorAll('style')].filter((node) =>
          node.textContent?.includes('overflow-y: hidden'),
        ).length,
    );
  const snapshot = () => page.evaluate(() => window.portalNativeProbe.snapshot());
  assert.equal(await locks(), 1);
  await page.getByRole('textbox', { name: 'Portal editor' }).press('Escape');
  assert.equal((await snapshot()).escapes, 1);
  await page.getByRole('button', { name: 'Move container into closed shadow' }).click();
  assert.equal((await snapshot()).shadowChildren, 1);
  await page.getByRole('button', { name: 'Toggle Portal' }).click();
  assert.deepEqual(await snapshot(), { connected: false, shadowChildren: 0, escapes: 1 });
  assert.equal(await locks(), 0);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  assert.equal((await snapshot()).escapes, 1);
  await page.getByRole('button', { name: 'Toggle Portal' }).click();
  await page.getByRole('textbox', { name: 'Portal editor' }).waitFor();
  assert.equal((await snapshot()).connected, true);
  assert.equal(await locks(), 1);
  await page.getByRole('button', { name: 'Move container into closed shadow' }).click();
  await page.getByRole('button', { name: 'Unmount Portal' }).click();
  assert.deepEqual(await snapshot(), { connected: false, shadowChildren: 0, escapes: 1 });
  assert.equal(await locks(), 0);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        result: 'passed',
        browser: browser.version(),
        checks: [
          'source-SSR-without-DOM-or-eager-slots',
          'SSR-hydration-and-mounted-open',
          'closed-ShadowRoot-owned-container-close-reopen-unmount',
          'scroll-lock-and-Escape-cleanup',
          'strict-console',
        ],
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(root, { recursive: true, force: true });
}
