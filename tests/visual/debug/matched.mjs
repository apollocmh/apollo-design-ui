/**
 * 临时调试脚本：打印某元素命中的全部 CSS 规则（含来源 sheet），用于定位「颜色从哪来」。
 * 用法：node tests/visual/debug/matched.mjs react upload drag ".ant-upload-list-item-name"
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.resolve(HERE, '..', '.artifacts');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const [side, component, variant, selector] = process.argv.slice(2);
const root = path.join(ARTIFACTS, side);
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
const port = await new Promise((r) =>
  server.listen(0, '127.0.0.1', () => r(server.address().port)),
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page.goto(
  `http://127.0.0.1:${port}/${side}.html?component=${component}&variant=${variant}&theme=light`,
);
await page
  .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
  .catch(() => {});

const hits = await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return { error: 'element not found' };
  const out = [];
  const walk = (rules, condition) => {
    for (const rule of rules) {
      if (rule.cssRules) {
        walk(Array.from(rule.cssRules), rule.conditionText ?? rule.media?.mediaText ?? condition);
        continue;
      }
      if (!rule.selectorText) continue;
      try {
        if (el.matches(rule.selectorText)) {
          out.push({
            at: condition ?? null,
            selector: rule.selectorText.slice(0, 140),
            css: rule.style.cssText.slice(0, 700),
          });
        }
      } catch {
        /* 非法选择器（:hover 等）跳过 */
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = Array.from(sheet.cssRules);
    } catch {
      continue;
    }
    walk(rules, null);
  }
  const cs = getComputedStyle(el);
  const all = [];
  const collect = (rules, cond) => {
    for (const r of rules) {
      if (r.cssRules) {
        collect(Array.from(r.cssRules), r.conditionText ?? cond);
        continue;
      }
      if (r.selectorText?.includes('picture-card'))
        all.push({
          at: cond ?? null,
          sel: r.selectorText.slice(0, 160),
          css: r.style.cssText.slice(0, 700),
        });
    }
  };
  for (const sh of Array.from(document.styleSheets)) {
    try {
      collect(Array.from(sh.cssRules), null);
    } catch {}
  }
  return {
    computed: { color: cs.color, gap: cs.gap, display: cs.display },
    pictureCardRules: all,
    matchedCount: out.length,
  };
}, selector);

console.log(JSON.stringify(hits, null, 2).slice(0, 9000));
await browser.close();
server.close();
