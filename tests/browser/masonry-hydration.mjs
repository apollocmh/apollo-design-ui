/** Real SSR grid and production Masonry hydration; no client source aliases. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App from './fixtures/MasonryHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-masonry-hydration-'));
let server;
let browser;
try {
  const markup = await renderToString(createSSRApp(App));
  assert.match(markup, /<b>Alpha<\/b>/);
  assert.match(markup, /display:grid/);
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'masonry-hydration.html') },
    },
  });
  const htmlPath = path.join(outDir, 'masonry-hydration.html');
  const html = readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    htmlPath,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div>
    <script>window.__ssrMasonryInput = document.querySelector('[data-hydrated-masonry-input]'); window.__ssrMasonryInput.value = 'typed before hydration'; window.__ssrMasonryItem = document.querySelector('.apollo-masonry-item');</script>`,
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
  const url = `${server.resolvedUrls.local[0]}masonry-hydration.html`;
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(url);
  const before = await staticPage.locator('.apollo-masonry-item').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, height: rect.height, width: rect.width };
    }),
  );
  assert.equal(before.length, 3);
  assert.equal(before[0].height, 40);
  assert.equal(before[1].height, 80);
  assert.ok(before[1].x > before[0].x);
  assert.ok(before[2].y >= before[1].y + before[1].height + 12);
  assert.ok(
    (await staticPage
      .locator('[data-ssr-masonry]')
      .evaluate((node) => node.getBoundingClientRect().height)) > 0,
  );
  await staticContext.close();
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
  await page.goto(url);
  await page.waitForFunction(
    () => document.querySelector('#ssr-masonry-state').textContent === '1',
  );
  const input = page.getByRole('textbox', { name: 'Hydrated masonry input', exact: true });
  assert.equal(await input.inputValue(), 'typed before hydration');
  assert.equal(
    await page.evaluate(
      () => document.querySelector('[data-hydrated-masonry-input]') === window.__ssrMasonryInput,
    ),
    true,
  );
  assert.equal(
    await page.evaluate(
      () => document.querySelector('.apollo-masonry-item') === window.__ssrMasonryItem,
    ),
    true,
  );
  const tiles = page.locator('.apollo-masonry-item');
  assert.equal(await tiles.nth(2).evaluate((node) => node.style.top), '52px');
  assert.equal(
    await page.locator('[data-ssr-masonry]').evaluate((node) => node.style.height),
    '80px',
  );
  await page.getByRole('button', { name: 'Update hydrated data', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('article b').textContent === 'Updated');
  assert.equal(await input.inputValue(), 'typed before hydration');
  assert.equal(
    await page.evaluate(
      () => document.querySelector('[data-hydrated-masonry-input]') === window.__ssrMasonryInput,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS Masonry SSR: visible non-overlapping grid without JavaScript, measured layout after hydration, server item/input identity and typed value preserved, current data updates, zero browser/Vue errors; ${await browser.version()}`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
