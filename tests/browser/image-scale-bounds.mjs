/** Current scale bounds through published Image/Group exports, native gestures and the public demo. */
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
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-scale-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-scale-bounds`);
  await page.addScriptTag({ content: axe.source });
  const fixture = page.locator('[data-image-scale-fixture]');
  const target = fixture.locator('[data-image-scale-target]');
  const controls = fixture.locator('[data-image-scale-controls]');
  const click = (name) => controls.getByRole('button', { name, exact: true }).click();
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-scale-state]').textContent());
  const dialog = () => page.getByRole('dialog');
  const action = (name) => dialog().getByRole('button', { name, exact: true });
  const image = () => dialog().locator('.apollo-image-preview-img');
  const waitScale = (scale) =>
    page.waitForFunction((scale) => {
      const events = JSON.parse(
        document.querySelector('[data-image-scale-state]').textContent,
      ).events;
      return events.length && Math.abs(events.at(-1).scale - scale) < 1e-8;
    }, scale);
  const open = async (opener) => {
    await opener.click({ position: { x: 6, y: 6 } });
    await dialog().waitFor({ state: 'visible' });
    const node = await dialog().elementHandle();
    await page.waitForFunction((node) => node && getComputedStyle(node).opacity === '1', node);
    await page.waitForFunction(() => {
      const img = document.querySelector('[role="dialog"] img');
      return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
    });
  };
  const change = async (name, limits) => {
    const before = await state();
    await click(name);
    await page.waitForFunction(
      (limits) =>
        JSON.stringify(
          JSON.parse(document.querySelector('[data-image-scale-state]').textContent).preview,
        ) === JSON.stringify(limits),
      limits,
    );
    assert.deepEqual(
      (await state()).events,
      before.events,
      'a configuration change emits no transform by itself',
    );
  };
  const zoom = async (name, scale) => {
    await action(name).click();
    await waitScale(scale);
  };
  for (const kind of ['image', 'group']) {
    await click(`Mount scale ${kind}`);
    await change('Use tight bounds', { minScale: 1, maxScale: 1.05 });
    const opener = target.locator('[data-scale-trigger]');
    await open(opener);
    await zoom('zoomIn', 1.05);
    assert.equal(await action('zoomIn').isDisabled(), true);
    const editor = dialog().getByRole('textbox', { name: 'Scale preview note', exact: true });
    await editor.fill('Kept scale draft');
    await editor.evaluate((node) => node.setSelectionRange(2, 5));
    const saved = {
      root: await dialog().elementHandle(),
      image: await image().elementHandle(),
      editor: await editor.elementHandle(),
    };
    await change('Use expanded bounds', { minScale: 1, maxScale: 2 });
    assert.equal(await action('zoomIn').isEnabled(), true);
    assert.equal(await dialog().evaluate((node, original) => node === original, saved.root), true);
    assert.equal(await image().evaluate((node, original) => node === original, saved.image), true);
    assert.equal(await editor.evaluate((node, original) => node === original, saved.editor), true);
    assert.equal(await editor.inputValue(), 'Kept scale draft');
    assert.equal(await editor.evaluate((node) => document.activeElement === node), true);
    assert.deepEqual(
      await editor.evaluate((node) => [node.selectionStart, node.selectionEnd]),
      [2, 5],
    );
    await zoom('zoomIn', 1.155);
    await zoom('zoomIn', 1.2705);
    await change('Use tight bounds', { minScale: 1, maxScale: 1.05 });
    assert.equal(await action('zoomIn').isDisabled(), true);
    assert.equal(await dialog().locator('[data-scale-zoom-in-disabled]').textContent(), 'true');
    await zoom('zoomOut', 1.05);
    await zoom('Reset scale', 1);
    await change('Use expanded bounds', { minScale: 1, maxScale: 2 });
    await zoom('zoomIn', 1.1);
    await zoom('zoomIn', 1.21);
    await change('Use higher minimum', { minScale: 1.15, maxScale: 2 });
    await zoom('zoomOut', 1.15);
    assert.equal(await action('zoomOut').isDisabled(), true);
    await change('Remove scale limits', {});
    await zoom('zoomOut', 1.035);
    await zoom('Reset scale', 1);
    await change('Use tight bounds', { minScale: 1, maxScale: 1.05 });
    await image().hover();
    await page.mouse.wheel(0, -60);
    await waitScale(1.05);
    await change('Use expanded bounds', { minScale: 1, maxScale: 2 });
    await image().hover();
    await page.mouse.wheel(0, -60);
    await waitScale(1.155);
    await zoom('Reset scale', 1);
    await change('Use tight bounds', { minScale: 1, maxScale: 1.05 });
    await image().dblclick();
    await waitScale(1.05);
    const violations = await dialog().evaluate(
      async (node) => (await window.axe.run(node)).violations,
    );
    assert.deepEqual(violations, [], 'the actual preview passes full axe without exclusions');
    await action('Close preview').click();
    await dialog().waitFor({ state: 'hidden' });
    assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  }
  const demo = fixture.locator('[data-image-transform-demo]');
  const demoState = async () =>
    JSON.parse(await demo.locator('[data-image-transform-demo-state]').textContent());
  for (const kind of ['image', 'group']) {
    await demo.getByRole('button', { name: 'Cycle preview bounds', exact: true }).click();
    const opener = demo.locator(
      kind === 'image' ? '[data-transform-demo-image]' : '[data-transform-demo-group-first]',
    );
    await open(opener);
    await action('zoomIn').click();
    assert.equal((await demoState()).last.transform.scale, 1.05);
    const before = (await demoState())[`${kind}Changes`];
    await action('Cycle preview bounds').click();
    assert.equal((await demoState())[`${kind}Changes`], before);
    await action('zoomIn').click();
    assert.ok(Math.abs((await demoState()).last.transform.scale - 1.155) < 1e-8);
    await action('Cycle preview bounds').click();
    await action('zoomOut').click();
    assert.ok(Math.abs((await demoState()).last.transform.scale - 1.0395) < 1e-8);
    const violations = await dialog().evaluate(
      async (node) => (await window.axe.run(node)).violations,
    );
    assert.deepEqual(violations, [], 'the public demo passes full axe without exclusions');
    await action('Close preview').click();
    await dialog().waitFor({ state: 'hidden' });
  }
  assert.deepEqual(errors, [], 'no Vue warnings, console or page errors');
  console.log(
    `PASS Chrome ${browser.version()}: current Image/Group min/max bounds, disabled button/slot agreement, removal defaults, native wheel/double-click, stable editors/focus/selection, silent prop changes, full axe and both actual demo previews.`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
