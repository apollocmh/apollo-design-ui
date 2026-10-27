/** Actual Empty site pages, all original demos and their controls. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const demos = ['basic', 'simple', 'customize', 'config-provider', 'description', 'style-class'];
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
      r.url().startsWith(`${base}/components/empty/demo/`)
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
    const r = await page.goto(`${base}/components/empty/demo/${name}?theme=${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(r.status(), expectedStatus);
    await page.locator('.demo-renderer').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    return r.status();
  };
  const roots = () => page.locator('.standalone-body .apollo-empty');
  for (const demo of demos)
    for (const theme of ['light', 'dark']) {
      const httpStatus = await visit(demo, theme);
      assert.equal(await roots().count(), demo === 'description' ? 3 : 1);
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
  await visit('customize');
  const draft = page.getByRole('textbox', { name: 'Draft name', exact: true });
  await draft.fill('Published image draft');
  const original = await draft.elementHandle();
  await draft.focus();
  assert.equal(await draft.inputValue(), 'Published image draft');
  assert.equal(await original.evaluate((n) => n.isConnected && document.activeElement === n), true);
  assert.equal(await roots().locator('.apollo-empty-image-content svg').count(), 1);
  assert.ok(
    (await roots().locator('.apollo-empty-image-content').textContent()).includes(
      'Complete image content',
    ),
  );
  results.push({ name: 'actual complete image slot and working native draft', passed: true });
  await visit('config-provider');
  const root = await roots().elementHandle();
  for (const checked of [true, false, true]) {
    await page
      .getByRole('checkbox', { name: 'Change Provider configuration', exact: true })
      .setChecked(checked);
    assert.equal(await roots().locator('img').count(), checked ? 1 : 0);
    assert.equal(await roots().locator('svg').count(), checked ? 0 : 1);
    assert.equal(
      await roots().evaluate(
        (n, checked) =>
          n.classList.contains(checked ? 'empty-config-custom' : 'empty-config-simple'),
        checked,
      ),
      true,
    );
    assert.equal(await root.evaluate((n) => n.isConnected), true);
  }
  results.push({
    name: 'actual named Provider image/style/class updates preserve the root',
    passed: true,
  });
  await visit('description');
  const descriptionRoot = roots().nth(2);
  for (const checked of [false, true, false, true]) {
    await page
      .getByRole('checkbox', { name: 'Show description slot', exact: true })
      .setChecked(checked);
    assert.equal(
      await descriptionRoot.locator('.apollo-empty-description').count(),
      checked ? 1 : 0,
    );
    assert.ok(!(await descriptionRoot.textContent()).includes('The slot suppresses this fallback'));
  }
  results.push({
    name: 'actual conditional complete description suppresses fallback and empty spacing',
    passed: true,
  });
  await visit('style-class');
  for (const part of ['root', 'image', 'description', 'footer'])
    assert.equal(await page.locator(`.demo-empty-${part}`).count(), 1);
  for (const checked of [true, false, true]) {
    await page
      .getByRole('checkbox', { name: 'Highlight description', exact: true })
      .setChecked(checked);
    assert.equal(
      await roots()
        .locator('.apollo-empty-description')
        .evaluate((n) => getComputedStyle(n).fontWeight),
      checked ? '600' : '400',
    );
  }
  results.push({ name: 'all four actual semantic hosts and current factories', passed: true });
  const main = await page.goto(`${base}/components/empty`);
  assert.equal(main.status(), 200);
  const cards = page.locator('.demo-renderer[data-demo^="empty-"]');
  await page.waitForFunction(
    () => document.querySelectorAll('.demo-renderer[data-demo^="empty-"]').length === 6,
  );
  for (let i = 0; i < 6; i++) {
    await cards.nth(i).scrollIntoViewIfNeeded();
    await cards.nth(i).locator('.apollo-empty').first().waitFor();
  }
  assert.equal(await page.locator('.demo-renderer-error').count(), 0);
  results.push({
    name: 'physical component document and all six actual lazy demo cards',
    httpStatus: 200,
    passed: true,
  });
  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.EMPTY_DOCS_EVIDENCE ?? '/tmp/apollo-empty-docs.json',
    `${JSON.stringify({ base, browser: browser.version(), results, fallbackDocuments: [...fallbackDocuments], errors }, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
  console.log(
    JSON.stringify({ checks: results.length, errors, fallbackDocuments: fallbackDocuments.size }),
  );
} finally {
  await browser.close();
}
