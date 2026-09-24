/** 量 popover purePanel 页面里两个面板的 rect（临时调试）。 */
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
  `http://127.0.0.1:${port}/${side}.html?component=popover&variant=purePanel&theme=light`,
);
await page
  .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
  .catch(() => {});
await page.waitForTimeout(1200);
const info = await page.evaluate((sideArg) => {
  const sel = sideArg === 'react' ? '.ant-popover-pure' : '.apollo-popover-pure';
  const panels = Array.from(document.querySelectorAll(sel));
  return JSON.stringify(
    panels.map((p) => {
      const r = p.getBoundingClientRect();
      const cs = getComputedStyle(p);
      return { y: r.y, h: r.height, w: r.width, margin: cs.margin, display: cs.display };
    }),
  );
}, side);
console.log(`[${side}]`, info);
await browser.close();
server.close();
