/** Verify delivered audit units through actual generated site pages and demos. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launchBrowser } from '../visual/stabilize.mjs';
import { checkAuditProgress } from './audit-progress-check.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4480/apollo-design-ui').replace(/\/$/, '');
const expectedStatus = Number(process.env.DOCS_DEMO_STATUS ?? 200);
const units = [
  { name: 'descriptions', count: 13, demos: ['basic', 'custom-label'] },
  { name: 'breadcrumb', count: 11, demos: ['native', 'overlay'] },
  { name: 'timeline', count: 15, demos: ['horizontal-debug', 'native-slots'] },
  { name: 'grid', count: 13, demos: ['responsive', 'playground'] },
  { name: 'space', count: 15, demos: ['compact', 'compact-button-vertical'] },
  { name: 'flex', count: 6, demos: ['gap', 'combination'] },
  { name: 'alert', count: 15, demos: ['smooth-closed', 'error-boundary'] },
  { name: 'layout', count: 11, demos: ['responsive', 'custom-trigger'] },
  { name: 'input', count: 24, demos: ['component-token', 'autosize-textarea', 'password', 'otp'] },
  { name: 'divider', count: 9, demos: ['with-text', 'component-token'] },
  { name: 'collapse', count: 9, demos: ['custom', 'component-token'] },
  { name: 'config-provider', count: 8, demos: ['theme', 'locale'] },
  { name: 'menu', demos: ['native-actions'] },
];
const results = [],
  errors = [],
  localeChecks = [],
  fallbackDocuments = new Set();
const { browser } = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    localStorage.setItem('apollo-site-theme', 'light');
    if (!localStorage.getItem('apollo-site-locale'))
      localStorage.setItem('apollo-site-locale', 'zh-CN');
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      expectedStatus === 404 &&
      response.status() === 404 &&
      response.request().isNavigationRequest() &&
      response.url().startsWith(`${base}/components/`) &&
      response.url().includes('/demo/')
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
  const check = async (name, run) => {
    try {
      await run();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    }
  };
  const visit = async (component, demo, theme = 'light') => {
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
  for (const unit of units) {
    if (unit.count)
      await check(`${unit.name}: API and all ${unit.count} demo cards`, async () => {
        const response = await page.goto(`${base}/components/${unit.name}`);
        assert.equal(response.status(), 200);
        await page.waitForFunction(
          ({ name, count }) =>
            document.querySelectorAll(`.demo-renderer[data-demo^="${name}-"]`).length === count,
          { name: unit.name, count: unit.count },
        );
        assert.ok((await page.locator('main table').count()) > 0);
        assert.equal(await page.locator('.demo-renderer-error').count(), 0);
      });
    for (const demo of unit.demos)
      for (const theme of ['light', 'dark'])
        await check(`${unit.name}/${demo}/${theme}`, async () => {
          await visit(unit.name, demo, theme);
          const body = page.locator('.standalone-body');
          assert.ok(await body.locator('[class*="apollo-"]').count());
          await page.addScriptTag({
            path: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
          });
          const violations = await body.evaluate(async (node) =>
            (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
              id,
              targets: nodes.map((item) => item.target),
            })),
          );
          assert.deepEqual(violations, []);
        });
  }
  await check('Menu native button executes once through container Enter', async () => {
    await visit('menu', 'native-actions');
    const item = page.getByRole('menuitem').filter({ hasText: 'Native button' });
    await item.focus();
    await item.press('Enter');
    assert.match(await page.getByRole('status').textContent(), /Actions: 1/);
  });
  await check('Descriptions label help is reachable by keyboard', async () => {
    await visit('descriptions', 'custom-label');
    await page.getByRole('button', { name: '产品说明', exact: true }).focus();
    await page.getByRole('tooltip', { name: '产品的展示名称', exact: true }).waitFor();
  });
  await check('Timeline slot reversal preserves the actual editor and draft', async () => {
    await visit('timeline', 'native-slots');
    const input = page.getByRole('textbox', { name: 'Note created', exact: true });
    await input.fill('Published site draft');
    const original = await input.elementHandle();
    await page.getByRole('button', { name: 'Reverse items', exact: true }).click();
    assert.equal(
      await input.evaluate(
        (node, before) => node === before && node.value === 'Published site draft',
        original,
      ),
      true,
    );
  });
  await check('Flex public medium preset and custom zero gap reach actual geometry', async () => {
    await visit('flex', 'gap');
    await page.getByRole('radio', { name: 'medium', exact: true }).check();
    const row = page.locator('.standalone-body .apollo-flex').last();
    assert.equal(await row.evaluate((node) => getComputedStyle(node).columnGap), '16px');
    await page.getByRole('radio', { name: 'customize', exact: true }).check();
    assert.equal(await row.evaluate((node) => getComputedStyle(node).columnGap), '0px');
    assert.equal(await row.getByRole('button').count(), 4);
  });
  await check('Alert closes after its real transition and can mount again', async () => {
    await visit('alert', 'smooth-closed');
    const body = page.locator('.standalone-body');
    await body.getByRole('button', { name: 'Close', exact: true }).click();
    await body.locator('.apollo-alert').waitFor({ state: 'detached' });
    await body.getByRole('button', { name: 'Show alert again', exact: true }).click();
    await body.locator('.apollo-alert').waitFor({ state: 'visible' });
    assert.equal(await body.getByRole('button', { name: 'Close', exact: true }).count(), 1);
  });
  await check(
    'Layout external Vue control updates collapsed state without replacing its sidebar',
    async () => {
      await visit('layout', 'custom-trigger');
      const body = page.locator('.standalone-body');
      const sidebar = body.locator('.apollo-layout-sider');
      const original = await sidebar.elementHandle();
      await body.getByRole('button', { name: 'Collapse navigation', exact: true }).click();
      assert.match(await sidebar.getAttribute('class'), /apollo-layout-sider-collapsed/);
      await body.getByRole('button', { name: 'Expand navigation', exact: true }).click();
      assert.doesNotMatch(await sidebar.getAttribute('class'), /apollo-layout-sider-collapsed/);
      assert.equal(await sidebar.evaluate((node, before) => node === before, original), true);
    },
  );
  await check(
    'Input current theme preserves the draft and ancestor typography remeasures autoSize',
    async () => {
      await visit('input', 'component-token');
      const input = page.getByRole('textbox', { name: '令牌示例输入框', exact: true });
      const original = await input.elementHandle();
      await input.fill('Published Input draft');
      await page.getByRole('button', { name: '紧凑主题', exact: true }).click();
      await page.waitForFunction(() => {
        const node = document.querySelector('input[aria-label="令牌示例输入框"]');
        return node && getComputedStyle(node).fontSize === '12px';
      });
      assert.equal(
        await input.evaluate(
          (node, before) => node === before && node.value === 'Published Input draft',
          original,
        ),
        true,
      );
      const textarea = page.getByRole('textbox', { name: '主题自适应文本域', exact: true });
      const before = await textarea.evaluate((node) => node.getBoundingClientRect().height);
      await page.getByRole('button', { name: '祖先样式切换', exact: true }).click();
      await page.waitForFunction((before) => {
        const node = document.querySelector('textarea[aria-label="主题自适应文本域"]');
        return (
          node &&
          node.getBoundingClientRect().height > before &&
          node.scrollHeight <= node.clientHeight + 1
        );
      }, before);
    },
  );
  await check('Divider native title control preserves its actual editor and draft', async () => {
    await visit('divider', 'with-text');
    const input = page.getByRole('textbox', { name: 'Divider title draft', exact: true });
    await input.fill('Published divider draft');
    const original = await input.elementHandle();
    await page.getByRole('checkbox', { name: 'Plain title', exact: true }).check();
    assert.equal(
      await input.evaluate(
        (node, before) => node === before && node.value === 'Published divider draft',
        original,
      ),
      true,
    );
    await page.getByRole('checkbox', { name: 'Show title', exact: true }).uncheck();
    assert.equal(await input.count(), 0);
    await page.getByRole('checkbox', { name: 'Show title', exact: true }).check();
    assert.equal(await input.inputValue(), 'Published divider draft');
  });
  await check(
    'Collapse extra actions are independent and retained panels keep the actual draft',
    async () => {
      await visit('collapse', 'custom');
      const body = page.locator('.standalone-body');
      const input = body.getByRole('textbox', { name: '部署备注', exact: true });
      await input.fill('Published deployment draft');
      const original = await input.elementHandle();
      await body.getByRole('button', { name: '发送通知', exact: true }).click();
      assert.match(await body.locator('[aria-live="polite"]').textContent(), /通知次数：1/);
      assert.equal(await input.isVisible(), true);
      const header = body.getByRole('button', { name: /生产环境部署/ });
      await header.click();
      await input.waitFor({ state: 'hidden' });
      await header.click();
      await input.waitFor({ state: 'visible' });
      assert.equal(
        await input.evaluate(
          (node, before) => node === before && node.value === 'Published deployment draft',
          original,
        ),
        true,
      );
    },
  );
  await check(
    'Input Password native toggle retains its real editor and business value',
    async () => {
      await visit('input', 'password');
      const input = page.getByPlaceholder('input password', { exact: true });
      await input.fill('PublishedPassword7');
      const original = await input.elementHandle();
      await page.locator('button.apollo-input-password-icon').click();
      assert.equal(await input.getAttribute('type'), 'text');
      assert.equal(
        await input.evaluate(
          (node, before) => node === before && node.value === 'PublishedPassword7',
          original,
        ),
        true,
      );
      await page.locator('button.apollo-input-password-icon').click();
      assert.equal(await input.getAttribute('type'), 'password');
    },
  );
  await check('Input OTP current Vue model follows all six native cells', async () => {
    await visit('input', 'otp');
    const body = page.locator('.standalone-body');
    const cells = body.locator('.apollo-otp').first().locator('input');
    assert.equal(await cells.count(), 6);
    for (let index = 0; index < 6; index++) await cells.nth(index).fill(String(index + 1));
    assert.match(await body.textContent(), /values:\s*123456\s*\//);
  });
  await check(
    'ConfigProvider Demo runtime theme updates preserve the actual editor and draft',
    async () => {
      await visit('config-provider', 'theme');
      const input = page.getByRole('textbox', { name: '主题切换时保留的草稿', exact: true });
      await input.fill('Published configuration draft');
      const original = await input.elementHandle();
      const font = await input.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
      await page.getByRole('button', { name: '运行时字体 +1', exact: true }).click();
      await page.waitForFunction(
        (before) =>
          parseFloat(
            getComputedStyle(document.querySelector('input[aria-label="主题切换时保留的草稿"]'))
              .fontSize,
          ) > before,
        font,
      );
      assert.equal(
        await input.evaluate(
          (node, before) => node === before && node.value === 'Published configuration draft',
          original,
        ),
        true,
      );
    },
  );
  for (const locale of ['zh-CN', 'en-US'])
    await check(`progress/${locale}`, async () => {
      localeChecks.push(...(await checkAuditProgress(page, base, [locale])));
    });
  assert.deepEqual(errors, []);
  assert.ok(
    results.every((result) => result.passed),
    JSON.stringify(results.filter((r) => !r.passed)),
  );
} finally {
  writeFileSync(
    process.env.AUDIT_DOCS_EVIDENCE ?? '/tmp/apollo-five-docs-browser.json',
    `${JSON.stringify(
      {
        base,
        expectedDemoStatus: expectedStatus,
        localeChecks,
        results,
        errors,
        fallbackDocuments: [...fallbackDocuments],
      },
      null,
      2,
    )}\n`,
  );
  await browser.close();
}
