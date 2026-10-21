/**
 * 把 capture.mjs 的 metrics*.json 生成 Markdown 表（人工结论写在 V3-BASELINE.md）。
 *
 * 运行：node docs/audit/visual-v3/summarize.mjs [metrics.json]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('docs/audit/visual-v3');
const input = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'metrics.json');
const report = JSON.parse(fs.readFileSync(input, 'utf8'));

const fmt = (v) => (v === null || v === undefined ? '—' : v);
const esc = (v) => String(v).replace(/\|/g, '\\|');

const lines = [];
lines.push(`# Metrics · ${path.basename(input)}`);
lines.push('');
lines.push(
  `采样时间：${report.capturedAt}；Ant Design 官网版本 **${report.antVersion}**；` +
    `viewports：${report.widths.join(' / ')}；语言 en-US；DPR 1。`,
);
lines.push('');
lines.push(
  '> 只做同尺寸量测与截图，不做跨尺寸像素评分。内容列宽度单位 px；' +
    '`content` = Ant article / Apollo `.site-content`；`prose` = 正文文字容器。',
);
lines.push('');

const pageOrder = report.pages ?? [...new Set(report.rows.map((r) => r.page))];

for (const page of pageOrder) {
  const rows = report.rows.filter((r) => r.page === page && r.theme === 'light');
  if (rows.length === 0) continue;
  lines.push(`## ${page}`);
  lines.push('');
  lines.push(
    '| width | side | content | prose | sidebar | toc | demo count | card | columns | gap | canvas pad | title/desc | API font / pad | overflowX |',
  );
  lines.push('|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|');
  for (const row of rows.sort((a, b) => a.width - b.width || a.side.localeCompare(b.side))) {
    const layout = row.demo.layout ?? {};
    const api = row.api;
    lines.push(
      [
        row.width,
        row.side,
        fmt(row.content?.w),
        fmt(row.prose?.w),
        fmt(row.sidebar?.w),
        fmt(row.toc?.w),
        fmt(row.demo.count),
        fmt(row.demo.card?.w && `${row.demo.card.w}×${row.demo.card.h}`),
        fmt(layout.columns),
        fmt(layout.gap),
        esc(fmt(row.demo.canvasPadding)),
        `${fmt(row.demo.titleFontSize)}/${fmt(row.demo.descFontSize)}`,
        api ? `${fmt(api.fontSize)} / ${esc(fmt(api.cellPadding))}` : '—',
        row.doc?.overflowX ? '**YES**' : 'no',
      ].join(' | '),
    );
  }
  lines.push('');
}

const dark = report.rows.filter((r) => r.theme === 'dark');
if (dark.length) {
  lines.push('## dark · 对照');
  lines.push('');
  lines.push('| page | width | side | body bg | header bg | card bg | canvas bg | api header bg |');
  lines.push('|---|---:|---|---|---|---|---|---|');
  for (const row of dark.sort((a, b) => a.width - b.width || a.side.localeCompare(b.side))) {
    lines.push(
      [
        row.page,
        row.width,
        row.side,
        row.body?.background,
        row.header && row.body ? '—' : '—',
        row.demo.canvasBackground,
        row.demo.canvasBackground,
        row.api?.headerBackground ?? '—',
      ]
        .map(esc)
        .join(' | '),
    );
  }
  lines.push('');
}

fs.writeFileSync(path.join(ROOT, 'metrics.md'), `${lines.join('\n')}\n`);
console.log(`✅ ${path.join(ROOT, 'metrics.md')}`);
