import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-ui-form-native-'));
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
    `<!doctype html><html lang="en"><head><title>Native Form</title><link rel="icon" href="data:,"><style>body{margin:24px}section{max-width:720px}</style></head><body><main id="app"></main><script type="module">
import{createApp,h,ref}from'vue';import{getDesignToken,transformToken}from'@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/form/__tests__/fixtures/NativeForm.vue';
import{genFormStyle}from'/@fs${repo}/packages/ui/src/form/style/index.ts';
import{genInputStyle}from'/@fs${repo}/packages/ui/src/input/style/index.ts';
import{genGridStyle}from'/@fs${repo}/packages/ui/src/grid/style/index.ts';
import{genTooltipStyle}from'/@fs${repo}/packages/ui/src/tooltip/style/index.ts';
for(const[k,v]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(k,v);
const Observed=window.ResizeObserver;window.formTargets=new Set();window.ResizeObserver=class extends Observed{targets=new Set();observe(target,options){this.targets.add(target);window.formTargets.add(target);super.observe(target,options)}unobserve(target){this.targets.delete(target);window.formTargets.delete(target);super.unobserve(target)}disconnect(){for(const target of this.targets)window.formTargets.delete(target);this.targets.clear();super.disconnect()}};
const style=document.createElement('style');style.textContent=['apollo','brand'].map(p=>genFormStyle(p)+genInputStyle(p)+genGridStyle(p)).join('')+genTooltipStyle();document.head.append(style);
const fixture=ref(null);const app=createApp({setup:()=>()=>h(Fixture,{ref:fixture})});app.mount('#app');
window.formState={patch:kind=>fixture.value.patch(kind),refValid:()=>fixture.value.refValid(),focus:()=>fixture.value.focus(),scroll:()=>fixture.value.scroll(),submit:()=>fixture.value.submit(),rowInput:()=>fixture.value.rowInput(),unmount:()=>app.unmount()};
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.formState?.refValid());
  checks.push('actual Vue ref');

  const initial = await page.evaluate(() => {
    const label = document.querySelector('label[for="profile_title"]');
    const vertical = document.querySelector('.vertical-form label');
    const verticalCol = vertical.parentElement;
    const labelStyle = getComputedStyle(label);
    const after = getComputedStyle(label, '::after');
    return {
      required: getComputedStyle(label, '::before').color,
      color: labelStyle.color,
      font: labelStyle.fontSize,
      height: labelStyle.height,
      colonStart: after.marginInlineStart,
      colonEnd: after.marginInlineEnd,
      item: getComputedStyle(label.closest('.apollo-form-item')).marginBottom,
      verticalHeight: getComputedStyle(vertical).height,
      verticalPadding: getComputedStyle(verticalCol).padding,
      verticalMargin: getComputedStyle(verticalCol).marginTop,
      inline: getComputedStyle(document.querySelector('.inline-form .apollo-form-item'))
        .marginBottom,
    };
  });
  assert.deepEqual(initial, {
    required: 'rgb(240, 10, 80)',
    color: 'rgb(90, 30, 120)',
    font: '17px',
    height: '38px',
    colonStart: '5px',
    colonEnd: '9px',
    item: '31px',
    verticalHeight: '41px',
    verticalPadding: '1px 2px',
    verticalMargin: '3px',
    inline: '6px',
  });
  checks.push('eleven component token consumers');

  await page.getByRole('button', { name: 'Field information' }).focus();
  await page
    .getByRole('tooltip')
    .filter({ hasText: 'Current field information' })
    .waitFor({ state: 'visible' });
  checks.push('keyboard tooltip outside label');
  await page.evaluate(() => window.formState.focus());
  const title = page.getByRole('textbox', { name: 'Native title' });
  await title.fill('Retained draft');
  await title.evaluate((input) => {
    window.formTitle = input;
    input.setSelectionRange(2, 7);
  });
  await page.evaluate(() => window.formState.patch('theme'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('label[for="profile_title"]')).fontSize === '18px',
  );
  assert.equal(
    await title.evaluate(
      (input) =>
        input === window.formTitle &&
        input.value === 'Retained draft' &&
        input.selectionStart === 2 &&
        input.selectionEnd === 7 &&
        document.activeElement === input,
    ),
    true,
  );
  checks.push('theme replacement keeps draft focus and selection');

  await page.evaluate(() => window.formState.patch('localFeedback'));
  await page.waitForFunction(() => document.querySelectorAll('[data-form-feedback]').length === 2);
  assert.equal(await page.locator('[data-item-feedback]').count(), 0);
  await page.evaluate(() => window.formState.patch('feedback'));
  await page.waitForFunction(() => !document.querySelector('[data-form-feedback]'));
  await page.evaluate(() => window.formState.patch('mark'));
  await page.waitForFunction(() => !document.querySelector('[data-custom-mark]'));
  checks.push('compiled slot presence and withdrawal');

  await page.evaluate(() => window.formState.patch('clear'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('label[for="profile_title"]')).fontSize === '14px',
  );
  await page.evaluate(() => window.formState.patch('prefix'));
  await page.locator('.brand-form').first().waitFor();
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.querySelector('label[for="profile_title"]')).fontSize,
    ),
    '14px',
  );
  assert.equal(
    await title.evaluate(
      (input) =>
        input === window.formTitle &&
        input.value === 'Retained draft' &&
        document.activeElement === input,
    ),
    true,
  );
  checks.push('override removal and preloaded native prefix styles');

  await page.evaluate(() => window.formState.scroll());
  await page.waitForFunction(() => document.querySelector('[data-scroll]').scrollTop > 100);
  assert.equal(
    await page
      .getByRole('textbox', { name: 'Last field' })
      .evaluate((input) => document.activeElement === input),
    true,
  );
  await page.evaluate(() => {
    window.formState.focus();
    document.querySelector('[data-scroll]').scrollTop = 0;
    window.formState.patch('scrollErrors');
    window.formState.submit();
  });
  await page.getByText('Missing last', { exact: true }).waitFor();
  assert.equal(await page.locator('[data-scroll]').evaluate((element) => element.scrollTop), 0);
  checks.push('actual scrolling focus and disabled first-error scrolling');

  await page.waitForFunction(
    () => !document.querySelector('#profile_last_help [class*="-appear"]'),
  );
  await page.evaluate(() => window.formState.patch('clearErrors'));
  await page.waitForFunction(() => {
    const message = document.querySelector('#profile_last_help .brand-form-item-explain-error');
    return (
      message?.textContent === 'Missing last' &&
      message.classList.contains('brand-form-show-help-item-leave-active')
    );
  });
  await page.getByText('Missing last', { exact: true }).waitFor({ state: 'detached' });
  await page.waitForFunction(
    () =>
      !document
        .querySelector('#profile_last')
        .closest('.brand-form-item')
        .querySelector('.brand-form-item-margin-offset'),
  );
  checks.push('ErrorList retains leaving content and releases its measured placeholder');

  const person = page.getByRole('textbox', { name: 'Person 0', exact: true });
  await person.fill('Ada edited');
  await person.evaluate((input) => {
    window.firstPerson = input;
  });
  await page.locator('[data-move]').click();
  assert.deepEqual(
    await page
      .locator('input[aria-label^="Person "]')
      .evaluateAll((inputs) => inputs.map((input) => input.getAttribute('aria-label'))),
    ['Person 1', 'Person 0'],
  );
  assert.equal(
    await person.evaluate((input) => input === window.firstPerson && input.value === 'Ada edited'),
    true,
  );
  await page.locator('[data-remove]').click();
  assert.equal(
    await person.evaluate((input) => input === window.firstPerson && input.value === 'Ada edited'),
    true,
  );
  assert.equal(
    await page.evaluate(
      () => window.formState.rowInput() === document.querySelector('input[aria-label="Person 0"]'),
    ),
    true,
  );
  checks.push('List move/remove preserves control identity and registry path');

  await page.evaluate(() => window.formState.patch('width'));
  await page.waitForFunction(() => {
    const root = document.querySelector('.vertical-form .brand-form-item');
    const extra = root.querySelector('.brand-form-item-extra');
    const additional = root.querySelector('.brand-form-item-additional');
    return (
      Number.parseFloat(getComputedStyle(additional).minHeight) ===
      Number.parseFloat(getComputedStyle(root).marginBottom) + extra.clientHeight
    );
  });
  checks.push('extra ResizeObserver keeps measured placeholder current');
  await page.setViewportSize({ width: 480, height: 900 });
  await page.waitForFunction(() => {
    const row = document.querySelector('.responsive-form .brand-form-item-row');
    const label = row.querySelector('.brand-form-item-label');
    const control = row.querySelector('.brand-form-item-control');
    const width = row.getBoundingClientRect().width;
    return (
      width > 0 &&
      Math.abs(label.getBoundingClientRect().width / width - 0.25) < 0.01 &&
      Math.abs(control.getBoundingClientRect().width / width - 0.5) < 0.01
    );
  });
  checks.push('responsive columns retain their declared spans on a narrow viewport');
  await page.evaluate(() => window.formState.unmount());
  await page.waitForFunction(() => window.formTargets.size === 0);
  assert.deepEqual(diagnostics, []);
  checks.push('unmount releases observers and reports no browser/Vue errors');
} catch (error) {
  failure = error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
  await writeFile(
    '/tmp/apollo-ui-form-native-browser.json',
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
