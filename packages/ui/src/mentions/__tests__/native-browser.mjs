import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-mentions-native-'));
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
  `<!doctype html><html lang="en"><head><title>Mentions current theme</title><link rel="icon" href="data:,"><style>*,*::before,*::after{transition:none!important;animation:none!important}body{margin:40px}.main-mentions{width:280px}.preview{margin-top:250px;width:340px}.demo{margin-top:30px;width:340px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref} from 'vue';
import {getDesignToken,transformToken,darkAlgorithm,compactAlgorithm} from '@apollo-design/theme';
import Mentions from '/@fs${repo}/packages/ui/src/mentions/Mentions.ts';
import PurePanel from '/@fs${repo}/packages/ui/src/mentions/PurePanel.ts';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {MentionsUnstableProvider} from '/@fs${repo}/packages/ui/src/mentions/engine/context.ts';
import {genMentionsStyle} from '/@fs${repo}/packages/ui/src/mentions/style/index.ts';
import TokenDemo from '/@fs${repo}/packages/ui/src/mentions/demo/component-token.vue';
for(const [name,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);
const css=document.createElement('style');css.textContent=genMentionsStyle();document.head.append(css);
const theme=ref({token:{fontSize:18,borderRadius:10,colorText:'#123456'},components:{Mentions:{paddingInline:19,inputFontSize:18,dropdownHeight:120,controlItemWidth:190,zIndexPopup:1500,itemPaddingVertical:9}}});
const semantic=ref({}),native=ref(undefined),mention=ref(null);
const options=Array.from({length:12},(_,index)=>({value:'author'+index,label:'Author '+index}));
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value},()=>[
h(MentionsUnstableProvider,{value:{open:true}},()=>h(Mentions,{ref:mention,class:'main-mentions',value:'@',options,allowClear:true,style:native.value,styles:{...semantic.value,suffix:{paddingTop:'6px'}},'aria-label':'Current theme editor'})),
h(ConfigProvider,{theme:{components:{Mentions:{dropdownHeight:80}}}},()=>h(Mentions,{class:'nested-mentions','aria-label':'Nested theme editor'})),
h('div',{class:'preview'},[h(PurePanel,{value:'@',options,'aria-label':'Static preview'})]),
h('section',{class:'demo'},[h(TokenDemo)])
])}));app.mount('#app');
const editor=mention.value.textarea;editor.focus();editor.setSelectionRange(1,1);
window.mentionsState={editor,async patch(kind){
if(kind==='next')theme.value={token:{fontSize:16,borderRadius:6,colorText:'#654321'},components:{Mentions:{paddingInline:13,inputFontSize:20,dropdownHeight:200,controlItemWidth:240,zIndexPopup:1600,itemPaddingVertical:7}}};
if(kind==='semantic')semantic.value={root:{'--apollo-mentions-padding-inline':'23px'},popup:{'--apollo-mentions-control-item-width':'260px'}};
if(kind==='native')native.value='--apollo-mentions-padding-inline: 29px';
if(kind==='removeNative')native.value=undefined;
if(kind==='dark')theme.value={algorithm:darkAlgorithm,components:{Mentions:{dropdownHeight:110}}};
if(kind==='compact')theme.value={algorithm:compactAlgorithm};
if(kind==='clear'){theme.value=undefined;semantic.value={};}
await nextTick();await nextTick();},refValid(){return mention.value.textarea===editor&&mention.value.nativeElement===document.querySelector('.main-mentions')},unmount(){app.unmount()}};
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
  await page.waitForFunction(() => window.mentionsState);
  const read = () =>
    page.evaluate(() => {
      const root = document.querySelector('.main-mentions');
      const editor = root.querySelector('textarea');
      const popup = [...document.querySelectorAll('.apollo-mentions-dropdown')].find(
        (node) => !node.closest('.preview,.demo'),
      );
      const item = popup.querySelector('li');
      const nested = document.querySelector('.nested-mentions');
      const panel = document.querySelector('.preview > div');
      const panelPopup = panel.querySelector('.apollo-mentions-dropdown');
      return {
        fontSize: getComputedStyle(root).fontSize,
        radius: getComputedStyle(root).borderRadius,
        padding: getComputedStyle(editor).paddingInlineStart,
        color: getComputedStyle(item).color,
        height: getComputedStyle(popup.querySelector('ul')).maxHeight,
        width: getComputedStyle(item).minWidth,
        vertical: getComputedStyle(item).paddingTop,
        zIndex: getComputedStyle(popup).zIndex,
        suffix: getComputedStyle(root.querySelector('.apollo-mentions-suffix')).paddingTop,
        nestedColor: getComputedStyle(nested).color,
        nestedHeight: getComputedStyle(nested)
          .getPropertyValue('--apollo-mentions-dropdown-height')
          .trim(),
        focused: document.activeElement === editor,
        refValid: window.mentionsState.refValid(),
        panelPosition: getComputedStyle(panelPopup).position,
        panelOwnsLayout:
          panel.getBoundingClientRect().height >= panelPopup.getBoundingClientRect().height + 20,
        editorSame: editor === window.mentionsState.editor,
      };
    });
  const initial = await read();
  assert.equal(initial.fontSize, '18px');
  assert.equal(initial.radius, '10px');
  assert.equal(initial.padding, '19px');
  assert.equal(initial.height, '120px');
  assert.equal(initial.width, '190px');
  assert.equal(initial.vertical, '9px');
  assert.equal(initial.zIndex, '1500');
  assert.equal(initial.suffix, '6px');
  assert.equal(initial.color, 'rgb(18, 52, 86)');
  assert.equal(initial.nestedHeight, '80px');
  assert.equal(initial.panelPosition, 'relative');
  assert.equal(initial.panelOwnsLayout, true);
  assert.equal(initial.refValid, true);
  assert.equal(initial.focused, true);
  const patch = (kind) => page.evaluate((value) => window.mentionsState.patch(value), kind);
  await patch('next');
  const next = await read();
  assert.equal(next.fontSize, '20px');
  assert.equal(next.radius, '6px');
  assert.equal(next.padding, '13px');
  assert.equal(next.height, '200px');
  assert.equal(next.width, '240px');
  assert.equal(next.vertical, '7px');
  assert.equal(next.zIndex, '1600');
  assert.equal(next.nestedColor, 'rgb(101, 67, 33)');
  assert.equal(next.editorSame && next.focused, true);
  await patch('semantic');
  assert.equal((await read()).width, '260px');
  assert.equal((await read()).padding, '23px');
  await patch('native');
  assert.equal((await read()).padding, '29px');
  await patch('removeNative');
  assert.equal((await read()).padding, '23px');
  await patch('dark');
  assert.equal((await read()).height, '110px');
  await patch('compact');
  assert.ok(Number.parseFloat((await read()).vertical) < 5);
  await patch('clear');
  const cleared = await read();
  assert.equal(cleared.height, '250px');
  assert.equal(cleared.width, '100px');
  assert.equal(cleared.padding, '11px');
  assert.equal(cleared.editorSame && cleared.focused && cleared.refValid, true);
  const demoMenu = page.locator('.demo .apollo-mentions-dropdown-menu');
  assert.equal(await demoMenu.evaluate((element) => getComputedStyle(element).maxHeight), '500px');
  await page.getByRole('button', { name: 'Toggle component tokens' }).click();
  assert.equal(await demoMenu.evaluate((element) => getComputedStyle(element).maxHeight), '120px');
  await page.evaluate(() => window.mentionsState.unmount());
  assert.equal(await page.locator('.apollo-mentions-dropdown').count(), 0);
  assert.deepEqual(errors, []);
  process.stdout.write(
    `${JSON.stringify({ source: true, initial, next, cleared, demo: 'current tokens', errors })}\n`,
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
