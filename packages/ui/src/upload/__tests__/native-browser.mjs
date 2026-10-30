/** Native Upload integration against source; no external upload or dist writes. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-upload-native-'));
const fixture = path.join(repo, 'packages/ui/src/upload/__tests__/fixtures/NativeBrowser.mjs');
const alias = Object.fromEntries(
  [
    'ui',
    'utils',
    'theme',
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
  ].map((name) => [`@apollo-design/${name}`, path.join(repo, 'packages', name, 'src')]),
);
const artifacts = [
  'packages/ui/dist/index.mjs',
  'packages/ui/dist/index.css',
  'packages/theme/dist/tokens.css',
];
const fingerprint = () =>
  Object.fromEntries(
    artifacts.map((file) => [
      file,
      createHash('sha256')
        .update(fs.readFileSync(path.join(repo, file)))
        .digest('hex'),
    ]),
  );
const before = fingerprint();
const checks = [];
const failures = [];
const check = (name, actual, expected) => {
  checks.push({ name, actual, expected });
  assert.deepEqual(actual, expected, name);
};
let ssr, server, browser;
try {
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  const config = {
    root,
    configFile: false,
    plugins: [vue()],
    resolve: { alias },
    logLevel: 'warn',
    cacheDir: path.join(root, 'cache'),
    server: { fs: { allow: [repo, root] } },
  };
  ssr = await createServer({
    ...config,
    server: { ...config.server, middlewareMode: true },
    ssr: { external: ['vue', 'vue/server-renderer'] },
  });
  fs.writeFileSync(
    path.join(root, 'ssr.mjs'),
    `import {renderToString} from 'vue/server-renderer';import{createFixture,css}from ${JSON.stringify(fixture)};export async function render(){const f=createFixture();return {html:await renderToString(f.app),css:css(),vars:f.css(),warnings:f.warnings,errors:f.errors}}`,
  );
  const rendered = await (await ssr.ssrLoadModule(path.join(root, 'ssr.mjs'))).render();
  check('SSR warnings and errors', [rendered.warnings, rendered.errors], [[], []]);
  fs.writeFileSync(
    path.join(root, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Native Upload</title><link rel="icon" href="data:,"><style>:root{${rendered.vars}}${rendered.css}*,*::before,*::after{transition:none!important;animation:none!important}section{margin:16px}</style></head><body><main id="app">${rendered.html}</main><script type="module">import{createFixture}from '/@fs${fixture}';const f=createFixture();f.app.mount('#app');window.uploadFixture=f;</script></body></html>`,
  );
  server = await createServer({
    ...config,
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
      alias: { ...alias, vue: path.join(repo, 'node_modules/vue/dist/vue.runtime.esm-bundler.js') },
      dedupe: ['vue'],
    },
    server: { ...config.server, host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 } });
  page.setDefaultTimeout(10_000);
  page.on('pageerror', (error) => failures.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      failures.push(message.text());
  });
  await page.route('**/local-upload**', (route) => route.fulfill({ status: 200, body: '{}' }));
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.uploadFixture);
  check(
    'hydration has no warnings/errors',
    await page.evaluate(() => [window.uploadFixture.warnings, window.uploadFixture.errors]),
    [[], []],
  );
  check('actual public DOM refs', await page.evaluate(() => window.uploadFixture.refValid()), true);
  for (const mode of ['default', 'dark', 'compact', 'dark-compact']) {
    await page.evaluate((mode) => window.uploadFixture.set({ mode, override: false }), mode);
    const sizes = await page.evaluate(() => ({
      actual: document.querySelector('#main .apollo-upload-select').getBoundingClientRect().width,
      expected: window.uploadFixture.token().controlHeightLG * 2.55,
    }));
    check(
      `current ${mode} card dimension`,
      Math.round(sizes.actual * 10),
      Math.round(sizes.expected * 10),
    );
  }
  await page.evaluate(() => window.uploadFixture.set({ override: true, mode: 'default' }));
  check(
    'component token actual dimensions',
    await page
      .locator('#main .apollo-upload-select')
      .evaluate((el) => el.getBoundingClientRect().width),
    144,
  );
  await page.evaluate(() => window.uploadFixture.set({ native: true }));
  check(
    'native variable precedence',
    await page
      .locator('#main .apollo-upload-select')
      .evaluate((el) => el.getBoundingClientRect().width),
    160,
  );
  await page.evaluate(() => window.uploadFixture.set({ native: false, override: false }));
  check(
    'component-token Demo actual dimensions',
    await page
      .locator('#demo .apollo-upload-picture-card-wrapper .apollo-upload-select')
      .evaluate((el) => el.getBoundingClientRect().width),
    96,
  );
  check(
    'component-token Demo action color',
    await page
      .locator('#demo .apollo-upload-list-text .apollo-icon-delete')
      .evaluate((el) => getComputedStyle(el).color),
    'rgb(8, 151, 156)',
  );
  await page.locator('#main input[type=file]').setInputFiles({
    name: 'source.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('local payload'),
  });
  await page.waitForFunction(() => window.uploadFixture.requests.length === 1);
  check(
    'replacement bytes and defaultRequest service',
    await page.evaluate(async () => {
      const r = window.uploadFixture.requests[0];
      return [r.option.file.name, await r.option.file.text(), r.defaultAvailable];
    }),
    ['processed-source.txt', 'local payload', true],
  );
  await page.evaluate(() => window.uploadFixture.progress());
  await page.locator('#main [role=progressbar]').waitFor();
  check(
    'real progress ARIA',
    await page.locator('#main [role=progressbar]').getAttribute('aria-valuenow'),
    '47.5',
  );
  await page.evaluate(() => window.uploadFixture.finish());
  await page.locator('#main .apollo-upload-list-item-done').waitFor();
  check(
    'change exactly once per transition',
    await page.evaluate(() => window.uploadFixture.changes),
    ['uploading', 'uploading', 'done'],
  );
  await page.locator('#main button[title="Remove file"]').click();
  await page.waitForFunction(() => window.uploadFixture.files.value.length === 0);
  check(
    'completed requests are not aborted',
    await page.evaluate(() => window.uploadFixture.aborted),
    [],
  );
  await page.evaluate(() => {
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL);
    window.previewURLs = { created: [], revoked: [] };
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      window.previewURLs.created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      window.previewURLs.revoked.push(url);
      revoke(url);
    };
  });
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    context.fillStyle = '#123456';
    context.fillRect(0, 0, 2, 2);
    return canvas.toDataURL().split(',')[1];
  });
  await page.locator('#main input[type=file]').setInputFiles({
    name: 'preview.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await page.waitForFunction(() => window.uploadFixture.requests.length === 2);
  await page.evaluate(() => window.uploadFixture.requests.at(-1).option.onSuccess({ ok: true }));
  await page.locator('#main .apollo-upload-list-item-image').waitFor();
  check(
    'native thumbnail bytes render as local data URL',
    await page
      .locator('#main .apollo-upload-list-item-image')
      .evaluate((el) => el.src.startsWith('data:image/png')),
    true,
  );
  check(
    'native preview releases every object URL',
    await page.evaluate(
      () =>
        window.previewURLs.created.length === 1 &&
        window.previewURLs.created[0] === window.previewURLs.revoked[0],
    ),
    true,
  );
  await page.locator('#main button[title="Remove file"]').click();
  await page.waitForFunction(() => window.uploadFixture.files.value.length === 0);
  const drop = page.locator('#drag [role=button][aria-label]');
  await drop.focus();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.keyboard.press('Space');
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'drop.txt', mimeType: 'text/plain', buffer: Buffer.from('drop') });
  await page.waitForFunction(() => window.uploadFixture.requests.length === 3);
  check(
    'Space chooses a file from Dragger',
    await page.locator('#drag .apollo-upload-list-item-name').textContent(),
    'drop.txt',
  );
  await page.evaluate(() => window.uploadFixture.fail());
  check(
    'error text reaches native title',
    await page.locator('#drag .apollo-upload-list-item-error').getAttribute('title'),
    'local upload failed',
  );
  await page.evaluate(() => window.uploadFixture.set({ disabled: true }));
  check('disabled Dragger leaves tab order', await drop.getAttribute('tabindex'), '-1');
  await page.evaluate(() => {
    const t = new DataTransfer();
    t.items.add(new File(['x'], 'paste.txt', { type: 'text/plain' }));
    document.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: t, bubbles: true, cancelable: true }),
    );
  });
  check(
    'disabled paste starts no request',
    await page.evaluate(() => window.uploadFixture.requests.length),
    3,
  );
  await page.evaluate(() => window.uploadFixture.set({ disabled: false }));
  await page.evaluate(() => {
    const t = new DataTransfer();
    t.items.add(new File(['x'], 'paste.txt', { type: 'text/plain' }));
    document.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: t, bubbles: true, cancelable: true }),
    );
  });
  await page.waitForFunction(() => window.uploadFixture.requests.length === 4);
  await page.evaluate(() => window.uploadFixture.unmount());
  check(
    'unmount aborts only the active request',
    await page.evaluate(() => window.uploadFixture.aborted),
    ['paste.txt'],
  );
  check(
    'browser and Vue diagnostics',
    [
      failures,
      await page.evaluate(() => [window.uploadFixture.warnings, window.uploadFixture.errors]),
    ],
    [[], [[], []]],
  );
  check('published artifacts unchanged', fingerprint(), before);
  const output = process.env.UPLOAD_NATIVE_EVIDENCE ?? '/tmp/apollo-upload-native-browser.json';
  fs.writeFileSync(output, JSON.stringify({ checks, artifactHashes: before }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, passed: true, evidence: output }));
} finally {
  await browser?.close();
  await server?.close();
  await ssr?.close();
  fs.rmSync(root, { recursive: true, force: true });
}
