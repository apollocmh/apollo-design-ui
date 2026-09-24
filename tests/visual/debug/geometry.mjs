/**
 * 临时调试脚本：对比两侧关键元素的 getBoundingClientRect（定位 1px 级别的几何差异）。
 * 用法：node tests/visual/debug/geometry.mjs upload pictureCard
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

const component = process.argv[2] ?? 'upload';
const variant = process.argv[3] ?? 'pictureCard';
const VIEWPORT = { width: 1024, height: 768 };

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

const SELECTORS = [
  '.ant-upload-list-item, .apollo-upload-list-item',
  '.ant-upload-list-item-thumbnail, .apollo-upload-list-item-thumbnail',
  '.ant-upload-list-item-actions, .apollo-upload-list-item-actions',
  '.ant-upload-select, .apollo-upload-select',
  '.ant-upload-select .ant-btn, .apollo-upload-select .apollo-btn',
  '.ant-upload-list-item-container, .apollo-upload-list-item-container',
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });
const out = {};
for (const { side, port } of servers) {
  await page.goto(
    `http://127.0.0.1:${port}/${side}.html?component=${component}&variant=${variant}&theme=light`,
  );
  await page
    .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
    .catch(() => {});
  out[side] = await page.evaluate((selectors) => {
    const r = {};
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) {
        r[sel] = null;
        continue;
      }
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      r[sel] = {
        x: +b.x.toFixed(2),
        y: +b.y.toFixed(2),
        w: +b.width.toFixed(2),
        h: +b.height.toFixed(2),
        border: `${cs.borderTopWidth} ${cs.paddingTop}`,
      };
    }
    return r;
  }, SELECTORS);
}
await browser.close();
for (const { server } of servers) server.close();

for (const sel of SELECTORS) {
  const a = out.react[sel];
  const b = out.vue[sel];
  console.log(`\n=== ${sel} ===`);
  if (!a || !b) {
    console.log(`  react=${a ? 'ok' : 'MISSING'}  vue=${b ? 'ok' : 'MISSING'}`);
    continue;
  }
  for (const k of ['x', 'y', 'w', 'h', 'border']) {
    console.log(`  ${a[k] === b[k] ? '  ' : '≠ '}${k}: react=${a[k]} | vue=${b[k]}`);
  }
}
