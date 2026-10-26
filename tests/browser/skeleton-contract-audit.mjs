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
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-skeleton-browser-'));
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
      rollupOptions: { input: path.join(root, 'skeleton-contract-audit.html') },
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
  await page.goto(`${server.resolvedUrls.local[0]}skeleton-contract-audit.html`);
  await page.waitForFunction(() => Boolean(window.skeletonAudit));
  const names = ['main', 'avatar', 'button', 'input', 'image', 'node'];
  const host = (name) => page.locator(`[data-skeleton-${name}-host]`);
  const shape = (name) => host(name).locator('.apollo-skeleton').first();
  const css = (locator, property) =>
    locator.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p).trim(), property);
  const set = (options) => page.evaluate((options) => window.skeletonAudit.set(options), options);
  const title = () => shape('main').locator('.apollo-skeleton-title');
  const axe = async () =>
    page.locator('main').evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((x) => ({ html: x.html, failure: x.failureSummary })),
      })),
    );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const name of names) {
    check(`${name} native id`, await shape(name).getAttribute('id'), `skeleton-${name}`);
    check(`${name} native data`, await shape(name).getAttribute('data-native-root'), name);
    check(`${name} native root geometry`, await css(shape(name), 'padding'), '6px');
  }
  check(
    'main native ref',
    (await page.evaluate(() => window.skeletonAudit.snapshot())).nativeId,
    'skeleton-main',
  );
  check('default title geometry', await css(title(), 'height'), '16px');
  check('default complete content and consumers pass actual axe', await axe(), []);
  await shape('main').click();
  check(
    'one native root click',
    (await page.evaluate(() => window.skeletonAudit.snapshot())).clicks,
    1,
  );
  check('loading root owns busy', await shape('main').getAttribute('aria-busy'), 'true');
  check(
    'decorative title has a hidden owner',
    await title().evaluate((n) => Boolean(n.closest('[aria-hidden="true"]'))),
  );
  check(
    'nested avatar configuration and semantic classes combine',
    await shape('main')
      .locator('.apollo-skeleton-avatar')
      .evaluate(
        (n) => n.classList.contains('configured-avatar') && n.classList.contains('local-avatar'),
      ),
  );
  check(
    'nested avatar style is consumed',
    await css(shape('main').locator('.apollo-skeleton-avatar'), 'opacity'),
    '0.7',
  );
  const node = page.getByRole('textbox', { name: 'Skeleton node draft', exact: true });
  check(
    'Node native editor uses normal text geometry',
    await node.evaluate((n) => n.getBoundingClientRect().height <= 40),
  );
  await node.fill('Persistent native draft');
  await node.focus();
  const original = await node.elementHandle();
  const preserved = () =>
    node.evaluate(
      (n, o) => n === o && n === document.activeElement && n.value === 'Persistent native draft',
      original,
    );
  await set({ source: true, provider: true, rtl: true, round: true });
  check('current component title height', await css(title(), 'height'), '28px');
  check(
    'current paragraph height',
    await css(shape('main').locator('.apollo-skeleton-paragraph > li').first(), 'height'),
    '19px',
  );
  check(
    'current paragraph margin',
    await css(shape('main').locator('.apollo-skeleton-paragraph'), 'margin-block-start'),
    '34px',
  );
  check('current block radius', await css(title(), 'border-radius'), '100px');
  check(
    'current source gradient colors',
    await css(title(), 'background-image').then(
      (s) => s.includes('rgb(220, 232, 255)') && s.includes('rgb(140, 175, 255)'),
    ),
  );
  check(
    'current Provider class',
    await shape('main').evaluate((n) => n.classList.contains('current-skeleton-provider')),
  );
  check('current Provider style', await css(shape('main'), 'margin-bottom'), '13px');
  check('current semantic props', await css(title(), 'opacity'), '0.65');
  check('source and Provider changes retain editor, model and focus', await preserved());
  for (const name of names) check(`${name} actual RTL`, await css(shape(name), 'direction'), 'rtl');
  await set({ round: false });
  check(
    'component block radius without round override',
    await css(title(), 'border-radius'),
    '8px',
  );
  await set({ native: true });
  check('native variable overrides component height', await css(title(), 'height'), '35px');
  await set({ native: false });
  check('removing native override restores current token', await css(title(), 'height'), '28px');
  for (const [style, padding] of [
    ['padding:13px', '13px'],
    [[{ padding: '17px' }, { opacity: 0.8 }], '17px'],
    [{ padding: '19px' }, '19px'],
    [null, '0px'],
  ]) {
    await set({ style });
    check(
      `all six root styles support ${padding}`,
      await Promise.all(names.map((name) => css(shape(name), 'padding'))),
      names.map(() => padding),
    );
    check(
      `Node content style stays independent at ${padding}`,
      await css(shape('node').locator('.apollo-skeleton-node'), 'padding'),
      '12px',
    );
  }
  for (const source of [false, true, false]) {
    await set({ source, provider: source, rtl: source });
    check(`theme ${source} preserves original editor and focus`, await preserved());
    check(
      `theme ${source} restores exact title default/current`,
      await css(title(), 'height'),
      source ? '28px' : '16px',
    );
  }
  check(
    'removed Provider class clears',
    await shape('main').evaluate((n) => !n.classList.contains('current-skeleton-provider')),
  );
  await set({ motionOff: true });
  for (const name of names) {
    const target = name === 'main' ? title() : shape(name).locator(':scope > :first-child');
    check(
      `${name} source motion false pauses shimmer`,
      await css(target, 'animation-play-state'),
      'paused',
    );
  }
  await set({ motionOff: false });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const name of names) {
    const target = name === 'main' ? title() : shape(name).locator(':scope > :first-child');
    check(`${name} reduced motion stops shimmer`, await css(target, 'animation-name'), 'none');
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const image = page.getByRole('textbox', { name: 'Skeleton image draft', exact: true });
  check('Image exposes its complete public default slot', await image.count(), 1);
  if (await image.count()) {
    check(
      'Image native editor uses normal text geometry',
      await image.evaluate((n) => n.getBoundingClientRect().height <= 40),
    );
    await image.fill('Persistent image model');
  }
  await set({ imageSlot: 'empty' });
  check(
    'intentional empty Image slot suppresses fallback',
    await shape('image').locator('svg,input').count(),
    0,
  );
  await set({ imageSlot: 'absent' });
  check('absent Image slot restores original SVG', await shape('image').locator('svg').count(), 1);
  await set({ imageSlot: 'content' });
  if (await image.count())
    check(
      'restored Image slot retains caller-owned model',
      await image.inputValue(),
      'Persistent image model',
    );
  await set({ loading: false });
  check(
    'loaded branch has no placeholder root',
    await host('main').locator('.apollo-skeleton').count(),
    0,
  );
  check(
    'loaded native ref is null',
    (await page.evaluate(() => window.skeletonAudit.snapshot())).nativeId,
    null,
  );
  const loaded = page.getByRole('textbox', { name: 'Skeleton content draft', exact: true });
  await loaded.fill('Persistent loaded model');
  for (let i = 0; i < 2; i++) {
    await set({ loading: true });
    await set({ loading: false });
    check(
      `loading cycle ${i} retains caller model`,
      await loaded.inputValue(),
      'Persistent loaded model',
    );
  }
  await set({ loading: true, rows: -2 });
  check(
    'negative paragraph rows are empty',
    await shape('main').locator('.apollo-skeleton-paragraph > li').count(),
    0,
  );
  await set({ rows: 2.8 });
  check(
    'fractional paragraph rows are finite integers',
    await shape('main').locator('.apollo-skeleton-paragraph > li').count(),
    2,
  );
  await set({ rows: 3 });
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await set({ mode });
    check(`${mode} complete real content and consumers pass axe`, await axe(), []);
  }
  for (let i = 0; i < 2; i++) {
    await set({ shown: false });
    check(
      `unmount ${i} clears the public ref`,
      (await page.evaluate(() => window.skeletonAudit.snapshot())).nativeId,
      null,
    );
    await set({ shown: true });
    check(
      `remount ${i} restores the actual native root`,
      (await page.evaluate(() => window.skeletonAudit.snapshot())).nativeId,
      'skeleton-main',
    );
  }
  check('no page, console or Vue errors', errors, []);
  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.SKELETON_BROWSER_EVIDENCE ?? '/tmp/apollo-skeleton-browser.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
