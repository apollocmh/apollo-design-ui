/** Focused source/demo check: node packages/ui/src/back-top/__tests__/browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import axe from 'axe-core';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-back-top-'));
const names = [
  'ui',
  'motion',
  'utils',
  'theme',
  'icons',
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
  names.map((name) => [`@apollo-design/${name}`, path.join(root, `packages/${name}/src/index.ts`)]),
);
alias.vue = path.join(root, 'node_modules/vue/dist/vue.esm-bundler.js');
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="zh-CN"><head><title>BackTop source check</title></head><body><main id="app"></main><button id="after">After</button><script type="module">
import { createApp } from 'vue';
import Demo from '/@fs/${root}/packages/ui/src/back-top/demo/basic.vue';
import { genBackTopStyle } from '/@fs/${root}/packages/ui/src/back-top/style/index.ts';
import { getDesignToken, transformToken } from '@apollo-design/theme';
for (const [name, value] of Object.entries(transformToken(getDesignToken()).vars)) document.documentElement.style.setProperty(name, value);
const style = document.createElement('style'); style.textContent = genBackTopStyle('apollo'); document.head.append(style);
createApp(Demo).mount('#app');
</script></body></html>`,
);

const server = await createServer({
  configFile: false,
  root: fixture,
  plugins: [vue()],
  resolve: { alias },
  server: { host: '127.0.0.1', port: 0, fs: { allow: [root, fixture] } },
  logLevel: 'error',
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  await page.goto(`http://127.0.0.1:${address.port}`, { waitUntil: 'networkidle' });
  const button = page.getByRole('button', { name: '返回顶部', includeHidden: true });
  const scroller = page.getByLabel('滚动内容');
  assert.equal(await button.getAttribute('type'), 'button');
  assert.equal(await button.isVisible(), false);
  await scroller.focus();
  await page.keyboard.press('Tab');
  assert.equal(
    await page.locator('#after').evaluate((element) => element === document.activeElement),
    true,
  );

  const show = async () => {
    await scroller.evaluate((element) => {
      element.scrollTop = 300;
    });
    await button.waitFor({ state: 'visible' });
  };
  await show();
  await scroller.focus();
  await page.keyboard.press('Tab');
  assert.equal(await button.evaluate((element) => element === document.activeElement), true);
  assert.ok(
    await button.evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).outlineWidth) > 0,
    ),
  );
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => document.querySelector('.demo-back-top-content').scrollTop === 0,
  );
  assert.match(await page.locator('[aria-live]').textContent(), /已返回顶部 1 次/);

  await show();
  await button.focus();
  await page.keyboard.press('Space');
  await page.waitForFunction(
    () => document.querySelector('.demo-back-top-content').scrollTop === 0,
  );
  assert.match(await page.locator('[aria-live]').textContent(), /已返回顶部 2 次/);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await show();
  await button.click();
  assert.equal(await scroller.evaluate((element) => element.scrollTop), 0);
  assert.match(await page.locator('[aria-live]').textContent(), /已返回顶部 3 次/);

  await show();
  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(() => window.axe.run('#app'));
  assert.deepEqual(result.violations, []);
  assert.deepEqual(errors, []);
  console.log('BackTop source Demo: hidden/tab/Enter/Space/focus/reduced-motion/axe passed');
} finally {
  await browser?.close();
  await server.close();
  await rm(fixture, { recursive: true, force: true });
}
