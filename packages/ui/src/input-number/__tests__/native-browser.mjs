/** Source-only InputNumber check; never builds or overwrites package dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const root = mkdtempSync(path.join(tmpdir(), 'apollo-input-number-'));
const fixture = path.join(
  repo,
  'packages/ui/src/input-number/__tests__/fixtures/NativeBrowser.vue',
);
const packages = [
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
const alias = Object.fromEntries(
  packages.map((name) => [`@apollo-design/${name}`, path.join(repo, 'packages', name, 'src')]),
);
alias.vue = path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js');
writeFileSync(
  path.join(root, 'index.html'),
  `<!doctype html><html><head><link rel="icon" href="data:,"></head><body><div id="app"></div><script type="module">import { createApp } from 'vue';import Demo from '/@fs${fixture}';createApp(Demo).mount('#app');</script></body></html>`,
);

let server;
let browser;
try {
  server = await createServer({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, root] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.locator('#tokens').waitFor();

  const read = (id) =>
    page.locator(`#${id}`).evaluate((input) => {
      const number = input.closest('.apollo-input-number');
      const actions = number.querySelector('.apollo-input-number-actions');
      const prefix = number.querySelector('.apollo-input-number-prefix');
      const suffix = number.querySelector('.apollo-input-number-suffix');
      return {
        width: getComputedStyle(number).width,
        fontSize: getComputedStyle(input).fontSize,
        paddingBlock: getComputedStyle(input).paddingBlockStart,
        actionsWidth: getComputedStyle(actions).width,
        actionsOpacity: getComputedStyle(actions).opacity,
        actionsBackground: getComputedStyle(actions).backgroundColor,
        prefixGap: prefix ? getComputedStyle(prefix).marginInlineEnd : null,
        suffixReserved: suffix ? getComputedStyle(suffix).marginInlineEnd : null,
      };
    });

  const initial = await read('tokens');
  assert.equal(initial.width, '180px');
  assert.equal(initial.actionsWidth, '30px');
  assert.equal(initial.actionsOpacity, '1');
  assert.equal(initial.actionsBackground, 'rgb(18, 52, 86)');
  assert.equal(initial.prefixGap, '8px');
  assert.equal(initial.suffixReserved, '30px');
  const nested = await read('nested');
  assert.equal(nested.width, '210px');
  assert.equal(nested.actionsWidth, '40px');

  await page.locator('#change-theme').click();
  const changed = await read('tokens');
  assert.equal(changed.width, '240px');
  assert.equal(changed.actionsWidth, '36px');
  assert.equal(changed.actionsBackground, 'rgb(101, 67, 33)');
  assert.equal(changed.prefixGap, '12px');
  assert.equal((await read('nested')).width, '210px');

  await page.locator('#hide-handles').click();
  await page
    .locator('.apollo-input-number')
    .filter({ has: page.locator('#tokens') })
    .hover();
  const hidden = await read('tokens');
  assert.equal(hidden.actionsWidth, '0px');
  assert.equal(hidden.actionsOpacity, '0');
  assert.equal(hidden.suffixReserved, '0px');

  await page.locator('#dark-compact').click();
  const dark = await read('tokens');
  assert.notEqual(dark.actionsBackground, 'rgb(240, 240, 240)');
  assert.notEqual(dark.paddingBlock, '4px');
  assert.notEqual(dark.fontSize, '14px');

  await page.locator('#clear-theme').click();
  const cleared = await read('tokens');
  assert.equal(cleared.width, '90px');
  assert.equal(cleared.actionsBackground, 'rgb(240, 240, 240)');
  assert.equal(cleared.prefixGap, '4px');
  console.log(
    'PASS InputNumber: actual token dimensions/colors, current/nested themes, boolean visibility and removal',
  );

  const caret = page.locator('#caret');
  await caret.evaluate((input) => {
    input.focus();
    input.value = '$ 1243';
    input.setSelectionRange(5, 5);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector('#caret').value === '$ 1,243');
  assert.notEqual(
    await caret.evaluate(
      (input) => getComputedStyle(input.closest('.apollo-input-number')).boxShadow,
    ),
    'none',
  );
  assert.equal(
    await caret.evaluate(
      (input) =>
        getComputedStyle(
          input.closest('.apollo-input-number').querySelector('.apollo-input-number-actions'),
        ).width,
    ),
    '22px',
  );
  assert.equal(await caret.evaluate((input) => input.selectionStart), 6);
  await caret.press('ArrowUp');
  await caret.press('ArrowUp');
  await caret.press('Enter');
  assert.deepEqual(JSON.parse(await page.locator('#events').innerText()), {
    stepCount: 2,
    stepOnceCount: 1,
    enterCount: 1,
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS InputNumber: real caret restoration, v-model and typed template events with once; zero browser errors',
  );
} finally {
  await browser?.close();
  await server?.close();
  rmSync(root, { recursive: true, force: true });
}
