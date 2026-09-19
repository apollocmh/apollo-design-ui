/**
 * `useTheme` —— 父子两层 `theme` 的合并。
 *
 * 契约来源：antd 6.6.4 的 `components/config-provider/hooks/useTheme.ts`。
 *
 * ── 移植时**删掉**的三件事（都是 cssinjs/React 专属，`H6`）─────────────────────
 *
 *   1. `createTheme(algorithm)` / `defaultTheme`：cssinjs 的「主题实例」。
 *      本项目算法就是**纯函数**（`@apollo-design/theme` 的 `MappingAlgorithm`），
 *      不需要实例化。
 *   2. `useId()` 生成的 `cssVar.key`：React 18 以下才需要手动指定 cssVar key，
 *      本项目 CSS 变量是**构建期静态产物 + 运行时打补丁**，没有「按实例生成样式表」
 *      这件事，也就没有 per-instance key 的需求。
 *   3. `hashed` 字段：无 cssinjs 就无 hash 类名。
 *
 * ── 保留的合并语义（逐条来自上游）─────────────────────────────────────────────
 *
 *   1. `theme === undefined` ⇒ **直接返回 `parentTheme`**（不新建对象，引用相等）。
 *   2. `inherit === false` 或没有父主题 ⇒ 不继承 `token` / `components`，
 *      但 `cssVarPrefix` / `prefixCls` 仍沿用父级（对应上游保留 `cssVar` / `zeroRuntime`）。
 *   3. `token` 浅合并；`components` **逐组件名**浅合并（不是整体替换）。
 */

import type { ComponentTokenMap, ThemeConfig } from '@apollo-design/theme';

/**
 * 本组件接受的 `theme` 形态。
 *
 * `inherit` 是 antd 的字段；`@apollo-design/theme` 的 `ThemeConfig` 没有它
 * （那个包只管「一份配置怎么派生出 token」，不管「父子怎么合并」）—— 所以由本组件补上。
 */
export type ConfigProviderThemeConfig = ThemeConfig & {
  /**
   * @descCN 是否继承外层 `ConfigProvider` 的 theme。
   * @descEN Whether to inherit the theme from the outer `ConfigProvider`.
   * @default true
   */
  inherit?: boolean;
};

/**
 * 合并父子两层主题。
 *
 * @param theme 本层 `theme` prop
 * @param parentTheme 父层（ConfigContext 里读到的）合并结果
 */
export function useTheme(
  theme: ConfigProviderThemeConfig | undefined,
  parentTheme: ConfigProviderThemeConfig | undefined,
): ConfigProviderThemeConfig | undefined {
  // ① 本层没有 theme ⇒ 原样返回父层（引用相等，避免无谓的对象重建）
  if (!theme) return parentTheme;

  const inherit = theme.inherit !== false && !!parentTheme;

  const base: ConfigProviderThemeConfig = inherit
    ? (parentTheme ?? {})
    : {
        cssVarPrefix: parentTheme?.cssVarPrefix,
        prefixCls: parentTheme?.prefixCls,
      };

  const mergedComponents: ComponentTokenMap = { ...(base.components ?? {}) };

  for (const [name, componentToken] of Object.entries(theme.components ?? {})) {
    mergedComponents[name] = { ...mergedComponents[name], ...componentToken };
  }

  return {
    ...base,
    ...theme,
    token: { ...base.token, ...theme.token },
    components: mergedComponents,
  };
}
