/** Source-only check: node packages/ui/src/drawer/__tests__/native-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-drawer-native-'));
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
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Drawer native contracts</title><link rel="icon" href="data:,"><style>body{font-family:sans-serif}#drawer-trigger,#drawer-outside{margin:20px}#demos{margin-top:100px}</style></head><body><main id="app"></main><script type="module">
import {createApp,defineComponent,h,ref} from 'vue';
import {getDesignToken,transformToken} from '@apollo-design/theme';
import Fixture from '/@fs${repo}/packages/ui/src/drawer/__tests__/fixtures/NativeDrawer.vue';
import TokenDemo from '/@fs${repo}/packages/ui/src/drawer/demo/component-token.vue';
import ConfigDemo from '/@fs${repo}/packages/ui/src/drawer/demo/config-provider.vue';
import {genDrawerStyle} from '/@fs${repo}/packages/ui/src/drawer/style/index.ts';
import {genButtonStyle} from '/@fs${repo}/packages/ui/src/button/style/index.ts';
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(key,value);
const css=document.createElement('style');css.textContent=[genDrawerStyle(),genButtonStyle()].join(String.fromCharCode(10));document.head.append(css);
const component=ref(null);
createApp(defineComponent({setup:()=>()=>[h(Fixture,{ref:component}),h('section',{id:'demos'},[h(TokenDemo),h(ConfigDemo)])]})).mount('#app');
window.drawerState={patch:kind=>component.value.patch(kind),focus:()=>component.value.focus(),refValid:()=>component.value.refValid(),events:()=>component.value.events()};
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
    resolve: { alias },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, fixture] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.drawerState);
  await page.locator('#drawer-trigger').click();
  await page.waitForFunction(() => window.drawerState.events().completed.length === 1);
  const root = page.locator('.native-drawer');
  const panel = page.locator('.native-drawer > .apollo-drawer-content-wrapper');
  assert.equal(await page.evaluate(() => window.drawerState.refValid()), true);
  assert.equal(await root.getAttribute('data-native'), 'drawer-root');
  assert.equal(
    await root.evaluate((element) => element.style.getPropertyValue('--native-root')),
    '1',
  );
  assert.equal(await root.evaluate((element) => getComputedStyle(element).zIndex), '1450');
  assert.equal(
    await root
      .locator('.apollo-drawer-footer')
      .evaluate((element) => getComputedStyle(element).padding),
    '3px 7px',
  );
  assert.equal(
    await root
      .locator('.apollo-drawer-resizable-dragger')
      .evaluate((element) => getComputedStyle(element).width),
    '9px',
  );
  await page.evaluate(() => window.drawerState.focus());
  assert.equal(await root.evaluate((element) => element === document.activeElement), true);
  await page.locator('#drawer-last').focus();
  await page.keyboard.press('Tab');
  assert.equal(
    await root
      .locator('> .apollo-drawer-content-wrapper > .apollo-drawer-section .apollo-drawer-close')
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.locator('#drawer-outside').focus();
  assert.equal(await root.evaluate((element) => element.contains(document.activeElement)), true);

  const handle = root.locator(
    '> .apollo-drawer-content-wrapper > .apollo-drawer-resizable-dragger',
  );
  const box = await handle.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x - 120, box.y + 100);
  await page.mouse.up();
  assert.equal(await panel.evaluate((element) => getComputedStyle(element).width), '380px');
  assert.equal((await page.evaluate(() => window.drawerState.events())).resize, 380);
  const nextBox = await handle.boundingBox();
  assert.ok(nextBox);
  await page.mouse.move(nextBox.x + 2, nextBox.y + 100);
  await page.mouse.down();
  await page.evaluate(() => window.drawerState.patch('disable-resize'));
  await page.mouse.move(nextBox.x + 100, nextBox.y + 100);
  await page.mouse.up();
  assert.equal(await panel.evaluate((element) => getComputedStyle(element).width), '380px');

  await page.evaluate(() => window.drawerState.patch('first'));
  await page.evaluate(() => window.drawerState.patch('second'));
  await page.getByRole('dialog', { name: 'Second child', exact: true }).waitFor();
  assert.equal(
    await panel.evaluate((element) => element.style.transform),
    'translateX(calc(-25%))',
  );
  await page.keyboard.press('Escape');
  await page
    .getByRole('dialog', { name: 'Second child', exact: true })
    .waitFor({ state: 'hidden' });
  assert.equal(
    await panel.evaluate((element) => element.style.transform),
    'translateX(calc(-25%))',
  );
  assert.equal((await page.evaluate(() => window.drawerState.events())).closes.length, 0);
  await page.evaluate(() => window.drawerState.patch('first'));
  await page.getByRole('dialog', { name: 'First child', exact: true }).waitFor({ state: 'hidden' });
  assert.equal(await panel.evaluate((element) => element.style.transform), '');

  await page.locator('#drawer-editor').fill('business draft');
  await page.locator('#drawer-editor').focus();
  await page.locator('#drawer-editor').evaluate((element) => {
    window.originalEditor = element;
  });
  await page.evaluate(() => window.drawerState.patch('clear'));
  assert.equal(await root.evaluate((element) => getComputedStyle(element).zIndex), '1000');
  assert.equal(
    await root
      .locator('.apollo-drawer-footer')
      .evaluate((element) => getComputedStyle(element).padding),
    '8px 16px',
  );
  assert.equal(
    await root.evaluate((element) => element.classList.contains('provider-drawer')),
    false,
  );
  assert.equal(
    await page.evaluate(
      () =>
        document.getElementById('drawer-editor') === window.originalEditor &&
        document.activeElement === window.originalEditor &&
        window.originalEditor.value === 'business draft',
    ),
    true,
  );
  await page.keyboard.press('Escape');
  assert.equal(await root.count(), 1, 'leave animation retains the popup before completion');
  await root.waitFor({ state: 'detached' });
  assert.equal(
    await page.evaluate(() => document.activeElement === document.getElementById('drawer-trigger')),
    true,
  );
  assert.deepEqual(await page.evaluate(() => window.drawerState.events()), {
    completed: [true, false],
    closes: ['keydown'],
    once: 1,
    resize: 380,
  });

  await page.locator('#drawer-trigger').click();
  await page.waitForFunction(() => window.drawerState.events().completed.length === 3);
  await page.evaluate(() => window.drawerState.patch('no-restore'));
  await root
    .locator('> .apollo-drawer-content-wrapper > .apollo-drawer-section .apollo-drawer-close')
    .click();
  await root.waitFor({ state: 'detached' });
  assert.equal(
    await page.evaluate(() => document.activeElement === document.getElementById('drawer-trigger')),
    false,
  );
  assert.equal((await page.evaluate(() => window.drawerState.events())).once, 1);
  await page.locator('#drawer-trigger').click();
  await page.waitForFunction(() => window.drawerState.events().completed.length === 5);
  await page.evaluate(() => window.drawerState.patch('restore'));
  await page.evaluate(() => window.drawerState.patch('unmount'));
  await root.waitFor({ state: 'detached' });
  assert.equal(
    await page.evaluate(() => document.activeElement === document.getElementById('drawer-trigger')),
    true,
  );

  await page.getByRole('button', { name: 'Open themed drawer', exact: true }).click();
  const themed = page.getByRole('dialog', { name: 'Current component tokens', exact: true });
  await themed.waitFor();
  await themed.getByRole('button', { name: 'Override four tokens', exact: true }).click();
  assert.equal(
    await themed
      .locator('.apollo-drawer-footer')
      .evaluate((element) => getComputedStyle(element).padding),
    '20px 32px',
  );
  await themed.getByRole('button', { name: 'Close', exact: true }).click();
  await themed.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Open configured drawer', exact: true }).click();
  const configured = page.getByRole('dialog', {
    name: 'Current provider configuration',
    exact: true,
  });
  await configured.waitFor();
  assert.equal(
    await configured
      .locator('.apollo-drawer-body')
      .evaluate((element) => getComputedStyle(element).padding),
    '32px',
  );
  assert.equal(
    await configured.getByRole('button', { name: 'Dismiss drawer', exact: true }).count(),
    1,
  );
  await configured.getByRole('button', { name: 'Remove configuration', exact: true }).click();
  assert.equal(
    await configured
      .locator('.apollo-drawer-body')
      .evaluate((element) => getComputedStyle(element).padding),
    '24px',
  );
  assert.equal(await configured.getByRole('button', { name: 'Close', exact: true }).count(), 1);
  await configured.getByRole('button', { name: 'Close', exact: true }).click();
  await configured.waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  console.log(
    'Drawer source browser: real motion/destroy/focus, template refs/events, Tab trap, sibling push/Escape, resize cleanup, current theme/provider and both changed demos passed.',
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
