/** Focused source check: node packages/ui/src/progress/__tests__/browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import axe from 'axe-core';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { createServer } from 'vite';

const root = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-progress-'));
const alias = Object.fromEntries(
  [
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
  ].map((name) => [`@apollo-design/${name}`, path.join(root, `packages/${name}/src/index.ts`)]),
);
alias.vue = path.join(root, 'node_modules/vue/dist/vue.esm-bundler.js');
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Progress source check</title>
<style>*,*::before,*::after{transition:none!important;animation:none!important}</style></head>
<body><main id="app"></main><script type="module">
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { darkAlgorithm, getDesignToken, transformToken } from '@apollo-design/theme';
import Progress from '/@fs/${root}/packages/ui/src/progress/Progress.ts';
import ConfigProvider from '/@fs/${root}/packages/ui/src/config-provider/ConfigProvider.ts';
import { genProgressStyle } from '/@fs/${root}/packages/ui/src/progress/style/index.ts';
for (const [key, value] of Object.entries(transformToken(getDesignToken()).vars))
  document.documentElement.style.setProperty(key, value);
const css = document.createElement('style'); css.textContent = genProgressStyle(); document.head.append(css);
const theme = ref({ token: { colorSuccess: '#22aa44' }, components: { Progress: {
  defaultColor: '#123456', remainingColor: '#eeeeee', lineBorderRadius: 7,
  circleTextColor: '#134567', circleTextFontSize: '1.25em', circleIconFontSize: '2em',
} } });
const position = ref({ type: 'outer', align: 'end' });
const direction = ref('ltr');
const color = ref({ from: '#00ff00', to: '#0000ff' });
const app = createApp(defineComponent(() => () => h(ConfigProvider, {
  theme: theme.value, direction: direction.value,
}, { default: () => [
  h(Progress, { 'data-case': 'line', 'aria-label': 'Line progress', percent: 60,
    size: ['75%', 12], style: 'width: 400px' }),
  h(Progress, { 'data-case': 'info', 'aria-label': 'Positioned progress', percent: 100,
    size: [300, 20], strokeColor: '#fff', percentPosition: position.value }),
  h(Progress, { 'data-case': 'inner-default', 'aria-label': 'Inner default progress',
    percent: 60, percentPosition: { type: 'inner' }, size: [200, 20] }),
  h(Progress, { 'data-case': 'inner-success', 'aria-label': 'Inner completed progress',
    percent: 100, percentPosition: { type: 'inner' }, size: [200, 20] }),
  h(Progress, { 'data-case': 'inner-error', 'aria-label': 'Inner failed progress',
    percent: 60, status: 'exception', percentPosition: { type: 'inner' }, size: [200, 20] }),
  h(Progress, { 'data-case': 'inner-variable', 'aria-label': 'Inner variable progress',
    percent: 60, strokeColor: 'var(--task-progress-color)', percentPosition: { type: 'inner' },
    size: [200, 20], style: '--task-progress-color: white' }),
  h(Progress, { 'data-case': 'inner-override', 'aria-label': 'Inner styled progress',
    percent: 60, strokeColor: 'white', percentPosition: { type: 'inner' },
    size: [200, 20], styles: { indicator: { color: '#123456' } } }),
  h(Progress, { 'data-case': 'circle', 'aria-label': 'Circle progress', type: 'circle',
    percent: 60, success: { percent: 20 }, strokeWidth: 12, styles: { rail: { opacity: 0.6 } } }),
  h(Progress, { 'data-case': 'icon', 'aria-label': 'Completed progress', type: 'circle', percent: 100 }),
  h(Progress, { 'data-case': 'gradient', 'aria-label': 'Gradient progress', type: 'dashboard',
    percent: 70, gapDegree: 60, gapPlacement: 'start', strokeColor: color.value }),
  h(Progress, { 'data-case': 'steps', 'aria-label': 'Step progress', percent: 50,
    steps: 4, size: ['2em', 10] }),
] })));
app.mount('#app');
window.updateProgress = async (clear = false) => {
  theme.value = clear ? undefined : { algorithm: darkAlgorithm,
    components: { Progress: { defaultColor: '#654321' } } };
  direction.value = 'rtl';
  position.value = { type: 'inner', align: 'start' };
  color.value = { '100%': '#0000ff', '0%': '#00ff00', '50%': '#00ffff', direction: 'to right' };
  await nextTick();
};
window.progressMounted = true;
</script></body></html>`,
);

const server = await createServer({
  configFile: false,
  root: fixture,
  cacheDir: path.join(fixture, '.vite'),
  plugins: [vue()],
  resolve: { alias },
  server: { host: '127.0.0.1', port: 0, fs: { allow: [root, fixture] } },
  logLevel: 'error',
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage({
    reducedMotion: 'reduce',
    viewport: { width: 1000, height: 800 },
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (['warning', 'warn', 'error'].includes(message.type())) errors.push(message.text());
  });
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  await page.goto(`http://127.0.0.1:${address.port}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.progressMounted === true);
  const computed = (selector, property) =>
    page
      .locator(selector)
      .evaluate((element, key) => getComputedStyle(element).getPropertyValue(key), property);
  const line = '[data-case="line"]';
  const circle = '[data-case="circle"]';
  const gradient = '[data-case="gradient"]';
  assert.equal(await computed(line, 'width'), '400px');
  assert.equal(await computed(`${line} .apollo-progress-body`, 'width'), '300px');
  assert.equal(
    await computed(`${line} .apollo-progress-track`, 'background-color'),
    'rgb(18, 52, 86)',
  );
  assert.equal(await computed(`${line} .apollo-progress-rail`, 'border-top-left-radius'), '7px');
  assert.equal(
    await computed(`${circle} .apollo-progress-circle-rail`, 'stroke'),
    'rgb(238, 238, 238)',
  );
  assert.equal(await computed(`${circle} .apollo-progress-circle-rail`, 'opacity'), '0.6');
  assert.equal(
    await page.locator(`${circle} .apollo-progress-circle-rail`).getAttribute('r'),
    '44',
  );
  assert.equal(
    await computed(`${circle} .apollo-progress-circle-path:last-child`, 'stroke'),
    'rgb(34, 170, 68)',
  );
  assert.equal(await computed(`${circle} .apollo-progress-indicator`, 'color'), 'rgb(19, 69, 103)');
  assert.equal(await computed(`${circle} .apollo-progress-indicator`, 'font-size'), '30px');
  assert.equal(
    await computed('[data-case="icon"] .apollo-progress-indicator .apollo-icon', 'font-size'),
    '60px',
  );
  assert.equal(
    await computed('[data-case="steps"] .apollo-progress-steps-item:first-child', 'width'),
    '28px',
  );
  assert.equal(
    await page
      .locator(`${gradient} .apollo-progress-circle-rail`)
      .evaluate((element) => element.style.transform),
    'rotate(210deg)',
  );
  assert.match(
    await computed(`${gradient} foreignObject > div > div`, 'background-image'),
    /conic-gradient/,
  );
  assert.equal(
    await computed('[data-case="inner-override"] .apollo-progress-indicator', 'color'),
    'rgb(18, 52, 86)',
  );
  const pixels = await sharp(await page.locator(gradient).screenshot())
    .removeAlpha()
    .raw()
    .toBuffer();
  let colored = 0;
  for (let i = 0; i < pixels.length; i += 3)
    if ((pixels[i + 1] > 70 || pixels[i + 2] > 70) && pixels[i] < 40) colored++;
  assert.ok(colored > 100, 'the SVG mask must paint visible gradient pixels');

  await page.evaluate(() => window.updateProgress());
  assert.equal(
    await computed(`${line} .apollo-progress-track`, 'background-color'),
    'rgb(101, 67, 33)',
  );
  assert.equal(await computed(`${line} .apollo-progress-rail`, 'border-top-left-radius'), '100px');
  assert.equal(
    await page
      .locator('[data-case="info"] .apollo-progress-track .apollo-progress-indicator')
      .textContent(),
    '100%',
  );
  assert.equal(
    await computed('[data-case="info"] .apollo-progress-indicator', 'justify-content'),
    'start',
  );
  assert.equal(
    await page
      .locator(`${gradient} .apollo-progress-circle-rail`)
      .evaluate((element) => element.style.transform),
    'rotate(30deg)',
  );
  assert.match(
    await computed(`${gradient} foreignObject > div > div`, 'background-image'),
    /rgb\(0, 255, 0\) 0%.*rgb\(0, 255, 255\) 41%.*rgb\(0, 0, 255\) 83%/,
  );
  assert.equal(
    await computed('[data-case="inner-variable"] .apollo-progress-indicator', 'color'),
    'color(srgb-linear 0 0 0)',
  );
  await page.evaluate(() => window.updateProgress(true));
  assert.equal(
    await computed(`${line} .apollo-progress-track`, 'background-color'),
    'rgb(22, 119, 255)',
  );

  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(() => window.axe.run('#app'));
  assert.deepEqual(result.violations, []);
  assert.deepEqual(errors, []);
  console.log(
    'Progress source: current six tokens/styles, circle geometry/gradient paint, dynamic position/direction, removal and axe passed',
  );
} finally {
  await browser?.close();
  await server.close();
  await rm(fixture, { recursive: true, force: true });
}
