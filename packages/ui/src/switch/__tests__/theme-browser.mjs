/** Source-only CSS consumption: node packages/ui/src/switch/__tests__/theme-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-switch-theme-'));
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
  `<!doctype html>
<html lang="en"><head><title>Switch component tokens</title><link rel="icon" href="data:,"><style>*,*::before,*::after{transition:none!important;animation:none!important}</style></head>
<body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import Switch from '/@fs${repo}/packages/ui/src/switch/Switch.ts';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import TokenDemo from '/@fs${repo}/packages/ui/src/switch/demo/component-token.vue';
import {genSwitchStyle} from '/@fs${repo}/packages/ui/src/switch/style/index.ts';
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars)) document.documentElement.style.setProperty(key,value);
const css=document.createElement('style');css.textContent=['apollo','brand','next'].map(genSwitchStyle).join('');document.head.append(css);
const theme=ref({components:{Switch:{trackHeight:30,trackHeightSM:20,trackMinWidth:80,trackMinWidthSM:50,trackPadding:3,handleSize:24,handleSizeSM:16,handleBg:'#123456',handleShadow:'0 0 4px #abcdef',innerMinMargin:10,innerMaxMargin:32,innerMinMarginSM:6,innerMaxMarginSM:20}}});
const prefix=ref('brand-switch'),native=ref(undefined),semantic=ref({'--brand-switch-track-height':'44px'}),provider=ref({'--brand-switch-track-height':'40px'});
const control=(id,props={})=>h(Switch,{id,'aria-label':id,checkedChildren:'On',unCheckedChildren:'Off',...props});
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value,components:{switch:{style:provider.value}}},()=>[
control('normal'),control('checked',{defaultChecked:true}),control('small',{size:'small'}),control('custom',{prefixCls:prefix.value,style:native.value,styles:{root:semantic.value}}),
h(ConfigProvider,{theme:{components:{Switch:{trackHeight:46,handleBg:'#654321'}}}},()=>control('nested')),
h('section',{id:'demo'},[h(TokenDemo)]),
])}));app.mount('#app');
window.switchTheme={async patch(kind){
if(kind==='native')native.value='--brand-switch-track-height:49px';
if(kind==='provider'){native.value=undefined;semantic.value={};}
if(kind==='source')provider.value={};
if(kind==='prefix')prefix.value='next-switch';
if(kind==='derive')theme.value={token:{fontSize:16,lineHeight:2,controlHeight:36,colorWhite:'#112233',colorPrimary:'#234567'}};
if(kind==='clear')theme.value=undefined;
await nextTick();}};
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
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]')) {
      errors.push(message.text());
    }
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.switchTheme);
  const read = (id) =>
    page.locator(`#${id}`).evaluate((root) => {
      const handle = root.querySelector('[class$="-handle"]');
      const inner = root.querySelector('[class$="-inner"]');
      const track = getComputedStyle(root);
      const thumb = getComputedStyle(handle);
      const glyph = getComputedStyle(handle, '::before');
      const content = getComputedStyle(inner);
      return {
        height: track.height,
        minWidth: track.minWidth,
        padding: thumb.top,
        size: thumb.width,
        background: glyph.backgroundColor,
        shadow: glyph.boxShadow,
        innerStart: content.paddingInlineStart,
        innerEnd: content.paddingInlineEnd,
        trackBackground: track.backgroundColor,
      };
    });
  const normal = await read('normal');
  assert.equal(normal.height, '30px');
  assert.equal(normal.minWidth, '80px');
  assert.equal(normal.padding, '3px');
  assert.equal(normal.size, '24px');
  assert.equal(normal.background, 'rgb(18, 52, 86)');
  assert.equal(normal.shadow, 'rgb(171, 205, 239) 0px 0px 4px 0px');
  assert.equal(normal.innerStart, '32px');
  assert.equal(normal.innerEnd, '10px');
  const small = await read('small');
  assert.equal(small.height, '20px');
  assert.equal(small.minWidth, '50px');
  assert.equal(small.size, '16px');
  assert.equal(small.innerStart, '20px');
  assert.equal(small.innerEnd, '6px');
  assert.equal((await read('nested')).height, '46px');
  assert.equal((await read('nested')).background, 'rgb(101, 67, 33)');
  assert.equal((await read('custom')).height, '44px');
  await page.evaluate(() => window.switchTheme.patch('native'));
  assert.equal((await read('custom')).height, '49px');
  await page.evaluate(() => window.switchTheme.patch('provider'));
  assert.equal((await read('custom')).height, '40px');
  await page.evaluate(() => window.switchTheme.patch('source'));
  assert.equal((await read('custom')).height, '30px');
  await page.evaluate(() => window.switchTheme.patch('prefix'));
  assert.equal((await read('custom')).height, '30px');
  assert.equal(
    await page
      .locator('#custom')
      .evaluate((root) => root.style.getPropertyValue('--brand-switch-track-height')),
    '',
  );
  await page.evaluate(() => window.switchTheme.patch('derive'));
  assert.equal((await read('normal')).height, '32px');
  assert.equal((await read('normal')).size, '28px');
  assert.equal((await read('normal')).background, 'rgb(17, 34, 51)');
  assert.equal((await read('small')).height, '18px');
  assert.equal((await read('small')).size, '14px');
  assert.equal((await read('checked')).trackBackground, 'rgb(35, 69, 103)');
  assert.equal((await read('nested')).height, '46px');
  await page.evaluate(() => window.switchTheme.patch('clear'));
  assert.equal((await read('normal')).height, '22px');
  assert.equal((await read('small')).height, '16px');
  assert.equal(
    await page
      .locator('#normal')
      .evaluate((root) => root.style.getPropertyValue('--apollo-switch-track-height')),
    '',
  );
  const demo = await page.locator('#demo button').evaluate((root) => ({
    height: getComputedStyle(root).height,
    padding: getComputedStyle(root.firstElementChild).top,
    size: getComputedStyle(root.firstElementChild).width,
  }));
  assert.deepEqual(demo, { height: '14px', padding: '-3px', size: '20px' });
  assert.deepEqual(errors, []);
  console.log(
    'PASS Switch source CSS: thirteen component tokens, current/nested themes, removal/global derivation, custom prefix, root style precedence and actual token Demo; no browser or Vue errors',
  );
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  await rm(fixture, { recursive: true, force: true });
}
