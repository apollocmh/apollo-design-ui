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
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-statistic-browser-'));
const results = [],
  errors = [];
const check = (name, actual, expected = true) => {
  let passed = true;
  try {
    assert.deepEqual(actual, expected);
  } catch {
    passed = false;
  }
  results.push({ name, actual, expected, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
};
let browser, server;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'statistic-contract-audit.html') },
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.clock.install({ time: new Date('2026-10-27T00:00:00Z') });
  await page.goto(`${server.resolvedUrls.local[0]}statistic-contract-audit.html`, {
    waitUntil: 'networkidle',
  });
  await page.waitForFunction(() => Boolean(window.statisticAudit));
  const main = page.locator('[data-statistic-main]'),
    plain = page.locator('[data-plain-statistic]');
  check('native root id', await main.getAttribute('id'), 'statistic-main');
  check('native root tabindex', await main.getAttribute('tabindex'), '0');
  const editor = page.getByRole('textbox', { name: 'Statistic native draft', exact: true });
  check('complete native value slot', await editor.count(), 1);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  check(
    'default production typography passes axe',
    await plain.evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((x) => x.failureSummary),
      })),
    ),
    [],
  );
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  await page.evaluate(() => window.statisticAudit.set({ source: true, provider: true, rtl: true }));
  check(
    'current source title font',
    await main.locator('.apollo-statistic-title').evaluate((n) => getComputedStyle(n).fontSize),
    '18px',
  );
  check(
    'current source content font',
    await main.locator('.apollo-statistic-content').evaluate((n) => getComputedStyle(n).fontSize),
    '42px',
  );
  check(
    'current source alias color',
    await main.locator('.apollo-statistic-content').evaluate((n) => getComputedStyle(n).color),
    'rgb(34, 85, 119)',
  );
  check(
    'current Provider class',
    await main.evaluate((n) => n.classList.contains('current-statistic-provider')),
  );
  check(
    'current Provider native style',
    await main.evaluate((n) => getComputedStyle(n).padding),
    '9px',
  );
  check(
    'current RTL class',
    await main.evaluate((n) => n.classList.contains('apollo-statistic-rtl')),
  );
  if (await editor.count()) {
    const original = await editor.elementHandle();
    await editor.fill('Persistent browser draft');
    await editor.focus();
    await page.evaluate(() =>
      window.statisticAudit.set({ value: 42.125, precision: 1, titleSlot: true, extra: true }),
    );
    check(
      'formatted business scope',
      await main.locator('[data-statistic-value]').textContent(),
      '42.125|42.1',
    );
    check(
      'complete current title slot',
      await main.locator('.apollo-statistic-title').textContent(),
      'Native title tail',
    );
    check(
      'numeric edits and adjacent slots preserve native node',
      await editor.evaluate((n, o) => n === o, original),
    );
    check(
      'numeric edits preserve native focus',
      await editor.evaluate((n) => n === document.activeElement),
    );
    await page.evaluate(() =>
      window.statisticAudit.set({
        source: false,
        provider: false,
        rtl: false,
        empty: true,
        extra: false,
      }),
    );
    check(
      'intentional empty title suppresses text',
      await main.locator('.apollo-statistic-header').count(),
      0,
    );
    check(
      'theme removal returns current defaults',
      await main.locator('.apollo-statistic-content').evaluate((n) => getComputedStyle(n).fontSize),
      '24px',
    );
    check(
      'Provider class removed',
      await main.evaluate((n) => n.classList.contains('current-statistic-provider')),
      false,
    );
    check(
      'theme and adjacent content removal preserve node/value',
      await editor.evaluate((n, o) => n === o && n.value === 'Persistent browser draft', original),
    );
    for (const [style, width] of [
      ['width: 251px; padding: 7px', '251px'],
      [[{ width: '261px' }, 'padding: 8px'], '261px'],
      [{ width: '271px', '--apollo-statistic-content-font-size': '47px' }, '271px'],
    ]) {
      await page.evaluate((style) => window.statisticAudit.set({ style }), style);
      check(
        `native style width ${width}`,
        await main.evaluate((n) => getComputedStyle(n).width),
        width,
      );
    }
    await page.evaluate(() => window.statisticAudit.set({ source: true }));
    check(
      'native token overrides source token',
      await main.locator('.apollo-statistic-content').evaluate((n) => getComputedStyle(n).fontSize),
      '47px',
    );
    await main.click({ position: { x: 230, y: 5 } });
    check(
      'root click fires once',
      (await page.evaluate(() => window.statisticAudit.snapshot())).clicks,
      1,
    );
    await page.evaluate(() => window.statisticAudit.set({ loading: true }));
    check(
      'loading removes actual content',
      await main.locator('.apollo-statistic-content').count(),
      0,
    );
    await page.evaluate(() => window.statisticAudit.set({ loading: false }));
    check(
      'loading restores controlled draft',
      await editor.inputValue(),
      'Persistent browser draft',
    );
  }
  const clock = page.getByRole('textbox', { name: 'Statistic clock draft', exact: true });
  check('Timer forwards native value slot', await clock.count(), 1);
  if (await clock.count()) {
    const original = await clock.elementHandle();
    await clock.fill('Persistent clock draft');
    await clock.focus();
    await page.evaluate(() => window.statisticAudit.clock('countup', -5000));
    check(
      'countup current scope',
      await page.locator('[data-statistic-clock]').textContent(),
      'countup|05|5000',
    );
    await page.evaluate(() => window.statisticAudit.clock('countdown', 2000));
    check(
      'dynamic countdown direction',
      await page.locator('[data-statistic-clock]').textContent(),
      'countdown|02|2000',
    );
    const previous = await page.evaluate(() => window.statisticAudit.snapshot());
    await clock.dispatchEvent('change');
    check(
      'native editor change is not a business duration',
      (await page.evaluate(() => window.statisticAudit.snapshot())).changes,
      previous.changes,
    );
    await page.clock.runFor(2100);
    check(
      'countdown completes at zero',
      await page.locator('[data-statistic-clock]').textContent(),
      'countdown|00|0',
    );
    check(
      'finish once',
      (await page.evaluate(() => window.statisticAudit.snapshot())).finishes,
      previous.finishes + 1,
    );
    check(
      'final duration is zero',
      (await page.evaluate(() => window.statisticAudit.snapshot())).last,
      0,
    );
    check(
      'clock ticks retain original focused editor',
      await clock.evaluate(
        (n, o) => n === o && n === document.activeElement && n.value === 'Persistent clock draft',
        original,
      ),
    );
    const stopped = await page.evaluate(() => window.statisticAudit.snapshot());
    await page.clock.runFor(1000);
    check(
      'completed timer has no further changes',
      (await page.evaluate(() => window.statisticAudit.snapshot())).changes,
      stopped.changes,
    );
    await page.evaluate(() => window.statisticAudit.clock('countdown', 500));
    await page.clock.runFor(600);
    check(
      'rearmed target completes second cycle',
      (await page.evaluate(() => window.statisticAudit.snapshot())).finishes,
      previous.finishes + 2,
    );
    await page.evaluate(() => window.statisticAudit.clock('countdown', null));
    check(
      'invalid target has explicit null duration',
      await page.locator('[data-statistic-clock]').textContent(),
      'countdown|-|',
    );
    const invalid = await page.evaluate(() => window.statisticAudit.snapshot());
    await page.clock.runFor(1000);
    check(
      'invalid target has no effects',
      (await page.evaluate(() => window.statisticAudit.snapshot())).changes,
      invalid.changes,
    );
    await page.evaluate(() => window.statisticAudit.showClock(false));
    const removed = await page.evaluate(() => window.statisticAudit.snapshot());
    await page.clock.runFor(1000);
    check(
      'unmounted clock has no effects',
      (await page.evaluate(() => window.statisticAudit.snapshot())).changes,
      removed.changes,
    );
    await page.evaluate(() => window.statisticAudit.showClock(true));
    await page.evaluate(() => window.statisticAudit.clock('countup', -3000));
    check(
      'remounted clock renders current controlled draft',
      await clock.inputValue(),
      'Persistent clock draft',
    );
  }
  check(
    'Countdown forwards suffix slot',
    await page
      .locator('[data-statistic-countdown] .apollo-statistic-content-suffix')
      .textContent()
      .catch(() => null),
    'Remaining',
  );
  await page.evaluate(() =>
    window.statisticAudit.set({ source: false, style: { width: '271px' } }),
  );
  await page.clock.resume();
  check(
    'complete current browser content passes axe',
    await page.locator('main').evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((x) => x.failureSummary),
      })),
    ),
    [],
  );
  check('zero browser and Vue errors', errors, []);
  writeFileSync(
    process.env.STATISTIC_BROWSER_EVIDENCE ?? '/tmp/apollo-statistic-browser.json',
    `${JSON.stringify({ browser: browser.version(), results, errors }, null, 2)}\n`,
  );
  console.log(
    `Statistic browser: ${results.filter((r) => r.passed).length}/${results.length} passed`,
  );
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
