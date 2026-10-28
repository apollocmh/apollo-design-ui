import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Link, Paragraph, Text, Title, Typography } from '@apollo-design/ui';
import { build, preview } from 'vite';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App, { typographyNames } from './fixtures/TypographyHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-typography-hydration-'));
const checks = [],
  errors = [];
let server, browser;
try {
  for (const [name, component] of [
    ['container', Typography],
    ['text', Text],
    ['title', Title],
    ['paragraph', Paragraph],
    ['link', Link],
  ]) {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(component, { id: `ssr-${name}` }, () => [h('b', 'First'), h('i', 'Last'), 0]),
      }),
    );
    assert.ok(html.includes('First') && html.includes('Last') && html.includes('0'));
    assert.ok(!html.includes('NaN') && html.includes(`id="ssr-${name}"`));
    checks.push(`SSR complete content: ${name}`);
  }
  const editing = await renderToString(
    createSSRApp({
      render: () =>
        h(
          Text,
          { id: 'ssr-editor', editable: { editing: true, text: 'First\nLast' } },
          () => 'Body',
        ),
    }),
  );
  assert.match(editing, /<textarea[^>]*aria-label/);
  assert.ok(editing.includes('First\nLast') && editing.includes('id="ssr-editor"'));
  checks.push('SSR editor root, name and multiline text');
  const markup = await renderToString(createSSRApp(App));
  for (const name of typographyNames) assert.ok(markup.includes(`id="hydrated-${name}"`));
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'typography-hydration.html') },
    },
  });
  const file = path.join(outDir, 'typography-hydration.html');
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><script>window.typographyServerRoots=${JSON.stringify(typographyNames)}.map(n=>document.getElementById('hydrated-'+n));window.typographyServerDraft=document.getElementById('typography-hydrated-draft');window.typographyServerDraft.value='typed before hydration';window.typographyServerDraft.focus();window.typographyServerDraft.setSelectionRange(2,5);</script>`,
    ),
  );
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      m.type() === 'error' ||
      m.text().includes('[Vue warn]') ||
      /hydration.*mismatch/i.test(m.text())
    )
      errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}typography-hydration.html`);
  await page.waitForFunction(() => Boolean(window.typographyHydration));
  assert.equal(
    await page.evaluate(
      (names) =>
        names.every(
          (n, i) => window.typographyServerRoots[i] === document.getElementById(`hydrated-${n}`),
        ),
      typographyNames,
    ),
    true,
  );
  checks.push('five server roots retained by hydration');
  const input = page.locator('#typography-hydrated-draft');
  assert.equal(await input.evaluate((n) => n === window.typographyServerDraft), true);
  assert.equal(await input.inputValue(), 'typed before hydration');
  assert.equal(
    await input.evaluate(
      (n) => document.activeElement === n && n.selectionStart === 2 && n.selectionEnd === 5,
    ),
    true,
  );
  checks.push('pre-hydration draft, focus and selection retained during measurement');
  for (const stage of [1, 0, 1]) {
    await page.evaluate((stage) => window.typographyHydration.set({ stage }), stage);
    assert.equal(
      await page.locator('#hydrated-title').evaluate((n) => getComputedStyle(n).marginBottom),
      stage ? '12px' : '9px',
    );
    assert.equal(
      await input.evaluate(
        (n) => n === window.typographyServerDraft && document.activeElement === n,
      ),
      true,
    );
    const state = await page.evaluate(() => window.typographyHydration.snapshot());
    assert.deepEqual(state, { mounts: 1, unmounts: 0, roots: [true, true, true, true, true] });
    for (const name of typographyNames)
      assert.equal(
        await page
          .locator(`#hydrated-${name}`)
          .evaluate((n, stage) => n.classList.contains(`hydrated-stage-${stage}`), stage),
        true,
      );
    checks.push(`current theme/provider stage ${stage}, stable roots and business lifecycle`);
  }
  await page.evaluate(() => window.typographyHydration.set({ show: false }));
  assert.equal(await input.count(), 0);
  await page.evaluate(() => window.typographyHydration.set({ show: true }));
  assert.equal(await input.count(), 1);
  const state = await page.evaluate(() => window.typographyHydration.snapshot());
  assert.equal(state.mounts, 2);
  assert.equal(state.unmounts, 1);
  assert.deepEqual(errors, []);
  checks.push('unmount/remount cleans measurements and owns one business instance');
  console.log(JSON.stringify({ checks: checks.length, passed: checks, errors }));
} finally {
  writeFileSync(
    process.env.TYPOGRAPHY_HYDRATION_EVIDENCE ?? '/tmp/apollo-typography-hydration.json',
    JSON.stringify({ checks, errors }, null, 2),
  );
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
