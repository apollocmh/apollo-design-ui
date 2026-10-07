/**
 * 把「种子源」里已裁决决策的运行时状态写进 foundation.json。
 *
 * 为什么需要它：mergeOpenDecisions 的 DECISION_RUNTIME_KEYS（status/decision/decidedAt/
 * decidedBy/note）**以 foundation.json 为优先** ⇒ 只在 open-decisions.mjs 里把
 * `open()` 改成 `decided()` 是不够的，`ask.mjs decision <id>` 仍会显示 open。
 * 两处必须同时改（见 .workbuddy-ai/memory/MEMORY.md）。
 *
 * 用法：node registry/tools/sync-decision-runtime.mjs <id> [...]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { OPEN_DECISIONS } from '../source/open-decisions.mjs';

const file = new URL('../foundation.json', import.meta.url);
const foundation = JSON.parse(readFileSync(file, 'utf8'));
const ids = process.argv.slice(2);

if (!ids.length) {
  console.error('用法: node registry/tools/sync-decision-runtime.mjs <id> [...]');
  process.exit(1);
}

let changed = 0;
for (const id of ids) {
  const seed = OPEN_DECISIONS.find((d) => d.id === id);
  if (!seed) {
    console.error(`种子里没有决策 ${id}`);
    process.exit(1);
  }
  if (seed.status !== 'decided') {
    console.error(`决策 ${id} 在种子里还是 ${seed.status}，先改 open-decisions.mjs`);
    process.exit(1);
  }
  const target = foundation.openDecisions.find((d) => d.id === id);
  if (!target) {
    console.error(`foundation.json 里没有决策 ${id}`);
    process.exit(1);
  }
  target.status = seed.status;
  target.decision = seed.decision;
  target.decidedAt = seed.decidedAt;
  target.decidedBy = seed.decidedBy;
  target.note = seed.note ?? null;
  changed += 1;
  console.log(`已同步 ${id}: ${target.status}`);
}

writeFileSync(file, `${JSON.stringify(foundation, null, 2)}\n`);
console.log(`写出 foundation.json（同步 ${changed} 条）`);
