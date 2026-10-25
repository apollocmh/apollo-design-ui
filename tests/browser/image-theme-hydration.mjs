/** Node SSR and production Image/ConfigProvider hydration with current theme state. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App from './fixtures/ImageThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-theme-hydration-'));
let server;
let browser;
try {
  const markup = await renderToString(createSSRApp(App));
  assert.match(markup, /data-theme-hydration-draft/);
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'image-theme-hydration.html') },
    },
  });
  const htmlPath = path.join(outDir, 'image-theme-hydration.html');
  const html = readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    htmlPath,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div>
    <script>window.__ssrImageThemeDraft = document.querySelector('[data-theme-hydration-draft]'); window.__ssrImageThemeDraft.value = 'typed before hydration'; window.__ssrImageThemeDraft.focus(); window.__ssrImageThemeDraft.setSelectionRange(2,5);</script>`,
    ),
  );
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}image-theme-hydration.html`);
  await page.waitForFunction(() => window.__imageThemeHydrated === true);
  const draft = page.getByRole('textbox', { name: 'Hydrated theme draft', exact: true });
  assert.equal(await draft.inputValue(), 'typed before hydration');
  assert.equal(await draft.evaluate((node) => node === window.__ssrImageThemeDraft), true);
  assert.equal(await draft.evaluate((node) => node.ownerDocument.activeElement === node), true);
  assert.deepEqual(
    await draft.evaluate((node) => [node.selectionStart, node.selectionEnd]),
    [2, 5],
  );
  for (const target of ['image', 'group']) {
    await page.locator(`[data-hydrated-${target}]`).click({ position: { x: 6, y: 6 } });
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    const root = await dialog.elementHandle();
    const editor = dialog.getByRole('textbox', { name: 'Hydrated preview note', exact: true });
    await editor.fill('Kept hydrated preview draft');
    await editor.evaluate((node) => node.setSelectionRange(2, 5));
    const originalEditor = await editor.elementHandle();
    for (const size of ['18px', '27px', '31px']) {
      await page.getByRole('button', { name: 'Cycle hydrated theme', exact: true }).click();
      assert.equal(await dialog.evaluate((node, original) => node === original, root), true);
      assert.equal(
        await editor.evaluate((node, original) => node === original, originalEditor),
        true,
      );
      assert.equal(await editor.inputValue(), 'Kept hydrated preview draft');
      assert.equal(
        await editor.evaluate((node) => node.ownerDocument.activeElement === node),
        true,
      );
      assert.deepEqual(
        await editor.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [2, 5],
      );
      await page.waitForFunction(
        (size) =>
          getComputedStyle(document.querySelector('[role="dialog"] .apollo-image-preview-close'))
            .fontSize === size,
        size,
      );
      assert.equal(
        await dialog
          .locator('.apollo-image-preview-close')
          .evaluate((node) => getComputedStyle(node).fontSize),
        size,
      );
    }
    await dialog.getByRole('button', { name: 'Close preview', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS Image/Group source theme SSR hydration, server editor/selection/focus, live theme removal/restoration with stable previews and drafts, zero browser/Vue errors; ${await browser.version()}`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
