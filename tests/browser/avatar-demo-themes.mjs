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
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-avatar-demos-'));
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
      rollupOptions: { input: path.join(root, 'avatar-demo-themes.html') },
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
  await page.goto(`${server.resolvedUrls.local[0]}avatar-demo-themes.html`);
  await page.waitForFunction(() => Boolean(window.setAvatarDemo));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const demo of [
    'basic',
    'type',
    'dynamic',
    'badge',
    'group',
    'max-count',
    'fallback',
    'toggle-debug',
    'responsive',
    'component-token',
  ])
    for (const theme of ['default', 'dark', 'compact', 'both']) {
      await page.evaluate(([demo, theme]) => window.setAvatarDemo(demo, theme), [demo, theme]);
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
  const check = async (name, run) => {
    try {
      await run();
      results.push({ name, passed: true });
    } catch (e) {
      results.push({ name, passed: false, error: e.message });
    }
  };
  const show = async (demo) => {
    await page.evaluate((demo) => window.setAvatarDemo(demo, 'default'), demo);
  };
  await show('dynamic');
  await check('actual dynamic name and gap refit', async () => {
    for (let i = 0; i < 3; i++)
      await page.getByRole('button', { name: 'ChangeUser', exact: true }).click();
    assert.equal((await page.locator('.apollo-avatar').textContent()).trim(), 'Edward');
    const scale = () =>
      page
        .locator('.apollo-avatar-string')
        .evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).a);
    const before = await scale();
    await page.getByRole('button', { name: 'changeGap', exact: true }).click();
    await page.waitForFunction(
      (previous) =>
        new DOMMatrix(getComputedStyle(document.querySelector('.apollo-avatar-string')).transform)
          .a > previous,
      before,
    );
  });
  await show('max-count');
  await check('actual native v-for count, switch and InputNumber', async () => {
    const group = page.locator('.apollo-avatar-group');
    assert.equal(await group.textContent(), 'AB+2');
    await page.getByRole('switch', { name: 'overflowInFinal' }).click();
    assert.equal(await group.textContent(), 'ABC+1');
    const input = page.getByRole('spinbutton', { name: 'Avatar count' });
    await input.fill('6');
    await input.press('Enter');
    await page.waitForFunction(
      () => document.querySelector('.apollo-avatar-group').textContent === 'ABC+3',
    );
  });
  await show('fallback');
  await check('actual invalid image data falls back without network requests', async () => {
    await page.waitForFunction(() => document.querySelectorAll('.apollo-avatar img').length === 0);
    assert.deepEqual(await page.locator('.apollo-avatar').allTextContents(), ['A', 'ABC']);
  });
  await show('toggle-debug');
  await check('hidden mount, show, size changes and outer CSS scale', async () => {
    assert.equal(await page.locator('.apollo-avatar:visible').count(), 0);
    await page.getByRole('button', { name: 'Toggle Avatar visibility' }).click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.apollo-avatar')].every((n) => n.offsetWidth > 0),
    );
    await page.getByRole('button', { name: 'Toggle Avatar size' }).click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.apollo-avatar')].every((n) => n.offsetWidth === 24),
    );
    const avatar = page.locator('.apollo-avatar').first();
    const before = await avatar.boundingBox();
    await page.getByRole('button', { name: 'Change Avatar scale' }).click();
    const after = await avatar.boundingBox();
    assert.equal(after.width, before.width * 2);
    for (const text of await page.locator('.apollo-avatar-string').all()) {
      const actual = await text.evaluate((n) => ({
        text: n.getBoundingClientRect().width,
        root: n.parentElement.getBoundingClientRect().width,
      }));
      assert.ok(actual.text <= actual.root);
    }
  });
  await show('responsive');
  await check('actual responsive Demo at three viewports', async () => {
    for (const [width, expected] of [
      [375, 24],
      [800, 40],
      [1200, 80],
    ]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForFunction(
        (expected) => document.querySelector('.apollo-avatar').offsetWidth === expected,
        expected,
      );
    }
  });
  await show('component-token');
  await check('actual Token toggle updates roots and open Teleport spacing', async () => {
    const avatar = page.locator('.apollo-avatar').filter({ hasText: /^M$/ });
    assert.equal(await avatar.evaluate((n) => n.offsetWidth), 48);
    await page.locator('.apollo-avatar-group-overflow').click();
    const hidden = page.locator('.apollo-avatar-group-popover .apollo-avatar + .apollo-avatar');
    await hidden.waitFor({ state: 'visible' });
    assert.equal(await hidden.evaluate((n) => getComputedStyle(n).marginInlineStart), '10px');
    await page.getByRole('switch', { name: 'Use custom Avatar tokens' }).click();
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('.apollo-avatar')].find((n) => n.textContent === 'M')
          .offsetWidth === 32,
    );
  });
  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.AVATAR_DEMO_THEME_EVIDENCE ?? '/tmp/apollo-avatar-demo-themes.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
