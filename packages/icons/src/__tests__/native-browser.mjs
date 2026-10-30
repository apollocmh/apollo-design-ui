/** Source-only iconfont loading, concrete Vue template and static CSS integration. */
import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const root = await realpath(await mkdtemp(path.join(tmpdir(), 'apollo-icons-native-')));
let server;
let browser;
try {
  server = await createServer({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: {
        '@apollo-design/utils': path.join(repo, 'packages/utils/src'),
        vue: path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js'),
      },
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, root] } },
  });
  const { getIconStyle } = await server.ssrLoadModule(
    path.join(repo, 'packages/icons/src/style.ts'),
  );
  const { createFromIconfontCN } = await server.ssrLoadModule(
    path.join(repo, 'packages/icons/src/icon-font.ts'),
  );
  assert.equal(typeof document, 'undefined');
  const ServerFont = createFromIconfontCN({ scriptUrl: 'https://icons.invalid/ssr-only.js' });
  const html = await renderToString(
    h(ServerFont, { type: 'server-symbol', ariaLabel: 'Server icon' }),
  );
  assert.ok(html.includes('xlink:href="#server-symbol"'));
  assert.ok(html.includes('aria-label="Server icon"'));
  await writeFile(path.join(root, 'icons.css'), getIconStyle());
  await writeFile(
    path.join(root, 'index.html'),
    `<!doctype html><html lang="en"><head>
<title>Native icon contracts</title><link rel="icon" href="data:,"><link rel="stylesheet" href="/icons.css">
</head><body><main id="app"></main><section id="tones"></section><script type="module">
import {createApp, h} from 'vue';
import NativeIcons from '/@fs${repo}/packages/icons/src/__tests__/fixtures/NativeIcons.vue';
import {AccountBookTwoTone} from '/@fs${repo}/packages/icons/src/icons/AccountBookTwoTone.ts';
import {createFromIconfontCN} from '/@fs${repo}/packages/icons/src/icon-font.ts';
import {setTwoToneColor} from '/@fs${repo}/packages/icons/src/two-tone-color.ts';
const main = createApp(NativeIcons);
const tones = createApp({render: () => h('div', [
  h(AccountBookTwoTone, {id: 'global-tone'}),
  h(AccountBookTwoTone, {id: 'local-tone', twoToneColor: ['#123456', '#abcdef']}),
])});
main.mount('#app');
tones.mount('#tones');
const url = (letter) => 'data:text/javascript,' + encodeURIComponent('document.documentElement.dataset.iconOrder=(document.documentElement.dataset.iconOrder||"")+' + JSON.stringify(letter));
const first = url('a');
const second = url('b');
createFromIconfontCN({scriptUrl: first});
createFromIconfontCN({scriptUrl: [url('c'), second, first, first]});
window.iconContracts = {
  update: () => setTwoToneColor(['#eb2f96', '#fff1f0']),
  cached: () => createFromIconfontCN({scriptUrl: [url('d'), second]}),
  unmount: () => {main.unmount(); tones.unmount();},
};
</script></body></html>`,
  );
  await server.listen();
  ({ browser } = await launchBrowser());
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => document.documentElement.dataset.iconOrder === 'abc');
  assert.equal(await page.locator('script[data-namespace]').count(), 3);
  await page.locator('#native-icon').focus();
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-icon');
  await page.locator('#native-icon').click();
  await page.locator('#native-icon').click();
  assert.equal(await page.locator('output').textContent(), '1');
  const css = await page.locator('#native-icon').evaluate((el) => ({
    classes: el.className,
    display: getComputedStyle(el).display,
    sheets: [...document.styleSheets].map((sheet) => ({
      href: sheet.href,
      rules: [...sheet.cssRules].slice(0, 3).map((rule) => rule.cssText),
    })),
  }));
  assert.equal(css.display, 'inline-flex', JSON.stringify({ css, errors }));
  assert.equal(
    await page.locator('#native-icon svg').evaluate((el) => getComputedStyle(el).width),
    '16px',
  );
  const localFills = () =>
    page
      .locator('#local-tone path')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('fill')));
  const originalLocalFills = await localFills();
  assert.ok(originalLocalFills.includes('#123456'));
  assert.ok(originalLocalFills.includes('#abcdef'));
  await page.evaluate(() => window.iconContracts.update());
  await page.waitForFunction(() => !!document.querySelector('#global-tone path[fill="#eb2f96"]'));
  assert.deepEqual(await localFills(), originalLocalFills);
  await page.evaluate(() => window.iconContracts.cached());
  await page.waitForFunction(() => document.documentElement.dataset.iconOrder === 'abcd');
  assert.equal(await page.locator('script[data-namespace]').count(), 4);
  assert.equal(await page.locator('head style').count(), 0);
  await page.evaluate(() => window.iconContracts.unmount());
  assert.equal(await page.locator('#app .apollo-icon').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      result: 'passed',
      durationMs: Math.round(performance.now() - started),
      checks: [
        'SSR without DOM',
        'native template/attrs/once/focus',
        'static CSS without runtime insertion',
        'mounted TwoTone updates',
        'shared inflight/cached/duplicate real scripts',
      ],
      errors,
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(root, { recursive: true, force: true });
}
