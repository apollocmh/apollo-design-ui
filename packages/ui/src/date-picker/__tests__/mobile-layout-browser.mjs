/** Source CSS regression for wrapped DatePicker popups; never rebuilds package artifacts. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-date-mobile-layout-'));
const aliases = Object.fromEntries(
  [
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
aliases.vue = path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js');
aliases.dayjs = path.dirname(createRequire(import.meta.url).resolve('dayjs'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><link rel="icon" href="data:,"><link rel="stylesheet" href="/@fs${repo}/packages/theme/dist/tokens.css"><link rel="stylesheet" href="/@fs${repo}/packages/ui/dist/index.css"><style>html,body{margin:0}*{box-sizing:border-box}*,*::before,*::after{transition:none!important;animation:none!important}#stage{width:100%;padding:16px}#holder{position:relative;padding:24px;min-height:1050px}</style></head><body><main id="app"></main><script type="module">
import {createApp,h,nextTick,ref} from 'vue';
import dayjs from 'dayjs';
import DatePicker from '/@fs${repo}/packages/ui/src/date-picker/DatePicker.vue';
import RangePicker from '/@fs${repo}/packages/ui/src/date-picker/RangePicker.vue';
import TimePicker from '/@fs${repo}/packages/ui/src/time-picker/TimePicker.vue';
import TimeRangePicker from '/@fs${repo}/packages/ui/src/time-picker/TimeRangePicker.vue';
import Calendar from '/@fs${repo}/packages/ui/src/calendar/Calendar.vue';
import {genDatePickerStyle} from '/@fs${repo}/packages/ui/src/date-picker/style/index.ts';
import {genCalendarStyle} from '/@fs${repo}/packages/ui/src/calendar/style/index.ts';
const css=document.createElement('style');css.textContent=genDatePickerStyle('apollo')+genCalendarStyle('apollo');document.head.append(css);
let app,holder=null;window.openLayoutCase=async(kind)=>{app?.unmount();const value=ref(kind==='range'||kind==='time-range'?[dayjs('2026-09-10 09:00:00'),dayjs('2026-10-05 18:30:00')]:dayjs('2026-09-15 10:20:30'));const open=ref(true);const props={value:value.value,inputReadOnly:true,defaultPickerValue:dayjs('2026-09-01'),getPopupContainer:()=>holder};const component=kind==='range'?RangePicker:kind==='time'?TimePicker:kind==='time-range'?TimeRangePicker:kind==='calendar'?Calendar:DatePicker;
app=createApp({render:()=>h('div',{id:'stage'},[h('div',{id:'holder',ref:element=>holder=element},[h(component,{...props,value:value.value,...(kind==='calendar'?{}:{open:open.value,'onUpdate:open':next=>open.value=next}),'onUpdate:value':next=>value.value=next,...(kind==='datetime'?{showTime:true}:{}),...(kind==='presets'?{presets:[{label:'First preset',value:dayjs('2026-09-12')},{label:'Second preset',value:dayjs('2026-09-18')}]}:{})})])])});app.mount('#app');window.readLayoutValue=()=>Array.isArray(value.value)?value.value.map(date=>date?.format('YYYY-MM-DD')):value.value?.format('YYYY-MM-DD HH:mm:ss');await nextTick();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));};window.layoutReady=true;
</script></body></html>`,
);

let server, browser;
const started = performance.now();
try {
  server = await createServer({
    root: fixture,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias: aliases },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, fixture] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage({ viewport: { width: 768, height: 1100 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.layoutReady);
  const openCase = async (kind) => {
    await page.evaluate((name) => window.openLayoutCase(name), kind);
    await page.waitForFunction((name) => {
      const element = document.querySelector(
        name === 'calendar' ? '.apollo-picker-calendar' : '.apollo-picker-dropdown',
      );
      const bounds = element?.getBoundingClientRect();
      return bounds && bounds.width > 100 && bounds.height > 100;
    }, kind);
  };
  const bounds = () =>
    page.evaluate(() => {
      const rect = (element) => {
        const r = element.getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        };
      };
      const popup = document.querySelector('.apollo-picker-dropdown');
      return {
        popup: rect(popup),
        dates: [...popup.querySelectorAll('.apollo-picker-date-panel')].map(rect),
        times: [...popup.querySelectorAll('.apollo-picker-time-panel')].map(rect),
        panels: [...popup.querySelectorAll('.apollo-picker-panel')].map(rect),
      };
    });
  for (const kind of ['datetime', 'range']) {
    await openCase(kind);
    const cells = page.locator('.apollo-picker-panel td');
    const expectedCells = kind === 'range' ? 84 : 42;
    assert.equal(await cells.count(), expectedCells);
    await cells.nth(10).focus();
    await page.evaluate(() => {
      window.layoutCell = document.activeElement;
      window.layoutPanels = [...document.querySelectorAll('.apollo-picker-panel')];
    });
    for (const width of [375, 768, 1440, 375]) {
      await page.setViewportSize({ width, height: 1100 });
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const layout = await bounds();
      assert.ok(
        layout.popup.left >= -0.5 && layout.popup.right <= width + 0.5,
        `${kind} popup must fit ${width}px: ${JSON.stringify(layout)}`,
      );
      for (const panel of [...layout.dates, ...layout.times])
        assert.ok(
          panel.left >= -0.5 && panel.right <= width + 0.5,
          `${kind} visible panel must fit ${width}px`,
        );
      const [first, second] = kind === 'range' ? layout.dates : [layout.dates[0], layout.times[0]];
      assert.equal(first.width, 288, 'wrapping must preserve the native date panel size');
      if (width === 375)
        assert.ok(
          second.top >= first.bottom - 0.5,
          `${kind} panels must wrap without hiding either panel`,
        );
      else
        assert.ok(
          Math.abs(first.top - second.top) < 2,
          `${kind} must keep its wide side-by-side layout`,
        );
      assert.equal(
        await page.evaluate(
          () =>
            document.activeElement === window.layoutCell &&
            window.layoutPanels.every(
              (panel, index) => panel === document.querySelectorAll('.apollo-picker-panel')[index],
            ),
        ),
        true,
      );
      assert.equal(await cells.count(), expectedCells);
      for (const column of await page
        .locator('.apollo-picker-time-panel-column')
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().width),
        )) {
        assert.ok(column > 30, 'every time column remains visible at native size');
      }
    }
  }
  await openCase('datetime');
  const dateTimeInput = page.locator('.apollo-picker input');
  await dateTimeInput.focus();
  await dateTimeInput.press('ArrowDown');
  await page.keyboard.press('Tab');
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.closest('[data-type]')?.getAttribute('data-type'),
    ),
    'hour',
  );
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.locator('.apollo-picker-ok button').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.readLayoutValue()), '2026-09-15 11:20:30');
  await openCase('range');
  const inputs = page.locator('.apollo-picker input');
  await inputs.first().focus();
  await inputs.first().press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await inputs.last().focus();
  await inputs.last().press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(() => window.readLayoutValue()), [
    '2026-09-11',
    '2026-10-06',
  ]);
  for (const kind of ['time', 'time-range']) {
    await openCase(kind);
    const layout = await bounds();
    assert.ok(layout.popup.left >= -0.5 && layout.popup.right <= 375.5);
    assert.equal(layout.times.length, 1);
    assert.equal(await page.locator('.apollo-picker-time-panel-column').count(), 3);
  }
  await openCase('presets');
  assert.equal(await page.locator('.apollo-picker-presets li').count(), 2);
  assert.ok(
    (await page
      .locator('.apollo-picker-presets ul')
      .evaluate((element) => element.getBoundingClientRect().height)) > 0,
  );
  assert.ok((await bounds()).popup.right <= 375.5);
  await openCase('calendar');
  const calendar = page.locator('.apollo-picker-calendar');
  assert.equal(await calendar.locator('td').count(), 42);
  assert.ok(await calendar.evaluate((element) => element.getBoundingClientRect().right <= 375.5));
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      durationMs: Math.round(performance.now() - started),
      checks: [
        '375/768/1440 resize',
        'all datetime/range panels and cells visible',
        'same native cells/panels/focus after resize',
        'wrapped datetime time columns and confirmation selected with native keys',
        'both range endpoints selected with native keys',
        'TimePicker/TimeRangePicker and Calendar consumers',
        'presets remain visible',
      ],
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
