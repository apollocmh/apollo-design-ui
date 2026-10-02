/**
 * 临时调试脚本：定位 `calendar` 的 `week` 变体在两侧的**几何/样式**差异。
 *
 * 用法：node tests/visual/debug/probe-calendar-week.mjs [viewportWidth]
 *
 * 背景：`calendar/week__light__*` 三张基线 block-diff（0.03%~0.12%）——
 * 周号数字在 React 侧贴着行顶、在 Vue 侧落到行中间。DOM 结构已 dump 过、**两侧一致**
 * （周号是每行第一个 `<td class="{p}-cell-week">`）⇒ 差异只能在 CSS。
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

const width = Number(process.argv[2] ?? 375);

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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });

const out = {};
for (const { side, port } of servers) {
  const p = side === 'react' ? 'ant' : 'apollo';
  await page.goto(
    `http://127.0.0.1:${port}/${side}.html?component=calendar&variant=week&theme=light`,
  );
  await page
    .waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 15000 })
    .catch(() => {});
  out[side] = await page.evaluate((prefix) => {
    const cell = `.${prefix}-picker-cell-week`;
    const inner = `${cell} .${prefix}-picker-cell-inner`;
    const row = `${cell}`;
    const table = `.${prefix}-picker-content`;
    const props = [
      'display',
      'position',
      'width',
      'height',
      'lineHeight',
      'verticalAlign',
      'padding',
      'paddingTop',
      'borderTopWidth',
      'boxSizing',
      'textAlign',
    ];
    const dump = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        rect: {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        },
        style: Object.fromEntries(props.map((k) => [k, cs[k]])),
      };
    };
    return {
      table: dump(table),
      row: dump(row),
      inner: dump(inner),
      firstDateCell: dump(`.${prefix}-picker-cell-in-view`),
      rowClass: document.querySelector(`.${prefix}-picker-content tbody tr`)?.className ?? null,
      panelClass:
        document.querySelector(`.${prefix}-date-panel`)?.className ??
        document.querySelector(`.${prefix}-week-panel`)?.className ??
        null,
    };
  }, p);
}
await browser.close();
for (const { server } of servers) server.close();

for (const key of ['panelClass', 'rowClass']) {
  console.log(`\n### ${key}`);
  console.log(`  react: ${out.react[key]}`);
  console.log(`  vue  : ${out.vue[key]}`);
}

for (const sel of ['table', 'row', 'inner', 'firstDateCell']) {
  console.log(`\n=== ${sel} ===`);
  const a = out.react[sel];
  const b = out.vue[sel];
  if (!a || !b) {
    console.log(`  react=${a ? 'ok' : 'MISSING'}  vue=${b ? 'ok' : 'MISSING'}`);
    continue;
  }
  console.log(`  rect react=${JSON.stringify(a.rect)}`);
  console.log(`  rect vue  =${JSON.stringify(b.rect)}`);
  for (const k of Object.keys(a.style)) {
    const same = a.style[k] === b.style[k];
    console.log(`  ${same ? '  ' : '≠ '}${k}: react=${a.style[k]} | vue=${b.style[k]}`);
  }
}
