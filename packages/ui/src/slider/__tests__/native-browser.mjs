import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-slider-native-'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Native Slider</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module">
import {createApp} from 'vue';import Fixture from '/@fs${repo}/packages/ui/src/slider/__tests__/fixtures/NativeSlider.vue';
import {genSliderStyle} from '/@fs${repo}/packages/ui/src/slider/style/index.ts';import {genTooltipStyle} from '/@fs${repo}/packages/ui/src/tooltip/style/index.ts';import {getDesignToken,transformToken} from '@apollo-design/theme';
for(const [name,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);
const style=document.createElement('style');style.textContent=genSliderStyle('apollo')+genTooltipStyle()+'*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(style);createApp(Fixture).mount('#app');
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, hasTouch: true });
  page.setDefaultTimeout(8000);
  const diagnostics = [];
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  const settle = () => page.evaluate(() => new Promise(requestAnimationFrame));
  const state = (name) => page.locator(`[data-state="${name}"]`).textContent();
  const root = (name) => page.locator(`[data-case="${name}"]`);
  const handle = (name, index = 0) => root(name).locator('[role="slider"]').nth(index);
  const values = (name) =>
    root(name)
      .locator('[role="slider"]')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('aria-valuenow'))));
  const point = async (name, value) => {
    const box = await root(name).boundingBox();
    assert.ok(box);
    return { x: box.x + (box.width * value) / 100, y: box.y + box.height / 2 };
  };
  const beginMouse = async (name, index = 0) => {
    const box = await handle(name, index).boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
  };
  const moveMouse = async (name, value) => {
    const target = await point(name, value);
    await page.mouse.move(target.x, target.y, { steps: 4 });
    await settle();
  };
  const cdp = await page.context().newCDPSession(page);
  const touch = async (type, target) => {
    await cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: target ? [{ ...target, id: 7 }] : [],
    });
    await settle();
  };
  assert.equal(await state('ref'), 'ready');
  await beginMouse('single');
  await moveMouse('single', 50);
  assert.deepEqual(await values('single'), [30]);
  await page.mouse.up();
  await settle();
  assert.equal(await state('single'), '30');
  assert.equal(await state('complete'), '50');
  assert.equal(await state('before'), '35');
  await touch('touchStart', await point('single', 30));
  await touch('touchMove', await point('single', 70));
  await touch('touchCancel');
  assert.equal(
    await root('single').evaluate((node) => node.classList.contains('apollo-slider-lock')),
    false,
  );
  assert.equal(await state('complete'), '50');
  assert.equal(await state('single'), '30');
  await page.locator('[data-action="accept"]').click();
  await beginMouse('single');
  await moveMouse('single', 50);
  await page.mouse.up();
  await settle();
  assert.equal(await state('single'), '50');
  assert.deepEqual(await values('single'), [50]);
  await beginMouse('single');
  await page.locator('[data-action="disable"]').evaluate((action) => action.click());
  await settle();
  const completionBeforeDisabled = await state('complete');
  await moveMouse('single', 80);
  await page.mouse.up();
  await settle();
  assert.equal(
    await root('single').evaluate((node) => node.classList.contains('apollo-slider-lock')),
    false,
  );
  assert.deepEqual(await values('single'), [50]);
  assert.equal(await state('complete'), completionBeforeDisabled);
  await page.locator('[data-action="disable"]').click();
  const singleNode = await handle('single').elementHandle();
  assert.ok(singleNode);
  await page.locator('[data-action="mode"]').click();
  await settle();
  assert.equal(
    await singleNode.evaluate(
      (node) => node === document.querySelector('[data-case="single"] [role="slider"]'),
    ),
    true,
  );
  await page.locator('[data-action="mode"]').click();
  await handle('range', 1).focus();
  await page.locator('[role="tooltip"]:visible').filter({ hasText: 'range:60' }).waitFor();
  const rangeNode = await handle('range', 1).elementHandle();
  assert.ok(rangeNode);
  await page.keyboard.press('ArrowRight');
  await settle();
  assert.deepEqual(await values('range'), [20, 61]);
  assert.equal(await state('complete'), '[20,61]');
  assert.equal(await rangeNode.evaluate((node) => node === document.activeElement), true);
  await touch('touchStart', await point('range', 61));
  await touch('touchMove', await point('range', 80));
  await touch('touchEnd');
  assert.deepEqual(await values('range'), [20, 80]);
  assert.equal(await state('complete'), '[20,80]');
  const trackStart = await point('track', 25);
  await page.mouse.move(trackStart.x, trackStart.y);
  await page.mouse.down();
  await moveMouse('track', 35);
  await page.mouse.up();
  await settle();
  assert.deepEqual(await values('track'), [20, 50]);
  assert.equal(await state('complete'), '[20,50]');
  const add = await point('editable', 80);
  await page.mouse.click(add.x, add.y);
  await settle();
  assert.deepEqual(await values('editable'), [20, 60, 80]);
  await page.keyboard.press('Delete');
  await settle();
  assert.deepEqual(await values('editable'), [20, 60]);
  assert.equal(await state('complete'), '[20,60]');
  await page.locator('[data-action="focus"]').click();
  assert.equal(await handle('custom').evaluate((node) => node === document.activeElement), true);
  await page.keyboard.press('ArrowRight');
  await settle();
  assert.deepEqual(await values('custom'), [31]);
  await page.locator('[data-action="cancel"]').click();
  await page.locator('[data-action="focus"]').click();
  const completionBeforeCancel = await state('complete');
  await page.keyboard.press('End');
  await settle();
  assert.deepEqual(await values('custom'), [31]);
  assert.equal(await state('complete'), completionBeforeCancel);
  await page.locator('[data-action="blur"]').click();
  assert.equal(await handle('custom').evaluate((node) => node === document.activeElement), false);
  await page.locator('[data-action="theme"]').click();
  await settle();
  assert.equal(await handle('single').evaluate((node) => getComputedStyle(node).width), '18px');
  assert.equal(
    await root('single')
      .locator('.apollo-slider-track')
      .evaluate((node) => getComputedStyle(node).backgroundColor),
    'rgb(18, 52, 86)',
  );
  await page.locator('[data-action="theme"]').click();
  await settle();
  assert.equal(await handle('single').evaluate((node) => getComputedStyle(node).width), '10px');
  await touch('touchStart', await point('single', 50));
  await touch('touchMove', await point('single', 55));
  const completionBeforeUnmount = await state('complete');
  await page.locator('[data-action="unmount"]').evaluate((action) => action.click());
  await settle();
  await touch('touchMove', await pointFromPage(300, 300));
  await touch('touchEnd');
  assert.equal(await page.locator('[role="slider"]').count(), 0);
  assert.equal(await state('ref'), 'none');
  assert.equal(await state('complete'), completionBeforeUnmount);
  assert.deepEqual(diagnostics, []);
  console.log(
    JSON.stringify({
      ok: true,
      browser: launched.channel,
      diagnostics: 0,
      elapsedMs: Math.round(performance.now() - started),
      scope:
        'source Slider actual mouse/Chrome touch/cancel/unmount, controlled rejection/acceptance, track and editable ranges, keyboard/preventDefault/custom refs, range tooltip identity, mode changes and current theme/static CSS',
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
function pointFromPage(x, y) {
  return { x, y };
}
