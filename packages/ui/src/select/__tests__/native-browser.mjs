import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-select-native-'));
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
  `<!doctype html><html lang="en"><head><title>Select native contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{transition:none!important;animation:none!important}body{margin:40px}.preview{margin-top:300px;width:300px}.demo{margin-top:40px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref} from 'vue';
import {getDesignToken,transformToken,darkAlgorithm,compactAlgorithm} from '@apollo-design/theme';
import Select from '/@fs${repo}/packages/ui/src/select/Select.ts';
import PurePanel from '/@fs${repo}/packages/ui/src/select/PurePanel.ts';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genSelectStyle} from '/@fs${repo}/packages/ui/src/select/style/index.ts';
import Demo from '/@fs${repo}/packages/ui/src/select/demo/component-token.vue';
for(const [name,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);
const css=document.createElement('style');css.textContent=genSelectStyle()+genSelectStyle('custom');document.head.append(css);
const theme=ref({token:{colorText:'#123456',borderRadius:10},components:{Select:{optionHeight:40,optionFontSize:18,optionSelectedBg:'#ffeedd',selectorBg:'#f6ffed',clearBg:'#ddffee',zIndexPopup:1500,singleItemHeightLG:48,multipleItemBorderColor:'#123456',multipleItemColorDisabled:'#321654',multipleItemBorderColorDisabled:'#765432',multipleSelectorBgDisabled:'#aabbcc'}}});
const semantic=ref({}),native=ref(undefined),select=ref(null),label=ref(false);
const options=Array.from({length:40},(_,index)=>({value:index,label:'Option '+index}));
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value},()=>[
h(Select,{ref:select,class:'main-select',defaultValue:0,options,open:true,listHeight:128,size:'large',allowClear:true,style:native.value,styles:semantic.value,classNames:{popup:{root:'main-popup'}},'aria-label':'Main select'},label.value?{labelRender:()=>0}:{}),
h(Select,{class:'disabled-multiple',mode:'multiple',disabled:true,value:[0],options,'aria-label':'Disabled multiple'}),
h(ConfigProvider,{theme:{components:{Select:{optionHeight:48}}}},()=>h(Select,{class:'nested-select','aria-label':'Nested select'})),
h(ConfigProvider,{prefixCls:'custom'},()=>h(Select,{class:'custom-prefix',options,'aria-label':'Custom prefix'})),
h('div',{class:'preview'},[h(PurePanel,{options:options.slice(0,3),'aria-label':'Static select'})]),
h('div',{class:'demo'},[h(Demo)])
])}));app.mount('#app');
await nextTick();await nextTick();
const input=select.value.nativeElement.querySelector('input');select.value.focus({preventScroll:true});
window.selectState={input,scroll(value){select.value.scrollTo(value)},async patch(kind){
if(kind==='next')theme.value={token:{colorText:'#654321',borderRadius:6},components:{Select:{optionHeight:52,optionFontSize:20,selectorBg:'#fff1f0',zIndexPopup:1600,singleItemHeightLG:54}}};
if(kind==='semantic')semantic.value={root:{'--apollo-select-selector-bg':'#abcdef'},popup:{root:{'--apollo-select-option-font-size':'22px'}}};
if(kind==='native')native.value=['--apollo-select-selector-bg:#fedcba',{marginTop:'3px'}];
if(kind==='label')label.value=true;
if(kind==='dark')theme.value={algorithm:darkAlgorithm};
if(kind==='compact')theme.value={algorithm:compactAlgorithm};
if(kind==='clear'){theme.value=undefined;semantic.value={};native.value=undefined;}
await nextTick();await nextTick();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},unmount(){app.unmount()}};
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.selectState);
  await page.waitForFunction(
    () =>
      document.querySelector('.main-popup .apollo-select-item-option')?.getBoundingClientRect()
        .height > 0,
  );
  await page.locator('.main-popup .apollo-select-item-option').nth(1).dispatchEvent('mousemove');
  const read = () =>
    page.evaluate(() => {
      const root = document.querySelector('.main-select');
      const popup = document.querySelector('.main-popup');
      const item = popup.querySelector('.apollo-select-item-option');
      const multiple = document.querySelector('.disabled-multiple');
      const disabled = multiple.querySelector('.apollo-select-selection-item');
      const panel = document.querySelector('.preview > div');
      const panelPopup = panel.querySelector('.apollo-select-dropdown');
      return {
        radius: getComputedStyle(root).borderRadius,
        height: root.getBoundingClientRect().height,
        bg: getComputedStyle(root).backgroundColor,
        color: getComputedStyle(item).color,
        itemHeight: item.getBoundingClientRect().height,
        itemFont: getComputedStyle(item).fontSize,
        selectedBg: getComputedStyle(item).backgroundColor,
        clearBg: getComputedStyle(root.querySelector('.apollo-select-clear')).backgroundColor,
        zIndex: getComputedStyle(popup).zIndex,
        nestedHeight: getComputedStyle(document.querySelector('.nested-select'))
          .getPropertyValue('--apollo-select-option-height')
          .trim(),
        multipleBg: getComputedStyle(multiple).backgroundColor,
        disabledColor: getComputedStyle(disabled).color,
        disabledBorder: getComputedStyle(disabled).borderColor,
        panelPosition: getComputedStyle(panelPopup).position,
        panelOwnsLayout:
          panel.getBoundingClientRect().height >= panelPopup.getBoundingClientRect().height,
        sameInput: root.querySelector('input') === window.selectState.input,
        focused: document.activeElement === window.selectState.input,
        scrollTop: popup.querySelector('.apollo-select-dropdown-list-holder').scrollTop,
        label: root.querySelector('.apollo-select-content').textContent,
        customBg: getComputedStyle(document.querySelector('.custom-prefix')).backgroundColor,
        demoBg: getComputedStyle(document.querySelector('.demo .apollo-select')).backgroundColor,
      };
    });
  const initial = await read();
  assert.equal(initial.radius, '12px');
  assert.equal(initial.height, 48);
  assert.equal(initial.itemHeight, 40);
  assert.equal(initial.itemFont, '18px');
  assert.equal(initial.bg, 'rgb(246, 255, 237)');
  assert.equal(initial.color, 'rgb(18, 52, 86)');
  assert.equal(initial.selectedBg, 'rgb(255, 238, 221)');
  assert.equal(initial.clearBg, 'rgb(221, 255, 238)');
  assert.equal(initial.zIndex, '1500');
  assert.equal(initial.nestedHeight, '48px');
  assert.equal(initial.multipleBg, 'rgb(170, 187, 204)');
  assert.equal(initial.disabledColor, 'rgb(50, 22, 84)');
  assert.equal(initial.disabledBorder, 'rgb(118, 84, 50)');
  assert.equal(initial.panelPosition, 'relative');
  assert.equal(initial.panelOwnsLayout, true);
  assert.equal(initial.customBg, 'rgb(246, 255, 237)');
  assert.equal(initial.demoBg, 'rgb(246, 255, 237)');
  assert.equal(initial.sameInput && initial.focused, true);
  await page.evaluate(() => window.selectState.scroll(320));
  await page.waitForFunction(
    () =>
      document.querySelector('.main-popup .apollo-select-dropdown-list-holder').scrollTop === 320,
  );
  await page.evaluate(() => window.selectState.scroll({ key: 20, align: 'top' }));
  await page.waitForFunction(
    () =>
      document.querySelector('.main-popup .apollo-select-dropdown-list-holder').scrollTop === 800,
  );
  const patch = (kind) => page.evaluate((value) => window.selectState.patch(value), kind);
  await patch('next');
  const next = await read();
  assert.equal(next.height, 54);
  assert.equal(next.itemHeight, 52);
  assert.equal(next.itemFont, '20px');
  assert.equal(next.color, 'rgb(101, 67, 33)');
  assert.equal(next.zIndex, '1600');
  assert.equal(next.sameInput && next.focused, true);
  await patch('semantic');
  assert.equal((await read()).bg, 'rgb(171, 205, 239)');
  assert.equal((await read()).itemFont, '22px');
  await patch('native');
  assert.equal((await read()).bg, 'rgb(254, 220, 186)');
  await patch('label');
  assert.equal((await read()).label, '0');
  await patch('dark');
  await patch('compact');
  await patch('clear');
  assert.equal((await read()).itemHeight, 32);
  await page.evaluate(() => window.selectState.unmount());
  assert.equal(await page.locator('.apollo-select-dropdown').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    'Select source browser: current/nested/dark/compact theme, real refs, focus, scroll, static panel and token Demo passed.',
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
