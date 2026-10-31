/** Source integration of Table's native SFC, actual CSS, virtual holder and popup consumers. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-table-native-'));
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
let server, browser, page;
const diagnostics = [];
const started = performance.now();
let behaviorPassed = false;
let failure;
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Table native contracts</title><link rel="icon" href="data:,"><style>body{margin:24px}</style></head><body><main id="app"></main><script type="module">
import{createApp,h,shallowRef}from'vue';import{getDesignToken,transformToken}from'@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/table/__tests__/fixtures/NativeTableBrowser.vue';
import{genTableStyle}from'/@fs${repo}/packages/ui/src/table/style/index.ts';
import{genSpinStyle}from'/@fs${repo}/packages/ui/src/spin/style/index.ts';
import{genPaginationStyle}from'/@fs${repo}/packages/ui/src/pagination/style/index.ts';
import{genCheckboxStyle}from'/@fs${repo}/packages/ui/src/checkbox/style/index.ts';
import{genRadioStyle}from'/@fs${repo}/packages/ui/src/radio/style/index.ts';
import{genDropdownStyle}from'/@fs${repo}/packages/ui/src/dropdown/style/index.ts';
import{genMenuStyle}from'/@fs${repo}/packages/ui/src/menu/style/index.ts';
import{genTooltipStyle}from'/@fs${repo}/packages/ui/src/tooltip/style/index.ts';
import{genEmptyStyle}from'/@fs${repo}/packages/ui/src/empty/style/index.ts';
import{genButtonStyle}from'/@fs${repo}/packages/ui/src/button/style/index.ts';
import{genTagStyle}from'/@fs${repo}/packages/ui/src/tag/style/index.ts';
for(const[k,v]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(k,v);
const style=document.createElement('style');style.textContent=[genTableStyle('apollo'),genSpinStyle('apollo'),genPaginationStyle('apollo'),genCheckboxStyle('apollo'),genRadioStyle('apollo'),genDropdownStyle(),genMenuStyle(),genTooltipStyle(),genEmptyStyle('apollo'),genButtonStyle('apollo'),genTagStyle('apollo')].join('');document.head.append(style);
const fixture=shallowRef(null);const app=createApp({setup:()=>()=>h(Fixture,{ref:fixture})});app.mount('#app');
window.tableState={patch:kind=>fixture.value.patch(kind),scrollTo:config=>fixture.value.scrollTo(config),snapshot:()=>fixture.value.snapshot(),ready:()=>fixture.value.ready(),nativeRoot:()=>fixture.value.nativeRoot(),unmount:()=>app.unmount()};
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
  page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(12000);
  await page.addInitScript(() => {
    window.tableErrors = [];
    window.tableObservers = [];
    window.tableBindings = [];
    window.addEventListener('error', (event) => window.tableErrors.push(event.message));
    const Resize = window.ResizeObserver;
    window.ResizeObserver = class extends Resize {
      targets = new Set();
      constructor(callback) {
        super(callback);
        window.tableObservers.push(this);
      }
      observe(target, options) {
        this.targets.add(target);
        super.observe(target, options);
      }
      unobserve(target) {
        this.targets.delete(target);
        super.unobserve(target);
      }
      disconnect() {
        this.targets.clear();
        super.disconnect();
      }
    };
    const add = EventTarget.prototype.addEventListener,
      remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, handler, options) {
      if (
        this instanceof HTMLElement &&
        ['table-scroll-a', 'table-scroll-b'].includes(this.id) &&
        ['scroll', 'resize'].includes(type)
      )
        window.tableBindings.push({ target: this, type, handler, active: true });
      return add.call(this, type, handler, options);
    };
    EventTarget.prototype.removeEventListener = function (type, handler, options) {
      for (const binding of window.tableBindings)
        if (binding.target === this && binding.type === type && binding.handler === handler)
          binding.active = false;
      return remove.call(this, type, handler, options);
    };
  });
  page.on('pageerror', (error) => diagnostics.push({ kind: 'pageerror', text: error.message }));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()))
      diagnostics.push({ kind: message.type(), text: message.text() });
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.tableState?.ready());
  const draft = page.getByRole('textbox', { name: 'a', exact: true });
  await draft.fill('Retained draft');
  await draft.evaluate((input) => {
    window.tableDraft = input;
    input.setSelectionRange(2, 7);
  });
  await page.evaluate(() => window.tableState.patch('records'));
  await page.waitForFunction(
    () => document.querySelector('input[aria-label=a]')?.placeholder === 'New Alpha',
  );
  assert.equal(
    await draft.evaluate(
      (input) =>
        input === window.tableDraft &&
        input.value === 'Retained draft' &&
        input.selectionStart === 2 &&
        input.selectionEnd === 7 &&
        document.activeElement === input,
    ),
    true,
  );
  await page.evaluate(() => window.tableState.patch('slots'));
  assert.equal(await page.locator('.native-table [data-summary]').textContent(), '2 1');
  await page.evaluate(() => window.tableState.patch('slots'));
  assert.equal(await page.locator('.native-table [data-expand]').count(), 0);
  const engine = page.locator('.table-engine');
  assert.equal(await engine.locator('thead th').filter({ hasText: 'Age' }).count(), 1);
  assert.equal(
    await engine
      .locator('thead th')
      .first()
      .evaluate((cell) => getComputedStyle(cell).backgroundColor),
    'rgb(18, 52, 86)',
  );
  const checkbox = engine.locator('tbody tr[data-row-key="row-0"] input[type=checkbox]');
  await checkbox.click();
  assert.equal(await checkbox.isChecked(), false);
  assert.deepEqual((await page.evaluate(() => window.tableState.snapshot())).selection, [
    ['row-0'],
  ]);
  await page.evaluate(() => window.tableState.patch('accept'));
  await checkbox.click();
  assert.equal(await checkbox.isChecked(), true);
  await page.evaluate(() => window.tableState.patch('theme'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.table-engine thead th')).backgroundColor ===
      'rgb(101, 67, 33)',
  );
  assert.equal(
    await engine
      .locator('tbody tr[data-row-key="row-0"] td')
      .first()
      .evaluate((cell) => getComputedStyle(cell).paddingTop),
    '0px',
  );
  const initialBindings = await page.evaluate(
    () =>
      window.tableBindings.filter(
        (binding) => binding.active && binding.target.id === 'table-scroll-a',
      ).length,
  );
  assert.equal(initialBindings, 2);
  await page.evaluate(() => window.tableState.patch('container'));
  await page.waitForFunction(
    () =>
      window.tableBindings.filter(
        (binding) => binding.active && binding.target.id === 'table-scroll-b',
      ).length === 2,
  );
  assert.equal(
    await page.evaluate(
      () =>
        window.tableBindings.filter(
          (binding) => binding.active && binding.target.id === 'table-scroll-a',
        ).length,
    ),
    0,
  );
  await page.setViewportSize({ width: 600, height: 1100 });
  await page.waitForFunction(
    () =>
      ![...document.querySelectorAll('.table-engine thead th')].some((cell) =>
        cell.textContent.includes('Age'),
      ),
  );
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.table-engine thead th')].some((cell) =>
      cell.textContent.includes('Age'),
    ),
  );
  await engine.locator('.apollo-table-filter-trigger').click();
  const popup = page
    .locator('.apollo-table-filter-dropdown')
    .filter({ has: page.getByRole('menuitem', { name: 'First user', exact: true }) });
  await popup.waitFor({ state: 'visible' });
  await popup.getByRole('menuitem', { name: 'First user', exact: true }).click();
  await popup.getByRole('button', { name: 'OK', exact: true }).click();
  await page.waitForFunction(() =>
    window.tableState
      .snapshot()
      .events.some(
        (event) => event.action === 'filter' && event.ids.length === 1 && event.ids[0] === 'row-0',
      ),
  );
  await engine.locator('.apollo-table-filter-trigger').click();
  await popup.waitFor({ state: 'visible' });
  await popup.getByRole('button', { name: 'Reset', exact: true }).click();
  await popup.getByRole('button', { name: 'OK', exact: true }).click();
  await page.waitForFunction(() => window.tableState.snapshot().events.at(-1)?.ids.length === 50);
  await page.evaluate(() => window.tableState.patch('virtual'));
  const holder = engine.locator('.apollo-table-tbody-virtual-holder');
  await holder.waitFor({ state: 'visible' });
  for (const direction of ['ltr', 'rtl']) {
    if (direction === 'rtl') await page.evaluate(() => window.tableState.patch('direction'));
    await page.waitForFunction(
      (expected) =>
        getComputedStyle(document.querySelector('.apollo-table-tbody-virtual-holder')).direction ===
        expected,
      direction,
    );
    const sign = direction === 'rtl' ? -1 : 1;
    const horizontal = await holder.evaluate((element, scrollSign) => {
      element.scrollLeft = 0;
      element.dispatchEvent(new Event('scroll'));
      const row = element.querySelector('[data-row-key]');
      const before = row.getBoundingClientRect().left;
      element.scrollLeft = scrollSign * 100;
      element.dispatchEvent(new Event('scroll'));
      return {
        scrollLeft: element.scrollLeft,
        delta: row.getBoundingClientRect().left - before,
        viewport: element.clientWidth,
        content: element.scrollWidth,
      };
    }, sign);
    assert.ok(
      horizontal.content > horizontal.viewport,
      `${direction} has native horizontal overflow`,
    );
    assert.equal(
      horizontal.scrollLeft,
      sign * 100,
      `${direction} keeps the requested native scroll`,
    );
    assert.equal(horizontal.delta, -sign * 100, `${direction} moves the actual virtual row`);
  }
  await page.evaluate(() => window.tableState.patch('direction'));
  await holder.evaluate((element) => {
    element.scrollTop = 160;
    element.dispatchEvent(new Event('scroll'));
  });
  await page.waitForFunction(() => window.tableState.snapshot().scrollEvents.length > 0);
  assert.equal(
    (await page.evaluate(() => window.tableState.snapshot())).scrollEvents.every(
      (event) => event.native,
    ),
    true,
  );
  await page.evaluate(() => window.tableState.scrollTo({ index: 40, align: 'center' }));
  await page.waitForFunction(() => window.tableState.snapshot().scrollTop > 500);
  const top = await holder.evaluate((element) => element.scrollTop);
  await page.evaluate(() => window.tableState.patch('wrapper'));
  await page.waitForFunction(() => window.tableState.snapshot().bodyTag === 'SECTION');
  assert.equal(await holder.evaluate((element) => element.scrollTop), top);
  await page
    .locator('#table-head-demo')
    .getByRole('button', { name: '刷新（0）', exact: true })
    .click();
  assert.equal(
    await page
      .locator('#table-head-demo')
      .getByRole('button', { name: '刷新（1）', exact: true })
      .count(),
    1,
  );
  await page.evaluate(() => window.tableState.unmount());
  await page.waitForTimeout(150);
  assert.equal(
    await page.evaluate(() =>
      window.tableObservers.reduce((sum, observer) => sum + observer.targets.size, 0),
    ),
    0,
  );
  assert.equal(
    await page.evaluate(() => window.tableBindings.filter((binding) => binding.active).length),
    0,
  );
  behaviorPassed = true;
  const errors = await page.evaluate(() => window.tableErrors);
  diagnostics.push(...errors.map((text) => ({ kind: 'window', text })));
  assert.deepEqual(diagnostics, []);
} catch (error) {
  failure = error instanceof Error ? error.stack : String(error);
  process.exitCode = 1;
} finally {
  const result = {
    behaviorPassed,
    exitCode: process.exitCode ?? 0,
    durationMs: Math.round(performance.now() - started),
    diagnostics,
    ...(failure ? { failure } : {}),
  };
  await writeFile(
    '/tmp/apollo-native-table-browser-result.json',
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(JSON.stringify(result, null, 2));
  if (browser) await browser.close();
  if (server) await server.close();
  await rm(directory, { recursive: true, force: true });
}
