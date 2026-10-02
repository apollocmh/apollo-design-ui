/**
 * 临时探针：`timeline/horizontal` 的 **4px 高度差**（React 94 vs Vue 98）定位。
 *
 * 两侧 DOM 结构**完全相同**（已用 `dump.mjs` + 归一化 diff 证实）⇒ 差异在**计算样式**。
 * 本探针在**同一视口**下取两侧关键元素的 computed style，逐项对比。
 *
 * 用法：node tests/visual/debug/probe-timeline-horizontal.mjs [width]
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

const width = Number(process.argv[2] ?? 768);
const component = 'timeline';
const variant = 'horizontal';

/** 要对比的选择器（与两侧前缀无关）。 */
const SELECTORS = [
  '#stage > div',
  'ol',
  'li:nth-child(1)',
  'li:nth-child(1) > div',
  'li:nth-child(1) > div > div:nth-child(2)',
  'li:nth-child(1) > div > div:nth-child(2) > div:nth-child(1)',
  'li:nth-child(1) > div > div:nth-child(2) > div:nth-child(2)',
];

const PROPS = [
  'height',
  'paddingTop',
  'paddingBottom',
  'marginTop',
  'marginBottom',
  'borderTopWidth',
  'borderBottomWidth',
  'lineHeight',
  'alignItems',
  'minHeight',
];

/** 为某一侧起一个静态 server（照 `dump.mjs` 的写法 —— 根目录就是那一侧）。 */
async function serve(side) {
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
  return { server, port };
}

const browser = await chromium.launch();
const results = {};

for (const side of ['react', 'vue']) {
  const { server, port } = await serve(side);
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const url = `http://127.0.0.1:${port}/${side}.html?component=${component}&variant=${variant}&theme=light`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page
    .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 10000 })
    .catch(() => {});
  results[side] = await page.evaluate(
    ({ sels, props }) => {
      const out = {};
      for (const sel of sels) {
        const el = document.querySelector(sel);
        if (!el) {
          out[sel] = null;
          continue;
        }
        const cs = getComputedStyle(el);
        const o = {};
        for (const p of props) o[p] = cs[p];
        const r = el.getBoundingClientRect();
        o.__rect = `${Math.round(r.width)}x${Math.round(r.height)}`;
        out[sel] = o;
      }
      return out;
    },
    { sels: SELECTORS, props: PROPS },
  );
  await page.close();
  server.close();
}

await browser.close();

console.log(`viewport width = ${width}\n`);
for (const sel of SELECTORS) {
  const r = results.react[sel];
  const v = results.vue[sel];
  if (!r || !v) {
    console.log(`${sel}\n  (缺元素) react=${r ? '有' : '无'} vue=${v ? '有' : '无'}\n`);
    continue;
  }
  const diffs = Object.keys(r).filter((k) => r[k] !== v[k]);
  if (diffs.length === 0) {
    console.log(`${sel}\n  ✅ 一致（${r.__rect}）\n`);
  } else {
    console.log(`${sel}\n  ❌ 差异:`);
    for (const k of diffs) console.log(`     ${k}: react=${r[k]}  vue=${v[k]}`);
    console.log('');
  }
}
