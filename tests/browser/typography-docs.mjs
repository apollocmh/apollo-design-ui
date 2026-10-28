/** Actual Typography site pages, all original demos and their controls. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const demos = [
  'basic',
  'component-token',
  'copyable',
  'editable',
  'editable-custom',
  'ellipsis',
  'ellipsis-controlled',
  'ellipsis-expandable',
  'ellipsis-middle',
  'semantic',
  'suffix',
  'table',
  'text',
  'title',
];
const results = [],
  errors = [],
  fallbackDocuments = new Set();
const { browser } = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => {
    localStorage.setItem('apollo-site-theme', 'light');
    localStorage.setItem('apollo-site-locale', 'zh-CN');
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (
      expectedStatus === 404 &&
      r.status() === 404 &&
      r.request().isNavigationRequest() &&
      r.url().startsWith(`${base}/components/typography/demo/`)
    )
      fallbackDocuments.add(r.url());
  });
  page.on('console', (m) => {
    if (
      m.text() === 'Failed to load resource: the server responded with a status of 404 ()' &&
      fallbackDocuments.has(m.location().url)
    )
      return;
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  const visit = async (name, theme = 'light') => {
    const r = await page.goto(`${base}/components/typography/demo/${name}?theme=${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(r.status(), expectedStatus);
    await page.locator('.demo-renderer').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    return r.status();
  };
  const roots = () => page.locator('.standalone-body .apollo-typography');
  for (const demo of demos)
    for (const theme of ['light', 'dark']) {
      const httpStatus = await visit(demo, theme);
      assert.ok((await roots().count()) > 0);
      assert.equal(
        await page.evaluate(() => document.documentElement.dataset.apolloTheme === 'dark'),
        theme === 'dark',
      );
      await page.addScriptTag({
        path: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
      });
      const axe = await page.locator('.standalone-body').evaluate(async (n) =>
        (await window.axe.run(n)).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((x) => x.failureSummary),
        })),
      );
      results.push({ demo, theme, httpStatus, axe, passed: axe.length === 0 });
    }

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await visit('component-token');
  const title = page.locator('[data-spacing-title]');
  await page.getByRole('button', { name: 'Cycle title spacing' }).click();
  assert.ok(
    await title.evaluate(
      (n) =>
        Math.abs(
          parseFloat(getComputedStyle(n).marginTop) - parseFloat(getComputedStyle(n).fontSize) * 2,
        ) < 0.1,
    ),
  );
  await page.getByRole('button', { name: 'Cycle title spacing' }).click();
  assert.equal(await title.evaluate((n) => getComputedStyle(n).marginBottom), '0px');
  results.push({ name: 'published title token custom/zero controls', passed: true });
  await visit('copyable');
  await page.locator('.standalone-body .apollo-typography-copy').nth(1).click();
  await page.waitForFunction(() =>
    Boolean(document.querySelector('.standalone-body .apollo-typography-copy-success')),
  );
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Custom copy text');
  results.push({ name: 'published clipboard control', passed: true });
  await visit('editable-custom', 'dark');
  await page.locator('.standalone-body .apollo-typography-edit').first().click();
  const editor = page.locator('.standalone-body textarea');
  await editor.fill('Docs saved');
  await editor.press('Enter');
  assert.equal(await page.getByText('保存后的值：Docs saved').isVisible(), true);
  await page.locator('.standalone-body .apollo-typography-edit').last().click();
  await editor.fill('Real multiline text that wraps in the actual documentation Demo. '.repeat(20));
  const dimensions = await editor.evaluate((n) => ({
    height: n.clientHeight,
    line: parseFloat(getComputedStyle(n).lineHeight),
  }));
  assert.ok(
    dimensions.height >= dimensions.line * 2 && dimensions.height <= dimensions.line * 5 + 12,
    JSON.stringify(dimensions),
  );
  await editor.press('Escape');
  results.push({ name: 'published multiline editing, save and autoSize controls', passed: true });
  await visit('ellipsis-expandable');
  await page.getByRole('button', { name: '展开更多', exact: true }).click();
  await page.getByRole('button', { name: '收起', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '展开更多', exact: true }).isVisible(), true);
  results.push({ name: 'published expand/collapse labels and controls', passed: true });
  await visit('semantic', 'dark');
  const draft = page.getByRole('textbox', { name: 'Provider typography draft', exact: true });
  await draft.fill('Published draft');
  await draft.focus();
  const old = await draft.elementHandle();
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Replace typography provider', exact: true }).click();
    assert.equal(
      await draft.evaluate((n, old) => n === old && document.activeElement === n, old),
      true,
    );
    assert.equal(await draft.inputValue(), 'Published draft');
  }
  results.push({ name: 'published Provider replacement/removal and business focus', passed: true });
  const main = await page.goto(`${base}/components/typography`);
  assert.equal(main.status(), 200);
  await page.waitForFunction(
    () => document.querySelectorAll('.demo-renderer[data-demo^="typography-"]').length === 14,
  );
  const cards = page.locator('.demo-renderer[data-demo^="typography-"]');
  for (let i = 0; i < 14; i++) {
    const card = cards.nth(i);
    await card.scrollIntoViewIfNeeded();
    await card.locator('.apollo-typography').first().waitFor({ state: 'attached' });
  }
  assert.equal(await page.locator('.demo-renderer-error').count(), 0);
  const text = await page.locator('main').textContent();
  for (const term of [
    'CopyConfig',
    'EditConfig',
    'EllipsisConfig',
    'nativeElement',
    'titleMarginTop',
  ])
    assert.ok(text.includes(term), term);
  results.push({ name: 'physical API page and all 14 actual cards', passed: true });
  const progress = await page.goto(`${base}/guide/audit-progress`);
  assert.equal(progress.status(), 200);
  await page.waitForFunction(() =>
    document.querySelector('main')?.textContent.includes('Typography 功能整改'),
  );
  assert.ok((await page.locator('main').textContent()).includes('Typography 功能整改'));
  results.push({ name: 'physical progress page with current stage', passed: true });
  await page.goto(`${base}/components/typography?lang=en-US`);
  await page
    .getByRole('heading', { name: 'Slots, events, models and expose', exact: true })
    .waitFor({ state: 'visible' });
  results.push({ name: 'English API uses the current contracts', passed: true });
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
  console.log(
    JSON.stringify({ checks: results.length, errors, fallbackDocuments: fallbackDocuments.size }),
  );
} finally {
  writeFileSync(
    process.env.TYPOGRAPHY_DOCS_EVIDENCE ?? '/tmp/apollo-typography-docs-browser.json',
    JSON.stringify({ results, errors, fallbackDocuments: [...fallbackDocuments] }, null, 2),
  );
  await browser.close();
}
