/** Focused source/Demo check: node packages/ui/src/steps/__tests__/browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const root = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-steps-'));
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
  `<!doctype html><html lang="en"><head><title>Steps source check</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module">
import { createApp, h, ref } from 'vue';
import Steps from '/@fs/${root}/packages/ui/src/steps/Steps.ts';
import ConfigProvider from '/@fs/${root}/packages/ui/src/config-provider/index.ts';
import Demo from '/@fs/${root}/packages/ui/src/steps/demo/component-token.vue';
import Events from '/@fs/${root}/packages/ui/src/steps/__tests__/fixtures/StepsEvents.vue';
import { genStepsStyle } from '/@fs/${root}/packages/ui/src/steps/style/index.ts';
import { getDesignToken, transformToken } from '@apollo-design/theme';
for (const [name, value] of Object.entries(transformToken(getDesignToken()).vars)) document.documentElement.style.setProperty(name, value);
const style = document.createElement('style'); style.textContent = genStepsStyle(); document.head.append(style);
createApp({ setup() {
  const theme = ref({ components: { Steps: { descriptionMaxWidth: 220, customIconFontSize: 30, iconSize: 40, iconFontSize: 18, dotSize: 12, dotCurrentSize: 16, navArrowColor: 'rebeccapurple', navContentMaxWidth: '24rem', iconSizeSM: '1.5rem' } } });
  const items = [{ title: 'Alpha', content: 'Details' }, { title: 'Beta', icon: h('span', 'B') }];
  return () => [
    h('button', { id: 'theme-change', onClick: () => { theme.value = { components: { Steps: { iconSize: 44, dotSize: 10, dotCurrentSize: 14 } } }; } }, 'Change theme'),
    h(ConfigProvider, { theme: theme.value }, { default: () => [
      h(Steps, { id: 'regular', items }),
      h(Steps, { id: 'small', items, size: 'small' }),
      h(Steps, { id: 'dots', items: [{ title: 'Alpha' }, { title: 'Beta' }], type: 'dot' }),
      h(Steps, { id: 'navigation', items, type: 'navigation' }),
    ] }),
    h('section', { id: 'actual-demo' }, [h(Demo)]),
    h('section', { id: 'events' }, [h(Events)]),
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
  const page = await browser.newPage({
    reducedMotion: 'reduce',
    viewport: { width: 1200, height: 900 },
  });
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
  const css = async (selector, property, pseudo) =>
    page
      .locator(selector)
      .first()
      .evaluate(
        (node, args) => getComputedStyle(node, args.pseudo).getPropertyValue(args.property),
        { property, pseudo },
      );
  assert.equal(await css('#regular .apollo-steps-item-icon', 'width'), '40px');
  assert.equal(await css('#regular .apollo-steps-item-icon', 'font-size'), '18px');
  assert.equal(await css('#regular .apollo-steps-item-content', 'max-width'), '220px');
  assert.equal(
    await css('#regular .apollo-steps-item-custom .apollo-steps-item-icon', 'font-size'),
    '30px',
  );
  assert.equal(await css('#small .apollo-steps-item-icon', 'width'), '24px');
  assert.equal(await css('#dots .apollo-steps-item-wait .apollo-steps-item-icon', 'width'), '12px');
  assert.equal(
    await css('#dots .apollo-steps-item-process .apollo-steps-item-icon', 'width'),
    '16px',
  );
  assert.equal(
    await css('#navigation .apollo-steps-item', 'border-top-color', '::after'),
    'rgb(102, 51, 153)',
  );
  assert.equal(await css('#navigation .apollo-steps-item-section', 'max-width'), '384px');
  assert.equal(await css('#actual-demo .apollo-steps-item-icon', 'width'), '40px');
  assert.equal(
    await css('#actual-demo .apollo-steps-item-custom .apollo-steps-item-icon', 'font-size'),
    '20px',
  );
  await page.locator('#theme-change').click();
  assert.equal(await css('#regular .apollo-steps-item-icon', 'width'), '44px');
  assert.equal(await css('#regular .apollo-steps-item-content', 'max-width'), 'none');
  assert.equal(await css('#dots .apollo-steps-item-wait .apollo-steps-item-icon', 'width'), '10px');
  assert.equal(
    await css('#dots .apollo-steps-item-process .apollo-steps-item-icon', 'width'),
    '14px',
  );
  await page.locator('#events .apollo-steps').dispatchEvent('change');
  assert.equal(await page.locator('#events output').textContent(), '');
  await page.locator('#events .apollo-steps-item').nth(1).click();
  assert.equal(await page.locator('#events output').textContent(), '1,1');
  await page.locator('#events .apollo-steps-item').first().focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#events output').textContent(), '1,1,0');
  assert.deepEqual(errors, []);
  console.log(
    `PASS Steps: nine tokens consumed by CSS, live replacement/removal, existing component-token Demo and native SFC change/once/arrays/keyboard; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server.close();
  await rm(fixture, { recursive: true, force: true });
}
