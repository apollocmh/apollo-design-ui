/** All actual Skeleton demos, both Docs themes and their existing controls. */
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
      r.url().startsWith(`${base}/components/skeleton/demo/`)
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
    page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      );
    });
  const visit = async (name, theme = 'light') => {
    const response = await page.goto(`${base}/components/skeleton/demo/${name}?theme=${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(response.status(), expectedStatus);
    await page.locator('.demo-renderer').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    await settle();
    return response.status();
  };
  const roots = () => page.locator('.standalone-body .apollo-skeleton');
  for (const [demo, count] of [
    ['basic', 1],
    ['avatar', 1],
    ['loading', 1],
    ['active', 2],
    ['semantic', 1],
    ['children', 0],
    ['complex', 2],
    ['element', 6],
    ['component-token', 6],
  ]) {
    for (const theme of ['light', 'dark']) {
      const httpStatus = await visit(demo, theme);
      assert.equal(await roots().count(), count);
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
      assert.deepEqual(axe, []);
      results.push({ demo, theme, httpStatus, roots: count, axe, passed: true });
    }
  }
  await visit('loading');
  const toggle = page.getByRole('button', { name: /切换（当前/ });
  for (let cycle = 0; cycle < 2; cycle++) {
    await toggle.click();
    assert.equal(await roots().count(), 0);
    assert.ok((await page.locator('.standalone-body').textContent()).includes('这是真实内容。'));
    await toggle.click();
    assert.equal(await roots().count(), 1);
    assert.equal(await roots().first().getAttribute('aria-busy'), 'true');
  }
  results.push({
    name: 'actual controlled loading switches repeatedly between busy decoration and unwrapped content',
    passed: true,
  });
  await visit('children');
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.getByRole('button', { name: '重新加载', exact: true }).click();
    assert.equal(await roots().count(), 1);
    await page.getByRole('button', { name: '重新加载', exact: true }).waitFor({ state: 'visible' });
    assert.equal(await roots().count(), 0);
    assert.ok((await page.locator('.standalone-body').textContent()).includes('张三'));
  }
  results.push({
    name: 'actual children demo completes two real reload cycles with caller-owned state',
    passed: true,
  });
  await visit('complex');
  const node = page.locator('.standalone-body .apollo-skeleton-node'),
    originalNode = await node.elementHandle();
  assert.equal(await node.evaluate((n) => getComputedStyle(n).width), '160px');
  assert.equal(await node.evaluate((n) => getComputedStyle(n).height), '120px');
  await page.getByRole('button', { name: '关闭微光动画', exact: true }).click();
  assert.equal(await page.locator('.standalone-body .apollo-skeleton-active').count(), 0);
  await page.getByRole('button', { name: '开启微光动画', exact: true }).click();
  assert.equal(await page.locator('.standalone-body .apollo-skeleton-active').count(), 2);
  assert.equal(await node.evaluate((n, o) => n === o, originalNode), true);
  results.push({
    name: 'complex native content keeps identity and intended content dimensions across active changes',
    passed: true,
  });
  await visit('element');
  await page.getByRole('button', { name: '关闭微光动画', exact: true }).click();
  assert.equal(await page.locator('.standalone-body .apollo-skeleton-active').count(), 0);
  const activate = page.getByRole('button', { name: '开启微光动画', exact: true });
  await activate.focus();
  await activate.press('Space');
  assert.equal(await page.locator('.standalone-body .apollo-skeleton-active').count(), 6);
  results.push({
    name: 'all six standalone demo roots update and keyboard activation restores shimmer',
    passed: true,
  });
  await visit('component-token');
  const editor = page.getByRole('textbox', { name: 'Skeleton token draft', exact: true });
  await editor.fill('Published Skeleton draft');
  await editor.focus();
  const original = await editor.elementHandle();
  const identity = async () =>
    assert.equal(
      await editor.evaluate(
        (n, o) => n === o && n === document.activeElement && n.value === 'Published Skeleton draft',
        original,
      ),
      true,
    );
  const height = () =>
    page
      .locator('.standalone-body .apollo-skeleton-title')
      .evaluate((n) => getComputedStyle(n).height);
  assert.equal(await height(), '22px');
  await page
    .getByRole('button', { name: 'Toggle Skeleton theme', exact: true })
    .evaluate((n) => n.click());
  assert.equal(await height(), '16px');
  await identity();
  await page
    .getByRole('button', { name: 'Toggle Skeleton theme', exact: true })
    .evaluate((n) => n.click());
  assert.equal(await height(), '22px');
  await identity();
  await page
    .getByRole('button', { name: 'Toggle native Skeleton variable', exact: true })
    .evaluate((n) => n.click());
  assert.equal(await height(), '30px');
  await identity();
  await page
    .getByRole('button', { name: 'Toggle native Skeleton variable', exact: true })
    .evaluate((n) => n.click());
  assert.equal(await height(), '22px');
  await identity();
  results.push({
    name: 'current source tokens and native variable removal/restoration retain model, editor and focus',
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
    process.env.SKELETON_DOCS_EVIDENCE ?? '/tmp/apollo-skeleton-docs.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(report);
} finally {
  await browser.close();
}
