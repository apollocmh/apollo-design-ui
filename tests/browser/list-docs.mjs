/** Verify all current List demos and real fullscreen flow against a built Docs preview (DOCS_URL). */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const { browser } = await launchBrowser();
const results = [],
  issues = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (error) => issues.push(error.message));
  page.on('console', (message) => {
    if (message.text().includes('[Vue warn]')) issues.push(message.text());
  });
  for (const demo of [
    'basic',
    'component-token',
    'empty',
    'grid',
    'item-extra',
    'loadmore',
    'pagination-simple',
    'pagination',
    'responsive',
    'simple',
    'spin-debug',
    'vertical',
  ]) {
    await page.goto(`${base}/components/list/demo/${demo}`, { waitUntil: 'domcontentloaded' });
    const list = page.locator('.standalone-body .apollo-list').first();
    await list.waitFor({ state: 'visible' });
    const box = await list.boundingBox();
    assert.ok(box && box.width > 100 && box.height > 0, `${demo} must render a real list`);
    assert.equal(await page.locator('.demo-error').count(), 0);
    results.push({ demo, passed: true, width: box.width, height: box.height });
  }
  await page.goto(`${base}/components/spin/demo/fullscreen`, { waitUntil: 'domcontentloaded' });
  const editor = page.getByRole('textbox', { name: 'Fullscreen loading draft', exact: true });
  await editor.fill('Preserved fullscreen draft');
  const original = await editor.elementHandle();
  const before = await editor.boundingBox();
  await page.getByRole('button', { name: 'Show fullscreen', exact: true }).click();
  const mask = page.locator('.standalone-body .apollo-spin-mask');
  await mask.waitFor({ state: 'visible' });
  await page.waitForFunction(() =>
    document.querySelector('.standalone-body .apollo-spin-spinning'),
  );
  const maskBox = await mask.boundingBox();
  assert.ok(maskBox && maskBox.width === 1280 && maskBox.height === 900);
  const active = await editor.boundingBox();
  assert.equal(active.y, before.y);
  await page.waitForFunction(
    () => !document.querySelector('.standalone-body .apollo-spin-spinning'),
  );
  assert.equal(await editor.inputValue(), 'Preserved fullscreen draft');
  assert.ok(
    await original.evaluate(
      (node) => node === document.querySelector('input[aria-label="Fullscreen loading draft"]'),
    ),
  );
  assert.equal(await mask.getAttribute('aria-hidden'), 'true');
  assert.equal(await mask.evaluate((node) => node.inert), true);
  results.push({ demo: 'spin/fullscreen', passed: true, stableEditor: true, maskBox });
  assert.deepEqual(issues, []);
  const output = { base, browser: browser.version(), results, issues };
  fs.writeFileSync(
    process.env.DOCS_COMPLETE_EVIDENCE ?? '/tmp/apollo-list-docs-complete-browser.json',
    `${JSON.stringify(output, null, 2)}\n`,
  );
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
