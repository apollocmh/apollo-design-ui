/**
 * V3 Phase 0 —— Ant Design / Apollo 文档站同尺寸视觉与布局采样。
 *
 * 运行：
 *   node docs/audit/visual-v3/capture.mjs                 # 全量
 *   node docs/audit/visual-v3/capture.mjs --only button   # 只采一个页面键
 *   node docs/audit/visual-v3/capture.mjs --width 1440    # 只采一个宽度
 *   node docs/audit/visual-v3/capture.mjs --out=p1        # 阶段证据：screenshots-p1/ + metrics-p1.json
 *
 * 前提：Apollo 生产 preview 在 APOLLO_URL（默认 http://127.0.0.1:4477/apollo-design-ui）。
 * 输出：
 *   docs/audit/visual-v3/screenshots/{ant,apollo}/...
 *   docs/audit/visual-v3/metrics.json
 *   docs/audit/visual-v3/metrics.md（自动汇总表，人工结论写在 V3-BASELINE.md）
 *
 * 约束（对应报告 §5 Phase 0）：
 * - 两侧同 viewport、同 DPI（1）、同语言（en-US）、同主题、同 reduced-motion；
 * - 不把不同尺寸的长图直接做像素评分 —— 本脚本只采集与量测，不做像素判分；
 * - Apollo `?lang=en-US`、Ant 默认英文；Ant 主题按钮切暗色，Apollo 用 localStorage。
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve('docs/audit/visual-v3');
const ANT_URL = process.env.ANT_URL ?? 'https://ant.design';
const APOLLO_URL = process.env.APOLLO_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';

const args = process.argv.slice(2);
const argValue = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const ONLY = argValue('only')?.split(',').filter(Boolean);
const ONLY_WIDTH = argValue('width') ? Number(argValue('width')) : undefined;
const ONLY_THEME = argValue('theme');
/** 阶段标签：P0 用默认（screenshots / metrics.json），P1+ 用 --out=p1 保留历史证据。 */
const OUT_LABEL = argValue('out');
const SHOTS = path.join(ROOT, OUT_LABEL ? `screenshots-${OUT_LABEL}` : 'screenshots');
const METRICS = path.join(ROOT, OUT_LABEL ? `metrics-${OUT_LABEL}.json` : 'metrics.json');

/** @type {Array<{key:string,ant:string,apollo:string,kind:'home'|'overview'|'component',wait:string}>} */
const PAGES = [
  { key: 'home', ant: '/', apollo: '/', kind: 'home', wait: 'main' },
  {
    key: 'overview',
    ant: '/components/overview/',
    apollo: '/components',
    kind: 'overview',
    wait: 'a[href*="/components/"]',
  },
  {
    key: 'button',
    ant: '/components/button/',
    apollo: '/components/button',
    kind: 'component',
    wait: '.code-box, .demo-preview',
  },
  {
    key: 'float-button',
    ant: '/components/float-button/',
    apollo: '/components/float-button',
    kind: 'component',
    wait: '.code-box, .demo-preview',
  },
  {
    key: 'form',
    ant: '/components/form/',
    apollo: '/components/form',
    kind: 'component',
    wait: '.code-box, .demo-preview',
  },
  {
    key: 'date-picker',
    ant: '/components/date-picker/',
    apollo: '/components/date-picker',
    kind: 'component',
    wait: '.code-box, .demo-preview',
  },
  {
    key: 'upload',
    ant: '/components/upload/',
    apollo: '/components/upload',
    kind: 'component',
    wait: '.code-box, .demo-preview',
  },
  {
    key: 'table',
    ant: '/components/table/',
    apollo: '/components/table',
    kind: 'component',
    wait: '.code-box, .demo-preview',
  },
];

const WIDTHS = [1440, 1920, 2560, 390];
const FULL_PAGES = new Set(['home', 'overview', 'button', 'table']);
const COMPONENT_PAGES = new Set([
  'button',
  'float-button',
  'form',
  'date-picker',
  'upload',
  'table',
]);

const pageList = ONLY ? PAGES.filter((p) => ONLY.includes(p.key)) : PAGES;
const widths = ONLY_WIDTH ? [ONLY_WIDTH] : WIDTHS;

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const shotPath = (side, name) => path.join(SHOTS, side, `${name}.png`);

async function stabilize(page, side, pageKey) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(side === 'ant' ? 1600 : 900);
  const sel = side === 'ant' ? '.code-box' : '.demo-preview';
  if (COMPONENT_PAGES.has(pageKey)) {
    await page.waitForSelector(sel, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(600);
  }
}

async function setTheme(page, side, theme) {
  if (theme === 'light') return;
  if (side === 'apollo') {
    // 主题已由 context.addInitScript 注入（reload 会再次执行 init script，
    // 因此不能「先 evaluate 再 reload」——会被重置回 light）。
    await page
      .waitForFunction(() => document.documentElement.dataset.apolloTheme === 'dark', null, {
        timeout: 10000,
      })
      .catch(() => {});
    return;
  }
  // Ant Design：顶栏 Theme 按钮先开下拉，再点「Dark theme」菜单项。
  const current = await page.evaluate(() =>
    document.documentElement.getAttribute('data-prefers-color'),
  );
  if (current !== 'dark') {
    const themeBtn = page.locator('header button').filter({ hasText: 'Theme icon' }).first();
    await themeBtn.click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(300);
    const darkItem = page.locator('[role="menuitem"]').filter({ hasText: 'Dark theme' }).first();
    await darkItem.click({ timeout: 10000 }).catch(async () => {
      await page
        .getByText('Dark theme', { exact: true })
        .first()
        .click({ timeout: 5000 })
        .catch(() => {});
    });
    await page
      .waitForFunction(
        () => document.documentElement.getAttribute('data-prefers-color') === 'dark',
        null,
        {
          timeout: 10000,
        },
      )
      .catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(600);
  }
}

/** 元素盒模型 + 关键计算样式。 */
function measurePage(side) {
  window.scrollTo(0, 0);
  const boxOf = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };
  const q = (sel) => document.querySelector(sel);
  const qa = (sel) => [...document.querySelectorAll(sel)];
  const cs = (el, prop) => (el ? getComputedStyle(el)[prop] : null);

  const header = q(side === 'ant' ? 'header' : '.site-topbar');
  const main = q('main');
  const sidebar =
    side === 'ant'
      ? (qa('main .ant-col').find((el) => getComputedStyle(el).position === 'sticky') ?? null)
      : q('.site-sidebar');
  const content = q(side === 'ant' ? 'article' : '.site-content');
  const prose =
    side === 'ant'
      ? ([...(q('article')?.children ?? [])]
          .filter((el) => el.tagName === 'DIV')
          .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0] ??
        null)
      : q('.site-content .doc-markdown');
  const toc = q(side === 'ant' ? '.ant-anchor-wrapper' : '.site-toc');

  const demoSelector = side === 'ant' ? '.code-box' : '.demo-preview';
  const demos = qa(demoSelector);
  const card = demos[0] ?? null;
  const canvas = card?.querySelector(side === 'ant' ? '.code-box-demo' : '.demo-canvas') ?? null;
  const title =
    card?.querySelector(side === 'ant' ? '.code-box-title' : '.demo-preview-title') ?? null;
  const desc =
    card?.querySelector(
      side === 'ant' ? '.code-box-description, .code-box-meta' : '.demo-preview-desc',
    ) ?? null;

  // API 表：取「API」标题之后的第一个 table（Ant 的 h2#api / Apollo 的 h2 API 均适用）
  const headings = qa('h2, h3');
  const apiHeading = headings.find((h) => (h.textContent ?? '').trim().toLowerCase() === 'api');
  const apiTable =
    apiHeading &&
    qa('table').find((t) => {
      const r = t.getBoundingClientRect();
      return r.y + window.scrollY > apiHeading.getBoundingClientRect().y + window.scrollY;
    });
  const apiCell = apiTable?.querySelector('td') ?? null;

  const heroTitle = side === 'ant' ? q('h1') : q('.home-title, .component-title, h1');

  return {
    side,
    header: boxOf(header),
    main: boxOf(main),
    sidebar: boxOf(sidebar),
    content: boxOf(content),
    prose: boxOf(prose),
    toc: boxOf(toc),
    doc: {
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    },
    body: {
      fontFamily: cs(document.body, 'fontFamily'),
      fontSize: cs(document.body, 'fontSize'),
      lineHeight: cs(document.body, 'lineHeight'),
      color: cs(document.body, 'color'),
      background: cs(document.body, 'backgroundColor'),
    },
    demo: {
      count: demos.length,
      card: boxOf(card),
      canvas: boxOf(canvas),
      title: boxOf(title),
      canvasPadding: cs(canvas, 'padding'),
      canvasBackground: cs(canvas, 'backgroundColor'),
      cardBorder: cs(card, 'borderColor'),
      cardRadius: cs(card, 'borderRadius'),
      layout: (() => {
        if (demos.length < 2) return null;
        const rects = demos.map((el) => el.getBoundingClientRect());
        const rows = new Map();
        for (const r of rects) {
          const key = Math.round(r.y);
          const list = rows.get(key) ?? [];
          list.push(r);
          rows.set(key, list);
        }
        const multi = [...rows.entries()]
          .filter(([, list]) => list.length > 1)
          .sort((a, b) => a[0] - b[0])[0];
        if (!multi) return { columns: 1, cardWidth: Math.round(rects[0].width), gap: null };
        const list = multi[1].sort((a, b) => a.x - b.x);
        return {
          columns: list.length,
          cardWidth: Math.round(list[0].width),
          gap: Math.round(list[1].x - list[0].x - list[0].width),
        };
      })(),
      titleFontSize: cs(title, 'fontSize'),
      titleFontWeight: cs(title, 'fontWeight'),
      descFontSize: cs(desc, 'fontSize'),
      descLineHeight: cs(desc, 'lineHeight'),
      descColor: cs(desc, 'color'),
    },
    api: apiTable
      ? {
          table: boxOf(apiTable),
          fontSize: cs(apiTable, 'fontSize'),
          cellPadding: cs(apiCell, 'padding'),
          headerBackground: cs(apiTable.querySelector('th'), 'backgroundColor'),
          cellBorder: cs(apiCell, 'borderColor'),
          codeFontSize: cs(apiTable.querySelector('code'), 'fontSize'),
          overflowX: cs(apiTable, 'overflowX'),
        }
      : null,
    hero: {
      title: boxOf(heroTitle),
      titleFontSize: cs(heroTitle, 'fontSize'),
      titleWeight: cs(heroTitle, 'fontWeight'),
    },
  };
}

async function captureSide(browser, { side, pageKey, width, theme, pageDef }) {
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : width >= 1920 ? 1080 : 900 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  if (side === 'apollo') {
    await context.addInitScript((requestedTheme) => {
      localStorage.setItem('apollo-site-locale', 'en-US');
      localStorage.setItem('apollo-site-theme', requestedTheme);
    }, theme);
  }
  const page = await context.newPage();
  const base = side === 'ant' ? ANT_URL : APOLLO_URL;
  const pathPart = side === 'ant' ? pageDef.ant : pageDef.apollo;
  const sep = pathPart.includes('?') ? '&' : '?';
  const url = side === 'apollo' ? `${base}${pathPart}${sep}lang=en-US` : `${base}${pathPart}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await stabilize(page, side, pageKey);
  if (theme === 'dark') await setTheme(page, side, theme);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const prefix = `${pageKey}${theme === 'dark' ? '-dark' : ''}-${width}`;
  ensureDir(path.join(SHOTS, side));
  await page.screenshot({
    path: shotPath(side, `${prefix}-screen`),
    animations: 'disabled',
    caret: 'hide',
  });

  if (FULL_PAGES.has(pageKey) && width === 1440) {
    await page.screenshot({
      path: shotPath(side, `${prefix}-full`),
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  }

  if (COMPONENT_PAGES.has(pageKey) && width === 1440) {
    const cardSel = side === 'ant' ? '.code-box' : '.demo-preview';
    const firstCard = page.locator(cardSel).first();
    if (await firstCard.count()) {
      await firstCard.screenshot({
        path: shotPath(side, `${prefix}-card`),
        animations: 'disabled',
        caret: 'hide',
      });
    }
    // API 表：按「API 标题之后的第一个 table」定位（不能取 last —— FAQ/变更表会串）
    const apiIndex = await page.evaluate(() => {
      const headings = [...document.querySelectorAll('h2, h3')];
      const api = headings.find((h) => (h.textContent ?? '').trim().toLowerCase() === 'api');
      if (!api) return -1;
      const apiY = api.getBoundingClientRect().y + window.scrollY;
      const tables = [...document.querySelectorAll('table')];
      return tables.findIndex((t) => t.getBoundingClientRect().y + window.scrollY > apiY);
    });
    if (apiIndex >= 0) {
      await page
        .locator('table')
        .nth(apiIndex)
        .screenshot({
          path: shotPath(side, `${prefix}-api`),
          animations: 'disabled',
          caret: 'hide',
        })
        .catch(() => {});
    }
  }

  const metrics = await page.evaluate(measurePage, side);
  await context.close();
  return { ...metrics, page: pageKey, theme, width, url };
}

const main = async () => {
  ensureDir(SHOTS);
  const browser = await chromium.launch();
  const rows = [];
  const antVersion = await (async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${ANT_URL}/components/button/`, { waitUntil: 'networkidle', timeout: 90000 });
    const version = await page.evaluate(() => {
      const text = document.querySelector('header')?.textContent ?? '';
      return text.match(/\d+\.\d+\.\d+/)?.[0] ?? 'unknown';
    });
    await ctx.close();
    return version;
  })();

  try {
    for (const pageDef of pageList) {
      for (const width of widths) {
        let themes = pageDef.key === 'button' ? ['light', 'dark'] : ['light'];
        if (ONLY_THEME) themes = themes.filter((theme) => theme === ONLY_THEME);
        for (const theme of themes) {
          for (const side of ['ant', 'apollo']) {
            process.stdout.write(`capture ${side} ${pageDef.key} ${width} ${theme} … `);
            const row = await captureSide(browser, {
              side,
              pageKey: pageDef.key,
              width,
              theme,
              pageDef,
            });
            rows.push(row);
            console.log('ok');
          }
        }
      }
    }
  } finally {
    await browser.close();
  }

  const report = {
    capturedAt: new Date().toISOString(),
    antVersion,
    apolloUrl: APOLLO_URL,
    antUrl: ANT_URL,
    widths,
    pages: pageList.map((p) => p.key),
    rows,
  };
  fs.writeFileSync(METRICS, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n✅ ${rows.length} 条采样 → ${METRICS}`);
};

await main();
