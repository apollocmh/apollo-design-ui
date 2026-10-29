/** Read-only source/published browser, hydration and nine-real-Demo acceptance. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, createServer, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(process.env.COLLAPSE_REPO ?? path.join(here, '../../../../..'));
const published = process.env.COLLAPSE_MODE === 'published';
const evidence =
  process.env.COLLAPSE_BROWSER_EVIDENCE ?? '/tmp/apollo-collapse-audit-20261029/browser';
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-collapse-browser-'));
const packages = [
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
  'test-utils',
];
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
const fingerprint = () =>
  published
    ? Object.fromEntries(
        packages
          .flatMap((name) => walk(path.join(repo, 'packages', name, 'dist')))
          .sort()
          .map((file) => [path.relative(repo, file), hash(file)]),
      )
    : {};
const before = fingerprint();
const results = [],
  errors = [],
  loaded = new Set(),
  loadedDemos = new Set(),
  cssInputs = new Set();
const demos = readdirSync(path.join(repo, 'packages/ui/src/collapse/demo'))
  .filter((name) => name.endsWith('.vue'))
  .sort();
assert.equal(demos.length, 9);
const originalDemos = new Set(
  demos.map((name) => path.join(repo, 'packages/ui/src/collapse/demo', name)),
);
const alertConsumer = path.join(repo, 'packages/ui/src/alert/demo/content-slots.vue');
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (e) {
    results.push({ name, passed: false, error: e.stack });
    console.error(e.message);
    if (process.env.COLLAPSE_STOP_ON_FAIL === '1') throw e;
  }
  console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${name}`);
};
const { launchBrowser, newStablePage, stabilizePage, screenshotElement } = await import(
  path.join(repo, 'tests/visual/stabilize.mjs')
);
const { comparePair } = await import(path.join(repo, 'tests/visual/compare.mjs'));
const referenceCases = path.join(repo, 'tests/visual/render/cases/vue/collapse.js');
const references = Object.fromEntries(
  ['basic', 'accordion', 'borderless'].flatMap((variant) =>
    ['mobile', 'tablet', 'desktop'].map((viewport) => {
      const file = path.join(
        repo,
        `tests/visual/baselines/react/collapse/${variant}__light__${viewport}.png`,
      );
      return [file, hash(file)];
    }),
  ),
);
let ssr, server, browser;
mkdirSync(evidence, { recursive: true });
try {
  mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  for (const name of packages)
    symlinkSync(
      path.join(repo, 'packages', name),
      path.join(temp, 'node_modules/@apollo-design', name),
      'dir',
    );
  symlinkSync(path.join(repo, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  writeFileSync(
    path.join(temp, 'fixture.mjs'),
    readFileSync(path.join(here, 'browser-fixture.mjs')),
  );
  writeFileSync(
    path.join(temp, 'source-entry.mjs'),
    [
      'collapse',
      'config-provider',
      'color-picker',
      'select',
      'space',
      'tag',
      'switch',
      'alert',
      'button',
      'flex',
    ]
      .map((name) => `export * from '${path.join(repo, `packages/ui/src/${name}/index.ts`)}';`)
      .join('\n') +
      `export {genComponentCss} from '${path.join(repo, 'packages/ui/src/style/index.ts')}';`,
  );
  const aliases = packages.map((name) => ({
    find: new RegExp(`^@apollo-design/${name}$`),
    replacement:
      !published && name === 'ui'
        ? path.join(temp, 'source-entry.mjs')
        : path.join(repo, `packages/${name}/${published ? 'dist/index.mjs' : 'src/index.ts'}`),
  }));
  const plugin = {
    name: 'collapse-runtime-origin',
    transform(_code, id) {
      const file = id.split('?')[0];
      if (originalDemos.has(file)) {
        loadedDemos.add(file);
        return;
      }
      if (file === alertConsumer) return;
      const found = file.match(/\/packages\/[^/]+\/(src|dist)\//);
      if (found) {
        assert.equal(found[1], published ? 'dist' : 'src', `Unexpected runtime ${file}`);
        loaded.add(file);
      }
      if (file.endsWith('.css')) cssInputs.add(path.relative(repo, file));
    },
  };
  ssr = await createServer({
    root: temp,
    configFile: false,
    plugins: [vue(), plugin],
    resolve: { alias: aliases, dedupe: ['vue'] },
    ssr: { external: ['vue', 'vue/server-renderer'] },
    server: { middlewareMode: true, fs: { allow: [repo, temp] } },
    appType: 'custom',
    logLevel: 'warn',
  });
  const { createFixture } = await ssr.ssrLoadModule('/fixture.mjs');
  const context = {};
  const ssrHTML = await renderToString(createSSRApp(createFixture().component), context);
  writeFileSync(path.join(evidence, 'ssr.html'), ssrHTML);
  await ssr.close();
  ssr = undefined;
  writeFileSync(
    path.join(temp, 'demos.mjs'),
    demos
      .map(
        (name, i) =>
          `import D${i} from '${path.join(repo, 'packages/ui/src/collapse/demo', name)}';`,
      )
      .join('\n') +
      `export default {${demos.map((name, i) => `${JSON.stringify(name.slice(0, -4))}:D${i}`).join(',')}};`,
  );
  const styleScript = published
    ? "await import('@apollo-design/theme/tokens.css');await import('@apollo-design/ui/style.css');"
    : `import {genAllStyles} from '${path.join(repo, 'packages/ui/src/style/index.ts')}';import {getCSSVarDeclarations,getDesignToken} from '@apollo-design/theme';const sourceStyle=document.createElement('style');sourceStyle.dataset.collapseSourceStyles='';sourceStyle.textContent=getCSSVarDeclarations(getDesignToken())+genAllStyles();document.head.append(sourceStyle);`;
  writeFileSync(
    path.join(temp, 'entry.mjs'),
    `import {createApp,createSSRApp,h} from 'vue';import {ConfigProvider,genComponentCss} from '@apollo-design/ui';import {compactAlgorithm,darkAlgorithm} from '@apollo-design/theme';import {createFixture} from './fixture.mjs';import demos from './demos.mjs';import AlertConsumer from '${alertConsumer}';import referenceCases from '${referenceCases}';${styleScript}const custom=document.createElement('style');custom.dataset.collapseConsumerCss='';custom.textContent=genComponentCss('collapse','audit');document.head.append(custom);const p=new URLSearchParams(location.search);const name=p.get('demo');const theme=p.get('theme')||'default';if(p.has('reference')){createApp({render:()=>h('div',{id:'stage',style:{boxSizing:'border-box',width:'100%',padding:'16px',background:'#ffffff'}},[referenceCases[p.get('reference')]()])}).mount('#app');}else if(p.has('consumer')){createApp(AlertConsumer).mount('#app');}else if(name){const algorithms={default:undefined,dark:darkAlgorithm,compact:compactAlgorithm,both:[darkAlgorithm,compactAlgorithm]};createApp({render:()=>h(ConfigProvider,{theme:{algorithm:algorithms[theme]}},()=>h('main',{id:'demo',style:{padding:'16px',color:'var(--apollo-color-text)',background:'var(--apollo-color-bg-container)'}},[h('h1',name),h(demos[name])]))}).mount('#app');}else{const f=createFixture(theme);window.collapseFixture=f;(p.has('hydrate')?createSSRApp(f.component):createApp(f.component)).mount('#app');}requestAnimationFrame(()=>requestAnimationFrame(()=>window.collapseReady=true));`,
  );
  writeFileSync(
    path.join(temp, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Collapse acceptance</title></head><body style="margin:0"><div id="app">${ssrHTML}</div>${Object.values(context.teleports ?? {}).join('')}<script type="module" src="/entry.mjs"></script></body></html>`,
  );
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), plugin],
    resolve: { alias: aliases, dedupe: ['vue'] },
    build: {
      outDir: path.join(temp, 'output'),
      emptyOutDir: true,
      target: 'esnext',
      reportCompressedSize: false,
      rollupOptions: { input: path.join(temp, 'index.html') },
    },
  });
  assert.equal(loadedDemos.size, 9, 'all actual SFC demos compiled');
  if (published) {
    assert.ok(cssInputs.has('packages/ui/dist/index.css'));
    assert.ok(cssInputs.has('packages/theme/dist/tokens.css'));
  }
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'output') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  page.setDefaultTimeout(6000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  const origin = server.resolvedUrls.local[0];
  const ready = async (query = '') => {
    await page.goto(`${origin}?${query}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.collapseReady === true);
  };
  const expanded = (selector) => page.locator(selector).first().getAttribute('aria-expanded');
  const settled = (selector) =>
    page.waitForFunction((sel) => document.querySelector(sel)?.hidden === true, selector);
  await check('SSR hydration retains IDs and native disclosure relationships', async () => {
    await ready('hydrate=1');
    const actual = await page.evaluate(() =>
      [...document.querySelectorAll('.apollo-collapse-trigger')].map((button) => ({
        id: button.id,
        controls: button.getAttribute('aria-controls'),
        linked:
          document
            .getElementById(button.getAttribute('aria-controls'))
            ?.getAttribute('aria-labelledby') === button.id,
      })),
    );
    assert.equal(actual.length, 9);
    assert.ok(actual.every((item) => item.linked));
    assert.equal(new Set(actual.map((x) => x.id)).size, actual.length);
    assert.ok(ssrHTML.includes(actual[0].id));
    return actual;
  });
  await check(
    'Enter and real Space each emit once; rejected control never changes presentation',
    async () => {
      await ready();
      const button = page.locator('#controlled button').first();
      await button.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      assert.equal(await expanded('#controlled button'), 'true');
      assert.deepEqual(
        await page.evaluate(() => [
          window.collapseFixture.state.changes,
          window.collapseFixture.state.updates,
        ]),
        [2, 2],
      );
      await page.evaluate(() => (window.collapseFixture.state.accept = true));
      await page.keyboard.press('Space');
      assert.equal(await button.getAttribute('aria-expanded'), 'false');
      return await page.evaluate(() => ({
        changes: window.collapseFixture.state.changes,
        updates: window.collapseFixture.state.updates,
      }));
    },
  );
  await check('Tab order, visible focus and independent extra Enter/Space', async () => {
    await ready();
    await page.locator('#outside').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .locator('#lifetime button')
        .first()
        .evaluate((el) => el === document.activeElement),
      true,
    );
    const focus = await page
      .locator('#lifetime button')
      .first()
      .evaluate((el) => ({
        visible: el.matches(':focus-visible'),
        outline: getComputedStyle(el).outlineWidth,
      }));
    assert.ok(focus.visible);
    assert.equal(focus.outline, '2px');
    await page.locator('.extra-action').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.collapseFixture.state.actions), 2);
    assert.equal(await expanded('#custom button'), 'false');
    return focus;
  });
  await check(
    'default retention preserves native editor identity, draft and selection after full motion',
    async () => {
      await ready();
      await page.locator('[data-editor=keep]').fill('Saved draft');
      await page.locator('[data-editor=keep]').evaluate((el) => {
        window.savedEditor = el;
        el.setSelectionRange(2, 5);
      });
      await page.locator('#lifetime button').nth(0).click();
      await settled('#lifetime .apollo-collapse-panel');
      assert.equal(
        await page.locator('[data-editor=keep]').evaluate((el) => el === window.savedEditor),
        true,
      );
      await page.locator('#lifetime button').nth(0).click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-editor=keep]')
            .closest('[role=region]')
            .getBoundingClientRect().height > 30,
      );
      const actual = await page.locator('[data-editor=keep]').evaluate((el) => ({
        same: el === window.savedEditor,
        value: el.value,
        selection: [el.selectionStart, el.selectionEnd],
      }));
      assert.deepEqual(actual, { same: true, value: 'Saved draft', selection: [2, 5] });
      return actual;
    },
  );
  await check('destroy happens after close; forceRender retains body despite destroy', async () => {
    await ready();
    await page.locator('[data-editor=destroy]').evaluate((el) => (window.destroyedEditor = el));
    await page.locator('[data-editor=force]').evaluate((el) => (window.forcedEditor = el));
    await page.locator('#lifetime button').nth(1).click();
    assert.equal(await page.locator('[data-editor=destroy]').count(), 1);
    await settled('#lifetime .apollo-collapse-item:nth-child(2) .apollo-collapse-panel');
    assert.equal(await page.locator('[data-editor=destroy]').count(), 0);
    await page.locator('#lifetime button').nth(1).click();
    assert.equal(
      await page.locator('[data-editor=destroy]').evaluate((el) => el !== window.destroyedEditor),
      true,
    );
    await page.locator('#lifetime button').nth(2).click();
    await settled('#lifetime .apollo-collapse-item:nth-child(3) .apollo-collapse-panel');
    assert.equal(
      await page.locator('[data-editor=force]').evaluate((el) => el === window.forcedEditor),
      true,
    );
    return await page.evaluate(() => ({
      mounted: window.collapseFixture.state.mounted,
      unmounted: window.collapseFixture.state.unmounted,
    }));
  });
  await check(
    'closing an owned editor restores trigger focus and closed body is inert',
    async () => {
      await ready();
      await page.locator('[data-editor=keep]').focus();
      await page.evaluate(() => (window.collapseFixture.state.active = ['destroy', 'force']));
      await settled('#lifetime .apollo-collapse-panel');
      assert.equal(
        await page
          .locator('#lifetime button')
          .first()
          .evaluate((el) => el === document.activeElement),
        true,
      );
      assert.equal(
        await page
          .locator('[data-editor=keep]')
          .evaluate((el) => el.closest('[role=region]').inert),
        true,
      );
      await page.locator('#outside').focus();
      await page.evaluate(() => (window.collapseFixture.state.active = []));
      assert.equal(
        await page.locator('#outside').evaluate((el) => el === document.activeElement),
        true,
      );
    },
  );
  await check(
    'a disabled trigger closes externally without trapping focus in hidden content',
    async () => {
      await ready();
      await page.locator('[data-editor=keep]').focus();
      await page.evaluate(() => (window.collapseFixture.state.disabled = true));
      await page.waitForFunction(() => document.querySelector('#lifetime button').disabled);
      await page.evaluate(() => (window.collapseFixture.state.active = []));
      await settled('#lifetime [role=region]');
      assert.equal(
        await page.locator('#lifetime').evaluate((el) => el === document.activeElement),
        true,
      );
      assert.equal(await page.locator('#lifetime').getAttribute('tabindex'), '-1');
      await page.locator('#outside').focus();
      assert.equal(await page.locator('#lifetime').getAttribute('tabindex'), null);
    },
  );
  await check('rapid reversal completes open, clears motion styles and retains input', async () => {
    await ready();
    await page.locator('[data-editor=keep]').fill('Reverse');
    await page.locator('#lifetime button').first().click();
    await page.waitForTimeout(45);
    await page.locator('#lifetime button').first().click();
    await page.waitForFunction(() => {
      const el = document.querySelector('#lifetime [role=region]');
      return (
        el.getAttribute('aria-hidden') === 'false' &&
        !el.hidden &&
        !el.style.height &&
        !el.className.includes('-motion')
      );
    });
    assert.equal(await page.locator('[data-editor=keep]').inputValue(), 'Reverse');
  });
  await check(
    'normal motion has measured intermediate height and current prefix classes',
    async () => {
      await ready();
      const full = await page
        .locator('#lifetime [role=region]')
        .first()
        .evaluate((el) => el.getBoundingClientRect().height);
      await page.locator('#lifetime button').first().click();
      await page.waitForTimeout(90);
      const actual = await page
        .locator('#lifetime [role=region]')
        .first()
        .evaluate((el) => ({
          height: el.getBoundingClientRect().height,
          classes: el.className,
          transition: getComputedStyle(el).transitionDuration,
        }));
      assert.ok(actual.height > 0 && actual.height < full, JSON.stringify({ full, ...actual }));
      assert.ok(actual.classes.includes('apollo-collapse-motion'));
      assert.ok(actual.transition.includes('0.2s'), JSON.stringify(actual));
      await settled('#lifetime [role=region]');
      return { full, ...actual };
    },
  );
  await check(
    'disabled theme motion and reduced-motion finish without animated classes',
    async () => {
      await ready();
      await page.evaluate(() => (window.collapseFixture.state.motion = false));
      await page.locator('#lifetime button').first().click();
      await settled('#lifetime [role=region]');
      assert.ok(
        !(await page.locator('#lifetime [role=region]').first().getAttribute('class')).includes(
          '-motion',
        ),
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await ready();
      await page.locator('#lifetime button').first().click();
      await settled('#lifetime [role=region]');
      assert.ok(
        !(await page.locator('#lifetime [role=region]').first().getAttribute('class')).includes(
          '-motion',
        ),
      );
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    },
  );
  await check(
    'dynamic Provider prefix/size/direction and Panel prefix use preloaded current CSS',
    async () => {
      await ready();
      await page.evaluate(() => {
        window.rootIdentity = document.querySelector('#lifetime');
        Object.assign(window.collapseFixture.state, {
          prefix: 'audit',
          size: 'small',
          direction: 'rtl',
          customPrefix: true,
        });
      });
      await page.waitForFunction(() =>
        document.querySelector('#lifetime').classList.contains('audit-collapse-small'),
      );
      const actual = await page.locator('#lifetime').evaluate((el) => ({
        same: el === window.rootIdentity,
        padding: getComputedStyle(el.querySelector('.audit-collapse-header')).padding,
        direction: getComputedStyle(el).direction,
        button: getComputedStyle(el.querySelector('button')).display,
      }));
      assert.deepEqual(actual, {
        same: true,
        padding: '8px 12px 8px 8px',
        direction: 'rtl',
        button: 'flex',
      });
      await page.locator('#lifetime button').first().click();
      await page.waitForTimeout(45);
      assert.ok(
        (await page.locator('#lifetime [role=region]').first().getAttribute('class')).includes(
          'audit-collapse-motion',
        ),
      );
      await settled('#lifetime [role=region]');
      return actual;
    },
  );
  await check(
    'ten theme tokens affect real padding/background/radius; explicit empty TP resets',
    async () => {
      await ready();
      await page.evaluate(() => (window.collapseFixture.state.tokenOverride = true));
      await page.waitForFunction(
        () => getComputedStyle(document.querySelector('#lifetime')).borderRadius === '17px',
      );
      const actual = await page.locator('#lifetime').evaluate((el) => ({
        header: getComputedStyle(el.querySelector('.apollo-collapse-header')).padding,
        headerBg: getComputedStyle(el).backgroundColor,
        body: getComputedStyle(el.querySelector('.apollo-collapse-body')).padding,
        bodyBg: getComputedStyle(el.querySelector('.apollo-collapse-panel')).backgroundColor,
        radius: getComputedStyle(el).borderRadius,
      }));
      assert.deepEqual(actual, {
        header: '21px 22px',
        headerBg: 'rgb(1, 2, 3)',
        body: '25px 26px',
        bodyBg: 'rgb(4, 5, 6)',
        radius: '17px',
      });
      const borderless = await page
        .locator('#borderless .apollo-collapse-panel')
        .evaluate((el) => ({
          background: getComputedStyle(el).backgroundColor,
          padding: getComputedStyle(el.firstElementChild).padding,
        }));
      assert.deepEqual(borderless, { background: 'rgb(7, 8, 9)', padding: '5px 6px 7px' });
      await page.evaluate(() => (window.collapseFixture.state.size = 'small'));
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('#lifetime .apollo-collapse-header')).padding ===
          '11px 12px',
      );
      assert.equal(
        await page
          .locator('#lifetime .apollo-collapse-body')
          .first()
          .evaluate((el) => getComputedStyle(el).padding),
        '15px',
      );
      await page.evaluate(() => (window.collapseFixture.state.size = 'large'));
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('#lifetime .apollo-collapse-header')).padding ===
          '31px 32px',
      );
      assert.equal(
        await page
          .locator('#lifetime .apollo-collapse-body')
          .first()
          .evaluate((el) => getComputedStyle(el).padding),
        '35px',
      );
      assert.equal(
        await page
          .locator('#reset .apollo-collapse-header')
          .evaluate((el) => getComputedStyle(el).padding),
        '12px 16px',
      );
      return { actual, borderless };
    },
  );
  await check('empty icon-only glyph still has a named keyboard button', async () => {
    await ready();
    await page.evaluate(() => (window.collapseFixture.state.emptyIcon = true));
    const button = page.locator('#custom .apollo-collapse-trigger');
    await button.focus();
    await page.keyboard.press('Space');
    assert.equal(await button.getAttribute('aria-expanded'), 'true');
    assert.equal(await button.innerText(), '');
    assert.ok(await button.getAttribute('aria-labelledby'));
  });
  await check('unmount/remount cleans lifecycle and exposes the new root', async () => {
    await ready();
    assert.equal(
      await page.evaluate(
        () =>
          window.collapseFixture.native.value.nativeElement === document.querySelector('#lifetime'),
      ),
      true,
    );
    const previous = await page.evaluate(() => {
      window.oldRoot = document.querySelector('#lifetime');
      window.collapseFixture.state.show = false;
      return window.collapseFixture.state.unmounted;
    });
    await page.waitForFunction(
      (count) => window.collapseFixture.state.unmounted === count + 3,
      previous,
    );
    await page.evaluate(() => (window.collapseFixture.state.show = true));
    await page.waitForFunction(
      () =>
        document.querySelector('#lifetime') &&
        window.collapseFixture.native.value.nativeElement !== window.oldRoot,
    );
    assert.equal(await page.locator('[data-editor=keep]').inputValue(), 'Initial');
  });
  await check(
    'actual ColorPicker presets keep valid native title and selectable colors',
    async () => {
      await ready();
      const presets = page.locator('.apollo-color-picker-presets');
      await presets.waitFor();
      const button = presets.locator('.apollo-collapse-trigger').first();
      assert.ok(await button.count());
      assert.equal(await button.locator('div,button,input,select,textarea').count(), 0);
      assert.equal(await button.innerText(), 'Brand colors');
      const before = await button.getAttribute('aria-expanded');
      await button.focus();
      await page.keyboard.press('Space');
      assert.equal(
        await button.getAttribute('aria-expanded'),
        before === 'true' ? 'false' : 'true',
      );
      await page.keyboard.press('Enter');
      assert.equal(await button.getAttribute('aria-expanded'), before);
      assert.ok((await presets.locator('.apollo-color-picker-color-block').count()) >= 2);
      await presets.locator('.apollo-color-picker-color-block').nth(1).click();
      await page.waitForFunction(() => window.collapseFixture.state.selectedColor === '#52c41a');
      assert.equal(await presets.locator('.apollo-color-picker-presets-color-checked').count(), 1);
    },
  );
  await check(
    'a distinct Panel prefix consumes owning tokens through preloaded CSS and aliases',
    async () => {
      await ready();
      await page.evaluate(() =>
        Object.assign(window.collapseFixture.state, { customPrefix: true, tokenOverride: true }),
      );
      await page.waitForFunction(() => document.querySelector('#custom .audit-collapse-item'));
      const button = page.locator('#custom .audit-collapse-trigger');
      await button.focus();
      await page.keyboard.press('Space');
      const actual = await page.locator('#custom .audit-collapse-item').evaluate((el) => ({
        padding: getComputedStyle(el.querySelector('.audit-collapse-header')).padding,
        body: getComputedStyle(el.querySelector('.audit-collapse-body')).padding,
        background: getComputedStyle(el.querySelector('.audit-collapse-panel')).backgroundColor,
        alias: el.style.getPropertyValue('--audit-collapse-content-bg'),
      }));
      assert.deepEqual(actual, {
        padding: '21px 22px',
        body: '25px 26px',
        background: 'rgb(4, 5, 6)',
        alias: 'var(--apollo-collapse-content-bg)',
      });
      return actual;
    },
  );
  await check(
    'frozen Alert content-slots consumer preserves conditional precedence and the actual editor',
    async () => {
      await ready('consumer=alert');
      const input = page.getByRole('textbox', { name: 'Panel state' });
      await input.fill('Keep this consumer state');
      await input.evaluate((el) => (window.consumerEditor = el));
      const header = page.locator('.apollo-collapse-title');
      assert.equal(await header.innerText(), 'Template content');
      await page.getByRole('button', { name: /Toggle empty/ }).click();
      assert.equal((await page.locator('.apollo-alert').innerText()).trim(), '');
      assert.equal(await header.locator('strong').count(), 0);
      assert.equal(
        await page.getByRole('button', { name: 'Toggle panel', exact: true }).count(),
        1,
      );
      await page.getByRole('button', { name: /Toggle slots/ }).click();
      assert.equal(await header.innerText(), 'Prop header');
      await page.getByRole('button', { name: /Toggle empty/ }).click();
      await page.getByRole('button', { name: /Update content/ }).click();
      await page.getByRole('button', { name: /Toggle slots/ }).click();
      assert.equal(await header.innerText(), 'Updated content');
      const trigger = page.locator('.apollo-collapse-trigger');
      await trigger.click();
      await settled('.apollo-collapse-panel');
      await trigger.click();
      assert.equal(await input.inputValue(), 'Keep this consumer state');
      assert.equal(await input.evaluate((el) => el === window.consumerEditor), true);
    },
  );
  for (const variant of ['basic', 'accordion', 'borderless'])
    for (const viewport of [
      { id: 'mobile', width: 375, height: 667 },
      { id: 'tablet', width: 768, height: 1024 },
      { id: 'desktop', width: 1440, height: 900 },
    ])
      await check(`unchanged reference PNG ${variant}/${viewport.id}`, async () => {
        const stable = await newStablePage(browser, viewport);
        try {
          stable.page.on('pageerror', (e) => errors.push(e.message));
          stable.page.on('console', (m) => {
            if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
          });
          await stable.page.goto(`${origin}?reference=${variant}`, { waitUntil: 'networkidle' });
          await stable.page.waitForFunction(() => window.collapseReady === true);
          await stabilizePage(stable.page);
          const current = path.join(evidence, `reference-${variant}-${viewport.id}.png`);
          await screenshotElement(stable.page, '#stage', current);
          const baseline = path.join(
            repo,
            `tests/visual/baselines/react/collapse/${variant}__light__${viewport.id}.png`,
          );
          const result = await comparePair(
            baseline,
            current,
            path.join(evidence, `diff-${variant}-${viewport.id}.png`),
          );
          assert.equal(result.verdict, 'PASS', JSON.stringify(result));
          return result;
        } finally {
          await stable.context.close();
        }
      });
  for (const demo of demos.map((name) => name.slice(0, -4)))
    for (const theme of ['default', 'dark', 'compact', 'both'])
      for (const width of [375, 768, 1440])
        await check(`real Demo ${demo}/${theme}/${width}`, async () => {
          await page.setViewportSize({ width, height: 1100 });
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await ready(`demo=${demo}&theme=${theme}`);
          const roots = page.locator('#demo .apollo-collapse');
          assert.ok((await roots.count()) > 0);
          const button = roots
            .first()
            .locator('button.apollo-collapse-trigger:not(:disabled)')
            .first();
          const before = await button.getAttribute('aria-expanded');
          await button.focus();
          await page.keyboard.press('Space');
          assert.equal(
            await button.getAttribute('aria-expanded'),
            before === 'true' ? 'false' : 'true',
          );
          await page.keyboard.press('Enter');
          assert.equal(await button.getAttribute('aria-expanded'), before);
          if (demo === 'custom') {
            await page.locator('button').filter({ hasText: '发送通知' }).click();
            assert.ok((await page.locator('#demo').innerText()).includes('通知次数：1'));
            await page.locator('input[placeholder]').fill('Demo draft');
            await button.click();
            await button.click();
            assert.equal(await page.locator('input[placeholder]').inputValue(), 'Demo draft');
          }
          if (demo === 'extra') {
            await page.getByRole('button', { name: '保存', exact: true }).click();
            assert.ok((await page.locator('#demo').innerText()).includes('已保存 1 次'));
          }
          if (demo === 'component-token') {
            await page.getByRole('checkbox').check();
            assert.equal(
              await roots
                .first()
                .locator('.apollo-collapse-header')
                .first()
                .evaluate((el) => getComputedStyle(el).padding),
              '20px 24px',
            );
          }
          if (demo === 'ghost') {
            await page.getByRole('switch').click();
            assert.equal(
              await roots.first().evaluate((el) => el.classList.contains('apollo-collapse-ghost')),
              false,
            );
          }
          const geometry = await roots.evaluateAll((elements) =>
            elements.map((el) => ({
              width: el.getBoundingClientRect().width,
              overflow: el.scrollWidth - el.clientWidth,
              heading: getComputedStyle(el.querySelector('.apollo-collapse-heading')).fontSize,
              button: getComputedStyle(el.querySelector('button')).fontSize,
              background: getComputedStyle(el).backgroundColor,
              color: getComputedStyle(el).color,
            })),
          );
          assert.ok(
            geometry.every((x) => x.width > 0 && x.overflow <= 1 && x.heading === x.button),
            JSON.stringify(geometry),
          );
          await page.screenshot({
            path: path.join(evidence, `demo-${demo}-${theme}-${width}.png`),
            fullPage: true,
          });
          return geometry;
        });
  assert.deepEqual(errors, [], 'browser console/hydration errors');
} catch (e) {
  results.push({ name: 'runner completion', passed: false, error: e.stack });
} finally {
  await browser?.close();
  await server?.httpServer?.close();
  await ssr?.close();
  const after = fingerprint();
  const unchanged = JSON.stringify(before) === JSON.stringify(after);
  const referencesUnchanged = Object.entries(references).every(
    ([file, digest]) => hash(file) === digest,
  );
  const receipt = {
    mode: published ? 'published' : 'source',
    repo,
    results,
    errors,
    loadedDemos: [...loadedDemos].map((file) => ({
      file: path.relative(repo, file),
      sha256: hash(file),
    })),
    runtimeInputs: [...loaded].map((file) => path.relative(repo, file)).sort(),
    cssInputs: [...cssInputs].sort(),
    distFiles: Object.keys(before).length,
    distUnchanged: unchanged,
    references: Object.entries(references).map(([file, sha256]) => ({
      file: path.relative(repo, file),
      sha256,
    })),
    referencesUnchanged,
    passed:
      results.every((r) => r.passed) && errors.length === 0 && unchanged && referencesUnchanged,
  };
  writeFileSync(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2));
  console.log(
    JSON.stringify({
      checks: results.length,
      failed: results.filter((r) => !r.passed).length,
      errors: errors.length,
      evidence,
    }),
  );
  rmSync(temp, { recursive: true, force: true });
  if (!receipt.passed) process.exitCode = 1;
}
