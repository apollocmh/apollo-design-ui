import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-date-native-'));
const aliases = [
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
];
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Native DatePicker</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module">
import {createApp} from 'vue';
import Fixture from '/@fs${repo}/packages/ui/src/date-picker/__tests__/fixtures/NativeDatePicker.vue';
import {genDatePickerStyle} from '/@fs${repo}/packages/ui/src/date-picker/style/index.ts';
const style=document.createElement('style');style.textContent=genDatePickerStyle('apollo');document.head.append(style);
createApp(Fixture).mount('#app');
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
    resolve: {
      alias: {
        vue: path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js'),
        ...Object.fromEntries(
          aliases.map((name) => [
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
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  const diagnostics = [];
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  const date = page.locator('#date');
  await date.focus();
  await date.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('title') === '2026-10-20');
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('title')),
    '2026-10-22',
  );
  await page.keyboard.press('Escape');
  assert.equal(await date.getAttribute('aria-expanded'), 'false');
  assert.equal(await date.evaluate((element) => element === document.activeElement), true);
  await date.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('title') === '2026-10-20');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => document.querySelector('#state')?.getAttribute('data-date') === '2026-10-22',
  );
  await date.press('ArrowDown');
  const popup = page.locator('.apollo-picker-dropdown:visible').last();
  assert.equal(await popup.evaluate((node) => node.style.zIndex), '1810');
  assert.equal(await popup.locator('.current-footer').count(), 1);
  await page.locator('#slot-toggle').click();
  assert.equal(await page.locator('.current-prefix').count(), 0);
  assert.equal(await page.locator('.current-footer').count(), 0);
  await page.locator('#theme-change').click();
  assert.equal(
    await page
      .locator('.apollo-picker')
      .first()
      .evaluate((node) => node.style.getPropertyValue('--apollo-date-picker-cell-height')),
    '39px',
  );
  const time = page.locator('#time');
  await time.focus();
  await time.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('data-value') === '10');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-value')), '12');
  await page.keyboard.press('Enter');
  const ok = page.locator('.apollo-picker-dropdown:visible .apollo-picker-ok button');
  await ok.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => document.querySelector('#state')?.getAttribute('data-time') === '12:15:20',
  );
  const start = page.locator('#range input').first();
  // The public id is applied to the first input for string ids; locate through its picker root.
  const rangeStart = (await start.count()) ? start : page.locator('#range');
  await rangeStart.focus();
  await rangeStart.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('title') === '2026-10-20');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.getAttribute('date-range') === 'end');
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement?.getAttribute('title') === '2026-10-24');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => document.querySelector('#state')?.getAttribute('data-range') === '2026-10-21/2026-10-25',
  );
  await page.locator('#draft').focus();
  await page.locator('#draft').pressSequentially('2026-11-09');
  assert.equal(await page.locator('#draft').inputValue(), '2026-11-09');
  await page.locator('#draft').press('Enter');
  await page.locator('#mask').focus();
  await page.keyboard.type('20261109');
  assert.equal(await page.locator('#mask').inputValue(), '2026-11-09');
  await page.locator('#unmount').click();
  assert.equal(await page.locator('.apollo-picker-dropdown').count(), 0);
  assert.equal(await page.locator('#state').getAttribute('data-element'), 'false');
  assert.deepEqual(diagnostics, []);
  console.log(
    JSON.stringify({
      ok: true,
      browser: launched.channel,
      elapsedMs: Math.round(performance.now() - started),
      scope:
        'source SFC readonly date/time/range keyboard, native draft/mask, current slots/theme, models/ref and teardown',
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
