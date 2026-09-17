#!/usr/bin/env node
/**
 * tests/compat/runner/index.mjs — 兼容性比对的**入口**
 *
 * ── 这个 runner 做什么、不做什么 ─────────────────────────────────────────────
 *
 * `package.json` 的 `test:compat` / `test:compat:baseline` 指向本文件。
 *
 * 它负责**基线那一半**：调用 `tests/compat/baseline/*.mjs` 用 antd 重新生成/校验
 * React 侧的机械 oracle。**比对那一半**在消费侧 —— 各组件的
 * `packages/ui/src/<component>/__tests__/semantic.test.ts` 里，通过
 * `@apollo-design/test-utils` 的 `domContractTest` 与同一份基线逐节点比对。
 *
 * 为什么不做成「一个脚本跑完两侧」：README §2 最初设想的形态（`runner/drivers/react.mjs`
 * + `drivers/vue.mjs`）需要同时挂载 React 与 Vue 两棵组件树。但实际落地时，
 * 图标（848 个）已经证明**更简单且更强**的做法是：
 *
 *   1. React 侧用 `renderToStaticMarkup` 在 Node 里渲染一次，把**原始 HTML** 落盘；
 *   2. Vue 侧在 vitest 里渲染，两侧走**同一条**归一化流水线后比对。
 *
 * 这样做的好处：
 *   - 基线是**纯数据**，可以进 git、可以在 diff 里逐字看（README §1 要求「规格可执行」）；
 *   - 比对跑在 vitest 里，于是能用上 `expect`、能按用例名定位失败、能被 CI 分层跑；
 *   - 不需要一个常驻的双运行时进程。
 *
 * 代价：基线**不会**自动跟着 antd 版本更新 —— 所以本 runner 的存在意义就是把
 * 「重新生成」与「校验是否过期」变成一条命令，而不是靠人记得。
 *
 * 用法：
 *   node tests/compat/runner/index.mjs                    # 校验全部基线是否最新
 *   node tests/compat/runner/index.mjs --baseline         # 重新生成全部基线
 *   node tests/compat/runner/index.mjs --component empty  # 只处理一个组件
 *   node tests/compat/runner/index.mjs --all              # 与默认行为相同（显式写法）
 *
 * ⚠️ 基线是**机械 oracle，禁止手改**（`tests/compat/README.md` §1）。
 *    改基线只能通过重新生成，且 diff 必须能被解释。
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPAT_DIR = path.resolve(__dirname, '..');
const BASELINE_SCRIPT_DIR = path.join(COMPAT_DIR, 'baseline');
const ROOT = path.resolve(COMPAT_DIR, '../..');

const args = { baseline: false, component: null };
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a === '--baseline') args.baseline = true;
  else if (a === '--component') args.component = process.argv[++i];
  else if (a === '--all') args.component = null;
  else if (a === '--help' || a === '-h') {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(0);
  } else {
    console.error(`[compat] 未知参数: ${a}`);
    process.exit(2);
  }
}

/** 每个组件一个生成器：`baseline/<component>.mjs`。文件名即组件名。 */
function listGenerators() {
  if (!fs.existsSync(BASELINE_SCRIPT_DIR)) return [];
  return fs
    .readdirSync(BASELINE_SCRIPT_DIR)
    .filter((f) => f.endsWith('.mjs'))
    .map((f) => f.replace(/\.mjs$/, ''))
    .sort();
}

const all = listGenerators();
const targets = args.component ? all.filter((c) => c === args.component) : all;

if (targets.length === 0) {
  console.error(
    args.component
      ? `[compat] 找不到组件 "${args.component}" 的基线生成器。已知: ${all.join(', ')}`
      : '[compat] tests/compat/baseline/ 下没有任何生成器。',
  );
  process.exit(1);
}

// 基线与生成器一一对应 —— 多出来的基线说明生成器被删了，那份基线再也不会被更新。
const baselineDir = path.join(COMPAT_DIR, 'baselines');
const orphan = fs.existsSync(baselineDir)
  ? fs
      .readdirSync(baselineDir)
      .filter((f) => f.endsWith('.dom.json'))
      .map((f) => f.replace(/\.dom\.json$/, ''))
      .filter((name) => !all.includes(name))
  : [];
if (orphan.length > 0) {
  console.error(`[compat] ❌ 存在没有生成器的基线（永远不会被更新）: ${orphan.join(', ')}`);
  console.error('  要么补回 baseline/<name>.mjs，要么删掉那份基线。');
  process.exit(1);
}

console.log(`[compat] ${args.baseline ? '重新生成' : '校验'} ${targets.length} 个组件的基线\n`);

const failures = [];
for (const component of targets) {
  const script = path.join(BASELINE_SCRIPT_DIR, `${component}.mjs`);
  const scriptArgs = args.baseline ? [] : ['--check'];
  try {
    const out = execFileSync(process.execPath, [script, ...scriptArgs], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    process.stdout.write(
      out
        .split('\n')
        .filter(Boolean)
        .map((line) => `  ${line}`)
        .join('\n') + '\n',
    );
  } catch (err) {
    failures.push(component);
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.split('\n').filter(Boolean);
    console.error(`  ❌ ${component}`);
    for (const line of out) console.error(`     ${line}`);
  }
}

console.log();
if (failures.length > 0) {
  console.error(`[compat] ❌ ${failures.length}/${targets.length} 个组件的基线有问题`);
  if (!args.baseline) {
    console.error('[compat]    重新生成: node tests/compat/runner/index.mjs --baseline');
  }
  process.exit(1);
}

console.log(`[compat] ✅ ${targets.length}/${targets.length} 个组件的基线一致`);
console.log('[compat] 比对本身在 vitest 里：pnpm run test:dom（见 tests/compat/README.md §8）');
