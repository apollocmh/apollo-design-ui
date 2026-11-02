/**
 * 文档站浏览器冒烟验证（生产 preview 服务器）。
 * 区分三层结论：加载成功 / 交互通过 / 视觉截图。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const BASE = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const SHOT_DIR = path.join(os.tmpdir(), 'docs-shots');
fs.mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const { browser } = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);

try {
  // ── 1. 首页加载 ──────────────────────────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('首页标题', (await page.title()).includes('Apollo Design'), await page.title());
  check('首页 hero', await page.locator('.home-title').isVisible());
  await page.screenshot({ path: `${SHOT_DIR}/home.png` });

  // ── 2. 组件页：SSR 正文 + demo 真实渲染 ─────────────────────────────
  // SSR 断言仍取自 HTTP 原响应；后续 DOM 操作等客户端首次接管完成。
  const btnRes = await page.goto(`${BASE}/components/button`, { waitUntil: 'networkidle' });
  const ssrHtml = await btnRes.text();
  check('组件标题 SSR', /<h1[^>]*>[\s\S]{0,80}Button/.test(ssrHtml));
  check('正文 SSR（何时使用锚点）', ssrHtml.includes('id="何时使用"'));
  check('源码高亮 SSR（shiki）', ssrHtml.includes('shiki'));
  // 客户端水合后仍可见
  await page.waitForSelector('h1.component-title', { state: 'visible', timeout: 10000 });
  check('组件标题可见', await page.locator('h1.component-title:has-text("Button")').isVisible());

  // 等第一个 demo 真实渲染出组件库按钮
  await page.waitForSelector('.demo-canvas .apollo-btn', { timeout: 15000 });
  const btnCount = await page.locator('.demo-canvas .apollo-btn').count();
  check('demo 真实渲染（apollo-btn）', btnCount > 0, `${btnCount} 个按钮`);

  // 展开/收起源码
  const firstToggle = page.locator('.demo-tool-btn', { hasText: '展开代码' }).first();
  await firstToggle.click();
  await page.waitForSelector('.demo-source-code pre', { timeout: 5000 });
  const srcText = await page.locator('.demo-source-code').first().innerText();
  check(
    '源码展示（import 已改写）',
    srcText.includes('@apollo-design/ui') && !srcText.includes('../../index'),
    srcText.split('\n')[1]?.trim() ?? '',
  );
  await page.screenshot({ path: `${SHOT_DIR}/button-demo-expanded.png` });

  // 复制
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('.demo-tool-btn', { hasText: '复制代码' }).first().click();
  await page.waitForTimeout(300);
  check('复制反馈', (await page.locator('.demo-toolbar').first().innerText()).includes('复制成功'));

  // 重置：resetToken 重建（按钮仍渲染 ⇒ 状态未破坏）
  await page.locator('.demo-tool-btn', { hasText: '重置示例' }).first().click();
  await page.waitForTimeout(600);
  check('重置后 demo 仍渲染', (await page.locator('.demo-canvas .apollo-btn').count()) > 0);

  // 侧栏 & TOC
  check('分类侧栏', await page.locator('.site-side-link.active:has-text("Button")').isVisible());
  check('本页目录', (await page.locator('.site-toc-link').count()) > 3);

  // ── 2b. Input.Search / InputOTP demo 真实渲染 ────────────────────────
  await page.goto(`${BASE}/components/input`, { waitUntil: 'networkidle' });
  // 示例在靠近视口时才挂载；先滚动实际卡片，不能等待尚未激活的远处内容。
  const searchDemo = page.locator('#demo-search');
  await searchDemo.scrollIntoViewIfNeeded();
  await searchDemo.locator('.apollo-input-search').first().waitFor({
    state: 'visible',
    timeout: 15000,
  });
  check('Search demo 渲染', (await searchDemo.locator('.apollo-input-search').count()) > 0);
  await searchDemo.getByRole('searchbox').first().fill('keyboard smoke');
  await searchDemo.getByRole('searchbox').first().press('Enter');
  await searchDemo.getByText('last search: keyboard smoke', { exact: true }).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  check(
    'Search 原生 Enter 搜索回填',
    (await searchDemo.innerText()).includes('last search: keyboard smoke'),
  );
  const buttonSearch = searchDemo.locator('.apollo-input-search').nth(2);
  await buttonSearch.getByRole('searchbox').fill('button smoke');
  await buttonSearch.getByRole('button', { name: 'Search', exact: true }).click();
  await searchDemo.getByText('last search: button smoke', { exact: true }).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  check(
    'Search 原生按钮搜索回填',
    (await searchDemo.innerText()).includes('last search: button smoke'),
  );

  const otpDemo = page.locator('#demo-otp');
  await otpDemo.scrollIntoViewIfNeeded();
  await otpDemo.locator('.apollo-otp').first().waitFor({ state: 'visible', timeout: 15000 });
  check('OTP demo 渲染', (await otpDemo.locator('.apollo-otp').count()) > 0);
  await otpDemo
    .locator('.apollo-otp')
    .first()
    .getByRole('textbox')
    .first()
    .pressSequentially('123456');
  await otpDemo.getByText('values: 123456 / -', { exact: true }).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  check('OTP 原生顺序输入回填', (await otpDemo.innerText()).includes('values: 123456 / -'));

  // ── 3. 语言切换 ─────────────────────────────────────────────────────
  // 回到 Button 页：语言断言依赖「When To Use / 何时使用」这组标题，
  // Input 文档没有该小节（上面的 2b 会改当前路由）。
  await page.goto(`${BASE}/components/button`, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1.component-title', { state: 'visible', timeout: 10000 });
  await page.locator('.site-lang-toggle').click();
  // 文档正文由异步 chunk + 响应式 langKey 驱动，固定 sleep 在慢机器上会假失败。
  await page
    .waitForFunction(() => document.body.innerText.includes('When To Use'), null, {
      timeout: 10000,
    })
    .catch(() => {});
  check('英文文档', (await page.content()).includes('When To Use'));
  check(
    '英文导航',
    await page.locator('.site-topbar-nav a:has-text("Components")').first().isVisible(),
  );
  await page.locator('.site-lang-toggle').click();
  await page
    .waitForFunction(() => document.body.innerText.includes('何时使用'), null, { timeout: 10000 })
    .catch(() => {});
  check('切回中文文档', (await page.content()).includes('何时使用'));

  // ── 4. 主题切换 ─────────────────────────────────────────────────────
  // 主题面板提供独立风格与明暗选择，使用真实原生 select。
  const themeBtn = page.locator('.site-theme-toggle');
  const themeAttr = () => page.evaluate(() => document.documentElement.dataset.apolloTheme);
  await themeBtn.click();
  await page.locator('.site-mode-select').selectOption('dark');
  const reachedDark = (await themeAttr()) === 'dark';
  check('可切到暗色', reachedDark, String(await themeAttr()));
  await page.screenshot({ path: `${SHOT_DIR}/button-dark.png` });
  await page.locator('.site-mode-select').selectOption('light');
  const reachedLight = (await themeAttr()) === 'light';
  check('可切回亮色', reachedLight, String(await themeAttr()));
  await page.locator('.site-mode-select').press('Escape');

  // ── 5. 搜索 ─────────────────────────────────────────────────────────
  await page.keyboard.press('/');
  await page.waitForSelector('.site-search-input', { timeout: 5000 });
  await page.keyboard.type('table');
  // 索引是懒加载的：等结果真正出现（最多 10s），而不是固定 sleep
  await page.waitForSelector('.site-search-item', { timeout: 10000 });
  const groupCount = await page.locator('.site-search-group').count();
  check('搜索结果分组', groupCount > 0, `${groupCount} 组`);
  check('搜索高亮首项', await page.locator('.site-search-item.active').first().isVisible());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  check('搜索跳转', page.url().includes('/components/table'), page.url());
  await page
    .waitForSelector('.demo-canvas .apollo-table, .demo-canvas .apollo-form', { timeout: 15000 })
    .catch(() => {});
  check('table 页 demo 渲染', (await page.locator('.demo-canvas > *').count()) > 0);

  // ── 6. 指南 & 总览 & 404 ────────────────────────────────────────────
  await page.goto(`${BASE}/components`, { waitUntil: 'networkidle' });
  check(
    '组件总览卡片（72 组件 + 图标资源）',
    (await page.locator('.overview-card').count()) === 73,
    `${await page.locator('.overview-card').count()}`,
  );
  check(
    '总览含图标入口',
    await page.locator('a.overview-card[href*="/components/icon"]').first().isVisible(),
  );
  await page.goto(`${BASE}/guide/compatibility`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  check(
    '兼容性指南（真源注入）',
    (await page.content()).includes('COMPATIBILITY') ||
      (await page.locator('.doc-markdown').innerText()).length > 500,
  );
  await page.goto(`${BASE}/no-such-page`, { waitUntil: 'networkidle' });
  // 静态 404.html 回退后的客户端路由仍需给出可见的 404 页面。
  await page
    .waitForSelector('.notfound-code', { state: 'visible', timeout: 10000 })
    .catch(() => {});
  check('404 页', await page.locator('.notfound-code:has-text("404")').isVisible());

  // ── 7. 独立示例页（新窗口打开的目标） ────────────────────────────────
  await page.goto(`${BASE}/components/button/demo/basic`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.apollo-btn', { timeout: 15000 });
  check('独立示例页渲染', (await page.locator('.apollo-btn').count()) > 0);
  await page.screenshot({ path: `${SHOT_DIR}/standalone-demo.png` });

  // ── 7b. 独立图标目录（资源页，不是第 73 个组件） ─────────────────────
  await page.goto(`${BASE}/components/icon`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.icon-tile', { timeout: 15000 });
  const iconCount = await page.locator('.icon-tile').count();
  const grid = page.locator('.virtual-icon-grid');
  const rows = Number(await grid.getAttribute('aria-rowcount'));
  const columns = Number(await grid.getAttribute('aria-colcount'));
  check(
    '图标目录渲染（全量范围 + 窗口虚拟化）',
    iconCount > 0 && iconCount < 150 && rows === Math.ceil(848 / columns),
    `${iconCount} 个已挂载瓦片 / ${rows} 行 × ${columns} 列`,
  );
  const catalogBox = await grid.boundingBox();
  if (!catalogBox) throw new Error('图标虚拟目录没有布局尺寸');
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: 'instant' }),
    catalogBox.y + catalogBox.height - 500,
  );
  await page.waitForSelector('.icon-tile[title="ZoomOutOutlined"]');
  check('完整目录末项可达', await page.locator('.icon-tile[title="ZoomOutOutlined"]').isVisible());
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const countText = await page.locator('.icon-count').innerText();
  check('图标总数（848）', countText.includes('848'), countText.trim());

  // 搜索框已换成组件库 Input（根节点就是原生 input）
  await page.locator('.icon-search').fill('search');
  await page.waitForTimeout(300);
  const filteredCount = await page.locator('.icon-tile').count();
  check('图标搜索过滤', filteredCount > 0 && filteredCount < iconCount, `${filteredCount}`);
  await page.locator('.icon-search').fill('');
  await page.waitForTimeout(300);

  await page
    .locator('.icon-style-tabs')
    .getByRole('button', { name: /双色风格|TwoTone/ })
    .click();
  await page.waitForTimeout(300);
  const twoToneCountText = await page.locator('.icon-count').innerText();
  // 虚拟挂载数取决于窗口尺寸；计数文本应始终反映所选风格的完整目录。
  check('图标风格筛选', twoToneCountText.includes('150'), twoToneCountText.trim());
  check(
    '风格 tab 激活',
    /双色风格|TwoTone/.test(await page.locator('.icon-style-tab.active').innerText()),
  );
  await page.locator('.icon-style-tab:has-text("全部")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOT_DIR}/icon-catalog.png` });

  // ── 8. 移动端 ────────────────────────────────────────────────────────
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/components/button`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  check('移动端抽屉按钮', await page.locator('.site-mobile-toggle').isVisible());
  await page.locator('.site-mobile-toggle').click();
  await page.waitForTimeout(300);
  check('移动端抽屉展开', await page.locator('.site-drawer').isVisible());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check('移动端抽屉 Esc 关闭', !(await page.locator('.site-drawer').isVisible()));
  await page.screenshot({ path: `${SHOT_DIR}/mobile.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  // 页面壳拥有唯一主标题；正文去重不能吞掉简介、示例、API 或其目录锚点。
  for (const lang of ['zh-CN', 'en-US']) {
    await page.goto(`${BASE}/components/skeleton?lang=${lang}`, { waitUntil: 'networkidle' });
    const intro = lang === 'zh-CN' ? '按预期结构显示加载占位' : 'Display a placeholder';
    const bodyIntro = page.locator('.component-page > .doc-markdown').first();
    await bodyIntro.getByText(intro, { exact: false }).waitFor();
    for (const mode of ['light', 'dark']) {
      const picker = page.locator('.site-theme-picker');
      if (!(await picker.evaluate((node) => node.open)))
        await page.locator('.site-theme-toggle').click();
      await page.locator('.site-mode-select').selectOption(mode);
      await page.locator('.site-theme-toggle').click();
      for (const columns of [2, 1]) {
        const label =
          lang === 'zh-CN'
            ? columns === 2
              ? '自动布局'
              : '单列'
            : columns === 2
              ? 'Auto layout'
              : 'Single column';
        await page.locator('.demos-toolbar').getByText(label, { exact: true }).click();
        const grid = page.locator('.demos-grid');
        const headings = await page.locator('.component-page h1').allTextContents();
        const actualColumns = await grid.evaluate(
          (node) => getComputedStyle(node).gridTemplateColumns.split(' ').length,
        );
        check(
          `Skeleton 标题/正文/API ${lang}/${mode}/${columns}列`,
          headings.length === 1 &&
            headings[0].includes('Skeleton') &&
            (await bodyIntro.innerText()).includes(intro) &&
            (await grid.locator(':scope > *').count()) === 9 &&
            (await page.locator('.component-page h2#api').count()) === 1 &&
            (await page.locator('.site-toc-link[href="#api"]').count()) === 1 &&
            actualColumns === columns &&
            (await page.locator('html').getAttribute('data-apollo-theme')) === mode,
          `h1=${headings.length}, columns=${actualColumns}`,
        );
        if (
          (lang === 'zh-CN' && mode === 'dark' && columns === 2) ||
          (lang === 'en-US' && mode === 'light' && columns === 1)
        )
          await page.screenshot({ path: `${SHOT_DIR}/skeleton-${lang}-${mode}-${columns}.png` });
      }
    }
  }
} catch (e) {
  check('意外中断', false, e.message);
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n—— 浏览器冒烟：${results.length - failed.length}/${results.length} 通过 ——`);
process.exit(failed.length > 0 ? 1 : 0);
