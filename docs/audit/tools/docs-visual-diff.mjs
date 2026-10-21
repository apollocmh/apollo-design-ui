/**
 * 文档站视觉回归（DOC-10）：组件页内容区截图 vs 已入库基线。
 *
 * 用法：
 *   node docs/audit/tools/docs-visual-diff.mjs --update   # 生成/更新基线
 *   node docs/audit/tools/docs-visual-diff.mjs            # 比对当前截图
 *
 * 前置：生产 preview 运行在 DOCS_URL（默认 http://127.0.0.1:4477/apollo-design-ui）。
 * 动画统一关闭（reduced-motion + CSS !important），避免时间线导致假差异。
 * 输出：tests/visual/{baselines,current,diff}/docs/**、docs/audit/evidence/visual-docs.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { comparePair, MAX_DIFF_RATIO } from '../../../tests/visual/compare.mjs';

const BASE = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const ROOT = path.resolve('tests/visual');
const BASELINE = path.join(ROOT, 'baselines/docs');
const CURRENT = path.join(ROOT, 'current/docs');
const DIFF = path.join(ROOT, 'diff/docs');
const OUT = path.resolve('docs/audit/evidence/visual-docs.json');
const UPDATE = process.argv.includes('--update');

const PAGES = [
  { name: 'button-light', url: 'components/button', theme: 'light' },
  { name: 'button-dark', url: 'components/button', theme: 'dark' },
  { name: 'float-button-light', url: 'components/float-button', theme: 'light' },
  { name: 'date-picker-light', url: 'components/date-picker', theme: 'light' },
  { name: 'select-light', url: 'components/select', theme: 'light' },
  { name: 'modal-light', url: 'components/modal', theme: 'light' },
  { name: 'upload-light', url: 'components/upload', theme: 'light' },
  { name: 'form-light', url: 'components/form', theme: 'light' },
  { name: 'icon-light', url: 'components/icon', theme: 'light' },
];

const DISABLE_ANIM =
  '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
  colorScheme: 'light',
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const report = { generatedAt: new Date().toISOString(), pages: [] };

for (const item of PAGES) {
  await page.goto(`${BASE}/${item.url}`, { waitUntil: 'networkidle' });
  if (item.theme === 'dark') {
    await page.evaluate(() => {
      document.documentElement.dataset.apolloTheme = 'dark';
    });
  } else {
    await page.evaluate(() => {
      delete document.documentElement.dataset.apolloTheme;
    });
  }
  await page.addStyleTag({ content: DISABLE_ANIM });
  // 等示例真正渲染完（动态 import 的占位消失），再固定 300ms 让布局稳定。
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll('.demo-renderer-loading').length === 0 &&
        !document.querySelector('.page-loading'),
      undefined,
      { timeout: 30_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(300);

  // 组件页与图标页共有的内容容器（图标页没有 `.component-page`）
  const target = page.locator('.site-content').first();
  const baselinePath = path.join(BASELINE, `${item.name}.png`);
  const currentPath = path.join(CURRENT, `${item.name}.png`);
  const diffPath = path.join(DIFF, `${item.name}.png`);
  fs.mkdirSync(path.dirname(currentPath), { recursive: true });

  if (UPDATE) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    await target.screenshot({ path: baselinePath, animations: 'disabled' });
    report.pages.push({ name: item.name, mode: 'update' });
    continue;
  }

  await target.screenshot({ path: currentPath, animations: 'disabled' });
  const result = await comparePair(baselinePath, currentPath, diffPath);
  report.pages.push({
    name: item.name,
    verdict: result.verdict,
    diffRatio: 'diffRatio' in result ? result.diffRatio : undefined,
    reason: result.reason,
    message: result.message,
  });
}

await browser.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);

if (UPDATE) {
  console.log(`✅ 已更新 ${report.pages.length} 张基线：${BASELINE}`);
} else {
  const failed = report.pages.filter((p) => p.verdict !== 'PASS');
  for (const p of report.pages) {
    const detail = p.diffRatio === undefined ? '' : `（diff ${(p.diffRatio * 100).toFixed(3)}%）`;
    console.log(`${p.verdict === 'PASS' ? '✅' : '❌'} ${p.name}${detail}`);
  }
  if (failed.length > 0) {
    console.error(
      `❌ 视觉回归失败 ${failed.length} 项（阈值 ${MAX_DIFF_RATIO * 100}%），diff 见 ${DIFF}`,
    );
    process.exitCode = 1;
  } else {
    console.log('✅ 视觉回归全部通过');
  }
}
