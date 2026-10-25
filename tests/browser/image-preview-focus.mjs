/** Real production Image preview focus, native keyboard navigation, names and teardown. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import axe from 'axe-core';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-preview-focus-'));
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-preview-focus`);
  await page.addScriptTag({ content: axe.source });
  const fixture = page.locator('[data-image-preview-focus-fixture]');
  await fixture.waitFor();
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-preview-focus-state]').textContent());
  const controls = fixture.locator('[data-image-preview-focus-controls]');
  const clickControl = (name) => controls.getByRole('button', { name, exact: true }).click();
  const outside = fixture.locator('[data-image-focus-outside]');
  const trigger = () => fixture.locator('[data-image-focus-trigger]');
  const noDialog = async () => assert.equal(await page.getByRole('dialog').count(), 0);
  const activeIs = async (locator, description) =>
    assert.equal(
      await locator.evaluate((node) => document.activeElement === node),
      true,
      description,
    );
  const inside = async (dialog, description) =>
    assert.equal(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
      true,
      description,
    );
  const waitLoaded = async (image) => {
    const node = await image.elementHandle();
    if (!node) throw new Error('Expected real loaded image');
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
    );
  };
  const waitState = async (key, value) =>
    page.waitForFunction(
      ({ key, value }) => {
        const text = document.querySelector('[data-image-preview-focus-state]')?.textContent;
        return text && JSON.parse(text)[key] === value;
      },
      { key, value },
    );
  const opened = async () => {
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-image-preview-focus-state]')?.textContent;
      return text && JSON.parse(text).completed.at(-1) === true;
    });
    await waitLoaded(dialog.locator('.apollo-image-preview-img'));
    await inside(dialog, 'open edge automatically moves real focus inside the preview');
    return dialog;
  };
  const closed = async (dialog, opener) => {
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-image-preview-focus-state]')?.textContent;
      return text && JSON.parse(text).completed.at(-1) === false;
    });
    await noDialog();
    await activeIs(opener, 'completed close restores the actual original opener');
  };
  const mount = async (kind, mode) => {
    await noDialog();
    const previousSession = (await state()).session;
    const label =
      mode === 'model'
        ? `Mount focus ${kind}`
        : mode === 'refuse'
          ? `Mount refusing focus ${kind}`
          : `Prepare lazy focus ${kind}`;
    await clickControl(label);
    await waitState('session', previousSession + 1);
    assert.deepEqual((await state()).requests, []);
    assert.deepEqual((await state()).completed, []);
    if (mode !== 'lazy') await waitLoaded(trigger().locator('img'));
  };
  const keyboardOpen = async () => {
    // Only the original thumbnail is focused; the dialog must acquire focus by itself.
    await trigger().focus();
    await activeIs(trigger(), 'thumbnail accepts native focus');
    await page.keyboard.press('Enter');
    return opened();
  };
  const assertNames = async (dialog, grouped) => {
    const names = grouped ? ['Close preview', 'Previous image', 'Next image'] : ['Close preview'];
    for (const name of names) {
      const button = dialog.getByRole('button', { name, exact: true });
      assert.equal(await button.count(), 1, `real accessibility tree exposes ${name}`);
      assert.equal(await button.getAttribute('type'), 'button');
    }
    const violations = await dialog.evaluate(
      async (node) =>
        (await window.axe.run(node, { runOnly: { type: 'rule', values: ['button-name'] } }))
          .violations,
    );
    assert.deepEqual(violations, [], 'decorative icons cannot remove button accessible names');
  };
  const tabBoundaries = async (dialog, grouped) => {
    const first = dialog.getByRole('button', { name: 'Close preview', exact: true });
    const last = dialog.getByRole('button', { name: 'zoomIn', exact: true });
    await last.focus();
    await page.keyboard.press('Tab');
    await activeIs(first, 'last native Tab wraps to first enabled button');
    await first.focus();
    await page.keyboard.press('Shift+Tab');
    await activeIs(last, 'first native Shift+Tab wraps to last enabled button');
    await dialog.focus();
    await page.keyboard.press('Shift+Tab');
    await activeIs(last, 'dialog root Shift+Tab wraps to last enabled button');
    await dialog.focus();
    await page.keyboard.press('Tab');
    await activeIs(first, 'dialog root Tab enters its first enabled button');
    await page.keyboard.press('Tab');
    await activeIs(
      dialog.getByRole('button', { name: grouped ? 'Next image' : 'flipY', exact: true }),
      'native traversal skips disabled controls',
    );
    await outside.focus();
    await inside(dialog, 'real outside focus is redirected back inside the active preview');
    assert.equal(await outside.evaluate((node) => document.activeElement === node), false);
  };

  // A focused failing-case run can collect the stacked teardown evidence even
  // when an earlier required regression fails. The default always runs all cases.
  if (!process.argv.includes('--stacked-only') && !process.argv.includes('--parent-first-only')) {
    for (const kind of ['image', 'group']) {
      await mount(kind, 'model');
      const original = await trigger().elementHandle();
      let dialog = await keyboardOpen();
      assert.deepEqual((await state()).requests, [[true, false]]);
      await assertNames(dialog, kind === 'group');
      await tabBoundaries(dialog, kind === 'group');
      await clickControl('Toggle focus icons');
      await waitState('decorative', false);
      await assertNames(dialog, kind === 'group');
      await inside(dialog, 'changing icon content preserves current preview focus');
      if (kind === 'group') {
        await page.keyboard.press('ArrowRight');
        await waitState('current', 1);
        assert.equal(
          await dialog.locator('.apollo-image-preview-img').getAttribute('alt'),
          'Focus group second',
        );
        await inside(dialog, 'controlled group navigation preserves preview focus');
      }
      await page.keyboard.press('Escape');
      await closed(dialog, trigger());
      assert.equal(
        await trigger().evaluate((node, saved) => node === saved, original),
        true,
        'normal close keeps thumbnail identity',
      );
      dialog = await keyboardOpen();
      await dialog.getByRole('button', { name: 'Close preview', exact: true }).click();
      await closed(dialog, trigger());

      await mount(kind, 'refuse');
      dialog = await keyboardOpen();
      const originalDialog = await dialog.elementHandle();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => {
        const text = document.querySelector('[data-image-preview-focus-state]')?.textContent;
        return text && JSON.parse(text).requests.length === 2;
      });
      assert.deepEqual((await state()).requests, [
        [true, false],
        [false, true],
      ]);
      assert.equal((await state()).open, true);
      const retained = await dialog.evaluate(async (node) => {
        const started = performance.now();
        while (performance.now() - started < 650) {
          const style = getComputedStyle(node);
          if (
            !node.isConnected ||
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            !node.contains(document.activeElement)
          )
            return false;
          await new Promise(requestAnimationFrame);
        }
        return true;
      });
      assert.equal(
        retained,
        true,
        'refused controlled close retains focus beyond the motion deadline',
      );
      assert.equal(await dialog.evaluate((node, saved) => node === saved, originalDialog), true);
      await clickControl('Close focus preview from parent');
      await closed(dialog, trigger());

      await mount(kind, 'lazy');
      const opener = fixture.locator('[data-image-focus-lazy-opener]');
      await opener.click();
      dialog = await opened();
      assert.deepEqual(
        (await state()).requests,
        [],
        'lazy defaultOpen initializes without a change request',
      );
      await page.keyboard.press('Escape');
      await closed(dialog, opener);
      assert.deepEqual((await state()).requests, [[false, true]]);

      await mount(kind, 'lazy');
      const unmountOpener = fixture.locator('[data-image-focus-lazy-opener]');
      await unmountOpener.click();
      dialog = await opened();
      await clickControl('Unmount focus preview');
      await dialog.waitFor({ state: 'hidden' });
      await noDialog();
      await activeIs(
        unmountOpener,
        'whole open preview unmount restores its surviving external opener',
      );
      await outside.focus();
      await activeIs(outside, 'unmount releases the global focus trap');
    }
    assert.deepEqual(errors, [], 'basic focus scenarios have zero Vue/page errors');
    console.log(
      `PASS Chrome ${browser.version()}: Image/Group native Enter auto-focus, global Escape and mouse close restoration, real Tab/ShiftTab boundaries, external focus lock, controlled refusal, lazy defaultOpen, whole unmount and decorative/default icon accessible names.`,
    );
  }

  // This remains a required regression: multiple live locks must release before the
  // surviving external opener receives focus when their common parent unmounts.
  if (!process.argv.includes('--parent-first-only')) {
    await clickControl('Prepare stacked focus previews');
    const stackedOpener = fixture.locator('[data-image-focus-lazy-opener]');
    await stackedOpener.click();
    const first = page.getByRole('dialog', { name: 'First stacked focus preview', exact: true });
    await first.waitFor({ state: 'visible' });
    await waitLoaded(first.locator('img'));
    await inside(first, 'first stacked preview acquires focus');
    await clickControl('Open second focus preview');
    const second = page.getByRole('dialog', { name: 'Second stacked focus preview', exact: true });
    await second.waitFor({ state: 'visible' });
    await waitLoaded(second.locator('img'));
    await inside(second, 'newest stacked preview acquires focus');
    assert.equal(await page.getByRole('dialog').count(), 2);
    await clickControl('Unmount focus preview');
    await first.waitFor({ state: 'hidden' });
    await second.waitFor({ state: 'hidden' });
    await noDialog();
    await activeIs(
      stackedOpener,
      'whole stacked-preview parent unmount restores the surviving external opener',
    );
    await outside.focus();
    await activeIs(outside, 'all stacked focus locks are released');
    assert.deepEqual(errors, [], 'zero Vue warnings, console errors or page errors');
    console.log(
      'PASS stacked preview parent teardown restores external focus and releases every lock.',
    );
  }

  await clickControl('Prepare stacked focus previews');
  const survivingOpener = fixture.locator('[data-image-focus-lazy-opener]');
  await survivingOpener.click();
  const parentDialog = page.getByRole('dialog', {
    name: 'First stacked focus preview',
    exact: true,
  });
  await parentDialog.waitFor({ state: 'visible' });
  await waitLoaded(parentDialog.locator('img'));
  await inside(parentDialog, 'first parent-first preview acquires focus');
  await clickControl('Open second focus preview');
  const survivingDialog = page.getByRole('dialog', {
    name: 'Second stacked focus preview',
    exact: true,
  });
  await survivingDialog.waitFor({ state: 'visible' });
  await waitLoaded(survivingDialog.locator('img'));
  await inside(survivingDialog, 'second parent-first preview acquires focus');
  await clickControl('Unmount first focus preview');
  await parentDialog.waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('dialog').count(), 1);
  await inside(
    survivingDialog,
    'removing the first preview does not steal focus from the surviving second',
  );
  await page.keyboard.press('Escape');
  await closed(survivingDialog, survivingOpener);
  await outside.focus();
  await activeIs(outside, 'parent-first teardown releases the final focus lock');
  assert.deepEqual(errors, [], 'all focus scenarios have zero Vue/page errors');
  console.log(
    'PASS parent-first unmount preserves the second preview focus and its final close restores the external opener.',
  );
} finally {
  await browser?.close();
  await server?.httpServer?.close();
  rmSync(outDir, { recursive: true, force: true });
}
