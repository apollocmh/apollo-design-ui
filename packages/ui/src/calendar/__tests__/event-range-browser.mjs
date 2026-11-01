/** Source-only: node packages/ui/src/calendar/__tests__/event-range-browser.mjs */
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
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-calendar-event-range-'));
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
const scenarios = [
  { name: 'desktop-light', width: 1100, dark: false, direction: 'ltr', locale: 'en' },
  { name: 'narrow-light', width: 420, dark: false, direction: 'ltr', locale: 'en' },
  { name: 'desktop-dark', width: 1100, dark: true, direction: 'ltr', locale: 'en' },
  { name: 'rtl-dark', width: 1100, dark: true, direction: 'rtl', locale: 'ar' },
];
const ranges = [
  { key: 'release', dates: [8, 9, 10] },
  { key: 'design-review', dates: [14] },
  { key: 'maintenance', dates: [21, 22, 23, 24] },
  { key: 'bug-fix', dates: [30, 31] },
  { key: 'cross-week', dates: [17, 18, 19, 20] },
];
const diagnostics = [];
const results = [];
let server, browser;
let activeCase = 'startup';
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Calendar range geometry</title><link rel="icon" href="data:,"><style>*,*::before,*::after{box-sizing:border-box;animation:none!important;transition:none!important}body{margin:16px}#ordinary{margin-top:40px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick} from 'vue';
import dayjs from 'dayjs';import 'dayjs/locale/ar';
import {ar_EG} from '@apollo-design/locale';
import {darkAlgorithm,defaultAlgorithm,getDesignToken,transformToken} from '@apollo-design/theme';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import Calendar from '/@fs${repo}/packages/ui/src/calendar/Calendar.vue';
import EventRange from '/@fs${repo}/packages/ui/src/calendar/demo/event-range.vue';
import {genCalendarStyle} from '/@fs${repo}/packages/ui/src/calendar/style/index.ts';
import {genSelectStyle} from '/@fs${repo}/packages/ui/src/select/style/index.ts';
import {genRadioStyle} from '/@fs${repo}/packages/ui/src/radio/style/index.ts';
const query=new URLSearchParams(location.search),dark=query.get('dark')==='true',direction=query.get('direction');
const token=getDesignToken({algorithm:dark?darkAlgorithm:defaultAlgorithm});
for(const [key,value]of Object.entries(transformToken(token).vars))document.documentElement.style.setProperty(key,value);
document.body.style.background=token.colorBgContainer;document.body.style.color=token.colorText;
const css=document.createElement('style');css.textContent=genCalendarStyle('apollo')+genSelectStyle('apollo')+genRadioStyle('apollo');document.head.append(css);
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{direction,locale:query.get('locale')==='ar'?ar_EG:undefined,theme:{algorithm:dark?darkAlgorithm:defaultAlgorithm}},{default:()=>[
h('section',{id:'range-demo'},[h(EventRange)]),
h(Calendar,{id:'ordinary',defaultValue:dayjs('2026-01-01')},{cellRender:({current,info})=>info.type==='date'&&current.format('YYYY-MM-DD')==='2026-01-08'?h('ul',{style:{margin:0,padding:0,listStyle:'none'}},Array.from({length:20},(_,index)=>h('li',String(index+1)))):null})
]})}));app.mount('#app');await nextTick();await nextTick();window.rangeBrowser={unmount:()=>app.unmount()};
</script></body></html>`,
  );
  server = await createServer({
    root: directory,
    cacheDir: path.join(directory, 'vite-cache'),
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, directory] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  for (const scenario of scenarios) {
    activeCase = scenario.name;
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: 1100 },
      deviceScaleFactor: 1,
    });
    try {
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.rangeErrors = [];
        window.addEventListener('error', (event) => window.rangeErrors.push(event.message));
      });
      page.on('pageerror', (error) =>
        diagnostics.push({ scenario: scenario.name, type: 'pageerror', message: error.message }),
      );
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning')
          diagnostics.push({
            scenario: scenario.name,
            type: message.type(),
            message: message.text(),
          });
      });
      await page.goto(`${server.resolvedUrls.local[0]}?${new URLSearchParams(scenario)}`);
      await page.waitForFunction(() => window.rangeBrowser);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const measurement = await page.evaluate((events) => {
        const demo = document.querySelector('#range-demo');
        const grid = demo.querySelector('table').getBoundingClientRect();
        const bars = events.map(({ key, dates }) => {
          const cells = dates.map((date) => {
            const cell = demo.querySelector(`td[title="2026-01-${String(date).padStart(2, '0')}"]`);
            const bar = cell.querySelector('.apollo-picker-calendar-date-content span');
            return { date, cell, bar };
          });
          const present = cells.filter(({ bar }) => bar);
          const seams = [];
          for (let index = 1; index < present.length; index++) {
            const a = present[index - 1],
              b = present[index];
            if (a.cell.parentElement !== b.cell.parentElement) continue;
            const cellA = a.cell.getBoundingClientRect(),
              cellB = b.cell.getBoundingClientRect();
            const barA = a.bar.getBoundingClientRect(),
              barB = b.bar.getBoundingClientRect();
            const x =
              cellA.left < cellB.left
                ? (cellA.right + cellB.left) / 2
                : (cellA.left + cellB.right) / 2;
            const y = (Math.max(barA.top, barB.top) + Math.min(barA.bottom, barB.bottom)) / 2;
            const painted = [-0.5, 0.5].map((offset) => {
              const hit = document.elementFromPoint(x + offset, y);
              return a.bar.contains(hit) || b.bar.contains(hit);
            });
            seams.push({ dates: [a.date, b.date], painted, y, x });
          }
          return {
            key,
            missing: cells.filter(({ bar }) => !bar).map(({ date }) => date),
            cells: present.map(({ date, cell, bar }) => ({
              date,
              row: cell.parentElement.rowIndex,
              position: bar.dataset.position,
              text: bar.textContent.trim(),
              title: bar.title,
              left: bar.getBoundingClientRect().left,
              right: bar.getBoundingClientRect().right,
            })),
            seams,
          };
        });
        const content = [...demo.querySelectorAll('.apollo-picker-calendar-date-content')].map(
          (node) => {
            node.scrollLeft = 40;
            const scrollLeft = node.scrollLeft;
            node.scrollLeft = 0;
            const css = getComputedStyle(node);
            return {
              overflowX: css.overflowX,
              overflowY: css.overflowY,
              scrollLeft,
              height: node.clientHeight,
              clientWidth: node.clientWidth,
              scrollWidth: node.scrollWidth,
            };
          },
        );
        const ordinary = document.querySelector(
          '#ordinary td[title="2026-01-08"] .apollo-picker-calendar-date-content',
        );
        ordinary.scrollTop = 40;
        return {
          bars,
          grid: { left: grid.left, right: grid.right },
          content,
          calendarRootHeight: demo.querySelector('.apollo-picker-calendar').getBoundingClientRect()
            .height,
          dateRootHeight: demo
            .querySelector('td[title="2026-01-08"] .apollo-picker-calendar-date')
            .getBoundingClientRect().height,
          ordinary: {
            overflowY: getComputedStyle(ordinary).overflowY,
            height: ordinary.clientHeight,
            scrollHeight: ordinary.scrollHeight,
            scrollTop: ordinary.scrollTop,
            dateRootHeight: ordinary.closest('.apollo-picker-calendar-date').getBoundingClientRect()
              .height,
            calendarRootHeight: ordinary.closest('.apollo-picker-calendar').getBoundingClientRect()
              .height,
          },
          page: {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          },
          firstRowDate: demo.querySelector('tbody td[title]')?.getAttribute('title'),
        };
      }, ranges);
      results.push({ scenario, ...measurement });
      const screenshot = process.env.APOLLO_CALENDAR_RANGE_SCREENSHOTS;
      if (screenshot) {
        await page
          .locator('#range-demo')
          .screenshot({ path: path.join(screenshot, `${scenario.name}.png`) });
      }
      for (const range of measurement.bars) {
        for (const seam of range.seams)
          assert.deepEqual(
            seam.painted,
            [true, true],
            `${scenario.name}/${range.key}: ${JSON.stringify(seam)}`,
          );
        assert.deepEqual(
          range.missing,
          [],
          `${scenario.name}/${range.key}: all dates remain present`,
        );
        const rows = new Map();
        for (const cell of range.cells) {
          const group = rows.get(cell.row) ?? [];
          group.push(cell);
          rows.set(cell.row, group);
          assert.ok(
            cell.left >= measurement.grid.left - 1 && cell.right <= measurement.grid.right + 1,
          );
        }
        for (const cells of rows.values())
          for (const [index, cell] of cells.entries()) {
            const expected =
              cells.length === 1
                ? 'single'
                : index === 0
                  ? 'start'
                  : index === cells.length - 1
                    ? 'end'
                    : 'middle';
            assert.equal(
              cell.position,
              expected,
              `${scenario.name}/${range.key}: segment follows actual row`,
            );
            assert.equal(
              cell.text.length > 0,
              index === 0,
              `${scenario.name}/${range.key}: repeat title at row start`,
            );
            assert.ok(cell.title.length > 0);
          }
      }
      assert.ok(
        measurement.page.scrollWidth <= measurement.page.clientWidth,
        'No page horizontal overflow',
      );
      for (const content of measurement.content) {
        assert.equal(content.overflowX, 'visible');
        assert.equal(content.overflowY, 'visible');
        assert.equal(
          content.scrollLeft,
          0,
          'Range contents do not become horizontal scroll containers',
        );
        assert.equal(
          content.height,
          measurement.ordinary.height,
          'Keep the original fixed content height',
        );
      }
      assert.equal(measurement.ordinary.overflowY, 'auto');
      assert.equal(measurement.dateRootHeight, measurement.ordinary.dateRootHeight);
      assert.equal(measurement.calendarRootHeight, measurement.ordinary.calendarRootHeight);
      assert.ok(measurement.ordinary.scrollHeight > measurement.ordinary.height);
      assert.ok(
        measurement.ordinary.scrollTop > 0,
        'Ordinary event lists retain actual vertical scrolling',
      );
      assert.deepEqual(
        await page.evaluate(() => window.rangeErrors),
        [],
        'Strict native window.error gate',
      );
      await page.evaluate(() => window.rangeBrowser.unmount());
      assert.equal(await page.locator('.apollo-picker-calendar').count(), 0);
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(diagnostics, [], 'Strict browser console/pageerror gate');
  console.log(
    JSON.stringify({
      behaviorPassed: true,
      sourceOnly: true,
      browser: browser.version(),
      durationMs: Math.round(performance.now() - started),
      results,
      diagnostics,
    }),
  );
} catch (error) {
  console.error(JSON.stringify({ behaviorPassed: false, activeCase, results, diagnostics }));
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
