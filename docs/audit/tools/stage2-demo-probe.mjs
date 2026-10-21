/**
 * 阶段 2 · 功能性 Demo 浏览器验收（只读，不改产物）。
 *
 * 前置：`pnpm build:ui` + `pnpm build:docs` 后启动生产预览：
 *   pnpm --filter @apollo-design/docs exec vite preview --host 127.0.0.1 --port 4477
 * 运行：
 *   node docs/audit/tools/stage2-demo-probe.mjs
 * 输出：docs/audit/evidence/stage2-demo.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const OUT = path.resolve('docs/audit/evidence/stage2-demo.json');
const report = {};
const failures = [];
function check(condition, label, detail = '') {
  console.log(`${condition ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures.push(label);
}
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') console.error('[browser.error]', msg.text());
});

async function standalone(component, demo) {
  await page.goto(`${BASE}/components/${component}/demo/${demo}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('.standalone-body .demo-renderer');
  await page.waitForTimeout(400);
}

try {
  // ── Upload：基础按钮必须是库 Button；本地 mock 能走到完成态 ──────────────
  await standalone('upload', 'basic');
  const uploadButton = page.locator('.apollo-upload-select .apollo-btn').first();
  const listBefore = await page.locator('.apollo-upload-list-item-done').count();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'probe.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
  await page.waitForTimeout(1200);
  report['upload.basic'] = {
    usesLibraryButton: await uploadButton.count(),
    rawButtonCount: await page.locator('.demo-upload-btn').count(),
    listBefore,
    doneAfter: await page.locator('.apollo-upload-list-item-done').count(),
    names: await page.locator('.apollo-upload-list-item-name').allTextContents(),
  };
  await page.screenshot({ path: 'docs/audit/evidence/stage2-upload-basic.png' });

  // ── DatePicker：disabled-date 的面板有禁用格；关闭有离场 ────────────────
  await standalone('date-picker', 'disabled-date');
  await page.locator('.apollo-picker input').first().click();
  await page.waitForSelector('.apollo-picker-dropdown', { timeout: 5000 });
  await page.waitForTimeout(250);
  report['date-picker.disabled-date'] = {
    dropdownVisible: await page.locator('.apollo-picker-dropdown').first().isVisible(),
    disabledCells: await page.locator('.apollo-picker-cell-disabled').count(),
  };
  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  report['date-picker.disabled-date'].afterClose = {
    hiddenClass: await page.locator('.apollo-picker-dropdown-hidden').count(),
  };
  await page.screenshot({ path: 'docs/audit/evidence/stage2-date-picker.png' });

  // ── Form：动态列表可增删 + 提交有可见反馈 ───────────────────────────────
  await standalone('form', 'form-list');
  const rowsBefore = await page.locator('.demo-list-row').count();
  await page.getByRole('button', { name: /Add field/ }).click();
  await page.waitForTimeout(200);
  const rowsAfterAdd = await page.locator('.demo-list-row').count();
  const removeButtons = page.getByRole('button', { name: '删除该行' });
  await removeButtons.last().click();
  await page.waitForTimeout(200);
  const rowsAfterRemove = await page.locator('.demo-list-row').count();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(300);
  report['form.form-list'] = {
    rowsBefore,
    rowsAfterAdd,
    rowsAfterRemove,
    message: (await page.locator('.apollo-message').allTextContents()).join(' | '),
  };

  // ── Form：异步校验失败在页面上可见 ──────────────────────────────────────
  await standalone('form', 'async-validation');
  const username = page.locator('input').first();
  await username.fill('admin');
  await username.blur();
  await page.waitForTimeout(1000);
  report['form.async-validation'] = {
    errorText: await page.locator('.apollo-form-item-explain-error').allTextContents(),
    hasErrorClass: await page.locator('.apollo-form-item-has-error').count(),
  };
  await page.screenshot({ path: 'docs/audit/evidence/stage2-form.png' });

  // ── Stage 3：viewport 画布 + 新窗口 BASE_URL ────────────────────────────
  await page.goto(`${BASE}/components/float-button`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.demo-viewport iframe', { timeout: 15000 });
  const viewportFrame = page.locator('.demo-viewport iframe').first();
  // iframe 是 loading="lazy"：先滚进视口，再等内部示例真正渲染。
  await viewportFrame.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const frameBox = await viewportFrame.boundingBox();
  const standaloneHref = await page
    .locator('.demo-toolbar a[target="_blank"]')
    .first()
    .getAttribute('href');
  const floats = await viewportFrame.contentFrame().locator('.apollo-float-btn').count();
  report['float-button.viewport'] = {
    viewportCount: await page.locator('.demo-viewport').count(),
    frameHeight: frameBox ? Math.round(frameBox.height) : null,
    floats,
    standaloneHref,
  };
  check(report['float-button.viewport'].viewportCount >= 1, 'FloatButton 使用 viewport 画布');
  check(report['float-button.viewport'].frameHeight === 320, 'viewport 画布高度 = 320');
  check(floats >= 1, 'fixed 按钮渲染在 iframe 视口内');
  const expectedPrefix = new URL(BASE).pathname.replace(/\/$/, '');
  check(
    Boolean(standaloneHref?.startsWith(`${expectedPrefix}/components/`)),
    '新窗口链接带 BASE_URL',
    standaloneHref ?? '',
  );

  // ── Stage 3：站点语言 → Demo 组件 locale（I18N-01）────────────────────
  await page.goto(`${BASE}/components/date-picker?lang=en-US`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.demo-canvas .apollo-picker input');
  await page.locator('.demo-canvas .apollo-picker input').first().click();
  await page.waitForTimeout(500);
  const localeState = await page.evaluate(() => ({
    nav: document.querySelector('.site-topbar-nav')?.textContent?.trim() ?? '',
    panel: document.querySelector('.apollo-picker-dropdown')?.textContent ?? '',
  }));
  report['i18n.date-picker'] = {
    navEnglish: localeState.nav.includes('Components'),
    panelEnglish: localeState.panel.includes('Today') && !localeState.panel.includes('今天'),
  };
  check(report['i18n.date-picker'].navEnglish, '英文站点导航已切换');
  check(report['i18n.date-picker'].panelEnglish, 'DatePicker 面板文案随站点语言切换');

  // ── 结果断言（CI 与本地共用）────────────────────────────────────────────
  check(report['upload.basic'].usesLibraryButton >= 1, 'Upload basic 使用库 Button');
  check(report['upload.basic'].rawButtonCount === 0, 'Upload basic 无裸 button');
  check(
    report['upload.basic'].doneAfter > report['upload.basic'].listBefore,
    'Upload 本地 mock 走到 done 态',
  );
  check(report['date-picker.disabled-date'].disabledCells > 0, 'disabledDate 面板有禁用格');
  check(
    report['date-picker.disabled-date'].afterClose.hiddenClass >= 1,
    'DatePicker 关闭后进入 hidden',
  );
  check(report['form.form-list'].rowsBefore === 1, 'Form.List 初始行渲染');
  check(
    report['form.form-list'].rowsAfterAdd === 2 && report['form.form-list'].rowsAfterRemove === 1,
    'Form.List 增删生效',
  );
  check(report['form.form-list'].message.includes('提交成功'), 'Form 提交有可见反馈');
  check(
    report['form.async-validation'].errorText.some((text) => text.includes('已被占用')),
    '异步校验失败可见',
  );
} finally {
  await browser.close();
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(`✅ 阶段 2 探针完成：${OUT}`);
if (failures.length > 0) {
  console.error(`❌ ${failures.length} 项失败：${failures.join('、')}`);
  process.exitCode = 1;
} else {
  console.log('✅ 全部功能断言通过');
}
