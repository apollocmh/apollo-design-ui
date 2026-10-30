#!/usr/bin/env node
/**
 * Validate static inventory, dependency/production contracts, and the single current audit state.
 * Phase-one architecture completion never requires historical per-component nine-dimensional fields.
 * Nine-dimensional whole-library gates remain in verify:full on one frozen version.
 * --strict treats warnings as failures; all errors always fail.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAudit, validateAudit } from './audit-workflow.mjs';

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
// E2 / E3  静态清单与唯一当前任务状态分工
// ---------------------------------------------------------------------------
const components = componentsDoc.components;
const byName = new Map(components.map((component) => [component.name, component]));
const retiredComponentFields = [
  'status',
  'blockedBy',
  'blockers',
  'apiStatus',
  'tokenStatus',
  'styleStatus',
  'unitStatus',
  'interactionStatus',
  'typeStatus',
  'a11yStatus',
  'visualStatus',
  'docsStatus',
];
for (const component of components) {
  const retired = retiredComponentFields.filter((key) => Object.hasOwn(component, key));
  if (retired.length)
    err(
      'E2',
      `${component.name}: current progress belongs to vue-native-audit.json (${retired.join(', ')})`,
    );
}
if (!errors.some((entry) => entry.code === 'E2'))
  ok('E2', '组件清单仅保留静态元数据，无第二份当前进度');
let audit;
try {
  audit = validateAudit(readAudit(ROOT), ROOT);
  ok('E3', '架构整改与最终验收状态分离；historical_passed不冒充冻结版本passed');
} catch (error) {
  err('E3', error.message);
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
  if (!PRIORITY_ORDER.includes(c.priority)) err('E5', `${c.name} 优先级非法: ${c.priority}`);
  for (const dependency of [...c.dependencies.components, ...c.dependencies.typeOnly]) {
    if (!byName.has(dependency)) err('E5', `${c.name} 引用了未登记组件: ${dependency}`);
  }
}
if (!errors.some((e) => e.code === 'E5'))
  ok('E5', '优先级与依赖引用合法；任务排序不受上游拓扑约束');

// ---------------------------------------------------------------------------
// E6  实际整改依赖由唯一任务状态定义，静态 imports 只表示影响面
// ---------------------------------------------------------------------------
if (audit) ok('E6', '整改依赖与源码 import 图分离，不等待基础包整包最终验收');

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
// E9  当前组件源码的公开契约交付物
// ---------------------------------------------------------------------------
let missingContracts = 0;
for (const component of components) {
  const dir = path.join(UI_SRC, component.name);
  for (const entry of ['index.ts', '__tests__', 'index.zh-CN.md', 'index.en-US.md']) {
    if (!fs.existsSync(path.join(dir, entry))) {
      err('E9', `${component.name} 缺少 Apollo 契约交付物: ${entry}`);
      missingContracts += 1;
    }
  }
}
if (missingContracts === 0) ok('E9', '源码具备本库契约、双语文档与回归目录');

// ---------------------------------------------------------------------------
// E10  无硬编码视觉值（仅扫描已实现的组件）
// ---------------------------------------------------------------------------
/**
 * 现存装饰色的精确例外，保留视觉兼容性，不扩大为通用白名单。
 * 新例外必须解释素材/几何用途与主题影响；上游存在相同字面量不构成充分理由。
 */
const ANTD_LITERAL_COLOR_SKIP =
  /rgba\(255,\s*255,\s*255,\s*[\d.]+\)|rgba\(0,\s*0,\s*0,\s*0(?:\.(?:1|2|3|04|45))?\)|rgba\((?:100,\s*180,\s*255,\s*0\.98|180,\s*140,\s*255,\s*0\.95|100,\s*220,\s*220,\s*0\.9|255,\s*150,\s*200,\s*0\.88|160,\s*190,\s*255,\s*0\.88|120,\s*170,\s*255,\s*0\.85|160,\s*150,\s*245,\s*0\.85|130,\s*200,\s*220,\s*0\.85)\)/;

const HARDCODED_PATTERNS = [
  // 2026-09-22 豁免 `linear-gradient(#fff 0 0)`：border-beam 的 mask 抠边用白色
  // 做遮罩形状（antd 逐字）—— 它是「全不透明遮罩」的技术常量，与主题无关，
  // 换成 token 反而会在深色主题下破坏遮罩。
  // `(?!\s*0\s+0\))`：豁免 `#fff 0 0)` —— mask 抠边渐变（border-beam，antd 逐字）。
  // 2026-09-22 豁免 Component Token 的 CSS 变量**声明行**：`--x-tag-default-bg:#f5f5f5`
  // 是 prepareComponentToken 的 seed 实色产物（antd cssVar 输出同为实色）——
  // 声明在根类、规则侧全部 var() 消费，与「规则里硬编码色值」不同性质。
  // 判据：该行形如 `--{prefix}-component-token-name:<hex>`（声明而非消费）。
  //
  // 2026-10-01 加 `skip: /#000000(?:80|33)\b/` —— date-picker 的**上游产物本身就是
  // 这两个值**，逐条给出出处：
  //
  //   上游 `components/date-picker/style/panel.js`：
  //   - `:389`  `color: new FastColor(colorTextLightSolid).setA(0.5).toHexString()`
  //   - `:471`  `background: new FastColor(controlItemBgActive).setA(0.2).toHexString()`
  //
  //   🚨 这两个 token 在本仓的对齐口径（antd 6.6.4 + `cssVar: true`，与
  //   `tests/visual/debug/extract-date-picker-css.mjs:133` 一致）下，
  //   `token.colorTextLightSolid` 的值是**变量引用字符串**
  //   （`var(--ant-color-text-light-solid)`），`FastColor` 解析不了它 ⇒ 回落 `#000000`。
  //
  //   **决定性证据就在本仓产物里**：同一条规则的另一行是
  //   `color:var(--apollo-color-text-light-solid)`（来自上游 `:392` 的**直接**使用）
  //   —— 同一个 token 一处被输出成 `var(...)`、一处被 `FastColor` 算成黑色，
  //   只能解释为「值是变量引用」。实测 `new FastColor(undefined).setA(0.5).toHexString()`
  //   ⇒ `#00000080`；而 `theme.getDesignToken().colorTextLightSolid` ⇒ `#fff`
  //   （**不是** undefined）⇒ 排除「token 缺失」这一解释。
  //
  //   ⇒ 改成 `#ffffff80` / `#e6f4ff33` 是「看起来更对」，但会与 antd 的**真实渲染**分叉
  //   （L6 会因此判红）⇒ 保留字面量。分类 **UPSTREAM**（antd 在 cssVar 模式下的
  //   `FastColor` 降级），已登记 `packages/ui/src/date-picker/README.md` §2。
  {
    re: /#[0-9a-fA-F]{3,8}\b(?!\s*0\s+0\))/,
    what: '十六进制颜色',
    skip: /#000000(?:80|33)\b/,
  },
  // 2026-09-22 豁免「纯白 + alpha」的遮罩色（layout sider 的 hover::after，
  //    antd 逐字 `rgba(255, 255, 255, 0.2)`）：它是「叠一层半透明白」的技术常量，
  //    语义等价于 `colorWhite` + alpha，而本仓没有「带 alpha 的白色」token ——
  //    换 token 会改变产物（与上游分叉）。与 border-beam 的 `#fff 0 0)` 豁免同理。
  // 2026-09-25 把豁免清单提成 `ANTD_LITERAL_COLOR_SKIP`（见上方注释），加 image 的四类。
  { re: /\brgba?\(/, what: 'rgb/rgba 颜色', skip: ANTD_LITERAL_COLOR_SKIP },
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
  // 2026-09-24 补 min(：tooltip 的左右形态圆角是
  // `border-radius:min(var(--apollo-border-radius),var(--apollo-tooltip-max-vertical-content-radius))`
  // —— 两个 token 的 min() 运算（antd 的 Math.min(borderRadius, 8) 同构），不是硬编码设计值。
  // 2026-09-25 补 `100px`：image 预览工具栏的 pill 圆角 —— 上游写的是 `borderRadius: 100`
  // （字面量，不是 token），产物即 `border-radius:100px`；本仓没有「pill 圆角」token，
  // 换成 `border-radius-lg`(8px) 会与上游产物分叉（视觉上圆角会消失）。
  // 2026-09-28 补 `9999px`：segmented 的 shape:round 全圆角 —— 上游写的是
  // `borderRadius: 9999`（components/segmented/style/index.ts 字面量，非 token），
  // 与 100px 同判：没有「pill 圆角」token，换 token 会与上游产物分叉。
  // 2026-09-29 补 `1px`：tree 拖拽指示线的圆角 —— 上游写的是
  // `borderRadius: 1`（components/tree/style/index.js initComponentToken 字面量，
  // 非 token），与 image 100px / segmented 9999px 同判：没有对应 token，
  // 换 token 会与上游产物分叉。
  {
    re: /\bborder-radius:(?!\s*(?:var\(|calc\(|min\(|inherit\b|\$\{v\(|\d+%|100px\b|9999px\b|1px\b|0(?![\d.])))/,
    what: '硬编码圆角',
  },
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
      // 2026-09-22：按行扫描，跳过「CSS 变量声明行」（`--x-token:<value>`）——
      // Component Token 的 seed 实色（如 tag 的 default-bg:#f5f5f5）在声明行出现是
      // 契约（antd cssVar 产物同为实色），规则侧全部 var() 消费。整文件正则无法
      // 区分「声明」与「消费」，按行判据最可靠。
      const declLine = /--[\w$(){}.-]+\s*:\s*[^;]*[#rgb]/;
      for (const { re, what, skip } of HARDCODED_PATTERNS) {
        const hitLine = text.split('\n').find((line) => {
          const t = line.trim();
          if (t.startsWith('*') || t.startsWith('/*') || t.startsWith('//')) return false; // 注释里的色值是对账文本，不是代码
          if (declLine.test(line) && line.includes('--')) return false; // CSS 变量声明行（Component Token seed 实色）
          if (skip?.test(line)) return false; // 逐字豁免（见 HARDCODED_PATTERNS 的说明）
          return re.test(line);
        });
        if (hitLine) {
          const m = hitLine.trim().slice(0, 60);
          err('E10', `${dir}/style/${f} 存在${what}: ${m} —— 必须使用 var(--apollo-*) Token`);
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
  warn('E11', '尚未发现构建产物，尚未执行产物扫描；构建后必须重跑');
} else if (!errors.some((e) => e.code === 'E11')) {
  ok('E11', `构建产物无 React 痕迹（扫描 ${productScanned} 个产物目录）`);
}

// ---------------------------------------------------------------------------
// E12  meta 与 antd 事实一致
// ---------------------------------------------------------------------------
const sourceComponents = fs
  .readdirSync(UI_SRC)
  .filter(
    (name) => !name.startsWith('_') && fs.existsSync(path.join(UI_SRC, name, 'index.zh-CN.md')),
  );
for (const name of sourceComponents) {
  if (!byName.has(name)) err('E12', `Apollo 源码组件 ${name} 未登记`);
}
for (const c of components) {
  if (!fs.existsSync(path.join(UI_SRC, c.name, 'index.ts'))) err('E12', `${c.name} 缺少源码入口`);
}
if (new Set(names).size !== names.length) err('E12', 'Apollo 组件名称重复');
if (!errors.some((e) => e.code === 'E12'))
  ok('E12', 'Apollo 源码与自有组件清单一致（不要求上游对应物）');

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
{
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
    }
  }
  if (!errors.some((e) => e.code === 'E15')) {
    ok('E15', `foundation 依赖拓扑有效（历史 wave/phase2Order 不参与验收）`);
  }
}

// ---------------------------------------------------------------------------
// E16  基础包清单只保留静态事实，九维门禁属于第二阶段
// ---------------------------------------------------------------------------
const retiredFoundationFields = [
  'status',
  'pocStatus',
  'pocResult',
  'doneWhen',
  'dimensions',
  'testLayers',
  'verification',
  'blockedBy',
  'blockers',
];
for (const pkg of foundationPackages) {
  const retired = retiredFoundationFields.filter((key) => Object.hasOwn(pkg, key));
  if (retired.length)
    err(
      'E16',
      `${pkg.name}: current progress belongs to vue-native-audit.json (${retired.join(', ')})`,
    );
}
if (!errors.some((entry) => entry.code === 'E16'))
  ok('E16', '基础包清单无重复手写进度；既有验证证据已归档');

// ---------------------------------------------------------------------------
// E17  已接受决策作为只读事实保留，不再反向合并旧调度状态
// ---------------------------------------------------------------------------
const decisions = foundationDoc?.referenceDecisions ?? [];
for (const decision of decisions) {
  if (!decision.id || !decision.question || !decision.impact || !decision.status) {
    err('E17', `referenceDecisions缺少完整来源: ${decision.id}`);
  }
}
if (!errors.some((entry) => entry.code === 'E17'))
  ok('E17', `保留${decisions.length}条决策事实；不将历史软阻塞升级为任务完成门槛`);

// ---------------------------------------------------------------------------
// E18  实际领取、所有权、全局并发与可恢复状态（由唯一状态校验）
// ---------------------------------------------------------------------------
if (audit)
  ok(
    'E18',
    `当前${audit.tasks.length}项任务；活动领取/依赖/文件归属与最多${audit.dispatch.maxParallel}个子任务已校验`,
  );

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

// ---------------------------------------------------------------------------
// E20  架构已完成的组件不得残留生成器占位
// 静态组件清单不存任务完成状态；本检查仅依据唯一当前状态的 architectureStatus。
// 历史G13/九维记录已归档，不能作为当前推进的前置条件。
// ---------------------------------------------------------------------------
// ⚠️ `TODO(G*)` 必须匹配**行首注释**（生成器写的 `// TODO(G3): …` / `<!-- TODO(G4): … -->`），
//    不能匹配裸文本 —— 否则「测试里断言 `expect(src).not.toContain('TODO(G3)')`」
//    这种**防腐烂断言**自己会被判为占位（2026-10-01 实测踩到）。
const PLACEHOLDER_TODO = /^[ \t]*(?:\/\/|<!--)[ \t]*TODO\(G\d+\)/m;
const PLACEHOLDER_DESCRIBE_TODO = /describe\.todo\(/;
let e20Components = 0;
let e20Files = 0;
for (const c of componentsDoc?.components ?? []) {
  if (
    !audit?.tasks.some((task) => task.id === `CMP:${c.name}` && task.architectureStatus === 'done')
  )
    continue;
  const dir = path.join(UI_SRC, c.name);
  if (!fs.existsSync(dir)) continue;
  e20Components += 1;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
      const fp = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (['node_modules', 'dist'].includes(e.name)) continue;
        stack.push(fp);
        continue;
      }
      if (!/\.(ts|vue)$/.test(e.name)) continue;
      e20Files += 1;
      const raw = fs.readFileSync(fp, 'utf8');
      const rel = path.relative(ROOT, fp);
      if (PLACEHOLDER_TODO.test(raw)) {
        err(
          'E20',
          `${rel} 残留生成器 TODO 占位（行首注释）—— 但 ${c.name} 的 architectureStatus 是 done`,
        );
      }
      // `describe.todo(` 要**剥注释**后匹配：文件头注释里就写着这个约定
      if (PLACEHOLDER_DESCRIBE_TODO.test(stripComments(raw))) {
        err(
          'E20',
          `${rel} 残留 \`describe.todo\` 骨架测试 —— 但 ${c.name} 的 architectureStatus 是 done`,
        );
      }
    }
  }
}
if (!errors.some((e) => e.code === 'E20')) {
  ok('E20', `架构已完成组件无占位残留（${e20Components} 个组件目录 / ${e20Files} 个文件）`);
}

report();
