import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../tests/visual/stabilize.mjs';

const repo = process.cwd(),
  started = performance.now();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-motion-native-'));
const alias = Object.fromEntries(
  ['motion', 'utils', 'theme', 'a11y'].map((name) => [
    `@apollo-design/${name}`,
    path.join(repo, 'packages', name, 'src'),
  ]),
);
alias.vue = path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js');
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Motion native contracts</title><link rel="icon" href="data:,"><style>.live-motion{overflow:hidden;transition:height 70ms linear,opacity 70ms linear}.live-content{height:80px}body{margin:24px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref,shallowRef,nextTick} from 'vue';
import {CSSMotion,initCollapseMotion} from '@apollo-design/motion';
import NativeMotion from '/@fs${repo}/packages/motion/src/__tests__/fixtures/NativeMotion.vue';
const active=ref(false),compiled=shallowRef(null),events=[],endEvents=[];
const {motionName:_name,motionDeadline,...hooks}=initCollapseMotion('live');
const app=createApp(defineComponent({setup:()=>()=>[
h(NativeMotion,{ref:compiled}),h(CSSMotion,{visible:active.value,motionName:'live-motion',motionAppear:false,motionDeadline:500,hooks,onVisibleChanged:value=>events.push(value),id:'live-root','aria-label':'Measured motion'},{default:({className,style})=>h('section',{class:className,style,onTransitionend:event=>endEvents.push(event.propertyName)},[h('div',{class:'live-content'},'Measured native content')])})
]}));app.mount('#app');await nextTick();await nextTick();
window.motionNative={events,endEvents,state(){return {height:document.getElementById('live-root')?.getBoundingClientRect().height,compiledEvents:compiled.value.changed,removals:compiled.value.removals,ref:compiled.value.node===document.getElementById('compiled-motion')}},async patch(kind){if(kind==='open')active.value=true;if(kind==='close')active.value=false;if(kind==='empty')compiled.value.renderContent=false;if(kind==='restore')compiled.value.renderContent=true;if(kind==='remove')compiled.value.keys=[];await nextTick();await nextTick()},unmount(){app.unmount()}};
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
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } }),
    errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.nativeMotionErrors = [];
    window.addEventListener('error', (event) => window.nativeMotionErrors.push(event.message));
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.motionNative);
  const read = () => page.evaluate(() => window.motionNative.state());
  const patch = (kind) => page.evaluate((value) => window.motionNative.patch(value), kind);
  assert.equal((await read()).ref, true);
  assert.equal(await page.locator('#compiled-motion').innerText(), 'Full content 0');
  assert.deepEqual((await read()).compiledEvents, [true]);
  await patch('empty');
  assert.equal(await page.locator('#compiled-motion').count(), 0);
  await patch('restore');
  assert.equal((await read()).ref, true);
  await patch('remove');
  assert.equal(await page.locator('article').count(), 0);
  assert.equal((await read()).removals, 1);
  await patch('open');
  await page.waitForFunction(() => window.motionNative.events.includes(true));
  assert.equal((await read()).height, 80);
  assert.equal(await page.locator('#live-root').getAttribute('aria-label'), 'Measured motion');
  assert.equal(await page.locator('#live-root').evaluate((node) => node.style.height), '');
  assert.ok((await page.evaluate(() => window.motionNative.endEvents)).includes('height'));
  await patch('close');
  assert.equal(await page.locator('#live-root').count(), 1);
  await page.waitForFunction(() => window.motionNative.events.includes(false));
  assert.equal(await page.locator('#live-root').count(), 0);
  assert.deepEqual(await page.evaluate(() => window.motionNative.events), [true, false]);
  await page.evaluate(() => window.motionNative.unmount());
  assert.equal(await page.locator('#compiled-motion').count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.nativeMotionErrors), []);
  console.log(
    `Motion source browser passed (${((performance.now() - started) / 1000).toFixed(2)}s): native compiled slots/attrs/ref/empty content, list removal and real measured collapse transition/end notifications.`,
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
