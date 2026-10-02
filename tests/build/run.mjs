#!/usr/bin/env node
/**
 * tests/build/run.mjs — L7 构建门禁
 *
 * 为什么存在：组件测试全绿不代表产物可用。`exports` 写错、类型缺失、产物混入 React
 * 这类问题只有构建后才会暴露。设计见 tests/build/README.md 与 TESTING.md §10。
 *
 * 与 --strict 的关系（重要）：
 *   B5/B6/B7/B8 依赖「存在有视觉的组件」与「ui 包有 CSS 产物」，现在还不具备条件。
 *   它们的状态是 **PENDING** 而不是 PASS —— 既不谎报通过，也不让整个门禁卡死。
 *   `--strict` 下 PENDING 视为失败，用于这些检查落地之后的 CI。
 *   这是显式声明的未覆盖，不是放宽标准：pending 清单会打印在报告里。
 *
 * 用法：
 *   node tests/build/run.mjs                 # 构建全部包并校验
 *   node tests/build/run.mjs --no-build      # 跳过构建，复用现有 dist
 *   node tests/build/run.mjs --package utils # 只校验一个包
 *   node tests/build/run.mjs --strict        # PENDING 也视为失败
 *   node tests/build/run.mjs --json          # 机器可读
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

const args = {
  noBuild: false,
  pkg: null,
  strict: false,
  json: false,
};
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a === '--no-build') args.noBuild = true;
  else if (a === '--package') args.pkg = process.argv[++i];
  else if (a === '--strict') args.strict = true;
  else if (a === '--json') args.json = true;
  else if (a === '--help' || a === '-h') {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// 常量：硬 Gate 的判据
// ---------------------------------------------------------------------------

/** B3：React 运行时。命中即失败（AGENTS.md H1）。 */
const REACT_SPECIFIERS = [/^react$/, /^react-dom/, /^react-is/, /^react\//, /^react-dom\//];

/** B10：React 绑定的 rc 生态。命中即失败（AGENTS.md H5）。 */
const RC_SPECIFIERS = [/^@rc-component\//, /^rc-/, /^rc-util\//];

/** B4：CSS-in-JS 运行时。命中即失败（AGENTS.md H6）。 */
const CSSINJS_SPECIFIERS = [/^@ant-design\/cssinjs/, /^@emotion\//, /^styled-components$/];

/** 需要扫描的产物后缀 */
const DIST_EXT = /\.(mjs|cjs|js|d\.ts|d\.mts)$/;

/** B9：Node 下限（ARCHITECTURE.md 环境约束） */
const MIN_NODE_MAJOR = 22;
const MIN_NODE_MINOR = 12;

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

/**
 * 列出要构建的包目录，按**拓扑序**排列（被依赖的在前）。
 *
 * ── 为什么不能按目录名字母序（2026-09-17 修）────────────────────────────────
 *
 * 原实现是 `readdirSync(...).sort()`，即 a11y → form-core → icons → … → **ui → utils**。
 * 而 `ui` 依赖 `utils`/`theme`：它的 `build:done` 钩子要 `import('./dist/index.mjs')`，
 * 那个产物在运行期会 `import '@apollo-design/theme'` —— theme 还没构建时 ui 直接失败。
 *
 * 同类问题在 foundation 层也存在（`overlay` 依赖 `portal`/`position`，字母序却排在它们前面），
 * 只是那些包当时恰好已有 dist 才没暴露。第一个组件落地把它变成了必然失败。
 *
 * 拓扑序不是「优化」，是**正确性**：unbuild 打包 JS 时把 workspace 依赖当 external，
 * 但出 `.d.ts`、跑 `build:done` 钩子时都要能解析到依赖的产物。
 *
 * ⚠️ 根 `package.json` 的 `pnpm build` 走不了这条路：`pnpm -r run build` 会因为
 *    「每个包都 devDepend on test-utils，而 test-utils 又 depend on theme/utils」
 *    报 `ERR_PNPM_TASK_CYCLE`。所以**本文件才是本仓库的权威构建入口**。
 */
function listPackageDirs() {
  const dirs = fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && fs.existsSync(path.join(PACKAGES_DIR, d.name, 'package.json')),
    )
    .map((d) => d.name)
    .sort();

  const nameOf = new Map();
  const depsOf = new Map();
  for (const dir of dirs) {
    const pkg = readJson(path.join(PACKAGES_DIR, dir, 'package.json'));
    nameOf.set(dir, pkg.name);
    const local = new Set();
    for (const dep of Object.keys(pkg.dependencies ?? {})) {
      if (dep.startsWith('@apollo-design/')) local.add(dep);
    }
    depsOf.set(dir, local);
  }

  const ordered = [];
  const visited = new Set();
  const visiting = new Set();
  const visit = (dir) => {
    // 环保护：真出现环时按访问序输出，让构建去报真实的错，而不是在这里死循环。
    if (visited.has(dir) || visiting.has(dir)) return;
    visiting.add(dir);
    for (const depName of depsOf.get(dir) ?? []) {
      for (const [otherDir, otherName] of nameOf) {
        if (otherName === depName) visit(otherDir);
      }
    }
    visiting.delete(dir);
    visited.add(dir);
    ordered.push(dir);
  };
  for (const dir of dirs) visit(dir);

  return ordered.filter((d) => args.pkg === null || d === args.pkg);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * 抽出产物里的模块说明符。
 * 覆盖 ESM（import/export ... from）与 CJS（require）两种，以及 d.ts 里的 import type。
 */
function extractSpecifiers(code) {
  const specs = [];
  const patterns = [
    /(?:^|[\s;}])(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g,
    /(?:^|[\s;}=(,])import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /(?:^|[\s;}=(,])require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of code.matchAll(re)) specs.push(m[1]);
  }
  return specs;
}

function scanDist(distDir) {
  const files = walk(distDir).filter((f) => DIST_EXT.test(f));
  const hits = { react: [], rc: [], cssinjs: [] };
  for (const f of files) {
    // 产物可能很大（ui 包），但正则扫描比 AST 便宜；只取说明符做前缀匹配
    const code = fs.readFileSync(f, 'utf8');
    for (const spec of extractSpecifiers(code)) {
      const rel = path.relative(ROOT, f);
      if (REACT_SPECIFIERS.some((r) => r.test(spec))) hits.react.push(`${rel} → ${spec}`);
      if (RC_SPECIFIERS.some((r) => r.test(spec))) hits.rc.push(`${rel} → ${spec}`);
      if (CSSINJS_SPECIFIERS.some((r) => r.test(spec))) hits.cssinjs.push(`${rel} → ${spec}`);
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// 检查项
// ---------------------------------------------------------------------------

const results = [];

function add(pkg, id, status, detail) {
  results.push({ pkg, id, status, detail });
}

/** B1：构建 */
function checkBuild(dir, name) {
  if (args.noBuild) {
    add(name, 'B1', 'SKIP', '--no-build，复用现有 dist');
    return true;
  }
  const bin = path.join(ROOT, 'node_modules/.bin/unbuild');
  if (!fs.existsSync(bin)) {
    add(name, 'B1', 'FAIL', '找不到 node_modules/.bin/unbuild，先跑 pnpm install');
    return false;
  }
  try {
    execFileSync(bin, [], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    add(name, 'B1', 'PASS', 'unbuild 退出码 0');
    return true;
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.split('\n').filter(Boolean).slice(-3);
    add(name, 'B1', 'FAIL', `unbuild 退出码 ${err.status ?? 1}: ${out.join(' | ')}`);
    return false;
  }
}

/** B2：exports / types 可解析。裁决 A 之后这是最容易再犯的一项。 */
function checkExports(dir, name) {
  const pkgJson = readJson(path.join(dir, 'package.json'));
  const missing = [];
  const wildcards = [];

  for (const [subpath, target] of Object.entries(pkgJson.exports ?? {})) {
    if (subpath === './package.json') continue;
    const targets = typeof target === 'string' ? [target] : Object.values(target);
    for (const t of targets) {
      if (t.includes('*')) {
        wildcards.push(`${subpath} → ${t}`);
        continue;
      }
      if (!fs.existsSync(path.join(dir, t))) missing.push(`${subpath} → ${t}`);
    }
  }

  if (missing.length) {
    add(name, 'B2', 'FAIL', `exports 指向构建后不存在的路径: ${missing.join(', ')}`);
    return false;
  }
  if (wildcards.length) {
    // 裁决 A 之后不应再出现通配符子路径；出现说明模板被改了但没走流程
    add(
      name,
      'B2',
      'FAIL',
      `exports 含通配符子路径（裁决 A 只允许实际产物）: ${wildcards.join(', ')}`,
    );
    return false;
  }
  add(name, 'B2', 'PASS', 'exports 全部可解析');
  return true;
}

/** B3 / B4 / B10：产物里不得出现 React、rc-*、CSS-in-JS 运行时 */
function checkForbiddenDeps(dir, name) {
  const hits = scanDist(path.join(dir, 'dist'));
  let ok = true;
  if (hits.react.length) {
    add(name, 'B3', 'FAIL', `产物含 React: ${hits.react.slice(0, 5).join(', ')}`);
    ok = false;
  } else {
    add(name, 'B3', 'PASS', '产物无 React 说明符');
  }
  if (hits.cssinjs.length) {
    add(name, 'B4', 'FAIL', `产物含 CSS-in-JS 运行时: ${hits.cssinjs.slice(0, 5).join(', ')}`);
    ok = false;
  } else {
    add(name, 'B4', 'PASS', '产物无 CSS-in-JS 运行时');
  }
  if (hits.rc.length) {
    add(name, 'B10', 'FAIL', `产物含 rc 生态依赖: ${hits.rc.slice(0, 5).join(', ')}`);
    ok = false;
  } else {
    add(name, 'B10', 'PASS', '产物无 @rc-component / rc-*');
  }
  return ok;
}

/** B9：Node 版本 */
function checkNode() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  const ok = major > MIN_NODE_MAJOR || (major === MIN_NODE_MAJOR && minor >= MIN_NODE_MINOR);
  add(
    '-',
    'B9',
    ok ? 'PASS' : 'FAIL',
    `Node ${process.versions.node}（要求 >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}）`,
  );
  return ok;
}

/**
 * B5：零运行时 CSS 产物存在且非空。
 *
 * 「零运行时」的判据不是"没有 JS"，而是**不引入 JS 也能拿到全部主题变量**。
 * 所以这里校验的是产物里真有一份 CSS，且它足够大（空文件或只有注释都算失败）。
 */
function checkCssArtifact(dir, name) {
  const distDir = path.join(dir, 'dist');
  const cssFiles = walk(distDir).filter((f) => f.endsWith('.css'));
  if (!cssFiles.length) {
    add(name, 'B5', 'FAIL', 'dist/ 下没有任何 .css 产物 —— 无 JS 时拿不到主题变量');
    return false;
  }
  const empty = cssFiles.filter((f) => fs.readFileSync(f, 'utf8').trim().length === 0);
  if (empty.length) {
    add(name, 'B5', 'FAIL', `CSS 产物为空: ${empty.map((f) => path.relative(ROOT, f)).join(', ')}`);
    return false;
  }
  add(name, 'B5', 'PASS', `${cssFiles.length} 份 CSS 产物且非空`);
  return true;
}

/**
 * B11：CSS 产物里不得出现「转换漏网」的痕迹（`NaN` / `Infinity` / `undefined` / `${` /
 * **嵌套的 `var()` 包装**）。
 *
 * 为什么需要它：本仓的组件样式是**构建期**从 antd 产物机械转换来的（`style/index.ts` 里
 * 大量字面量 + `var()`），一旦某个值来自「应该算但没算」的表达式（最典型的是 antd 的
 * `borderRadiusXS / 2` 被原样搬进 CSS 字符串 ⇒ `border-radius:NaNpx`），浏览器会**静默丢弃
 * 那条声明**：不报错、类型检查也看不见，只有像素比对能发现（2026-09-25 image 实测）。
 * `${` 同理 —— 它是模板占位没被展开的痕迹（生成器/手写字符串里的漏网）。
 *
 * 🚨 **嵌套 `var()` 包装**（2026-10-02 avatar 实测）：把 token 名与 token→var 的转换函数
 * 混用（`v(v('borderRadius'))`，或调用点先算好 `var(--apollo-border-radius)` 再传给一个
 * 内部又会 `v()` 一次的工厂）会产出 `var(--apollo-var(--apollo-border-radius))` ——
 * 变量名成了 `--apollo-var(--apollo-border-radius)`，**整条声明失效**（无效变量名 ⇒
 * `border-radius` 退回初始值 `0`）。它躲过了两道既有防线，因为两处的正则都是
 * `/var\((--apollo-[a-z0-9-]+)\)/`：对 `var(--apollo-var(--apollo-border-radius))` 它会
 * **跳过外层的坏壳、匹配到内层的合法引用** ⇒ B7（ui）与组件 `theme.test.ts` 双双判 PASS。
 * 只有 L6 像素比对抓得到（`square` 变体 2.98% block-diff）。本检查用
 * `var\(--[a-z0-9-]*var\(`（变量名里出现 `var(`）精确命中这种形态，不误伤
 * `var(--a, var(--b))` 这类**合法的回退**写法（内容里有逗号 ⇒ 不匹配）。
 *
 * ⚠️ 扫描前要剥掉 `url(...)` 与引号内的字符串：data-URI 的 base64 里**可能**恰好出现
 * `NaN` 这种子串（`placeholder` 的内联 SVG 就是 base64），那是假阳性。
 */
function checkCssSanity(dir, name) {
  const cssFiles = walk(path.join(dir, 'dist')).filter((f) => f.endsWith('.css'));
  if (!cssFiles.length) {
    add(name, 'B11', 'n/a', '没有 CSS 产物，无需扫描');
    return;
  }
  const hits = [];
  for (const f of cssFiles) {
    const stripped = fs
      .readFileSync(f, 'utf8')
      .replace(/url\([^)]*\)/g, 'url()')
      .replace(/'[^']*'/g, "''")
      .replace(/"[^"]*"/g, '""');
    for (const m of stripped.matchAll(
      /\$\{|(?:NaN|Infinity)[a-z%]*|\bundefined\b|var\(--[a-z0-9-]*var\(/g,
    )) {
      const at = Math.max(0, m.index - 40);
      hits.push(
        `${path.relative(ROOT, f)}: …${stripped.slice(at, m.index + 24).replace(/\n/g, ' ')}`,
      );
    }
  }
  if (hits.length) {
    add(
      name,
      'B11',
      'FAIL',
      `CSS 里有转换漏网（${hits.length} 处）: ${hits.slice(0, 3).join(' | ')}`,
    );
    return;
  }
  add(
    name,
    'B11',
    'PASS',
    `${cssFiles.length} 份 CSS 产物无 NaN / undefined / 未展开占位 / 嵌套 var 包装`,
  );
}

/**
 * B7：默认主题在无 JS 环境下可用。
 *
 * 不启浏览器（那是 L6 的事）。这里做的是**静态一致性**：解析 CSS 里 `:root` 块声明的
 * `--apollo-*` 变量，与本包 dist 算出来的默认值逐个比对。
 *
 * 这能抓住真正的风险：CSS 是构建期生成的，一旦 token 算法改了而 CSS 没重新生成，
 * 「无 JS 的默认主题」就会静默地停留在旧版本 —— 运行时注入看上去一切正常。
 */
async function checkDefaultThemeCss(dir, name) {
  const cssFile = walk(path.join(dir, 'dist')).find((f) => f.endsWith('tokens.css'));
  if (!cssFile) {
    add(name, 'B7', 'FAIL', '找不到 dist/tokens.css');
    return false;
  }
  const css = fs.readFileSync(cssFile, 'utf8');
  const rootBlock = /:root\{([^}]*)\}/.exec(css);
  if (!rootBlock) {
    add(name, 'B7', 'FAIL', 'tokens.css 里没有 :root 块');
    return false;
  }

  const declared = new Map();
  for (const decl of rootBlock[1].split(';')) {
    const idx = decl.indexOf(':');
    if (idx <= 0) continue;
    declared.set(decl.slice(0, idx).trim(), decl.slice(idx + 1).trim());
  }
  if (declared.size < 100) {
    add(name, 'B7', 'FAIL', `:root 只声明了 ${declared.size} 个变量（期望 >= 100）`);
    return false;
  }

  let mod;
  try {
    mod = await import(path.join(dir, 'dist/index.mjs'));
  } catch (e) {
    add(name, 'B7', 'FAIL', `无法 import dist/index.mjs: ${e.message}`);
    return false;
  }

  const token = mod.getDesignToken();
  const { vars } = mod.transformToken(token);
  const mismatched = [];
  let checked = 0;
  for (const [cssVar, expected] of Object.entries(vars)) {
    if (!declared.has(cssVar)) continue;
    checked += 1;
    // 两侧都 trim：CSS 自定义属性值的前后空白在解析时会被丢弃，
    // 而 boxShadow 这类多行值在 token 里带着缩进行首 —— 不 trim 会误报 8 处不一致。
    const want = String(expected).trim();
    if (declared.get(cssVar) !== want)
      mismatched.push(`${cssVar}: css=${declared.get(cssVar)} runtime=${want}`);
  }

  if (checked < 100) {
    add(name, 'B7', 'FAIL', `CSS 与运行时可比对的重叠变量只有 ${checked} 个`);
    return false;
  }
  if (mismatched.length) {
    add(
      name,
      'B7',
      'FAIL',
      `CSS 与运行时默认值不一致（${mismatched.length} 处，CSS 可能是旧构建）: ${mismatched.slice(0, 3).join(' | ')}`,
    );
    return false;
  }

  add(name, 'B7', 'PASS', `${checked} 个变量的 CSS 值与运行时默认值一致`);
  return true;
}

/**
 * 由**组件运行时内联赋值**的 CSS 变量（CSS 里只被消费、不被声明）。
 *
 * 判据：赋值点是组件的渲染代码（`style` 对象里的 `--x` 键），不是 CSS —— 门禁静态
 * 扫描看不到 JS。⚠️ 登记时必须写清赋值点，否则这条会变成「万能后门」。
 */
const RUNTIME_ASSIGNED_VARS = {
  // notification 内核的列表内容：测量结果（最新一条的实测宽高）由 NoticeListContent
  // 的内联 style 写入，供堆叠折叠的占位条计算。⚠️ 上游拼写就是 `notificiation`（少一个 t）。
  '--top-notificiation-height': 'notification/engine/NoticeListContent.ts',
  '--top-notificiation-width': 'notification/engine/NoticeListContent.ts',
  /**
   * modal 的响应式宽度阶梯的**叶子变量**。
   *
   * 赋值点：`modal/Modal.ts` 的 `responsiveWidthVars` —— `width` 传对象时按断点写
   * `--{prefixCls}-{bp}-width`（`{ xs: 100 }` ⇒ `--apollo-modal-xs-width: 100px`）。
   *
   * ⚠️ 为什么**不能**在 CSS 里补一条声明：上游 antd 6.6.4 同样只**引用**它、从不声明
   *    （`genResponsiveWidthStyle` 只生成 `--ant-modal-sm-width: var(--ant-modal-xs-width)`
   *    这条阶梯，值由 cssVar 模式或运行时内联给）。`width` 是数字时真正的宽度来自
   *    rc-dialog 的**内联** `width: 520px`，CSS 里那条 `width: var(--…-xs-width)` 是无效声明、
   *    被浏览器丢弃 ⇒ 面板退回 `width: auto`（PurePanel / confirm 的静态面板就是靠这个
   *    撑满容器）。我们若「顺手补上」520px，`confirm` 的面板会从「撑满」变成 520px 宽，
   *    **与 antd 不再逐像素一致**（L6 会红）。⇒ 登记为运行时变量，不补声明。
   *    差异登记：`COMPATIBILITY.md` 的 D105。
   */
  '--apollo-modal-xs-width': 'modal/Modal.ts（responsiveWidthVars，width 传对象时）',
};

/**
 * **opt-in 容器查询变量**：只被 `@container style(<var>)` 当特性开关用的变量。
 *
 * 为什么单列一张表（与 RUNTIME_ASSIGNED_VARS 的区别）：
 *   那张表的语义是「赋值点在我们的渲染代码里，门禁看不到 JS」；这里的变量**没有赋值点**
 *   —— 它留给用户（`style="--x: …"`）或未来的 token 覆盖去写。
 *
 * 为什么**不能**在 CSS 里补一条声明：`@container style(--x)` 的语义是「`--x` 有值时这段
 * 规则才生效」。一旦声明了它（哪怕是空值或默认值 ⇒ 会进入 declared），查询就恒真，
 * 那批规则会无条件应用 —— 这不是修 bug，是**改变行为**。
 *
 * 豁免是**可自证**的（见 checkUiCssTokens 里对这张表的强制）：
 *   ① 该变量在 ui 的全部 CSS 里都不许出现声明（`--x:`）；
 *   ② 它至少要出现在一个 `@container style(<它>)` 守卫里。
 *   ⇒ 「写进表」本身不构成豁免，必须同时满足这两条。
 */
/**
 * **上游 Component Token 默认 `undefined` ⇒ 刻意不声明的变量**（`var()` **间接**回退链形态）。
 *
 * 与 `CONTAINER_QUERY_OPT_IN_VARS` 的**区别**：那张表的变量被 `@container style(<var>)`
 * 当特性开关消费；这里的变量参与的是**两层**的 token 间接层：
 *
 * ```css
 * .ant-timeline .ant-timeline-item{
 *   --ant-cmp-steps-icon-dot-size-custom: var(--ant-timeline-dot-size);      ① 赋值给另一个自定义属性
 *   --ant-cmp-steps-icon-size: var(--ant-cmp-steps-icon-dot-size-custom,
 *                                var(--ant-cmp-steps-icon-dot-size-origin));  ② 回退链在这里
 * }
 * ```
 *
 * ⇒ 未声明时 ① 的右侧无效 ⇒ ② 回退到 Steps 的 `-origin`；用户覆盖后 ① 生效。
 *   **补一条声明会改变行为**（`-custom` 恒有效 ⇒ 永远盖掉 origin）。
 *
 * 豁免**可自证**（见下方强制检查）：① 该变量在 ui 的全部 CSS 里都不许被声明；
 * ② 它的**每一次** `var(<它>)` 出现都必须位于「`--某自定义属性:` 的右侧」
 *   （即只参与 token 间接层，不被直接用于真实 CSS 属性）。
 */
const UPSTREAM_UNDECLARED_TOKEN_VARS = {
  /**
   * timeline 的 `dotSize` / `dotBg`：`prepareComponentToken` **显式返回 `undefined`**
   * （上游注释是「should be `undefined` to create css var」）⇒ 产物 css-var 块只有 4 条。
   *
   * ⚠️ 两个前缀各登记一次：**组件 token 的声明与引用都随前缀变**
   * （`genTokenDecls(p)` / `tv()` 都用 `--${p}-timeline-*`）⇒ `ant` 变体会引用
   * `--ant-timeline-dot-size`。⚠️ 与 `--apollo-cmp-steps-*`（Steps 的内部变量，
   * **前缀固定 `apollo`**，见 `genStepsStyle`）不是同一回事。
   */
  '--apollo-timeline-dot-size': 'timeline/style/token.ts（prepareComponentToken 返回 undefined）',
  '--apollo-timeline-dot-bg': 'timeline/style/token.ts（prepareComponentToken 返回 undefined）',
  '--ant-timeline-dot-size': 'timeline/style/token.ts（同上；ant 变体）',
  '--ant-timeline-dot-bg': 'timeline/style/token.ts（同上；ant 变体）',
};

const CONTAINER_QUERY_OPT_IN_VARS = {
  /**
   * steps 的 `descriptionMaxWidth`（antd 的 Component Token，**默认 `undefined`**）。
   *
   * 上游证据（`tests/visual/debug` 的 steps dump 实测）：antd 6.6.4 产物里有 `@container`
   * 但**没有任何 `container-type`**，且 `--ant-steps-description-max-width` **只被引用、
   * 从不声明**（`steps/style/index.js` 里 `descriptionMaxWidth: undefined` 的注释
   * 就是「should be `undefined` to create css var」）。
   *
   * 语义：默认（未设置）⇒ `@container style(...)` 不匹配 ⇒ 那批「按描述宽度对齐」的规则
   * 不应用；用户设置后才生效。本仓的移植与上游一致，且**未移植**该 token 的覆盖入口
   * （登记的缺口，见 `packages/ui/src/steps/README.md`）。
   */
  '--apollo-steps-description-max-width': 'steps/style/index.ts（上游同样只引用不声明）',
};

/**
 * B7 · ui：组件 CSS 引用的每个 `--apollo-*` 变量都必须真实存在。
 *
 * 为什么 ui 的 B7 与 theme 的不是同一件事：
 *   theme 的 B7 校验「CSS 里声明的默认值 == 运行时算出来的默认值」（防止 CSS 是旧构建）。
 *   ui 不产出 token 值，它**消费** token。所以它真正的风险是另一类：
 *   样式里写了 `var(--apollo-margin-xs)`，而 theme 根本没有这个变量 ——
 *   这不会报错、不会警告，只会**静默失效**（浏览器把未定义的 var() 当作空值）。
 *
 *   在 72 个组件 × 每组件十几个变量的规模下，靠人眼查变量名是不可行的，
 *   所以这条检查是「零运行时 + 静态 CSS」这套架构的必要配套。
 *
 * 判据：ui 的全部 `.css` 产物里出现的每个 `var(--apollo-*)`，
 *      都能在 `packages/theme/dist/tokens.css` 的 `:root` 块里找到声明。
 */
function checkUiCssTokens(dir, name) {
  const themeTokens = path.join(ROOT, 'packages/theme/dist/tokens.css');
  if (!fs.existsSync(themeTokens)) {
    add(
      name,
      'B7',
      'FAIL',
      '找不到 packages/theme/dist/tokens.css（ui 的样式依赖它，先构建 theme）',
    );
    return false;
  }

  const rootBlock = /:root\{([^}]*)\}/.exec(fs.readFileSync(themeTokens, 'utf8'));
  if (!rootBlock) {
    add(name, 'B7', 'FAIL', 'theme 的 tokens.css 里没有 :root 块');
    return false;
  }
  const declared = new Set(
    rootBlock[1]
      .split(';')
      .map((decl) => decl.slice(0, decl.indexOf(':')).trim())
      .filter((v) => v.startsWith('--')),
  );

  const cssFiles = walk(path.join(dir, 'dist')).filter((f) => f.endsWith('.css'));
  if (cssFiles.length === 0) {
    add(name, 'B7', 'FAIL', 'dist/ 下没有 CSS 产物，无从校验变量引用');
    return false;
  }

  // 组件自身 CSS 里的声明（如 grid 的运行时变量 --{prefix}-col-*-flex，由 Col.vue
  // 内联赋值；dist 里 apollo 与 ant 两个前缀各一份）与 theme tokens 一样是合法的
  // 声明来源 —— 2026-09-21 grid 落地时扩展。
  for (const file of cssFiles) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/(--[a-z0-9-]+)\s*:/g)) {
      declared.add(match[1]);
    }
  }

  // ⚠️ 由**组件运行时内联赋值**的变量：CSS 里只被消费、不被声明，赋值点在组件的
  //    渲染代码里（`style` 对象）—— 门禁看不到 JS，所以逐条登记。新增必须给出赋值点。
  for (const v of Object.keys(RUNTIME_ASSIGNED_VARS)) declared.add(v);

  // ⚠️ **opt-in 容器查询变量**（2026-09-30 补）：只被 `@container style(<var>)` 当作
  //    「特性开关」消费的变量 —— **声明它会让查询恒真、改变语义**，所以上游也刻意不声明。
  //
  //    这一类与 RUNTIME_ASSIGNED_VARS 的区别是「没有赋值点」：它不是被我们的代码写的，
  //    而是留给**用户**（`style="--x: …"`）或未来的 token 覆盖去写。所以不能塞进那张表
  //    （那里的约定是「必须写清赋值点」），需要单列，并且**豁免要可自证**：
  //    下面会强制检查两条 —— ①它不能在任何 ui CSS 里被声明；②它至少要出现在一个
  //    `@container style(<它>)` 守卫里。只写进表而不满足这两条 ⇒ 报错。
  for (const v of Object.keys(CONTAINER_QUERY_OPT_IN_VARS)) declared.add(v);

  // 上游 token 默认 undefined ⇒ 刻意不声明（见 UPSTREAM_UNDECLARED_TOKEN_VARS 的说明）
  for (const v of Object.keys(UPSTREAM_UNDECLARED_TOKEN_VARS)) declared.add(v);

  const unknown = new Map();
  let referenced = 0;
  for (const file of cssFiles) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      const variable = match[1];
      referenced += 1;
      if (!declared.has(variable)) {
        const rel = path.relative(ROOT, file);
        if (!unknown.has(variable)) unknown.set(variable, rel);
      }
    }
  }

  if (referenced === 0) {
    add(
      name,
      'B7',
      'FAIL',
      'CSS 里没有任何 var(--apollo-*) 引用 —— 样式很可能没走 Token 系统（H9）',
    );
    return false;
  }
  if (unknown.size > 0) {
    const detail = [...unknown.entries()]
      .slice(0, 5)
      .map(([variable, file]) => `${variable}（${file}）`)
      .join(', ');
    add(name, 'B7', 'FAIL', `CSS 引用了 theme 未声明的变量（${unknown.size} 个）: ${detail}`);
    return false;
  }

  // opt-in 容器查询变量的**自证**：只写进表不构成豁免，见 CONTAINER_QUERY_OPT_IN_VARS 的说明
  {
    const allCss = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    for (const [variable, where] of Object.entries(CONTAINER_QUERY_OPT_IN_VARS)) {
      const declRe = new RegExp(`${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`);
      if (declRe.test(allCss)) {
        add(
          name,
          'B7',
          'FAIL',
          `opt-in 容器查询变量 ${variable} 被声明了 —— 声明会让 @container 查询恒真、改变语义（${where}）`,
        );
        return false;
      }
      const guardRe = new RegExp(
        `@container\\s+style\\(\\s*${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\)`,
      );
      if (!guardRe.test(allCss)) {
        add(
          name,
          'B7',
          'FAIL',
          `opt-in 容器查询变量 ${variable} 没有出现在任何 \`@container style(...)\` 守卫里 —— 不能这样豁免（${where}）`,
        );
        return false;
      }
    }
  }

  // 上游 token 默认 undefined 的**自证**：只写进表不构成豁免
  {
    const allCss = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    for (const [variable, where] of Object.entries(UPSTREAM_UNDECLARED_TOKEN_VARS)) {
      const esc = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`${esc}\\s*:`).test(allCss)) {
        add(
          name,
          'B7',
          'FAIL',
          `${variable} 被声明了 —— 上游刻意不声明（补上会改变 var() 回退链的语义）（${where}）`,
        );
        return false;
      }
      // 每一次 `var(<它>)` 都必须落在「--某自定义属性: …」的右侧
      const usage = new RegExp(`([^;{}]*?)\\bvar\\(\\s*${esc}\\s*\\)`, 'g');
      let found = 0;
      for (const m of allCss.matchAll(usage)) {
        found += 1;
        const lhs = m[1];
        const colon = lhs.lastIndexOf(':');
        const prop = colon >= 0 ? lhs.slice(0, colon).trim() : '';
        if (!prop.startsWith('--')) {
          add(
            name,
            'B7',
            'FAIL',
            `${variable} 被直接用在真实 CSS 属性上（${prop || '(无属性)'}）—— 它只应参与 token 间接层（${where}）`,
          );
          return false;
        }
      }
      if (found === 0) {
        add(name, 'B7', 'FAIL', `${variable} 没有任何 var() 引用 —— 陈旧豁免（${where}）`);
        return false;
      }
    }
  }

  add(
    name,
    'B7',
    'PASS',
    `${referenced} 处 var(--apollo-*) 引用全部在 theme 的 tokens.css 里有声明`,
  );
  return true;
}

/**
 * 多导出组件的 SSR 冒烟别名：目录名 → 实际导出名列表。
 * （grid 目录导出的是 Row + Col，没有名为 Grid 的组件 —— 与 antd 的导出面一致。）
 */
const SSR_EXPORT_ALIASES = {
  grid: ['Row', 'Col'],
  // antd 的组件名是 `QRCode`（驼峰两个大写），目录名 'qrcode' 的机械 pascal 是 `Qrcode`
  qrcode: ['QrCode'],
  // antd 的 message / notification 导出名是**小写**（它们是方法集合，不是组件）
  message: ['message'],
  notification: ['notification'],
};

/**
 * B8 · SSR 冒烟：组件能在没有 `window` / `document` 的环境里渲染出内容。
 *
 * 为什么值得单列一条：零运行时 + `Teleport` / `ResizeObserver` 这类 DOM 依赖，
 * 很容易在浏览器里一切正常、在 SSR 下直接抛 `window is not defined`。
 * 而这类问题**只有真跑一次**才会暴露 —— 类型检查看不见。
 *
 * 判据（两条都要满足）：
 *   1. `renderToString` 不抛错
 *   2. 产出非空 —— 空串说明组件「渲染成功了但什么都没渲染」，那同样是坏的
 */
async function checkSsr(dir, name) {
  let mod;
  try {
    mod = await import(path.join(dir, 'dist/index.mjs'));
  } catch (e) {
    add(name, 'B8', 'FAIL', `无法 import dist/index.mjs: ${e.message}`);
    return false;
  }

  const styles = mod.COMPONENT_STYLES;
  if (!Array.isArray(styles) || styles.length === 0) {
    add(name, 'B8', 'FAIL', 'dist 里没有导出 COMPONENT_STYLES，无法确定要冒烟哪些组件');
    return false;
  }

  let { renderToString } = {};
  try {
    ({ renderToString } = await import('vue/server-renderer'));
    const { createSSRApp, h } = await import('vue');
    const failures = [];
    for (const entry of styles) {
      // 组件目录名 → 导出名（`empty` → `Empty`）。约定来自 COMPONENT-RULES.md §12.3。
      // 多导出组件（如 grid = Row + Col）用别名表展开，逐个冒烟。
      const exportNames = SSR_EXPORT_ALIASES[entry.name] ?? [
        entry.name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase()),
      ];
      for (const exportName of exportNames) {
        const component = mod[exportName];
        if (!component) {
          failures.push(`${entry.name}: 包入口没有导出 ${exportName}`);
          continue;
        }
        try {
          const html = await renderToString(createSSRApp({ render: () => h(component) }));
          if (html.trim() === '') failures.push(`${entry.name}: SSR 产出为空`);
        } catch (e) {
          failures.push(`${entry.name}/${exportName}: ${e.message}`);
        }
      }
    }
    if (failures.length > 0) {
      add(name, 'B8', 'FAIL', `SSR 冒烟失败: ${failures.slice(0, 3).join(' | ')}`);
      return false;
    }
  } catch (e) {
    add(name, 'B8', 'FAIL', `SSR 冒烟无法执行: ${e.message}`);
    return false;
  }

  add(name, 'B8', 'PASS', `${styles.length} 个组件在无 DOM 环境下渲染出非空内容`);
  return true;
}

/**
 * B5~B8 的适用性。
 *
 * 这里必须逐包判断，不能一刀切标 PENDING —— 否则 utils 这种「零 CSS、零组件」的包
 * 会永远卡在 PENDING 上，L7 事实上不可达；而反过来一刀切标 n/a，又等于用 n/a 掩盖未做
 * （正是 E16 要防的）。判据是架构事实，不是方便：
 *   - B5/B7 只适用于会产出 CSS 的包（theme / ui）
 *   - B6  只适用于有按组件按需入口的包（ui）—— 裁决 A 之后 foundation 是单文件产物
 *   - B8  只适用于含组件的包（ui）
 */
const CSS_PACKAGES = new Set(['@apollo-design/theme', '@apollo-design/ui']);
/**
 * 已经真正产出 CSS 的包。
 *
 * `ui` 在 2026-09-17 第一个组件（empty）落地后加入 —— 裁决 `ui-style-output` = A
 * 让 ui 产出 `dist/index.css` + `dist/<component>/style.css`，于是 B5 可判、B7 换判据。
 */
const CSS_READY = new Set(['@apollo-design/theme', '@apollo-design/ui']);
const COMPONENT_PACKAGES = new Set(['@apollo-design/ui']);

async function markPending(name, dir) {
  const css = CSS_PACKAGES.has(name);
  const comp = COMPONENT_PACKAGES.has(name);

  if (css && CSS_READY.has(name)) {
    const hasCss = checkCssArtifact(dir, name);
    if (!hasCss) {
      add(name, 'B7', 'SKIP', '没有 CSS 产物，跳过主题一致性校验');
    } else if (name === '@apollo-design/theme') {
      // theme 产出 token 值，校验「CSS 里的值 == 运行时算出的值」
      await checkDefaultThemeCss(dir, name);
    } else {
      // ui 消费 token，校验「引用的变量真的存在」
      checkUiCssTokens(dir, name);
    }
    checkCssSanity(dir, name);
  } else if (css) {
    add(name, 'B5', 'PENDING', '本包应当产出 CSS，但组件样式尚未落地');
    add(name, 'B7', 'PENDING', '依赖 B5 的 CSS 产物');
    add(name, 'B11', 'PENDING', '依赖 B5 的 CSS 产物');
  } else {
    add(name, 'B5', 'n/a', '本包不产出 CSS（见 scaffold 的 notDo）');
    add(name, 'B7', 'n/a', '本包不产出 CSS，无主题产物可校验');
    add(name, 'B11', 'n/a', '本包不产出 CSS，无产物可扫描');
  }

  if (comp) {
    add(
      name,
      'B6',
      'PENDING',
      '需要 budget.json 体积预算与按组件按需引入入口（见 docs 的 ui 样式裁决；当前未落地）',
    );
    await checkSsr(dir, name);
  } else {
    add(name, 'B6', 'n/a', '裁决 A 下为单文件产物，无按组件按需入口可比对');
    add(name, 'B8', 'n/a', '本包不含组件，无 SSR 冒烟对象');
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

checkNode();

const dirs = listPackageDirs();
if (args.pkg && dirs.length === 0) {
  console.error(`[build] 找不到包 ${args.pkg}。可用: ${listPackageDirs.call(null) ?? ''}`);
  process.exit(1);
}

for (const dir of dirs) {
  const pkgDir = path.join(PACKAGES_DIR, dir);
  // eslint-disable-next-line no-await-in-loop -- 逐包串行：B7 要 import 产物，并发会互相干扰 dist
  const name = readJson(path.join(pkgDir, 'package.json')).name;
  const built = checkBuild(pkgDir, name);
  if (built) {
    checkExports(pkgDir, name);
    checkForbiddenDeps(pkgDir, name);
  } else {
    add(name, 'B2', 'SKIP', '构建失败，跳过后续检查');
  }
  await markPending(name, pkgDir);
}

// ---------------------------------------------------------------------------
// 报告
// ---------------------------------------------------------------------------

const failed = results.filter((r) => r.status === 'FAIL');
const pending = results.filter((r) => r.status === 'PENDING');
const na = results.filter((r) => r.status === 'n/a');

if (args.json) {
  console.log(
    JSON.stringify(
      { results, failed: failed.length, pending: pending.length, na: na.length },
      null,
      2,
    ),
  );
} else {
  console.log('\n=== L7 构建门禁 ===\n');
  const byPkg = new Map();
  for (const r of results) {
    if (!byPkg.has(r.pkg)) byPkg.set(r.pkg, []);
    byPkg.get(r.pkg).push(r);
  }
  for (const [pkg, rs] of byPkg) {
    const bad = rs.filter((r) => r.status === 'FAIL').length;
    console.log(`  ${bad ? '❌' : '✅'} ${pkg}`);
    for (const r of rs) {
      if (r.status === 'PASS') continue;
      console.log(`      ${r.status.padEnd(7)} ${r.id}  ${r.detail}`);
    }
  }
  console.log(
    `\n  检查项 ${results.length}  |  FAIL ${failed.length}  |  PENDING ${pending.length}  |  n/a ${na.length}`,
  );
  if (pending.length) {
    console.log('  PENDING = 尚未具备条件的检查项，不是通过。--strict 下视为失败。');
    console.log(`  涉及: ${[...new Set(pending.map((r) => `${r.pkg} ${r.id}`))].join(', ')}`);
  }
  console.log();
}

if (failed.length) process.exit(1);
if (args.strict && pending.length) process.exit(1);
process.exit(0);
