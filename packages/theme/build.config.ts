import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
export default defineBuildConfig({
  hooks: {
    'build:done': async () => {
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
        await import('./dist/index.mjs');

      const out: string[] = [
        '/*!',
        ' * @apollo-design/theme — 零运行时 CSS 变量表（自动生成，勿手改）',
        ' * 生成方式：packages/theme/build.config.ts 的 build:done hook',
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
  },
});
