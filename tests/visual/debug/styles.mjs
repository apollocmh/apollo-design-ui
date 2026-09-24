/**
 * 临时调试脚本：在两侧页面上取同一批选择器的 computed style，逐项对比。
 * 用法：node tests/visual/debug/styles.mjs upload basic
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
const variant = process.argv[3] ?? 'basic';

const sides = ['react', 'vue'];
const servers = [];
for (const side of sides) {
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

const PROPS = ['fontFamily', 'fontSize', 'lineHeight', 'color', 'fontWeight', 'height', 'width'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
const out = {};
for (const { side, port } of servers) {
  await page.goto(
    `http://127.0.0.1:${port}/${side}.html?component=${component}&variant=${variant}&theme=light`,
  );
  await page
    .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
    .catch(() => {});
  out[side] = await page.evaluate((props) => {
    const selectors = [
      'body',
      '.ant-upload-list-item-name, .apollo-upload-list-item-name',
      '.ant-upload-list-item .anticon, .apollo-upload-list-item .apollo-icon',
      '.ant-upload-list-item-action, .apollo-upload-list-item-action',
      '.ant-upload-select button, .apollo-upload-select button',
      'button',
      '.ant-upload-list-item, .apollo-upload-list-item',
    ];
    const result = {};
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) {
        result[sel] = null;
        continue;
      }
      const cs = getComputedStyle(el);
      result[sel] = Object.fromEntries(props.map((p) => [p, cs[p]]));
    }
    return result;
  }, PROPS);
}
await browser.close();
for (const { server } of servers) server.close();

for (const sel of Object.keys(out.react)) {
  const a = out.react[sel];
  const b = out.vue[sel];
  console.log(`\n=== ${sel} ===`);
  if (!a || !b) {
    console.log(`  react=${a ? 'ok' : 'MISSING'}  vue=${b ? 'ok' : 'MISSING'}`);
    continue;
  }
  for (const p of PROPS) {
    const same = a[p] === b[p];
    console.log(`  ${same ? '  ' : '≠ '}${p}: react=${a[p]} | vue=${b[p]}`);
  }
}
