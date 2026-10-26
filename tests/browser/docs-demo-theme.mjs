/** Validate shared Docs source-theme propagation and named affected consumers. */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { launchBrowser } from '../visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const { browser } = await launchBrowser();
const consumerChecks = [],
  componentSmoke = [],
  errors = [],
  networkDiagnostics = [],
  fallbackDocuments = new Set();
let route = '';
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => localStorage.setItem('apollo-site-theme', 'light'));
  page.on('pageerror', (e) => errors.push({ route, message: e.message }));
  page.on('response', (r) => {
    if (
      r.status() === 404 &&
      r.request().isNavigationRequest() &&
      r.url().startsWith(`${base}/components/`)
    )
      fallbackDocuments.add(r.url());
  });
  page.on('console', (m) => {
    if (m.type() !== 'error' && !m.text().includes('[Vue warn]')) return;
    if (m.text().startsWith('Failed to load resource:')) {
      networkDiagnostics.push({ route, message: m.text(), url: m.location().url });
      return;
    }
    errors.push({ route, message: m.text() });
  });
  const visit = async (component, demo, theme) => {
    route = `${component}/${demo}/${theme}`;
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
  for (const component of ['image', 'list', 'spin', 'qr-code', 'statistic'])
    for (const theme of ['light', 'dark']) {
      const start = errors.length;
      await visit(component, 'component-token', theme);
      await page.addScriptTag({
        path: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
      });
      const violations = await page.locator('.standalone-body').evaluate(async (n) =>
        (await window.axe.run(n)).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((x) => ({ html: x.html, failure: x.failureSummary })),
        })),
      );
      consumerChecks.push({
        component,
        theme,
        passed: violations.length === 0 && errors.length === start,
        violations,
      });
      console.log(`${violations.length ? 'FAIL' : 'PASS'} source-token ${component}/${theme}`);
    }
  await visit('statistic', 'component-token', 'dark');
  assert.equal(await page.evaluate(() => localStorage.getItem('apollo-site-theme')), 'light');
  await page.locator('.standalone-bar a').click();
  await page.locator('.site-theme-toggle').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.apolloTheme), undefined);
  consumerChecks.push({
    name: 'leaving the dark query restores the saved light mode without persisting the override',
    passed: true,
  });
  const editor = page.getByRole('textbox', { name: 'Statistic token draft', exact: true });
  await editor.fill('Persistent host draft');
  await editor.focus();
  const original = await editor.elementHandle();
  const identity = async () =>
    assert.equal(
      await editor.evaluate(
        (n, o) => n === o && n === document.activeElement && n.value === 'Persistent host draft',
        original,
      ),
      true,
    );
  for (const mode of ['dark', 'light', 'dark']) {
    for (
      let i = 0;
      i < 4 && (await page.evaluate(() => localStorage.getItem('apollo-site-theme'))) !== mode;
      i++
    )
      await page.locator('.site-theme-toggle').evaluate((n) => n.click());
    await page.waitForFunction(
      (dark) => (document.documentElement.dataset.apolloTheme === 'dark') === dark,
      mode === 'dark',
    );
    await identity();
  }
  consumerChecks.push({
    name: 'repeated inline host theme changes preserve the same native editor, focus and controlled value',
    passed: true,
  });
  for (
    let i = 0;
    i < 4 && (await page.evaluate(() => localStorage.getItem('apollo-site-theme'))) !== 'system';
    i++
  )
    await page.locator('.site-theme-toggle').evaluate((n) => n.click());
  for (const colorScheme of ['light', 'dark', 'light']) {
    await page.emulateMedia({ colorScheme });
    await page.waitForFunction(
      (dark) => (document.documentElement.dataset.apolloTheme === 'dark') === dark,
      colorScheme === 'dark',
    );
    await identity();
  }
  consumerChecks.push({
    name: 'system preference changes update both source theme and the live page while preserving editors',
    passed: true,
  });
  if (process.env.DOCS_SKIP_COMPONENT_SMOKE !== '1') {
    const directory = 'packages/docs/.generated/docs';
    const pages = readdirSync(directory)
      .filter((n) => n.endsWith('.json'))
      .map((n) => JSON.parse(readFileSync(path.join(directory, n), 'utf8')));
    assert.equal(pages.length, 72);
    for (const data of pages)
      for (const theme of ['light', 'dark']) {
        const start = errors.length;
        const demo =
          data.demos.find((d) => d.name === 'basic') ??
          data.demos.find((d) => d.name === 'base') ??
          data.demos.find((d) => d.name === 'simple') ??
          data.demos[0];
        assert.ok(demo);
        try {
          await visit(data.name, demo.name, theme);
          const elements = await page
            .locator('.demo-renderer')
            .evaluate((n) => n.querySelectorAll('*').length);
          componentSmoke.push({
            component: data.name,
            demo: demo.name,
            theme,
            elements,
            passed: elements > 0 && errors.length === start,
          });
        } catch (e) {
          componentSmoke.push({
            component: data.name,
            demo: demo.name,
            theme,
            passed: false,
            error: e.message.split('\n')[0],
          });
        }
        console.log(
          `${componentSmoke.at(-1).passed ? 'PASS' : 'FAIL'} component ${data.name}/${theme}`,
        );
      }
  }
  const report = {
    base,
    browser: browser.version(),
    consumerChecks,
    componentSmoke,
    errors,
    networkDiagnostics,
    fallbackDocuments: [...fallbackDocuments],
  };
  writeFileSync(
    process.env.DOCS_THEME_EVIDENCE ?? '/tmp/apollo-docs-demo-theme.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.ok(consumerChecks.every((r) => r.passed));
  assert.ok(componentSmoke.every((r) => r.passed));
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
