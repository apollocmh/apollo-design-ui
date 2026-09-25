/** 量 dropdown basicOpen 页里按钮与浮层的 rect（临时调试）。 */
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
  const btnCls = sideArg === 'react' ? '.ant-dropdown-trigger' : '.apollo-dropdown-trigger';
  const popCls = sideArg === 'react' ? '.ant-dropdown' : '.apollo-dropdown';
  const menuCls = sideArg === 'react' ? '.ant-dropdown-menu' : '.apollo-dropdown-menu';
  const btn = document.querySelector(btnCls);
  const pop = document.querySelector(popCls);
  const menu = document.querySelector(menuCls);
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: r.x, y: r.y, w: r.width, h: r.height, minWidth: cs.minWidth, padding: cs.padding };
  };
  return JSON.stringify({ btn: rect(btn), pop: rect(pop), menu: rect(menu) });
}, side);
console.log(`[${side}]`, info);
await browser.close();
server.close();
