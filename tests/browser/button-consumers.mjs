import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-button-consumers-'));
const results = [],
  errors = [];
const check = (name, actual, expected = true) => {
  let passed = true;
  try {
    assert.deepEqual(actual, expected);
  } catch {
    passed = false;
  }
  results.push({ name, actual, expected, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
};
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: [
        {
          find: /^\.\.\/\.\.\/index$/,
          replacement: path.resolve(root, '../../../packages/ui/dist/index.mjs'),
        },
      ],
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'button-consumers.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.route('https://user-images.githubusercontent.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300"><rect width="900" height="300" fill="lightgray"/></svg>',
    }),
  );
  await page.goto(`${server.resolvedUrls.local[0]}button-consumers.html`);
  await page.waitForFunction(() => Boolean(window.buttonConsumers));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  const main = page.locator('main');
  const stage = async (name) => {
    await page.evaluate((name) => window.buttonConsumers.show(name), name);
    check(
      `${name} original published demo rendered`,
      await main.getAttribute('data-consumer'),
      name,
    );
  };
  await stage('date');
  const date = main.locator('input').first();
  const prefix = (await date.inputValue()).slice(0, 7);
  await date.click();
  await page.locator(`.apollo-picker-dropdown [title="${prefix}-15"]`).last().click();
  await page.locator('.apollo-picker-ok .consumer-button').click();
  check('DatePicker Footer confirms selected date', await date.inputValue(), `${prefix}-15`);
  check(
    'DatePicker Footer updates committed value',
    (await main.textContent()).includes(`${prefix}-15`),
  );
  await stage('dropdown');
  await main.locator('.apollo-dropdown-button').nth(3).locator('button').last().click();
  const menuitem = page.getByRole('menuitem', { name: '1st menu item', exact: true });
  await menuitem.waitFor({ state: 'visible' });
  await menuitem.click();
  await menuitem.waitFor({ state: 'hidden' });
  check('DropdownButton menu action closes popup', await menuitem.isVisible(), false);
  await stage('arrow');
  const arrow = main.locator('.apollo-icon-down');
  check('DropdownButton owns complete custom icon', await arrow.count(), 1);
  check(
    'Dropdown arrow consumes icon font variable',
    await arrow.evaluate((n) => getComputedStyle(n).fontSize),
    '12px',
  );
  await stage('float');
  const floats = main.locator('.apollo-float-btn');
  check('all original FloatButton examples remain', await floats.count(), 3);
  const boxes = [];
  for (let i = 0; i < 3; i++) {
    const root = floats.nth(i);
    check(
      `FloatButton ${i} native string positioning`,
      await root.evaluate((n) => getComputedStyle(n).insetInlineEnd),
      ['164px', '94px', '24px'][i],
    );
    check(
      `FloatButton ${i} restored square appearance`,
      await root.evaluate((n) => getComputedStyle(n).borderRadius),
      '8px',
    );
    check(
      `FloatButton ${i} own body content`,
      await root.locator('.apollo-float-btn-content').count(),
      1,
    );
    boxes.push(await root.boundingBox());
  }
  check(
    'FloatButton content boxes do not overlap',
    boxes.every((box, i) => box && (!i || box.x >= boxes[i - 1].x + boxes[i - 1].width)),
  );
  await stage('search');
  const search = main.getByPlaceholder('输入关键词后搜索');
  await search.fill('Apollo');
  await search.press('Enter');
  const searchButton = main.locator('.apollo-input-search-btn');
  writeFileSync('/tmp/apollo-consumer-search-busy.html', await main.innerHTML());
  check(
    'Input.Search forwards loading to real Button',
    await searchButton.getAttribute('aria-busy'),
    'true',
  );
  check(
    'Input.Search owns semantic content',
    await searchButton.locator('.consumer-content').count(),
    1,
  );
  await search.press('Enter');
  await page.clock.fastForward(1300);
  check(
    'Input.Search completes once and preserves value',
    (await main.textContent()).includes('找到 3 条与「Apollo」相关的结果') &&
      (await search.inputValue()) === 'Apollo',
  );
  await stage('modal');
  const opener = main.getByRole('button', { name: 'Open Modal', exact: true });
  await opener.click();
  let dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  check(
    'Modal footer consumes current Button Provider',
    (await dialog.locator('.consumer-button').count()) >= 2,
  );
  await dialog.getByRole('button', { name: /^(OK|确定)$/ }).click();
  await dialog.waitFor({ state: 'hidden' });
  await opener.click();
  dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByRole('button', { name: /^(Cancel|取消)$/ }).click();
  await dialog.waitFor({ state: 'hidden' });
  check(
    'Modal repeated confirm/cancel restores opener focus',
    await opener.evaluate((n) => document.activeElement === n),
  );
  await stage('async');
  await main.getByRole('button', { name: 'Open modal with async logic' }).click();
  dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  const asyncOk = dialog.getByRole('button', { name: /^(OK|确定)$/ });
  await asyncOk.click();
  check(
    'shared ActionButton immediate busy state',
    await asyncOk.getAttribute('aria-busy'),
    'true',
  );
  await page.clock.fastForward(1200);
  await dialog.waitFor({ state: 'hidden' });
  check('shared ActionButton closes after fulfilled business promise', await dialog.count(), 0);
  await stage('popconfirm');
  await main.getByRole('button', { name: 'Open Popconfirm with async logic' }).click();
  const confirm = page.locator('.apollo-popconfirm:visible').first();
  await confirm.waitFor({ state: 'visible' });
  const confirmOk = confirm.getByRole('button', { name: /^(OK|确定)$/ });
  const confirmElement = await confirmOk.elementHandle();
  await confirmOk.click();
  writeFileSync('/tmp/apollo-consumer-popconfirm-busy.html', await confirm.innerHTML());
  check(
    'Popconfirm controlled loading reaches Button',
    await confirmElement.getAttribute('aria-busy'),
    'true',
  );
  await page.clock.fastForward(2100);
  await confirm.waitFor({ state: 'hidden' });
  check('Popconfirm async close completes', await confirm.isVisible(), false);
  await stage('qr');
  await main.getByRole('button', { name: 'Expired', exact: true }).click();
  const refresh = main.locator('.consumer-button').first();
  await refresh.click();
  check(
    'QRCode default refresh emits through native Button',
    await main.getByRole('status', { name: 'QR current status' }).textContent(),
    'loading',
  );
  await page.clock.fastForward(1100);
  await stage('table');
  await main.locator('.apollo-table-filter-trigger').first().click();
  const filter = page.locator('.apollo-table-filter-dropdown:visible').first();
  await filter.waitFor({ state: 'visible' });
  await filter.getByText('Joe', { exact: true }).click();
  await filter.getByRole('button', { name: /^(OK|确定)$/ }).click();
  check(
    'Table filter submit applies actual row data',
    await main.getByRole('cell', { name: 'Joe Black', exact: true }).count(),
    1,
  );
  check(
    'Table filter excludes other row',
    await main.getByRole('cell', { name: 'John Brown', exact: true }).count(),
    0,
  );
  await stage('tour');
  await main.getByRole('button', { name: 'Begin Tour', exact: true }).click();
  const tour = page.locator('.apollo-tour:visible').first();
  await tour.waitFor({ state: 'visible' });
  await tour.getByRole('button', { name: /^(Next|下一步)$/ }).click();
  check(
    'Tour next uses actual controlled panel',
    (await tour.textContent()).includes('Save your changes'),
  );
  await tour.getByRole('button', { name: /^(Previous|上一步)$/ }).click();
  check('Tour previous restores step', (await tour.textContent()).includes('Put your files here'));
  await tour.getByRole('button', { name: /^(Next|下一步)$/ }).click();
  await tour.getByRole('button', { name: /^(Next|下一步)$/ }).click();
  await tour.getByRole('button', { name: /^(Finish|结束引导|完成)$/ }).click();
  await tour.waitFor({ state: 'hidden' });
  check('Tour finish closes actual guide', await tour.isVisible(), false);
  await stage('transfer');
  const panes = main.locator('.apollo-transfer-section');
  writeFileSync('/tmp/apollo-consumer-transfer.html', await main.innerHTML());
  check(
    'Transfer original selected item starts in source',
    await panes.first().getByText('content2', { exact: true }).count(),
    1,
  );
  await main.locator('.consumer-button').first().click();
  check(
    'Transfer Actions move selected item into target',
    await panes.last().getByText('content2', { exact: true }).count(),
    1,
  );
  check(
    'Transfer source removes moved item',
    await panes.first().getByText('content2', { exact: true }).count(),
    0,
  );
  await stage('upload');
  const rows = main.locator('.apollo-upload-list-item');
  check('Upload original files rendered', await rows.count(), 3);
  await rows
    .first()
    .getByRole('button', { name: /remove|delete|删除/i })
    .click();
  check('UploadList native remove action updates files', await rows.count(), 2);
  await page.evaluate(() => new Promise((resolve) => queueMicrotask(resolve)));
  writeFileSync('/tmp/apollo-consumer-upload-after.html', await main.innerHTML());
  check('UploadList emits original file change', (await main.textContent()).includes('removed'));
  check('no page or Vue warnings', errors, []);
  writeFileSync(
    process.env.BUTTON_CONSUMER_EVIDENCE ?? '/tmp/apollo-button-consumers.json',
    `${JSON.stringify({ browser: browser.version(), results, errors, scope: '13 actual demo scenarios; external Tour cover image replaced by deterministic local SVG for navigation checks' }, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
