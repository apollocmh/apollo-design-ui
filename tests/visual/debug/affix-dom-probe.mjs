import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT =
  '/Users/nanren/WorkBuddy/Worktrees/apollo-design-ui/master-15e7f018/tests/visual/.artifacts';
const PORT = 4399;

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
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(`console.error: ${m.text()}`);
  });
  const url = `http://127.0.0.1:${PORT}/${side}/${side}.html?component=affix&variant=basic&theme=light`;
  await page.goto(url, { waitUntil: 'load' });
  try {
    await page.waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 8000 });
  } catch {
    console.log(`${side}: READY 超时`);
  }
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const stage = document.querySelector('#stage');
    const affix = document.querySelector('.apollo-affix, .ant-affix');
    return {
      stageHTML: stage ? stage.innerHTML.slice(0, 600) : '(无 #stage)',
      stageHeight: stage ? stage.getBoundingClientRect().height : -1,
      affixClass: affix ? affix.className : '(无固钉层)',
      affixStyle: affix ? affix.getAttribute('style') : '(无)',
      placeholder: document.querySelector('[aria-hidden="true"]')
        ? '有占位层'
        : '无占位层',
      bodyH: document.body.scrollHeight,
    };
  });
  console.log(`\n===== ${side} =====`);
  console.log('stage 高度:', info.stageHeight, '| body scrollHeight:', info.bodyH);
  console.log('固钉层类名:', info.affixClass, '| style:', info.affixStyle);
  console.log('占位层:', info.placeholder);
  console.log('stage HTML:', info.stageHTML.slice(0, 420));
  console.log(`${side} 错误:`, errs.length ? errs.join(' | ').slice(0, 260) : '(无)');
  await ctx.close();
}
await browser.close();
server.close();
