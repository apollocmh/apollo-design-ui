/** Real-browser Input sizing contracts. Default: source-only, temporary Vite cache, no package build. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = realpathSync(
  path.resolve(
    process.env.INPUT_SIZING_REPO ??
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  ),
);
const root =
  process.env.INPUT_SIZING_EVIDENCE_DIR ?? mkdtempSync(path.join(tmpdir(), 'apollo-input-sizing-'));
mkdirSync(root, { recursive: true });
const phase = process.env.INPUT_SIZING_MODE ?? 'source',
  cssMode = process.env.INPUT_SIZING_CSS ?? 'all';
assert.ok(['source', 'published'].includes(phase));
assert.ok(['all', 'entry'].includes(cssMode));
const devServer = process.env.INPUT_SIZING_SERVE === 'dev';
assert.ok(!devServer || phase === 'source', 'The dev server is source-only');
const require = createRequire(path.join(repo, 'package.json'));
const { build, preview, createServer } = await import(pathToFileURL(require.resolve('vite')).href);
const { default: vue } = await import(pathToFileURL(require.resolve('@vitejs/plugin-vue')).href);
const fixture = path.join(root, `${phase}-${cssMode}-fixture`);
mkdirSync(fixture, { recursive: true });
const devDependencies = [
  'vue',
  'axe-core',
  'dayjs',
  'dayjs/plugin/advancedFormat.js',
  'dayjs/plugin/customParseFormat.js',
  'dayjs/plugin/localeData.js',
  'dayjs/plugin/weekOfYear.js',
  'dayjs/plugin/weekYear.js',
  'dayjs/plugin/weekday.js',
  'scroll-into-view-if-needed',
];
if (devServer) {
  mkdirSync(path.join(fixture, 'node_modules'), { recursive: true });
  const uiRequire = createRequire(path.join(repo, 'packages/ui/package.json'));
  for (const name of ['vue', 'axe-core', 'dayjs', 'scroll-into-view-if-needed']) {
    let folder = path.dirname(uiRequire.resolve(name));
    while (
      !existsSync(path.join(folder, 'package.json')) ||
      JSON.parse(readFileSync(path.join(folder, 'package.json'), 'utf8')).name !== name
    ) {
      const parent = path.dirname(folder);
      assert.notEqual(parent, folder, `Cannot locate ${name}`);
      folder = parent;
    }
    const target = path.join(fixture, 'node_modules', name);
    if (!existsSync(target)) symlinkSync(folder, target, 'dir');
  }
} else if (!existsSync(path.join(fixture, 'node_modules'))) {
  symlinkSync(path.join(repo, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
}
const packageNames = readdirSync(path.join(repo, 'packages')).filter((name) =>
  existsSync(path.join(repo, 'packages', name, 'src/index.ts')),
);
const aliases = packageNames.map((name) => ({
  find: new RegExp(`^@apollo-design/${name}$`),
  replacement: path.join(
    repo,
    'packages',
    name,
    phase === 'source' ? 'src/index.ts' : 'dist/index.mjs',
  ),
}));
const styles =
  phase === 'source'
    ? `import {getCSSVarDeclarations,getDesignToken} from '@apollo-design/theme';import {genAllStyles,genComponentStyleSheet} from ${JSON.stringify(path.join(repo, 'packages/ui/src/style/index.ts'))};const style=document.createElement('style');style.textContent=getCSSVarDeclarations(getDesignToken())+'\\n'+${cssMode === 'all' ? 'genAllStyles()' : "genComponentStyleSheet('input')"};document.head.append(style);`
    : `import ${JSON.stringify(path.join(repo, 'packages/theme/dist/tokens.css'))};import ${JSON.stringify(path.join(repo, cssMode === 'all' ? 'packages/ui/dist/index.css' : 'packages/ui/dist/input/style.css'))};`;
writeFileSync(
  path.join(fixture, 'entry.js'),
  styles +
    `\nawait import(${JSON.stringify(path.join(repo, 'tests/browser/fixtures/InputSizingContracts.mjs'))});`,
);
writeFileSync(
  path.join(fixture, 'index.html'),
  '<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"></head><body style="margin:0"><div id="app"></div><script type="module" src="/entry.js"></script></body></html>',
);
const source = [
  'Input.ts',
  'TextArea.ts',
  'Password.ts',
  'Search.ts',
  'Group.ts',
  'OTP.ts',
  'use-input-theme.ts',
  'style/index.ts',
  'style/token.ts',
  'style/alias-tokens.ts',
  'engine/Input.ts',
  'engine/BaseInput.ts',
  'engine/TextArea.ts',
  'engine/calculate-node-height.ts',
  'demo/component-token.vue',
].map((file) => path.join(repo, 'packages/ui/src/input', file));
const files = [
  ...source,
  ...['packages/theme/src/vue.ts', 'packages/ui/src/config-provider/ConfigProvider.ts'].map(
    (file) => path.join(repo, file),
  ),
  ...[
    'packages/theme/dist/tokens.css',
    'packages/ui/dist/index.css',
    'packages/ui/dist/input/Input.mjs',
    'packages/ui/dist/input/style/index.mjs',
  ].map((file) => path.join(repo, file)),
];
const fingerprint = () =>
  Object.fromEntries(
    files.map((file) => [
      path.relative(repo, file),
      createHash('sha256').update(readFileSync(file)).digest('hex'),
    ]),
  );
const before = fingerprint();
let server, browser;
const errors = [],
  expectedDeprecations = [],
  vueModuleUrls = new Set(),
  warnings = [],
  steps = [],
  checks = [],
  resolvedSources = new Set(),
  resolvedDemos = new Set(),
  forbidden = [];
const check = (name, actual, expected) => {
  let passed = true;
  try {
    assert.deepEqual(actual, expected);
  } catch {
    passed = false;
  }
  checks.push({ name, actual, expected, passed });
};
try {
  const viteConfig = {
    root: fixture,
    configFile: false,
    cacheDir: path.join(root, `vite-cache-${phase}-${cssMode}`),
    logLevel: 'error',
    mode: 'production',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    plugins: [
      {
        name: 'input-package-boundary-guard',
        enforce: 'pre',
        load(id) {
          if (id.startsWith(path.join(repo, 'packages') + path.sep)) {
            resolvedSources.add(id);
            if (phase === 'source' && id.includes('/dist/')) {
              forbidden.push(id);
              throw new Error(`Published artifact forbidden: ${id}`);
            }
          }
          if (
            phase === 'published' &&
            /\/(?:packages|node_modules\/@apollo-design)\/[^/]+\/src\//.test(id)
          ) {
            if (
              id.startsWith(path.join(repo, 'packages/ui/src/input/demo') + path.sep) &&
              /\.vue(?:\?|$)/.test(id)
            ) {
              resolvedDemos.add(id);
            } else {
              forbidden.push(id);
              throw new Error(`Library source forbidden in published consumer: ${id}`);
            }
          }
          return null;
        },
      },
      vue(),
    ],
    resolve: { alias: aliases, dedupe: ['vue'] },
    optimizeDeps: { noDiscovery: true, include: devServer ? devDependencies : ['vue'] },
    build: {
      outDir: path.join(root, `${phase}-${cssMode}-bundle`),
      emptyOutDir: false,
      minify: false,
    },
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [repo, root] } },
    preview: { host: '127.0.0.1', port: 0 },
  };
  if (devServer) {
    server = await createServer(viteConfig);
    await server.listen();
  } else {
    await build(viteConfig);
    server = await preview(viteConfig);
  }
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1000 },
    deviceScaleFactor: 1,
  });
  page.setDefaultTimeout(20000);
  page.on('request', (request) => {
    if (/\/deps\/vue\.js(?:\?|$)/.test(request.url())) vueModuleUrls.add(request.url());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      devServer &&
      /^Warning: \[apollo: (?:Input|Input.Group)\] `(?:addonBefore|addonAfter|Input.Group)` is deprecated\. Please use `Space\.Compact` instead\.$/.test(
        m.text(),
      )
    )
      expectedDeprecations.push(m.text());
    else if (m.type() === 'error') errors.push(m.text());
    else if (['warning', 'warn'].includes(m.type()) || m.text().includes('[Vue warn]'))
      warnings.push(m.text());
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.inputSizingReady);
  const set = (patch) => page.evaluate((patch) => window.inputSizing.set(patch), patch);
  const capture = async (label) => {
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      );
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const data = await page.evaluate(() => {
      const names = [
        'fontSize',
        'lineHeight',
        'marginInlineEnd',
        'marginInlineStart',
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'borderTopWidth',
        'borderBottomWidth',
        'height',
        'minHeight',
        'maxHeight',
        'overflowY',
        'boxShadow',
        'outlineWidth',
        'backgroundColor',
        'borderColor',
      ];
      const vars = [
        'padding-block',
        'padding-block-sm',
        'padding-block-lg',
        'padding-inline',
        'padding-inline-sm',
        'padding-inline-lg',
        'input-font-size',
        'input-font-size-sm',
        'input-font-size-lg',
        'input-affix-padding',
        'line-width-focus',
        'active-shadow',
        'active-border-color',
        'hover-border-color',
        'addon-bg',
        'active-bg',
        'hover-bg',
        'error-active-shadow',
        'warning-active-shadow',
      ];
      const measure = (node) => {
        if (!node) return null;
        const s = getComputedStyle(node),
          r = node.getBoundingClientRect();
        return {
          tag: node.tagName,
          className: node.className,
          style: node.getAttribute('style'),
          inlineHeight: node.style.height,
          rect: { height: r.height, width: r.width, bottom: r.bottom },
          computed: Object.fromEntries(names.map((n) => [n, s[n]])),
          variables: Object.fromEntries(
            vars.map((n) => [n, s.getPropertyValue(`--apollo-input-${n}`).trim()]),
          ),
          alias: {
            font: s.getPropertyValue('--apollo-font-size').trim(),
            line: s.getPropertyValue('--apollo-line-height').trim(),
            height: s.getPropertyValue('--apollo-control-height').trim(),
          },
          scrollHeight: node.scrollHeight,
          value: node.value,
        };
      };
      return [...document.querySelectorAll('[data-family]')].map((section) => {
        const control = section.querySelector('input.apollo-input,textarea.apollo-input');
        const target =
          section.querySelector(
            '.apollo-input-search,.apollo-otp,.apollo-input-group,.apollo-input-group-wrapper,.apollo-input-affix-wrapper',
          ) ?? control;
        return {
          family: section.dataset.family,
          root: measure(target),
          control: measure(control),
          inputCount: section.querySelectorAll('input').length,
          reference: measure(section.querySelector('[data-reference]')),
          groupButton: measure(section.querySelector('[data-group-button]')),
          searchButton: measure(section.querySelector('.apollo-input-search-btn')),
          prefix: measure(section.querySelector('.apollo-input-prefix')),
          suffix: measure(section.querySelector('.apollo-input-suffix')),
        };
      });
    });
    steps.push({ label, cases: data });
    return data;
  };
  for (const viewport of [320, 768, 1280]) {
    await page.setViewportSize({ width: viewport, height: 1000 });
    for (const theme of ['default', 'dark', 'compact', 'both'])
      for (const size of ['small', 'middle', 'large']) {
        await set({ theme, size });
        const rows = await capture(`${viewport}-${theme}-${size}`);
        const compact = theme === 'compact' || theme === 'both',
          height = compact
            ? { small: 22, middle: 28, large: 35 }[size]
            : { small: 24, middle: 32, large: 40 }[size];
        for (const row of rows) {
          const font = compact
            ? size === 'large'
              ? '14px'
              : '12px'
            : size === 'large'
              ? '16px'
              : '14px';
          check(
            `${viewport} ${theme} ${size} ${row.family} current font`,
            row.control?.computed.fontSize,
            font,
          );
          if (!['textarea', 'textarea-affix', 'autosize'].includes(row.family))
            check(
              `${viewport} ${theme} ${size} ${row.family} natural root height`,
              Math.abs(row.root.rect.height - height) < 0.02,
              true,
            );
          if (row.family === 'search')
            check(
              `${viewport} ${theme} ${size} Search default button stretches`,
              Math.abs(row.searchButton.rect.height - row.control.rect.height) < 0.02,
              true,
            );
          if (row.family === 'textarea' || row.family === 'textarea-affix')
            check(
              `${viewport} ${theme} ${size} ${row.family} current line height`,
              Number.parseFloat(row.control.computed.lineHeight),
              compact ? (size === 'large' ? 22 : 20) : size === 'large' ? 24 : 22,
            );
        }
      }
  }
  await page.setViewportSize({ width: 1000, height: 1000 });
  await capture('before-component-overrides');
  const overrides = {
    paddingBlock: '7px',
    paddingBlockSM: '3px',
    paddingBlockLG: '9px',
    paddingInline: '17px',
    paddingInlineSM: '13px',
    paddingInlineLG: '19px',
    inputFontSize: '18px',
    inputFontSizeSM: '16px',
    inputFontSizeLG: '22px',
    inputAffixPadding: '11px',
    lineWidthFocus: '2px',
    activeBorderColor: '#722ed1',
    hoverBorderColor: '#531dab',
    hoverBg: '#f9f0ff',
    activeBg: '#eee5ff',
    addonBg: '#f5eaff',
    activeShadow: '0 0 0 3px #abcdef',
    errorActiveShadow: '0 0 0 4px #fedcba',
    warningActiveShadow: '0 0 0 5px #abcefa',
  };
  await set({ theme: 'default', size: 'middle', tokens: overrides });
  const custom = await capture('component-overrides');
  const plain = custom.find((x) => x.family === 'plain');
  const kebab = (k) => k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  for (const [key, value] of Object.entries(overrides))
    check(`theme.components.Input ${key}`, plain.control.variables[kebab(key)], value);
  await page.locator('#plain-control').hover();
  const hover = await capture('component-hovered');
  check(
    'hoverBorderColor paints',
    hover.find((x) => x.family === 'plain').control.computed.borderColor,
    'rgb(83, 29, 171)',
  );
  check(
    'hoverBg paints',
    hover.find((x) => x.family === 'plain').control.computed.backgroundColor,
    'rgb(249, 240, 255)',
  );
  check(
    'addonBg paints',
    await page
      .locator('[data-family="legacy-addons"] .apollo-input-group-addon')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(245, 234, 255)',
  );
  await page.locator('#plain-control').focus();
  const themedFocus = await capture('component-focused');
  check(
    'explicit activeShadow is painted',
    themedFocus.find((x) => x.family === 'plain').control.computed.boxShadow !== 'none',
    true,
  );
  check(
    'explicit active color is painted',
    themedFocus.find((x) => x.family === 'plain').control.computed.borderColor,
    'rgb(114, 46, 209)',
  );
  check(
    'explicit active background is painted',
    themedFocus.find((x) => x.family === 'plain').control.computed.backgroundColor,
    'rgb(238, 229, 255)',
  );
  const affix = custom.find((x) => x.family === 'affix');
  check('inputAffixPadding reaches actual prefix', affix.prefix.computed.marginInlineEnd, '11px');
  check('inputAffixPadding reaches actual suffix', affix.suffix.computed.marginInlineStart, '11px');
  for (const [status, color, spread] of [
    ['error', 'rgb(254, 220, 186)', '4px'],
    ['warning', 'rgb(171, 206, 250)', '5px'],
  ]) {
    await set({ status });
    const focused = await capture(`component-focused-${status}`);
    const shadow = focused.find((x) => x.family === 'plain').control.computed.boxShadow;
    check(
      `${status}ActiveShadow paints its configured color and spread`,
      shadow,
      `${color} 0px 0px 0px ${spread}`,
    );
  }
  await set({ status: undefined, variant: 'borderless' });
  await page.locator('#plain-control').press('Tab');
  await page.keyboard.press('Shift+Tab');
  check(
    'keyboard navigation focuses the actual plain control',
    await page
      .locator('#plain-control')
      .evaluate((el) => el === document.activeElement && el.matches(':focus-visible')),
    true,
  );
  const borderless = await capture('component-focus-outline');
  check(
    'lineWidthFocus controls the actual keyboard outline',
    borderless.find((x) => x.family === 'plain').control.computed.outlineWidth,
    '2px',
  );
  await set({ tokens: { ...overrides, lineWidthFocus: 0 } });
  const zeroFocus = await capture('zero-focus-width');
  check(
    'explicit zero focus width consumes',
    zeroFocus.find((x) => x.family === 'plain').control.computed.outlineWidth,
    '0px',
  );
  await set({ tokens: overrides });
  await set({ variant: 'outlined' });
  for (const [size, font, pad, inline] of [
    ['small', '16px', '3px', '13px'],
    ['middle', '18px', '7px', '17px'],
    ['large', '22px', '9px', '19px'],
  ]) {
    await set({ size });
    const rows = await capture(`component-metric-${size}`);
    const input = rows.find((x) => x.family === 'plain').control;
    check(`explicit ${size} font reaches native control`, input.computed.fontSize, font);
    check(`explicit ${size} block reaches native control`, input.computed.paddingTop, pad);
    check(`explicit ${size} inline reaches native control`, input.computed.paddingLeft, inline);
    for (const row of rows.filter((row) => row.family !== 'group')) {
      check(
        `${size} explicit component font consumes ${row.family}`,
        row.control.computed.fontSize,
        font,
      );
      check(
        `${size} explicit component block consumes ${row.family}`,
        (row.family === 'affix' || row.family === 'password' ? row.root : row.control).computed
          .paddingTop,
        pad,
      );
    }
  }
  await set({ tokens: {}, size: 'middle' });
  await capture('component-removed');
  await set({
    tokens: {
      paddingBlock: 0,
      paddingInline: '1rem',
      inputFontSize: '1.25rem',
      inputAffixPadding: '0.5rem',
    },
  });
  const lengths = await capture('component-css-lengths-and-zero');
  check(
    'CSS font length retains its unit',
    lengths.find((x) => x.family === 'plain').control.computed.fontSize,
    '20px',
  );
  check(
    'CSS inline length retains its unit',
    lengths.find((x) => x.family === 'plain').control.computed.paddingLeft,
    '16px',
  );
  check(
    'zero padding is not replaced by a default',
    lengths.find((x) => x.family === 'plain').control.computed.paddingTop,
    '0px',
  );
  check(
    'CSS affix length retains its unit',
    lengths.find((x) => x.family === 'affix').prefix.computed.marginInlineEnd,
    '8px',
  );
  await set({ tokens: {} });
  await page.locator('#plain-control').focus();
  const defaultFocus = await capture('default-focused');
  check(
    'default active shadow is valid CSS and paints',
    defaultFocus.find((x) => x.family === 'plain').control.computed.boxShadow !== 'none',
    true,
  );
  await page
    .locator('#plain-control')
    .evaluate((el) =>
      el.style.setProperty('--apollo-input-active-shadow', '0 0 0 3px rgb(171, 205, 239)'),
    );
  const nativeShadow = await capture('native-valid-shadow');
  check(
    'native valid shadow proves focus consumption works',
    nativeShadow.find((x) => x.family === 'plain').control.computed.boxShadow !== 'none',
    true,
  );
  await page
    .locator('#plain-control')
    .evaluate((el) => el.style.removeProperty('--apollo-input-active-shadow'));

  for (const mode of ['object', 'string', 'array']) {
    await set({ native: mode });
    const rows = await capture(`native-${mode}`);
    for (const name of ['plain', 'affix', 'password']) {
      const row = rows.find((x) => x.family === name);
      check(`${mode} native root block ${name}`, row.root.variables['padding-block'], '8px');
    }
  }
  await set({ native: 'none', semantic: true });
  const semantic = await capture('semantic-styles');
  for (const row of semantic.filter((row) => row.family !== 'group')) {
    check(`semantic font consumes ${row.family}`, row.control.computed.fontSize, '19px');
  }
  await set({ semantic: false, css: true, theme: 'compact' });
  const css = await capture('stylesheet-private-variable');
  check(
    'stylesheet private variable remains usable',
    css.find((x) => x.family === 'plain').control.computed.paddingLeft,
    '21px',
  );
  await set({ css: false, providerStyle: true, theme: 'default' });
  const provider = await capture('provider-root-style');
  for (const name of ['plain', 'affix', 'password', 'textarea'])
    check(
      `Provider components style ${name}`,
      provider.find((x) => x.family === name).root.variables['padding-block'],
      '10px',
    );
  await set({
    providerStyle: false,
    source: 'compact',
    compactSize: 'small',
    providerSize: 'large',
  });
  const compact = await capture('compact-priority');
  const otp = compact.find((x) => x.family === 'otp');
  check(
    'OTP compact size beats global provider size',
    otp.root.className.includes('apollo-otp-sm'),
    true,
  );
  check('OTP input uses compact size', otp.control.className.includes('apollo-input-sm'), true);
  await set({
    source: 'local',
    size: 'large',
    providerSize: undefined,
    compactSize: undefined,
    theme: 'default',
  });
  const group = await capture('group-large');
  check(
    'Group large reaches actual nested Button',
    group.find((x) => x.family === 'group').groupButton.className.includes('apollo-btn-lg'),
    true,
  );
  await set({ overrideChild: true });
  const child = await capture('group-explicit-child');
  check(
    'Group size does not overwrite explicit child small',
    child.find((x) => x.family === 'group').control.computed.paddingTop,
    '0px',
  );
  await set({ overrideChild: false, size: 'middle', theme: 'default' });
  const first = await capture('autosize-default');
  const firstHeight = first.find((x) => x.family === 'autosize').control.rect.height;
  await set({ theme: 'compact' });
  const changed = await capture('autosize-theme-change');
  const auto = changed.find((x) => x.family === 'autosize').control;
  check('autosize remeasures when current theme changes', auto.rect.height !== firstHeight, true);
  check(
    'autosize has no clipping after theme change',
    auto.scrollHeight <= auto.rect.height - 2 + 1,
    true,
  );

  // Native styles must affect the actual logical control, including wrapped roots.
  for (const mode of ['object', 'string', 'array']) {
    await set({
      theme: 'compact',
      size: 'middle',
      native: mode,
      tokens: { paddingBlock: 3, inputFontSize: 12 },
    });
    const rows = await capture(`explicit-native-${mode}`);
    for (const family of [
      'plain',
      'affix',
      'password',
      'textarea',
      'textarea-affix',
      'legacy-addons',
    ]) {
      const row = rows.find((x) => x.family === family);
      check(`${mode} native font consumes ${family}`, row.control.computed.fontSize, '18px');
      check(
        `${mode} native padding consumes ${family}`,
        (family === 'affix' || family === 'password' ? row.root : row.control).computed.paddingTop,
        '8px',
      );
    }
  }
  await set({ native: 'none', tokens: { inputFontSize: 20 }, theme: 'default' });
  let rows = await capture('font-only-derives-padding');
  check(
    'explicit font changes default padding without fixed height',
    Math.abs(
      Number.parseFloat(rows.find((x) => x.family === 'plain').control.computed.paddingTop) - 0,
    ) < 0.02,
    true,
  );
  check(
    'explicit large font keeps its natural line box',
    rows.find((x) => x.family === 'plain').control.rect.height > 32,
    true,
  );
  await set({ tokens: { paddingBlock: 10 }, size: 'small', theme: 'compact' });
  rows = await capture('small-explicit-default-field');
  await set({ size: 'middle' });
  rows = await capture('explicit-padding-natural-search');
  let search = rows.find((x) => x.family === 'search');
  check(
    'Search stretches for explicit Input padding',
    Math.abs(search.searchButton.rect.height - search.control.rect.height) < 0.02,
    true,
  );
  check('explicit padding enlarges natural Input', search.control.rect.height > 28, true);
  await set({ tokens: {}, lineHeight: '2.5', size: 'small' });
  rows = await capture('explicit-small-line-height');
  search = rows.find((x) => x.family === 'search');
  check('explicit line height is preserved', search.control.computed.lineHeight, '30px');
  check('Search follows larger explicit line height', search.searchButton.rect.height, 32);
  for (const customButton of [false, true]) {
    await set({ customButton, buttonHeight: '60px' });
    rows = await capture(`caller-button-height-${customButton}`);
    check(
      `caller button height wins ${customButton}`,
      rows.find((x) => x.family === 'search').searchButton.rect.height,
      60,
    );
  }
  for (const buttonTheme of ['default', 'dark', 'compact', 'both']) {
    await set({ theme: buttonTheme });
    for (const size of ['small', 'middle', 'large'])
      for (const customButton of [false, true]) {
        for (const [height, minHeight, expected] of [
          ['18px', undefined, 18],
          ['18px', '36px', 36],
          ['18px', '60px', 60],
        ]) {
          await set({ size, customButton, buttonHeight: height, buttonMinHeight: minHeight });
          rows = await capture(
            `caller-button-boundary-${buttonTheme}-${size}-${customButton}-${minHeight ?? 'none'}`,
          );
          check(
            `caller height/min-height consume ${buttonTheme} ${size} ${customButton} ${minHeight ?? 'none'}`,
            rows.find((x) => x.family === 'search').searchButton.rect.height,
            expected,
          );
        }
      }
  }
  await set({
    customButton: false,
    buttonHeight: undefined,
    buttonMinHeight: undefined,
    lineHeight: undefined,
    size: 'middle',
    theme: 'default',
    tokens: {},
  });
  const autoLocator = page.locator('[data-family="autosize"] textarea');
  await autoLocator.fill('A long draft with enough text to wrap across several lines. '.repeat(5));
  await set({ rootWidth: 520 });
  const wide = await capture('autosize-wide');
  const wideHeight = wide.find((x) => x.family === 'autosize').control.rect.height;
  await set({ rootWidth: 180 });
  const narrow = await capture('autosize-narrow');
  const narrowAuto = narrow.find((x) => x.family === 'autosize').control;
  check('autoSize remeasures when width changes', narrowAuto.rect.height > wideHeight, true);
  check(
    'autoSize width reflow has no clipping',
    narrowAuto.scrollHeight <= narrowAuto.rect.height - 2 + 1,
    true,
  );
  await autoLocator.focus();
  await autoLocator.evaluate((el) => el.setSelectionRange(4, 9));
  const eventsBefore = await page.evaluate(() => window.inputSizing.events.length);
  await set({ theme: 'compact' });
  rows = await capture('autosize-draft-theme');
  const draft = rows.find((x) => x.family === 'autosize').control;
  check(
    'theme changes preserve edited TextArea draft',
    draft.value.startsWith('A long draft'),
    true,
  );
  check(
    'theme changes preserve focus and selection',
    await autoLocator.evaluate((el) => [
      document.activeElement === el,
      el.selectionStart,
      el.selectionEnd,
    ]),
    [true, 4, 9],
  );
  const eventsAfter = await page.evaluate(() => window.inputSizing.events.length);
  await capture('autosize-settled');
  check(
    'autoSize does not loop resize callbacks after settling',
    await page.evaluate(() => window.inputSizing.events.length),
    eventsAfter,
  );
  check('changed layout emits resize', eventsAfter > eventsBefore, true);
  await set({ autoLimits: { minRows: 2, maxRows: 3 } });
  rows = await capture('autosize-max-rows');
  const capped = rows.find((x) => x.family === 'autosize').control;
  check('maxRows limits the actual measured height', capped.rect.height <= 68, true);
  check(
    'maxRows permits scrolling for excess content',
    capped.scrollHeight > capped.rect.height,
    true,
  );
  await set({ autoLimits: false });
  rows = await capture('autosize-disabled');
  check(
    'disabling autoSize clears measured height',
    rows.find((x) => x.family === 'autosize').control.inlineHeight,
    '',
  );
  for (let cycle = 0; cycle < 2; cycle++) {
    await set({ visible: false });
    check(
      `conditional unmount removes all controls ${cycle}`,
      await page.locator('[data-family]').count(),
      0,
    );
    await set({ visible: true, autoLimits: true, rootWidth: 520 });
    rows = await capture(`remount-${cycle}`);
    check(
      `remounted autoSize measures current theme ${cycle}`,
      rows.find((x) => x.family === 'autosize').control.scrollHeight <=
        rows.find((x) => x.family === 'autosize').control.rect.height - 1,
      true,
    );
  }
  // No Vue state update or input event may be needed for native ancestor styling.
  await set({ theme: 'default', size: 'middle', rootWidth: 520, autoLimits: true });
  await page.addStyleTag({
    content: `
    .sizing-native-font [data-family="autosize"] textarea:not([data-auto-peer]){--apollo-input-input-font-size:24px;}
    .sizing-native-roomy [data-family="autosize"] textarea:not([data-auto-peer]){--apollo-input-input-font-size:24px;--apollo-input-padding-block:12px;}
    [data-family="autosize"].sizing-native-inline textarea:not([data-auto-peer]){--apollo-input-input-font-size:var(--sizing-font,14px);--apollo-input-padding-block:var(--sizing-block,4px);}
    .sizing-native-reparent textarea{--apollo-input-input-font-size:20px;--apollo-input-padding-block:8px;}
    .sizing-native-reparent.roomy textarea{--apollo-input-input-font-size:28px;--apollo-input-padding-block:14px;}
    textarea[data-auto-peer].sizing-peer-roomy{--apollo-input-input-font-size:24px;--apollo-input-padding-block:12px;}
  `,
  });
  const nativeAuto = page.getByRole('textbox', { name: 'autosize', exact: true });
  const nativeSnapshot = () =>
    nativeAuto.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      width: el.getBoundingClientRect().width,
      client: el.clientHeight,
      scroll: el.scrollHeight,
      font: getComputedStyle(el).fontSize,
      value: el.value,
      focused: el === document.activeElement,
      selection: [el.selectionStart, el.selectionEnd],
      events: window.inputSizing.events.length,
    }));
  await nativeAuto.focus();
  await nativeAuto.evaluate((el) => el.setSelectionRange(2, 7));
  const nativeBefore = await nativeSnapshot();
  for (const name of ['sizing-native-font', 'sizing-native-roomy']) {
    await page.evaluate((name) => {
      document.documentElement.classList.remove('sizing-native-font', 'sizing-native-roomy');
      document.documentElement.classList.add(name);
    }, name);
    await capture(`ancestor-${name}`);
    const after = await nativeSnapshot();
    check(`native ancestor ${name} changes font`, after.font, '24px');
    check(
      `native ancestor ${name} keeps width`,
      Math.abs(after.width - nativeBefore.width) < 0.02,
      true,
    );
    check(
      `native ancestor ${name} remeasures without clipping`,
      after.scroll <= after.client + 1,
      true,
    );
    check(
      `native ancestor ${name} preserves draft/focus/selection`,
      [after.value, after.focused, after.selection],
      ['First line\nSecond line', true, [2, 7]],
    );
  }
  await page.evaluate(() =>
    document.documentElement.classList.remove('sizing-native-font', 'sizing-native-roomy'),
  );
  await capture('ancestor-class-removed');
  check(
    'removing ancestor class restores measured natural height',
    (await nativeSnapshot()).height,
    nativeBefore.height,
  );
  const transitionSheet = await page.addStyleTag({
    content:
      '[data-family="autosize"] textarea:not([data-auto-peer]){transition:font-size 0.05s linear,padding 0.05s linear!important;}',
  });
  await page.evaluate(() => document.documentElement.classList.add('sizing-native-roomy'));
  await capture('native-animated-sizing');
  const animated = await nativeSnapshot();
  check(
    'native animated sizing settles without clipping',
    [animated.font, animated.scroll <= animated.client + 1],
    ['24px', true],
  );
  await page.evaluate(() => document.documentElement.classList.remove('sizing-native-roomy'));
  await capture('native-animated-sizing-restored');
  await transitionSheet.evaluate((el) => el.remove());
  await page.locator('[data-family="autosize"]').evaluate((el) => {
    el.classList.add('sizing-native-inline');
    el.style.setProperty('--sizing-font', '24px');
    el.style.setProperty('--sizing-block', '12px');
  });
  await capture('ancestor-inline-variables');
  const inlineAfter = await nativeSnapshot();
  check(
    'native ancestor inline variables remeasure at the same width',
    [
      Math.abs(inlineAfter.width - nativeBefore.width) < 0.02,
      inlineAfter.scroll <= inlineAfter.client + 1,
      inlineAfter.height > nativeBefore.height,
    ],
    [true, true, true],
  );
  const beforeUnrelated = inlineAfter.events;
  await page.locator('[data-family="autosize"]').evaluate((el) => {
    el.style.color = 'rgb(80,90,100)';
    el.classList.add('unrelated-native-state');
    el.setAttribute('data-current', 'a');
  });
  await capture('ancestor-unrelated');
  check(
    'unrelated ancestor mutations do not emit another resize',
    (await nativeSnapshot()).events,
    beforeUnrelated,
  );
  await page.locator('[data-family="autosize"]').evaluate((el) => {
    el.classList.remove('sizing-native-inline');
    el.style.removeProperty('--sizing-font');
    el.style.removeProperty('--sizing-block');
  });
  await capture('ancestor-inline-removed');
  // Moving an existing native node must rebind observation to its new ancestry.
  await nativeAuto.evaluate((el) => {
    const host = document.createElement('div');
    host.className = 'sizing-native-reparent';
    host.style.width = `${el.getBoundingClientRect().width}px`;
    document.body.append(host);
    window.sizingMove = { el, parent: el.parentNode, next: el.nextSibling, host };
    host.append(el);
  });
  await capture('native-reparent');
  const moved = await nativeSnapshot();
  check(
    'native reparent applies its actual sizing without clipping',
    moved.scroll <= moved.client + 1,
    true,
  );
  await page.locator('.sizing-native-reparent').evaluate((el) => el.classList.add('roomy'));
  await capture('native-reparent-font-change');
  const movedAgain = await nativeSnapshot();
  check(
    'new ancestor remains observed after reparent',
    [movedAgain.font, movedAgain.scroll <= movedAgain.client + 1, movedAgain.height > moved.height],
    ['28px', true, true],
  );
  await page.evaluate(() => {
    const { el, parent, next, host } = window.sizingMove;
    parent.insertBefore(el, next);
    host.remove();
    delete window.sizingMove;
  });
  await capture('native-reparent-restored');
  await set({ autoPeer: true });
  const peer = page.locator('textarea[data-auto-peer]');
  const peerSnapshot = () =>
    peer.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      client: el.clientHeight,
      scroll: el.scrollHeight,
      value: el.value,
      events: window.inputSizing.peerEvents.length,
    }));
  const peerBefore = await peerSnapshot();
  await page.evaluate(() => document.documentElement.classList.add('sizing-native-roomy'));
  await capture('native-multiple-instances');
  const peerUnchanged = await peerSnapshot();
  check('native ancestor change keeps the other instance independent', peerUnchanged, peerBefore);
  await set({ autoMain: false });
  check('conditional primary unmount keeps the peer', await peer.count(), 1);
  await peer.evaluate((el) => el.classList.add('sizing-peer-roomy'));
  await capture('native-surviving-peer');
  const surviving = await peerSnapshot();
  check(
    'surviving instance still observes its own style',
    [
      surviving.scroll <= surviving.client + 1,
      surviving.height > peerBefore.height,
      surviving.value,
    ],
    [true, true, 'Independent\nDraft'],
  );
  await page.evaluate(() => document.documentElement.classList.remove('sizing-native-roomy'));
  await set({ autoMain: true, autoPeer: false });
  for (let cycle = 0; cycle < 2; cycle++) {
    await set({ autoMain: false });
    await set({ autoMain: true });
    await page.evaluate(() => document.documentElement.classList.add('sizing-native-roomy'));
    await capture(`native-remount-${cycle}`);
    const remounted = await nativeSnapshot();
    check(
      `remounted instance observes native ancestor ${cycle}`,
      [remounted.font, remounted.scroll <= remounted.client + 1],
      ['24px', true],
    );
    await page.evaluate(() => document.documentElement.classList.remove('sizing-native-roomy'));
    await capture(`native-remount-restored-${cycle}`);
  }
  await set({ demo: true, theme: 'default', size: 'middle' });
  const demoInput = page.getByRole('textbox', { name: '令牌示例输入框', exact: true });
  check(
    'real Demo stylesheet padding remains effective',
    await demoInput.evaluate((el) => getComputedStyle(el).paddingLeft),
    '16px',
  );
  await page.getByRole('button', { name: '紧凑主题', exact: true }).click();
  check(
    'real Demo toggles current compact font',
    await demoInput.evaluate((el) => getComputedStyle(el).fontSize),
    '12px',
  );
  await page.getByRole('button', { name: '增大内边距与前缀间距', exact: true }).click();
  check(
    'real Demo component padding consumes',
    await demoInput.evaluate((el) => getComputedStyle(el).paddingTop),
    '8px',
  );
  check(
    'real Demo component affix spacing consumes',
    await page
      .locator('.demo-input-token .apollo-input-prefix')
      .evaluate((el) => getComputedStyle(el).marginInlineEnd),
    '10px',
  );
  const demoText = page.getByRole('textbox', { name: '主题自适应文本域', exact: true });
  await demoText.fill('业务草稿保留，改变当前主题和内边距。');
  await page.getByRole('button', { name: '紧凑主题', exact: true }).click();
  check(
    'real Demo keeps edited TextArea content',
    await demoText.inputValue(),
    '业务草稿保留，改变当前主题和内边距。',
  );
  await page.getByRole('button', { name: '祖先样式切换', exact: true }).click();
  await capture('real-demo-native-ancestor');
  check(
    'real Demo ancestor class changes actual textarea font',
    await demoText.evaluate((el) => getComputedStyle(el).fontSize),
    '20px',
  );
  check(
    'real Demo ancestor class changes actual textarea padding',
    await demoText.evaluate((el) => getComputedStyle(el).paddingTop),
    '10px',
  );
  check(
    'real Demo ancestor class remeasures without clipping',
    await demoText.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
    true,
  );
  check(
    'real Demo ancestor class keeps edited content',
    await demoText.inputValue(),
    '业务草稿保留，改变当前主题和内边距。',
  );
  await page.getByRole('button', { name: '祖先样式切换', exact: true }).click();
  for (const theme of ['default', 'dark', 'compact', 'both']) {
    await set({ theme });
    check(
      `real Demo current font ${theme}`,
      await demoInput.evaluate((el) => getComputedStyle(el).fontSize),
      theme === 'compact' || theme === 'both' ? '12px' : '14px',
    );
    check(
      `real Demo keeps its stylesheet override ${theme}`,
      await demoInput.evaluate((el) => getComputedStyle(el).paddingLeft),
      '16px',
    );
    check(
      `real Demo current padding ${theme}`,
      await demoInput.evaluate((el) => getComputedStyle(el).paddingTop),
      '8px',
    );
    check(
      `real Demo keeps draft ${theme}`,
      await demoText.inputValue(),
      '业务草稿保留，改变当前主题和内边距。',
    );
    check(
      `real Demo actual text contrast ${theme}`,
      await page.evaluate(() => window.inputSizing.contrast()),
      [],
    );
  }
  await page.screenshot({ path: path.join(root, `${phase}-${cssMode}-demo.png`), fullPage: true });
  await set({ sourceContracts: true });
  for (const source of [
    'css',
    'empty',
    'through-cp',
    'nearest',
    'factory',
    'legacy',
    'config-priority',
  ])
    for (const kind of ['input', 'textarea']) {
      const node = page.locator(`[data-source-consumer="${source}-${kind}"]`);
      const actual = await node.evaluate((el) => ({
        font: getComputedStyle(el).fontSize,
        height: el.getBoundingClientRect().height,
        inlineFont: el.style.getPropertyValue('--apollo-font-size'),
      }));
      check(
        `${source} ${kind} actual source font`,
        actual.font,
        source === 'css' ? '12px' : '14px',
      );
      check(`${source} ${kind} actual source height`, actual.height, source === 'css' ? 28 : 32);
      check(
        `${source} ${kind} data source identity`,
        actual.inlineFont,
        source === 'css' ? '' : '14px',
      );
    }
  const cssSource = page.locator('[data-source-consumer="css-input"]');
  await cssSource.fill('CSS-only edited draft');
  await cssSource.focus();
  await cssSource.evaluate((el) => {
    window.sizingSourceNode = el;
    el.setSelectionRange(2, 6);
  });
  await set({ sourceCPTheme: { token: { fontSize: 18 } } });
  check(
    'CSS-only CP activates an explicit source',
    await cssSource.evaluate((el) => getComputedStyle(el).fontSize),
    '18px',
  );
  await set({ sourceCPTheme: {} });
  check(
    'explicit empty CP source supplies default data',
    await cssSource.evaluate((el) => el.style.getPropertyValue('--apollo-font-size')),
    '14px',
  );
  await set({ sourceCPTheme: undefined });
  check(
    'removing CP theme restores CSS-only font',
    await cssSource.evaluate((el) => getComputedStyle(el).fontSize),
    '12px',
  );
  check(
    'removing CP theme clears source data',
    await cssSource.evaluate((el) => el.style.getPropertyValue('--apollo-font-size')),
    '',
  );
  check(
    'source activation and removal preserve native draft focus and selection',
    await cssSource.evaluate((el) => [
      el === window.sizingSourceNode,
      el.value,
      document.activeElement === el,
      el.selectionStart,
      el.selectionEnd,
    ]),
    [true, 'CSS-only edited draft', true, 2, 6],
  );
  await page.evaluate(() => delete window.sizingSourceNode);
  await page.evaluate(() => window.inputSizing.unmount());
  check(
    'application unmount removes owned controls',
    await page.locator('[data-family]').count(),
    0,
  );
  const after = fingerprint();
  assert.deepEqual(after, before);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(forbidden, []);
  if (devServer) assert.equal(vueModuleUrls.size, 1, 'Source dev must load one Vue runtime');
} catch (error) {
  console.error(JSON.stringify({ errors, warnings, steps: steps.length }));
  throw error;
} finally {
  await browser?.close();
  if (server) {
    if (devServer) await server.close();
    else await new Promise((resolve) => server.httpServer.close(resolve));
  }
  const summary = {
    phase,
    cssMode,
    steps: steps.length,
    total: checks.length,
    passed: checks.filter((c) => c.passed).length,
    failed: checks.filter((c) => !c.passed).length,
    errors,
    warnings,
    expectedDeprecations,
    vueModuleUrls: [...vueModuleUrls],
    before,
    after: fingerprint(),
    sourceUnchanged: JSON.stringify(before) === JSON.stringify(fingerprint()),
    packageBuildRun: false,
    fixtureBundleRun: !devServer,
    viteBuildRun: !devServer,
    devServer,
    distWritten: false,
    readersExited: true,
    forbidden,
    sourceFallback: phase === 'published' ? forbidden.length > 0 : undefined,
    resolvedDemoModules: [...resolvedDemos].sort(),
    resolvedModuleCount: resolvedSources.size,
  };
  writeFileSync(
    path.join(root, `${phase}-${cssMode}-evidence.json`),
    `${JSON.stringify({ ...summary, checks, steps }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(root, `${phase}-${cssMode}-summary.json`),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(JSON.stringify({ ...summary, checks: checks.filter((c) => !c.passed) }, null, 2));
}
assert.ok(checks.length >= 163);
if (checks.some((c) => !c.passed)) process.exitCode = 1;
