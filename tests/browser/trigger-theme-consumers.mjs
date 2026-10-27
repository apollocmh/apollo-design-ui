/** Source theme aliases on actual public popup consumers, including open popup updates. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-trigger-themes-'));
const results = [],
  errors = [];
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'trigger-theme-consumers.html') },
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}trigger-theme-consumers.html`);
  await page.waitForFunction(() => Boolean(window.triggerThemes));
  const settle = () =>
    page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
  for (const [kind, selector] of [
    ['tooltip', '.apollo-tooltip'],
    ['popover', '.apollo-popover'],
    ['popconfirm', '.apollo-popconfirm'],
    ['dropdown', '.apollo-dropdown'],
    ['menu', '.apollo-menu-submenu-popup'],
    ['date-picker', '.apollo-picker-dropdown'],
    ['range-picker', '.apollo-picker-dropdown'],
    ['tour', '.apollo-tour'],
  ]) {
    await page.evaluate((kind) => window.triggerThemes.select(kind), kind);
    const popup = page.locator(selector).filter({ visible: true }).first();
    await popup.waitFor();
    await settle();
    const original = await popup.elementHandle();
    const height = () =>
      popup.evaluate((n) =>
        getComputedStyle(n).getPropertyValue('--apollo-control-height-lg').trim(),
      );
    assert.equal(await height(), '52px');
    results.push({ consumer: kind, check: 'initial actual popup source aliases', passed: true });
    for (const stage of [1, 2, 0]) {
      await page.evaluate((stage) => window.triggerThemes.stage(stage), stage);
      await settle();
      assert.equal(await height(), stage === 0 ? '52px' : stage === 1 ? '63px' : '40px');
      assert.equal(await original.evaluate((n) => n.isConnected), true);
      if (stage === 1)
        assert.equal(
          await popup.evaluate((n) =>
            getComputedStyle(n).getPropertyValue('--apollo-color-bg-container').trim(),
          ),
          '#141414',
        );
      results.push({
        consumer: kind,
        check: `current source theme stage ${stage}, original popup`,
        passed: true,
      });
    }
    await page.evaluate(() => window.triggerThemes.open(false));
    await settle();
    await page.evaluate(() => window.triggerThemes.open(true));
    await settle();
    assert.equal(await height(), '52px');
    results.push({
      consumer: kind,
      check: 'close/reopen retains current source theme',
      passed: true,
    });
    console.log(`PASS ${kind}: initial/current/dark compact/removal/reopen source aliases`);
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.TRIGGER_THEME_EVIDENCE ?? '/tmp/apollo-trigger-theme-consumers.json',
    `${JSON.stringify({ browser: browser.version(), results, errors }, null, 2)}\n`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
