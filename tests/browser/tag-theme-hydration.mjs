import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CheckableTag,
  CheckableTagGroup,
  ConfigProvider,
  genTagStyle,
  Tag,
} from '@apollo-design/ui';
import { build, preview } from 'vite';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App, { tagNames } from './fixtures/TagThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-tag-hydration-')),
  checks = [],
  errors = [];
let server, browser;
try {
  const cases = [
    [
      'complete tag',
      () =>
        h(
          Tag,
          { closable: true },
          {
            default: () => ['Label', h('strong', 'Tail')],
            icon: () => [h('i'), h('b', 'Icon tail')],
          },
        ),
    ],
    ['linked close', () => h(Tag, { href: '#target', closable: true }, () => 'Link')],
    ['custom variable', () => h(Tag, { color: 'var(--accent)' }, () => 'Variable')],
    ['unchecked', () => h(CheckableTag, {}, () => 'Choice')],
    ['checked', () => h(CheckableTag, { checked: true }, () => 'Choice')],
    ['single zero', () => h(CheckableTagGroup, { value: 0, options: [0, 1] })],
    ['multiple zero', () => h(CheckableTagGroup, { value: [0], multiple: true, options: [0, 1] })],
    [
      'disabled',
      () =>
        h(ConfigProvider, { componentDisabled: true }, () =>
          h(Tag, { closable: true, href: '#target' }, () => 'Disabled'),
        ),
    ],
  ];
  for (const [name, render] of cases) {
    const html = await renderToString(createSSRApp({ render }));
    assert.ok(html && !html.includes('NaN'));
    checks.push(`Node SSR: ${name}`);
  }
  const markup = await renderToString(createSSRApp(App));
  for (const name of tagNames) assert.ok(markup.includes(`id="hydrated-${name}"`));
  assert.ok(markup.includes('Content tail'));
  checks.push('Node SSR: all six actual published roots and complete contents');
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'tag-theme-hydration.html') },
    },
  });
  const file = path.join(outDir, 'tag-theme-hydration.html'),
    html = readFileSync(file, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    file,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><style>${genTagStyle('audit')}</style><script>window.tagServerRoots=${JSON.stringify(tagNames)}.map(n=>document.getElementById('hydrated-'+n));window.tagServerDraft=document.getElementById('hydrated-draft');window.tagServerDraft.value='typed before hydration';window.tagServerDraft.focus();window.tagServerDraft.setSelectionRange(2,5);</script>`,
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
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}tag-theme-hydration.html`);
  await page.waitForFunction(() => window.tagHydrated);
  const identity = async () =>
    assert.equal(
      await page.evaluate(
        () =>
          window.tagServerRoots.every(
            (n, i) =>
              n ===
              document.getElementById(
                `hydrated-${['main', 'link', 'choice', 'single', 'multiple', 'adjacent'][i]}`,
              ),
          ) &&
          window.tagServerDraft === document.getElementById('hydrated-draft') &&
          window.tagServerDraft.value === 'typed before hydration' &&
          document.activeElement === window.tagServerDraft &&
          window.tagServerDraft.selectionStart === 2 &&
          window.tagServerDraft.selectionEnd === 5,
      ),
      true,
    );
  await identity();
  assert.deepEqual(
    (await page.evaluate(() => window.tagHydration.snapshot())).roots,
    tagNames.map((n) => `hydrated-${n}`),
  );
  checks.push('hydration preserves roots, pretyped draft, focus, selection and real exposed refs');
  for (const stage of [1, 2, 0]) {
    await page.evaluate((value) => window.tagHydration.stage(value), stage);
    await identity();
    const main = page.locator('#hydrated-main'),
      group = page.locator('#hydrated-single');
    assert.equal(await main.getAttribute('dir'), stage === 1 ? 'rtl' : 'ltr');
    assert.equal(await group.getAttribute('dir'), stage === 1 ? 'rtl' : 'ltr');
    assert.ok(
      (await main.getAttribute('class')).includes(stage === 1 ? 'audit-tag' : 'apollo-tag'),
    );
    assert.equal(
      await group.locator(stage === 1 ? '.audit-tag-checkable' : '.apollo-tag-checkable').count(),
      2,
    );
    assert.equal(await page.locator('#hydrated-adjacent').getAttribute('dir'), 'ltr');
    assert.ok(
      (await page.locator('#hydrated-adjacent').getAttribute('class')).includes('nearest-config'),
    );
    const action = page.locator('#hydrated-main button');
    assert.equal(await action.getAttribute('aria-label'), stage === 1 ? '关闭' : 'Close');
    const nativePadding = await main.evaluate((n) => n.style.paddingInline);
    assert.equal(nativePadding, stage === 1 ? '13px' : stage === 0 ? '9px' : '');
    checks.push(`current Provider/theme/locale/prefix/direction/removal stage ${stage}`);
  }
  for (const icon of [true, false, true]) {
    await page.evaluate((value) => window.tagHydration.icon(value), icon);
    await identity();
    assert.equal(await page.locator('#hydrated-main .apollo-tag-icon').count(), icon ? 1 : 0);
  }
  checks.push('repeated complete conditional icon preserves draft, focus and subtree identity');
  const single = page.getByRole('group', { name: 'Hydrated single', exact: true }),
    multiple = page.getByRole('group', { name: 'Hydrated multiple', exact: true });
  await single.getByRole('checkbox', { name: '0', exact: true }).click();
  assert.equal((await page.evaluate(() => window.tagHydration.snapshot())).single, null);
  await single.getByRole('checkbox', { name: '1', exact: true }).click();
  assert.equal((await page.evaluate(() => window.tagHydration.snapshot())).single, 1);
  await multiple.getByRole('checkbox', { name: '1', exact: true }).click();
  assert.deepEqual((await page.evaluate(() => window.tagHydration.snapshot())).multiple, [0, 1]);
  const choice = page.getByRole('checkbox', { name: 'Hydrated choice', exact: true });
  await choice.focus();
  await page.keyboard.press(' ');
  assert.equal((await page.evaluate(() => window.tagHydration.snapshot())).checked, true);
  checks.push('hydrated checked/single/multiple model updates including numeric zero and clearing');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.tagHydration.show(false));
    assert.equal(await page.locator('#hydrated-main').count(), 0);
    await page.evaluate(() => window.tagHydration.show(true));
    assert.equal(await page.locator('#hydrated-main').count(), 1);
    assert.equal(await page.locator('#hydrated-draft').inputValue(), '');
  }
  checks.push('three complete unmount/remount cycles reset native editors without stale refs');
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await page.locator('main').evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.failureSummary),
    })),
  );
  assert.deepEqual(violations, []);
  checks.push('actual hydrated controls axe');
  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.TAG_HYDRATION_EVIDENCE ?? '/tmp/apollo-tag-hydration.json',
    `${JSON.stringify({ browser: browser.version(), checks, errors }, null, 2)}\n`,
  );
  console.log(`${checks.length} checks, 0 errors`);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
