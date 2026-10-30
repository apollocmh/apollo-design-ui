/** Source-only browser regression; does not read or rebuild dist. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const started = performance.now();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-float-button-native-'));
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
<html lang="en"><head><meta charset="utf-8"><title>FloatButton native contracts</title><link rel="icon" href="data:,"></head>
<body><main id="app"></main><script type="module">
import { createApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { getDesignToken, transformToken } from '@apollo-design/theme';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import FloatButton from '/@fs${repo}/packages/ui/src/float-button/FloatButton.ts';
import Group from '/@fs${repo}/packages/ui/src/float-button/FloatButtonGroup.ts';
import BackTop from '/@fs${repo}/packages/ui/src/float-button/BackTop.ts';
import ControlledDemo from '/@fs${repo}/packages/ui/src/float-button/demo/controlled.vue';
import ScrollDemo from '/@fs${repo}/packages/ui/src/float-button/demo/back-top.vue';
import { genButtonStyle } from '/@fs${repo}/packages/ui/src/button/style/index.ts';
import { genFloatButtonStyle } from '/@fs${repo}/packages/ui/src/float-button/style/index.ts';
import { genFlexStyle } from '/@fs${repo}/packages/ui/src/flex/style/index.ts';
import { genSpaceStyle } from '/@fs${repo}/packages/ui/src/space/style/index.ts';
import { genBadgeStyle } from '/@fs${repo}/packages/ui/src/badge/style/index.ts';
const css = document.createElement('style');
css.textContent = [genButtonStyle('apollo'), genButtonStyle('brand'), genFloatButtonStyle(), genFloatButtonStyle('brand'), genFlexStyle('apollo'), genSpaceStyle('apollo'), genBadgeStyle('apollo'),
'body{margin:24px;background:white}#app{min-height:1000px}#scroller{height:150px;overflow:auto;width:350px}#scroller>div{height:1000px}#group{margin:170px 0 30px}#hover{margin:170px 0 30px}#demo{margin-top:100px}#demo .apollo-float-btn-group{position:relative;inset:auto}'].join(''); document.head.append(css);
for (const [name, value] of Object.entries(transformToken(getDesignToken()).vars)) document.documentElement.style.setProperty(name, value);
const label=ref('First'),open=ref(false),accept=ref(true),active=ref(true),native=ref(undefined),scroller=shallowRef(null),button=shallowRef(null),group=shallowRef(null),backTop=shallowRef(null);
const theme=ref({token:{controlHeightLG:56,marginLG:38,marginXXL:68,padding:18,motion:false}});
const counts={open:0,click:0,back:0};
const relative={position:'relative',inset:'auto'};
createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value,
components:active.value?{floatButton:{className:'provider-button',styles:{content:{color:'#123456'}}},floatButtonGroup:{classNames:{root:'provider-group'}}}:{}},()=>[
h(FloatButton,{id:'float',ref:button,shape:'square',style:[relative,native.value]}, {content:()=>[h('strong',label.value),h('em','complete')],icon:()=>h('i','I')}),
h(FloatButton,{id:'badge',badge:{count:5},style:relative,'aria-label':'Notifications'}),
h(Group,{id:'group',ref:group,shape:'square',trigger:'click',open:open.value,style:relative,'aria-label':'Actions',
classNames:{trigger:'own-trigger',triggerIcon:'own-trigger-icon',item:'own-item',itemContent:'own-item-content'},
'onUpdate:open':value=>{if(accept.value)open.value=value},onOpenChange:()=>counts.open++,onClick:()=>counts.click++},
{default:()=>[h(FloatButton,{'data-action':'one'}, {content:()=>label.value}),h(FloatButton,{'data-action':'two'},{content:()=> 'Second'})],icon:()=>h('i',label.value),closeIcon:()=>h('b','Close')}),
h(Group,{id:'hover',trigger:'hover',style:relative,'aria-label':'Hover actions'},()=>h(FloatButton,{'aria-label':'Hover item'})),
h(ConfigProvider,{theme:{token:{controlHeightLG:48}}},()=>h(FloatButton,{id:'nested',style:relative,'aria-label':'Nested'})),
h('div',{id:'scroller',ref:scroller},[h('div','Scroll content')]),
h(BackTop,{id:'back',ref:backTop,target:()=>scroller.value,visibilityHeight:80,showProgress:true,style:relative,onClick:()=>counts.back++}),
h(ConfigProvider,{prefixCls:'brand'},()=>h(BackTop,{id:'brand-back',type:'primary',target:()=>scroller.value,visibilityHeight:0,showProgress:true,style:relative})),
h('input',{id:'outside','aria-label':'External field'}),
h('section',{id:'demo'},[h(ControlledDemo),h(ScrollDemo)])
])})).mount('#app');
window.floatNative={counts,async patch(kind){
if(kind==='content')label.value='Current';
if(kind==='native')native.value='--apollo-control-height-lg:64px';
if(kind==='source')native.value=undefined;
if(kind==='clear'){active.value=false;theme.value=undefined;}
if(kind==='reject')accept.value=false;
if(kind==='accept')accept.value=true;
if(kind==='close')open.value=false;
await nextTick();}, refs(){return{button:button.value?.nativeElement===document.querySelector('#float'),group:group.value?.nativeElement===document.querySelector('#group'),back:backTop.value?.nativeElement===document.querySelector('#back')}}};
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.floatNative);
  const patch = (kind) => page.evaluate((kind) => window.floatNative.patch(kind), kind);
  const height = (selector) =>
    page.locator(selector).evaluate((root) => getComputedStyle(root).width);
  assert.equal(await height('#float'), '56px');
  assert.equal(await height('#nested'), '48px');
  await patch('native');
  assert.equal(await height('#float'), '64px');
  await patch('source');
  assert.equal(await height('#float'), '56px');
  await patch('content');
  assert.equal(await page.locator('#float strong').textContent(), 'Current');
  assert.equal(await page.locator('#group .own-trigger-icon i').textContent(), 'Current');
  assert.equal(await page.locator('#group').count(), 1);
  assert.equal(await page.locator('#group .own-trigger').getAttribute('id'), null);
  assert.ok((await page.locator('#badge').textContent()).includes('5'));
  const trigger = page.locator('#group .own-trigger');
  await trigger.focus();
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#group .own-item-content').first().textContent(), 'Current');
  await page.keyboard.press('Tab');
  assert.equal(
    await page
      .locator('#group [data-action="one"]')
      .evaluate((root) => root === document.activeElement),
    true,
  );
  await page.keyboard.press('Escape');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(await trigger.evaluate((root) => root === document.activeElement), true);
  await trigger.press('Enter');
  await page.keyboard.press('Tab');
  await patch('reject');
  await page.keyboard.press('Escape');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(
    await page
      .locator('#group [data-action="one"]')
      .evaluate((root) => root === document.activeElement),
    true,
  );
  await patch('accept');
  await patch('close');
  assert.equal(await trigger.evaluate((root) => root === document.activeElement), true);
  await trigger.press('Enter');
  await page.locator('#outside').click();
  assert.equal(
    await page.locator('#outside').evaluate((root) => root === document.activeElement),
    true,
  );
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  const hover = page.locator('#hover .apollo-float-btn-group-trigger');
  await hover.focus();
  assert.equal(await hover.getAttribute('aria-expanded'), 'true');
  await hover.press('Escape');
  assert.equal(await hover.getAttribute('aria-expanded'), 'false');
  await page.locator('#scroller').evaluate((root) => {
    root.scrollTop = 400;
    root.dispatchEvent(new Event('scroll'));
  });
  await page.locator('#back').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => window.floatNative.refs().back), true);
  const progress = await page
    .locator('#back')
    .evaluate((root) => root.style.getPropertyValue('--apollo-float-btn-progress'));
  assert.ok(Number.parseFloat(progress) > 0.4);
  const branded = await page.locator('#brand-back').evaluate((root) => {
    const style = getComputedStyle(root);
    return {
      classes: root.className,
      progress: style.getPropertyValue('--brand-float-btn-progress'),
      image: style.backgroundImage,
      border: style.borderTopWidth,
    };
  });
  assert.ok(branded.classes.includes('brand-float-btn') && branded.classes.includes('brand-btn'));
  assert.ok(Number.parseFloat(branded.progress) > 0.4);
  assert.ok(branded.image.includes('conic-gradient') && branded.image.includes('linear-gradient'));
  assert.equal(branded.border, '2px');
  await page.locator('#back').click();
  assert.equal(await page.locator('#scroller').evaluate((root) => root.scrollTop), 0);
  assert.equal(await page.evaluate(() => window.floatNative.counts.back), 1);
  await patch('clear');
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('#float')).width === '40px',
  );
  assert.equal(await height('#float'), '40px');
  assert.equal(
    await page
      .locator('#float')
      .evaluate((root) => root.style.getPropertyValue('--apollo-control-height-lg')),
    '',
  );
  assert.equal(
    await page.locator('#float').evaluate((root) => root.classList.contains('provider-button')),
    false,
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const refs = window.floatNative.refs();
      return { button: refs.button, group: refs.group };
    }),
    { button: true, group: true },
  );
  const demoTrigger = page.locator('#demo .apollo-float-btn-group-trigger');
  await demoTrigger.click();
  assert.ok((await page.locator('#demo').textContent()).includes('Expanded · changes: 1'));
  const demoScroll = page.locator('#demo div[style*="overflow-y"]');
  await demoScroll.evaluate((root) => {
    root.scrollTop = 200;
    root.dispatchEvent(new Event('scroll'));
  });
  await page.locator('#demo .apollo-float-btn-progress').waitFor({ state: 'visible' });
  assert.deepEqual(errors, []);
  console.log(
    `PASS FloatButton source browser (${((performance.now() - started) / 1000).toFixed(2)}s): current/nested aliases and native override; full slots and Provider removal; exact refs; keyboard Tab/Escape and rejected controlled close; external focus; hover keyboard; progress and immediate scroll; controlled/BackTop demos; no browser/Vue errors`,
  );
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  await rm(fixture, { recursive: true, force: true });
}
