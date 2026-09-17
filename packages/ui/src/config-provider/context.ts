/**
 * ConfigProvider 的注入上下文 —— **叶子模块**（leaf module）。
 *
 * 契约来源：antd 6.6.4 的 `es/config-provider/context.js`（`ConfigContext` + `useComponentConfig`）。
 *
 * ── 为什么现在只做「最小可用集」──────────────────────────────────────────────
 *
 * `registry/components.json` 把 `config-provider/context` 记为 Empty 的 `leafModules`
 * 依赖（而不是 `components` 依赖），含义是：Empty 需要的是**这个叶子模块**，
 * 不是 ConfigProvider 组件本身。ConfigProvider 组件（含 theme / locale / size / disabled
 * 的统一入口）走它自己的 G0→G14。
 *
 * 所以本文件目前只落 Empty 真正用到的两件事：
 *   1. `getPrefixCls('empty', customizePrefixCls)` 与 `direction`（从 context 读，带兜底）
 *   2. `useComponentConfig('empty')` 返回的 `image` / `className` / `style` / `classNames` / `styles`
 *
 * 其余组件配置、`theme`、`locale`、`renderEmpty`、`getPopupContainer` 等在 ConfigProvider
 * 落地时补 —— **不是**「先占位以后再填」，而是「还没有消费者，现在写就是凭想象实现」。
 *
 * ── 为什么 `useComponentConfig` 是泛型而不是按组件硬编码 ─────────────────────
 *
 * antd 的 `useComponentConfig(propName)` 读 `context[propName]`，而 `context` 的类型
 * 里写着每个组件的配置类型（`EmptyConfig` 等），代价是 `config-provider/context.ts`
 * **反向 import 每一个组件目录**（antd 确实是这么做的，`import type { EmptyProps } from '../empty'`）。
 *
 * 本项目禁止组件之间互相 import（ui 的 contracts：共享 context 与工具必须放在
 * `src/_internal/` 或本叶子模块）。若这里 `import type { EmptyConfig } from '../empty'`，
 * 就形成了 empty ↔ config-provider 的双向边。
 *
 * 因此改成：**类型由调用方给出** —— `useComponentConfig<EmptyConfig>('empty')`。
 * 调用方是 `EmptyConfig` 的所有者（`empty/interface.ts`），所以不是类型断言，
 * 也没有循环依赖。代价是组件名写错不会被编译器发现（运行时得到空配置），
 * 这一点与 antd 相同（antd 的 propName 也是字符串）。
 */

import { type CSSProperties, type InjectionKey, inject } from 'vue';

/**
 * 默认前缀。已裁决（`prefix-cls-default` = A）：默认 `apollo`，可覆盖为 `ant`。
 *
 * ⚠️ 与 antd 的 `defaultPrefixCls = 'ant'` **不同**，这是有意差异。
 *    影响面：所有 DOM 契约测试都必须把两侧的 prefixCls 显式对齐（传同一个值），
 *    而不是靠默认值相同 —— 后者会把「我们根本没读 prefixCls」这个 bug 一起掩盖。
 */
export const defaultPrefixCls = 'apollo';

/** 图标前缀。与 antd 的 `defaultIconPrefixCls = 'anticon'` 对应。 */
export const defaultIconPrefixCls = 'apollo-icon';

/** 文字方向。与 antd 的 `DirectionType` 一致。 */
export type DirectionType = 'ltr' | 'rtl';

/** `getPrefixCls` 的签名。 */
export type GetPrefixCls = (suffixCls?: string, customizePrefixCls?: string) => string;

/**
 * 无 Provider 时的兜底实现。与 antd 的 `defaultGetPrefixCls` 逐字对应。
 *
 * 注意判据是 `customizePrefixCls` 的**真值**而不是 `!== undefined` ——
 * 传空字符串会走默认分支。这是 antd 的行为，别「顺手修」。
 */
export const defaultGetPrefixCls: GetPrefixCls = (suffixCls, customizePrefixCls) => {
  if (customizePrefixCls) return customizePrefixCls;
  return suffixCls ? `${defaultPrefixCls}-${suffixCls}` : defaultPrefixCls;
};

/** 每个组件在 ConfigProvider 上的公共配置部分。与 antd 的 `ComponentStyleConfig` 一致。 */
export interface ComponentStyleConfig {
  className?: string;
  style?: CSSProperties;
}

/** context 里与具体组件无关的部分。 */
export interface ConfigContextBase {
  getPrefixCls: GetPrefixCls;
  iconPrefixCls: string;
  direction?: DirectionType;
}

/**
 * `useComponentConfig` 返回值里由 context 提供的部分。
 *
 * ⚠️ **不含 `iconPrefixCls`** —— 这是与 `ConfigContextBase` 的刻意区别，
 * 与 antd 的 `useComponentConfig` 返回形状逐字对应（它只取 `getPrefixCls` /
 * `direction` / `getPopupContainer` / `renderEmpty`）。多给一个 `iconPrefixCls`
 * 会让「组件配置里也能改图标前缀」变成一句没有实现的承诺。
 */
export interface ComponentConfigBase {
  getPrefixCls: GetPrefixCls;
  direction?: DirectionType;
}

/**
 * ConfigProvider 注入的完整值。
 *
 * `components` 是组件名（小写，与 antd 的 `context[propName]` 键一致）→ 该组件的配置。
 * 用 `unknown` 而不是 `Record<string, never>`：值的类型由消费方通过泛型给出，
 * 这里只负责搬运。
 */
export interface ConfigContextValue extends ConfigContextBase {
  components?: Record<string, unknown>;
}

/**
 * context 的默认值（没有 Provider 时）。
 *
 * antd 的注释说明了为什么这里**不能**放 `defaultRenderEmpty` —— 会造成循环依赖
 * （`defaultRenderEmpty` 要渲染 Empty，Empty 又要读 context）。我们同理不预置。
 */
export const DEFAULT_CONFIG_CONTEXT: ConfigContextValue = {
  getPrefixCls: defaultGetPrefixCls,
  iconPrefixCls: defaultIconPrefixCls,
};

/** 注入键。用 Symbol 避免与用户自己的 provide 键冲突。 */
export const configContextKey: InjectionKey<ConfigContextValue> = Symbol('apolloConfig');

/** 读取整个 ConfigProvider 上下文。 */
export function useConfigContext(): ConfigContextValue {
  return inject(configContextKey, DEFAULT_CONFIG_CONTEXT);
}

/**
 * 把组件配置里的 `classNames` / `styles` 变成**必有**（运行时会兜底成 `{}`）。
 *
 * ⚠️ 刻意**不**在类型上把 `classNames` / `styles` 提升为必选。
 *    那样需要条件类型（`T extends { classNames?: infer C } ? ...`），而条件类型
 *    无法被泛型函数体证明，最终必须写一个 `as unknown as` 双重断言 ——
 *    用一个类型漏洞去换一个 `?.`，不划算。
 *
 *    类型比运行时**更宽**是安全的（`X | undefined` 在运行时永远不是 undefined）；
 *    反过来才是危险的。所以这里如实声明为可选，并在文档里说明运行时保证。
 */
export type ComponentConfig<T> = T & ComponentConfigBase;

/**
 * 读取某个组件在 ConfigProvider 上的配置。与 antd 的 `useComponentConfig(propName)` 同构。
 *
 * 三条与 antd 逐字对齐的判据：
 *   1. `classNames` / `styles` 的默认值是**同一个空对象常量**（antd 的 `EMPTY_OBJECT`），
 *      不是每次新建 —— 这样下游的 `computed` 依赖是稳定的，不会因为「每次都是新对象」
 *      而每次重算。
 *   2. `propValue` 的展开在 `classNames` / `styles` 之后，`getPrefixCls` / `direction`
 *      之前 —— 即组件配置可以覆盖 `classNames` / `styles` 的默认值，但不能覆盖
 *      `getPrefixCls` / `direction`（它们恒来自 context 顶层）。
 *   3. 没有 Provider 时 `getPrefixCls` 是 `defaultGetPrefixCls`（前缀 `apollo`），
 *      `direction` 是 `undefined` —— 所以**不会**多出 `-rtl` 类名。
 *
 * ⚠️ `context.components?.[propName]` 的一次类型断言是**动态键查询的固有代价**，
 *    不是类型漏洞：`propName` 是运行时字符串，TS 无法把它对应到具体类型。
 *    antd 那边同样如此（`context[propName]` 的类型是 `any`），我们至少把它收在
 *    这一个赋值语句里，且断言目标是调用方给的 `T`（而非 `any`）。
 */
const EMPTY_OBJECT = {};

export function useComponentConfig<T extends object = Record<string, unknown>>(
  propName: string,
): ComponentConfig<T> {
  const context = useConfigContext();
  const propValue = (context.components?.[propName] ?? {}) as T;

  return Object.assign({ classNames: EMPTY_OBJECT, styles: EMPTY_OBJECT }, propValue, {
    getPrefixCls: context.getPrefixCls,
    direction: context.direction,
  });
}
