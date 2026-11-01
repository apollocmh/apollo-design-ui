import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const started = performance.now();
const publishedConsumer = process.argv[2];
assert.ok(
  publishedConsumer,
  'Usage: theme-matrix.mjs <installed-consumer> [fresh-output-directory]',
);
const output = resolve(process.argv[3] ?? mkdtempSync('/tmp/apollo-theme-published-matrix-'));
mkdirSync(output, { recursive: true });
const require = createRequire(resolve(publishedConsumer, 'package.json'));
const manifest = require('@apollo-design/ui/style-manifest.json');
symlinkSync(resolve(publishedConsumer, 'node_modules'), resolve(output, 'node_modules'), 'dir');
writeFileSync(
  resolve(output, 'package.json'),
  '{"name":"apollo-published-theme-matrix","private":true,"type":"module"}\n',
);
writeFileSync(
  resolve(output, 'tools.mjs'),
  `export { build } from 'vite';export { default as vue } from '@vitejs/plugin-vue';export { default as Components } from 'unplugin-vue-components/vite';export { ApolloResolver } from '@apollo-design/ui-resolver';export {getDesignToken,getCSSVarDeclarations} from '@apollo-design/theme';export {defaultPreset} from '@apollo-design/theme/presets/default';export {monoPreset} from '@apollo-design/theme/presets/mono';export {material3Preset} from '@apollo-design/theme/presets/material3';`,
);
const {
  build,
  vue,
  Components,
  ApolloResolver,
  getDesignToken,
  getCSSVarDeclarations,
  defaultPreset,
  monoPreset,
  material3Preset,
} = await import(pathToFileURL(resolve(output, 'tools.mjs')).href);
const brand = {
  name: 'brand',
  token: { fontSize: 15, borderRadius: 5, fontFamily: 'Arial, sans-serif' },
  light: { token: { colorPrimary: '#006b60', colorBgBase: '#f8fffc', colorTextBase: '#15342c' } },
  dark: { token: { colorPrimary: '#1a786d', colorBgBase: '#0b1715', colorTextBase: '#ebfff9' } },
};
const presets = {
  default: defaultPreset,
  mono: monoPreset,
  material3: material3Preset,
  custom: brand,
};
const write = (file, text) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};
const families = ['button', 'input', 'select', 'popover', 'table'];
const resources = new Set(families.flatMap((family) => manifest.components[family].styles));
const manualCss = manifest.order.filter((resource) => resources.has(resource));
assert.equal(
  manualCss.length,
  resources.size,
  'Public manifest must order the complete manual structural closure',
);
const named = [
  'ConfigProvider',
  'Button',
  'Input',
  'Select',
  'Popover',
  'Table',
  'Summary',
  'TableSummaryRow',
  'TableSummaryCell',
];
const publicName = (name) => (name === 'Summary' ? 'ATableSummary' : `A${name}`);
const publicPath = {
  ConfigProvider: 'config-provider',
  Button: 'button',
  Input: 'input',
  Select: 'select',
  Popover: 'popover',
  Table: 'table',
  Summary: 'table',
  TableSummaryRow: 'table',
  TableSummaryCell: 'table',
};
const commonCss = `html,body{margin:0;min-height:100%;background:var(--apollo-color-bg-layout);color:var(--apollo-color-text);font-family:var(--apollo-font-family)}*{box-sizing:border-box}.matrix-page{max-width:920px;margin:0 auto;padding:24px;display:grid;gap:18px;background:var(--apollo-color-bg-container);color:var(--apollo-color-text)}.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}h1{margin:0;font-size:22px}.matrix-select{width:220px;max-width:100%}.info{margin:0;font-size:14px}.native-mode{padding:6px 10px;color:inherit;background:transparent;border:1px solid currentColor;border-radius:4px;justify-self:start}@media(max-width:480px){.matrix-page{padding:16px}.fields{grid-template-columns:1fr}}`;
const records = [];
const settleMotion = (page) =>
  page.evaluate(async () => {
    document.body.getBoundingClientRect();
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
let browser, server, failure;
try {
  for (const method of ['aggregate', 'manual', 'resolver'])
    for (const [kind, preset] of Object.entries(presets))
      for (const mode of ['light', 'dark']) {
        const id = `${method}-${kind}-${mode}`;
        const root = resolve(output, id);
        write(resolve(root, 'package.json'), '{"type":"module"}\n');
        let imports =
          kind === 'custom'
            ? `import type {ThemePreset} from '@apollo-design/theme';const preset:ThemePreset=${JSON.stringify(preset)};import './preset.css';`
            : `import {${kind === 'default' ? 'defaultPreset' : kind === 'mono' ? 'monoPreset' : 'material3Preset'} as preset} from '@apollo-design/theme/presets/${kind}';import '@apollo-design/theme/presets/${kind}.css';`;
        if (method === 'aggregate')
          imports += `import {${named.map((name) => `${name} as ${publicName(name)}`).join(',')}} from '@apollo-design/ui';import '@apollo-design/ui/style.css';`;
        if (method === 'manual')
          imports +=
            named
              .map(
                (name) =>
                  `import {${name} as ${publicName(name)}} from '@apollo-design/ui/${publicPath[name]}';`,
              )
              .join('') + manualCss.map((style) => `import '${style}';`).join('');
        const app = `<script setup lang="ts">
import {ref} from 'vue';${imports}import './app.css';
const mode=ref<'light'|'dark'>('${mode}');const value=ref('');const open=ref(false);const selected=ref<string>();
const columns=[{title:'Name',dataIndex:'name',key:'name'},{title:'State',dataIndex:'state',key:'state'}];
const data=[{key:'one',name:'Ada',state:'Ready'},{key:'two',name:'Lin',state:'Waiting'}];
function toggle(){mode.value=mode.value==='light'?'dark':'light';document.documentElement.setAttribute('data-apollo-theme',mode.value);}
</script>
<template><AConfigProvider :theme="{preset,mode}"><main class="matrix-page" :data-mode="mode">
<h1>${kind} · ${method}</h1><p class="info">Published 0.1.8 · {{mode}}</p>
<div class="controls"><AButton type="primary" data-primary>Primary action</AButton><AButton disabled data-disabled>Disabled</AButton><APopover v-model:open="open" trigger="click" title="Theme panel" content="Owned overlay surface" placement="bottomLeft"><AButton data-popup-trigger>Open panel</AButton></APopover></div>
<div class="fields"><AInput v-model:value="value" data-entry placeholder="Keep a draft"/><AInput status="error" data-error placeholder="Error state"/></div>
<ASelect v-model:value="selected" :options="[{value:'alpha',label:'Alpha'},{value:'beta',label:'Beta'}]" placeholder="Choose an option" class="matrix-select"/>
<ATable :columns="columns" :data-source="data" :pagination="false"><template #summary><ATableSummary><ATableSummaryRow><ATableSummaryCell :index="0" :col-span="2">2 published rows</ATableSummaryCell></ATableSummaryRow></ATableSummary></template></ATable>
<button class="native-mode" data-toggle @click="toggle">Switch appearance</button>
</main></AConfigProvider></template>`;
        write(resolve(root, 'src/App.vue'), app);
        write(resolve(root, 'src/app.css'), commonCss);
        if (kind === 'custom')
          write(
            resolve(root, 'src/preset.css'),
            ['light', 'dark']
              .map((appearance) =>
                getCSSVarDeclarations(getDesignToken({ preset, mode: appearance }), {
                  selector: `:root[data-apollo-preset="brand"][data-apollo-theme="${appearance}"]`,
                }),
              )
              .join('\n'),
          );
        write(
          resolve(root, 'src/main.ts'),
          `import {createApp} from 'vue';import App from './App.vue';createApp(App).mount('#app');`,
        );
        write(
          resolve(root, 'index.html'),
          `<!doctype html><html data-apollo-preset="${preset.name}" data-apollo-theme="${mode}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${id}</title><link rel="icon" href="data:,"></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`,
        );
        const retained = [],
          css = [];
        const buildStart = performance.now();
        await build({
          root,
          base: './',
          configFile: false,
          logLevel: 'warn',
          plugins: [
            vue(),
            ...(method === 'resolver'
              ? [Components({ dirs: [], resolvers: [ApolloResolver()], dts: false })]
              : []),
            {
              name: 'inspect-single-preset',
              generateBundle(_options, bundle) {
                for (const item of Object.values(bundle)) {
                  if (item.type === 'chunk')
                    for (const [file, module] of Object.entries(item.modules))
                      if (module.renderedLength > 0) retained.push(file);
                  if (item.type === 'asset' && item.fileName.endsWith('.css'))
                    css.push(String(item.source));
                }
              },
            },
          ],
          build: { outDir: 'dist', emptyOutDir: true },
        });
        const presetModules = retained
          .filter((file) =>
            /@apollo-design\/theme\/dist\/presets\/(default|mono|material3)\.mjs$/.test(file),
          )
          .map((file) => file.match(/presets\/(default|mono|material3)\.mjs$/)[1]);
        assert.deepEqual(
          [...new Set(presetModules)],
          kind === 'custom' ? [] : [kind],
          `${id}: only the chosen preset value may be retained`,
        );
        assert.ok(
          !retained.some((file) => /\/(ui-resolver|unplugin-vue-components|unplugin)\//.test(file)),
          `${id}: build-time packages must not enter the browser`,
        );
        if (method !== 'aggregate')
          assert.ok(
            !css.some((text) => text.includes('.apollo-carousel')),
            `${id}: no aggregate component CSS fallback`,
          );
        records.push({
          id,
          method,
          kind,
          mode,
          root,
          presetModules,
          buildMs: Math.round(performance.now() - buildStart),
          expected: getDesignToken({ preset, mode }),
          opposite: getDesignToken({ preset, mode: mode === 'light' ? 'dark' : 'light' }),
        });
        console.log(`built ${id}`);
      }
  server = createHttpServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = resolve(output, `.${pathname}`);
    if (!file.startsWith(`${output}/`) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.setHeader(
      'Content-Type',
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
      }[extname(file)] ?? 'application/octet-stream',
    );
    response.end(readFileSync(file));
  });
  await new Promise((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = (await launchBrowser()).browser;
  for (const record of records) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const diagnostics = [];
    await page.addInitScript(() => {
      window.matrixErrors = [];
      window.addEventListener('error', (event) => window.matrixErrors.push(event.message));
      window.addEventListener('unhandledrejection', (event) =>
        window.matrixErrors.push(String(event.reason)),
      );
    });
    page.on('pageerror', (error) => diagnostics.push(error.message));
    page.on('console', (message) => {
      if (['warning', 'error'].includes(message.type())) diagnostics.push(message.text());
    });
    await page.goto(`${origin}/${record.id}/dist/index.html`);
    await page.locator('button[data-primary]').waitFor();
    const input = page.locator('input[data-entry]');
    await input.fill('draft retained');
    await settleMotion(page);
    const original = await input.elementHandle();
    const inspect = async (expected) =>
      page.evaluate((token) => {
        const normalized = (color) => {
          const probe = document.createElement('i');
          probe.style.color = color;
          document.body.appendChild(probe);
          const result = getComputedStyle(probe).color;
          probe.remove();
          return result;
        };
        const button = getComputedStyle(document.querySelector('[data-primary]'));
        const input = getComputedStyle(document.querySelector('input[data-entry]'));
        const error = getComputedStyle(document.querySelector('input[data-error]'));
        const disabled = getComputedStyle(document.querySelector('[data-disabled]'));
        const root = getComputedStyle(document.documentElement);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const luminance = (color, background = 'white') => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = background;
          context.fillRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const backgroundLuminance = luminance(button.backgroundColor);
        const textLuminance = luminance(button.color, button.backgroundColor);
        const actual = {
          primary: button.backgroundColor,
          primaryAlias: button.getPropertyValue('--apollo-color-primary').trim(),
          primaryContrast:
            (Math.max(backgroundLuminance, textLuminance) + 0.05) /
            (Math.min(backgroundLuminance, textLuminance) + 0.05),
          primaryText: button.color,
          fontSize: button.fontSize,
          radius: button.borderRadius,
          height: button.height,
          inputBg: input.backgroundColor,
          inputColor: input.color,
          errorBorder: error.borderColor,
          disabledBg: disabled.backgroundColor,
          disabledColor: disabled.color,
          tableHeader: getComputedStyle(document.querySelector('.apollo-table-thead th'))
            .backgroundColor,
          tableText: getComputedStyle(document.querySelector('.apollo-table-tbody td')).color,
        };
        const expected = {
          primaryAlias: token.colorPrimary,
          primaryText: normalized(token.colorTextLightSolid),
          fontSize: `${token.fontSize}px`,
          inputBg: normalized(token.colorBgContainer),
          inputColor: normalized(token.colorText),
        };
        return {
          actual,
          expected,
          rawPrimary: root.getPropertyValue('--apollo-color-primary').trim(),
          expectedRaw: token.colorPrimary,
        };
      }, expected);
    const initial = await inspect(record.expected);
    for (const [key, value] of Object.entries(initial.expected))
      assert.equal(initial.actual[key], value, `${record.id}: ${key}`);
    assert.ok(initial.actual.primaryContrast >= 4.5, `${record.id}: normal primary text contrast`);
    assert.equal(
      initial.rawPrimary,
      initial.expectedRaw,
      `${record.id}: selected static preset CSS`,
    );
    record.signature = initial.actual;
    await page.locator('[data-toggle]').click();
    await page
      .locator(`.matrix-page[data-mode="${record.mode === 'light' ? 'dark' : 'light'}"]`)
      .waitFor();
    await settleMotion(page);
    const switched = await inspect(record.opposite);
    for (const [key, value] of Object.entries(switched.expected))
      assert.equal(switched.actual[key], value, `${record.id}: switched ${key}`);
    assert.ok(
      switched.actual.primaryContrast >= 4.5,
      `${record.id}: switched primary text contrast`,
    );
    assert.equal(
      await input.inputValue(),
      'draft retained',
      `${record.id}: draft survives appearance change`,
    );
    assert.equal(
      await original.evaluate(
        (element) => element.isConnected && element === document.querySelector('input[data-entry]'),
      ),
      true,
      `${record.id}: editor identity`,
    );
    await page.locator('[data-toggle]').click();
    await page.locator(`.matrix-page[data-mode="${record.mode}"]`).waitFor();
    await settleMotion(page);
    await page.locator('[data-popup-trigger]').click();
    await page.locator('.apollo-popover-container').waitFor();
    await settleMotion(page);
    const popup = await page.locator('.apollo-popover-container').evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        background: style.backgroundColor,
        shadow: style.boxShadow,
        hit: !!hit?.closest('.apollo-popover'),
      };
    });
    const expectedPopup = await page.evaluate((color) => {
      const element = document.createElement('i');
      element.style.color = color;
      document.body.appendChild(element);
      const result = getComputedStyle(element).color;
      element.remove();
      return result;
    }, record.expected.colorBgElevated);
    assert.equal(popup.background, expectedPopup, `${record.id}: owned popup surface`);
    assert.equal(popup.hit, true, `${record.id}: popup is actually above the application`);
    record.popup = popup;
    if (record.method === 'resolver') {
      await input.focus();
      const shotDir = resolve(output, 'screenshots');
      mkdirSync(shotDir, { recursive: true });
      record.desktop = resolve(shotDir, `${record.kind}-${record.mode}-desktop.png`);
      await page.screenshot({ path: record.desktop, fullPage: true });
      await page.setViewportSize({ width: 390, height: 900 });
      await input.focus();
      record.mobile = resolve(shotDir, `${record.kind}-${record.mode}-mobile.png`);
      await page.screenshot({ path: record.mobile, fullPage: true });
      const box = await page.locator('.apollo-popover-container').boundingBox();
      assert.ok(
        box && box.x >= 0 && box.x + box.width <= 391,
        `${record.id}: mobile popup remains within viewport`,
      );
    }
    diagnostics.push(...(await page.evaluate(() => window.matrixErrors)));
    assert.deepEqual(diagnostics, [], `${record.id}: published browser diagnostics`);
    record.browserPassed = true;
    record.diagnostics = diagnostics;
    await page.close();
    console.log(`verified ${record.id}`);
  }
  for (const kind of Object.keys(presets))
    for (const mode of ['light', 'dark']) {
      const matching = records.filter((record) => record.kind === kind && record.mode === mode);
      assert.deepEqual(
        matching[1].signature,
        matching[0].signature,
        `${kind}/${mode}: manual and aggregate rendering styles`,
      );
      assert.deepEqual(
        matching[2].signature,
        matching[0].signature,
        `${kind}/${mode}: resolver and aggregate rendering styles`,
      );
    }
} catch (error) {
  failure = error;
} finally {
  await browser?.close();
  if (server) await new Promise((resolveClosed) => server.close(resolveClosed));
  const result = {
    exitCode: failure ? 1 : 0,
    durationMs: Math.round(performance.now() - started),
    output,
    packageVersions: {
      ui: require('@apollo-design/ui/package.json').version,
      theme: require('@apollo-design/theme/package.json').version,
      resolver: require('@apollo-design/ui-resolver/package.json').version,
    },
    tarballsFrom: publishedConsumer,
    scope:
      '3 import methods ×4 public preset/custom values ×2 appearances; single-preset chunk pruning, CSS, provider update/state retention and real owned popup. Screenshots representative resolver8 desktop+8 mobile require actual review.',
    records: records.map(({ expected, opposite, ...record }) => record),
    ...(failure ? { failure: failure.stack ?? String(failure) } : {}),
  };
  write(resolve(output, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(
    JSON.stringify({
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      output,
      failure: result.failure,
    }),
  );
  process.exitCode = result.exitCode;
}
