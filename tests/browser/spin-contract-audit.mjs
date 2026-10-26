import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-spin-contracts-'));
const results = [];
function check(name, actual, expected) {
  let passed = true;
  try {
    assert.deepEqual(actual, expected);
  } catch {
    passed = false;
  }
  results.push({ name, actual, expected, passed });
}
let browser;
let server;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'vue-reactivity.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(5000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const issues = [];
  page.on('pageerror', (error) => issues.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      issues.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=spin-contract-audit`);
  await page.locator('#token-normal').waitFor();
  const fontSize = (id) =>
    page
      .locator(`${id} .apollo-spin-dot-holder`)
      .first()
      .evaluate((node) => getComputedStyle(node).fontSize);
  for (const [id, expected] of [
    ['#token-normal', '31px'],
    ['#token-small', '13px'],
    ['#token-large', '47px'],
    ['#native-variable', '35px'],
    ['#nested-normal', '20px'],
  ])
    check(`${id} actual owned size`, await fontSize(id), expected);
  const height = async () =>
    (await page.locator('#token-height>.apollo-spin-section').boundingBox()).height;
  check('contentHeight caps the nested loading layer', await height(), 96);
  check(
    'contentHeight does not resize native body',
    (await page.locator('#token-height>.apollo-spin-container').boundingBox()).height,
    300,
  );
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
  check('theme removal restores native default size', await fontSize('#token-normal'), '20px');
  check('theme removal restores the loading area', await height(), 300);
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
  check('theme restoration uses the current override', await fontSize('#token-normal'), '31px');
  check(
    'empty indicator slot suppresses Provider content',
    await page.locator('#empty-indicator [data-provider-indicator]').count(),
    0,
  );
  check(
    'description prop starts visible',
    await page.locator('#current-description .apollo-spin-description').textContent(),
    'Prop description',
  );
  await page.getByRole('button', { name: 'Toggle empty description', exact: true }).click();
  check(
    'empty current description creates no wrapper',
    await page.locator('#current-description .apollo-spin-description').count(),
    0,
  );
  await page.getByRole('button', { name: 'Toggle empty description', exact: true }).click();
  check(
    'removed description slot restores prop',
    await page.locator('#current-description .apollo-spin-description').textContent(),
    'Prop description',
  );
  await page.getByRole('button', { name: 'Toggle named slots', exact: true }).click();
  check(
    'new native indicator slot keeps input',
    await page.getByRole('textbox', { name: 'Current indicator draft', exact: true }).count(),
    1,
  );
  check(
    'new native indicator slot keeps all nodes',
    await page.getByRole('button', { name: 'Custom action', exact: true }).count(),
    1,
  );
  const progress = page.getByRole('status', { name: 'Indicator progress', exact: true });
  check(
    'scope includes initial numeric zero',
    (await progress.count()) ? await progress.textContent() : null,
    '0',
  );
  await page.getByRole('button', { name: 'Update progress', exact: true }).click();
  check(
    'scope includes current progress',
    (await progress.count()) ? await progress.textContent() : null,
    '17',
  );
  await page.getByRole('button', { name: 'Toggle named slots', exact: true }).click();
  check(
    'removed indicator slot restores current Provider',
    await page.locator('#current-indicator [data-provider-indicator]').count(),
    1,
  );
  await page.getByRole('button', { name: 'Toggle body slot', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Conditional body draft', exact: true });
  check('late body slot creates its content container', await editor.count(), 1);
  if (await editor.count()) {
    await editor.fill('Preserved native draft');
    const original = await editor.elementHandle();
    await editor.focus();
    await page
      .getByRole('button', { name: 'Toggle fullscreen', exact: true })
      .evaluate((node) => node.click());
    check(
      'fullscreen keeps original body and focus',
      await original.evaluate(
        (node) =>
          node === document.querySelector('#conditional-body input') &&
          node === document.activeElement,
      ),
      true,
    );
    check('fullscreen preserves native model', await editor.inputValue(), 'Preserved native draft');
    await page
      .getByRole('button', { name: 'Toggle fullscreen', exact: true })
      .evaluate((node) => node.click());
  } else check('fullscreen native editor was available for identity checks', false, true);
  const emptyGeometry = await page.locator('#empty-body').evaluate((node) => {
    const first = node.querySelector('.apollo-spin-indicator').getBoundingClientRect();
    const last = node.querySelector('.apollo-spin-description').getBoundingClientRect();
    return {
      rootHeight: node.getBoundingClientRect().height,
      loadingContentHeight: last.bottom - first.top,
    };
  });
  check(
    'empty native body reserves room for actual loading content',
    emptyGeometry.rootHeight >= emptyGeometry.loadingContentHeight,
    true,
  );
  const runningAnimations = (id) =>
    page
      .locator(id)
      .evaluate(
        (node) =>
          node
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === 'running').length,
      );
  check(
    'theme motion=false stops library animations',
    await runningAnimations('#motion-disabled'),
    0,
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check(
    'reduced-motion preference stops library animations',
    await runningAnimations('#media-motion'),
    0,
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const zero = page.locator('#zero-progress [role="progressbar"]');
  check('explicit zero has a determinate progressbar', await zero.count(), 1);
  if (await zero.count())
    check(
      'explicit zero has actual accessible value',
      await zero.getAttribute('aria-valuenow'),
      '0',
    );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  check(
    'progress passes full browser axe',
    await page
      .locator('#zero-progress')
      .evaluate(async (node) => (await window.axe.run(node)).violations.map((issue) => issue.id)),
    [],
  );
  await page.getByRole('button', { name: 'Mount global zero', exact: true }).click();
  check(
    'global VNodeChild zero renders',
    await page.locator('#global-content').textContent(),
    '00',
  );
  await page.getByRole('button', { name: 'Replace global default', exact: true }).click();
  check(
    'global command waits for the next actual render',
    await page.locator('#global-content [data-global-indicator]').count(),
    0,
  );
  await page.getByRole('button', { name: 'Render global again', exact: true }).click();
  check(
    'next actual render reads current global default',
    await page.locator('#global-content [data-global-indicator]').count(),
    1,
  );
  check('no page or Vue errors', issues, []);
  const report = { browser: browser.version(), results, issues };
  writeFileSync(
    process.env.SPIN_CONTRACT_EVIDENCE ?? '/tmp/apollo-spin-browser.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
  assert.equal(results.filter((result) => !result.passed).length, 0);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
