/** Actual Result documentation demos in both site themes, including existing controls. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
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
      r.url().startsWith(`${base}/components/result/demo/`)
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
  const settle = () =>
    page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
  const visit = async (name, theme = 'light') => {
    const response = await page.goto(`${base}/components/result/demo/${name}?theme=${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(response.status(), expectedStatus);
    await page.locator('.demo-renderer').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    await settle();
    return response.status();
  };
  const root = () => page.locator('.standalone-body .apollo-result');
  for (const demo of [
    'success',
    'info',
    'warning',
    '403',
    '404',
    '500',
    'error',
    'custom-icon',
    'style-class',
    'component-token',
  ])
    for (const theme of ['light', 'dark']) {
      const httpStatus = await visit(demo, theme);
      assert.equal(await root().count(), 1);
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
  await visit('custom-icon');
  const draft = page.getByRole('textbox', { name: 'Result demo draft', exact: true });
  await draft.fill('Published Result draft');
  const original = await draft.elementHandle();
  for (const status of ['success', 'warning', 'error', '403', '404', '500', 'info']) {
    await page
      .getByRole('combobox', { name: 'Result demo status', exact: true })
      .selectOption(status);
    assert.equal(
      await draft.evaluate((n, o) => n === o && n.value === 'Published Result draft', original),
      true,
    );
    assert.equal(await root().locator('.apollo-result-image').count(), 0);
  }
  await page.getByRole('combobox', { name: 'Result demo icon', exact: true }).selectOption('empty');
  assert.equal(await root().locator('.apollo-result-icon').count(), 0);
  await page
    .getByRole('combobox', { name: 'Result demo icon', exact: true })
    .selectOption('default');
  assert.equal(await root().locator('.apollo-result-icon .apollo-icon').count(), 1);
  await page.getByRole('combobox', { name: 'Result demo status', exact: true }).selectOption('404');
  assert.equal(
    await root().locator('.apollo-result-image svg').getAttribute('aria-hidden'),
    'true',
  );
  await page
    .getByRole('combobox', { name: 'Result demo icon', exact: true })
    .selectOption('custom');
  assert.equal(await draft.inputValue(), 'Published Result draft');
  results.push({
    name: 'actual custom icon demo switches all statuses, full/empty/absent slots and retains caller-owned draft',
    passed: true,
  });
  await visit('component-token');
  const editor = page.getByRole('textbox', { name: 'Result token draft', exact: true });
  await editor.fill('Published token draft');
  await editor.focus();
  const tokenOriginal = await editor.elementHandle();
  const font = () =>
    root()
      .locator('.apollo-result-title')
      .evaluate((n) => getComputedStyle(n).fontSize);
  const identity = async () =>
    assert.equal(
      await editor.evaluate(
        (n, o) => n === o && n === document.activeElement && n.value === 'Published token draft',
        tokenOriginal,
      ),
      true,
    );
  assert.equal(await font(), '32px');
  for (let cycle = 0; cycle < 2; cycle++) {
    await page
      .getByRole('button', { name: 'Toggle Result theme', exact: true })
      .evaluate((n) => n.click());
    assert.equal(await font(), '24px');
    await identity();
    await page
      .getByRole('button', { name: 'Toggle Result theme', exact: true })
      .evaluate((n) => n.click());
    assert.equal(await font(), '32px');
    await identity();
  }
  await page
    .getByRole('button', { name: 'Toggle Result native font', exact: true })
    .evaluate((n) => n.click());
  assert.equal(await font(), '36px');
  await identity();
  await page
    .getByRole('button', { name: 'Toggle Result native font', exact: true })
    .evaluate((n) => n.click());
  assert.equal(await font(), '32px');
  await identity();
  results.push({
    name: 'actual four-token source removal/restoration and native override preserve input identity/value/focus',
    passed: true,
  });
  await visit('style-class');
  for (const part of ['root', 'title', 'subtitle', 'icon', 'extra', 'body'])
    assert.equal(await page.locator(`.demo-result-${part}`).count(), 1);
  const icon = root().locator('.apollo-result-icon');
  const originalIcon = await icon.elementHandle();
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.getByRole('button', { name: 'Toggle Result semantic status', exact: true }).click();
    assert.equal(await icon.evaluate((n) => getComputedStyle(n).opacity), '1');
    await page.getByRole('button', { name: 'Toggle Result semantic status', exact: true }).click();
    assert.equal(await icon.evaluate((n) => getComputedStyle(n).opacity), '0.8');
    assert.equal(await icon.evaluate((n, o) => n === o, originalIcon), true);
  }
  results.push({
    name: 'all six actual semantic targets exist and factories follow repeated status changes',
    passed: true,
  });
  assert.deepEqual(errors, []);
  const report = {
    base,
    browser: browser.version(),
    results,
    fallbackDocuments: [...fallbackDocuments],
    errors,
  };
  writeFileSync(
    process.env.RESULT_DOCS_EVIDENCE ?? '/tmp/apollo-result-docs.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.equal(
    results.filter((r) => !r.passed).length,
    0,
    'Every actual demo must pass all axe rules',
  );
  console.log(
    JSON.stringify({ checks: results.length, errors, fallbackDocuments: fallbackDocuments.size }),
  );
} finally {
  await browser.close();
}
