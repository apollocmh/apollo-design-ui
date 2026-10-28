/** Typography current ConfigProvider configuration against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-typography-provider-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=typography-provider`);
  const names = [
    'Typography',
    'Text',
    'Title',
    'Paragraph',
    'Link',
    'Text-edit',
    'Rich',
    'Local-only',
  ];
  const normalActions = ['Text', 'Title', 'Paragraph', 'Link', 'Rich', 'Local-only'];
  const roots = [];
  for (const name of names)
    roots.push(
      await page.locator(`[data-provider-entry="${name}"] > .apollo-typography`).elementHandle(),
    );
  const editor = page.getByRole('textbox', { name: 'Provider Text editor', exact: true });
  const draft = page.getByRole('textbox', { name: 'Typography provider draft', exact: true });
  await editor.fill('kept provider edit draft');
  await draft.fill('kept provider rich draft');
  const originalEditor = await editor.elementHandle();
  const originalDraft = await draft.elementHandle();
  const markers = ['first', 'second', 'function', ''];
  const inspect = async (phase, changedPadding) => {
    const marker = markers[phase];
    const padding = changedPadding ?? (phase < 3 ? `${phase * 2 + 6}px` : '');
    await page.waitForFunction(
      ({ marker, padding }) => {
        const node = document.querySelector(
          '[data-provider-entry="Typography"] > .apollo-typography',
        );
        return (
          node instanceof HTMLElement &&
          node.style.getPropertyValue('--provider-style') === marker &&
          node.style.paddingTop === padding
        );
      },
      { marker, padding },
    );
    for (const [index, name] of names.entries()) {
      const root = page.locator(`[data-provider-entry="${name}"] > .apollo-typography`);
      assert.equal(
        await root.evaluate((node, original) => node === original, roots[index]),
        true,
        name,
      );
      const state = await root.evaluate((node) => ({
        classes: Array.from(node.classList),
        color: node.style.color,
        top: node.style.paddingTop,
        bottom: node.style.paddingBottom,
        border: node.style.borderTopWidth,
        alias: node.style.getPropertyValue('--provider-style'),
        semantic: node.style.getPropertyValue('--provider-semantic'),
        prefix: node.style.getPropertyValue('--provider-prefix'),
        local: node.style.getPropertyValue('--local-root'),
        native: node.style.getPropertyValue('--native-root'),
      }));
      for (const key of ['first', 'second', 'function']) {
        assert.equal(
          state.classes.includes(`provider-class-${key}`),
          key === marker,
          `${name} class alias`,
        );
        assert.equal(
          state.classes.includes(`provider-root-${key}`),
          key === marker,
          `${name} root class`,
        );
      }
      assert.equal(state.classes.includes('local-provider-root'), true, name);
      assert.equal(state.classes.includes('native-provider-root'), true, name);
      assert.equal(state.classes.includes('provider-prefix-resolved'), phase === 2, name);
      assert.equal(state.classes.includes('provider-prefix-missing'), false, name);
      assert.equal(state.alias, marker, name);
      assert.equal(state.semantic, marker, name);
      assert.equal(state.prefix, phase === 2 ? 'apollo-typography' : '', name);
      assert.equal(state.top, padding, name);
      assert.equal(state.border, phase < 3 ? `${phase + 1}px` : '', name);
      assert.equal(
        state.color,
        name === 'Local-only' ? 'rgb(70, 80, 90)' : 'rgb(90, 100, 110)',
        name,
      );
      assert.equal(state.bottom, name === 'Local-only' ? '14px' : '16px', name);
      assert.equal(state.local, 'kept', name);
      assert.equal(state.native, name === 'Local-only' ? '' : 'kept', name);
    }
    for (const name of normalActions) {
      const scope = page.locator(`[data-provider-entry="${name}"]`);
      const actions = scope.locator('.apollo-typography-actions');
      const button = scope.locator('.apollo-typography-copy');
      for (const key of ['first', 'second', 'function']) {
        assert.equal(
          await actions.evaluate(
            (node, expected) => node.classList.contains(expected),
            `provider-actions-${key}`,
          ),
          key === marker,
          `${name} actions`,
        );
        assert.equal(
          await button.evaluate(
            (node, expected) => node.classList.contains(expected),
            `provider-action-${key}`,
          ),
          key === marker,
          `${name} button`,
        );
      }
      assert.equal(
        await actions.evaluate((node) => node.classList.contains('local-provider-actions')),
        true,
        name,
      );
      assert.equal(
        await button.evaluate((node) => node.classList.contains('local-provider-action')),
        true,
        name,
      );
      assert.equal(
        await actions.evaluate((node) => node.style.paddingInlineEnd),
        phase < 3 ? `${phase + 1}px` : '',
        name,
      );
      assert.equal(await actions.evaluate((node) => node.style.marginInlineStart), '18px', name);
      assert.equal(
        await button.evaluate((node) => node.style.marginInlineEnd),
        phase < 3 ? `${phase * 2 + 4}px` : '',
        name,
      );
      assert.equal(await button.evaluate((node) => node.style.paddingInlineStart), '2px', name);
    }
    assert.equal(
      await editor.evaluate((node, original) => node === original, originalEditor),
      true,
    );
    assert.equal(await editor.inputValue(), 'kept provider edit draft');
    assert.equal(await editor.getAttribute('aria-label'), 'Provider Text editor');
    assert.equal(
      await editor.evaluate((node) => node.style.fontSize),
      phase < 3 ? `${phase + 13}px` : '',
    );
    assert.equal(await editor.evaluate((node) => node.style.lineHeight), '24px');
    assert.equal(
      await editor.evaluate((node) => node.style.getPropertyValue('--provider-textarea')),
      marker,
    );
    for (const key of ['first', 'second', 'function'])
      assert.equal(
        await editor.evaluate(
          (node, expected) => node.classList.contains(expected),
          `provider-textarea-${key}`,
        ),
        key === marker,
      );
    assert.equal(
      await editor.evaluate((node) => node.classList.contains('local-provider-textarea')),
      true,
    );
    assert.equal(await draft.evaluate((node, original) => node === original, originalDraft), true);
    assert.equal(await draft.inputValue(), 'kept provider rich draft');
  };
  await inspect(0);
  await page.getByRole('button', { name: 'Mutate provider padding', exact: true }).click();
  await inspect(0, '18px');
  assert.equal(await draft.evaluate((node) => document.activeElement === node), true);
  const replace = page.getByRole('button', { name: 'Replace provider configuration', exact: true });
  for (const phase of [1, 2, 3]) {
    const focused = phase === 2 ? editor : draft;
    await focused.focus();
    await replace.click();
    assert.equal(await page.locator('[data-typography-provider-phase]').innerText(), String(phase));
    await inspect(phase);
    assert.equal(await focused.evaluate((node) => document.activeElement === node), true);
  }
  const demo = page.locator('[data-typography-provider-demo]');
  const demoRich = demo.locator('[data-provider-demo-rich]');
  const demoEditRoot = demo.locator('[data-provider-demo-editor] > .apollo-typography');
  const demoInput = page.getByRole('textbox', { name: 'Provider typography draft', exact: true });
  const demoEditor = page.getByRole('textbox', { name: 'Provider typography editor', exact: true });
  await demoInput.fill('kept provider demo draft');
  await demoEditor.fill('kept provider demo edit draft');
  const originalDemoRoots = [await demoRich.elementHandle(), await demoEditRoot.elementHandle()];
  const originalDemoInput = await demoInput.elementHandle();
  const originalDemoEditor = await demoEditor.elementHandle();
  const actionColors = [
    'var(--apollo-color-text)',
    'var(--apollo-color-text-secondary)',
    'var(--apollo-color-text)',
    '',
  ];
  const fontSizes = [
    'var(--apollo-font-size-sm)',
    'var(--apollo-font-size)',
    'var(--apollo-font-size-lg)',
    '',
  ];
  for (const [phase, marker] of markers.entries()) {
    if (phase > 0)
      await demo.getByRole('button', { name: 'Replace typography provider', exact: true }).click();
    for (const [index, root] of [demoRich, demoEditRoot].entries()) {
      assert.equal(
        await root.evaluate((node, original) => node === original, originalDemoRoots[index]),
        true,
      );
      assert.equal(
        await root.evaluate((node) => node.style.getPropertyValue('--provider-demo-style')),
        marker,
      );
      assert.equal(
        await root.evaluate((node) => node.style.getPropertyValue('--provider-demo-semantic')),
        marker,
      );
      assert.equal(
        await root.evaluate((node) => node.style.getPropertyValue('--provider-demo-prefix')),
        phase === 2 ? 'apollo-typography' : '',
      );
      assert.equal(await root.evaluate((node) => node.style.color), 'var(--apollo-color-text)');
      assert.equal(
        await root.evaluate((node) => node.style.paddingBlockEnd),
        'var(--apollo-padding-xs)',
      );
      assert.equal(
        await root.evaluate((node) => node.classList.contains('demo-native-provider-root')),
        true,
      );
      assert.equal(
        await root.evaluate((node) => node.classList.contains('demo-local-provider-root')),
        true,
      );
      for (const key of ['first', 'second', 'function'])
        assert.equal(
          await root.evaluate(
            (node, expected) => node.classList.contains(expected),
            `demo-provider-class-${key}`,
          ),
          key === marker,
        );
    }
    assert.equal(
      await demoRich.locator('.apollo-typography-copy').evaluate((node) => node.style.color),
      actionColors[phase],
    );
    assert.equal(await demoEditor.evaluate((node) => node.style.fontSize), fontSizes[phase]);
    assert.equal(
      await demoInput.evaluate((node, original) => node === original, originalDemoInput),
      true,
    );
    assert.equal(
      await demoEditor.evaluate((node, original) => node === original, originalDemoEditor),
      true,
    );
    assert.equal(await demoInput.inputValue(), 'kept provider demo draft');
    assert.equal(await demoEditor.inputValue(), 'kept provider demo edit draft');
    assert.equal(await demoEditor.evaluate((node) => document.activeElement === node), true);
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: five public Typography entries plus editing/rich content, whole ConfigProvider object/new object/plain-closure function/removal, parsed-prefix callbacks, current root/actions/textarea classes and styles, native/local priority, stable roots/editors/drafts/focus; nested mutation control and real semantic demo passed; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
