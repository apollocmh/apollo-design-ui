/** Verify Flex visual states without creating or accepting any baseline. */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { prepareFlexVisual } from '../visual/flex-state.mjs';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  temp = mkdtempSync(path.join(tmpdir(), 'apollo-flex-visual-'));
const source = process.env.FLEX_SOURCE === '1',
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
let browser, server;
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const style = source
    ? `import {genComponentStyleSheet} from '${path.join(repo, 'packages/ui/src/style/index.ts')}';const sheet=document.createElement('style');sheet.dataset.flexSourceStyles='';sheet.textContent=genComponentStyleSheet('flex');document.head.append(sheet);`
    : `import '@apollo-design/ui/flex/style.css';`;
  writeFileSync(
    path.join(temp, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Flex visual state verification</title></head><body style="margin:0"><div id="stage"></div><script type="module">import '@apollo-design/theme/tokens.css';${style}import {createApp} from 'vue';import cases from '${path.join(repo, 'tests/visual/render/cases/apollo/flex.js')}';window.flexVariants=Object.keys(cases);const variant=new URLSearchParams(location.search).get('variant')??'basic';createApp({render:()=>cases[variant]()}).mount('#stage');</script></body></html>`,
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
  const page = await browser.newPage({ viewport: { width: 400, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  const origin = server.resolvedUrls.local[0];
  await page.goto(origin, { waitUntil: 'networkidle' });
  const variants = await page.evaluate(() => window.flexVariants);
  assert.equal(variants.length, 14);
  for (const width of [400, 800, 1200]) {
    await page.setViewportSize({ width, height: 900 });
    for (const variant of variants) {
      await page.goto(`${origin}?variant=${variant}`, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('style[data-flex-source-styles]').count(), source ? 1 : 0);
      try {
        const state = await prepareFlexVisual(page, variant);
        if (process.env.FLEX_VISUAL_SCREENSHOTS) {
          mkdirSync(process.env.FLEX_VISUAL_SCREENSHOTS, { recursive: true });
          await page.screenshot({
            path: path.join(process.env.FLEX_VISUAL_SCREENSHOTS, `${variant}-${width}.png`),
            fullPage: true,
          });
        }
        results.push({ width, variant, state, passed: true });
      } catch (error) {
        results.push({ width, variant, error: error.message, passed: false });
      }
      console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${variant}/${width}`);
    }
  }
  writeFileSync(
    process.env.FLEX_VISUAL_EVIDENCE ?? '/tmp/apollo-flex-visual-states.json',
    `${JSON.stringify({ source, browser: browser.version(), baselineProduced: false, results, errors }, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((result) => result.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(temp, { recursive: true, force: true });
}
