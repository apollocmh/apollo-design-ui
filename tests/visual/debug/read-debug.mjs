/** 读取视觉页面里 Trigger 暴露的 alignPopup 输入（临时调试）。 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const ARTIFACTS = '/Users/nanren/Code/apollo-design-ui/tests/visual/.artifacts';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const root = path.join(ARTIFACTS, 'vue');
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
await page.setViewportSize({ width: 1024, height: 768 });
await page.goto(
  'http://127.0.0.1:' + port + '/vue.html?component=tooltip&variant=basicOpen&theme=light',
);
await page
  .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
  .catch(() => {});
const dbg = await page.evaluate(() => {
  const inp = window.__APOLLO_ALIGN_INPUT__;
  const st = window.__APOLLO_TRIGGER_DEBUG__;
  return JSON.stringify({
    hasInput: Boolean(inp),
    input: inp ?? null,
    offsetY: st && st._value ? st._value.offsetY : null,
    points: st && st._value && st._value.align ? st._value.align.points : null,
  });
});
console.log(dbg);
await browser.close();
server.close();
