import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineBuildConfig } from 'unbuild';

/**
 * ⚠️⚠️ 必须在**配置加载期**先把 `dist/tokens.css` 造出来（占位即可）。
 *
 * unbuild 在解析 `package.json` 的 `exports` 时做存在性检查
 * （`unbuild@3.6.1` 的 `dist/shared/unbuild.CyYtfvFx.mjs:123-126`）：
 *
 * ```js
 * if (!input) {                                    // tokens.css 没有源入口 ⇒ input 恒为 undefined
 *   if (!existsSync(resolve(rootDir || '.', output.file))) {
 *     warnings.push(`Could not find entrypoint for \`${output.file}\``);
 *   }
 *   continue;
 * }
 * ```
 *
 * 而 `failOnWarn` 默认为 `true`（同文件 `:1192`）⇒ 该告警会让 unbuild `exit(1)`。
 *
 * ⚠️ 关键：**这次检查发生在 `clean dist` 与 rollup 构建之前**。
 * 所以「在 `writeBundle` 里生成 tokens.css」**永远来不及** ——
 * 旧实现之所以看起来能过，是因为**上一次构建留下的 `dist/tokens.css`** 骗过了检查。
 * 实测（2026-09-18）：`dist/` 存在 → 连续 3 次 FAIL 0；把 `dist/` 移走 → 必 FAIL 1；
 * 只放一个空占位 `dist/tokens.css` → 又 FAIL 0。
 * ⇒ **全新 clone / CI 上 `tests/build/run.mjs` 的 theme B1 必然红。**
 *
 * 对策：加载配置时先写占位让检查通过；真实内容仍由下面的 `writeBundle` 覆盖。
 * 占位随后会被 unbuild 的 `clean dist` 删掉，再由 `writeBundle` 重建为真内容 ——
 * 顺序已实测确认（占位能过检查、最终产物是真内容）。
 */
const DIST_DIR = resolve(import.meta.dirname ?? '.', 'dist');
const TOKENS_CSS = resolve(DIST_DIR, 'tokens.css');
try {
  if (!existsSync(TOKENS_CSS)) {
    mkdirSync(DIST_DIR, { recursive: true });
    writeFileSync(
      TOKENS_CSS,
      '/* 占位：真实内容由 build.config.ts 的 rollup writeBundle 写入 */\n',
      'utf8',
    );
  }
} catch {
  // 写不进去就让 unbuild 报它自己的错，这里不吞掉真正的问题
}

/** 防止 esm 与 dts 两次 rollup 构建各写一遍（写两次本身幂等，但没必要）。 */
let tokensCssWritten = false;

export default defineBuildConfig({
  hooks: {
    /**
     * ⚠️⚠️ 为什么挂在 `rollup:options` 的 `writeBundle` 上，而不是 `build:done`
     * （2026-09-18 修，此前一直是 `build:done`）
     *
     * 背景：`packages/theme/package.json` 的 `exports` 里声明了 `./tokens.css`，
     * 而 unbuild 会校验 exports 指向的路径**是否真实存在**：
     *
     * ```js
     * // unbuild@3.6.1 dist/shared/unbuild.CyYtfvFx.mjs:329-354
     * function validatePackage(pkg, rootDir, ctx) {
     *   ...
     *   if (filename && !filename.includes('*') && !existsSync(filename)) {
     *     missingOutputs.push(...)          // → warn "Potential missing package.json files"
     *   }
     * }
     * ```
     *
     * 而它的调用点在主流程 **1380 行**，`build:done` hook 在 **1381 行** ——
     * **校验先于 hook**。于是 `build:done` 里写出的 tokens.css 永远来不及被看到，
     * unbuild 报 warn，`failOnWarn`（默认 true）直接 `process.exit(1)`。
     *
     * 症状：`tests/build/run.mjs` 的 B1 对 theme 判 FAIL（退出码 1）。
     * 引入时机：给 theme 补 `./tokens.css` 导出时 —— 在那之前 exports 里没有它，
     * 校验自然看不到。
     *
     * 为什么不能简单 `failOnWarn: false`：那是全局开关（源码里就是 `if (ctx.options.failOnWarn)`，
     * 不支持按警告类型过滤），会一并放过「潜在隐式依赖」等真实警告 —— 属放宽，不是修复。
     *
     * 为什么 `writeBundle` 可行：它发生在 rollup **写完产物之后**，
     * 此时 `dist/index.mjs` 已在磁盘上，可以照旧 import 它拿 token。
     *
     * ⚠️ 订正（2026-09-18）：这里原来还写着「它又早于主流程的 validatePackage
     * ⇒ 校验能看到文件」—— **那是错的**。`validatePackage` 的存在性检查发生在
     * **构建开始之前**，`writeBundle` 永远赶不上。真正让检查通过的是文件顶部的
     * **配置加载期占位写入**。详见文件顶部那段注释。
     *
     * 为什么不能只挂在 `build:before`：unbuild 的 `clean dist` 在 `build:before`（1281 行）
     * **之后**（1291 行起）执行，写进去的东西会被清掉；而且 `build:before` 本身
     * 也晚于 exports 解析。
     */
    /**
     * ⚠️⚠️ `preserveModules`（2026-10-07 补，裁决 `ui-tree-shaking` 的 **D** 项）
     *
     * D 的原话是「**13 个 foundation 包**同步保留模块结构」。其余 12 个包走共享配置
     * `scripts/unbuild-preserve-modules.mjs`，而 **theme 有 `ownBuildConfig`**（要写
     * `dist/tokens.css`）⇒ 被共享配置跳过了 ⇒ **D 实际只落地 12/13**，且门禁里那句
     * 「产物已是模块结构」对 theme 是**假的**（dist 只有 4 个文件 / 1 个 mjs）。
     * 这里把同一套设置补上，让 13/13 成立。
     *
     * 为什么放在本 hook 里：theme 需要 `ctx.options.rootDir`（由 unbuild 按 CWD 解析），
     * 不能像共享配置那样从配置文件位置推导。
     *
     * ⚠️ 与 `tokensCssPlugin` 的相互作用已实测：`preserveModules` 下入口模块仍是
     *    `index.mjs` ⇒ 下面的 `bundle['index.mjs']` 判定照旧成立，`dist/tokens.css`
     *    仍能正常生成（B5/B7 不因此失效）。
     */
    'rollup:options': (ctx, options) => {
      const rootDir = ctx.options.rootDir ?? '.';
      const srcDir = resolve(rootDir, 'src');
      // ⚠️ 参数类型必须是 `OutputOptions` 本身（`Record<string, unknown>` 会报 TS2345，
      //    且该错误只有 `pnpm run test:types` 抓得到）。与 `packages/ui/build.config.ts` 同款写法。
      //    ⚠️ 必须**显式分发**：直接写 `NonNullable<X> extends Array<infer U> ? U : X` 是错的
      //       （不分发 ⇒ OutputOption 仍是 `OutputOptions | OutputOptions[]` ⇒ `.map()` 又报错）。
      type ElementOf<T> = T extends Array<infer U> ? U : T;
      type OutputOption = ElementOf<NonNullable<typeof options.output>>;
      const applyPreserveModules = (output: OutputOption): OutputOption => ({
        ...output,
        preserveModules: true,
        preserveModulesRoot: srcDir,
      });
      if (Array.isArray(options.output)) {
        options.output = options.output.map(applyPreserveModules);
      } else if (options.output) {
        options.output = applyPreserveModules(options.output);
      }

      const tokensCssPlugin = {
        name: 'apollo-theme-tokens-css',
        async writeBundle(
          _outputOptions: unknown,
          bundle: Record<string, { type: string }>,
        ): Promise<void> {
          // dts 那次构建的 bundle 里没有 index.mjs —— 跳过，只认 esm 那次
          if (tokensCssWritten || !bundle?.['index.mjs']) {
            return;
          }
          tokensCssWritten = true;

          // ⚠️ 这里**不能**给解构加手写类型注解。
          //    2026-09-17 修：原注解把 getDesignToken 的参数写成
          //    `{ algorithm?: unknown; token?: Record<string, unknown> }`、返回写成
          //    `Record<string, unknown>`，而 dist 里的真实签名是
          //    `(config?: ThemeConfig) => AliasToken`。严格函数参数逆变下
          //    `Record<string, unknown>` 不能赋给 `ThemeConfig['token']`（后者是
          //    `Partial<SeedToken & Record<string, string | number | boolean>>`），
          //    于是 `pnpm run lint:types` 长期红着 —— 而这道门禁恰好是没人校验的那个
          //    （见 verification.typecheck 的说明）。dist 自带 .d.ts，直接让 TS 推断
          //    既准确又不会与 src 的真实契约漂移。
          const { getDesignToken, darkAlgorithm, compactAlgorithm, getCSSVarDeclarations } =
            await import(
              /* @vite-ignore */ pathToFileURL(
                resolve(import.meta.dirname ?? '.', 'dist/index.mjs'),
              ).href
            );

          const out: string[] = [
            '/*!',
            ' * @apollo-design/theme — 零运行时 CSS 变量表（自动生成，勿手改）',
            ' * 生成方式：packages/theme/build.config.ts 的 rollup writeBundle hook',
            ' * 用法：引入本文件即可获得全部 --apollo-* 变量，无需任何 JS 运行时',
            ' */',
            '',
            getCSSVarDeclarations(getDesignToken()),
            getCSSVarDeclarations(getDesignToken({ algorithm: darkAlgorithm }), {
              selector: '[data-apollo-theme="dark"]',
            }),
            getCSSVarDeclarations(getDesignToken({ algorithm: compactAlgorithm }), {
              selector: '[data-apollo-theme="compact"]',
            }),
            getCSSVarDeclarations(
              getDesignToken({ algorithm: [darkAlgorithm, compactAlgorithm] }),
              {
                selector: '[data-apollo-theme="dark-compact"]',
              },
            ),
            '',
          ];

          const file = resolve(import.meta.dirname ?? '.', 'dist/tokens.css');
          mkdirSync(resolve(file, '..'), { recursive: true });
          writeFileSync(file, out.join('\n'), 'utf8');
          process.stdout.write(`  ✔ 已生成 dist/tokens.css（4 套主题变量）\n`);
        },
      };

      const existing = options.plugins
        ? Array.isArray(options.plugins)
          ? options.plugins
          : [options.plugins]
        : [];
      // 放最前面：先写 tokens.css，再轮到其它插件
      options.plugins = [tokensCssPlugin as never, ...existing];
    },
  },
});
