/** Image current object ConfigProvider semantics against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-provider-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-provider`);
  const fixture = page.locator('[data-image-provider-fixture]');
  const rootAt = (name) => fixture.locator(`[data-image-provider-entry="${name}"] .apollo-image`);
  const imageAt = (name) => rootAt(name).locator('img.apollo-image-img');
  const names = ['cover', 'rich'];
  const roots = [];
  const images = [];
  for (const name of names) {
    const image = await imageAt(name).elementHandle();
    if (!image) throw new Error(`Missing ${name} image`);
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      image,
    );
    roots.push(await rootAt(name).elementHandle());
    images.push(image);
  }
  const cover = rootAt('cover').locator('.apollo-image-cover');
  const originalCover = await cover.elementHandle();
  const draft = page.getByRole('textbox', { name: 'Image provider draft', exact: true });
  await draft.fill('kept image provider draft');
  const originalDraft = await draft.elementHandle();
  await draft.focus();

  const inspect = async (revision, present = true) => {
    const top = present ? `${revision + 5}px` : '';
    const opacity = present ? String(Number((0.35 + revision * 0.05).toFixed(2))) : '';
    await page.waitForFunction(
      ({ top, opacity, revision, present }) => {
        const root = document.querySelector('[data-image-provider-entry="rich"] .apollo-image');
        const image = root?.querySelector('.apollo-image-img');
        return (
          root instanceof HTMLElement &&
          image instanceof HTMLImageElement &&
          root.style.paddingTop === top &&
          image.style.opacity === opacity &&
          root.classList.contains(`provider-${revision}-root`) === present
        );
      },
      { top, opacity, revision, present },
    );
    assert.equal(
      await fixture.locator('[data-image-provider-revision]').innerText(),
      String(revision),
    );
    for (const [index, name] of names.entries()) {
      const root = rootAt(name);
      const image = imageAt(name);
      assert.equal(
        await root.evaluate((node, original) => node === original, roots[index]),
        true,
        `${name} root identity`,
      );
      assert.equal(
        await image.evaluate((node, original) => node === original, images[index]),
        true,
        `${name} image identity`,
      );
      const rootState = await root.evaluate((node) => ({
        classes: Array.from(node.classList),
        top: node.style.paddingTop,
        maxWidth: node.style.maxWidth,
        minHeight: node.style.minHeight,
        paddingLeft: node.style.paddingLeft,
      }));
      const imageState = await image.evaluate((node) => ({
        classes: Array.from(node.classList),
        opacity: node.style.opacity,
        objectFit: node.style.objectFit,
      }));
      for (const [kind, classes] of [
        ['root', rootState.classes],
        ['image', imageState.classes],
      ]) {
        assert.deepEqual(
          classes.filter((value) => /^provider-\d+-(?:root|image|cover)$/.test(value)),
          present ? [`provider-${revision}-${kind}`] : [],
          `${name} current ${kind} provider classes`,
        );
        assert.equal(classes.includes(`local-provider-${kind}`), true, `${name} local ${kind}`);
      }
      assert.equal(rootState.classes.includes('native-provider-root'), true, name);
      assert.equal(rootState.top, top, name);
      assert.equal(rootState.maxWidth, '340px', `${name} native over local over provider`);
      assert.equal(rootState.minHeight, '31px', `${name} local root style`);
      assert.equal(rootState.paddingLeft, '9px', `${name} native root style`);
      assert.equal(imageState.opacity, opacity, `${name} current provider image style`);
      assert.equal(imageState.objectFit, 'contain', `${name} local image style override`);
    }
    assert.equal(await cover.evaluate((node, original) => node === original, originalCover), true);
    const coverState = await cover.evaluate((node) => ({
      classes: Array.from(node.classList),
      paddingLeft: node.style.paddingLeft,
      paddingRight: node.style.paddingRight,
      color: node.style.color,
    }));
    assert.deepEqual(
      coverState.classes.filter((value) => /^provider-\d+-cover$/.test(value)),
      present ? [`provider-${revision}-cover`] : [],
    );
    assert.equal(coverState.classes.includes('local-provider-cover'), true);
    assert.equal(coverState.paddingLeft, present ? `${revision + 2}px` : '');
    assert.equal(coverState.paddingRight, '11px');
    assert.equal(coverState.color, 'rgb(70, 80, 90)');
    assert.equal(await draft.evaluate((node, original) => node === original, originalDraft), true);
    assert.equal(await draft.inputValue(), 'kept image provider draft');
    assert.equal(await draft.evaluate((node) => document.activeElement === node), true);
    const slot = fixture.locator('[data-image-provider-slot]');
    assert.equal(
      await slot.getAttribute('data-slot-src'),
      await imageAt('rich').getAttribute('src'),
    );
    assert.equal(
      await slot.getAttribute('data-slot-image-class'),
      present ? `provider-${revision}-image local-provider-image` : 'local-provider-image',
    );
    assert.equal(await page.getByRole('dialog').count(), 0);
  };
  const click = (name) => fixture.getByRole('button', { name, exact: true }).click();
  await inspect(0);
  await click('Mutate image provider deep fields');
  await inspect(1);
  await click('Replace image semantic fields');
  await inspect(2);
  await click('Replace image provider');
  await inspect(3);
  await click('Replace image components map');
  await inspect(4);
  await click('Remove image semantic fields');
  await inspect(4, false);
  await click('Add image provider');
  await inspect(5);
  await click('Remove image provider');
  await inspect(5, false);
  await click('Add image provider');
  await inspect(6);
  const demo = page.locator('[data-image-provider-actual-demo] [data-image-provider-demo]');
  const demoOriginalRoot = demo.locator('.demo-image-style-root');
  const demoOriginalImage = demoOriginalRoot.locator('img.apollo-image-img');
  const demoCover = demoOriginalRoot.locator('.apollo-image-cover');
  const demoNativeRoot = demo.locator('[data-image-native-style]');
  const demoNativeImage = demoNativeRoot.locator('img.apollo-image-img');
  const demoProgress = demo.locator('[data-image-native-progress-style]');
  const demoContent = demoProgress.locator('.apollo-image-progress-content');
  const demoRail = demoProgress.locator('.apollo-image-progress-rail');
  const demoIndicator = demoProgress.locator('.apollo-image-progress-indicator');
  const demoNodes = [
    {
      name: 'original root',
      node: demoOriginalRoot,
      classes: ['provider-image-root'],
      variables: ['--provider-image-root'],
    },
    {
      name: 'original img',
      node: demoOriginalImage,
      classes: ['provider-image-img'],
      variables: ['--provider-image-img'],
    },
    {
      name: 'cover',
      node: demoCover,
      classes: ['provider-image-cover'],
      variables: ['--provider-image-cover'],
    },
    {
      name: 'native root',
      node: demoNativeRoot,
      classes: ['provider-image-root'],
      variables: ['--provider-image-root'],
    },
    {
      name: 'native img',
      node: demoNativeImage,
      classes: ['provider-image-img'],
      variables: ['--provider-image-img'],
    },
    {
      name: 'progress root',
      node: demoProgress,
      classes: ['provider-image-root', 'provider-image-progress-root'],
      variables: ['--provider-image-root'],
      absentVariables: ['--provider-image-progress-root'],
    },
    {
      name: 'progress content',
      node: demoContent,
      classes: ['provider-image-progress-content'],
      variables: [],
      absentVariables: ['--provider-image-progress-content'],
    },
    {
      name: 'progress rail',
      node: demoRail,
      classes: ['provider-image-progress-rail'],
      variables: [],
      absentVariables: ['--provider-image-progress-rail'],
    },
    {
      name: 'progress indicator',
      node: demoIndicator,
      classes: ['provider-image-progress-indicator'],
      variables: [],
      absentVariables: ['--provider-image-progress-indicator'],
    },
  ];
  const originalDemoNodes = [];
  for (const item of demoNodes) originalDemoNodes.push(await item.node.elementHandle());
  for (const image of [demoOriginalImage, demoNativeImage]) {
    const node = await image.elementHandle();
    await page.waitForFunction(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
      node,
    );
  }
  const demoDraft = demo.getByRole('textbox', { name: 'Native image style draft', exact: true });
  await demoDraft.fill('kept actual provider demo draft');
  const originalDemoDraft = await demoDraft.elementHandle();
  const inspectDemo = async (label, marker) => {
    await page.waitForFunction(
      ({ marker }) => {
        const node = document.querySelector(
          '[data-image-provider-actual-demo] [data-image-native-style]',
        );
        return (
          node instanceof HTMLElement &&
          node.style.getPropertyValue('--provider-image-root') === marker
        );
      },
      { marker },
    );
    assert.equal(await demo.locator('[data-image-provider-state]').innerText(), label);
    for (const [index, item] of demoNodes.entries()) {
      assert.equal(
        await item.node.evaluate((node, original) => node === original, originalDemoNodes[index]),
        true,
        `actual demo ${item.name} identity`,
      );
      const classes = await item.node.evaluate((node) => Array.from(node.classList));
      for (const prefix of item.classes) {
        assert.deepEqual(
          classes.filter((value) => value === `${prefix}-A` || value === `${prefix}-B`),
          marker ? [`${prefix}-${marker}`] : [],
          `actual demo ${item.name} current ${prefix}`,
        );
      }
      for (const key of item.variables)
        assert.equal(
          await item.node.evaluate((node, key) => node.style.getPropertyValue(key), key),
          marker,
          `actual demo ${item.name} ${key}`,
        );
    }
    // Local styles.placeholder.progress replaces the provider's whole same style group.
    // Schema-based class names above still merge by individual progress region.
    for (const item of demoNodes) {
      for (const key of item.absentVariables ?? []) {
        assert.equal(
          await item.node.evaluate((node, key) => node.style.getPropertyValue(key), key),
          '',
          `actual demo ${item.name} local progress group overrides ${key}`,
        );
      }
    }
    assert.equal(
      await demoIndicator.evaluate((node) => node.style.fontWeight),
      '',
      'local progress group replaces the provider indicator style as well',
    );
    const color =
      marker === 'A'
        ? 'var(--apollo-color-primary-border)'
        : marker === 'B'
          ? 'var(--apollo-color-success-border)'
          : '';
    for (const node of [
      demoOriginalRoot,
      demoOriginalImage,
      demoCover,
      demoNativeRoot,
      demoNativeImage,
      demoProgress,
    ])
      assert.equal(await node.evaluate((node) => node.style.outlineColor), color);
    assert.equal(
      await demoOriginalRoot.evaluate((node) => node.style.paddingTop),
      marker ? 'var(--apollo-padding-lg)' : '',
    );
    assert.equal(await demoOriginalRoot.evaluate((node) => node.style.borderRadius), '12px');
    assert.equal(await demoOriginalRoot.evaluate((node) => node.style.overflow), 'hidden');
    assert.equal(
      await demoNativeRoot.evaluate((node) => node.style.paddingTop),
      'var(--apollo-padding-xs)',
    );
    assert.equal(
      await demoNativeImage.evaluate((node) => node.style.paddingTop),
      'var(--apollo-padding-xxs)',
    );
    assert.equal(await demoNativeImage.evaluate((node) => node.style.objectFit), 'cover');
    assert.equal(await demoNativeImage.evaluate((node) => node.style.boxSizing), 'border-box');
    assert.equal(
      await demoProgress.evaluate((node) => node.style.paddingTop),
      'var(--apollo-padding-xs)',
    );
    assert.equal(await demoProgress.getAttribute('role'), 'progressbar');
    assert.equal(await demoProgress.getAttribute('aria-valuenow'), '50');
    assert.equal(await demoProgress.getAttribute('aria-label'), 'Native image loading progress');
    for (const node of [demoNativeRoot, demoProgress]) {
      assert.equal(
        await node.evaluate((node) => node.classList.contains('native-demo-root')),
        true,
      );
      assert.equal(
        await node.evaluate((node) => node.style.getPropertyValue('--native-demo-phase')),
        'string',
      );
      assert.equal(
        await node.evaluate((node) => node.style.getPropertyValue('--semantic-demo-root')),
        'kept',
      );
    }
    assert.equal(
      await demoNativeRoot.evaluate((node) => node.classList.contains('semantic-demo-image-root')),
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
    assert.equal(
      await demoDraft.evaluate((node, original) => node === original, originalDemoDraft),
      true,
    );
    assert.equal(await demoDraft.inputValue(), 'kept actual provider demo draft');
    assert.equal(await demoDraft.evaluate((node) => document.activeElement === node), true);
    assert.equal(await page.getByRole('dialog').count(), 0);
  };
  await inspectDemo('empty', '');
  const cycleDemo = demo.getByRole('button', {
    name: 'Cycle image provider configuration',
    exact: true,
  });
  for (const [label, marker] of [
    ['A', 'A'],
    ['B', 'B'],
    ['removed', ''],
  ]) {
    await cycleDemo.click();
    await inspectDemo(label, marker);
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: current Image provider object fields/image/map replacement, late addition/removal, deep-mutation control, root/image/cover semantics and local/native priority, current image slot scope, stable roots/images/cover/input/draft/focus; actual Demo empty/A/B/removal with normal/public-root variables, current progress classes, local progress-group style replacement and native/local priority; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
