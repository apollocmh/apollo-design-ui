/** Exercise every actual Statistic demo and the original clock/token controls. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const { browser } = await launchBrowser();
const results = [],
  errors = [],
  fallbackDocuments = new Set();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (
      expectedStatus === 404 &&
      r.status() === 404 &&
      r.request().isNavigationRequest() &&
      r.url().startsWith(`${base}/components/statistic/demo/`)
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
  for (const [demo, count] of [
    ['basic', 3],
    ['unit', 2],
    ['card', 2],
    ['animated', 2],
    ['timer', 6],
    ['style-class', 2],
    ['component-token', 1],
  ]) {
    const response = await page.goto(`${base}/components/statistic/demo/${demo}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(response.status(), expectedStatus);
    const roots = page.locator('.standalone-body .apollo-statistic');
    await roots.first().waitFor({ state: 'visible' });
    assert.equal(await roots.count(), count);
    assert.equal(await page.locator('.demo-error').count(), 0);
    results.push({ demo, httpStatus: response.status(), roots: count, passed: true });
  }
  await page.goto(`${base}/components/statistic/demo/timer`, { waitUntil: 'domcontentloaded' });
  const editor = page.getByRole('textbox', { name: 'Clock draft', exact: true });
  await editor.fill('Published clock draft');
  const original = await editor.elementHandle();
  const finished = page.locator('[aria-label="Completed countdowns"]');
  const before = Number(await finished.textContent());
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.getByRole('button', { name: 'Restart short countdown', exact: true }).click();
    await page.waitForFunction(
      (expected) =>
        Number(document.querySelector('[aria-label="Completed countdowns"]').textContent) ===
        expected,
      before + cycle + 1,
    );
    assert.equal(await page.locator('[data-clock-text]').textContent(), '00:00:00');
    assert.equal(await editor.inputValue(), 'Published clock draft');
    assert.equal(await editor.evaluate((n, o) => n === o, original), true);
  }
  await page.getByRole('button', { name: 'Switch clock direction', exact: true }).click();
  assert.equal(await editor.inputValue(), 'Published clock draft');
  assert.equal(await editor.evaluate((n, o) => n === o, original), true);
  assert.equal(await page.locator('[data-clock-text]').textContent(), '00:00:05');
  results.push({
    name: 'two real expiry cycles finish once each; direction switch retains the native editor and controlled draft',
    passed: true,
  });
  await page.goto(`${base}/components/statistic/demo/component-token`, {
    waitUntil: 'domcontentloaded',
  });
  const draft = page.getByRole('textbox', { name: 'Statistic token draft', exact: true });
  await draft.fill('Published token draft');
  const tokenOriginal = await draft.elementHandle();
  const content = page.locator('.standalone-body .apollo-statistic-content'),
    title = page.locator('.standalone-body .apollo-statistic-title');
  const font = () => content.evaluate((n) => getComputedStyle(n).fontSize);
  assert.equal(await font(), '36px');
  assert.equal(await title.evaluate((n) => getComputedStyle(n).fontSize), '16px');
  await page.getByRole('button', { name: 'Toggle Statistic theme', exact: true }).click();
  assert.equal(await font(), '24px');
  await page.getByRole('button', { name: 'Toggle Statistic theme', exact: true }).click();
  assert.equal(await font(), '36px');
  const slider = page.getByRole('slider', { name: 'Statistic content font size', exact: true });
  await slider.focus();
  await slider.press('ArrowRight');
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.standalone-body .apollo-statistic-content'))
        .fontSize === '37px',
  );
  await page
    .getByRole('checkbox', { name: 'Native Statistic token override', exact: true })
    .check();
  assert.equal(await font(), '48px');
  assert.equal(await title.evaluate((n) => getComputedStyle(n).fontSize), '19px');
  await page.getByRole('button', { name: 'Toggle Statistic theme', exact: true }).click();
  assert.equal(await font(), '48px');
  await page
    .getByRole('checkbox', { name: 'Native Statistic token override', exact: true })
    .uncheck();
  assert.equal(await font(), '24px');
  assert.equal(await draft.inputValue(), 'Published token draft');
  assert.equal(await draft.evaluate((n, o) => n === o, tokenOriginal), true);
  results.push({
    name: 'source tokens remove/restore, keyboard slider updates and native variables override without replacing the editor',
    passed: true,
  });
  assert.deepEqual(errors, []);
  const report = {
    base,
    browser: browser.version(),
    results,
    errors,
    fallbackDocuments: [...fallbackDocuments],
  };
  writeFileSync(
    process.env.STATISTIC_DOCS_EVIDENCE ?? '/tmp/apollo-statistic-docs.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(report);
} finally {
  await browser.close();
}
