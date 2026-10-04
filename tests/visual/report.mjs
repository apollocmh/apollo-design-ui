/**
 * report.mjs — 生成 HTML 视觉回归报告。
 *
 * 报告的目的不是「好看」，而是让人工分类能在**一个页面**里完成：
 * 每个 case 并排显示 React 参考 / Vue 实现 / diff 图，附上差异率与判定依据。
 * 分类（BUG / INTENDED / PLATFORM / UPSTREAM）记到 `COMPATIBILITY.md`，不记在这里。
 */

import fs from 'node:fs';
import path from 'node:path';

import { LIMITATIONS, VIEWPORTS } from './matrix.mjs';

/**
 * @param {object} opts
 * @param {string} opts.outDir  报告输出目录（截图都在这个目录下，用相对路径引用）
 * @param {Array}  opts.results 每个 case 的比对结果
 * @param {object} opts.meta    运行元信息（浏览器、时间、模式…）
 * @param {string} [opts.fileName] 报告文件名（默认 `report.html`）。
 *   ⚠️ shard 并行时必须各自不同，否则 4 个 shard 会互相覆盖同一份报告。
 */
export function writeReport({ outDir, results, meta, fileName = 'report.html' }) {
  const passed = results.filter((r) => r.verdict === 'PASS');
  const failed = results.filter((r) => r.verdict === 'FAIL');

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>视觉回归报告 · ${escapeHtml(meta.component)}</title>
<style>
  :root { color-scheme: light; }
  body {
    font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0; padding: 24px 32px; background: #fff; color: #1f2328;
  }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 8px; }
  .summary { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; }
  .pill { padding: 4px 12px; border-radius: 999px; font-size: 13px; border: 1px solid; }
  .pill.pass { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
  .pill.fail { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
  .pill.info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f9fafb; font-weight: 600; }
  td img { display: block; max-width: 260px; border: 1px solid #e5e7eb; background: #fff; }
  .figs { display: flex; gap: 10px; }
  .fig { flex: 0 0 auto; }
  .fig span { display: block; font-size: 12px; color: #6b7280; margin-bottom: 2px; }
  code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
  .reason { font-size: 12px; color: #6b7280; }
  .ok { color: #065f46; } .bad { color: #991b1b; }
  .note { background: #fffbeb; border: 1px solid #fde68a; padding: 10px 14px; border-radius: 6px; margin: 12px 0; }
</style>
</head>
<body>
<h1>视觉回归报告 · <code>${escapeHtml(meta.component)}</code></h1>
<div class="meta">
  模式 <code>${escapeHtml(meta.mode)}</code> ·
  浏览器 <code>${escapeHtml(meta.browser)}</code> ·
  antd <code>${escapeHtml(meta.antdVersion)}</code> ·
  ${escapeHtml(meta.timestamp)}
</div>

<div class="summary">
  <span class="pill ${failed.length === 0 ? 'pass' : 'fail'}">${passed.length} 通过</span>
  <span class="pill ${failed.length === 0 ? 'pass' : 'fail'}">${failed.length} 失败</span>
  <span class="pill info">共 ${results.length} 组</span>
  <span class="pill info">阈值 ${(meta.maxDiffRatio * 100).toFixed(1)}%</span>
</div>

<h2>未覆盖维度（显式声明，不是遗漏）</h2>
<table>
  <tr><th style="width:120px">维度</th><th style="width:260px">未覆盖</th><th>原因</th><th style="width:220px">何时解除</th></tr>
  ${LIMITATIONS.map(
    (l) => `<tr>
      <td><code>${escapeHtml(l.dimension)}</code></td>
      <td>${l.missing.map((m) => `<code>${escapeHtml(m)}</code>`).join(' ')}</td>
      <td>${escapeHtml(l.reason)}</td>
      <td>${escapeHtml(l.unblockWhen)}</td>
    </tr>`,
  ).join('')}
</table>

<h2>逐组结果</h2>
<table>
  <tr>
    <th style="width:210px">case</th>
    <th style="width:140px">viewport</th>
    <th style="width:96px">判定</th>
    <th style="width:170px">差异</th>
    <th>React 参考 / Vue 实现 / diff</th>
  </tr>
  ${results.map(row).join('')}
</table>

<h2>尺寸基准</h2>
<table>
  <tr><th>viewport</th><th>宽 × 高</th></tr>
  ${VIEWPORTS.map((v) => `<tr><td><code>${escapeHtml(v.id)}</code></td><td>${v.width} × ${v.height}</td></tr>`).join('')}
</table>

<script>/* 静态报告，无脚本 */</script>
</body>
</html>
`;

  const file = path.join(outDir, fileName);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(file, html);
  return { file, passed: passed.length, failed: failed.length };
}

function row(r) {
  const vp = `${r.width}×${r.height}`;
  const verdictCls = r.verdict === 'PASS' ? 'ok' : 'bad';
  const ratio = r.diffRatio === undefined ? '—' : `${(r.diffRatio * 100).toFixed(4)}%`;
  const iso = r.isolatedRatio === undefined ? '—' : `${((r.isolatedRatio ?? 0) * 100).toFixed(1)}%`;
  const size =
    r.reactSize && r.vueSize
      ? `${r.reactSize.width}×${r.reactSize.height} / ${r.vueSize.width}×${r.vueSize.height}`
      : '—';

  return `<tr>
    <td><code>${escapeHtml(r.id)}</code><div class="reason">${escapeHtml(r.message ?? '')}</div></td>
    <td><code>${escapeHtml(r.viewport)}</code><div class="reason">${vp}</div></td>
    <td class="${verdictCls}"><strong>${escapeHtml(r.verdict)}</strong><div class="reason">${escapeHtml(r.reason ?? '')}</div></td>
    <td>${ratio}<div class="reason">散点 ${iso}｜${size}</div></td>
    <td>
      <div class="figs">
        <div class="fig"><span>React</span><img src="${escapeHtml(r.relReact)}" alt="react" /></div>
        <div class="fig"><span>Vue</span><img src="${escapeHtml(r.relVue)}" alt="vue" /></div>
        <div class="fig"><span>diff</span><img src="${escapeHtml(r.relDiff)}" alt="diff" /></div>
      </div>
    </td>
  </tr>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}
