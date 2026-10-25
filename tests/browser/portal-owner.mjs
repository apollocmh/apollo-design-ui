import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-portal-owner-'));
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
      rollupOptions: { input: path.join(root, 'portal-owner.html') },
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
  const issues = [];
  page.on('pageerror', (error) => issues.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      issues.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}portal-owner.html`);
  const frame = page.frameLocator('iframe');
  const counts = () =>
    page.evaluate(() => {
      const locks = (doc) =>
        [...doc.head.querySelectorAll('style')].filter((node) =>
          node.textContent?.includes('overflow-y: hidden'),
        ).length;
      return [locks(document), locks(document.querySelector('iframe').contentDocument)];
    });
  const expectCounts = async (value) => {
    await page.waitForFunction((expected) => {
      const locks = (doc) =>
        [...doc.head.querySelectorAll('style')].filter((node) =>
          node.textContent?.includes('overflow-y: hidden'),
        ).length;
      return (
        JSON.stringify([
          locks(document),
          locks(document.querySelector('iframe').contentDocument),
        ]) === JSON.stringify(expected)
      );
    }, value);
    assert.deepEqual(await counts(), value);
  };
  await frame.getByRole('textbox', { name: 'first editor' }).fill('Retained draft');
  await frame.getByRole('textbox', { name: 'first editor' }).evaluate((node) => {
    window.portalOwnerInput = node;
  });
  await expectCounts([0, 1]);
  assert.equal(
    await frame.locator('body').evaluate((node) => node.getBoundingClientRect().width),
    await page.evaluate(() => window.portalOwnerProbe.naturalFrameWidth),
    'overlay scrollbars do not expand the locked body',
  );
  // Native wheel cannot move the document while its modal lock is active.
  await frame.locator('body').hover({ position: { x: 150, y: 100 } });
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(100);
  assert.equal(
    await frame.locator('body').evaluate((node) => node.ownerDocument.defaultView.scrollY),
    0,
  );
  for (const [name, expected] of [
    ['Main target', [1, 0]],
    ['Open shadow target', [1, 0]],
    ['Closed shadow target', [1, 0]],
    ['Frame target', [0, 1]],
    ['Inline target', [1, 0]],
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expectCounts(expected);
    assert.equal(
      await page.evaluate(() => {
        const frameView = document.querySelector('iframe').contentWindow;
        const input = frameView.portalOwnerInput;
        return input?.isConnected && input.value === 'Retained draft';
      }),
      true,
    );
  }
  await page.getByRole('button', { name: 'Nested shadow target', exact: true }).click();
  await expectCounts([1, 0]);
  await page.getByRole('button', { name: 'Adopt nested host into frame', exact: true }).click();
  await expectCounts([0, 1]);
  await page.getByRole('button', { name: 'Adopted target', exact: true }).click();
  await expectCounts([1, 0]);
  await page.getByRole('button', { name: 'Adopt container into frame', exact: true }).click();
  await expectCounts([0, 1]);
  await page.getByRole('button', { name: 'Inline target', exact: true }).click();
  await expectCounts([1, 0]);
  await page.getByRole('button', { name: 'Adopt source into frame', exact: true }).click();
  await expectCounts([0, 1]);
  await frame.getByRole('button', { name: 'Open second', exact: true }).click();
  await expectCounts([0, 2]);
  await frame.getByRole('button', { name: 'Open main', exact: true }).click();
  await expectCounts([1, 2]);
  await page.getByRole('textbox', { name: 'main editor' }).press('Escape');
  await expectCounts([0, 2]);
  await frame.getByRole('textbox', { name: 'second editor' }).press('Escape');
  await expectCounts([0, 1]);
  assert.equal(
    await frame.getByLabel('Escape log').textContent(),
    'main:true:0,second:true:0,first:false:0',
  );
  await frame.getByRole('button', { name: 'Update callback', exact: true }).click();
  await frame.getByRole('button', { name: 'Toggle cancellation', exact: true }).click();
  await frame.getByRole('textbox', { name: 'first editor' }).press('Escape');
  await expectCounts([0, 1]);
  await frame.getByRole('button', { name: 'Toggle cancellation', exact: true }).click();
  await frame.getByRole('button', { name: 'Open main', exact: true }).click();
  await frame.getByRole('textbox', { name: 'first editor' }).evaluate((node) => {
    node.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        isComposing: true,
        bubbles: true,
        composed: true,
      }),
    );
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true }));
    node.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
    );
  });
  await expectCounts([1, 1]);
  await page.getByRole('textbox', { name: 'main editor' }).press('Escape');
  await expectCounts([0, 1]);
  await page.waitForTimeout(210);
  await frame.getByRole('textbox', { name: 'first editor' }).press('Escape');
  await expectCounts([0, 0]);
  assert.equal(
    await frame.getByLabel('Escape log').textContent(),
    'main:true:0,second:true:0,first:false:0,main:true:1,first:true:1',
  );
  await frame.getByRole('button', { name: 'Open first', exact: true }).click();
  await expectCounts([0, 1]);
  await frame.getByRole('button', { name: 'Unmount', exact: true }).click();
  await expectCounts([0, 0]);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.mouse.move(1100, 400);
  await page.mouse.wheel(0, 400);
  await page.waitForFunction(() => window.scrollY > 0);
  assert.deepEqual(issues, []);
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        result: 'passed',
        checks: [
          'owner-lock-and-native-wheel',
          'stable-container-and-node',
          'open-and-closed-shadow',
          'native-container-and-source-adoption',
          'independent-window-stacks',
          'snapshot-top-flags',
          'native-cancellation',
          'IME-window-isolation',
          'live-callback',
          'reopen-and-unmount',
        ],
        issues,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
