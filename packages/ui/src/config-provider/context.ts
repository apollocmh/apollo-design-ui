/**
 * ConfigProvider 的注入上下文 —— **叶子模块**（leaf module）。
 *
 * 契约来源：antd 6.6.4 的 `es/config-provider/context.js`（`ConfigContext` + `useComponentConfig`）。
 *
 * ── 本文件的边界 ────────────────────────────────────────────────────────────
 *
 * 它是**叶子**：不 import 任何组件目录（`empty` / `divider` / `spin` 都不 import），
 * 因此下游组件 import 它不会形成环。
 * `RenderEmptyHandler` 刻意定义在这里而不是 `defaultRenderEmpty.ts` —— 后者要 import
 * `empty`，若类型反向依赖它就会形成 `empty → context → defaultRenderEmpty → empty` 的环。
 */

import type { ThemeConfig } from '@apollo-design/theme';
import { type ComputedRef, type CSSProperties, computed, type InjectionKey, inject } from 'vue';

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
 *
 * ⚠️ 它读的是**模块级**的 `globalConfigState.prefixCls`（`ConfigProvider.config()` 写入），
 *    所以「没挂 Provider 但调过 `ConfigProvider.config({prefixCls})`」也能生效 ——
 *    与 antd 的 `globalConfig().getPrefixCls` 同语义。
 */
export const defaultGetPrefixCls: GetPrefixCls = (suffixCls, customizePrefixCls) => {
  if (customizePrefixCls) return customizePrefixCls;
  const root = globalConfigState.prefixCls || defaultPrefixCls;
  return suffixCls ? `${root}-${suffixCls}` : root;
};

/**
 * `ConfigProvider.config()` 写入的全局配置。
 *
 * ⚠️ 必须是**模块级**（ESM 单例），不能写在组件里 —— `<script setup>` 每个实例都会
 *    执行一遍，写在那里就成了实例级（PITFALLS 91 同源）。
 * 单独一个模块是为了避免 `globalConfig.ts → context.ts → globalConfig.ts` 的环。
 */
export interface GlobalConfigState {
  prefixCls?: string;
  iconPrefixCls?: string;
  theme?: ThemeConfig;
}

export const globalConfigState: GlobalConfigState = {};

/** 每个组件在 ConfigProvider 上的公共配置部分。与 antd 的 `ComponentStyleConfig` 一致。 */
export interface ComponentStyleConfig {
  className?: string;
  style?: CSSProperties;
}

/** CSP 配置。与 antd 的 `CSPConfig` 一致。 */
export interface CSPConfig {
  nonce?: string;
}

/** 形态变体。与 antd 的 `Variants` / `Variant` 逐字一致。 */
export const Variants = ['outlined', 'borderless', 'filled', 'underlined'] as const;

export type Variant = (typeof Variants)[number];

/** 浮层溢出策略。与 antd 的 `PopupOverflow` 一致。 */
export type PopupOverflow = 'viewport' | 'scroll';

/** 水波纹配置。与 antd 的 `WaveConfig` 一致（`showEffect` 是 React 专用，见下）。 */
export interface WaveConfig {
  /** @descCN 是否禁用水波纹效果。 @descEN Whether to disable wave effect. @default false */
  disabled?: boolean;
  /** @descCN 触发水波纹效果的事件。 @descEN The event that triggers the wave effect. @default 'click' */
  triggerType?: 'click' | 'pointerdown' | 'pointerup' | 'mousedown' | 'mouseup';
}

/**
 * `renderEmpty` 的组件名参数。与 antd 的 `defaultRenderEmpty.tsx` 逐字一致。
 *
 * ⚠️ `'Table.filter'` 是有意的：antd 让它返回 `null`，交给 Table 自己决定。
 */
export type RenderEmptyComponentName =
  | 'Table'
  | 'Table.filter'
  | 'List'
  | 'Select'
  | 'TreeSelect'
  | 'Cascader'
  | 'Transfer'
  | 'Mentions';

/**
 * 自定义空状态渲染器。
 *
 * 定义在本文件而不是 `defaultRenderEmpty.ts` —— 后者要 import `empty` 组件，
 * 反向依赖会形成环（见文件头）。
 */
export type RenderEmptyHandler = (componentName?: RenderEmptyComponentName) => unknown;

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
 *
 * `getPopupContainer` / `renderEmpty` 在 ConfigProvider 落地**之前**是刻意缺的
 * （那时没有东西能提供它们）；现在 ConfigProvider 真正提供这两个值，所以补上 ——
 * 它们的语义与 antd 完全一致。
 */
export interface ComponentConfigBase {
  getPrefixCls: GetPrefixCls;
  direction?: DirectionType;
  getPopupContainer?: GetPopupContainer;
  renderEmpty?: RenderEmptyHandler;
}

/** 浮层容器。与 antd 的 `ConfigConsumerProps['getPopupContainer']` 一致。 */
export type GetPopupContainer = (triggerNode?: HTMLElement) => HTMLElement | ShadowRoot;

/** 浮层挂载目标。与 antd 的 `ConfigConsumerProps['getTargetContainer']` 一致。 */
export type GetTargetContainer = () => HTMLElement | Window | ShadowRoot;

/**
 * ConfigProvider 注入的完整值。
 *
 * `components` 是组件名（小写，与 antd 的 `context[propName]` 键一致）→ 该组件的配置。
 * 用 `unknown` 而不是 `Record<string, never>`：值的类型由消费方通过泛型给出，
 * 这里只负责搬运。
 *
 * ⚠️ 本接口只列**非组件配置**的键，且它们的键名与 antd 的 `ConfigConsumerProps`
 *    逐字对齐。56 个组件配置全部收在 `components` 里（`docs/analysis/config-provider.md`
 *    §6.1 的「渐进式类型形态」）。
 */
export interface ConfigContextValue extends ConfigContextBase {
  components?: Record<string, unknown>;
  theme?: ThemeConfig;
  renderEmpty?: RenderEmptyHandler;
  getPopupContainer?: GetPopupContainer;
  getTargetContainer?: GetTargetContainer;
  csp?: CSPConfig;
  /** @deprecated 用 `components.button.autoInsertSpace` */
  autoInsertSpaceInButton?: boolean;
  variant?: Variant;
  virtual?: boolean;
  popupMatchSelectWidth?: boolean;
  popupOverflow?: PopupOverflow;
  wave?: WaveConfig;
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
 * 读取 `direction`，**响应式**。
 *
 * ⚠️⚠️ 为什么必须走这个 composable 而不是解构 `useComponentConfig()` 的 `direction`：
 * Vue 的 `inject` 只在 setup 期解析一次，`const { direction } = ...` 拿到的是**快照**，
 * ConfigProvider 之后改 `direction` 它不会变（React 的 `useContext` 会在 Provider 更新时
 * 重跑函数体，所以 antd 没有这个问题）。登记为差异 **D27**。
 *
 * ⭐ 这是「未来 50 个组件读取 direction 的正确姿势」。
 */
export function useDirection(): ComputedRef<DirectionType | undefined> {
  const context = useConfigContext();
  return computed(() => context.direction);
}

/**
 * 读取合并后的主题配置，**响应式**。
 *
 * 没有 Provider 时是 `undefined`（与 antd 的 `ConfigConsumerProps.theme` 一致）。
 */
export function useThemeConfig(): ComputedRef<ThemeConfig | undefined> {
  const context = useConfigContext();
  return computed(() => context.theme);
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
 *      `getPrefixCls` / `direction` / `getPopupContainer` / `renderEmpty`
 *      （它们恒来自 context 顶层）。
 *   3. 没有 Provider 时 `getPrefixCls` 是 `defaultGetPrefixCls`（前缀 `apollo`），
 *      `direction` 是 `undefined` —— 所以**不会**多出 `-rtl` 类名。
 *
 * ⚠️ `context.components?.[propName]` 的一次类型断言是**动态键查询的固有代价**，
 *    不是类型漏洞：`propName` 是运行时字符串，TS 无法把它对应到具体类型。
 *    antd 那边同样如此（`context[propName]` 的类型是 `any`），我们至少把它收在
 *    这一个赋值语句里，且断言目标是调用方给的 `T`（而非 `any`）。
 *
 * ⭐ 响应式边界：ConfigProvider 注入的是 `reactive` 对象，所以这里取出的
 *    `classNames` / `styles` 以及组件配置里的**对象/函数**值仍是 proxy ——
 *    在 `computed` 里读它们的字段会被追踪。但 `direction` 这类**原始值**是快照，
 *    要用 `useDirection()`（见上）。
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
    getPopupContainer: context.getPopupContainer,
    renderEmpty: context.renderEmpty,
  });
}
