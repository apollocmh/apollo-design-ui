/**
 * 图标上下文。对应 `@ant-design/icons` 的 `IconContext` + `IconProvider`。
 *
 * React 的 `createContext` / `Context.Provider` → Vue 的 `provide` / `inject`。
 *
 * 与 antd 的一处结构差异（有意）：antd 的 context 值是普通对象，provider 换值时靠 React 重渲染；
 * 我们注入的是**取值函数**，消费侧用 `computed` 包一层，于是 `prefixCls` 变化能正确驱动图标重渲染。
 * 可观察行为一致，实现路径按 Vue 的心智模型重写（`AGENTS.md` H3/H4）。
 */

import {
  type ComputedRef,
  computed,
  defineComponent,
  type InjectionKey,
  inject,
  type PropType,
  provide,
  type SlotsType,
  type VNodeChild,
} from 'vue';

/** 图标上下文的有效配置；静态 SVG 渲染只消费前缀和根类名。 */
export interface IconContextProps {
  /** 图标类名前缀。默认 {@link DEFAULT_ICON_PREFIX_CLS}。 */
  prefixCls?: string;
  /** 附加到根元素的类名。 */
  rootClassName?: string;
}

/**
 * 默认图标类名前缀。
 *
 * antd 的默认值是字面量 `anticon`（**不**由 `prefixCls` 推导 —— antd 的 ConfigProvider 也是
 * 独立的 `iconPrefixCls`，改 `prefixCls` 不会连带改它）。我们取同一位置的品牌化字面量，
 * 依据 `COMPATIBILITY.md` D6（`prefix-cls-default` 已裁决为 `apollo`）。
 */
export const DEFAULT_ICON_PREFIX_CLS = 'apollo-icon';

/** 空上下文。没有 provider 时的默认值。 */
export const EMPTY_ICON_CONTEXT: IconContextProps = {};

/**
 * 注入键。值是**取值函数**而不是对象，见文件头说明。
 *
 * 用 `Symbol` 而不是字符串：避免与用户自己的 provide 键冲突。
 */
export const iconContextKey: InjectionKey<() => IconContextProps> = Symbol('apolloIcon');

/** 读取图标上下文。必须在 `setup()` 同步阶段调用（`inject` 的限制）。 */
export function useIconContext(): ComputedRef<IconContextProps> {
  const getter = inject(iconContextKey, undefined);
  return computed(() => getter?.() ?? EMPTY_ICON_CONTEXT);
}

/**
 * 图标上下文提供者。等价于 `@ant-design/icons` 导出的 `IconProvider`（即 `IconContext.Provider`）。
 *
 * prop 名保持 `value` 以对齐 antd 的 `<IconProvider value={{ prefixCls }}>`，
 * 迁移时不需要改写法（`COMPATIBILITY.md` 规则 C3）。
 *
 * @example
 * ```vue
 * <AIconProvider :value="{ prefixCls: 'my' }">
 *   <HomeOutlined />
 * </AIconProvider>
 * ```
 */
export const IconProvider = defineComponent({
  name: 'AIconProvider',
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  props: {
    value: { type: Object as PropType<IconContextProps>, default: () => ({}) },
  },
  setup(props, { slots }) {
    provide(iconContextKey, () => props.value);
    return () => slots.default?.() ?? null;
  },
});
