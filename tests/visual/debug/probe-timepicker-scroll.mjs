#!/usr/bin/env node
/**
 * probe-timepicker-scroll.mjs — 对拍两侧**时间列**的滚动状态。
 *
 * 用途：L6 的 `time-picker/value__light__*` 三个视口都 `block-diff`，
 * diff 图显示「React 停在中选值 12/30/45，Vue 停在 00/00/00」。
 * jsdom 看不到滚动（`scrollTop` 写不进去、`offsetTop` 恒 0）⇒ **只有真浏览器能回答**：
 *
 *   - 是「**从未**滚动」（rAF 循环没跑 / 提前放弃）？
 *   - 还是「**滚了但没收敛**」（截图早于动画结束）？
 *   - 还是「滚了又被重置」？
 *
 * 所以本探针在 `stabilizePage()` 之后读**两次**：`+1100ms` 与 `+2600ms`。
 *
 * 前置：先跑过一次 `node tests/visual/run.mjs --component time-picker --mode compare`
 * 把 `.artifacts/{react,vue}` 建出来 —— 本探针**不自己打包**。
 *
 * 用法：`node tests/visual/debug/probe-timepicker-scroll.mjs [variant]`
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { launchBrowser, newStablePage, stabilizePage } from '../stabilize.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.join(HERE, '..', '.artifacts');
const VARIANT = process.argv[2] ?? 'value';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

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

/** 抓所有时间列（`ul`）的滚动与布局状态。 */
const PROBE = () => {
  const cols = [...document.querySelectorAll('[class*="-time-panel-column"]')];
  return {
    colCount: cols.length,
    cols: cols.map((ul, i) => {
      const firstLi = ul.querySelector('li');
      const selected = ul.querySelector('[class*="-cell-selected"]');
      const cs = getComputedStyle(ul);
      return {
        i,
        type: ul.getAttribute('data-type'),
        scrollTop: Math.round(ul.scrollTop),
        scrollHeight: ul.scrollHeight,
        clientHeight: ul.clientHeight,
        /** `offsetTop` 是**相对 offsetParent** 的 —— 首格与中选格都取，才能算目标位置 */
        firstOffsetTop: firstLi?.offsetTop ?? null,
        selectedText: selected?.textContent?.trim() ?? null,
        selectedOffsetTop: selected?.offsetTop ?? null,
        /** 目标位置（探针自己算一遍，与 `time-column.ts` 的 `targetTop` 同式） */
        targetTop:
          firstLi && selected ? (selected.offsetTop ?? 0) - (firstLi.offsetTop ?? 0) : null,
        overflowY: cs.overflowY,
        display: cs.display,
        height: cs.height,
        /** 布局盒（含变换）—— 若全 0 而 `clientHeight` 有值，说明祖先上有 scale */
        rect: (() => {
          const r = ul.getBoundingClientRect();
          return `${Math.round(r.width)}×${Math.round(r.height)} @${Math.round(r.top)}`;
        })(),
      };
    }),
  };
};

const { server, port } = await startServer(ARTIFACTS);
const { browser, channel } = await launchBrowser();
console.log(`浏览器：${channel}`);

try {
  for (const side of ['react', 'vue']) {
    const { context, page } = await newStablePage(browser, { width: 1440, height: 900 });
    try {
      const q = new URLSearchParams({ component: 'time-picker', variant: VARIANT, theme: 'light' });
      await page.goto(`http://127.0.0.1:${port}/${side}/${side}.html?${q.toString()}`, {
        waitUntil: 'load',
      });
      await page.waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 20000 });
      await stabilizePage(page);

      await page.waitForTimeout(1100);
      const first = await page.evaluate(PROBE);
      console.log(`\n================= ${side} · +1100ms =================`);
      console.log(JSON.stringify(first, null, 2));

      // 再等 1.5s：区分「从未滚动」与「滚了但没收敛」
      await page.waitForTimeout(1500);
      const second = await page.evaluate(PROBE);
      console.log(`\n----------------- ${side} · +2600ms -----------------`);
      console.log(JSON.stringify(second, null, 2));
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
