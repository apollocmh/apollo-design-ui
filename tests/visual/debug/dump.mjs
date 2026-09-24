/**
 * 临时调试脚本：用 Playwright 打开已构建的视觉页面，打印 #stage 的 HTML 与 body 尾部 与页面错误。
 * 用法：node tests/visual/debug/dump.mjs react upload pictureCard
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
const component = process.argv[3] ?? 'upload';
const variant = process.argv[4] ?? 'pictureCard';

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
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errs.push(`console: ${m.text()}`);
});
const url = `http://127.0.0.1:${port}/${side}.html?component=${component}&variant=${variant}&theme=light`;
await page.goto(url, { waitUntil: 'networkidle' });
await page
  .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
  .catch(() => errs.push('__VISUAL_READY__ 未置位'));
const html = await page.$eval('#stage', (el) => el.outerHTML).catch(() => '(no #stage)');
console.log(html.slice(0, 3000));
console.log('--- errors ---');
console.log(errs.join('\n') || '(none)');
await browser.close();
server.close();
