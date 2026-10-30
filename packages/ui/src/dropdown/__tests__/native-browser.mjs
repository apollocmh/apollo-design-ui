/** Source-only Dropdown/DropdownButton/PurePanel and current style-class Demo. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-dropdown-native-'));
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
const started = performance.now();
let server;
let browser;
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Dropdown native contracts</title><link rel="icon" href="data:,"><style>body{margin:40px;font-family:sans-serif}#demo{margin-top:120px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/dropdown/__tests__/fixtures/NativeDropdown.vue';
import Demo from '/@fs${repo}/packages/ui/src/dropdown/demo/style-class.vue';
import {genDropdownStyle} from '/@fs${repo}/packages/ui/src/dropdown/style/index.ts';
import {genTooltipStyle} from '/@fs${repo}/packages/ui/src/tooltip/style/index.ts';
import {genButtonStyle} from '/@fs${repo}/packages/ui/src/button/style/index.ts';
for(const [name,value]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);
const css=document.createElement('style');css.textContent=[genDropdownStyle(),genTooltipStyle(),genButtonStyle('apollo')].join(String.fromCharCode(10));document.head.append(css);
const fixture=ref(null);const app=createApp(defineComponent({setup:()=>()=>[h(Fixture,{ref:fixture}),h('section',{id:'demo'},[h(Demo)])]}));app.mount('#app');
window.dropdownState={patch:(kind)=>fixture.value.patch(kind),refsValid:()=>fixture.value.refsValid(),events:()=>fixture.value.events(),unmount:()=>app.unmount()};
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  page.setDefaultTimeout(10_000);
  await page.addInitScript(() => {
    window.dropdownErrors = [];
    window.addEventListener('error', (event) => window.dropdownErrors.push(event.message));
  });
  const diagnostics = [];
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning')
      diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.dropdownState);
  await page.getByRole('button', { name: 'Open actions', exact: true }).click();
  await page.locator('.main-dropdown').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.dropdownState.events().includes('after:true'));
  const read = () =>
    page.locator('.main-dropdown').evaluate((popup) => ({
      zIndex: getComputedStyle(popup).zIndex,
      childZIndex: getComputedStyle(document.querySelector('.dropdown-child-tooltip')).zIndex,
      padding: getComputedStyle(popup.querySelector('.mapped-item')).paddingTop,
      spacing: getComputedStyle(popup.querySelector('.mapped-item')).letterSpacing,
      arrowWidth: getComputedStyle(popup.querySelector('.apollo-dropdown-arrow')).width,
      minWidth: getComputedStyle(popup).minWidth,
      configured: popup.classList.contains('configured-dropdown'),
      gap:
        popup.getBoundingClientRect().top -
        document.getElementById('native-dropdown-trigger').getBoundingClientRect().bottom,
    }));
  assert.deepEqual(await read(), {
    zIndex: '2500',
    childZIndex: '2600',
    padding: '9px',
    spacing: '1px',
    arrowWidth: '20px',
    minWidth: '260px',
    configured: true,
    gap: 20,
  });
  assert.equal(await page.evaluate(() => window.dropdownState.refsValid()), true);
  const draft = page.getByRole('textbox', { name: 'Dropdown draft' });
  await draft.fill('Retained draft');
  await draft.evaluate((input) => {
    window.dropdownDraft = input;
    input.setSelectionRange(2, 6);
  });
  await page.evaluate(() => window.dropdownState.patch('theme'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.main-dropdown .mapped-item')).paddingTop ===
        '5px' &&
      document.querySelector('.main-dropdown').getBoundingClientRect().top -
        document.getElementById('native-dropdown-trigger').getBoundingClientRect().bottom ===
        12,
  );
  assert.deepEqual(await read(), {
    zIndex: '1050',
    childZIndex: '1150',
    padding: '5px',
    spacing: '1px',
    arrowWidth: '16px',
    minWidth: '260px',
    configured: false,
    gap: 12,
  });
  assert.equal(
    await draft.evaluate(
      (input) =>
        input === window.dropdownDraft &&
        input.value === 'Retained draft' &&
        input.selectionStart === 2 &&
        input.selectionEnd === 6 &&
        document.activeElement === input,
    ),
    true,
  );
  // The shared Menu owns navigation; accepting the Menu close returns the owned focus.
  const list = page.locator('.main-dropdown ul').first();
  await list.focus();
  await list.press('ArrowDown');
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute('role') === 'menuitem' &&
      document.activeElement.textContent?.includes('One action'),
  );
  await page.keyboard.press('Enter');
  await page.locator('.main-dropdown').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-dropdown-trigger');
  const events = await page.evaluate(() => window.dropdownState.events());
  assert.equal(events.filter((value) => value === 'true:trigger').length, 1);
  assert.equal(events.filter((value) => value === 'false:menu').length, 1);
  await page.getByRole('button', { name: 'Open actions', exact: true }).click();
  await page.locator('.main-dropdown').waitFor({ state: 'visible' });
  await draft.focus();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.locator('.main-dropdown').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-dropdown-trigger');

  const group = page.locator('.split-dropdown');
  await group.getByRole('button', { name: 'Main action', exact: true }).click();
  assert.equal(
    (await page.evaluate(() => window.dropdownState.events())).filter(
      (value) => value === 'main-click',
    ).length,
    1,
  );
  await page.evaluate(() => window.dropdownState.patch('icon'));
  assert.equal(
    await group.getByRole('button', { name: 'Open menu', exact: true }).textContent(),
    'AB',
  );
  await page.evaluate(() => window.dropdownState.patch('icon'));
  assert.equal(
    await group.getByRole('button', { name: 'Open menu', exact: true }).textContent(),
    '',
  );
  await group.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page
    .locator('.apollo-dropdown:not(.main-dropdown):not(.dropdown-static-panel)')
    .waitFor({ state: 'visible' });
  await page.evaluate(() => window.dropdownState.patch('close'));
  const panel = page.locator('.dropdown-static-panel');
  assert.equal(
    await panel.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return (
        getComputedStyle(node).position === 'relative' &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.x >= 0 &&
        rect.y >= 0
      );
    }),
    true,
  );
  await page.getByRole('button', { name: 'Open styled actions', exact: true }).click();
  await page.locator('.my-root').waitFor({ state: 'visible' });
  assert.equal(
    await page.locator('.my-root').evaluate((node) => getComputedStyle(node).zIndex),
    '1500',
  );
  await page.getByRole('button', { name: 'Change menu spacing', exact: true }).click();
  await page.waitForFunction(() => {
    const node = document.querySelector('.my-root');
    return (
      !node ||
      node.classList.contains('apollo-dropdown-hidden') ||
      getComputedStyle(node).zIndex === '1050'
    );
  });
  await page.evaluate(() => window.dropdownState.unmount());
  const windowErrors = await page.evaluate(() => window.dropdownErrors);
  console.log(
    JSON.stringify(
      {
        functionalResult: 'passed',
        browser: browser.version(),
        durationMs: Math.round(performance.now() - started),
        diagnostics,
        windowErrors,
        checks: [
          'current-provider-and-token',
          'nested-context',
          'draft-focus-and-selection',
          'Menu-keyboard-and-owned-close',
          'Escape-and-focus-return',
          'split-and-full-icon-slots',
          'real-template-refs',
          'visible-static-panel',
          'style-class-demo',
          'unmount',
        ],
      },
      null,
      2,
    ),
  );
  assert.deepEqual(diagnostics, [], 'Strict browser console/pageerror gate');
  assert.deepEqual(windowErrors, [], 'Strict native window.error gate');
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
