/** Smoke the native visual fixtures; formal capture/review remains in the shared Apollo harness. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { prepareBreadcrumbVisual } from '../visual/breadcrumb-state.mjs';
import { launchBrowser } from '../visual/stabilize.mjs';
import {
  assertBreadcrumbStyleMode,
  breadcrumbAliases,
  breadcrumbStyleMode,
} from './breadcrumb-style-mode.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.join(repo, 'tests/browser/fixtures');
const source = process.env.BREADCRUMB_SOURCE === '1';
const styles = breadcrumbStyleMode(source);
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-breadcrumb-visual-states-'));
const results = [],
  errors = [];
let server, browser;
try {
  const config = {
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), styles.plugin],
    resolve: { alias: breadcrumbAliases(repo, source) },
  };
  await build({
    ...config,
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'BreadcrumbVisual.html') },
    },
  });
  server = await preview({ ...config, build: { outDir }, preview: { host: '127.0.0.1', port: 0 } });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}BreadcrumbVisual.html`);
  await page.waitForFunction(() => Boolean(window.setBreadcrumbVisual));
  await assertBreadcrumbStyleMode(page, source);
  const variants = await page.evaluate(() => window.breadcrumbVariants);
  assert.equal(variants.length, 17);
  for (const [viewport, width] of [
    ['mobile', 375],
    ['tablet', 768],
    ['desktop', 1280],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    for (const variant of variants) {
      try {
        await page.evaluate((name) => window.setBreadcrumbVisual(name), variant);
        const actual = await prepareBreadcrumbVisual(page, variant);
        results.push({ viewport, variant, passed: true, actual });
      } catch (error) {
        results.push({ viewport, variant, passed: false, error: error.message });
      }
    }
  }
  writeFileSync(
    process.env.BREADCRUMB_VISUAL_EVIDENCE ?? '/tmp/apollo-breadcrumb-visual-states.json',
    `${JSON.stringify({ source, browser: browser.version(), styles: styles.evidence, results, errors }, null, 2)}\n`,
  );
  for (const result of results)
    console.log(
      `${result.passed ? 'PASS' : 'FAIL'} ${result.variant}/${result.viewport}${result.error ? `: ${result.error}` : ''}`,
    );
  assert.deepEqual(errors, []);
  assert.ok(
    results.every((result) => result.passed),
    'Breadcrumb native visual fixture failures',
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
