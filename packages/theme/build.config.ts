import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineBuildConfig } from 'unbuild';

/**
 * theme 包的构建配置。
 *
 * 唯一目的：在 unbuild 产出 dist/index.mjs **之后**，用它生成零运行时 CSS 变量表。
 *
 * 为什么用 hook 而不是改 package.json 的 build 脚本：
 *   package.json 由 `registry/tools/scaffold-packages.mjs` 拥有，手工改会在下一次
 *   `--force-pkg` 时被覆盖。hook 住在包自己这边，不跟模板打架。
 *
 * 为什么从 dist/index.mjs 导入而不是从 src：
 *   本配置由 unbuild 用 jiti 加载，让它再去转译 src 的 TS 是多余的绕路；
 *   而且从产物导入顺带验证了「产物能被真实 import」—— 产物坏了这里会直接炸。
 */

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
     * 此时 `dist/index.mjs` 已在磁盘上，可以照旧 import 它拿 token；
     * 同时它又早于主流程的 validatePackage ⇒ 校验能看到文件。
     *
     * 为什么不能挂在 `build:before`：unbuild 的 `clean dist` 在 `build:before`（1281 行）
     * **之后**（1291 行起）执行，写进去的占位会被清掉。
     */
    'rollup:options': (_ctx, options) => {
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
            getCSSVarDeclarations(getDesignToken({ algorithm: [darkAlgorithm, compactAlgorithm] }), {
              selector: '[data-apollo-theme="dark-compact"]',
            }),
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
