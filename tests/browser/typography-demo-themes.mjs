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
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-typography-demos-'));
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
      rollupOptions: { input: path.join(root, 'typography-demo-themes.html') },
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
  await page.goto(`${server.resolvedUrls.local[0]}typography-demo-themes.html`);
  await page.waitForFunction(() => Boolean(window.setTypographyDemo));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const demo of [
    'basic',
    'component-token',
    'copyable',
    'editable',
    'editable-custom',
    'ellipsis',
    'ellipsis-controlled',
    'ellipsis-expandable',
    'ellipsis-middle',
    'semantic',
    'suffix',
    'table',
    'text',
    'title',
  ])
    for (const theme of ['default', 'dark', 'compact', 'both']) {
      await page.evaluate(([demo, theme]) => window.setTypographyDemo(demo, theme), [demo, theme]);
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

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const check = async (name, run) => {
    try {
      await run();
      results.push({ interaction: name, passed: true });
      console.log(`PASS ${name}`);
    } catch (error) {
      results.push({ interaction: name, passed: false, error: error.message });
      console.log(`FAIL ${name}: ${error.message}`);
    }
  };
  const demo = async (name, theme) => {
    await page.evaluate(([name, theme]) => window.setTypographyDemo(name, theme), [name, theme]);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  };
  for (const theme of ['default', 'dark', 'compact', 'both']) {
    await check(
      `${theme}: title token control applies, zeroes and restores real margins`,
      async () => {
        await demo('component-token', theme);
        const title = page.locator('[data-spacing-title]');
        const read = () =>
          title.evaluate((n) => {
            const s = getComputedStyle(n);
            return [parseFloat(s.marginTop), parseFloat(s.marginBottom), parseFloat(s.fontSize)];
          });
        const before = await read();
        await page.getByRole('button', { name: 'Cycle title spacing' }).click();
        const custom = await read();
        assert.ok(Math.abs(custom[0] - custom[2] * 2) < 0.1);
        assert.ok(Math.abs(custom[1] - custom[2] * 0.8) < 0.1);
        await page.getByRole('button', { name: 'Cycle title spacing' }).click();
        assert.deepEqual((await read()).slice(0, 2), [0, 0]);
        await page.getByRole('button', { name: 'Cycle title spacing' }).click();
        assert.deepEqual(await read(), before);
      },
    );
    await check(
      `${theme}: actual copy Demo writes current and configured clipboard text`,
      async () => {
        await demo('copyable', theme);
        const actions = page.locator('main button.apollo-typography-copy');
        await actions.nth(0).click();
        await page.waitForFunction(() =>
          document.querySelector('main .apollo-typography-copy-success'),
        );
        assert.equal(
          await page.evaluate(() => navigator.clipboard.readText()),
          'Copy me to the clipboard',
        );
        await actions.nth(1).click();
        await page.waitForFunction(
          () => document.querySelectorAll('main .apollo-typography-copy-success').length === 2,
        );
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Custom copy text');
      },
    );
    await check(`${theme}: actual editing Demo saves and sizes multiline drafts`, async () => {
      await demo('editable-custom', theme);
      await page.locator('main button.apollo-typography-edit').first().click();
      let editor = page.locator('main textarea');
      assert.equal(await editor.getAttribute('maxlength'), '20');
      await editor.fill('Demo saved');
      await editor.press('Enter');
      assert.equal(await page.getByText('保存后的值：Demo saved').isVisible(), true);
      await page.locator('main button.apollo-typography-edit').last().click();
      editor = page.locator('main textarea');
      await editor.fill('A wrapped multiline draft with enough words. '.repeat(30));
      const dimensions = await editor.evaluate((n) => ({
        height: n.clientHeight,
        line: parseFloat(getComputedStyle(n).lineHeight),
      }));
      assert.ok(
        dimensions.height >= dimensions.line * 2 && dimensions.height <= dimensions.line * 5 + 12,
        JSON.stringify(dimensions),
      );
      await editor.press('Escape');
      assert.equal(await page.locator('main textarea').count(), 0);
    });
    await check(
      `${theme}: actual ellipsis Demos expand, collapse and accept controlled updates`,
      async () => {
        await demo('ellipsis-expandable', theme);
        await page.getByRole('button', { name: '展开更多', exact: true }).click();
        await page.getByRole('button', { name: '收起', exact: true }).click();
        assert.equal(
          await page.getByRole('button', { name: '展开更多', exact: true }).isVisible(),
          true,
        );
        await demo('ellipsis-controlled', theme);
        await page.locator('main .apollo-typography-expand').click();
        assert.ok((await page.locator('main').textContent()).includes('当前：展开'));
        await page.getByRole('button', { name: '切换 expanded' }).click();
        assert.ok((await page.locator('main').textContent()).includes('当前：收起'));
        await page.locator('main .apollo-typography-expand').waitFor({ state: 'visible' });
      },
    );
    await check(`${theme}: actual Provider Demo preserves the focused business draft`, async () => {
      await demo('semantic', theme);
      const draft = page.getByRole('textbox', { name: 'Provider typography draft', exact: true });
      await draft.fill('Current Demo draft');
      await draft.focus();
      const handle = await draft.elementHandle();
      for (let stage = 0; stage < 4; stage++) {
        await page
          .getByRole('button', { name: 'Replace typography provider', exact: true })
          .click();
        assert.equal(
          await draft.evaluate((n, old) => n === old && document.activeElement === n, handle),
          true,
        );
        assert.equal(await draft.inputValue(), 'Current Demo draft');
      }
      assert.deepEqual(
        await page
          .locator('main')
          .evaluate(async (n) => (await window.axe.run(n)).violations.map((v) => v.id)),
        [],
      );
    });
  }

  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.TYPOGRAPHY_DEMO_EVIDENCE ?? '/tmp/apollo-typography-demo-themes.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((result) => result.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
