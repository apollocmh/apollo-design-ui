import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const started = performance.now();
const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-checkbox-native-'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Native Checkbox</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module">
import {createApp} from 'vue';import Fixture from '/@fs${repo}/packages/ui/src/checkbox/__tests__/fixtures/NativeCheckbox.vue';createApp(Fixture).mount('#app');
</script></body></html>`,
);
let server;
let browser;
try {
  const aliases = ['utils', 'theme', 'icons', 'locale', 'form-core'];
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
  const checkbox = page.locator('#checkbox');
  await checkbox.click();
  assert.equal(await checkbox.isChecked(), false);
  assert.equal(await checkbox.evaluate((input) => input.indeterminate), true);
  assert.equal(await page.locator('#state').getAttribute('data-changes'), '1');
  const group = page.locator('[data-case="checkbox-group"] input');
  await group.nth(1).click();
  assert.equal(await group.nth(0).isChecked(), true);
  assert.equal(await group.nth(1).isChecked(), false);
  const radio = page.locator('[data-case="radio-group"] input');
  await radio.nth(1).click();
  assert.equal(await radio.nth(0).isChecked(), true);
  assert.equal(await radio.nth(1).isChecked(), false);
  await radio.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await radio.nth(0).isChecked(), true);
  assert.equal(await radio.nth(1).isChecked(), false);
  await page.locator('#accept').click();
  await checkbox.focus();
  await page.keyboard.press('Space');
  assert.equal(await checkbox.isChecked(), true);
  assert.equal(await page.locator('#state').getAttribute('data-checked'), 'true');
  await radio.nth(1).click();
  assert.equal(await radio.nth(0).isChecked(), false);
  assert.equal(await radio.nth(1).isChecked(), true);
  await group.nth(1).click();
  assert.deepEqual(
    await page.locator('form').evaluate((form) => new FormData(form).getAll('choices')),
    ['a', 'b'],
  );
  await page.locator('#unmount').click();
  assert.equal(await page.locator('input').count(), 0);
  assert.equal(await page.locator('#state').getAttribute('data-ref'), 'false');
  assert.equal(await page.locator('#state').getAttribute('data-group-ref'), 'false');
  assert.deepEqual(diagnostics, []);
  console.log(
    JSON.stringify({
      ok: true,
      browser: launched.channel,
      elapsedMs: Math.round(performance.now() - started),
      scope:
        'actual Checkbox/Group and Radio same-name rejected/accepted clicks, native keyboard, indeterminate, form values, typed refs and teardown',
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
