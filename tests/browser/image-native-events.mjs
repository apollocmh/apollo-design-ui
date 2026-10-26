/** Public Image native events against production dist, including the actual rich-content demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-native-events-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-native-events`);
  const fixture = page.locator('[data-image-native-events-fixture]');
  await fixture.waitFor();
  const kinds = ['static', 'preview', 'percent', 'busy', 'placeholder'];
  // Modern Chromium dispatches PointerEvent for click; it is a native MouseEvent subtype.
  const eventClasses = {
    click: ['MouseEvent', 'PointerEvent'],
    keydown: ['KeyboardEvent'],
    error: ['Event'],
  };
  const normal = ['static', 'preview'];
  const progress = ['percent', 'busy', 'placeholder'];
  const rootAt = (kind) => fixture.locator(`[data-image-event-kind="${kind}"]`);
  const imageAt = (kind) => rootAt(kind).locator('img');
  const draftAt = (kind) =>
    fixture.getByRole('textbox', { name: `${kind} image event draft`, exact: true });
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-native-event-log]').textContent());
  const controls = fixture.locator('[data-image-native-events-controls]');
  const clickControl = (name) => controls.getByRole('button', { name, exact: true }).click();
  const waitLoaded = async (image) => {
    const node = await image.elementHandle();
    if (!node) throw new Error('Expected a real image');
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
    );
  };
  const originals = new Map();
  for (const kind of normal) {
    await waitLoaded(imageAt(kind));
    originals.set(kind, {
      root: await rootAt(kind).elementHandle(),
      img: await imageAt(kind).elementHandle(),
      input: await draftAt(kind).elementHandle(),
    });
  }
  const inspectAttrs = async (phase) => {
    for (const kind of kinds) {
      const node = rootAt(kind);
      const isProgress = progress.includes(kind) && !(await state()).resolved;
      const ownsGroup = kind === 'preview' && !isProgress;
      const ownsButton = kind !== 'static' && !isProgress && !ownsGroup;
      const ownRole = isProgress
        ? kind === 'percent'
          ? 'progressbar'
          : null
        : ownsGroup
          ? 'group'
          : ownsButton
            ? 'button'
            : null;
      assert.equal(
        await node.getAttribute('role'),
        ownRole ?? (phase < 2 && !isProgress ? (phase === 0 ? 'img' : 'presentation') : null),
        `${kind} role`,
      );
      assert.equal(
        await node.getAttribute('tabindex'),
        ownsButton ? '0' : phase === 0 ? '3' : phase === 1 ? '-1' : null,
        `${kind} focusability`,
      );
      assert.equal(
        await node.getAttribute('aria-label'),
        phase < 2
          ? `${kind} explicit name ${phase}`
          : ownsButton
            ? `${kind} fallback alt`
            : kind === 'percent' && isProgress
              ? '50%'
              : null,
        `${kind} name`,
      );
      if (isProgress && kind === 'percent')
        assert.equal(await node.getAttribute('aria-valuenow'), '50');
      if (ownsGroup) {
        assert.equal(await imageAt(kind).getAttribute('role'), null);
        const action = node.locator('button[data-apollo-image-preview-trigger]');
        assert.equal(await action.count(), 1);
        assert.equal(
          await action.getAttribute('aria-label'),
          `Preview image: ${phase < 2 ? `${kind} explicit name ${phase}` : `${kind} fallback alt`}`,
        );
      }
    }
  };
  const inspectNative = async (kind, name, count, revision) => {
    await page.waitForFunction(
      ({ kind, name, count }) => {
        const text = document.querySelector('[data-image-native-event-log]')?.textContent;
        return (
          text &&
          JSON.parse(text).entries.filter((entry) => entry.kind === kind && entry.listener === name)
            .length >= count
        );
      },
      { kind, name, count },
    );
    const current = await state();
    const rows = current.entries.filter((entry) => entry.kind === kind);
    const primary = rows.filter((entry) => entry.listener === name);
    const secondary = rows.filter((entry) => entry.listener === `${name}-secondary`);
    const once = rows.filter((entry) => entry.listener === `${name}-once`);
    assert.equal(primary.length, count, `${kind} ${name} count`);
    assert.equal(secondary.length, count, `${kind} ${name} array count`);
    assert.equal(once.length, 1, `${kind} ${name}.once component lifetime`);
    assert.equal(primary.at(-1).revision, revision, `${kind} ${name} current listener`);
    for (const [index, entry] of primary.entries()) {
      assert.equal(entry.eventId, secondary[index].eventId, `${kind} ${name} original object`);
      assert.ok(eventClasses[name].includes(entry.eventClass), `${kind} ${name} native type`);
      assert.equal(entry.eventType, name);
      if (name === 'error') assert.equal(entry.target, 'IMG', `${kind} img error target`);
    }
    assert.equal(once[0].eventId, primary[0].eventId, `${kind} ${name}.once original object`);
    assert.equal(current.validEvents, true);
  };
  const noPreview = async () => assert.equal(await page.getByRole('dialog').count(), 0);
  const closePreview = async (kind) => {
    const dialog = page.getByRole('dialog', { name: `${kind} fallback alt`, exact: true });
    await dialog.waitFor({ state: 'visible' });
    await dialog.locator('.apollo-image-preview-close').click();
    await dialog.waitFor({ state: 'hidden' });
    await noPreview();
  };
  const clickImage = async (kind) => {
    await imageAt(kind).click({ position: { x: 5, y: 5 } });
    if (kind !== 'static') await closePreview(kind);
    else await noPreview();
  };
  const imgError = async (kind, repeat = 1) =>
    imageAt(kind).evaluate((node, repeat) => {
      for (let i = 0; i < repeat; i++) node.dispatchEvent(new Event('error', { bubbles: false }));
    }, repeat);

  await inspectAttrs(0);
  for (const kind of normal) {
    for (const key of ['a', 'b']) {
      await rootAt(kind).press(key);
      await noPreview();
      await clickImage(kind);
    }
    await inspectNative(kind, 'keydown', 2, 0);
    await inspectNative(kind, 'click', 2, 0);
    await imgError(kind, 2);
    await inspectNative(kind, 'error', 2, 0);
    await rootAt(kind).evaluate((node) =>
      node.dispatchEvent(new Event('error', { bubbles: false })),
    );
    await inspectNative(kind, 'error', 2, 0);
  }
  const initial = (await state()).entries;
  const openIndex = initial.findIndex(
    (entry) => entry.kind === 'preview' && entry.listener === 'preview' && entry.open,
  );
  const clickIndex = initial.findIndex(
    (entry) => entry.kind === 'preview' && entry.listener === 'click',
  );
  assert.ok(
    openIndex >= 0 && openIndex < clickIndex,
    'internal preview runs before public click notification',
  );

  const richDraft = draftAt('preview');
  await richDraft.fill('kept production image event draft');
  await richDraft.click();
  await richDraft.press('End');
  await inspectNative('preview', 'click', 2, 0);
  await inspectNative('preview', 'keydown', 2, 0);
  await clickControl('Replace image native listeners');
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-image-event-kind="preview"]')
        ?.getAttribute('data-image-event-revision') === '1',
  );
  for (const phase of [1, 2, 0]) {
    await clickControl('Cycle image native attrs');
    await page.waitForFunction((phase) => {
      const text = document.querySelector('[data-image-native-event-log]')?.textContent;
      return text && JSON.parse(text).attrsPhase === phase;
    }, phase);
    await inspectAttrs(phase);
    assert.equal(await richDraft.evaluate((node) => document.activeElement === node), true);
    for (const kind of normal) {
      const saved = originals.get(kind);
      assert.equal(
        await rootAt(kind).evaluate((node, saved) => node === saved, saved.root),
        true,
        `${kind} root identity`,
      );
      assert.equal(
        await imageAt(kind).evaluate((node, saved) => node === saved, saved.img),
        true,
        `${kind} image identity`,
      );
      assert.equal(
        await draftAt(kind).evaluate((node, saved) => node === saved, saved.input),
        true,
        `${kind} input identity`,
      );
    }
    assert.equal(await richDraft.inputValue(), 'kept production image event draft');
  }
  for (const kind of normal) {
    await rootAt(kind).press('c');
    await clickImage(kind);
    await imgError(kind);
    await inspectNative(kind, 'click', 3, 1);
    await inspectNative(kind, 'keydown', 3, 1);
    await inspectNative(kind, 'error', 3, 1);
  }
  await rootAt('preview').locator('button[data-apollo-image-preview-trigger]').press('Enter');
  await closePreview('preview');
  await inspectNative('preview', 'keydown', 4, 1);
  await inspectNative('preview', 'click', 4, 1);

  for (const kind of progress) {
    for (const key of ['Enter', 'Space']) {
      await rootAt(kind).click({ position: { x: 5, y: 5 } });
      await rootAt(kind).press(key);
      await noPreview();
    }
    await rootAt(kind).evaluate((node) =>
      node.dispatchEvent(new Event('error', { bubbles: false })),
    );
    await inspectNative(kind, 'click', 2, 1);
    await inspectNative(kind, 'keydown', 2, 1);
    assert.deepEqual(
      (await state()).entries.filter(
        (entry) =>
          entry.kind === kind &&
          ['error', 'error-once', 'preview', 'update:open'].includes(entry.listener),
      ),
      [],
      `${kind} placeholder isolation`,
    );
  }
  await clickControl('Resolve image event placeholders');
  for (const kind of progress) await waitLoaded(imageAt(kind));
  await noPreview();
  await inspectAttrs(0);
  for (const kind of progress) {
    await clickImage(kind);
    await imgError(kind);
    await inspectNative(kind, 'click', 3, 1);
    await inspectNative(kind, 'keydown', 2, 1);
    await inspectNative(kind, 'error', 1, 1);
  }

  const templateRoot = fixture.locator('[data-image-event-template-root]');
  await waitLoaded(templateRoot.locator('img'));
  for (const key of ['Enter', 'Space']) {
    await templateRoot.press(key);
    await noPreview();
  }
  for (let i = 0; i < 2; i++) {
    await templateRoot.click({ position: { x: 5, y: 5 } });
    await closePreview('template');
  }
  await templateRoot.locator('img').evaluate((node) => {
    node.dispatchEvent(new Event('error', { bubbles: false }));
    node.dispatchEvent(new Event('error', { bubbles: false }));
  });
  const templateState = await state();
  const templateEntries = templateState.entries.filter((entry) => entry.kind === 'template');
  for (const name of ['click', 'keydown', 'error']) {
    const current = templateEntries.filter((entry) => entry.listener === name);
    const once = templateEntries.filter((entry) => entry.listener === `${name}-once`);
    assert.equal(current.length, 2, `template ${name}`);
    assert.equal(once.length, 1, `template ${name}.once`);
    assert.equal(once[0].eventId, current[0].eventId, `template ${name} original object`);
    for (const entry of current) {
      assert.ok(eventClasses[name].includes(entry.eventClass));
      if (name === 'keydown')
        assert.equal(entry.prevented, true, 'template .prevent before preview keyboard action');
      if (name === 'error') assert.equal(entry.target, 'IMG');
    }
  }
  assert.equal(templateState.templateBubbles, 0, 'template .stop prevents native parent bubbling');

  const demo = fixture.locator('[data-image-render-demo]');
  const demoRoot = demo.locator('[data-image-event-root]');
  const demoImage = demoRoot.locator('img');
  const demoDraft = demo.getByRole('textbox', { name: 'Image render note', exact: true });
  await waitLoaded(demoImage);
  const originalDemoRoot = await demoRoot.elementHandle();
  const originalDemoImage = await demoImage.elementHandle();
  const originalDemoDraft = await demoDraft.elementHandle();
  const demoState = async () => JSON.parse(await demo.getAttribute('data-image-event-state'));
  assert.equal(await demoRoot.getAttribute('role'), 'group');
  assert.equal(await demoRoot.getAttribute('tabindex'), '0');
  assert.equal(await demoRoot.getAttribute('aria-label'), 'Custom image event group');
  for (const key of ['a', 'b']) {
    await demoRoot.press(key);
    await demoRoot.click({ position: { x: 5, y: 5 } });
  }
  await demoImage.evaluate((node) => {
    node.dispatchEvent(new Event('error', { bubbles: false }));
    node.dispatchEvent(new Event('error', { bubbles: false }));
  });
  const actual = await demoState();
  assert.equal(actual.clicks, 2);
  assert.equal(actual.clickOnce, 1);
  assert.equal(actual.keydowns, 2);
  assert.equal(actual.keydownOnce, 1);
  assert.equal(actual.errors, 2);
  assert.equal(actual.errorOnce, 1);
  assert.equal(actual.openUpdates, 0);
  assert.ok(eventClasses.click.includes(actual.lastClickType));
  assert.equal(actual.lastKeydownType, 'KeyboardEvent');
  assert.equal(actual.lastErrorType, 'Event');
  assert.equal(actual.lastClickNative, true);
  assert.equal(actual.lastKeydownNative, true);
  assert.equal(actual.lastErrorNative, true);
  await noPreview();
  await demoDraft.fill('kept actual native event demo draft');
  await demoDraft.click();
  await demoDraft.press('End');
  await demo.getByRole('button', { name: 'Update image content', exact: true }).click();
  await waitLoaded(demoImage);
  assert.equal(
    await demoRoot.evaluate((node, original) => node === original, originalDemoRoot),
    true,
  );
  assert.equal(
    await demoImage.evaluate((node, original) => node === original, originalDemoImage),
    true,
  );
  assert.equal(
    await demoDraft.evaluate((node, original) => node === original, originalDemoDraft),
    true,
  );
  assert.equal(await demoDraft.inputValue(), 'kept actual native event demo draft');
  assert.equal(await demoDraft.evaluate((node) => document.activeElement === node), true);
  const afterDraft = await demoState();
  assert.equal(afterDraft.clicks, actual.clicks);
  assert.equal(afterDraft.keydowns, actual.keydowns);
  assert.equal(afterDraft.openUpdates, 0);
  await noPreview();
  assert.deepEqual(errors, [], 'zero Vue warnings, console errors or page errors');
  console.log(
    `Image native events browser passed (${await browser.version()}); two preview modes, current arrays/once/native payloads, attrs, three placeholders, rich draft and actual demo verified.`,
  );
} finally {
  await browser?.close();
  await server?.httpServer?.close();
  rmSync(outDir, { recursive: true, force: true });
}
