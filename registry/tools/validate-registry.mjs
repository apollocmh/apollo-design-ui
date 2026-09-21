#!/usr/bin/env node
/**
 * validate-registry.mjs
 *
 * 把「规范」变成「可执行的检查」。
 *
 * 本脚本是 AGENTS.md / ARCHITECTURE.md / WORKFLOW.md 中那些约束的执行者。
 * 它必须能在 CI 中运行，且任何 ERROR 都会让构建失败。
 *
 * 检查项：
 *   E1  三个 registry 文件存在且可解析
 *   E2  components.json 的状态字段取值合法
 *   E3  completed 的组件必须 7 个维度全部 done
 *   E4  组件级运行时 DAG 无环
 *   E5  优先级不得违反 DAG 拓扑序（组件优先级不得早于其依赖）
 *   E6  blockedBy 与实际依赖状态一致
 *   E7  dependencies.json 的边与 components.json 的依赖一致
 *   E8  foundation 包引用合法
 *   E9  每个组件都有 compat fixture 目录（completed 组件必须有）
 *   E10 无硬编码视觉值（对已实现的组件做静态扫描）
 *   E11 产物中无 React 痕迹（仅当 packages 下有 dist 或 es 目录时检查）
 *   E12 meta 与 antd 事实一致（组件清单、Token 数）
 *   E13 compat fixture schema 存在
 *   E14 foundation.json 存在，且与 dependencies.json / components.json 一致
 *   E15 foundation 包的顺序约束（phase2Order 唯一、implOrder 拓扑有效、PoC 豁免规则）
 *   E16 foundation 包进度字段合法 + completed 必须真正完成（含覆盖率与构建门禁）+
 *       PoC 收口必须有 pocResult 结论，且其登记的偏差必须真实存在
 *   E17 blockedBy 必须指向已登记的开放决策
 *
 * 用法：
 *   node registry/tools/validate-registry.mjs
 *   node registry/tools/validate-registry.mjs --strict   # 把 WARN 也当失败
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const REGISTRY = path.join(ROOT, 'registry');
const UI_SRC = path.join(ROOT, 'packages/ui/src');

const strict = process.argv.includes('--strict');

const errors = [];
const warnings = [];
const passed = [];

const err = (code, msg) => errors.push({ code, msg });
const warn = (code, msg) => warnings.push({ code, msg });
const ok = (code, msg) => passed.push({ code, msg });

// ---------------------------------------------------------------------------
function readJsonOrNull(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err('E1', `无法解析 ${path.relative(ROOT, file)}: ${e.message}`);
    return null;
  }
}

const componentsDoc = readJsonOrNull(path.join(REGISTRY, 'components.json'));
const depsDoc = readJsonOrNull(path.join(REGISTRY, 'dependencies.json'));
const tokensDoc = readJsonOrNull(path.join(REGISTRY, 'tokens.json'));

if (!componentsDoc || !depsDoc || !tokensDoc) {
  err('E1', 'registry 文件缺失。请先运行: node registry/tools/gen-registry.mjs');
  report();
}

function report() {
  for (const p of passed) console.log(`  ✅ ${p.code}  ${p.msg}`);
  for (const w of warnings) console.log(`  ⚠️  ${w.code}  ${w.msg}`);
  for (const e of errors) console.log(`  ❌ ${e.code}  ${e.msg}`);
  console.log();
  if (errors.length) {
    console.log(`registry validate: ${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(1);
  }
  if (strict && warnings.length) {
    console.log(`registry validate: --strict 模式下 ${warnings.length} 个 warning 视为失败`);
    process.exit(1);
  }
  console.log(
    `registry validate: OK (${passed.length} checks passed, ${warnings.length} warnings)`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// E2 / E3  状态字段合法性
// ---------------------------------------------------------------------------
/**
 * 组件的 11 项 Definition of Done 维度。
 * 与 WORKFLOW.md §DoD 一一对应：G1 分析 → G2 设计 → G3 Token → CSS →
 * L1 单测 / L2 交互 / L3 类型 / L5 a11y / L6 视觉 → G10 兼容 → G11 文档。
 */
const DIMENSIONS = [
  'antdApiStatus', // G1 · antd API 分析
  'apiStatus', // G2 · Vue API 设计
  'tokenStatus', // G3 · Component Token
  'styleStatus', // CSS
  'unitStatus', // L1 · 单元测试
  'interactionStatus', // L2 · 交互测试
  'typeStatus', // L3 · 类型测试
  'a11yStatus', // L5 · 无障碍
  'visualStatus', // L6 · 视觉回归
  'compatStatus', // G10 · React 兼容性（偏差已登记）
  'docsStatus', // G11 · 文档
];
const DIMENSION_VALUES = ['todo', 'analyzing', 'in-progress', 'done', 'blocked', 'n/a'];
const COMPONENT_STATUS = [
  'todo',
  'analyzing',
  'implementing',
  'testing',
  'visual-review',
  'blocked',
  'completed',
];

const components = componentsDoc.components;
const byName = new Map(components.map((c) => [c.name, c]));

for (const c of components) {
  if (!COMPONENT_STATUS.includes(c.status)) {
    err('E2', `${c.name}.status 取值非法: ${c.status}`);
  }
  for (const d of DIMENSIONS) {
    if (!DIMENSION_VALUES.includes(c[d])) {
      err('E2', `${c.name}.${d} 取值非法: ${c[d]}`);
    }
  }
}
if (!errors.some((e) => e.code === 'E2')) {
  ok('E2', `${components.length} 个组件的状态字段取值全部合法`);
}

for (const c of components) {
  if (c.status !== 'completed') continue;
  const unfinished = DIMENSIONS.filter((d) => c[d] !== 'done' && c[d] !== 'n/a');
  if (unfinished.length) {
    err(
      'E3',
      `${c.name} 标记为 completed，但以下维度未 done: ${unfinished
        .map((d) => `${d}=${c[d]}`)
        .join(', ')}`,
    );
  }
}
if (!errors.some((e) => e.code === 'E3')) {
  const done = components.filter((c) => c.status === 'completed').length;
  ok('E3', `completed 组件的维度一致性通过（当前 ${done} 个 completed）`);
}

// ---------------------------------------------------------------------------
// E4  DAG 无环
// ---------------------------------------------------------------------------
function detectCycle(names, depsOf) {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map(names.map((n) => [n, WHITE]));
  const stack = [];
  let found = null;

  function visit(n) {
    if (found) return;
    color.set(n, GRAY);
    stack.push(n);
    for (const d of depsOf(n)) {
      if (!color.has(d)) continue;
      if (color.get(d) === GRAY) {
        found = [...stack.slice(stack.indexOf(d)), d];
        return;
      }
      if (color.get(d) === WHITE) visit(d);
      if (found) return;
    }
    stack.pop();
    color.set(n, BLACK);
  }

  for (const n of names) {
    if (color.get(n) === WHITE) visit(n);
    if (found) break;
  }
  return found;
}

const names = components.map((c) => c.name);
const depsOf = (n) => byName.get(n)?.dependencies.components ?? [];

const cycle = detectCycle(names, depsOf);
if (cycle) {
  err('E4', `组件级运行时 DAG 存在环: ${cycle.join(' → ')}`);
} else {
  ok('E4', `组件级运行时 DAG 无环（${names.length} 节点）`);
}

// ---------------------------------------------------------------------------
// E5  优先级不得违反 DAG 拓扑序
// ---------------------------------------------------------------------------
const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'];
for (const c of components) {
  const mine = PRIORITY_ORDER.indexOf(c.priority);
  for (const d of c.dependencies.components) {
    const dep = byName.get(d);
    if (!dep) continue;
    const theirs = PRIORITY_ORDER.indexOf(dep.priority);
    if (mine < theirs) {
      err(
        'E5',
        `${c.name}(${c.priority}) 依赖 ${d}(${dep.priority})，但优先级早于其依赖 —— 会导致无法实现`,
      );
    }
  }
}
if (!errors.some((e) => e.code === 'E5')) {
  ok('E5', '全部组件的优先级均不早于其依赖（DAG 拓扑序一致）');
}

// ---------------------------------------------------------------------------
// E6  blockedBy 与实际状态一致
// ---------------------------------------------------------------------------
for (const c of components) {
  const expected = c.dependencies.components.filter(
    (d) => (byName.get(d)?.status ?? 'todo') !== 'completed',
  );
  const actual = [...c.blockedBy].sort();
  const exp = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(exp)) {
    warn(
      'E6',
      `${c.name}.blockedBy 与依赖状态不一致（registry=[${actual}] 期望=[${exp}]）。运行 gen-registry 刷新`,
    );
  }
}
if (!warnings.some((w) => w.code === 'E6')) {
  ok('E6', 'blockedBy 与依赖完成状态一致');
}

// ---------------------------------------------------------------------------
// E7  dependencies.json 与 components.json 的边一致
// ---------------------------------------------------------------------------
const edgeSet = new Set(
  depsDoc.componentDag.edges.filter((e) => e.kind === 'runtime').map((e) => `${e.from}→${e.to}`),
);
let mismatch = 0;
for (const c of components) {
  for (const d of c.dependencies.components) {
    if (!edgeSet.has(`${d}→${c.name}`)) {
      mismatch += 1;
      warn('E7', `dependencies.json 缺少运行时边 ${d}→${c.name}`);
    }
  }
}
for (const e of edgeSet) {
  const [from, to] = e.split('→');
  if (!depsOf(to).includes(from)) {
    mismatch += 1;
    warn('E7', `components.json 缺少 dependencies.json 中的边 ${e}`);
  }
}
if (mismatch === 0) ok('E7', `运行时依赖边一致（${edgeSet.size} 条）`);

// ---------------------------------------------------------------------------
// E8  foundation 包引用合法
// ---------------------------------------------------------------------------
const knownFoundation = new Set(depsDoc.foundationPackages.map((p) => p.name));
for (const c of components) {
  for (const f of c.dependencies.foundation) {
    if (!knownFoundation.has(f)) {
      err('E8', `${c.name} 引用了未在 dependencies.json 中声明的 foundation 包: ${f}`);
    }
  }
}
if (!errors.some((e) => e.code === 'E8')) {
  ok('E8', `foundation 包引用全部合法（${knownFoundation.size} 个包）`);
}

// ---------------------------------------------------------------------------
// E9  compat fixture 存在性
// ---------------------------------------------------------------------------
const FIXTURE_DIR = path.join(ROOT, 'tests/compat/fixtures');
let missingFixtures = 0;
for (const c of components) {
  const dir = path.join(FIXTURE_DIR, c.name);
  if (!fs.existsSync(dir)) {
    if (c.status === 'completed') {
      err(
        'E9',
        `${c.name} 已 completed 但缺少 compat fixture 目录 tests/compat/fixtures/${c.name}/`,
      );
      missingFixtures += 1;
    }
  }
}
if (missingFixtures === 0) ok('E9', 'completed 组件均有 compat fixture');

// ---------------------------------------------------------------------------
// E10  无硬编码视觉值（仅扫描已实现的组件）
// ---------------------------------------------------------------------------
const HARDCODED_PATTERNS = [
  // 2026-09-22 豁免 `linear-gradient(#fff 0 0)`：border-beam 的 mask 抠边用白色
  // 做遮罩形状（antd 逐字）—— 它是「全不透明遮罩」的技术常量，与主题无关，
  // 换成 token 反而会在深色主题下破坏遮罩。
  // `(?!\s*0\s+0\))`：豁免 `#fff 0 0)` —— mask 抠边渐变（border-beam，antd 逐字）。
  { re: /#[0-9a-fA-F]{3,8}\b(?!\s*0\s+0\))/, what: '十六进制颜色' },
  { re: /\brgba?\(/, what: 'rgb/rgba 颜色' },
  { re: /\bhsla?\(/, what: 'hsl/hsla 颜色' },
  // 模板字符串里的 `border-radius:${v('xxx')}` 在源码里以 `$` 开头（不是 `var(`），
  // 但运行时展开就是 `var(--apollo-xxx)` / `var(--ant-xxx)` —— 与 `var()` 同源。
  // 负向先行需要同时豁免这两种情形。
  //
  // ⚠️ 还要豁免**字面量 `0`**（2026-09-20 修，space 流报的假阳性）。
  //
  // 判据：这条规则要抓的是「硬编码的**设计值**」（半径/阴影这类应当走 Token 的视觉量）。
  // `border-radius: 0` 不是设计值，而是**结构性的方形重置** —— 它出现在
  // `genCompactItemStyle` 的「中间项不要圆角」与长手形式 `border-end-start-radius: 0`
  // 旁边，语义是「取消圆角」而不是「圆角是 0px」。而且**上游自己就这么写**：
  // `components/style/compact-item.ts` 的 `compactItemBorderRadius` 里是
  // `borderRadius: 0`（字面量），`compact-item-vertical.ts` 同样。
  //
  // 为什么不能改成走 Token：不存在「0 圆角」的 token（`borderRadius` 的默认值是 6px），
  // 硬造一个 `--apollo-border-radius-0` 会让 B7 判 FAIL（变量不在 `tokens.css` 里）。
  // 为什么值得修而不是让组件绕开：`genCompactItemStyle` 会被 Button / Input / Select /
  // DatePicker / … 共 10 个 Compact 消费方复用，每一个都会撞上这条假阳性。
  //
  // `0(?![\d.])` 而不是 `0\b`：后者会让 `0.5em` 也豁免（`0` 与 `.` 之间是词边界）。
  //
  // ⚠️ 顺带修掉一处**潜伏的假阳性**：原来是 `border-radius:\s*(?!var\(…)`，
  //    而 `\s*` 可以匹配**零个**字符 ⇒ 引擎在「冒号之后、空格之前」这个位置求值
  //    负向先行，`border-radius: var(--x)`（冒号后有空格）会被判成硬编码圆角。
  //    现在把空白收进先行内部（`(?!\s*(?:…))`），两种写法都正确。
  // 2026-09-22 补 `calc(`：badge 的 `border-radius:calc(var(--badge-indicator-height)/2)`
  // 是 token 的运算式，不是硬编码设计值（与 antd 的 `borderRadius/2` 同构）。
  // 2026-09-22 补 `inherit`：border-beam 的 `border-radius:inherit`（继承宿主圆角，
  // antd 逐字）—— 是继承语义，不是设计值。
  { re: /\bborder-radius:(?!\s*(?:var\(|calc\(|inherit\b|\$\{v\(|\d+%|0(?![\d.])))/, what: '硬编码圆角' },
  // 与 `border-radius` 同源：`box-shadow:none` 不是设计值（取消阴影的语义重置，与上游
  // `components/style/compact-item.ts` 同型；动效关闭的 `@media (prefers-reduced-motion)`
  // 也需要）；preset 阴影方块（13 色 × 1 条）由 `prepareComponentToken` 在**构建期**
  // 从 `color1` + `colorBgContainer` 求解，本仓零运行时拿不到中间变量来
  // `var(--apollo-*)` —— 这是 D7 的**实现形态** 之一。同 border-radius豁免 `${\w+}` 与 `none`。
  // 2026-09-22 补前导 `0`：`box-shadow:0 0 0 ${v('lineWidth')} ${v('colorBorderBg')}`
  //（badge/antd 逐字同构）的前三个 0 是结构偏移，真正的设计量 blur/color 都走 token。
  { re: /\bbox-shadow:(?!\s*(?:var\(|\$\{[\w]+|none\b|0(?![\d.])))/, what: '硬编码阴影' },
];

let hardcodeHits = 0;
if (fs.existsSync(UI_SRC)) {
  const componentDirs = fs
    .readdirSync(UI_SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name);

  for (const dir of componentDirs) {
    const styleDir = path.join(UI_SRC, dir, 'style');
    if (!fs.existsSync(styleDir)) continue;
    for (const f of fs.readdirSync(styleDir)) {
      if (!/\.(ts|tsx|vue|css)$/.test(f)) continue;
      const text = fs.readFileSync(path.join(styleDir, f), 'utf8');
      // 允许在 token.ts 中定义默认值（Token 默认值本来就是字面量）
      if (f === 'token.ts') continue;
      for (const { re, what } of HARDCODED_PATTERNS) {
        const m = text.match(re);
        if (m) {
          err('E10', `${dir}/style/${f} 存在${what}: ${m[0]} —— 必须使用 var(--apollo-*) Token`);
          hardcodeHits += 1;
        }
      }
    }
  }
}
if (hardcodeHits === 0) ok('E10', '已实现的组件样式中无硬编码视觉值');

// ---------------------------------------------------------------------------
// E11  产物中无 React 痕迹
// ---------------------------------------------------------------------------
/**
 * 扫描产物前先剥掉注释。
 *
 * 为什么必须剥：unbuild **不**剥离 JSDoc，而本仓库的注释里大量出现
 * 「曾经这样写」的示例代码，例如 `export type { … } from '@ant-design/icons-svg/es/types'`。
 * 不剥的话这些**说明文字**会被当成真实 import 报出来 —— E19 首次运行时就撞上了这个假阳性
 * （报 `dist/index.d.ts` 引用了上游类型，实际那 13 处命中全在注释里）。
 *
 * 只会减少假阳性，不会引入假阴性：真实 import 不可能出现在注释里。
 */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

const REACT_MARKERS = ['react', 'react-dom', '@rc-component', '@ant-design/cssinjs'];
let productScanned = 0;
for (const pkg of fs.existsSync(path.join(ROOT, 'packages'))
  ? fs.readdirSync(path.join(ROOT, 'packages'))
  : []) {
  for (const out of ['dist', 'es']) {
    const dir = path.join(ROOT, 'packages', pkg, out);
    if (!fs.existsSync(dir)) continue;
    productScanned += 1;
    const stack = [dir];
    while (stack.length) {
      const cur = stack.pop();
      for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
        const fp = path.join(cur, e.name);
        if (e.isDirectory()) stack.push(fp);
        else if (/\.(js|mjs|cjs)$/.test(e.name)) {
          const text = stripComments(fs.readFileSync(fp, 'utf8'));
          for (const marker of REACT_MARKERS) {
            // 匹配 import/require/from 中的模块说明符，避免误判注释或字符串内容
            const escaped = marker.replace(/[/-]/g, '[/-]');
            const specRe = new RegExp(
              `(?:from|require\\s*\\(|import\\s*\\()\\s*["']${escaped}(?:/[^"']*)?["']`,
            );
            if (specRe.test(text)) {
              err(
                'E11',
                `产物 ${path.relative(ROOT, fp)} 含 React 痕迹: ${marker}（违反 H1/H5/H6）`,
              );
            }
          }
        }
      }
    }
  }
}
if (productScanned === 0) {
  warn('E11', '尚未发现构建产物，跳过 React 痕迹扫描（Phase 2 起生效）');
} else if (!errors.some((e) => e.code === 'E11')) {
  ok('E11', `构建产物无 React 痕迹（扫描 ${productScanned} 个产物目录）`);
}

// ---------------------------------------------------------------------------
// E12  meta 与 antd 事实一致
// ---------------------------------------------------------------------------
const rawFiles = fs
  .readdirSync(path.join(REGISTRY, 'source'))
  .filter((f) => /^antd-.*\.raw\.json$/.test(f));
if (rawFiles.length) {
  const raw = readJsonOrNull(path.join(REGISTRY, 'source', rawFiles[rawFiles.length - 1]));
  if (raw && raw.antdVersion !== componentsDoc.antdVersion) {
    err(
      'E12',
      `components.json 的 antdVersion(${componentsDoc.antdVersion}) 与事实文件(${raw.antdVersion}) 不一致`,
    );
  } else if (raw) {
    // 组件数一致性
    const expectedCount = raw.componentDirs.filter(
      (d) => !['qrcode', 'row', 'col'].includes(d),
    ).length;
    if (expectedCount !== components.length) {
      err('E12', `组件数不一致: antd 事实 ${expectedCount} vs registry ${components.length}`);
    } else {
      ok('E12', `与 antd v${raw.antdVersion} 事实一致（${components.length} 个组件）`);
    }
    // Token 数一致性
    if (raw.tokenStats['token.seed'] !== tokensDoc.summary.seed) {
      err(
        'E12',
        `Seed Token 数不一致: ${raw.tokenStats['token.seed']} vs ${tokensDoc.summary.seed}`,
      );
    }
  }
} else {
  warn('E12', '未找到 antd 事实文件，跳过一致性检查');
}

// ---------------------------------------------------------------------------
// 额外：fixture 结构校验
// ---------------------------------------------------------------------------
const fixtureSchema = readJsonOrNull(path.join(ROOT, 'tests/compat/schema.json'));
if (fixtureSchema) ok('E13', 'tests/compat/schema.json 存在');
else warn('E13', 'tests/compat/schema.json 缺失，compat fixture 无法校验');

// ---------------------------------------------------------------------------
// E14  foundation.json 存在，且与 dependencies.json / components.json 一致
// ---------------------------------------------------------------------------
const FOUNDATION_FILE = path.join(REGISTRY, 'foundation.json');
const foundationDoc = readJsonOrNull(FOUNDATION_FILE);
const foundationPackages = foundationDoc?.packages ?? [];

if (!foundationDoc) {
  err('E14', 'registry/foundation.json 缺失。运行: node registry/tools/foundation-status.mjs');
} else {
  const declared = new Set(depsDoc.foundationPackages.map((p) => p.name));
  const actual = new Set(foundationPackages.map((p) => p.name));
  for (const n of declared) {
    if (!actual.has(n)) err('E14', `foundation.json 缺少 dependencies.json 已声明的包 ${n}`);
  }
  for (const n of actual) {
    if (!declared.has(n)) err('E14', `foundation.json 含未在 dependencies.json 声明的包 ${n}`);
  }
  for (const p of foundationPackages) {
    const real = components.filter((c) => c.dependencies.foundation.includes(p.name)).length;
    if (p.derived?.componentConsumers !== real) {
      err(
        'E14',
        `${p.name}.derived.componentConsumers=${p.derived?.componentConsumers} 与实际 ${real} 不一致。运行 foundation-status 刷新`,
      );
    }
  }
  if (!errors.some((e) => e.code === 'E14')) {
    ok(
      'E14',
      `foundation.json 与 dependencies/components 一致（${foundationPackages.length} 个包）`,
    );
  }
}

// ---------------------------------------------------------------------------
// E15  foundation 包的顺序约束
//
// phase2Order 与 implOrder 是两件事：
//   phase2Order = Phase 1 定下的推进顺序，含 AR1/AR2 的 PoC 槽位，**允许早于依赖包**，
//                 前提是 pocRequired=true（那个槽位做的是 PoC，不是完整实现）。
//   implOrder   = 推导的严格拓扑序，必须尊重 dependsOn。
// 若一个包 pocRequired=false 却排在其依赖之前，那是真错误 —— 它会无法开工。
// ---------------------------------------------------------------------------
const FOUNDATION_STATUS = [
  'todo',
  'analyzing',
  'implementing',
  'testing',
  'verifying',
  'blocked',
  'completed',
];
const FOUNDATION_DIMENSIONS = ['api', 'impl', 'types', 'tests', 'docs', 'pkg'];
const FOUNDATION_TEST_LAYERS = [
  'L1-unit',
  'L2-interaction',
  'L3-type',
  'L4-dom-contract',
  'L5-a11y',
  'L6-visual',
  'L7-build',
];

{
  const seenOrder = new Map();
  for (const p of foundationPackages) {
    if (seenOrder.has(p.phase2Order)) {
      err(
        'E15',
        `phase2Order 重复: ${seenOrder.get(p.phase2Order)} 与 ${p.name} 都是 ${p.phase2Order}`,
      );
    }
    seenOrder.set(p.phase2Order, p.name);
  }

  const fByName = new Map(foundationPackages.map((p) => [p.name, p]));
  for (const p of foundationPackages) {
    for (const d of p.dependsOn ?? []) {
      const dep = fByName.get(d);
      if (!dep) {
        err('E15', `${p.name} 依赖了未在 foundation.json 中声明的包 ${d}`);
        continue;
      }
      const mine = p.derived?.implOrder;
      const theirs = dep.derived?.implOrder;
      if (typeof mine === 'number' && typeof theirs === 'number' && mine <= theirs) {
        err(
          'E15',
          `implOrder 违反拓扑序: ${p.name}(${mine}) 依赖 ${d}(${theirs})，但前者不晚于后者`,
        );
      }
      if (p.phase2Order < dep.phase2Order && !p.pocRequired) {
        err(
          'E15',
          `${p.name}(phase2Order=${p.phase2Order}) 早于其依赖 ${d}(phase2Order=${dep.phase2Order})，但 pocRequired=false —— 要么调整顺序，要么标记该槽位为 PoC`,
        );
      }
    }
  }
  if (!errors.some((e) => e.code === 'E15')) {
    ok('E15', `foundation 顺序约束通过（phase2Order 唯一，implOrder 拓扑有效，PoC 豁免规则生效）`);
  }
}

/**
 * COMPATIBILITY.md §9.2 里**真实登记过**的偏差编号（D1、D2…）。
 *
 * 从 Markdown 表格里刮出来而不是硬编码：硬编码会在新增 D14 时静默过期，
 * 校验就退化成「长得像 D 编号就行」—— 那还不如不校验。
 */
const REGISTERED_DEVIATION_IDS = (() => {
  const file = path.join(ROOT, 'COMPATIBILITY.md');
  if (!fs.existsSync(file)) return new Set();
  const text = fs.readFileSync(file, 'utf8');
  const section = text.split(/^###\s+9\.2\s/m)[1]?.split(/^###\s+9\.3\s/m)[0] ?? '';
  return new Set([...section.matchAll(/^\|\s*(D\d+)\s*\|/gm)].map((m) => m[1]));
})();

// ---------------------------------------------------------------------------
// E16  foundation 包进度字段合法 + completed 必须真正完成
// ---------------------------------------------------------------------------
for (const p of foundationPackages) {
  if (!FOUNDATION_STATUS.includes(p.status)) {
    err('E16', `${p.name}.status 取值非法: ${p.status}`);
  }
  if (!DIMENSION_VALUES.includes(p.pocStatus)) {
    err('E16', `${p.name}.pocStatus 取值非法: ${p.pocStatus}`);
  }

  // PoC 收口必须有结论 —— 防止「PoC 已完成」退化成一个无法追溯结论的状态字符串，
  // 那正是本项目一直在堵的「虚假进度」：状态说 done，但没人知道证明了什么。
  if (p.pocStatus === 'done') {
    const r = p.pocResult;
    if (!r) {
      err(
        'E16',
        `${p.name} pocStatus=done 但缺少 pocResult —— PoC 结论必须可追溯（status / summary / evidence）`,
      );
    } else {
      if (!['pass', 'pass-with-deviations', 'fail'].includes(r.status)) {
        err('E16', `${p.name}.pocResult.status 取值非法: ${r.status}`);
      }
      if (typeof r.summary !== 'string' || !r.summary.trim()) {
        err('E16', `${p.name}.pocResult.summary 为空 —— 必须写明「证明了什么 / 否证了什么」`);
      }
      if (r.status === 'fail' && p.status === 'completed') {
        err('E16', `${p.name} PoC 结论为 fail 却标记 completed`);
      }
      // PoC 里登记的偏差必须能**追到登记处**，否则等于没登记。
      // 注意不能只校验「长得像 D 编号」—— D99 也长得像，但它并不存在。
      for (const dev of r.deviations ?? []) {
        const isRegisteredCompat = REGISTERED_DEVIATION_IDS.has(dev);
        const isDecisionId = (foundationDoc?.openDecisions ?? []).some((d) => d.id === dev);
        if (!isRegisteredCompat && !isDecisionId) {
          err(
            'E16',
            `${p.name}.pocResult.deviations 引用了未登记的偏差 "${dev}" —— 必须真实出现在 COMPATIBILITY.md §9.2 的表格里，或是已登记的开放决策 id`,
          );
        }
      }
    }
  }
  for (const d of FOUNDATION_DIMENSIONS) {
    if (!DIMENSION_VALUES.includes(p.dimensions?.[d])) {
      err('E16', `${p.name}.dimensions.${d} 取值非法: ${p.dimensions?.[d]}`);
    }
  }
  for (const l of FOUNDATION_TEST_LAYERS) {
    if (!DIMENSION_VALUES.includes(p.testLayers?.[l])) {
      err('E16', `${p.name}.testLayers["${l}"] 取值非法: ${p.testLayers?.[l]}`);
    }
  }

  // n/a 必须能指向架构依据 —— 不允许用 n/a 掩盖未做
  const naLayers = FOUNDATION_TEST_LAYERS.filter((l) => p.testLayers?.[l] === 'n/a');
  if (naLayers.length && !p.layerNotes) {
    err(
      'E16',
      `${p.name} 有 ${naLayers.length} 个测试层标为 n/a（${naLayers.join(', ')}）但缺少 layerNotes 说明架构依据`,
    );
  }

  if (p.status !== 'completed') continue;

  const badDims = FOUNDATION_DIMENSIONS.filter((d) => !['done', 'n/a'].includes(p.dimensions[d]));
  if (badDims.length) {
    err(
      'E16',
      `${p.name} 标记 completed 但维度未完成: ${badDims.map((d) => `${d}=${p.dimensions[d]}`).join(', ')}`,
    );
  }
  const badLayers = FOUNDATION_TEST_LAYERS.filter(
    (l) => !['done', 'n/a'].includes(p.testLayers[l]),
  );
  if (badLayers.length) {
    err('E16', `${p.name} 标记 completed 但测试层未完成: ${badLayers.join(', ')}`);
  }
  if (p.verification?.thresholds?.met !== true) {
    err(
      'E16',
      `${p.name} 标记 completed 但覆盖率阈值未达标（thresholds.met=${p.verification?.thresholds?.met}）`,
    );
  }
  if (p.verification?.build?.status !== 'passing') {
    err(
      'E16',
      `${p.name} 标记 completed 但构建未通过（build.status=${p.verification?.build?.status}）`,
    );
  }
  if ((p.blockedBy ?? []).length) {
    err('E16', `${p.name} 标记 completed 但仍有 blockedBy: ${p.blockedBy.join(', ')}`);
  }
}
if (!errors.some((e) => e.code === 'E16')) {
  ok(
    'E16',
    `foundation 包进度字段合法（${foundationPackages.length} 个包，n/a 均有架构依据，completed 均通过门禁）`,
  );
}

// ---------------------------------------------------------------------------
// E17  blockedBy 必须指向已登记的开放决策
// 否则「项目卡在什么问题上」会重新散落到对话历史里，这正是本注册表要消除的问题。
// ---------------------------------------------------------------------------
{
  const decisions = foundationDoc?.openDecisions ?? [];
  const decisionStatus = new Map(decisions.map((d) => [d.id, d.status]));

  for (const d of decisions) {
    if (!d.id || !d.question || !d.impact || !d.status) {
      err(
        'E17',
        `openDecisions 条目字段不完整（需要 id/question/impact/status）: ${JSON.stringify(d.id ?? d)}`,
      );
    }
  }

  for (const p of foundationPackages) {
    for (const b of p.blockedBy ?? []) {
      if (!decisionStatus.has(b)) {
        err(
          'E17',
          `${p.name}.blockedBy 引用了未登记的决策 "${b}" —— 阻塞原因必须写进 openDecisions 才能被追踪`,
        );
      } else if (decisionStatus.get(b) === 'decided') {
        err('E17', `${p.name}.blockedBy 引用了已裁决的决策 "${b}" —— 裁决后应解除阻塞并刷新状态`);
      }
    }
  }
  if (!errors.some((e) => e.code === 'E17')) {
    ok('E17', `blockedBy 全部指向已登记的开放决策（${decisions.length} 项决策）`);
  }
}

// ---------------------------------------------------------------------------
// E18  workstreams.json 与 registry 其余部分一致，且并行批次本身合法
//
// 为什么需要：可并行任务列表一旦与 components/foundation 漂移，「按图施工」就会
// 变成「按过期图施工」。批次合法性（无跨泳道 exclusive 冲突、不超并发上限）也必须
// 由工具保证 —— 人眼检查 9 个 item 的两两冲突关系是不现实的。
// ---------------------------------------------------------------------------
{
  const wsFile = path.join(REGISTRY, 'workstreams.json');
  if (!fs.existsSync(wsFile)) {
    err('E18', 'registry/workstreams.json 缺失。运行: node registry/tools/gen-workstreams.mjs');
  } else {
    const w = JSON.parse(fs.readFileSync(wsFile, 'utf8'));
    const wsItems = w.items ?? [];
    const itemById = new Map(wsItems.map((i) => [i.id, i]));
    const declaredWs = new Set((w.workstreams ?? []).map((x) => x.id));
    const declaredCs = new Set((w.conflictSets ?? []).map((x) => x.id));
    const exclusiveCs = new Set(
      (w.conflictSets ?? []).filter((x) => x.mode === 'exclusive').map((x) => x.id),
    );
    const declaredWaves = new Set((w.waves ?? []).map((x) => x.id));
    const decisionIds = new Set((foundationDoc?.openDecisions ?? []).map((d) => d.id));

    // (a) 引用完整性
    for (const it of wsItems) {
      if (!declaredWs.has(it.workstream)) {
        err('E18', `${it.id}.workstream 引用了未声明的泳道 ${it.workstream}`);
      }
      if (!declaredWaves.has(it.wave)) {
        err('E18', `${it.id}.wave 引用了未声明的波次 ${it.wave}`);
      }
      for (const c of it.conflicts ?? []) {
        if (!declaredCs.has(c)) err('E18', `${it.id}.conflicts 引用了未声明的冲突集 ${c}`);
      }
      for (const d of it.dependsOn ?? []) {
        if (!itemById.has(d)) err('E18', `${it.id}.dependsOn 引用了不存在的 Item ${d}`);
      }
      for (const d of it.softBlockers ?? []) {
        if (!decisionIds.has(d)) err('E18', `${it.id}.softBlockers 引用了未登记的决策 ${d}`);
      }
      if (it.id.startsWith('X:') && it.decidedBy?.length) {
        for (const d of it.decidedBy) {
          if (!decisionIds.has(d)) err('E18', `${it.id}.decidedBy 引用了未登记的决策 ${d}`);
        }
      }
    }

    // (b) 覆盖率：13 个 foundation 包 + 72 个组件都必须有对应 Item，否则会被漏做
    for (const p of foundationPackages) {
      if (!itemById.has(`FND:${p.dir}`)) {
        err('E18', `foundation 包 ${p.name} 在 workstreams.json 中没有对应的 Work Item`);
      }
      if (p.pocRequired && !itemById.has(`FND:${p.dir}:poc`)) {
        err('E18', `${p.name} 要求 PoC，但 workstreams.json 缺少 FND:${p.dir}:poc`);
      }
    }
    for (const c of components) {
      if (!itemById.has(`COMP:${c.name}`)) {
        err('E18', `组件 ${c.name} 在 workstreams.json 中没有对应的 Work Item`);
      }
    }

    // (c) Item 依赖图无环（含 PoC → 完整实现 的边）
    {
      const state = new Map();
      const stack = [];
      const visit = (id) => {
        if (state.get(id) === 2) return;
        if (state.get(id) === 1) {
          const from = stack.indexOf(id);
          err('E18', `Work Item 依赖存在环: ${stack.slice(from).concat(id).join(' → ')}`);
          return;
        }
        state.set(id, 1);
        stack.push(id);
        for (const d of itemById.get(id)?.dependsOn ?? []) if (itemById.has(d)) visit(d);
        stack.pop();
        state.set(id, 2);
      };
      for (const it of wsItems) visit(it.id);
    }

    // (d) 批次合法性：ready 状态一致、无跨泳道 exclusive 冲突、不超并发上限
    {
      const batch = (w.currentBatch ?? []).map((id) => itemById.get(id));
      for (const b of batch) {
        if (!b) err('E18', `currentBatch 引用了不存在的 Item ${b}`);
        else if (b.status !== 'ready') {
          err('E18', `currentBatch 含非 ready 的 Item ${b.id}（status=${b.status}）`);
        }
      }
      const usedBy = new Map();
      const laneLoad = new Map();
      for (const b of batch) {
        if (!b) continue;
        for (const c of b.conflicts ?? []) {
          if (!exclusiveCs.has(c)) continue;
          if (!usedBy.has(c)) usedBy.set(c, new Set());
          usedBy.get(c).add(b.workstream);
          if (usedBy.get(c).size > 1) {
            err('E18', `currentBatch 中 ${c} 被多个泳道同时占用: ${[...usedBy.get(c)].join(', ')}`);
          }
        }
        laneLoad.set(b.workstream, (laneLoad.get(b.workstream) ?? 0) + 1);
      }
      const wsMax = new Map((w.workstreams ?? []).map((x) => [x.id, x.maxParallel]));
      for (const [lane, n] of laneLoad) {
        const max = wsMax.get(lane) ?? 1;
        if (n > max) err('E18', `currentBatch 中泳道 ${lane} 有 ${n} 个 Item，超过并发上限 ${max}`);
      }
    }

    // (e) 泳道归属与 components.json 的 group 一致（防止手改 workstreams.json 造成漂移）
    {
      const groupToWs = new Map();
      for (const ws of w.workstreams ?? []) {
        // 成员反推：从 items 里取该泳道下 kind=component 的 group
        const groups = new Set(
          wsItems
            .filter((i) => i.workstream === ws.id && i.kind === 'component')
            .map((i) => i.group),
        );
        if (groups.size > 1) {
          err('E18', `泳道 ${ws.id} 混入了多个组件分组: ${[...groups].join(', ')}`);
        }
        if (groups.size === 1) groupToWs.set([...groups][0], ws.id);
      }
      for (const c of components) {
        const it = itemById.get(`COMP:${c.name}`);
        if (it && groupToWs.get(c.group) && groupToWs.get(c.group) !== it.workstream) {
          err(
            'E18',
            `组件 ${c.name}（group=${c.group}）被分到 ${it.workstream}，与同组其它组件不一致`,
          );
        }
      }
    }

    if (!errors.some((e) => e.code === 'E18')) {
      ok(
        'E18',
        `workstreams.json 一致（${wsItems.length} 个 Item / ${(w.workstreams ?? []).length} 条泳道 / 批次 ${(w.currentBatch ?? []).length} 个，无环、无跨泳道冲突、未超并发）`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// E19  R7：发布包零 Ant Design 运行时依赖
//
// 两道扫描缺一不可：
//   ① package.json 的 dependencies —— 决定 `npm install` 会给用户装什么。
//      只删 import 但留着 dependencies，用户照样会被装上 @ant-design/*。
//   ② 构建产物的 import 说明符 —— 决定运行时真的去解析谁。
//      只改 package.json 不改代码，产物会在用户环境里 MODULE_NOT_FOUND。
//
// 本检查**不**覆盖（它们不进用户依赖树，是 R7 允许的三种位置）：
//   - devDependencies（构建期数据源 / 测试 Oracle）
//   - registry/tools/gen-*.mjs、tests/compat/、*.oracle.test.ts
// ---------------------------------------------------------------------------
const ANTD_RUNTIME_FORBIDDEN = [
  /^@ant-design\//,
  /^antd$/,
  /^react(-dom)?$/,
  /^@rc-component\//,
  /^rc-/,
];
const pkgDir = path.join(ROOT, 'packages');
let e19Pkgs = 0;
for (const dir of fs.existsSync(pkgDir) ? fs.readdirSync(pkgDir) : []) {
  const manifest = path.join(pkgDir, dir, 'package.json');
  if (!fs.existsSync(manifest)) continue;
  let json;
  try {
    json = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  } catch {
    err('E19', `packages/${dir}/package.json 无法解析`);
    continue;
  }
  // private 包（test-utils）不发布，不受约束
  if (json.private === true) continue;
  e19Pkgs += 1;
  for (const dep of Object.keys(json.dependencies ?? {})) {
    if (ANTD_RUNTIME_FORBIDDEN.some((re) => re.test(dep))) {
      err(
        'E19',
        `packages/${dir} 的 dependencies 含 ${dep} —— 违反 R7。` +
          `antd 生态包只能作构建期数据源 / 测试 Oracle，请移到 devDependencies`,
      );
    }
  }
}

let productScannedE19 = 0;
for (const dir of fs.existsSync(pkgDir) ? fs.readdirSync(pkgDir) : []) {
  for (const out of ['dist', 'es']) {
    const target = path.join(pkgDir, dir, out);
    if (!fs.existsSync(target)) continue;
    productScannedE19 += 1;
    const stack = [target];
    while (stack.length) {
      const cur = stack.pop();
      for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
        const fp = path.join(cur, e.name);
        if (e.isDirectory()) stack.push(fp);
        else if (/\.(js|mjs|cjs|d\.ts)$/.test(e.name)) {
          // 剥注释 + 只认 import/require 的模块说明符，两道都必要：
          // 只剥注释仍会命中字符串字面量，只认说明符仍会命中注释里的示例。
          const hit = stripComments(fs.readFileSync(fp, 'utf8')).match(
            /(?:from|require\s*\(|import\s*\()\s*["'](@ant-design\/[^"']+|antd)["']/,
          );
          if (hit) {
            err(
              'E19',
              `产物 ${path.relative(ROOT, fp)} 运行时引用了 ${hit[1]}（违反 R7）—— 数据必须构建期固化`,
            );
          }
        }
      }
    }
  }
}

if (!errors.some((e) => e.code === 'E19')) {
  ok(
    'E19',
    `发布包零 @ant-design/* 运行时依赖（${e19Pkgs} 个包 + ${productScannedE19} 个产物目录；antd 仅存在于 devDeps / 生成器 / Oracle）`,
  );
}

report();
