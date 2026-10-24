/** Real server output and production motion in Chromium; appear remains enabled. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App from './fixtures/MotionHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-motion-hydration-'));
let server;
let browser;
try {
  const markup = await renderToString(createSSRApp(App));
  assert.match(markup, /data-ssr-motion/);
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'motion-hydration.html') },
    },
  });
  const htmlPath = path.join(outDir, 'motion-hydration.html');
  const html = readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    htmlPath,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div>
    <script>window.__ssrMotionNode = document.querySelector('[data-ssr-motion]'); window.__ssrMotionNode.value = 'typed before hydration';</script>`,
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
  await page.goto(`${server.resolvedUrls.local[0]}motion-hydration.html`);
  await page.waitForFunction(
    () => JSON.parse(document.querySelector('output').textContent).changed.length === 1,
  );
  assert.equal(
    await page.evaluate(
      () => document.querySelector('[data-ssr-motion]') === window.__ssrMotionNode,
    ),
    true,
  );
  assert.equal(
    await page.getByRole('textbox', { name: 'Hydrated input' }).inputValue(),
    'typed before hydration',
  );
  await page.getByRole('button', { name: 'Toggle motion' }).click();
  await page.waitForFunction(() => !document.querySelector('[data-ssr-motion]'));
  await page.getByRole('button', { name: 'Toggle motion' }).click();
  await page.waitForFunction(
    () => JSON.parse(document.querySelector('output').textContent).changed.length === 3,
  );
  assert.deepEqual(JSON.parse(await page.locator('output').textContent()), {
    phases: ['appear', 'leave', 'enter'],
    changed: [true, false, true],
  });
  assert.deepEqual(errors, []);
  console.log(
    `PASS motion SSR hydration: server node and typed DOM value preserved, appear/leave/enter enabled, notifications once, zero browser/Vue errors; ${await browser.version()}`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
