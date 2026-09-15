#!/usr/bin/env node
/**
 * foundation-status.mjs
 *
 * 回答一个问题：**foundation 包（L0/L1/L2）现在到哪一步了？下一个该做哪个？**
 *
 * 为什么需要这个文件：
 *   registry/components.json 只追踪 72 个组件。但组件的进度会被 foundation 包卡住 ——
 *   一个组件标记 completed，却建立在一个只有骨架的 theme 包上，那是虚假进度。
 *   本脚本让 foundation 包的进度同样机器可读，使「下一个任务」这个问题在 foundation
 *   层也能得到唯一确定答案，而不必靠人读文档回忆。
 *
 * 生成 / 保留 的分工（与 components.json 的约定一致）：
 *   生成字段（每次运行覆盖）：
 *     name / dir / layer / phase2Order / risk / purpose / replaces / notDo / readiness /
 *     pocRequired / pocNote / dependsOn / dependedOnBy / derived
 *   保留字段（人工维护，跨运行保留）：
 *     status / pocStatus / doneWhen / dimensions / testLayers / blockedBy / blockers /
 *     notes / verification
 *   ⇒ 所以本脚本可以反复运行，不会抹掉已记录的进度。
 *
 * phase2Order 与 implOrder 的区别（重要）：
 *   phase2Order 是 Phase 1 报告里定下的「推进顺序」，它把 AR1/AR2 两个架构风险点的
 *   PoC 排在很前面（position=S5、motion=S6），因此**允许早于其依赖包** —— 因为那个槽位
 *   做的是 PoC，不是完整实现。pocRequired 就是标记这件事的字段。
 *   implOrder 是推导出的严格拓扑序（尊重 dependsOn），回答「可以开始完整实现的下一个」。
 *   两者不同不是 bug；但 pocRequired=false 的包若 phase2Order 早于其依赖，那是真错误。
 *
 * 用法：
 *   node registry/tools/foundation-status.mjs                 # 刷新 foundation.json 并打印概览
 *   node registry/tools/foundation-status.mjs --json          # 机器可读输出
 *   node registry/tools/foundation-status.mjs --check         # CI：只校验不写入，过期则 exit 1
 *   node registry/tools/foundation-status.mjs --package utils # 查看单个包详情
 *   node registry/tools/foundation-status.mjs --verify        # 跑测试+覆盖率，把实测结果写入 verification
 *   node registry/tools/foundation-status.mjs --dry-run       # 打印将写入的内容，不落盘
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OPEN_DECISIONS } from '../source/open-decisions.mjs';
import { PACKAGES } from './scaffold-packages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const REGISTRY = path.join(ROOT, 'registry');
const OUT_FILE = path.join(REGISTRY, 'foundation.json');
const COVERAGE_SUMMARY = path.join(ROOT, 'coverage/coverage-summary.json');

const args = { json: false, check: false, verify: false, dryRun: false, pkg: null };
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a === '--json') args.json = true;
  else if (a === '--check') args.check = true;
  else if (a === '--verify') args.verify = true;
  else if (a === '--dry-run') args.dryRun = true;
  else if (a === '--package') args.pkg = process.argv[++i];
  else if (a === '--help' || a === '-h') {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------
const DIMENSIONS = ['api', 'impl', 'types', 'tests', 'docs', 'pkg'];
const TEST_LAYERS = [
  'L1-unit',
  'L2-interaction',
  'L3-type',
  'L4-dom-contract',
  'L5-a11y',
  'L6-visual',
  'L7-build',
];

/** 与 vitest.config.ts 的 coverage.thresholds 保持一致（foundation 包档位） */
const COVERAGE_THRESHOLDS = { statements: 95, branches: 90, functions: 95 };

/** 保留字段清单 —— 决定哪些字段从旧文件继承 */
const PRESERVED_KEYS = [
  'status',
  'pocStatus',
  'doneWhen',
  'dimensions',
  'testLayers',
  'layerNotes',
  'blockedBy',
  'blockers',
  'notes',
  'verification',
];

const TEST_PROJECTS = ['unit', 'dom-contract', 'types'];

// ---------------------------------------------------------------------------
// 读取输入
// ---------------------------------------------------------------------------
function readJson(file, what) {
  if (!fs.existsSync(file)) {
    console.error(`[foundation] missing ${path.relative(ROOT, file)}（${what}）`);
    console.error('[foundation] 请先运行: node registry/tools/gen-registry.mjs');
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`[foundation] 无法解析 ${path.relative(ROOT, file)}: ${e.message}`);
    process.exit(1);
  }
}

const depsDoc = readJson(path.join(REGISTRY, 'dependencies.json'), 'foundation 包定义');
const componentsDoc = readJson(path.join(REGISTRY, 'components.json'), '组件清单');
const prevDoc = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : null;

/** foundation 包 = dependencies.json 声明的那些。PACKAGES 里的 `ui` 是消费者，不是 foundation。 */
const foundationNames = new Set(depsDoc.foundationPackages.map((p) => p.name));
const scaffoldByName = new Map(PACKAGES.map((p) => [p.name, p]));
const prevByName = new Map((prevDoc?.packages ?? []).map((p) => [p.name, p]));

// ---------------------------------------------------------------------------
// 开放决策：种子（registry/source/open-decisions.mjs，工具拥有） + 状态（foundation.json 保留）
//
// 之前 openDecisions 是纯保留字段：首次生成或文件丢失 ⇒ 9 项决策永久消失，而它们是
// 「项目当前卡在哪」的唯一机器可读记录。现在内容落在源码里，只有 status/decision/
// decidedAt/decidedBy 从旧文件反向合入。
// ---------------------------------------------------------------------------
const prevDecisionById = new Map((prevDoc?.openDecisions ?? []).map((d) => [d.id, d]));

/** 运行时状态字段，以 foundation.json 为准 */
const DECISION_RUNTIME_KEYS = ['status', 'decision', 'decidedAt', 'decidedBy', 'note'];

function mergeOpenDecisions() {
  const out = OPEN_DECISIONS.map((seed) => {
    const prev = prevDecisionById.get(seed.id);
    if (!prev) return { ...seed };
    const merged = { ...seed };
    for (const k of DECISION_RUNTIME_KEYS) {
      if (prev[k] !== undefined) merged[k] = prev[k];
    }
    return merged;
  });
  // 保留手工追加的、种子里没有的条目（不静默丢弃人的输入）
  for (const prev of prevDoc?.openDecisions ?? []) {
    if (!OPEN_DECISIONS.some((s) => s.id === prev.id)) out.push(prev);
  }
  return out;
}

const openDecisions = mergeOpenDecisions();

// ---------------------------------------------------------------------------
// 派生：依赖关系
// ---------------------------------------------------------------------------
function dependsOnOf(name) {
  const sp = scaffoldByName.get(name);
  if (!sp) return [];
  // 只保留 foundation 内部依赖；dayjs / @ant-design/* 等外部依赖不算 dependsOn
  return Object.keys(sp.deps).filter((d) => foundationNames.has(d));
}

const dependedOnByMap = new Map([...foundationNames].map((n) => [n, []]));
for (const name of foundationNames) {
  for (const dep of dependsOnOf(name)) dependedOnByMap.get(dep).push(name);
}
for (const list of dependedOnByMap.values()) list.sort();

// ---------------------------------------------------------------------------
// 派生：implOrder —— 严格拓扑序（尊重 dependsOn），同层按 phase2Order 破平
// ---------------------------------------------------------------------------
function computeImplOrder() {
  const order = new Map();
  const assigned = new Set();
  const pool = [...foundationNames];

  while (assigned.size < pool.length) {
    const ready = pool
      .filter((n) => !assigned.has(n) && dependsOnOf(n).every((d) => assigned.has(d)))
      .sort((a, b) => {
        const pa = scaffoldByName.get(a)?.phase2Order ?? 999;
        const pb = scaffoldByName.get(b)?.phase2Order ?? 999;
        return pa - pb || a.localeCompare(b);
      });
    if (!ready.length) {
      // 存在环 —— 不在本脚本报错（scaffold 的 R2 校验负责），这里只记录未定序的包
      for (const n of pool) if (!assigned.has(n)) order.set(n, null);
      break;
    }
    for (const n of ready) {
      assigned.add(n);
      order.set(n, assigned.size);
    }
  }
  return order;
}

const implOrder = computeImplOrder();

/** @apollo-design/ui 的依赖集合 —— 它是 L3 消费者，不算 foundation 包，但它的依赖关系要计入 packageConsumers */
const uiDeps = new Set(Object.keys(scaffoldByName.get('@apollo-design/ui')?.deps ?? {}));

// ---------------------------------------------------------------------------
// 派生：消费者统计
// ---------------------------------------------------------------------------
function consumersOf(name) {
  return componentsDoc.components.filter((c) => c.dependencies.foundation.includes(name));
}

// ---------------------------------------------------------------------------
// 度量：源码规模
// ---------------------------------------------------------------------------
const SRC_EXT = /\.(ts|tsx|vue)$/;
const EXPORT_DECL_RE =
  /^export\s+(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/gm;
const EXPORT_BLOCK_RE = /^export\s+(?:type\s+)?\{([^}]*)\}/gm;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules' || e.name === 'dist') continue;
      walk(fp, out);
    } else if (SRC_EXT.test(e.name)) {
      out.push(fp);
    }
  }
  return out;
}

function measureSrc(dirName) {
  const srcDir = path.join(ROOT, 'packages', dirName, 'src');
  const files = walk(srcDir);
  let lines = 0;
  const names = new Set();
  let hasRealCode = false;

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    lines += text.split('\n').length;
    // 骨架包只有 `export {};` —— 据此区分「空壳」与「已实现」
    if (!/^\s*export\s*\{\s*\}\s*;?\s*$/m.test(text) || text.replace(/\s/g, '').length > 40) {
      hasRealCode = true;
    }
    for (const m of text.matchAll(EXPORT_DECL_RE)) names.add(m[1]);
    for (const m of text.matchAll(EXPORT_BLOCK_RE)) {
      for (const part of m[1].split(',')) {
        const n = part
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim();
        if (n && /^[A-Za-z0-9_$]+$/.test(n)) names.add(n);
      }
    }
  }
  return { srcFiles: files.length, srcLines: lines, exportDeclarations: names.size, hasRealCode };
}

// ---------------------------------------------------------------------------
// 验证事实：测试与覆盖率
// ---------------------------------------------------------------------------

/** 从 coverage/coverage-summary.json 聚合出某个包的覆盖率 */
function coverageFor(dirName) {
  if (!fs.existsSync(COVERAGE_SUMMARY)) return null;
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY, 'utf8'));
  } catch {
    return null;
  }
  const needle = `${path.sep}packages${path.sep}${dirName}${path.sep}src${path.sep}`;
  const keys = Object.keys(doc).filter((k) => k !== 'total' && k.includes(needle));
  if (!keys.length) return null;

  const acc = {
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    lines: { total: 0, covered: 0 },
  };
  for (const k of keys) {
    for (const metric of Object.keys(acc)) {
      acc[metric].total += doc[k][metric].total;
      acc[metric].covered += doc[k][metric].covered;
    }
  }
  const pct = (m) =>
    acc[m].total === 0 ? 100 : +((acc[m].covered / acc[m].total) * 100).toFixed(2);
  return {
    statements: pct('statements'),
    branches: pct('branches'),
    functions: pct('functions'),
    lines: pct('lines'),
  };
}

function runVerify() {
  console.log('[foundation] --verify: 运行测试与覆盖率（可能需要几分钟）…\n');
  const reportFile = path.join(ROOT, 'coverage/vitest-foundation.json');
  const cliArgs = [
    'exec',
    'vitest',
    'run',
    ...TEST_PROJECTS.flatMap((p) => ['--project', p]),
    '--coverage',
    '--coverage.reporter=json-summary',
    '--reporter=json',
    `--outputFile=${reportFile}`,
  ];

  let stdout = '';
  let failed = false;
  try {
    stdout = execFileSync('corepack', ['pnpm', ...cliArgs], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    // 覆盖率未达阈值 / 测试失败都会非零退出 —— 这正是我们要记录的，不是脚本错误
    failed = true;
    stdout = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }

  let report = null;
  if (fs.existsSync(reportFile)) {
    try {
      report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    } catch {
      report = null;
    }
  }
  if (!report) {
    console.error('[foundation] --verify 未能拿到 vitest 的 JSON 报告，verification 保持原值');
    console.error(failed ? stdout.split('\n').slice(-20).join('\n') : '');
    return null;
  }

  // 按测试文件路径把用例归属到包
  const byPackage = new Map();
  for (const tr of report.testResults ?? []) {
    const m = tr.name.match(/packages[\\/]([^\\/]+)[\\/]/);
    if (!m) continue;
    const dir = m[1];
    if (!byPackage.has(dir)) {
      byPackage.set(dir, { projects: new Set(), files: 0, tests: 0, passed: 0, failed: 0 });
    }
    const acc = byPackage.get(dir);
    acc.files += 1;
    for (const a of tr.assertionResults ?? []) {
      acc.tests += 1;
      if (a.status === 'passed') acc.passed += 1;
      else if (a.status === 'failed') acc.failed += 1;
    }
  }

  return {
    byPackage,
    totals: {
      tests: report.numTotalTests ?? 0,
      passed: report.numPassedTests ?? 0,
      failed: report.numFailedTests ?? 0,
    },
  };
}

let verifyResult = null;
if (args.verify) verifyResult = runVerify();

// ---------------------------------------------------------------------------
// 组装条目
// ---------------------------------------------------------------------------
function defaultVerification() {
  return {
    verifiedAt: null,
    unit: { projects: [], files: 0, tests: 0, passed: 0, failed: 0 },
    typecheck: { status: 'not-run', errors: 0 },
    coverage: { statements: null, branches: null, functions: null, lines: null },
    thresholds: { ...COVERAGE_THRESHOLDS, met: null },
    build: { status: 'not-run', reason: null },
    contract: null,
  };
}

function defaultProgress() {
  return {
    status: 'todo',
    pocStatus: 'todo',
    doneWhen: [],
    dimensions: Object.fromEntries(DIMENSIONS.map((d) => [d, 'todo'])),
    testLayers: Object.fromEntries(TEST_LAYERS.map((l) => [l, 'todo'])),
    layerNotes: null,
    blockedBy: [],
    blockers: [],
    notes: null,
    verification: defaultVerification(),
  };
}

const entries = [];

for (const fp of depsDoc.foundationPackages) {
  const sp = scaffoldByName.get(fp.name);
  const dir = sp?.dir ?? fp.name.replace('@apollo-design/', '');
  const consumers = consumersOf(fp.name);
  const size = measureSrc(dir);

  // 生成字段
  const entry = {
    name: fp.name,
    dir,
    layer: fp.layer,
    phase2Order: sp?.phase2Order ?? 999,
    risk: fp.risk,
    purpose: fp.purpose,
    replaces: fp.replaces,
    notDo: sp?.notDo ?? [],
    readiness: fp.readiness,
    pocRequired: Boolean(sp?.poc),
    pocNote: sp?.poc ?? null,
    dependsOn: dependsOnOf(fp.name),
    dependedOnBy: dependedOnByMap.get(fp.name) ?? [],
  };

  // 保留字段（旧文件优先）
  const prevEntry = prevByName.get(fp.name);
  const dflt = defaultProgress();
  for (const key of PRESERVED_KEYS) {
    entry[key] = prevEntry?.[key] ?? dflt[key];
  }

  // 派生字段
  const byPriority = {};
  for (const c of consumers) byPriority[c.priority] = (byPriority[c.priority] ?? 0) + 1;

  entry.derived = {
    implOrder: implOrder.get(fp.name) ?? null,
    componentConsumers: consumers.length,
    componentConsumersByPriority: byPriority,
    packageConsumers: [
      ...(dependedOnByMap.get(fp.name) ?? []),
      ...(uiDeps.has(fp.name) ? ['@apollo-design/ui'] : []),
    ].sort(),
    srcFiles: size.srcFiles,
    srcLines: size.srcLines,
    exportDeclarations: size.exportDeclarations,
  };

  // --verify：用实测覆盖 verification 的测量部分（不动 build / contract 这类人工判定）
  // verifiedAt 只在**真的采到本包的测试数据**时才写 —— 否则 summary.verifiedCount 会把
  // 「跑过一次」误读成「这个包已被验证」，那是虚假进度。
  if (verifyResult) {
    const pkgStat = verifyResult.byPackage.get(dir);
    const cov = coverageFor(dir);
    if (pkgStat || cov) {
      entry.verification = {
        ...entry.verification,
        verifiedAt: new Date().toISOString().slice(0, 10),
        unit: pkgStat
          ? {
              projects: TEST_PROJECTS,
              files: pkgStat.files,
              tests: pkgStat.tests,
              passed: pkgStat.passed,
              failed: pkgStat.failed,
            }
          : entry.verification.unit,
        coverage: cov ?? entry.verification.coverage,
        thresholds: {
          ...COVERAGE_THRESHOLDS,
          met: cov
            ? cov.statements >= COVERAGE_THRESHOLDS.statements &&
              cov.branches >= COVERAGE_THRESHOLDS.branches &&
              cov.functions >= COVERAGE_THRESHOLDS.functions
            : null,
        },
      };
    }
  }

  entries.push(entry);
}

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------
const byStatus = {};
const byLayer = {};
for (const e of entries) {
  byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
  byLayer[e.layer] = (byLayer[e.layer] ?? 0) + 1;
}

const remaining = entries.filter((e) => e.status !== 'completed');
const nextPackage =
  [...remaining]
    .filter((e) => e.blockedBy.length === 0)
    .sort((a, b) => a.phase2Order - b.phase2Order)[0]?.name ?? null;

const completedSet = new Set(entries.filter((e) => e.status === 'completed').map((e) => e.name));
// 与 nextPackage 一样排除 blockedBy —— 否则会把「依赖已满足但被决策卡住」的包报成可开工
const nextImplementable =
  [...remaining]
    .filter((e) => e.blockedBy.length === 0 && e.dependsOn.every((d) => completedSet.has(d)))
    .sort((a, b) => (a.derived.implOrder ?? 999) - (b.derived.implOrder ?? 999))[0]?.name ?? null;

const doc = {
  $schema: './schema.json#/definitions/FoundationFile',
  $comment:
    'GENERATED by registry/tools/foundation-status.mjs. 生成字段每次覆盖；status/dimensions/testLayers/verification/blockers 等进度字段跨运行保留，可安全手工维护。',
  antdVersion: componentsDoc.antdVersion,
  generatedAt: new Date().toISOString(),
  sourceFacts:
    'dependencies.json（包定义） + scaffold-packages.mjs（dir/phase2Order/deps/poc/notDo） + components.json（消费者） + packages/*/src（规模度量）',
  legend: {
    status:
      'todo → analyzing → implementing → testing → verifying → completed（blocked 为旁路状态）',
    phase2Order:
      'Phase 2 推进顺序，含 AR1/AR2 的 PoC 验证点。允许早于依赖包，前提是 pocRequired=true（该槽位做 PoC 而非完整实现）',
    implOrder: '推导的严格拓扑序（尊重 dependsOn）。回答「可以开始完整实现的下一个」',
    dimensions: {
      api: '公共 API 契约已锁定（对照上游 .d.ts）',
      impl: '实现完成',
      types: '类型完备（含 *.test-d.ts 负例）',
      tests: '测试达标（七层中适用的层 + 覆盖率阈值）',
      docs: '契约文档 / README 与实现一致',
      pkg: '包配置与构建产物正确（exports 可解析、产物无 React 痕迹）',
    },
    testLayers:
      'TESTING.md 的七层。n/a 必须由架构规则支撑（如 L0 无视觉语义 ⇒ L6 不适用），不允许用 n/a 掩盖未做',
    coverageThresholds: COVERAGE_THRESHOLDS,
  },
  phase1Facts: prevDoc?.phase1Facts ?? {
    $comment:
      'Phase 1 分析产出的实测事实（来源 docs/foundation/*.md）。工具只保留、不生成 —— 这些数字无法从当前仓库廉价重新推导。键为包名。',
    '@apollo-design/utils': {
      contractDoc: 'docs/foundation/rc-util-contract.md',
      upstreamImportStatements: 165,
      upstreamModuleCount: 1,
    },
  },
  // 开放决策：内容来自 registry/source/open-decisions.mjs（工具拥有），
  // 运行时状态（status/decision/decidedAt/decidedBy）从上一版 foundation.json 合入。
  openDecisions,
  summary: {
    total: entries.length,
    byStatus,
    byLayer,
    completedCount: completedSet.size,
    remainingCount: remaining.length,
    nextPackage,
    nextImplementable,
    verifiedCount: entries.filter((e) => e.verification.verifiedAt).length,
    buildPassingCount: entries.filter((e) => e.verification.build.status === 'passing').length,
    openDecisionCount: openDecisions.filter((d) => d.status === 'open').length,
  },
  packages: entries,
};

// ---------------------------------------------------------------------------
// 输出模式
// ---------------------------------------------------------------------------

// --package <dir|name>：单包详情
if (args.pkg) {
  const e =
    entries.find((x) => x.dir === args.pkg || x.name === args.pkg) ??
    entries.find((x) => x.name.endsWith(`/${args.pkg}`));
  if (!e) {
    console.error(`[foundation] unknown package: ${args.pkg}`);
    console.error(`[foundation] 可用: ${entries.map((x) => x.dir).join(', ')}`);
    process.exit(1);
  }
  if (args.json) {
    console.log(JSON.stringify(e, null, 2));
    process.exit(0);
  }
  console.log(`\n=== ${e.name} ===`);
  console.log(`层 / 风险       ${e.layer} / ${e.risk}`);
  console.log(`推进顺序        phase2Order=${e.phase2Order}  implOrder=${e.derived.implOrder}`);
  console.log(
    `状态            ${e.status}${e.blockedBy.length ? `  (blockedBy: ${e.blockedBy.join(', ')})` : ''}`,
  );
  console.log(`PoC             ${e.pocRequired ? `${e.pocStatus} — ${e.pocNote}` : '不需要'}`);
  console.log(`职责            ${e.purpose}`);
  console.log(`替代            ${e.replaces.join(', ')}`);
  console.log(`依赖            ${e.dependsOn.join(', ') || '（无）'}`);
  console.log(`被依赖          ${e.dependedOnBy.join(', ') || '（无）'}`);
  console.log(
    `消费者          ${e.derived.componentConsumers} 个组件 ${JSON.stringify(e.derived.componentConsumersByPriority)}`,
  );
  console.log(
    `规模            ${e.derived.srcFiles} 文件 / ${e.derived.srcLines} 行 / ${e.derived.exportDeclarations} 个导出声明`,
  );
  console.log(`就绪标准        ${e.readiness}`);
  console.log(`\n进度维度:`);
  for (const d of DIMENSIONS) console.log(`  ${d.padEnd(16)} ${e.dimensions[d]}`);
  console.log(`\n测试层:`);
  for (const l of TEST_LAYERS) console.log(`  ${l.padEnd(16)} ${e.testLayers[l]}`);
  console.log(`\n验证事实:`);
  const v = e.verification;
  console.log(`  最近验证        ${v.verifiedAt ?? '（从未）'}`);
  console.log(
    `  测试            ${v.unit.passed}/${v.unit.tests} 通过（${v.unit.files} 文件, ${v.unit.projects.join('+') || '—'}）`,
  );
  console.log(
    `  类型检查        ${v.typecheck.status}${v.typecheck.errors ? ` (${v.typecheck.errors} 错误)` : ''}`,
  );
  console.log(
    `  覆盖率          语句 ${v.coverage.statements ?? '—'}% / 分支 ${v.coverage.branches ?? '—'}% / 函数 ${v.coverage.functions ?? '—'}%  阈值达标: ${v.thresholds.met ?? '未测量'}`,
  );
  console.log(`  构建            ${v.build.status}${v.build.reason ? ` — ${v.build.reason}` : ''}`);
  console.log(`  契约文档        ${v.contract ?? '（无）'}`);
  if (e.doneWhen.length) {
    console.log(`\n完成判据:`);
    for (const d of e.doneWhen) console.log(`  · ${d}`);
  }
  if (e.blockers.length) {
    console.log(`\n阻塞:`);
    for (const b of e.blockers) {
      console.log(`  [${b.type}] ${b.reason}`);
      if (b.blockedBy) console.log(`     阻塞者: ${b.blockedBy}`);
      if (b.unblockCondition) console.log(`     解除条件: ${b.unblockCondition}`);
    }
  }
  if (e.notDo.length) {
    console.log(`\n明确不做（边界）:`);
    for (const n of e.notDo) console.log(`  ❌ ${n}`);
  }
  if (e.notes) console.log(`\n备注: ${e.notes}`);
  console.log();
  process.exit(0);
}

if (args.json) {
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}

// --check：与磁盘上的文件比对（忽略 generatedAt），过期则失败
if (args.check) {
  if (!prevDoc) {
    console.error(
      '[foundation] ❌ registry/foundation.json 不存在。运行: node registry/tools/foundation-status.mjs',
    );
    process.exit(1);
  }
  const strip = (d) => {
    const c = JSON.parse(JSON.stringify(d));
    c.generatedAt = '';
    return JSON.stringify(c, null, 2);
  };
  if (strip(doc) !== strip(prevDoc)) {
    console.error('[foundation] ❌ registry/foundation.json 已过期（源数据变化后未刷新）');
    console.error('[foundation]    运行: node registry/tools/foundation-status.mjs');
    process.exit(1);
  }
  console.log('[foundation] ✅ registry/foundation.json 与源数据一致');
  process.exit(0);
}

if (args.dryRun) {
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(doc, null, 2)}\n`);

// ---------------------------------------------------------------------------
// 概览
// ---------------------------------------------------------------------------
console.log(`\n@apollo-design — foundation 包进度（兼容目标 antd v${doc.antdVersion}）`);
console.log(
  `进度: ${doc.summary.completedCount}/${doc.summary.total} completed  |  状态分布 ${JSON.stringify(byStatus)}`,
);
console.log(`层分布: ${JSON.stringify(byLayer)}`);
console.log(
  `已实测验证: ${doc.summary.verifiedCount}/${doc.summary.total}  |  构建通过: ${doc.summary.buildPassingCount}/${doc.summary.total}`,
);

console.log('\n=== 按 phase2Order（推进顺序） ===');
for (const e of [...entries].sort((a, b) => a.phase2Order - b.phase2Order)) {
  const st = e.status.padEnd(13);
  const cov = e.verification.coverage.statements;
  const covTxt = cov === null ? '    —' : `${String(cov).padStart(6)}%`;
  const bd = e.blockedBy.length ? ` ⛔${e.blockedBy.length}` : '';
  const poc = e.pocRequired && e.pocStatus !== 'done' ? ' ⚠PoC' : '';
  console.log(
    `  ${String(e.phase2Order).padStart(2)}. ${e.name.padEnd(32)} [${e.layer.padEnd(4)}] ${st} impl=${String(e.derived.implOrder ?? '—').padStart(2)} cov=${covTxt} 消费者=${String(e.derived.componentConsumers).padStart(2)}${bd}${poc}`,
  );
}

console.log(`\n下一个（按推进顺序）        ${doc.summary.nextPackage ?? '（无）'}`);
console.log(`下一个（可开始完整实现）    ${doc.summary.nextImplementable ?? '（无）'}`);

const pendingDecisions = doc.openDecisions.filter((d) => d.status === 'open');
if (pendingDecisions.length) {
  console.log(
    `\n⏸  等待裁决的开放决策（${pendingDecisions.length} 项，阻塞 ${pendingDecisions.filter((d) => d.hardBlock).length} 项完全开工）:`,
  );
  for (const d of pendingDecisions) {
    console.log(`   [${d.id}] ${d.question}`);
    console.log(`        影响: ${d.impact}`);
    if (d.recommendation) console.log(`        建议: ${d.recommendation}`);
  }
}

console.log(`\n写入 ${path.relative(ROOT, OUT_FILE)}`);
console.log('详情    node registry/tools/foundation-status.mjs --package <dir>');
console.log();
