/** Source Transfer integration: node packages/ui/src/transfer/__tests__/native-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-transfer-native-'));
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
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><title>Transfer native contracts</title><link rel="icon" href="data:,">
<style>body{font-family:sans-serif}section{margin:20px}*,*::before,*::after{transition:none!important;animation:none!important}</style>
</head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import {genTransferStyle,genButtonStyle,genCheckboxStyle,genInputStyle,genDropdownStyle,genMenuStyle,genPaginationStyle} from '@apollo-design/ui';
import {genEmptyStyle} from '/@fs${repo}/packages/ui/src/empty/style/index.ts';
import Fixture from '/@fs${repo}/packages/ui/src/transfer/__tests__/fixtures/NativeTransfer.vue';
import Basic from '/@fs${repo}/packages/ui/src/transfer/demo/basic.vue';
import Tokens from '/@fs${repo}/packages/ui/src/transfer/demo/component-token.vue';
import Actions from '/@fs${repo}/packages/ui/src/transfer/demo/actions.vue';
for(const [name,value]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);
const styles=document.createElement('style');styles.textContent=[genTransferStyle('apollo'),genButtonStyle(),genCheckboxStyle('apollo'),genInputStyle(),genDropdownStyle(),genMenuStyle(),genPaginationStyle(),genEmptyStyle('apollo')].join(String.fromCharCode(10));document.head.append(styles);
const component=ref(null);const app=createApp(defineComponent({setup:()=>()=>[h(Fixture,{ref:component}),h('section',{id:'demo-basic'},h(Basic)),h('section',{id:'demo-tokens'},h(Tokens)),h('section',{id:'demo-actions'},h(Actions))]}));
app.mount('#app');window.transferState={inspect:()=>component.value.inspect(),patch:kind=>component.value.patch(kind),focus:()=>component.value.focus(),blur:()=>component.value.blur()};
</script></body></html>`,
);

let server;
let browser;
try {
  server = await createServer({
    root: fixture,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, fixture] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10_000);
  const diagnostics = [];
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      diagnostics.push(message.text());
  });
  await page.addInitScript(() => {
    window.transferNativeErrors = [];
    window.addEventListener('error', (event) => window.transferNativeErrors.push(event.message));
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.transferState);
  const root = page.locator('#native-transfer');
  const source = root.locator('.apollo-transfer-section').first();
  const target = root.locator('.apollo-transfer-section').nth(1);
  assert.equal(await page.evaluate(() => window.transferState.inspect().validRef), true);
  assert.equal(await root.getAttribute('data-native'), 'transfer');
  assert.equal(
    await root.evaluate((element) => element.style.getPropertyValue('--native-transfer')),
    '1',
  );
  assert.equal(await source.evaluate((element) => getComputedStyle(element).width), '222px');
  assert.equal(await source.evaluate((element) => getComputedStyle(element).height), '260px');
  assert.equal(
    await source
      .locator('.apollo-transfer-list-header')
      .evaluate((element) => getComputedStyle(element).height),
    '48px',
  );
  assert.equal(
    await source
      .locator('.apollo-transfer-list-content-item')
      .first()
      .evaluate((element) => getComputedStyle(element).minHeight),
    '40px',
  );
  await page.evaluate(() => window.transferState.focus());
  assert.equal(await root.evaluate((element) => element.contains(document.activeElement)), true);
  await page.evaluate(() => window.transferState.blur());
  assert.equal(await root.evaluate((element) => element.contains(document.activeElement)), false);

  await source.locator('.apollo-transfer-list-content-item').first().click();
  assert.deepEqual(await page.evaluate(() => window.transferState.inspect().selected), ['0']);
  assert.equal(await page.evaluate(() => window.transferState.inspect().selectionSignals), 2);
  await root.getByRole('button', { name: 'Move selected items to target' }).click();
  assert.deepEqual(await page.evaluate(() => window.transferState.inspect().targets), ['0']);
  assert.equal(await page.evaluate(() => window.transferState.inspect().moves), 1);
  assert.equal(await target.locator('.apollo-transfer-list-content-item').count(), 1);
  await source.locator('input[type="text"]').fill('Item 12');
  assert.equal(await source.locator('.apollo-transfer-list-content-item').count(), 1);
  await source.getByRole('button', { name: 'Clear input' }).click();
  assert.deepEqual(await page.evaluate(() => window.transferState.inspect().searches), [
    'left:Item 12',
    'left:',
  ]);

  const selectionMenu = source.locator('button.apollo-dropdown-trigger');
  await selectionMenu.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await menu.waitFor({ state: 'visible' });
  assert.equal(await menu.getAttribute('tabindex'), '0');
  await menu.focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await menu.evaluate((element) => element.contains(document.activeElement)), true);
  await menu.getByRole('menuitem', { name: 'Invert current page' }).press('Enter');
  assert.equal(await page.evaluate(() => window.transferState.inspect().selected.length), 12);

  await page.evaluate(() => window.transferState.patch('tokens'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('#native-transfer .apollo-transfer-section'))
        .width === '180px',
  );
  assert.equal(
    await page
      .locator('#demo-tokens .apollo-transfer-section')
      .first()
      .evaluate((element) => getComputedStyle(element).width),
    '220px',
  );
  await page.locator('#demo-tokens').getByRole('button', { name: 'Restore defaults' }).click();
  assert.equal(
    await page
      .locator('#demo-tokens .apollo-transfer-section')
      .first()
      .evaluate((element) => getComputedStyle(element).width),
    '180px',
  );
  await page.evaluate(() => {
    window.transferState.patch('tokens');
    window.transferState.patch('disabled');
  });
  await page.waitForFunction(
    () => document.querySelector('#native-transfer input')?.disabled === true,
  );
  assert.equal(await source.locator('input[type="checkbox"]').first().isDisabled(), true);
  const disabledBackground = await source.evaluate((element) => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = getComputedStyle(element).getPropertyValue(
      '--apollo-color-bg-container-disabled',
    );
    document.body.append(probe);
    const expected = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return [getComputedStyle(element).backgroundColor, expected];
  });
  assert.equal(disabledBackground[0], disabledBackground[1]);
  assert.notEqual(disabledBackground[1], 'rgba(0, 0, 0, 0)');
  await page.evaluate(() => window.transferState.patch('disabled'));
  await selectionMenu.click();
  await menu.waitFor({ state: 'visible' });
  await page.evaluate(() => window.transferState.patch('mount'));
  await root.waitFor({ state: 'detached' });
  await menu.waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => window.transferState.inspect().validRef), false);
  await page.evaluate(() => window.transferState.patch('mount'));
  await root.waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => window.transferState.inspect().validRef), true);
  assert.deepEqual(await page.evaluate(() => window.transferState.inspect().targets), ['0']);

  const basic = page.locator('#demo-basic .apollo-transfer');
  const previous = await basic
    .locator('.apollo-transfer-section')
    .nth(1)
    .locator('.apollo-transfer-list-content-item')
    .count();
  await basic
    .locator('.apollo-transfer-section')
    .first()
    .locator('.apollo-transfer-list-content-item')
    .filter({ hasText: 'content4' })
    .click();
  await basic.getByRole('button', { name: 'Move selected items to target' }).click();
  assert.ok(
    (await basic
      .locator('.apollo-transfer-section')
      .nth(1)
      .locator('.apollo-transfer-list-content-item')
      .count()) > previous,
  );
  assert.equal(await page.locator('#demo-actions .apollo-transfer-actions button').count(), 2);
  assert.equal(
    await page
      .locator('#demo-actions .apollo-transfer-actions button')
      .first()
      .locator('svg')
      .count(),
    1,
  );
  console.log(
    'Transfer source browser behavior passed: models, native keyboard/ref/attrs, current tokens, cleanup and three actual demos.',
  );
  const nativeErrors = await page.evaluate(() => window.transferNativeErrors);
  assert.deepEqual(
    { consoleAndPage: diagnostics, nativeErrors },
    { consoleAndPage: [], nativeErrors: [] },
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
