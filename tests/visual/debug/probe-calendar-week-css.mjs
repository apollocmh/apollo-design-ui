/**
 * 临时调试脚本：把两侧**运行时样式表**里与 `cell-week` 有关的规则原文打出来。
 *
 * 用法：node tests/visual/debug/probe-calendar-week-css.mjs
 *
 * 背景：`calendar/week` 三张基线 block-diff。探针已确认周号内层的 `height`
 * React=116px / Vue=24px（其余全同）⇒ 差异在那条 `height: calc(...)` 上。
 * React 侧的 CSS 由 cssinjs **运行时注入** ⇒ 产物文件里搜不到，只能从页面读。
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

const servers = [];
for (const side of ['react', 'vue']) {
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
  servers.push({ side, port, server });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 900 } });

for (const { side, port } of servers) {
  await page.goto(
    `http://127.0.0.1:${port}/${side}.html?component=calendar&variant=week&theme=light`,
  );
  await page
    .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 15000 })
    .catch(() => {});
  const rules = await page.evaluate(() => {
    const out = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let list;
      try {
        list = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(list ?? [])) {
        const text = rule.cssText ?? '';
        if (text.includes('cell-week') && text.includes('cell-inner')) {
          const i = text.indexOf('height:');
          out.push(text.slice(0, 60) + ' … ' + (i >= 0 ? text.slice(i, i + 400) : '(无 height)'));
        }
      }
    }
    return out;
  });
  console.log(`\n########## ${side} ##########`);
  for (const r of rules) console.log(`  ${r}\n`);
}
await browser.close();
for (const { server } of servers) server.close();
