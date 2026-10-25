/** Image DOM prefix reactivity with explicitly preloaded finite-namespace CSS. D04 remains open. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { genImageStyle } from '@apollo-design/ui';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-prefix-'));
// The consumer/test build emits known namespaces before the page loads. The UI adds no runtime CSS.
const namespaces = ['p1', 'p2', 'override-a', 'override-b', 'group-a', 'group-b'];
const preloadedCss = namespaces.map((prefix) => genImageStyle(prefix)).join('\n');
let server;
let browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [
      vue(),
      {
        name: 'preload-image-prefix-test-css',
        transformIndexHtml() {
          return [
            {
              tag: 'style',
              attrs: { 'data-manually-preloaded-image-prefix-css': '' },
              children: preloadedCss,
              injectTo: 'head',
            },
          ];
        },
      },
    ],
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
  const page = await browser.newPage();
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-prefix`);
  const fixture = page.locator('[data-image-prefix-fixture]');
  assert.equal(await page.locator('style[data-manually-preloaded-image-prefix-css]').count(), 1);
  const names = [
    'standalone',
    'rich',
    'progress',
    'busy',
    'placeholder',
    'group-first',
    'group-second',
  ];
  const withImage = ['standalone', 'rich', 'group-first', 'group-second'];
  const allPrefixes = ['apollo-image', ...namespaces.map((prefix) => `${prefix}-image`)];
  const rootAt = (name) => fixture.locator(`[data-prefix-entry="${name}"]`);
  const imageAt = (name) => rootAt(name).locator('img');
  const roots = new Map();
  const images = new Map();
  for (const name of names) {
    roots.set(name, await rootAt(name).elementHandle());
    if (withImage.includes(name)) {
      const image = await imageAt(name).elementHandle();
      if (!image) throw new Error(`Missing ${name} image`);
      await page.waitForFunction(
        (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
        image,
      );
      images.set(name, image);
    }
  }
  const group = fixture.locator('[data-image-prefix-group]');
  const originalGroup = await group.elementHandle();
  const draft = page.getByRole('textbox', { name: 'Image prefix draft', exact: true });
  await draft.fill('kept image prefix draft');
  const originalDraft = await draft.elementHandle();
  await draft.focus();
  const click = (name) => fixture.getByRole('button', { name, exact: true }).click();

  const inspect = async (imagePrefix, providerPrefix, focusNode) => {
    const providerImage = `${providerPrefix ?? 'apollo'}-image`;
    const ownImage = imagePrefix ?? providerImage;
    await page.waitForFunction(
      ({ ownImage, providerImage }) => {
        const own = document.querySelector('[data-prefix-entry="standalone"]');
        const provided = document.querySelector('[data-prefix-entry="busy"]');
        return own?.classList.contains(ownImage) && provided?.classList.contains(providerImage);
      },
      { ownImage, providerImage },
    );
    for (const name of names) {
      const expected = ['busy', 'group-first', 'group-second'].includes(name)
        ? providerImage
        : ownImage;
      const root = rootAt(name);
      assert.equal(
        await root.evaluate((node, original) => node === original, roots.get(name)),
        true,
        `${name} root identity`,
      );
      const state = await root.evaluate((node) => ({
        classes: Array.from(node.classList),
        display: getComputedStyle(node).display,
        position: getComputedStyle(node).position,
      }));
      assert.deepEqual(
        state.classes.filter((value) => allPrefixes.includes(value)),
        [expected],
        `${name} current root namespace`,
      );
      assert.equal(state.display, 'inline-block', `${name} explicitly preloaded CSS`);
      assert.equal(state.position, 'relative', name);
      if (withImage.includes(name)) {
        const image = imageAt(name);
        assert.equal(
          await image.evaluate((node, original) => node === original, images.get(name)),
          true,
          `${name} image identity`,
        );
        assert.equal(
          await image.evaluate(
            (node, prefix) => node.classList.contains(`${prefix}-img`),
            expected,
          ),
          true,
          name,
        );
        assert.equal(
          await image.evaluate((node) => getComputedStyle(node).verticalAlign),
          'middle',
          `${name} image CSS`,
        );
      } else {
        assert.equal(
          await root.evaluate(
            (node, prefix) => node.classList.contains(`${prefix}-progress-wrapper`),
            expected,
          ),
          true,
          name,
        );
        assert.equal(await root.locator(`.${expected}-progress-content`).count(), 1, name);
        assert.equal(await root.locator(`.${expected}-progress-ink-1`).count(), 1, name);
      }
    }
    assert.equal(await group.evaluate((node, original) => node === original, originalGroup), true);
    assert.deepEqual(await group.evaluate((node) => Array.from(node.classList)), [
      `${providerImage}-preview-group`,
    ]);
    const progress = rootAt('progress');
    assert.equal(await progress.getAttribute('role'), 'progressbar');
    assert.equal(await progress.getAttribute('aria-valuenow'), '42');
    assert.equal(await progress.locator(`.${ownImage}-progress-rail`).count(), 1);
    assert.equal(await progress.locator(`.${ownImage}-progress-indicator`).innerText(), '42%');
    assert.equal(await rootAt('busy').getAttribute('aria-busy'), 'true');
    assert.equal(await rootAt('busy').getByRole('status').innerText(), 'Loading');
    assert.equal(await rootAt('busy').locator(`.${providerImage}-progress-rail`).count(), 0);
    assert.match(await rootAt('placeholder').innerText(), /Waiting for prefix image/);
    assert.equal(await draft.evaluate((node, original) => node === original, originalDraft), true);
    assert.equal(await draft.inputValue(), 'kept image prefix draft');
    assert.equal(await page.evaluate((node) => document.activeElement === node, focusNode), true);
  };
  const inspectPreview = async (dialog, prefix, originalDialog, originalImage, rotated) => {
    await page.waitForFunction(
      ({ prefix }) => document.querySelector('[role="dialog"]')?.classList.contains(prefix),
      { prefix },
    );
    assert.equal(
      await dialog.evaluate((node, original) => node === original, originalDialog),
      true,
    );
    assert.equal(
      await dialog.evaluate((node, expected) => node.classList.contains(expected), prefix),
      true,
    );
    const image = dialog.locator('img');
    assert.equal(await image.evaluate((node, original) => node === original, originalImage), true);
    for (const suffix of ['mask', 'body', 'img', 'close', 'footer', 'actions'])
      assert.equal(await dialog.locator(`.${prefix}-${suffix}`).count(), 1, suffix);
    const mask = dialog.locator(`.${prefix}-mask`);
    assert.equal(
      await mask.evaluate(
        (node, expected) => node.classList.contains(`${expected}-mask-hidden`),
        prefix,
      ),
      true,
    );
    assert.equal(await mask.evaluate((node) => getComputedStyle(node).display), 'none');
    assert.equal(await dialog.evaluate((node) => getComputedStyle(node).position), 'fixed');
    if (rotated)
      assert.match(await image.evaluate((node) => node.style.transform), /rotate\(90deg\)/);
    assert.equal(await dialog.evaluate((node) => document.activeElement === node), true);
  };

  await inspect('override-a-image', 'p1', originalDraft);
  await click('Replace image prefix');
  await inspect('override-b-image', 'p1', originalDraft);
  await click('Replace image provider prefix');
  await inspect('override-b-image', 'p2', originalDraft);
  await click('Remove image prefix');
  await inspect(undefined, 'p2', originalDraft);

  await rootAt('standalone').click({ position: { x: 8, y: 8 } });
  const standalone = page.getByRole('dialog', { name: 'Prefix standalone preview', exact: true });
  await standalone.waitFor();
  const standaloneNode = await standalone.elementHandle();
  const standaloneImage = await standalone.locator('img').elementHandle();
  await standalone.getByRole('button', { name: 'rotateRight', exact: true }).click();
  await standalone.focus();
  await inspectPreview(standalone, 'p2-image-preview', standaloneNode, standaloneImage, true);
  await click('Replace image prefix');
  await inspect('override-a-image', 'p2', standaloneNode);
  await inspectPreview(
    standalone,
    'override-a-image-preview',
    standaloneNode,
    standaloneImage,
    true,
  );
  await click('Replace image provider prefix');
  await inspect('override-a-image', 'p1', standaloneNode);
  await inspectPreview(
    standalone,
    'override-a-image-preview',
    standaloneNode,
    standaloneImage,
    true,
  );
  await click('Remove image prefix');
  await inspect(undefined, 'p1', standaloneNode);
  await inspectPreview(standalone, 'p1-image-preview', standaloneNode, standaloneImage, true);
  await standalone.locator('.p1-image-preview-close').click();
  await standalone.waitFor({ state: 'hidden' });
  await draft.focus();
  await click('Remove image provider prefix');
  await inspect(undefined, undefined, originalDraft);
  await click('Replace image provider prefix');
  await inspect(undefined, 'p1', originalDraft);

  await rootAt('group-first').click({ position: { x: 8, y: 8 } });
  const groupDialog = page.getByRole('dialog', { name: 'First prefix group image', exact: true });
  await groupDialog.waitFor();
  const groupDialogNode = await groupDialog.elementHandle();
  const groupImage = await groupDialog.locator('img').elementHandle();
  await groupDialog.getByRole('button', { name: 'rotateRight', exact: true }).click();
  await groupDialog.focus();
  await inspectPreview(groupDialog, 'group-a-image-preview', groupDialogNode, groupImage, true);
  assert.match(await groupDialog.locator('.group-a-image-preview-progress').innerText(), /1 \/ 2/);
  await click('Replace group preview prefix');
  await inspect(undefined, 'p1', groupDialogNode);
  await inspectPreview(groupDialog, 'group-b-image-preview', groupDialogNode, groupImage, true);
  await click('Replace image provider prefix');
  await inspect(undefined, 'p2', groupDialogNode);
  await inspectPreview(groupDialog, 'group-b-image-preview', groupDialogNode, groupImage, true);
  await click('Remove group preview prefix');
  await inspect(undefined, 'p2', groupDialogNode);
  await inspectPreview(groupDialog, 'p2-image-preview', groupDialogNode, groupImage, true);
  await groupDialog.press('ArrowRight');
  const second = page.getByRole('dialog', { name: 'Second prefix group image', exact: true });
  await second.waitFor();
  assert.match(await second.locator('.p2-image-preview-progress').innerText(), /2 \/ 2/);
  assert.equal(
    await second.locator('img').getAttribute('src'),
    await imageAt('group-second').getAttribute('src'),
  );
  assert.equal(
    await second.locator('img').evaluate((node, original) => node === original, groupImage),
    true,
  );
  await second.locator('.p2-image-preview-close').click();
  await second.waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: Image prop/provider/group prefix replacement and removal, explicit priority/default fallback, current Progress/busy/placeholder namespaces and ARIA, stable roots/images/rich input/draft, open preview/group rotation and focus preserved, actual custom mask modifier; finite custom CSS explicitly preloaded by the test build, D04 remains open; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
