/** 量 dropdown item 内部文字 span 与伪元素（临时调试）。 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const ARTIFACTS = '/Users/nanren/Code/apollo-design-ui/tests/visual/.artifacts';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const side = process.argv[2] ?? 'react';
const root = path.join(ARTIFACTS, side);
const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.join(root, pathname);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('nf');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const port = await new Promise((r) =>
  server.listen(0, '127.0.0.1', () => r(server.address().port)),
);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(
  `http://127.0.0.1:${port}/${side}.html?component=dropdown&variant=basicOpen&theme=light`,
);
await page
  .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
  .catch(() => {});
await page.waitForTimeout(1200);
const info = await page.evaluate((sideArg) => {
  const itemSel =
    sideArg === 'react'
      ? '.ant-dropdown .ant-dropdown-menu-item'
      : '.apollo-dropdown .apollo-dropdown-menu-item';
  const item = document.querySelector(itemSel);
  if (!item) return 'no item';
  const r = item.getBoundingClientRect();
  const cs = getComputedStyle(item);
  const span = item.querySelector('span');
  const sr = span?.getBoundingClientRect();
  // li 的 ::before（选中态条）与 innerHTML
  const before = getComputedStyle(item, '::before');
  return JSON.stringify({
    li: { x: r.x, y: r.y, w: r.width, h: r.height },
    padding: cs.padding,
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    span: sr ? { x: sr.x, y: sr.y, w: sr.width } : null,
    beforeW: before.width,
    beforeContent: before.content,
    inner: item.innerHTML.slice(0, 120),
  });
}, side);
console.log(`[${side}]`, info);
await browser.close();
server.close();
