/**
 * 临时调试：cascader 页面级「无样式」排查。
 * 打印 #stage DOM + 关键节点的 computed style + 样式表里 cascader 规则命中情况。
 * 用法：node tests/visual/debug/probe-cascader.mjs [side] [component] [variant]
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
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

const side = process.argv[2] ?? 'vue';
const component = process.argv[3] ?? 'cascader';
const variant = process.argv[4] ?? 'basic';

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

const port = await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 300 } });
const errs = [];
page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errs.push(`console: ${m.text()}`);
});
page.on('requestfailed', (r) => errs.push(`reqfail: ${r.url()} ${r.failure()?.errorText}`));

const url = `http://127.0.0.1:${port}/${side}.html?component=${component}&variant=${variant}&theme=light`;
await page.goto(url, { waitUntil: 'networkidle' });
await page
  .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
  .catch(() => errs.push('__VISUAL_READY__ 未置位'));

const info = await page.evaluate(() => {
  const stage = document.querySelector('#stage');
  const out = {
    html: stage ? stage.outerHTML.slice(0, 4000) : '(no #stage)',
    sheets: [],
    computed: [],
    matched: [],
  };

  // 样式表清单
  for (const s of Array.from(document.styleSheets)) {
    let n = 0;
    try {
      n = s.cssRules?.length ?? 0;
    } catch (e) {
      n = -1;
    }
    out.sheets.push({ href: s.href, rules: n });
  }

  // 命中 cascader 的规则（前 12 条选择器）
  for (const s of Array.from(document.styleSheets)) {
    try {
      for (const r of Array.from(s.cssRules ?? [])) {
        const sel = r.selectorText ?? '';
        if (sel.includes('cascader') && out.matched.length < 12) out.matched.push(sel);
      }
    } catch (e) {
      /* ignore */
    }
  }

  // 关键节点 computed style
  const targets = [
    ['.apollo-cascader', 'root'],
    ['.apollo-cascader-picker', 'picker'],
    ['.apollo-cascader-selector', 'selector'],
    ['.apollo-cascader-input', 'input'],
    ['.apollo-cascader-menu', 'menu'],
    ['.apollo-cascader-menu-item', 'menu-item'],
    ['.apollo-cascader-dropdown', 'dropdown'],
  ];
  for (const [sel, label] of targets) {
    const el = stage?.querySelector(sel);
    if (!el) {
      out.computed.push({ label, sel, found: false });
      continue;
    }
    const cs = getComputedStyle(el);
    out.computed.push({
      label,
      sel,
      found: true,
      cls: el.className,
      width: cs.width,
      height: cs.height,
      border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      radius: cs.borderRadius,
      padding: cs.padding,
      display: cs.display,
      listStyle: cs.listStyleType,
      background: cs.backgroundColor,
      color: cs.color,
      fontSize: cs.fontSize,
      varControlWidth: cs.getPropertyValue('--apollo-cascader-control-width'),
    });
  }
  return out;
});

console.log('=== stylesheets ===');
console.log(JSON.stringify(info.sheets, null, 1));
console.log('=== cascader rules matched in sheets ===');
console.log(info.matched.join('\n') || '(none)');
console.log('=== computed ===');
for (const c of info.computed) console.log(JSON.stringify(c));
console.log('=== stage html (4k) ===');
console.log(info.html);
console.log('=== errors ===');
console.log(errs.join('\n') || '(none)');

await browser.close();
server.close();
