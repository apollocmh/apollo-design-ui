/**
 * stabilize.mjs — 视觉回归的稳定性处理。
 *
 * `TESTING.md` §9.2 列的六条要求在这里逐条落地。它们不是「锦上添花」：少任何一条，
 * 视觉比对就会退化成噪声源，最后只能靠放宽阈值让它变绿 —— 那违反 `T17`。
 *
 * ── 为什么优先用系统 Chrome ────────────────────────────────────────────────
 *
 * 本机是 macOS 12.7.6，Playwright 1.63 **不再为 mac12 提供** Chromium 构建
 * （`playwright install chromium` 直接报 `does not support chromium on mac12`）。
 * 所以默认走 `channel: 'chrome'` 用系统 Chrome；只有在拿不到系统 Chrome 时才退回
 * Playwright 自带的 Chromium（macOS 13+ 的机器上会走这条）。
 */

import { chromium } from 'playwright';

/** 注入到每个页面的稳定化 CSS。 */
export const STABILIZE_CSS = `
/* 1. 禁动画：任何 transition / animation 都会让截图取决于「何时按下的快门」 */
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
  caret-color: transparent !important;
  scroll-behavior: auto !important;
}

/* 2. 隐藏 caret（光标闪烁） */
input, textarea, [contenteditable] { caret-color: transparent !important; }

/* 3. 抹平滚动条在有无内容时的宽度差 */
html { scrollbar-gutter: stable; }

/* 4. 去掉焦点环 —— focus 状态由 fixture 显式触发，不受上一次交互残留影响 */
:focus { outline: none !important; }
`;

/** 稳定化 initScript：固定随机源与时间，保证两次渲染完全一致。 */
export const STABILIZE_INIT = () => {
  // 固定 Math.random（antd 与我们的实现都可能用它生成 id）
  let seed = 20260918;
  Math.random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  // 固定时间：任何依赖 Date 的渲染（如相对时间）都得到确定结果。
  // 重新赋值全局 Date 是 init script 的合法做法（脚本作用域即页面 window，不是 Node 全局）。
  const FIXED = new Date('2026-09-18T00:00:00Z').getTime();
  const RealDate = Date;
  // biome-ignore lint/suspicious/noGlobalAssign: init script 故意替换 window.Date 以冻结时间；这是页面级 mutation，不是 Node 全局污染。
  Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : []));
      if (args.length === 0) super.setTime(FIXED);
    }
    static now() {
      return FIXED;
    }
  };
};

/**
 * 启动浏览器。
 * @returns {Promise<{browser: import('playwright').Browser, channel: string}>}
 */
export async function launchBrowser() {
  // 先试系统 Chrome（mac12 的唯一可行解），失败再退回自带 Chromium。
  const attempts = [
    { channel: 'chrome', label: '系统 Chrome' },
    { channel: undefined, label: 'Playwright Chromium' },
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      const browser = await chromium.launch({ channel: attempt.channel });
      return { browser, channel: attempt.label };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `无法启动浏览器。已尝试：${attempts.map((a) => a.label).join(' / ')}。\n` +
      `最后一个错误：${lastError?.message}\n` +
      `提示：macOS 12 上 Playwright 不提供 Chromium 构建，需要系统安装 Google Chrome。`,
  );
}

/**
 * 创建一个已稳定的页面。
 * 固定 viewport / deviceScaleFactor / 时区 / locale / 配色方案。
 */
export async function newStablePage(browser, { width, height }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1, // DPR 必须固定，否则截图像素数不一致
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
    colorScheme: 'light',
    reducedMotion: 'reduce', // prefers-reduced-motion
    // 字体：不强制打包（两侧共用同一套系统字体栈，同机比对是公平的）；
    // 但关闭系统字体平滑差异带来的不确定性做不到，故两者必须在同一台机器上渲染。
  });

  const page = await context.newPage();
  await page.addInitScript(STABILIZE_INIT);
  return { context, page };
}

/**
 * 页面加载后调用：注入稳定化 CSS → 等字体 → 等两帧 → 禁 GIF 动画。
 */
export async function stabilizePage(page) {
  await page.addStyleTag({ content: STABILIZE_CSS });
  await waitForFonts(page);
  // 等两个 rAF：确保 layout + paint 都完成（含 antd cssinjs 的运行时注入）
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

/** 等所有字体就绪，避免「截图时字还没加载完」。 */
export async function waitForFonts(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    // 再等一拍，等 Web Font 真正应用到 layout
    await new Promise((r) => setTimeout(r, 50));
  });
}

/**
 * 截图一个元素（找不到元素时抛出带上下文的错误）。
 * 截**元素**而不是整页：两侧页面的外层留白不同，整页比对会把留白差异当成组件差异。
 */
export async function screenshotElement(page, selector, path) {
  // 浮层类组件（rc-trigger 系）的对齐是「布局效应 → 次帧量测 → 再改样式」的
  // 多帧过程，且 zoom 动画从 opacity:0 开始 —— 单帧截图会拍到未对齐/未显形的帧
  // （tooltip 实测）。等待：动画排空（有 1100ms 上限防挂死 —— 覆盖 antd rc-motion 的 motionDeadline（tooltip 为 1000ms）：STABILIZE_CSS 的 animation:none 会让 rc-motion 的 animationend 永不触发，只能等 deadline 兜底）后再多等一帧。
  // ⚠️ 这里只能按时间等，不能用 document.getAnimations() 判定 ——
  // STABILIZE_CSS 的 animation:none 让 rc-motion 的 animationend 永不触发，
  // 运行中的动画数为 0，但其 appear 态样式（opacity:0）要等 motionDeadline
  // （tooltip 1000ms）兜底后才解除。有 1100ms 上限，静态组件无动画不受影响。
  await page.waitForTimeout(1100);
  // 再模拟 animationend：剥掉残存的 motion 相位类。antd 部分浮层（dropdown）
  // 不设 motionDeadline —— STABILIZE_CSS 的 animation:none 下 rc-motion 会
  // 永远卡在 appear 态（opacity:0），只能在这里手工放行（D92，harness 平台差）。
  // Vue 侧到截图时刻已 settle（无相位类），此操作对其是 no-op。
  await page.evaluate(() => {
    for (const el of document.querySelectorAll(
      '[class*="-enter"],[class*="-appear"],[class*="-leave"]',
    )) {
      el.className = el.className
        .split(/\s+/)
        .filter((c) => !/-(enter|appear|leave)(-(active|prepare|start|end))?$/.test(c))
        .join(' ')
        .trim();
    }
  });
  const el = page.locator(selector);
  const count = await el.count();
  if (count === 0) {
    throw new Error(`找不到截图目标 ${selector}（页面 URL: ${page.url()}）`);
  }
  await el.first().screenshot({ path, animations: 'disabled' });
}
