/** Exercise the private Apollo cases/helper without changing shared manifests. */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser, newStablePage, stabilizePage } from '../visual/stabilize.mjs';
import { prepareTimelineVisual } from '../visual/timeline-state.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-timeline-visual-'));
const source = process.env.TIMELINE_SOURCE !== '0';
const evidencePath = process.env.TIMELINE_VISUAL_EVIDENCE ?? '/tmp/apollo-timeline-visual.json';
const screenshots = process.env.TIMELINE_VISUAL_SCREENSHOTS;
const results = [],
  errors = [];
let server, browser;
try {
  symlinkSync(path.join(repository, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  writeFileSync(
    path.join(temp, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Timeline Apollo cases</title><link rel="icon" href="data:,"></head><body style="margin:0"><div id="stage"></div><script type="module" src="./entry.mjs"></script></body></html>',
  );
  writeFileSync(
    path.join(temp, 'entry.mjs'),
    `
    import { createApp } from 'vue';
    import cases from ${JSON.stringify(path.join(repository, 'tests/visual/render/cases/apollo/timeline.js'))};
    ${source ? `await import(${JSON.stringify(path.join(repository, 'tests/browser/fixtures/TimelineDemosSourceStyles.mjs'))});` : "await import('@apollo-design/theme/tokens.css'); await import('@apollo-design/ui/style.css');"}
    const name = new URLSearchParams(location.search).get('variant') ?? 'basic';
    createApp({ render: cases[name] }).mount('#stage');
    window.timelineVisualNames = Object.keys(cases);
  `,
  );
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: source
        ? [
            {
              find: /^@apollo-design\/ui$/,
              replacement: path.join(repository, 'packages/ui/src/index.ts'),
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
    if (message.text().includes('[apollo: Timeline]') && message.text().includes('is deprecated'))
      return;
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  const url = server.resolvedUrls.local[0];
  await page.goto(url);
  const names = await page.evaluate(() => window.timelineVisualNames);
  assert.equal(names.length, 26, 'all native Timeline variants must run');
  const selected = process.env.TIMELINE_VISUAL_VARIANTS
    ? process.env.TIMELINE_VISUAL_VARIANTS.split(',')
    : names;
  for (const name of selected) assert.ok(names.includes(name), `unknown visual variant ${name}`);
  for (const [viewport, width] of [
    ['mobile', 375],
    ['tablet', 768],
    ['desktop', 1200],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const variant of selected) {
      try {
        await page.goto(`${url}?variant=${variant}`);
        await page.waitForFunction(() => Boolean(window.timelineVisualNames));
        await stabilizePage(page, { preserveFocus: variant === 'native-focus' });
        const state = await prepareTimelineVisual(page, variant);
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
          path: `/tmp/apollo-timeline-visual-${variant}-${viewport}.png`,
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
    passed:
      results.length === selected.length * 3 &&
      results.every((r) => r.passed) &&
      errors.length === 0,
    note: 'Native case/helper validation only; no shared baseline or screenshot acceptance.',
  };
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  for (const failure of results.filter((r) => !r.passed)) console.error(JSON.stringify(failure));
  assert.equal(evidence.passed, true, `Timeline native visual states failed; see ${evidencePath}`);
  console.log(`PASS ${results.length} native Timeline visual states; ${evidencePath}`);
  await context.close();
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(temp, { recursive: true, force: true });
}
