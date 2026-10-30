/** Source-only consumer CSS/context and actual nested Tooltip integration. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const root = await mkdtemp(path.join(tmpdir(), 'apollo-consumer-z-index-'));
const alias = Object.fromEntries(
  [
    'ui',
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
  ].map((name) => [`@apollo-design/${name}`, path.join(repo, 'packages', name, 'src')]),
);
alias.vue = path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js');
let server;
let browser;
let page;
const diagnostics = [];
const results = [];
let activeCase = 'startup';
let functionalResult = 'incomplete';
try {
  await writeFile(
    path.join(root, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Consumer stacking</title><link rel="icon" href="data:,"><style>*,*::before,*::after{transition:none!important;animation:none!important}body{margin:160px 200px;font-family:sans-serif}</style></head><body><main id="app"></main><script type="module">
import {mountConsumerStack} from '/@fs${repo}/packages/ui/src/_internal/__tests__/fixtures/consumer-z-index-browser.mjs';
window.consumerStack=mountConsumerStack('#app');
</script></body></html>`,
  );
  server = await createServer({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, root] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  page.setDefaultTimeout(10_000);
  await page.addInitScript(() => {
    window.consumerBrowserErrors = [];
    // Vite can handle window.error before Playwright emits pageerror.
    window.addEventListener('error', (event) => window.consumerBrowserErrors.push(event.message));
  });
  page.on('pageerror', (error) => diagnostics.push({ type: 'pageerror', message: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning')
      diagnostics.push({ type: `console.${message.type()}`, message: message.text() });
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.consumerStack);
  const read = () => page.evaluate(() => window.consumerStack.read());
  const patch = (kind) => page.evaluate((value) => window.consumerStack.patch(value), kind);
  const expectLayer = async (expected) => {
    await page.waitForFunction((value) => {
      const state = window.consumerStack.read();
      return (
        state?.visual === String(value) &&
        state.context === String(value) &&
        state.tooltipVisual === String(value + 100) &&
        state.tooltipContext === String(value + 100) &&
        state.tooltipVisible
      );
    }, expected);
    const state = await read();
    assert.equal(state.visual, String(expected));
    assert.equal(state.context, String(expected));
    assert.equal(state.tooltipVisual, String(expected + 100));
    assert.equal(state.tooltipContext, String(expected + 100));
    assert.equal(state.tooltipVisible, true);
    assert.equal(state.tooltipHit, true, 'The actual nested Tooltip must be on top at its center');
    return state;
  };
  for (const name of [
    'Dropdown',
    'DatePicker',
    'RangePicker',
    'TreeSelect',
    'Mentions',
    'ImagePreview',
  ]) {
    activeCase = name;
    await page.evaluate((value) => window.consumerStack.show(value), name);
    const base = name === 'ImagePreview' ? 1080 : 1050;
    const initial = await expectLayer(base);
    assert.equal(initial.cssToken, String(base), `${name}: ${JSON.stringify(initial)}`);
    assert.equal(initial.position, name === 'ImagePreview' ? 'fixed' : 'absolute');
    await patch('zero');
    await expectLayer(0);
    await patch('clearCustom');
    await expectLayer(base);
    if (name === 'Mentions' || name === 'ImagePreview') {
      await patch('tokens');
      await expectLayer(name === 'Mentions' ? 3060 : 3080);
      await patch('replaceTokens');
      await expectLayer(name === 'Mentions' ? 4060 : 4080);
      await patch('clearTokens');
      await expectLayer(base);
    }
    results.push({
      consumer: name,
      cssTokenOwner: initial.cssTokenOwner,
      defaultVisualAndContext: base,
      explicitZero: true,
      nestedTooltip: true,
    });
  }
  activeCase = 'Mentions CSS expression preservation';
  await page.evaluate(() => window.consumerStack.show('Mentions'));
  await patch('expressionToken');
  const expressionToken = await read();
  assert.equal(expressionToken.inlineCssToken, 'var(--consumer-expression-layer)');
  assert.equal(expressionToken.cssToken, '2460');
  assert.equal(expressionToken.inlineZIndex, '');
  assert.equal(expressionToken.visual, '2460');
  await patch('expressionStyle');
  const expressionStyle = await read();
  assert.equal(expressionStyle.inlineZIndex, 'var(--consumer-expression-layer)');
  assert.equal(expressionStyle.visual, '2460');
  assert.equal(await page.evaluate(() => window.consumerStack.unmount()), true);
  functionalResult = 'passed';
  const windowErrors = await page.evaluate(() => window.consumerBrowserErrors);
  const resizeObserverDiagnostics = [
    ...diagnostics.map(({ message }) => message),
    ...windowErrors,
  ].filter((message) => message.includes('ResizeObserver'));
  console.log(
    JSON.stringify(
      {
        functionalResult,
        browser: browser.version(),
        durationMs: Math.round(performance.now() - started),
        results,
        tokenReplacement: ['Mentions', 'ImagePreview'],
        cssExpressions: 'style preserved; descendant stacking deferred',
        diagnostics,
        windowErrors,
        resizeObserverDiagnostics,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(diagnostics, [], 'Strict browser diagnostics gate');
  assert.deepEqual(windowErrors, [], 'Strict native window.error gate');
} catch (error) {
  const windowErrors = page ? await page.evaluate(() => window.consumerBrowserErrors) : [];
  console.error(
    JSON.stringify(
      { result: 'failed', functionalResult, activeCase, results, diagnostics, windowErrors },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(root, { recursive: true, force: true });
}
