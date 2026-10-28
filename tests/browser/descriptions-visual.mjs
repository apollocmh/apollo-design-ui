/** Focused preflight of this unit's native visual states; formal captures remain with apollo.mjs. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { prepareDescriptionsVisual } from '../visual/descriptions-state.mjs';
import { launchBrowser } from '../visual/stabilize.mjs';
import { descriptionsAssets, descriptionsRepo as repo } from './descriptions-assets.mjs';

const assets = descriptionsAssets();
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-descriptions-visual-'));
symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
writeFileSync(
  path.join(temp, 'index.html'),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Descriptions native visual preflight</title></head><body style="margin:0"><div id="app"></div><script type="module">${assets.entry}import {createApp,h,nextTick} from 'vue';import cases from '${path.join(repo, 'tests/visual/render/cases/apollo/descriptions.js')}';const variant=new URLSearchParams(location.search).get('variant')??'basic';createApp({render:()=>h('div',{id:'stage'},[cases[variant]()])}).mount('#app');await nextTick();window.descriptionsVisualCases=Object.keys(cases);window.__DESCRIPTIONS_VISUAL_READY__=true;</script></body></html>`,
);
const results = [],
  errors = [];
let browser, server;
try {
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), assets.plugin],
    resolve: { alias: [...assets.alias, { find: 'vue', replacement: assets.vue }] },
    build: { outDir: path.join(temp, 'out') },
  });
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'out') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  const url = server.resolvedUrls.local[0];
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__DESCRIPTIONS_VISUAL_READY__);
  const variants = await page.evaluate(() => window.descriptionsVisualCases);
  assert.equal(variants.length, 17);
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 960 });
    for (const variant of variants) {
      try {
        await page.goto(`${url}?variant=${variant}`, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.__DESCRIPTIONS_VISUAL_READY__);
        assert.equal(
          await page.locator('style[data-descriptions-source-styles]').count(),
          assets.source ? 1 : 0,
        );
        const state = await prepareDescriptionsVisual(page, variant);
        results.push({ variant, width, passed: true, state });
        if (
          width === 768 &&
          ['current-geometry', 'empty-slots', 'theme-dark', 'semantic-tokens'].includes(variant)
        ) {
          await page.screenshot({
            path: `/tmp/apollo-descriptions-${assets.source ? 'source' : 'published'}-${variant}.png`,
            fullPage: true,
          });
        }
        console.log(`PASS ${variant}/${width}`);
      } catch (error) {
        results.push({ variant, width, passed: false, error: error.message });
        console.log(`FAIL ${variant}/${width}: ${error.message}`);
      }
    }
  }
  writeFileSync(
    process.env.DESCRIPTIONS_VISUAL_EVIDENCE ??
      `/tmp/apollo-descriptions-${assets.source ? 'source' : 'published'}-visual-preflight.json`,
    `${JSON.stringify({ browser: browser.version(), formalBaselineAcceptance: false, assets: assets.evidence(), results, errors }, null, 2)}\n`,
  );
  console.log(
    `Descriptions visual preflight: ${results.filter((r) => r.passed).length}/${results.length}; errors ${errors.length}`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(temp, { recursive: true, force: true });
}
