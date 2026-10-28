import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  require = createRequire(import.meta.url),
  source = process.env.LAYOUT_SOURCE === '1';
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-layout-demos-')),
  results = [],
  errors = [],
  provenance = { runtimeSources: [] };
const evidence = process.env.LAYOUT_DEMOS_EVIDENCE ?? '/tmp/apollo-layout-demos.json';
const fingerprints = () =>
  Object.fromEntries(
    ['packages/ui/dist/index.mjs', 'packages/ui/dist/index.css'].map((file) => [
      file,
      createHash('sha256')
        .update(readFileSync(path.join(repo, file)))
        .digest('hex'),
    ]),
  );
const before = fingerprints(),
  demos = readdirSync(path.join(repo, 'packages/ui/src/layout/demo'))
    .filter((file) => file.endsWith('.vue'))
    .map((file) => file.slice(0, -4))
    .sort();
assert.equal(demos.length, 11);
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
  console.log((results.at(-1).passed ? 'PASS ' : 'FAIL ') + name);
};
let browser, server;
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const alias = source
    ? [
        'ui',
        'theme',
        'utils',
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
      ].map((name) => ({
        find: new RegExp('^@apollo-design/' + name + '$'),
        replacement: path.join(repo, 'packages/' + name + '/src/index.ts'),
      }))
    : [
        {
          find: /^@apollo-design\/icons$/,
          replacement: path.join(repo, 'packages/icons/dist/index.mjs'),
        },
      ];
  const styles = source
    ? "import {genAllStyles} from '" +
      path.join(repo, 'packages/ui/src/style/index.ts') +
      "';const sheet=document.createElement('style');sheet.dataset.layoutDemoSource='';sheet.textContent=genAllStyles();document.head.append(sheet);"
    : "import '@apollo-design/ui/style.css';";
  writeFileSync(
    path.join(temp, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Real Layout demos</title></head><body style="margin:0"><div id="app"></div><script type="module">import "@apollo-design/theme/tokens.css";' +
      styles +
      "import {createApp} from 'vue';import Fixture from '" +
      path.join(repo, 'tests/browser/fixtures/LayoutDemos.mjs') +
      "';createApp(Fixture).mount('#app');</script></body></html>",
  );
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [
      vue(),
      {
        name: 'published-layout-demo-provenance',
        generateBundle() {
          provenance.runtimeSources = [...this.getModuleIds()].filter(
            (id) => /\/packages\/[^/]+\/src\//.test(id) && !id.includes('/layout/demo/'),
          );
          if (!source) assert.deepEqual(provenance.runtimeSources, []);
        },
      },
    ],
    resolve: {
      alias: [
        ...alias,
        { find: /^vue$/, replacement: require.resolve('vue/dist/vue.runtime.esm-bundler.js') },
      ],
      dedupe: ['vue'],
    },
    build: { outDir: path.join(temp, 'out'), emptyOutDir: true },
  });
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'out') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  const settle = () =>
    page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => Number.isFinite(animation.effect?.getTiming().iterations ?? 1))
          .map((animation) => animation.finished.catch(() => {})),
      );
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  const open = async (demo, theme) => {
    await page.goto(server.resolvedUrls.local[0] + '?demo=' + demo + '&theme=' + theme);
    await page.waitForFunction(() => window.layoutDemoReady === true);
    await settle();
  };
  for (const theme of ['light', 'dark', 'compact', 'both'])
    for (const demo of demos)
      await check(demo + ' / ' + theme, async () => {
        await open(demo, theme);
        assert.ok((await page.locator('#layout-demo .apollo-layout').count()) > 0);
        assert.equal(await page.locator('#layout-demo .demo-menu').count(), 0);
        if (demo !== 'basic')
          assert.ok((await page.locator('#layout-demo .apollo-menu').count()) > 0);
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const violations = await page.evaluate(async () => {
          const roots = [...document.querySelectorAll('#layout-demo .apollo-layout')].filter(
            (node) => !node.parentElement.closest('.apollo-layout'),
          );
          const violations = [];
          for (const root of roots)
            violations.push(
              ...(await window.axe.run(root)).violations.map((v) => ({
                id: v.id,
                targets: v.nodes.map((n) => n.target),
              })),
            );
          return violations;
        });
        assert.deepEqual(violations, []);
        if (demo === 'basic') {
          assert.equal(await page.locator('main').count(), 1);
          await page.getByRole('checkbox', { name: 'Include sidebar' }).check();
          await settle();
          assert.equal(await page.locator('aside').count(), 1);
          assert.equal(await page.locator('main').count(), 1);
          await page.getByRole('checkbox', { name: 'Include sidebar' }).uncheck();
        }
        if (demo === 'custom-trigger') {
          const button = page.getByRole('button', { name: 'Collapse navigation' });
          await button.focus();
          await button.press('Enter');
          await settle();
          assert.equal(
            await page
              .locator('aside')
              .evaluate((node) => node.classList.contains('apollo-layout-sider-collapsed')),
            true,
          );
          assert.equal(await page.locator('.apollo-menu-inline-collapsed').count(), 1);
          await page.getByRole('button', { name: 'Expand navigation' }).press('Space');
          await settle();
          assert.equal(await page.locator('.apollo-menu-inline-collapsed').count(), 0);
        }
        if (demo === 'collapsible-overlay') {
          const trigger = page.locator('.apollo-layout-sider-zero-width-trigger');
          await trigger.focus();
          await trigger.press('Enter');
          await settle();
          assert.equal(
            await page.locator('.apollo-layout-sider-children').evaluate((node) => node.inert),
            true,
          );
          await trigger.press('Space');
          await settle();
          assert.equal(
            await page.locator('.apollo-layout-sider-children').evaluate((node) => node.inert),
            false,
          );
        }
        if (demo === 'component-token') {
          assert.equal(
            await page.locator('header').evaluate((node) => node.getBoundingClientRect().height),
            72,
          );
          await page.getByRole('button', { name: 'Use default tokens' }).click();
          await settle();
          assert.equal(
            await page.locator('header').evaluate((node) => node.getBoundingClientRect().height),
            theme === 'compact' || theme === 'both' ? 56 : 64,
          );
        }
        return {
          layouts: await page.locator('.apollo-layout').count(),
          menus: await page.locator('.apollo-menu').count(),
        };
      });
  for (const width of [375, 991, 1200])
    await check('responsive actual viewport ' + width, async () => {
      await page.setViewportSize({ width, height: 900 });
      await open('responsive', 'light');
      const below = width < 992;
      assert.equal(
        await page
          .locator('aside')
          .evaluate((node) => node.classList.contains('apollo-layout-sider-below')),
        below,
      );
      assert.equal(
        await page.locator('aside').evaluate((node) => node.getBoundingClientRect().width),
        below ? 0 : 180,
      );
      if (below) {
        const trigger = page.getByRole('button', { name: 'Expand sidebar' });
        await trigger.focus();
        await trigger.press('Enter');
        await settle();
        assert.equal(
          await page.locator('aside').evaluate((node) => node.getBoundingClientRect().width),
          180,
        );
        assert.ok(
          (await page.locator('#layout-demo').textContent()).includes('Source: clickTrigger'),
        );
      }
    });
  assert.deepEqual(fingerprints(), before);
  writeFileSync(
    evidence,
    JSON.stringify(
      {
        source,
        browser: browser.version(),
        demos,
        results,
        errors,
        provenance,
        before,
        after: fingerprints(),
        distUnchanged: true,
        readersExited: false,
      },
      null,
      2,
    ) + '\n',
  );
  if (errors.length || results.some((result) => !result.passed)) process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
  rmSync(temp, { recursive: true, force: true });
  try {
    const report = JSON.parse(readFileSync(evidence, 'utf8'));
    report.readersExited = true;
    writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n');
  } catch {}
}
