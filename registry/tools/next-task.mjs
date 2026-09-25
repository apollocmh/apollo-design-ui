#!/usr/bin/env node
/**
 * next-task.mjs
 *
 * 回答一个问题：**下一个最该做什么？**
 *
 * 这是 AGENTS.md §3 规定的「唯一权威的任务来源」。
 * Agent 不允许自己挑组件，必须使用本脚本的输出。
 *
 * 选择算法（不可手动绕过）：
 *   1. 过滤 status === 'completed'
 *   2. 过滤 blockedBy 中仍有未 completed 项的组件（除非 --include-blocked）
 *   3. 按 priority 升序（P0 → P5）
 *   4. 同优先级按 unblocks 降序（能解锁更多下游的优先）
 *   5. 同分按 complexity 升序（先做小的，快速验证流水线）
 *   6. 同分按 dagLevel 升序
 *
 * 用法：
 *   node registry/tools/next-task.mjs                # 输出下一个任务
 *   node registry/tools/next-task.mjs --explain      # 展示完整候选排序与理由
 *   node registry/tools/next-task.mjs --json         # 机器可读输出
 *   node registry/tools/next-task.mjs --all          # 列出全部候选
 *   node registry/tools/next-task.mjs --include-blocked
 *   node registry/tools/next-task.mjs --component button   # 查看指定组件的详情
 *   node registry/tools/next-task.mjs --foundation   # 查看 foundation 包的就绪情况
 *   node registry/tools/next-task.mjs --parallel     # 列出当前**全部**可并行开工的任务
 *   node registry/tools/next-task.mjs --workstream WS-C   # 查看单条泳道的任务
 *
 * --parallel 与默认模式的区别：
 *   默认模式只给一个「最该做的」，适合单人串行推进；
 *   --parallel 给出当前可同时开工的**最大集合**（已排除开发期互斥的冲突集、
 *   已遵守泳道并发上限），适合多人/多会话并行。两者都从同一份 DAG 推导，不会打架。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const REGISTRY = path.join(ROOT, 'registry');

const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'];
const COMPLEXITY_ORDER = ['S', 'M', 'L', 'XL'];

const args = {
  explain: false,
  json: false,
  all: false,
  includeBlocked: false,
  component: null,
  foundation: false,
  requireFoundation: false,
  parallel: false,
  workstream: null,
};
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a === '--explain') args.explain = true;
  else if (a === '--json') args.json = true;
  else if (a === '--all') args.all = true;
  else if (a === '--include-blocked') args.includeBlocked = true;
  else if (a === '--component') args.component = process.argv[++i];
  else if (a === '--foundation') args.foundation = true;
  else if (a === '--require-foundation') args.requireFoundation = true;
  else if (a === '--parallel') args.parallel = true;
  else if (a === '--workstream') args.workstream = process.argv[++i];
  else if (a === '--help' || a === '-h') {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(0);
  }
}

function readJson(name) {
  const file = path.join(REGISTRY, name);
  if (!fs.existsSync(file)) {
    console.error(`[next] missing ${file}. Run: node registry/tools/gen-registry.mjs`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * 组件的维度清单（11 项：antdApi / api / compat / token / style / unit / interaction /
 * type / a11y / visual / docs）—— 唯一来源是 `registry/schema.json` 的
 * `Component.required`。工具与文档都不再各写一份。
 */
function componentDimensions() {
  const schema = readJson('schema.json');
  return schema.definitions.Component.required.filter((k) => k.endsWith('Status'));
}

const componentsDoc = readJson('components.json');
// 注意：foundation 包的信息现在读 registry/foundation.json（见下方 --foundation 分支），
// 不再需要 dependencies.json —— 那里只有包的静态定义，没有进度。
const components = componentsDoc.components;

// ---------------------------------------------------------------------------
// --component <name>：查看单个组件详情
// ---------------------------------------------------------------------------
if (args.component) {
  const c = components.find((x) => x.name === args.component);
  if (!c) {
    console.error(`[next] unknown component: ${args.component}`);
    const near = components.filter((x) => x.name.includes(args.component)).map((x) => x.name);
    if (near.length) console.error(`[next] did you mean: ${near.join(', ')}`);
    process.exit(1);
  }
  if (args.json) {
    console.log(JSON.stringify(c, null, 2));
    process.exit(0);
  }
  console.log(`\n=== ${c.name} (${c.exportName}) ===`);
  console.log(`group       ${c.group}`);
  console.log(`priority    ${c.priority}  complexity ${c.complexity}  status ${c.status}`);
  console.log(`antd        v${c.antdVersion}`);
  console.log(
    `规模        ${c.derived.antdBuildLineCount} 行构建产物 / ${c.derived.antdFileCount} 文件`,
  );
  console.log(`DAG         level ${c.derived.dagLevel}, unblocks ${c.derived.unblocks} 个下游组件`);
  console.log(`依赖组件    ${c.dependencies.components.join(', ') || '（无）'}`);
  console.log(`类型依赖    ${c.dependencies.typeOnly.join(', ') || '（无）'}`);
  console.log(`叶子模块    ${c.dependencies.leafModules.join(', ') || '（无）'}`);
  console.log(`需要 foundation  ${c.dependencies.foundation.join(', ')}`);
  console.log(`rc 依赖     ${c.dependencies.rcPackages.join(', ') || '（无）'}`);
  console.log(
    `Token       ${c.derived.tokenCount} 个${c.derived.tokenGroup ? ` (组: ${c.derived.tokenGroup})` : ''}`,
  );
  console.log(`blockedBy   ${c.blockedBy.join(', ') || '（无）'}`);
  console.log(`blockers    ${c.blockers.length ? JSON.stringify(c.blockers, null, 2) : '（无）'}`);
  console.log('\n各维度状态:');
  // ⚠️ 维度清单**从 schema 读**，不在这里手写第二份：2026-09-25 发现工具里硬编码的
  // 7 项（含根本不存在的 `testStatus`）与 registry 数据的 11 项已经不一致了很久
  // —— 三方（数据 / schema / 工具）各写一份必然漂移。判据：schema 的
  // `Component.required` 里以 `Status` 结尾的键就是全部维度。
  for (const f of componentDimensions()) {
    console.log(`  ${f.padEnd(16)} ${c[f] ?? '（缺失）'}`);
  }
  if (c.notes) console.log(`\n备注: ${c.notes}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// --foundation：foundation 包进度与下一个可做的包
// ---------------------------------------------------------------------------
if (args.foundation) {
  const file = path.join(REGISTRY, 'foundation.json');
  if (!fs.existsSync(file)) {
    console.error('[next] 缺少 registry/foundation.json');
    console.error('[next] 运行: node registry/tools/foundation-status.mjs');
    process.exit(1);
  }
  const fdoc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pkgs = [...fdoc.packages].sort((a, b) => a.phase2Order - b.phase2Order);
  const openDecisions = (fdoc.openDecisions ?? []).filter((d) => d.status === 'open');

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          antdVersion: fdoc.antdVersion,
          summary: fdoc.summary,
          nextPackage: fdoc.summary.nextPackage,
          nextImplementable: fdoc.summary.nextImplementable,
          packages: pkgs.map((p) => ({
            name: p.name,
            layer: p.layer,
            status: p.status,
            phase2Order: p.phase2Order,
            implOrder: p.derived.implOrder,
            risk: p.risk,
            pocRequired: p.pocRequired,
            pocStatus: p.pocStatus,
            blockedBy: p.blockedBy,
            componentConsumers: p.derived.componentConsumers,
            coverage: p.verification.coverage.statements,
            build: p.verification.build.status,
          })),
          openDecisions: openDecisions.map((d) => ({
            id: d.id,
            question: d.question,
            impact: d.impact,
            hardBlock: d.hardBlock,
            recommendation: d.recommendation,
          })),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  console.log(`\n=== Foundation 包进度（antd v${fdoc.antdVersion}）===`);
  console.log(
    `${fdoc.summary.completedCount}/${fdoc.summary.total} completed  |  已实测验证 ${fdoc.summary.verifiedCount}  |  构建通过 ${fdoc.summary.buildPassingCount}\n`,
  );
  for (const p of pkgs) {
    const flags = [
      p.blockedBy.length ? `⛔${p.blockedBy.length}` : '',
      p.pocRequired && p.pocStatus !== 'done' ? '⚠PoC' : '',
    ]
      .filter(Boolean)
      .join(' ');
    console.log(
      `${String(p.phase2Order).padStart(2)}. ${p.name.padEnd(32)} [${p.layer}] ${p.status.padEnd(13)} ${flags}`,
    );
    console.log(`      purpose    ${p.purpose}`);
    console.log(`      replaces   ${p.replaces.join(', ')}`);
    console.log(`      消费者     ${p.derived.componentConsumers} 个组件`);
    console.log(`      implOrder  ${p.derived.implOrder}（与 phase2Order 不同处即 PoC 槽位）`);
    console.log(`      就绪标准   ${p.readiness}`);
    if (p.blockedBy.length) console.log(`      ⛔ 被阻塞   ${p.blockedBy.join(', ')}`);
    console.log();
  }

  if (openDecisions.length) {
    console.log(`⏸  等待裁决的开放决策（${openDecisions.length} 项）:`);
    for (const d of openDecisions) {
      console.log(`   [${d.id}] ${d.question}`);
      console.log(`      影响: ${d.impact}`);
    }
    console.log();
  }

  console.log(`下一个（按推进顺序）      ${fdoc.summary.nextPackage ?? '（无）'}`);
  console.log(`下一个（可开始完整实现）  ${fdoc.summary.nextImplementable ?? '（无）'}`);
  console.log(`\n详情  node registry/tools/foundation-status.mjs --package <dir>`);
  console.log();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// --parallel / --workstream：并行视图
//
// 默认模式回答「下一个**一个**任务」；并行视图回答「现在**有哪些**任务可以同时开工」。
// 数据来自 registry/workstreams.json（由 gen-workstreams.mjs 从同一份 DAG 推导），
// 因此两个视图不可能给出互相矛盾的结论。
// ---------------------------------------------------------------------------
function readWorkstreams() {
  const file = path.join(REGISTRY, 'workstreams.json');
  if (!fs.existsSync(file)) {
    console.error('[next] 缺少 registry/workstreams.json');
    console.error('[next] 运行: node registry/tools/gen-workstreams.mjs');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

if (args.parallel || args.workstream) {
  const wdoc = readWorkstreams();
  const itemById = new Map(wdoc.items.map((i) => [i.id, i]));
  const wsById = new Map(wdoc.workstreams.map((w) => [w.id, w]));

  const list = args.workstream
    ? wdoc.items.filter((i) => i.workstream === args.workstream)
    : wdoc.summary.currentBatchIds.map((id) => itemById.get(id));

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          generatedAt: wdoc.generatedAt,
          summary: wdoc.summary,
          items: list.map((i) => ({
            id: i.id,
            kind: i.kind,
            title: i.title,
            workstream: i.workstream,
            wave: i.wave,
            status: i.status,
            cannotFinish: i.cannotFinish,
            softBlockers: i.softBlockers,
            unblocks: i.unblocks,
            complexity: i.complexity,
          })),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  if (args.workstream) {
    const ws = wsById.get(args.workstream);
    if (!ws) {
      console.error(`[next] unknown workstream: ${args.workstream}`);
      console.error(`[next] 可用: ${[...wsById.keys()].join(', ')}`);
      process.exit(1);
    }
    console.log(`\n=== ${ws.id} · ${ws.name}（${ws.kind}，并发上限 ${ws.maxParallel}）===`);
    console.log(`${ws.why}`);
    console.log(`\n${ws.doneCount}/${ws.itemCount} done  ${ws.readyCount} ready\n`);
    for (const it of list.sort((a, b) => a.wave.localeCompare(b.wave))) {
      const mark = { done: '✔', ready: '▸', blocked: '·', 'waiting-decision': '⛔' }[it.status];
      console.log(`${mark} [${it.wave}] ${it.status.padEnd(16)} ${it.id}`);
      if (it.softBlockers?.length) console.log(`      收口被挡: ${it.softBlockers.join(', ')}`);
    }
    console.log();
    process.exit(0);
  }

  console.log(
    `\n当前可并行开工 ${list.length} 个（全部 ready ${wdoc.summary.readyCount} 个，共 ${wdoc.summary.totalItems} 个 Work Item）`,
  );
  if (wdoc.summary.cannotFinishCount) {
    console.log(
      `⚠ 其中 ${wdoc.summary.cannotFinishCount} 个可以开工但**收不了口** —— 有软阻塞的开放决策未裁决。`,
    );
  }
  console.log();
  const byWs = new Map();
  for (const it of list) {
    if (!byWs.has(it.workstream)) byWs.set(it.workstream, []);
    byWs.get(it.workstream).push(it);
  }
  for (const [wsId, group] of byWs) {
    const ws = wsById.get(wsId);
    console.log(`${wsId} · ${ws?.name ?? ''}`);
    for (const it of group) {
      const flag = it.cannotFinish ? `   ⚠ ${(it.softBlockers ?? []).join(', ')}` : '';
      console.log(`   ${it.id.padEnd(30)} ${it.title}${flag}`);
      if (it.unblocks) console.log(`   ${''.padEnd(30)} 解锁 ${it.unblocks} 个下游`);
    }
    console.log();
  }
  console.log(`单个任务详情  node registry/tools/next-task.mjs --foundation`);
  console.log(`波次视图      node registry/tools/gen-workstreams.mjs --wave W1`);
  console.log();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 选择算法
// ---------------------------------------------------------------------------
const completed = new Set(components.filter((c) => c.status === 'completed').map((c) => c.name));

function rank(c) {
  return [
    PRIORITY_ORDER.indexOf(c.priority),
    -c.derived.unblocks,
    COMPLEXITY_ORDER.indexOf(c.complexity),
    c.derived.dagLevel ?? 0,
    c.name,
  ];
}

function compare(a, b) {
  const ra = rank(a);
  const rb = rank(b);
  for (let i = 0; i < ra.length; i += 1) {
    if (ra[i] < rb[i]) return -1;
    if (ra[i] > rb[i]) return 1;
  }
  return 0;
}

const notCompleted = components.filter((c) => c.status !== 'completed');
const ready = notCompleted.filter((c) => c.blockedBy.length === 0);
const blocked = notCompleted.filter((c) => c.blockedBy.length > 0);

// ---------------------------------------------------------------------------
// foundation 就绪度。
// 组件清单里的 blockedBy 只表达「组件依赖组件」，不表达「组件依赖 foundation 包」。
// 结果是 next-task 会把 empty(P0) 报成下一个任务，而它依赖的 @apollo-design/theme
// 还只有骨架 —— Agent 照着做就必然产出「建立在空地基上的组件」，即虚假进度。
// 所以这里把 foundation 就绪度显式纳入选择与告警。
// ---------------------------------------------------------------------------
const foundationFile = path.join(REGISTRY, 'foundation.json');
const foundationStatus = new Map();
let foundationSummary = null;
if (fs.existsSync(foundationFile)) {
  const fdoc = JSON.parse(fs.readFileSync(foundationFile, 'utf8'));
  foundationSummary = fdoc.summary;
  for (const p of fdoc.packages) foundationStatus.set(p.name, p.status);
}
const foundationKnown = foundationStatus.size > 0;
const foundationCompleted = new Set(
  [...foundationStatus].filter(([, s]) => s === 'completed').map(([n]) => n),
);

/** 返回该组件缺哪些未 completed 的 foundation 包 */
function foundationGapOf(c) {
  if (!foundationKnown) return [];
  return c.dependencies.foundation
    .filter((f) => !foundationCompleted.has(f))
    .map((f) => ({ name: f, status: foundationStatus.get(f) ?? 'unknown' }));
}

const candidates = (args.includeBlocked ? notCompleted : ready)
  .filter((c) => (args.requireFoundation ? foundationGapOf(c).length === 0 : true))
  .sort(compare);

function explainLine(c, idx) {
  const reasons = [];
  reasons.push(c.priority);
  reasons.push(`unblocks=${c.derived.unblocks}`);
  reasons.push(`complexity=${c.complexity}`);
  reasons.push(`dagLevel=${c.derived.dagLevel}`);
  if (c.blockedBy.length) reasons.push(`blockedBy=[${c.blockedBy.join(',')}]`);
  return `${String(idx + 1).padStart(3)}. ${c.name.padEnd(17)} ${reasons.join('  ')}`;
}

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------
if (args.json) {
  console.log(
    JSON.stringify(
      {
        antdVersion: componentsDoc.antdVersion,
        summary: componentsDoc.summary,
        next: candidates[0] ?? null,
        candidates: (args.all ? candidates : candidates.slice(0, 5)).map((c) => ({
          name: c.name,
          exportName: c.exportName,
          priority: c.priority,
          complexity: c.complexity,
          status: c.status,
          blockedBy: c.blockedBy,
          unblocks: c.derived.unblocks,
          dagLevel: c.derived.dagLevel,
          foundation: c.dependencies.foundation,
        })),
        blockedCount: blocked.length,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log(`\n@apollo-design/ui — 兼容目标 antd v${componentsDoc.antdVersion}`);
console.log(
  `进度: ${completed.size}/${components.length} completed  |  ${ready.length} 可执行  |  ${blocked.length} 被阻塞`,
);
console.log(`优先级分布: ${JSON.stringify(componentsDoc.summary.byPriority)}`);
if (foundationSummary) {
  const gapCount = ready.filter((c) => foundationGapOf(c).length > 0).length;
  console.log(
    `foundation: ${foundationSummary.completedCount}/${foundationSummary.total} completed  |  其中 ${gapCount}/${ready.length} 个「可执行」组件的 foundation 依赖尚未就绪`,
  );
}

if (args.explain || args.all) {
  console.log('\n=== 候选排序（priority → unblocks desc → complexity asc → dagLevel） ===');
  const list = args.all ? candidates : candidates.slice(0, 10);
  list.forEach((c, i) => {
    console.log(explainLine(c, i));
  });
  if (blocked.length && !args.includeBlocked) {
    console.log(
      `\n（另有 ${blocked.length} 个组件因依赖未完成而被阻塞，用 --include-blocked 查看）`,
    );
  }
}

if (!candidates.length) {
  console.log('\n⚠️  没有可执行的任务。');
  if (blocked.length) {
    console.log('所有未完成组件都被阻塞。请检查 blockedBy 链，或先完成 foundation 包。');
  } else {
    console.log('全部组件已完成。');
  }
  process.exit(0);
}

const next = candidates[0];
console.log('\n=== 下一个任务 ===');
console.log(`组件        ${next.name} (${next.exportName})`);
console.log(`分组        ${next.group}`);
console.log(
  `优先级      ${next.priority}  complexity=${next.complexity}  dagLevel=${next.derived.dagLevel}`,
);
console.log(`解锁下游    ${next.derived.unblocks} 个组件`);
console.log(
  `规模        antd 构建产物 ${next.derived.antdBuildLineCount} 行 / ${next.derived.antdFileCount} 文件`,
);
console.log(`依赖组件    ${next.dependencies.components.join(', ') || '（无）'}`);
console.log(`需要 foundation  ${next.dependencies.foundation.join(', ')}`);
console.log(`rc 依赖     ${next.dependencies.rcPackages.join(', ') || '（无）'}`);
console.log(`Token       ${next.derived.tokenCount} 个`);
if (next.notes) console.log(`备注        ${next.notes}`);

const gap = foundationGapOf(next);
if (gap.length) {
  console.log(`\n⚠️  不要开始这个组件：它依赖的 foundation 包尚未就绪`);
  for (const g of gap) console.log(`      ${g.name}  status=${g.status}`);
  console.log(
    `    在空地基上做组件会产出虚假进度 —— 组件可以 render，但 Token/行为无法与 antd 对齐。`,
  );
  if (foundationSummary?.nextPackage) {
    console.log(`\n    先做 foundation：node registry/tools/next-task.mjs --foundation`);
    console.log(`    下一个 foundation 包：${foundationSummary.nextPackage}`);
  }
  console.log(`    查看详情：node registry/tools/next-task.mjs --component ${next.name}`);
} else if (foundationKnown) {
  console.log(
    `foundation  就绪 ✅（${next.dependencies.foundation.length} 个依赖包全部 completed）`,
  );
}

console.log(`\n执行流程    WORKFLOW.md G0 → G14（14 道 Gate 全部通过才能置 completed）`);
console.log(`开始方式    node registry/tools/next-task.mjs --component ${next.name}`);
console.log(`\n分析参考    /tmp/antd-repo/ant-design-master/components/${next.name}/`);
console.log(`            /tmp/antd-src/package/es/${next.name}/`);
console.log();
