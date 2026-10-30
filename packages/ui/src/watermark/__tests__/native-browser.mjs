/** Real canvas/image rendering and lifecycle integration; no built artifacts or screenshot oracle. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-watermark-native-'));
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
const started = performance.now();
let server, browser, page, failure;
let behaviorPassed = false;
let remainingObservers = [];
let harnessObservers = [];
const svg = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30"><rect width="80" height="30" fill="${color}"/></svg>`;

try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Watermark native contracts</title><link rel="icon" href="data:,"></head><body><main id="app"></main><aside id="watermark-portal"></aside><script type="module">
import{createApp,h,shallowRef}from'vue';
import Fixture from'/@fs${repo}/packages/ui/src/watermark/__tests__/fixtures/NativeWatermark.vue';
import{setCanvasFont}from'/@fs${repo}/packages/ui/src/watermark/utils.ts';
import{getDesignToken,transformToken}from'@apollo-design/theme';
import{genModalStyle}from'/@fs${repo}/packages/ui/src/modal/style/index.ts';
import{genButtonStyle}from'/@fs${repo}/packages/ui/src/button/style/index.ts';
for(const[k,v]of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(k,v);
const css=document.createElement('style');css.textContent=genModalStyle('apollo')+genButtonStyle('apollo');document.head.append(css);
const fixture=shallowRef(null);const app=createApp({render:()=>h(Fixture,{ref:fixture})});window.mountWatermarkFixture=()=>app.mount('#app');
window.watermarkState={patch:k=>fixture.value.patch(k),events:()=>({...fixture.value.events}),nativeElement:()=>fixture.value.nativeElement(),unmount:()=>app.unmount(),font:(size,ratio=1)=>{const ctx=document.createElement('canvas').getContext('2d');const px=setCanvasFont(ctx,{fontSize:size,fontStyle:'normal',fontWeight:'normal',fontFamily:'sans-serif'},ratio);return{px,font:ctx.font};}};
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
    window.watermarkErrors = [];
    window.watermarkObservers = [];
    window.watermarkImages = [];
    window.watermarkFrames = new Set();
    window.watermarkDraws = 0;
    window.watermarkText = [];
    window.addEventListener('error', (event) => window.watermarkErrors.push(event.message));
    const Mutation = window.MutationObserver;
    window.MutationObserver = class extends Mutation {
      targets = new Set();
      constructor(callback) {
        super(callback);
        this.createdAt = new Error().stack;
        window.watermarkObservers.push(this);
      }
      observe(target, options) {
        this.targets.add(target);
        super.observe(target, options);
      }
      disconnect() {
        this.targets.clear();
        super.disconnect();
      }
    };
    const create = document.createElement.bind(document);
    document.createElement = (tag, options) => {
      const element = create(tag, options);
      if (tag === 'img') window.watermarkImages.push(element);
      return element;
    };
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (...args) {
      window.watermarkText.push(args[0]);
      return fillText.apply(this, args);
    };
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      window.watermarkDraws++;
      return toDataURL.apply(this, args);
    };
    const frame = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      const id = frame((time) => {
        window.watermarkFrames.delete(id);
        callback(time);
      });
      window.watermarkFrames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      window.watermarkFrames.delete(id);
      cancel(id);
    };
  });
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) diagnostics.push(message.text());
  });
  await page.route('**/wm-a.svg', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: svg('red') }),
  );
  await page.route('**/wm-b.svg', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: svg('blue') }),
  );
  await page.route('**/wm-error.svg', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: 'invalid image' }),
  );
  let slowA, slowText, slowUnmount;
  const requestedA = new Promise((resolve) =>
    page.route('**/wm-slow-a.svg', (route) => {
      slowA = route;
      resolve();
    }),
  );
  const requestedText = new Promise((resolve) =>
    page.route('**/wm-slow-text.svg', (route) => {
      slowText = route;
      resolve();
    }),
  );
  const requestedUnmount = new Promise((resolve) =>
    page.route('**/wm-slow-unmount.svg', (route) => {
      slowUnmount = route;
      resolve();
    }),
  );

  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => typeof window.mountWatermarkFixture === 'function');
  // Playwright creates its document observer before the application mounts. Snapshot that actual
  // harness baseline rather than attributing it to the component or ignoring an element leak.
  harnessObservers = await page.evaluate(() => {
    window.watermarkHarnessObservers = new Set(window.watermarkObservers);
    return window.watermarkObservers.map((observer) => ({
      createdAt: observer.createdAt,
      targets: Array.from(observer.targets, (target) => target.nodeName),
    }));
  });
  await page.evaluate(() => {
    window.mountWatermarkFixture();
  });
  const ticks = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  const patch = (kind) => page.evaluate((value) => window.watermarkState.patch(value), kind);
  const read = (selector = '#watermark-main') =>
    page.locator(selector).evaluate((root) => {
      const marks = Array.from(root.children).filter((element) => element.style.backgroundImage);
      const mark = marks[0];
      return {
        count: marks.length,
        image: mark?.style.backgroundImage ?? '',
        size: mark?.style.backgroundSize ?? '',
        z: mark?.style.zIndex ?? '',
      };
    });
  const changed = (image, selector = '#watermark-main') =>
    page.waitForFunction(
      ({ image, selector }) => {
        const root = document.querySelector(selector);
        const mark =
          root && Array.from(root.children).find((element) => element.style.backgroundImage);
        return mark && mark.style.backgroundImage !== image;
      },
      { image, selector },
    );
  const pixels = () =>
    page.locator('#watermark-main').evaluate(async (root) => {
      const mark = Array.from(root.children).find((element) => element.style.backgroundImage);
      const image = new Image();
      image.src = /^url\(["']?(.*?)["']?\)$/.exec(mark.style.backgroundImage)[1];
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0,
        blue = 0,
        alpha = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3]) {
          alpha++;
          if (data[i] > 200 && data[i + 2] < 50) red++;
          if (data[i + 2] > 200 && data[i] < 50) blue++;
        }
      }
      return { red, blue, alpha };
    });

  await changed('');
  const initial = await read();
  assert.equal(initial.z, '2399');
  assert.equal(initial.count, 1);
  assert.ok((await pixels()).red > 0);
  const independent = await read('#watermark-independent');
  assert.equal(
    await page.evaluate(
      () => window.watermarkState.nativeElement() === document.querySelector('#watermark-main'),
    ),
    true,
  );
  const draft = page.getByRole('textbox', { name: 'Document draft' });
  await draft.fill('Retained draft');
  await draft.focus();
  await draft.evaluate((input) => {
    window.watermarkDraft = input;
    input.setSelectionRange(2, 6);
  });
  await patch('font');
  await changed(initial.image);
  assert.ok((await pixels()).blue > 0);
  assert.equal(
    await draft.evaluate(
      (input) =>
        input === window.watermarkDraft &&
        input === document.activeElement &&
        input.value === 'Retained draft' &&
        input.selectionStart === 2 &&
        input.selectionEnd === 6,
    ),
    true,
  );
  const beforeImageA = (await read()).image;
  await patch('image-a');
  await changed(beforeImageA);
  const imageA = await read();
  assert.ok((await pixels()).red > 0);
  await patch('image-b');
  await changed(imageA.image);
  const imageB = await read();
  const blue = await pixels();
  assert.ok(blue.blue > 0);
  assert.equal(blue.red, 0);
  assert.equal(imageA.size, imageB.size);
  assert.notEqual(imageA.image, imageB.image);
  await patch('slow-a');
  await requestedA;
  await patch('image-b');
  await ticks();
  await slowA.fulfill({ contentType: 'image/svg+xml', body: svg('red') });
  await ticks();
  assert.equal((await read()).image, imageB.image);
  await patch('slow-text');
  await requestedText;
  await patch('text');
  await changed(imageB.image);
  const text = (await read()).image;
  await slowText.fulfill({ contentType: 'image/svg+xml', body: svg('red') });
  await ticks();
  assert.equal((await read()).image, text);
  await patch('image-error');
  await page.waitForFunction(() =>
    window.watermarkImages.some(
      (image) =>
        image.src.endsWith('/wm-error.svg') &&
        image.complete &&
        image.naturalWidth === 0 &&
        image.onerror === null,
    ),
  );
  assert.equal((await read()).image, text);
  assert.ok((await pixels()).alpha > 0);
  await patch('text');
  await ticks();
  await page.evaluate(() => {
    window.watermarkText.length = 0;
  });
  await page.evaluate(async () => {
    window.watermarkState.patch('burst-a');
    await Promise.resolve();
    window.watermarkState.patch('burst-b');
  });
  await ticks();
  assert.equal(await page.locator('#watermark-content').textContent(), 'Last frame');
  assert.deepEqual(await page.evaluate(() => window.watermarkText), ['Last frame']);
  assert.deepEqual(await read('#watermark-independent'), independent);

  for (const [size, expected] of [
    [16, 16],
    ['16', 16],
    ['16px', 16],
    ['2rem', 32],
    ['2em', 20],
    ['120%', 12],
    ['12pt', 16],
    ['calc(16px + 2px)', 18],
    ['1vw', 14.4],
  ]) {
    const font = await page.evaluate((size) => window.watermarkState.font(size), size);
    assert.equal(font.px, expected);
    assert.ok(font.font.includes(`${expected}px`));
  }
  assert.equal((await page.evaluate(() => window.watermarkState.font('16px', 2))).px, 32);
  assert.match(
    await page.evaluate(() => {
      try {
        window.watermarkState.font('invalid-size');
        return 'no error';
      } catch (error) {
        return `${error.name}: ${error.message}`;
      }
    }),
    /^TypeError: Invalid Watermark canvas font:/,
  );
  const beforeAuto = (await read()).image;
  await patch('auto-font');
  await changed(beforeAuto);
  assert.ok((await pixels()).blue > 0);
  await patch('theme');
  await page.waitForFunction(
    () =>
      document.querySelector('#watermark-main > [style*="background-image"]').style.zIndex ===
      '3599',
  );
  await patch('zero');
  await page.waitForFunction(
    () =>
      document.querySelector('#watermark-main > [style*="background-image"]').style.zIndex === '0',
  );

  await patch('attrs');
  await ticks();
  const rootStyle = await page.locator('#watermark-main').evaluate((root) => ({
    position: root.style.position,
    priority: root.style.getPropertyPriority('position'),
    overflow: root.style.overflow,
    custom: root.style.getPropertyValue('--watermark-test'),
    label: root.getAttribute('aria-label'),
  }));
  assert.deepEqual(rootStyle, {
    position: 'fixed',
    priority: 'important',
    overflow: 'auto',
    custom: 'second',
    label: 'Protected document',
  });
  await page.locator('#watermark-main').dispatchEvent('click');
  assert.equal((await page.evaluate(() => window.watermarkState.events())).click, 1);
  await page.locator('#watermark-main').evaluate((root) => (root.style.position = 'static'));
  await ticks();
  assert.equal(
    await page.locator('#watermark-main').evaluate((root) => root.style.position),
    'fixed',
  );
  await page
    .locator('#watermark-main > [style*="background-image"]')
    .evaluate((mark) => mark.remove());
  await ticks();
  assert.deepEqual(await page.evaluate(() => window.watermarkState.events()), {
    first: 1,
    second: 0,
    once: 1,
    click: 1,
  });
  await patch('listener');
  await ticks();
  await page
    .locator('#watermark-main > [style*="background-image"]')
    .evaluate((mark) => mark.remove());
  await ticks();
  assert.deepEqual(await page.evaluate(() => window.watermarkState.events()), {
    first: 1,
    second: 1,
    once: 1,
    click: 1,
  });
  const settled = await page.evaluate(() => window.watermarkDraws);
  await ticks();
  assert.equal(await page.evaluate(() => window.watermarkDraws), settled);

  await changed('', '#watermark-panel');
  assert.equal((await read('#watermark-panel')).size, '100px');
  const panelDraft = page.getByRole('textbox', { name: 'Panel draft' });
  await panelDraft.fill('Panel remains');
  await panelDraft.evaluate((input) => (window.watermarkPanelDraft = input));
  await patch('inherit');
  await ticks();
  assert.equal((await read('#watermark-panel')).size, '60px');
  await patch('inherit');
  await ticks();
  assert.equal((await read('#watermark-panel')).size, '100px');
  assert.equal(
    await panelDraft.evaluate(
      (input) => input === window.watermarkPanelDraft && input.value === 'Panel remains',
    ),
    true,
  );
  await page.locator('#watermark-panel').evaluate((panel) => (window.oldWatermarkPanel = panel));
  await patch('panel-root');
  await changed('', '#watermark-panel');
  assert.equal(
    await page.evaluate(
      () => window.oldWatermarkPanel.querySelector('[style*="background-image"]') === null,
    ),
    true,
  );
  await patch('panel-hide');
  await ticks();
  assert.equal(await page.locator('#watermark-panel').count(), 0);
  await patch('panel-show');
  await changed('', '#watermark-panel');
  assert.equal((await read('#watermark-panel')).count, 1);
  await patch('modal-open');
  await page.locator('#watermark-modal-content').waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => !!document.querySelector('.apollo-modal-container > [style*="background-image"]'),
  );
  assert.equal((await read('.apollo-modal-container')).size, '60px');
  await patch('modal-close');
  await page.locator('#watermark-modal-content').waitFor({ state: 'hidden' });
  await patch('provider-clear');
  await ticks();
  assert.equal(
    await page
      .locator('#watermark-main')
      .evaluate((root) => root.classList.contains('provider-first')),
    false,
  );
  assert.equal((await read()).z, '999');

  await patch('slow-unmount');
  await requestedUnmount;
  await page.locator('#watermark-main').evaluate((root) => (window.oldWatermarkMain = root));
  const events = await page.evaluate(() => window.watermarkState.events());
  await patch('hide');
  await ticks();
  assert.equal(
    await page.evaluate(() =>
      window.watermarkImages.every((image) => image.onload === null && image.onerror === null),
    ),
    true,
  );
  const draws = await page.evaluate(() => window.watermarkDraws);
  await slowUnmount.fulfill({ contentType: 'image/svg+xml', body: svg('red') });
  await ticks();
  assert.equal(await page.evaluate(() => window.watermarkDraws), draws);
  assert.equal(
    await page.evaluate(
      () => window.oldWatermarkMain.querySelector('[style*="background-image"]') === null,
    ),
    true,
  );
  assert.deepEqual(await page.evaluate(() => window.watermarkState.events()), events);
  await patch('show');
  await changed('');
  await page.evaluate(() => window.watermarkState.unmount());
  await ticks();
  remainingObservers = await page.evaluate(() =>
    window.watermarkObservers
      .filter(
        (observer) => !window.watermarkHarnessObservers.has(observer) && observer.targets.size,
      )
      .map((observer) => ({
        createdAt: observer.createdAt,
        targets: Array.from(observer.targets, (target) => ({
          name: target.nodeName,
          id: target.id,
          className: target.className,
          connected: target.isConnected,
        })),
      })),
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      observers: window.watermarkObservers
        .filter((observer) => !window.watermarkHarnessObservers.has(observer))
        .reduce((sum, observer) => sum + observer.targets.size, 0),
      frames: window.watermarkFrames.size,
      marks: document.querySelectorAll('[style*="background-image"]').length,
    })),
    { observers: 0, frames: 0, marks: 0 },
  );
  diagnostics.push(...(await page.evaluate(() => window.watermarkErrors)));
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
  harnessObservers,
  ...(remainingObservers.length ? { remainingObservers } : {}),
  ...(failure ? { failure: failure.stack ?? String(failure) } : {}),
};
await writeFile(
  '/tmp/apollo-native-watermark-browser-result.json',
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.exitCode;
