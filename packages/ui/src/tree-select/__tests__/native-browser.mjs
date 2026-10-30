import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-tree-select-native-'));
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
  `<!doctype html><html lang="en"><head><title>TreeSelect contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{animation:none!important;transition:none!important}body{margin:40px}.async-demo{margin-top:260px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref,shallowRef} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import TreeSelect from '/@fs${repo}/packages/ui/src/tree-select/TreeSelect.ts';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genTreeSelectStyle} from '/@fs${repo}/packages/ui/src/tree-select/style/index.ts';
import AsyncDemo from '/@fs${repo}/packages/ui/src/tree-select/demo/async.vue';
for(const [name,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);
const css=document.createElement('style');css.textContent=genTreeSelectStyle('apollo');document.head.append(css);
const value=ref('other'),search=ref(''),open=ref(true),accept=ref(false),control=ref(null),events=[];
const data=shallowRef([{value:'parent',title:'Parent',children:[{value:0,title:'Zero',isLeaf:true}]},{value:'other',title:'Other',isLeaf:true}]);
const theme=ref({token:{controlHeight:44},components:{Tree:{titleHeight:30,switcherSize:30},Select:{selectorBg:'#f6ffed'}}});
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value},()=>[
h(TreeSelect,{ref:control,class:'current-tree-select',value:value.value,searchValue:search.value,open:open.value,treeData:data.value,treeDefaultExpandAll:true,showSearch:{treeNodeFilterProp:'title',autoClearSearchValue:false},style:'width:280px',classNames:{popup:{root:'current-popup'}},'aria-label':'Choose tree node',
'onUpdate:value':v=>{events.push(['value',v]);if(accept.value)value.value=v},'onUpdate:searchValue':v=>{events.push(['searchValue',v]);search.value=v},'onUpdate:open':v=>{events.push(['open',v]);if(accept.value)open.value=v},onChange:v=>events.push(['change',v]),onSearch:v=>events.push(['search',v])}),
h('div',{class:'async-demo'},[h(AsyncDemo,{classNames:{popup:{root:'async-popup'}}})])
])}));app.mount('#app');await nextTick();await nextTick();
const input=control.value.nativeElement.querySelector('input');control.value.focus({preventScroll:true});events.length=0;
window.treeSelectState={input,events,state:()=>({value:value.value,search:search.value,open:open.value,label:control.value.nativeElement.querySelector('.apollo-tree-select-content').textContent,same:control.value.nativeElement.querySelector('input')===input,focused:document.activeElement===input}),async patch(kind){
if(kind==='accept')accept.value=true;
if(kind==='open')open.value=true;
if(kind==='clearSearch')search.value='';
if(kind==='theme')theme.value={token:{controlHeight:48},components:{Tree:{titleHeight:36,switcherSize:36},Select:{selectorBg:'#fff1f0'}}};
if(kind==='dropData')data.value=[];
await nextTick();await nextTick();},unmount(){app.unmount()}};
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
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(
    () =>
      window.treeSelectState &&
      document.querySelector('.current-popup [role="treeitem"]')?.getBoundingClientRect().height >
        0,
  );
  const input = page.locator('.current-tree-select input');
  assert.equal(await input.getAttribute('aria-haspopup'), 'tree');
  assert.equal(
    await input.evaluate((element) =>
      document.getElementById(element.getAttribute('aria-controls'))?.getAttribute('role'),
    ),
    'tree',
  );
  const read = () => page.evaluate(() => window.treeSelectState.state());
  const patch = (kind) => page.evaluate((value) => window.treeSelectState.patch(value), kind);
  assert.equal(
    await page
      .locator('.current-tree-select')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgb(246, 255, 237)',
  );
  await input.fill('Zero');
  await page.waitForFunction(
    () => document.querySelectorAll('.current-popup [role="treeitem"]').length === 2,
  );
  await input.press('Enter');
  assert.equal((await read()).value, 'other');
  assert.equal((await read()).search, 'Zero');
  assert.deepEqual(
    (await page.evaluate(() => window.treeSelectState.events)).filter(
      (event) => event[0] === 'value',
    ),
    [['value', 0]],
  );
  await input.press('Escape');
  assert.equal((await read()).open, true);
  await patch('accept');
  await input.press('Enter');
  assert.equal((await read()).value, 0);
  assert.equal((await read()).open, false);
  assert.equal((await read()).same && (await read()).focused, true);
  await patch('clearSearch');
  await patch('open');
  await patch('theme');
  // The fixture disables animationend; settle the existing 500ms popup motion deadline.
  await page.waitForTimeout(600);
  await page.waitForFunction(
    () =>
      document.querySelector('.current-popup [role="treeitem"]')?.getBoundingClientRect().height ===
      36,
  );
  assert.equal(
    await page
      .locator('.current-tree-select')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgb(255, 241, 240)',
  );
  assert.equal(
    await page
      .locator('.current-popup [role="treeitem"]')
      .first()
      .evaluate((element) => element.getBoundingClientRect().height),
    36,
  );
  assert.equal(
    await page
      .locator('.current-popup [role="treeitem"]')
      .evaluateAll(
        (elements) =>
          elements[1].getBoundingClientRect().top - elements[0].getBoundingClientRect().top,
      ),
    40,
  );
  await patch('dropData');
  assert.equal((await read()).label, 'Zero');
  await input.press('Tab');
  assert.equal((await read()).focused, false);
  await page.locator('.async-demo input').click();
  await page.locator('.async-popup .apollo-tree-select-switcher').first().click();
  await page
    .locator('.async-popup .apollo-tree-select-title')
    .filter({ hasText: 'Child Node' })
    .waitFor();
  assert.equal(
    await page.locator('.async-popup .apollo-tree-select-switcher-loading-icon').count(),
    0,
  );
  await page.evaluate(() => window.treeSelectState.unmount());
  assert.equal(await page.locator('.apollo-tree-select-dropdown').count(), 0);
  assert.deepEqual(errors, [], `Browser diagnostics: ${errors.join('\n')}`);
  console.log(
    `TreeSelect source browser: real keyboard/controlled rejection/zero/search, focus and identity, shared tokens, async Demo and cleanup passed in ${Math.round(performance.now() - started)}ms.`,
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
