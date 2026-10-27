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
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-tag-colors-'));
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
      rollupOptions: { input: path.join(root, 'tag-color-contracts.html') },
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
  await page.goto(`${server.resolvedUrls.local[0]}tag-color-contracts.html`);
  await page.waitForFunction(() => Boolean(window.tagColors));
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
    await page.evaluate((mode) => window.tagColors.set({ mode }), theme);
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    const nodes = page.locator('[data-color]');
    assert.equal(await nodes.count(), 66);
    for (let i = 0; i < 66; i++) {
      const node = nodes.nth(i);
      const value = await cssContrast(node);
      const tinted =
        (await node.getAttribute('data-color')) === 'default' ||
        (await node.getAttribute('data-variant')) === 'solid' ||
        Math.max(...value.foregroundRGB) - Math.min(...value.foregroundRGB) >= 20;
      results.push({
        theme,
        id: await node.getAttribute('id'),
        state: 'normal',
        passed: value.ratio >= 4.5 && tinted,
        tintPreserved: tinted,
        ...value,
      });
    }
    for (const id of ['choice-unchecked', 'choice-checked']) {
      const control = page.locator(`#${id}`);
      await page.mouse.move(0, 0);
      const normal = await cssContrast(control);
      await control.hover();
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
            .map((a) => a.finished.catch(() => {})),
        ),
      );
      const hover = await cssContrast(control);
      await page.mouse.down();
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
            .map((a) => a.finished.catch(() => {})),
        ),
      );
      const active = await cssContrast(control);
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
  await page.evaluate(() => window.tagColors.set({ mode: 'default' }));
  for (const stage of ['first', 'second', 'none']) {
    await page.evaluate((tokens) => window.tagColors.set({ tokens }), stage);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => {}))),
    );
    const regular = await cssContrast(page.locator('#token-default'));
    const solid = await cssContrast(page.locator('#token-solid'));
    const actual = [regular.backgroundRGB, regular.foregroundRGB, solid.foregroundRGB].map((rgb) =>
      rgb.map(Math.round),
    );
    const expected =
      stage === 'first'
        ? [
            [217, 242, 237],
            [7, 59, 52],
            [8, 26, 40],
          ]
        : stage === 'second'
          ? [
              [229, 233, 255],
              [27, 37, 89],
              [22, 32, 36],
            ]
          : [
              [245, 245, 245],
              // Canvas normalises rgba(0,0,0,.88) to 224/255 alpha;
              // over the actual 245-grey surface its RGB rounds to 30.
              [30, 30, 30],
              [255, 255, 255],
            ];
    results.push({
      kind: 'three current source tokens',
      stage,
      actual,
      expected,
      passed: JSON.stringify(actual) === JSON.stringify(expected),
    });
  }
  await page.evaluate(() => window.tagColors.set({ variable: true }));
  const variable = page.locator('#variable-tag');
  const variableColor = (await variable.count()) === 1 ? await cssContrast(variable) : null;
  const variableMetadata =
    (await variable.count()) === 1
      ? await variable.evaluate((n) => ({
          style: n.getAttribute('style'),
          parent: n.parentElement.getAttribute('style'),
          custom: getComputedStyle(n).getPropertyValue('--apollo-tag-custom-color'),
          bg: getComputedStyle(n).getPropertyValue('--apollo-tag-custom-bg'),
          ink: getComputedStyle(n).getPropertyValue('--apollo-tag-text-color'),
        }))
      : null;
  results.push({
    kind: 'valid native variable color renders without a parser exception',
    actual: variableColor,
    metadata: variableMetadata,
    passed:
      variableColor !== null &&
      variableColor.ratio >= 4.5 &&
      JSON.stringify(variableColor.backgroundRGB.map(Math.round)) === '[255,250,230]',
  });
  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.TAG_COLOR_EVIDENCE ?? '/tmp/apollo-tag-colors.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
