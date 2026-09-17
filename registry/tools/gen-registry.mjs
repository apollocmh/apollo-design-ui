#!/usr/bin/env node
/**
 * gen-registry.mjs
 *
 * 把「客观事实」（registry/source/antd-<v>.raw.json，由 extract-antd-facts.mjs 生成）
 * 与「人工决策」（registry/source/components.meta.mjs + rc-map.mjs）
 * 合成为机器可读的：
 *   - registry/components.json     组件状态系统（Agent 的任务来源）
 *   - registry/dependencies.json   依赖 DAG 与 rc-* 替代方案
 *   - registry/tokens.json         Token 清单与覆盖状态
 *
 * 关键设计：**状态字段是「保留」的**。
 * 重跑本脚本只会刷新「派生字段」（依赖、规模、优先级、unblocks...），
 * 不会覆盖 Agent 已经写入的 status / apiStatus / testStatus 等进度字段。
 * 这是让 Registry 可以长期演进而不被生成器抹掉进度的前提。
 *
 * 用法：
 *   node registry/tools/gen-registry.mjs
 *   node registry/tools/gen-registry.mjs --print-dag
 *   node registry/tools/gen-registry.mjs --version 6.6.4
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALIASES,
  COMPONENTS,
  CYCLE_RESOLUTIONS,
  FOUNDATION_READINESS,
} from '../source/components.meta.mjs';
import {
  A11Y_COMPONENTS,
  ANT_DESIGN_DOC_GROUPS,
  FORM_CORE_COMPONENTS,
  LEAF_PREFIX_TO_FOUNDATION,
  LOCALE_COMPONENTS,
  MOTION_COMPONENTS,
  OVERLAY_COMPONENTS,
  PICKER_COMPONENTS,
  PKG_TO_FOUNDATION,
  PORTAL_COMPONENTS,
  RC_MAP,
  VIRTUAL_LIST_COMPONENTS,
} from '../source/rc-map.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SOURCE_DIR = path.join(ROOT, 'registry/source');
const OUT_DIR = path.join(ROOT, 'registry');

// ---------------------------------------------------------------------------
// 进度字段的保留逻辑见下方 `existing` / `prev`（约 172 / 226 / 274 行）。
// 校验用的状态取值词汇表**只在 validate-registry.mjs 中维护一份** ——
// 生成器不重复声明，避免两处定义漂移。
// ---------------------------------------------------------------------------

const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'];
const COMPLEXITY_ORDER = ['S', 'M', 'L', 'XL'];

// ---------------------------------------------------------------------------
// 读取
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { printDag: false, version: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--print-dag') args.printDag = true;
    else if (argv[i] === '--version') args.version = argv[++i];
  }
  return args;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function findRawFacts(version) {
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => /^antd-.*\.raw\.json$/.test(f))
    .sort();
  if (files.length === 0) {
    throw new Error(
      `no antd-*.raw.json in ${SOURCE_DIR}. Run: node registry/tools/extract-antd-facts.mjs --artifact <path>`,
    );
  }
  const target = version ? `antd-${version}.raw.json` : files[files.length - 1];
  if (!files.includes(target)) {
    throw new Error(`no facts for antd ${version}; available: ${files.join(', ')}`);
  }
  return { file: path.join(SOURCE_DIR, target), facts: readJson(path.join(SOURCE_DIR, target)) };
}

/** 读取已有 components.json，用于保留进度字段 */
function readExistingComponents() {
  const file = path.join(OUT_DIR, 'components.json');
  if (!fs.existsSync(file)) return new Map();
  const data = readJson(file);
  return new Map((data.components ?? []).map((c) => [c.name, c]));
}

// ---------------------------------------------------------------------------
// 图计算
// ---------------------------------------------------------------------------
/** 拓扑排序（Kahn），返回层级；同时检测环 */
function topoLevels(nodes, depsOf) {
  const indeg = new Map(nodes.map((n) => [n, 0]));
  const dependents = new Map(nodes.map((n) => [n, []]));
  for (const n of nodes) {
    for (const d of depsOf(n)) {
      if (!indeg.has(d)) continue;
      indeg.set(n, indeg.get(n) + 1);
      dependents.get(d).push(n);
    }
  }
  const level = new Map();
  let queue = nodes.filter((n) => indeg.get(n) === 0);
  for (const n of queue) level.set(n, 0);
  let processed = 0;
  while (queue.length) {
    const next = [];
    for (const n of queue) {
      processed += 1;
      for (const dep of dependents.get(n)) {
        indeg.set(dep, indeg.get(dep) - 1);
        if (indeg.get(dep) === 0) {
          level.set(dep, level.get(n) + 1);
          next.push(dep);
        }
      }
    }
    queue = next;
  }
  const cycles = processed === nodes.length ? [] : nodes.filter((n) => !level.has(n));
  return { level, cycles };
}

/** 传递闭包：某节点能解锁多少下游组件 */
function countUnblocks(nodes, depsOf) {
  const dependents = new Map(nodes.map((n) => [n, new Set()]));
  for (const n of nodes) for (const d of depsOf(n)) dependents.get(d)?.add(n);
  const result = new Map();
  for (const n of nodes) {
    const seen = new Set();
    const stack = [...(dependents.get(n) ?? [])];
    while (stack.length) {
      const cur = stack.pop();
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const x of dependents.get(cur) ?? []) if (!seen.has(x)) stack.push(x);
    }
    result.set(n, seen.size);
  }
  return result;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
const { file: rawFile, facts } = findRawFacts(args.version);
const existing = readExistingComponents();

const metaByName = new Map(COMPONENTS.map((m) => [m.name, m]));
const componentNames = COMPONENTS.map((c) => c.name);

// 校验：meta 必须与 antd 产物目录一一对应
const antdComponentDirs = facts.componentDirs.filter((d) => !(d in ALIASES));
const missingInMeta = antdComponentDirs.filter((d) => !metaByName.has(d));
const extraInMeta = componentNames.filter((n) => !antdComponentDirs.includes(n));
if (missingInMeta.length) {
  console.error(`[gen] ERROR meta 缺少 antd 组件: ${missingInMeta.join(', ')}`);
}
if (extraInMeta.length) {
  console.error(`[gen] ERROR meta 存在 antd 中不存在的组件: ${extraInMeta.join(', ')}`);
}
if (missingInMeta.length || extraInMeta.length) process.exit(1);

// ---------------------------------------------------------------------------
// 1) components.json
// ---------------------------------------------------------------------------
const depsOf = (name) => {
  const raw = facts.components[name];
  return (raw?.internalDepsRuntime ?? []).filter((d) => metaByName.has(d));
};

const { level: dagLevel, cycles } = topoLevels(componentNames, depsOf);
if (cycles.length) {
  console.error(`[gen] ERROR 组件级运行时 DAG 存在环: ${cycles.join(', ')}`);
  process.exit(1);
}
const unblocks = countUnblocks(componentNames, depsOf);

/**
 * 组件 → 需要的 foundation 包。
 *
 * 三条来源，优先级递增：
 *   1. 默认：每个组件都需要 theme + utils
 *   2. rc 依赖推导：rc-map.mjs 的 PKG_TO_FOUNDATION（**支持数组** —— 一个 rc 包的能力
 *      可能拆到我们多个包，如 trigger → position + overlay）
 *   3. 人工策展的能力集合：rc 依赖表无法表达「modal 需要 portal/a11y」这类事实
 *
 * '@apollo-design/ui' 在 rc-map 中表示「该能力落在 ui 内部，不独立成包」，
 * 它不是组件的外部依赖（组件本来就在 ui 里），所以不计入 needs。
 */
const CURATED_NEEDS = [
  [
    OVERLAY_COMPONENTS,
    ['@apollo-design/overlay', '@apollo-design/position', '@apollo-design/portal'],
  ],
  [PORTAL_COMPONENTS, ['@apollo-design/portal']],
  [A11Y_COMPONENTS, ['@apollo-design/a11y']],
  [LOCALE_COMPONENTS, ['@apollo-design/locale']],
  [MOTION_COMPONENTS, ['@apollo-design/motion']],
  [VIRTUAL_LIST_COMPONENTS, ['@apollo-design/virtual-list']],
  [FORM_CORE_COMPONENTS, ['@apollo-design/form-core']],
  [PICKER_COMPONENTS, ['@apollo-design/picker', '@apollo-design/locale']],
];

function deriveNeeds(name, raw) {
  const needs = new Set(['@apollo-design/theme', '@apollo-design/utils']);
  for (const rc of raw.rcDeps) {
    const f = PKG_TO_FOUNDATION[rc];
    for (const pkg of [f].flat()) {
      if (pkg && pkg !== '@apollo-design/ui') needs.add(pkg);
    }
  }
  for (const leaf of raw.internalDepsLeaf) {
    for (const [prefix, f] of Object.entries(LEAF_PREFIX_TO_FOUNDATION)) {
      if (leaf.startsWith(prefix) && f) needs.add(f);
    }
  }
  if ((raw.antdEcoDeps ?? []).includes('@ant-design/icons')) needs.add('@apollo-design/icons');
  for (const [set, pkgs] of CURATED_NEEDS) {
    if (set.has(name)) for (const p of pkgs) needs.add(p);
  }
  for (const n of metaByName.get(name)?.extraNeeds ?? []) needs.add(n);
  return [...needs].sort();
}

const components = COMPONENTS.map((meta) => {
  const raw = facts.components[meta.name];
  if (!raw) throw new Error(`no raw facts for ${meta.name}`);

  const prev = existing.get(meta.name) ?? {};
  const blockingDeps = depsOf(meta.name);

  // 阻塞依赖：仅在依赖尚未 completed 时列出
  const blockedBy = blockingDeps.filter((d) => (existing.get(d)?.status ?? 'todo') !== 'completed');

  const componentTokens = facts.componentTokens[meta.name] ?? [];
  const tokenGroupName = facts.tokens.componentGroups.find(
    (g) =>
      g.toLowerCase() === meta.exportName.toLowerCase() ||
      g.toLowerCase() === meta.name.replace(/-/g, '').toLowerCase(),
  );

  return {
    name: meta.name,
    exportName: meta.exportName,
    group: meta.group,
    priority: meta.priority,
    priorityNum: PRIORITY_ORDER.indexOf(meta.priority),
    complexity: meta.complexity,

    status: prev.status ?? 'todo',
    antdVersion: facts.antdVersion,

    // --- 派生字段（每次重跑刷新）---
    derived: {
      dagLevel: dagLevel.get(meta.name) ?? null,
      unblocks: unblocks.get(meta.name) ?? 0,
      antdBuildLineCount: raw.buildLineCount,
      antdFileCount: raw.fileCount,
      rcDepCount: raw.rcDeps.length,
      tokenCount: componentTokens.length,
      tokenGroup: tokenGroupName ?? null,
    },

    dependencies: {
      components: blockingDeps,
      typeOnly: (raw.internalDepsType ?? []).filter((d) => metaByName.has(d)),
      leafModules: raw.internalDepsLeaf ?? [],
      rcPackages: raw.rcDeps,
      antdEcosystem: raw.antdEcoDeps ?? [],
      foundation: deriveNeeds(meta.name, raw),
    },

    blockedBy,
    blockers: prev.blockers ?? [],

    // --- 进度字段（保留已有值）---
    // 这 11 项 + status 构成一个组件的 Definition of Done，见 WORKFLOW.md §DoD。
    // 命名刻意区分「分析」与「设计」：antdApi 是对照 antd 产物做分析（G1），
    // api 是我们自己的 Vue API 定稿（G2）。两者都 done 才算 API 落定。
    antdApiStatus: prev.antdApiStatus ?? 'todo', // G1 · antd API 分析
    apiStatus: prev.apiStatus ?? 'todo', // G2 · Vue API 设计
    compatStatus: prev.compatStatus ?? 'todo', // G10 · React 兼容性（偏差已登记）
    tokenStatus: prev.tokenStatus ?? 'todo', // G3 · Component Token
    styleStatus: prev.styleStatus ?? 'todo', // CSS 样式
    unitStatus: prev.unitStatus ?? 'todo', // L1 单元测试
    interactionStatus: prev.interactionStatus ?? 'todo', // L2 交互测试
    typeStatus: prev.typeStatus ?? 'todo', // L3 类型测试
    a11yStatus: prev.a11yStatus ?? 'todo', // L5 无障碍
    visualStatus: prev.visualStatus ?? 'todo', // L6 视觉回归
    docsStatus: prev.docsStatus ?? 'todo', // G11 文档

    notes: meta.notes ?? null,

    // `layerNotes` 是**保留字段**：某个维度判 `n/a` 时必须在这里写清架构依据
    // （与 foundation 包的 testLayers.layerNotes 同一约定，见 WORKFLOW.md §1.3
    // 与 COMPONENT-RULES.md §12.4 的「用 n/a 掩盖未做」一条）。
    // 它不参与派生，所以只做原样搬运 —— 但必须在生成器的输出里，
    // 否则每次 `registry:gen` 都会把它抹掉。
    layerNotes: prev.layerNotes ?? null,
  };
});

// summary
const byStatus = {};
for (const c of components) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
const byPriority = {};
for (const c of components) byPriority[c.priority] = (byPriority[c.priority] ?? 0) + 1;

const componentsDoc = {
  $schema: './schema.json#/definitions/ComponentsFile',
  $comment:
    'GENERATED by registry/tools/gen-registry.mjs. Progress fields are preserved across runs; derived fields are refreshed. Do not hand-edit derived fields.',
  antdVersion: facts.antdVersion,
  generatedAt: new Date().toISOString(),
  sourceFacts: path.relative(ROOT, rawFile),

  legend: {
    status: {
      todo: '尚未开始',
      analyzing: '正在分析 antd 参考实现（WORKFLOW G1）',
      implementing: '正在实现（G2-G4）',
      testing: '正在跑测试（G5-G8）',
      'visual-review': '正在视觉验收（G9-G10）',
      blocked: '被阻塞，见 blockers 字段',
      completed: '全部 7 层测试通过 + 视觉验收通过 + 文档完成',
    },
    dimension: {
      todo: '未开始',
      analyzing: '分析中',
      'in-progress': '进行中',
      done: '已完成',
      blocked: '被阻塞',
      'n/a': '该组件不适用此维度',
    },
    priority: {
      P0: '地基与首个垂直切片',
      P1: '简单展示（无浮层、无引擎）',
      P2: '无浮层的表单/展示控件',
      P3: '浮层基础设施的第一个消费者（架构风险验证点）',
      P4: '浮层之上的交互控件',
      P5: '数据密集型与复杂引擎',
    },
  },

  summary: {
    total: components.length,
    byStatus,
    byPriority,
    byGroup: ANT_DESIGN_DOC_GROUPS.reduce((acc, g) => {
      acc[g] = components.filter((c) => c.group === g).length;
      return acc;
    }, {}),
    completedCount: byStatus.completed ?? 0,
    remainingCount: components.length - (byStatus.completed ?? 0),
  },

  // 里程碑：把「做完哪些组件算达到某个阶段」写成机器可读的判据。
  // next-task.mjs 会用它提示「当前处于哪个里程碑」。
  milestones: [
    {
      id: 'M0-foundation-ready',
      label: 'Foundation 就绪',
      description:
        '10 个 @apollo-design/* 包的最小可用集完成；7 层测试基础设施可运行；registry 工具链可运行。',
      components: [],
      packages: [
        '@apollo-design/utils',
        '@apollo-design/theme',
        '@apollo-design/icons',
        '@apollo-design/motion',
        '@apollo-design/portal',
        '@apollo-design/trigger',
        '@apollo-design/test-utils',
      ],
      criteria: [
        'pnpm run registry:validate 通过',
        '主题三算法（default/dark/compact）产出 CSS 变量',
        'AR1（trigger 定位）与 AR2（motion）PoC 通过',
        '7 层测试各有至少 1 个可运行的示例',
      ],
    },
    {
      id: 'M1-first-vertical-slice',
      label: '首个完整垂直切片',
      description: '一个组件走完 WORKFLOW.md 的 G0 → G14 全部 14 道 Gate，证明流水线可复制。',
      components: ['empty', 'config-provider', 'button'],
      criteria: [
        'empty / config-provider / button 均为 completed',
        'button 的 7 层测试全绿',
        'button 的视觉回归与 React 参考截图比对通过或差异已登记',
        'button 的 compat fixture 在双实现上比对通过',
      ],
    },
    {
      id: 'M2-pipeline-scalable',
      label: '流水线可规模化',
      description: 'P0 + P1 全部完成，证明流水线在不同形态组件上都成立。',
      components: components
        .filter((c) => c.priority === 'P0' || c.priority === 'P1')
        .map((c) => c.name),
      criteria: ['P0/P1 共 20 个组件全部 completed', '无新增架构级阻塞'],
    },
    {
      id: 'M3-infrastructure-validated',
      label: '基础设施全部验证',
      description: '浮层体系（trigger/portal/motion）与虚拟滚动在真实组件上验证通过。',
      components: components
        .filter((c) => c.priority === 'P3' || c.priority === 'P4')
        .map((c) => c.name),
      criteria: ['P3/P4 全部 completed', 'AR1-AR4 全部关闭'],
    },
    {
      id: 'M4-complete',
      label: '全量完成',
      description: '72 个组件全部 completed。',
      components: components.map((c) => c.name),
      criteria: ['72/72 completed', '全量视觉回归与 compat 比对通过'],
    },
  ],

  components,
};

// ---------------------------------------------------------------------------
// 2) dependencies.json
// ---------------------------------------------------------------------------
const foundationPackages = [
  {
    name: '@apollo-design/utils',
    layer: 'L0',
    purpose:
      '通用工具集：is* 类型判断、warning 体系、DOM 操作、raf、scroll、getScrollBarSize、ref 合并、pickAttrs、ResizeObserver/MutationObserver 封装、throttle-debounce',
    replaces: [
      '@rc-component/util',
      '@rc-component/resize-observer',
      '@rc-component/mutate-observer',
      'throttle-debounce',
      '@rc-component/overflow(检测部分)',
    ],
    risk: 'high',
    readiness: FOUNDATION_READINESS['@apollo-design/utils'],
  },
  {
    name: '@apollo-design/theme',
    layer: 'L0',
    purpose:
      'Token Runtime：Seed(34) → Map(140) → Alias(82 own / 222 effective) → Component(70 组) 的完整派生链；default/dark/compact 三算法；CSS 变量注入；getDesignToken 纯函数',
    replaces: ['@ant-design/cssinjs(token 计算部分)', '@ant-design/cssinjs-utils', 'theme 目录'],
    risk: 'high',
    readiness: FOUNDATION_READINESS['@apollo-design/theme'],
  },
  {
    name: '@apollo-design/icons',
    layer: 'L0',
    purpose: '以 @ant-design/icons-svg 为数据源生成 Vue 图标组件，保证图标级像素一致',
    replaces: ['@ant-design/icons'],
    risk: 'low',
    readiness: FOUNDATION_READINESS['@apollo-design/icons'],
  },
  {
    name: '@apollo-design/motion',
    layer: 'L1',
    purpose:
      'CSSMotion 等价物：motionAppear/Enter/Leave、motionDeadline、motionLeaveImmediately、多元素 stagger；覆盖 collapse/slide/zoom/fade/move 五类语义',
    replaces: ['@rc-component/motion'],
    risk: 'high',
    readiness: FOUNDATION_READINESS['@apollo-design/motion'],
  },
  {
    name: '@apollo-design/portal',
    layer: 'L1',
    purpose:
      '基于 Vue Teleport：容器创建与复用、SSR 安全延迟挂载、getPopupContainer 解析、z-index 层级管理、同容器内多浮层堆叠顺序',
    replaces: ['@rc-component/portal', '@rc-component/dialog(挂载部分)'],
    risk: 'medium',
    readiness: FOUNDATION_READINESS['@apollo-design/portal'],
  },
  {
    name: '@apollo-design/position',
    layer: 'L1',
    purpose:
      '浮层定位几何：对齐点与偏移、翻转（flip）、边界收缩（shift）、箭头定位、滚动容器跟随、getPopupContainer 坐标系解析。纯几何 + 尺寸测量，不含触发时机与生命周期 —— 生命周期在 @apollo-design/overlay',
    replaces: ['@rc-component/trigger(定位部分)', '@rc-component/tooltip(定位部分)'],
    risk: 'high',
    readiness:
      FOUNDATION_READINESS['@apollo-design/position'] ??
      'AR1 PoC：topLeft/topRight/center/bottomLeft/bottomRight + 翻转 + 箭头，与 antd 参考截图逐像素比对',
  },
  {
    name: '@apollo-design/a11y',
    layer: 'L1',
    purpose:
      '运行时无障碍原语：焦点陷阱与焦点恢复、roving tabindex、active-descendant 管理、live region 播报器、typeahead 键盘搜索。无视觉语义，只管「可达性」',
    replaces: ['antd 内联 a11y 逻辑（本项目新增能力，antd 无对应独立包）'],
    risk: 'medium',
    readiness:
      FOUNDATION_READINESS['@apollo-design/a11y'] ??
      '至少落地 focus-trap（Modal/Drawer）+ roving（Menu/Tabs/Radio.Group）+ live-region（message/notification）三类原语',
  },
  {
    name: '@apollo-design/virtual-list',
    layer: 'L1',
    purpose: '虚拟滚动：定高/动态高度、横向、滚动到指定项、无视觉语义',
    replaces: ['@rc-component/virtual-list'],
    risk: 'high',
    readiness: FOUNDATION_READINESS['@apollo-design/virtual-list'],
  },
  {
    name: '@apollo-design/overlay',
    layer: 'L2',
    purpose:
      '锚定浮层的生命周期：触发动作（hover/click/focus/contextMenu）与显隐延迟、外部点击与 Esc 关闭、浮层堆叠与 z-index 协调、与 portal/position/a11y 的编排。不含定位几何（在 position），不含视觉语义',
    replaces: ['@rc-component/trigger(生命周期部分)'],
    risk: 'high',
    readiness:
      FOUNDATION_READINESS['@apollo-design/overlay'] ??
      '依赖 AR1（position）PoC 通过后开始；至少支持 click/hover/focus/contextMenu 四种触发与 mouseEnterDelay/mouseLeaveDelay',
  },
  {
    name: '@apollo-design/locale',
    layer: 'L2',
    purpose:
      '国际化数据包：75 个语言包 + Locale 类型定义 + 各组件 locale 分片。从 antd 的 locale 源生成（同 icons 的生成式做法），不手工维护',
    replaces: ['antd/locale/*'],
    risk: 'low',
    readiness:
      FOUNDATION_READINESS['@apollo-design/locale'] ??
      '生成管线可用 + Locale 类型与 antd 一致 + 至少 zh_CN / en_US 完整',
  },
  {
    name: '@apollo-design/form-core',
    layer: 'L2',
    purpose:
      '表单状态机 + 字段校验：字段注册/注销、依赖联动、异步校验、validateFields/setFieldsValue/getFieldsValue、rules 语义（含内置校验器）',
    replaces: ['@rc-component/form', '@rc-component/async-validator'],
    risk: 'high',
    readiness: FOUNDATION_READINESS['@apollo-design/form-core'],
  },
  {
    name: '@apollo-design/picker',
    layer: 'L2',
    purpose:
      '日期/时间面板引擎：日历网格生成、周/月/季/年面板切换、区间选择状态机、键盘导航、locale 适配',
    replaces: ['@rc-component/picker'],
    risk: 'high',
    readiness: FOUNDATION_READINESS['@apollo-design/picker'],
  },
  {
    name: '@apollo-design/test-utils',
    layer: '测试',
    purpose:
      '共享测试契约：mountTest / demoTest / a11yDemoTest / focusTest / rtlTest / rootPropsTest / domContractTest / themeTest / resetWarned / waitFrames',
    replaces: ['antd tests/shared/*'],
    risk: 'medium',
    readiness: FOUNDATION_READINESS['@apollo-design/test-utils'],
  },
];

const rcReplacements = RC_MAP.map((e) => ({
  ...e,
  usedBy: facts.rcUsedBy[e.pkg] ?? [],
  usedByCount: (facts.rcUsedBy[e.pkg] ?? []).length,
})).sort((a, b) => b.usedByCount - a.usedByCount);

const edges = [];
for (const name of componentNames) {
  for (const d of depsOf(name)) edges.push({ from: d, to: name, kind: 'runtime' });
  for (const t of facts.components[name].internalDepsType ?? []) {
    if (metaByName.has(t)) edges.push({ from: t, to: name, kind: 'type-only' });
  }
}

// 分层（按 dagLevel）
const layers = {};
for (const c of components) {
  const l = c.derived.dagLevel ?? 0;
  (layers[l] ??= []).push(c.name);
}

const dependenciesDoc = {
  $schema: './schema.json#/definitions/DependenciesFile',
  $comment:
    'GENERATED by registry/tools/gen-registry.mjs from source/antd-<v>.raw.json + source/rc-map.mjs. Do not hand-edit.',
  antdVersion: facts.antdVersion,
  generatedAt: new Date().toISOString(),
  sourceFacts: path.relative(ROOT, rawFile),

  summary: {
    antdRuntimeDependencies: facts.dependencyCount,
    rcPackagesDirect: Object.keys(facts.rcUsedBy).length,
    rcPackagesTransitive: RC_MAP.filter((e) => e.kind === 'transitive').length,
    apolloPackages: foundationPackages.filter((p) => p.name !== '@apollo-design/test-utils').length,
    strategyBreakdown: RC_MAP.reduce((acc, e) => {
      acc[e.strategy] = (acc[e.strategy] ?? 0) + 1;
      return acc;
    }, {}),
    componentEdgesRuntime: edges.filter((e) => e.kind === 'runtime').length,
    componentEdgesTypeOnly: edges.filter((e) => e.kind === 'type-only').length,
    maxDagLevel: Math.max(...components.map((c) => c.derived.dagLevel ?? 0)),
  },

  strategyLegend: {
    reuse:
      '直接复用 —— 该包与框架无关（纯数据/纯算法），**且不属于 Ant Design 生态**，复用是达成一致性最省成本的路径',
    generate:
      '构建期固化 —— 来自 Ant Design 生态、内容是数据：只作 gen-*.mjs 的数据源，产出随包发布，运行时零引用（R7）',
    port: '移植 + 差分验证 —— 来自 Ant Design 生态、内容是算法：移植进 @apollo-design/*，上游降级为 *.oracle.test.ts 的 Oracle（R7）',
    apollo: '由 @apollo-design 独立包承接 —— ≥2 消费者且无视觉语义',
    'in-ui': '由 packages/ui 内部承接 —— 单一消费者，独立成包属过度抽象',
    drop: '不需要 —— Vue 原生已覆盖，或仅服务 React',
  },

  foundationPackages,
  rcReplacements,
  ecosystemReuse: rcReplacements.filter((e) => e.strategy === 'reuse'),

  componentDag: {
    nodes: Object.fromEntries(
      components.map((c) => [
        c.name,
        {
          priority: c.priority,
          dagLevel: c.derived.dagLevel,
          dependsOn: c.dependencies.components,
          dependedBy: facts.dependedBy[c.name] ?? [],
          unblocks: c.derived.unblocks,
        },
      ]),
    ),
    edges,
    layers,
  },

  cycleResolutions: CYCLE_RESOLUTIONS,
};

// ---------------------------------------------------------------------------
// 3) tokens.json
// ---------------------------------------------------------------------------
const tokenGroupsFromAntd = facts.tokens.componentGroups;

const tokensDoc = {
  $schema: './schema.json#/definitions/TokensFile',
  $comment:
    'GENERATED by registry/tools/gen-registry.mjs. antd 侧的 Token 清单是事实；status 是我们自己的覆盖进度。',
  antdVersion: facts.antdVersion,
  generatedAt: new Date().toISOString(),

  cssVar: {
    prefix: 'apollo',
    // 变量名与 antd 的 cssVar 命名保持同构，便于对照排查视觉差异
    naming: '--<prefix>-<token-name-kebab>',
    example: '--apollo-color-primary',
    mode: 'zero-runtime',
    note: '本项目唯一模式：静态 CSS + CSS 变量。不提供运行时 CSS-in-JS 路径。',
  },

  summary: {
    seed: facts.tokenStats['token.seed'],
    mapAggregate: facts.tokenStats['token.map.aggregate'],
    mapByCategory: {
      colors: facts.tokenStats['token.map.colors'],
      font: facts.tokenStats['token.map.font'],
      height: facts.tokenStats['token.map.height'],
      size: facts.tokenStats['token.map.size'],
      style: facts.tokenStats['token.map.style'],
    },
    aliasOwn: facts.tokenStats['token.alias.own'],
    aliasEffective: facts.tokenStats['token.alias.effective'],
    componentTokenGroups: facts.tokenStats['token.componentGroups'],
    componentTokensTotal: facts.tokenStats['componentTokens.total'],
    componentsWithTokens: facts.tokenStats['componentTokens.components'],
  },

  layers: {
    seed: { status: 'todo', tokens: facts.tokens.seed },
    map: {
      status: 'todo',
      aggregate: facts.tokens.map.aggregate,
      categories: {
        colors: facts.tokens.map.colors,
        font: facts.tokens.map.font,
        height: facts.tokens.map.height,
        size: facts.tokens.map.size,
        style: facts.tokens.map.style,
      },
    },
    alias: { status: 'todo', own: facts.tokens.alias, effective: facts.tokens.alias },
    component: {
      status: 'todo',
      groups: tokenGroupsFromAntd,
      perComponent: facts.componentTokens,
    },
  },

  algorithms: [
    { name: 'defaultAlgorithm', status: 'todo' },
    { name: 'darkAlgorithm', status: 'todo' },
    { name: 'compactAlgorithm', status: 'todo' },
  ],
};

// ---------------------------------------------------------------------------
// 写盘
// ---------------------------------------------------------------------------
fs.writeFileSync(
  path.join(OUT_DIR, 'components.json'),
  `${JSON.stringify(componentsDoc, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(OUT_DIR, 'dependencies.json'),
  `${JSON.stringify(dependenciesDoc, null, 2)}\n`,
);
fs.writeFileSync(path.join(OUT_DIR, 'tokens.json'), `${JSON.stringify(tokensDoc, null, 2)}\n`);

console.log(`[gen] antd ${facts.antdVersion}  (facts: ${path.relative(ROOT, rawFile)})`);
console.log(`[gen] components.json      ${components.length} components`);
console.log(`[gen]   byStatus   ${JSON.stringify(byStatus)}`);
console.log(`[gen]   byPriority ${JSON.stringify(byPriority)}`);
console.log(`[gen]   byGroup    ${JSON.stringify(componentsDoc.summary.byGroup)}`);
console.log(
  `[gen] dependencies.json    ${foundationPackages.length} foundation packages, ${rcReplacements.length} rc/ecosystem entries, ${edges.length} edges`,
);
console.log(
  `[gen] tokens.json          seed=${facts.tokenStats['token.seed']} map=${facts.tokenStats['token.map.aggregate']} alias=${facts.tokenStats['token.alias.own']}(own) componentGroups=${facts.tokenStats['token.componentGroups']} componentTokens=${facts.tokenStats['componentTokens.total']}`,
);

if (args.printDag) {
  console.log('\n=== 组件依赖 DAG（按层级） ===');
  const levelKeys = Object.keys(layers)
    .map(Number)
    .sort((a, b) => a - b);
  for (const l of levelKeys) {
    console.log(`\nL${l}:`);
    for (const name of layers[l]) {
      const c = components.find((x) => x.name === name);
      const deps = c.dependencies.components;
      console.log(
        `  ${name.padEnd(16)} ${c.priority} ${c.complexity.padEnd(3)} unblocks=${String(c.derived.unblocks).padStart(2)}` +
          (deps.length ? `  ← ${deps.join(', ')}` : ''),
      );
    }
  }
  console.log('\n=== 推荐开发顺序（priority → unblocks desc → complexity asc） ===');
  const order = [...components]
    .filter((c) => c.status !== 'completed')
    .sort(
      (a, b) =>
        a.priorityNum - b.priorityNum ||
        b.derived.unblocks - a.derived.unblocks ||
        COMPLEXITY_ORDER.indexOf(a.complexity) - COMPLEXITY_ORDER.indexOf(b.complexity),
    );
  order.slice(0, 20).forEach((c, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. ${c.name.padEnd(16)} ${c.priority} ${c.complexity.padEnd(3)} unblocks=${c.derived.unblocks} blockedBy=[${c.blockedBy.join(', ')}]`,
    );
  });
}
