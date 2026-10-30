import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-calendar-native-'));
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
alias.dayjs = path.dirname(createRequire(import.meta.url).resolve('dayjs'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Calendar native contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{box-sizing:border-box;animation:none!important;transition:none!important}body{margin:32px}.native-calendar{width:650px}.custom-demo{margin-top:48px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,ref,shallowRef} from 'vue';
import dayjs from 'dayjs';
import Calendar from '/@fs${repo}/packages/ui/src/calendar/Calendar.vue';
import HeaderDemo from '/@fs${repo}/packages/ui/src/calendar/demo/customize-header.vue';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genCalendarStyle} from '/@fs${repo}/packages/ui/src/calendar/style/index.ts';
import {genSelectStyle} from '/@fs${repo}/packages/ui/src/select/style/index.ts';
import {genRadioStyle} from '/@fs${repo}/packages/ui/src/radio/style/index.ts';
const css=document.createElement('style');css.textContent=genCalendarStyle('apollo')+genSelectStyle('apollo')+genRadioStyle('apollo');document.head.append(css);
const selected=ref(dayjs('2026-09-15')),mode=ref('month'),accept=ref(false),fullscreen=ref(true),direction=ref('ltr'),control=ref(null),events=[];
const theme=shallowRef({components:{Calendar:{fullBg:'#112233',fullPanelBg:'#223344',itemActiveBg:'#334455',yearControlWidth:101,monthControlWidth:'90px',miniContentHeight:312}}});
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value,direction:direction.value},()=>[
h(Calendar,{ref:control,id:'native-calendar',class:'native-calendar','data-live':'calendar',value:selected.value,mode:mode.value,fullscreen:fullscreen.value,disabledDate:date=>date.date()===16,
'onUpdate:value':value=>{events.push(['value',value.format('YYYY-MM-DD')]);if(accept.value)selected.value=value},'onUpdate:mode':value=>{events.push(['mode',value]);if(accept.value)mode.value=value},onSelect:(date,info)=>events.push(['select',date.format('YYYY-MM-DD'),info.source])}),h(HeaderDemo,{class:'custom-demo'})
])}));app.mount('#app');await nextTick();await nextTick();
window.calendarState={events,read:()=>({value:selected.value.format('YYYY-MM-DD'),mode:mode.value,root:control.value?.nativeElement===document.getElementById('native-calendar')}),async patch(kind){if(kind==='accept')accept.value=true;if(kind==='rtl')direction.value='rtl';if(kind==='mini')fullscreen.value=false;if(kind==='theme')theme.value={components:{Calendar:{fullBg:'#f6ffed',fullPanelBg:'#fff1f0',itemActiveBg:'#d6e4ff',yearControlWidth:0,monthControlWidth:'7rem',miniContentHeight:288}}};await nextTick();await nextTick()},unmount(){const exposed=control.value;app.unmount();return exposed.nativeElement===null}};
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(
    () =>
      window.calendarState &&
      document.querySelector('.native-calendar td[title="2026-09-15"]')?.getBoundingClientRect()
        .width > 0,
  );
  const root = page.locator('.native-calendar');
  const read = () => page.evaluate(() => window.calendarState.read());
  const patch = (kind) => page.evaluate((value) => window.calendarState.patch(value), kind);
  const style = (selector, name) =>
    page
      .locator(selector)
      .evaluate((element, property) => getComputedStyle(element).getPropertyValue(property), name);
  assert.equal((await read()).root, true);
  assert.equal(await root.getAttribute('data-live'), 'calendar');
  assert.equal(await style('.native-calendar', 'background-color'), 'rgb(17, 34, 51)');
  assert.equal(
    await style(
      '.native-calendar .apollo-picker-cell-selected .apollo-picker-calendar-date',
      'background-color',
    ),
    'rgb(51, 68, 85)',
  );
  assert.equal(
    await style('.native-calendar .apollo-picker-calendar-year-select', 'min-width'),
    '101px',
  );
  assert.equal(
    await style('.native-calendar .apollo-picker-calendar-month-select', 'min-width'),
    '90px',
  );
  await page.locator('.native-calendar td[title="2026-09-15"]').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute('title')),
    '2026-09-17',
  );
  await page.keyboard.press('Enter');
  assert.equal((await read()).value, '2026-09-15');
  assert.deepEqual(
    await page.evaluate(() => window.calendarState.events.filter((event) => event[0] === 'value')),
    [['value', '2026-09-17']],
  );
  await patch('accept');
  await page.keyboard.press('Enter');
  assert.equal((await read()).value, '2026-09-17');
  await patch('rtl');
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute('title')),
    '2026-09-15',
  );
  await page.keyboard.press('Enter');
  assert.equal((await read()).value, '2026-09-15');
  await page
    .locator('.native-calendar .apollo-picker-calendar-mode-switch label:has(input[value="year"])')
    .click();
  assert.equal((await read()).mode, 'year');
  assert.equal(await root.locator('.apollo-picker-month-panel').count(), 1);
  await page
    .locator('.native-calendar .apollo-picker-calendar-mode-switch label:has(input[value="month"])')
    .click();
  await page.locator('.native-calendar .apollo-picker-calendar-month-select input').click();
  await page
    .locator('.native-calendar .apollo-select-item-option')
    .filter({ hasText: /^Jan$/ })
    .click();
  assert.equal((await read()).value, '2026-01-15');
  await patch('mini');
  assert.equal(
    await style('.native-calendar .apollo-picker-panel', 'background-color'),
    'rgb(34, 51, 68)',
  );
  assert.equal(await style('.native-calendar .apollo-picker-content', 'height'), '312px');
  await patch('theme');
  assert.equal(await style('.native-calendar', 'background-color'), 'rgb(246, 255, 237)');
  assert.equal(
    await style('.native-calendar .apollo-picker-panel', 'background-color'),
    'rgb(255, 241, 240)',
  );
  assert.equal(
    await style('.native-calendar .apollo-picker-calendar-year-select', 'min-width'),
    '0px',
  );
  assert.equal(
    await style('.native-calendar .apollo-picker-calendar-month-select', 'min-width'),
    '112px',
  );
  assert.equal(await style('.native-calendar .apollo-picker-content', 'height'), '288px');
  await page.locator('.custom-demo label:has(input[value="year"])').click();
  assert.equal(await page.locator('.custom-demo .apollo-picker-month-panel').count(), 1);
  assert.equal(await page.evaluate(() => window.calendarState.unmount()), true);
  assert.equal(await page.locator('.apollo-select-dropdown').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      elapsedSeconds: (performance.now() - started) / 1000,
      checks: [
        'actual attrs/ref',
        'keyboard disabled skip and RTL',
        'controlled refusal/acceptance',
        'mode and numeric month zero',
        'six tokens actual CSS',
        'scoped header Demo',
        'unmount cleanup',
      ],
      diagnostics: errors,
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
