/**
 * probe-tabs-indicator.mjs — 在**真 Chrome** 里对比两侧的 `-ink-bar` 内联样式与关键尺寸。
 *
 * 用法：`node tests/visual/debug/probe-tabs-indicator.mjs`
 * （需要先跑过 `tests/visual/run.mjs --mode baseline` 生成 `.artifacts/`）
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.join(process.cwd(), 'tests/visual/.artifacts');
const PORT = 4407;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!existsSync(p) || !statSync(p).isFile()) {
    res.writeHead(404);
    res.end('nf');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] ?? 'application/octet-stream' });
  createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ channel: 'chrome' });
for (const side of ['react', 'vue']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 148 } });
  // ⚠️ 必须在 `goto` **之前**挂监听（`-ink-bar` 的样式在挂载期就写好了）
  page.on('console', (m) => {
    if (m.text().includes('[ind]')) console.log(side.toUpperCase(), 'CONSOLE', m.text());
  });
  await page.goto(
    `http://127.0.0.1:${PORT}/${side}/${side}.html?component=tabs&variant=basic&theme=light`,
    {
      waitUntil: 'load',
    },
  );
  await page.waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 15000 });
  const info = await page.evaluate(() => {
    const bar = document.querySelector('.apollo-tabs-ink-bar');
    const tabs = [...document.querySelectorAll('.apollo-tabs-tab')];
    const list = document.querySelector('.apollo-tabs-nav-list');
    const nav = document.querySelector('.apollo-tabs-nav');
    return {
      barStyle: bar?.getAttribute('style') ?? null,
      barRect: bar ? bar.getBoundingClientRect().toJSON() : null,
      tabs: tabs.map((t) => ({
        key: t.getAttribute('data-node-key'),
        w: t.getBoundingClientRect().width,
        left: t.getBoundingClientRect().left,
        style: t.getAttribute('style'),
      })),
      listRect: list ? list.getBoundingClientRect().toJSON() : null,
      navRect: nav ? nav.getBoundingClientRect().toJSON() : null,
    };
  });
  console.log(side.toUpperCase(), JSON.stringify(info, null, 1));
  await page.close();
}
await browser.close();
server.close();
