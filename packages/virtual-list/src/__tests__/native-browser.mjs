import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-virtual-list-native-'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Native VirtualList</title><link rel="icon" href="data:,"><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body><div id="app"></div><script type="module">
import {createApp} from 'vue';import Fixture from '/@fs${repo}/packages/virtual-list/src/__tests__/fixtures/NativeVirtualList.vue';
const Native=window.ResizeObserver;window.__listObservers=new Set();window.ResizeObserver=class extends Native{constructor(callback){super(callback);this.targets=new Set();window.__listObservers.add(this)}observe(target,options){super.observe(target,options);this.targets.add(target)}unobserve(target){super.unobserve(target);this.targets.delete(target)}disconnect(){super.disconnect();this.targets.clear()}};createApp(Fixture).mount('#app');
</script></body></html>`,
);
let server;
let browser;
try {
  const packages = await readdir(path.join(repo, 'packages'));
  server = await createServer({
    root: fixture,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: {
        vue: path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js'),
        ...Object.fromEntries(
          packages.map((name) => [
            `@apollo-design/${name}`,
            path.join(repo, `packages/${name}/src`),
          ]),
        ),
      },
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, fixture] } },
  });
  await server.listen();
  const launched = await launchBrowser();
  browser = launched.browser;
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
    reducedMotion: 'reduce',
  });
  const diagnostics = [];
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((resolve) => {
          let count = 0;
          const tick = () => (++count < 8 ? requestAnimationFrame(tick) : resolve());
          requestAnimationFrame(tick);
        }),
    );
  const action = async (name) => {
    await page.locator(`[data-action="${name}"]`).evaluate((button) => button.click());
    await settle();
  };
  await settle();
  const snapshot = () =>
    page.locator('[data-case="main"]').evaluate((root) => {
      const holder = document.getElementById('native-list');
      const inner = root.querySelector('.apollo-virtual-list-holder-inner');
      return {
        idOnHolder: holder?.classList.contains('apollo-virtual-list-holder'),
        rootId: root.id,
        roleOnRoot: root.getAttribute('role'),
        ariaCount: root.querySelectorAll('[aria-label="Native rows"]').length,
        top: holder.scrollTop,
        left: holder.scrollLeft,
        page: scrollY,
        state: document.querySelector('[data-state]').textContent,
        count: root.querySelectorAll('[data-row]').length,
        innerStyle: {
          display: inner.style.display,
          transform: inner.style.transform,
          color: inner.style.color,
          width: inner.style.width,
        },
        firstBottom: Number(root.querySelector('[data-extra]').dataset.firstBottom),
        holderTag: holder.tagName,
      };
    });
  const initial = await snapshot();
  assert.equal(initial.idOnHolder, true);
  assert.equal(initial.rootId, '');
  assert.equal(initial.roleOnRoot, null);
  assert.equal(initial.ariaCount, 1);
  assert.equal(initial.innerStyle.display, 'flex');
  assert.equal(initial.innerStyle.color, 'rgb(1, 2, 3)');
  assert.equal(initial.innerStyle.width, '600px');
  assert.ok(initial.count < 20);
  await page.addStyleTag({
    content: '[data-row="row-0"]{height:48px!important}[data-row="row-1"]{height:16px!important}',
  });
  await settle();
  const resized = await snapshot();
  assert.equal(
    resized.firstBottom,
    48,
    'Individual resize updates measured rows even with unchanged aggregate inner height',
  );
  await page.locator('#native-list').focus();
  await page.keyboard.press('PageDown');
  await settle();
  const keyboard = await snapshot();
  assert.ok(keyboard.top > 0);
  assert.equal(keyboard.page, 0);
  await page.locator('#native-list').evaluate((holder) => {
    holder.scrollTop = 0;
    holder.dispatchEvent(new Event('scroll'));
  });
  await settle();
  const first = page.locator('[data-row="row-0"]');
  await first.evaluate((input) => {
    input.dataset.original = 'yes';
    input.value = 'draft';
    input.focus({ preventScroll: true });
  });
  await action('reorder');
  const identity = await page.locator('[data-row="row-0"]').evaluate((input) => ({
    original: input.dataset.original,
    value: input.value,
    focused: document.activeElement === input,
  }));
  assert.deepEqual(identity, { original: 'yes', value: 'draft', focused: true });
  await action('scroll');
  const scrolled = await snapshot();
  assert.ok(scrolled.top > 1000);
  await action('virtual');
  const raw = await snapshot();
  assert.equal(raw.count, 120);
  assert.equal(raw.top, scrolled.top, 'Virtual to raw keeps the accepted native position');
  assert.equal(raw.innerStyle.width, '600px');
  await action('virtual');
  const virtual = await snapshot();
  assert.ok(virtual.count < 20);
  assert.equal(virtual.top, scrolled.top);
  await action('left');
  const ltr = await snapshot();
  assert.equal(ltr.left, 80);
  await page.locator('main').evaluate((root) => {
    root.style.width = '560px';
  });
  await page.locator('#native-list').evaluate((holder) => {
    holder.style.borderInline = '10px solid transparent';
  });
  await settle();
  await action('left');
  const clientViewport = await page.locator('#native-list').evaluate((holder) => ({
    actual: holder.scrollLeft,
    clientWidth: holder.clientWidth,
    offsetWidth: holder.offsetWidth,
    scrollWidth: holder.scrollWidth,
  }));
  assert.equal(
    clientViewport.actual,
    Math.min(80, clientViewport.scrollWidth - clientViewport.clientWidth),
    'Horizontal clamping uses the real client viewport, excluding borders and scrollbar gutters',
  );
  await page.locator('#native-list').evaluate((holder) => {
    holder.style.borderInline = '';
  });
  await page.locator('main').evaluate((root) => {
    root.style.width = '320px';
  });
  await settle();
  await action('left');
  await action('rtl');
  const rtl = await snapshot();
  assert.equal(
    rtl.left,
    -80,
    'RTL writes the logical inline-start distance to the real native axis',
  );
  assert.match(rtl.state, /:-80:/);
  await page.locator('#native-list').evaluate((holder) => {
    holder.scrollLeft = -120;
  });
  await settle();
  const rtlNative = await snapshot();
  assert.equal(rtlNative.left, -120);
  assert.match(rtlNative.state, /:-120:/, 'getScrollInfo agrees with native RTL scrollLeft');
  await page.locator('main').evaluate((root) => {
    root.style.width = '700px';
  });
  await settle();
  const viewport = await snapshot();
  assert.equal(
    viewport.left,
    0,
    'Growing the actual holder clamps the accepted horizontal position',
  );
  assert.match(viewport.state, /:0:/);
  await page.locator('main').evaluate((root) => {
    root.style.width = '320px';
  });
  await settle();
  await action('narrow');
  const narrow = await snapshot();
  assert.equal(narrow.left, 0);
  assert.match(narrow.state, /:0:/);
  await action('narrow');
  await action('key');
  await action('scroll');
  const newKey = await snapshot();
  assert.ok(newKey.top > 1000);
  assert.ok(await page.locator('[data-row="row-50"]').count());
  await action('holder');
  const holder = await snapshot();
  assert.equal(holder.holderTag, 'SECTION');
  assert.equal(holder.top, newKey.top);
  await action('shrink');
  const shrunk = await snapshot();
  assert.equal(shrunk.count, 3);
  assert.equal(shrunk.top, 0);
  assert.match(shrunk.state, /:0$/);
  const events = await page.locator('[data-events]').textContent();
  await action('unmount');
  const observed = await page.evaluate(() =>
    [...window.__listObservers].reduce((count, observer) => count + observer.targets.size, 0),
  );
  assert.equal(observed, 0, 'Unmount releases every actual native ResizeObserver target');
  assert.deepEqual(diagnostics, []);
  console.log(
    JSON.stringify({
      ok: true,
      browser: launched.channel,
      initial,
      resized,
      keyboard,
      identity,
      scrolled,
      raw,
      virtual,
      ltr,
      rtl,
      rtlNative,
      clientViewport,
      narrow,
      newKey,
      holder,
      shrunk,
      events,
      observed,
      diagnostics,
      elapsedMs: Math.round(performance.now() - started),
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
