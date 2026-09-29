#!/usr/bin/env node
/**
 * gen-workstreams.mjs
 *
 * 回答一个问题：**现在有哪些任务可以并行推进？**
 *
 * 为什么需要这个文件：
 *   `next-task.mjs` 只回答「下一个**一个**任务」。但本项目 85 个工作单元里有大量
 *   互不依赖的部分（7 个 foundation 泳道、7 个组件分组、横切基建）。串行推进会把
 *   13 个 foundation 包排成 13 个月，而它们实际只需要 3 个波次。
 *
 *   本脚本从 registry 现状 + registry/source/workstreams.mjs 的编排规则，推导出：
 *     - items      所有 Work Item 及其状态（done / ready / blocked / waiting-decision）
 *     - waves      每个波次的成员与完成度
 *     - currentBatch  当前可同时开工的最大集合（无 exclusive 冲突、遵守泳道并发上限）
 *
 * 推导 vs 手工：
 *   编排规则（泳道 / 冲突集 / 波次定义 / 横切任务）写在 registry/source/workstreams.mjs；
 *   成员归属、状态、批次**全部推导**，不手工维护，因此不会与 components.json 漂移。
 *
 * 用法：
 *   node registry/tools/gen-workstreams.mjs              # 生成 workstreams.json 并打印概览
 *   node registry/tools/gen-workstreams.mjs --json       # 机器可读
 *   node registry/tools/gen-workstreams.mjs --parallel   # 只打印当前可并行批次
 *   node registry/tools/gen-workstreams.mjs --check      # CI：不写入，文件过期则 exit 1
 *   node registry/tools/gen-workstreams.mjs --wave W2    # 查看单个波次
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONFLICT_SETS,
  CROSS_ITEMS,
  FOUNDATION_WAVE,
  WAVES,
  WORKSTREAMS,
} from '../source/workstreams.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const REGISTRY = path.join(ROOT, 'registry');
const OUT_FILE = path.join(REGISTRY, 'workstreams.json');

const args = { json: false, parallel: false, check: false, wave: null };
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a === '--json') args.json = true;
  else if (a === '--parallel') args.parallel = true;
  else if (a === '--check') args.check = true;
  else if (a === '--wave') args.wave = process.argv[++i];
  else if (a === '--help' || a === '-h') {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(0);
  }
}

function readJson(name) {
  const file = path.join(REGISTRY, name);
  if (!fs.existsSync(file)) {
    console.error(`[workstreams] missing ${name}. Run: node registry/tools/gen-registry.mjs`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const componentsDoc = readJson('components.json');
const foundationDoc = readJson('foundation.json');

// ---------------------------------------------------------------------------
// 索引
// ---------------------------------------------------------------------------
const WAVE_ORDER = WAVES.map((w) => w.id);
const waveNum = (id) => WAVE_ORDER.indexOf(id);

const wsById = new Map(WORKSTREAMS.map((w) => [w.id, w]));
const wsOfFoundation = new Map();
const wsOfGroup = new Map();
for (const ws of WORKSTREAMS) {
  for (const d of ws.foundation ?? []) wsOfFoundation.set(d, ws.id);
  if (ws.group) wsOfGroup.set(ws.group, ws.id);
}

/** 泳道并发上限：一个泳道同时最多几个 Item 在飞。component 泳道给 3（同组内互不依赖的组件）。 */
const MAX_PARALLEL = { foundation: 2, component: 3, crosscut: 1 };
function maxParallelOf(ws) {
  return ws.maxParallel ?? MAX_PARALLEL[ws.kind] ?? 1;
}

const EXCLUSIVE_SETS = new Set(
  CONFLICT_SETS.filter((c) => c.mode === 'exclusive').map((c) => c.id),
);

/** 开放决策：hardBlock 的会直接把 item 按在 waiting-decision */
const decisionById = new Map((foundationDoc.openDecisions ?? []).map((d) => [d.id, d]));
const hardBlockingDecisions = [...decisionById.values()].filter(
  (d) => d.status === 'open' && d.hardBlock,
);
/** 决策 id → 受影响的包名（用于把 decision 挂到 item 上） */
const decisionsBlockingPkg = new Map();
for (const d of foundationDoc.openDecisions ?? []) {
  if (d.status !== 'open') continue;
  for (const p of d.blocks ?? []) {
    if (!decisionsBlockingPkg.has(p)) decisionsBlockingPkg.set(p, []);
    decisionsBlockingPkg.get(p).push(d.id);
  }
}

// ---------------------------------------------------------------------------
// Work Item 构造
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Item
 * @property {string} id
 * @property {'foundation'|'poc'|'component'|'crosscut'} kind
 */
const items = [];

// —— foundation ——
const fndByDir = new Map(foundationDoc.packages.map((p) => [p.dir, p]));
for (const p of foundationDoc.packages) {
  const wsId = wsOfFoundation.get(p.dir) ?? 'WS-X';
  const ws = wsById.get(wsId);
  const wave = FOUNDATION_WAVE[p.dir] ?? 'W1';
  const depItems = p.dependsOn
    .map((n) => fndByDir.get(n.replace('@apollo-design/', ''))?.dir)
    .filter(Boolean)
    .map((d) => `FND:${d}`);

  // PoC 槽位：pocRequired 的包在 W1 就有一个纯验证任务，用来提前证伪架构风险
  if (p.pocRequired) {
    items.push({
      id: `FND:${p.dir}:poc`,
      kind: 'poc',
      ref: p.dir,
      title: `${p.name} — 架构风险 PoC`,
      workstream: wsId,
      wave: 'W1',
      dependsOn: [],
      conflicts: [...(ws?.shared ?? [])],
      status: p.pocStatus === 'done' ? 'done' : 'ready',
      pocOf: `FND:${p.dir}`,
      why: p.pocNote ?? '验证架构风险点，不做完整实现',
      decidedBy: [],
      complexity: 'M',
      unblocks: 1,
      doneWhen: [`PoC 结论写入 foundation.json 的 pocNote，并将 pocStatus 置为 done`],
    });
  }

  items.push({
    id: `FND:${p.dir}`,
    kind: 'foundation',
    ref: p.dir,
    title: `${p.name}`,
    workstream: wsId,
    wave,
    dependsOn: p.pocRequired ? [...depItems, `FND:${p.dir}:poc`] : depItems,
    conflicts: [...(ws?.shared ?? [])],
    status: p.status,
    decidedBy: decisionsBlockingPkg.get(p.name) ?? [],
    complexity: p.risk === 'high' ? 'L' : p.risk === 'medium' ? 'M' : 'S',
    unblocks: p.derived?.componentConsumers ?? 0,
    why: p.purpose,
    doneWhen: p.doneWhen ?? [],
    registryStatus: p.status,
    dimensions: p.dimensions,
  });
}

// —— components ——
for (const c of componentsDoc.components) {
  const wsId = wsOfGroup.get(c.group) ?? 'WS-7';
  const ws = wsById.get(wsId);
  const dag = c.derived?.dagLevel ?? 0;

  // 结构性波次：DAG 第 n 层 → W(4+n)，封顶 W8
  const structural = `W${Math.min(4 + dag, 8)}`;
  // foundation 波次：最晚的 foundation 依赖 + 1
  const fndWaveNum = Math.max(
    0,
    ...c.dependencies.foundation.map((n) => {
      const dir = n.replace('@apollo-design/', '');
      return waveNum(FOUNDATION_WAVE[dir] ?? 'W1');
    }),
  );
  const wave = WAVE_ORDER[Math.max(waveNum(structural), fndWaveNum + 1)];

  // 组件依赖组件：blockedBy 是组件名
  const depItems = (c.blockedBy ?? []).map((n) => `COMP:${n}`);
  // foundation 依赖：只把「尚未 completed」的登记为 blocking 说明，真正卡进度由 status 体现
  const fndDeps = c.dependencies.foundation
    .map((n) => n.replace('@apollo-design/', ''))
    .map((d) => `FND:${d}`);

  items.push({
    id: `COMP:${c.name}`,
    kind: 'component',
    ref: c.name,
    title: `${c.exportName}（${c.name}）`,
    workstream: wsId,
    wave,
    dependsOn: [...new Set([...depItems, ...fndDeps])],
    conflicts: [...(ws?.shared ?? [])],
    status: c.status,
    decidedBy: [],
    complexity: c.complexity,
    unblocks: c.derived?.unblocks ?? 0,
    why: c.notes ?? '',
    doneWhen: [],
    group: c.group,
    priority: c.priority,
    dagLevel: dag,
  });
}

// —— 横切 ——
//
// ⚠️ 横切项的**完成状态跨运行保留**（与组件侧同判，2026-09-30 补）。
//    此前 `status` 写死成 `'todo'` 且源文件无 `status` 字段 ⇒ 这 5 项永远停在 `ready`，
//    没有任何地方能声明「我完成了」。取值优先级：
//      源文件 `status` > 上一次生成结果里的 `status` > `'todo'`
const prevCrossById = (() => {
  if (!fs.existsSync(OUT_FILE)) return new Map();
  const prev = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  return new Map((prev.items ?? []).map((i) => [i.id, i]));
})();

for (const x of CROSS_ITEMS) {
  const ws = wsById.get(x.workstream) ?? wsById.get('WS-X');
  const prev = prevCrossById.get(x.id);
  items.push({
    id: x.id,
    kind: 'crosscut',
    ref: x.id,
    title: x.title,
    workstream: x.workstream,
    wave: x.wave,
    dependsOn: x.dependsOn ?? [],
    conflicts: [...(ws?.shared ?? [])],
    // 见上：源文件优先，其次保留上一次生成的值
    status: x.status ?? prev?.status ?? 'todo',
    decidedBy: x.decidedBy ? [x.decidedBy] : [],
    complexity: 'M',
    unblocks: x.unblocksAll ? items.length : 0,
    why: x.why,
    doneWhen: x.doneWhen ?? [],
    // 完成证据（`status: 'done'` 时 E18 强制要求，见 registry/source/workstreams.mjs 的说明）
    ...((x.completedAt ?? prev?.completedAt)
      ? { completedAt: x.completedAt ?? prev?.completedAt }
      : {}),
    ...((x.evidence ?? prev?.evidence) ? { evidence: x.evidence ?? prev?.evidence } : {}),
  });
}

// ---------------------------------------------------------------------------
// 状态求解
// ---------------------------------------------------------------------------
const byId = new Map(items.map((i) => [i.id, i]));
const DONE = new Set(['completed', 'done']);

for (const it of items) {
  if (DONE.has(it.status)) {
    it.status = 'done';
    it.blockers = [];
    continue;
  }
  const blockers = [];
  for (const d of it.dependsOn) {
    const dep = byId.get(d);
    if (!dep) continue;
    if (!DONE.has(dep.status)) blockers.push({ type: 'dep', id: d, status: dep.status });
  }
  for (const dId of it.decidedBy ?? []) {
    const d = decisionById.get(dId);
    if (d && d.status === 'open') {
      blockers.push({
        type: 'decision',
        id: dId,
        hardBlock: Boolean(d.hardBlock),
        question: d.question,
      });
    }
  }
  // 三类阻塞必须分开，否则「可以开工但收不了口」会被误报成「不能开工」：
  //   dep           依赖未完成          ⇒ blocked
  //   decision hard 硬阻塞的开放决策     ⇒ waiting-decision
  //   decision soft 软阻塞的开放决策     ⇒ 仍然 ready，但 cannotFinish = true
  const depBlockers = blockers.filter((b) => b.type === 'dep');
  const hardDec = blockers.filter((b) => b.type === 'decision' && b.hardBlock);
  const softDec = blockers.filter((b) => b.type === 'decision' && !b.hardBlock);

  it.blockers = depBlockers.concat(hardDec);
  it.softBlockers = softDec.map((b) => b.id);
  it.cannotFinish = softDec.length > 0;
  if (hardDec.length) it.status = 'waiting-decision';
  else if (depBlockers.length) it.status = 'blocked';
  else it.status = 'ready';
}

// ---------------------------------------------------------------------------
// 当前可并行批次
//
// 规则：
//   1. status === 'ready'
//   2. 任意两个选中项的 exclusive 冲突集不相交
//   3. 同一泳道内选中数 ≤ 该泳道的并发上限
//   贪心：按 (wave, priority, -unblocks, complexity) 排序后逐个尝试加入。
// ---------------------------------------------------------------------------
const ready = items.filter((i) => i.status === 'ready');

function rankOf(it) {
  const P = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'];
  const C = ['S', 'M', 'L', 'XL'];
  return [
    waveNum(it.wave),
    it.kind === 'crosscut' ? 0 : 1,
    P.indexOf(it.priority ?? 'P2'),
    -(it.unblocks ?? 0),
    C.indexOf(it.complexity ?? 'M'),
    it.id,
  ];
}
function cmp(a, b) {
  const ra = rankOf(a);
  const rb = rankOf(b);
  for (let i = 0; i < ra.length; i += 1) {
    if (ra[i] < rb[i]) return -1;
    if (ra[i] > rb[i]) return 1;
  }
  return 0;
}

function buildBatch(pool) {
  const sorted = [...pool].sort(cmp);
  const chosen = [];
  // setId → 占用它的泳道集合。
  // 只跨泳道互斥：同一泳道内的多个 Item 本来就由 maxParallel 限流，
  // 若再按冲突集互相排除，泳道里永远只能跑一个 —— 那是把「限流」误实现成「禁用」。
  const usedExclusive = new Map();
  const laneLoad = new Map();
  for (const it of sorted) {
    const ws = wsById.get(it.workstream);
    if ((laneLoad.get(it.workstream) ?? 0) >= maxParallelOf(ws ?? {})) continue;
    const excl = (it.conflicts ?? []).filter((c) => EXCLUSIVE_SETS.has(c));
    const clashes = excl.some((c) => {
      const owners = usedExclusive.get(c);
      return owners && owners.size > 0 && !owners.has(it.workstream);
    });
    if (clashes) continue;
    chosen.push(it);
    for (const c of excl) {
      if (!usedExclusive.has(c)) usedExclusive.set(c, new Set());
      usedExclusive.get(c).add(it.workstream);
    }
    laneLoad.set(it.workstream, (laneLoad.get(it.workstream) ?? 0) + 1);
  }
  return chosen;
}

const currentBatch = buildBatch(ready);

// ---------------------------------------------------------------------------
// 波次聚合
// ---------------------------------------------------------------------------
const waves = WAVES.map((w) => {
  const members = items.filter((i) => i.wave === w.id);
  const doneCount = members.filter((i) => i.status === 'done').length;
  const readyCount = members.filter((i) => i.status === 'ready').length;
  return {
    ...w,
    itemCount: members.length,
    doneCount,
    readyCount,
    blockedCount: members.filter((i) => i.status === 'blocked').length,
    waitingCount: members.filter((i) => i.status === 'waiting-decision').length,
    complete: members.length > 0 && doneCount === members.length,
    itemIds: members.map((i) => i.id).sort(),
    workstreams: [...new Set(members.map((i) => i.workstream))].sort(),
  };
});

// ---------------------------------------------------------------------------
// 泳道聚合
// ---------------------------------------------------------------------------
const workstreams = WORKSTREAMS.map((ws) => {
  const members = items.filter((i) => i.workstream === ws.id);
  return {
    id: ws.id,
    name: ws.name,
    kind: ws.kind,
    why: ws.why,
    owns: ws.owns ?? [],
    shared: ws.shared ?? [],
    maxParallel: maxParallelOf(ws),
    itemCount: members.length,
    doneCount: members.filter((i) => i.status === 'done').length,
    readyCount: members.filter((i) => i.status === 'ready').length,
    itemIds: members.map((i) => i.id).sort(),
  };
});

// ---------------------------------------------------------------------------
// 文档
// ---------------------------------------------------------------------------
const byStatus = {};
for (const i of items) byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;

const doc = {
  $schema: './schema.json#/definitions/WorkstreamFile',
  $comment:
    'GENERATED by registry/tools/gen-workstreams.mjs from registry/{components,foundation}.json + registry/source/workstreams.mjs. 编排规则写在 source/ 里，成员/状态/批次全部推导，勿手工编辑本文件的 items。',
  antdVersion: componentsDoc.antdVersion,
  generatedAt: new Date().toISOString(),
  sourceFacts:
    'components.json（组件 DAG / 分组 / 状态） + foundation.json（包状态 / 依赖 / 开放决策） + source/workstreams.mjs（泳道 / 冲突集 / 波次 / 横切任务）',
  legend: {
    status: {
      done: '已完成',
      ready: '依赖已满足，可以开工',
      blocked: '有未完成的依赖',
      'waiting-decision': '只被 hardBlock 的开放决策挡住，需要用户裁决',
    },
    conflictMode: {
      exclusive: '开发期互斥：同一时刻只能一个 Item 改这些路径',
      serialized: '提交期排序：可并行开发，合并时按条目排序',
    },
    wave: '批次号 = max(结构性波次 W(4+dagLevel), 最晚 foundation 依赖波次 + 1)',
    currentBatch: '当前可同时开工的最大集合（无 exclusive 冲突 + 遵守泳道并发上限）',
  },
  summary: {
    totalItems: items.length,
    byStatus,
    byKind: items.reduce((acc, i) => {
      acc[i.kind] = (acc[i.kind] ?? 0) + 1;
      return acc;
    }, {}),
    readyCount: ready.length,
    /** 可以开工、但因软阻塞的开放决策而**收不了口**（无法置 completed）的 Item 数 */
    cannotFinishCount: ready.filter((i) => i.cannotFinish).length,
    currentBatchSize: currentBatch.length,
    currentBatchIds: currentBatch.map((i) => i.id),
    hardBlockingDecisionCount: hardBlockingDecisions.length,
    parallelismNote:
      'currentBatchSize 是「同一时刻可开工数」的下界估计（贪心）。真实并行度还取决于执行者数量。',
  },
  conflictSets: CONFLICT_SETS,
  workstreams,
  waves,
  items,
  currentBatch: currentBatch.map((i) => i.id),
};

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------
const prevDoc = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : null;

function stripTimestamps(o) {
  const s = JSON.stringify(o, (k, v) => (k === 'generatedAt' ? undefined : v));
  return s;
}

if (args.json) {
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}

if (args.check) {
  if (!prevDoc) {
    console.error('[workstreams] registry/workstreams.json 不存在');
    process.exit(1);
  }
  if (stripTimestamps(doc) !== stripTimestamps(prevDoc)) {
    console.error('[workstreams] registry/workstreams.json 已过期（输入变化）。运行:');
    console.error('  node registry/tools/gen-workstreams.mjs');
    process.exit(1);
  }
  console.log('✅ workstreams.json 与输入一致');
  process.exit(0);
}

if (args.wave) {
  const w = waves.find((x) => x.id === args.wave);
  if (!w) {
    console.error(`[workstreams] unknown wave ${args.wave}. 可用: ${WAVE_ORDER.join(', ')}`);
    process.exit(1);
  }
  console.log(`\n=== ${w.id} · ${w.name} ===`);
  console.log(`目标        ${w.goal}`);
  console.log(`进入条件    ${w.entryCriteria}`);
  console.log(
    `进度        ${w.doneCount}/${w.itemCount} done  ${w.readyCount} ready  ${w.blockedCount} blocked  ${w.waitingCount} waiting-decision`,
  );
  console.log(`泳道        ${w.workstreams.join(', ')}`);
  console.log('\n退出条件:');
  for (const e of w.exitCriteria) console.log(`  - ${e}`);
  console.log('\n成员:');
  for (const id of w.itemIds) {
    const it = byId.get(id);
    console.log(`  ${it.status.padEnd(17)} ${it.id.padEnd(28)} [${it.workstream}] ${it.title}`);
  }
  console.log();
  process.exit(0);
}

// --parallel：只打印当前批次，供执行者直接领取
if (args.parallel) {
  console.log(`\n当前可并行开工 ${currentBatch.length} 个（共 ${ready.length} 个 ready）：\n`);
  const byWs = new Map();
  for (const it of currentBatch) {
    if (!byWs.has(it.workstream)) byWs.set(it.workstream, []);
    byWs.get(it.workstream).push(it);
  }
  for (const [wsId, list] of byWs) {
    const ws = wsById.get(wsId);
    console.log(`${wsId} · ${ws?.name ?? ''}`);
    for (const it of list) {
      const flag = it.cannotFinish ? `  ⚠ ${it.softBlockers.join(', ')}` : '';
      console.log(`   ${it.id.padEnd(30)} ${it.title}${flag}`);
    }
    console.log();
  }
  if (ready.length > currentBatch.length) {
    const deferred = ready.filter((i) => !currentBatch.includes(i));
    console.log(
      `另有 ${deferred.length} 个 ready 因泳道并发上限或冲突集被推迟到下一批：${deferred.map((i) => i.id).join(', ')}`,
    );
  }
  console.log(`\n领取单个任务: node registry/tools/next-task.mjs --foundation`);
  console.log(`查看某个波次: node registry/tools/gen-workstreams.mjs --wave W1\n`);
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(doc, null, 2)}\n`);
  process.exit(0);
}

// 默认：打印概览
console.log(`\n@apollo-design/ui — 并行编排（antd v${doc.antdVersion}）`);
console.log(
  `${items.length} 个 Work Item  |  done ${byStatus.done ?? 0}  |  ready ${ready.length}  |  blocked ${byStatus.blocked ?? 0}  |  waiting-decision ${byStatus['waiting-decision'] ?? 0}`,
);
console.log(
  `${WORKSTREAMS.length} 条泳道  |  ${WAVES.length} 个波次  |  ${CONFLICT_SETS.length} 个冲突集（${EXCLUSIVE_SETS.size} 个开发期互斥）\n`,
);

console.log('=== 波次 ===');
for (const w of waves) {
  const bar =
    w.itemCount === 0
      ? '（无成员）'
      : '█'.repeat(w.doneCount) + '·'.repeat(w.itemCount - w.doneCount);
  console.log(
    `${w.id}  ${String(w.name).padEnd(26)} ${`${w.doneCount}/${w.itemCount}`.padStart(7)}  ${bar}`,
  );
}

console.log(`\n=== 当前可并行开工（${currentBatch.length} 个）===`);
if (!currentBatch.length) {
  console.log('  （无）所有未完成任务都被依赖或开放决策挡住。');
} else {
  for (const it of currentBatch) {
    const flag = it.cannotFinish ? '  ⚠收口被开放决策挡住' : '';
    console.log(`  [${it.workstream}] ${it.id}${flag}`);
    console.log(`      ${it.title}`);
    if (it.why) console.log(`      ${String(it.why).slice(0, 110)}`);
  }
}

if (hardBlockingDecisions.length) {
  console.log(`\n⛔ 硬阻塞的开放决策（${hardBlockingDecisions.length}）:`);
  for (const d of hardBlockingDecisions) console.log(`   [${d.id}] ${d.question}`);
}
const softDecisions = [...decisionById.values()].filter((d) => d.status === 'open' && !d.hardBlock);
if (softDecisions.length) {
  console.log(`\n⏸  待裁决的开放决策（${softDecisions.length}，不硬阻塞但会卡住收口）:`);
  for (const d of softDecisions) {
    const n = (d.blocks ?? []).length;
    console.log(`   [${d.id}] ${d.question}${n ? `  (影响 ${n} 个包)` : ''}`);
  }
  console.log(`\n   详情: node registry/tools/foundation-status.mjs`);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`\n写入 registry/workstreams.json`);
console.log(`详情    node registry/tools/gen-workstreams.mjs --wave W2`);
console.log(`批次    node registry/tools/gen-workstreams.mjs --parallel\n`);
