import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-modal-native-'));
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
alias.dayjs = path.dirname(createRequire(import.meta.url).resolve('dayjs'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Modal native contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{box-sizing:border-box;animation:none!important;transition:none!important}</style></head><body><div id="app"></div><script type="module">
import {createApp,defineComponent,h,nextTick,shallowRef} from 'vue';
import NativeModal from '/@fs${repo}/packages/ui/src/modal/__tests__/fixtures/NativeModal.vue';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genModalStyle} from '/@fs${repo}/packages/ui/src/modal/style/index.ts';
import {genButtonStyle} from '/@fs${repo}/packages/ui/src/button/style/index.ts';
const css=document.createElement('style');css.textContent=genModalStyle('apollo')+genModalStyle('brand')+genButtonStyle('apollo');document.head.append(css);
const prefix=shallowRef('apollo');const theme=shallowRef({components:{Modal:{contentBg:'#112233',titleFontSize:23,titleLineHeight:2,headerBg:'#223344',footerBg:'#334455',titleColor:'#445566'}}});
const app=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{theme:theme.value,prefixCls:prefix.value},()=>h(NativeModal))}));app.mount('#app');
window.modalState={async prefix(){prefix.value='brand';await nextTick()},async patch(){theme.value={components:{Modal:{contentBg:'#f6ffed',titleFontSize:'19px',titleLineHeight:0,headerBg:'#fff1f0',footerBg:'#d6e4ff',titleColor:'#123456'}}};await nextTick()},unmount(){app.unmount()}};
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.locator('#native-open').click();
  const panel = page.locator('#native-modal');
  await panel.waitFor({ state: 'visible' });
  assert.equal(await panel.getAttribute('role'), 'dialog');
  assert.equal(await panel.getAttribute('aria-describedby'), 'native-description');
  await page.waitForFunction(
    () => document.querySelector('#native-panel-ref')?.textContent === 'native-modal',
  );
  const style = (selector, property) =>
    page
      .locator(selector)
      .evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property);
  assert.equal(await style('.apollo-modal-container', 'background-color'), 'rgb(17, 34, 51)');
  assert.equal(await style('.apollo-modal-title', 'font-size'), '23px');
  assert.equal(await style('.apollo-modal-header', 'background-color'), 'rgb(34, 51, 68)');
  assert.equal(await style('.apollo-modal-footer', 'background-color'), 'rgb(51, 68, 85)');
  assert.equal(await style('.apollo-modal-title', 'color'), 'rgb(68, 85, 102)');
  await page.locator('#native-input').fill('draft');
  await page.locator('#native-input').evaluate((el) => {
    window.modalDraft = el;
    document.querySelector('#update-inside').click();
  });
  await page.waitForFunction(
    () => document.querySelector('#native-description')?.textContent === 'Updated content',
  );
  assert.equal(
    await page
      .locator('#native-input')
      .evaluate(
        (el) => el === window.modalDraft && el === document.activeElement && el.value === 'draft',
      ),
    true,
  );
  await page.evaluate(() => window.modalState.patch());
  assert.equal(await style('.apollo-modal-container', 'background-color'), 'rgb(246, 255, 237)');
  assert.equal(await style('.apollo-modal-title', 'font-size'), '19px');
  assert.equal(await style('.apollo-modal-title', 'line-height'), '0px');
  await panel.locator('.apollo-btn-primary').click();
  assert.equal(await panel.isVisible(), true);
  assert.match(await page.locator('#native-events').textContent(), /ok/);
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('.apollo-modal-wrap')).display === 'none',
  );
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'native-open');
  await page.locator('#native-open').click();
  await panel.waitFor({ state: 'visible' });
  await panel.locator('.apollo-modal-close').click();
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('.apollo-modal-wrap')).display === 'none',
  );
  await page.locator('#native-open').click();
  await panel.waitFor({ state: 'visible' });
  await page.evaluate(() => window.modalState.prefix());
  assert.equal(
    await panel.getAttribute('class').then((value) => value.includes('brand-modal')),
    true,
  );
  assert.equal(await panel.evaluate((el) => getComputedStyle(el).width), '600px');
  await page.evaluate(() => window.modalState.unmount());
  assert.equal(await page.locator('[role="dialog"]').count(), 0);
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      browser: 'Chrome',
      durationMs: Math.round(performance.now() - started),
      checks: [
        'SFC models/events/scoped components',
        'native ARIA/ref',
        'six current tokens',
        'draft identity/focus',
        'OK stays open',
        'Escape/reopen/close/restore',
        'unmount/scroll-lock cleanup',
      ],
      errors,
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
