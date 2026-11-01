/** Source-only regression: node packages/ui/src/affix/__tests__/s72-outer-scroll-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-affix-outer-scroll-'));
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
const cases = [];
const diagnostics = [];
let server, browser;
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Affix outer scroll regression</title><link rel="icon" href="data:,"><style>body{margin:0;font-family:Arial,sans-serif}*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,nextTick,shallowRef} from 'vue';
import Affix from '/@fs${repo}/packages/ui/src/affix/Affix.vue';
import {genAffixStyle} from '/@fs${repo}/packages/ui/src/affix/style/index.ts';
const css=document.createElement('style');css.textContent=genAffixStyle();document.head.append(css);
const query=new URLSearchParams(location.search),edge=query.get('edge'),owner=query.get('owner');
const target=shallowRef(null),affix=shallowRef(null);
const spacer=height=>h('div',{style:{height:height+'px'}});
const renderTarget=()=>h('div',{id:'target',ref:target,style:{height:'260px',width:'480px',overflow:'auto'}},[
...(edge==='bottom'?[spacer(280)]:[]),
h(Affix,{ref:affix,id:'fixed-root',target:()=>target.value,...(edge==='top'?{offsetTop:10}:{offsetBottom:10})},{default:()=>h('div',{style:{height:'44px',background:'#d9e8ff'}},'Actual Affix content')}),spacer(600)]);
const app=createApp(defineComponent({setup:()=>()=>[
spacer(owner==='window'?300:140),
owner==='window'?renderTarget():h('div',{id:'ancestor',style:{height:'420px',width:'700px',overflow:'auto'}},[spacer(160),renderTarget(),spacer(900)]),spacer(2000)]}));
app.mount('#app');await nextTick();await nextTick();
window.affixOuterScroll={
scroll(){if(owner==='window')window.scrollTo(0,120);else document.querySelector('#ancestor').scrollTop=120},
manual(){affix.value.updatePosition()},unmount(){app.unmount()},
read(){const targetRect=target.value.getBoundingClientRect(),fixed=document.querySelector('#fixed-root > .apollo-affix'),fixedRect=fixed?.getBoundingClientRect();const expected=edge==='top'?targetRect.top+10:targetRect.bottom-10,actual=edge==='top'?fixedRect?.top:fixedRect?.bottom;return{targetTop:targetRect.top,targetBottom:targetRect.bottom,actual,expected,error:actual===undefined?null:actual-expected,position:fixed&&getComputedStyle(fixed).position,inlineTop:fixed?.style.top,inlineBottom:fixed?.style.bottom}}
};
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
  for (const edge of ['top', 'bottom']) {
    for (const owner of ['window', 'ancestor']) {
      const context = await browser.newContext({ viewport: { width: 1000, height: 800 } });
      try {
        const page = await context.newPage();
        await page.addInitScript(() => {
          window.affixErrors = [];
          window.addEventListener('error', (event) => window.affixErrors.push(event.message));
        });
        page.on('pageerror', (error) => diagnostics.push({ edge, owner, message: error.message }));
        page.on('console', (message) => {
          if (message.type() === 'error' || message.type() === 'warning')
            diagnostics.push({ edge, owner, type: message.type(), message: message.text() });
        });
        await page.goto(`${server.resolvedUrls.local[0]}?${new URLSearchParams({ edge, owner })}`);
        await page.waitForFunction(
          () => window.affixOuterScroll && document.querySelector('#fixed-root > .apollo-affix'),
        );
        const frames = () =>
          page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
              ),
          );
        await frames();
        const initial = await page.evaluate(() => window.affixOuterScroll.read());
        assert.equal(initial.position, 'fixed');
        assert.ok(Math.abs(initial.error) < 1, JSON.stringify(initial));
        await page.evaluate(() => window.affixOuterScroll.scroll());
        await page.waitForFunction(() => {
          const state = window.affixOuterScroll.read();
          return state.targetTop === 180 && state.error !== null && Math.abs(state.error) < 1;
        });
        const automatic = await page.evaluate(() => window.affixOuterScroll.read());
        assert.equal(automatic.targetTop - initial.targetTop, -120);
        assert.ok(Math.abs(automatic.error) < 1, JSON.stringify(automatic));
        await page.evaluate(() => window.affixOuterScroll.manual());
        await frames();
        const manual = await page.evaluate(() => window.affixOuterScroll.read());
        assert.ok(Math.abs(manual.error) < 1, JSON.stringify(manual));
        await page.evaluate(() => window.affixOuterScroll.unmount());
        await frames();
        assert.equal(await page.locator('.apollo-affix').count(), 0);
        const windowErrors = await page.evaluate(() => window.affixErrors);
        assert.deepEqual(windowErrors, [], 'Strict native window.error gate');
        cases.push({ edge, owner, initial, automatic, manual, windowErrors });
      } finally {
        await context.close();
      }
    }
  }
  assert.deepEqual(diagnostics, [], 'Strict browser console/pageerror gate');
  console.log(
    JSON.stringify({
      behaviorPassed: true,
      sourceOnly: true,
      browser: browser.version(),
      durationMs: Math.round(performance.now() - started),
      cases,
      diagnostics,
    }),
  );
} catch (error) {
  console.error(JSON.stringify({ behaviorPassed: false, cases, diagnostics }));
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
