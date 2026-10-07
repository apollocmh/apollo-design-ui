/**
 * B6 —— tree-shaking 有效：**按需引入单组件后产物体积 ≤ 预算**。
 *
 * ── 为什么这条门禁值得存在（它抓到过一个真缺陷）────────────────────────────────
 *
 * 2026-10-07 首次真正运行（此前自 2026-09-18 起一直是 PENDING）实测：
 * `@apollo-design/ui` 引**任意一个**组件都要 1272.9 KB = 全量的 **63%** ——
 * 即「按需引入」事实上不存在。根因是单文件产物只能被**整模块**丢弃。
 * ⇒ 一条从不运行的门禁，恰好是缺陷沉积的地方（见决策 `ui-tree-shaking`）。
 *
 * ── 判据与实现 ────────────────────────────────────────────────────────────────
 *
 * 用 Vite（rolldown）lib 构建一个只 import 目标导出的入口，`write: false` 读内存产物
 * 字节数；与 `tests/build/budget.json` 的预算比对。
 *
 * ⚠️ 三个必须遵守的实测约束（都踩过）：
 *   1. **探针入口必须落在仓库内** —— `node_modules/@apollo-design/*` 的软链接只存在于
 *      仓库根与部分包目录；放 `/tmp` 会让模块解析直接失败。
 *   2. **`vue` / `dayjs` 必须 external** —— 它们不是被测包的产物；不排除会把 Vue
 *      算进「单组件体积」。
 *   3. **不能只判总量，还要判「与全量的比」** —— 单看绝对值无法区分「组件大」与
 *      「摇树失效」。`import * as all` 作为参照，若「一个组件 ≈ 全量」则必然失效。
 *
 * ⚠️ 预算只能因**技术原因**调整，且必须在 commit message 说明理由。
 *    把预算设成「等于全量」等于宣告这条门禁永不失败 —— 那是 H8 明禁的降低验收标准。
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

/**
 * 组件**目录名** → 包入口的**具名导出**（单一真源）。
 *
 * 这些是「目录名机械转 Pascal 会得到错名字」的少数派：
 *   - `grid` 目录导出的是 `Row` + `Col`，并没有叫 `Grid` 的组件（与 antd 的导出面一致）；
 *   - `qr-code` 目录的组件名是 `QrCode`（驼峰两个大写），机械转是 `Qrcode`；
 *   - `message` / `notification` 导出名是**小写**（它们是方法集合，不是组件）。
 *
 * ⚠️ 这张表被两处消费（B6 的预算测量、B8 的 SSR 冒烟），**必须同源** ——
 *    2026-10-07 之前它在 `run.mjs` 里另有一份副本，两份必然漂移。
 */
export const COMPONENT_EXPORT_ALIASES = {
  grid: ['Row', 'Col'],
  'qr-code': ['QrCode'],
  message: ['message'],
  notification: ['notification'],
};

/** 目录名 → 导出名（无别名时按 `kebab → Pascal` 机械转换）。 */
export function exportNamesOf(dirName) {
  return (
    COMPONENT_EXPORT_ALIASES[dirName] ?? [
      dirName.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase()),
    ]
  );
}

/**
 * 构建一个只 import 指定导出的入口，返回产物的**未压缩字节数**。
 *
 * @param repoRoot 仓库根（探针目录建在这里，保证模块解析可达）
 * @param pkg      被测包名（如 `@apollo-design/ui`）
 * @param imports  要 import 的具名导出；空数组 ⇒ `import * as all`（全量参照）
 * @param external 外部化说明符（默认 `vue` / `dayjs`）
 */
export async function measureImportSize({ repoRoot, pkg, imports, external }) {
  const scratch = mkdtempSync(join(repoRoot, '.treeshake-probe-'));
  const entry = join(scratch, 'entry.mjs');
  const code = imports.length
    ? `import { ${imports.join(', ')} } from '${pkg}';\nconsole.log(${imports.join(', ')});\n`
    : `import * as all from '${pkg}';\nconsole.log(all);\n`;
  writeFileSync(entry, code);
  try {
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      build: {
        write: false,
        minify: 'esbuild',
        rollupOptions: {
          input: entry,
          external: external ?? ['vue', 'dayjs'],
          output: { format: 'es' },
        },
      },
    });
    const out = Array.isArray(result) ? result[0] : result;
    let bytes = 0;
    for (const chunk of out.output) bytes += Buffer.byteLength(chunk.code ?? '');
    return bytes;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/**
 * 跑一条预算条目。
 *
 * ⚠️ `fullKb` **必须复用**：不传就会为这一条**再测一次全量**，73 条 ⇒ 146 次构建。
 *    全量与被测条目无关，一次测完传进来即可（实测：复用后整套 B6 从 ~46s 降到 ~23s）。
 *
 * @param fullKb 全量 `import * as all` 的 KB；`undefined` ⇒ 现测（仅供单独调试）
 * @returns `{ id, actualKb, budgetKb, fullKb, ratio, ok, detail }`
 */
export async function checkBudgetEntry(repoRoot, entry, fullKb) {
  const external = entry.external ?? ['vue', 'dayjs'];
  const actual = await measureImportSize({
    repoRoot,
    pkg: entry.pkg,
    imports: entry.imports,
    external,
  });
  const full =
    fullKb ?? (await measureImportSize({ repoRoot, pkg: entry.pkg, imports: [], external })) / 1024;
  const actualKb = actual / 1024;
  const ratio = full === 0 ? 0 : actualKb / full;
  const overBudget = !(entry.budgetKb > 0) || actualKb > entry.budgetKb;
  const maxRatio = entry.maxRatioOfFull ?? 0.3;
  const overRatio = ratio > maxRatio;
  return {
    id: entry.id,
    actualKb,
    budgetKb: entry.budgetKb,
    fullKb: full,
    ratio,
    ok: !overBudget && !overRatio,
    detail:
      `${entry.imports.join('+') || '*'}: ${actualKb.toFixed(1)} KB` +
      ` / 全量 ${full.toFixed(1)} KB (${(ratio * 100).toFixed(1)}%)` +
      ` / 预算 ${entry.budgetKb > 0 ? `${entry.budgetKb} KB` : '未设定'}` +
      (overRatio ? ` [超占比上限 ${(maxRatio * 100).toFixed(0)}%]` : ''),
  };
}

/**
 * 跑完整份 budget.json。
 *
 * @param budget 已解析的 budget.json
 * @returns `{ fullKb, results, failures }`
 */
export async function runBudgetChecks(repoRoot, budget) {
  const external = budget.external ?? ['vue', 'dayjs'];
  const maxRatio = budget.maxRatioOfFull ?? 0.3;
  const pkg = budget.entries[0]?.pkg ?? '@apollo-design/ui';
  const fullKb = (await measureImportSize({ repoRoot, pkg, imports: [], external })) / 1024;

  const results = [];
  for (const entry of budget.entries) {
    // eslint-disable-next-line no-await-in-loop -- 逐个构建，串行以复用 vite 缓存、避免内存峰值
    results.push(await checkBudgetEntry(repoRoot, { ...entry, maxRatio }, fullKb));
  }
  return { fullKb, results, failures: results.filter((r) => !r.ok) };
}

/**
 * 列出**全部**待测量的组件目录名。
 *
 * 取两个来源的并集 —— 缺任一个都会留下盲区：
 *   - `registry/components.json`（72）：含无自有 CSS 的 config-provider / watermark /
 *     auto-complete / time-picker；
 *   - `COMPONENT_STYLES`（69）：含 components.json 没有的 `layout-sider`。
 * ⇒ 并集 73，与 `exports` 里的 JS 深入口数一致。
 */
export function listComponentDirs(repoRoot, uiDistModule) {
  const registry = JSON.parse(readFileSync(join(repoRoot, 'registry/components.json'), 'utf8'));
  const registryNames = (Array.isArray(registry) ? registry : registry.components).map(
    (c) => c.name,
  );
  const styleNames = uiDistModule.COMPONENT_STYLES.map((e) => e.name);
  return [...new Set([...registryNames, ...styleNames])].sort();
}

/**
 * CLI：重新测量全部组件，把**可直接写入 budget.json 的 JSON**打到 stdout。
 *
 *   node tests/build/checks/treeshake.mjs --measure-all > tests/build/budget.json
 *
 * 为什么需要它：budget.json 里有 73 个数字，没有再生手段它们就是**只能手工维护的死数**
 * —— 下一次产物形态变化时会有人手改甚至放弃这条门禁。有了这条命令，重新定预算是
 * 一次可复现的操作（改完仍需人工 review diff 并在 commit message 说明理由）。
 *
 * ⚠️ 预算系数（1.5× + 5 KB）写在这里，与 budget.json 的 `_readme` 保持一致。
 */
async function measureAll() {
  const repoRoot = resolve(join(new URL(import.meta.url).pathname, '..'), '../../..');
  const mod = await import(pathToFileURL(join(repoRoot, 'packages/ui/dist/index.mjs')).href);
  const external = ['vue', 'dayjs'];
  const pkg = '@apollo-design/ui';

  const fullKb = (await measureImportSize({ repoRoot, pkg, imports: [], external })) / 1024;
  const entries = [];
  for (const dir of listComponentDirs(repoRoot, mod)) {
    const imports = exportNamesOf(dir);
    const missing = imports.filter((n) => !(n in mod));
    if (missing.length) {
      console.error(`跳过 ${dir}：包入口没有导出 ${missing.join(',')}`);
      continue;
    }
    // eslint-disable-next-line no-await-in-loop -- 串行，避免并发构建的内存峰值
    const kb = (await measureImportSize({ repoRoot, pkg, imports, external })) / 1024;
    entries.push({
      id: dir,
      pkg,
      imports,
      budgetKb: Math.ceil(kb * 1.5 + 5),
      measuredKb: Number(kb.toFixed(1)),
    });
    console.error(`  ${dir.padEnd(18)} ${kb.toFixed(1).padStart(8)} KB`);
  }
  console.error(`  全量 ${fullKb.toFixed(1)} KB；共 ${entries.length} 条`);
  process.stdout.write(`${JSON.stringify({ external, maxRatioOfFull: 0.3, entries }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--measure-all')) await measureAll();
  else {
    console.error('用法: node tests/build/checks/treeshake.mjs --measure-all');
    process.exit(1);
  }
}
