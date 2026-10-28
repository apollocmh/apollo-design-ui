import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-badge-contracts-'));
const results = [],
  errors = [];
let server, browser;
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
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
      alias: process.env.BADGE_SOURCE
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
      rollupOptions: { input: path.join(root, 'badge-contracts.html') },
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
  page.setDefaultTimeout(4000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}badge-contracts.html`);
  await page.waitForFunction(() => Boolean(window.badgeAudit));
  const set = async (patch) => {
    await page.evaluate((patch) => window.badgeAudit.set(patch), patch);
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
  };
  const dimensions = () =>
    page.evaluate(() => {
      const css = (selector) => getComputedStyle(document.querySelector(selector));
      const count = css('#token-count .apollo-badge-count'),
        small = css('#token-small .apollo-badge-count');
      const dot = css('#token-dot .apollo-badge-dot'),
        status = css('#token-status .apollo-badge-status-dot');
      return {
        z: count.zIndex,
        height: count.height,
        smallHeight: small.height,
        dot: dot.width,
        size: count.fontSize,
        smallSize: small.fontSize,
        weight: count.fontWeight,
        status: status.width,
        padding: count.paddingInlineStart,
      };
    });
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await set({ mode, tokenStage: 0 });
    await check(`${mode}: nine tokens replace, accept zero, and restore`, async () => {
      const initial = await dimensions();
      try {
        await set({ tokenStage: 1 });
        assert.deepEqual(await dimensions(), {
          z: '13',
          height: '30px',
          smallHeight: '18px',
          dot: '10px',
          size: '15px',
          smallSize: '11px',
          weight: '700',
          status: '9px',
          padding: '13px',
        });
        await set({ tokenStage: 2 });
        const zero = await dimensions();
        for (const key of [
          'height',
          'smallHeight',
          'dot',
          'size',
          'smallSize',
          'status',
          'padding',
        ])
          assert.equal(zero[key], '0px', key);
        assert.equal(zero.z, '0');
        await set({ tokenStage: 0 });
        assert.deepEqual(await dimensions(), initial);
      } finally {
        await set({ tokenStage: 0 });
      }
      return initial;
    });
  }
  await check(
    'current Provider and native attrs retain both business drafts and focus',
    async () => {
      const input = page.getByRole('textbox', { name: 'Badge business draft' });
      await input.fill('Local draft');
      await input.focus();
      await input.evaluate((n) => {
        window.badgeInput = n;
        window.badgeRoot = n.parentElement;
      });
      for (const patch of [
        { providerStage: 1, rtl: true },
        { providerStage: 0, rtl: false },
      ]) {
        await set(patch);
        const actual = await page.evaluate(() => ({
          same: document.querySelector('#owned-badge input') === window.badgeInput,
          root: document.querySelector('#owned-badge') === window.badgeRoot,
          focused: document.activeElement === window.badgeInput,
          value: window.badgeInput.value,
          exposed: window.badgeAudit.snapshot().exposed,
          provider: document.querySelector('#owned-badge').classList.contains('provider-badge'),
          padding: getComputedStyle(document.querySelector('#owned-badge')).paddingTop,
        }));
        assert.deepEqual(actual, {
          same: true,
          root: true,
          focused: true,
          value: 'Local draft',
          exposed: true,
          provider: patch.providerStage === 1,
          padding: '7px',
        });
      }
    },
  );
  await check(
    'Ribbon complete native text slot honors empty precedence and restoration',
    async () => {
      assert.equal(
        await page.locator('#owned-ribbon .apollo-ribbon-content').innerText(),
        'FirstSecond',
      );
      await set({ empty: true });
      assert.equal(await page.locator('#owned-ribbon .apollo-ribbon-content').innerText(), '');
      await set({ custom: false });
      assert.equal(
        await page.locator('#owned-ribbon .apollo-ribbon-content').innerText(),
        'Fallback',
      );
      assert.equal(
        await page.locator('#owned-ribbon').evaluate((n) => getComputedStyle(n).paddingTop),
        '11px',
      );
    },
  );
  await check('fractional and CSS offsets retain logical geometry', async () => {
    const count = page.locator('#owned-badge .apollo-badge-count');
    await set({ rtl: false, cssOffset: false });
    assert.equal(await count.evaluate((n) => getComputedStyle(n).insetInlineEnd), '-1.5px');
    await set({ rtl: true, cssOffset: true });
    const value = await count.evaluate((n) => ({
      end: getComputedStyle(n).insetInlineEnd,
      font: parseFloat(getComputedStyle(n).fontSize),
      margin: getComputedStyle(n).marginTop,
    }));
    assert.equal(parseFloat(value.end), -1.5 * value.font);
    assert.equal(value.margin, '8px');
    await set({ rtl: false, cssOffset: false });
  });
  await check(
    'rolling digits have one current accessible value and correct small track height',
    async () => {
      await set({ count: -12 });
      const indicator = page.locator('#owned-badge .apollo-badge-count');
      assert.equal(await indicator.innerText(), '-12');
      await set({ count: 29 });
      const text = await indicator.evaluate((n) => {
        const copy = n.cloneNode(true);
        for (const child of copy.querySelectorAll('[aria-hidden="true"]')) child.remove();
        return copy.textContent;
      });
      assert.equal(text, '29');
      const track = await page
        .locator('#token-small .apollo-scroll-number-only')
        .first()
        .evaluate((n) => ({
          track: getComputedStyle(n).height,
          indicator: getComputedStyle(n.closest('sup')).height,
        }));
      assert.equal(track.track, track.indicator);
    },
  );
  await check('reduced motion stops status ripple and digit transitions', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const actual = await page.evaluate(() => ({
      ripple: getComputedStyle(
        document.querySelector('#token-status .apollo-badge-status-dot'),
        '::after',
      ).animationName,
      digit: getComputedStyle(document.querySelector('#token-small .apollo-scroll-number-only'))
        .transitionDuration,
    }));
    assert.equal(actual.ripple, 'none');
    assert.equal(actual.digit, '0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
  await check(
    'all five complete VNode count shapes use the same owned native indicator',
    async () => {
      const actual = await page.locator('[data-rich-count]').evaluateAll((nodes) =>
        nodes.map((root) => {
          const indicator = root.querySelector('.apollo-scroll-number-custom-component');
          return {
            host: indicator?.tagName,
            text: indicator?.textContent,
            semantic: indicator?.classList.contains('owned-rich-indicator'),
            title: indicator?.getAttribute('title'),
          };
        }),
      );
      assert.deepEqual(
        actual,
        Array.from({ length: 5 }, () => ({
          host: 'SUP',
          text: 'First / Last0',
          semantic: true,
          title: 'Custom count',
        })),
      );
    },
  );
  await check(
    'all empty count forms keep captions without empty indicators or stale status titles',
    async () => {
      const actual = await page.locator('[data-empty-count]').evaluateAll((nodes) =>
        nodes.map((root) => ({
          indicator: Boolean(
            root.querySelector('.apollo-badge-count,.apollo-scroll-number-custom-component'),
          ),
          caption: root.querySelector('.apollo-badge-status-text')?.textContent,
        })),
      );
      assert.deepEqual(
        actual,
        Array.from({ length: 9 }, () => ({ indicator: false, caption: 'Caption' })),
      );
      await set({ status: true });
      assert.equal(
        await page.locator('#changing-status .apollo-badge-status-dot').getAttribute('title'),
        null,
      );
      await set({ status: false });
    },
  );
  await check(
    'a conditional count component owns one business instance and hides its empty host',
    async () => {
      const indicator = page.locator('#conditional-count .apollo-scroll-number-custom-component');
      assert.equal(await indicator.count(), 1);
      assert.equal(await indicator.evaluate((n) => getComputedStyle(n).display), 'none');
      await indicator.evaluate((n) => {
        window.conditionalHost = n;
      });
      for (const visible of [true, false, true]) {
        await page.evaluate((visible) => window.badgeAudit.countVisible(visible), visible);
        assert.equal(await indicator.evaluate((n) => n === window.conditionalHost), true);
        assert.equal(await indicator.isVisible(), visible);
        if (visible) assert.equal(await indicator.innerText(), 'First / Last0');
        assert.deepEqual(await page.evaluate(() => window.badgeAudit.countLifecycle()), {
          mounts: 1,
          unmounts: 0,
        });
      }
    },
  );
  const contrast = async (node) =>
    node.evaluate((n) => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const rgba = (css) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].map((v, i) => (i === 3 ? v / 255 : v));
      };
      const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
      const lum = (color) =>
        color
          .map((v) => v / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      let bg = [255, 255, 255];
      const parents = [];
      for (let p = n; p; p = p.parentElement) parents.unshift(p);
      for (const p of parents) bg = over(rgba(getComputedStyle(p).backgroundColor), bg);
      const color = getComputedStyle(n).color,
        fg = over(rgba(color), bg);
      const a = lum(fg),
        b = lum(bg);
      return { ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), color, background: bg };
    });
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await set({ mode });
    for (const selector of [
      '[data-color] .apollo-badge-count',
      '[data-ribbon-color] .apollo-ribbon-content',
    ]) {
      const nodes = page.locator(selector);
      assert.equal(await nodes.count(), 18);
      for (let i = 0; i < 18; i++) {
        const node = nodes.nth(i),
          value = await contrast(node);
        results.push({
          name: `${mode}: ${selector} color ${i}`,
          passed: value.ratio >= 4.5,
          actual: value,
        });
      }
    }
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  await check('real browser axe has no violations', async () => {
    const violations = await page.evaluate(
      async () => (await window.axe.run(document.querySelector('main'))).violations,
    );
    assert.deepEqual(
      violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
  });
  const report = {
    browser: browser.version(),
    source: Boolean(process.env.BADGE_SOURCE),
    results,
    errors,
  };
  writeFileSync(
    process.env.BADGE_EVIDENCE ?? '/tmp/apollo-badge-browser.json',
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      checks: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      errors: errors.length,
    }),
  );
  if (results.some((r) => !r.passed) || errors.length) process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
