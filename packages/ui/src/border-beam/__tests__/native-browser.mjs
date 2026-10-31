import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd(),
  started = performance.now();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-border-beam-native-'));
const alias = Object.fromEntries(
  ['ui', 'icons', 'motion', 'utils', 'theme', 'a11y', 'locale', 'form-core'].map((name) => [
    `@apollo-design/${name}`,
    path.join(repo, 'packages', name, 'src'),
  ]),
);
alias.vue = path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js');
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>BorderBeam native contracts</title><link rel="icon" href="data:"></head><body><main id="app"></main><main id="conditional"></main><iframe id="remote" title="Remote host"></iframe><script type="module">
import {createApp,defineComponent,defineAsyncComponent,createCommentVNode,h,ref,shallowRef,nextTick} from 'vue';
import NativeBorderBeam from '/@fs${repo}/packages/ui/src/border-beam/__tests__/fixtures/NativeBorderBeam.vue';
import BorderBeam from '/@fs${repo}/packages/ui/src/border-beam/BorderBeam.ts';
import {borderSamplerSize} from '/@fs${repo}/packages/ui/src/border-beam/border-sampler.ts';
import {ConfigProvider} from '/@fs${repo}/packages/ui/src/config-provider/index.ts';
import {genBorderBeamStyle} from '/@fs${repo}/packages/ui/src/border-beam/style/index.ts';
const css=genBorderBeamStyle('apollo');const style=document.createElement('style');style.textContent=css+'body{margin:20px}#compiled-host{width:240px;height:80px;border-radius:12px}';document.head.append(style);
const timers=new Set(),interval=window.setInterval.bind(window),clear=window.clearInterval.bind(window);window.setInterval=(callback,ms,...args)=>{const id=interval(callback,ms,...args);if(ms===500)timers.add(id);return id};window.clearInterval=id=>{timers.delete(id);return clear(id)};
const vm=shallowRef(null),theme=shallowRef({token:{colorPrimary:'#123456',lineWidth:3,fontSize:17}}),mode=ref('none');let mounted=0;
const Inner=defineComponent({setup(){const id=++mounted;return()=>mode.value==='none'?createCommentVNode('waiting'):h(mode.value==='button'?'button':'article',{id:'nested-host','data-instance':id,style:{position:'relative',border:'4px solid black'}},mode.value)}});
const Outer=defineComponent({setup:()=>()=>h(Inner)});
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value},()=>h(NativeBorderBeam,{ref:vm}))}));app.mount('#app');
const conditional=createApp(defineComponent({setup:()=>()=>h(BorderBeam,{},()=>h(Outer))}));conditional.mount('#conditional');
const frame=document.getElementById('remote'),remote=frame.contentDocument,remoteStyle=remote.createElement('style');remoteStyle.textContent=css;remote.head.append(remoteStyle);const remoteMount=remote.createElement('main');remote.body.append(remoteMount);
const remoteApp=createApp(defineComponent({setup:()=>()=>h(BorderBeam,{},()=>h('div',{id:'remote-host',style:{position:'relative',border:'6px solid black'}},'Remote'))}));remoteApp.mount(remoteMount);
const settle=async()=>{await nextTick();await nextTick()};await settle();
window.beamNative={state(){return{ref:vm.value?.hostElement===document.getElementById('compiled-host'),count:vm.value?.count,sampler:borderSamplerSize(),timers:timers.size,mounted}},async patch(key,value){if(key==='theme')theme.value=value;else if(key==='mode')mode.value=value;else vm.value[key]=value;await settle()},adopt(){document.body.append(document.adoptNode(remote.getElementById('remote-host')))},unmount(){app.unmount();conditional.unmount();remoteApp.unmount()}};
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
  const page = await browser.newPage({
      viewport: { width: 900, height: 650 },
      reducedMotion: 'no-preference',
    }),
    errors = [];
  page.setDefaultTimeout(10_000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.beamNative?.state().ref);
  const state = () => page.evaluate(() => window.beamNative.state());
  const patch = (key, value) =>
    page.evaluate(([key, value]) => window.beamNative.patch(key, value), [key, value]);
  const host = page.locator('#compiled-host');
  assert.equal((await state()).sampler, 2);
  assert.equal((await state()).timers, 1);
  assert.equal(await host.evaluate((node) => node.style.marginTop), '3px');
  assert.equal(await host.evaluate((node) => getComputedStyle(node).color), 'rgb(255, 0, 0)');
  const beam = host.locator('.apollo-border-beam').first();
  assert.equal(await beam.evaluate((node) => getComputedStyle(node).paddingTop), '3px');
  assert.equal(await beam.evaluate((node) => getComputedStyle(node, '::before').width), '40px');
  assert.match(
    await beam.evaluate((node) => getComputedStyle(node, '::before').backgroundImage),
    /rgb\(18, 52, 86\)/,
  );
  await host.focus();
  await page.evaluate(() => {
    window.originalBeamHost = document.getElementById('compiled-host');
  });
  await patch('settings', { count: 3, duration: 9, size: 60 });
  assert.equal(
    await host.evaluate(
      (node) => node === window.originalBeamHost && document.activeElement === node,
    ),
    true,
  );
  assert.equal(await host.locator('.apollo-border-beam').count(), 3);
  assert.equal(
    await beam.evaluate((node) => getComputedStyle(node, '::before').animationDuration),
    '9s',
  );
  await host.click();
  assert.equal((await state()).count, 1);
  assert.equal(await host.locator('.apollo-border-beam').count(), 3);
  await patch('theme', { token: { colorPrimary: '#abcdef', lineWidth: 5, fontSize: 19 } });
  assert.equal(await beam.evaluate((node) => getComputedStyle(node).paddingTop), '5px');
  assert.match(
    await beam.evaluate((node) => getComputedStyle(node, '::before').backgroundImage),
    /rgb\(171, 205, 239\)/,
  );
  assert.equal(
    await host.evaluate(
      (node) => node === window.originalBeamHost && document.activeElement === node,
    ),
    true,
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await beam.evaluate((node) => getComputedStyle(node, '::before').display), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await patch('mode', 'button');
  assert.equal(await page.locator('#nested-host .apollo-border-beam').count(), 1);
  await page.evaluate(() => {
    window.nestedBeam = document.querySelector('#nested-host .apollo-border-beam');
  });
  await patch('mode', 'article');
  assert.equal(
    await page
      .locator('#nested-host .apollo-border-beam')
      .evaluate((node) => node === window.nestedBeam),
    true,
  );
  assert.equal((await state()).mounted, 1);
  await patch('mode', 'none');
  assert.equal((await state()).sampler, 2);
  assert.equal(await page.locator('#conditional .apollo-border-beam').count(), 0);
  assert.equal(
    await page
      .frameLocator('#remote')
      .locator('.apollo-border-beam')
      .evaluate((node) => node.style.getPropertyValue('--apollo-border-beam-inset-offset')),
    '-6px -6px -6px -6px',
  );
  await page.evaluate(() => window.beamNative.adopt());
  assert.equal(await page.locator('#remote-host .apollo-border-beam').count(), 1);
  await page.waitForTimeout(550);
  assert.equal((await state()).sampler, 2);
  await patch('shown', false);
  assert.equal((await state()).sampler, 1);
  await patch('shown', true);
  assert.equal((await state()).ref, true);
  assert.equal((await state()).sampler, 2);
  await page.evaluate(() => window.beamNative.unmount());
  assert.equal((await state()).sampler, 0);
  assert.equal((await state()).timers, 0);
  assert.equal(await page.locator('.apollo-border-beam').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    `BorderBeam source browser passed (${((performance.now() - started) / 1000).toFixed(2)}s): actual template ref/focus, live host/effect styles, theme aliases/reduced motion, nested conditional host identity, iframe/adoption and resource release.`,
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
