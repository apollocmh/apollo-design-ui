import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-autocomplete-native-'));
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
  `<!doctype html><html lang="en"><head><title>AutoComplete contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{animation:none!important;transition:none!important}body{margin:40px}.demo{margin-top:220px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import AutoComplete from '/@fs${repo}/packages/ui/src/auto-complete/AutoComplete.ts';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genSelectStyle} from '/@fs${repo}/packages/ui/src/select/style/index.ts';
import Basic from '/@fs${repo}/packages/ui/src/auto-complete/demo/basic.vue';
for(const [name,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);
const css=document.createElement('style');css.textContent=genSelectStyle();document.head.append(css);
const value=ref('seed'),search=ref(''),open=ref(true),backfill=ref(true),accept=ref(false),control=ref(null),events=[];
const theme=ref({components:{Select:{optionHeight:40,selectorBg:'#f6ffed'}}});
const options=[{value:'alpha',label:'Alpha'},{value:'beta',label:'Beta'},{value:0,label:'Zero'}];
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value},()=>[
h(AutoComplete,{ref:control,class:'current-autocomplete',value:value.value,searchValue:search.value,open:open.value,backfill:backfill.value,options,filterOption:false,style:'width:280px',classNames:{popup:{root:'current-popup'}},'aria-label':'Backfill suggestions',
'onUpdate:value':v=>{events.push(['value',v]);if(accept.value)value.value=v},'onUpdate:searchValue':v=>{events.push(['searchValue',v]);search.value=v},'onUpdate:open':v=>events.push(['open',v]),onChange:v=>events.push(['change',v]),onSearch:v=>events.push(['search',v])}),
h('div',{class:'demo'},[h(Basic)])
])}));app.mount('#app');await nextTick();await nextTick();
const input=control.value.nativeElement.querySelector('input');control.value.focus({preventScroll:true});events.length=0;
window.autoState={input,events,state:()=>({value:value.value,search:search.value,open:open.value,preview:input.value,same:control.value.nativeElement.querySelector('input')===input,focused:document.activeElement===input}),async patch(kind){
if(kind==='accept')accept.value=true;
if(kind==='external')value.value='external';
if(kind==='flagOff')backfill.value=false;
if(kind==='flagOn')backfill.value=true;
if(kind==='close')open.value=false;
if(kind==='open')open.value=true;
if(kind==='theme')theme.value={components:{Select:{optionHeight:48,selectorBg:'#fff1f0'}}};
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
      window.autoState &&
      document.querySelector('.current-popup .apollo-select-item-option')?.getBoundingClientRect()
        .height > 0,
  );
  const input = page.locator('.current-autocomplete input');
  const read = () => page.evaluate(() => window.autoState.state());
  await input.press('ArrowDown');
  assert.equal((await read()).preview, 'beta');
  assert.deepEqual(await page.evaluate(() => window.autoState.events), []);
  await input.press('Enter');
  assert.equal((await read()).value, 'seed');
  assert.equal((await read()).preview, 'seed');
  const rejected = await page.evaluate(() => window.autoState.events);
  assert.deepEqual(
    rejected.filter((event) => event[0] === 'value'),
    [['value', 'beta']],
  );
  assert.deepEqual(
    rejected.filter((event) => event[0] === 'searchValue'),
    [['searchValue', 'beta']],
  );
  assert.deepEqual(
    rejected.filter((event) => event[0] === 'search'),
    [],
  );
  const patch = (kind) => page.evaluate((value) => window.autoState.patch(value), kind);
  await patch('accept');
  await input.press('ArrowDown');
  assert.equal((await read()).preview, '0');
  await input.press('Enter');
  assert.equal((await read()).value, 0);
  assert.equal((await read()).preview, '0');
  await input.press('ArrowDown');
  assert.equal((await read()).preview, 'alpha');
  await patch('external');
  assert.equal((await read()).preview, 'external');
  await input.press('ArrowDown');
  await patch('flagOff');
  assert.equal((await read()).preview, 'external');
  await patch('flagOn');
  await input.press('ArrowDown');
  await patch('close');
  assert.equal((await read()).preview, 'external');
  await patch('open');
  assert.equal((await read()).preview, 'external');
  await patch('theme');
  assert.equal(
    await page
      .locator('.current-autocomplete')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgb(255, 241, 240)',
  );
  // CSS animation is disabled by the fixture; wait for Select's 500ms motion deadline after reopening.
  await page.waitForTimeout(600);
  await page.waitForFunction(
    () =>
      document.querySelector('.current-popup .apollo-select-item-option')?.getBoundingClientRect()
        .height === 48,
  );
  assert.equal(
    await page
      .locator('.current-popup .apollo-select-item-option')
      .first()
      .evaluate((element) => element.getBoundingClientRect().height),
    48,
  );
  assert.equal((await read()).same && (await read()).focused, true);
  await input.press('Tab');
  assert.equal((await read()).focused, false);
  const basic = page.locator('.demo input').first();
  await basic.fill('fruit');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.apollo-select-item-option')].some(
      (element) => element.textContent === 'fruitfruit',
    ),
  );
  await page.evaluate(() => window.autoState.unmount());
  assert.equal(await page.locator('.apollo-select-dropdown').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    'AutoComplete source browser: real keyboard preview/commit/rejection/0/close/reopen/Tab focus, current shared theme, native refs/focus and search Demo passed in ' +
      Math.round(performance.now() - started) +
      'ms.',
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
