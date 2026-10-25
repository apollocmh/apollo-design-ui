/** Live provider popup semantics against production Image/Group and the actual demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-popup-provider-'));
const parts = ['root', 'mask', 'body', 'footer', 'actions', 'close'];
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-popup-provider`);
  const fixture = page.locator('[data-image-popup-provider-fixture]');
  const target = fixture.locator('[data-image-popup-target]');
  const dialog = () => page.getByRole('dialog');
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-popup-state]').textContent());
  const click = (name) =>
    fixture
      .locator('[data-image-popup-controls]')
      .getByRole('button', { name, exact: true })
      .click();
  const waitState = async (key, value) =>
    page.waitForFunction(
      ({ key, value }) => {
        const text = document.querySelector('[data-image-popup-state]')?.textContent;
        return text && JSON.parse(text)[key] === value;
      },
      { key, value },
    );
  const waitLoaded = async (locator) => {
    const node = await locator.elementHandle();
    if (!node) throw new Error('Expected real image');
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
    );
  };
  const open = async (opener) => {
    await opener.click({ position: { x: 6, y: 6 } });
    await dialog().waitFor({ state: 'visible' });
    await waitLoaded(dialog().locator('img'));
    const node = await dialog().elementHandle();
    await page.waitForFunction((node) => node && getComputedStyle(node).opacity === '1', node);
  };
  const assertPopup = async (revision, local = false, deep = false) => {
    for (const part of parts) {
      const node = part === 'root' ? dialog() : dialog().locator(`.apollo-image-preview-${part}`);
      const expected = deep && part === 'mask' ? 'deep' : revision;
      const actual = await node.evaluate(
        (node, part) => ({
          classes: [...node.classList],
          inline: node.style.getPropertyValue(`--popup-provider-${part}`),
          computed: getComputedStyle(node).getPropertyValue(`--popup-provider-${part}`).trim(),
        }),
        part,
      );
      for (const value of ['first', 'current', 'deep'])
        assert.equal(
          actual.classes.includes(`popup-provider-${value}-${part}`),
          value === expected,
        );
      const style = part === 'root' && local ? '' : (expected ?? '');
      assert.equal(actual.inline, style);
      assert.equal(actual.computed, style);
    }
    assert.equal(
      await dialog().evaluate((node) => node.classList.contains('native-popup-root')),
      false,
    );
    assert.equal(await dialog().evaluate((node) => node.style.paddingLeft), '');
    if (local) {
      assert.equal(
        await dialog().evaluate((node) => node.classList.contains('popup-local-root')),
        true,
      );
      assert.equal(
        await dialog().evaluate((node) => node.style.getPropertyValue('--popup-local-root')),
        'kept',
      );
    }
  };
  for (const kind of ['image', 'group']) {
    const session = (await state()).session;
    await click(`Mount popup ${kind}`);
    await waitState('session', session + 1);
    const opener = target.locator('[data-popup-provider-trigger]');
    await waitLoaded(opener.locator('img'));
    await open(opener);
    await assertPopup('first');
    await dialog().getByRole('button', { name: 'rotateRight', exact: true }).click();
    const input = dialog().getByRole('textbox', { name: 'Provider popup note', exact: true });
    await input.fill('Kept popup draft');
    await input.evaluate((node) => node.setSelectionRange(2, 6));
    const saved = {
      root: await dialog().elementHandle(),
      image: await dialog().locator('img').elementHandle(),
      input: await input.elementHandle(),
    };
    const stable = async () => {
      assert.equal(
        await dialog().evaluate((node, original) => node === original, saved.root),
        true,
      );
      assert.equal(
        await dialog()
          .locator('img')
          .evaluate((node, original) => node === original, saved.image),
        true,
      );
      assert.equal(await input.evaluate((node, original) => node === original, saved.input), true);
      assert.equal(await input.inputValue(), 'Kept popup draft');
      assert.deepEqual(
        await input.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [2, 6],
      );
      assert.equal(await input.evaluate((node) => document.activeElement === node), true);
      assert.match(await dialog().locator('img').getAttribute('style'), /rotate\(90deg\)/);
      assert.equal(
        await target
          .locator('[data-popup-native-root]')
          .evaluate(
            (node) =>
              node.classList.contains('native-popup-root') && node.style.paddingLeft === '9px',
          ),
        true,
      );
    };
    for (const [name, revision] of [
      ['Replace popup fields', 'current'],
      ['Replace popup image', 'first'],
      ['Replace popup map', 'current'],
    ]) {
      await click(name);
      await waitState('revision', revision);
      await assertPopup(revision);
      await stable();
    }
    await click('Remove popup fields');
    await assertPopup();
    await stable();
    await click('Add popup provider');
    await assertPopup('first');
    await stable();
    await click('Mutate popup mask');
    await assertPopup('first', false, true);
    await stable();
    await click('Remove popup provider');
    await assertPopup();
    await stable();
    await click('Add popup provider');
    await assertPopup('first');
    await click('Toggle local popup overrides');
    await waitState('local', true);
    await assertPopup('first', true);
    await stable();
    await click('Remove popup provider');
    await assertPopup(undefined, true);
    await stable();
    await dialog().getByRole('button', { name: 'Close preview', exact: true }).click();
    await dialog().waitFor({ state: 'hidden' });
    assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  }

  const demo = fixture.locator('[data-image-popup-provider-demo]');
  for (const kind of ['image', 'group']) {
    while ((await demo.locator('[data-popup-demo-mode]').textContent()) !== 'empty') {
      await demo.getByRole('button', { name: 'Cycle popup provider', exact: true }).click();
    }
    const opener = demo.locator(`[data-popup-demo-${kind}]`);
    await waitLoaded(opener.locator('img'));
    await open(opener);
    await dialog().getByRole('button', { name: 'rotateRight', exact: true }).click();
    for (const mode of ['A', 'B', 'removed']) {
      await dialog().getByRole('button', { name: 'Cycle popup provider', exact: true }).click();
      assert.equal(await demo.locator('[data-popup-demo-mode]').textContent(), mode);
      assert.equal(
        await dialog().evaluate((node) => node.classList.contains('popup-demo-local')),
        true,
      );
      for (const value of ['A', 'B'])
        assert.equal(
          await dialog().evaluate(
            (node, name) => node.classList.contains(name),
            `popup-demo-${value}`,
          ),
          mode === value,
        );
      assert.equal(
        await dialog().evaluate((node) => node.style.getPropertyValue('--popup-demo-mode')),
        mode === 'removed' ? '' : mode,
      );
      assert.match(await dialog().locator('img').getAttribute('style'), /rotate\(90deg\)/);
    }
    await page.keyboard.press('Escape');
    await dialog().waitFor({ state: 'hidden' });
    assert.equal(await opener.evaluate((node) => document.activeElement === node), true);
  }
  assert.deepEqual(errors, [], 'zero Vue warnings, console errors or page errors');
  console.log(
    `PASS Chrome ${browser.version()}: current Image/Group provider classes/styles on six popup nodes, fields/image/map/late/remove/deep, local shallow priority, native attrs isolation, stable preview/image/editor/focus/selection/rotation and the actual provider demo.`,
  );
} finally {
  await browser?.close();
  await server?.httpServer?.close();
  rmSync(outDir, { recursive: true, force: true });
}
