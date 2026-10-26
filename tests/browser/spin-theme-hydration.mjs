/** Production SSR, native editor identity and live source-theme hydration. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App from './fixtures/SpinThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-spin-theme-hydration-'));
const checks = [];
let server;
let browser;
try {
  const markup = await renderToString(createSSRApp(App));
  assert.match(markup, /aria-valuenow="0"/);
  assert.match(markup, /--apollo-spin-dot-size:31px/);
  checks.push('server outputs determinate zero and current source tokens');
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'spin-theme-hydration.html') },
    },
  });
  const htmlPath = path.join(outDir, 'spin-theme-hydration.html');
  const html = readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    htmlPath,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div>
  <script>
    window.__spinServerNodes = {};
    for (const id of ['hydrated-spin', 'hydrated-custom', 'hydrated-spin-draft', 'hydrated-indicator-draft']) window.__spinServerNodes[id] = document.getElementById(id);
    window.__spinServerProgress = document.querySelector('#hydrated-spin [role="progressbar"]');
    window.__spinServerNodes['hydrated-spin-draft'].value = 'typed before hydration';
    window.__spinServerNodes['hydrated-indicator-draft'].value = 'indicator before hydration';
    window.__spinServerNodes['hydrated-spin-draft'].focus();
    window.__spinServerNodes['hydrated-spin-draft'].setSelectionRange(2,5);
  </script>`,
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
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}spin-theme-hydration.html`);
  await page.waitForFunction(() => window.__spinThemeHydrated === true);
  const body = page.locator('#hydrated-spin-draft');
  const indicator = page.locator('#hydrated-indicator-draft');
  const identity = async () =>
    assert.equal(
      await page.evaluate(
        () =>
          Object.entries(window.__spinServerNodes).every(
            ([id, node]) => node === document.getElementById(id),
          ) &&
          window.__spinServerProgress ===
            document.querySelector('#hydrated-spin [role="progressbar"]'),
      ),
      true,
    );
  const focused = async (editor) => {
    assert.equal(await editor.evaluate((node) => node === document.activeElement), true);
    assert.deepEqual(
      await editor.evaluate((node) => [node.selectionStart, node.selectionEnd]),
      [2, 5],
    );
  };
  await identity();
  await focused(body);
  assert.equal(await body.inputValue(), 'typed before hydration');
  assert.equal(await indicator.inputValue(), 'indicator before hydration');
  assert.equal(await page.locator('#hydrated-indeterminate [role="progressbar"]').count(), 0);
  assert.equal(await page.locator('#hydrated-idle .apollo-spin-mask').getAttribute('inert'), '');
  checks.push(
    'hydration retains both server editors, progress node, draft, selection and focus; indeterminate and idle instances stay independent',
  );
  for (const size of ['20px', '27px', '31px']) {
    await page.getByRole('button', { name: 'Cycle theme', exact: true }).click();
    await page.waitForFunction(
      (size) =>
        getComputedStyle(document.querySelector('#hydrated-spin .apollo-spin-dot-holder'))
          .fontSize === size,
      size,
    );
    await identity();
    await focused(body);
  }
  checks.push('source theme removal and restoration preserve server nodes and focus');
  await page.getByRole('button', { name: 'Update progress', exact: true }).click();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '37');
  assert.equal(
    await page.getByRole('status', { name: 'Hydrated custom progress' }).textContent(),
    '37',
  );
  await identity();
  checks.push('current percent updates both original progressbar and complete scoped indicator');
  for (const editor of [body, indicator]) {
    await editor.focus();
    await editor.evaluate((node) => node.setSelectionRange(2, 5));
    for (let count = 0; count < 4; count++) {
      await page
        .getByRole('button', { name: 'Toggle fullscreen', exact: true })
        .evaluate((node) => node.click());
      await identity();
      await focused(editor);
    }
  }
  assert.equal(await body.inputValue(), 'typed before hydration');
  assert.equal(await indicator.inputValue(), 'indicator before hydration');
  checks.push(
    'repeated fullscreen switches keep body and indicator editor identity, focus, selection and values',
  );
  await page.getByRole('button', { name: 'Toggle loading', exact: true }).click();
  assert.equal(await page.locator('#hydrated-spin').getAttribute('aria-busy'), 'false');
  assert.equal(await body.evaluate((node) => node === window.__spinServerNodes[node.id]), true);
  await page.getByRole('button', { name: 'Toggle loading', exact: true }).click();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '37');
  assert.equal(await body.inputValue(), 'typed before hydration');
  checks.push('repeated loading retains native body and restores current determinate value');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const transitions = await page
    .locator('#hydrated-spin')
    .evaluate((node) => [
      getComputedStyle(node.querySelector('.apollo-spin-container')).transitionDuration,
      getComputedStyle(node.querySelector('.apollo-spin-container'), '::after').transitionDuration,
      getComputedStyle(node.querySelector('.apollo-spin-dot-holder')).transitionDuration,
      getComputedStyle(node.querySelector('.apollo-spin-dot-circle')).transitionDuration,
    ]);
  assert.ok(
    transitions.every((value) =>
      value.split(',').every((duration) => Number.parseFloat(duration) === 0),
    ),
    `reduced motion must disable owned transitions: ${JSON.stringify(transitions)}`,
  );
  checks.push('system reduced motion disables owned body, cover, dot and progress transitions');
  assert.deepEqual(errors, []);
  const report = { browser: browser.version(), checks, errors };
  writeFileSync(
    process.env.SPIN_HYDRATION_EVIDENCE ?? '/tmp/apollo-spin-hydration.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
