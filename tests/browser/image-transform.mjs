/** Typed Image/Group transform events through production exports and the actual demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-transform-'));
const initial = { rotate: 0, scale: 1, flipX: false, flipY: false, x: 0, y: 0 };
const eventRows = (info, revision, once = false) =>
  ['first', 'second', ...(once ? ['once'] : [])].map((listener) => ({ listener, revision, info }));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-transform`);
  const fixture = page.locator('[data-image-transform-fixture]');
  const target = fixture.locator('[data-image-transform-target]');
  const trigger = () => target.locator('[data-transform-trigger]');
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-transform-state]').textContent());
  const click = (name) =>
    fixture
      .locator('[data-image-transform-controls]')
      .getByRole('button', { name, exact: true })
      .click();
  const waitState = async (key, value) =>
    page.waitForFunction(
      ({ key, value }) => {
        const text = document.querySelector('[data-image-transform-state]')?.textContent;
        return text && JSON.parse(text)[key] === value;
      },
      { key, value },
    );
  const waitEntries = async (count) =>
    page.waitForFunction((count) => {
      const text = document.querySelector('[data-image-transform-state]')?.textContent;
      return text && JSON.parse(text).entries.length === count;
    }, count);
  const waitLoaded = async (image) => {
    const node = await image.elementHandle();
    if (!node) throw new Error('Expected an actual image');
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
    );
  };
  const dialog = () => page.getByRole('dialog');
  const openPreview = async (opener) => {
    await opener.click({ position: { x: 6, y: 6 } });
    await dialog().waitFor({ state: 'visible' });
    await waitLoaded(dialog().locator('.apollo-image-preview-img'));
    assert.equal(await dialog().evaluate((node) => node.contains(document.activeElement)), true);
  };
  const sameImage = async (saved) =>
    assert.equal(
      await dialog()
        .locator('img')
        .evaluate((node, original) => node === original, saved),
      true,
    );

  for (const kind of ['image', 'group']) {
    assert.equal(await dialog().count(), 0);
    const session = (await state()).session;
    await click(`Mount transform ${kind}`);
    await waitState('session', session + 1);
    await waitLoaded(trigger().locator('img'));
    await openPreview(trigger());
    assert.deepEqual((await state()).entries, []);
    const originalRoot = await trigger().elementHandle();
    const originalImage = await dialog().locator('img').elementHandle();

    // Root DOM events cannot enter the business event channel.
    await target.evaluate((node) =>
      node.firstElementChild?.dispatchEvent(new CustomEvent('transform', { bubbles: true })),
    );
    assert.deepEqual((await state()).entries, []);
    await dialog().getByRole('button', { name: 'rotateRight', exact: true }).click();
    await waitEntries(3);
    let expected = eventRows({ ...initial, rotate: 90 }, 0, true);
    assert.deepEqual((await state()).entries, expected);
    assert.match(await dialog().locator('img').getAttribute('style'), /rotate\(90deg\)/);

    await click('Replace transform listeners');
    await waitState('revision', 1);
    await dialog().getByRole('button', { name: 'flipX', exact: true }).click();
    await waitEntries(5);
    expected = [...expected, ...eventRows({ ...initial, rotate: 90, flipX: true }, 1)];
    assert.deepEqual((await state()).entries, expected);
    await sameImage(originalImage);
    assert.equal(await trigger().evaluate((node, saved) => node === saved, originalRoot), true);

    await click('Remove transform listeners');
    await waitState('enabled', false);
    await dialog().getByRole('button', { name: 'rotateLeft', exact: true }).click();
    await page.waitForFunction(() =>
      document
        .querySelector('.apollo-image-preview-img')
        ?.getAttribute('style')
        ?.includes('rotate(0deg)'),
    );
    assert.deepEqual((await state()).entries, expected);
    await click('Restore transform listeners');
    await waitState('enabled', true);
    await dialog().getByRole('button', { name: 'zoomIn', exact: true }).click();
    await waitEntries(7);
    expected = [...expected, ...eventRows({ ...initial, scale: 1.1, flipX: true }, 1)];
    assert.deepEqual((await state()).entries, expected);
    await sameImage(originalImage);

    await click('Refuse transform preview close');
    await waitState('acceptClose', false);
    await dialog().getByRole('button', { name: 'Close preview', exact: true }).click();
    const retained = await dialog().evaluate(async (node) => {
      const started = performance.now();
      while (performance.now() - started < 650) {
        const style = getComputedStyle(node);
        if (
          !node.isConnected ||
          style.display === 'none' ||
          Number(style.opacity) < 1 ||
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
      'refusing close preserves the real transform and focus beyond the leave deadline',
    );
    assert.equal((await state()).open, true);
    assert.deepEqual((await state()).entries, expected);
    await click('Close transform preview from parent');
    await dialog().waitFor({ state: 'hidden' });
    await waitEntries(9);
    expected = [...expected, ...eventRows(initial, 1)];
    assert.deepEqual((await state()).entries, expected);
    assert.equal(await trigger().evaluate((node) => document.activeElement === node), true);
  }

  const demo = fixture.locator('[data-image-transform-demo]');
  const demoState = async () =>
    JSON.parse(await demo.locator('[data-image-transform-demo-state]').textContent());
  for (const kind of ['image', 'group']) {
    const opener = demo.locator(
      kind === 'image' ? '[data-transform-demo-image]' : '[data-transform-demo-group-first]',
    );
    await waitLoaded(opener.locator('img'));
    await openPreview(opener);
    await dialog().getByRole('button', { name: 'rotateRight', exact: true }).click();
    const changed = await demoState();
    assert.equal(changed[`${kind}Changes`], 1);
    assert.equal(changed[`${kind}Once`], 1);
    assert.deepEqual(changed.last.transform, { ...initial, rotate: 90 });
    await page.keyboard.press('Escape');
    await dialog().waitFor({ state: 'hidden' });
    const closed = await demoState();
    assert.equal(closed[`${kind}Changes`], 2);
    assert.equal(closed[`${kind}Once`], 1);
    assert.deepEqual(closed.last.transform, initial);
    assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  }
  assert.deepEqual(errors, [], 'zero Vue warnings, console errors and page errors');
  console.log(
    `PASS Chrome ${browser.version()}: Image/Group typed transform arrays/once/current listeners/removal/restoration, native DOM isolation, snapshots and real image identity, controlled close refusal/reset, and the actual transform-events demo.`,
  );
} finally {
  await browser?.close();
  await server?.httpServer?.close();
  rmSync(outDir, { recursive: true, force: true });
}
