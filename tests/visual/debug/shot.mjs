/** 复刻 run.mjs 的基线截图流程（临时调试）。 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { newStablePage, screenshotElement, stabilizePage } from '../stabilize.mjs';

const ARTIFACTS = '/Users/nanren/Code/apollo-design-ui/tests/visual/.artifacts';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const root = path.join(ARTIFACTS, 'react');
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
const stab = await import('../stabilize.mjs');
const browser = (await stab.launchBrowser()).browser;
const { page } = await newStablePage(
  { newContext: (o) => browser.newContext(o) },
  { width: 1024, height: 768 },
);
await page.goto(
  `http://127.0.0.1:${port}/react.html?component=tooltip&variant=basicOpen&theme=light`,
  { waitUntil: 'load' },
);
await page.waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 20000 });
await stabilizePage(page);
const tail = await page.evaluate(() => document.body.innerHTML.slice(-700));
console.log('--- tail ---');
console.log(tail);
await screenshotElement(page, '#stage', '/tmp/replica-stage.png');
console.log('shot saved');
await browser.close();
server.close();
