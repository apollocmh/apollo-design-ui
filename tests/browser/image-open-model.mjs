/** Native Image/Group open models and typed domain events against production dist and real demos. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-open-model-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-open-model`);
  const fixture = page.locator('[data-image-open-model-fixture]');
  const target = fixture.locator('[data-image-open-model-target]');
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-open-model-state]').textContent());
  const click = (name) => fixture.getByRole('button', { name, exact: true }).click();
  const noDialog = async () => assert.equal(await page.getByRole('dialog').count(), 0);
  const opened = async () => {
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.count(), 1);
    return dialog;
  };
  const close = async () => {
    const dialog = await opened();
    await dialog.locator('.apollo-image-preview-close').click();
    return dialog;
  };
  const assertCloseRefused = async () => {
    const dialog = await opened();
    const node = await dialog.elementHandle();
    if (!node) throw new Error('Expected the controlled preview');
    await page.waitForFunction(
      (node) => node.isConnected && getComputedStyle(node).opacity === '1',
      node,
    );
    const retained = await dialog.evaluate(async (node) => {
      // Observe beyond the existing 500ms leave deadline, including animation frames.
      const started = performance.now();
      while (performance.now() - started < 650) {
        const style = getComputedStyle(node);
        if (
          !node.isConnected ||
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          Number(style.opacity) < 1
        )
          return false;
        await new Promise(requestAnimationFrame);
      }
      return node.isConnected;
    });
    assert.equal(
      retained,
      true,
      'a refused close keeps the preview visible beyond the leave deadline',
    );
  };
  const waitLoaded = async (image) => {
    const node = await image.elementHandle();
    if (!node) throw new Error('Expected the actual image');
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
    );
  };
  const waitState = async (key, value) =>
    page.waitForFunction(
      ({ key, value }) => {
        const text = document.querySelector('[data-image-open-model-state]')?.textContent;
        return text && JSON.parse(text)[key] === value;
      },
      { key, value },
    );
  const mount = async (kind, mode, initiallyOpen = false) => {
    const previousSession = (await state()).session;
    const name =
      mode === 'model'
        ? `Mount ${kind} model ${initiallyOpen ? 'open' : 'closed'}`
        : mode === 'refuse'
          ? `Mount refusing ${kind}`
          : `Mount default-open ${kind}`;
    await click(name);
    await waitState('session', previousSession + 1);
    await waitState('target', kind === 'image' ? 'Image' : 'PreviewGroup');
    await waitState('scenario', mode);
    await waitLoaded(target.locator('img').first());
    assert.deepEqual((await state()).entries, []);
    if (initiallyOpen || mode === 'uncontrolled') await opened();
    else await noDialog();
  };
  const trigger = async (kind) => {
    const image =
      kind === 'image'
        ? target.locator('.apollo-image')
        : target.locator('[data-model-group-index="1"]');
    await image.click({ position: { x: 6, y: 6 } });
  };
  const snapshot = async () => {
    const roots = target.locator('.apollo-image');
    const images = target.locator('.apollo-image-img');
    return { roots: await roots.elementHandles(), images: await images.elementHandles() };
  };
  const sameNodes = async (saved) => {
    for (const [index, node] of saved.roots.entries())
      assert.equal(
        await target
          .locator('.apollo-image')
          .nth(index)
          .evaluate((current, original) => current === original, node),
        true,
      );
    for (const [index, node] of saved.images.entries())
      assert.equal(
        await target
          .locator('.apollo-image-img')
          .nth(index)
          .evaluate((current, original) => current === original, node),
        true,
      );
  };
  const assertOpenEvents = async (expected) => {
    const entries = (await state()).entries;
    for (const listener of ['open-change', 'open-change-secondary']) {
      assert.deepEqual(
        entries
          .filter((entry) => entry.listener === listener)
          .map(({ next, previous, revision }) => [next, previous, revision]),
        expected,
        listener,
      );
    }
    for (const listener of ['update:open', 'update:open-secondary']) {
      assert.deepEqual(
        entries
          .filter((entry) => entry.listener === listener)
          .map(({ next, revision }) => [next, revision]),
        expected.map(([next, , revision]) => [next, revision]),
        listener,
      );
    }
    const first = expected.slice(0, 1);
    assert.deepEqual(
      entries
        .filter((entry) => entry.listener === 'open-change-once')
        .map(({ next, previous, revision }) => [next, previous, revision]),
      first,
    );
    assert.deepEqual(
      entries
        .filter((entry) => entry.listener === 'update:open-once')
        .map(({ next, revision }) => [next, revision]),
      first.map(([next, , revision]) => [next, revision]),
    );
  };
  const assertCurrentEvents = async (expected) => {
    const entries = (await state()).entries;
    for (const listener of ['change', 'change-secondary']) {
      assert.deepEqual(
        entries
          .filter((entry) => entry.listener === listener)
          .map(({ next, previous, revision }) => [next, previous, revision]),
        expected,
        listener,
      );
    }
    for (const listener of ['update:current', 'update:current-secondary']) {
      assert.deepEqual(
        entries
          .filter((entry) => entry.listener === listener)
          .map(({ next, revision }) => [next, revision]),
        expected.map(([next, , revision]) => [next, revision]),
        listener,
      );
    }
    assert.deepEqual(
      entries
        .filter((entry) => entry.listener === 'change-once')
        .map(({ next, previous, revision }) => [next, previous, revision]),
      expected.slice(0, 1),
    );
    assert.deepEqual(
      entries
        .filter((entry) => entry.listener === 'update:current-once')
        .map(({ next, revision }) => [next, revision]),
      expected.slice(0, 1).map(([next, , revision]) => [next, revision]),
    );
  };

  for (const kind of ['image', 'group']) {
    await mount(kind, 'model', true);
    const nodes = await snapshot();
    await assertOpenEvents([]);
    await click('Set parent model closed');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await noDialog();
    await assertOpenEvents([]);
    await click('Set parent model open');
    await opened();
    await assertOpenEvents([]);
    await click('Replace model listeners');
    await waitState('listenerRevision', 1);
    let closing = await close();
    await closing.waitFor({ state: 'hidden' });
    await waitState('open', false);
    await assertOpenEvents([[false, true, 1]]);
    await trigger(kind);
    let dialog = await opened();
    await waitState('open', true);
    await assertOpenEvents([
      [false, true, 1],
      [true, false, 1],
    ]);
    if (kind === 'group') {
      await waitState('current', 1);
      await assertCurrentEvents([[1, 0, 1]]);
      await dialog.press('ArrowRight');
      await waitState('current', 2);
      await assertCurrentEvents([
        [1, 0, 1],
        [2, 1, 1],
      ]);
      await click('Set parent group index');
      await waitState('current', 0);
      assert.equal(
        await page.getByRole('dialog').getAttribute('aria-label'),
        'Group model image 1',
      );
      await assertCurrentEvents([
        [1, 0, 1],
        [2, 1, 1],
      ]);
    }
    dialog = await opened();
    await dialog.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await waitState('open', false);
    await assertOpenEvents([
      [false, true, 1],
      [true, false, 1],
      [false, true, 1],
    ]);
    await sameNodes(nodes);

    await mount(kind, 'model');
    await trigger(kind);
    await opened();
    await waitState('open', true);
    closing = await close();
    await closing.waitFor({ state: 'hidden' });
    await waitState('open', false);
    await assertOpenEvents([
      [true, false, 0],
      [false, true, 0],
    ]);

    await mount(kind, 'refuse');
    await trigger(kind);
    await assertOpenEvents([[true, false, 0]]);
    await noDialog();
    assert.equal((await state()).refusedOpen, false);
    await click('Accept controlled open');
    await opened();
    await assertOpenEvents([[true, false, 0]]);
    await close();
    await assertCloseRefused();
    assert.equal((await state()).refusedOpen, true);
    await assertOpenEvents([
      [true, false, 0],
      [false, true, 0],
    ]);
    await click('Replace model listeners');
    await waitState('listenerRevision', 1);
    await close();
    await assertCloseRefused();
    await assertOpenEvents([
      [true, false, 0],
      [false, true, 0],
      [false, true, 1],
    ]);
    await click('Accept controlled close');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await noDialog();
    await assertOpenEvents([
      [true, false, 0],
      [false, true, 0],
      [false, true, 1],
    ]);

    await mount(kind, 'uncontrolled');
    await assertOpenEvents([]);
    closing = await close();
    await closing.waitFor({ state: 'hidden' });
    await assertOpenEvents([[false, true, 0]]);
    for (const seed of [false, true]) {
      await click('Toggle default seed');
      await waitState('defaultSeed', seed);
      await noDialog();
      await assertOpenEvents([[false, true, 0]]);
    }
    await click('Replace model listeners');
    await waitState('listenerRevision', 1);
    await trigger(kind);
    await opened();
    await assertOpenEvents([
      [false, true, 0],
      [true, false, 1],
    ]);
    await click('Toggle default seed');
    await waitState('defaultSeed', false);
    await opened();
    closing = await close();
    await closing.waitFor({ state: 'hidden' });
    await assertOpenEvents([
      [false, true, 0],
      [true, false, 1],
      [false, true, 1],
    ]);
  }

  const imageDemo = page.locator('[data-image-controlled-demo]');
  const demoImage = imageDemo.locator('.apollo-image').first();
  await waitLoaded(demoImage.locator('img'));
  const originalDemoImage = await demoImage.elementHandle();
  const demoButton = imageDemo.getByRole('button', {
    name: 'Open controlled image preview',
    exact: true,
  });
  await demoButton.evaluate((node) => node.scrollIntoView({ block: 'center' }));
  await demoButton.click();
  let dialog = await opened();
  assert.equal(await dialog.getAttribute('aria-label'), 'Controlled preview image');
  assert.equal(await imageDemo.locator('[data-image-controlled-open]').innerText(), 'true');
  assert.equal(await imageDemo.locator('[data-image-controlled-open-changes]').innerText(), '0');
  let closing = await close();
  await closing.waitFor({ state: 'hidden' });
  assert.equal(await imageDemo.locator('[data-image-controlled-open]').innerText(), 'false');
  assert.equal(
    await imageDemo.locator('[data-image-controlled-open-transition]').innerText(),
    'true → false',
  );
  await demoImage.click({ position: { x: 5, y: 5 } });
  dialog = await opened();
  assert.equal(
    await imageDemo.locator('[data-image-controlled-open-transition]').innerText(),
    'false → true',
  );
  await dialog.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await imageDemo.locator('[data-image-controlled-open-changes]').innerText(), '3');
  assert.equal(
    await demoImage.evaluate((node, original) => node === original, originalDemoImage),
    true,
  );
  const showDefault = imageDemo.getByRole('button', {
    name: 'Show initially open image',
    exact: true,
  });
  await showDefault.evaluate((node) => node.scrollIntoView({ block: 'center' }));
  await showDefault.click();
  dialog = await opened();
  assert.equal(await dialog.getAttribute('aria-label'), 'Initially open preview image');
  assert.equal(await imageDemo.locator('[data-image-default-open-changes]').innerText(), '0');
  closing = await close();
  await closing.waitFor({ state: 'hidden' });
  assert.equal(
    await imageDemo.locator('[data-image-default-open-transition]').innerText(),
    'true → false',
  );
  await imageDemo.getByRole('button', { name: 'Remove initially open image', exact: true }).click();

  const groupDemo = page.locator('[data-image-group-model-demo]');
  const groupButton = groupDemo.getByRole('button', {
    name: 'Open controlled group preview',
    exact: true,
  });
  await groupButton.evaluate((node) => node.scrollIntoView({ block: 'center' }));
  await groupButton.click();
  dialog = await opened();
  assert.equal(await dialog.getAttribute('aria-label'), 'Controlled group image 1');
  assert.equal(await groupDemo.locator('[data-image-group-open-changes]').innerText(), '0');
  await dialog.press('ArrowRight');
  assert.equal(await groupDemo.locator('[data-image-group-current]').innerText(), '1');
  assert.equal(
    await groupDemo.locator('[data-image-group-current-transition]').innerText(),
    '0 → 1',
  );
  closing = await close();
  await closing.waitFor({ state: 'hidden' });
  assert.equal(await groupDemo.locator('[data-image-group-open]').innerText(), 'false');
  assert.equal(
    await groupDemo.locator('[data-image-group-open-transition]').innerText(),
    'true → false',
  );
  await groupDemo.getByRole('button', { name: 'Next image from parent', exact: true }).click();
  assert.equal(await groupDemo.locator('[data-image-group-current]').innerText(), '2');
  assert.equal(await groupDemo.locator('[data-image-group-current-changes]').innerText(), '1');
  await groupButton.click();
  dialog = await opened();
  assert.equal(await dialog.getAttribute('aria-label'), 'Controlled group image 3');
  await dialog.press('ArrowLeft');
  assert.equal(await groupDemo.locator('[data-image-group-current]').innerText(), '1');
  assert.equal(
    await groupDemo.locator('[data-image-group-current-transition]').innerText(),
    '2 → 1',
  );
  closing = await close();
  await closing.waitFor({ state: 'hidden' });
  await noDialog();
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: real Vue Image/Group v-model initial true/false and external control, internal close/open model updates, controlled rejection, defaultOpen initialization/late-default immunity, exact previous state, listener arrays/.once/current replacement, group index model/domain notifications, stable original image nodes and both actual controlled demos; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
