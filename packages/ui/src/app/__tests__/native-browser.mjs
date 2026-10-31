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
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-app-native-'));
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
  `<!doctype html><html lang="en"><head><title>App native composition</title><link rel="icon" href="data:,"><style>*,*::before,*::after{box-sizing:border-box}body{margin:20px;padding-top:180px}</style></head><body><div id="app"></div><script type="module">
import {createApp,defineComponent,h,nextTick,ref,shallowRef} from 'vue';
import NativeApp from '/@fs${repo}/packages/ui/src/app/__tests__/fixtures/NativeApp.vue';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genAppStyle} from '/@fs${repo}/packages/ui/src/app/style/index.ts';
import {genMessageStyle} from '/@fs${repo}/packages/ui/src/message/style/index.ts';
import {genNotificationStyle} from '/@fs${repo}/packages/ui/src/notification/style/index.ts';
import {genModalStyle} from '/@fs${repo}/packages/ui/src/modal/style/index.ts';
import {genButtonStyle} from '/@fs${repo}/packages/ui/src/button/style/index.ts';
const style=document.createElement('style');style.textContent=genAppStyle()+genMessageStyle()+genNotificationStyle()+genModalStyle()+genButtonStyle('apollo');document.head.append(style);
const instance=shallowRef();
const components=shallowRef({app:{className:'provided',style:{padding:'8px'}}});
const theme=shallowRef({token:{colorText:'#123456',fontSize:18}});
const direction=ref('ltr');
const owner=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{scopeTag:'section',components:components.value,theme:theme.value,direction:direction.value},()=>h(NativeApp,{ref:instance}))}));owner.mount('#app');
window.appState={async patch(){components.value={app:{className:'replacement',style:{padding:'16px'}}};theme.value={token:{colorText:'#654321',fontSize:20}};direction.value='rtl';instance.value.patch();await nextTick()},async clear(){components.value=undefined;direction.value='ltr';await nextTick()},async host(value){instance.value.setComponent(value);await nextTick()},props(){return instance.value.currentProps()},unmount(){owner.unmount()}};
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  const host = page.locator('.apollo-app');
  await host.waitFor({ state: 'visible' });
  assert.equal(await host.evaluate((element) => element.tagName), 'DIV');
  assert.equal(await host.evaluate((element) => getComputedStyle(element).padding), '8px');
  assert.equal(
    await host.evaluate((element) => getComputedStyle(element).color),
    'rgb(18, 52, 86)',
  );
  assert.equal(await host.evaluate((element) => getComputedStyle(element).fontSize), '18px');
  await page.locator('#open-message').click();
  await page.locator('#open-notification').click();
  const draft = page.locator('#notice-draft');
  await draft.fill('Kept draft');
  await draft.evaluate((element) => {
    window.noticeNode = element;
    element.setSelectionRange(2, 6);
  });
  await page.evaluate(() => window.appState.patch());
  assert.equal(await page.locator('#page-label').textContent(), 'Updated page');
  assert.equal(await host.evaluate((element) => element.classList.contains('provided')), false);
  assert.equal(await host.evaluate((element) => element.classList.contains('replacement')), true);
  assert.equal(await host.evaluate((element) => getComputedStyle(element).padding), '16px');
  assert.equal(
    await host.evaluate((element) => getComputedStyle(element).color),
    'rgb(101, 67, 33)',
  );
  assert.equal(await host.evaluate((element) => getComputedStyle(element).fontSize), '20px');
  assert.equal(await host.evaluate((element) => getComputedStyle(element).direction), 'rtl');
  assert.equal(
    await draft.evaluate(
      (element) =>
        element === window.noticeNode &&
        element === document.activeElement &&
        element.value === 'Kept draft' &&
        element.selectionStart === 2 &&
        element.selectionEnd === 6,
    ),
    true,
  );
  const current = await page.evaluate(() => window.appState.props());
  assert.equal(current.message.maxCount, 2);
  assert.equal(current.notification.placement, 'bottomLeft');
  await page.evaluate(() => window.appState.clear());
  assert.equal(await host.evaluate((element) => element.classList.contains('replacement')), false);
  assert.equal(await host.evaluate((element) => getComputedStyle(element).padding), '0px');
  assert.equal(await host.evaluate((element) => getComputedStyle(element).direction), 'ltr');

  await page.locator('#open-modal').click();
  const modalInput = page.locator('#modal-draft');
  await modalInput.fill('Modal draft');
  await modalInput.evaluate((element) => {
    window.modalNode = element;
    element.setSelectionRange(1, 5);
  });
  for (const component of ['section', false, 'main']) {
    await page.evaluate((value) => window.appState.host(value), component);
    assert.equal(await host.count(), component === false ? 0 : 1);
    if (component !== false)
      assert.equal(await host.evaluate((element) => element.tagName), component.toUpperCase());
    assert.equal(
      await draft.evaluate(
        (element) => element === window.noticeNode && element.value === 'Kept draft',
      ),
      true,
    );
    assert.equal(
      await modalInput.evaluate(
        (element) =>
          element === window.modalNode &&
          element === document.activeElement &&
          element.value === 'Modal draft' &&
          element.selectionStart === 1 &&
          element.selectionEnd === 5,
      ),
      true,
    );
  }
  assert.equal(await page.locator('.apollo-message-list .apollo-message-notice').count(), 1);
  assert.equal(await page.locator('[role="dialog"]').count(), 1);
  await page.evaluate(() => window.appState.unmount());
  assert.equal(await page.locator('[role="alert"],[role="dialog"]').count(), 0);
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      browser: 'Chrome',
      durationMs: Math.round(performance.now() - started),
      checks: [
        'current Provider/native host styles and direction',
        'global alias theme projection',
        'config replacement/withdrawal',
        'host div/section/false/main',
        'notification/modal input identity and focus/selection',
        'owner portal and scroll-lock cleanup',
      ],
      errors,
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
