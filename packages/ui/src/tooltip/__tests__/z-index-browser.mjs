/** KI01 targeted stacking regression. Default: existing published dist/CSS; --source is a prebuild check. All cache/evidence stays in a temporary directory. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import vue from '@vitejs/plugin-vue';
import { artifactDigest } from '../../../../../scripts/verification.mjs';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const { values } = parseArgs({
  options: { source: { type: 'boolean', default: false }, out: { type: 'string' } },
});
const out = values.out
  ? path.resolve(values.out)
  : fs.mkdtempSync(path.join(tmpdir(), 'apollo-overlay-z-index-'));
fs.mkdirSync(out, { recursive: true });
const require = createRequire(`${repo}/package.json`);
const { createServer } = await import(require.resolve('vite'));
const sourceFiles = [
  'packages/ui/src/tooltip/Tooltip.ts',
  'packages/ui/src/tooltip/interface.ts',
  'packages/ui/src/popover/Popover.ts',
  'packages/ui/src/popover/interface.ts',
  'packages/ui/src/_internal/trigger.ts',
  'packages/ui/src/_internal/use-consumer-z-index.ts',
  'packages/portal/src/use-portal.ts',
  'packages/portal/src/container.ts',
];
const sha = (file) =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(repo, file)))
    .digest('hex');
const snapshot = () => ({
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
  status: execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' }).trim(),
  artifactDigest: artifactDigest(repo),
  sourceHashes: Object.fromEntries(sourceFiles.map((file) => [file, sha(file)])),
});
const result = {
  before: snapshot(),
  mode: values.source ? 'current source with unchanged published CSS' : 'published dist and CSS',
  clock: 'normal real browser clock; no STABILIZE_INIT',
  scope: 'Tooltip/Popover/Popconfirm numeric and valid CSS style z-index inheritance only',
  cases: [],
  diagnostics: [],
};
const cases = [];
for (const parent of ['Tooltip', 'Popover', 'Popconfirm'])
  for (const mode of [
    'prop-number',
    'native-number',
    'theme-number',
    'semantic-number',
    'semantic-calc',
    'semantic-var',
    'native-var',
    'semantic-calc-child-number',
  ])
    cases.push({ parent, mode });
fs.writeFileSync(
  `${out}/index.html`,
  `<!doctype html><html lang="en"><head><title>Public CSS z-index inheritance probe</title><link rel="icon" href="data:,"><style>body{margin:0;font-family:Arial,sans-serif}#outer-trigger{position:absolute;left:280px;top:120px;width:120px;height:32px}</style></head><body><main id="app"></main><script type="module" src="/fixture.js"></script></body></html>`,
);
fs.writeFileSync(
  `${out}/fixture.js`,
  `
import {createApp,defineComponent,h,inject} from 'vue';
import {Tooltip,Popover,Popconfirm,ConfigProvider} from '@apollo-design/ui';
import {ZINDEX_KEY} from '@apollo-design/portal';
import '@apollo-design/ui/style.css';
import '@apollo-design/theme/tokens.css';
import Demo from '/@fs${repo}/packages/ui/src/popover/demo/style-class.vue';
const query=new URLSearchParams(location.search),parent=query.get('parent'),mode=query.get('mode');
const Component=parent==='Popover'?Popover:parent==='Popconfirm'?Popconfirm:Tooltip;
const Probe=defineComponent({props:{name:String},setup(props){const z=inject(ZINDEX_KEY,null);return()=>h('span',{'data-context-probe':props.name,'data-z-index':z?.value,style:{display:'block',fontSize:'11px'}},props.name+' numeric context');}});
const rootStyle={maxWidth:'420px'};
const parentProps={open:true,placement:'bottomLeft',arrow:false,autoAdjustOverflow:false,classNames:{root:'parent-popup'},styles:{root:rootStyle}};
const theme={components:{}};
if(parent==='Popconfirm')parentProps.title='Confirmation';
if(mode==='prop-number')parentProps.zIndex=2500;
if(mode==='native-number')parentProps.style=['z-index: 2500',{padding:'0px'}];
if(mode==='theme-number')theme.components[parent]={zIndexPopup:2500};
if(mode==='semantic-number')rootStyle.zIndex=2500;
if(mode==='semantic-calc'||mode==='semantic-calc-child-number')rootStyle.zIndex='calc(2400 + 100)';
if(mode==='semantic-var'){rootStyle.zIndex='var(--probe-parent-layer)';rootStyle['--probe-parent-layer']='2500';}
if(mode==='native-var')parentProps.style={zIndex:'var(--probe-parent-layer)','--probe-parent-layer':'2500'};
const body=()=>h('div',{id:'parent-content',style:{width:'360px',minHeight:'200px'}},[
h('div',null,'Parent '+parent+' / '+mode),h(Probe,{name:'parent'}),
h(Tooltip,{open:true,placement:'right',arrow:false,autoAdjustOverflow:false,classNames:{root:'child-popup'},...(mode==='semantic-calc-child-number'?{zIndex:2600}:{})},{default:()=>h('button',{id:'inner-trigger',type:'button',style:{display:'block',marginTop:'42px',width:'112px',height:'30px'}},'Nested target'),title:()=>h('div',[h('strong',null,'CHILD TOOLTIP'),h(Probe,{name:'child'})])})]);
if(parent==='Tooltip')parentProps.color='#0050b3';
if(query.get('demo')==='1')createApp({render:()=>h(Demo)}).mount('#app');else createApp({render:()=>h(ConfigProvider,{theme},()=>h(Component,parentProps,{default:()=>h('button',{id:'outer-trigger',type:'button'},'Outer target'),[parent==='Popover'?'content':parent==='Popconfirm'?'description':'title']:body}))}).mount('#app');
window.__CSS_LAYER_READY__=true;
`,
);
const aliases = [
  { find: 'vue', replacement: `${repo}/node_modules/vue/dist/vue.esm-bundler.js` },
  { find: '@apollo-design/ui/style.css', replacement: `${repo}/packages/ui/dist/index.css` },
  {
    find: '@apollo-design/theme/tokens.css',
    replacement: `${repo}/packages/theme/dist/tokens.css`,
  },
];
for (const name of [
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
])
  aliases.push({
    find: new RegExp(`^@apollo-design/${name}$`),
    replacement: values.source
      ? `${repo}/packages/${name}/src/index.ts`
      : `${repo}/packages/${name}/dist/index.mjs`,
  });
async function trackErrors(page, item) {
  await page.addInitScript(() => {
    window.__LAYER_WINDOW_ERRORS__ = [];
    addEventListener('error', (event) => {
      window.__LAYER_WINDOW_ERRORS__.push({ type: 'error', message: event.message });
      console.error('[layer-window-error]', event.message);
    });
    addEventListener('unhandledrejection', (event) => {
      const message = String(event.reason);
      window.__LAYER_WINDOW_ERRORS__.push({ type: 'unhandledrejection', message });
      console.error('[layer-unhandled-rejection]', message);
    });
  });
  page.on('pageerror', (error) =>
    result.diagnostics.push({ ...item, kind: 'pageerror', message: error.message }),
  );
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      message.type() === 'warning' ||
      message.text().includes('[Vue warn]')
    )
      result.diagnostics.push({ ...item, kind: message.type(), message: message.text() });
  });
}
let server, browser;
const started = performance.now();
try {
  server = await createServer({
    root: out,
    configFile: false,
    cacheDir: `${out}/vite-cache`,
    plugins: [vue()],
    logLevel: 'warn',
    resolve: { alias: aliases },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, out] } },
  });
  await server.listen();
  const launched = await launchBrowser();
  browser = launched.browser;
  result.browser = { version: browser.version(), channel: launched.channel };
  result.base = server.resolvedUrls.local[0];
  for (const item of cases) {
    const context = await browser.newContext({
      viewport: { width: 1100, height: 750 },
      deviceScaleFactor: 1,
      locale: 'en-US',
      timezoneId: 'Asia/Shanghai',
      colorScheme: 'light',
    });
    const row = { ...item };
    const t = performance.now();
    try {
      const page = await context.newPage();
      await trackErrors(page, item);
      await page.goto(`${result.base}?${new URLSearchParams(item)}`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__CSS_LAYER_READY__ === true);
      await page.locator('.parent-popup').waitFor({ state: 'visible' });
      await page.locator('.child-popup').waitFor({ state: 'visible' });
      await page.waitForTimeout(1100);
      row.measurement = await page.evaluate(() => {
        const parent = document.querySelector('.parent-popup'),
          child = document.querySelector('.child-popup');
        const a = parent.getBoundingClientRect(),
          b = child.getBoundingClientRect();
        const overlap = {
          left: Math.max(a.left, b.left),
          top: Math.max(a.top, b.top),
          right: Math.min(a.right, b.right),
          bottom: Math.min(a.bottom, b.bottom),
        };
        const point = {
          x: (overlap.left + overlap.right) / 2,
          y: (overlap.top + overlap.bottom) / 2,
        };
        const top = document.elementFromPoint(point.x, point.y);
        const info = (node) => ({
          rect: node.getBoundingClientRect().toJSON(),
          inlineZIndex: node.style.zIndex,
          computedZIndex: getComputedStyle(node).zIndex,
          pointerEvents: getComputedStyle(node).pointerEvents,
          position: getComputedStyle(node).position,
          context: node.querySelector('[data-context-probe]')?.getAttribute('data-z-index'),
        });
        return {
          parent: info(parent),
          child: info(child),
          sameOwnerDocument: parent.ownerDocument === child.ownerDocument,
          teleportedSeparately: !parent.contains(child),
          overlap,
          point,
          hit: {
            tag: top?.tagName,
            class: top?.className,
            text: top?.textContent?.trim().slice(0, 100),
            inChild: !!top?.closest('.child-popup'),
            inParent: !!top?.closest('.parent-popup'),
          },
          stack: document
            .elementsFromPoint(point.x, point.y)
            .slice(0, 7)
            .map((node) => ({
              tag: node.tagName,
              class: node.className,
              inChild: !!node.closest('.child-popup'),
              inParent: !!node.closest('.parent-popup'),
            })),
        };
      });
      assert.equal(row.measurement.parent.computedZIndex, '2500');
      assert.equal(row.measurement.sameOwnerDocument, true);
      assert.equal(row.measurement.teleportedSeparately, true);
      assert(
        row.measurement.overlap.right > row.measurement.overlap.left &&
          row.measurement.overlap.bottom > row.measurement.overlap.top,
      );
      assert.equal(row.measurement.child.pointerEvents, 'auto');
      row.childActuallyOnTop = row.measurement.hit.inChild;
      row.deferredExpressionBoundary = ['semantic-calc', 'semantic-var', 'native-var'].includes(
        item.mode,
      );
      assert.equal(row.childActuallyOnTop, !row.deferredExpressionBoundary);
      if (['prop-number', 'native-number', 'semantic-number'].includes(item.mode)) {
        assert.equal(row.measurement.parent.context, '2500');
        assert.equal(row.measurement.child.computedZIndex, '2600');
      }
      row.windowErrors = await page.evaluate(() => window.__LAYER_WINDOW_ERRORS__);
      assert.deepEqual(row.windowErrors, []);
      row.measurementSucceeded = true;
      if (item.mode === 'semantic-number') {
        row.screenshot = path.join(out, `${item.parent}-semantic-number.png`);
        await page.screenshot({ path: row.screenshot });
      }

      console.log(
        JSON.stringify({
          parent: item.parent,
          mode: item.mode,
          parentZ: row.measurement.parent.computedZIndex,
          parentContext: row.measurement.parent.context,
          childZ: row.measurement.child.computedZIndex,
          childContext: row.measurement.child.context,
          childActuallyOnTop: row.childActuallyOnTop,
        }),
      );
    } catch (error) {
      row.measurementSucceeded = false;
      row.error = error.stack;
      console.error(`${item.parent}/${item.mode}: ${error.stack}`);
    } finally {
      row.durationMs = +(performance.now() - t).toFixed(1);
      result.cases.push(row);
      await context.close();
      fs.writeFileSync(`${out}/result.json`, `${JSON.stringify(result, null, 2)}\n`);
    }
  }
  const context = await browser.newContext({
    viewport: { width: 1100, height: 750 },
    colorScheme: 'light',
  });
  const demo = { parent: 'Popover Demo', mode: 'native-style-false' };
  try {
    const page = await context.newPage();
    await trackErrors(page, demo);
    await page.goto(`${result.base}?demo=1`);
    await page.waitForFunction(() => window.__CSS_LAYER_READY__ === true);
    await page.getByRole('button', { name: 'Nested layers', exact: true }).hover();
    const parent = page.locator('.demo-layer-popover');
    await parent.waitFor({ state: 'visible' });
    const toggle = page.getByRole('button', { name: 'Popup layer: 2500', exact: true });
    await toggle.hover();
    const child = page.locator('.demo-layer-tooltip');
    await child.waitFor({ state: 'visible' });
    await page.waitForTimeout(1100);
    const read = () =>
      page.evaluate(() => ({
        parent: getComputedStyle(document.querySelector('.demo-layer-popover')).zIndex,
        child: getComputedStyle(document.querySelector('.demo-layer-tooltip')).zIndex,
      }));
    assert.deepEqual(await read(), { parent: '2500', child: '2600' });
    await toggle.click();
    await page.getByRole('button', { name: 'Popup layer: default', exact: true }).waitFor();
    assert.deepEqual(await read(), { parent: '1030', child: '1230' });
    await page.getByRole('button', { name: 'Popup layer: default', exact: true }).click();
    assert.deepEqual(await read(), { parent: '2500', child: '2600' });
    const errors = await page.evaluate(() => window.__LAYER_WINDOW_ERRORS__);
    assert.deepEqual(errors, []);
    result.demo = { ...demo, passed: true, windowErrors: errors };
    console.log('Demo numeric layer2500→false/default→2500 passed');
  } catch (error) {
    result.demo = { ...demo, passed: false, error: error.stack };
    console.error(error.stack);
  } finally {
    await context.close();
  }
} catch (error) {
  result.failure = error.stack;
  console.error(error.stack);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  result.after = snapshot();
  result.unchanged =
    result.before.artifactDigest === result.after.artifactDigest &&
    JSON.stringify(result.before.sourceHashes) === JSON.stringify(result.after.sourceHashes);
  result.durationMs = +(performance.now() - started).toFixed(1);
  result.probeCompleted =
    !result.failure &&
    result.cases.length === cases.length &&
    result.cases.every((row) => row.measurementSucceeded) &&
    !result.diagnostics.length &&
    result.unchanged &&
    result.demo?.passed;
  result.supportedRegressionObserved = result.cases.some(
    (row) => !row.deferredExpressionBoundary && !row.measurementSucceeded,
  );
  result.deferredBoundaryCases = result.cases
    .filter((row) => row.deferredExpressionBoundary)
    .map(({ parent, mode, childActuallyOnTop, measurementSucceeded }) => ({
      parent,
      mode,
      childActuallyOnTop,
      measurementSucceeded,
    }));
  fs.writeFileSync(`${out}/result.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(
    JSON.stringify({
      probeCompleted: result.probeCompleted,
      supportedRegressionObserved: result.supportedRegressionObserved,
      deferredBoundaryCases: result.deferredBoundaryCases.length,
      cases: result.cases.length,
      diagnostics: result.diagnostics,
      unchanged: result.unchanged,
      durationMs: result.durationMs,
    }),
  );
  process.exitCode = result.probeCompleted ? 0 : 1;
}
