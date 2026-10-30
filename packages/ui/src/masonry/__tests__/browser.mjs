/** Focused source geometry check. No package builds or shared dist writes. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const root = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-masonry-contracts-'));
const names = [
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
];
const alias = Object.fromEntries(
  names.map((name) => [`@apollo-design/${name}`, path.join(root, `packages/${name}/src/index.ts`)]),
);
alias.vue = path.join(root, 'node_modules/vue/dist/vue.esm-bundler.js');
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Masonry contracts</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module">
import { createApp, h, ref } from 'vue';
import Masonry from '/@fs/${root}/packages/ui/src/masonry/Masonry.vue';
import Once from '/@fs/${root}/packages/ui/src/masonry/__tests__/fixtures/MasonryOnce.vue';
import { genMasonryStyle } from '/@fs/${root}/packages/ui/src/masonry/style/index.ts';
import { getDesignToken, transformToken } from '@apollo-design/theme';
for (const [name, value] of Object.entries(transformToken(getDesignToken()).vars)) document.documentElement.style.setProperty(name, value);
const style = document.createElement('style'); style.textContent = genMasonryStyle('apollo'); document.head.append(style);
document.documentElement.style.fontSize = '16px';
document.documentElement.style.setProperty('--apollo-motion-duration-slow', '0s');
document.documentElement.style.setProperty('--tile-gap', '12px');
createApp({ setup() {
  const gutter = ref(['2rem', 'calc(0.5rem + 4px)']);
  const columns = ref(2);
  const rootStyle = ref({ width: '320px' });
  const items = ref([20, 60, 20].map((data, key) => ({ key, data })));
  return () => [
    h('button', { id: 'font', onClick: () => { document.documentElement.style.fontSize = '20px'; } }, 'Font'),
    h('button', { id: 'percent', onClick: () => { columns.value = 1; gutter.value = ['10%', '10%']; } }, 'Percent'),
    h('button', { id: 'fixed', onClick: () => { rootStyle.value = { ...rootStyle.value, height: '200px' }; } }, 'Fixed'),
    h('button', { id: 'variable', onClick: () => { columns.value = 2; gutter.value = ['calc(10% + 4px)', 'var(--tile-gap)']; rootStyle.value = { width: '320px' }; document.documentElement.style.setProperty('--tile-gap', '18px'); } }, 'Variable'),
    h('button', { id: 'css-variable', onClick: () => { document.documentElement.style.setProperty('--tile-gap', '26px'); } }, 'CSS variable'),
    h('button', { id: 'viewport', onClick: () => { gutter.value = ['2vw', '1vh']; } }, 'Viewport'),
    h('button', { id: 'remove', onClick: () => { items.value = items.value.slice(0, 2); } }, 'Remove'),
    h(Masonry, { id: 'tiles', items: items.value, columns: columns.value, gutter: gutter.value, style: rootStyle.value }, { item: ({ data, key }) => h('div', { 'data-tile': key, style: { height: data + 'px' } }, String(key)) }),
    h(Once, { items: [{ key: 'a', data: 20 }] }),
  ];
} }).mount('#app');
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
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  await page.goto(`http://127.0.0.1:${address.port}`, { waitUntil: 'networkidle' });
  const geometry = () =>
    page.locator('#tiles').evaluate((node) => {
      const rootRect = node.getBoundingClientRect();
      return [...node.querySelectorAll('.apollo-masonry-item')].map((item) => {
        const rect = item.getBoundingClientRect();
        return { width: rect.width, left: rect.left - rootRect.left, top: rect.top - rootRect.top };
      });
    });
  const waitTop = (top) =>
    page.waitForFunction((expected) => {
      const tile = document.querySelector('#tiles [data-tile="2"]')?.parentElement;
      return tile?.style.top === `${expected}px`;
    }, top);
  await page.waitForFunction(
    () => document.querySelector('#tiles .apollo-masonry-item')?.style.position === 'absolute',
  );
  assert.deepEqual(await geometry(), [
    { width: 144, left: 0, top: 0 },
    { width: 144, left: 176, top: 0 },
    { width: 144, left: 0, top: 32 },
  ]);
  await page.locator('#font').click();
  await waitTop(34);
  assert.deepEqual(await geometry(), [
    { width: 140, left: 0, top: 0 },
    { width: 140, left: 180, top: 0 },
    { width: 140, left: 0, top: 34 },
  ]);
  await page.locator('#percent').click();
  await waitTop(100);
  assert.equal(
    await page.locator('#tiles').evaluate((node) => node.getBoundingClientRect().height),
    120,
  );
  await page.locator('#fixed').click();
  await waitTop(120);
  assert.equal(
    await page.locator('#tiles').evaluate((node) => node.getBoundingClientRect().height),
    200,
  );
  await page.locator('#variable').click();
  await waitTop(38);
  assert.deepEqual(await geometry(), [
    { width: 142, left: 0, top: 0 },
    { width: 142, left: 178, top: 0 },
    { width: 142, left: 0, top: 38 },
  ]);
  await page.locator('#css-variable').click();
  await waitTop(46);
  await page.locator('#viewport').click();
  await waitTop(28);
  assert.deepEqual(await geometry(), [
    { width: 150, left: 0, top: 0 },
    { width: 150, left: 170, top: 0 },
    { width: 150, left: 0, top: 28 },
  ]);
  await page.setViewportSize({ width: 1200, height: 900 });
  await waitTop(29);
  assert.deepEqual(await geometry(), [
    { width: 148, left: 0, top: 0 },
    { width: 148, left: 172, top: 0 },
    { width: 148, left: 0, top: 29 },
  ]);
  // Global motion aliases are consumed by the actual generated CSS and stay live.
  await page
    .locator('#tiles')
    .evaluate((node) => node.style.setProperty('--apollo-motion-duration-slow', '0.7s'));
  const durations = await page
    .locator('#tiles .apollo-masonry-item')
    .first()
    .evaluate((node) => getComputedStyle(node).transitionDuration);
  assert.ok(durations.split(',').every((duration) => duration.trim() === '0.7s'));
  assert.equal(await page.locator('output').textContent(), '1');
  const leaving = page.locator('#tiles [data-tile="2"]');
  await page.locator('#remove').click();
  assert.equal(await leaving.textContent(), '2');
  await leaving.waitFor({ state: 'detached' });
  assert.deepEqual(errors, []);
  console.log(
    `PASS Masonry: CSS rem/calc/var/% geometry, intrinsic/explicit percentage basis, font and CSS-variable changes, once listener, leave retention, live global motion token; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server.close();
  await rm(fixture, { recursive: true, force: true });
}
