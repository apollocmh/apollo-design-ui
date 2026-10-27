import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-button-demos-'));
let server, browser;
const results = [],
  errors = [];
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'button-demo-themes.html') },
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}button-demo-themes.html`);
  await page.waitForFunction(() => Boolean(window.setButtonDemo));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const demo of [
    'basic',
    'block',
    'chinese-chars-loading',
    'chinese-space',
    'color-variant',
    'component-token',
    'custom-disabled-bg',
    'danger',
    'disabled',
    'ghost',
    'href',
    'icon',
    'icon-placement',
    'linear-gradient',
    'loading',
    'multiple',
    'semantic',
    'shape',
    'size',
    'style-class',
  ])
    for (const theme of ['default', 'dark', 'compact', 'both']) {
      await page.evaluate(([demo, theme]) => window.setButtonDemo(demo, theme), [demo, theme]);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await page.evaluate(async () => {
        await Promise.all(
          document
            .getAnimations()
            .filter((animation) => Number.isFinite(animation.effect?.getTiming().iterations ?? 1))
            .map((animation) => animation.finished.catch(() => {})),
        );
      });
      const violations = await page.locator('main').evaluate(async (n) =>
        (await window.axe.run(n)).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((x) => ({ html: x.html, failure: x.failureSummary })),
        })),
      );
      results.push({ demo, theme, passed: violations.length === 0, violations });
      console.log(`${violations.length ? 'FAIL' : 'PASS'} ${demo}/${theme}`);
    }
  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.BUTTON_DEMO_THEME_EVIDENCE ?? '/tmp/apollo-button-demo-themes.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
