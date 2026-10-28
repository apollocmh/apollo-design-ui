/** Exercise the exact native Layout visual cases/helper without touching runner/matrix/baselines. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { prepareLayoutVisual } from '../visual/layout-state.mjs';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  source = process.env.LAYOUT_SOURCE === '1',
  require = createRequire(import.meta.url),
  temp = mkdtempSync(path.join(tmpdir(), 'apollo-layout-visual-'));
const evidence = process.env.LAYOUT_VISUAL_EVIDENCE ?? '/tmp/apollo-layout-visual-states.json',
  results = [],
  errors = [],
  provenance = { runtimeSources: [] };
const fingerprint = () =>
  Object.fromEntries(
    ['packages/ui/dist/index.mjs', 'packages/ui/dist/index.css'].map((file) => [
      file,
      createHash('sha256')
        .update(readFileSync(path.join(repo, file)))
        .digest('hex'),
    ]),
  );
const before = fingerprint();
let browser, server;
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
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
        find: new RegExp('^@apollo-design/' + name + '$'),
        replacement: path.join(repo, 'packages/' + name + '/src/index.ts'),
      }))
    : [
        {
          find: /^@apollo-design\/icons$/,
          replacement: path.join(repo, 'packages/icons/dist/index.mjs'),
        },
      ];
  const style = source
    ? "import {genAllStyles} from '" +
      path.join(repo, 'packages/ui/src/style/index.ts') +
      "';const sheet=document.createElement('style');sheet.dataset.layoutVisualSource='';sheet.textContent=genAllStyles();document.head.append(sheet);"
    : "import '@apollo-design/ui/style.css';";
  writeFileSync(
    path.join(temp, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Layout visual states</title></head><body style="margin:0"><div id="stage" style="padding:16px;box-sizing:border-box"></div><script type="module">import "@apollo-design/theme/tokens.css";' +
      style +
      "import {createApp} from 'vue';import cases from '" +
      path.join(repo, 'tests/visual/render/cases/apollo/layout.js') +
      "';window.layoutVariants=Object.keys(cases);createApp({render:cases[new URLSearchParams(location.search).get('variant')]}).mount('#stage');requestAnimationFrame(()=>requestAnimationFrame(()=>window.layoutReady=true));</script></body></html>",
  );
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [
      vue(),
      {
        name: 'layout-visual-provenance',
        generateBundle() {
          provenance.runtimeSources = [...this.getModuleIds()].filter((id) =>
            /\/packages\/[^/]+\/src\//.test(id),
          );
          if (!source) assert.deepEqual(provenance.runtimeSources, []);
        },
      },
    ],
    resolve: {
      alias: [
        ...alias,
        { find: /^vue$/, replacement: require.resolve('vue/dist/vue.runtime.esm-bundler.js') },
      ],
      dedupe: ['vue'],
    },
    build: { outDir: path.join(temp, 'out'), emptyOutDir: true },
  });
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'out') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0] + '?variant=basic');
  await page.waitForFunction(() => window.layoutReady);
  const variants = await page.evaluate(() => window.layoutVariants);
  assert.equal(variants.length, 17);
  for (const width of [375, 768, 1440])
    for (const variant of variants) {
      try {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(server.resolvedUrls.local[0] + '?variant=' + variant);
        await page.waitForFunction(() => window.layoutReady);
        const actual = await prepareLayoutVisual(page, variant);
        results.push({ width, variant, passed: true, actual });
      } catch (error) {
        results.push({ width, variant, passed: false, error: error.message });
      }
      console.log((results.at(-1).passed ? 'PASS ' : 'FAIL ') + variant + ' / ' + width);
    }
  assert.deepEqual(fingerprint(), before);
  writeFileSync(
    evidence,
    JSON.stringify(
      {
        source,
        variants,
        browser: browser.version(),
        results,
        errors,
        provenance,
        before,
        after: fingerprint(),
        distUnchanged: true,
        readersExited: false,
      },
      null,
      2,
    ) + '\n',
  );
  if (errors.length || results.some((r) => !r.passed)) process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
  rmSync(temp, { recursive: true, force: true });
  try {
    const report = JSON.parse(readFileSync(evidence, 'utf8'));
    report.readersExited = true;
    writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n');
  } catch {}
}
