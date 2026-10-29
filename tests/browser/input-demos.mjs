/** All 24 real Input Demos consume frozen published JS/CSS in four current themes. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(repo, 'packages/ui/package.json'));
const evidence = process.env.INPUT_DEMO_EVIDENCE ?? '/tmp/apollo-input-published-demos.json';
const demos = path.join(repo, 'packages/ui/src/input/demo');
const names = fs
  .readdirSync(demos)
  .filter((name) => name.endsWith('.vue'))
  .sort();
assert.equal(names.length, 24);
const walk = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
const inputs = [
  ...names.map((name) => path.join(demos, name)),
  ...fs
    .readdirSync(path.join(repo, 'packages'))
    .filter((name) => fs.existsSync(path.join(repo, 'packages', name, 'dist/index.mjs')))
    .flatMap((name) => walk(path.join(repo, 'packages', name, 'dist'))),
];
const fingerprint = () =>
  Object.fromEntries(
    inputs.map((file) => [
      path.relative(repo, file),
      createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    ]),
  );
const before = fingerprint();
const loaded = new Set(),
  checks = [],
  errors = [];
const script = `
import {createApp,h,nextTick} from 'vue';
import {ThemeProvider,applyCSSVar,getDesignToken,darkAlgorithm,compactAlgorithm} from '@apollo-design/theme';
const modules=import.meta.glob('/packages/ui/src/input/demo/*.vue',{eager:true});
let app;
window.mountDemos=async mode=>{
 app?.unmount();
 const theme=mode==='dark'?{algorithm:darkAlgorithm}:mode==='compact'?{algorithm:compactAlgorithm}:mode==='both'?{algorithm:[darkAlgorithm,compactAlgorithm]}:{};
 applyCSSVar(document.documentElement,getDesignToken(theme));
 document.body.style.cssText='margin:0;color:var(--apollo-color-text);background:var(--apollo-color-bg-container);font:var(--apollo-font-size)/var(--apollo-line-height) var(--apollo-font-family)';
 app=createApp({render:()=>h(ThemeProvider,{theme},()=>h('main',Object.entries(modules).map(([name,module])=>h('section',{'data-demo':name.split('/').at(-1),style:{padding:'24px',borderBottom:'1px solid var(--apollo-color-border)'}},[h('h1',{style:{fontSize:'18px'}},name.split('/').at(-1)),h(module.default)]))))});
 app.mount('#app');await nextTick();await nextTick();return Object.keys(modules).length;
};`;
let server, browser;
try {
  server = await createServer({
    root: repo,
    configFile: false,
    envDir: false,
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-input-demo-vite-')),
    plugins: [
      vue(),
      {
        name: 'input-published-demo-origin',
        enforce: 'pre',
        load(id) {
          const file = id.split('?')[0];
          if (!file.startsWith(path.join(repo, 'packages') + path.sep)) return;
          if (file.startsWith(demos + path.sep)) return;
          if (/\/src\//.test(file)) throw new Error(`Demo fell back to library source ${file}`);
          if (/\/dist\//.test(file)) loaded.add(file);
        },
        configureServer(vite) {
          vite.middlewares.use('/__input_demos', (_request, response) => {
            response.setHeader('content-type', 'text/html');
            response.end(
              '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>Published Input Demos</title><link rel="stylesheet" href="/packages/theme/dist/tokens.css"><link rel="stylesheet" href="/packages/ui/dist/index.css"></head><body><div id="app"></div><script type="module" src="/__input_entry.mjs"></script></body></html>',
            );
          });
          vite.middlewares.use('/__input_entry.mjs', async (_request, response) => {
            const transformed = await vite.transformRequest('/__input_virtual.mjs');
            response.setHeader('content-type', 'text/javascript');
            response.end(transformed.code);
          });
        },
        resolveId(id) {
          if (id === '/__input_virtual.mjs') return '\0input-demo-entry';
        },
        transform(_code, id) {
          if (id === '\0input-demo-entry') return script;
        },
      },
      {
        name: 'input-demo-entry',
        load(id) {
          if (id === '\0input-demo-entry') return script;
        },
      },
    ],
    resolve: {
      dedupe: ['vue'],
      alias: {
        dayjs: path.dirname(require.resolve('dayjs/package.json')),
        'scroll-into-view-if-needed': path.dirname(
          require.resolve('scroll-into-view-if-needed/package.json'),
        ),
      },
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [
        'vue',
        'dayjs',
        'dayjs/plugin/advancedFormat.js',
        'dayjs/plugin/customParseFormat.js',
        'dayjs/plugin/localeData.js',
        'dayjs/plugin/weekOfYear.js',
        'dayjs/plugin/weekYear.js',
        'dayjs/plugin/weekday.js',
        'scroll-into-view-if-needed',
      ],
    },
    server: { host: '127.0.0.1', port: 0, hmr: false },
  });
  await server.listen();
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({
    viewport: { width: 1100, height: 900 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${server.resolvedUrls.local[0]}__input_demos`);
  await page.waitForFunction(() => Boolean(window.mountDemos));
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    assert.equal(await page.evaluate((mode) => window.mountDemos(mode), mode), 24);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const advanced = page.locator('[data-demo="advance-count.vue"]');
    await advanced.locator('input').first().fill('Over-limit business draft');
    await advanced.locator('textarea').fill('Over-limit business notes that remain readable');
    for (const name of names) {
      const section = page.locator(`[data-demo="${name}"]`);
      const violations = await section.evaluate(async (node) =>
        (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map(({ target, any }) => ({
            target,
            checks: any.map(({ id, data }) => ({ id, data })),
          })),
        })),
      );
      checks.push({ name, mode, passed: violations.length === 0, violations });
    }
    console.log(
      JSON.stringify({
        mode,
        passed: checks.filter((x) => x.mode === mode && x.passed).length,
        total: 24,
      }),
    );
  }
} finally {
  await browser?.close();
  await server?.close();
  const unchanged = JSON.stringify(before) === JSON.stringify(fingerprint());
  const report = {
    passed:
      checks.length === 96 && checks.every((x) => x.passed) && errors.length === 0 && unchanged,
    checks,
    errors,
    distUnchanged: unchanged,
    loadedRuntimeFiles: [...loaded],
    sourceFallback: false,
    packageBuildRun: false,
  };
  fs.writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  assert.ok(report.passed, `Published Input Demo acceptance failed; see ${evidence}`);
}
