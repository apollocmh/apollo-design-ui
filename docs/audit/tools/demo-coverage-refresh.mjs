/**
 * 阶段 2 收口统计：以阶段 0 的上游清单为基线，重算本地 demo 文件与场景名重合度。
 *
 * 输入：docs/audit/evidence/demo-coverage.json（阶段 0，含每个组件的 upstreamNames）
 * 默认输出：docs/audit/evidence/demo-coverage-stage2.json（保留旧 CLI 行为）
 * 新审计请指定 --output，保留带日期的历史证据：
 * node docs/audit/tools/demo-coverage-refresh.mjs --output docs/audit/evidence/demo-coverage-2026-10-24.json
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const BASELINE = path.join(ROOT, 'docs/audit/evidence/demo-coverage.json');
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0 && !process.argv[outputIndex + 1]) throw new Error('--output requires a path');
const OUT =
  outputIndex >= 0
    ? path.resolve(process.argv[outputIndex + 1])
    : path.join(ROOT, 'docs/audit/evidence/demo-coverage-stage2.json');
const UI_SRC = path.join(ROOT, 'packages/ui/src');

const norm = (name) => name.toLowerCase().replace(/[-_]/g, '');
const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));

const rows = baseline.map((entry) => {
  const dir = path.join(UI_SRC, entry.name, 'demo');
  const localNames = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.vue'))
        .map((file) => file.slice(0, -4))
        .sort()
    : [];
  const localSet = new Set(localNames.map(norm));
  const overlap = (entry.upstreamNames ?? []).filter((name) => localSet.has(norm(name)));
  return {
    ...entry,
    localBefore: entry.local,
    local: localNames.length,
    localNames,
    gap: entry.upstream ? entry.upstream - localNames.length : null,
    overlapCount: overlap.length,
    overlapNames: overlap,
    overlapRatio: entry.upstreamNames?.length
      ? Number((overlap.length / entry.upstreamNames.length).toFixed(3))
      : null,
  };
});

const comparable = rows.filter((row) => typeof row.upstream === 'number' && row.upstream > 0);
const below = comparable.filter((row) => row.local < row.upstream);
const localTotal = comparable.reduce((sum, row) => sum + row.local, 0);
const upstreamTotal = comparable.reduce((sum, row) => sum + row.upstream, 0);
const overlapTotal = comparable.reduce((sum, row) => sum + row.overlapCount, 0);
const upstreamNamesTotal = comparable.reduce(
  (sum, row) => sum + (row.upstreamNames?.length ?? 0),
  0,
);
const lowOverlap = comparable
  .filter((row) => (row.overlapRatio ?? 0) < 0.5)
  .sort((a, b) => (a.overlapRatio ?? 0) - (b.overlapRatio ?? 0));

const summary = {
  generatedAt: new Date().toISOString(),
  comparableComponents: comparable.length,
  localTotal,
  upstreamTotal,
  localRatio: Number((localTotal / upstreamTotal).toFixed(3)),
  componentsBelowUpstream: below.length,
  overlapTotal,
  upstreamNamesTotal,
  overlapRatio: Number((overlapTotal / upstreamNamesTotal).toFixed(3)),
  lowOverlapComponents: lowOverlap.map((row) => ({
    name: row.name,
    local: row.local,
    upstream: row.upstream,
    overlapRatio: row.overlapRatio,
  })),
  rows,
};

fs.writeFileSync(OUT, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`✅ ${OUT}`);
console.log(
  JSON.stringify(
    {
      localTotal,
      upstreamTotal,
      localRatio: summary.localRatio,
      componentsBelowUpstream: below.length,
      overlapRatio: summary.overlapRatio,
      lowOverlap: lowOverlap.length,
    },
    null,
    2,
  ),
);
console.log('新增最多的 15 个组件：');
for (const row of [...rows]
  .sort((a, b) => b.local - b.localBefore - (a.local - a.localBefore))
  .slice(0, 15)) {
  console.log(`  ${row.name}: ${row.localBefore} → ${row.local}（上游 ${row.upstream ?? '-'}）`);
}
