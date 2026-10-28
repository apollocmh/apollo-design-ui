/** All actual Grid demos, with source or frozen published JS+CSS. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-grid-demos-'));
const source = process.env.GRID_SOURCE === '1',
  results = [],
  errors = [];
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
      find: new RegExp(`^@apollo-design/${name}$`),
      replacement: path.join(repo, `packages/${name}/src/index.ts`),
    }))
  : [];
alias.push({
  find: /^vue$/,
  replacement: createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js'),
});
const check = async (name, run) => {
  try {
    const actual = await run();
    results.push({ name, passed: true, actual });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
  console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${name}`);
};
let browser, server;
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const styleEntry = source
    ? `import {genComponentStyleSheet} from '${path.join(repo, 'packages/ui/src/style/index.ts')}';const sheet=document.createElement('style');sheet.dataset.gridSourceStyles='';sheet.textContent=genComponentStyleSheet('grid');document.head.append(sheet);`
    : `import '@apollo-design/ui/grid/style.css';`;
  writeFileSync(
    path.join(temp, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Grid actual demos</title></head><body style="margin:0"><div id="app"></div><script type="module">import '@apollo-design/theme/tokens.css';${styleEntry}import {createApp} from 'vue';import Fixture from '${path.join(repo, 'tests/browser/fixtures/GridDemos.mjs')}';createApp(Fixture).mount('#app');</script></body></html>`,
  );
  const config = {
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias, dedupe: ['vue'] },
    build: { outDir: path.join(temp, 'out'), emptyOutDir: true },
  };
  await build(config);
  server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.gridDemoAudit));
  assert.equal(await page.locator('style[data-grid-source-styles]').count(), source ? 1 : 0);
  assert.equal(await page.locator('[data-grid-demo]').count(), 13);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const mode of ['light', 'dark', 'compact', 'both']) {
    await page.evaluate((mode) => window.gridDemoAudit.theme(mode), mode);
    for (const width of [400, 800, 1200]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await check(`13 real demos ${mode}/${width}px layout and contrast`, async () => {
        assert.deepEqual(
          await page.locator('main').evaluate(async (node) =>
            (await window.axe.run(node)).violations.map((v) => ({
              id: v.id,
              demos: [
                ...new Set(
                  v.nodes.map((n) =>
                    document
                      .querySelector(n.target[0])
                      ?.closest('[data-grid-demo]')
                      ?.getAttribute('data-grid-demo'),
                  ),
                ),
              ],
            })),
          ),
          [],
        );
        const overflow = await page
          .locator('[data-grid-demo]')
          .evaluateAll((nodes) =>
            nodes
              .filter((node) => node.scrollWidth > node.clientWidth + 1)
              .map((node) => node.getAttribute('data-grid-demo')),
          );
        assert.deepEqual(overflow, []);
        return { demos: 13, width, mode };
      });
    }
  }
  await check(
    'playground native ranges update zero/fractional gutters and column count',
    async () => {
      const playground = page.locator('[data-grid-demo="playground"]');
      const h = playground.getByRole('slider', { name: 'horizontal gutter', exact: true }),
        v = playground.getByRole('slider', { name: 'vertical gutter', exact: true }),
        count = playground.getByRole('slider', { name: 'col count', exact: true });
      await h.focus();
      await page.keyboard.press('Home');
      await v.focus();
      await page.keyboard.press('Home');
      assert.equal(
        await playground
          .locator('.apollo-row')
          .first()
          .evaluate((node) => getComputedStyle(node).rowGap),
        '0px',
      );
      assert.equal(
        await playground
          .locator('.apollo-col')
          .first()
          .evaluate((node) => getComputedStyle(node).paddingInlineStart),
        '0px',
      );
      await h.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await v.focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(
        await playground
          .locator('.apollo-col')
          .first()
          .evaluate((node) => getComputedStyle(node).paddingInlineStart),
        '5.25px',
      );
      assert.equal(
        await playground
          .locator('.apollo-row')
          .first()
          .evaluate((node) => getComputedStyle(node).rowGap),
        '7.5px',
      );
      await count.focus();
      await page.keyboard.press('Home');
      assert.equal(
        await playground.locator('.apollo-row').first().locator('.apollo-col').count(),
        2,
      );
      await page.keyboard.press('End');
      assert.equal(
        await playground.locator('.apollo-row').first().locator('.apollo-col').count(),
        12,
      );
    },
  );
  await check('zero real Demo runtime errors', async () => assert.deepEqual(errors, []));
  writeFileSync(
    process.env.GRID_DEMO_EVIDENCE ?? '/tmp/apollo-grid-demos.json',
    `${JSON.stringify({ source, browser: browser.version(), demos: 13, themeViewportCombinations: 12, results, errors }, null, 2)}\n`,
  );
  assert.ok(results.every((result) => result.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(temp, { recursive: true, force: true });
}
