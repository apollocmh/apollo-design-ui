import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App from './fixtures/QRCodeThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-qrcode-hydration-'));
const checks = [];
let server, browser;
try {
  const markup = await renderToString(createSSRApp(App));
  assert.ok(markup.includes('aria-label="Hydrated access"'));
  assert.ok(markup.includes('--apollo-qrcode-cover-background-color:#e8f4ec'));
  checks.push('server outputs current source theme, named graphics and complete native status');
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'qrcode-theme-hydration.html') },
    },
  });
  const htmlPath = path.join(outDir, 'qrcode-theme-hydration.html');
  const html = readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    htmlPath,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><script>window.__qrServerRoot=document.getElementById('hydrated-qr');window.__qrServerGraphic=window.__qrServerRoot.querySelector('svg');window.__qrServerEditor=document.getElementById('hydrated-qr-draft');window.__qrServerEditor.value='typed before hydration';window.__qrServerEditor.focus();window.__qrServerEditor.setSelectionRange(2,5);</script>`,
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
  await page.goto(`${server.resolvedUrls.local[0]}qrcode-theme-hydration.html`);
  await page.waitForFunction(() => window.__qrcodeHydrated === true);
  const editor = page.getByRole('textbox', { name: 'Hydrated QR draft', exact: true });
  const identity = async (graphic = true) => {
    assert.equal(
      await page.locator('#hydrated-qr').evaluate((node) => node === window.__qrServerRoot),
      true,
    );
    assert.equal(
      await editor.evaluate(
        (node) => node === window.__qrServerEditor && node === document.activeElement,
      ),
      true,
    );
    assert.equal(await editor.inputValue(), 'typed before hydration');
    assert.deepEqual(
      await editor.evaluate((node) => [node.selectionStart, node.selectionEnd]),
      [2, 5],
    );
    if (graphic)
      assert.equal(
        await page
          .locator('#hydrated-qr svg')
          .evaluate((node) => node === window.__qrServerGraphic),
        true,
      );
  };
  await identity();
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#hydrated-qr-canvas canvas');
    return [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].some(
      (value, index) => index % 4 === 3 && value > 100,
    );
  });
  checks.push(
    'hydration retains server root, SVG, editor, value, focus and selection while painting the server canvas',
  );
  for (const expected of [null, '#ddeeff', '#e8f4ec']) {
    await page.getByRole('button', { name: 'Cycle hydrated theme', exact: true }).click();
    await identity();
    const variable = await page
      .locator('#hydrated-qr')
      .evaluate((node) => node.style.getPropertyValue('--apollo-qrcode-cover-background-color'));
    assert.equal(variable, expected ?? '');
    if (expected === '#ddeeff')
      assert.equal(await page.locator('#hydrated-qr button').textContent(), 'Current refresh');
  }
  checks.push(
    'source theme removal/restoration and current locale retain original nodes and focus',
  );
  for (const status of ['loading', 'scanned', 'expired']) {
    await page.getByRole('button', { name: 'Cycle hydrated status', exact: true }).click();
    await identity();
    assert.equal(
      await page.getByRole('status', { name: 'Hydrated QR status', exact: true }).textContent(),
      status,
    );
  }
  checks.push('nonactive status changes preserve the same server SVG and native editor');
  for (let count = 0; count < 4; count++) {
    await page.getByRole('button', { name: 'Toggle hydrated mode', exact: true }).click();
    await identity(false);
    if (count % 2 === 0)
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#hydrated-qr canvas');
        return [
          ...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data,
        ].some((value, index) => index % 4 === 3 && value > 100);
      });
  }
  checks.push('repeated canvas/SVG switches replace only the graphic and paint current modules');
  await page.locator('#hydrated-qr button').click();
  assert.equal(
    await page.getByRole('status', { name: 'Hydrated refresh count', exact: true }).textContent(),
    '1',
  );
  await page.evaluate(() => window.__unmountQRCode());
  assert.equal(await page.locator('#hydrated-qr').count(), 0);
  assert.equal(await editor.count(), 0);
  assert.deepEqual(errors, []);
  checks.push('one refresh emission and clean unmount with zero browser/Vue errors');
  const report = { browser: browser.version(), checks, errors };
  writeFileSync(
    process.env.QRCODE_HYDRATION_EVIDENCE ?? '/tmp/apollo-qrcode-hydration.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(report);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
