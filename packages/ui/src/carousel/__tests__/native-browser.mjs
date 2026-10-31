import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd(),
  started = performance.now();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-carousel-native-'));
const alias = Object.fromEntries(
  ['ui', 'icons', 'motion', 'utils', 'theme', 'a11y', 'locale', 'form-core'].map((name) => [
    `@apollo-design/${name}`,
    path.join(repo, 'packages', name, 'src'),
  ]),
);
alias.vue = path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js');
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Carousel native contracts</title><link rel="icon" href="data:"></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref,shallowRef,nextTick} from 'vue';
import NativeCarousel from '/@fs${repo}/packages/ui/src/carousel/__tests__/fixtures/NativeCarousel.vue';
import {ConfigProvider} from '/@fs${repo}/packages/ui/src/config-provider/index.ts';
import {genCarouselStyle} from '/@fs${repo}/packages/ui/src/carousel/style/index.ts';
const style=document.createElement('style');style.textContent=genCarouselStyle('apollo')+'body{margin:20px}#compiled-carousel{width:360px}#compiled-carousel section{height:120px;background:#456;color:white}#compiled-carousel input{max-width:100%;box-sizing:border-box}';document.head.append(style);
const vm=shallowRef(null),theme=ref(true),cancel=ref(false),ends=[],swipes=[];
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value?{components:{Carousel:{arrowSize:'2rem',arrowOffset:12,dotWidth:18,dotHeight:5,dotGap:6,dotOffset:17,dotWidthActive:39}}}:undefined},()=>[h(NativeCarousel,{ref:vm,title:'Native root','data-native':'yes',style:[{paddingTop:'7px'}],onKeydown:event=>{if(cancel.value)event.preventDefault()},onTransitionend:event=>ends.push(event.propertyName),onSwipe:value=>swipes.push(value)}),h('button',{id:'outside'},'Outside'),h('p',{id:'outside-help'},'External help')])}));app.mount('#app');await nextTick();await nextTick();
window.carouselNative={ends,swipes,state(){return {current:vm.value.current,ready:vm.value.ready,ref:vm.value.element===document.getElementById('compiled-carousel'),before:[...vm.value.before],after:[...vm.value.after],refs:vm.value.contentElements?.length,fields:vm.value.fieldElements?.length,slotted:vm.value.slottedElements?.length,cloneSlottedRefs:vm.value.slottedElements?.some(node=>node.closest('.slick-cloned')),cloneFieldRefs:vm.value.fieldElements?.some(node=>node.closest('.slick-cloned')),cloneRefs:vm.value.contentElements?.some(node=>node.closest('.slick-cloned')),theme:document.getElementById('compiled-carousel')?.style.getPropertyValue('--apollo-carousel-arrow-size')}} ,async patch(key,value){if(key==='theme')theme.value=value;else if(key==='cancel')cancel.value=value;else if(key==='options')vm.value.options={...vm.value.options,...value};else vm.value[key]=value;await nextTick();await nextTick()},async goTo(index){vm.value.goTo(index,true);await nextTick();await nextTick()},unmount(){app.unmount()}};
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
  page.setDefaultTimeout(10_000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.nativeCarouselErrors = [];
    window.addEventListener('error', (event) => window.nativeCarouselErrors.push(event.message));
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.carouselNative?.state().ready);
  const state = () => page.evaluate(() => window.carouselNative.state());
  const patch = (key, value) =>
    page.evaluate(([key, value]) => window.carouselNative.patch(key, value), [key, value]);
  const goTo = (index) => page.evaluate((index) => window.carouselNative.goTo(index), index);
  const root = page.locator('#compiled-carousel'),
    list = page.locator('#compiled-carousel .slick-list');
  assert.equal((await state()).ref, true);
  assert.equal((await state()).refs, 3);
  assert.equal((await state()).cloneRefs, false);
  assert.equal(await root.getAttribute('title'), 'Native root');
  assert.equal(await root.getAttribute('data-native'), 'yes');
  assert.equal(await root.evaluate((node) => node.style.paddingTop), '7px');
  assert.equal(await page.locator('.slick-slider').evaluate((node) => node.style.paddingTop), '');
  await page
    .locator('.slick-cloned button')
    .first()
    .evaluate((node) => node.focus());
  assert.equal(
    await page
      .locator('.slick-cloned button')
      .first()
      .evaluate((node) => node === document.activeElement),
    false,
  );
  await list.focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-action')), 'a');
  await list.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => window.carouselNative.state().after.at(-1) === 1);
  assert.equal((await state()).current, 1);
  await page.waitForFunction(() => window.carouselNative.ends.includes('transform'));
  await patch('cancel', true);
  await list.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal((await state()).current, 1);
  await patch('cancel', false);
  await list.evaluate((node) =>
    node.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
        isComposing: true,
      }),
    ),
  );
  assert.equal((await state()).current, 1);
  await page.locator('.slick-active:not(.slick-cloned) input[id]').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal((await state()).current, 1);
  await page.evaluate(() => {
    window.arrow = document.querySelector('.slick-next');
  });
  await patch('custom', false);
  assert.equal(
    await page.evaluate(() => window.arrow === document.querySelector('.slick-next')),
    true,
  );
  await patch('custom', true);
  assert.match(await page.locator('.slick-next').innerText(), /Next 1 \/ 3.*slide/s);
  assert.equal(
    await page.locator('.slick-next').evaluate((node) => getComputedStyle(node, '::after').display),
    'none',
  );
  const geometry = await page.locator('.slick-prev').evaluate((node) => ({
    size: parseFloat(getComputedStyle(node).width),
    tip: parseFloat(getComputedStyle(node, '::after').width),
  }));
  assert.equal(geometry.size, 32);
  assert.ok(Math.abs(geometry.tip - 32 / Math.SQRT2) < 0.02);
  await patch('items', ['c', 'a', 'b']);
  assert.equal((await state()).refs, 3);
  assert.equal((await state()).cloneRefs, false);
  await patch('items', ['a', 'b', 'c']);
  await patch('options', { slidesToShow: 2, infinite: true });
  await goTo(2);
  const visibleClone = page.locator('.slick-cloned.slick-active');
  assert.equal(await visibleClone.count(), 1);
  assert.equal(await visibleClone.evaluate((node) => node.inert), false);
  assert.equal(await visibleClone.getAttribute('aria-hidden'), 'false');
  const cloneId = await visibleClone.locator('input[id]').getAttribute('id');
  assert.notEqual(cloneId, 'field-a');
  assert.equal(await visibleClone.locator('label').getAttribute('for'), cloneId);
  await visibleClone.locator('label').click();
  assert.equal(
    await visibleClone.locator('input[id]').evaluate((node) => node === document.activeElement),
    true,
  );
  const helpId = await visibleClone.locator('span[id]').getAttribute('id');
  assert.equal(
    await visibleClone.locator('input[id]').getAttribute('aria-describedby'),
    `${helpId} outside-help`,
  );
  assert.equal((await state()).fields, 3);
  assert.equal((await state()).cloneFieldRefs, false);
  await patch('custom', false);
  await patch('custom', true);
  assert.equal(await visibleClone.locator('input[id]').getAttribute('id'), cloneId);
  assert.equal((await state()).slotted, 3);
  assert.equal((await state()).cloneSlottedRefs, false);
  await patch('stampSuffix', 'updated');
  assert.equal((await state()).slotted, 3);
  assert.equal((await state()).cloneSlottedRefs, false);
  assert.equal(
    await page
      .locator('[data-slot-stamp]')
      .evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            node.getAttribute('data-slot-stamp')?.endsWith('-updated') &&
            node.getAttribute('aria-label') === node.getAttribute('data-slot-stamp'),
        ),
      ),
    true,
  );
  const ids = await page.locator('[id]').evaluateAll((nodes) => nodes.map((node) => node.id));
  assert.equal(ids.length, new Set(ids).size);
  await patch('options', { slidesToShow: 3 });
  assert.equal(await page.locator('.slick-cloned').count(), 0);
  assert.equal(await page.locator('.slick-arrow').count(), 0);
  assert.equal(
    await page
      .locator('.slick-slide')
      .evaluateAll((nodes) =>
        nodes.every((node) => !node.inert && node.getAttribute('aria-hidden') === 'false'),
      ),
    true,
  );
  await patch('options', { slidesToShow: 1, infinite: false, effect: 'fade', speed: 70 });
  await goTo(2);
  assert.equal(await page.locator('.slick-slide.slick-active').getAttribute('data-index'), '2');
  assert.equal(
    await page.locator('.slick-slide.slick-active').getAttribute('aria-hidden'),
    'false',
  );
  assert.equal(
    await page.locator('.slick-slide.slick-active').evaluate((node) => node.inert),
    false,
  );
  await patch('options', { effect: 'scrollx', infinite: true, rtl: true, vertical: false });
  await goTo(1);
  await list.focus();
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => window.carouselNative.state().after.at(-1) === 2);
  assert.equal((await state()).current, 2);
  assert.equal(await root.evaluate((node) => node.classList.contains('apollo-carousel-rtl')), true);
  await patch('options', { rtl: false });
  await patch('options', {
    effect: 'scrollx',
    infinite: true,
    vertical: false,
    autoplay: true,
    autoplaySpeed: 100,
    speed: 0,
    pauseOnFocus: true,
    pauseOnHover: true,
  });
  await page.locator('.slick-active:not(.slick-cloned) input[id]').focus();
  const held = (await state()).current;
  await page.waitForTimeout(230);
  assert.equal((await state()).current, held);
  await page.locator('.slick-active:not(.slick-cloned) section').hover();
  await page.locator('#outside').focus();
  await page.waitForTimeout(230);
  assert.equal((await state()).current, held);
  await page.locator('#outside').hover();
  await page.waitForFunction((value) => window.carouselNative.state().current !== value, held);
  await patch('options', { autoplay: false, speed: 60 });
  await page.locator('#outside').focus();
  await goTo(0);
  const box = await list.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + 300, box.y + 95);
  await page.mouse.down();
  await page.mouse.move(box.x + 30, box.y + 95, { steps: 5 });
  await page.mouse.up();
  await page.waitForFunction(() => window.carouselNative.state().current === 1);
  assert.deepEqual(await page.evaluate(() => window.carouselNative.swipes), ['left']);
  await patch('options', { vertical: true });
  await list.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => window.carouselNative.state().after.at(-1) === 2);
  assert.equal((await state()).current, 2);
  await goTo(1);
  const verticalBox = await list.boundingBox();
  assert.ok(verticalBox);
  const beforeY = await page
    .locator('.slick-track')
    .evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m42);
  await page.mouse.move(verticalBox.x + 250, verticalBox.y + 95);
  await page.mouse.down();
  await page.mouse.move(verticalBox.x + 250, verticalBox.y + 10, { steps: 5 });
  const duringY = await page
    .locator('.slick-track')
    .evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m42);
  assert.ok(Math.abs(duringY - beforeY + 85) < 1);
  await page.mouse.up();
  await page.waitForFunction(() => window.carouselNative.state().current === 2);
  assert.deepEqual(await page.evaluate(() => window.carouselNative.swipes), ['left', 'up']);
  await patch('theme', false);
  assert.equal((await state()).theme, '');
  await patch('items', []);
  assert.equal(await page.locator('.slick-slide').count(), 0);
  await patch('present', false);
  assert.equal(await root.count(), 0);
  await patch('items', ['a', 'b']);
  await patch('present', true);
  assert.equal((await state()).ref, true);
  await page.evaluate(() => window.carouselNative.unmount());
  assert.equal(await page.locator('.slick-slide').count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.nativeCarouselErrors), []);
  console.log(
    `Carousel source browser passed (${((performance.now() - started) / 1000).toFixed(2)}s): actual ref/slots/events, inactive clones/Tab, native keyboard, live sqrt geometry, dynamic slides/config, overlapping autoplay pause, real drag and transitions, theme removal and unmount.`,
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
