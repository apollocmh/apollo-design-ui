/**
 * probe-form-label.mjs — 逐边量 `form/label` 用例里 label 与 `-item-optional` 的几何/计算样式。
 *
 * 背景：L6 的 `form/label__light__*` 三张图都是 block-diff（0.11%~0.22%），
 * 差异集中在「(optional)」那一小块。DOM 契约（L4 的 `form:required-mark-optional`）
 * 是逐节点一致的，所以根因只能在 CSS。本脚本把两侧的实测值打出来定位。
 *
 * 用法：node tests/visual/debug/probe-form-label.mjs        # 两侧都量
 *       node tests/visual/debug/probe-form-label.mjs react  # 只量一侧
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.resolve(HERE, '../.artifacts');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const wanted = process.argv[2] ? [process.argv[2]] : ['react', 'vue'];

const browser = await chromium.launch();

for (const side of wanted) {
  const root = path.join(ARTIFACTS, side);
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.join(root, pathname);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
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

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    `http://127.0.0.1:${port}/${side}.html?component=form&variant=label&theme=light`,
    { waitUntil: 'networkidle' },
  );
  await page.waitForFunction(() => window.__VISUAL_READY__ === true, { timeout: 15000 });

  const data = await page.evaluate(() => {
    const pick = (el, props) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const out = { rect: el.getBoundingClientRect().toJSON() };
      for (const p of props) out[p] = cs.getPropertyValue(p);
      out.text = (el.textContent ?? '').slice(0, 40);
      return out;
    };
    const labels = [...document.querySelectorAll('[class*="item-label"]')];
    return {
      labelCount: labels.length,
      labels: labels.map((el) =>
        pick(el, ['overflow', 'white-space', 'flex-grow', 'flex-basis', 'width', 'max-width']),
      ),
      optionalSpans: [...document.querySelectorAll('[class*="item-optional"]')].map((el) =>
        pick(el, ['display', 'visibility', 'opacity', 'color', 'font-size', 'margin-inline-start']),
      ),
      labelInner: [...document.querySelectorAll('[class*="item-label"] > label')].map((el) =>
        pick(el, ['display', 'max-width', 'height', 'overflow', 'font-size']),
      ),
    };
  });
  console.log(`\n===== ${side} =====`);
  console.log(JSON.stringify(data, null, 1));

  await page.close();
  server.close();
}

await browser.close();
