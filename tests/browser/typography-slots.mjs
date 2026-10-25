/** Typography current native default slots against production dist and the real editable demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-typography-slots-'));
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
  const context = await browser.newContext();
  let clipboardPermission = true;
  let clipboardReason = '';
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  } catch (error) {
    clipboardPermission = false;
    clipboardReason = String(error);
  }
  const page = await context.newPage();
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=typography-slots`);
  const names = ['Text', 'Title', 'Paragraph', 'Link', 'Typography'];
  const originalRoots = [];
  for (const name of names) {
    const root = page.locator(`[data-typography-entry="${name}"] > .apollo-typography`);
    assert.ok((await root.textContent()).includes('First parent-render text'));
    originalRoots.push(await root.elementHandle());
  }
  const jsSelector = '[data-typography-js-ellipsis] > .apollo-typography';
  const jsEllipsis = page.locator(jsSelector);
  const longText = (text) => Array(12).fill(text).join(' ');
  const settleJsEllipsis = async (expected, expanded = false) => {
    await page.waitForFunction(
      ({ selector, expected, expanded }) => {
        const node = document.querySelector(selector);
        if (!(node instanceof HTMLElement) || node.getAttribute('aria-label') !== expected)
          return false;
        const hidden = Array.from(node.querySelectorAll('span[aria-hidden="true"]'));
        if (hidden.some((span) => span instanceof HTMLElement && span.style.position === 'fixed'))
          return false;
        if (expanded)
          return (
            !!node.querySelector('.apollo-typography-collapse') &&
            node.textContent.startsWith(expected)
          );
        const body = hidden[0]?.textContent ?? '';
        return (
          !!node.querySelector('.apollo-typography-expand') &&
          body.length > 0 &&
          body.length < expected.length &&
          expected.startsWith(body) &&
          hidden.some((span) => span.textContent === '...')
        );
      },
      { selector: jsSelector, expected, expanded },
      { timeout: 10000 },
    );
    const stable = await jsEllipsis.evaluate(async (node) => {
      const html = node.innerHTML;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        unchanged: node.innerHTML === html,
        measuring: Array.from(node.querySelectorAll('span[aria-hidden="true"]')).filter(
          (span) => span instanceof HTMLElement && span.style.position === 'fixed',
        ).length,
        height: node.clientHeight,
        cssClamp: node.classList.contains('apollo-typography-ellipsis-multiple-line'),
      };
    });
    assert.equal(stable.unchanged, true, 'JS ellipsis must settle across two animation frames');
    assert.equal(stable.measuring, 0, 'JS ellipsis must remove fixed measurement containers');
    assert.equal(
      stable.cssClamp,
      false,
      'expandable Paragraph must use JS rather than CSS clipping',
    );
    return stable;
  };
  await settleJsEllipsis(longText('First parent-render text'));
  const originalJsRoot = await jsEllipsis.elementHandle();
  const draft = page.getByRole('textbox', { name: 'Typography rich draft', exact: true });
  await draft.fill('kept draft');
  const originalDraft = await draft.elementHandle();
  await page.getByRole('button', { name: 'Update all typography text', exact: true }).click();
  const current = 'Current parent-render text 1';
  for (const [index, name] of names.entries()) {
    const root = page.locator(`[data-typography-entry="${name}"] > .apollo-typography`);
    assert.ok((await root.textContent()).includes(current), name);
    assert.equal(
      await root.evaluate((node, original) => node === original, originalRoots[index]),
      true,
      name,
    );
  }
  assert.equal(await page.locator('[data-typography-rich-label]').innerText(), current);
  assert.equal(await draft.inputValue(), 'kept draft');
  assert.equal(await draft.evaluate((node, original) => node === original, originalDraft), true);
  assert.equal(await draft.evaluate((node) => document.activeElement === node), true);
  const ellipsis = page.locator('[data-typography-ellipsis] > .apollo-typography');
  assert.equal(await ellipsis.textContent(), current);
  assert.equal(await ellipsis.evaluate((node) => getComputedStyle(node).textOverflow), 'ellipsis');
  assert.equal(await ellipsis.evaluate((node) => getComputedStyle(node).whiteSpace), 'nowrap');
  assert.equal(await ellipsis.evaluate((node) => node.scrollWidth > node.clientWidth), true);
  const collapsed = await settleJsEllipsis(longText(current));
  assert.equal(
    await jsEllipsis.evaluate((node, original) => node === original, originalJsRoot),
    true,
  );
  assert.ok(collapsed.height <= 45, 'rows=2 at line-height 22px must fit two lines');
  const clipped = await jsEllipsis.locator('span[aria-hidden="true"]').first().textContent();
  assert.ok(longText(current).startsWith(clipped));
  assert.ok(clipped.includes('Current parent-render'));
  await jsEllipsis.locator('.apollo-typography-expand').click();
  const expanded = await settleJsEllipsis(longText(current), true);
  assert.ok(
    expanded.height > collapsed.height,
    'expanded Paragraph must reveal the current full text',
  );
  await jsEllipsis.locator('.apollo-typography-collapse').click();
  const recollapsed = await settleJsEllipsis(longText(current));
  assert.equal(recollapsed.height, collapsed.height);

  let clipboardAvailable = false;
  if (clipboardPermission) {
    const probe = await page.evaluate(async () => {
      if (!navigator.clipboard?.writeText || !navigator.clipboard?.readText)
        return { available: false, reason: 'Clipboard API unavailable' };
      try {
        await navigator.clipboard.writeText('Typography clipboard probe');
        const value = await navigator.clipboard.readText();
        return {
          available: value === 'Typography clipboard probe',
          reason: 'Native clipboard probe did not match',
        };
      } catch (error) {
        return { available: false, reason: String(error) };
      }
    });
    clipboardAvailable = probe.available;
    if (!probe.available) clipboardReason = probe.reason;
  }
  for (const name of names.filter((name) => name !== 'Typography')) {
    const scope = page.locator(`[data-typography-entry="${name}"]`);
    if (clipboardAvailable) {
      await page.evaluate(() => navigator.clipboard.writeText('Previous clipboard marker'));
      await scope.locator('.apollo-typography-copy').click();
      await page.waitForFunction(
        async (expected) => (await navigator.clipboard.readText()) === expected,
        current,
      );
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), current, name);
    }
    await scope.locator('.apollo-typography-edit').click();
    const editor = scope.getByRole('textbox', { name: `${name} current editor`, exact: true });
    await editor.waitFor();
    assert.equal(await editor.inputValue(), current, name);
    assert.equal(await editor.evaluate((node) => document.activeElement === node), true, name);
    await editor.press('Escape');
    assert.equal(await scope.locator('textarea').count(), 0, name);
  }

  const conditional = page.locator('[data-conditional-typography]');
  const copyButton = () => conditional.locator('.apollo-typography-copy');
  assert.equal(
    await copyButton().evaluate((node) =>
      node.classList.contains('apollo-typography-copy-icon-only'),
    ),
    true,
  );
  await conditional.getByRole('button', { name: 'Toggle editable content', exact: true }).click();
  assert.ok(
    (await conditional.locator('.apollo-typography').textContent()).includes(
      'Current template text 0',
    ),
  );
  assert.equal(
    await copyButton().evaluate((node) =>
      node.classList.contains('apollo-typography-copy-icon-only'),
    ),
    false,
  );
  await conditional.getByRole('button', { name: 'Update editable text', exact: true }).click();
  assert.ok(
    (await conditional.locator('.apollo-typography').textContent()).includes(
      'Current template text 1',
    ),
  );
  await conditional.locator('.apollo-typography-edit').click();
  const editor = conditional.getByRole('textbox', {
    name: 'Conditional editable text',
    exact: true,
  });
  assert.equal(await editor.inputValue(), 'Current template text 1');
  await editor.fill('Edited template text');
  await editor.press('Enter');
  assert.ok(
    (await conditional.locator('.apollo-typography').textContent()).includes(
      'Edited template text',
    ),
  );
  if (clipboardAvailable) {
    await page.evaluate(() => navigator.clipboard.writeText('Previous edited clipboard marker'));
    await copyButton().click();
    await page.waitForFunction(
      async () => (await navigator.clipboard.readText()) === 'Edited template text',
    );
  }
  await conditional.getByRole('button', { name: 'Toggle editable content', exact: true }).click();
  assert.equal(
    await copyButton().evaluate((node) =>
      node.classList.contains('apollo-typography-copy-icon-only'),
    ),
    true,
  );
  assert.equal(
    (await conditional.locator('.apollo-typography').textContent()).includes(
      'Edited template text',
    ),
    false,
  );
  assert.deepEqual(errors, []);
  const clipboardResult = clipboardAvailable
    ? 'real clipboard fallback verified for four entries and edited text'
    : `clipboard UNVERIFIED: ${clipboardReason}`;
  console.log(
    `PASS Chrome ${browser.version()}: current plain-value parent closures for four public entries/container, native CSS and converged JS ellipsis/current aria-label/expand-collapse, stable rich draft/focus/roots, real conditional template empty/current/empty, current editing initial text; ${clipboardResult}; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
