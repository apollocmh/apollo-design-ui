/** Default gallery counter contrast in production CSS, including the public demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import axe from 'axe-core';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-counter-'));
let server;
let browser;
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-counter-contrast`);
  await page.addScriptTag({ content: axe.source });
  const fixture = page.locator('[data-image-counter-fixture]');
  const controls = fixture.locator('[data-image-counter-controls]');
  const click = (name) => controls.getByRole('button', { name, exact: true }).click();
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-counter-state]').textContent());
  const dialog = () => page.getByRole('dialog');
  const action = (name) => dialog().getByRole('button', { name, exact: true });
  const open = async (opener) => {
    await opener.click({ position: { x: 6, y: 6 } });
    await dialog().waitFor({ state: 'visible' });
    const node = await dialog().elementHandle();
    await page.waitForFunction((node) => node && getComputedStyle(node).opacity === '1', node);
    await page.waitForFunction(() => {
      const node = document.querySelector('[role="dialog"] img');
      return node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0;
    });
  };
  const results = [];
  const scan = async (label) => {
    const result = await dialog().evaluate(async (node) => {
      const result = await window.axe.run(node);
      return {
        violations: result.violations.map((entry) => ({
          id: entry.id,
          nodes: entry.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
        })),
        incompleteCounter: result.incomplete
          .filter((entry) => entry.id === 'color-contrast')
          .flatMap((entry) => entry.nodes.filter((node) => node.html.includes('<bdi'))),
        counterChecks: result.passes
          .filter((entry) => entry.id === 'color-contrast')
          .flatMap((entry) =>
            entry.nodes
              .filter((node) => node.html.includes('<bdi'))
              .flatMap((node) => node.any.map((check) => check.data)),
          ),
      };
    });
    results.push({ label, ...result });
  };
  const opener = fixture.locator('[data-counter-trigger="1"]');
  await open(opener);
  const originalCounter = await dialog().locator('.apollo-image-preview-progress').elementHandle();
  for (const theme of ['light', 'dark', 'compact', 'dark-compact']) {
    await click(`Use ${theme} theme`);
    await page.waitForFunction(
      (theme) =>
        JSON.parse(document.querySelector('[data-image-counter-state]').textContent).theme ===
        theme,
      theme,
    );
    assert.equal(
      await dialog()
        .locator('.apollo-image-preview-progress')
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      theme.includes('dark') ? 'rgb(66, 66, 66)' : 'rgba(0, 0, 0, 0.85)',
      'the real counter consumes the selected global theme',
    );
    for (const background of ['white', 'black']) {
      await page.evaluate((color) => {
        document.body.style.backgroundColor = color;
      }, background);
      for (const mask of [true, false]) {
        if ((await state()).mask !== mask) await click('Toggle counter mask');
        await page.waitForFunction(
          (mask) =>
            JSON.parse(document.querySelector('[data-image-counter-state]').textContent).mask ===
            mask,
          mask,
        );
        assert.equal(await dialog().locator('.apollo-image-preview-mask').isVisible(), mask);
        assert.equal(
          await dialog()
            .locator('.apollo-image-preview-progress')
            .evaluate((node, original) => node === original, originalCounter),
          true,
        );
        assert.equal(await dialog().locator('bdi').textContent(), '1 / 3');
        await scan(`${theme}/${background}/mask=${mask}`);
      }
    }
  }
  await action('Next image').click();
  assert.equal(await dialog().locator('bdi').textContent(), '2 / 3');
  await action('Close preview').click();
  await dialog().waitFor({ state: 'hidden' });
  assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  for (const theme of ['light', 'dark']) {
    await click(`Use ${theme} theme`);
    for (const background of ['white', 'black']) {
      await page.evaluate((color) => {
        document.body.style.backgroundColor = color;
      }, background);
      const demoOpener = fixture.locator('[data-image-counter-demo] .apollo-image').first();
      await open(demoOpener);
      assert.equal(await dialog().locator('bdi').textContent(), '1 / 3');
      await scan(`actual-demo/${theme}/${background}`);
      await action('Close preview').click();
      await dialog().waitFor({ state: 'hidden' });
    }
  }
  console.log(JSON.stringify(results, null, 2));
  assert.deepEqual(
    results.filter(
      (entry) =>
        entry.violations.length || entry.incompleteCounter.length || !entry.counterChecks.length,
    ),
    [],
    'every real default counter passes full axe with an evaluated contrast check',
  );
  assert.deepEqual(errors, [], 'no Vue warnings, console or page errors');
  console.log(
    `PASS Chrome ${browser.version()}: 16 light/dark/compact/background/mask combinations and four actual public demo contexts, full axe without exclusions, live counter identity, navigation and focus return.`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
