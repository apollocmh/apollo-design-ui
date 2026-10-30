/** Source-only CSS consumption: node packages/ui/src/rate/__tests__/theme-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-rate-theme-'));
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
<html lang="en"><head><title>Rate component tokens</title><link rel="icon" href="data:,"><style>*,*::before,*::after{transition:none!important;animation:none!important}</style></head>
<body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import Rate from '/@fs${repo}/packages/ui/src/rate/Rate.ts';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genRateStyle} from '/@fs${repo}/packages/ui/src/rate/style/index.ts';
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars)) document.documentElement.style.setProperty(key,value);
const css=document.createElement('style');css.textContent=['apollo','brand','next'].map(genRateStyle).join('');document.head.append(css);
const theme=ref({components:{Rate:{starColor:'#123456',starSize:34,starSizeSM:22,starSizeLG:46,starBg:'#abcdef',starHoverScale:'scale(1.35)'}}});
const prefix=ref('brand-rate'),native=ref(undefined),local=ref({'--brand-rate-star-size':'40px'});
const rating=(id,props={})=>h(Rate,{id,defaultValue:2.5,allowHalf:true,'aria-label':id,...props});
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value,components:{rate:{style:local.value}}},()=>[
rating('normal'),rating('small',{size:'small'}),rating('large',{size:'large'}),rating('custom',{prefixCls:prefix.value,style:native.value}),
h(ConfigProvider,{theme:{components:{Rate:{starColor:'#654321',starSize:50}}}},()=>rating('nested')),
])}));app.mount('#app');
window.rateTheme={async patch(kind){
if(kind==='native')native.value='--brand-rate-star-size:49px';
if(kind==='provider'){native.value=undefined;}
if(kind==='source'){local.value={};}
if(kind==='prefix')prefix.value='next-rate';
if(kind==='derive')theme.value={token:{controlHeight:56,controlHeightSM:40,controlHeightLG:72,yellow6:'#223344',colorFillContent:'#ddeeff'}};
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
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.rateTheme);
  const read = (id) =>
    page.locator(`#${id}`).evaluate((root) => ({
      size: getComputedStyle(root).fontSize,
      color: getComputedStyle(root).color,
      background: getComputedStyle(
        root.lastElementChild.querySelector('[role="radio"]').lastElementChild,
      ).color,
    }));
  assert.deepEqual(await read('normal'), {
    size: '34px',
    color: 'rgb(18, 52, 86)',
    background: 'rgb(171, 205, 239)',
  });
  assert.equal((await read('small')).size, '22px');
  assert.equal((await read('large')).size, '46px');
  assert.equal((await read('nested')).size, '50px');
  assert.equal((await read('nested')).color, 'rgb(101, 67, 33)');
  const radio = page.locator('#normal [role="radio"]').first();
  await radio.hover();
  assert.equal(
    await radio.evaluate((node) => getComputedStyle(node).transform),
    'matrix(1.35, 0, 0, 1.35, 0, 0)',
  );
  await page.mouse.move(0, 0);
  assert.equal((await read('custom')).size, '40px');
  await page.evaluate(() => window.rateTheme.patch('native'));
  assert.equal((await read('custom')).size, '49px');
  await page.evaluate(() => window.rateTheme.patch('provider'));
  assert.equal((await read('custom')).size, '40px');
  await page.evaluate(() => window.rateTheme.patch('source'));
  assert.equal((await read('custom')).size, '34px');
  await page.evaluate(() => window.rateTheme.patch('prefix'));
  assert.equal((await read('custom')).size, '34px');
  assert.equal(
    await page
      .locator('#custom')
      .evaluate((root) => root.style.getPropertyValue('--brand-rate-star-size')),
    '',
  );
  await page.evaluate(() => window.rateTheme.patch('derive'));
  assert.deepEqual(await read('normal'), {
    size: '35px',
    color: 'rgb(34, 51, 68)',
    background: 'rgb(221, 238, 255)',
  });
  assert.equal((await read('small')).size, '25px');
  assert.equal((await read('large')).size, '45px');
  assert.equal((await read('nested')).size, '50px');
  await page.evaluate(() => window.rateTheme.patch('clear'));
  assert.equal((await read('normal')).size, '20px');
  assert.equal((await read('small')).size, '15px');
  assert.equal((await read('large')).size, '25px');
  assert.equal(
    await page
      .locator('#normal')
      .evaluate((root) => root.style.getPropertyValue('--apollo-rate-star-size')),
    '',
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS Rate source CSS: six component tokens, nested/current themes, removal/global derivation, custom prefix and style precedence; no browser errors',
  );
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  await rm(fixture, { recursive: true, force: true });
}
