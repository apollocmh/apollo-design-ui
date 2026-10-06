/**
 * 临时调试：对比两侧某选择器的 bounding rect（定位 1px 级位移的来源）。
 * 用法：node tests/visual/debug/rect.mjs <component> <variant> <apollo-sel> <ant-sel>
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

const [
  component = 'cascader',
  variant = 'basic',
  apolloSel = '.apollo-cascader',
  antSel = '.ant-cascader',
] = process.argv.slice(2);

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const side = pathname.split('/')[1];
  const file = path.join(ARTIFACTS, pathname);
  if (!file.startsWith(ARTIFACTS) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('nf');
    return;
  }
  void side;
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const port = await new Promise((r) =>
  server.listen(0, '127.0.0.1', () => r(server.address().port)),
);

const browser = await chromium.launch();
for (const [side, sel] of [
  ['react', antSel],
  ['vue', apolloSel],
]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 300 } });
  await page.goto(
    `http://127.0.0.1:${port}/${side}/${side}.html?component=${component}&variant=${variant}&theme=light`,
    { waitUntil: 'networkidle' },
  );
  await page
    .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
  const info = await page
    .evaluate((s) => {
      const els = Array.from(document.querySelectorAll(s));
      return els.map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          cls: el.className,
          x: +r.x.toFixed(3),
          y: +r.y.toFixed(3),
          w: +r.width.toFixed(3),
          h: +r.height.toFixed(3),
          lh: cs.lineHeight,
          fs: cs.fontSize,
          ff: cs.fontFamily.split(',')[0],
          bt: `${cs.borderTopWidth} ${cs.borderTopColor}`,
          bb: `${cs.borderBottomWidth} ${cs.borderBottomColor}`,
          bi: `${cs.borderInlineEndWidth} ${cs.borderInlineEndColor}`,
          rad: cs.borderRadius,
          pad: cs.padding,
          bg: cs.backgroundColor,
        };
      });
    }, sel)
    .catch(() => []);
  console.log(side, sel, JSON.stringify(info, null, 1));
  await page.close();
}
await browser.close();
server.close();
