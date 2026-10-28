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
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-badge-demos-'));
const results = [],
  errors = [];
let server, browser;
const check = async (name, run) => {
  try {
    await run();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
};
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'badge-demo-themes.html') },
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
  page.setDefaultTimeout(5000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}badge-demo-themes.html`);
  await page.waitForFunction(() => Boolean(window.setBadgeDemo));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const settle = () =>
    page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
  const demo = async (name, mode) => {
    await page.evaluate(([name, mode]) => window.setBadgeDemo(name, mode), [name, mode]);
    await settle();
  };
  const accessibleCount = (selector) =>
    page.locator(selector).evaluate((n) => {
      const copy = n.cloneNode(true);
      for (const child of copy.querySelectorAll('[aria-hidden="true"]')) child.remove();
      return copy.textContent;
    });
  for (const name of [
    'basic',
    'change',
    'colorful',
    'content-slots',
    'dot',
    'link',
    'no-wrapper',
    'offset',
    'overflow',
    'ribbon',
    'size',
    'status',
    'style-class',
  ]) {
    for (const mode of ['default', 'dark', 'compact', 'both']) {
      await demo(name, mode);
      const violations = await page.locator('main').evaluate(async (n) =>
        (await window.axe.run(n)).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ html: n.html, failure: n.failureSummary })),
        })),
      );
      results.push({ demo: name, mode, passed: violations.length === 0, violations });
    }
  }
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await check(
      `${mode}: real count controls preserve negative signs and current accessible values`,
      async () => {
        await demo('change', mode);
        await page.getByRole('button', { name: '增加计数 / Increase count', exact: true }).click();
        await settle();
        assert.equal(await accessibleCount('.apollo-badge-count'), '6');
        await page.getByRole('button', { name: '负数 / Negative', exact: true }).click();
        await settle();
        assert.equal(await accessibleCount('.apollo-badge-count'), '-12');
        await page.getByRole('button', { name: '重置 / Reset', exact: true }).click();
        await settle();
        assert.equal(await accessibleCount('.apollo-badge-count'), '5');
      },
    );
    await check(
      `${mode}: actual content controls keep both drafts through empty, prop and slot states`,
      async () => {
        await demo('content-slots', mode);
        await page
          .getByRole('textbox', { name: 'Badge anchor state', exact: true })
          .fill('Badge draft');
        await page
          .getByRole('textbox', { name: 'Ribbon anchor state', exact: true })
          .fill('Ribbon draft');
        await page.evaluate(() => {
          window.demoInputs = [...document.querySelectorAll('main input')];
        });
        assert.equal(await page.locator('.apollo-ribbon-content').innerText(), 'New!');
        await page.getByRole('button', { name: '切换空内容 / Toggle empty', exact: true }).click();
        await settle();
        assert.equal(await page.locator('.apollo-ribbon-content').innerText(), '');
        assert.equal(await page.locator('.apollo-badge-count').count(), 0);
        await page.getByRole('button', { name: '切换插槽 / Toggle content', exact: true }).click();
        await settle();
        assert.equal(await page.locator('.apollo-ribbon-content').innerText(), 'Prop ribbon');
        assert.equal(await accessibleCount('.apollo-badge-count'), '5');
        assert.equal(
          await page.evaluate(() =>
            [...document.querySelectorAll('main input')].every(
              (n, i) => n === window.demoInputs[i],
            ),
          ),
          true,
        );
        assert.equal(
          await page.getByRole('textbox', { name: 'Badge anchor state', exact: true }).inputValue(),
          'Badge draft',
        );
        assert.equal(
          await page
            .getByRole('textbox', { name: 'Ribbon anchor state', exact: true })
            .inputValue(),
          'Ribbon draft',
        );
      },
    );
    await check(
      `${mode}: nine real token controls, zero, restore and current direction`,
      async () => {
        await demo('style-class', mode);
        const input = page.getByRole('textbox', { name: 'Token and direction draft', exact: true });
        await input.fill('Token draft');
        await input.evaluate((n) => {
          window.tokenInput = n;
        });
        await page.getByRole('button', { name: '九个 Token / Nine tokens', exact: true }).click();
        await settle();
        const values = await page.evaluate(() => {
          const styles = [...document.querySelectorAll('.demo-stage-1 .apollo-badge-count')].map(
            (n) => getComputedStyle(n),
          );
          const medium = styles[0],
            small = styles[1];
          return {
            height: medium.height,
            size: medium.fontSize,
            weight: medium.fontWeight,
            z: medium.zIndex,
            padding: medium.paddingInlineStart,
            smallHeight: small.height,
            smallSize: small.fontSize,
            dot: getComputedStyle(document.querySelector('.demo-stage-1 .apollo-badge-dot')).width,
            status: getComputedStyle(
              document.querySelector('.demo-stage-1 .apollo-badge-status-dot'),
            ).width,
          };
        });
        assert.deepEqual(values, {
          height: '28px',
          size: '15px',
          weight: '700',
          z: '3',
          padding: '12px',
          smallHeight: '18px',
          smallSize: '11px',
          dot: '10px',
          status: '10px',
        });
        await page.getByRole('button', { name: '零值 / Zero', exact: true }).click();
        await settle();
        assert.equal(
          await page
            .locator('.demo-stage-2 .apollo-badge-count')
            .first()
            .evaluate((n) => getComputedStyle(n).height),
          '0px',
        );
        await page.getByRole('button', { name: '恢复默认 / Reset', exact: true }).click();
        await settle();
        assert.equal(
          await page
            .locator('.demo-stage-0 .apollo-badge-count')
            .first()
            .evaluate((n) => parseFloat(getComputedStyle(n).height) > 0),
          true,
        );
        await page.getByRole('button', { name: 'RTL / LTR', exact: true }).click();
        assert.equal(
          await page
            .locator('.demo-stage-0')
            .first()
            .evaluate((n) => n.classList.contains('apollo-badge-rtl')),
          true,
        );
        assert.equal(await input.evaluate((n) => n === window.tokenInput), true);
        assert.equal(await input.inputValue(), 'Token draft');
      },
    );
  }
  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.BADGE_DEMOS_EVIDENCE ?? '/tmp/apollo-badge-demo-themes.json',
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      checks: results.length,
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
