import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { genComponentCss } from '@apollo-design/ui';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-empty-contracts-'));
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
    resolve: {
      alias: {
        '@apollo-design/locale': path.resolve(root, '../../../packages/locale/dist/index.mjs'),
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'empty-contract-audit.html') },
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
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}empty-contract-audit.html`);
  await page.waitForFunction(() => Boolean(window.emptyAudit));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const set = (options) => page.evaluate((options) => window.emptyAudit.set(options), options);
  const snapshot = () => page.evaluate(() => window.emptyAudit.snapshot());
  const host = page.locator('#empty-audit');
  const css = async (selector, property) => {
    const node = host.locator(selector);
    return (await node.count())
      ? node.first().evaluate((n, p) => getComputedStyle(n).getPropertyValue(p).trim(), property)
      : null;
  };
  check('published native root', (await snapshot()).nativeTag, 'DIV');
  check('published installation name', (await snapshot()).name, 'AEmpty');
  check(
    'both public static identities',
    (await snapshot()).defaultIdentity && (await snapshot()).simpleIdentity,
  );
  const native = await host.elementHandle();
  for (const config of ['first', 'second', 'none']) {
    await set({ config, props: { image: undefined } });
    check(
      `current Provider class ${config}`,
      await host.evaluate(
        (n, c) =>
          c === 'none' ? !n.className.includes('global-') : n.classList.contains(`global-${c}`),
        config,
      ),
    );
    check(
      `current Provider style ${config}`,
      await host.evaluate((n) => n.style.marginInline),
      config === 'first' ? '13px' : config === 'second' ? '17px' : '',
    );
    check(`Provider preserves native root ${config}`, await native.evaluate((n) => n.isConnected));
  }
  for (const nativeStyle of [
    'padding-inline:11px',
    [{ paddingInline: '17px' }],
    { paddingInline: '19px' },
    undefined,
  ]) {
    await set({ nativeStyle });
    check(
      `native style ${JSON.stringify(nativeStyle)}`,
      await host.evaluate((n) => n.style.paddingInline),
      typeof nativeStyle === 'string'
        ? '11px'
        : Array.isArray(nativeStyle)
          ? '17px'
          : nativeStyle
            ? '19px'
            : '',
    );
  }
  await set({ props: {}, image: 'zero' });
  check('numeric image zero renders', await host.locator('.apollo-empty-image').textContent(), '0');
  await set({ image: 'hidden' });
  check(
    'explicit hidden image has no empty container',
    await host.locator('.apollo-empty-image').count(),
    0,
  );
  await set({ image: 'array' });
  check(
    'complete image array survives',
    await host.locator('.apollo-empty-image').textContent(),
    'Array imageTail0',
  );
  await set({ image: 'proxy' });
  check(
    'reactive component definitions render actual business artwork',
    await host.locator('svg').getAttribute('aria-label'),
    'Business diagram',
  );
  await set({ image: 'default', locale: 'zh' });
  check(
    'current default illustration language',
    await host.locator('svg title').textContent(),
    '暂无数据',
  );
  await set({ rtl: true });
  check(
    'actual Provider direction',
    await host.evaluate((n) => getComputedStyle(n).direction),
    'rtl',
  );
  await set({ nativeDir: 'ltr' });
  check(
    'native direction override',
    await host.evaluate((n) => getComputedStyle(n).direction),
    'ltr',
  );
  await set({ rtl: false, nativeDir: undefined, locale: 'en', image: 'wide' });
  await host.locator('img').evaluate(async (n) => {
    if (!n.complete)
      await new Promise((resolve) => {
        n.onload = resolve;
        n.onerror = resolve;
      });
  });
  check(
    'wide URL image fits narrow viewport',
    await page.locator('main').evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
  );
  await set({ image: 'default', imageSlot: 'full', footerSlot: 'full', descriptionSlot: 'full' });
  check('complete native image content', (await host.textContent()).includes('Image tail0'));
  check(
    'complete native description content',
    (await host.textContent()).includes('Description tail0'),
  );
  check('complete native footer content', (await host.textContent()).includes('Footer tail0'));
  const draft = host.getByRole('textbox', { name: 'image draft' });
  if (await draft.count()) {
    await draft.fill('Saved image draft');
    await draft.focus();
    const original = await draft.elementHandle();
    const mounts = (await snapshot()).mounts;
    await set({ config: 'second', image: 'simple', description: 0 });
    check(
      'slot state survives data/Provider updates',
      await draft.inputValue(),
      'Saved image draft',
    );
    check(
      'slot root and focus remain',
      await original.evaluate((n) => n.isConnected && document.activeElement === n),
    );
    check('slot widgets are not remounted', (await snapshot()).mounts, mounts);
    const layout = await host.locator('.apollo-empty-image').evaluate((n) => ({
      hostBottom: n.getBoundingClientRect().bottom,
      contentBottom: Math.max(
        ...Array.from(n.children).map((c) => c.getBoundingClientRect().bottom),
      ),
    }));
    check(
      'complete image content stays within its host',
      layout.contentBottom <= layout.hostBottom + 1,
    );
  } else {
    check('slot state survives data/Provider updates', false);
    check('slot root and focus remain', false);
    check('slot widgets are not remounted', false);
    check('complete image content stays within its host', false);
  }
  await set({ imageSlot: 'empty', descriptionSlot: 'empty', footerSlot: 'empty' });
  check(
    'intentional empty slots suppress all defaults and spacing hosts',
    await host
      .locator('.apollo-empty-image,.apollo-empty-description,.apollo-empty-footer')
      .count(),
    0,
  );
  await set({
    imageSlot: 'absent',
    descriptionSlot: 'absent',
    footerSlot: 'absent',
    config: 'none',
    description: undefined,
    image: 'default',
  });
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const mode of ['light', 'dark', 'compact', 'both']) {
    await set({ mode });
    const violations = await page.locator('main').evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((x) => x.failureSummary),
      })),
    );
    check(`${mode} actual default contrast/axe`, violations, []);
    check(
      `${mode} illustration remains bounded`,
      await css('.apollo-empty-image', 'height'),
      mode === 'compact' || mode === 'both' ? '87.5px' : '100px',
    );
  }
  await set({
    mode: 'light',
    image: 'default',
    footerSlot: 'full',
    aliases: {
      controlHeightLG: 52,
      marginXS: 11,
      fontSize: 18,
      lineHeight: 2,
      opacityImage: 0.55,
      colorTextSecondary: '#435266',
      margin: 23,
      marginXL: 37,
    },
  });
  check('current media height alias', await css('.apollo-empty-image', 'height'), '130px');
  check('current image opacity alias', await css('.apollo-empty-image', 'opacity'), '0.55');
  check('current image spacing alias', await css('.apollo-empty-image', 'margin-bottom'), '11px');
  check(
    'current description color alias',
    await css('.apollo-empty-description', 'color'),
    'rgb(67, 82, 102)',
  );
  check('current footer spacing alias', await css('.apollo-empty-footer', 'margin-top'), '23px');
  const aliases = await host.evaluate((n) => {
    const s = getComputedStyle(n);
    return [s.marginInlineStart, s.fontSize, s.lineHeight];
  });
  check('current root spacing/font/line aliases', aliases, ['11px', '18px', '36px']);
  await set({ image: 'simple' });
  check('current simple media height alias', await css('.apollo-empty-image', 'height'), '52px');
  check(
    'current simple margin alias',
    await host.evaluate((n) => getComputedStyle(n).marginBlockStart),
    '37px',
  );
  await set({ aliases: undefined, image: 'default', footerSlot: 'absent' });
  check(
    'alias removal restores default geometry',
    await css('.apollo-empty-image', 'height'),
    '100px',
  );
  for (const prefix of ['audit', 'replacement']) {
    await page.addStyleTag({ content: genComponentCss('empty', prefix) });
    await set({ props: { prefixCls: `${prefix}-empty` }, image: 'simple' });
    check(
      `current full prefix with actual published CSS generator ${prefix}`,
      await host.evaluate(
        (n, prefix) =>
          n.classList.contains(`${prefix}-empty-normal`) &&
          getComputedStyle(n.querySelector(`.${prefix}-empty-image`)).height === '40px',
        prefix,
      ),
    );
  }
  check(
    'prefix replacement keeps the exposed native root',
    await native.evaluate((n) => n.isConnected),
  );
  await set({ props: {}, image: 'default' });
  check(
    'prefix removal restores current Provider default',
    await host.evaluate(
      (n) => n.classList.contains('apollo-empty') && !n.className.includes('replacement-empty'),
    ),
  );
  check('no page or Vue errors', errors, []);
  writeFileSync(
    process.env.EMPTY_BROWSER_EVIDENCE ?? '/tmp/apollo-empty-browser.json',
    `${JSON.stringify({ browser: browser.version(), results, errors }, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
