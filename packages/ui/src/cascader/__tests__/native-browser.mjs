import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now(),
  repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-cascader-native-'));
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
  `<!doctype html><html lang="en"><head><title>Cascader contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{animation:none!important;transition:none!important}body{margin:40px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref,shallowRef} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import NativeCascader from '/@fs${repo}/packages/ui/src/cascader/__tests__/fixtures/NativeCascader.vue';
import Panel from '/@fs${repo}/packages/ui/src/cascader/Panel.ts';
import Cascader from '/@fs${repo}/packages/ui/src/cascader/Cascader.ts';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genCascaderStyle} from '/@fs${repo}/packages/ui/src/cascader/style/index.ts';
for(const [name,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);
const css=document.createElement('style');css.textContent=genCascaderStyle('apollo');document.head.append(css);
const instance=shallowRef(null),width=ref(261),decorate=ref(true),panelValue=ref([]),panelData=ref([{value:'constructor',label:'Async parent',isLeaf:false}]);
const rawOpen=ref(true),rawValue=ref([]);
let loads=0;
const app=createApp(defineComponent({setup:()=>()=>[
h(NativeCascader,{ref:instance,width:width.value,decorate:decorate.value}),
h('div',{style:'position:absolute;left:640px;top:40px'},[h(ConfigProvider,{theme:{components:{Cascader:{dropdownHeight:211}}}},()=>h(Cascader,{class:'native-raw-trigger',open:rawOpen.value,value:rawValue.value,options:[{value:0,label:'Raw zero'}],popupClassName:'native-raw-popup',popupStyle:{zIndex:1630,backgroundColor:'pink'},popupMatchSelectWidth:320,'onUpdate:open':value=>rawOpen.value=value,'onUpdate:value':value=>rawValue.value=value},{default:()=>h('button',{type:'button'},'Raw trigger')}))]),
h('div',{style:'margin-top:280px'},[h(ConfigProvider,{direction:'rtl',theme:{components:{Cascader:{controlItemWidth:153,menuPadding:9}}}},()=>h(Panel,{class:'native-static-panel',value:panelValue.value,options:panelData.value,popupMenuColumnStyle:{width:'241px'},'aria-label':'Standalone path','onUpdate:value':value=>panelValue.value=value,loadData:async options=>{loads++;await new Promise(resolve=>setTimeout(resolve,80));options.at(-1).children=[{value:0,label:'Loaded zero'}];}}))])
]}));app.mount('#app');await nextTick();await nextTick();
window.cascaderNative={instance,async patch(kind){if(kind==='theme'){width.value=299;decorate.value=false}if(kind==='reopen')instance.value.open=true;if(kind==='rawOpen')rawOpen.value=true;if(kind==='release')instance.value.value=[];await nextTick();await nextTick()},state(){const current=instance.value;return {value:current.value,open:current.open,search:current.search,panelValue:panelValue.value,rawValue:rawValue.value,rawOpen:rawOpen.value,loads,native:current.picker.nativeElement===document.querySelector('.native-cascader')}} ,unmount(){app.unmount()}};
</script></body></html>`,
);
let server, browser;
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 950 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.nativeErrors = [];
    window.addEventListener('error', (event) => window.nativeErrors.push(event.message));
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(
    () =>
      window.cascaderNative &&
      document
        .querySelector('.native-cascader-popup .apollo-cascader-menu-item')
        ?.getBoundingClientRect().height > 0,
  );
  const state = () => page.evaluate(() => window.cascaderNative.state());
  const patch = (kind) => page.evaluate((value) => window.cascaderNative.patch(value), kind);
  const rawPopup = page.locator('.native-raw-popup');
  assert.deepEqual(
    await rawPopup.evaluate((node) => {
      const css = getComputedStyle(node);
      return [css.width, css.zIndex, css.backgroundColor];
    }),
    ['320px', '1630', 'rgb(255, 192, 203)'],
  );
  assert.equal(
    await rawPopup
      .locator('.apollo-cascader-menu')
      .evaluate((node) => getComputedStyle(node).height),
    '211px',
  );
  const input = page.locator('.native-cascader input');
  assert.equal(await input.getAttribute('aria-label'), 'Native Cascader');
  assert.equal((await state()).native, true);
  assert.equal(
    await page.locator('.native-cascader').evaluate((node) => getComputedStyle(node).width),
    '261px',
  );
  const menuStyle = () =>
    page
      .locator('.native-cascader-popup .apollo-cascader-menu')
      .first()
      .evaluate((node) => {
        const css = getComputedStyle(node);
        return { width: css.minWidth, height: css.height, padding: css.padding };
      });
  assert.deepEqual(await menuStyle(), { width: '137px', height: '207px', padding: '6px' });
  const row = page.locator('.native-cascader-popup .apollo-cascader-menu-item').first();
  assert.equal(await row.evaluate((node) => getComputedStyle(node).padding), '7px 13px');
  const draft = page.locator('[data-panel-draft]');
  await draft.fill('preserve the editor');
  await page.evaluate(
    () => (window.savedCascaderDraft = document.querySelector('[data-panel-draft]')),
  );
  await patch('theme');
  assert.equal(
    await page.locator('.native-cascader').evaluate((node) => getComputedStyle(node).width),
    '299px',
  );
  assert.equal(
    await page.evaluate(
      () => document.querySelector('[data-panel-draft]') === window.savedCascaderDraft,
    ),
    true,
  );
  assert.equal(await draft.inputValue(), 'preserve the editor');
  assert.equal(await draft.evaluate((node) => document.activeElement === node), true);
  assert.equal(await page.locator('.native-option').count(), 0);
  await input.focus();
  await input.press('ArrowDown');
  assert.deepEqual(
    await row.evaluate((node) => {
      const css = getComputedStyle(node);
      return [css.backgroundColor, css.color, css.fontWeight];
    }),
    ['rgb(18, 52, 86)', 'rgb(254, 254, 254)', '700'],
  );
  await input.press('ArrowRight');
  await input.press('Enter');
  assert.deepEqual((await state()).value, ['parent', 0]);
  assert.equal((await state()).open, false);
  assert.equal(await page.locator('.native-display').innerText(), 'Parent > Zero');
  await patch('reopen');
  await input.fill('Zero');
  await page.waitForSelector('.native-search');
  assert.equal(await page.locator('.native-search').first().innerText(), 'Zero:2');
  await input.press('Space');
  assert.equal((await state()).search, 'Zero ');
  await input.fill('Zero');
  await input.press('ArrowDown');
  await input.press('Enter');
  assert.deepEqual((await state()).value, ['parent', 0]);
  const panel = page.locator('.native-static-panel');
  assert.equal(await panel.getAttribute('dir'), 'rtl');
  assert.equal(await panel.getAttribute('aria-label'), 'Standalone path');
  assert.equal(
    await panel
      .locator('.apollo-cascader-menu')
      .first()
      .evaluate((node) => getComputedStyle(node).width),
    '241px',
  );
  await panel.focus();
  await panel.press('ArrowDown');
  await panel.press('ArrowLeft');
  await page.waitForSelector('.native-static-panel .apollo-cascader-menu:nth-child(2)');
  assert.equal((await state()).loads, 1);
  await panel.press('ArrowLeft');
  await panel.press('Enter');
  assert.deepEqual((await state()).panelValue, ['constructor', 0]);
  await patch('rawOpen');
  const rawTrigger = page.locator('.native-raw-trigger');
  await rawTrigger.focus();
  await rawTrigger.press('ArrowDown');
  await rawTrigger.press('Enter');
  assert.deepEqual((await state()).rawValue, [0]);
  assert.equal((await state()).rawOpen, false);
  await page.evaluate(() => window.cascaderNative.unmount());
  assert.equal(await page.locator('.native-cascader-popup').count(), 0);
  assert.equal(await page.locator('[data-panel-draft]').count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.nativeErrors), []);
  console.log(
    `Cascader native browser passed (${((performance.now() - started) / 1000).toFixed(2)}s): compiled slots and identity, typed model/keyboard/search, live tokens, standalone RTL lazy loading and cleanup.`,
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
