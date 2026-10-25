/** Typography native root styles against production dist and its semantic demo. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-typography-styles-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=typography-styles`);
  const names = [
    'Typography',
    'Text',
    'Title',
    'Paragraph',
    'Link',
    'Text-edit',
    'Paragraph-edit',
    'Rich',
  ];
  const roots = [];
  for (const name of names)
    roots.push(
      await page
        .locator(`[data-typography-style-entry="${name}"] > .apollo-typography`)
        .elementHandle(),
    );
  const textEditor = page.getByRole('textbox', { name: 'Text style editor', exact: true });
  const paragraphEditor = page.getByRole('textbox', {
    name: 'Paragraph style editor',
    exact: true,
  });
  const richEditor = page.getByRole('textbox', { name: 'Typography style draft', exact: true });
  const editors = [textEditor, paragraphEditor, richEditor];
  const drafts = ['kept Text draft', 'kept Paragraph draft', 'kept rich draft'];
  const originals = [];
  for (const [index, editor] of editors.entries()) {
    await editor.fill(drafts[index]);
    originals.push(await editor.elementHandle());
  }
  await paragraphEditor.focus();
  const phases = [
    {
      color: 'rgb(10, 20, 30)',
      top: '8px',
      bottom: '8px',
      left: '',
      right: '',
      marker: 'string',
      array: '',
      active: 'first',
    },
    {
      color: 'rgb(30, 40, 50)',
      top: '2px',
      bottom: '10px',
      left: '6px',
      right: '',
      marker: 'array',
      array: 'yes',
      active: 'next',
    },
    {
      color: 'rgb(50, 60, 70)',
      top: '2px',
      bottom: '12px',
      left: '',
      right: '9px',
      marker: 'object',
      array: '',
      active: 'object',
    },
    {
      color: 'rgb(40, 50, 60)',
      top: '2px',
      bottom: '4px',
      left: '',
      right: '',
      marker: '',
      array: '',
      active: '',
    },
  ];
  const inspect = async (phase) => {
    const expected = phases[phase];
    for (const [index, name] of names.entries()) {
      const root = page.locator(`[data-typography-style-entry="${name}"] > .apollo-typography`);
      assert.equal(
        await root.evaluate((node, original) => node === original, roots[index]),
        true,
        name,
      );
      const actual = await root.evaluate((node) => ({
        color: node.style.color,
        top: node.style.paddingTop,
        bottom: node.style.paddingBottom,
        left: node.style.paddingLeft,
        right: node.style.paddingRight,
        marker: node.style.getPropertyValue('--native-phase'),
        array: node.style.getPropertyValue('--array-only'),
        semantic: node.style.getPropertyValue('--semantic-root'),
        classes: Array.from(node.classList),
        cssProperties: Array.from(node.style),
        serialized: node.getAttribute('style') ?? '',
      }));
      for (const key of ['color', 'top', 'bottom', 'left', 'right', 'marker', 'array'])
        assert.equal(actual[key], expected[key], `${name} ${key} phase ${phase}`);
      assert.equal(actual.semantic, 'kept', name);
      assert.ok(actual.classes.includes('semantic-typography-root'), name);
      assert.equal(actual.classes.includes('native-typography-root'), phase < 3, name);
      for (const state of ['first', 'next', 'object'])
        assert.equal(actual.classes.includes(state), state === expected.active, `${name} ${state}`);
      assert.equal(
        actual.cssProperties.some((key) => /^\d+$/.test(key)),
        false,
        name,
      );
      assert.equal(/(?:^|;)\s*\d+\s*:/.test(actual.serialized), false, name);
    }
    for (const [index, editor] of editors.entries()) {
      assert.equal(
        await editor.evaluate((node, original) => node === original, originals[index]),
        true,
      );
      assert.equal(await editor.inputValue(), drafts[index]);
      assert.equal(await editor.evaluate((node) => node.style.color), '');
      assert.equal(await editor.evaluate((node) => node.style.paddingBottom), '');
      assert.equal(
        await editor.evaluate((node) => node.style.getPropertyValue('--native-phase')),
        '',
      );
      assert.equal(
        await editor.evaluate((node) => node.classList.contains('native-typography-root')),
        false,
      );
    }
    assert.equal(await textEditor.getAttribute('aria-label'), 'Text style editor');
    assert.equal(await paragraphEditor.getAttribute('aria-label'), 'Paragraph style editor');
    for (const editor of [textEditor, paragraphEditor]) {
      assert.equal(await editor.evaluate((node) => node.style.fontSize), '15px');
      assert.equal(
        await editor.evaluate((node) => node.classList.contains('semantic-typography-textarea')),
        true,
      );
    }
  };
  await inspect(0);
  const cycle = page.getByRole('button', { name: 'Cycle typography styles', exact: true });
  for (const [phase, focused] of [
    [1, paragraphEditor],
    [2, textEditor],
    [3, richEditor],
    [0, richEditor],
  ]) {
    await focused.focus();
    await cycle.click();
    assert.equal(await page.locator('[data-typography-style-phase]').innerText(), String(phase));
    await inspect(phase);
    assert.equal(await focused.evaluate((node) => document.activeElement === node), true);
  }
  const demo = page.locator('[data-native-typography-style-demo]');
  const demoRoot = demo.locator('[data-demo-native-style]');
  const originalDemo = await demoRoot.elementHandle();
  const demoInput = page.getByRole('textbox', { name: 'Semantic typography draft', exact: true });
  await demoInput.fill('kept semantic demo draft');
  const originalDemoInput = await demoInput.elementHandle();
  for (const [phase, marker] of [
    [0, 'string'],
    [1, 'array'],
    [2, 'object'],
    [3, ''],
  ]) {
    if (phase > 0)
      await demo
        .getByRole('button', { name: 'Cycle native typography styles', exact: true })
        .click();
    assert.equal(
      await demoRoot.evaluate((node, original) => node === original, originalDemo),
      true,
    );
    assert.equal(
      await demoRoot.evaluate((node) => node.style.getPropertyValue('--native-demo-phase')),
      marker,
    );
    assert.equal(
      await demoRoot.evaluate((node) => node.style.getPropertyValue('--semantic-demo-root')),
      'kept',
    );
    assert.equal(
      await demoRoot.evaluate((node) => node.classList.contains('semantic-demo-root')),
      true,
    );
    assert.equal(
      await demoRoot.evaluate((node) => node.classList.contains('native-demo-root')),
      phase < 3,
    );
    assert.equal(
      await demoInput.evaluate((node, original) => node === original, originalDemoInput),
      true,
    );
    assert.equal(await demoInput.inputValue(), 'kept semantic demo draft');
    assert.equal(await demoInput.evaluate((node) => document.activeElement === node), true);
  }
  assert.equal(
    await demoRoot.evaluate((node) => node.style.color),
    'var(--apollo-color-text-secondary)',
  );
  assert.equal(
    await demoRoot.evaluate((node) => node.style.paddingInlineStart),
    'var(--apollo-padding-xxs)',
  );
  assert.equal(await demoRoot.evaluate((node) => node.style.paddingInlineEnd), '');
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: five public Typography entries plus Text/Paragraph editing and rich content, native string/array/object/removal, semantic fallback/current CSS variables/class removal, stable roots/editors/drafts/focus and textarea aria/semantic routing, no numeric CSS pollution; actual semantic demo passed; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
