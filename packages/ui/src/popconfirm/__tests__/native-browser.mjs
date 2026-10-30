/** Source-only check: node packages/ui/src/popconfirm/__tests__/native-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-popconfirm-native-'));
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
  `<!doctype html><html lang="en"><head><title>Popconfirm native contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{transition:none!important;animation:none!important}body{margin:0;font-family:sans-serif}#confirm-target{position:absolute;left:400px;top:300px;width:120px;height:40px}#panels{position:absolute;top:500px;left:100px}#demo{position:absolute;top:650px;left:100px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/popconfirm/__tests__/fixtures/NativePopconfirm.vue';
import Demo from '/@fs${repo}/packages/ui/src/popconfirm/demo/render-panel.vue';
import {genPopconfirmStyle} from '/@fs${repo}/packages/ui/src/popconfirm/style/index.ts';
import {genPopoverStyle} from '/@fs${repo}/packages/ui/src/popover/style/index.ts';
import {genTooltipStyle} from '/@fs${repo}/packages/ui/src/tooltip/style/index.ts';
import {genButtonStyle} from '/@fs${repo}/packages/ui/src/button/style/index.ts';
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(key,value);
const css=document.createElement('style');css.textContent=[genTooltipStyle(),genPopoverStyle(),genPopconfirmStyle('apollo'),genButtonStyle('apollo')].join(String.fromCharCode(10));document.head.append(css);
const component=ref(null);
createApp(defineComponent({setup:()=>()=>[h(Fixture,{ref:component}),h('section',{id:'demo'},[h(Demo)])]})).mount('#app');
window.confirmState={patch:(kind)=>component.value.patch(kind),refValid:()=>component.value.refValid(),events:()=>component.value.events(),resolveRequest:(index)=>component.value.resolveRequest(index)};
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
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.confirmState);
  await page.locator('#confirm-target').click();
  await page.locator('.main-confirm').waitFor({ state: 'visible' });
  const frames = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  const read = () =>
    page.locator('.main-confirm').evaluate((root) => {
      const panel = document.querySelector('.current-panel');
      const target = document.getElementById('confirm-target');
      return {
        zIndex: getComputedStyle(root).zIndex,
        nestedZIndex: getComputedStyle(document.querySelector('.nested-popover')).zIndex,
        panelZIndex: getComputedStyle(panel).zIndex,
        nestedPanelZIndex: getComputedStyle(document.querySelector('.nested-panel')).zIndex,
        warning: getComputedStyle(root.querySelector('.apollo-popconfirm-message-icon')).color,
        margin: getComputedStyle(root.querySelector('.apollo-popconfirm-message')).marginBottom,
        panelMargin: getComputedStyle(panel.querySelector('.apollo-popconfirm-message'))
          .marginBottom,
        titlePadding: getComputedStyle(root.querySelector('.apollo-popconfirm-title')).paddingTop,
        native: root.classList.contains('native-confirm') && root.classList.contains('active'),
        own:
          (root.classList.contains('own-config') || root.classList.contains('replaced-config')) &&
          !root.classList.contains('popover-config') &&
          !root.classList.contains('tooltip-config'),
        nestedOwn:
          document.querySelector('.nested-popover').classList.contains('popover-config') &&
          document.querySelector('.nested-tooltip').classList.contains('tooltip-config'),
        triggerClass: target.className,
        triggerPadding: target.style.padding,
        triggerData: target.dataset.trigger,
        refValid: window.confirmState.refValid(),
      };
    });
  await frames();
  const initial = await read();
  assert.equal(initial.zIndex, '2060');
  assert.equal(initial.nestedZIndex, '2260');
  assert.equal(initial.panelZIndex, '2060');
  assert.equal(initial.nestedPanelZIndex, '6060');
  assert.equal(initial.warning, 'rgb(18, 52, 86)');
  assert.equal(initial.margin, '18px');
  assert.equal(initial.panelMargin, '18px');
  assert.equal(initial.titlePadding, '3px');
  assert.equal(initial.native, true);
  assert.equal(initial.own, true);
  assert.equal(initial.nestedOwn, true);
  assert.equal(initial.refValid, true);
  assert.equal(initial.triggerClass.includes('native-confirm'), false);
  assert.equal(initial.triggerPadding, '');
  assert.equal(initial.triggerData, 'kept');
  await page.locator('#confirm-editor').fill('business draft');
  await page.locator('#confirm-editor').focus();
  await page.locator('#confirm-editor').evaluate((input) => {
    window.originalEditor = input;
  });
  await page.evaluate(() => window.confirmState.patch('next'));
  await frames();
  const next = await read();
  assert.equal(next.zIndex, '3060');
  assert.equal(next.nestedZIndex, '3260');
  assert.equal(next.panelZIndex, '3060');
  assert.equal(next.warning, 'rgb(101, 67, 33)');
  assert.equal(next.margin, '10px');
  assert.equal(next.titlePadding, '7px');
  assert.equal(
    await page.evaluate(
      () =>
        document.getElementById('confirm-editor') === window.originalEditor &&
        document.activeElement === window.originalEditor &&
        window.originalEditor.value === 'business draft',
    ),
    true,
  );
  await page.evaluate(() => window.confirmState.patch('semantic'));
  assert.equal((await read()).zIndex, '4060');
  await page.evaluate(() => window.confirmState.patch('native'));
  assert.equal((await read()).zIndex, '5060');
  assert.equal(
    await page.locator('.main-confirm').evaluate((root) => getComputedStyle(root).padding),
    '20px',
  );
  await page.evaluate(() => window.confirmState.patch('removeNative'));
  assert.equal((await read()).zIndex, '4060');
  await page.evaluate(() => window.confirmState.patch('clear'));
  const cleared = await read();
  assert.equal(cleared.zIndex, '1060');
  assert.equal(cleared.nestedZIndex, '1260');
  assert.equal(cleared.panelZIndex, '1060');
  assert.equal(cleared.nestedPanelZIndex, '6060');
  assert.equal(cleared.titlePadding, '0px');
  await page.locator('#confirm-action').click();
  await page.locator('#confirm-action').click();
  const ok = page.locator('.main-confirm .apollo-popconfirm-buttons button').last();
  const cancel = page.locator('.main-confirm .apollo-popconfirm-buttons button').first();
  await ok.click();
  assert.equal(await ok.getAttribute('aria-busy'), 'true');
  await cancel.click();
  await page.locator('.main-confirm').waitFor({ state: 'hidden' });
  assert.equal(
    await page.evaluate(() => document.activeElement === document.getElementById('confirm-target')),
    true,
  );
  await page.locator('#confirm-target').click();
  await page.locator('.main-confirm').waitFor({ state: 'visible' });
  assert.notEqual(await ok.getAttribute('aria-busy'), 'true');
  assert.equal(
    await page.evaluate(
      () =>
        document.getElementById('confirm-editor') === window.originalEditor &&
        window.originalEditor.value === 'business draft',
    ),
    true,
  );
  await ok.click();
  assert.equal((await page.evaluate(() => window.confirmState.events())).requests, 2);
  await page.evaluate(() => window.confirmState.resolveRequest(0));
  await frames();
  assert.equal(await page.locator('.main-confirm').isVisible(), true);
  assert.equal(await ok.getAttribute('aria-busy'), 'true');
  await page.evaluate(() => window.confirmState.resolveRequest(1));
  await page.locator('.main-confirm').waitFor({ state: 'hidden' });
  assert.equal(
    await page.evaluate(() => document.activeElement === document.getElementById('confirm-target')),
    true,
  );
  const events = await page.evaluate(() => window.confirmState.events());
  assert.deepEqual(events.changes, [true, false, true, false]);
  assert.deepEqual(events.finished, [true, false, true, false]);
  assert.equal(events.openedOnce, 1);
  assert.equal(events.clickedOnce, 1);
  assert.equal(events.clickTargets.filter((target) => target === 'confirm-action').length, 2);
  const demo = page.locator('#demo [data-native-popconfirm-panel]');
  assert.equal(await demo.evaluate((panel) => getComputedStyle(panel).zIndex), '1060');
  await page.getByRole('button', { name: 'Theme z-index: default' }).click();
  assert.equal(await demo.evaluate((panel) => getComputedStyle(panel).zIndex), '2060');
  await page.getByRole('button', { name: 'Theme z-index: 2060' }).click();
  assert.equal(await demo.evaluate((panel) => getComputedStyle(panel).zIndex), '1060');
  assert.deepEqual(errors, []);
  console.log(
    'Popconfirm source browser: current owner/tokens, nested layers, root attrs, template events/refs, stable content/focus, async sessions and original Demo passed.',
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
