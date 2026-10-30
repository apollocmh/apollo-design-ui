/** Source Menu: actual Overflow, teleported submenus, current tokens and Vue refs. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-menu-native-'));
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
const started = performance.now();
const diagnostics = [];
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Menu native contracts</title><link rel="icon" href="data:,"><style>body{margin:40px}</style></head><body><main id="app"></main><script type="module">
import{createApp,h,ref}from'vue';import{getDesignToken,transformToken}from'@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/menu/__tests__/fixtures/NativeMenu.vue';
import Demo from '/@fs${repo}/packages/ui/src/menu/demo/component-token.vue';
import{genMenuStyle}from'/@fs${repo}/packages/ui/src/menu/style/index.ts';import{genTooltipStyle}from'/@fs${repo}/packages/ui/src/tooltip/style/index.ts';
for(const[k,v]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(k,v);
const style=document.createElement('style');style.textContent=genMenuStyle()+genTooltipStyle();document.head.append(style);
const fixture=ref(null);const app=createApp({setup:()=>()=>[h(Fixture,{ref:fixture}),h('div',{id:'demo'},[h(Demo)])]});app.mount('#app');
window.menuState={patch:kind=>fixture.value.patch(kind),refsValid:()=>fixture.value.refsValid(),events:()=>fixture.value.events(),focusHorizontal:()=>fixture.value.focusHorizontal(),unmount:()=>app.unmount()};
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
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => {
    window.menuErrors = [];
    window.addEventListener('error', (e) => window.menuErrors.push(e.message));
  });
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.menuState?.refsValid());
  const parent = page
    .locator('.apollo-menu-submenu-popup')
    .filter({ has: page.locator('#menu-draft') });
  await parent.waitFor({ state: 'visible' });
  const read = () =>
    parent.evaluate((popup) => ({
      z: getComputedStyle(popup).zIndex,
      width: getComputedStyle(popup.querySelector('ul')).minWidth,
      radius: getComputedStyle(document.querySelector('.native-menu .apollo-menu-item'))
        .borderRadius,
      child: getComputedStyle(document.querySelector('.menu-child-tooltip')).zIndex,
      dark: popup.classList.contains('apollo-menu-dark'),
    }));
  assert.deepEqual(await read(), {
    z: '2800',
    width: '230px',
    radius: '12px',
    child: '2900',
    dark: true,
  });
  const draft = page.getByRole('textbox', { name: 'Menu draft' });
  await draft.fill('Retained input');
  await draft.evaluate((input) => {
    window.menuDraft = input;
    input.setSelectionRange(2, 6);
  });
  await page.evaluate(() => window.menuState.patch('theme'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.native-menu .apollo-menu-item')).borderRadius ===
      '8px',
  );
  assert.deepEqual(await read(), {
    z: '1050',
    width: '160px',
    radius: '8px',
    child: '1150',
    dark: true,
  });
  assert.equal(
    await draft.evaluate(
      (input) =>
        input === window.menuDraft &&
        input.value === 'Retained input' &&
        input.selectionStart === 2 &&
        input.selectionEnd === 6 &&
        document.activeElement === input,
    ),
    true,
  );
  const title = page.locator('.native-menu > .apollo-menu-submenu > .apollo-menu-submenu-title');
  assert.equal((await title.textContent()).includes('OpenTail'), true);
  await page.evaluate(() => window.menuState.patch('icon'));
  assert.equal(await title.textContent(), 'Parent');
  assert.equal(await title.locator('.apollo-menu-submenu-arrow').count(), 0);
  await page.locator('.native-menu > .apollo-menu-item').nth(1).click();
  await page.locator('.native-menu > .apollo-menu-item').nth(1).click();
  const events = await page.evaluate(() => window.menuState.events());
  assert.equal(events.filter((e) => e === `click:a'[]`).length, 2);
  assert.equal(events.filter((e) => e === `select:a'[]`).length, 1);
  assert.equal(events.filter((e) => e === `deselect:a'[]`).length, 1);
  await parent.getByRole('menuitem', { name: 'Nested', exact: true }).click();
  const nested = page
    .locator('.apollo-menu-submenu-popup')
    .filter({ has: page.getByRole('menuitem', { name: 'Leaf', exact: true }) });
  await nested.waitFor({ state: 'visible' });
  assert.equal(
    await nested.evaluate(
      (node) =>
        node.classList.contains('apollo-menu-dark') && getComputedStyle(node).zIndex === '1100',
    ),
    true,
  );
  const demo = page.locator('#demo');
  assert.equal(
    await demo
      .locator('.apollo-menu-item')
      .first()
      .evaluate((node) => getComputedStyle(node).borderRadius),
    '12px',
  );
  await demo.getByRole('button', { name: 'Switch Menu tokens', exact: true }).click();
  assert.equal(
    await demo
      .locator('.apollo-menu-item')
      .first()
      .evaluate((node) => getComputedStyle(node).borderRadius),
    '2px',
  );
  const rest = page.locator('.horizontal-menu > .apollo-menu-overflow-item-rest');
  await page.waitForFunction(() => {
    const r = document.querySelector('.horizontal-menu > .apollo-menu-overflow-item-rest');
    return r && getComputedStyle(r).opacity === '1';
  });
  await rest.locator('.apollo-menu-submenu-title').hover();
  const more = page.locator('[id$="-rc-menu-more-popup"]');
  await more.waitFor({ state: 'visible' });
  assert.equal(await more.getByText('Navigation 6', { exact: true }).count(), 1);
  await more.getByText('Navigation 6', { exact: true }).click();
  assert.equal(
    (await page.evaluate(() => window.menuState.events())).filter((e) => e === 'horizontal:h5')
      .length,
    1,
  );
  await page.evaluate(() => window.menuState.patch('width'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.horizontal-menu > .apollo-menu-overflow-item-rest'))
        .opacity === '0',
  );
  await page.evaluate(() => window.menuState.focusHorizontal());
  await page.waitForFunction(() => document.activeElement?.textContent === 'Navigation 1');
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.activeElement?.textContent === 'Navigation 2');
  assert.equal(await page.evaluate(() => window.menuState.refsValid()), true);
  await page.evaluate(() => window.menuState.unmount());
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.apollo-menu-submenu-popup,.menu-child-tooltip').count(), 0);
  const windowErrors = await page.evaluate(() => window.menuErrors);
  console.log(
    JSON.stringify({
      behavior: 'passed',
      diagnostics,
      windowErrors,
      durationMs: Math.round(performance.now() - started),
    }),
  );
  assert.deepEqual(diagnostics, []);
  assert.deepEqual(windowErrors, []);
} catch (error) {
  console.log(
    JSON.stringify({
      assertions: 'failed',
      diagnostics,
      windowErrors: page ? await page.evaluate(() => window.menuErrors) : [],
      durationMs: Math.round(performance.now() - started),
    }),
  );
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
