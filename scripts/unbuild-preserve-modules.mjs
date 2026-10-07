/**
 * foundation 包的**共享构建配置** —— 保留模块结构（`preserveModules`）。
 *
 * 由裁决 `ui-tree-shaking` 的 **D** 项（2026-10-07 用户裁决）引入：
 * 「foundation 13 包也保留模块结构」，即 `build-output-contract` **自己推荐过的选项 B**
 * （其 note 原文：「foundation 层无模块级深导入。ui 的按需引入需求留待组件阶段单独裁决」）。
 *
 * ── 为什么是「保留模块结构」而不是「单文件打包」────────────────────────────────
 *
 * 单文件产物下，消费方打包器只能**整模块**丢弃 —— 实测 `@apollo-design/ui`
 * 引任意一个组件都要 1272.9 KB（全量的 63%）。模块结构保留后，
 * 消费方可以按模块摇树。判据（实测）：`import 'pkg'` ⇒ 0 KB（模块级丢弃有效）
 * 而 `import { X } from 'pkg'` ⇒ 全量（只有一个模块可丢）⇒ 限制因素正是模块粒度。
 *
 * ── 为什么用 `--config` 指向本文件，而不是每个包放一份 build.config.ts ──────────
 *
 * `build-output-contract` 选项 B 的 tradeoff 写的是「每个包多一套构建配置与一份产物」。
 * 「多一份产物」是这次的目的；但「多一套配置」是**可以避免的新债** ——
 * 13 份内容相同的配置必然漂移。所以 `scaffold-packages.mjs` 把 foundation 包的
 * `scripts.build` 生成为 `unbuild --config ../../scripts/unbuild-preserve-modules.mjs`。
 *
 * ⚠️ `--config` 的路径是**相对 CWD** 的（unbuild CLI 原文：*"relative to the current
 *    working directory"*），而 pnpm 在包目录里执行 `build` ⇒ CWD = 包目录 ⇒
 *    `../../scripts/...` 成立。**不要在仓库根直接跑 `unbuild --dir packages/x`**，
 *    那条路径会解析失败。
 *
 * ⚠️ `theme` / `ui` **不用**本配置（它们各有自己的 `build.config.ts`：theme 要写
 *    `dist/tokens.css`、ui 要处理 SFC 与每组件 CSS）。
 *
 *    ⚠️ **但它们在自己的配置里各自打开了同样的 `preserveModules`** —— 2026-10-07 补记：
 *    theme 一开始**漏了**（`ownBuildConfig` ⇒ 被本配置跳过），导致 D 实际只落地 12/13，
 *    而门禁里那句「产物已是模块结构」对 theme 是**假的**。改 theme 的人请记住：
 *    **「不用本配置」不等于「不用 preserveModules」**，两件事必须一起看。
 *
 * 覆盖方式：本配置只设 `output.preserveModules*`，不碰 unbuild 的其它默认
 * （`declaration` 仍为 true —— foundation 包是纯 TS，rollup-plugin-dts 能正常出声明）。
 */
import { resolve } from 'node:path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  hooks: {
    'rollup:options'(ctx, options) {
      // 包目录。`ctx.options.rootDir` 由 unbuild 按 CWD 解析 ⇒ 与配置文件所在目录无关。
      const rootDir = ctx.options.rootDir ?? '.';
      const srcDir = resolve(rootDir, 'src');

      const applyPreserveModules = (output) => ({
        ...output,
        // 一个源模块 → 一个产物文件（`dist/index.mjs` 变成 re-export barrel）。
        preserveModules: true,
        // 让产物路径**相对 src**，于是 `src/index.ts` → `dist/index.mjs`、
        // `src/dom/focus.ts` → `dist/dom/focus.mjs`（而不是带上 src/ 前缀）。
        preserveModulesRoot: srcDir,
      });

      if (Array.isArray(options.output)) {
        options.output = options.output.map(applyPreserveModules);
      } else if (options.output) {
        options.output = applyPreserveModules(options.output);
      } else {
        // unbuild 正常情况下一定会给 output；兜底成 esm 单份，避免静默什么都不改。
        options.output = applyPreserveModules({ format: 'es' });
      }
    },
  },
});
