/** Source CSS, overflow and accessibility: node packages/ui/src/tabs/__tests__/native-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import axe from 'axe-core';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-tabs-native-'));
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
<html lang="en"><head><title>Tabs native contracts</title><link rel="icon" href="data:,"></head>
<body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref} from 'vue';
import {getDesignToken,transformToken,darkAlgorithm,compactAlgorithm} from '@apollo-design/theme';
import Tabs from '/@fs${repo}/packages/ui/src/tabs/Tabs.vue';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import TokenDemo from '/@fs${repo}/packages/ui/src/tabs/demo/component-token.vue';
import {genTabsStyle} from '/@fs${repo}/packages/ui/src/tabs/style/index.ts';
for(const [name,value] of Object.entries(transformToken(getDesignToken()).vars)) document.documentElement.style.setProperty(name,value);
const css=document.createElement('style');css.textContent=genTabsStyle('apollo')+'body{margin:24px;background:white}section{margin-bottom:24px}*,*::before,*::after{animation:none!important;transition:none!important}';document.head.append(css);
const custom={zIndexPopup:1601,cardBg:'#f1f2f3',cardHeight:48,cardHeightSM:38,cardHeightLG:58,cardPadding:'10px 15px',cardPaddingSM:'6px 9px',cardPaddingLG:'14px 18px',titleFontSize:18,titleFontSizeSM:15,titleFontSizeLG:22,inkBarColor:'#654321',horizontalMargin:'0 0 13px 0',horizontalItemGutter:23,horizontalItemPadding:'9px 0',horizontalItemPaddingSM:'6px 0',horizontalItemPaddingLG:'12px 0',verticalItemPadding:'7px 17px',verticalItemMargin:'19px 0 0 0',itemColor:'#123456',itemSelectedColor:'#234567',itemHoverColor:'#345678',itemActiveColor:'#456789',cardGutter:5};
const theme=ref({components:{Tabs:custom}}),placement=ref('top'),direction=ref('ltr'),indicator=ref({align:'start',size:18});
const active=ref('0'),events=[],panes=ref(Array.from({length:10},(_,index)=>({key:String(index),label:'Tab '+index,disabled:index===2,children:'Panel '+index,forceRender:true})));
const config=ref({tabs:{size:'small',className:'from-provider'}});
const api={events,async patch(kind){
if(kind==='vertical')placement.value='start';
if(kind==='horizontal')placement.value='top';
if(kind==='rtl'){direction.value='rtl';indicator.value={align:'end',size:18};}
if(kind==='center')indicator.value={align:'center',size:18};
if(kind==='start')indicator.value={align:'start',size:18};
if(kind==='replace'){theme.value={token:{colorPrimary:'#117733',fontSize:16},components:{Tabs:{inkBarColor:'#337711',horizontalItemGutter:31}}};config.value={tabs:{size:'large',className:'next-provider'}};}
if(kind==='clear'){theme.value=undefined;config.value={};document.body.style.background='white';}
if(kind==='dark'){theme.value={algorithm:darkAlgorithm};document.body.style.background='#141414';}
if(kind==='compact'){theme.value={algorithm:compactAlgorithm};document.body.style.background='white';}
await nextTick();},unmount(){app.unmount();}};
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value,components:config.value,direction:direction.value},()=>[
h('section',{id:'basic'},[h(Tabs,{id:'native-tabs',items:panes.value,activeKey:active.value,'onUpdate:activeKey':key=>{active.value=key;},onChange:key=>events.push(['change',key]),onTabClick:(key,event)=>events.push(['click',key,event.type]),onEdit:(target,action)=>{events.push(['edit',typeof target==='string'?target:target.type,action]);if(action==='remove')panes.value=panes.value.filter(item=>item.key!==target);},type:'editable-card',tabPlacement:placement.value,indicator:indicator.value,style:{width:'360px',height:placement.value==='start'?'210px':undefined},tabBarExtraContent:h('button',{type:'button',style:{minHeight:'24px'}},'Extra')})]),
h('section',{id:'line'},[h(Tabs,{id:'line-tabs',items:[{key:'a',label:'Alpha',children:'Alpha panel'},{key:'b',label:'Beta',children:'Beta panel'}],indicator:indicator.value})]),
h(ConfigProvider,{theme:{components:{Tabs:{titleFontSize:21,inkBarColor:'#662266'}}}},()=>h('section',{id:'nested'},[h(Tabs,{id:'nested-tabs',items:[{key:'a',label:'Nested',children:'Nested panel'}]})])),
h('section',{id:'token-demo'},[h(TokenDemo)]),
])}));app.mount('#app');window.tabsNative=api;
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.tabsNative);
  await page.addScriptTag({ content: axe.source });
  const cdp = await page.context().newCDPSession(page);
  const checkAccessibleOwner = async (selector, ownerRole, childRole) => {
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const { node } = await cdp.send('DOM.describeNode', { nodeId });
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
      backendNodeId: node.backendNodeId,
      fetchRelatives: true,
    });
    const owner = nodes.find((entry) => entry.backendDOMNodeId === node.backendNodeId);
    assert.equal(owner?.role?.value, ownerRole);
    assert.equal(owner?.ignored, false);
    const roles = owner.childIds.map(
      (id) => nodes.find((entry) => entry.nodeId === id)?.role?.value,
    );
    assert.ok(roles.length > 0);
    assert.ok(
      roles.every((role) => role === childRole),
      `${ownerRole} owns ${roles.join(', ')}`,
    );
  };
  const basic = page.locator('#native-tabs');
  const more = basic.locator('.apollo-tabs-nav-more');
  await more.waitFor({ state: 'visible' });

  const ownership = await page.locator('#basic [role="tablist"]').evaluate((node) => ({
    own: node
      .getAttribute('aria-owns')
      .split(' ')
      .map((id) => document.getElementById(id)?.getAttribute('role')),
    controls: node.querySelectorAll('button').length,
  }));
  assert.deepEqual(ownership, { own: Array(10).fill('tab'), controls: 0 });
  await checkAccessibleOwner('#basic [role="tablist"]', 'tablist', 'tab');
  const scan = async (selector) => {
    const violations = await page.evaluate(
      async (selector) =>
        (
          await window.axe.run(selector, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
            },
          })
        ).violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })),
      selector,
    );
    assert.deepEqual(violations, [], `Axe violations in ${selector}`);
  };
  await scan('#basic');
  await more.evaluate((node) => node.click());
  await page.waitForFunction(
    () => document.querySelector('#native-tabs-more').getAttribute('aria-expanded') === 'true',
  );
  await page.mouse.click(10, 10);
  await page.waitForFunction(
    () => document.querySelector('#native-tabs-more').getAttribute('aria-expanded') === 'false',
  );

  await basic.locator('[role="tab"]').first().focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-tabs-tab-1');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-tabs-tab-3');
  await page.keyboard.press('Enter');
  assert.equal(
    await basic.locator('[role="tab"][aria-selected="true"]').getAttribute('id'),
    'native-tabs-tab-3',
  );
  assert.deepEqual(
    await page.evaluate(() => window.tabsNative.events.filter((event) => event[0] === 'change')),
    [['change', '3']],
  );

  await more.focus();
  await page.keyboard.press('ArrowDown');
  const listbox = page.locator('#native-tabs-more-popup');
  await listbox.waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.activeElement?.id === 'native-tabs-more-popup');
  await scan('.apollo-tabs-dropdown');
  await checkAccessibleOwner('#native-tabs-more-popup', 'listbox', 'option');
  assert.equal(
    await page.locator('.apollo-tabs-dropdown').evaluate((node) => getComputedStyle(node).zIndex),
    '1601',
  );
  assert.equal(
    await listbox.getAttribute('aria-activedescendant'),
    await page
      .locator('.apollo-tabs-dropdown [role="option"]:not([aria-disabled="true"])')
      .first()
      .getAttribute('id'),
  );
  await page.keyboard.press('End');
  const last = await listbox.getAttribute('aria-activedescendant');
  assert.ok(last?.endsWith('-9'));
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => document.querySelector('#native-tabs-more').getAttribute('aria-expanded') === 'false',
  );
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-tabs-more');
  assert.equal(
    await basic.locator('[aria-selected="true"][role="tab"]').getAttribute('id'),
    'native-tabs-tab-9',
  );

  await more.focus();
  await page.keyboard.press('ArrowUp');
  await listbox.waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  assert.equal(await more.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-tabs-more');

  await page.locator('#native-tabs-tab-0').focus();
  await page.keyboard.press('Delete');
  await page.locator('#native-tabs-tab-0').waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-tabs-tab-1');

  const read = (id, selector, properties) =>
    page
      .locator(`#${id} ${selector}`)
      .first()
      .evaluate(
        (node, properties) =>
          Object.fromEntries(properties.map((name) => [name, getComputedStyle(node)[name]])),
        properties,
      );
  assert.deepEqual(
    await read('native-tabs', '.apollo-tabs-tab', [
      'fontSize',
      'paddingTop',
      'paddingRight',
      'backgroundColor',
    ]),
    {
      fontSize: '15px',
      paddingTop: '6px',
      paddingRight: '9px',
      backgroundColor: 'rgb(241, 242, 243)',
    },
  );
  assert.deepEqual(await read('native-tabs', '.apollo-tabs-nav-add', ['minHeight', 'minWidth']), {
    minHeight: '38px',
    minWidth: '38px',
  });
  assert.equal((await read('nested-tabs', '.apollo-tabs-tab', ['fontSize'])).fontSize, '15px');
  assert.equal(
    await page
      .locator('#nested-tabs')
      .evaluate((node) => node.style.getPropertyValue('--apollo-tabs-title-font-size')),
    '21px',
  );
  assert.equal(
    (await read('line-tabs', '.apollo-tabs-ink-bar', ['backgroundColor'])).backgroundColor,
    'rgb(101, 67, 33)',
  );

  await page.evaluate(() => window.tabsNative.patch('center'));
  await page.waitForFunction(
    () =>
      document.querySelector('#line-tabs .apollo-tabs-ink-bar').style.transform ===
      'translateX(-50%)',
  );
  await page.evaluate(() => window.tabsNative.patch('start'));
  await page.waitForFunction(
    () => document.querySelector('#line-tabs .apollo-tabs-ink-bar').style.transform === '',
  );
  await page.evaluate(() => window.tabsNative.patch('rtl'));
  await page.waitForFunction(
    () =>
      document.querySelector('#line-tabs .apollo-tabs-ink-bar').style.transform ===
      'translateX(100%)',
  );
  const indicatorEnd = await page.locator('#line-tabs').evaluate((root) => ({
    tab: root.querySelector('.apollo-tabs-tab').getBoundingClientRect().left,
    bar: root.querySelector('.apollo-tabs-ink-bar').getBoundingClientRect().left,
  }));
  assert.ok(
    Math.abs(indicatorEnd.tab - indicatorEnd.bar) < 1,
    'RTL end aligns with the tab left edge',
  );

  await page.evaluate(() => window.tabsNative.patch('vertical'));
  await page.waitForFunction(
    () =>
      document.querySelector('#basic [role="tablist"]').getAttribute('aria-orientation') ===
      'vertical',
  );
  await page.locator('#native-tabs-tab-1').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-tabs-tab-3');
  await scan('#basic');

  await page.evaluate(() => window.tabsNative.patch('replace'));
  await page.waitForFunction(() =>
    document.querySelector('#native-tabs').classList.contains('next-provider'),
  );
  assert.equal((await read('native-tabs', '.apollo-tabs-tab', ['fontSize'])).fontSize, '18px');
  assert.equal(
    (await read('line-tabs', '.apollo-tabs-ink-bar', ['backgroundColor'])).backgroundColor,
    'rgb(51, 119, 17)',
  );
  await more.focus();
  await page.keyboard.press('ArrowDown');
  await listbox.waitFor({ state: 'visible' });
  assert.equal(
    await page
      .locator('.apollo-tabs-dropdown [style*="--apollo-tabs-ink-bar-color"]')
      .evaluate((node) => node.style.getPropertyValue('--apollo-tabs-ink-bar-color')),
    '#337711',
  );
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.tabsNative.patch('clear'));
  assert.equal(
    await basic.evaluate((node) => node.style.getPropertyValue('--apollo-tabs-ink-bar-color')),
    '',
  );
  await scan('#basic');
  await page.locator('#native-tabs-tab-1').focus();
  await page.locator('#native-tabs-tab-1').hover();
  await scan('#basic');
  await page.locator('#native-tabs-tab-1').focus();
  await scan('#basic');

  await page.evaluate(() => window.tabsNative.patch('dark'));
  await scan('#basic');
  await page.locator('#native-tabs-tab-1').hover();
  await scan('#basic');
  await page.locator('#native-tabs-tab-1').focus();
  await scan('#basic');
  await page.evaluate(() => window.tabsNative.patch('compact'));
  await scan('#basic');
  await page.locator('#native-tabs-tab-1').hover();
  await scan('#basic');
  await page.locator('#native-tabs-tab-1').focus();
  await scan('#basic');
  await page.evaluate(() => window.tabsNative.patch('clear'));

  const demo = page.locator('#token-demo .apollo-tabs');
  assert.equal(
    await demo.evaluate((node) =>
      node.style.getPropertyValue('--apollo-tabs-horizontal-item-gutter'),
    ),
    '32px',
  );
  await page.locator('#token-demo .apollo-select').click();
  await page.locator('.apollo-select-item-option').filter({ hasText: '紫罗兰' }).click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('#token-demo .apollo-tabs')
        .style.getPropertyValue('--apollo-tabs-horizontal-item-gutter') === '24px',
  );
  await page.evaluate(() => window.tabsNative.unmount());
  assert.equal(await page.locator('.apollo-tabs-dropdown').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    'PASS Tabs source browser: actual overflow/keyboard/removal/focus, Chrome axe ownership, current/nested/replaced/withdrawn theme, default/dark/compact selected/hover/focus contrast, RTL indicator, token Demo and cleanup; no Vue/browser errors',
  );
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  await rm(fixture, { recursive: true, force: true });
}
