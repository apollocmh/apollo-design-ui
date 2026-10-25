/** Native overlay style forms and semantic routing against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-overlay-attrs-'));
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=overlay-attrs`);
  const selectors = [
    '.native-tooltip-panel',
    '.native-popover-panel',
    '.native-confirm-panel',
    '.native-popover',
    '.native-confirm',
  ];
  const roots = [];
  for (const selector of selectors) {
    const locator = page.locator(selector);
    await locator.waitFor();
    roots.push(await locator.elementHandle());
    assert.equal(await locator.evaluate((node) => getComputedStyle(node).maxWidth), '310px');
    assert.equal(await locator.evaluate((node) => node.style.minHeight), '70px');
    assert.equal(await locator.evaluate((node) => node.style.paddingTop), '9px');
    assert.equal(
      await locator.evaluate((node) => node.style.getPropertyValue('--native-phase')),
      'first',
    );
    assert.equal(await locator.evaluate((node) => node.classList.contains('first')), true);
  }
  assert.equal(
    await page.locator('.native-confirm-container').evaluate((node) => node.style.borderRadius),
    '14px',
  );
  for (const selector of [
    '.native-popover-panel .apollo-popover-container',
    '.native-confirm-container',
  ]) {
    assert.equal(await page.locator(selector).evaluate((node) => node.style.paddingTop), '6px');
    assert.equal(await page.locator(selector).evaluate((node) => node.style.maxWidth), '');
    assert.equal(
      await page
        .locator(selector)
        .evaluate((node) => node.style.getPropertyValue('--native-phase')),
      '',
    );
  }
  assert.equal(
    await page.locator('.native-confirm-arrow').evaluate((node) => node.style.opacity),
    '0.4',
  );
  const input = page.getByRole('textbox', { name: 'Attrs popup note', exact: true });
  await input.fill('kept across attrs');
  const originalInput = await input.elementHandle();
  await page.getByRole('button', { name: 'Cycle native overlay attrs', exact: true }).click();
  for (const [index, selector] of selectors.entries()) {
    const locator = page.locator(selector);
    assert.equal(await locator.evaluate((node, original) => node === original, roots[index]), true);
    assert.equal(await locator.evaluate((node) => node.style.maxWidth), '340px');
    assert.equal(await locator.evaluate((node) => node.style.paddingTop), '');
    assert.equal(await locator.evaluate((node) => node.style.paddingBottom), '10px');
    assert.equal(await locator.evaluate((node) => node.classList.contains('first')), false);
    assert.equal(await locator.evaluate((node) => node.classList.contains('next')), true);
  }
  await page.getByRole('button', { name: 'Cycle native overlay attrs', exact: true }).click();
  for (const selector of selectors) {
    const locator = page.locator(selector);
    assert.equal(await locator.evaluate((node) => node.style.maxWidth), '220px');
    assert.equal(await locator.evaluate((node) => node.style.minHeight), '70px');
    assert.equal(await locator.evaluate((node) => node.style.paddingBottom), '');
    assert.equal(
      await locator.evaluate((node) => node.style.getPropertyValue('--native-phase')),
      '',
    );
  }
  assert.equal(await input.inputValue(), 'kept across attrs');
  assert.equal(await input.evaluate((node, original) => node === original, originalInput), true);
  for (const selector of ['[data-native-popover-trigger]', '[data-native-confirm-trigger]']) {
    assert.equal(await page.locator(selector).evaluate((node) => node.style.maxWidth), '');
    assert.equal(
      await page.locator(selector).evaluate((node) => node.classList.contains('native-attrs')),
      false,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: five native overlay roots, string/array/object/removed CSS, semantic fallback/arrow routing, stable roots/input, no trigger pollution and zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
