import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-color-picker-native-'));
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
const generators = {
  'color-picker': 'genColorPickerStyle',
  popover: 'genPopoverStyle',
  tooltip: 'genTooltipStyle',
  input: 'genInputStyle',
  'input-number': 'genInputNumberStyle',
  select: 'genSelectStyle',
  slider: 'genSliderStyle',
  collapse: 'genCollapseStyle',
  divider: 'genDividerStyle',
  segmented: 'genSegmentedStyle',
  space: 'genSpaceStyle',
  grid: 'genGridStyle',
  button: 'genButtonStyle',
};
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>ColorPicker native contracts</title><link rel="icon" href="data:,"><style>*,*::before,*::after{box-sizing:border-box;transition:none!important;animation:none!important}body{margin:40px;font-family:sans-serif}#native-color{margin-bottom:24px}.fixture-static-color{width:max-content;margin-top:30px}#demos{margin-top:40px;display:flex;gap:40px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/color-picker/__tests__/fixtures/NativeColorPicker.vue';
import PanelDemo from '/@fs${repo}/packages/ui/src/color-picker/demo/panel-render.vue';
import TextDemo from '/@fs${repo}/packages/ui/src/color-picker/demo/text-render.vue';
import PureDemo from '/@fs${repo}/packages/ui/src/color-picker/demo/pure-panel.vue';
${Object.entries(generators)
  .map(([name, fn]) => `import {${fn}} from '/@fs${repo}/packages/ui/src/${name}/style/index.ts';`)
  .join('\n')}
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(key,value);
const css=document.createElement('style');css.textContent=[${Object.values(generators)
    .map((fn) => `${fn}('apollo')`)
    .join(',')}].join(String.fromCharCode(10));document.head.append(css);
const component=ref(null);
createApp(defineComponent({setup:()=>()=>[h(Fixture,{ref:component}),h('section',{id:'demos'},[h(PanelDemo),h(TextDemo),h(PureDemo)])]})).mount('#app');
window.colorPickerState={patch:(kind)=>component.value.patch(kind),events:()=>component.value.events()};
</script></body></html>`,
);

const result = { behaviorPassed: false, diagnostics: [], durationMs: 0 };
const started = Date.now();
let server;
let browser;
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
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  page.setDefaultTimeout(10_000);
  page.on('pageerror', (error) => result.diagnostics.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) result.diagnostics.push(message.text());
  });
  await page.addInitScript(() => {
    window.colorPickerWindowErrors = [];
    window.addEventListener('error', (event) => window.colorPickerWindowErrors.push(event.message));
  });
  await page.goto(server.resolvedUrls.local[0]);
  const trigger = page.locator('#native-color');
  await trigger.waitFor();
  assert.equal(await trigger.evaluate((element) => element.tagName), 'BUTTON');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const popup = page.locator('.fixture-color-popup');
  try {
    await popup.waitFor({ state: 'visible' });
  } catch (error) {
    console.error(
      'ColorPicker open diagnostics',
      await trigger.evaluate((element) => ({
        expanded: element.getAttribute('aria-expanded'),
        classes: element.className,
      })),
      await page.locator('.apollo-popover').evaluateAll((elements) =>
        elements.map((element) => ({
          class: element.className,
          style: {
            display: element.style.display,
            opacity: element.style.opacity,
            position: element.style.position,
          },
          content: element.textContent.slice(0, 150),
        })),
      ),
    );
    throw error;
  }
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await trigger.locator('b').textContent(), '#1677ff');
  assert.match(await trigger.textContent(), /0$/);
  assert.equal(
    await popup.locator('.apollo-popover-container').evaluate((element) => element.style.width),
    '320px',
  );

  const editor = popup.locator('.apollo-color-picker-hex-input input');
  await editor.focus();
  await editor.fill('12a');
  await editor.evaluate((element) => {
    window.colorPickerEditor = element;
  });
  await page.evaluate(() => window.colorPickerState.patch('styles'));
  await page.waitForFunction(
    () => !document.querySelector('.fixture-color-popup .apollo-popover-container').style.width,
  );
  assert.equal(
    await editor.evaluate(
      (element) =>
        element === window.colorPickerEditor &&
        element === document.activeElement &&
        element.value === '12a',
    ),
    true,
  );
  await page.evaluate(() => window.colorPickerState.patch('theme'));
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.fixture-color-popup'))
        .getPropertyValue('--apollo-color-text')
        .trim() === '#654321',
  );
  assert.equal(
    await editor.evaluate(
      (element) => element === window.colorPickerEditor && element === document.activeElement,
    ),
    true,
  );

  await page.evaluate(() => window.colorPickerState.patch('text'));
  await page.waitForFunction(
    () => !document.querySelector('#native-color .apollo-color-picker-trigger-text'),
  );
  const preset = popup.locator('button.apollo-color-picker-presets-color').first();
  await preset.focus();
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(() => window.colorPickerState.events()), {
    changes: ['rgb(255,0,0)'],
    completes: 1,
    clears: 0,
  });
  assert.equal(
    await trigger
      .locator('.apollo-color-picker-color-block-inner')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgb(255, 0, 0)',
  );
  const clear = popup.locator('.apollo-color-picker-operation button.apollo-color-picker-clear');
  await clear.focus();
  await page.keyboard.press('Enter');
  assert.equal((await page.evaluate(() => window.colorPickerState.events())).clears, 1);
  assert.equal(
    await trigger.locator('.apollo-color-picker-clear').evaluate((element) => element.tagName),
    'SPAN',
  );
  assert.equal(
    await trigger.locator('.apollo-color-picker-clear').getAttribute('aria-hidden'),
    'true',
  );
  await trigger.click();
  await page.waitForFunction(
    () => document.querySelector('#native-color').getAttribute('aria-expanded') === 'false',
  );

  const staticPanel = page.locator('.fixture-static-color');
  const staticPopup = staticPanel.locator('.apollo-popover');
  await staticPopup.waitFor({ state: 'visible' });
  assert.equal(
    await staticPopup.evaluate((element) => getComputedStyle(element).position),
    'relative',
  );
  assert.equal(
    await staticPanel.evaluate(
      (element) =>
        element.getBoundingClientRect().height >=
        element.querySelector('.apollo-popover').getBoundingClientRect().height,
    ),
    true,
  );
  assert.equal(await staticPanel.locator('.apollo-color-picker-trigger').count(), 0);
  const staticEditor = staticPanel.locator('.apollo-color-picker-hex-input input');
  await staticEditor.fill('0000ff');
  await staticEditor.dispatchEvent('change');
  await page.waitForFunction(
    () =>
      document.querySelector('.fixture-static-color .apollo-color-picker-hex-input input').value ===
      '0000ff',
  );

  // The modified original examples must mount with their real scoped components.
  assert.equal(await page.locator('#demos .apollo-color-picker-trigger').count(), 5);
  await page.locator('#demos .apollo-color-picker-trigger').first().click();
  await page
    .locator('.custom-panel .apollo-color-picker-inner-content')
    .waitFor({ state: 'visible' });
  await page.locator('#demos .apollo-color-picker-trigger').first().click();
  await page.evaluate(() => window.colorPickerState.patch('unmount'));
  await trigger.waitFor({ state: 'detached' });
  assert.equal(await page.locator('.fixture-static-color').count(), 0);
  result.behaviorPassed = true;
  result.diagnostics.push(...(await page.evaluate(() => window.colorPickerWindowErrors)));
  assert.deepEqual(result.diagnostics, []);
  console.log(
    'ColorPicker source browser: native keyboard, current slots/styles/theme, stable editor, alpha presets, static flow and original demos passed.',
  );
} finally {
  result.durationMs = Date.now() - started;
  await writeFile('/tmp/apollo-color-picker-browser-result.json', JSON.stringify(result, null, 2));
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
