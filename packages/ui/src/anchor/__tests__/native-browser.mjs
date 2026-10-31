import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-affix-anchor-'));
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
const diagnostics = [];
let server, browser, page, failure;
let behaviorPassed = false;
const started = performance.now();
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Native Affix and Anchor</title><link rel="icon" href="data:,"><style>body{margin:24px}</style></head><body><main id="app"></main><script type="module">
import {createApp,h,shallowRef} from 'vue';import Fixture from '/@fs${repo}/packages/ui/src/anchor/__tests__/fixtures/NativeAnchor.vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';import {genAnchorStyle} from '/@fs${repo}/packages/ui/src/anchor/style/index.ts';import {genAffixStyle} from '/@fs${repo}/packages/ui/src/affix/style/index.ts';
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(key,value);
const style=document.createElement('style');style.textContent=genAnchorStyle('apollo')+genAnchorStyle('orbit')+genAffixStyle('apollo')+genAffixStyle('orbit');document.head.append(style);
const fixture=shallowRef(null);const app=createApp({render:()=>h(Fixture,{ref:fixture})});window.mountNative=()=>app.mount('#app');window.nativeState={patch:name=>fixture.value.patch(name),events:()=>fixture.value.events(),unmount:()=>app.unmount()};
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
  page.setDefaultTimeout(8000);
  await page.addInitScript(() => {
    window.nativeErrors = [];
    window.nativeObservers = [];
    window.nativeFrames = new Set();
    window.nativeListeners = [];
    window.addEventListener('error', (event) => window.nativeErrors.push(event.message));
    const Resize = window.ResizeObserver;
    window.ResizeObserver = class extends Resize {
      targets = new Set();
      constructor(callback) {
        super(callback);
        window.nativeObservers.push(this);
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
    const track = (target, type) =>
      (target === window || target === document || ['scroll-a', 'scroll-b'].includes(target.id)) &&
      ['scroll', 'resize', 'touchstart', 'touchmove', 'touchend', 'pageshow', 'load'].includes(
        type,
      );
    EventTarget.prototype.addEventListener = function (type, callback, options) {
      if (track(this, type))
        window.nativeListeners.push({
          target: this,
          type,
          callback,
          capture: typeof options === 'boolean' ? options : !!options?.capture,
        });
      return add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function (type, callback, options) {
      const capture = typeof options === 'boolean' ? options : !!options?.capture;
      window.nativeListeners = window.nativeListeners.filter(
        (item) =>
          !(
            item.target === this &&
            item.type === type &&
            item.callback === callback &&
            item.capture === capture
          ),
      );
      return remove.call(this, type, callback, options);
    };
    const frame = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      const id = frame((time) => {
        window.nativeFrames.delete(id);
        callback(time);
      });
      window.nativeFrames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      window.nativeFrames.delete(id);
      return cancel(id);
    };
  });
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type()))
      diagnostics.push({ type: message.type(), text: message.text() });
  });
  page.on('pageerror', (error) => diagnostics.push({ type: 'pageerror', text: error.message }));
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => !!window.mountNative);
  await page.evaluate(() => {
    window.nativeBaseline = [...window.nativeListeners];
    window.mountNative();
  });
  const patch = async (name) => {
    await page.evaluate((value) => window.nativeState.patch(value), name);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  };
  await page.locator('#draft').fill('a persistent draft');
  await page.evaluate(() => {
    window.initialDraft = document.querySelector('#draft');
    window.initialDraft.setSelectionRange(2, 8);
    document.querySelector('#scroll-a').scrollTop = 150;
  });
  await page.waitForFunction(() => document.querySelector('#native-affix > .apollo-affix'));
  const geometry = await page.evaluate(() => {
    const target = document.querySelector('#scroll-a').getBoundingClientRect();
    const fixed = document.querySelector('#native-affix > .apollo-affix').getBoundingClientRect();
    return {
      top: fixed.top,
      expected: target.top + 16,
      height: fixed.height,
      placeholder: document.querySelector('#native-affix').getBoundingClientRect().height,
    };
  });
  assert.ok(Math.abs(geometry.top - geometry.expected) < 1, JSON.stringify(geometry));
  assert.equal(geometry.height, 40);
  assert.equal(geometry.placeholder, 40);
  await page.waitForFunction(
    () =>
      document.querySelector('#native-nav a[aria-current="location"]')?.hash ===
      '#native-browser-a',
  );
  await patch('height');
  await page.waitForFunction(
    () =>
      Math.abs(
        document.querySelector('#native-affix > .apollo-affix').getBoundingClientRect().height - 95,
      ) < 1 &&
      Math.abs(document.querySelector('#native-affix').getBoundingClientRect().height - 95) < 1,
    null,
    { timeout: 1800 },
  );
  await patch('shrink');
  await page.waitForFunction(
    () => document.querySelector('#native-affix').getBoundingClientRect().height === 25,
  );

  await patch('theme');
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('#native-nav a')).color === 'rgb(23, 45, 67)',
  );
  assert.equal(
    await page
      .locator('#native-affix > .apollo-affix')
      .evaluate((node) => getComputedStyle(node).zIndex),
    '70',
  );
  assert.equal(
    await page
      .locator('#native-nav a')
      .first()
      .evaluate((node) => getComputedStyle(node.parentElement).paddingTop),
    '9px',
  );
  assert.equal(
    await page
      .locator('#native-nav a')
      .first()
      .evaluate((node) => getComputedStyle(node).color),
    'rgb(23, 45, 67)',
  );
  await patch('replace-theme');
  assert.equal(
    await page
      .locator('#native-affix > .apollo-affix')
      .evaluate((node) => getComputedStyle(node).zIndex),
    '0',
  );
  assert.equal(
    await page
      .locator('#native-nav a')
      .first()
      .evaluate((node) => getComputedStyle(node.parentElement).paddingTop),
    '0px',
  );
  await patch('prefix');
  await page.waitForFunction(
    () =>
      !!document.querySelector('#native-affix > .orbit-affix') &&
      !!document.querySelector('#native-nav .orbit-anchor-link-title'),
  );
  await patch('style');
  await patch('clear-theme');
  assert.equal(
    await page
      .locator('#native-affix > .orbit-affix')
      .evaluate((node) => getComputedStyle(node).zIndex),
    '10',
  );
  assert.equal(
    await page
      .locator('#native-nav a')
      .first()
      .evaluate((node) => getComputedStyle(node.parentElement).paddingTop),
    '4px',
  );
  const draft = await page.evaluate(() => {
    const input = document.querySelector('#draft');
    return {
      same: input === window.initialDraft,
      value: input.value,
      focused: document.activeElement === input,
      selection: [input.selectionStart, input.selectionEnd],
    };
  });
  assert.deepEqual(draft, {
    same: true,
    value: 'a persistent draft',
    focused: true,
    selection: [2, 8],
  });

  await patch('offset');
  const offset = await page.evaluate(() => ({
    fixed: document.querySelector('#native-affix > .orbit-affix').getBoundingClientRect().top,
    target: document.querySelector('#scroll-a').getBoundingClientRect().top,
  }));
  assert.ok(Math.abs(offset.fixed - offset.target) < 1);
  await patch('pending');
  assert.equal(await page.locator('#native-affix > .orbit-affix').count(), 0);
  assert.equal(
    await page.evaluate(
      () => window.nativeListeners.filter((item) => item.target.id === 'scroll-a').length,
    ),
    0,
  );
  await patch('target-b');
  await page.waitForFunction(() => !!document.querySelector('#native-affix > .orbit-affix'));
  assert.equal(
    await page.evaluate(
      () => window.nativeListeners.filter((item) => item.target.id === 'scroll-a').length,
    ),
    0,
  );
  await patch('target-a');
  await patch('cancel');
  const cancelled = await page.evaluate(() => ({
    top: document.querySelector('#scroll-a').scrollTop,
    hash: location.hash,
    changes: window.nativeState.events().changes.length,
  }));
  await page.locator('#native-nav a').nth(1).click();
  await page.waitForTimeout(500);
  assert.deepEqual(
    await page.evaluate(() => ({
      top: document.querySelector('#scroll-a').scrollTop,
      hash: location.hash,
      changes: window.nativeState.events().changes.length,
    })),
    cancelled,
  );
  await patch('accept');
  const next = page.locator('#native-nav a').nth(1);
  await next.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () =>
      Math.abs(
        document.querySelector('#native-browser-b').getBoundingClientRect().top -
          document.querySelector('#scroll-a').getBoundingClientRect().top -
          20,
      ) < 1,
  );
  const landing = await page.evaluate(() => ({
    target:
      document.querySelector('#native-browser-b').getBoundingClientRect().top -
      document.querySelector('#scroll-a').getBoundingClientRect().top,
    hash: location.hash,
    active: document.querySelector('#native-nav a[aria-current="location"]')?.hash,
  }));
  assert.ok(Math.abs(landing.target - 20) < 1, JSON.stringify(landing));
  assert.equal(landing.hash, '#native-browser-b');
  assert.equal(landing.active, '#native-browser-b');
  await patch('horizontal');
  await patch('label');
  const ink = await page.evaluate(() => {
    const active = document.querySelector('#native-nav a[aria-current="location"]');
    const indicator = document.querySelector('#native-nav .orbit-anchor-ink');
    return {
      left: parseFloat(indicator.style.left),
      expected: active.offsetLeft,
      width: parseFloat(indicator.style.width),
      expectedWidth: active.clientWidth,
    };
  });
  assert.equal(ink.left, ink.expected);
  assert.equal(ink.width, ink.expectedWidth);
  await patch('rtl');
  assert.equal(await page.locator('#native-nav').getAttribute('dir'), 'rtl');
  assert.equal(
    await page
      .locator('#native-nav a')
      .first()
      .evaluate((node) => getComputedStyle(node).direction),
    'rtl',
  );
  await patch('vertical');
  await patch('composition');
  await page.locator('#native-nav .composed a').click();
  await page.locator('#native-nav .composed a').click();
  assert.equal(await page.evaluate(() => window.nativeState.events().linkClicks), 1);
  assert.equal(await page.locator('#native-nav .composed').getAttribute('data-owner'), 'link-root');
  assert.equal(await page.locator('#native-nav .composed').getAttribute('tabindex'), null);
  assert.equal(
    await page.locator('#native-nav .composed a').getAttribute('aria-label'),
    'Composed A',
  );
  await patch('hide-child');
  await page.waitForFunction(
    () =>
      document.querySelector('#native-nav .composed a')?.getAttribute('aria-current') ===
      'location',
  );
  await page.evaluate(() => document.querySelector('#scroll-a').dispatchEvent(new Event('scroll')));
  await page.waitForFunction(
    () =>
      document.querySelector('#native-nav .composed a')?.getAttribute('aria-current') ===
      'location',
  );
  await patch('empty');
  assert.equal(await page.locator('#native-nav a').count(), 0);
  await patch('data');
  await page.locator('#native-nav a').nth(2).click();
  await page.locator('#scroll-a').evaluate((node) => {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
    window.afterUnmountWrites = 0;
    Object.defineProperty(node, 'scrollTop', {
      configurable: true,
      get() {
        return descriptor.get.call(this);
      },
      set(value) {
        if (window.nativeUnmounted) window.afterUnmountWrites++;
        descriptor.set.call(this, value);
      },
    });
  });
  await page.evaluate(() => {
    window.nativeState.unmount();
    window.nativeUnmounted = true;
  });
  await page.waitForTimeout(500);
  const resources = await page.evaluate(() => ({
    observers: window.nativeObservers.reduce((sum, observer) => sum + observer.targets.size, 0),
    frames: window.nativeFrames.size,
    listeners: window.nativeListeners.filter(
      (item) =>
        !window.nativeBaseline.some(
          (base) =>
            base.target === item.target &&
            base.type === item.type &&
            base.callback === item.callback &&
            base.capture === item.capture,
        ),
    ).length,
    errors: window.nativeErrors,
  }));
  assert.deepEqual(resources, { observers: 0, frames: 0, listeners: 0, errors: [] });
  assert.equal(await page.evaluate(() => window.afterUnmountWrites), 0);
  behaviorPassed = true;
} catch (error) {
  failure = error;
  if (page && !page.isClosed())
    console.error(
      'Native state at failure:',
      await page
        .evaluate(() => ({
          frames: window.nativeFrames.size,
          events: window.nativeState.events(),
          top: document.querySelector('#scroll-a')?.scrollTop,
          active: document.querySelector('#native-nav a[aria-current="location"]')?.hash,
        }))
        .catch((snapshotError) => String(snapshotError)),
    );
} finally {
  await page?.close();
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
  const result = {
    behaviorPassed,
    exitCode: failure || diagnostics.length ? 1 : 0,
    durationMs: Math.round(performance.now() - started),
    diagnostics,
  };
  await writeFile(
    '/tmp/apollo-affix-anchor-browser-result.json',
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(JSON.stringify(result, null, 2));
  if (failure) console.error(failure);
  process.exitCode = result.exitCode;
}
