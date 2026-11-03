/** Issue #86: real interactions in the data-display demos, including replaced Apollo controls. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const evidence = process.env.DOCS_EVIDENCE_DIR ?? '/tmp/apollo-docs-issue86-data';
fs.mkdirSync(evidence, { recursive: true });
const { browser } = await launchBrowser();
const context = await browser.newContext({
  viewport: { width: 1280, height: 960 },
  locale: 'zh-CN',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const results = [];
const errors = [];
page.on('pageerror', (error) => errors.push({ url: page.url(), message: error.message }));
page.on('console', (message) => {
  if (message.type() === 'error' || /hydration/i.test(message.text()))
    errors.push({ url: page.url(), message: message.text() });
});

async function go(component, demo, preset = 'default', theme = 'light') {
  const query = new URLSearchParams({ lang: 'zh-CN', preset, theme });
  await page.goto(`${base}/components/${component}/demo/${demo}?${query}`, {
    waitUntil: 'networkidle',
  });
  await page.locator('.demo-renderer').waitFor();
  await page.locator('.demo-renderer-loading').waitFor({ state: 'detached' });
  assert.equal(
    await page.locator('.demo-renderer-error').count(),
    0,
    `${component}/${demo} renders`,
  );
}

async function run(name, action) {
  try {
    await action();
    results.push({ name, status: 'passed' });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: 'failed', message: error.message });
    console.error(`FAIL ${name}: ${error.stack}`);
  }
}

try {
  await run(
    'Custom add trigger adds a tab, selects it and returns to its neighbor on removal',
    async () => {
      await go('tabs', 'custom-add-trigger');
      assert.equal(await page.getByRole('tab').count(), 2);
      await page.locator('.apollo-tabs-nav-add:visible').click();
      assert.equal(await page.getByRole('tab').count(), 3);
      assert.match(
        await page.locator('[role="tab"][aria-selected="true"]').getAttribute('id'),
        /-tab-3$/,
      );
      await page.locator('[data-node-key="3"] .apollo-tabs-tab-remove').click();
      assert.equal(await page.getByRole('tab').count(), 2);
      assert.match(
        await page.locator('[role="tab"][aria-selected="true"]').getAttribute('id'),
        /-tab-2$/,
      );
    },
  );

  await run('Editable-card keeps keys unique through repeated removal and addition', async () => {
    await go('tabs', 'editable-card');
    const tabs = page.locator('.apollo-tabs').first();
    await tabs.locator('[data-node-key="1"] .apollo-tabs-tab-remove').click();
    await tabs.locator('.apollo-tabs-nav-add:visible').click();
    assert.deepEqual(
      await tabs
        .locator('[data-node-key]')
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.nodeKey)),
      ['2', '3'],
    );
    await tabs.locator('[data-node-key="2"] .apollo-tabs-tab-remove').click();
    await tabs.locator('.apollo-tabs-nav-add:visible').click();
    assert.deepEqual(
      await tabs
        .locator('[data-node-key]')
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.nodeKey)),
      ['3', '4'],
    );
    assert.match(
      await tabs.locator('[role="tab"][aria-selected="true"]').getAttribute('id'),
      /-tab-4$/,
    );
  });

  for (const demo of ['custom-tab-bar', 'custom-tab-bar-node']) {
    await run(`${demo} supports ArrowRight, Home and End with panel associations`, async () => {
      await go('tabs', demo);
      const tabs = page.getByRole('tab');
      await tabs.first().focus();
      await page.keyboard.press('End');
      const last = tabs.last();
      assert.equal(await last.getAttribute('aria-selected'), 'true');
      assert.equal(await last.evaluate((node) => node === document.activeElement), true);
      const panelId = await last.getAttribute('aria-controls');
      assert.equal(await page.locator(`[role="tabpanel"][id="${panelId}"]`).isVisible(), true);
      await page.keyboard.press('Home');
      assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
      await page.keyboard.press('ArrowRight');
      assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
    });
  }

  await run('Custom Table filter applies Enter and Reset to the displayed rows', async () => {
    await go('table', 'custom-filter-panel');
    await page.locator('.apollo-table-filter-trigger').click();
    await page.getByPlaceholder('Search name').fill('John');
    await page.getByPlaceholder('Search name').press('Enter');
    const rows = page.locator('.apollo-table-tbody > tr[data-row-key]');
    await rows.first().waitFor();
    assert.equal(await rows.count(), 1);
    assert.match(await rows.first().innerText(), /John Brown/);
    await page.locator('.apollo-table-filter-trigger').click();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    assert.equal(await rows.count(), 3);
  });

  await run('Custom select-all labels accept the transferred data', async () => {
    await go('transfer', 'custom-select-all-labels');
    const target = page.locator('.apollo-transfer-section').nth(1);
    assert.equal(await target.locator('.apollo-transfer-list-content-item').count(), 2);
    await page.getByRole('checkbox', { name: 'content1', exact: true }).check();
    await page.locator('.apollo-transfer-actions > button').first().click();
    assert.equal(await target.locator('.apollo-transfer-list-content-item').count(), 3);
    assert.match(await target.innerText(), /content1/);
  });

  await run('Narrow dark Table keeps row selection and Delete reachable by keyboard', async () => {
    await page.setViewportSize({ width: 390, height: 960 });
    await go('table', 'row-selection-and-operation', 'default', 'dark');
    const row = page.locator('.apollo-table-tbody > tr[data-row-key="1"]');
    await row.getByRole('checkbox').check();
    assert.match(await page.locator('.demo-renderer').innerText(), /已选择 1 项/);
    const remove = row.getByRole('button', { name: 'Delete', exact: true });
    await remove.focus();
    assert.equal(await remove.evaluate((node) => node === document.activeElement), true);
    const viewport = await page.locator('.apollo-table-content').boundingBox();
    const button = await remove.boundingBox();
    assert.ok(viewport && button);
    assert.ok(button.x >= viewport.x && button.x + button.width <= viewport.x + viewport.width + 1);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: path.join(evidence, 'issue86-table-selection-dark-390.png') });
    await page.keyboard.press('Enter');
    assert.equal(await row.count(), 0);
    assert.match(await page.locator('.demo-renderer').innerText(), /未选择/);
  });

  assert.deepEqual(errors, [], 'No runtime, hydration or console errors');
} finally {
  fs.writeFileSync(
    path.join(evidence, 'issue86-data-results.json'),
    JSON.stringify({ base, results, errors }, null, 2),
  );
  await browser.close();
}
assert.equal(
  results.filter((result) => result.status === 'failed').length,
  0,
  'All Issue #86 data-demo regressions must pass',
);
console.log(`PASS ${results.length} data-demo browser regressions`);
