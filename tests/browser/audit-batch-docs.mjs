/** Verify the five audited units through actual generated site pages and demos. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4480/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const expectedAcceptedUnits = Number(process.env.DOCS_ACCEPTED_UNITS ?? 17);
const units = [
  { name: 'descriptions', count: 13, demos: ['basic', 'custom-label'] },
  { name: 'breadcrumb', count: 11, demos: ['native', 'overlay'] },
  { name: 'timeline', count: 15, demos: ['horizontal-debug', 'native-slots'] },
  { name: 'grid', count: 13, demos: ['responsive', 'playground'] },
  { name: 'space', count: 15, demos: ['compact', 'compact-button-vertical'] },
  { name: 'menu', demos: ['native-actions'] },
];
const results = [],
  errors = [],
  localeChecks = [],
  fallbackDocuments = new Set();
const { browser } = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    localStorage.setItem('apollo-site-theme', 'light');
    if (!localStorage.getItem('apollo-site-locale'))
      localStorage.setItem('apollo-site-locale', 'zh-CN');
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      expectedStatus === 404 &&
      response.status() === 404 &&
      response.request().isNavigationRequest() &&
      response.url().startsWith(`${base}/components/`) &&
      response.url().includes('/demo/')
    )
      fallbackDocuments.add(response.url());
  });
  page.on('console', (message) => {
    if (
      message.text() === 'Failed to load resource: the server responded with a status of 404 ()' &&
      fallbackDocuments.has(message.location().url)
    )
      return;
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  const check = async (name, run) => {
    try {
      await run();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    }
  };
  const visit = async (component, demo, theme = 'light') => {
    const response = await page.goto(
      `${base}/components/${component}/demo/${demo}?theme=${theme}`,
      { waitUntil: 'domcontentloaded' },
    );
    assert.equal(response.status(), expectedStatus);
    await page.locator('.demo-renderer').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.apolloTheme === 'dark'),
      theme === 'dark',
    );
  };
  for (const unit of units) {
    if (unit.count)
      await check(`${unit.name}: API and all ${unit.count} demo cards`, async () => {
        const response = await page.goto(`${base}/components/${unit.name}`);
        assert.equal(response.status(), 200);
        await page.waitForFunction(
          ({ name, count }) =>
            document.querySelectorAll(`.demo-renderer[data-demo^="${name}-"]`).length === count,
          { name: unit.name, count: unit.count },
        );
        assert.ok((await page.locator('main table').count()) > 0);
        assert.equal(await page.locator('.demo-renderer-error').count(), 0);
      });
    for (const demo of unit.demos)
      for (const theme of ['light', 'dark'])
        await check(`${unit.name}/${demo}/${theme}`, async () => {
          await visit(unit.name, demo, theme);
          const body = page.locator('.standalone-body');
          assert.ok(await body.locator('[class*="apollo-"]').count());
          await page.addScriptTag({
            path: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
          });
          const violations = await body.evaluate(async (node) =>
            (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
              id,
              targets: nodes.map((item) => item.target),
            })),
          );
          assert.deepEqual(violations, []);
        });
  }
  await check('Menu native button executes once through container Enter', async () => {
    await visit('menu', 'native-actions');
    const item = page.getByRole('menuitem').filter({ hasText: 'Native button' });
    await item.focus();
    await item.press('Enter');
    assert.match(await page.getByRole('status').textContent(), /Actions: 1/);
  });
  await check('Descriptions label help is reachable by keyboard', async () => {
    await visit('descriptions', 'custom-label');
    await page.getByRole('button', { name: '产品说明', exact: true }).focus();
    await page.getByRole('tooltip', { name: '产品的展示名称', exact: true }).waitFor();
  });
  await check('Timeline slot reversal preserves the actual editor and draft', async () => {
    await visit('timeline', 'native-slots');
    const input = page.getByRole('textbox', { name: 'Note created', exact: true });
    await input.fill('Published site draft');
    const original = await input.elementHandle();
    await page.getByRole('button', { name: 'Reverse items', exact: true }).click();
    assert.equal(
      await input.evaluate(
        (node, before) => node === before && node.value === 'Published site draft',
        original,
      ),
      true,
    );
  });
  for (const locale of ['zh-CN', 'en-US'])
    await check(`progress/${locale}`, async () => {
      await page.evaluate((value) => localStorage.setItem('apollo-site-locale', value), locale);
      const response = await page.goto(`${base}/guide/audit-progress`);
      assert.equal(response.status(), 200);
      const main = page.locator('main');
      const titles = {
        'zh-CN': '全库进度：按完整单元计，不按测试数量计',
        'en-US': 'Library-wide progress by complete audit unit',
      };
      await main.getByRole('heading', { name: titles[locale], exact: true }).waitFor();
      const opposite = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
      assert.equal(
        await main.getByRole('heading', { name: titles[opposite], exact: true }).count(),
        0,
      );
      const delivered = (
        await main
          .locator('table')
          .first()
          .getByRole('row')
          .nth(1)
          .getByRole('cell')
          .last()
          .innerText()
      ).trim();
      assert.match(delivered, new RegExp(`^${expectedAcceptedUnits}(?:个|\\s)`));
      await main.getByText('1602', { exact: false }).first().waitFor();
      assert.ok((await main.textContent()).includes('69'));
      localeChecks.push({ locale, heading: titles[locale], delivered });
    });
  assert.deepEqual(errors, []);
  assert.ok(
    results.every((result) => result.passed),
    JSON.stringify(results.filter((r) => !r.passed)),
  );
} finally {
  writeFileSync(
    process.env.AUDIT_DOCS_EVIDENCE ?? '/tmp/apollo-five-docs-browser.json',
    `${JSON.stringify(
      {
        base,
        expectedDemoStatus: expectedStatus,
        expectedAcceptedUnits,
        localeChecks,
        results,
        errors,
        fallbackDocuments: [...fallbackDocuments],
      },
      null,
      2,
    )}\n`,
  );
  await browser.close();
}
