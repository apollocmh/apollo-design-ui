import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App from './fixtures/StatisticThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-statistic-hydration-'));
const checks = [];
let server, browser;
try {
  const markup = await renderToString(createSSRApp(App));
  assert.ok(markup.includes('--apollo-statistic-content-font-size:42px'));
  assert.ok(markup.includes('data-hydrated-text="clock">-'));
  assert.ok(markup.includes('data-hydrated-text="countdown">-'));
  checks.push(
    'all three exports render current source tokens and deterministic clock placeholders without browser effects',
  );
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'statistic-theme-hydration.html') },
    },
  });
  const file = path.join(outDir, 'statistic-theme-hydration.html');
  const html = readFileSync(file, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    file,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><script>window.statisticServerRoots=['number','clock','countdown'].map(n=>document.getElementById('hydrated-'+n));window.statisticServerEditors=['number','clock','countdown'].map(n=>document.getElementById('hydrated-'+n+'-draft'));for(const n of window.statisticServerEditors)n.value='typed before hydration';window.statisticServerEditors[1].focus();window.statisticServerEditors[1].setSelectionRange(2,5);</script>`,
    ),
  );
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}statistic-theme-hydration.html`);
  await page.waitForFunction(() => window.statisticHydrated);
  const identity = async () =>
    assert.equal(
      await page.evaluate(
        () =>
          window.statisticServerRoots.every(
            (n, i) =>
              n === document.getElementById(`hydrated-${['number', 'clock', 'countdown'][i]}`),
          ) &&
          window.statisticServerEditors.every(
            (n, i) =>
              n ===
                document.getElementById(`hydrated-${['number', 'clock', 'countdown'][i]}-draft`) &&
              n.value === 'typed before hydration',
          ) &&
          document.activeElement === window.statisticServerEditors[1] &&
          window.statisticServerEditors[1].selectionStart === 2 &&
          window.statisticServerEditors[1].selectionEnd === 5,
      ),
      true,
    );
  await identity();
  await page.waitForFunction(
    () => document.querySelector('[data-hydrated-text="clock"]').textContent !== '-',
  );
  checks.push(
    'hydration retains all server roots/editors, pretyped values, focus and selection while starting the real clocks',
  );
  for (const expected of ['', '46px', '42px']) {
    await page.evaluate(() => window.statisticHydration.cycleTheme());
    await identity();
    assert.equal(
      await page
        .locator('#hydrated-number')
        .evaluate((n) => n.style.getPropertyValue('--apollo-statistic-content-font-size')),
      expected,
    );
  }
  checks.push(
    'source theme removal/restoration changes current variables without replacing any editor',
  );
  await page.evaluate(() => window.statisticHydration.setValue(42.125));
  await identity();
  assert.equal(await page.locator('[data-hydrated-text="number"]').textContent(), '42.12');
  checks.push(
    'numeric formatting updates during hydration without consuming or replacing the native input',
  );
  for (const [type, delta] of [
    ['countdown', 5000],
    ['countup', -5000],
    ['countdown', 5000],
    ['countup', -5000],
  ]) {
    await page.evaluate(
      ([type, delta]) => window.statisticHydration.clock(type, delta),
      [type, delta],
    );
    await identity();
    assert.notEqual(await page.locator('[data-hydrated-text="clock"]').textContent(), '-');
  }
  checks.push('repeated target/direction changes preserve hydrated clock identity and focus');
  await page.evaluate(() => window.statisticHydration.clock('countdown', 0));
  await page.waitForFunction(() => window.statisticHydration.snapshot().finished === 1);
  await identity();
  assert.equal(await page.locator('[data-hydrated-text="clock"]').textContent(), '00');
  await page.evaluate(() => window.unmountStatistic());
  const snapshot = await page.evaluate(() => window.statisticHydration.snapshot());
  await page.waitForTimeout(100);
  assert.deepEqual(await page.evaluate(() => window.statisticHydration.snapshot()), snapshot);
  assert.equal(await page.locator('#hydrated-clock').count(), 0);
  assert.deepEqual(errors, []);
  checks.push(
    'countdown zero finishes exactly once and unmount stops effects with zero browser/Vue errors',
  );
  const report = { browser: browser.version(), checks, errors };
  writeFileSync(
    process.env.STATISTIC_HYDRATION_EVIDENCE ?? '/tmp/apollo-statistic-hydration.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(report);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
