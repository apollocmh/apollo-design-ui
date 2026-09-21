#!/usr/bin/env node
/**
 * 生成「类型检查专用」的 project-references 配置，让 `tsc --build` 能按包增量。
 *
 * ── 为什么需要它 ──────────────────────────────────────────────────────────────
 *
 * 实测（i7-4770HQ / 4c8t / 16GB，IDE 关闭）：
 *   - 全仓 `vue-tsc --noEmit`           **7 分 49 秒**
 *   - 其中 13 个 foundation 包占         **5 分 57 秒**（76%）
 *   - `ui` + `tests` 只占               约 1.8 分钟
 *
 * ⇒ 改一个 `ui` 组件却要把 13 个 foundation 包**重新**检查一遍，这是纯浪费。
 *   `tsc --build` 会把 foundation 判为 up-to-date 直接跳过（机制已实测：无改动时 1 秒）。
 *
 * ── ⚠️ 三条设计约束（都是踩过的）──────────────────────────────────────────────
 *
 * 1. **不动任何现有配置。** 本脚本只**新增** `tsconfig.check.json` 文件；
 *    现有的 `tsconfig.json` / `packages/<pkg>/tsconfig.json` 一行不改。
 *    ⇒ 失败可整体删除，零风险。
 *
 * 2. **`outDir` 指向缓存目录，不碰 `dist`。** `composite` 必须 emit，
 *    若沿用 `outDir: ./dist` 会与构建门禁读的产物混在一起。
 *
 * 3. 🚨 **必须把跨包 import 重定向到「被引用项目的声明产物」，不能指向源码。**
 *    根 `tsconfig.json` 的 `paths` 把 `@apollo-design/*` 全部映射到各包的 `src` 目录
 *    —— 那样 TS 会**直接读源码**，project references 形同虚设（增量失效）。
 *    所以这里给每个包生成 `paths`，指向**缓存里的 `.d.ts`**。
 *    ⚠️ 写这段注释时踩过：`packages` + `星号` + `/src` 里的 `星号斜杠` 会**提前闭合块注释**，
 *       所以本文件里凡涉及该路径一律写成 `packages/<pkg>/src`。
 *
 * 运行：
 *   node scripts/gen-tsconfig-refs.mjs
 *   node scripts/gen-tsconfig-refs.mjs --check   # 只校验是否最新（CI 用）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = 'node_modules/.cache/apollo';
const DTS = `${CACHE}/dts`;
const check = process.argv.includes('--check');

const pkgDirs = fs
  .readdirSync(path.join(ROOT, 'packages'))
  .filter((p) => fs.existsSync(path.join(ROOT, 'packages', p, 'package.json')))
  .sort();

/** 读包名 → 目录名。 */
const pkgName = {};
for (const p of pkgDirs) {
  pkgName[p] = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'packages', p, 'package.json'), 'utf8'),
  ).name;
}
const dirOf = Object.fromEntries(Object.entries(pkgName).map(([d, n]) => [n, d]));

/**
 * 该包依赖的**其它工作区包**（→ project references）。
 *
 * ⚠️⚠️ **只能用 `dependencies` + `peerDependencies`，绝不能带上 `devDependencies`。**
 *    实测踩过：带上 devDeps 后立刻形成**环形依赖** ——
 *    `a11y → test-utils → theme → utils → …`（`a11y` 的**测试**用 `test-utils`，
 *    而 `test-utils` 自己依赖 `theme`）⇒ `tsc --build` 直接报
 *    `TS6202: Project references may not form a circular graph`。
 *
 *    语义上也对：这些 check 项目**已经排除了测试文件**（`**\/*.test.ts` / `demo`），
 *    所以 devDeps 根本不在编译图里，不该出现在 references 中。
 *
 * ⚠️ `test-utils` 本身是**测试专用包**，不作为任何项目的 reference。
 */
const refsOf = (p) => {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages', p, 'package.json'), 'utf8'));
  const deps = { ...j.dependencies, ...j.peerDependencies };
  return Object.keys(deps)
    .filter((n) => n.startsWith('@apollo-design/') && dirOf[n] && dirOf[n] !== p)
    .map((n) => dirOf[n])
    .sort();
};

/** 一个包的 `paths`：跨包 import → 该包在缓存里的声明产物目录。 */
const pathsFor = (p) => {
  const out = {};
  for (const dep of pkgDirs) {
    if (dep === p) continue;
    // 被引用项目的 rootDir 是 `src`，outDir 是 DTS/<dep>/src ⇒ 声明产物落在 DTS/<dep>/src
    out[pkgName[dep]] = [`${DTS}/${dep}/src`];
  }
  return out;
};

const written = [];
const emit = (rel, obj) => {
  const abs = path.join(ROOT, rel);
  const text = `${JSON.stringify(obj, null, 2)}\n`;
  if (check) {
    const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    if (cur !== text) {
      console.error(`❌ ${rel} 不是最新的 —— 运行 node scripts/gen-tsconfig-refs.mjs`);
      process.exitCode = 1;
    }
    return;
  }
  fs.writeFileSync(abs, text);
  written.push(rel);
};

const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf8'));

// ---- 每包一个 check 项目 ---------------------------------------------------

for (const p of pkgDirs) {
  const refs = refsOf(p);
  emit(`packages/${p}/tsconfig.check.json`, {
    // ⚠️ 不 extends 根 tsconfig —— 根里的 `paths` 指向源码，会破坏 references
    compilerOptions: {
      ...base.compilerOptions,
      paths: pathsFor(p),
      rootDir: 'src',
      outDir: `${ROOT}/${DTS}/${p}/src`,
      tsBuildInfoFile: `${ROOT}/${CACHE}/${p}.tsbuildinfo`,
      composite: true,
      noEmit: false,
      emitDeclarationOnly: true,
      declaration: true,
      declarationMap: false,
      sourceMap: false,
      // ⚠️ `baseUrl` 必须是**仓库根**（绝对路径）：`paths` 的取值是相对 baseUrl 解析的，
      //    若写成 '.'（= 该 tsconfig 所在目录），`node_modules/.cache/...` 会解析到
      //    `packages/<pkg>/node_modules/.cache/...` —— 静默找不到声明产物。
      baseUrl: ROOT,
    },
    include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
    exclude: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.test-d.ts',
      '**/demo/**',
      'dist',
      'node_modules',
    ],
    ...(refs.length
      ? { references: refs.map((r) => ({ path: `../${r}/tsconfig.check.json` })) }
      : {}),
  });
}

// ---- 根 solution -----------------------------------------------------------

emit('tsconfig.check.json', {
  files: [],
  references: pkgDirs.map((p) => ({ path: `./packages/${p}/tsconfig.check.json` })),
});

if (check) {
  if (!process.exitCode) console.log('[tsconfig-refs] ✅ 全部最新');
} else {
  console.log(`[tsconfig-refs] 写出 ${written.length} 个文件：`);
  for (const w of written) console.log(`  ${w}`);
}
