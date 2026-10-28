import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const runtimeMarker = process.env.BADGE_DOCS_RUNTIME ?? '1257';
const browserMarker = process.env.BADGE_DOCS_BROWSER ?? '172';
const demos = [
  'basic',
  'change',
  'colorful',
  'content-slots',
  'dot',
  'link',
  'no-wrapper',
  'offset',
  'overflow',
  'ribbon',
  'size',
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
      r.url().startsWith(`${base}/components/badge/demo/`)
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
    const r = await page.goto(`${base}/components/badge/demo/${name}?theme=${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(r.status(), expectedStatus);
    await page.locator('.demo-renderer').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    await settle();
    return r.status();
  };
  const body = page.locator('.standalone-body');
  for (const demo of demos)
    for (const theme of ['light', 'dark']) {
      const httpStatus = await visit(demo, theme);
      assert.ok((await body.locator('.apollo-badge,.apollo-ribbon-wrapper').count()) > 0);
      assert.equal(
        await page.evaluate(() => document.documentElement.dataset.apolloTheme === 'dark'),
        theme === 'dark',
      );
      await page.addScriptTag({
        path: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
      });
      const axe = await body.evaluate(async (n) =>
        (await window.axe.run(n)).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.failureSummary),
        })),
      );
      results.push({ demo, theme, httpStatus, axe, passed: axe.length === 0 });
    }
  const currentCount = () =>
    body.locator('.apollo-badge-count').evaluate((n) => {
      const copy = n.cloneNode(true);
      for (const child of copy.querySelectorAll('[aria-hidden="true"]')) child.remove();
      return copy.textContent;
    });
  await visit('change');
  await page.getByRole('button', { name: '增加计数 / Increase count', exact: true }).click();
  await settle();
  assert.equal(await currentCount(), '6');
  await page.getByRole('button', { name: '负数 / Negative', exact: true }).click();
  await settle();
  assert.equal(await currentCount(), '-12');
  results.push({
    name: 'published positive/negative count controls and accessible digits',
    passed: true,
  });
  await visit('content-slots');
  await page
    .getByRole('textbox', { name: 'Badge anchor state', exact: true })
    .fill('Badge published draft');
  await page
    .getByRole('textbox', { name: 'Ribbon anchor state', exact: true })
    .fill('Ribbon published draft');
  await body.evaluate((n) => {
    window.badgeDocsInputs = [...n.querySelectorAll('input')];
  });
  await page.getByRole('button', { name: '切换空内容 / Toggle empty', exact: true }).click();
  await settle();
  assert.equal(await body.locator('.apollo-badge-count').count(), 0);
  assert.equal(await body.locator('.apollo-ribbon-content').innerText(), '');
  await page.getByRole('button', { name: '切换插槽 / Toggle content', exact: true }).click();
  await settle();
  assert.equal(await body.locator('.apollo-ribbon-content').innerText(), 'Prop ribbon');
  assert.equal(await currentCount(), '5');
  assert.equal(
    await body.evaluate((n) =>
      [...n.querySelectorAll('input')].every((n, i) => n === window.badgeDocsInputs[i]),
    ),
    true,
  );
  assert.equal(
    await page.getByRole('textbox', { name: 'Badge anchor state', exact: true }).inputValue(),
    'Badge published draft',
  );
  assert.equal(
    await page.getByRole('textbox', { name: 'Ribbon anchor state', exact: true }).inputValue(),
    'Ribbon published draft',
  );
  results.push({
    name: 'published complete content, empty precedence and both business drafts',
    passed: true,
  });
  await visit('style-class');
  const input = page.getByRole('textbox', { name: 'Token and direction draft', exact: true });
  await input.fill('Published token draft');
  await input.evaluate((n) => {
    window.badgeDocsTokenInput = n;
  });
  await page.getByRole('button', { name: '九个 Token / Nine tokens', exact: true }).click();
  await settle();
  const actual = await body.evaluate((n) => {
    const css = [...n.querySelectorAll('.demo-stage-1 .apollo-badge-count')].map((n) =>
      getComputedStyle(n),
    );
    return {
      height: css[0].height,
      size: css[0].fontSize,
      weight: css[0].fontWeight,
      z: css[0].zIndex,
      padding: css[0].paddingInlineStart,
      smallHeight: css[1].height,
      smallSize: css[1].fontSize,
      dot: getComputedStyle(n.querySelector('.demo-stage-1 .apollo-badge-dot')).width,
      status: getComputedStyle(n.querySelector('.demo-stage-1 .apollo-badge-status-dot')).width,
    };
  });
  assert.deepEqual(actual, {
    height: '28px',
    size: '15px',
    weight: '700',
    z: '3',
    padding: '12px',
    smallHeight: '18px',
    smallSize: '11px',
    dot: '10px',
    status: '10px',
  });
  await page.getByRole('button', { name: '零值 / Zero', exact: true }).click();
  await settle();
  assert.equal(
    await body
      .locator('.demo-stage-2 .apollo-badge-count')
      .first()
      .evaluate((n) => getComputedStyle(n).height),
    '0px',
  );
  await page.getByRole('button', { name: '恢复默认 / Reset', exact: true }).click();
  await settle();
  await page.getByRole('button', { name: 'RTL / LTR', exact: true }).click();
  assert.equal(
    await body
      .locator('.demo-stage-0')
      .first()
      .evaluate((n) => n.classList.contains('apollo-badge-rtl')),
    true,
  );
  assert.equal(await input.evaluate((n) => n === window.badgeDocsTokenInput), true);
  assert.equal(await input.inputValue(), 'Published token draft');
  results.push({
    name: 'published nine tokens, applicable zeros, restoration and current direction',
    passed: true,
  });
  const api = await page.goto(`${base}/components/badge`);
  assert.equal(api.status(), 200);
  await page.waitForFunction(
    () => document.querySelectorAll('.demo-renderer[data-demo^="badge-"]').length === 13,
  );
  const cards = page.locator('.demo-renderer[data-demo^="badge-"]');
  for (let i = 0; i < 13; i++) {
    const card = cards.nth(i);
    await card.scrollIntoViewIfNeeded();
    await card
      .locator('.apollo-badge,.apollo-ribbon-wrapper')
      .first()
      .waitFor({ state: 'attached' });
  }
  assert.equal(await page.locator('.demo-renderer-error').count(), 0);
  const text = await page.locator('main').textContent();
  for (const term of [
    'nativeElement',
    'indicatorZIndex',
    'statusSize',
    'paddingInline',
    'Fragment',
  ])
    assert.ok(text.includes(term), term);
  results.push({
    name: 'physical API page with all thirteen actual lazy demo cards',
    passed: true,
  });
  const progress = await page.goto(`${base}/guide/audit-progress`);
  assert.equal(progress.status(), 200);
  await page.waitForFunction(() =>
    document.querySelector('main')?.textContent.includes('Badge / Ribbon'),
  );
  const progressText = await page.locator('main').textContent();
  assert.ok(progressText.includes(runtimeMarker), runtimeMarker);
  assert.ok(progressText.includes(browserMarker), browserMarker);
  results.push({ name: 'physical progress page with the current verified stage', passed: true });
  await page.goto(`${base}/components/badge?lang=en-US`);
  await page
    .getByRole('heading', { name: 'Expose and current configuration', exact: true })
    .waitFor({ state: 'visible' });
  results.push({ name: 'English API contains current contracts', passed: true });
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
  console.log(
    JSON.stringify({ checks: results.length, errors, fallbackDocuments: fallbackDocuments.size }),
  );
} finally {
  writeFileSync(
    process.env.BADGE_DOCS_EVIDENCE ?? '/tmp/apollo-badge-docs-browser.json',
    JSON.stringify(
      {
        base,
        browser: browser.version(),
        results,
        errors,
        fallbackDocuments: [...fallbackDocuments],
      },
      null,
      2,
    ),
  );
  await browser.close();
}
