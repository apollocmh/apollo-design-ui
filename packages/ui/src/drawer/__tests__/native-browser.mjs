/** Source-only check: node packages/ui/src/drawer/__tests__/native-browser.mjs */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const started = performance.now();
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
import {createApp,defineComponent,h,nextTick,ref} from 'vue';
import {darkAlgorithm,getDesignToken,transformToken} from '@apollo-design/theme';
import ConfigProvider from '/@fs${repo}/packages/ui/src/config-provider/ConfigProvider.ts';
import Fixture from '/@fs${repo}/packages/ui/src/drawer/__tests__/fixtures/NativeDrawer.vue';
import TokenDemo from '/@fs${repo}/packages/ui/src/drawer/demo/component-token.vue';
import ConfigDemo from '/@fs${repo}/packages/ui/src/drawer/demo/config-provider.vue';
import FormDemo from '/@fs${repo}/packages/ui/src/drawer/demo/form-in-drawer.vue';
import ProfileDemo from '/@fs${repo}/packages/ui/src/drawer/demo/user-profile.vue';
import {genDrawerStyle} from '/@fs${repo}/packages/ui/src/drawer/style/index.ts';
import {genButtonStyle} from '/@fs${repo}/packages/ui/src/button/style/index.ts';
import {genFormStyle} from '/@fs${repo}/packages/ui/src/form/style/index.ts';
import {genInputStyle} from '/@fs${repo}/packages/ui/src/input/style/index.ts';
import {genAlertStyle} from '/@fs${repo}/packages/ui/src/alert/style/index.ts';
import {genAvatarStyle} from '/@fs${repo}/packages/ui/src/avatar/style/index.ts';
import {genDescriptionsStyle} from '/@fs${repo}/packages/ui/src/descriptions/style/index.ts';
import {genDividerStyle} from '/@fs${repo}/packages/ui/src/divider/style/index.ts';
for(const [key,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(key,value);
const css=document.createElement('style');css.textContent=[genDrawerStyle(),genButtonStyle('apollo'),genFormStyle('apollo'),genInputStyle(),genAlertStyle('apollo'),genAvatarStyle('apollo'),genDescriptionsStyle('apollo'),genDividerStyle('apollo')].join(String.fromCharCode(10));document.head.append(css);
const component=ref(null),dark=ref(false);
createApp(defineComponent({setup:()=>()=>[
  h(Fixture,{ref:component}),
  h('section',{id:'demos'},[h(TokenDemo),h(ConfigDemo)]),
  h(ConfigProvider,{theme:dark.value?{algorithm:darkAlgorithm}:undefined},()=>[
    h('section',{id:'form-scene'},[h(FormDemo)]),
    h('section',{id:'profile-scene'},[h(ProfileDemo)])
  ])
]})).mount('#app');
window.drawerState={patch:kind=>component.value.patch(kind),focus:()=>component.value.focus(),refValid:()=>component.value.refValid(),events:()=>component.value.events()};
window.drawerScenes={async theme(value){dark.value=value;await nextTick()}};
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
  await page.addInitScript(() => {
    window.drawerErrors = [];
    window.addEventListener('error', (event) => window.drawerErrors.push(event.message));
    window.addEventListener('unhandledrejection', (event) =>
      window.drawerErrors.push(String(event.reason)),
    );
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
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
  const scenes = [];
  const formTrigger = page
    .locator('#form-scene')
    .getByRole('button', { name: '新建联系人', exact: true });
  const formPanel = page.getByRole('dialog', { name: '新建联系人', exact: true });
  const profileTrigger = page
    .locator('#profile-scene')
    .getByRole('button', { name: '查看用户资料', exact: true });
  const profilePanel = page.getByRole('dialog', { name: '用户资料', exact: true });
  const waitForSceneReady = async (dialog) => {
    await page.waitForFunction(
      (element) => {
        const root = element.closest('.apollo-drawer');
        const moving = [...root.querySelectorAll('[class]')].some((node) =>
          [...node.classList].some(
            (name) =>
              name.startsWith('apollo-drawer-panel-motion-') ||
              name.startsWith('apollo-drawer-mask-motion-'),
          ),
        );
        return (
          !moving &&
          root
            .getAnimations({ subtree: true })
            .every((animation) => animation.playState !== 'running' && !animation.pending)
        );
      },
      await dialog.elementHandle(),
    );
  };
  for (const dark of [false, true]) {
    const theme = dark ? 'dark' : 'light';
    await page.evaluate((value) => window.drawerScenes.theme(value), dark);
    await formTrigger.click();
    await formPanel.waitFor({ state: 'visible' });
    const name = formPanel.getByRole('textbox', { name: '姓名', exact: true });
    const email = formPanel.getByRole('textbox', { name: '邮箱', exact: true });
    const submit = formPanel.getByRole('button', { name: '提交', exact: true });
    assert.equal(
      await submit.evaluate(
        (button) => button.form === button.closest('[role="dialog"]').querySelector('form'),
      ),
      true,
    );
    await submit.click();
    await formPanel.getByText('请输入姓名', { exact: true }).waitFor();
    await formPanel.getByText('请输入邮箱', { exact: true }).waitFor();
    await name.fill('林晓');
    await email.fill('invalid');
    await submit.click();
    await formPanel.getByText('请输入有效的邮箱地址', { exact: true }).waitFor();
    await waitForSceneReady(formPanel);
    const formBounds = await formPanel.locator('..').boundingBox();
    assert.equal(formBounds.width, 520);
    await page.screenshot({ path: `/tmp/apollo-issue78-form-${theme}.png` });
    await formPanel.getByRole('button', { name: '取消', exact: true }).click();
    await formPanel.waitFor({ state: 'hidden' });
    await formTrigger.click();
    await formPanel.waitFor({ state: 'visible' });
    assert.equal(await name.inputValue(), '');
    assert.equal(await email.inputValue(), '');
    assert.equal(await formPanel.locator('.apollo-form-item-explain-error').count(), 0);
    await name.fill('林晓');
    await email.fill('lin@example.com');
    await submit.click();
    await formPanel.waitFor({ state: 'hidden' });
    const feedback = page.locator('#form-scene .apollo-alert');
    await feedback.waitFor({ state: 'visible' });
    assert.equal(await feedback.count(), 1);
    assert.ok((await feedback.textContent()).includes('lin@example.com'));
    await formTrigger.click();
    await formPanel.waitFor({ state: 'visible' });
    assert.equal(await name.inputValue(), '');
    assert.equal(await feedback.count(), 0);
    await formPanel.getByRole('button', { name: 'Close', exact: true }).click();
    await formPanel.waitFor({ state: 'hidden' });
    await profileTrigger.click();
    await profilePanel.waitFor({ state: 'visible' });
    assert.equal(await profilePanel.locator('.apollo-descriptions').count(), 2);
    assert.ok((await profilePanel.textContent()).includes('lin@example.com'));
    assert.ok((await profilePanel.textContent()).includes('产品设计师'));
    await waitForSceneReady(profilePanel);
    const profileBounds = await profilePanel.locator('..').boundingBox();
    assert.equal(profileBounds.width, 520);
    await page.screenshot({ path: `/tmp/apollo-issue78-profile-${theme}.png` });
    await profilePanel.getByRole('button', { name: '关闭资料', exact: true }).click();
    await profilePanel.waitFor({ state: 'hidden' });
    await profileTrigger.click();
    await profilePanel.waitFor({ state: 'visible' });
    assert.ok((await profilePanel.textContent()).includes('lin@example.com'));
    await profilePanel.getByRole('button', { name: 'Close', exact: true }).click();
    await profilePanel.waitFor({ state: 'hidden' });
    scenes.push({ theme, formBounds, profileBounds });
  }
  await page.setViewportSize({ width: 375, height: 667 });
  for (const [trigger, dialog, closeLabel] of [
    [formTrigger, formPanel, '取消'],
    [profileTrigger, profilePanel, '关闭资料'],
  ]) {
    await trigger.click();
    await dialog.waitFor({ state: 'visible' });
    await waitForSceneReady(dialog);
    const bounds = await dialog.locator('..').boundingBox();
    assert.equal(bounds.width, 375);
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 375);
    await dialog.getByRole('button', { name: closeLabel, exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
  errors.push(...(await page.evaluate(() => window.drawerErrors)));
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      durationMs: Math.round(performance.now() - started),
      errors,
      scenes,
      checks: [
        'original motion/destroy/focus/ref/Tab/push/resize/provider/token contracts retained',
        'form required/email validation, native footer submit, local feedback, clean cancel/reopen',
        'profile details and close/reopen',
        'light/dark actual screenshots',
        '375px viewport bounds',
      ],
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
