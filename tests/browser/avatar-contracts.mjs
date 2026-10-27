import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { genAvatarStyle } from '@apollo-design/ui';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-avatar-contracts-'));
const results = [],
  errors = [];
let server, browser;
const check = async (name, run) => {
  try {
    const actual = await run();
    results.push({ name, passed: true, actual });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
};
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: process.env.AVATAR_SOURCE
        ? [
            {
              find: /^@apollo-design\/ui$/,
              replacement: path.resolve(root, '../../../packages/ui/src/index.ts'),
            },
          ]
        : [],
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'avatar-contracts.html') },
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}avatar-contracts.html`);
  await page.waitForFunction(() => Boolean(window.avatarAudit));
  if (process.env.AVATAR_BEFORE_CSS)
    await page.addStyleTag({
      content: (await import('node:fs')).readFileSync(process.env.AVATAR_BEFORE_CSS, 'utf8'),
    });
  const set = (patch) => page.evaluate((patch) => window.avatarAudit.set(patch), patch);
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
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await set({ mode });
    await check(`${mode} default actual text contrast`, async () => {
      const actual = await cssContrast(page.locator('[data-default]'));
      assert.ok(actual.ratio >= 4.5, JSON.stringify(actual));
      return actual;
    });
    await check(`${mode} actual default overlap`, async () => {
      const actual = await page
        .locator('[data-group] > :nth-child(2)')
        .evaluate((n) => getComputedStyle(n).marginInlineStart);
      assert.equal(actual, mode === 'compact' || mode === 'both' ? '-4px' : '-8px');
      return actual;
    });
  }
  await set({ mode: 'default', groupSize: 56 });
  await check('inherited numeric Group actual dimensions', async () => {
    const actual = await page
      .locator('[data-group] .apollo-avatar')
      .first()
      .evaluate((n) => n.offsetWidth);
    assert.equal(actual, 56);
    return actual;
  });
  await page.setViewportSize({ width: 1200, height: 900 });
  await set({ groupSize: { xs: 24, md: 44 } });
  await check(
    'inherited sparse responsive Group uses largest matching configured breakpoint',
    async () => {
      const actual = await page
        .locator('[data-group] .apollo-avatar')
        .first()
        .evaluate((n) => n.offsetWidth);
      assert.equal(actual, 44);
      return actual;
    },
  );
  await set({ size: { xs: 24, md: 44 } });
  await check('direct sparse responsive size skips missing xl and lg', async () => {
    const actual = await page.locator('[data-measured]').evaluate((n) => n.offsetWidth);
    assert.equal(actual, 44);
    return actual;
  });
  await set({ size: undefined, width: '80px' });
  await page.waitForTimeout(100);
  const scale = () =>
    page
      .locator('[data-measured] .apollo-avatar-string')
      .evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).a);
  const initialScale = await scale();
  await set({ width: '160px' });
  await page.waitForTimeout(100);
  await check('root-only CSS resize recalculates text fit', async () => {
    const actual = await scale();
    assert.ok(actual > initialScale * 1.5, `${initialScale} → ${actual}`);
    return { before: initialScale, after: actual };
  });
  await set({
    width: undefined,
    size: undefined,
    groupSize: undefined,
    open: true,
    theme: {
      components: {
        Avatar: {
          containerSize: 46,
          containerSizeLG: 60,
          containerSizeSM: 30,
          textFontSize: 15,
          textFontSizeLG: 17,
          textFontSizeSM: 13,
          iconFontSize: 23,
          iconFontSizeLG: '2em',
          iconFontSizeSM: 16,
          groupSpace: 9,
          groupOverlapping: -12,
          groupBorderColor: '#aabbcc',
        },
      },
    },
  });
  for (const [token, selector, property, expected] of [
    ['containerSize', '[data-default]', 'width', '46px'],
    ['containerSizeLG', '[data-large]', 'width', '60px'],
    ['containerSizeSM', '[data-small]', 'width', '30px'],
    ['textFontSize', '[data-default]', 'fontSize', '15px'],
    ['textFontSizeLG', '[data-large]', 'fontSize', '17px'],
    ['textFontSizeSM', '[data-small]', 'fontSize', '13px'],
    ['iconFontSize', '[data-icon]', 'fontSize', '23px'],
    ['iconFontSizeLG', '[data-large-icon]', 'fontSize', '28px'],
    ['iconFontSizeSM', '[data-small-icon]', 'fontSize', '16px'],
    [
      'groupSpace',
      '.apollo-avatar-group-popover .apollo-avatar + .apollo-avatar',
      'marginInlineStart',
      '9px',
    ],
    ['groupOverlapping', '[data-group] > :nth-child(2)', 'marginInlineStart', '-12px'],
    ['groupBorderColor', '[data-group] .apollo-avatar', 'borderTopColor', 'rgb(170, 187, 204)'],
  ])
    await check(`current Token actual ${token}`, async () => {
      const actual = await page
        .locator(selector)
        .first()
        .evaluate((n, key) => getComputedStyle(n)[key], property);
      assert.equal(actual, expected);
      return actual;
    });
  await set({ size: 64 });
  await check('numeric text consumes current textFontSize Token', async () => {
    const actual = await page
      .locator('[data-measured]')
      .evaluate((n) => getComputedStyle(n).fontSize);
    assert.equal(actual, '15px');
    return actual;
  });
  await set({ open: undefined, theme: undefined, size: undefined });
  await check('unscoped overflow button inherits default group overlap', async () => {
    const actual = await page
      .locator('[data-plain] button')
      .evaluate((n) => getComputedStyle(n).marginInlineStart);
    assert.equal(actual, '-8px');
    return actual;
  });
  await check('default overflow button inherits actual group overlap', async () => {
    const actual = await page
      .locator('[data-overflow] button')
      .evaluate((n) => getComputedStyle(n).marginInlineStart);
    assert.equal(actual, '-8px');
    return actual;
  });
  await set({
    groupStyle: {
      '--apollo-avatar-group-overlapping': '-17px',
      '--apollo-avatar-group-border-color': 'rgb(10, 20, 30)',
    },
  });
  await check('native Group variable controls actual overlap and border', async () => {
    const actual = await page.locator('[data-group] > :nth-child(2)').evaluate((n) => ({
      overlap: getComputedStyle(n).marginInlineStart,
      border: getComputedStyle(n).borderTopColor,
    }));
    assert.deepEqual(actual, { overlap: '-17px', border: 'rgb(10, 20, 30)' });
    return actual;
  });
  await set({ groupStyle: undefined, direction: 'rtl' });
  await check('actual Provider RTL reaches the Group layout', async () => {
    const actual = await page
      .locator('[data-group]')
      .evaluate((n) => getComputedStyle(n).direction);
    assert.equal(actual, 'rtl');
    return actual;
  });
  await page.addStyleTag({ content: genAvatarStyle('tenant') });
  await set({ direction: 'ltr', groupPrefix: 'tenant-avatar' });
  await check('explicit Group prefix reaches associated child avatars', async () => {
    assert.equal(await page.locator('[data-group] .tenant-avatar').count(), 2);
    assert.equal(
      await page
        .locator('[data-group] .tenant-avatar')
        .first()
        .evaluate((n) => n.offsetWidth),
      32,
    );
  });
  await set({ groupPrefix: undefined });
  await check('native overflow keyboard entry', async () => {
    const button = page.locator('[data-overflow] button');
    assert.equal(await button.count(), 1);
    await button.focus();
    await button.press('Enter');
    await page.waitForFunction(() => {
      const n = document.querySelector('.apollo-avatar-group-popover');
      return n && getComputedStyle(n).display !== 'none';
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const n = document.querySelector('.apollo-avatar-group-popover');
      return !n || getComputedStyle(n).display === 'none';
    });
    assert.equal(await button.evaluate((n) => document.activeElement === n), true);
  });
} finally {
  writeFileSync(
    process.env.AVATAR_EVIDENCE ?? '/tmp/apollo-avatar-browser.json',
    `${JSON.stringify({ results, errors }, null, 2)}\n`,
  );
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
console.log(
  JSON.stringify({
    checks: results.length,
    passed: results.filter((x) => x.passed).length,
    failed: results.filter((x) => !x.passed),
    errors,
  }),
);
if (results.some((x) => !x.passed) || errors.length) process.exitCode = 1;
