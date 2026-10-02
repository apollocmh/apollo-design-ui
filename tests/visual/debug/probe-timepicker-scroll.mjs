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
      // ── 🚨 插桩：包住 `scrollTop` 的 setter，记录**每一次**赋值 ──────────────
      // 这是回答「`doScroll` 到底跑没跑」最便宜的办法 —— 不用改源码、不用重建包。
      // 空数组 ⇒ `doScroll` 从未执行（`startScroll` 早退 / 没被调用）；
      // 非空 ⇒ 循环跑了但被别的东西重置。
      await page.addInitScript(() => {
        window.__SCROLL_SETS__ = [];
        const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
        if (!desc?.get || !desc?.set) return;
        Object.defineProperty(Element.prototype, 'scrollTop', {
          configurable: true,
          get() {
            return desc.get.call(this);
          },
          set(v) {
            if (this.tagName === 'UL' && /time-panel-column/.test(this.className)) {
              window.__SCROLL_SETS__.push(Math.round(Number(v)));
            }
            desc.set.call(this, v);
          },
        });
      });

      // [TMP-DBG] 捕获页面 console（插桩日志）
      // 🚨 **必须在 `goto` 之前挂** —— 应用在 `goto`（waitUntil:'load'）期间就挂载了，
      //    之后再挂监听会**丢掉挂载期的全部日志**（本轮实测踩到，白白多绕两轮）。
      const dbg = [];
      page.on('console', (msg) => {
        const t = msg.text();
        if (t.includes('[TMP-DBG]')) dbg.push(t);
      });

      const q = new URLSearchParams({ component: 'time-picker', variant: VARIANT, theme: 'light' });
      await page.goto(`http://127.0.0.1:${port}/${side}/${side}.html?${q.toString()}`, {
        waitUntil: 'load',
      });
      await page.waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 20000 });

      // ── 🚨 早期轮询：`stabilizePage()` **之前**就开始采样 ──────────────────
      // 目的：验证「首次 post-flush 时列没有布局盒」这个假设。
      // 判据：`offsetParent === null`（或 `display:none`）⇒ 那一刻 `offsetTop` 恒 0
      // ⇒ `startScroll` 会走「等目标格上屏（最多 5 帧）」⇒ 5 帧后放弃。
      const early = await page.evaluate(async () => {
        const samples = [];
        const t0 = performance.now();
        for (let i = 0; i < 24; i += 1) {
          const ul = document.querySelector('[class*="-time-panel-column"]');
          const li = ul?.querySelector('li');
          const sel = ul?.querySelector('[class*="-cell-selected"]');
          samples.push({
            t: Math.round(performance.now() - t0),
            hasUl: !!ul,
            display: ul ? getComputedStyle(ul).display : null,
            offsetParentNull: ul ? ul.offsetParent === null : null,
            clientHeight: ul?.clientHeight ?? null,
            firstOffsetTop: li?.offsetTop ?? null,
            selectedOffsetTop: sel?.offsetTop ?? null,
            scrollTop: ul ? Math.round(ul.scrollTop) : null,
          });
          await new Promise((r) => setTimeout(r, 50));
        }
        return samples;
      });
      // [TMP-DBG] 自检：listener 到底有没有在工作
      await page.evaluate(() => console.log('[TMP-DBG] hello-from-probe'));

      console.log(`\n================= ${side} · [TMP-DBG] console =================`);
      console.log(`共 ${dbg.length} 条；前 20 条：`);
      for (const line of dbg.slice(0, 20)) console.log(' ', line);

      console.log(`\n================= ${side} · scrollTop 赋值次数 =================`);
      console.log(
        JSON.stringify(await page.evaluate(() => window.__SCROLL_SETS__?.length ?? 'NO_HOOK')),
      );
      console.log(
        '前 12 次:',
        JSON.stringify(await page.evaluate(() => (window.__SCROLL_SETS__ ?? []).slice(0, 12))),
      );

      console.log(`\n================= ${side} · 早期轮询（每 50ms）=================`);
      console.log(JSON.stringify(early, null, 1));

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
