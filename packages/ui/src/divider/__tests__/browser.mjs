/** Source/current-browser contracts and real Demos; published mode reads frozen exports/CSS. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = realpathSync(process.env.DIVIDER_REPO ?? path.resolve(here, '../../../../..'));
const published = process.env.DIVIDER_MODE === 'published';
const temp = realpathSync(mkdtempSync(path.join(tmpdir(), 'apollo-divider-browser-')));
const evidence = process.env.DIVIDER_BROWSER_EVIDENCE ?? '/tmp/apollo-divider-browser.json';
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
const { launchBrowser } = await import(path.join(repo, 'tests/visual/stabilize.mjs'));
const results = [],
  errors = [],
  loaded = new Set(),
  demoHashes = {};
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
  console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${name}`);
};
let server, browser, page, ssrHtml;
try {
  mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  for (const name of packages)
    symlinkSync(
      path.join(repo, 'packages', name),
      path.join(temp, 'node_modules/@apollo-design', name),
      'dir',
    );
  symlinkSync(path.join(repo, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  copyFileSync(path.join(here, 'browser-fixture.mjs'), path.join(temp, 'fixture.mjs'));
  copyFileSync(path.join(here, 'hydration-fixture.mjs'), path.join(temp, 'hydration-fixture.mjs'));
  writeFileSync(
    path.join(temp, 'source-entry.mjs'),
    `export * from '${path.join(repo, 'packages/ui/src/divider/index.ts')}';export {ConfigProvider} from '${path.join(repo, 'packages/ui/src/config-provider/index.ts')}';`,
  );
  const demoDir = path.join(repo, 'packages/ui/src/divider/demo');
  const demos = readdirSync(demoDir)
    .filter((file) => file.endsWith('.vue'))
    .sort();
  assert.equal(demos.length, 9);
  for (const file of demos) {
    const source = path.join(demoDir, file);
    demoHashes[file] = hash(source);
    writeFileSync(
      path.join(temp, file),
      readFileSync(source, 'utf8').replaceAll("from '../../index'", "from '@apollo-design/ui'"),
    );
  }
  writeFileSync(
    path.join(temp, 'demos.mjs'),
    demos.map((f, i) => `import D${i} from './${f}';`).join('') +
      `export default {${demos.map((f, i) => `${JSON.stringify(f.slice(0, -4))}:D${i}`).join(',')}};`,
  );
  const styles = published
    ? "import '@apollo-design/theme/tokens.css';import '@apollo-design/ui/divider/style.css';"
    : `import {getCSSVarDeclarations,getDesignToken} from '@apollo-design/theme';import {genComponentStyleSheet} from '${path.join(repo, 'packages/ui/src/style/index.ts')}';const s=document.createElement('style');s.dataset.dividerSourceStyles='';s.textContent=getCSSVarDeclarations(getDesignToken())+genComponentStyleSheet('divider');document.head.append(s);`;
  writeFileSync(
    path.join(temp, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Divider contracts</title></head><body><div id="app"></div><script type="module">${styles}import {genDividerStyle} from '@apollo-design/ui/divider';const custom=document.createElement('style');custom.dataset.dividerConsumerCss='';custom.textContent=genDividerStyle('custom');document.head.append(custom);import {createApp} from 'vue';import Fixture from './fixture.mjs';createApp(Fixture).mount('#app');</script></body></html>`,
  );
  const alias = [
    {
      find: /^@apollo-design\/ui\/divider$/,
      replacement: path.join(
        repo,
        'packages/ui',
        published ? 'dist/divider/index.mjs' : 'src/divider/index.ts',
      ),
    },
    ...packages.map((name) => ({
      find: new RegExp(`^@apollo-design/${name}$`),
      replacement:
        !published && name === 'ui'
          ? path.join(temp, 'source-entry.mjs')
          : path.join(repo, `packages/${name}/${published ? 'dist/index.mjs' : 'src/index.ts'}`),
    })),
  ];
  server = await createServer({
    root: temp,
    configFile: false,
    cacheDir: path.join(temp, 'cache'),
    logLevel: 'warn',
    plugins: [
      vue(),
      {
        name: 'divider-input-origin',
        transform(_code, id) {
          const m = id.match(/\/packages\/[^/]+\/(src|dist)\//);
          if (m) {
            assert.equal(
              m[1],
              published ? 'dist' : 'src',
              `Unexpected ${m[1]} runtime input ${id}`,
            );
            const file = realpathSync(id.split('?')[0]);
            assert.ok(file.startsWith(`${repo}/packages/`), `Foreign runtime ${file}`);
            loaded.add(file);
          }
        },
      },
    ],
    resolve: { alias, dedupe: ['vue'] },
    ssr: { external: ['vue', 'vue/server-renderer'] },
    // The published UI barrel also imports CommonJS dependencies such as dayjs.
    // Let Vite discover those dependencies in the real consumer graph.
    optimizeDeps: { noDiscovery: !published, include: ['vue'] },
    server: {
      host: '127.0.0.1',
      port: 0,
      fs: { allow: [repo, temp] },
      watch: { ignored: () => true },
    },
  });
  await server.listen();
  ({ browser } = await launchBrowser());
  page = await browser.newPage({ viewport: { width: 800, height: 1000 } });
  page.setDefaultTimeout(7000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  const origin = server.resolvedUrls.local[0];
  const ready = async (url) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.dividerAudit?.ready);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    assert.equal(await page.locator('[data-divider-source-styles]').count(), published ? 0 : 1);
  };
  await ready(origin);
  const set = async (patch) => {
    await page.evaluate((p) => window.dividerAudit.set(p), patch);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  };
  const live = page.locator('[data-divider-live]'),
    draft = page.getByRole('textbox', { name: 'Divider live draft', exact: true });
  await draft.fill('Retained native draft');
  await draft.focus();
  await draft.evaluate((n) => n.setSelectionRange(2, 7));
  const original = await draft.elementHandle(),
    root = await live.elementHandle();
  const retained = async () => {
    assert.equal(
      await draft.evaluate(
        (n, old) =>
          n === old &&
          n.isConnected &&
          n === document.activeElement &&
          n.value === 'Retained native draft' &&
          n.selectionStart === 2 &&
          n.selectionEnd === 7,
        original,
      ),
      true,
    );
    assert.equal(await live.evaluate((n, old) => n === old, root), true);
  };
  await check('complete Vue title/ref/native style and accessible controls', async () => {
    assert.ok((await live.textContent()).includes('Complete text 0fragment tail'));
    assert.equal(await live.getAttribute('role'), 'group');
    assert.equal(await live.locator('[role=separator]').count(), 1);
    assert.equal(await live.evaluate((n) => getComputedStyle(n).padding), '7px');
    assert.equal((await page.evaluate(() => window.dividerAudit.snapshot())).ref, true);
  });
  await check(
    'current Provider replacement/clear preserves identity and applies current classes/semantics',
    async () => {
      await set({
        config: {
          className: 'provider-second',
          style: { padding: '11px' },
          classNames: { content: 'second-content' },
          styles: { rail: { opacity: 0.5 } },
        },
        direction: 'rtl',
      });
      assert.ok((await live.getAttribute('class')).includes('provider-second'));
      assert.ok((await live.getAttribute('class')).includes('with-text-end'));
      assert.equal(await live.evaluate((n) => getComputedStyle(n).direction), 'rtl');
      assert.ok(
        (await live.locator('.apollo-divider-inner-text').getAttribute('class')).includes(
          'second-content',
        ),
      );
      await retained();
      await set({ config: {}, direction: 'ltr' });
      assert.equal((await live.getAttribute('class')).includes('provider-second'), false);
      assert.equal(
        (await live.locator('.apollo-divider-inner-text').getAttribute('class')).includes(
          'second-content',
        ),
        false,
      );
      await retained();
    },
  );
  await check(
    'local props, global size and explicit native attrs/listeners update on the same root',
    async () => {
      await live.dispatchEvent('click');
      await set({
        listener: 1,
        size: 'medium',
        props: { titlePlacement: 'end', plain: true, variant: 'dotted' },
        attrs: {
          id: 'changed-divider',
          class: ['native-second'],
          style: ['padding:9px', { '--apollo-divider-text-padding-inline': '13px' }],
        },
      });
      assert.equal(await live.getAttribute('id'), 'changed-divider');
      assert.ok((await live.getAttribute('class')).includes('native-second'));
      assert.ok((await live.getAttribute('class')).includes('divider-md'));
      assert.equal(await live.evaluate((n) => getComputedStyle(n).padding), '9px');
      assert.equal(
        await live
          .locator('.apollo-divider-inner-text')
          .evaluate((n) => getComputedStyle(n).paddingInlineStart),
        '13px',
      );
      await live.dispatchEvent('click');
      assert.deepEqual((await page.evaluate(() => window.dividerAudit.snapshot())).calls, [
        'first',
        'second',
      ]);
      await retained();
    },
  );
  await check(
    'conditional title insertion/removal repeats without replacing the native host',
    async () => {
      for (const value of [false, true, false, true]) {
        await set({ slot: value });
        assert.equal(await live.locator('.apollo-divider-inner-text').count(), value ? 1 : 0);
        assert.equal(await live.getAttribute('role'), value ? 'group' : 'separator');
        assert.equal(await live.evaluate((n, old) => n === old, root), true);
      }
    },
  );
  await check(
    'vertical axis and local prefix use actual CSS and remove stale namespace values',
    async () => {
      await set({
        props: { orientation: 'vertical', prefixCls: 'custom-divider' },
        slot: false,
        attrs: { id: 'changed-divider', style: { height: '50px' } },
      });
      assert.equal(await live.getAttribute('aria-orientation'), 'vertical');
      assert.equal(await live.evaluate((n) => getComputedStyle(n).height), '50px');
      assert.equal(
        await live.evaluate((n) =>
          n.style.getPropertyValue('--apollo-divider-text-padding-inline'),
        ),
        '',
      );
      assert.ok(
        await live.evaluate((n) =>
          n.style.getPropertyValue('--custom-divider-text-padding-inline'),
        ),
      );
      await set({ props: { orientation: 'horizontal' }, slot: true });
      assert.equal(await live.getAttribute('aria-orientation'), null);
      assert.equal(
        await live.evaluate((n) =>
          n.style.getPropertyValue('--custom-divider-text-padding-inline'),
        ),
        '',
      );
    },
  );
  const tokenMetrics = async () =>
    page.locator('#data-title').evaluate((n) => {
      const a = n.querySelector('.apollo-divider-rail-start').getBoundingClientRect(),
        b = n.querySelector('.apollo-divider-rail-end').getBoundingClientRect();
      return {
        padding: getComputedStyle(n.querySelector('.apollo-divider-inner-text')).paddingInlineStart,
        ratio: Math.round((a.width / (a.width + b.width)) * 1000) / 1000,
        margin: getComputedStyle(document.querySelector('#data-vertical')).marginInlineStart,
      };
    });
  await check('all three component tokens reach actual geometry', async () => {
    assert.deepEqual(await tokenMetrics(), { padding: '31px', ratio: 0.25, margin: '37px' });
  });
  await check(
    'already-mounted theme resets, inactive data and empty reactivation reach actual geometry',
    async () => {
      await page.evaluate(() =>
        window.dividerAudit.source({
          config: {
            components: {
              Divider: { textPaddingInline: 0, orientationMargin: 0, verticalMarginInline: 0 },
            },
          },
          active: true,
        }),
      );
      assert.deepEqual(await tokenMetrics(), { padding: '0px', ratio: 0, margin: '0px' });
      await page.evaluate(() =>
        window.dividerAudit.source({
          config: {
            components: {
              Divider: {
                textPaddingInline: -1,
                orientationMargin: 1.1,
                verticalMarginInline: Number.NaN,
              },
            },
          },
          active: true,
        }),
      );
      assert.deepEqual(await tokenMetrics(), { padding: '16px', ratio: 0.05, margin: '8px' });
      await page.evaluate(() => window.dividerAudit.source({ config: {}, active: true }));
      assert.deepEqual(await tokenMetrics(), { padding: '16px', ratio: 0.05, margin: '8px' });
      await page.evaluate(() =>
        window.dividerAudit.source({
          config: {
            components: {
              Divider: { textPaddingInline: 31, orientationMargin: 0.25, verticalMarginInline: 37 },
            },
          },
          active: false,
        }),
      );
      assert.deepEqual(await tokenMetrics(), { padding: '16px', ratio: 0.05, margin: '8px' });
      await page.evaluate(() => window.dividerAudit.source({ config: {}, active: true }));
      assert.deepEqual(await tokenMetrics(), { padding: '16px', ratio: 0.05, margin: '8px' });
    },
  );
  const scenes = await page.locator('[data-divider-scene]').evaluateAll((nodes) =>
    Object.fromEntries(
      nodes
        .filter((n) => n.querySelector(':scope > [data-kind]'))
        .map((n) => [
          n.dataset.dividerScene,
          Object.fromEntries(
            [...n.querySelectorAll(':scope > [data-kind]')].map((root) => {
              const s = getComputedStyle(root),
                rail = root.querySelector('.apollo-divider-rail-start') ?? root,
                rs = getComputedStyle(rail);
              return [
                root.dataset.kind,
                {
                  fontSize: s.fontSize,
                  fontFamily: s.fontFamily,
                  lineHeight: s.lineHeight,
                  color: s.color,
                  marginTop: s.marginTop,
                  marginBottom: s.marginBottom,
                  marginInlineStart: s.marginInlineStart,
                  borderWidth: rs.borderBlockStartWidth,
                  borderColor: rs.borderBlockStartColor,
                  borderStyle: rs.borderBlockStartStyle,
                },
              ];
            }),
          ),
        ]),
    ),
  );
  for (const [name, reference] of [
    ['css-no-theme-cp', 'css-only'],
    ['css-empty-tp', 'explicit-default'],
    ['compact-empty-tp', 'explicit-default'],
    ['compact-empty-tp-cp', 'explicit-default'],
    ['compact-empty-cp', 'compact'],
    ['inherit-false', 'explicit-default'],
    ['custom-no-metadata', 'explicit-default'],
  ])
    for (const kind of ['rail', 'title', 'plain', 'vertical'])
      await check(`${name}/${kind} actual computed paint equals ${reference}`, async () =>
        assert.deepEqual(scenes[name][kind], scenes[reference][kind]),
      );
  await check('ThemeProvider without CSS injection changes actual font/margin/line', async () => {
    assert.equal(scenes['theme-no-injection'].vertical.fontSize, '22px');
    assert.equal(scenes['theme-no-injection'].vertical.marginInlineStart, '31px');
    assert.equal(scenes['theme-no-injection'].rail.borderWidth, '3px');
  });
  await check('dark source changes the actual foreground and stroke', async () => {
    assert.notEqual(scenes.dark.title.color, scenes.bare.title.color);
    assert.notEqual(scenes.dark.rail.borderColor, scenes.bare.rail.borderColor);
  });
  await check('combined dark/compact source keeps dark paint and compact typography', async () => {
    assert.equal(scenes['dark-compact'].title.color, scenes.dark.title.color);
    assert.equal(scenes['dark-compact'].plain.fontSize, scenes.compact.plain.fontSize);
  });
  await check(
    'default fallback activation/reset updates bare roots without changing explicit scopes',
    async () => {
      await page.evaluate(() => window.dividerAudit.fallback({ token: { marginXS: 31 } }));
      assert.equal(
        await page
          .locator('[data-divider-scene=bare] [data-kind=vertical]')
          .evaluate((n) => getComputedStyle(n).marginInlineStart),
        '31px',
      );
      assert.equal(
        await page
          .locator('[data-divider-scene=explicit-default] [data-kind=vertical]')
          .evaluate((n) => getComputedStyle(n).marginInlineStart),
        '8px',
      );
      await page.evaluate(() => window.dividerAudit.fallback({}));
    },
  );
  await check('initial RTL actually places the physical left title to the left', async () => {
    const value = await page.locator('[data-divider-scene=rtl] .apollo-divider').evaluate((n) => {
      const r = n.getBoundingClientRect(),
        t = n.querySelector('.apollo-divider-inner-text').getBoundingClientRect();
      return {
        direction: getComputedStyle(n).direction,
        left: t.x + t.width / 2 < r.x + r.width / 2,
      };
    });
    assert.deepEqual(value, { direction: 'rtl', left: true });
  });
  await check('dotted wins over dashed for both actual root and title rails', async () =>
    assert.deepEqual(
      await page
        .locator('[data-divider-scene=mixed] > .apollo-divider')
        .evaluateAll((nodes) =>
          nodes.map(
            (n) =>
              getComputedStyle(n.querySelector('.apollo-divider-rail-start') ?? n)
                .borderBlockStartStyle,
          ),
        ),
      ['dotted', 'dotted'],
    ),
  );
  const { default: Hydration } = await server.ssrLoadModule(
    path.join(temp, 'hydration-fixture.mjs'),
  );
  assert.equal(typeof window, 'undefined');
  assert.equal(typeof document, 'undefined');
  const ssrWarnings = [],
    app = createSSRApp(Hydration);
  app.config.warnHandler = (message) => ssrWarnings.push(message);
  ssrHtml = await renderToString(app);
  assert.deepEqual(ssrWarnings, []);
  writeFileSync(
    path.join(temp, 'hydrate.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Divider hydration</title></head><body><div id="app">${ssrHtml}</div><script type="module">${styles}const original=document.querySelector('[data-hydrated-draft]');original.value='Before hydration';original.focus();original.setSelectionRange(2,7);window.dividerHydrationOriginal=original;import {createSSRApp} from 'vue';import Fixture from './hydration-fixture.mjs';createSSRApp(Fixture).mount('#app');</script></body></html>`,
  );
  await page.goto(`${origin}hydrate.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.dividerHydration?.ready);
  const hydrated = page.getByRole('textbox', { name: 'Hydrated Divider draft' });
  const hydrationRetained = () =>
    hydrated.evaluate(
      (n) =>
        n === window.dividerHydrationOriginal &&
        n.isConnected &&
        n.value === 'Before hydration' &&
        document.activeElement === n &&
        n.selectionStart === 2 &&
        n.selectionEnd === 7,
    );
  await check(
    'actual Node SSR hydrates complete native content without replacing the preexisting draft',
    async () => {
      assert.equal(await hydrationRetained(), true);
      assert.equal(await page.evaluate(() => window.dividerHydration.snapshot()), true);
      assert.ok(
        (await page.locator('[data-hydrated-divider]').textContent()).includes(
          'Hydrated title 0 fragment',
        ),
      );
    },
  );
  await check(
    'hydrated current Provider/theme changes preserve draft, focus, selection and root ref',
    async () => {
      await page.evaluate(() => window.dividerHydration.next());
      assert.equal(await hydrationRetained(), true);
      const root = page.locator('[data-hydrated-divider]');
      assert.ok((await root.getAttribute('class')).includes('hydrated-second'));
      assert.equal(await root.evaluate((n) => getComputedStyle(n).direction), 'rtl');
      assert.equal(
        await root
          .locator('.apollo-divider-inner-text')
          .evaluate((n) => getComputedStyle(n).paddingInlineStart),
        '21px',
      );
    },
  );
  const axePath = createRequire(path.join(repo, 'package.json')).resolve('axe-core/axe.min.js');
  for (const width of [375, 1024])
    for (const file of demos) {
      const name = file.slice(0, -4);
      await page.setViewportSize({ width, height: 900 });
      await ready(`${origin}?demo=${name}`);
      await check(`real Demo ${name}/${width}: content, layout and axe`, async () => {
        const stage = page.locator('#stage');
        assert.ok(await stage.locator('.apollo-divider').count());
        const bounds = await stage.evaluate((n) => ({
          width: n.clientWidth,
          scroll: n.scrollWidth,
          invalid: /NaN|\[object Object\]/.test(n.textContent),
        }));
        assert.ok(bounds.scroll <= bounds.width + 1, JSON.stringify(bounds));
        assert.equal(bounds.invalid, false);
        await page.addScriptTag({ path: axePath });
        const violations = await stage.evaluate(async (n) =>
          (await window.axe.run(n)).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((x) => x.failureSummary),
          })),
        );
        assert.deepEqual(violations, []);
      });
      if (name === 'with-text')
        await check(
          `real title Demo/${width}: native controls change slot and plain without stale content`,
          async () => {
            const draft = page.getByRole('textbox', { name: 'Divider title draft' });
            await draft.fill('Business title');
            const input = await draft.elementHandle();
            await page.getByRole('checkbox', { name: 'Plain title', exact: true }).check();
            assert.equal(
              await draft.evaluate((n, old) => n === old && n.value === 'Business title', input),
              true,
            );
            await page.getByRole('checkbox', { name: 'Show title', exact: true }).uncheck();
            assert.equal(await draft.count(), 0);
            await page.getByRole('checkbox', { name: 'Show title', exact: true }).check();
            assert.equal(await draft.inputValue(), 'Business title');
          },
        );
      if (name === 'component-token')
        await check(
          `real Token Demo/${width}: native keyboard and reset reach geometry`,
          async () => {
            const range = page.getByRole('slider', { name: 'Divider text padding' });
            await range.focus();
            await page.keyboard.press('Home');
            await page.keyboard.press('ArrowRight');
            assert.equal(
              await page
                .locator('.apollo-divider-inner-text')
                .evaluate((n) => getComputedStyle(n).paddingInlineStart),
              '2px',
            );
            await page.getByRole('button', { name: 'Reset Divider theme' }).click();
            assert.equal(
              await page
                .locator('.apollo-divider-inner-text')
                .evaluate((n) => getComputedStyle(n).paddingInlineStart),
              '16px',
            );
          },
        );
      if (name === 'style-class')
        await check(
          `real semantic Demo/${width}: current size reevaluates style callback`,
          async () => {
            const target = page.locator('.apollo-divider').last();
            await page
              .getByRole('combobox', { name: 'Divider semantic size' })
              .selectOption('large');
            assert.equal(
              await target.evaluate((n) => getComputedStyle(n).paddingBlockStart),
              '0px',
            );
            await page
              .getByRole('combobox', { name: 'Divider semantic size' })
              .selectOption('small');
            assert.equal(
              await target.evaluate((n) => getComputedStyle(n).paddingBlockStart),
              '4px',
            );
          },
        );
    }
  assert.equal(results.length, 67);
  assert.deepEqual(fingerprint(), before, 'Frozen dist changed');
  for (const file of demos) assert.equal(hash(path.join(demoDir, file)), demoHashes[file]);
  const report = {
    mode: published ? 'published' : 'source',
    sourceUiBridge: !published,
    fullRootExportsValidated: published,
    packageBuilds: false,
    distRead: published,
    distWritten: false,
    loadedRuntimeFiles: [...loaded].sort(),
    loadedSourceModules: published ? 0 : loaded.size,
    publicCssEntries: published
      ? ['@apollo-design/theme/tokens.css', '@apollo-design/ui/divider/style.css']
      : [],
    publicCssFingerprints: published
      ? Object.fromEntries(
          ['packages/theme/dist/tokens.css', 'packages/ui/dist/divider/style.css'].map((f) => [
            f,
            hash(path.join(repo, f)),
          ]),
        )
      : {},
    distBefore: before,
    distAfter: fingerprint(),
    distUnchanged: true,
    demoOriginalSha256: demoHashes,
    scenes,
    results,
    errors,
    readersExited: false,
  };
  writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} catch (error) {
  results.push({ name: 'runner load/hydration completion', passed: false, error: error.message });
  if (ssrHtml !== undefined) writeFileSync(`${evidence}.ssr.html`, ssrHtml);
  if (page && !page.isClosed()) writeFileSync(`${evidence}.page.html`, await page.content());
  writeFileSync(
    evidence,
    `${JSON.stringify({ mode: published ? 'published' : 'source', results, errors, packageBuilds: false, distWritten: false, fatal: error.message, readersExited: false }, null, 2)}\n`,
  );
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  try {
    const report = JSON.parse(readFileSync(evidence));
    report.readersExited = true;
    writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  } catch {}
  rmSync(temp, { recursive: true, force: true });
  console.log('All Divider browser/server readers exited');
}
