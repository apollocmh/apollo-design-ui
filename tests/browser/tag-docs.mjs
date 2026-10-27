/** Actual Tag site pages, all original demos and their controls. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const demos = [
  'animation',
  'basic',
  'checkable',
  'colorful',
  'component-token',
  'control',
  'customize',
  'disabled',
  'draggable',
  'icon',
  'status',
  'style-class',
];
const results = [],
  errors = [],
  fallbackDocuments = new Set();
const { browser } = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => localStorage.setItem('apollo-site-theme', 'light'));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (
      expectedStatus === 404 &&
      r.status() === 404 &&
      r.request().isNavigationRequest() &&
      r.url().startsWith(`${base}/components/tag/demo/`)
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
    const r = await page.goto(`${base}/components/tag/demo/${name}?theme=${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(r.status(), expectedStatus);
    await page.locator('.demo-renderer').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    return r.status();
  };
  const roots = () => page.locator('.standalone-body .apollo-tag');
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
  await visit('control');
  await page.getByRole('button', { name: 'New Tag', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'New tag name', exact: true });
  assert.equal(await input.evaluate((n) => n === document.activeElement), true);
  await input.fill('Published tag');
  await page.keyboard.press('Enter');
  assert.equal(await roots().count(), 4);
  await roots()
    .filter({ hasText: 'Published tag' })
    .getByRole('button', { name: '关闭', exact: true })
    .click();
  assert.equal(await roots().count(), 3);
  results.push({ name: 'actual published add, focused input, model and close', passed: true });
  await visit('checkable');
  const single = page.getByRole('group', { name: 'Single interest', exact: true });
  await single.getByRole('checkbox', { name: 'Movies', exact: true }).click();
  assert.equal(
    await single.getByRole('checkbox', { name: 'Books', exact: true }).getAttribute('aria-checked'),
    'false',
  );
  const multi = page.getByRole('group', { name: 'Multiple interests', exact: true });
  await multi.getByRole('checkbox', { name: 'Books', exact: true }).focus();
  await page.keyboard.press(' ');
  assert.equal(await multi.locator('[aria-checked="true"]').count(), 3);
  results.push({
    name: 'actual strong single/multiple Vue models and native keyboard',
    passed: true,
  });
  await visit('component-token');
  const regular = roots().first();
  assert.equal(
    await regular.evaluate((n) => getComputedStyle(n).backgroundColor),
    'rgb(255, 247, 230)',
  );
  await page.getByRole('button', { name: 'Switch component tokens', exact: true }).click();
  await regular.evaluate((n) => {
    void n.offsetWidth;
  });
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))),
  );
  assert.equal(
    await regular.evaluate((n) => getComputedStyle(n).backgroundColor),
    'rgb(229, 233, 255)',
  );
  results.push({
    name: 'actual current three component Tokens through public Provider',
    passed: true,
  });
  await visit('basic');
  const canceled = roots().filter({ hasText: 'Prevent Default' });
  await canceled.getByRole('button', { name: '关闭', exact: true }).click();
  assert.ok(!(await canceled.getAttribute('class')).includes('apollo-tag-hidden'));
  assert.equal(
    await page.getByRole('link', { name: 'Link', exact: true }).getAttribute('rel'),
    'noopener noreferrer',
  );
  results.push({
    name: 'actual complete closeIcon slot cancellation and real link attrs',
    passed: true,
  });
  const main = await page.goto(`${base}/components/tag`);
  assert.equal(main.status(), 200);
  const cards = page.locator('.demo-renderer[data-demo^="tag-"]');
  await page.waitForFunction(
    () => document.querySelectorAll('.demo-renderer[data-demo^="tag-"]').length === 12,
  );
  for (let i = 0; i < 12; i++) {
    await cards.nth(i).scrollIntoViewIfNeeded();
    await cards.nth(i).locator('.apollo-tag').first().waitFor();
  }
  assert.equal(await page.locator('.demo-renderer-error').count(), 0);
  results.push({
    name: 'physical component document and all twelve actual lazy demo cards',
    httpStatus: 200,
    passed: true,
  });
  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.TAG_DOCS_EVIDENCE ?? '/tmp/apollo-tag-docs.json',
    `${JSON.stringify({ base, browser: browser.version(), results, fallbackDocuments: [...fallbackDocuments], errors }, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
  console.log(
    JSON.stringify({ checks: results.length, errors, fallbackDocuments: fallbackDocuments.size }),
  );
} finally {
  await browser.close();
}
