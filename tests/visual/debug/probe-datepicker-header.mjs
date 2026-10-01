#!/usr/bin/env node
/**
 * probe-datepicker-header.mjs — 对拍 date-picker **面板表头**的 DOM 与计算样式。
 *
 * 用途：L6 的像素差异只告诉你「哪里不一样」，不告诉你「为什么」。
 * 这个探针把两侧表头按钮的 `outerHTML` 与图标的**计算样式**并排打出来，
 * 用来定位「图标偏细 / 偏浅」这类差异。
 *
 * 前置：先跑过一次 `node tests/visual/run.mjs`（或任意 `--component`）把
 * `.artifacts/{react,vue}` 建出来 —— 本探针**不自己打包**（打包很慢）。
 *
 * 用法：`node tests/visual/debug/probe-datepicker-header.mjs [variant]`
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  launchBrowser,
  newStablePage,
  stabilizePage,
  stripMotionPhaseClasses,
} from '../stabilize.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.join(HERE, '..', '.artifacts');
const VARIANT = process.argv[2] ?? 'basic';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

/** 极简静态服务器（与 `run.mjs` 的同一套语义）。 */
function startServer(root) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/** 在页面里抓表头的结构 + 计算样式。 */
const PROBE = () => {
  const out = { found: {}, styles: {} };
  // 面板根的类名可能是 `apollo-picker-panel`（本仓）/ `ant-picker-panel`（antd）
  const panel = document.querySelector('[class*="-picker-panel"]');
  out.panelClass = panel?.className ?? null;
  if (!panel) return out;

  const header = panel.querySelector('[class*="-header"]');
  out.headerHTML = header?.outerHTML?.replace(/\s+/g, ' ').slice(0, 1200) ?? null;

  // 祖先链（表头 → body）：看两侧的浮层包装层是否一一对应
  out.chain = [];
  for (let el = header; el && el !== document.body; el = el.parentElement) {
    const cs = getComputedStyle(el);
    out.chain.push({
      tag: el.tagName.toLowerCase(),
      cls: el.className?.toString().slice(0, 90),
      display: cs.display,
      boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 60),
      background: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      overflow: cs.overflow,
      pointerEvents: cs.pointerEvents,
      // ⚠️ `offsetWidth` 有值而 `getBoundingClientRect()` 全 0 ⇒ 祖先上有 scale 变换。
      //    本探针的 React 侧就是这样（见文件头的坑记录），所以链里必须带 transform。
      transform: cs.transform === 'none' ? 'none' : cs.transform.slice(0, 50),
      opacity: cs.opacity,
      zoom: cs.zoom,
    });
  }

  // 命中测试：`pointer-events` 链断了的话，**日期格**会被祖先接走。
  // ⚠️ 不要拿面板根做靶子：两侧的「面板根」在 DOM 里不是同一层
  // （React 是 `-panel-container`，本仓是 `-panel`），rect 不可比。
  // 拿 `td…-cell` 这种**两侧同构**的元素做靶子；并且**只取有布局盒的**
  // （DOM 里还有 0×0 的隐藏格，取到它 `elementFromPoint` 就没有意义）。
  const allCells = [...document.querySelectorAll('[class*="-cell"]')];
  const cells = allCells.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  out.cellCount = cells.length;
  out.cellTotal = allCells.length;
  // 从第一个格子往上走：找出「谁把布局盒吃掉了」
  const anyCell = allCells.find((el) =>
    /(^|\s)[a-z-]*-cell(\s|$)/.test(el.className?.toString() ?? ''),
  );
  out.cellChain = [];
  for (let el = anyCell; el && el !== document.body; el = el.parentElement) {
    const r = el.getBoundingClientRect();
    out.cellChain.push(
      `${el.tagName.toLowerCase()}.${el.className?.toString().slice(0, 60)} | ${Math.round(r.width)}×${Math.round(r.height)} | display=${getComputedStyle(el).display} | vis=${getComputedStyle(el).visibility}`,
    );
  }
  out.panelMatches = [...document.querySelectorAll('[class*="-picker-panel"]')].map(
    (el) => `${el.tagName.toLowerCase()}.${el.className}  ${el.offsetWidth}×${el.offsetHeight}`,
  );
  const cell = cells.find((el) => /(^|\s)[a-z-]*-cell(\s|$)/.test(el.className?.toString() ?? ''));
  if (cell) {
    const cr = cell.getBoundingClientRect();
    const hit = document.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2);
    out.hitTest = {
      cellCls: cell.className?.toString().slice(0, 70),
      cellRect: `${Math.round(cr.width)}×${Math.round(cr.height)} @${Math.round(cr.left)},${Math.round(cr.top)}`,
      hitCls: hit ? `${hit.tagName.toLowerCase()}.${hit.className?.toString().slice(0, 60)}` : null,
      /** `false` ⇒ 格子被 `pointer-events: none` 穿透，真实浏览器里点不动 */
      cellIsHittable: !!hit && (hit === cell || cell.contains(hit)),
    };
  }

  // 页脚（`-footer` / `-ranges` / `-now` / `-ok`）—— 两侧逐项对拍
  const pick = (el, keys) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const out = {};
    for (const k of keys) out[k] = cs[k];
    return out;
  };
  const footer = document.querySelector('[class*="-picker-footer"]');
  out.footer = {
    exists: !!footer,
    rect: footer
      ? `${Math.round(footer.getBoundingClientRect().width)}×${Math.round(footer.getBoundingClientRect().height)}`
      : null,
    borderTop: footer ? getComputedStyle(footer).borderTop : null,
    html: footer?.outerHTML?.replace(/\s+/g, ' ').slice(0, 600) ?? null,
  };
  const ranges = document.querySelector('[class*="-picker-ranges"]');
  out.ranges = pick(ranges, [
    'display',
    'justifyContent',
    'alignItems',
    'paddingInline',
    'marginBlock',
  ]);
  // 🚨 链接色：React 侧的 `Today` / `Now` 是**蓝色**。查它到底由哪条规则给。
  const nowBtn = document.querySelector('[class*="-picker-now-btn"]');
  out.nowBtn = pick(nowBtn, ['color', 'textDecorationLine', 'cursor', 'fontSize', 'lineHeight']);
  const okBtn = document.querySelector('[class*="-picker-ok"] button');
  out.okBtn = pick(okBtn, [
    'color',
    'backgroundColor',
    'borderRadius',
    'height',
    'paddingInline',
    'fontSize',
    'lineHeight',
    'borderWidth',
  ]);

  // 逐个候选选择器找图标
  for (const key of ['prev-icon', 'super-prev-icon', 'next-icon']) {
    const el = panel.querySelector(`[class*="${key}"]`);
    out.found[key] = el ? el.className : null;
    if (el) {
      const cs = getComputedStyle(el);
      const before = getComputedStyle(el, '::before');
      out.styles[key] = {
        display: cs.display,
        width: cs.width,
        height: cs.height,
        color: cs.color,
        borderTopWidth: cs.borderTopWidth,
        // 图标本体是 `::before` 画的两条边
        beforeBorderTopWidth: before.borderTopWidth,
        beforeBorderRightWidth: before.borderRightWidth,
        beforeBorderBottomWidth: before.borderBottomWidth,
        beforeBorderLeftWidth: before.borderLeftWidth,
        beforeBorderColor: before.borderTopColor,
        beforeWidth: before.width,
        beforeHeight: before.height,
        beforeTransform: before.transform,
      };
    }
  }
  return out;
};

const { server, port } = await startServer(ARTIFACTS);
const { browser, channel } = await launchBrowser();
console.log(`浏览器：${channel}`);

try {
  for (const side of ['react', 'vue']) {
    const { context, page } = await newStablePage(browser, { width: 1440, height: 900 });
    try {
      const q = new URLSearchParams({ component: 'date-picker', variant: VARIANT, theme: 'light' });
      await page.goto(`http://127.0.0.1:${port}/${side}/${side}.html?${q.toString()}`, {
        waitUntil: 'load',
      });
      await page.waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 20000 });
      await stabilizePage(page);
      await page.waitForTimeout(1100);
      // 🚨 必须与 `screenshotElement` 同步：先剥 motion 相位类再测量。
      // 不剥的话 React 的浮层停在 `transform: scale(0)` 首帧 ⇒ 全链 rect 0×0（探针缺陷）。
      await stripMotionPhaseClasses(page);
      const result = await page.evaluate(PROBE);
      console.log(`\n================= ${side} =================`);
      console.log('panelClass:', result.panelClass);
      console.log('headerHTML:', result.headerHTML);
      console.log('chain:', JSON.stringify(result.chain, null, 2));
      console.log('panelMatches:', JSON.stringify(result.panelMatches, null, 2));
      console.log('cellCount:', result.cellCount, '/ total', result.cellTotal);
      console.log('footer:', JSON.stringify(result.footer, null, 2));
      console.log('ranges:', JSON.stringify(result.ranges, null, 2));
      console.log('nowBtn:', JSON.stringify(result.nowBtn, null, 2));
      console.log('okBtn:', JSON.stringify(result.okBtn, null, 2));
      console.log('cellChain:', JSON.stringify(result.cellChain, null, 2));
      console.log('hitTest:', JSON.stringify(result.hitTest, null, 2));

      // 真点击验证：`pointer-events: none` 的格子会被 Playwright 的可操作性检查拦下
      // （"… subtree intercepts pointer events"），或点了没反应。**两侧都跑**才构成对照。
      {
        const before = await page.inputValue('input');
        let clickError = null;
        try {
          await page.click('td[class*="-cell"]', { timeout: 4000 });
        } catch (e) {
          // 保留完整报文：可操作性检查失败的原因在**第二行起**
          clickError = e.message.slice(0, 1200);
        }
        await page.waitForTimeout(300);
        console.log(
          'clickTest:',
          JSON.stringify({ before, after: await page.inputValue('input'), clickError }, null, 2),
        );
      }
      console.log('icons:', JSON.stringify(result.found, null, 2));
      console.log('styles:', JSON.stringify(result.styles, null, 2));
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
