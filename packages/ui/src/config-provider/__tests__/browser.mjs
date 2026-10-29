/** Source browser + actual Node SSR. Uses Vite dev transforms; no package build or PNG output. */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../../..');
const published = process.env.CP_MODE === 'published';
const fixture = path.join(here, 'browser-fixture.mjs');
const packages = [
  'utils',
  'theme',
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
  'ui',
];
const results = [];
const errors = [];
const loaded = new Set();
const walk = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
const fingerprint = () =>
  published
    ? Object.fromEntries(
        packages
          .flatMap((name) => walk(path.join(repo, 'packages', name, 'dist')))
          .sort()
          .map((file) => [
            path.relative(repo, file),
            createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
          ]),
      )
    : {};
const before = fingerprint();
const uiRequire = createRequire(path.join(repo, 'packages/ui/package.json'));
const externalAliases = ['dayjs', 'scroll-into-view-if-needed'].map((name) => {
  let folder = path.dirname(uiRequire.resolve(name));
  while (
    !fs.existsSync(path.join(folder, 'package.json')) ||
    JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8')).name !== name
  ) {
    const parent = path.dirname(folder);
    if (folder === parent) throw new Error('Cannot resolve ' + name);
    folder = parent;
  }
  return { find: name, replacement: folder };
});
let server;
let browser;
let page;
let styles = '';
const record = (name, passed, actual) => {
  results.push({ name, passed, actual });
  if (!passed) throw new Error(`FAIL ${name}: ${JSON.stringify(actual)}`);
};
try {
  server = await createServer({
    configFile: false,
    root: repo,
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-config-browser-vite-')),
    plugins: [
      ...(published
        ? [
            {
              name: 'cp-published-runtime-origin',
              enforce: 'pre',
              resolveId(id, importer) {
                if (!importer || !id.startsWith('.')) return;
                const sourceFile = path.resolve(path.dirname(importer.split('?')[0]), id);
                const uiSource = path.join(repo, 'packages/ui/src');
                if (
                  !sourceFile.startsWith(uiSource + path.sep) ||
                  sourceFile.includes('/config-provider/demo/') ||
                  sourceFile.includes('/config-provider/__tests__/')
                )
                  return;
                const relative = path.relative(uiSource, sourceFile).replace(/\.ts$/, '');
                const direct = path.join(repo, 'packages/ui/dist', relative + '.mjs');
                const index = path.join(repo, 'packages/ui/dist', relative, 'index.mjs');
                if (fs.existsSync(direct)) return direct;
                if (fs.existsSync(index)) return index;
                throw new Error('No frozen runtime for ' + sourceFile);
              },
              load(id) {
                const file = id.split('?')[0];
                if (!file.startsWith(path.join(repo, 'packages') + path.sep)) return;
                if (
                  file === fixture ||
                  file === path.join(here, 'ssr-fixture.mjs') ||
                  file.includes('/config-provider/demo/')
                )
                  return;
                if (/\/src\//.test(file))
                  throw new Error('Published runtime source fallback ' + file);
                if (/\/dist\//.test(file)) loaded.add(file);
              },
            },
          ]
        : []),
      vue(),
      {
        name: 'cp-browser-page',
        configureServer(vite) {
          vite.middlewares.use('/__cp_styles.css', (_request, response) => {
            response.setHeader('content-type', 'text/css');
            response.end(styles);
          });
          vite.middlewares.use('/__cp_audit', (_request, response) => {
            response.setHeader('content-type', 'text/html');
            response.end(
              `<!doctype html><html><head><meta charset="utf-8"><title>ConfigProvider source audit</title><link rel="stylesheet" href="/__cp_styles.css"></head><body><main id="app"></main><script type="module">import * as audit from '/${path.relative(repo, fixture)}';window.audit=audit;</script></body></html>`,
            );
          });
        },
      },
    ],
    resolve: {
      alias: published
        ? externalAliases
        : Object.fromEntries(
            packages.map((name) => [
              `@apollo-design/${name}`,
              path.join(repo, 'packages', name, 'src'),
            ]),
          ),
      dedupe: ['vue'],
    },
    optimizeDeps: {
      include: [
        'vue',
        'dayjs',
        'dayjs/plugin/advancedFormat.js',
        'dayjs/plugin/customParseFormat.js',
        'dayjs/plugin/localeData.js',
        'dayjs/plugin/weekOfYear.js',
        'dayjs/plugin/weekYear.js',
        'dayjs/plugin/weekday.js',
        'scroll-into-view-if-needed',
      ],
      entries: [fixture],
    },
    server: { host: '127.0.0.1', port: 0, hmr: false },
    ssr: { external: ['vue', 'vue/server-renderer'] },
  });
  await server.listen();
  const address = server.httpServer.address();
  if (typeof address !== 'object' || !address) throw new Error('Expected the local Vite address');
  const base = `http://127.0.0.1:${address.port}`;
  if (published)
    styles =
      fs.readFileSync(path.join(repo, 'packages/theme/dist/tokens.css'), 'utf8') +
      fs.readFileSync(path.join(repo, 'packages/ui/dist/index.css'), 'utf8');
  else {
    const styleModule = await server.ssrLoadModule(
      path.join(repo, 'packages/ui/src/style/index.ts'),
    );
    styles = styleModule.genAllStyles();
  }
  const ssr = await server.ssrLoadModule(path.join(here, 'ssr-fixture.mjs'));
  const markup = {};
  for (const kind of ['table', 'list', 'select', 'svg', 'explicit']) {
    markup[kind] = await renderToString(createSSRApp({ render: () => ssr.serverRoot(kind) }));
    record(
      `Node SSR ${kind} emits current variables`,
      markup[kind].includes('--apollo-font-size:21px'),
      markup[kind].slice(0, 150),
    );
  }
  console.log('Node SSR native contexts ready');
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(`${base}/__cp_audit`);
  await page.waitForFunction(() => Boolean(window.audit));
  if (!process.env.CP_BROWSER_DEMOS_ONLY && !process.env.CP_BROWSER_CONTRAST_ONLY) {
    for (const kind of Object.keys(markup)) {
      const state = await page.evaluate(
        async ({ kind, html }) => window.audit.hydrate(kind, html),
        { kind, html: markup[kind] },
      );
      record(
        `Hydration ${kind} retains native nodes and content`,
        state.same &&
          state.warnings.length === 0 &&
          (state.draft === null || state.draft === 'Kept hydration draft') &&
          state.focus &&
          state.variable === '21px',
        state,
      );
    }
    async function mount(kind) {
      await page.evaluate(async (value) => {
        window.case = await window.audit.mount(value);
      }, kind);
    }
    async function inspect() {
      return page.evaluate(() => window.case.inspect());
    }
    async function waitFont(value) {
      await page.waitForFunction((expected) => window.case.inspect().font === expected, value);
      return inspect();
    }
    await mount('native');
    await waitFont('21px');
    await page.evaluate(() => window.case.native({ '--apollo-font-size': '21px' }));
    await page.evaluate(() => window.case.theme({ token: { fontSize: 25 } }));
    let state = await waitFont('21px');
    record(
      'Native declaration equal to previous projection remains authoritative',
      state.draft === 'Kept browser draft' && state.focus && state.editorSame,
      state,
    );
    await page.evaluate(() => window.case.native({ '--apollo-font-size': '29px !important' }));
    state = await waitFont('29px');
    record('Native style priority is retained', state.priority === 'important', state);
    await page.evaluate(() => window.case.native(undefined));
    await waitFont('25px');
    await page.evaluate(() => window.case.theme(undefined));
    state = await waitFont('');
    record(
      'Theme removal restores owned inline variables and keeps the draft',
      state.same && state.editorSame && state.draft === 'Kept browser draft' && state.focus,
      state,
    );

    await mount('nested');
    await waitFont('24px');
    await page.evaluate(() => window.case.parent({ token: { fontSize: 28 } }));
    await waitFont('24px');
    await page.evaluate(() => window.case.child(undefined));
    state = await waitFont('28px');
    record(
      'Nested renderless ownership restores the active outer provider',
      state.same && state.editorSame && state.focus,
      state,
    );
    await page.evaluate(() => window.case.child({ token: { fontSize: 26 } }));
    await waitFont('26px');
    await page.evaluate(() => window.case.parent({ token: { fontSize: 30 } }));
    await waitFont('26px');
    record('Outer updates preserve the nearer provider', true, await inspect());

    await mount('dynamic');
    await page.evaluate(() => window.case.show(true));
    state = await waitFont('21px');
    record(
      'An opaque child can add its first native root after mount',
      state.tag === 'SECTION',
      state,
    );
    await page.evaluate(() => window.case.alternate(true));
    state = await waitFont('21px');
    record('Opaque child root replacement is observed', state.tag === 'ARTICLE', state);
    await page.evaluate(() => window.case.show(false));
    await page.waitForFunction(() => window.case.inspect().count === 0);
    await page.evaluate(() => window.case.show(true));
    await waitFont('21px');

    await mount('teleport');
    await waitFont('21px');
    await page.evaluate(() => window.case.move());
    state = await waitFont('21px');
    record(
      'Teleported native roots retain projection, draft and focus during relocation',
      state.remote &&
        state.same &&
        state.editorSame &&
        state.draft === 'Kept browser draft' &&
        state.focus,
      state,
    );

    await mount('svg');
    state = await waitFont('21px');
    record('SVG native roots consume current variables', state.tag === 'g', state);
    await page.evaluate(() => window.case.theme({ token: { fontSize: 27 } }));
    await waitFont('27px');
    const releasedSvg = await page.evaluate(() => window.case.unmount());
    record(
      'SVG projection cleanup releases owned values',
      !releasedSvg.includes('--apollo-'),
      releasedSvg,
    );

    await mount('prefix');
    await page.evaluate(() => window.case.prefix('first'));
    await page.waitForFunction(
      () => window.case.inspect().first === '21px' && window.case.inspect().font === '',
    );
    await page.evaluate(() => window.case.prefix('second'));
    await page.waitForFunction(
      () => window.case.inspect().second === '21px' && window.case.inspect().first === '',
    );
    record('Current CSS-variable prefixes release previous names', true, await inspect());

    await mount('shared');
    await waitFont('21px');
    await page.evaluate(() => window.case.share(true));
    await waitFont('18px');
    await page.evaluate(() => window.case.parent({ token: { fontSize: 32 } }));
    await waitFont('32px');
    await page.evaluate(() => window.case.share(false));
    await waitFont('21px');
    record('ThemeProvider and projection share one ownership primitive', true, await inspect());
  }

  if (!process.env.CP_BROWSER_DEMOS_ONLY && !process.env.CP_BROWSER_CONTRAST_ONLY) {
    for (const kind of ['message', 'notification']) {
      await page.evaluate(async (kind) => {
        window.notice = await window.audit.mountNotices(kind);
      }, kind);
      await page.evaluate(() => window.notice.change());
      let state = await page.evaluate(() => window.notice.inspect());
      record(
        `${kind}: existing notice keeps editor, focus, native style and current defaults`,
        state.same &&
          state.focus &&
          state.value === 'Kept notice draft' &&
          state.selection.join() === '2,6' &&
          state.mounted === 1 &&
          state.font === '31px' &&
          state.oldClasses.length === 0 &&
          state.userColor === 'rgb(1, 2, 3)' &&
          (kind !== 'notification' || state.closeLabel === '关闭'),
        state,
      );
      await page.evaluate(() => window.notice.update());
      state = await page.evaluate(() => window.notice.inspect());
      record(
        `${kind}: same-key updates preserve the editor`,
        state.same && state.value === 'Kept notice draft' && state.mounted === 1,
        state,
      );
      for (const destination of ['element', 'shadow']) {
        await page.evaluate((value) => window.notice.move(value), destination);
        state = await page.evaluate(() => window.notice.inspect());
        record(
          `${kind}: current global popup target moves the existing editor into ${destination}`,
          state.same &&
            state.focus &&
            state.value === 'Kept notice draft' &&
            state.selection.join() === '2,6' &&
            state.mounted === 1 &&
            state.font === '31px',
          state,
        );
      }
      await page.evaluate(() => window.notice.close());
      state = await page.evaluate(() => window.notice.inspect());
      record(
        `${kind}: close behavior preserves the declared callback contract`,
        state.closed === (kind === 'notification' ? 1 : 0),
        state,
      );
    }
  }

  const require = createRequire(path.join(repo, 'packages/test-utils/package.json'));
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  await page.evaluate(() => window.audit.mountContrastControls());
  const contrast = await page.evaluate(async () => {
    const styles = [...document.querySelectorAll('[data-contrast-control]')].map((section) => {
      const button = section.querySelector('button');
      const css = getComputedStyle(button);
      return {
        name: section.getAttribute('data-contrast-control'),
        foreground: css.color,
        background: css.backgroundColor,
        autoSolidColor: css.getPropertyValue('--apollo-btn-auto-solid-color'),
        primaryColor: css.getPropertyValue('--apollo-btn-primary-color'),
        solidTextColor: css.getPropertyValue('--apollo-btn-solid-text-color'),
        buttonBackground: css.getPropertyValue('--apollo-btn-bg-color'),
      };
    });
    const checked = await window.axe.run(document.querySelector('#app'), {
      runOnly: { type: 'rule', values: ['color-contrast'] },
    });
    return {
      supports: CSS.supports('color', 'contrast-color(white)'),
      styles,
      violations: checked.violations.map((value) => ({
        id: value.id,
        nodes: value.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    };
  });
  contrast.browser = browser.version();
  fs.writeFileSync(
    '/tmp/apollo-config-provider-audit/button-primary-control.json',
    `${JSON.stringify(contrast, null, 2)}\n`,
  );
  const baselineColor = contrast.styles[0];
  record(
    'ConfigProvider keeps the committed Button foreground and background under the same browser and stylesheet',
    contrast.styles.every(
      (value) =>
        value.foreground === baselineColor.foreground &&
        value.background === baselineColor.background &&
        value.autoSolidColor === baselineColor.autoSolidColor,
    ),
    contrast,
  );

  if (!process.env.CP_BROWSER_CONTRAST_ONLY) {
    for (const theme of ['default', 'dark', 'compact', 'both']) {
      const mounted = await page.evaluate((value) => window.audit.mountDemos(value), theme);
      console.log('Demo mount', theme, JSON.stringify(mounted));
      await page.waitForFunction(() => document.querySelectorAll('[data-demo]').length === 8);
      const demoState = await page.evaluate(() => ({
        count: document.querySelectorAll('[data-demo]').length,
        prefix: getComputedStyle(document.querySelector('[data-demo="prefix-cls"] .brand-empty'))
          .textAlign,
        controls: document.querySelectorAll('[data-demo] input,[data-demo] button').length,
      }));
      record(
        `${theme}: all eight real Demos render with static custom-prefix CSS`,
        demoState.count === 8 && demoState.prefix === 'center' && demoState.controls > 12,
        demoState,
      );
      const sized = page.locator('[data-demo="component-size"]');
      await sized.getByLabel('组件尺寸输入框', { exact: true }).fill('Size draft');
      await sized.getByRole('combobox', { name: '组件尺寸', exact: true }).click();
      await page
        .locator('.apollo-select-dropdown:visible .apollo-select-item-option[title="small"]')
        .click();
      await page.waitForFunction(() =>
        Boolean(document.querySelector('[data-demo="component-size"] .apollo-input-sm')),
      );
      record(
        `${theme}: dynamic size Demo applies size without replacing its editor`,
        (await sized.getByLabel('组件尺寸输入框', { exact: true }).inputValue()) === 'Size draft',
        {},
      );

      const directional = page.locator('[data-demo="direction"]');
      await directional.getByLabel('姓名', { exact: true }).fill('Direction draft');
      await directional.getByRole('combobox', { name: '文字方向' }).click();
      await page
        .locator(
          '.apollo-select-dropdown:visible .apollo-select-item-option[title="RTL（从右到左）"]',
        )
        .click();
      await page.waitForFunction(() =>
        Boolean(document.querySelector('[data-demo="direction"] .apollo-input-rtl')),
      );
      record(
        `${theme}: direction Demo applies RTL without replacing its editor`,
        (await directional.getByLabel('姓名', { exact: true }).inputValue()) ===
          'Direction draft' && (await directional.locator('.apollo-btn[dir="rtl"]').count()) === 2,
        {},
      );

      const useConfig = page.locator('[data-demo="use-config"]');
      await useConfig.getByLabel('尺寸与禁用状态示例', { exact: true }).fill('Demo draft');
      await useConfig.getByRole('combobox', { name: '组件尺寸', exact: true }).click();
      await page
        .locator('.apollo-select-dropdown:visible .apollo-select-item-option[title="large"]')
        .click();
      await page.waitForFunction(() =>
        document
          .querySelector('[data-demo="use-config"]')
          .textContent.includes('componentSize: large'),
      );
      await useConfig.getByRole('switch', { name: '禁用全部组件' }).click();
      await page.waitForFunction(
        () => document.querySelector('[aria-label="尺寸与禁用状态示例"]').disabled === true,
      );
      record(
        `${theme}: useConfig Demo updates real size and disabled controls without losing draft`,
        (await useConfig.getByLabel('尺寸与禁用状态示例', { exact: true }).inputValue()) ===
          'Demo draft',
        {},
      );
      await useConfig.getByRole('switch', { name: '禁用全部组件' }).click();

      const language = page.locator('[data-demo="locale"]');
      await language.getByLabel('切换语言时保留的草稿', { exact: true }).fill('Language draft');
      await language.getByRole('combobox', { name: '切换示例语言' }).click();
      await page
        .locator('.apollo-select-dropdown:visible .apollo-select-item-option[title="English"]')
        .click();
      await page.waitForFunction(() =>
        document.querySelector('[data-demo="locale"]').textContent.includes('/ page'),
      );
      record(
        `${theme}: language Demo updates Pagination and retains its real editor`,
        (await language.getByLabel('切换语言时保留的草稿', { exact: true }).inputValue()) ===
          'Language draft',
        {},
      );

      const themed = page.locator('[data-demo="theme"]');
      await themed.getByLabel('主题切换时保留的草稿', { exact: true }).fill('Theme draft');
      const before = await themed.locator('output').textContent();
      await themed.getByRole('button', { name: '运行时字体 +1' }).click();
      await page.waitForFunction(
        (previous) => document.querySelector('[data-demo="theme"] output').textContent !== previous,
        before,
      );
      await themed.getByRole('combobox', { name: '主题算法' }).click();
      await page
        .locator('.apollo-select-dropdown:visible .apollo-select-item-option[title="暗色 + 紧凑"]')
        .click();
      record(
        `${theme}: theme Demo supports writable config and external algorithms without replacing draft`,
        (await themed.getByLabel('主题切换时保留的草稿', { exact: true }).inputValue()) ===
          'Theme draft',
        {},
      );

      const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document.querySelector('#app'), {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        });
        return result.violations.map((value) => ({
          id: value.id,
          impact: value.impact,
          nodes: value.nodes.map((node) => node.target),
        }));
      });
      record(
        `${theme}: real-browser accessibility for all eight Demos`,
        violations.length === 0,
        violations,
      );
    }
  }
  record('No browser page errors', errors.length === 0, errors);
} catch (error) {
  errors.push(String(error));
  if (page) {
    fs.writeFileSync('/tmp/apollo-config-provider-demo-debug.html', await page.content());
    console.log('DOM diagnostic saved to /tmp/apollo-config-provider-demo-debug.html');
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
  const output = process.env.CP_BROWSER_EVIDENCE ?? '/tmp/apollo-config-provider-browser.json';
  const unchanged = JSON.stringify(before) === JSON.stringify(fingerprint());
  if (!unchanged) process.exitCode = 1;
  fs.writeFileSync(
    output,
    `${JSON.stringify({ mode: published ? 'published' : 'source', results, errors, distFiles: Object.keys(before).length, distUnchanged: unchanged, loadedRuntimeFiles: [...loaded], passed: !process.exitCode }, null, 2)}\n`,
  );
  console.log(
    `${results.filter((row) => row.passed).length}/${results.length} source browser/Node SSR checks; ${output}`,
  );
  console.log('All ConfigProvider browser readers exited');
}
