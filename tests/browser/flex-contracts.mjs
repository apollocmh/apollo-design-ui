/** Flex source or frozen published JS+CSS contracts, SSR hydration and all six real demos. No package builds. */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, createServer, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  temp = mkdtempSync(path.join(tmpdir(), 'apollo-flex-contracts-'));
const evidence = process.env.FLEX_EVIDENCE ?? '/tmp/apollo-flex-browser.json';
const source = process.env.FLEX_SOURCE === '1',
  results = [],
  errors = [],
  external = [];
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
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
  console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${name}`);
};
const near = (a, b, label) => assert.ok(Math.abs(a - b) < 0.1, `${label}: ${a} vs ${b}`);
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
  const fixture = path.join(repo, 'tests/browser/fixtures/FlexContracts.mjs'),
    demos = path.join(repo, 'tests/browser/fixtures/FlexDemos.mjs');
  ssr = await createServer({ ...config, server: { middlewareMode: true }, appType: 'custom' });
  const { default: Fixture } = await ssr.ssrLoadModule(fixture);
  const html = await renderToString(createSSRApp(Fixture));
  await ssr.close();
  ssr = undefined;
  assert.ok(html.includes('Complete') && html.includes(' text 0'));
  const style = source
    ? `import {genFlexStyle} from '${path.join(repo, 'packages/ui/src/flex/style/index.ts')}';import {getCSSVarDeclarations,getDesignToken} from '@apollo-design/theme';const sheet=document.createElement('style');sheet.dataset.flexSourceStyles='';sheet.textContent=getCSSVarDeclarations(getDesignToken())+genFlexStyle('apollo');document.head.append(sheet);`
    : `import '@apollo-design/theme/tokens.css';import '@apollo-design/ui/flex/style.css';`;
  for (const [name, file, body, hydrate] of [
    ['contracts', fixture, html, true],
    ['demos', demos, '', false],
  ])
    writeFileSync(
      path.join(temp, `${name}.html`),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Flex ${name}</title></head><body style="margin:0"><div id="app">${body}</div><script type="module">${style}import {${hydrate ? 'createSSRApp' : 'createApp'}} from 'vue';import Fixture from '${file}';${hydrate ? 'createSSRApp' : 'createApp'}(Fixture).mount('#app');</script></body></html>`,
    );
  const client = {
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
    build: {
      outDir: path.join(temp, 'out'),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          contracts: path.join(temp, 'contracts.html'),
          demos: path.join(temp, 'demos.html'),
        },
      },
    },
  };
  await build(client);
  server = await preview({ ...client, preview: { host: '127.0.0.1', port: 0 } });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  page.setDefaultTimeout(5000);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
    external.push(route.request().url());
    return route.abort();
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]') || m.text().includes('Hydration'))
      errors.push(m.text());
  });
  const origin = server.resolvedUrls.local[0];
  await page.goto(`${origin}contracts.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.flexAudit));
  assert.equal(await page.locator('style[data-flex-source-styles]').count(), source ? 1 : 0);
  const main = page.locator('[data-flex-main]'),
    geometry = page.locator('[data-flex-geometry]'),
    draft = page.getByRole('textbox', { name: 'Persistent Flex draft', exact: true });
  const set = async (patch) => {
    await page.evaluate((patch) => window.flexAudit.set(patch), patch);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  };
  const css = (node, key) => node.evaluate((n, k) => getComputedStyle(n)[k], key);
  await draft.fill('Preserved native draft');
  await draft.focus();
  await draft.evaluate((n) => n.setSelectionRange(2, 7));
  const original = await draft.elementHandle();
  const retained = async () =>
    assert.equal(
      await draft.evaluate(
        (n, o) =>
          n === o &&
          n === document.activeElement &&
          n.value === 'Preserved native draft' &&
          n.selectionStart === 2 &&
          n.selectionEnd === 7,
        original,
      ),
      true,
    );
  await check('SSR hydrates complete content and exposes only its actual native host', async () => {
    assert.ok((await main.textContent()).includes('Complete text 0'));
    assert.equal((await page.evaluate(() => window.flexAudit.snapshot())).ref, true);
    assert.deepEqual(errors, []);
  });
  await check('current Provider replacement and removal preserve native draft/focus', async () => {
    await set({
      config: { className: 'current-provider', vertical: true, style: { padding: '9px' } },
      rtl: true,
    });
    assert.ok((await main.getAttribute('class')).includes('current-provider'));
    assert.equal(await css(main, 'flexDirection'), 'column');
    assert.equal(await css(main, 'direction'), 'rtl');
    assert.equal(await css(main, 'padding'), '9px');
    await retained();
    await set({ config: {}, rtl: false });
    assert.equal((await main.getAttribute('class')).includes('current-provider'), false);
    assert.equal(await css(main, 'flexDirection'), 'row');
    assert.equal(await css(main, 'padding'), '0px');
    await retained();
  });
  await check(
    'native attrs and listeners update/remove once with original native events',
    async () => {
      await set({
        native: {
          id: 'after',
          class: ['after-native'],
          style: ['width:360px;height:140px', { padding: '4px' }],
          'aria-label': 'Updated layout',
        },
        listener: 'second',
      });
      assert.equal(await main.getAttribute('id'), 'after');
      assert.equal(await main.getAttribute('aria-label'), 'Updated layout');
      assert.equal(await css(main, 'padding'), '4px');
      await main.click({ position: { x: 350, y: 130 } });
      let snapshot = await page.evaluate(() => window.flexAudit.snapshot());
      assert.deepEqual(snapshot.calls, { first: 0, second: 1, keydowns: 0, nativeEvents: true });
      await set({ native: { style: 'width:360px;height:140px' }, listener: 'none' });
      assert.equal(await main.getAttribute('id'), null);
      assert.equal(await main.getAttribute('aria-label'), null);
      assert.equal((await main.getAttribute('class')).includes('after-native'), false);
      await main.click({ position: { x: 350, y: 130 } });
      snapshot = await page.evaluate(() => window.flexAudit.snapshot());
      assert.equal(snapshot.calls.second, 1);
    },
  );
  await check(
    'native dir overrides Provider and its removal restores current Provider',
    async () => {
      await set({ rtl: true, native: { dir: 'ltr', style: 'width:360px;height:140px' } });
      assert.equal(await css(main, 'direction'), 'ltr');
      await set({ native: { style: 'width:360px;height:140px' } });
      assert.equal(await css(main, 'direction'), 'rtl');
      await set({ rtl: false });
    },
  );
  await check(
    'default row starts at top while vertical and explicit stretch consume cross-axis space',
    async () => {
      await set({ props: {} });
      assert.equal(await css(geometry, 'alignItems'), 'flex-start');
      near(
        (await geometry.locator('[data-flex-box="a"]').boundingBox()).height,
        20,
        'row natural short child',
      );
      await set({ props: { align: 'stretch' } });
      assert.equal(await css(geometry, 'alignItems'), 'stretch');
      near(
        (await geometry.locator('[data-flex-box="a"]').boundingBox()).height,
        140,
        'explicit row stretch',
      );
      await set({ props: { vertical: true } });
      assert.equal(await css(geometry, 'alignItems'), 'stretch');
      near(
        (await geometry.locator('[data-flex-box="a"]').boundingBox()).width,
        40,
        'explicit child width retained',
      );
    },
  );
  for (const align of [
    'center',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'self-start',
    'self-end',
    'baseline',
    'normal',
    'stretch',
  ])
    await check(`align=${align} reaches real computed layout`, async () => {
      await set({ props: { align } });
      assert.equal(await css(geometry, 'alignItems'), align);
    });
  for (const justify of [
    'flex-start',
    'flex-end',
    'start',
    'end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
    'stretch',
    'normal',
    'left',
    'right',
  ])
    await check(`justify=${justify} reaches real computed layout`, async () => {
      await set({ props: { justify } });
      assert.equal(await css(geometry, 'justifyContent'), justify);
    });
  await check('wrap/nowrap/reverse affect actual line geometry', async () => {
    await set({
      props: { wrap: true, gap: 10 },
      probeWidth: 60,
      native: { style: 'width:360px;height:140px' },
    });
    assert.ok(
      (await geometry.locator('[data-flex-box="b"]').boundingBox()).y >
        (await geometry.locator('[data-flex-box="a"]').boundingBox()).y,
    );
    await set({ props: { wrap: 'wrap-reverse', gap: 10 } });
    assert.ok(
      (await geometry.locator('[data-flex-box="b"]').boundingBox()).y <
        (await geometry.locator('[data-flex-box="a"]').boundingBox()).y,
    );
    await set({ props: { wrap: false } });
    assert.equal(await css(geometry, 'flexWrap'), 'nowrap');
    await set({ probeWidth: 300 });
  });
  for (const [gap, expected] of [
    [0, '0px'],
    [10.5, '10.5px'],
    ['2rem', '32px'],
    ['small', '8px'],
    ['middle', '16px'],
    ['medium', '16px'],
    ['large', '24px'],
  ])
    await check(`gap=${gap} consumes actual CSS length`, async () => {
      await set({ props: { gap } });
      assert.equal(await css(geometry, 'columnGap'), expected);
    });
  await check('unitless flex values allocate real free space and update', async () => {
    await set({ weight: 1 });
    near(
      (await page.locator('[data-flex-weight]').boundingBox()).width,
      100,
      'one of three shares',
    );
    await set({ weight: 2 });
    near((await page.locator('[data-flex-weight]').boundingBox()).width, 150, 'one of two shares');
    await set({ weight: 0 });
    assert.equal(await css(page.locator('[data-flex-weight]'), 'flexGrow'), '0');
    assert.ok((await page.locator('[data-flex-weight]').boundingBox()).width < 100);
    await set({ weight: '0 0 80px' });
    near((await page.locator('[data-flex-weight]').boundingBox()).width, 80, 'explicit basis');
  });
  for (const theme of ['light', 'dark', 'compact', 'both'])
    await check(
      `${theme}: current ThemeProvider controls all preset gaps without global injection`,
      async () => {
        await set({ theme, custom: true });
        assert.deepEqual(
          await page
            .locator('[data-flex-gap]')
            .evaluateAll((ns) => ns.map((n) => getComputedStyle(n).gap)),
          ['19px', '23px', '23px', '29px'],
        );
        assert.equal(
          await page.evaluate(() =>
            document.documentElement.style.getPropertyValue('--apollo-padding-xs'),
          ),
          '',
        );
      },
    );
  await check('nested default theme resets only its own gap scope', async () => {
    assert.equal(
      await page.locator('[data-flex-theme-outer]').evaluate((n) => getComputedStyle(n).gap),
      '19px',
    );
    assert.equal(
      await page.locator('[data-flex-theme-inner]').evaluate((n) => getComputedStyle(n).gap),
      '8px',
    );
  });
  await check(
    'Vue custom root exposes its actual section and forwards complete content/attrs',
    async () => {
      await set({
        component: 'custom',
        props: {},
        native: { id: 'custom-root', style: 'width:360px;height:140px' },
      });
      assert.equal(await main.evaluate((n) => n.tagName), 'SECTION');
      assert.equal((await page.evaluate(() => window.flexAudit.snapshot())).ref, true);
      assert.ok((await main.textContent()).includes('Complete text 0'));
    },
  );
  await check('empty native hosts remain visible and keyboard-operable', async () => {
    await set({
      component: 'button',
      content: false,
      native: { 'aria-label': 'Create task', type: 'button', style: 'width:160px;height:40px' },
      listener: 'second',
    });
    assert.equal(await main.isVisible(), true);
    assert.equal((await page.evaluate(() => window.flexAudit.snapshot())).ref, true);
    const before = (await page.evaluate(() => window.flexAudit.snapshot())).calls.second;
    await main.focus();
    await page.keyboard.press('Enter');
    assert.equal((await page.evaluate(() => window.flexAudit.snapshot())).calls.second, before + 1);
  });
  await check(
    'conditional default content and unmount/remount retain correct ref ownership',
    async () => {
      await set({ component: 'div', content: true, native: { style: 'width:360px;height:140px' } });
      assert.ok(await draft.count());
      await page.evaluate(() => window.flexAudit.unmount());
      assert.equal((await page.evaluate(() => window.flexAudit.snapshot())).previousCleared, true);
      await set({ mounted: true });
      assert.equal((await page.evaluate(() => window.flexAudit.snapshot())).ref, true);
      assert.ok(await draft.count());
    },
  );
  await check('independent explicit orientation remains isolated', async () => {
    assert.equal(await css(page.locator('#flex-independent'), 'flexDirection'), 'column');
  });
  await page.goto(`${origin}demos.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.flexDemoAudit));
  assert.equal(await page.locator('[data-flex-demo]').count(), 6);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const mode of ['light', 'dark', 'compact', 'both'])
    for (const width of [400, 800, 1200])
      await check(`all six real demos ${mode}/${width}: layout, labels and paint`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate((m) => window.flexDemoAudit.theme(m), mode);
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
        assert.deepEqual(
          await page
            .locator('[data-flex-demo]')
            .evaluateAll((ns) =>
              ns.filter((n) => n.scrollWidth > n.clientWidth + 1).map((n) => n.dataset.flexDemo),
            ),
          [],
        );
        assert.deepEqual(
          await page.locator('main').evaluate(async (n) =>
            (await window.axe.run(n)).violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
          ),
          [],
        );
        assert.deepEqual(external, []);
        return { demos: 6, mode, width };
      });
  await page.setViewportSize({ width: 1200, height: 900 });
  await check('basic native radio keyboard changes direction', async () => {
    const demo = page.locator('[data-flex-demo="basic"]');
    await demo.getByRole('radio', { name: 'horizontal', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(
      await demo.getByRole('radio', { name: 'vertical', exact: true }).isChecked(),
      true,
    );
    assert.equal(await css(demo.locator('.apollo-flex').last(), 'flexDirection'), 'column');
  });
  await check(
    'conditional gap range has its own label and native keyboard updates real gap',
    async () => {
      const demo = page.locator('[data-flex-demo="gap"]');
      await demo.getByRole('radio', { name: 'customize', exact: true }).check();
      const range = demo.getByRole('slider', { name: 'Custom gap', exact: true });
      await range.focus();
      await page.keyboard.press('Home');
      assert.equal(await css(demo.locator('.apollo-flex').last(), 'gap'), '0px');
      await page.keyboard.press('ArrowRight');
      assert.equal(await css(demo.locator('.apollo-flex').last(), 'gap'), '1px');
      assert.deepEqual(
        await demo.evaluate(async (n) => (await window.axe.run(n)).violations.map((v) => v.id)),
        [],
      );
    },
  );
  await check('align native selects update actual two-axis alignment', async () => {
    const demo = page.locator('[data-flex-demo="align"]');
    await demo.getByRole('combobox', { name: 'Select justify' }).selectOption('space-between');
    await demo.getByRole('combobox', { name: 'Select align' }).selectOption('center');
    const target = demo.locator('.apollo-flex').last();
    assert.equal(await css(target, 'justifyContent'), 'space-between');
    assert.equal(await css(target, 'alignItems'), 'center');
  });
  const report = {
    source,
    scope: 'Flex full current contract source verification',
    browser: browser.version(),
    results,
    errors,
    externalRequests: external,
    hydration: true,
    demos: 6,
    demoThemeWidthObservations: 72,
    sourceCssInjection: source,
    packageBuilds: false,
    baselineProducedOrAccepted: false,
    readersExited: false,
  };
  writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await ssr?.close();
  if (server)
    await new Promise((resolve, reject) =>
      server.httpServer.close((e) => (e ? reject(e) : resolve())),
    );
  if (existsSync(evidence)) {
    const report = JSON.parse(readFileSync(evidence));
    report.readersExited = true;
    writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  }
  rmSync(temp, { recursive: true, force: true });
  console.log('All Flex browser/server readers exited');
}
