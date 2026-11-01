/** Focused source-only preset/Provider consumer check. Does not build or write package outputs. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../../..');
const output =
  process.env.THEME_PRESET_BROWSER_DIR ??
  fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-theme-preset-'));
fs.mkdirSync(output, { recursive: true });
const diagnostics = [];
const checks = [];
const started = performance.now();
let server, browser;
let styles = '';
function check(name, passed, actual) {
  checks.push({ name, passed, actual });
  assert.ok(passed, `${name}: ${JSON.stringify(actual)}`);
}
try {
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
  ];
  server = await createServer({
    configFile: false,
    root: repo,
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-theme-preset-vite-')),
    plugins: [
      vue(),
      {
        name: 'preset-source-page',
        configureServer(vite) {
          vite.middlewares.use('/__preset.css', (_request, response) => {
            response.setHeader('content-type', 'text/css');
            response.end(styles);
          });
          vite.middlewares.use('/__preset', async (_request, response, next) => {
            try {
              const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/__preset.css"><title>Preset scopes</title></head><body><main id="app"></main><script type="module">import * as api from '/${path.relative(repo, path.join(here, 'preset-browser-fixture.mjs'))}';window.preset=api;</script></body></html>`;
              response.setHeader('content-type', 'text/html');
              response.end(await vite.transformIndexHtml('/__preset', html));
            } catch (error) {
              next(error);
            }
          });
        },
      },
    ],
    resolve: {
      alias: [
        ...packages.map((name) => ({
          find: `@apollo-design/${name}`,
          replacement: path.join(repo, 'packages', name, 'src'),
        })),
        {
          find: /^vue$/,
          replacement: createRequire(import.meta.url).resolve(
            'vue/dist/vue.runtime.esm-bundler.js',
          ),
        },
      ],
      dedupe: ['vue'],
    },
    optimizeDeps: { entries: [path.join(here, 'preset-browser-fixture.mjs')] },
    server: { host: '127.0.0.1', port: 0, hmr: false },
    ssr: { external: ['vue', 'vue/server-renderer'] },
  });
  const source = await server.ssrLoadModule(path.join(repo, 'packages/ui/src/style/index.ts'));
  styles = source.genAllStyles();
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1160, height: 1000 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) =>
    diagnostics.push({ type: 'window.error', message: String(error) }),
  );
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning')
      diagnostics.push({ type: message.type(), message: message.text() });
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__preset`);
  await page.waitForFunction(() => Boolean(window.preset));
  check(
    'No default token stylesheet or html projection',
    await page.evaluate(
      () =>
        getComputedStyle(document.documentElement).getPropertyValue('--apollo-color-primary') ===
        '',
    ),
    await page.evaluate(() => [...document.styleSheets].map((sheet) => sheet.href)),
  );
  const editor = page.locator('[data-theme-scope="mono"] input').first();
  await editor.fill('Persistent preset draft');
  await editor.focus();
  await page.evaluate(() => {
    window.originalEditor = document.querySelector('[aria-label="mono draft"]');
  });
  for (const appearance of ['light', 'dark']) {
    await page.evaluate((mode) => window.preset.setAppearance(mode), appearance);
    // The existing slow token is 0.3s. Measure settled colors rather than a
    // partially interpolated light/dark frame.
    await page.waitForTimeout(350);
    const scopes = await page.evaluate(() =>
      [...document.querySelectorAll('[data-theme-scope]')].map((scope) => {
        const name = scope.dataset.themeScope,
          expected = window.preset.expected(name);
        const css = getComputedStyle(scope),
          button = getComputedStyle(scope.querySelector('.apollo-btn-primary'));
        const input = getComputedStyle(scope.querySelector('.apollo-input'));
        const select = getComputedStyle(scope.querySelector('.apollo-select'));
        const reference = document.createElement('span');
        reference.style.color = expected.background;
        scope.append(reference);
        const background = getComputedStyle(reference).color;
        reference.remove();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const luminance = (color) => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const pixels = context.getImageData(0, 0, 1, 1).data;
          const linear = [...pixels].slice(0, 3).map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        };
        const contrast = (foreground, backdrop) => {
          const values = [luminance(foreground), luminance(backdrop)];
          return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
        };
        return {
          name,
          expected,
          actual: {
            background: css.backgroundColor,
            font: css.fontSize,
            family: css.fontFamily,
            shadow: css.boxShadow,
            radius: button.borderRadius,
            buttonBackground: button.backgroundColor,
            buttonColor: button.color,
            inputBackground: input.backgroundColor,
            selectBackground: select.backgroundColor,
            primaryContrast: contrast(button.color, button.backgroundColor),
            statusContrast: [...scope.querySelectorAll('[data-status]')].map((element) => ({
              name: element.dataset.status,
              ratio: contrast(getComputedStyle(element).color, css.backgroundColor),
            })),
          },
          background,
        };
      }),
    );
    check(
      `${appearance}: four independent public theme scopes`,
      scopes.every(
        (scope) =>
          scope.actual.background === scope.background &&
          scope.actual.inputBackground === scope.background &&
          scope.actual.selectBackground === scope.background &&
          scope.actual.font === scope.expected.font &&
          scope.actual.radius === scope.expected.radius,
      ),
      scopes,
    );
    check(
      `${appearance}: new preset normal-text semantic colors retain contrast`,
      scopes
        .filter((scope) => scope.name === 'mono' || scope.name === 'material3')
        .every(
          (scope) =>
            scope.actual.primaryContrast >= 4.5 &&
            scope.actual.statusContrast.every((status) => status.ratio >= 4.5),
        ),
      scopes.map((scope) => ({
        name: scope.name,
        primaryContrast: scope.actual.primaryContrast,
        status: scope.actual.statusContrast,
      })),
    );
    const kept = await page.evaluate(() => {
      const input = document.querySelector('[aria-label="mono draft"]');
      return {
        same: input === window.originalEditor,
        draft: input.value,
        focused: document.activeElement === input,
      };
    });
    check(
      `${appearance}: original draft and focus`,
      kept.same && kept.draft === 'Persistent preset draft' && kept.focused,
      kept,
    );
    await page.screenshot({ path: path.join(output, `${appearance}.png`), fullPage: true });
  }
  await page.evaluate(() => window.preset.openPortal('mono'));
  const tooltip = page.locator('.apollo-tooltip').first();
  await tooltip.waitFor({ state: 'visible' });
  let state = await tooltip.evaluate((element) => ({
    family: getComputedStyle(element).fontFamily,
    font: getComputedStyle(element).fontSize,
    outside: !element.closest('[data-theme-scope]') && document.body.contains(element),
  }));
  const expected = await page.evaluate(() => window.preset.expected('mono'));
  check(
    'Portaled tooltip uses current Mono source without default tokens.css',
    state.family.includes('monospace') && state.font === expected.font && state.outside,
    state,
  );
  await page.evaluate(() => window.preset.openNotices('mono'));
  await page.locator('[aria-label="mono message draft"]').waitFor();
  await page.locator('[aria-label="mono notification draft"]').waitFor();
  await page.locator('[aria-label="mono message draft"]').fill('Kept message');
  await page.evaluate(() => {
    window.messageEditor = document.querySelector('[aria-label="mono message draft"]');
  });
  await page.evaluate(() => window.preset.setAppearance('light'));
  state = await page.evaluate(() => {
    const message = document.querySelector('.apollo-message-notice');
    const notification = document.querySelector('.apollo-notification-notice');
    return {
      messageBackground: getComputedStyle(message).backgroundColor,
      messageFamily: getComputedStyle(message).fontFamily,
      notificationFamily: getComputedStyle(notification).fontFamily,
      same: window.messageEditor === document.querySelector('[aria-label="mono message draft"]'),
      draft: window.messageEditor.value,
    };
  });
  check(
    'Message and Notification keep scoped tokens and the existing editor on appearance updates',
    state.messageFamily.includes('monospace') &&
      state.notificationFamily.includes('monospace') &&
      state.same &&
      state.draft === 'Kept message',
    state,
  );
  await page.evaluate(() => window.preset.closeOverlays());
  await page.evaluate(() => window.preset.clear());
  check('Strict native diagnostics', diagnostics.length === 0, diagnostics);
} catch (error) {
  process.exitCode = 1;
  console.error(error);
} finally {
  await browser?.close();
  await server?.close();
  fs.writeFileSync(
    path.join(output, 'result.json'),
    `${JSON.stringify({ mode: 'source-only', passed: !process.exitCode, durationMs: Math.round(performance.now() - started), checks, diagnostics }, null, 2)}\n`,
  );
  console.log(
    JSON.stringify({
      output,
      passed: !process.exitCode,
      checks: checks.length,
      durationMs: Math.round(performance.now() - started),
    }),
  );
}
