#!/usr/bin/env node
/**
 * 增量门禁（**开发期**用，不是全仓门禁的替代品）。
 *
 * ── 为什么需要它 ──────────────────────────────────────────────────────────────
 *
 * 实测（本机 i7-4770HQ / 4c8t / 16GB）：
 *   - 全仓 `vue-tsc --noEmit`       约 **16 分钟**
 *   - 全仓构建门禁                   约 **7-8 分钟**
 *   - 全仓 `vitest --project unit`   会 OOM（exit 137）
 *
 * 而一次改动通常只碰**一个组件**。全仓门禁里 **99% 的校验与本次改动无关** ——
 * 这就是「一个组件要 45~90 分钟」的主要来源。
 *
 * 本脚本只跑**受本次改动影响的那几个包**：
 *   ① 生成**作用域 tsconfig**：只收窄 `include`，`paths` 全部保留
 *      （跨包 import 仍指向源码，不是 `dist`，语义与全仓一致）
 *   ② 按包跑 vitest（避免全仓 OOM）
 *
 * ── ⚠️ 它**没有**降低标准，只是收窄范围 ──────────────────────────────────────
 *
 *   收窄 `include` 的代价：其它包的类型错误**不会被本脚本发现**。
 *   ⇒ 所以：**合入 master 前仍必须跑一次全仓门禁**（`pnpm lint` + `pnpm test:build`）。
 *   本脚本结束时也会明确提醒这一点。
 *
 * ── 用法 ──────────────────────────────────────────────────────────────────────
 *
 *   node scripts/verify-changed.mjs                  # 对比 master
 *   node scripts/verify-changed.mjs --base HEAD~3    # 指定基线
 *   node scripts/verify-changed.mjs --skip-types     # 只跑测试
 *   node scripts/verify-changed.mjs --skip-tests     # 只跑类型
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

// ---------------------------------------------------------------------------
// 参数
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(name);

const BASE = argOf('--base', 'master');
const SKIP_TYPES = has('--skip-types');
const SKIP_TESTS = has('--skip-tests');

const git = (args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ---------------------------------------------------------------------------
// ① 找出改动涉及哪些包
// ---------------------------------------------------------------------------

/**
 * 改动的文件 → 受影响的包名。
 *
 * ⚠️ 只要碰了 `packages/ui/src/<component>/**`，受影响的就是整个 `ui` 包 ——
 *    因为组件之间可能通过 `_internal` 互相影响，且 `ui` 的类型是一个整体。
 *    这看起来「不够增量」，但相比全仓（13 个包 + tests + registry）仍然窄得多。
 */
function affectedPackages() {
  let diff;
  try {
    diff = git(['diff', '--name-only', `${BASE}...HEAD`]);
  } catch {
    // 没有该基线（例如刚建的分支）⇒ 退回工作区改动
    diff = git(['status', '--porcelain'])
      .split('\n')
      .map((l) => l.slice(3).trim())
      .join('\n');
  }
  const files = diff.split('\n').map((s) => s.trim()).filter(Boolean);
  if (files.length === 0) return [];

  const pkgs = new Set();
  for (const f of files) {
    const m = f.match(/^packages\/([^/]+)\//);
    if (m) pkgs.add(m[1]);
  }
  return [...pkgs].sort();
}

// ---------------------------------------------------------------------------
// ② 生成作用域 tsconfig
// ---------------------------------------------------------------------------

function runScopedTypes(pkgs) {
  const base = JSON.parse(readFileSync(join(ROOT, 'tsconfig.json'), 'utf8'));

  const include = [
    // 受影响包的源码与测试
    ...pkgs.flatMap((p) => [
      `packages/${p}/src/**/*.ts`,
      `packages/${p}/src/**/*.tsx`,
      `packages/${p}/src/**/*.vue`,
      `packages/${p}/tests/**/*.ts`,
      `packages/${p}/*.ts`,
    ]),
  ];

  // ⚠️⚠️ 必须落在**仓库根**（不能放 /tmp）：
  //   `compilerOptions.types: ["node","vite/client","vitest/globals"]` 与相对路径
  //   都以 tsconfig 所在目录为基准解析 ⇒ 放 /tmp 会因找不到 node_modules 直接报
  //   "Entry point of type library 'vitest/globals' specified in compilerOptions"。
  //   （这是第一版踩的坑，15 秒就失败、跟类型无关。）
  const file = join(ROOT, 'tsconfig.scoped.json');
  writeFileSync(file, JSON.stringify({ ...base, include }, null, 2));

  console.log(`\n▶ 作用域 typecheck（${pkgs.length} 个包：${pkgs.join(', ')}）`);
  const r = spawnSync(
    join(ROOT, 'node_modules/vue-tsc/bin/vue-tsc.js'),
    ['--noEmit', '-p', file],
    { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' },
  );
  return r.status === 0;
}

// ---------------------------------------------------------------------------
// ③ 按包跑测试（避免全仓 OOM）
// ---------------------------------------------------------------------------

function runScopedTests(pkgs) {
  let ok = true;
  console.log(`\n▶ 按包测试（${pkgs.join(', ')}）`);
  for (const p of pkgs) {
    const target = `packages/${p}/src`;
    if (!existsSync(join(ROOT, target))) continue;
    console.log(`\n  ── ${p} ──`);
    const r = spawnSync(
      process.execPath,
      [
        join(ROOT, 'node_modules/vitest/vitest.mjs'),
        'run',
        '--project', 'unit',
        '--project', 'dom-contract',
        '--project', 'a11y',
        '--project', 'theme',
        target,
        '--passWithNoTests',
      ],
      {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'inherit',
        env: { ...process.env, CODEBUDDY_SAFE_DELETE_ENABLED: '0' },
      },
    );
    if (r.status !== 0) ok = false;
  }
  return ok;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const pkgs = affectedPackages();

if (pkgs.length === 0) {
  console.log(`\n与 ${BASE} 相比没有改动 ⇒ 无需增量验证。`);
  process.exit(0);
}

console.log(`\n改动涉及包（基线 ${BASE}）：${pkgs.join(', ')}`);

let ok = true;
if (!SKIP_TYPES) ok = runScopedTypes(pkgs) && ok;
if (!SKIP_TESTS) ok = runScopedTests(pkgs) && ok;

console.log('\n' + '='.repeat(64));
console.log(ok ? '✅ 增量门禁通过' : '❌ 增量门禁失败');
console.log('='.repeat(64));
console.log(`
⚠️ 这是**开发期**门禁，只覆盖了 ${pkgs.length} 个包。
   合入 master 前仍**必须**跑全仓门禁：
     pnpm lint          （vue-tsc 全仓 + biome）
     pnpm test:build    （构建门禁）
     pnpm registry:check
`);

process.exit(ok ? 0 : 1);
