import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import sharp from 'sharp';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-notices-native-'));
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
  `<!doctype html><html lang="en"><head><title>Native notices</title><link rel="icon" href="data:,"><style>*,*::before,*::after{box-sizing:border-box}body{margin:20px}.native-pure-message{margin-top:260px}</style></head><body><div id="left"></div><div id="right"></div><script type="module">
import {createApp,defineComponent,h,nextTick,shallowRef} from 'vue';
import NativeNotices from '/@fs${repo}/packages/ui/src/notification/__tests__/fixtures/NativeNotices.vue';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import {genMessageStyle} from '/@fs${repo}/packages/ui/src/message/style/index.ts';
import {genNotificationStyle} from '/@fs${repo}/packages/ui/src/notification/style/index.ts';
const css=document.createElement('style');css.textContent=['left','right'].map(prefix=>genMessageStyle(prefix)+genNotificationStyle(prefix)).join('');document.head.append(css);
const theme=shallowRef({components:{Message:{contentBg:'#112233',contentPadding:'5px 11px',zIndexPopup:5001},Notification:{width:340,progressBg:'linear-gradient(red,blue)',colorSuccessBg:'#ddeeff',colorErrorBg:'#ffddcc',colorInfoBg:'#ccddee',colorWarningBg:'#ffeedd',zIndexPopup:5101}}});
const rightTheme=shallowRef({components:{Message:{contentBg:'#aabbcc',zIndexPopup:6001},Notification:{width:290,colorInfoBg:'#eeffdd',zIndexPopup:6101}}});
const leftRef=shallowRef(),rightRef=shallowRef();
const left=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{prefixCls:'left',theme:theme.value},()=>h(NativeNotices,{scope:'left',ref:leftRef}))}));
const right=createApp(defineComponent({setup:()=>()=>h(ConfigProvider,{prefixCls:'right',theme:rightTheme.value},()=>h(NativeNotices,{scope:'right',ref:rightRef}))}));left.mount('#left');right.mount('#right');
window.noticesState={async patch(){theme.value={components:{Message:{contentBg:'#fff1f0',contentPadding:'0px',zIndexPopup:0},Notification:{width:'24rem',progressBg:'linear-gradient(green,gold)',colorSuccessBg:'#aaccbb',colorErrorBg:'#bbaacc',colorInfoBg:'#ccbbaa',colorWarningBg:'#aabbcc',zIndexPopup:0}}};await nextTick()},async kinds(){leftRef.value.notifications.destroy();await nextTick();for(const type of ['success','error','info','warning'])leftRef.value.notifications[type]({key:type,title:type,duration:0})},async progress(){leftRef.value.notifications.destroy();await nextTick();leftRef.value.notifications.info({key:'progress',title:'Progress timer',duration:1,pauseOnHover:true,showProgress:true})},async promise(){const results=[];const first=leftRef.value.messages.open({key:'shared',content:'First',duration:0});first.then(value=>results.push(value));const second=leftRef.value.messages.open({key:'shared',content:'Second',duration:0});second.then(value=>results.push(value));await nextTick();second();await nextTick();await Promise.resolve();return results},unmountLeft(){left.unmount()},unmountRight(){right.unmount()}};
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 950 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.locator('#left-open').click();
  await page
    .locator('.left-notification-list .left-notification-notice')
    .waitFor({ state: 'visible' });
  const style = (selector, name) =>
    page
      .locator(selector)
      .first()
      .evaluate((element, property) => getComputedStyle(element).getPropertyValue(property), name);
  assert.equal(
    await style('.left-message-list .left-message-notice', 'background-color'),
    'rgb(17, 34, 51)',
  );
  assert.equal(await style('.left-message-list .left-message-notice', 'padding'), '5px 11px');
  assert.equal(await style('.left-message', 'z-index'), '5001');
  assert.equal(await style('.left-notification-list .left-notification-notice', 'width'), '340px');
  assert.equal(await style('.left-notification', 'z-index'), '5101');
  assert.equal(
    await style('.left-notification-list .left-notification-notice-info', 'background-color'),
    'rgb(204, 221, 238)',
  );
  const input = page.locator('.left-notification-list .left-notification-notice input');
  await input.fill('Kept draft');
  await input.evaluate((element) => {
    window.noticeDraft = element;
    element.setSelectionRange(2, 6);
  });
  await page.evaluate(() => document.querySelector('#left-update').click());
  await page.waitForFunction(
    () =>
      document.querySelector('.left-notification-list .left-notification-notice-title')
        ?.textContent === 'Updated notification',
  );
  assert.equal(
    await input.evaluate(
      (element) =>
        element === window.noticeDraft &&
        element === document.activeElement &&
        element.value === 'Kept draft' &&
        element.selectionStart === 2 &&
        element.selectionEnd === 6,
    ),
    true,
  );
  await page.locator('#right-open').click();
  await page
    .locator('.right-notification-list .right-notification-notice')
    .waitFor({ state: 'visible' });
  assert.equal(
    await style('.right-message-list .right-message-notice', 'background-color'),
    'rgb(170, 187, 204)',
  );
  await page.evaluate(() => window.noticesState.patch());
  assert.equal(
    await style('.left-message-list .left-message-notice', 'background-color'),
    'rgb(255, 241, 240)',
  );
  assert.equal(await style('.left-message-list .left-message-notice', 'padding'), '0px');
  assert.equal(await style('.left-message', 'z-index'), '0');
  assert.equal(await style('.left-notification-list .left-notification-notice', 'width'), '384px');
  assert.equal(await style('.left-notification', 'z-index'), '0');
  assert.equal(
    await style('.right-message-list .right-message-notice', 'background-color'),
    'rgb(170, 187, 204)',
  );
  assert.equal(
    await input.evaluate(
      (element) => element === window.noticeDraft && element.value === 'Kept draft',
    ),
    true,
  );
  assert.deepEqual(await page.evaluate(() => window.noticesState.promise()), [true, true]);
  await page.evaluate(() => window.noticesState.kinds());
  await page.waitForFunction(
    () =>
      document.querySelectorAll('.left-notification-list .left-notification-notice-success')
        .length === 1,
  );
  const backgrounds = {
    success: 'rgb(170, 204, 187)',
    error: 'rgb(187, 170, 204)',
    info: 'rgb(204, 187, 170)',
    warning: 'rgb(170, 187, 204)',
  };
  for (const [type, color] of Object.entries(backgrounds))
    assert.equal(
      await style(`.left-notification-list .left-notification-notice-${type}`, 'background-color'),
      color,
    );
  const list = page.locator('.left-notification-list');
  assert.equal(
    await list.evaluate((element) =>
      element.classList.contains('left-notification-stack-expanded'),
    ),
    false,
  );
  await page.locator('.left-notification-list .left-notification-notice-warning').hover();
  await page.waitForFunction(() =>
    document
      .querySelector('.left-notification-list')
      ?.classList.contains('left-notification-stack-expanded'),
  );
  await page.mouse.move(600, 900);
  await page.waitForFunction(
    () =>
      !document
        .querySelector('.left-notification-list')
        ?.classList.contains('left-notification-stack-expanded'),
  );
  await page.evaluate(() => window.noticesState.progress());
  const progress = page.locator('.left-notification-list .left-notification-notice progress');
  await progress.waitFor({ state: 'visible' });
  await page
    .locator('.left-notification-list .left-notification-notice')
    .filter({ has: page.locator('progress') })
    .hover();
  assert.equal(
    await progress.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--apollo-notification-progress-bg'),
    ),
    'linear-gradient(green,gold)',
  );
  // Chrome does not expose its progress-value shadow pseudo through getComputedStyle.
  // Inspect the rendered interior instead: the vertical green-to-gold gradient must be painted.
  const pixels = await sharp(await progress.screenshot())
    .removeAlpha()
    .raw()
    .toBuffer({
      resolveWithObject: true,
    });
  const sampleX = Math.floor(pixels.info.width * 0.15);
  const pixel = (row) => {
    const offset = (row * pixels.info.width + sampleX) * pixels.info.channels;
    return [...pixels.data.subarray(offset, offset + 3)];
  };
  const progressPixels = [pixel(0), pixel(pixels.info.height - 1)];
  assert.ok(progressPixels.every(([, green, blue]) => green > 100 && blue < 30));
  assert.ok(progressPixels[1][0] - progressPixels[0][0] > 40);
  const before = await progress.evaluate((element) => element.value);
  await page.waitForTimeout(1150);
  assert.equal(
    await progress.evaluate(
      (element, pausedValue) => Math.abs(element.value - pausedValue) < 1,
      before,
    ),
    true,
  );
  await page.mouse.move(600, 900);
  await page.waitForFunction(
    () => !document.querySelector('.left-notification-list .left-notification-notice'),
    null,
    { timeout: 3000 },
  );
  assert.equal(
    await page.locator('.right-notification-list .right-notification-notice').count(),
    1,
  );
  await page.evaluate(() => window.noticesState.unmountLeft());
  assert.equal(
    await page
      .locator(
        '.left-notification-list .left-notification-notice,.left-message-list .left-message-notice',
      )
      .count(),
    0,
  );
  assert.equal(
    await page.locator('.right-notification-list .right-notification-notice').count(),
    1,
  );
  await page.evaluate(() => window.noticesState.unmountRight());
  assert.equal(await page.locator('[role="alert"]').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      browser: 'Chrome',
      durationMs: Math.round(performance.now() - started),
      checks: [
        'two app isolation',
        'all 3 Message and 7 Notification token CSS',
        'same-key input identity/focus/selection',
        'same-key Promise close settlement',
        'stack/hover/progress and expiry',
        'owner unmount cleanup',
      ],
      errors,
      progressPixels,
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
