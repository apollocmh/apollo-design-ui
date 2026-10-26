import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-qrcode-contracts-'));
const results = [],
  issues = [];
function check(name, actual, expected) {
  let passed = true;
  try {
    assert.deepEqual(actual, expected);
  } catch {
    passed = false;
  }
  results.push({ name, actual, expected, passed });
}
let browser, server;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'qrcode-contract-audit.html') },
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => issues.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      issues.push(message.text());
  });
  const url = `${server.resolvedUrls.local[0]}qrcode-contract-audit.html`;
  await page.goto(url);
  await page.locator('#qr-main canvas').waitFor();
  const click = (name) => page.getByRole('button', { name, exact: true }).click();
  const geometry = () =>
    page.locator('#qr-main').evaluate((node) => {
      const graphic = node.querySelector('canvas,svg'),
        css = getComputedStyle(node),
        root = node.getBoundingClientRect(),
        box = graphic.getBoundingClientRect();
      return {
        root: [root.width, root.height],
        inner: [
          root.width -
            Number.parseFloat(css.paddingLeft) -
            Number.parseFloat(css.paddingRight) -
            Number.parseFloat(css.borderLeftWidth) -
            Number.parseFloat(css.borderRightWidth),
          root.height -
            Number.parseFloat(css.paddingTop) -
            Number.parseFloat(css.paddingBottom) -
            Number.parseFloat(css.borderTopWidth) -
            Number.parseFloat(css.borderBottomWidth),
        ],
        graphic: [box.width, box.height],
      };
    });
  for (const form of ['array', 'string', 'object']) {
    const box = await geometry();
    check(`${form} style has current root dimensions`, box.root, [220, 210]);
    check(`${form} style fills the inner graphic region`, box.graphic, box.inner);
    await click('Cycle native style');
  }
  check(
    'canvas title names the actual image',
    await page.locator('#qr-main [role="img"]').getAttribute('aria-label'),
    'Workspace access',
  );
  check(
    'default SVG image has a name',
    await page.locator('#qr-default [role="img"]').getAttribute('aria-label'),
    'QR code',
  );
  const coverColor = () =>
    page.locator('#qr-status .apollo-qrcode-cover').evaluate((node) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = getComputedStyle(node).backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    });
  check(
    'source component token affects the actual cover',
    await coverColor(),
    [232, 244, 236, 255],
  );
  await click('Toggle QR theme');
  check(
    'removing theme restores the current default cover',
    await coverColor(),
    [255, 255, 255, 245],
  );
  await click('Toggle QR theme');
  check('theme restoration uses current cover', await coverColor(), [232, 244, 236, 255]);
  await click('Toggle dark algorithm');
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('[data-qr-stage]')).backgroundColor ===
      'rgb(20, 20, 20)',
  );
  check(
    'default QR paper stays white in a real dark host',
    await page.locator('#qr-main').evaluate((node) => getComputedStyle(node).backgroundColor),
    'rgb(255, 255, 255)',
  );
  await click('Toggle QR theme');
  check('default cover follows the current dark alias', await coverColor(), [20, 20, 20, 245]);
  await click('Toggle QR theme');
  await click('Toggle dark algorithm');
  await click('Toggle native variable');
  check('native CSS variable wins', await coverColor(), [255, 238, 204, 255]);
  await click('Toggle native variable');
  check(
    'Vue refresh action exists independently of listeners',
    await page.locator('#qr-status button').count(),
    1,
  );
  await click('Toggle refresh listener');
  check(
    'adding the event listener preserves the refresh control',
    await page.locator('#qr-status button').count(),
    1,
  );
  if (await page.locator('#qr-status button').count()) {
    await page.locator('#qr-status button').focus();
    await page.keyboard.press('Enter');
  }
  check(
    'native keyboard activation emits exactly once',
    await page.getByRole('status', { name: 'Refresh count', exact: true }).textContent(),
    '1',
  );
  await click('Toggle locale');
  check(
    'current locale changes expired text',
    await page.locator('#qr-status .apollo-qrcode-expired').textContent(),
    'Current expired',
  );
  check(
    'current locale changes refresh label',
    (await page.locator('#qr-status button').count())
      ? await page.locator('#qr-status button').textContent()
      : null,
    'Current refresh',
  );
  await click('Toggle status slot');
  const editor = page.getByRole('textbox', { name: 'Current status draft', exact: true });
  check('the native status slot keeps all nodes', await editor.count(), 1);
  if (await editor.count()) {
    await editor.fill('Preserved browser draft');
    await editor.focus();
    const original = await editor.elementHandle();
    for (const state of ['loading', 'scanned', 'expired']) {
      await page
        .getByRole('button', { name: 'Cycle status', exact: true })
        .evaluate((node) => node.click());
      await page
        .getByRole('button', { name: 'Toggle rendering mode', exact: true })
        .evaluate((node) => node.click());
      check(
        `native editor remains current in ${state}`,
        await original.evaluate((node) => ({
          same: node === document.querySelector('#qr-status input'),
          focused: node === document.activeElement,
          value: node.value,
        })),
        { same: true, focused: true, value: 'Preserved browser draft' },
      );
      check(
        `scope follows ${state}`,
        await page.getByRole('status', { name: 'Current status scope', exact: true }).textContent(),
        state,
      );
    }
    await click('Toggle rendering mode');
  }
  await click('Toggle empty slot');
  check(
    'existing empty slot suppresses default status',
    await page.locator('#qr-status .apollo-qrcode-cover').textContent(),
    '',
  );
  await click('Toggle empty slot');
  await click('Toggle status slot');
  await click('Toggle refresh listener');
  check(
    'removing the listener preserves the Vue action',
    await page.locator('#qr-status button').count(),
    1,
  );
  const matrix = (target) =>
    target.locator('#qr-main canvas').evaluate((canvas) => {
      const svg = document.querySelector('#qr-oracle svg');
      const cells = Number(svg.getAttribute('viewBox').split(' ')[2]);
      const context = canvas.getContext('2d');
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const bitmap = [];
      for (let y = 0; y < cells; y++)
        for (let x = 0; x < cells; x++) {
          const px = Math.floor(((x + 0.5) / cells) * canvas.width),
            py = Math.floor(((y + 0.5) / cells) * canvas.height);
          bitmap.push(data[(py * canvas.width + px) * 4 + 3] > 100);
        }
      let pathMismatch = null;
      if (typeof Path2D !== 'undefined') {
        const shape = new Path2D(svg.querySelectorAll('path')[1].getAttribute('d'));
        const oracle = document.createElement('canvas').getContext('2d');
        pathMismatch = bitmap.filter(
          (on, index) =>
            on !==
            oracle.isPointInPath(shape, (index % cells) + 0.5, Math.floor(index / cells) + 0.5),
        ).length;
      }
      return { width: canvas.width, height: canvas.height, cells, bitmap, pathMismatch };
    });
  const initial = await matrix(page);
  check('canvas paints nonempty real modules', initial.bitmap.some(Boolean), true);
  check('canvas modules match the SVG vector at module centers', initial.pathMismatch, 0);
  await click('Toggle foreground');
  check(
    'foreground-only updates reach actual pixels',
    await page.locator('#qr-main canvas').evaluate((canvas) => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      for (let index = 0; index < data.length; index += 4)
        if (
          data[index + 3] === 255 &&
          data[index] === 198 &&
          data[index + 1] === 40 &&
          data[index + 2] === 40
        )
          return true;
      return false;
    }),
    true,
  );
  await click('Toggle background');
  check(
    'background-only update reaches actual pixels',
    await page
      .locator('#qr-main canvas')
      .evaluate((canvas) => [...canvas.getContext('2d').getImageData(0, 0, 1, 1).data]),
    [240, 245, 255, 255],
  );
  await click('Toggle background');
  await click('Toggle foreground');
  await click('Toggle QR value');
  check(
    'segmented value redraws actual modules',
    JSON.stringify((await matrix(page)).bitmap) !== JSON.stringify(initial.bitmap),
    true,
  );
  check('updated segmented canvas matches SVG', (await matrix(page)).pathMismatch, 0);
  await click('Toggle QR value');
  for (const expected of [
    [224, 0, 224],
    [0, 68, 238],
  ]) {
    await click('Cycle QR icon');
    await page.waitForFunction((expected) => {
      const canvas = document.querySelector('#qr-main canvas');
      const actual = canvas
        .getContext('2d')
        .getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
      return expected.every((value, index) => actual[index] === value);
    }, expected);
    check(`current icon pixels ${expected.join(',')}`, true, true);
  }
  await click('Cycle QR icon');
  await page.waitForFunction(() => {
    const image = document.querySelector('#qr-main img');
    return image.complete && image.naturalWidth === 0;
  });
  check(
    'failed icon leaves the full QR modules intact',
    (await matrix(page)).bitmap,
    initial.bitmap,
  );
  await click('Cycle QR icon');
  check('removed icon restores full QR modules', (await matrix(page)).bitmap, initial.bitmap);
  const fallback = await browser.newContext({ deviceScaleFactor: 2 });
  await fallback.addInitScript(() => {
    window.Path2D = undefined;
  });
  const fallbackPage = await fallback.newPage();
  await fallbackPage.goto(url);
  await fallbackPage.locator('#qr-main canvas').waitFor();
  const doubled = await matrix(fallbackPage);
  check('DPR two creates a double-resolution buffer', [doubled.width, doubled.height], [320, 320]);
  check('non-Path2D fallback paints the same module grid', doubled.bitmap, initial.bitmap);
  await fallback.close();

  let releaseFirst;
  const firstRequest = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const logoBody =
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#e000e0"/></svg>';
  let first = true;
  await page.route('**/controlled-icon.svg', (route) => {
    if (first) {
      first = false;
      releaseFirst(route);
    } else
      return route.fulfill({
        contentType: 'image/svg+xml',
        headers: { 'cache-control': 'no-store' },
        body: logoBody,
      });
  });
  await click('Use delayed icon');
  const route = await firstRequest;
  await page.evaluate(() => {
    window.__qrIconLoaded = false;
    document.querySelector('#qr-main img').addEventListener(
      'load',
      () => {
        window.__qrIconLoaded = true;
      },
      { once: true },
    );
  });
  await route.fulfill({
    contentType: 'image/svg+xml',
    headers: { 'cache-control': 'no-store' },
    body: logoBody,
  });
  await page.waitForFunction(() => window.__qrIconLoaded === true);
  await click('Toggle rendering mode');
  check(
    'same URL is retained in the native SVG image',
    await page.locator('#qr-main image').getAttribute('href'),
    './controlled-icon.svg',
  );
  await click('Toggle rendering mode');
  await page.waitForFunction(() => {
    const image = document.querySelector('#qr-main img');
    return image.complete && image.naturalWidth === 40;
  });
  check(
    'loaded same-URL icon repaints after SVG to canvas remount',
    await page
      .locator('#qr-main canvas')
      .evaluate((canvas) => [
        ...canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data,
      ]),
    [224, 0, 224, 255],
  );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  check(
    'current full fixture passes browser axe',
    await page.evaluate(async () =>
      (await window.axe.run(document.querySelector('main'))).violations.map((issue) => issue.id),
    ),
    [],
  );
  check('no page, Vue or unexpected resource errors', issues, []);
  const report = { browser: browser.version(), results, issues };
  writeFileSync(
    process.env.QRCODE_CONTRACT_EVIDENCE ?? '/tmp/apollo-qrcode-browser.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(
    JSON.stringify(
      { total: results.length, failed: results.filter((result) => !result.passed) },
      null,
      2,
    ),
  );
  assert.equal(results.filter((result) => !result.passed).length, 0);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
