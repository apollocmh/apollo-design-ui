/** Source/published Layout contracts; all fixture builds stay under tmp, never package dist. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url),
  source = process.env.LAYOUT_SOURCE === '1';
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-layout-browser-'));
const evidence = process.env.LAYOUT_EVIDENCE ?? '/tmp/apollo-layout-contracts.json';
const hashes = () =>
  Object.fromEntries(
    [
      'packages/ui/dist/index.mjs',
      'packages/ui/dist/index.css',
      'packages/ui/dist/layout/style.css',
      'packages/ui/dist/layout-sider/style.css',
    ].map((file) => [
      file,
      createHash('sha256')
        .update(readFileSync(path.join(repo, file)))
        .digest('hex'),
    ]),
  );
const before = hashes();
const alias = source
  ? [
      'ui',
      'theme',
      'utils',
      'icons',
      'motion',
      'portal',
      'position',
      'overlay',
      'a11y',
      'virtual-list',
      'form-core',
      'picker',
      'locale',
    ].map((name) => ({
      find: new RegExp('^@apollo-design/' + name + '$'),
      replacement: path.join(repo, 'packages/' + name + '/src/index.ts'),
    }))
  : [
      {
        find: /^@apollo-design\/icons$/,
        replacement: path.join(repo, 'packages/icons/dist/index.mjs'),
      },
    ];
const provenance = { runtimeSources: [], modules: [] },
  results = [],
  errors = [];
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
  console.log((results.at(-1).passed ? 'PASS ' : 'FAIL ') + name);
};
let browser, server;
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const css = source
    ? "import {genComponentStyleSheet,genAllStyles} from '" +
      path.join(repo, 'packages/ui/src/style/index.ts') +
      "';const mode=new URLSearchParams(location.search).get('css'),sheet=document.createElement('style');sheet.dataset.layoutSource='';sheet.textContent=mode==='all'?genAllStyles():(mode==='sider'?'':genComponentStyleSheet('layout'))+(mode==='layout'?'':genComponentStyleSheet('layout-sider'));document.head.append(sheet);"
    : "const mode=new URLSearchParams(location.search).get('css');if(mode==='all')await import('@apollo-design/ui/style.css');else{if(mode!=='sider')await import('@apollo-design/ui/layout/style.css');if(mode!=='layout')await import('@apollo-design/ui/layout-sider/style.css');}";
  writeFileSync(
    path.join(temp, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Layout contracts</title></head><body style="margin:0"><div id="app"></div><script type="module">import "@apollo-design/theme/tokens.css";' +
      css +
      "import {createApp} from 'vue';import Fixture from '" +
      path.join(repo, 'tests/browser/fixtures/LayoutContracts.mjs') +
      "';createApp(Fixture).mount('#app');</script></body></html>",
  );
  const guard = {
    name: 'layout-published-provenance',
    generateBundle() {
      const modules = [...this.getModuleIds()].filter((id) => id.includes('/packages/'));
      provenance.modules = modules;
      provenance.runtimeSources = modules.filter((id) => /\/packages\/[^/]+\/src\//.test(id));
      if (!source) assert.deepEqual(provenance.runtimeSources, []);
    },
  };
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), guard],
    resolve: {
      alias: [
        ...alias,
        { find: /^vue$/, replacement: require.resolve('vue/dist/vue.runtime.esm-bundler.js') },
      ],
      dedupe: ['vue'],
    },
    build: { outDir: path.join(temp, 'out'), emptyOutDir: true },
  });
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'out') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  const open = async (css = 'both') => {
    await page.goto(server.resolvedUrls.local[0] + '?css=' + css);
    await page.waitForFunction(() => Boolean(window.layoutAudit));
  };
  const set = async (patch) => {
    await page.evaluate((patch) => window.layoutAudit.set(patch), patch);
    await settled();
  };
  const settled = () =>
    page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      );
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  const paint = (selector) =>
    page.locator(selector).evaluate((node) => {
      const s = getComputedStyle(node),
        r = node.getBoundingClientRect();
      return {
        height: r.height,
        width: r.width,
        color: s.color,
        background: s.backgroundColor,
        padding: s.padding,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        direction: s.direction,
      };
    });
  await open();
  await check('native keyboard toggle, ARIA, draft identity and no form submit', async () => {
    const draft = page.getByRole('textbox', { name: 'Persistent sidebar draft' });
    await draft.fill('Persistent draft');
    const original = await draft.elementHandle();
    const trigger = page.locator('.apollo-layout-sider-trigger');
    assert.equal(await trigger.getAttribute('type'), 'button');
    await trigger.focus();
    await trigger.press('Enter');
    await settled();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await trigger.press('Space');
    await settled();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await draft.inputValue(), 'Persistent draft');
    assert.equal(await draft.evaluate((node, original) => node === original, original), true);
    assert.equal((await page.evaluate(() => window.layoutAudit.snapshot())).submits, 0);
  });
  await check('controlled rejection and acceptance retain correct current state', async () => {
    await set({ controlled: true, accept: false, collapsed: false });
    const trigger = page.locator('.apollo-layout-sider-trigger');
    await trigger.click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    await set({ accept: true });
    await trigger.click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await set({ controlled: false, collapsed: false });
  });
  await check('conditional rich/empty trigger slots and null data', async () => {
    await set({ trigger: 'Fallback', slot: 'rich' });
    assert.equal(await page.locator('.apollo-layout-sider-trigger').textContent(), 'Current slot0');
    await set({ slot: 'empty' });
    assert.equal(await page.locator('.apollo-layout-sider-trigger').textContent(), '');
    await set({ slot: 'absent', trigger: null });
    assert.equal(await page.locator('.apollo-layout-sider-trigger').count(), 0);
    await set({ trigger: undefined });
  });
  await check('zero-width body is inert and focus moves to its retained toggle', async () => {
    await set({ collapsedWidth: 0, controlled: true, collapsed: false });
    const draft = page.getByRole('textbox', { name: 'Persistent sidebar draft' });
    await draft.focus();
    await set({ collapsed: true });
    await settled();
    const trigger = page.locator('.apollo-layout-sider-zero-width-trigger');
    assert.equal(await trigger.evaluate((node) => document.activeElement === node), true);
    assert.equal(
      await page.locator('.apollo-layout-sider-children').getAttribute('aria-hidden'),
      'true',
    );
    assert.equal(
      await page.locator('.apollo-layout-sider-children').evaluate((node) => node.inert),
      true,
    );
    await trigger.press('Enter');
    await settled();
    assert.equal(await draft.inputValue(), 'Persistent draft');
    await set({ collapsedWidth: 72, controlled: false });
  });
  await check(
    'current direction and raw string/array native style preserve owned widths',
    async () => {
      await set({ rtl: true, nativeStyle: 'color: rgb(1,2,3);padding-top:3px', width: '25%' });
      await settled();
      assert.equal((await paint('#contract-layout')).direction, 'rtl');
      assert.equal((await paint('#contract-sider')).color, 'rgb(1, 2, 3)');
      assert.equal((await paint('#contract-sider')).width, 300);
      await set({
        nativeStyle: [{ color: 'rgb(4, 5, 6)' }, { paddingTop: '5px' }],
        rtl: false,
        width: 180,
      });
      assert.equal((await paint('#contract-sider')).color, 'rgb(4, 5, 6)');
      await set({ nativeStyle: {} });
    },
  );
  for (const mode of ['light', 'dark', 'compact', 'both']) {
    await check('independent Header/Footer current defaults ' + mode, async () => {
      await open('layout');
      await set({ scene: 'header', mode });
      const header = await paint('header');
      assert.equal(header.height, mode === 'compact' || mode === 'both' ? 56 : 64);
      assert.equal(header.background, 'rgb(0, 21, 41)');
      assert.equal(header.color, 'rgb(255, 255, 255)');
      await set({ scene: 'footer' });
      assert.equal(
        (await paint('footer')).padding,
        mode === 'compact' || mode === 'both' ? '21px 43.75px' : '24px 50px',
      );
    });
    await check('independent Sider and current scoped colors ' + mode, async () => {
      await open('sider');
      await set({ scene: 'sider', mode });
      const trigger = await paint('.apollo-layout-sider-trigger');
      assert.equal(trigger.height, mode === 'compact' || mode === 'both' ? 43 : 48);
      assert.equal((await paint('aside')).color, 'rgb(255, 255, 255)');
    });
  }
  const fields = {
    bodyBg: 'rgb(1, 2, 3)',
    headerBg: 'rgb(4, 5, 6)',
    headerHeight: 72,
    headerPadding: '2px 13px',
    headerColor: 'rgb(7, 8, 9)',
    footerPadding: '3px 9px',
    footerBg: 'rgb(10, 11, 12)',
    siderBg: 'rgb(13, 14, 15)',
    triggerHeight: 37,
    triggerBg: 'rgb(16, 17, 18)',
    triggerColor: 'rgb(19, 20, 21)',
    zeroTriggerWidth: 43,
    zeroTriggerHeight: 45,
    lightSiderBg: 'rgb(22, 23, 24)',
    lightTriggerBg: 'rgb(25, 26, 27)',
    lightTriggerColor: 'rgb(28, 29, 30)',
  };
  await open();
  await set({ themeFields: fields });
  await settled();
  await check('all modern theme fields reach actual geometry and paint', async () => {
    const layout = await paint('#contract-layout'),
      header = await paint('header'),
      footer = await paint('footer'),
      sider = await paint('aside'),
      trigger = await paint('.apollo-layout-sider-trigger');
    assert.equal(layout.background, fields.bodyBg);
    assert.equal(header.background, fields.headerBg);
    assert.equal(header.height, 72);
    assert.equal(header.padding, '2px 13px');
    assert.equal(header.color, fields.headerColor);
    assert.equal(footer.padding, '3px 9px');
    assert.equal(footer.background, fields.footerBg);
    assert.equal(sider.background, fields.siderBg);
    assert.equal(trigger.height, 37);
    assert.equal(trigger.background, fields.triggerBg);
    assert.equal(trigger.color, fields.triggerColor);
    await set({ theme: 'light' });
    assert.equal((await paint('aside')).background, fields.lightSiderBg);
    assert.equal((await paint('.apollo-layout-sider-trigger')).background, fields.lightTriggerBg);
    assert.equal((await paint('.apollo-layout-sider-trigger')).color, fields.lightTriggerColor);
    await set({ collapsedWidth: 0 });
    const zero = await paint('.apollo-layout-sider-zero-width-trigger');
    assert.equal(zero.width, 43);
    assert.equal(zero.height, 45);
  });
  await check('deprecated fields remain real fallbacks and modern fields win', async () => {
    await set({
      theme: 'dark',
      collapsedWidth: 72,
      themeFields: {
        colorBgBody: 'rgb(31, 32, 33)',
        colorBgHeader: 'rgb(34, 35, 36)',
        colorBgTrigger: 'rgb(37, 38, 39)',
      },
    });
    assert.equal((await paint('#contract-layout')).background, 'rgb(31, 32, 33)');
    assert.equal((await paint('header')).background, 'rgb(34, 35, 36)');
    assert.equal((await paint('.apollo-layout-sider-trigger')).background, 'rgb(37, 38, 39)');
    await set({ themeFields: { colorBgHeader: 'red', headerBg: 'rgb(40, 41, 42)' } });
    assert.equal((await paint('header')).background, 'rgb(40, 41, 42)');
  });
  await check('zero lengths, legal CSS lengths and dynamic removal remain effective', async () => {
    await set({
      themeFields: {
        headerHeight: 0,
        headerPadding: '0',
        triggerHeight: '2rem',
        zeroTriggerWidth: 0,
        zeroTriggerHeight: 0,
      },
    });
    assert.equal((await paint('header')).height, 0);
    assert.equal((await paint('.apollo-layout-sider-trigger')).height, 32);
    await set({ themeFields: {} });
    assert.equal((await paint('header')).height, 64);
  });
  await check(
    'native variables inherit through nested Layout/Sider without default resets',
    async () => {
      await set({ scene: 'nested', themeFields: {}, nativeStyle: {} });
      assert.equal((await paint('aside')).background, 'rgb(80, 0, 80)');
    },
  );
  await check('nested theme scopes use their own current Alias fallback', async () => {
    await set({ scene: 'nested-theme', mode: 'both', themeFields: {} });
    assert.equal((await paint('#inner-header')).height, 64);
  });
  await open();
  for (const [breakpoint, max] of [
    ['xs', 479],
    ['sm', 575],
    ['md', 767],
    ['lg', 991],
    ['xl', 1199],
    ['xxl', 1599],
    ['xxxl', 1839],
  ])
    await check('actual responsive media ' + breakpoint, async () => {
      await page.setViewportSize({ width: max + 100, height: 850 });
      await set({ breakpoint, controlled: false });
      await page.setViewportSize({ width: max, height: 850 });
      await page.waitForFunction(() =>
        document.querySelector('aside').classList.contains('apollo-layout-sider-below'),
      );
      await page.setViewportSize({ width: max + 100, height: 850 });
      await page.waitForFunction(
        () => !document.querySelector('aside').classList.contains('apollo-layout-sider-below'),
      );
      await set({ breakpoint: undefined });
    });
  await page.setViewportSize({ width: 1200, height: 850 });
  await check('CSS-expression zero width keeps a usable toggle and hidden body', async () => {
    try {
      await set({
        collapsedWidth: 'var(--closed-sidebar)',
        nativeStyle: { '--closed-sidebar': '0px' },
        controlled: true,
        collapsed: true,
      });
      assert.equal((await paint('aside')).width, 0);
      assert.equal(
        await page.locator('.apollo-layout-sider-children').evaluate((node) => node.inert),
        true,
      );
      assert.equal(await page.locator('.apollo-layout-sider-zero-width-trigger').count(), 1);
      await set({ nativeStyle: { '--closed-sidebar': '44px' } });
      assert.equal(
        await page.locator('.apollo-layout-sider-children').evaluate((node) => node.inert),
        false,
      );
    } finally {
      await set({ collapsedWidth: 72, controlled: false, width: 180, nativeStyle: {} });
    }
  });
  await check('descendants inherit parent Layout native Alias overrides', async () => {
    try {
      await open();
      await set({ rootStyle: { '--apollo-font-size': '18px' } });
      for (const selector of ['header', 'main', 'aside'])
        assert.equal((await paint(selector)).fontSize, '18px');
    } finally {
      await open();
    }
  });
  await check('ConfigProvider without a theme preserves CSS-only Alias values', async () => {
    try {
      await set({ scene: 'css-only-provider' });
      for (const selector of ['header', 'main', 'aside'])
        assert.equal((await paint(selector)).fontSize, '18px');
      assert.equal((await paint('header')).height, 73);
    } finally {
      await open();
    }
  });
  await check(
    'empty ThemeProvider through unconfigured ConfigProvider resets a distant theme',
    async () => {
      try {
        await set({ scene: 'empty-theme-provider' });
        const header = await paint('#empty-theme-header');
        assert.equal(header.fontSize, '14px');
        assert.equal(header.height, 64);
        assert.equal(header.background, 'rgb(0, 21, 41)');
      } finally {
        await open();
      }
    },
  );
  await check('zero-width corners and light borders follow RTL and reverseArrow', async () => {
    try {
      await open('sider');
      for (const rtl of [false, true])
        for (const reverseArrow of [false, true]) {
          await set({
            scene: 'sider',
            collapsedWidth: 0,
            controlled: true,
            collapsed: true,
            rtl,
            reverseArrow,
            theme: 'light',
          });
          const actual = await page
            .locator('.apollo-layout-sider-zero-width-trigger')
            .evaluate((node) => {
              const style = getComputedStyle(node);
              return {
                left: style.borderTopLeftRadius,
                right: style.borderTopRightRadius,
                start: style.borderInlineStartWidth,
                end: style.borderInlineEndWidth,
              };
            });
          const right = rtl === reverseArrow;
          assert.equal(actual.left, right ? '0px' : '8px');
          assert.equal(actual.right, right ? '8px' : '0px');
          assert.equal(actual.start, reverseArrow ? '1px' : '0px');
          assert.equal(actual.end, reverseArrow ? '0px' : '1px');
        }
    } finally {
      await open();
    }
  });
  for (const mode of ['light', 'dark', 'compact', 'both'])
    await check('own Layout+Sider CSS matches aggregate geometry and paint ' + mode, async () => {
      const capture = async () => {
        const values = {};
        for (const selector of [
          '#contract-layout',
          'aside',
          'header',
          'main',
          'footer',
          '.apollo-layout-sider-trigger',
        ])
          values[selector] = await paint(selector);
        return values;
      };
      await open();
      await set({ mode });
      const own = await capture();
      await open('all');
      await set({ mode });
      assert.deepEqual(await capture(), own);
      return own;
    });
  await open();
  await check('real axe including button names and default text contrast', async () => {
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () =>
      (await window.axe.run('#contract-layout')).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
    assert.deepEqual(violations, []);
    return violations;
  });
  assert.deepEqual(hashes(), before, 'No package artifact mutation');
  writeFileSync(
    evidence,
    JSON.stringify(
      {
        source,
        browser: browser.version(),
        results,
        errors,
        provenance,
        before,
        after: hashes(),
        distUnchanged: true,
        readersExited: false,
      },
      null,
      2,
    ) + '\n',
  );
  if (errors.length || results.some((r) => !r.passed)) process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
  rmSync(temp, { recursive: true, force: true });
  try {
    const report = JSON.parse(readFileSync(evidence, 'utf8'));
    report.readersExited = true;
    writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n');
  } catch {}
}
