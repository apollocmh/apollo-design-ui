/** Exercise the private Apollo cases/helper without changing shared manifests. */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { prepareAlertVisual } from '../visual/alert-state.mjs';
import { launchBrowser, newStablePage, stabilizePage } from '../visual/stabilize.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-alert-visual-'));
const source = process.env.ALERT_SOURCE !== '0';
const evidencePath = process.env.ALERT_VISUAL_EVIDENCE ?? '/tmp/apollo-alert-visual.json';
const screenshots = process.env.ALERT_VISUAL_SCREENSHOTS;
const results = [],
  errors = [],
  stylesheets = [],
  publishedSources = [];
let server, browser;
try {
  symlinkSync(path.join(repository, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  writeFileSync(
    path.join(temp, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Alert Apollo cases</title><link rel="icon" href="data:,"></head><body style="margin:0"><div id="stage" style="width:100%;padding:16px;box-sizing:border-box"></div><script type="module" src="./entry.mjs"></script></body></html>',
  );
  writeFileSync(
    path.join(temp, 'entry.mjs'),
    `
    import { createApp } from 'vue';
    import cases from ${JSON.stringify(path.join(repository, 'tests/visual/render/cases/apollo/alert.js'))};
    ${source ? `await import(${JSON.stringify(path.join(repository, 'tests/browser/fixtures/AlertContractsSourceStyles.mjs'))});` : "await import('@apollo-design/theme/tokens.css'); await import('@apollo-design/ui/style.css');"}
    const name = new URLSearchParams(location.search).get('variant') ?? 'basic';
    createApp({ render: cases[name] }).mount('#stage');
    window.alertVisualNames = Object.keys(cases);
  `,
  );
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [
      vue(),
      {
        name: 'alert-visual-published-boundary',
        transform(_code, id) {
          if (id.endsWith('.css')) stylesheets.push(path.relative(repository, id));
        },
        generateBundle(_options, bundle) {
          if (source) return;
          for (const item of Object.values(bundle))
            if (item.type === 'chunk')
              for (const id of Object.keys(item.modules))
                if (/\/packages\/[^/]+\/src\//.test(id))
                  publishedSources.push(path.relative(repository, id));
          assert.deepEqual(publishedSources, []);
          assert.ok(stylesheets.includes('packages/ui/dist/index.css'));
          assert.ok(stylesheets.includes('packages/theme/dist/tokens.css'));
        },
      },
    ],
    resolve: {
      alias: source
        ? [
            {
              find: /^@apollo-design\/ui$/,
              replacement: path.join(repository, 'packages/ui/src/index.ts'),
            },
            {
              find: /^@apollo-design\/theme$/,
              replacement: path.join(repository, 'packages/theme/src/index.ts'),
            },
          ]
        : [],
    },
    build: { outDir: path.join(temp, 'output'), emptyOutDir: true, chunkSizeWarningLimit: 4096 },
  });
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'output') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const { page, context } = await newStablePage(browser, { width: 1200, height: 1000 });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.text().includes('[apollo: Alert]') && message.text().includes('is deprecated'))
      return;
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  const url = server.resolvedUrls.local[0];
  await page.goto(url);
  const names = await page.evaluate(() => window.alertVisualNames);
  assert.equal(names.length, 20, 'all native Alert variants must run');
  const selected = process.env.ALERT_VISUAL_VARIANTS
    ? process.env.ALERT_VISUAL_VARIANTS.split(',')
    : names;
  for (const name of selected) assert.ok(names.includes(name), `unknown visual variant ${name}`);
  for (const [viewport, width] of [
    ['mobile', 375],
    ['tablet', 768],
    ['desktop', 1440],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const variant of selected) {
      try {
        await page.goto(`${url}?variant=${variant}`);
        await page.waitForFunction(() => Boolean(window.alertVisualNames));
        await stabilizePage(page, { preserveFocus: variant === 'native-focus' });
        const state = await prepareAlertVisual(page, variant);
        if (screenshots) {
          mkdirSync(screenshots, { recursive: true });
          await page
            .locator('#stage')
            .screenshot({ path: path.join(screenshots, `${variant}-${viewport}.png`) });
        }
        results.push({ variant, viewport, passed: true, state });
      } catch (error) {
        results.push({ variant, viewport, passed: false, error: error.message });
        await page.screenshot({
          path: `/tmp/apollo-alert-visual-${variant}-${viewport}.png`,
          fullPage: true,
        });
      }
    }
    console.log(
      `${source ? 'source' : 'published'} native visuals ${viewport}: ${results.filter((r) => r.passed).length}/${results.length} cumulative passed`,
    );
  }
  const evidence = {
    source,
    browser: await browser.version(),
    variants: selected,
    results,
    errors,
    stylesheets,
    publishedSources,
    passed:
      results.length === selected.length * 3 &&
      results.every((r) => r.passed) &&
      errors.length === 0,
    note: 'Native case/helper validation only; no shared baseline or screenshot acceptance.',
  };
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  for (const failure of results.filter((r) => !r.passed)) console.error(JSON.stringify(failure));
  assert.equal(evidence.passed, true, `Alert native visual states failed; see ${evidencePath}`);
  console.log(`PASS ${results.length} native Alert visual states; ${evidencePath}`);
  await context.close();
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(temp, { recursive: true, force: true });
}
