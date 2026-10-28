import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-descriptions-browser-'));
const alias = Object.fromEntries(
  [
    'utils',
    'theme',
    'icons',
    'ui',
    'motion',
    'portal',
    'position',
    'overlay',
    'a11y',
    'virtual-list',
    'form-core',
    'picker',
    'locale',
  ].map((name) => [`@apollo-design/${name}`, path.join(repo, 'packages', name, 'src/index.ts')]),
);
alias.vue = createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js');
mkdirSync(path.join(temp, 'public'));
copyFileSync(
  path.join(repo, 'packages/theme/dist/tokens.css'),
  path.join(temp, 'public/tokens.css'),
);
const entry = path.join(temp, 'index.html');
writeFileSync(
  entry,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Descriptions contracts</title><link rel="stylesheet" href="/tokens.css"></head><body style="margin:0"><div id="app"></div><script type="module">import {createApp} from 'vue';import Fixture from '${path.join(repo, 'tests/browser/fixtures/DescriptionsContractAudit.vue')}';createApp(Fixture).mount('#app');</script></body></html>`,
);
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
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    build: { outDir: path.join(temp, 'out'), rollupOptions: { input: entry } },
  });
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'out') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.descriptionsAudit));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const main = page.locator('[data-descriptions-main]'),
    editor = page.getByRole('textbox', { name: 'Persistent field draft' });
  const set = (options) =>
    page.evaluate((options) => window.descriptionsAudit.set(options), options);
  const style = (locator, property, pseudo) =>
    locator.evaluate((n, { property, pseudo }) => getComputedStyle(n, pseudo)[property], {
      property,
      pseudo,
    });
  check('native paired description tree', await main.locator('dl > div > dt').count(), 3);
  check(
    'item label slot keeps complete content',
    await main.locator('#field-b > dt').textContent(),
    'Native label',
  );
  check(
    'root native id and tabindex',
    [await main.getAttribute('id'), await main.getAttribute('tabindex')],
    ['native-descriptions', '0'],
  );
  check(
    'Item native class',
    await main.locator('#field-b').evaluate((n) => n.classList.contains('item-b')),
  );
  check(
    'Item classes consumed',
    await main.locator('#field-b > dd').evaluate((n) => n.classList.contains('own-content')),
  );
  const original = await editor.elementHandle();
  await editor.fill('Persistent draft');
  await editor.focus();
  await editor.evaluate((n) => n.setSelectionRange(3, 7));
  for (const options of [
    { column: 1 },
    { column: 2, bordered: true },
    { vertical: true },
    { bordered: false },
    { vertical: false, column: 3 },
    { filled: true },
  ]) {
    await set(options);
    check(
      `geometry ${JSON.stringify(options)} retains editor/value/focus/selection`,
      await editor.evaluate(
        (n, original) =>
          n === original &&
          n.value === 'Persistent draft' &&
          n === document.activeElement &&
          n.selectionStart === 3 &&
          n.selectionEnd === 7,
        original,
      ),
    );
  }
  await set({ order: ['c', 'b', 'a'] });
  check(
    'keyed reorder keeps native identity and draft',
    await editor.evaluate(
      (n, original) => n === original && n.value === 'Persistent draft',
      original,
    ),
  );
  check(
    'keyed reorder retains owned focus',
    await editor.evaluate((n) => n === document.activeElement),
  );
  await editor.focus();
  await set({ title: true, source: true, provider: true, rtl: true });
  check(
    'complete current title slot',
    await main.locator('.apollo-descriptions-title').textContent(),
    'Native title',
  );
  check(
    'Provider class and style',
    [
      await main.evaluate((n) => n.classList.contains('current-provider')),
      await style(main, 'padding'),
    ],
    [true, '8px'],
  );
  check(
    'Provider semantic style',
    await style(main.locator('#field-a > dt'), 'letterSpacing'),
    '1px',
  );
  check(
    'current label/color token',
    await style(main.locator('#field-b > dt'), 'color'),
    'rgb(18, 52, 86)',
  );
  check(
    'current title/color token',
    await style(main.locator('.apollo-descriptions-title'), 'color'),
    'rgb(35, 69, 103)',
  );
  check(
    'current title margin token',
    await style(main.locator('.apollo-descriptions-header'), 'marginBottom'),
    '31px',
  );
  check(
    'current content/color token',
    await style(main.locator('#field-a > dd'), 'color'),
    'rgb(52, 86, 120)',
  );
  check(
    'current extra/color token',
    await style(main.locator('.apollo-descriptions-extra'), 'color'),
    'rgb(69, 103, 137)',
  );
  check(
    'current colon spacing tokens',
    [
      await style(main.locator('#field-b > dt'), 'marginInlineStart', '::after'),
      await style(main.locator('#field-b > dt'), 'marginInlineEnd', '::after'),
    ],
    ['2px', '3px'],
  );
  await set({ bordered: true });
  check(
    'bordered label/background token',
    await style(main.locator('#field-b > dt'), 'backgroundColor'),
    'rgb(229, 240, 255)',
  );
  check(
    'bordered padding tokens',
    [
      await style(main.locator('#field-b > dt'), 'paddingTop'),
      await style(main.locator('#field-b > dt'), 'paddingInlineEnd'),
    ],
    ['7px', '9px'],
  );
  check('RTL is current', await style(main, 'direction'), 'rtl');
  check(
    'configuration edits retain native node',
    await editor.evaluate(
      (n, original) => n === original && n.value === 'Persistent draft',
      original,
    ),
  );
  await set({ empty: true, source: false, provider: false, rtl: false });
  check(
    'intentional empty title suppresses prop fallback',
    await main.locator('.apollo-descriptions-title').count(),
    0,
  );
  check(
    'Provider removal clears class and style',
    [
      await main.evaluate((n) => n.classList.contains('current-provider')),
      await style(main, 'padding'),
    ],
    [false, '0px'],
  );
  for (const [nativeStyle, expected] of [
    ['width: 641px', '641px'],
    [[{ width: '651px' }, 'padding: 4px'], '651px'],
    [{ width: '661px' }, '661px'],
  ]) {
    await set({ style: nativeStyle });
    check(`native style ${expected}`, await style(main, 'width'), expected);
  }
  for (const mode of ['light', 'dark', 'compact']) {
    await set({ mode, filled: false, order: ['a', 'b', 'c'], column: 3 });
    for (const vertical of [false, true]) {
      for (const bordered of [false, true]) {
        await set({ vertical, bordered });
        check(
          `${mode}/${vertical}/${bordered} has no horizontal overflow`,
          await main.evaluate((n) => n.scrollWidth <= n.clientWidth),
        );
        check(
          `${mode}/${vertical}/${bordered} accessible content`,
          await page.locator('main').evaluate(async (n) =>
            (await window.axe.run(n)).violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((x) => x.failureSummary),
            })),
          ),
          [],
        );
      }
    }
    await page.screenshot({ path: `/tmp/apollo-descriptions-${mode}.png`, fullPage: true });
  }
  await set({ mode: 'light', column: { xs: 1, md: 3 }, bordered: true, vertical: false });
  await editor.focus();
  await page.setViewportSize({ width: 420, height: 1000 });
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-descriptions-main] dl')
        .style.getPropertyValue('--apollo-descriptions-columns') === '1',
  );
  check(
    'responsive columns retain native editor and focus',
    await editor.evaluate(
      (n, original) =>
        n === original && n === document.activeElement && n.value === 'Persistent draft',
      original,
    ),
  );
  check(
    'responsive mobile layout fits',
    await main.evaluate((n) => n.scrollWidth <= n.clientWidth),
  );
  check(
    'nested label styles stay on owner',
    await page
      .locator('[data-nested] .apollo-descriptions .apollo-descriptions-item-label')
      .evaluate((n) => getComputedStyle(n).color),
    'rgba(0, 0, 0, 0.65)',
  );
  await main.getByRole('button', { name: 'Refresh fields' }).click();
  check(
    'native button fires once',
    await page.evaluate(() => window.descriptionsAudit.snapshot()),
    { clicks: 1 },
  );
  await set({ present: false });
  check(
    'unmount removes main only',
    [await main.count(), await page.locator('[data-independent]').count()],
    [0, 1],
  );
  await set({ present: true });
  check('remount starts fresh uncontrolled content', await editor.inputValue(), 'Original draft');
  check('zero runtime and Vue errors', errors, []);
  writeFileSync(
    process.env.DESCRIPTIONS_BROWSER_EVIDENCE ?? '/tmp/apollo-descriptions-browser.json',
    `${JSON.stringify({ browser: browser.version(), results, errors }, null, 2)}\n`,
  );
  console.log(`Descriptions browser: ${results.filter((r) => r.passed).length}/${results.length}`);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(temp, { recursive: true, force: true });
}
