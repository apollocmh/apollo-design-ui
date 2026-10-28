/** Grid source or frozen published JS+CSS contracts. Never writes package dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, createServer, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-grid-browser-'));
const source = process.env.GRID_SOURCE === '1';
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
      find: new RegExp(`^@apollo-design/${name}$`),
      replacement: path.join(repo, `packages/${name}/src/index.ts`),
    }))
  : [];
const results = [],
  errors = [];
const check = async (name, run) => {
  try {
    const actual = await run();
    results.push({ name, passed: true, actual });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
  console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${name}`);
};
const near = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 1, `${message}: ${actual} vs ${expected}`);
let browser, server, ssr;
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const config = {
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    ssr: { external: ['vue', 'vue/server-renderer'] },
  };
  ssr = await createServer({ ...config, server: { middlewareMode: true }, appType: 'custom' });
  const fixture = path.join(repo, 'tests/browser/fixtures/GridContracts.vue');
  const { default: Fixture } = await ssr.ssrLoadModule(fixture);
  const html = await renderToString(createSSRApp(Fixture));
  await ssr.close();
  ssr = undefined;
  assert.ok(html.includes('Original draft') && html.includes('data-grid-main'));
  const styleEntry = source
    ? `import {genComponentStyleSheet} from '${path.join(repo, 'packages/ui/src/style/index.ts')}'; const sheet=document.createElement('style');sheet.dataset.gridSourceStyles='';sheet.textContent=genComponentStyleSheet('grid');document.head.append(sheet);`
    : `import '@apollo-design/ui/grid/style.css';`;
  writeFileSync(
    path.join(temp, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Grid contracts</title></head><body style="margin:0"><div id="app">${html}</div><script type="module">import '@apollo-design/theme/tokens.css'; ${styleEntry} import {createSSRApp} from 'vue';import Fixture from '${fixture}';createSSRApp(Fixture).mount('#app');</script></body></html>`,
  );
  const clientConfig = {
    ...config,
    plugins: [vue()],
    resolve: {
      alias: [
        ...alias,
        {
          find: /^vue$/,
          replacement: createRequire(import.meta.url).resolve(
            'vue/dist/vue.runtime.esm-bundler.js',
          ),
        },
      ],
      dedupe: ['vue'],
    },
  };
  await build({
    ...clientConfig,
    build: { outDir: path.join(temp, 'out'), emptyOutDir: true, minify: false },
  });
  server = await preview({
    ...config,
    build: { outDir: path.join(temp, 'out') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      message.text().includes('[Vue warn]') ||
      message.text().includes('Hydration')
    )
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page
    .waitForFunction(() => Boolean(window.gridAudit))
    .catch((error) => {
      for (const message of errors) {
        const location = message.match(/assets\/([^:]+):(\d+):(\d+)/);
        if (location)
          console.log(
            readFileSync(path.join(temp, 'out/assets', location[1]), 'utf8')
              .split('\n')
              .slice(Number(location[2]) - 3, Number(location[2]) + 2)
              .join('\n'),
          );
      }
      throw new Error(`Grid fixture did not mount: ${JSON.stringify(errors)}; ${error.message}`);
    });
  assert.equal(await page.locator('style[data-grid-source-styles]').count(), source ? 1 : 0);
  const main = page.locator('[data-grid-main]'),
    col = page.locator('[data-grid-a]'),
    draft = page.getByRole('textbox', { name: 'Persistent grid draft' });
  const set = async (patch) => {
    await page.evaluate((patch) => window.gridAudit.set(patch), patch);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  };
  const css = (node, prop) => node.evaluate((node, prop) => getComputedStyle(node)[prop], prop);
  const measure = () =>
    page.evaluate(() => {
      const row = document.querySelector('[data-grid-main]'),
        col = document.querySelector('[data-grid-a]');
      const a = document.querySelector('[data-grid-content="a"]'),
        b = document.querySelector('[data-grid-content="b"]');
      return {
        row: row.getBoundingClientRect().width,
        col: col.getBoundingClientRect().width,
        gap: b.getBoundingClientRect().left - a.getBoundingClientRect().right,
      };
    });
  const original = await draft.elementHandle();
  await draft.fill('Preserved grid draft');
  await draft.focus();
  await draft.evaluate((node) => node.setSelectionRange(2, 7));
  const retained = async () =>
    assert.equal(
      await draft.evaluate(
        (node, original) =>
          node === original &&
          node.value === 'Preserved grid draft' &&
          node === document.activeElement &&
          node.selectionStart === 2 &&
          node.selectionEnd === 7,
        original,
      ),
      true,
    );
  await check('SSR hydration, complete content and actual native refs', async () => {
    assert.equal(await main.locator('strong').textContent(), 'Complete');
    assert.ok((await main.textContent()).includes(' content0'));
    assert.deepEqual(await page.evaluate(() => window.gridAudit.snapshot()), {
      row: true,
      col: true,
      clicks: 0,
      rowClicks: 0,
    });
    assert.deepEqual(errors, []);
  });
  for (const [gutter, horizontal, vertical] of [
    [[0, 0], 0, 0],
    [[10.5, 7.5], 10.5, 7.5],
    [['2rem', '1rem'], 32, 16],
    [
      [
        { xs: 4, lg: 20 },
        { xs: 3, lg: 9 },
      ],
      20,
      9,
    ],
  ]) {
    await check(`gutter ${JSON.stringify(gutter)} actual two-axis geometry`, async () => {
      await set({ gutter, col: { span: 12 } });
      const geometry = await measure();
      near(geometry.col, geometry.row / 2, 'half column');
      near(geometry.gap, horizontal, 'content gutter');
      assert.equal(await css(main, 'rowGap'), `${vertical}px`);
      await retained();
      return geometry;
    });
  }
  await check(
    'gutter removal clears owner geometry without affecting nested/independent rows',
    async () => {
      await page.evaluate(() => window.gridAudit.set({ gutter: undefined }));
      assert.equal(await css(col, 'paddingInlineStart'), '0px');
      assert.equal(await css(page.locator('[data-grid-inner-col]'), 'paddingInlineStart'), '2px');
      assert.equal(await css(page.locator('[data-grid-outer-col]'), 'paddingInlineStart'), '12px');
      assert.equal(
        await css(page.locator('[data-grid-independent-col]'), 'paddingInlineStart'),
        '5px',
      );
      await retained();
    },
  );
  for (const [style, width] of [
    ['width: 611px', '611px'],
    [['width: 621px', { paddingBlock: '4px' }], '621px'],
    [{ width: '631px' }, '631px'],
  ]) {
    await check(`native style ${width} replacement`, async () => {
      await set({
        rowStyle: style,
        colStyle: style,
        id: `grid-${width}`,
        rootClass: `class-${width}`,
      });
      assert.equal(await css(main, 'width'), width);
      assert.equal(await col.evaluate((node) => node.style.width), width);
      assert.equal(await main.getAttribute('id'), `grid-${width}`);
      await retained();
    });
  }
  await check(
    'attrs-only removal and native style priority over current Provider defaults',
    async () => {
      await page.evaluate(() =>
        window.gridAudit.set({
          rowStyle: undefined,
          colStyle: undefined,
          id: undefined,
          rootClass: undefined,
        }),
      );
      assert.equal(await main.getAttribute('id'), null);
      assert.equal((await main.getAttribute('class')).includes('class-'), false);
      await set({
        provider: true,
        rowStyle: ['padding-block: 9px', { height: '120px' }],
        colStyle: 'padding-block: 11px',
      });
      assert.ok((await main.getAttribute('class')).includes('provider-row'));
      assert.ok((await col.getAttribute('class')).includes('provider-col'));
      assert.equal(await css(main, 'paddingBlockStart'), '9px');
      assert.equal(await css(col, 'paddingBlockStart'), '11px');
      await retained();
      await set({ provider: false });
      assert.equal((await main.getAttribute('class')).includes('provider-row'), false);
      await page.evaluate(() => window.gridAudit.set({ rowStyle: undefined, colStyle: undefined }));
      assert.equal(await css(main, 'paddingBlockStart'), '0px');
      assert.equal(await css(col, 'paddingBlockStart'), '0px');
    },
  );
  await set({
    gutter: [
      { xs: 0, sm: 8, md: 10.5, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
      { xs: 0, sm: 3, md: 7.5, lg: 12, xl: 16, xxl: 20, xxxl: 24 },
    ],
    col: { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 3, xxxl: 2 },
    justify: { xs: 'start', sm: 'center', md: 'space-between' },
    align: { xs: 'top', md: 'middle' },
  });
  for (const [width, span] of [
    [400, 24],
    [575, 24],
    [576, 12],
    [767, 12],
    [768, 8],
    [991, 8],
    [992, 6],
    [1199, 6],
    [1200, 4],
    [1599, 4],
    [1600, 3],
    [1919, 3],
    [1920, 2],
  ]) {
    await check(`viewport ${width}px resolves actual responsive column/Row/hook`, async () => {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction((width) => {
        const s = JSON.parse(document.querySelector('[data-screens]').textContent);
        return (
          s.xs === width <= 575 &&
          s.sm === width >= 576 &&
          s.md === width >= 768 &&
          s.lg === width >= 992 &&
          s.xl === width >= 1200 &&
          s.xxl === width >= 1600 &&
          s.xxxl === width >= 1920
        );
      }, width);
      const geometry = await measure();
      near(geometry.col, (geometry.row * span) / 24, 'responsive span');
      const h =
        width >= 1920
          ? 32
          : width >= 1600
            ? 24
            : width >= 1200
              ? 20
              : width >= 992
                ? 16
                : width >= 768
                  ? 10.5
                  : width >= 576
                    ? 8
                    : 0;
      const v =
        width >= 1920
          ? 24
          : width >= 1600
            ? 20
            : width >= 1200
              ? 16
              : width >= 992
                ? 12
                : width >= 768
                  ? 7.5
                  : width >= 576
                    ? 3
                    : 0;
      assert.equal(await css(col, 'paddingInlineStart'), `${h / 2}px`);
      assert.equal(await css(main, 'rowGap'), `${v}px`);
      assert.equal(
        await css(main, 'justifyContent'),
        width >= 768 ? 'space-between' : width >= 576 ? 'center' : 'flex-start',
      );
      assert.equal(
        await css(main, 'alignItems'),
        width >= 768 ? 'center' : width >= 576 ? 'normal' : 'flex-start',
      );
      await retained();
      return geometry;
    });
  }
  await page.setViewportSize({ width: 1000, height: 900 });
  await check('all six main-axis alignments consume actual free space', async () => {
    await page.evaluate(() => window.gridAudit.set({ align: undefined }));
    for (const [justify, offset] of [
      ['start', 0],
      ['center', 1 / 6],
      ['end', 1 / 3],
      ['space-between', 0],
      ['space-around', 1 / 24],
      ['space-evenly', 1 / 15],
    ]) {
      await set({ justify, col: { span: 4 }, gutter: 0 });
      const rowBox = await main.boundingBox(),
        colBox = await col.boundingBox();
      near(colBox.x - rowBox.x, rowBox.width * offset, justify);
      await retained();
    }
    await page.evaluate(() => window.gridAudit.set({ justify: undefined }));
  });
  await check('top/middle/bottom resolve actual cross-axis geometry', async () => {
    for (const [align, offset] of [
      ['top', 0],
      ['middle', 55],
      ['bottom', 110],
    ]) {
      await set({
        align,
        rowStyle: 'height: 200px',
        colStyle: 'height: 90px',
        col: { span: 6 },
        gutter: 0,
      });
      const rowBox = await main.boundingBox(),
        colBox = await col.boundingBox();
      near(colBox.y - rowBox.y, offset, align);
      await retained();
    }
    await page.evaluate(() =>
      window.gridAudit.set({ align: undefined, rowStyle: undefined, colStyle: undefined }),
    );
  });
  await check('base logical offsets/push/pull and visual order work in LTR/RTL', async () => {
    for (const rtl of [false, true]) {
      for (const shift of ['push', 'pull']) {
        await set({ rtl, col: { span: 6, offset: 6, [shift]: 2 }, gutter: 0 });
        const rowBox = await main.boundingBox(),
          colBox = await col.boundingBox();
        const distance = rtl
          ? rowBox.x + rowBox.width - colBox.x - colBox.width
          : colBox.x - rowBox.x;
        near(distance, (rowBox.width * (shift === 'push' ? 8 : 4)) / 24, `${rtl}/${shift}`);
        await retained();
      }
      await set({ col: { span: 6, order: 3 }, sibling: { span: 6, order: 0 } });
      const a = await col.boundingBox(),
        b = await page.locator('[data-grid-col="b"]').boundingBox();
      assert.equal(rtl ? a.x < b.x : a.x > b.x, true);
      await retained();
    }
    await page.evaluate(() => window.gridAudit.set({ rtl: false, sibling: undefined }));
  });
  await check('all responsive Col fields and explicit zero resets', async () => {
    await set({
      col: {
        xs: { span: 12, offset: 6, order: 2, push: 2, pull: 1 },
        md: { span: 6, offset: 0, order: 0, push: 0, pull: 0 },
      },
    });
    assert.equal(await css(col, 'order'), '0');
    assert.equal(await css(col, 'marginInlineStart'), '0px');
    assert.equal(await css(col, 'insetInlineStart'), '0px');
    assert.equal(await css(col, 'insetInlineEnd'), '0px');
    await set({ col: { xs: 0, md: 12 } });
    assert.notEqual(await css(col, 'display'), 'none');
    await set({ col: { span: 0 } });
    assert.equal(await css(col, 'display'), 'none');
    await set({ col: { span: 6 } });
    assert.notEqual(await css(col, 'display'), 'none');
    assert.equal(
      await draft.evaluate(
        (node, original) => node === original && node.value === 'Preserved grid draft',
        original,
      ),
      true,
    );
    await draft.focus();
    await draft.evaluate((node) => node.setSelectionRange(2, 7));
    await retained();
  });
  for (const [flex, expected] of [
    [0, '0'],
    [1.5, '1.5'],
    ['auto', '1'],
    ['120px', '0'],
  ]) {
    await check(`base flex ${flex} and nowrap shrink`, async () => {
      await set({ col: { flex }, wrap: false });
      assert.equal(await css(col, 'flexGrow'), expected);
      assert.equal(await css(col, 'minWidth'), '0px');
      if (flex === '120px') assert.equal(await css(col, 'flexBasis'), '120px');
      assert.equal(await css(main, 'flexWrap'), 'nowrap');
      await retained();
    });
  }
  await check('responsive flex and wrap removal clear stale variables/min-width', async () => {
    await set({ col: { xs: { flex: '50%' }, md: { flex: '25%' } }, wrap: false });
    assert.equal(await css(col, 'flexBasis'), '25%');
    assert.equal(await css(col, 'minWidth'), '0px');
    await set({ col: { span: 6 }, wrap: true });
    assert.equal(await col.evaluate((n) => n.style.getPropertyValue('--apollo-col-md-flex')), '');
    assert.equal(await css(col, 'minWidth'), 'auto');
    assert.equal(await css(main, 'flexWrap'), 'wrap');
    await retained();
  });
  await check('align stretch consumes its explicit rule and real cross-axis height', async () => {
    await set({ align: 'stretch', rowStyle: 'height: 120px', col: { span: 6 }, gutter: 0 });
    assert.equal(await css(main, 'alignItems'), 'stretch');
    near((await col.boundingBox()).height, 120, 'stretch column');
    await retained();
    await page.evaluate(() =>
      window.gridAudit.set({ rowStyle: undefined, align: undefined, justify: undefined }),
    );
  });
  await check('current RTL, explicit native direction and independent LTR geometry', async () => {
    await set({ rtl: true, col: { span: 6 }, rich: false });
    assert.equal(await css(main, 'direction'), 'rtl');
    assert.equal(await css(col, 'direction'), 'rtl');
    const a = await col.boundingBox(),
      b = await page.locator('[data-grid-col="b"]').boundingBox();
    assert.ok(a.x > b.x);
    assert.equal(await css(page.locator('[data-grid-independent]'), 'direction'), 'ltr');
    await retained();
    await set({ dir: 'ltr' });
    assert.equal(await css(main, 'direction'), 'ltr');
    await page.evaluate(() => window.gridAudit.set({ dir: undefined, rtl: false, rich: true }));
    await retained();
  });
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const mode of ['light', 'dark', 'compact', 'both']) {
    await check(
      `${mode} theme keeps identity/focus, fits and has zero axe violations`,
      async () => {
        await set({ mode, gutter: [16, 12], col: { span: 12 } });
        await retained();
        assert.deepEqual(
          await page.locator('main').evaluate(async (node) =>
            (await window.axe.run(node)).violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.failureSummary),
            })),
          ),
          [],
        );
        assert.equal(
          await page.locator('main').evaluate((n) => n.scrollWidth <= n.clientWidth),
          true,
        );
      },
    );
  }
  await check('current global font tokens and native events fire once', async () => {
    await set({ font: true, mode: 'light' });
    assert.equal(await css(main, 'fontSize'), '19px');
    assert.equal(await css(col, 'fontFamily'), 'monospace');
    await retained();
    await main.getByRole('button', { name: 'Grid action' }).click();
    assert.deepEqual(await page.evaluate(() => window.gridAudit.snapshot()), {
      row: true,
      col: true,
      clicks: 1,
      rowClicks: 1,
    });
  });
  await check('unmount/remount is isolated and starts fresh native content', async () => {
    await set({ present: false });
    assert.equal(await main.count(), 0);
    assert.equal(await page.locator('[data-grid-independent]').count(), 1);
    await set({ present: true });
    assert.equal(await draft.inputValue(), 'Original draft');
    assert.equal(await draft.evaluate((node, original) => node === original, original), false);
  });
  await check('zero browser/runtime/hydration errors', async () => assert.deepEqual(errors, []));
  writeFileSync(
    process.env.GRID_BROWSER_EVIDENCE ?? '/tmp/apollo-grid-browser.json',
    `${JSON.stringify({ mode: source ? 'source JS + source generated Grid CSS' : 'published JS + published Grid CSS', browser: browser.version(), ssrHydration: true, results, errors }, null, 2)}\n`,
  );
  console.log(`Grid browser ${results.filter((r) => r.passed).length}/${results.length}`);
  assert.ok(results.every((result) => result.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  await ssr?.close();
  rmSync(temp, { recursive: true, force: true });
}
