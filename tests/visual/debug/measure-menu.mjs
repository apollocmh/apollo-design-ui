/** 量 menu inline 页里 item 的 rect 与计算样式（临时调试）。 */
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
  `http://127.0.0.1:${port}/${side}.html?component=menu&variant=horizontal&theme=light`,
);
await page
  .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
  .catch(() => {});
await page.waitForTimeout(1200);
const info = await page.evaluate((sideArg) => {
  const cls =
    sideArg === 'react'
      ? 'ant-menu-horizontal .ant-menu-item'
      : 'apollo-menu-horizontal .apollo-menu-item';
  const li = document.querySelector(`.${cls}`);
  const span = li?.querySelector('[class*=title-content]');
  const cs = li ? getComputedStyle(li) : null;
  return JSON.stringify({
    li: li
      ? (({ x, y, width, height }) => ({ x, y, width, height }))(li.getBoundingClientRect())
      : null,
    margin: cs?.margin,
    display: cs?.display,
    position: cs?.position,
    opacity: cs?.opacity,
    lineHeight: cs?.lineHeight,
    padding: cs?.padding,
    spanX: span?.getBoundingClientRect().x,
  });
}, side);
console.log(`[${side}]`, info);
await browser.close();
server.close();
