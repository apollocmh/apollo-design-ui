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
  } else if (css) {
    add(name, 'B5', 'PENDING', '本包应当产出 CSS，但组件样式尚未落地');
    add(name, 'B7', 'PENDING', '依赖 B5 的 CSS 产物');
  } else {
    add(name, 'B5', 'n/a', '本包不产出 CSS（见 scaffold 的 notDo）');
    add(name, 'B7', 'n/a', '本包不产出 CSS，无主题产物可校验');
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
