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
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-button-colors-'));
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
      rollupOptions: { input: path.join(root, 'button-color-contracts.html') },
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
  await page.goto(`${server.resolvedUrls.local[0]}button-color-contracts.html`);
  await page.waitForFunction(() => Boolean(window.setButtonColorTheme));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const cssContrast = async (locator) =>
    locator.evaluate((n) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const rgba = (css) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].map((v, i) => (i === 3 ? v / 255 : v));
      };
      const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
      const lum = (c) =>
        c
          .map((v) => v / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      let bg = [255, 255, 255];
      const parents = [];
      for (let e = n; e; e = e.parentElement) parents.unshift(e);
      for (const e of parents) bg = over(rgba(getComputedStyle(e).backgroundColor), bg);
      const foreground = getComputedStyle(n).color,
        background = getComputedStyle(n).backgroundColor;
      const fg = over(rgba(foreground), bg);
      const a = lum(fg),
        b = lum(bg);
      return {
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        foreground,
        background,
        foregroundRGB: fg,
        backgroundRGB: bg,
      };
    });
  for (const theme of ['default', 'dark', 'compact', 'both']) {
    await page.evaluate((theme) => window.setButtonColorTheme(theme), theme);
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    const ids = await page.locator('button').evaluateAll((nodes) => nodes.map((n) => n.id));
    assert.equal(ids.length, 97);
    for (const id of ids) {
      const button = page.locator(`#${id}`);
      await page.mouse.move(0, 0);
      const normal = await cssContrast(button);
      await button.hover();
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
            .map((a) => a.finished.catch(() => {})),
        ),
      );
      const hover = await cssContrast(button);
      await page.mouse.down();
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
            .map((a) => a.finished.catch(() => {})),
        ),
      );
      const active = await cssContrast(button);
      await page.mouse.up();
      for (const [state, value] of Object.entries({ normal, hover, active }))
        results.push({ theme, id, state, passed: value.ratio >= 4.5, ...value });
    }
    const violations = await page.locator('main').evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((x) => ({ html: x.html, failure: x.failureSummary })),
      })),
    );
    results.push({ theme, kind: 'axe', passed: violations.length === 0, violations });
    console.log(
      `${theme}: ${results.filter((r) => r.theme === theme && !r.passed).length} failures`,
    );
  }
  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.BUTTON_COLOR_EVIDENCE ?? '/tmp/apollo-button-colors.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
