import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-card-native-'));
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
    `<!doctype html><html lang="en"><head><title>Native Card</title><link rel="icon" href="data:,"><style>body{margin:24px}input{max-width:140px}</style></head><body><main id="app"></main><script type="module">
import{createApp,h,ref}from'vue';import{getDesignToken,transformToken}from'@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/card/__tests__/fixtures/NativeCard.vue';
import{genCardStyle}from'/@fs${repo}/packages/ui/src/card/style/index.ts';
import{genTabsStyle}from'/@fs${repo}/packages/ui/src/tabs/style/index.ts';
import{genSkeletonStyle}from'/@fs${repo}/packages/ui/src/skeleton/style/index.ts';
for(const[k,v]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(k,v);
const Native=window.ResizeObserver;window.cardObservers=new Set();window.ResizeObserver=class extends Native{targets=new Set();constructor(callback){super(callback);window.cardObservers.add(this)}observe(target,options){this.targets.add(target);super.observe(target,options)}unobserve(target){this.targets.delete(target);super.unobserve(target)}disconnect(){this.targets.clear();super.disconnect()}};
const style=document.createElement('style');style.textContent=['apollo','brand'].map(p=>genCardStyle(p)+genTabsStyle(p)+genSkeletonStyle(p)).join('');document.head.append(style);
const fixture=ref(null);const app=createApp({setup:()=>()=>h(Fixture,{ref:fixture})});app.mount('#app');window.cardState={patch:kind=>fixture.value.patch(kind),refsValid:()=>fixture.value.refsValid(),state:()=>fixture.value.state(),unmount:()=>app.unmount()};
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
  await page.waitForFunction(() => window.cardState?.refsValid());
  checks.push('actual Card/Grid/Meta public refs');

  const tokens = await page.evaluate(() => {
    const normal = document.querySelector('.token-card');
    const small = document.querySelector('.small-card');
    const style = (root, selector) => getComputedStyle(root.querySelector(selector));
    const header = style(normal, '.apollo-card-head');
    const compact = style(small, '.apollo-card-head');
    return {
      headerBg: header.backgroundColor,
      headerFontSize: header.fontSize,
      headerHeight: header.minHeight,
      bodyPadding: style(normal, '.apollo-card-body').paddingTop,
      headerPadding: header.paddingInlineStart,
      headerFontSizeSM: compact.fontSize,
      headerHeightSM: compact.minHeight,
      bodyPaddingSM: style(small, '.apollo-card-body').paddingTop,
      headerPaddingSM: compact.paddingInlineStart,
      actionsBg: style(normal, '.apollo-card-actions').backgroundColor,
      actionsLiMargin: style(normal, '.apollo-card-actions >li').margin,
      tabsMarginBottom: getComputedStyle(document.querySelector('.tabs-card .apollo-tabs-top'))
        .marginBottom,
      extraColor: style(normal, '.apollo-card-extra').color,
    };
  });
  assert.deepEqual(tokens, {
    headerBg: 'rgb(230, 240, 250)',
    headerFontSize: '19px',
    headerHeight: '80px',
    bodyPadding: '28px',
    headerPadding: '26px',
    headerFontSizeSM: '15px',
    headerHeightSM: '58px',
    bodyPaddingSM: '13px',
    headerPaddingSM: '12px',
    actionsBg: 'rgb(240, 245, 250)',
    actionsLiMargin: '9px 0px',
    tabsMarginBottom: '-23px',
    extraColor: 'rgb(40, 60, 80)',
  });
  checks.push('all thirteen current component token consumers');

  for (const name of ['Body draft', 'Meta draft', 'Extra draft']) {
    const input = page.getByRole('textbox', { name, exact: true });
    await input.fill(`${name} retained`);
    await input.evaluate((element) => {
      window.cardEditor = element;
      element.setSelectionRange(2, 7);
    });
    await page.evaluate(() => window.cardState.patch('show'));
    assert.equal(
      await input.evaluate(
        (element) =>
          element === window.cardEditor &&
          element.value.endsWith(' retained') &&
          element.selectionStart === 2 &&
          element.selectionEnd === 7 &&
          document.activeElement === element,
      ),
      true,
    );
  }
  checks.push('conditional Card and Meta regions preserve editor identity focus and selection');

  const body = page.getByRole('textbox', { name: 'Body draft', exact: true });
  await body.focus();
  await body.evaluate((element) => {
    window.cardBody = element;
  });
  await page.evaluate(() => {
    window.cardState.patch('theme');
    window.cardState.patch('attrs');
  });
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.token-card .apollo-card-body')).paddingTop ===
      '22px',
  );
  assert.equal(
    await body.evaluate(
      (element) =>
        element === window.cardBody &&
        document.activeElement === element &&
        element.value === 'Body draft retained',
    ),
    true,
  );
  assert.equal(await page.locator('.interactive-card').getAttribute('data-current'), 'second');
  assert.equal(
    await page
      .locator('.interactive-card')
      .evaluate((element) => getComputedStyle(element).paddingTop),
    '7px',
  );
  checks.push('theme and native attrs update without replacing the focused body');

  const action = page.getByRole('textbox', { name: 'Action b', exact: true });
  await action.fill('action retained');
  await action.evaluate((element) => {
    window.cardAction = element;
    element.setSelectionRange(1, 6);
  });
  await page.evaluate(() => window.cardState.patch('reverse'));
  assert.deepEqual(
    await action.evaluate((element) => ({
      same: element === window.cardAction,
      focused: document.activeElement === element,
      value: element.value,
      start: element.selectionStart,
      end: element.selectionEnd,
    })),
    { same: true, focused: true, value: 'action retained', start: 1, end: 6 },
  );
  checks.push('keyed action reorder preserves actual input identity focus and selection');
  await body.focus();
  await page.evaluate(() => window.cardState.patch('empty'));
  await page.waitForFunction(
    () => !document.querySelector('.interactive-card [class$="-card-actions"]'),
  );
  assert.equal(await page.getByRole('button', { name: 'Data action', exact: true }).count(), 0);
  await page.evaluate(() => window.cardState.patch('actions'));
  await page.getByRole('button', { name: 'Data action', exact: true }).waitFor();
  assert.equal(
    await body.evaluate(
      (element) => element === window.cardBody && document.activeElement === element,
    ),
    true,
  );
  checks.push('empty action slot suppresses data and slot withdrawal restores actual VNode data');

  // Tabs announces position inside the focused tab, so its accessible name changes on focus.
  const alpha = page.locator('.tabs-card [data-node-key="a"] [role="tab"]');
  const beta = page.locator('.tabs-card [data-node-key="b"] [role="tab"]');
  await alpha.focus();
  await alpha.press('ArrowRight');
  assert.equal(await beta.evaluate((element) => document.activeElement === element), true);
  await beta.press('Enter');
  assert.equal(await alpha.getAttribute('aria-selected'), 'true');
  assert.equal(await beta.getAttribute('aria-selected'), 'false');
  const rejected = await page.evaluate(() => window.cardState.state());
  assert.deepEqual(
    [rejected.proposals, rejected.changes, rejected.nestedUpdates, rejected.nestedChanges],
    [['b'], ['b'], ['b'], ['b']],
  );
  await page.evaluate(() => window.cardState.patch('release'));
  assert.equal(await alpha.getAttribute('aria-selected'), 'true');
  await beta.click();
  assert.equal(await beta.getAttribute('aria-selected'), 'true');
  const accepted = await page.evaluate(() => window.cardState.state());
  assert.deepEqual(
    [accepted.proposals, accepted.changes, accepted.nestedUpdates, accepted.nestedChanges],
    [
      ['b', 'b'],
      ['b', 'b'],
      ['b', 'b'],
      ['b', 'b'],
    ],
  );
  assert.ok(accepted.indicatorCalls > 0);
  assert.equal(await page.locator('.tabs-card [role="tab"] b').textContent(), 'Alpha');
  checks.push(
    'real Tabs keyboard rejection release owned events VNode labels and indicator service',
  );

  await page.evaluate(() => window.cardState.patch('clear'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.token-card .apollo-card-body')).paddingTop ===
      '24px',
  );
  await page.evaluate(() => window.cardState.patch('prefix'));
  await page.locator('.interactive-card.brand-card').waitFor();
  assert.equal(
    await page
      .locator('.token-card .brand-card-head')
      .evaluate((element) => getComputedStyle(element).fontSize),
    '16px',
  );
  assert.equal(await page.evaluate(() => window.cardState.refsValid()), true);
  checks.push('override withdrawal and preloaded custom prefix preserve actual refs');
  await page.evaluate(() => window.cardState.patch('loading'));
  assert.equal(await page.locator('.interactive-card .brand-skeleton-paragraph li').count(), 4);
  assert.equal(await page.getByRole('textbox', { name: 'Body draft', exact: true }).count(), 0);
  await page.evaluate(() => window.cardState.patch('loading'));
  await page.getByRole('textbox', { name: 'Body draft', exact: true }).waitFor();
  checks.push('actual Skeleton replaces only loading content');
  await page.evaluate(() => window.cardState.unmount());
  await page.waitForFunction(() =>
    [...window.cardObservers].every((observer) => observer.targets.size === 0),
  );
  assert.deepEqual(diagnostics, []);
  checks.push('unmount releases observers with zero browser or Vue diagnostics');
} catch (error) {
  failure = error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
  await writeFile(
    '/tmp/apollo-card-native-browser.json',
    JSON.stringify(
      {
        passed: !failure,
        checks,
        diagnostics,
        elapsedMs: Math.round(performance.now() - started),
        error: failure ? String(failure) : null,
      },
      null,
      2,
    ),
  );
}
if (failure) throw failure;
console.log(
  JSON.stringify({ passed: true, checks, elapsedMs: Math.round(performance.now() - started) }),
);
