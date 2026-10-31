/** Source Tour integration: actual geometry, focus, mask hit testing and resource ownership. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-tour-native-'));
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
let server, browser, page, failure;
const diagnostics = [];
let behaviorPassed = false;
const started = performance.now();
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Tour native contracts</title><link rel="icon" href="data:,"><style>body{margin:24px}button{margin-inline-end:12px}</style></head><body><main id="app"></main><script type="module">
import{createApp,h,shallowRef}from'vue';import Fixture from'/@fs${repo}/packages/ui/src/tour/__tests__/fixtures/NativeTour.vue';
import{getDesignToken,transformToken}from'@apollo-design/theme';import{genTourStyle}from'/@fs${repo}/packages/ui/src/tour/style/index.ts';import{genButtonStyle}from'/@fs${repo}/packages/ui/src/button/style/index.ts';import{genTooltipStyle}from'/@fs${repo}/packages/ui/src/tooltip/style/index.ts';
for(const[k,v]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(k,v);
const style=document.createElement('style');style.textContent=genTourStyle()+genTourStyle('orbit')+genButtonStyle('apollo')+genButtonStyle('orbit')+genTooltipStyle();document.head.append(style);
const fixture=shallowRef(null);const app=createApp({render:()=>h(Fixture,{ref:fixture})});window.mountTour=()=>app.mount('#app');
window.tourState={patch:k=>fixture.value.patch(k),events:()=>fixture.value.events(),originsStable:()=>fixture.value.originsStable(),unmount:()=>app.unmount()};
</script></body></html>`,
  );
  server = await createServer({
    root: directory,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, directory] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => {
    window.tourErrors = [];
    window.tourObservers = [];
    window.tourFrames = new Set();
    window.tourListeners = [];
    window.addEventListener('error', (event) => window.tourErrors.push(event.message));
    const Resize = window.ResizeObserver;
    window.ResizeObserver = class extends Resize {
      targets = new Set();
      constructor(callback) {
        super(callback);
        window.tourObservers.push(this);
      }
      observe(target, options) {
        this.targets.add(target);
        super.observe(target, options);
      }
      unobserve(target) {
        this.targets.delete(target);
        super.unobserve(target);
      }
      disconnect() {
        this.targets.clear();
        super.disconnect();
      }
    };
    const add = EventTarget.prototype.addEventListener,
      remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, callback, options) {
      if ((this === window || this === document) && ['scroll', 'resize', 'keydown'].includes(type))
        window.tourListeners.push({
          target: this,
          type,
          callback,
          capture: typeof options === 'boolean' ? options : !!options?.capture,
        });
      return add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function (type, callback, options) {
      const capture = typeof options === 'boolean' ? options : !!options?.capture;
      window.tourListeners = window.tourListeners.filter(
        (entry) =>
          !(
            entry.target === this &&
            entry.type === type &&
            entry.callback === callback &&
            entry.capture === capture
          ),
      );
      return remove.call(this, type, callback, options);
    };
    const frame = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      const id = frame((time) => {
        window.tourFrames.delete(id);
        callback(time);
      });
      window.tourFrames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      window.tourFrames.delete(id);
      cancel(id);
    };
  });
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => !!window.mountTour);
  await page.evaluate(() => {
    window.tourBaselineListeners = new Set(window.tourListeners);
    window.mountTour();
  });
  const patch = (kind) => page.evaluate((kind) => window.tourState.patch(kind), kind);
  const ticks = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  const popup = page.locator('#native-tour');
  const snapshot = () =>
    popup.evaluate((root) => {
      const prefix = root.classList.contains('orbit-tour') ? 'orbit-tour' : 'apollo-tour';
      const mask = root.parentElement.querySelector(`.${prefix}-mask`);
      const target = document.querySelector('#tour-target-one').getBoundingClientRect();
      const hole = mask?.querySelector('mask > rect[fill="black"]');
      const rect = root.getBoundingClientRect();
      const close = root.querySelector(`.${prefix}-close`);
      return {
        z: getComputedStyle(root).zIndex,
        maskZ: mask && getComputedStyle(mask).zIndex,
        close: close && getComputedStyle(close).width,
        width: rect.width,
        top: rect.top,
        targetBottom: target.bottom,
        hole: hole && {
          x: Number(hole.getAttribute('x')),
          y: Number(hole.getAttribute('y')),
          width: Number(hole.getAttribute('width')),
          height: Number(hole.getAttribute('height')),
        },
        owner: root.parentElement.id,
      };
    });
  await page.locator('#tour-opener').click();
  await popup.waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('#native-tour')).left !== '-1000vw',
  );
  const initial = await snapshot();
  assert.equal(initial.z, '2600');
  assert.equal(initial.maskZ, '2600');
  assert.equal(initial.close, '35px');
  assert.equal(initial.width, 340);
  assert.equal(initial.owner, 'tour-host-one');
  assert.ok(Math.abs(initial.top - initial.targetBottom - 18) < 2, JSON.stringify(initial));
  const target = await page.locator('#tour-target-one').boundingBox();
  assert.ok(Math.abs(initial.hole.x - (target.x - 6)) < 1);
  assert.equal(
    await page.evaluate(() => document.activeElement === document.querySelector('#native-tour')),
    true,
  );
  assert.equal(await popup.getAttribute('role'), 'dialog');
  assert.equal(await popup.getAttribute('id'), 'native-tour');
  assert.equal(
    await popup.evaluate(
      (root) => document.getElementById(root.getAttribute('aria-labelledby')).textContent,
    ),
    'Guide 0',
  );
  assert.equal(
    await popup
      .locator('.apollo-tour-title')
      .evaluate((element) => getComputedStyle(element).color),
    'rgb(0, 128, 0)',
  );
  await page.waitForFunction(
    () =>
      document.querySelector('.apollo-tooltip') &&
      getComputedStyle(document.querySelector('.apollo-tooltip')).zIndex === '2700',
  );
  const draft = popup.getByRole('textbox', { name: 'Tour draft' });
  await draft.fill('Retained input');
  await draft.focus();
  await draft.evaluate((input) => {
    window.tourDraft = input;
    input.setSelectionRange(2, 6);
  });
  await popup.locator('.apollo-tour-next-btn').evaluate((button) => (window.tourNext = button));
  await patch('theme');
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('#native-tour')).zIndex === '4200',
  );
  const themed = await snapshot();
  assert.equal(themed.close, '44px');
  assert.ok(Math.abs(themed.top - themed.targetBottom - 24) < 2, JSON.stringify(themed));
  assert.equal(
    await draft.evaluate(
      (input) =>
        input === window.tourDraft &&
        document.activeElement === input &&
        input.selectionStart === 2 &&
        input.selectionEnd === 6,
    ),
    true,
  );
  await patch('style');
  await page.waitForFunction(
    () => document.querySelector('#native-tour').getBoundingClientRect().width === 390,
  );
  await patch('close-icon');
  await popup.getByRole('button', { name: 'Close', exact: true }).waitFor();
  assert.ok((await popup.locator('.apollo-tour-close').textContent()).includes('Custom close'));
  await patch('close-icon');
  assert.ok(!(await popup.locator('.apollo-tour-close').textContent()).includes('Custom close'));
  await patch('empty-description');
  await ticks();
  assert.equal(await popup.locator('.apollo-tour-description').count(), 0);
  await patch('remove-description-slot');
  await ticks();
  assert.equal(
    await popup.locator('.apollo-tour-description').textContent(),
    'Fallback description',
  );
  await popup.locator('.apollo-tour-next-btn').click();
  await ticks();
  assert.equal(await popup.locator('.apollo-tour-title').textContent(), 'Guide 0');
  assert.deepEqual((await page.evaluate(() => window.tourState.events())).current, [1]);
  await patch('release');
  await ticks();
  assert.equal(await popup.locator('.apollo-tour-title').textContent(), 'Guide 0');
  await patch('accept');
  await popup.locator('.apollo-tour-next-btn').click();
  await page.waitForFunction(
    () => document.querySelector('#native-tour .apollo-tour-title')?.textContent === 'Guide 1',
  );
  assert.equal(await page.evaluate(() => window.tourState.originsStable()), true);
  assert.equal(
    await popup.locator('.apollo-tour-next-btn').evaluate((button) => button === window.tourNext),
    true,
  );
  const beforeScroll = await popup.evaluate((root) =>
    root.parentElement.querySelector('mask > rect[fill="black"]').getAttribute('y'),
  );
  const popupBeforeScroll = await popup.evaluate((root) => root.getBoundingClientRect().top);
  await page.locator('#tour-scroller').evaluate((scroller) => {
    scroller.scrollTop = 20;
  });
  await page.waitForFunction(
    (previous) =>
      document
        .querySelector('#native-tour')
        .parentElement.querySelector('mask > rect[fill="black"]')
        .getAttribute('y') !== previous,
    beforeScroll,
  );
  await page.waitForFunction(
    (top) =>
      Math.abs(document.querySelector('#native-tour').getBoundingClientRect().top - (top - 20)) < 1,
    popupBeforeScroll,
    { timeout: 1500 },
  );
  await draft.fill('Moved draft');
  await draft.focus();
  await draft.evaluate((input) => {
    window.tourMovingDraft = input;
    input.setSelectionRange(1, 4);
  });
  await patch('container');
  await page.waitForFunction(
    () => document.querySelector('#native-tour')?.parentElement.id === 'tour-host-two',
  );
  assert.equal(await page.locator('#tour-host-one .apollo-tour-mask').count(), 0);
  assert.equal(await page.locator('#tour-host-two .apollo-tour-mask').count(), 1);
  assert.equal(
    await draft.evaluate(
      (input) =>
        input === window.tourMovingDraft &&
        input.value === 'Moved draft' &&
        input === document.activeElement &&
        input.selectionStart === 1 &&
        input.selectionEnd === 4,
    ),
    true,
  );
  await patch('prefix');
  await page.waitForFunction(() =>
    document.querySelector('#native-tour')?.classList.contains('orbit-tour'),
  );
  assert.equal(await popup.locator('.orbit-tour-title').textContent(), 'Guide 1');
  assert.equal(
    await page.locator('#tour-preview').evaluate((root) => root.classList.contains('orbit-tour')),
    true,
  );
  await patch('zero');
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('#native-tour')).zIndex === '0',
  );
  assert.equal((await snapshot()).maskZ, '0');
  await patch('clear-theme');
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('#native-tour')).zIndex === '1070',
  );
  assert.equal(await popup.evaluate((root) => root.classList.contains('provider-tour')), false);
  await patch('mask');
  await ticks();
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
  const outside = await page.locator('#tour-outside').boundingBox();
  await page.mouse.click(outside.x + outside.width / 2, outside.y + outside.height / 2);
  assert.equal((await page.evaluate(() => window.tourState.events())).outside, 1);
  await draft.focus();
  await draft.evaluate((input) => {
    window.tourMaskDraft = input;
    input.setSelectionRange(0, 3);
  });
  await patch('mask');
  await ticks();
  assert.equal(
    await draft.evaluate(
      (input) =>
        input === window.tourMaskDraft &&
        input.value === 'Moved draft' &&
        input === document.activeElement &&
        input.selectionStart === 0 &&
        input.selectionEnd === 3,
    ),
    true,
  );
  await page.mouse.click(outside.x + outside.width / 2, outside.y + outside.height / 2);
  assert.equal((await page.evaluate(() => window.tourState.events())).outside, 1);
  // Reopen the first step to hit-test its actual target hole rather than a scrolled target.
  await patch('close');
  await popup.waitFor({ state: 'detached' });
  await patch('reopen');
  await popup.waitFor({ state: 'visible' });
  await ticks();
  assert.equal(await popup.locator('.orbit-tour-title').textContent(), 'Guide 0');
  const point = await page.locator('#tour-target-one').boundingBox();
  const outsideHits = await page.evaluate(() => {
    const mask = document.querySelector('.orbit-tour-mask');
    const rect = mask.querySelector('mask > rect[fill="black"]');
    const x = Number(rect.getAttribute('x')),
      y = Number(rect.getAttribute('y')),
      width = Number(rect.getAttribute('width')),
      height = Number(rect.getAttribute('height'));
    return [
      [x + width / 2, y - 2],
      [x - 2, y + height / 2],
      [x + width + 2, y + height / 2],
      [x + width / 2, y + height + 2],
    ].map(([left, top]) => !!document.elementFromPoint(left, top)?.closest('.orbit-tour-mask'));
  });
  assert.deepEqual(outsideHits, [true, true, true, true]);
  await page.mouse.click(point.x + point.width / 2, point.y + point.height / 2);
  assert.equal((await page.evaluate(() => window.tourState.events())).target, 1);
  assert.equal(
    await page.evaluate(
      () => document.activeElement === document.querySelector('#tour-target-one'),
    ),
    true,
  );
  await patch('interaction');
  await ticks();
  await page.mouse.click(point.x + point.width / 2, point.y + point.height / 2);
  assert.equal((await page.evaluate(() => window.tourState.events())).target, 1);
  await patch('other');
  const other = page.locator('#other-tour');
  await other.waitFor({ state: 'visible' });
  const before = (await page.evaluate(() => window.tourState.events())).current.length;
  await other.press('ArrowRight');
  await ticks();
  assert.equal((await page.evaluate(() => window.tourState.events())).current.length, before);
  assert.equal(await other.locator('.orbit-tour-title').textContent(), 'Other one');
  await page.keyboard.press('Escape');
  await other.waitFor({ state: 'detached' });
  assert.equal(await popup.count(), 1);
  assert.equal((await page.evaluate(() => window.tourState.events())).otherClose, 1);
  await popup.focus();
  await popup.locator('.orbit-tour-next-btn').click();
  await ticks();
  await popup.locator('.orbit-tour-next-btn').click();
  await popup.waitFor({ state: 'detached' });
  assert.equal((await page.evaluate(() => window.tourState.events())).finish, 1);
  await page.evaluate(() => {
    window.tourState.unmount();
  });
  await ticks();
  assert.deepEqual(
    await page.evaluate(() => ({
      observers: window.tourObservers.reduce((sum, observer) => sum + observer.targets.size, 0),
      frames: window.tourFrames.size,
      listeners: window.tourListeners.filter((entry) => !window.tourBaselineListeners.has(entry))
        .length,
      panels: document.querySelectorAll('[role="dialog"]').length,
      overflow: document.body.style.overflow,
    })),
    { observers: 0, frames: 0, listeners: 0, panels: 0, overflow: '' },
  );
  diagnostics.push(...(await page.evaluate(() => window.tourErrors)));
  behaviorPassed = true;
} catch (error) {
  failure = error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
const result = {
  behaviorPassed,
  exitCode: failure || diagnostics.length ? 1 : 0,
  durationMs: Math.round(performance.now() - started),
  diagnostics,
  ...(failure ? { failure: failure.stack ?? String(failure) } : {}),
};
await writeFile('/tmp/apollo-tour-browser-result.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.exitCode;
