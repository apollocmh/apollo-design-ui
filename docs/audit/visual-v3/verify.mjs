/**
 * V3 Phase 4 浏览器门禁（PR 阻塞用，不依赖截图基线）。
 *
 * 判据（全部来自报告 §6 的可量化门槛）：
 * 1. shell 利用率：1920 组件内容 ≥1300、2560 ≥1900；正文实际行长 ≤960。
 * 2. 稳定顺序：Button 页展开首个源码后，所有卡片 x 坐标不变。
 * 3. 宽内容：Form/Table 首卡宽度 ≥ 内容栏 90%（full 档）。
 * 4. 自举：顶栏 / Demo 工具栏是 Apollo Button；模式切换是 Segmented。
 * 5. Token：:root 的 --site-brand 是 --apollo-color-primary 的别名，不是硬编码色。
 * 6. 响应式：390 无横向溢出；顶栏 GitHub 入口隐藏。
 * 7. 暗色：页面背景不是白色，卡片表面来自暗色 token。
 *
 * 运行（preview 已启动）：
 *   DOCS_URL=http://127.0.0.1:4477/apollo-design-ui node docs/audit/visual-v3/verify.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const url = (path, lang = true) =>
  `${BASE}${path}${lang ? `${path.includes('?') ? '&' : '?'}lang=en-US` : ''}`;

async function newContext(browser, width, { dark = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width >= 1920 ? 1080 : width === 390 ? 844 : 900 },
    locale: 'en-US',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  await context.addInitScript(
    (theme) => {
      localStorage.setItem('apollo-site-locale', 'en-US');
      localStorage.setItem('apollo-site-theme', theme);
    },
    dark ? 'dark' : 'light',
  );
  return context;
}

async function open(page, path) {
  await page.goto(url(path), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);
}

const measure = (page) =>
  page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const cards = [...document.querySelectorAll('.demo-preview')];
    const columns = new Map();
    for (const card of cards) {
      const y = Math.round(card.getBoundingClientRect().y);
      columns.set(y, (columns.get(y) ?? 0) + 1);
    }
    const firstRow = Math.max(0, ...columns.values());
    const firstP = document.querySelector('.doc-markdown > p');
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      content: box('.site-content'),
      proseText: firstP ? firstP.getBoundingClientRect().width : null,
      firstCard: cards[0] ? box('.demo-preview') : null,
      columns: firstRow,
      cardXs: cards.map((c) => Math.round(c.getBoundingClientRect().x)),
      toolbarApollo: document.querySelectorAll('.demo-toolbar .apollo-btn').length,
      toolbarNative: document.querySelectorAll('.demo-toolbar button:not(.apollo-btn)').length,
      segmented: document.querySelectorAll('.demos-toolbar .apollo-segmented').length,
      headerApollo: document.querySelectorAll('.site-topbar .apollo-btn').length,
      githubDisplay: (() => {
        const el = document.querySelector('.site-github-link');
        return el ? getComputedStyle(el).display : 'missing';
      })(),
      siteBrand: (() => {
        for (const sheet of document.styleSheets) {
          let rules;
          try {
            rules = sheet.cssRules;
          } catch {
            continue;
          }
          for (const rule of rules) {
            if (rule.selectorText === ':root') {
              const value = rule.style.getPropertyValue('--site-brand')?.trim();
              if (value) return value;
            }
          }
        }
        return null;
      })(),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      colorPrimary: getComputedStyle(document.documentElement)
        .getPropertyValue('--apollo-color-primary')
        .trim(),
    };
  });

const main = async () => {
  const browser = await chromium.launch();
  try {
    // ── 1440：稳定 Grid + 自举 + Token ────────────────────────────────
    {
      const ctx = await newContext(browser, 1440);
      const page = await ctx.newPage();
      await open(page, '/components/button');
      await page.waitForSelector('.demo-preview', { timeout: 30000 });
      const before = await measure(page);
      check('Button 桌面双列', before.columns === 2, `columns=${before.columns}`);
      check(
        '工具栏全部为 Apollo Button',
        before.toolbarApollo > 0 && before.toolbarNative === 0,
        `apollo=${before.toolbarApollo}, native=${before.toolbarNative}`,
      );
      check('模式切换为 Segmented', before.segmented === 1, `count=${before.segmented}`);
      check('顶栏控件为 Apollo Button', before.headerApollo >= 4, `count=${before.headerApollo}`);
      check(
        'Token：--site-brand 指向 --apollo-color-primary',
        before.siteBrand?.includes('var(--apollo-color-primary)') === true,
        `value=${before.siteBrand}`,
      );
      check(
        '正文行长 ≤ 960',
        before.proseText !== null && before.proseText <= 961,
        `width=${before.proseText}`,
      );

      await page.locator('.demo-preview').first().locator('.demo-tool-btn').first().click();
      await page.waitForTimeout(400);
      const after = await measure(page);
      check(
        '展开源码不换列（卡片 x 坐标全等）',
        JSON.stringify(before.cardXs) === JSON.stringify(after.cardXs),
        `before=${before.cardXs.slice(0, 4).join(',')} / after=${after.cardXs.slice(0, 4).join(',')}`,
      );
      check('源码面板出现', (await page.locator('.demo-source').count()) === 1);
      await ctx.close();
    }

    // ── 1920 / 2560：shell 利用率 ───────────────────────────────────
    for (const [width, minContent] of [
      [1920, 1300],
      [2560, 1900],
    ]) {
      const ctx = await newContext(browser, width);
      const page = await ctx.newPage();
      await open(page, '/components/button');
      await page.waitForSelector('.demo-preview', { timeout: 30000 });
      const m = await measure(page);
      check(
        `${width} 内容栏 ≥ ${minContent}`,
        (m.content?.w ?? 0) >= minContent,
        `content=${Math.round(m.content?.w ?? 0)}`,
      );
      check(
        `${width} 无横向溢出`,
        m.scrollWidth <= m.innerWidth + 1,
        `${m.scrollWidth}/${m.innerWidth}`,
      );
      await ctx.close();
    }

    // ── Form / Table：full 档占满一行 ───────────────────────────────
    {
      const ctx = await newContext(browser, 1440);
      const page = await ctx.newPage();
      for (const name of ['form', 'table']) {
        await open(page, `/components/${name}`);
        await page.waitForSelector('.demo-preview', { timeout: 30000 });
        const m = await measure(page);
        const ratio = (m.firstCard?.w ?? 0) / (m.content?.w ?? 1);
        check(`${name} full 档占满内容栏`, ratio >= 0.9, `ratio=${ratio.toFixed(3)}`);
      }
      await ctx.close();
    }

    // ── 390：移动端 ────────────────────────────────────────────────
    {
      const ctx = await newContext(browser, 390);
      const page = await ctx.newPage();
      for (const path of ['/components/button', '/components/form', '/components/table']) {
        await open(page, path);
        await page.waitForSelector('.demo-preview', { timeout: 30000 });
        const m = await measure(page);
        check(
          `${path} @390 无横向溢出`,
          m.scrollWidth <= m.innerWidth + 1,
          `${m.scrollWidth}/${m.innerWidth}`,
        );
      }
      check('移动端顶栏 GitHub 隐藏', (await measure(page)).githubDisplay === 'none');
      await ctx.close();
    }

    // ── 暗色 ───────────────────────────────────────────────────────
    {
      const ctx = await newContext(browser, 1440, { dark: true });
      const page = await ctx.newPage();
      await open(page, '/components/button');
      await page.waitForSelector('.demo-preview', { timeout: 30000 });
      const m = await measure(page);
      const white = m.bodyBg.replace(/\s/g, '') === 'rgb(255,255,255)';
      check('暗色背景不是白色', !white, m.bodyBg);
      check('暗色 token 存在', m.colorPrimary.length > 0, m.colorPrimary);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n❌ V3 门禁失败 ${failed.length}/${results.length} 项`);
    process.exitCode = 1;
  } else {
    console.log(`\n✅ V3 门禁全部通过（${results.length} 项）`);
  }
};

await main();
