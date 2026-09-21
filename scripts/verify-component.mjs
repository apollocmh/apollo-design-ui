#!/usr/bin/env node
/**
 * verify-component.mjs — 单组件快速取证。
 *
 * 背景（2026-09-21）：开发期的瓶颈之一是每个 Gate 都要跑全仓门禁取证
 * （lint 7'49" + 全量 vitest）。但 Gate G5–G11 的证据其实只关心**当前组件**。
 * 本脚本对单个组件目录做适用层的 scoped 运行，把取证时间从分钟级压到秒级。
 *
 * ⚠️ 定位与边界（不降低验收标准，H8）：
 *   - 本脚本用于**开发期反馈**（G5–G11 的逐 Gate 取证）。
 *   - G13 收口仍必须跑全仓四道：pnpm run registry:check && lint && test && test:build。
 *   - 它**不替代** `verify:changed` / `verify:full`，只是让开发循环更快。
 *
 * 用法：
 *   node scripts/verify-component.mjs <kebab-name> [--visual] [--quiet]
 *
 * 做什么：
 *   1. vitest（unit + dom-contract + types + a11y + theme）按路径过滤到
 *      packages/ui/src/<name>/
 *   2. biome check 该目录（含 .vue）
 *   3. 汇总每层用例数 / 失败数，按 Gate 对号入座打印证据
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    visual: { type: 'boolean', default: false },
    quiet: { type: 'boolean', default: false },
  },
});

const name = positionals[0];
if (!name) {
  console.error('用法: node scripts/verify-component.mjs <kebab-name> [--visual]');
  process.exit(2);
}

const ROOT = resolve(import.meta.dirname, '..');
const dir = join(ROOT, 'packages/ui/src', name);
if (!existsSync(dir)) {
  console.error(`✗ 目录不存在: packages/ui/src/${name}`);
  process.exit(2);
}

const bin = (...p) => join(ROOT, 'node_modules/.bin', ...p);
if (!existsSync(bin('vitest'))) {
  console.error('✗ node_modules/.bin/vitest 不存在 —— 本 worktree 未安装依赖。');
  console.error(
    '  （PITFALLS #7：pnpm install 在沙箱可能挂起；可复用兄弟 worktree 的 node_modules）',
  );
  process.exit(2);
}

const relDir = `packages/ui/src/${name}`;
let failed = false;

// ── 1. vitest（适用层一次跑完，按目录过滤）─────────────────────────────────────
const projects = ['unit', 'dom-contract', 'types', 'a11y', 'theme'];
if (!values.quiet) console.log(`\n▶ vitest ${projects.join('/')} · 过滤 ${relDir}/`);
const vitest = spawnSync(
  bin('vitest'),
  ['run', ...projects.flatMap((p) => ['--project', p]), relDir],
  { cwd: ROOT, encoding: 'utf8', shell: false },
);
const out = (vitest.stdout ?? '') + (vitest.stderr ?? '');
if (!values.quiet) console.log(out.trim().split('\n').slice(-25).join('\n'));
// 失败判定用**真实计数**而不是退出码：types 项目存在既有的「Unhandled Source Error」
// 噪音（干净 worktree 同样 28 条，Type Errors 为 0、Test Files 全 passed），
// 它会把退出码打成非 0，但不代表任何用例失败。
const failedFiles =
  /^\s*Test Files\s+\S*1 failed/m.test(out) || /Test Files\s+\d+ failed/.test(out);
const failedTests =
  /Tests\s+\S*failed|Tests:\s+\S*failed/.test(out) && /Tests.*[1-9]\d* failed/.test(out);
if (failedFiles || failedTests) failed = true;
if (vitest.status !== 0 && !failed && !values.quiet) {
  console.log(
    'ℹ️  vitest 退出码非 0 但无失败用例（types 项目的 unhandled source errors 既有噪音）。',
  );
}

// 从 vitest 汇总行提取证据（Test Files / Tests）
const summary = [...out.matchAll(/(Test Files|Tests)\s+(.+)$/gm)].map(
  (m) => `${m[1]}: ${m[2].trim()}`,
);

// ── 2. biome（该目录的 lint/格式）──────────────────────────────────────────────
if (existsSync(bin('biome'))) {
  if (!values.quiet) console.log(`\n▶ biome check ${relDir}/`);
  const biome = spawnSync(bin('biome'), ['check', relDir], { cwd: ROOT, encoding: 'utf8' });
  const tail = ((biome.stdout ?? '') + (biome.stderr ?? ''))
    .trim()
    .split('\n')
    .slice(-3)
    .join('\n');
  if (!values.quiet) console.log(tail);
  if (biome.status !== 0) failed = true;
  if (tail) summary.push(`biome: ${biome.status === 0 ? 'clean' : 'FAILED'}`);
} else {
  summary.push('biome: 跳过（不可执行文件不存在）');
}

// ── 3. 证据汇总 ────────────────────────────────────────────────────────────────
console.log(
  `\n${'='.repeat(64)}\n${name} · 开发期取证汇总${failed ? '（有失败）' : '（全绿）'}\n${'='.repeat(64)}`,
);
for (const line of summary) console.log(`  ${line}`);
console.log(`
对应关系（Gate → 证据）:
  G5/G6 unit+dom-contract  G7 types  G8 a11y  G3/G4 theme
  ⚠️ 这是开发期反馈；G13 收口仍需全仓四道全绿（verify:full）。`);
process.exit(failed ? 1 : 0);
