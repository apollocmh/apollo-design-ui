/** Source-only CSS/DOM check: node packages/ui/src/tooltip/__tests__/native-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-tooltip-native-'));
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
  `<!doctype html><html lang="en"><head><title>Tooltip native contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{transition:none!important;animation:none!important}body{margin:0;font-family:sans-serif}#tooltip-target{position:absolute;left:400px;top:300px;width:120px;height:40px}#nested-target{position:absolute;left:800px;top:300px}#resize-target{position:absolute;left:500px;top:450px;width:120px;height:40px}#panels{position:absolute;top:600px;left:100px}</style></head>
<body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import Tooltip from '/@fs${repo}/packages/ui/src/tooltip/Tooltip.ts';
import PurePanel from '/@fs${repo}/packages/ui/src/tooltip/PurePanel.ts';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import Demo from '/@fs${repo}/packages/ui/src/tooltip/demo/style-class.vue';
import {genTooltipStyle} from '/@fs${repo}/packages/ui/src/tooltip/style/index.ts';
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(key,value);
const css=document.createElement('style');css.textContent=genTooltipStyle();document.head.append(css);
const theme=ref({token:{borderRadius:18,sizePopupArrow:24,marginXXS:10,colorBgSpotlight:'#123456'},components:{Tooltip:{maxWidth:180,zIndexPopup:2070}}});
const native=ref(undefined),semantic=ref({}),tooltip=ref(null);
const resizeTitle=ref('Short hint'),resizeWidth=ref(240);
const fixedPlacements={right:{points:['cl','cr'],offset:[12,0],overflow:{adjustX:0,adjustY:0}}};
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value},()=>[
h(Tooltip,{ref:tooltip,open:true,placement:'topLeft',arrow:{pointAtCenter:true},class:'native-popup',style:native.value,classNames:{root:'main-tooltip'},styles:{root:semantic.value},'data-trigger':'kept'},
{default:()=>h('button',{id:'tooltip-target'},'Target'),title:()=>[h('span','The current maxWidth token wraps this long hint without replacing its editor.'),h('input',{id:'tooltip-editor','aria-label':'Draft'})]}),
h(ConfigProvider,{theme:{components:{Tooltip:{maxWidth:96}}}},()=>h(Tooltip,{open:true,title:'Nested current theme',classNames:{root:'nested-tooltip'}},()=>h('button',{id:'nested-target'},'Nested'))),
h(Tooltip,{open:true,placement:'right',arrow:false,builtinPlacements:fixedPlacements,title:resizeTitle.value,classNames:{root:'resize-tooltip'},styles:{root:{'--apollo-tooltip-max-width':resizeWidth.value+'px'}}},()=>h('button',{id:'resize-target'},'Resize target')),
h('section',{id:'panels'},[h(PurePanel,{title:'Panel',placement:'left',class:'current-panel'}),h(Demo)])
])}));app.mount('#app');
window.tooltipState={async patch(kind){
if(kind==='next')theme.value={token:{borderRadius:6,sizePopupArrow:16,marginXXS:4,colorBgSpotlight:'#654321'},components:{Tooltip:{maxWidth:320,zIndexPopup:3070}}};
if(kind==='semantic')semantic.value={'--apollo-tooltip-max-width':'240px'};
if(kind==='native')native.value='--apollo-tooltip-max-width: 280px; padding: 20px';
if(kind==='removeNative')native.value=undefined;
if(kind==='clear'){theme.value=undefined;semantic.value={};}
if(kind==='resizeTitle')resizeTitle.value='Changing only the title adds several lines of content to an already open popup. Its placement object remains the same, so it must measure the new content size to stay centered on the target.';
if(kind==='resizeWidth')resizeWidth.value=120;
await nextTick();await nextTick();},refValid(){return tooltip.value.nativeElement===document.getElementById('tooltip-target')&&tooltip.value.popupElement===document.querySelector('.main-tooltip')}};
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.tooltipState);
  const read = () =>
    page.locator('.main-tooltip').evaluate((root) => {
      const container = root.querySelector('[role="tooltip"]');
      const arrow = root.querySelector('.apollo-tooltip-arrow');
      const trigger = document.getElementById('tooltip-target');
      const nested = document.querySelector('.nested-tooltip');
      const panel = document.querySelector('.current-panel');
      return {
        width: getComputedStyle(root).maxWidth,
        zIndex: getComputedStyle(root).zIndex,
        background: getComputedStyle(container).backgroundColor,
        arrowWidth: getComputedStyle(arrow).width,
        arrowPath: getComputedStyle(arrow, '::before').clipPath,
        panelRadius: getComputedStyle(panel.querySelector('[role="tooltip"]')).borderRadius,
        nestedWidth: getComputedStyle(nested).maxWidth,
        nestedZIndex: getComputedStyle(nested).zIndex,
        gap: trigger.getBoundingClientRect().top - root.getBoundingClientRect().bottom,
        rootPadding: getComputedStyle(root).padding,
        containerPadding: getComputedStyle(container).padding,
        triggerClass: trigger.className,
        triggerPadding: trigger.style.padding,
        triggerData: trigger.dataset.trigger,
        refValid: window.tooltipState.refValid(),
      };
    });
  await page.waitForFunction(() => {
    const root = document.querySelector('.main-tooltip');
    return root && root.getBoundingClientRect().left > 0;
  });
  const initial = await read();
  assert.equal(initial.width, '180px');
  assert.equal(initial.zIndex, '2070');
  assert.equal(initial.background, 'rgb(18, 52, 86)');
  assert.equal(initial.arrowWidth, '24px');
  assert.match(initial.arrowPath, /^path\(/);
  assert.equal(initial.panelRadius, '8px');
  assert.equal(initial.nestedWidth, '96px');
  assert.equal(initial.nestedZIndex, '2070');
  assert.equal(initial.gap, 22);
  assert.equal(initial.refValid, true);
  assert.equal(initial.triggerData, 'kept');
  assert.equal(initial.triggerPadding, '');
  assert.equal(initial.triggerClass.includes('native-popup'), false);
  await page.locator('#tooltip-editor').fill('business draft');
  await page.locator('#tooltip-editor').focus();
  await page.locator('#tooltip-editor').evaluate((input) => {
    window.originalEditor = input;
    window.originalPopup = input.closest('.main-tooltip');
  });
  await page.evaluate(() => window.tooltipState.patch('next'));
  const next = await read();
  assert.equal(next.width, '320px');
  assert.equal(next.zIndex, '3070');
  assert.equal(next.background, 'rgb(101, 67, 33)');
  assert.equal(next.arrowWidth, '16px');
  assert.notEqual(next.arrowPath, initial.arrowPath);
  assert.equal(next.gap, 12);
  assert.equal(
    await page.evaluate(
      () =>
        document.getElementById('tooltip-editor') === window.originalEditor &&
        document.querySelector('.main-tooltip') === window.originalPopup &&
        document.activeElement === window.originalEditor &&
        window.originalEditor.value === 'business draft',
    ),
    true,
  );
  await page.evaluate(() => window.tooltipState.patch('semantic'));
  assert.equal((await read()).width, '240px');
  await page.evaluate(() => window.tooltipState.patch('native'));
  const native = await read();
  assert.equal(native.width, '280px');
  assert.equal(native.rootPadding, '20px');
  assert.equal(native.containerPadding, initial.containerPadding);
  assert.equal(native.triggerPadding, '');
  await page.evaluate(() => window.tooltipState.patch('removeNative'));
  assert.equal((await read()).width, '240px');
  await page.evaluate(() => window.tooltipState.patch('clear'));
  const cleared = await read();
  assert.equal(cleared.width, '250px');
  assert.equal(cleared.zIndex, '1070');
  assert.equal(cleared.nestedWidth, '96px');
  assert.equal(cleared.nestedZIndex, '1070');
  const demoButton = page.getByRole('button', { name: 'Max width: 160px' });
  const demoPopup = page.locator('.demo-current-tooltip');
  await demoButton.hover();
  await demoPopup.waitFor({ state: 'visible' });
  assert.equal(await demoPopup.evaluate((root) => getComputedStyle(root).maxWidth), '160px');
  await demoButton.click();
  await page.getByRole('button', { name: 'Max width: 280px' }).waitFor({ state: 'visible' });
  assert.equal(await demoPopup.evaluate((root) => getComputedStyle(root).maxWidth), '280px');

  const readResize = () =>
    page.locator('.resize-tooltip').evaluate((root) => {
      const popup = root.getBoundingClientRect();
      const target = document.getElementById('resize-target').getBoundingClientRect();
      return {
        width: popup.width,
        height: popup.height,
        gap: popup.left - target.right,
        centerDelta: (popup.top + popup.bottom - target.top - target.bottom) / 2,
      };
    });
  const frames = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  const beforeResize = await readResize();
  await page.evaluate(() => window.tooltipState.patch('resizeTitle'));
  await frames();
  const titleResize = await readResize();
  await page.evaluate(() => window.tooltipState.patch('resizeWidth'));
  await frames();
  const styleResize = await readResize();
  assert.notEqual(titleResize.height, beforeResize.height);
  assert.notEqual(styleResize.width, titleResize.width);
  assert.ok(
    Math.abs(titleResize.centerDelta) <= 1,
    `Title-only popup resize lost its center: ${JSON.stringify({ beforeResize, titleResize })}`,
  );
  assert.ok(
    Math.abs(styleResize.centerDelta) <= 1,
    `Semantic-only popup resize lost its center: ${JSON.stringify({ titleResize, styleResize })}`,
  );
  assert.equal(titleResize.gap, 12);
  assert.equal(styleResize.gap, 12);
  assert.deepEqual(errors, []);
  console.log(
    'Tooltip source browser: current tokens, geometry, root styles, refs and Demo passed.',
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
