/** Actual Avatar site pages, all original demos and their controls. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const demos = [
  'basic',
  'type',
  'dynamic',
  'badge',
  'group',
  'max-count',
  'fallback',
  'toggle-debug',
  'responsive',
  'component-token',
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
      r.url().startsWith(`${base}/components/avatar/demo/`)
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
    const r = await page.goto(`${base}/components/avatar/demo/${name}?theme=${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(r.status(), expectedStatus);
    await page.locator('.demo-renderer').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    return r.status();
  };
  const roots = () => page.locator('.standalone-body .apollo-avatar');
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
  await visit('dynamic');
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'ChangeUser', exact: true }).click();
  assert.equal((await roots().textContent()).trim(), 'Edward');
  const scaleBefore = await page
    .locator('.standalone-body .apollo-avatar-string')
    .evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).a);
  await page.getByRole('button', { name: 'changeGap', exact: true }).click();
  await page.waitForFunction(
    (previous) =>
      new DOMMatrix(
        getComputedStyle(document.querySelector('.standalone-body .apollo-avatar-string'))
          .transform,
      ).a > previous,
    scaleBefore,
  );

  results.push({ name: 'published dynamic name and gap controls', passed: true });
  await visit('max-count');
  const group = page.locator('.standalone-body .apollo-avatar-group');
  assert.equal(await group.textContent(), 'AB+2');
  await page.getByRole('switch', { name: 'overflowInFinal' }).click();
  assert.equal(await group.textContent(), 'ABC+1');
  const input = page.getByRole('spinbutton', { name: 'Avatar count' });
  await input.fill('6');
  await input.press('Enter');
  await page.waitForFunction(
    () => document.querySelector('.standalone-body .apollo-avatar-group').textContent === 'ABC+3',
  );
  results.push({
    name: 'published native child count and actual InputNumber/Switch',
    passed: true,
  });
  await visit('component-token');
  const normal = roots().filter({ hasText: /^M$/ });
  assert.equal(await normal.evaluate((n) => n.offsetWidth), 48);
  const action = page.locator('.standalone-body .apollo-avatar-group-overflow');
  await action.focus();
  await action.press('Enter');
  const hidden = page.locator('.apollo-avatar-group-popover .apollo-avatar + .apollo-avatar');
  await hidden.waitFor({ state: 'visible' });
  assert.equal(await hidden.evaluate((n) => getComputedStyle(n).marginInlineStart), '10px');
  await page.keyboard.press('Escape');
  await page.getByRole('switch', { name: 'Use custom Avatar tokens' }).click();
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('.standalone-body .apollo-avatar')].find(
        (n) => n.textContent === 'M',
      ).offsetWidth === 32,
  );
  results.push({
    name: 'published current twelve Token configuration and native overflow',
    passed: true,
  });
  await visit('fallback');
  await page.waitForFunction(() => !document.querySelector('.standalone-body .apollo-avatar img'));
  assert.deepEqual(await roots().allTextContents(), ['A', 'ABC']);
  results.push({ name: 'published actual image failure fallback', passed: true });
  await visit('toggle-debug');
  assert.equal(await page.locator('.standalone-body .apollo-avatar:visible').count(), 0);
  await page.getByRole('button', { name: 'Toggle Avatar visibility' }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.standalone-body .apollo-avatar')].every(
      (n) => n.offsetWidth > 0,
    ),
  );
  results.push({ name: 'published hidden mount and show', passed: true });
  await visit('responsive');
  for (const [width, expected] of [
    [375, 24],
    [800, 40],
    [1280, 80],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForFunction(
      (expected) =>
        document.querySelector('.standalone-body .apollo-avatar').offsetWidth === expected,
      expected,
    );
  }
  results.push({ name: 'published responsive size in three actual viewports', passed: true });
  const main = await page.goto(`${base}/components/avatar`);
  assert.equal(main.status(), 200);
  const cards = page.locator('.demo-renderer[data-demo^="avatar-"]');
  await page.waitForFunction(
    () => document.querySelectorAll('.demo-renderer[data-demo^="avatar-"]').length === 10,
  );
  for (let i = 0; i < 10; i++) {
    await cards.nth(i).scrollIntoViewIfNeeded();
    await cards.nth(i).locator('.apollo-avatar').first().waitFor({ state: 'attached' });
  }
  assert.equal(await page.locator('.demo-renderer-error').count(), 0);
  results.push({
    name: 'physical component document and ten lazy cards',
    httpStatus: 200,
    passed: true,
  });
  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.AVATAR_DOCS_EVIDENCE ?? '/tmp/apollo-avatar-docs.json',
    `${JSON.stringify({ base, browser: browser.version(), results, fallbackDocuments: [...fallbackDocuments], errors }, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
  console.log(
    JSON.stringify({ checks: results.length, errors, fallbackDocuments: fallbackDocuments.size }),
  );
} finally {
  await browser.close();
}
