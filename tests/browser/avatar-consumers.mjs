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
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-avatar-consumers-'));
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
      rollupOptions: { input: path.join(root, 'avatar-consumers.html') },
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
  await page.route('**/*', (route) => {
    const request = route.request();
    if (request.resourceType() === 'image' && new URL(request.url()).hostname !== '127.0.0.1')
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#dbeafe"/></svg>',
      });
    return route.continue();
  });
  await page.goto(`${server.resolvedUrls.local[0]}avatar-consumers.html`);
  await page.waitForFunction(() => Boolean(window.setAvatarConsumer));
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
  for (const demo of ['ListExtra', 'ListTokens', 'ListyRich', 'UploadAvatar'])
    for (const theme of ['default', 'dark', 'compact', 'both']) {
      await page.evaluate(([demo, theme]) => window.setAvatarConsumer(demo, theme), [demo, theme]);
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
      const avatars = page.locator('.apollo-avatar');
      const count = await avatars.count();
      assert.ok(count > 0);
      const colours = [];
      for (const avatar of await avatars.all()) {
        if ((await avatar.textContent()).trim()) {
          colours.push(await cssContrast(avatar));
        }
      }
      const violations = await page
        .locator('main')
        .evaluate(async (n) =>
          (
            await window.axe.run(n, { runOnly: { type: 'rule', values: ['color-contrast'] } })
          ).violations
            .filter((v) => v.nodes.some((x) => x.target.some((t) => t.includes('avatar'))))
            .map((v) => ({ id: v.id, nodes: v.nodes.map((x) => x.failureSummary) })),
        );
      results.push({
        demo,
        theme,
        count,
        colours,
        violations,
        passed: colours.every((c) => c.ratio >= 4.5) && violations.length === 0,
      });
      console.log(`${violations.length ? 'FAIL' : 'PASS'} ${demo}/${theme}`);
    }
  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.AVATAR_CONSUMER_EVIDENCE ?? '/tmp/apollo-avatar-consumers.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
