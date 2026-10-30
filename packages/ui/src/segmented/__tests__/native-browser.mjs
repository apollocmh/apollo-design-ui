import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd(),
  started = performance.now();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-segmented-native-'));
const alias = Object.fromEntries(
  ['ui', 'icons', 'motion', 'utils', 'theme', 'a11y', 'locale', 'form-core'].map((name) => [
    `@apollo-design/${name}`,
    path.join(repo, 'packages', name, 'src'),
  ]),
);
alias.vue = path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js');
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Segmented native contracts</title><link rel="icon" href="data:"></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref,shallowRef,nextTick} from 'vue';
import {Segmented} from '/@fs${repo}/packages/ui/src/segmented/index.ts';
import {ConfigProvider} from '/@fs${repo}/packages/ui/src/config-provider/index.ts';
import {genSegmentedStyle} from '/@fs${repo}/packages/ui/src/segmented/style/index.ts';
import NativeSegmented from '/@fs${repo}/packages/ui/src/segmented/__tests__/fixtures/NativeSegmented.vue';
const style=document.createElement('style');style.textContent=genSegmentedStyle('apollo');document.head.append(style);
const value=ref('a'),deny=ref(true),rtl=ref(false),vertical=ref(false),themed=ref(true),present=ref(true),cancel=ref(false),compiled=shallowRef(null),control=shallowRef(null),requests=[],changes=[],ends=[];
const options=[{value:'a',label:'Alpha'},{value:'skip',label:'Disabled',disabled:true},{value:'b',label:'Beta'},{value:'c',label:'Gamma'}];
const app=createApp(defineComponent({setup:()=>()=>h('form',{id:'native-form'},[
h(NativeSegmented,{ref:compiled}),h(ConfigProvider,{direction:rtl.value?'rtl':'ltr',theme:themed.value?{components:{Segmented:{trackPadding:'5px',trackBg:'pink',itemSelectedBg:'purple',itemSelectedColor:'white'}}}:undefined},()=>present.value?h(Segmented,{id:'native-live',ref:control,name:'choice',options,value:value.value,vertical:vertical.value,onChange:next=>changes.push(next),'onUpdate:value':next=>{requests.push(next);if(!deny.value)value.value=next},onKeydown:event=>{if(cancel.value)event.preventDefault()},onTransitionend:event=>ends.push(event.propertyName)}):null),h(Segmented,{id:'independent',options:['a','b']})])}));app.mount('#app');await nextTick();await nextTick();
window.segmentedNative={requests,changes,ends,state(){const root=document.getElementById('native-live');return {value:value.value,compiledValue:compiled.value.value,compiledRef:compiled.value.element===document.getElementById('compiled-segmented'),ref:control.value?.nativeElement===root,form:new FormData(document.getElementById('native-form')).get('choice'),tabStops:root?.querySelectorAll('input[tabindex="0"]').length,theme:root?.style.getPropertyValue('--apollo-segmented-track-padding')}} ,async patch(key,next){({value,deny,rtl,vertical,themed,present,cancel})[key].value=next;await nextTick();await nextTick()},unmount(){app.unmount()}};
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } }),
    errors = [];
  page.setDefaultTimeout(10_000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.nativeSegmentedErrors = [];
    window.addEventListener('error', (event) => window.nativeSegmentedErrors.push(event.message));
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.segmentedNative);
  const read = () => page.evaluate(() => window.segmentedNative.state());
  const patch = (key, value) =>
    page.evaluate(([key, value]) => window.segmentedNative.patch(key, value), [key, value]);
  const radio = (value) => page.locator(`#native-live input[value="${value}"]`);
  assert.equal((await read()).compiledRef, true);
  assert.equal((await read()).ref, true);
  assert.equal((await read()).tabStops, 1);
  assert.equal((await read()).form, 'a');
  await page
    .locator('#native-live label')
    .filter({ has: page.locator('input[value="b"]') })
    .click();
  assert.equal(await radio('a').isChecked(), true);
  assert.equal(await radio('b').isChecked(), false);
  assert.deepEqual(await page.evaluate(() => window.segmentedNative.changes), ['b']);
  await patch('deny', false);
  await radio('a').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal((await read()).value, 'b');
  assert.equal((await read()).form, 'b');
  assert.equal(await radio('b').evaluate((node) => node === document.activeElement), true);
  assert.equal(await page.locator('#independent input[value="a"]').isChecked(), true);
  await patch('rtl', true);
  await page.keyboard.press('ArrowLeft');
  assert.equal((await read()).value, 'c');
  assert.equal(await radio('c').evaluate((node) => node === document.activeElement), true);
  await patch('cancel', true);
  await page.keyboard.press('ArrowRight');
  assert.equal((await read()).value, 'c');
  await patch('cancel', false);
  await patch('value', 'b');
  await page.evaluate(() => {
    window.retiredThumb = document.querySelector('#native-live .apollo-segmented-thumb');
  });
  await patch('value', 'c');
  assert.equal(
    await page.evaluate(
      () => document.querySelector('#native-live .apollo-segmented-thumb') !== window.retiredThumb,
    ),
    true,
  );
  await page.evaluate(() => window.retiredThumb?.dispatchEvent(new Event('transitionend')));
  assert.equal(await page.locator('#native-live .apollo-segmented-thumb').count(), 1);
  await page.waitForFunction(() => !document.querySelector('#native-live .apollo-segmented-thumb'));
  assert.equal(
    await page.locator('#native-live label.apollo-segmented-item-selected input').inputValue(),
    'c',
  );
  assert.ok((await page.evaluate(() => window.segmentedNative.ends)).includes('transform'));
  assert.equal(
    await page.locator('#native-live').evaluate((node) => getComputedStyle(node).padding),
    '5px',
  );
  assert.equal(
    await page
      .locator('#native-live label.apollo-segmented-item-selected')
      .evaluate((node) => getComputedStyle(node).backgroundColor),
    'rgb(128, 0, 128)',
  );
  await patch('vertical', true);
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() =>
    document.querySelector('#native-live .apollo-segmented-thumb-motion-appear-active'),
  );
  assert.ok(
    await page
      .locator('#native-live .apollo-segmented-thumb')
      .evaluate((node) => getComputedStyle(node).transitionProperty.includes('height')),
  );
  await page.waitForFunction(() => !document.querySelector('#native-live .apollo-segmented-thumb'));
  assert.equal((await read()).value, 'b');
  await patch('themed', false);
  assert.equal((await read()).theme, '');
  await patch('present', false);
  assert.equal(await page.locator('#native-live').count(), 0);
  await patch('present', true);
  assert.equal((await read()).ref, true);
  await page.locator('#compiled-segmented input[value="one"]').focus();
  await page.keyboard.press('Space');
  assert.equal((await read()).compiledValue, 'one');
  await page.evaluate(() => window.segmentedNative.unmount());
  assert.equal(await page.locator('input').count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.nativeSegmentedErrors), []);
  console.log(
    `Segmented source browser passed (${((performance.now() - started) / 1000).toFixed(2)}s): compiled model/ref, controlled refusal, form value, single Tab entry, RTL accepted focus, independent groups, rapid/vertical native transition and theme removal/unmount.`,
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
