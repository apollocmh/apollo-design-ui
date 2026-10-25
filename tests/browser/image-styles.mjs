/** Image native root styles against production dist and the actual style demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-styles-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-styles`);
  const fixture = page.locator('[data-image-style-fixture]');
  const names = ['normal', 'percent', 'busy', 'placeholder'];
  const roots = new Map();
  const rootFor = (name) => fixture.locator(`[data-image-style-kind="${name}"]`);
  for (const name of names) roots.set(name, await rootFor(name).elementHandle());
  const image = rootFor('normal').locator('img');
  const originalImage = await image.elementHandle();
  await page.waitForFunction(
    (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
    originalImage,
  );
  const input = page.getByRole('textbox', { name: 'Image style fixture draft', exact: true });
  await input.fill('kept fixture image draft');
  const originalInput = await input.elementHandle();
  const inspect = async (phase, revision = 0) => {
    for (const name of names) {
      const node = rootFor(name);
      assert.equal(
        await node.evaluate((node, saved) => node === saved, roots.get(name)),
        true,
        name,
      );
      const actual = await node.evaluate((node) => ({
        width: node.style.maxWidth,
        top: node.style.paddingTop,
        bottom: node.style.paddingBottom,
        end: node.style.paddingInlineEnd,
        computedTop: getComputedStyle(node).paddingTop,
        marker: node.style.getPropertyValue('--native-phase'),
        stringOnly: node.style.getPropertyValue('--string-only'),
        arrayOnly: node.style.getPropertyValue('--array-only'),
        semantic: node.style.getPropertyValue('--semantic-root'),
        progress: node.style.getPropertyValue('--semantic-progress'),
        classes: Array.from(node.classList),
        cssNames: Array.from(node.style),
        serialized: node.getAttribute('style') ?? '',
      }));
      const fallback = name === 'normal' ? '4px' : '8px';
      assert.equal(
        actual.width,
        phase === 0
          ? '300px'
          : phase === 1
            ? '340px'
            : phase === 2
              ? '360px'
              : name === 'normal'
                ? '240px'
                : '220px',
        `${name} width`,
      );
      assert.equal(
        actual.top,
        phase === 0 ? '20px' : phase === 2 ? '24px' : fallback,
        `${name} top`,
      );
      assert.equal(actual.computedTop, actual.top, `${name} computed padding`);
      assert.equal(actual.bottom, phase === 1 ? '10px' : '', `${name} old bottom removed`);
      assert.equal(actual.end, phase === 2 ? '9px' : '', `${name} old end removed`);
      assert.equal(actual.marker, ['string', 'array', 'object', ''][phase], name);
      assert.equal(actual.stringOnly, phase === 0 ? 'yes' : '', name);
      assert.equal(actual.arrayOnly, phase === 1 ? 'yes' : '', name);
      assert.equal(actual.semantic, 'kept', name);
      assert.equal(actual.progress, name === 'normal' ? '' : 'kept', name);
      assert.ok(actual.classes.includes(`semantic-${name}-image-root`), name);
      assert.equal(actual.classes.includes('native-image-root'), phase < 3, name);
      for (const candidate of [0, 1, 2])
        assert.equal(
          actual.classes.includes(`native-image-phase-${candidate}`),
          candidate === phase,
          `${name} class removal`,
        );
      if (name !== 'normal')
        assert.ok(actual.classes.includes(`semantic-${name}-progress-root`), name);
      assert.equal(
        actual.cssNames.some((key) => /^\d+$/.test(key)),
        false,
        name,
      );
      assert.equal(/(?:^|;)\s*\d+\s*:/.test(actual.serialized), false, name);
      assert.equal(await node.getAttribute('id'), `native-image-${name}-${revision}`);
      assert.equal(await node.getAttribute('data-live-revision'), String(revision));
      assert.equal(await node.getAttribute('aria-describedby'), 'image-style-fixture-help');
    }
    assert.equal(await image.evaluate((node, saved) => node === saved, originalImage), true);
    assert.equal(await image.evaluate((node) => getComputedStyle(node).paddingTop), '6px');
    assert.equal(await image.evaluate((node) => node.style.maxWidth), '');
    assert.equal(await image.evaluate((node) => node.style.paddingBottom), '');
    assert.equal(await image.evaluate((node) => node.style.getPropertyValue('--native-phase')), '');
    assert.equal(await image.evaluate((node) => node.style.getPropertyValue('--string-only')), '');
    assert.equal(await input.evaluate((node, saved) => node === saved, originalInput), true);
    assert.equal(await input.inputValue(), 'kept fixture image draft');
  };
  const inspectProgress = async (revision, labeled) => {
    for (const name of ['percent', 'busy', 'placeholder']) {
      const node = rootFor(name);
      assert.equal(await node.getAttribute('role'), name === 'percent' ? 'progressbar' : null);
      assert.equal(await node.getAttribute('aria-valuemin'), name === 'percent' ? '0' : null);
      assert.equal(await node.getAttribute('aria-valuemax'), name === 'percent' ? '100' : null);
      assert.equal(await node.getAttribute('aria-valuenow'), name === 'percent' ? '50' : null);
      assert.equal(await node.getAttribute('aria-busy'), name === 'percent' ? null : 'true');
      assert.equal(
        await node.getAttribute('aria-label'),
        labeled ? `${name} image progress ${revision}` : name === 'percent' ? '50%' : null,
      );
    }
  };
  await inspect(0);
  await inspectProgress(0, true);
  const cycle = fixture.getByRole('button', { name: 'Cycle image fixture styles', exact: true });
  for (const phase of [1, 2, 3, 0]) {
    await input.focus();
    await cycle.click();
    assert.equal(await fixture.locator('[data-image-style-phase]').innerText(), String(phase));
    await inspect(phase);
    assert.equal(await input.evaluate((node) => document.activeElement === node), true);
  }
  await fixture.getByRole('button', { name: 'Replace image attrs only', exact: true }).click();
  await inspect(0, 1);
  await inspectProgress(1, true);
  assert.equal(
    await fixture.locator('[data-current-image-style-title]').innerText(),
    'Image attrs 1',
  );
  assert.equal(await input.evaluate((node) => document.activeElement === node), true);
  const labels = fixture.getByRole('button', { name: 'Toggle image progress labels', exact: true });
  await labels.click();
  await inspectProgress(1, false);
  await labels.click();
  await inspectProgress(1, true);
  const state = async () =>
    JSON.parse(await fixture.locator('[data-image-style-events]').innerText());
  assert.deepEqual((await state()).clicks, { normal: 0, percent: 0, busy: 0, placeholder: 0 });
  for (const name of names) await rootFor(name).click({ position: { x: 10, y: 10 } });
  assert.deepEqual((await state()).clicks, { normal: 1, percent: 1, busy: 1, placeholder: 1 });
  assert.equal((await state()).previews, 0);
  assert.equal(await page.getByRole('dialog').count(), 0);
  for (const name of ['percent', 'busy', 'placeholder']) await rootFor(name).dispatchEvent('error');
  assert.deepEqual((await state()).errors, { normal: 0, percent: 0, busy: 0, placeholder: 0 });
  await image.dispatchEvent('error');
  assert.deepEqual((await state()).errors, { normal: 1, percent: 0, busy: 0, placeholder: 0 });
  assert.equal((await state()).validEvents, true);

  const demo = page.locator('[data-image-native-style-demo]');
  const demoRoot = demo.locator('[data-image-native-style]');
  const demoProgress = demo.locator('[data-image-native-progress-style]');
  const demoRoots = [await demoRoot.elementHandle(), await demoProgress.elementHandle()];
  const demoImage = demoRoot.locator('img');
  const originalDemoImage = await demoImage.elementHandle();
  const demoInput = page.getByRole('textbox', { name: 'Native image style draft', exact: true });
  await demoInput.fill('kept actual image style demo draft');
  const originalDemoInput = await demoInput.elementHandle();
  const markers = ['string', 'array', 'object', ''];
  const tops = [
    'var(--apollo-padding-xs)',
    'var(--apollo-padding-sm)',
    'var(--apollo-padding-md)',
    'var(--apollo-padding-xxs)',
  ];
  for (const phase of [0, 1, 2, 3]) {
    if (phase > 0)
      await demo.getByRole('button', { name: 'Cycle native image styles', exact: true }).click();
    for (const [index, node] of [demoRoot, demoProgress].entries()) {
      assert.equal(await node.evaluate((node, saved) => node === saved, demoRoots[index]), true);
      assert.equal(await node.evaluate((node) => node.style.paddingTop), tops[phase]);
      assert.equal(
        await node.evaluate((node) => node.style.getPropertyValue('--native-demo-phase')),
        markers[phase],
      );
      assert.equal(
        await node.evaluate((node) => node.style.getPropertyValue('--semantic-demo-root')),
        'kept',
      );
      assert.equal(
        await node.evaluate((node) => node.classList.contains('native-demo-root')),
        phase < 3,
      );
      for (const old of [0, 1, 2])
        assert.equal(
          await node.evaluate(
            (node, cls) => node.classList.contains(cls),
            `native-demo-phase-${old}`,
          ),
          old === phase,
        );
      assert.equal(
        await node.evaluate((node) => node.style.paddingInlineEnd),
        phase === 1 ? 'var(--apollo-padding-xs)' : '',
      );
      assert.equal(
        await node.evaluate((node) => node.style.paddingInlineStart),
        phase === 2 ? 'var(--apollo-padding-xs)' : '',
      );
      assert.equal(
        await node.evaluate((node) => /(?:^|;)\s*\d+\s*:/.test(node.getAttribute('style') ?? '')),
        false,
      );
    }
    assert.equal(
      await demoImage.evaluate((node, saved) => node === saved, originalDemoImage),
      true,
    );
    assert.equal(
      await demoImage.evaluate((node) => node.style.paddingTop),
      'var(--apollo-padding-xxs)',
    );
    assert.equal(
      await demoImage.evaluate((node) => node.style.getPropertyValue('--native-demo-phase')),
      '',
    );
    assert.equal(
      await demoInput.evaluate((node, saved) => node === saved, originalDemoInput),
      true,
    );
    assert.equal(await demoInput.inputValue(), 'kept actual image style demo draft');
    assert.equal(await demoInput.evaluate((node) => document.activeElement === node), true);
  }
  assert.equal(
    await demoRoot.evaluate((node) => node.classList.contains('semantic-demo-image-root')),
    true,
  );
  assert.equal(
    await demoProgress.evaluate((node) => node.classList.contains('semantic-demo-progress-root')),
    true,
  );
  assert.equal(
    await demoProgress.evaluate((node) =>
      node.classList.contains('semantic-demo-progress-content'),
    ),
    true,
  );
  assert.equal(await demoProgress.getAttribute('id'), 'native-image-progress');
  assert.equal(await demoProgress.getAttribute('role'), 'progressbar');
  assert.equal(await demoProgress.getAttribute('aria-valuenow'), '50');
  assert.equal(await demoProgress.getAttribute('aria-describedby'), 'native-image-style-help');
  assert.equal(await demoProgress.getAttribute('aria-label'), 'Native image loading progress');
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: production Image raw string/array/object/removal and attrs-only changes, root/img independent padding and variables, stable rich img/input/draft/focus, percent/busy/plain-placeholder root attrs and protected ARIA, label fallback, single clicks without preview and img-only errors; actual style demo passed; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
