#!/usr/bin/env node
/**
 * gen-icons.mjs — 从 @ant-design/icons-svg 生成 Vue 图标组件
 *
 * 为什么需要这个脚本：
 *   `@apollo-design/icons` 的 `notDo` 第一条就是「不手写 SVG path」。848 个图标的路径数据
 *   必须来自 `@ant-design/icons-svg`（antd 自己也是从这里生成的），我们只负责把
 *   「图标定义」包成 Vue 组件。手工维护 848 个文件既不可能，也会立刻与上游漂移。
 *
 * 为什么一个图标一个文件（而不是塞进一个大文件）：
 *   `@ant-design/icons` 的产物结构就是 `es/icons/<Name>.js` + `es/icons/index.js`，
 *   每个文件 import 一个 `es/asn/<Name>`。保持同构带来两个实际好处：
 *     1. 与上游做结构对账时是 1:1 映射，不需要在脑子里做"大文件第 N 行对应哪个图标"的翻译；
 *     2. 重新生成后的 diff 是**按图标**的 —— 只有上游真的改了某个图标的路径才会出现在 diff 里。
 *   代价是 848 个文件，所以本目录是**生成物**：biome 忽略、review 只看脚本（见 biome.json）。
 *
 * 为什么生成 `<Name>.ts` 而不是 `<Name>.js`：
 *   本包是 TS 源码包（`tsconfig.json` 的 include 是 `src/**\/*.ts`）。生成 .js 会让
 *   vue-tsc 不检查它们、unbuild 的入口推断也变复杂，收益为零。
 *
 * 用法：
 *   node registry/tools/gen-icons.mjs            # 生成到 packages/icons/src/icons/
 *   node registry/tools/gen-icons.mjs --check    # 只比对，不写入（CI / 门禁）
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'packages/icons/src/icons');

const args = { check: false };
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--check') args.check = true;
}

// ---------------------------------------------------------------------------
// 定位 @ant-design/icons-svg
//
// 从 `packages/icons` 解析而不是从仓库根：`.npmrc` 设了 `hoist=false`，
// 依赖只装在使用它的包下面。从根解析会 ENOENT —— 这不是"环境问题"，
// 而是 R6（跨包导入必须显式声明）在文件系统上的体现。
// ---------------------------------------------------------------------------
const pkgRequire = createRequire(path.join(ROOT, 'packages/icons/package.json'));
let svgDir;
try {
  svgDir = path.dirname(pkgRequire.resolve('@ant-design/icons-svg/package.json'));
} catch {
  console.error('[icons] 找不到 @ant-design/icons-svg —— 先跑 `corepack pnpm install`');
  process.exit(1);
}
const svgVersion = JSON.parse(fs.readFileSync(path.join(svgDir, 'package.json'), 'utf8')).version;

const ASN_DIR = path.join(svgDir, 'es/asn');
if (!fs.existsSync(ASN_DIR)) {
  console.error(`[icons] 找不到 ${ASN_DIR}`);
  process.exit(1);
}

/**
 * 图标名清单。
 *
 * 直接读目录而不是读 `es/index.js`：`es/asn/` 是**定义本身**所在的位置，
 * 也是我们生成 import 语句时要引用的路径。两者同源，不会出现
 * 「清单里有但文件不存在」的中间态。
 */
const names = fs
  .readdirSync(ASN_DIR)
  .filter((f) => f.endsWith('.js'))
  .map((f) => f.slice(0, -'.js'.length))
  .sort();

/**
 * 自检：名字必须都是 `<PascalCase><Filled|Outlined|TwoTone>`。
 *
 * 这条不是洁癖 —— `createIcon` 的分流判据是 `typeof definition.icon === 'function'`
 * （TwoTone 是函数），而名字里的 `TwoTone` 后缀是我们判断"该走哪条渲染路径"的
 * 人可读信号。出现第四种后缀意味着上游加了新的图标主题，
 * 那时必须先确认 `createIcon` 的分流是否还成立，而不是让生成器静默产出。
 */
const BAD_SUFFIX = names.filter((n) => !/(Filled|Outlined|TwoTone)$/.test(n));
if (BAD_SUFFIX.length > 0) {
  console.error(
    `[icons] ❌ 出现未知主题后缀的图标：${BAD_SUFFIX.slice(0, 5).join(', ')}` +
      `${BAD_SUFFIX.length > 5 ? ` 等 ${BAD_SUFFIX.length} 个` : ''}`,
  );
  console.error('[icons] 请先确认 createIcon 的 TwoTone/普通分流是否仍然成立，再更新本脚本。');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 生成内容
// ---------------------------------------------------------------------------

const HEADER = `// 自动生成，请勿手改。
// 生成器：registry/tools/gen-icons.mjs（数据源：@ant-design/icons-svg）
// 重新生成：node registry/tools/gen-icons.mjs
`;

/**
 * 单个图标组件。
 *
 * `/*#__PURE__*\/` 注解是**必需**的：本包最终会打成单个 `dist/index.mjs`，
 * 消费者能否 tree-shake 掉没用到的 848 个图标，取决于打包器能不能证明
 * `createIcon(...)` 没有副作用。没有这个注解时 Rollup 会保守地保留全部调用。
 */
function iconFile(name) {
  return `${HEADER}
import ${name}Svg from '@ant-design/icons-svg/es/asn/${name}';
import { createIcon } from '../create-icon';

export const ${name} = /*#__PURE__*/ createIcon(${name}Svg, '${name}');
`;
}

/** 图标目录的 barrel。 */
function barrelFile() {
  const lines = names.map((n) => `export { ${n} } from './${n}';`).join('\n');
  return `${HEADER}
${lines}
`;
}

// ---------------------------------------------------------------------------
// 落盘 / 比对
// ---------------------------------------------------------------------------

const expected = new Map(names.map((n) => [`${n}.ts`, iconFile(n)]));
expected.set('index.ts', barrelFile());

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

if (args.check) {
  const drift = [];
  for (const [file, content] of expected) {
    if (readIfExists(path.join(OUT_DIR, file)) !== content) drift.push(file);
  }
  const stale = fs.existsSync(OUT_DIR)
    ? fs
        .readdirSync(OUT_DIR)
        .filter((f) => f.endsWith('.ts') && !expected.has(f))
        .sort()
    : [];
  if (drift.length > 0 || stale.length > 0) {
    console.error(
      `[icons] ❌ 生成物已过期：${drift.length} 个内容不一致、${stale.length} 个多余文件`,
    );
    for (const f of [...drift, ...stale].slice(0, 10)) console.error(`[icons]    ${f}`);
    console.error('[icons] 重跑：node registry/tools/gen-icons.mjs');
    process.exit(1);
  }
  console.log(
    `[icons] ✅ 生成物与 @ant-design/icons-svg v${svgVersion} 一致（${names.length} 个图标）`,
  );
  process.exit(0);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// 清理上一轮遗留的文件：只在**本目录**内、只删 `.ts`。
// 不做这一步的话，上游删掉一个图标后它的组件会永远留在源码里，
// 而 barrel 不再导出它 —— 变成"能构建但已死"的代码。
let removed = 0;
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.ts') && !expected.has(f)) {
    fs.rmSync(path.join(OUT_DIR, f));
    removed += 1;
  }
}

let written = 0;
for (const [file, content] of expected) {
  const target = path.join(OUT_DIR, file);
  if (readIfExists(target) !== content) {
    fs.writeFileSync(target, content);
    written += 1;
  }
}

const suffixCount = (s) => names.filter((n) => n.endsWith(s)).length;
console.log(`[icons] ✅ 已生成 packages/icons/src/icons/`);
console.log(
  `[icons] @ant-design/icons-svg v${svgVersion} | ${names.length} 个图标` +
    `（Filled ${suffixCount('Filled')} / Outlined ${suffixCount('Outlined')} / TwoTone ${suffixCount('TwoTone')}）`,
);
console.log(`[icons] 写入 ${written} 个文件${removed > 0 ? `，清理 ${removed} 个过期文件` : ''}`);
