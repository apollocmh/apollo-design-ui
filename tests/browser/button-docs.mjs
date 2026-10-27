/** Actual built Button documentation: all original demos, both site themes and live controls. */
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
      r.url().startsWith(`${base}/components/button/demo/`)
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
  const demo = () => page.locator('.standalone-body .demo-renderer');
  const settle = () =>
    page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
  const componentResponse = await page.goto(`${base}/components/button`, {
    waitUntil: 'domcontentloaded',
  });
  assert.equal(componentResponse.status(), 200);
  assert.ok(
    (await componentResponse.text()).includes('id="何时使用"'),
    'physical Button SSR body is required by deployment',
  );
  assert.equal(await page.locator('.demo-preview').count(), 20);
  // Component pages intentionally activate demos through IntersectionObserver.
  // Visit every original card before requiring its real component to be ready.
  for (const card of await page.locator('.demo-preview').all()) {
    await card.scrollIntoViewIfNeeded();
    await card.locator('.demo-renderer .apollo-btn').first().waitFor({ state: 'attached' });
    assert.equal(await card.locator('.demo-renderer-loading').count(), 0);
  }
  assert.equal(await page.locator('.demo-renderer-error').count(), 0);
  const mainSSR = {
    httpStatus: componentResponse.status(),
    originalDemoCards: 20,
    bodyHeading: true,
  };
  const visit = async (name, theme = 'light') => {
    const response = await page.goto(`${base}/components/button/demo/${name}?theme=${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(response.status(), expectedStatus);
    await demo().waitFor({ state: 'attached' });
    await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'));
    assert.equal(await page.locator('.demo-renderer-error').count(), 0);
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.apolloTheme === 'dark'),
      theme === 'dark',
    );
    await settle();
    return response.status();
  };
  for (const name of [
    'basic',
    'block',
    'chinese-chars-loading',
    'chinese-space',
    'color-variant',
    'component-token',
    'custom-disabled-bg',
    'danger',
    'disabled',
    'ghost',
    'href',
    'icon',
    'icon-placement',
    'linear-gradient',
    'loading',
    'multiple',
    'semantic',
    'shape',
    'size',
    'style-class',
  ]) {
    for (const theme of ['light', 'dark']) {
      const httpStatus = await visit(name, theme);
      assert.ok(await demo().locator('.apollo-btn').count());
      await page.addScriptTag({
        path: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
      });
      const violations = await demo().evaluate(async (n) =>
        (await window.axe.run(n)).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((x) => x.failureSummary),
        })),
      );
      results.push({ name, theme, httpStatus, passed: violations.length === 0, violations });
      console.log(`${violations.length ? 'FAIL' : 'PASS'} ${name}/${theme}`);
    }
  }
  await visit('loading');
  await page.clock.install();
  const delayed = demo().getByRole('button', { name: 'Delay 1s', exact: true });
  await delayed.click();
  assert.equal(await delayed.getAttribute('aria-busy'), 'true');
  assert.equal(await delayed.evaluate((n) => n.classList.contains('apollo-btn-loading')), false);
  await delayed.dispatchEvent('click');
  assert.match(await demo().textContent(), /已触发\s*1\s*次/);
  await page.clock.fastForward(1100);
  assert.equal(await delayed.evaluate((n) => n.classList.contains('apollo-btn-loading')), true);
  await page.clock.fastForward(2100);
  assert.equal(await delayed.getAttribute('aria-busy'), null);
  results.push({
    name: 'loading',
    interaction: 'immediate guard, delayed indicator, one operation and recovery',
    passed: true,
  });

  await visit('chinese-chars-loading');
  const submit = demo().getByRole('button', { name: '提交', exact: true });
  await submit.click();
  assert.equal(await submit.getAttribute('aria-busy'), 'true');
  await page.clock.fastForward(1600);
  assert.ok((await demo().textContent()).includes('提交完成'));
  assert.equal(await submit.textContent(), '提交');
  results.push({
    name: 'chinese-chars-loading',
    interaction: 'real operation and continuous native Chinese text',
    passed: true,
  });

  await visit('component-token');
  const primary = demo().getByRole('button', { name: 'Primary', exact: true });
  const root = await primary.elementHandle();
  const draft = demo().getByRole('textbox', { name: 'Button token draft' });
  await draft.fill('Saved actual site draft');
  await draft.focus();
  const font = () => primary.evaluate((n) => getComputedStyle(n).fontSize);
  const toggle = async (name) => {
    await demo()
      .getByLabel(name, { exact: true })
      .evaluate((n) => n.click());
    await settle();
  };
  await toggle('放大字号');
  assert.equal(
    await primary.evaluate((n) => n.style.getPropertyValue('--apollo-btn-content-font-size')),
    '18px',
  );
  assert.equal(await font(), '18px');
  await toggle('原生变量优先');
  assert.equal(await font(), '22px');
  await toggle('启用组件 Token');
  assert.equal(await font(), '22px');
  await toggle('原生变量优先');
  assert.equal(await font(), '14px');
  assert.equal(await draft.inputValue(), 'Saved actual site draft');
  assert.equal(await draft.evaluate((n) => document.activeElement === n), true);
  assert.equal(await primary.evaluate((n, original) => n === original, root), true);
  await primary.click();
  assert.match(await demo().textContent(), /点击 Primary 次数：\s*1/);
  results.push({
    name: 'component-token',
    interaction:
      'current tokens, removal, native priority, draft/focus/root identity and real click',
    passed: true,
  });

  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.BUTTON_DOCS_EVIDENCE ?? '/tmp/apollo-button-docs.json',
    `${JSON.stringify({ browser: browser.version(), mainSSR, results, errors }, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser.close();
}
