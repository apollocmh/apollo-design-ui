/** Actual public close-control demo through published exports and real Chrome. */
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
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-close-'));
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
  for (const kind of ['image', 'group']) {
    await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-preview-close`);
    await page.addScriptTag({ content: axe.source });
    const demo = page.locator('[data-image-close-demo]');
    const opener = demo.locator(`[data-close-demo-${kind}]`);
    const dialog = () => page.getByRole('dialog');
    const close = () => dialog().getByRole('button', { name: 'Close preview', exact: true });
    const image = () => dialog().locator('.apollo-image-preview-img');
    const state = async () =>
      JSON.parse(await demo.locator('[data-close-demo-state]').textContent());
    const cycle = async (phase) => {
      await dialog().getByRole('button', { name: 'Cycle close control', exact: true }).click();
      await page.waitForFunction(
        (phase) =>
          JSON.parse(document.querySelector('[data-close-demo-state]').textContent).phase === phase,
        phase,
      );
    };
    const open = async () => {
      await opener.click({ position: { x: 6, y: 6 } });
      await dialog().waitFor({ state: 'visible' });
      const node = await dialog().elementHandle();
      await page.waitForFunction((node) => node && getComputedStyle(node).opacity === '1', node);
      await page.waitForFunction(() => {
        const img = document.querySelector('[role="dialog"] img');
        return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
      });
    };
    await open();
    await dialog().getByRole('button', { name: 'rotateRight', exact: true }).click();
    const editor = dialog().getByRole('textbox', { name: 'Close control note', exact: true });
    const draft = `Kept ${kind} close draft`;
    await editor.fill(draft);
    await editor.evaluate((node) => node.setSelectionRange(2, 7));
    const saved = {
      root: await dialog().elementHandle(),
      image: await image().elementHandle(),
      editor: await editor.elementHandle(),
      close: await close().elementHandle(),
    };
    const stable = async () => {
      assert.equal(
        await dialog().evaluate((node, original) => node === original, saved.root),
        true,
      );
      assert.equal(
        await image().evaluate((node, original) => node === original, saved.image),
        true,
      );
      assert.equal(
        await editor.evaluate((node, original) => node === original, saved.editor),
        true,
      );
      assert.equal(await editor.inputValue(), draft);
      assert.equal(await editor.evaluate((node) => document.activeElement === node), true);
      assert.deepEqual(
        await editor.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [2, 7],
      );
      assert.match(await image().getAttribute('style'), /rotate\(90deg\)/);
    };
    for (const phase of [0, 1, 2, 3, 4, 0]) {
      if (phase !== (await state()).phase) await cycle(phase);
      if (phase === 3) assert.equal(await close().count(), 0);
      else {
        assert.equal(await close().getAttribute('type'), 'button');
        assert.equal(await close().getAttribute('aria-label'), 'Close preview');
        if (phase === 0 || phase === 2)
          assert.equal(
            await close().locator('[data-close-demo-icon]').getAttribute('data-close-demo-icon'),
            phase === 0 ? 'slot' : 'data',
          );
        if (phase === 1) {
          assert.equal(await close().textContent(), '');
          assert.equal(await close().locator('svg, [data-close-demo-icon]').count(), 0);
        }
        if (phase === 4) assert.equal(await close().locator('svg').count(), 1);
        if (phase === 1 || phase === 2)
          assert.equal(
            await close().evaluate((node, original) => node === original, saved.close),
            true,
          );
      }
      await stable();
      assert.deepEqual(
        await dialog().evaluate(async (node) => (await window.axe.run(node)).violations),
        [],
        'every actual close-control phase passes full axe without exclusions',
      );
    }
    await cycle(1);
    await close().click();
    await dialog().waitFor({ state: 'hidden' });
    assert.equal((await state())[`${kind}Open`], false);
    assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
    await open();
    await cycle(2);
    await close().focus();
    await cycle(3);
    assert.equal(
      await dialog().evaluate((node) => document.activeElement === node),
      true,
      'hiding the focused button repairs focus inside the preview',
    );
    await page.keyboard.press('Escape');
    await dialog().waitFor({ state: 'hidden' });
    assert.equal((await state())[`${kind}Open`], false);
    assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  }
  assert.deepEqual(errors, [], 'no Vue warnings, console or page errors');
  console.log(
    `PASS Chrome ${browser.version()}: actual Image/Group close-control demo, native/current/empty/removed slots, data/default fallback, closable transitions, stable editor/image/selection/focus/rotation, named empty button, focused-button removal, Escape/focus return and full axe without exclusions.`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
