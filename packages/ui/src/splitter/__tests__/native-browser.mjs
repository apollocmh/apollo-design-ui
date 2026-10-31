import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-splitter-native-'));
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
const diagnostics = [];
const checks = [];
const started = performance.now();
let server;
let browser;
let failure;
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Native Splitter</title><link rel="icon" href="data:,"><style>body{margin:24px}input{max-width:100px}.main-splitter,.controlled-splitter,.lazy-splitter,.axis-splitter{margin-bottom:30px}</style></head><body><main id="app"></main><script type="module">
import{createApp,h,ref}from'vue';import{getDesignToken,transformToken}from'@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/splitter/__tests__/fixtures/NativeSplitter.vue';
import{genSplitterStyle}from'/@fs${repo}/packages/ui/src/splitter/style/index.ts';
for(const[k,v]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(k,v);
const Native=window.ResizeObserver;window.splitObservers=new Set();window.ResizeObserver=class extends Native{targets=new Set();constructor(callback){super(callback);window.splitObservers.add(this)}observe(target,options){this.targets.add(target);super.observe(target,options)}unobserve(target){this.targets.delete(target);super.unobserve(target)}disconnect(){this.targets.clear();super.disconnect()}};
const events=new Set(['mousemove','mouseup','touchmove','touchend','touchcancel']);const listeners=new Map();const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);window.addEventListener=(name,handler,options)=>{if(events.has(name)){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(handler)}add(name,handler,options)};window.removeEventListener=(name,handler,options)=>{listeners.get(name)?.delete(handler);remove(name,handler,options)};window.splitListenerCount=()=>[...listeners.values()].reduce((sum,set)=>sum+set.size,0);
const style=document.createElement('style');style.textContent=genSplitterStyle('apollo');document.head.append(style);
const fixture=ref(null);const app=createApp({setup:()=>()=>h(Fixture,{ref:fixture})});app.mount('#app');window.splitState={patch:kind=>fixture.value.patch(kind),refsValid:()=>fixture.value.refsValid(),state:()=>fixture.value.state(),unmount:()=>app.unmount()};
</script></body></html>`,
  );
  server = await createServer({
    root: directory,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, directory] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.splitState?.refsValid());
  await page.waitForFunction(
    () =>
      document.querySelector('.main-splitter [role="separator"]').getAttribute('aria-valuenow') ===
      '25',
  );
  checks.push('actual Splitter and all three keyed Panel public refs');
  const sizes = (selector) =>
    page
      .locator(`${selector} > .apollo-splitter-panel`)
      .evaluateAll((elements) =>
        elements.map((element) => Number.parseFloat(getComputedStyle(element).flexBasis)),
      );
  const expectSizes = async (selector, values) => {
    await page.waitForFunction(
      ({ selector, values }) => {
        const actual = [...document.querySelectorAll(`${selector} > .apollo-splitter-panel`)].map(
          (element) => Number.parseFloat(getComputedStyle(element).flexBasis),
        );
        return (
          actual.length === values.length &&
          actual.every((value, index) => Math.abs(value - values[index]) < 0.1)
        );
      },
      { selector, values },
    );
    const actual = await sizes(selector);
    assert.equal(actual.length, values.length);
    actual.forEach((value, index) => {
      assert.ok(Math.abs(value - values[index]) < 0.1, `${selector}: ${actual} != ${values}`);
    });
  };
  const move = async (selector, deltaX, deltaY = 0, release = true) => {
    const box = await page.locator(selector).boundingBox();
    assert.ok(box);
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + deltaX, y + deltaY);
    if (release) await page.mouse.up();
  };
  const tokens = await page.locator('.main-splitter').evaluate((root) => {
    const dragger = root.querySelector('[role="separator"]');
    const collapse = root.querySelector('.apollo-splitter-bar-collapse-bar-end');
    return {
      width: getComputedStyle(dragger).width,
      before: getComputedStyle(dragger, '::before').width,
      spinner: getComputedStyle(dragger, '::after').height,
      offset: getComputedStyle(collapse).insetInlineStart,
    };
  });
  assert.deepEqual(tokens, { width: '12px', before: '4px', spinner: '28px', offset: '6px' });
  checks.push(
    'four token declarations and actual heat area, line, derived spinner and collapse offset',
  );
  // Playwright keeps its own hit-target interception listeners. Count the component delta.
  const baselineListeners = await page.evaluate(() => window.splitListenerCount());

  await move('.main-splitter [role="separator"] >> nth=0', 60);
  await expectSizes('.main-splitter', [260, 140, 400]);
  let state = await page.evaluate(() => window.splitState.state());
  assert.deepEqual(state.main.start, [[200, 200, 400]]);
  assert.deepEqual(state.main.resize, [[260, 140, 400]]);
  assert.deepEqual(state.main.end, [[260, 140, 400]]);
  assert.equal(await page.evaluate(() => window.splitListenerCount()), baselineListeners);
  checks.push('real pointer drag gives each owned resize lifecycle listener exactly one payload');

  const editor = page.getByRole('textbox', { name: 'Draft c', exact: true });
  await editor.fill('retained draft');
  await editor.evaluate((element) => {
    window.splitEditor = element;
    element.setSelectionRange(2, 8);
  });
  await page.evaluate(() => {
    window.splitState.patch('show');
    window.splitState.patch('reorder');
    window.splitState.patch('attrs');
  });
  await expectSizes('.main-splitter', [400, 260, 140]);
  assert.deepEqual(
    await editor.evaluate((element) => ({
      same: element === window.splitEditor,
      value: element.value,
      focused: element === document.activeElement,
      start: element.selectionStart,
      end: element.selectionEnd,
    })),
    { same: true, value: 'retained draft', focused: true, start: 2, end: 8 },
  );
  assert.equal(await page.locator('.main-splitter').getAttribute('data-current'), 'second');
  assert.equal(
    await page
      .locator('[data-panel="a"]')
      .evaluate((element) => getComputedStyle(element).paddingTop),
    '7px',
  );
  assert.equal(await page.evaluate(() => window.splitState.refsValid()), true);
  checks.push(
    'current conditional slots, keyed reorder, native attrs and actual editor identity/focus/selection',
  );

  const boundary = page.locator('.main-splitter > .apollo-splitter-bar').nth(1);
  await boundary.locator('.apollo-splitter-bar-collapse-bar-start').click();
  await expectSizes('.main-splitter', [400, 0, 400]);
  await boundary.locator('.apollo-splitter-bar-collapse-bar-end').click();
  await expectSizes('.main-splitter', [400, 260, 140]);
  state = await page.evaluate(() => window.splitState.state());
  assert.deepEqual(state.main.collapse, [
    [false, true, false],
    [false, false, false],
  ]);
  checks.push(
    'keyed collapse memory restores the actual accepted size with once-only collapse notifications',
  );

  const control = page.locator('.controlled-splitter [role="separator"]');
  await control.focus();
  await control.press('ArrowRight');
  await expectSizes('.controlled-splitter', [200, 400]);
  await page.evaluate(() => window.splitState.patch('release'));
  await expectSizes('.controlled-splitter', [200, 400]);
  await page.evaluate(() => {
    window.splitState.patch('control');
    window.splitState.patch('accept');
  });
  await control.press('ArrowRight');
  await expectSizes('.controlled-splitter', [210, 390]);
  await page.evaluate(() => window.splitState.patch('release'));
  await expectSizes('.controlled-splitter', [210, 390]);
  assert.deepEqual((await page.evaluate(() => window.splitState.state())).control, [
    [210, 390],
    [210, 390],
  ]);
  checks.push(
    'real keyboard controlled rejection, acceptance and withdrawal retain accepted values',
  );

  await move('.lazy-splitter [role="separator"]', -1000, 0, false);
  await expectSizes('.lazy-splitter', [240, 360]);
  assert.equal((await page.evaluate(() => window.splitState.state())).lazy.length, 0);
  assert.equal(
    await page
      .locator('.lazy-splitter .apollo-splitter-bar-preview')
      .evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--apollo-splitter-bar-preview-offset'),
      ),
    '-240px',
  );
  await page.mouse.up();
  await expectSizes('.lazy-splitter', [480, 120]);
  assert.deepEqual((await page.evaluate(() => window.splitState.state())).lazy, [[480, 120]]);
  await page.evaluate(() => window.splitState.patch('disable'));
  await page
    .locator('.lazy-splitter [role="separator"]')
    .dispatchEvent('keydown', { key: 'ArrowLeft' });
  assert.equal(
    await page.locator('.lazy-splitter [role="separator"]').getAttribute('tabindex'),
    '-1',
  );
  assert.equal((await page.evaluate(() => window.splitState.state())).lazy.length, 1);
  checks.push(
    'RTL lazy actual preview clamps to bounds, submits on release and disabled keyboard cannot resize',
  );

  const axis = page.locator('.axis-splitter [role="separator"]');
  await axis.focus();
  await axis.press('ArrowDown');
  await expectSizes('.axis-splitter', [106, 134]);
  await axis.press('End');
  await expectSizes('.axis-splitter', [192, 48]);
  await page.evaluate(() => window.splitState.patch('axis'));
  await page.waitForFunction(
    () =>
      document
        .querySelector('.axis-splitter [role="separator"]')
        .getAttribute('aria-orientation') === 'vertical',
  );
  await axis.press('Home');
  await expectSizes('.axis-splitter', [120, 480]);
  checks.push('current vertical/horizontal axis and actual keyboard Home/End boundaries');

  await page.evaluate(() => window.splitState.patch('theme'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.main-splitter [role="separator"]')).width ===
      '16px',
  );
  assert.equal(
    await page
      .locator('.main-splitter [role="separator"]')
      .first()
      .evaluate((element) => getComputedStyle(element, '::after').height),
    '14px',
  );
  await page.evaluate(() => window.splitState.patch('clearTheme'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.main-splitter [role="separator"]')).width === '6px',
  );
  checks.push('live token replacement and removal restore the existing static CSS defaults');

  await page.evaluate(() => window.splitState.patch('disable'));
  await page.waitForTimeout(310);
  await move('.lazy-splitter [role="separator"]', 30, 0, false);
  assert.equal(await page.evaluate(() => window.splitListenerCount()), baselineListeners + 5);
  await page.evaluate(() => window.splitState.patch('removeLazy'));
  assert.equal(await page.evaluate(() => window.splitListenerCount()), baselineListeners);
  await page.mouse.up();
  await page.evaluate(() => window.splitState.unmount());
  assert.equal(
    await page.evaluate(() =>
      [...window.splitObservers].every((observer) => observer.targets.size === 0),
    ),
    true,
  );
  assert.equal(await page.evaluate(() => window.splitListenerCount()), baselineListeners);
  assert.deepEqual(diagnostics, []);
  checks.push(
    'active boundary removal and unmount release every actual drag listener and observer with zero diagnostics',
  );
} catch (error) {
  failure = error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
const report = {
  passed: !failure,
  elapsedMs: Math.round(performance.now() - started),
  checks,
  diagnostics,
  ...(failure ? { error: String(failure) } : {}),
};
await writeFile('/tmp/apollo-splitter-native-browser.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failure) throw failure;
