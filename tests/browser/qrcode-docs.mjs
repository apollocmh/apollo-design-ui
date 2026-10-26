/** Exercise all actual QRCode demos against a built Docs preview or publication. */
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(7000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      expectedStatus === 404 &&
      response.status() === 404 &&
      response.request().isNavigationRequest() &&
      response.url().startsWith(`${base}/components/qr-code/demo/`)
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
  for (const demo of ['basic', 'custom', 'status', 'svg', 'component-token']) {
    const response = await page.goto(`${base}/components/qr-code/demo/${demo}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(response.status(), expectedStatus);
    const qr = page.locator('.standalone-body .apollo-qrcode').first();
    await qr.waitFor({ state: 'visible' });
    const box = await qr.boundingBox();
    assert.ok(box.width > 80 && box.height > 80);
    assert.ok(await qr.locator(':scope>[role="img"]').getAttribute('aria-label'));
    assert.equal(await page.locator('.demo-error').count(), 0);
    results.push({ demo, httpStatus: response.status(), passed: true });
  }
  await page.goto(`${base}/components/qr-code/demo/status`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Expired', exact: true }).click();
  const codes = page.locator('.standalone-body .apollo-qrcode');
  const editor = page.getByRole('textbox', { name: 'QR status draft', exact: true });
  await editor.fill('Published status draft');
  const original = await editor.elementHandle();
  for (let cycle = 0; cycle < 2; cycle++) {
    await codes.first().getByRole('button').click();
    await codes.first().locator('.apollo-spin').waitFor({ state: 'visible' });
    await codes.first().locator('.apollo-qrcode-expired').waitFor({ state: 'visible' });
    assert.equal(await editor.inputValue(), 'Published status draft');
    assert.equal(await editor.evaluate((node, original) => node === original, original), true);
  }
  await page.getByRole('checkbox', { name: 'Empty status', exact: true }).check();
  assert.equal(await codes.last().locator('.apollo-qrcode-cover').textContent(), '');
  await page.getByRole('checkbox', { name: 'Empty status', exact: true }).uncheck();
  assert.equal(await editor.inputValue(), 'Published status draft');
  await page.getByRole('checkbox', { name: 'Custom status', exact: true }).uncheck();
  assert.equal(await codes.last().locator('.apollo-qrcode-expired').count(), 1);
  await page.getByRole('checkbox', { name: 'Custom status', exact: true }).check();
  assert.equal(await editor.inputValue(), 'Published status draft');
  results.push({
    name: 'repeated refresh expires again; native model survives status and conditional slots',
    passed: true,
  });
  await page.goto(`${base}/components/qr-code/demo/component-token`, {
    waitUntil: 'domcontentloaded',
  });
  const draft = page.getByRole('textbox', { name: 'QR token draft', exact: true });
  await draft.fill('Published token draft');
  const tokenEditor = await draft.elementHandle();
  const cover = page.locator('.standalone-body .apollo-qrcode-cover');
  assert.equal(
    await cover.evaluate((node) => getComputedStyle(node).backgroundColor),
    'rgb(232, 244, 236)',
  );
  await page.getByRole('button', { name: '切换 QRCode 主题', exact: true }).click();
  assert.notEqual(
    await cover.evaluate((node) => getComputedStyle(node).backgroundColor),
    'rgb(232, 244, 236)',
  );
  await page.getByRole('button', { name: '切换 QRCode 主题', exact: true }).click();
  assert.equal(
    await cover.evaluate((node) => getComputedStyle(node).backgroundColor),
    'rgb(232, 244, 236)',
  );
  assert.equal(await draft.inputValue(), 'Published token draft');
  assert.equal(await draft.evaluate((node, original) => node === original, tokenEditor), true);
  results.push({
    name: 'actual component token removal/restoration preserves the native editor',
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
    process.env.QRCODE_DOCS_EVIDENCE ?? '/tmp/apollo-qrcode-docs.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(report);
} finally {
  await browser.close();
}
