/** Source-only check: node packages/ui/src/popover/__tests__/native-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-popover-native-'));
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
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Popover native contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{transition:none!important;animation:none!important}body{margin:0;font-family:sans-serif}#popover-target{position:absolute;left:400px;top:300px;width:120px;height:40px}#panels{position:absolute;top:500px;left:100px}#demo{position:absolute;top:650px;left:100px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/popover/__tests__/fixtures/NativePopover.vue';
import Demo from '/@fs${repo}/packages/ui/src/popover/demo/component-token.vue';
import {genPopoverStyle} from '/@fs${repo}/packages/ui/src/popover/style/index.ts';
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(key,value);
const css=document.createElement('style');css.textContent=genPopoverStyle();document.head.append(css);
const component=ref(null);
createApp(defineComponent({setup:()=>()=>[h(Fixture,{ref:component}),h('section',{id:'demo'},[h(Demo)])]})).mount('#app');
window.popoverState={patch:(kind)=>component.value.patch(kind),refValid:()=>component.value.refValid(),events:()=>component.value.events()};
</script></body></html>`,
);

let server;
let browser;
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.popoverState);
  await page.locator('#popover-target').click();
  await page.locator('.main-popover').waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => document.querySelector('.main-popover').getBoundingClientRect().left > 0,
  );
  const frames = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  const read = () =>
    page.locator('.main-popover').evaluate((root) => {
      const container = root.querySelector('.apollo-popover-container');
      const title = root.querySelector('.apollo-popover-title');
      const arrow = root.querySelector('.apollo-popover-arrow');
      const target = document.getElementById('popover-target');
      const panel = document.querySelector('.current-panel');
      return {
        titleWidth: getComputedStyle(title).minWidth,
        titleMargin: getComputedStyle(title).marginBottom,
        padding: getComputedStyle(container).padding,
        radius: getComputedStyle(container).borderRadius,
        background: getComputedStyle(container).backgroundColor,
        zIndex: getComputedStyle(root).zIndex,
        nestedZIndex: getComputedStyle(document.querySelector('.nested-popover')).zIndex,
        arrowWidth: getComputedStyle(arrow).width,
        arrowPath: getComputedStyle(arrow, '::before').clipPath,
        panelPadding: getComputedStyle(panel.querySelector('.apollo-popover-container')).padding,
        panelRadius: getComputedStyle(panel.querySelector('.apollo-popover-container'))
          .borderRadius,
        nestedPadding: getComputedStyle(
          document.querySelector('.nested-panel .apollo-popover-container'),
        ).padding,
        rootPadding: getComputedStyle(root).padding,
        gap: target.getBoundingClientRect().top - root.getBoundingClientRect().bottom,
        nativeClass: root.classList.contains('native-popover') && root.classList.contains('active'),
        ownClass:
          root.classList.contains('own-config') && !root.classList.contains('foreign-config'),
        triggerClass: target.className,
        triggerPadding: target.style.padding,
        triggerData: target.dataset.trigger,
        refValid: window.popoverState.refValid(),
      };
    });
  await frames();
  const initial = await read();
  assert.equal(initial.titleWidth, '220px');
  assert.equal(initial.titleMargin, '11px');
  assert.equal(initial.padding, '18px');
  assert.equal(initial.panelPadding, '18px');
  assert.equal(initial.nestedPadding, '6px');
  assert.equal(initial.radius, '18px');
  assert.equal(initial.panelRadius, '18px');
  assert.equal(initial.background, 'rgb(18, 52, 86)');
  assert.equal(initial.zIndex, '2030');
  assert.equal(initial.nestedZIndex, '2230');
  assert.equal(initial.arrowWidth, '24px');
  assert.match(initial.arrowPath, /^path\(/);
  assert.equal(initial.gap, 22);
  assert.equal(initial.nativeClass, true);
  assert.equal(initial.ownClass, true);
  assert.equal(initial.refValid, true);
  assert.equal(initial.triggerClass.includes('native-popover'), false);
  assert.equal(initial.triggerPadding, '');
  assert.equal(initial.triggerData, 'kept');
  await page.locator('#popover-editor').fill('business draft');
  await page.locator('#popover-editor').focus();
  await page.locator('#popover-editor').evaluate((input) => {
    window.originalEditor = input;
    window.originalPopup = input.closest('.main-popover');
  });
  await page.evaluate(() => window.popoverState.patch('next'));
  await frames();
  const next = await read();
  assert.equal(next.titleWidth, '300px');
  assert.equal(next.titleMargin, '4px');
  assert.equal(next.padding, '20px');
  assert.equal(next.panelPadding, '20px');
  assert.equal(next.radius, '6px');
  assert.equal(next.background, 'rgb(101, 67, 33)');
  assert.equal(next.zIndex, '3030');
  assert.equal(next.nestedZIndex, '3230');
  assert.equal(next.arrowWidth, '16px');
  assert.notEqual(next.arrowPath, initial.arrowPath);
  assert.equal(next.gap, 12);
  assert.equal(
    await page.evaluate(
      () =>
        document.getElementById('popover-editor') === window.originalEditor &&
        document.querySelector('.main-popover') === window.originalPopup &&
        document.activeElement === window.originalEditor &&
        window.originalEditor.value === 'business draft',
    ),
    true,
  );
  await page.evaluate(() => window.popoverState.patch('semantic'));
  assert.equal((await read()).padding, '24px');
  await page.evaluate(() => window.popoverState.patch('native'));
  const native = await read();
  assert.equal(native.padding, '28px');
  assert.equal(native.rootPadding, '20px');
  assert.equal(native.triggerPadding, '');
  await page.evaluate(() => window.popoverState.patch('removeNative'));
  assert.equal((await read()).padding, '24px');
  await page.evaluate(() => window.popoverState.patch('clear'));
  const cleared = await read();
  assert.equal(cleared.titleWidth, '177px');
  assert.equal(cleared.padding, '12px');
  assert.equal(cleared.panelPadding, '12px');
  assert.equal(cleared.zIndex, '1030');
  assert.equal(cleared.nestedZIndex, '1230');
  assert.equal(cleared.nestedPadding, '6px');
  await page.locator('#popover-action').click();
  await page.locator('#popover-action').click();
  await page.locator('#popover-target').click();
  await page.locator('.main-popover').waitFor({ state: 'hidden' });
  const events = await page.evaluate(() => window.popoverState.events());
  assert.deepEqual(events.changes, [true, false]);
  assert.deepEqual(events.finished, [true, false]);
  assert.equal(events.openedOnce, 1);
  assert.equal(events.clickedOnce, 1);
  assert.deepEqual(events.clickTargets, ['popover-action', 'popover-action']);
  const demo = page.locator('.demo-current-popover .apollo-popover-container');
  assert.equal(await demo.evaluate((container) => getComputedStyle(container).padding), '12px');
  await page.getByRole('button', { name: 'Padding: 12px' }).click();
  assert.equal(await demo.evaluate((container) => getComputedStyle(container).padding), '20px');
  assert.deepEqual(errors, []);
  console.log(
    'Popover source browser: current tokens, nested z-index, geometry, root styles, template events/refs and Demo passed.',
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
