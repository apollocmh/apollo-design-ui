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
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-result-browser-'));
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
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'result-contract-audit.html') },
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}result-contract-audit.html`);
  await page.waitForFunction(() => Boolean(window.resultAudit));
  const host = page.locator('.native-result');
  const css = (locator, property) =>
    locator.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p).trim(), property);
  const set = (options) => page.evaluate((options) => window.resultAudit.set(options), options);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const axe = () =>
    page.locator('main').evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((x) => ({ html: x.html, failure: x.failureSummary })),
      })),
    );
  for (const [key, value] of [
    ['id', 'native-result'],
    ['tabindex', '0'],
    ['role', 'region'],
    ['data-native-result', 'yes'],
  ])
    check(`native ${key}`, await host.getAttribute(key), value);
  check(
    'native exposed root',
    (await page.evaluate(() => window.resultAudit.snapshot())).nativeId,
    'native-result',
  );
  await host.click();
  check(
    'one native root event',
    (await page.evaluate(() => window.resultAudit.snapshot())).clicks,
    1,
  );
  await set({ style: 'padding:13px' });
  check('native string style', await css(host, 'padding'), '13px');
  await set({ style: [{ padding: '17px' }, { opacity: 0.75 }] });
  check('native array style', await css(host, 'padding'), '17px');
  await set({ style: { padding: '6px' } });
  check('old style removal', await css(host, 'opacity'), '1');
  await set({ provider: true, status: 'success', rtl: true });
  check(
    'current Provider class',
    await host.evaluate((n) => n.classList.contains('current-result-provider')),
  );
  check(
    'current Provider title',
    await host
      .locator('.apollo-result-title')
      .evaluate((n) => n.classList.contains('current-provider-title')),
  );
  check(
    'current semantic props',
    await css(host.locator('.apollo-result-title'), 'opacity'),
    '0.85',
  );
  check('current actual RTL', await css(host, 'direction'), 'rtl');
  await set({ provider: false, status: 'info', rtl: false, source: true });
  for (const [part, property, value] of [
    ['title', 'font-size', '29px'],
    ['subtitle', 'font-size', '18px'],
    ['icon > .apollo-icon', 'font-size', '84px'],
  ])
    check(
      `current source ${part}`,
      await css(host.locator(`.apollo-result-${part}`), property),
      value,
    );
  check(
    'current source extra margin variable',
    await css(host, '--apollo-result-extra-margin'),
    '31px 0 0',
  );
  await set({ native: true });
  check(
    'native component variable wins',
    await css(host.locator('.apollo-result-title'), 'font-size'),
    '35px',
  );
  await set({ native: false, source: false });
  check(
    'source removal restores default',
    await css(host.locator('.apollo-result-title'), 'font-size'),
    '24px',
  );
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await set({ mode });
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    check(`${mode} actual axe`, await axe(), []);
  }
  await set({ mode: 'default' });
  await set({ slot: 'full' });
  for (const part of ['title', 'subtitle', 'extra', 'icon', 'body']) {
    check(
      `complete current ${part} slot`,
      (await host.locator(`.apollo-result-${part} strong, .apollo-result-${part} span`).count()) >
        0,
    );
  }
  const iconEditor = page.getByRole('textbox', { name: 'Result icon draft', exact: true });
  const bodyEditor = page.getByRole('textbox', { name: 'Result body draft', exact: true });
  await iconEditor.fill('Stable icon draft');
  await bodyEditor.fill('Stable body draft');
  await iconEditor.focus();
  await iconEditor.evaluate((n) => n.setSelectionRange(2, 7));
  const originalIcon = await iconEditor.elementHandle();
  const originalBody = await bodyEditor.elementHandle();
  for (const status of [
    'success',
    'warning',
    'error',
    403,
    '403',
    404,
    '404',
    500,
    '500',
    'info',
  ]) {
    await set({ status });
    check(
      `${status} custom editor ownership`,
      await iconEditor.evaluate(
        (n, o) =>
          n === o &&
          n === document.activeElement &&
          n.value === 'Stable icon draft' &&
          n.selectionStart === 2 &&
          n.selectionEnd === 7,
        originalIcon,
      ),
    );
    check(
      `${status} body editor ownership`,
      await bodyEditor.evaluate((n, o) => n === o && n.value === 'Stable body draft', originalBody),
    );
    check(
      `${status} custom content has no default illustration box`,
      await host.locator('.apollo-result-image').count(),
      0,
    );
  }
  await iconEditor.press('Tab');
  check(
    'native keyboard reaches action',
    await page
      .getByRole('button', { name: 'Native result action', exact: true })
      .evaluate((n) => n === document.activeElement),
  );
  await page.keyboard.press('Space');
  check(
    'one native keyboard action',
    (await page.evaluate(() => window.resultAudit.snapshot())).actions,
    1,
  );
  await page.keyboard.press('Tab');
  check(
    'native keyboard reaches body editor',
    await bodyEditor.evaluate((n) => n === document.activeElement),
  );
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await set({ mode });
    check(`${mode} complete interactive content axe`, await axe(), []);
    check(
      `${mode} retains body input`,
      await bodyEditor.evaluate((n, o) => n === o && n.value === 'Stable body draft', originalBody),
    );
  }
  await set({ mode: 'default', source: true });
  check(
    'source update retains current editor and focus',
    await bodyEditor.evaluate(
      (n, o) => n === o && n === document.activeElement && n.value === 'Stable body draft',
      originalBody,
    ),
  );
  await set({ source: false });
  for (let cycle = 0; cycle < 2; cycle++) {
    await set({ slot: 'empty', status: 404 });
    check(
      `empty slots suppress every fallback and container ${cycle}`,
      await host.locator(':scope > div').count(),
      0,
    );
    await set({ slot: 'absent', icon: false });
    check(
      `absent icon respects false on exceptions ${cycle}`,
      await host.locator('.apollo-result-icon').count(),
      0,
    );
    await set({ icon: null });
    check(
      `absent icon respects null on exceptions ${cycle}`,
      await host.locator('.apollo-result-icon').count(),
      0,
    );
    await set({ icon: true });
    check(
      `removing icon slot restores decorative illustration ${cycle}`,
      await host.locator('.apollo-result-image svg').getAttribute('aria-hidden'),
      'true',
    );
    check(
      `decorative SVG stays outside keyboard navigation ${cycle}`,
      await host.locator('.apollo-result-image svg').getAttribute('focusable'),
      'false',
    );
    await set({ slot: 'full', icon: false });
    check(`full icon slot overrides false on exceptions ${cycle}`, await iconEditor.count(), 1);
  }
  await set({ shown: false });
  check(
    'unmount clears exposed root',
    (await page.evaluate(() => window.resultAudit.snapshot())).nativeId,
    null,
  );
  await set({ shown: true });
  check(
    'remount restores a real root',
    (await page.evaluate(() => window.resultAudit.snapshot())).nativeId,
    'native-result',
  );
  check(
    'remount restores caller-owned model values',
    await bodyEditor.inputValue(),
    'Stable body draft',
  );
  await page.setViewportSize({ width: 375, height: 812 });
  check(
    'mobile content does not overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  check('no page or Vue errors', errors, []);
  const result = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.RESULT_EVIDENCE ?? '/tmp/apollo-result-browser.json',
    `${JSON.stringify(result, null, 2)}\n`,
  );
  assert.equal(results.filter((r) => !r.passed).length, 0);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
