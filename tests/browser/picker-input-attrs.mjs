/** F01: production-dist browser regression for label focus, Tab order and popup keyboard use. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-f01-browser-'));
let server;
let browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'picker-input-attrs.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  const launched = await launchBrowser();
  browser = launched.browser;
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const base = server.resolvedUrls.local[0];
  for (const kind of ['date', 'range', 'time', 'time-range']) {
    await page.goto(`${base}picker-input-attrs.html?kind=${kind}`);
    await page.waitForSelector('#start-input');
    assert.equal(await page.locator('#start-input').getAttribute('aria-describedby'), 'input-hint');
    assert.equal(await page.locator('[data-testid=picker-root]').getAttribute('tabindex'), null);
    await page.locator('label[for=start-input]').click();
    await page.waitForFunction(() => document.activeElement?.id === 'start-input');
    await page.waitForSelector('.apollo-picker-dropdown:not(.apollo-picker-dropdown-hidden)');
    await page.keyboard.press('Escape');
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => document.activeElement?.id === 'start-input');
    if (kind.includes('range')) {
      await page.locator('label[for=end-input]').click();
      await page.waitForFunction(() => document.activeElement?.id === 'end-input');
      await page.evaluate(() => window.updatePicker({ disabled: [true, false] }));
      await page.locator('#before').focus();
      await page.keyboard.press('Tab');
      await page.waitForFunction(() => document.activeElement?.id === 'end-input');
    }
    await page.evaluate(() =>
      window.updatePicker({ inputReadOnly: true, 'aria-labelledby': 'start-label' }),
    );
    await page.waitForFunction(() => document.querySelector('#start-input')?.readOnly === true);
    assert.equal(await page.locator('#start-input').getAttribute('aria-labelledby'), 'start-label');
    await page.goto(`${base}picker-input-attrs.html?kind=${kind}&autofocus`);
    await page.waitForFunction(() => document.activeElement?.id === 'start-input');
    console.log(
      `PASS F01 ${kind}: labels, Tab, disabled endpoint, ARIA, readonly, popup, autofocus`,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS F01 browser: ${process.platform}/${process.arch}, ${await browser.version()}, ${launched.channel}`,
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => (server ? server.httpServer.close(resolve) : resolve()));
  rmSync(outDir, { recursive: true, force: true });
}
