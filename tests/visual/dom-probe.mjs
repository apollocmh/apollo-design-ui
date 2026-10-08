/**
 * 真浏览器 DOM 对拍探针（`docs/KNOWN-ISSUES.md` §1.2）。
 *
 * ── 为什么需要它 ────────────────────────────────────────────────────────────
 *
 * L4（DOM 契约）跑在 **jsdom + SSR** 上 ⇒ **拿不到 Portal 里的浮层**
 * （`color-picker` 的面板在 Popover 的 Portal 里、SSR 不渲染）。
 * 那些区域此前**只有 L6 像素级**覆盖 ⇒ 「**像素相同但结构不同**」的漂移不会红。
 *
 * 本探针把两侧页面在**真浏览器**里渲染、取 `#stage` 的 `outerHTML`，
 * 再喂给 **L4 的同一套归一化**（`@apollo-design/test-utils` 的 `contractOf`）
 * 后逐节点对比 ⇒ 结构与 L4 判据**同源**，不会各说各话。
 *
 * ── 用法 ────────────────────────────────────────────────────────────────────
 *
 * ```sh
 * # 先确保产物已构建：node tests/visual/run.mjs --mode compare --component color-picker
 * node tests/visual/dom-probe.mjs color-picker basicOpen
 * node tests/visual/dom-probe.mjs tooltip basicOpen --keep-style
 * ```
 *
 * 退出码：两侧契约一致 = 0；有差异 = 1（并打印逐条差异）。
 *
 * ⚠️ 归一化**刻意复用** `test-utils` 而不是自己写一套 —— 否则「L4 绿 + 探针红」
 *    会变成两个互相矛盾的判据（`PITFALLS` 353 的同类教训：判据只能有一个来源）。
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { newStablePage } from './stabilize.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.resolve(HERE, '.artifacts');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

/**
 * 起一个只服务 `.artifacts/<side>` 的静态服务器（与 `run.mjs` / `debug/dump.mjs` 同构）。
 *
 * `export` 是为了**全量扫描器** `dom-probe-scan.mjs` 复用同一条通路 —— 判据只能
 * 有一个来源（`PITFALLS` 353 同判）：扫描器与本探针必须看到**同一份 DOM**。
 */
export function startServer(root) {
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.join(root, pathname);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/**
 * 取某侧页面 `#stage` 的 outerHTML。
 *
 * ⚠️ 复用 `run.mjs` 的**同一套**加载姿势（`newStablePage` + `__VISUAL_READY__`），
 *    否则探针看到的 DOM 与 L6 拍的不是同一状态（判据就会分叉）。
 */
export async function dumpStage(browser, { port, side, component, variant, theme = 'light' }) {
  const { context, page } = await newStablePage(browser, { width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });
  try {
    const q = new URLSearchParams({ component, variant, theme });
    await page.goto(`http://127.0.0.1:${port}/${side}/${side}.html?${q.toString()}`, {
      waitUntil: 'load',
    });
    try {
      await page.waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 45_000 });
    } catch {
      // ⚠️ 超时必须把「页面自己报了什么」带出来，否则只知道「没就绪」而不知为什么
      //    （常见：这个 component/variant 组合不存在 ⇒ 入口抛错 ⇒ 标志永不置位）
      const stage = await page.evaluate(() => document.querySelector('#stage')?.outerHTML ?? '');
      throw new Error(
        `${side} 侧 45s 内没等到 __VISUAL_READY__（component=${component} variant=${variant}）\n` +
          `  页面错误：${errors.slice(0, 5).join(' | ') || '(无)'}\n` +
          `  #stage：${stage ? `${stage.slice(0, 200)}…` : '(不存在)'}`,
      );
    }
    // 与 `screenshotElement` 同款等待：让 Portal / motion 的初始相位落定
    await page.waitForTimeout(1100);
    const html = await page.evaluate(() => document.querySelector('#stage')?.outerHTML ?? '');
    return { html, errors };
  } finally {
    await context.close();
  }
}

/**
 * 前缀归一 + `contractOf` —— **扫描器与探针共用同一份判据**。
 *
 * 独立成函数是为了让全量扫描（379 个 component/variant）能复用；逻辑不变。
 */
/**
 * 前缀归一：视觉层的 React 侧用的是 antd 默认前缀（`ant-`），Vue 侧是 `apollo-`
 * ⇒ 直接比会满屏前缀差异（那不是结构差异）。
 *
 * ⚠️ 只改 **`class` 属性值内部** —— 不碰 `data-*` / `aria-*` / id，避免把
 *    「属性值里恰好含 `ant-`」的内容也改掉。
 *
 * 🚨 **2026-10-08 补一条：`anticon` → `apollo-icon`**。
 *    antd 的图标类名是 **`anticon` / `anticon-down`**（`ant` 后面**没有连字符**），
 *    本仓是 `apollo-icon` / `apollo-icon-down` ⇒ 只换 `\bant-` **匹配不到它们**，
 *    于是**任何带图标的组件都会误报差异**（collapse / table / dropdown… 全中）。
 *    那让本探针等于不可用 —— 而它正是用来找「结构性分叉」这类 bug 的工具
 *    （Button 多包一层 `<span>` 就是这么发现的）。
 */
export const normalizePrefix = (html) =>
  html.replace(
    /class="([^"]*)"/g,
    (_m, cls) =>
      `class="${cls
        // 先换 icon 类（它们在 `ant` 后没有连字符，必须先处理）
        .replace(/\banticon-/g, 'apollo-icon-')
        .replace(/\banticon\b/g, 'apollo-icon')
        .replace(/\bant-/g, 'apollo-')}"`,
  );

/**
 * 归一化后的两侧契约（**扫描器与探针共用**）。
 */
export async function contractsOfPair({ contractOf, reactHtml, vueHtml, keepStyle = false }) {
  const opts = keepStyle ? { keepStyle: true } : undefined;
  return {
    react: contractOf(normalizePrefix(reactHtml), opts),
    vue: contractOf(normalizePrefix(vueHtml), opts),
  };
}

async function main(argv = process.argv.slice(2)) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const positional = argv.filter((a) => !a.startsWith('--'));
  const component = positional[0] ?? 'color-picker';
  const variant = positional[1] ?? 'basicOpen';
  const theme = positional[2] ?? 'light';
  const keepStyle = flags.has('--keep-style');

  if (!fs.existsSync(ARTIFACTS)) {
    console.error(
      `找不到 ${path.relative(process.cwd(), ARTIFACTS)} —— 先跑一次 tests/visual/run.mjs 构建产物。`,
    );
    return 2;
  }

  // 复用 L4 的归一化（`contractOf` 吃 HTML，正好适配「真浏览器 dump」这条路径）。
  // ⚠️ `contractOf` 内部用 `document.createElement('template')` ⇒ 在 Node 里要先喂一个 DOM。
  //    这里用仓库已有的 jsdom（vitest 的同一个），**不自己写一套归一化** ——
  //    判据只能有一个来源（`PITFALLS` 353 的同类教训）。
  const { JSDOM } = await import('jsdom');
  globalThis.document = new JSDOM('<!doctype html><html><body></body></html>').window.document;
  const { contractOf } = await import('../../packages/test-utils/dist/index.mjs');

  const { server, port } = await startServer(ARTIFACTS);
  void 0;
  const browser = await chromium.launch();
  let left;
  let right;
  try {
    left = await dumpStage(browser, { port, side: 'react', component, variant, theme });
    right = await dumpStage(browser, { port, side: 'vue', component, variant, theme });
  } finally {
    await browser.close();
    server.close();
  }

  for (const [side, r] of [
    ['react', left],
    ['vue', right],
  ]) {
    if (r.errors.length > 0)
      console.error(`⚠️ ${side} 侧渲染期报错：${r.errors.slice(0, 3).join(' | ')}`);
  }

  const { react: a, vue: b } = await contractsOfPair({
    contractOf,
    reactHtml: left.html,
    vueHtml: right.html,
    keepStyle,
  });
  const sa = JSON.stringify(a, null, 1);
  const sb = JSON.stringify(b, null, 1);

  console.log(`▶ DOM 对拍：${component}/${variant}（theme=${theme}，keepStyle=${keepStyle}）`);
  if (sa === sb) {
    console.log('✔ 两侧契约一致');
    return 0;
  }

  console.log('✗ 两侧契约不同 —— 逐行 diff（左 React / 右 Vue）：');
  if (flags.has('--full')) {
    console.log(`--- React 契约 ---\n${sa}`);
    console.log(`--- Vue 契约 ---\n${sb}`);
    return 1;
  }
  const la = sa.split('\n');
  const lb = sb.split('\n');
  const max = Math.max(la.length, lb.length);
  let shown = 0;
  for (let i = 0; i < max && shown < 60; i += 1) {
    if (la[i] !== lb[i]) {
      console.log(`  - ${(la[i] ?? '<缺>').trim()}`);
      console.log(`  + ${(lb[i] ?? '<缺>').trim()}`);
      shown += 1;
    }
  }
  if (shown >= 60) console.log('  …（差异过多，已截断）');
  return 1;
}

// 只有**直接运行**本文件时才跑 CLI —— 被 `dom-probe-scan.mjs` import 时不跑
// （否则扫描器一 import 就会开一次浏览器做一次无意义的对拍）。
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
