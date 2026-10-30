import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-radio-native-'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Native Radio</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module">
import {createApp} from 'vue';import Fixture from '/@fs${repo}/packages/ui/src/radio/__tests__/fixtures/NativeRadio.vue';import {genRadioStyle} from '/@fs${repo}/packages/ui/src/radio/style/index.ts';const style=document.createElement('style');style.textContent=genRadioStyle('apollo');document.head.append(style);createApp(Fixture).mount('#app');
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
          ['utils', 'theme', 'icons', 'locale', 'form-core'].map((name) => [
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
  await page.addStyleTag({
    content: '*,*::before,*::after{transition:none!important;animation:none!important}',
  });
  const single = page.locator('input[data-case="single"]');
  const button = page.locator('input[data-case="button"]');
  const group = page.locator('[data-case="group"] input');
  const buttons = page.locator('[data-case="button-group"] input');
  const checked = (controls) =>
    controls.evaluateAll((inputs) => inputs.map((input) => input.checked));
  const settle = () => page.evaluate(() => new Promise(requestAnimationFrame));
  assert.equal(await page.locator('[data-state="refs"]').textContent(), 'INPUT:SPAN:DIV');
  await single.click();
  await settle();
  assert.equal(await single.isChecked(), false);
  assert.equal(await page.locator('[data-state="change"]').textContent(), '1:true:true');
  await page.locator('[data-action="focus-radio"]').click();
  assert.equal(await single.evaluate((input) => input === document.activeElement), true);
  await page.keyboard.press('Space');
  await settle();
  assert.equal(await single.isChecked(), false);
  assert.equal(await page.locator('[data-state="change"]').textContent(), '2:true:true');
  await page.locator('[data-action="focus-button"]').click();
  assert.equal(await button.evaluate((input) => input === document.activeElement), true);
  await page.keyboard.press('Space');
  await settle();
  assert.equal(await button.isChecked(), false);
  await group.nth(1).click();
  await settle();
  assert.deepEqual(await checked(group), [true, false, false]);
  await group.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await settle();
  assert.deepEqual(await checked(group), [true, false, false]);
  await page.locator('[data-action="accept"]').click();
  await single.focus();
  await page.keyboard.press('Space');
  await settle();
  assert.equal(await single.isChecked(), true);
  assert.equal(await button.isChecked(), true);
  await group.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await settle();
  assert.deepEqual(await checked(group), [false, true, false]);
  assert.equal(await page.locator('[data-state="value"]').textContent(), 'b');
  await page.keyboard.press('ArrowRight');
  await settle();
  assert.deepEqual(await checked(group), [true, false, false]);
  assert.deepEqual(await checked(page.locator('[data-case="independent"] input')), [true, false]);
  await group.nth(1).focus();
  const focusedOption = await group.nth(1).elementHandle();
  await page.locator('[data-action="reorder"]').evaluate((action) => action.click());
  await settle();
  assert.equal(await focusedOption.evaluate((input) => input === document.activeElement), true);
  assert.equal(await focusedOption.evaluate((input) => input.isConnected), true);
  await buttons.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await settle();
  assert.deepEqual(await checked(buttons), [false, true]);
  await page.locator('[data-action="theme"]').click();
  await settle();
  const geometry = () =>
    single.evaluate((input) => {
      const icon = input.parentElement;
      const solid = document.querySelector(
        '[data-case="button-group"] .apollo-radio-button-wrapper-checked',
      );
      return {
        width: getComputedStyle(icon).width,
        dot: getComputedStyle(icon, '::after').width,
        padding: getComputedStyle(solid).paddingInlineStart,
        solid: getComputedStyle(solid).backgroundColor,
      };
    });
  assert.deepEqual(await geometry(), {
    width: '24px',
    dot: '16px',
    padding: '21px',
    solid: 'rgb(18, 52, 86)',
  });
  await page.locator('[data-action="theme"]').click();
  await settle();
  assert.deepEqual(await geometry(), {
    width: '16px',
    dot: '6px',
    padding: '15px',
    solid: 'rgb(22, 119, 255)',
  });
  await page.locator('[data-action="blur-button"]').click();
  assert.equal(await button.evaluate((input) => input === document.activeElement), false);
  await page.locator('[data-action="unmount"]').click();
  assert.equal(await page.locator('input').count(), 0);
  assert.equal(await page.locator('[data-state="refs"]').textContent(), 'none:none:none');
  assert.deepEqual(diagnostics, []);
  console.log(
    JSON.stringify({
      ok: true,
      browser: launched.channel,
      elapsedMs: Math.round(performance.now() - started),
      diagnostics: diagnostics.length,
      scope:
        'source Radio/Button/Group: rejected and accepted native Space/Arrow/click, disabled skip/wrap, independent names, keyed focus, typed refs/unmount, real static CSS and current theme/16-token bridge',
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
