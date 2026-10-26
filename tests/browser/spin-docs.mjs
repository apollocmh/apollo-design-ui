/** Verify every current Spin demo and actual scoped content/theme controls. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const results = [],
  errors = [];
const fallbackDocuments = new Set();
const { browser } = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(7000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      Number(process.env.DOCS_DEMO_STATUS) === 404 &&
      response.status() === 404 &&
      response.request().isNavigationRequest() &&
      response.url().startsWith(`${base}/components/spin/demo/`)
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
  for (const demo of [
    'basic',
    'size',
    'nested',
    'description',
    'delay-and-debounce',
    'custom-indicator',
    'percent',
    'style-class',
    'fullscreen',
    'component-token',
  ]) {
    const response = await page.goto(`${base}/components/spin/demo/${demo}`, {
      waitUntil: 'domcontentloaded',
    });
    // Standalone routes use the documented GitHub Pages 404.html SPA fallback.
    assert.equal(response.status(), Number(process.env.DOCS_DEMO_STATUS ?? 200));
    const first = page.locator('.standalone-body .apollo-spin').first();
    await first.waitFor({ state: 'attached' });
    assert.equal(await page.locator('.demo-error').count(), 0);
    if (demo !== 'fullscreen') assert.ok((await first.boundingBox()).height > 0);
    results.push({ demo, passed: true, httpStatus: response.status() });
  }
  await page.goto(`${base}/components/spin/demo/custom-indicator`, {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('.standalone-body .apollo-spin-indicator').first().waitFor();
  assert.equal(await page.locator('.standalone-body .apollo-spin-indicator svg').count(), 4);
  assert.equal(
    await page.locator('.standalone-body .apollo-spin-indicator').last().textContent(),
    '42%',
  );
  assert.equal(
    (await page.locator('.standalone-body .apollo-spin-indicator svg').nth(3).boundingBox()).width,
    48,
  );
  results.push({ name: 'four native SVG indicators and explicit 42% scope render', passed: true });
  await page.goto(`${base}/components/spin/demo/component-token`, {
    waitUntil: 'domcontentloaded',
  });
  const draft = page.getByRole('textbox', { name: 'Spin theme draft', exact: true });
  await draft.fill('Published native draft');
  const original = await draft.elementHandle();
  const sizes = () =>
    page
      .locator('.standalone-body .apollo-spin-dot-holder')
      .evaluateAll((nodes) => nodes.slice(0, 3).map((node) => getComputedStyle(node).fontSize));
  assert.deepEqual(await sizes(), ['12px', '28px', '44px']);
  const section = page.locator('.standalone-body .apollo-spin-nested>.apollo-spin-section');
  assert.equal((await section.boundingBox()).height, 96);
  for (const expected of [
    ['14px', '20px', '32px'],
    ['12px', '28px', '44px'],
  ]) {
    await page.getByRole('button', { name: '切换 Spin 主题', exact: true }).click();
    assert.deepEqual(await sizes(), expected);
    assert.equal(
      await original.evaluate(
        (node) => node === document.querySelector('input[aria-label="Spin theme draft"]'),
      ),
      true,
    );
    assert.equal(await draft.inputValue(), 'Published native draft');
  }
  await page.getByRole('button', { name: '切换加载状态', exact: true }).click();
  assert.equal(await section.count(), 0);
  assert.equal(await draft.inputValue(), 'Published native draft');
  await page.getByRole('button', { name: '切换加载状态', exact: true }).click();
  assert.equal((await section.boundingBox()).height, 96);
  results.push({
    name: 'all four live tokens, removal/restoration and loading preserve native draft',
    passed: true,
  });
  await page.goto(`${base}/components/spin/demo/percent`, { waitUntil: 'domcontentloaded' });
  const auto = page.getByRole('checkbox', { name: 'Auto', exact: true });
  await auto.check();
  await page.waitForFunction(() => {
    const bars = [...document.querySelectorAll('.standalone-body [role="progressbar"]')];
    return (
      bars.length === 3 &&
      bars.every(
        (bar) =>
          Number(bar.getAttribute('aria-valuenow')) > 0 &&
          Number(bar.getAttribute('aria-valuenow')) < 100,
      )
    );
  });
  results.push({
    name: 'actual auto demo advances all three accessible progressbars',
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
    process.env.SPIN_DOCS_EVIDENCE ?? '/tmp/apollo-spin-docs.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
