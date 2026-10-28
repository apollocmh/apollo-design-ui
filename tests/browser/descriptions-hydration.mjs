import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';
import { descriptionsAssets } from './descriptions-assets.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-descriptions-hydration-'));
const assets = descriptionsAssets();
const fixture = path.join(repo, 'tests/browser/fixtures/DescriptionsHydration.mjs');
const serverEntry = path.join(temp, 'server.mjs');
const results = [],
  errors = [];
const check = (name, actual, expected = true) => {
  let passed = true;
  try {
    assert.deepEqual(actual, expected);
  } catch {
    passed = false;
  }
  results.push({ name, actual, expected, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
};
let browser, server;
try {
  assert.equal(typeof window, 'undefined');
  assert.equal(typeof document, 'undefined');
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  writeFileSync(
    serverEntry,
    `import {createSSRApp} from 'vue';import {renderToString} from 'vue/server-renderer';import {createDescriptionsHydration} from '${fixture}';export async function render(){const tree=createDescriptionsHydration();return {html:await renderToString(createSSRApp(tree.component))};}`,
  );
  await build({
    root: repo,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), assets.plugin],
    resolve: { alias: assets.alias },
    build: {
      ssr: serverEntry,
      outDir: path.join(temp, 'server'),
      emptyOutDir: true,
      rollupOptions: {
        external: ['vue', 'vue/server-renderer'],
        output: { entryFileNames: 'render.mjs' },
      },
    },
  });
  const renderer = await import(pathToFileURL(path.join(temp, 'server/render.mjs')).href);
  const { html } = await renderer.render();
  check(
    `${assets.source ? 'source' : 'published'} SSR has native paired descriptions`,
    html.includes('<dl') && html.includes('<dt') && html.includes('<dd'),
  );
  check(
    `${assets.source ? 'source' : 'published'} SSR keeps complete named and default slots`,
    html.includes('Server</b> label') &&
      html.includes('Server draft') &&
      html.includes('Gamma</strong>0'),
  );
  check(
    `${assets.source ? 'source' : 'published'} SSR consumes current Token`,
    html.includes('--apollo-descriptions-title-margin-bottom:29px'),
  );
  writeFileSync(
    path.join(temp, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Descriptions hydration</title></head><body><main><h1>Descriptions hydration</h1><div id="app">${html}</div></main><script type="module">${assets.entry}import {createSSRApp,nextTick} from 'vue';import {createDescriptionsHydration} from '${fixture}';const tree=createDescriptionsHydration();const before={list:document.querySelector('dl'),input:document.querySelector('input')};const app=createSSRApp(tree.component);app.mount('#app');await nextTick();window.descriptionsHydration={list:before.list===document.querySelector('dl'),input:before.input===document.querySelector('input'),async update(){tree.update();await nextTick();},remove(){app.unmount();}};</script></body></html>`,
  );
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), assets.plugin],
    resolve: {
      alias: [...assets.alias, { find: 'vue', replacement: assets.vue }],
    },
    build: { outDir: path.join(temp, 'client'), emptyOutDir: true },
  });
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'client') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.descriptionsHydration));
  assert.equal(
    await page.locator('style[data-descriptions-source-styles]').count(),
    assets.source ? 1 : 0,
  );
  check(
    'real hydration retains SSR list',
    await page.evaluate(() => window.descriptionsHydration.list),
  );
  check(
    'real hydration retains SSR editor',
    await page.evaluate(() => window.descriptionsHydration.input),
  );
  const editor = page.getByRole('textbox', { name: 'Hydrated field draft' });
  const original = await editor.elementHandle();
  await editor.fill('Hydrated persistent draft');
  await editor.focus();
  await editor.evaluate((n) => n.setSelectionRange(2, 6));
  await page.evaluate(() => window.descriptionsHydration.update());
  check(
    'post-hydration regrouping keeps node, focus, draft and selection',
    await editor.evaluate(
      (n, o) =>
        n === o &&
        n.value === 'Hydrated persistent draft' &&
        n === document.activeElement &&
        n.selectionStart === 2 &&
        n.selectionEnd === 6,
      original,
    ),
  );
  check(
    'post-hydration title Token is effective',
    await page
      .locator('.apollo-descriptions-header')
      .evaluate((n) => getComputedStyle(n).marginBottom),
    '29px',
  );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  check(
    'hydrated native semantics pass axe',
    await page
      .locator('main')
      .evaluate(async (n) => (await window.axe.run(n)).violations.map((v) => v.id)),
    [],
  );
  await page.evaluate(() => window.descriptionsHydration.remove());
  check('hydrated app cleans up', await page.locator('dl').count(), 0);
  check('zero SSR hydration or Vue errors', errors, []);
  writeFileSync(
    process.env.DESCRIPTIONS_HYDRATION_EVIDENCE ??
      `/tmp/apollo-descriptions-${assets.source ? 'source' : 'published'}-hydration.json`,
    `${JSON.stringify({ browser: browser.version(), assets: assets.evidence(), results, errors }, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(temp, { recursive: true, force: true });
}
