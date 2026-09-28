/**
 * Tour 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/tour/interface.d.ts`（antd 自有面）+ `@rc-component/tour`
 * 2.4.0 `es/interface.d.ts`（rc 面，antd 用 `Omit<...>` 继承）。分析见 `docs/analysis/tour.md`。
 *
 * ── Vue 化映射（COMPATIBILITY.md §1–§4 的规则）────────────────────────────────
 *   · `open` + `onChange`/`onClose` → `v-model:open` + `update:open` + `change`/`close`
 *     （规则 C11：v-model 与语义事件**同时**发出）
 *   · `current` + `onChange` → `v-model:current` + `update:current` + `change`
 *   · `title`/`description`/`cover`/`nextButtonProps.children`/`prevButtonProps.children`
 *     → **slot 优先**，同名 prop 收窄为 `string` 兜底（规则 C8-R2）
 *   · `indicatorsRender` / `actionsRender` → scoped slot（C8-R2）
 *   · `renderPanel` → **不公开**（antd 自己也只用它注入自家 Panel；上游已 `Omit`）
 *   · `closeIcon`（含 `steps[].closeIcon` / `closable.closeIcon`）保留 VNode prop
 *     —— 程序化上下文，属 D111 的例外清单
 *   · `classNames` / `styles` → 保留，且支持**函数形态**（裁决 `empty-semantic-fn` = B）
 *
 * ⚠️ 禁止 any / as any / @ts-expect-error（H10）。VNode 类 prop 必须显式
 *    `undefined` 默认值（PITFALLS 2/185：Boolean 转换陷阱 + `PropType<unknown>` 会让
 *    整个 prop 推断成 `undefined`）。
 */

import type { TourLocale } from '@apollo-design/locale';
import type { CSSProperties, VNodeChild } from 'vue';

import type { TriggerAlign } from '../_internal/trigger';

// ---------------------------------------------------------------------------
// placement / gap（rc-tour 的两个自有类型）
// ---------------------------------------------------------------------------

/**
 * rc `placements.ts` 的 `PlacementType` —— 13 个值（含 `center`）。
 *
 * ⚠️ 与 `@apollo-design/position` 的 12 个 placement 的差别是多了 `'center'`
 *    （rc-tour 专有：无目标时居中）。本仓的 `getPlacements` 只覆盖 12 个，
 *    `'center'` 需在 G4 单独补一个 align 配置。
 */
export type TourPlacement =
  | 'left'
  | 'leftTop'
  | 'leftBottom'
  | 'right'
  | 'rightTop'
  | 'rightBottom'
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'center';

/**
 * rc `hooks/useTarget.ts` 的 `Gap` —— 高亮区相对目标元素的外扩。
 *
 * `offset` 为单值时四边等量外扩；二元组是 `[水平, 垂直]`。`radius` 是高亮区圆角。
 */
export interface TourGap {
  offset?: number | [number, number];
  radius?: number;
}

/** `mask` 的对象形态（`boolean` 之外）。 */
export interface TourMaskConfig {
  style?: CSSProperties;
  color?: string;
}

/** `arrow` 的对象形态（`boolean` 之外）。 */
export interface TourArrowConfig {
  pointAtCenter: boolean;
}

/** `animated` 的对象形态（`boolean` 之外）。 */
export interface TourAnimatedConfig {
  placeholder: boolean;
}

/** `closable` 的对象形态（`false` 之外）—— 其上的 `aria-*` / `data-*` 透传到关闭按钮。 */
export interface TourClosableConfig {
  closeIcon?: VNodeChild;
  /** `aria-*` 透传（antd 用 `pickAttrs(closable, true)` 取）。 */
  [key: `aria-${string}`]: unknown;
  /** `data-*` 透传。 */
  [key: `data-${string}`]: unknown;
}

/** `'default'`（白底）/ `'primary'`（主色底）。 */
export type TourType = 'default' | 'primary';

// ---------------------------------------------------------------------------
// 语义化槽位（12 个）
// ---------------------------------------------------------------------------

/** 语义化类名的 12 个槽位。与 antd `TourSemanticType['classNames']` 一致。 */
export interface TourSemanticClassNames {
  root?: string;
  cover?: string;
  close?: string;
  mask?: string;
  section?: string;
  footer?: string;
  actions?: string;
  indicator?: string;
  indicators?: string;
  header?: string;
  title?: string;
  description?: string;
}

/** 语义化样式的 12 个槽位。 */
export interface TourSemanticStyles {
  root?: CSSProperties;
  cover?: CSSProperties;
  close?: CSSProperties;
  mask?: CSSProperties;
  section?: CSSProperties;
  footer?: CSSProperties;
  actions?: CSSProperties;
  indicator?: CSSProperties;
  indicators?: CSSProperties;
  header?: CSSProperties;
  title?: CSSProperties;
  description?: CSSProperties;
}

/**
 * 语义化输入：对象或函数。
 *
 * 对应 antd `GenerateSemantic<TourSemanticType, TourProps>` 的
 * `classNamesAndFn` / `stylesAndFn`（裁决 `empty-semantic-fn` = B 支持函数形态）。
 */
export type TourSemanticValue<T> = T | ((info: { props: TourProps }) => T);

/** antd 的 `TourSemanticType`（不含函数式的形态）。 */
export interface TourSemanticType {
  classNames?: TourSemanticClassNames;
  styles?: TourSemanticStyles;
}

/** antd 的 `TourSemanticAllType`（含函数式的完整形态）。 */
export interface TourSemanticAllType {
  classNames: TourSemanticClassNames;
  classNamesAndFn: TourSemanticValue<TourSemanticClassNames>;
  styles: TourSemanticStyles;
  stylesAndFn: TourSemanticValue<TourSemanticStyles>;
}

// ---------------------------------------------------------------------------
// 步骤
// ---------------------------------------------------------------------------

/** 步骤上的按钮配置（`nextButtonProps` / `prevButtonProps`）。 */
export interface TourButtonProps {
  /** slot `#nextButton` / `#prevButton` 优先；此 prop 为字符串兜底。 */
  children?: string;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * 单个步骤（antd `TourStepProps` = rc `TourStepInfo` + 面板注入 + antd 追加）。
 *
 * ⚠️ `prefixCls` / `total` / `current` / `onClose` / `onFinish` / `onPrev` / `onNext` /
 *    `renderPanel` 是 **rc/antd 的面板注入位**，不是用户的公开面 —— 本仓不暴露
 *    （`renderPanel` 上游也已 `Omit`）。用户面只有下面这些 + `TourProps` 上的兜底值。
 */
export interface TourStepProps {
  /**
   * 高亮的目标元素。`null` 表示**无目标**（居中显示）。
   * ⚠️ React 的 `() => HTMLElement` 在 Vue 里保留函数形态（与 ref 取值时机有关）。
   */
  target?: HTMLElement | (() => HTMLElement) | null;
  /** 标题。slot `#title` 优先。 */
  title?: string;
  /** 描述。slot `#description` 优先。 */
  description?: string;
  /** 封面图。slot `#cover` 优先。 */
  cover?: string;
  /** 单个步骤的 placement；不传则用 `TourProps.placement`。 */
  placement?: TourPlacement;
  /** 单个步骤的蒙层；不传则用 `TourProps.mask`。 */
  mask?: boolean | TourMaskConfig;
  /** 单个步骤的箭头；不传则用 `TourProps.arrow`。 */
  arrow?: boolean | TourArrowConfig;
  /** 单个步骤的类名（antd 会额外拼 `-primary`，见 `TourProps.type`）。 */
  className?: string;
  /** 单个步骤的行内样式。 */
  style?: CSSProperties;
  /** 滚动进视野的选项；`false` 关闭。 */
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions;
  /** 单个步骤的关闭图标（覆盖 `TourProps.closeIcon`）。 */
  closeIcon?: VNodeChild;
  /** `false` 不显示关闭按钮；对象形态可带 `closeIcon` 与 `aria-*` / `data-*`。 */
  closable?: boolean | TourClosableConfig;
  /** 单个步骤的 `type`；**覆盖** `TourProps.type`（`mergedType = stepType ?? type`）。 */
  type?: TourType;
  nextButtonProps?: TourButtonProps;
  prevButtonProps?: TourButtonProps;
  /** 步骤级语义化槽位（**不支持**函数形态，同 antd）。 */
  classNames?: TourSemanticClassNames;
  /** 步骤级语义化样式（**不支持**函数形态，同 antd）。 */
  styles?: TourSemanticStyles;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TourProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 是否打开（受控）。配合 `v-model:open` 使用。 */
  open?: boolean;
  /** 非受控初始打开态。 */
  defaultOpen?: boolean;
  /** 当前步骤（受控，从 0 起）。配合 `v-model:current` 使用。 */
  current?: number;
  /** 非受控初始步骤。 */
  defaultCurrent?: number;
  /** 步骤列表。 */
  steps?: TourStepProps[];
  /** 全局形态；被 `steps[].type` 覆盖。 */
  type?: TourType;
  /**
   * 键盘：`Esc` 关闭、`←/→` 切换步骤。
   * @default true
   */
  keyboard?: boolean;
  /** 全局蒙层；被 `steps[].mask` 覆盖。 */
  mask?: boolean | TourMaskConfig;
  /** 全局箭头；被 `steps[].arrow` 覆盖。 */
  arrow?: boolean | TourArrowConfig;
  /** 全局 placement；被 `steps[].placement` 覆盖。 */
  placement?: TourPlacement;
  /** 高亮区相对目标的外扩。 */
  gap?: TourGap;
  /** 入场/离场动效。antd 恒传 `true`；对象形态控制 placeholder 的动效。 */
  animated?: boolean | TourAnimatedConfig;
  /** 全局滚动选项；被 `steps[].scrollIntoViewOptions` 覆盖。 */
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions;
  /** 全局关闭图标（slot `#closeIcon` 优先）。 */
  closeIcon?: VNodeChild;
  /** 全局 `closable`；被 `steps[].closable` 覆盖。 */
  closable?: boolean | TourClosableConfig;
  /** 浮层 z-index。不传由 `useZIndex('Tour')` 计算。 */
  zIndex?: number;
  /** 挂载容器。 */
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  /** 自定义 placement 配置表（默认由 `getPlacements` 生成）。 */
  builtinPlacements?: Record<string, TriggerAlign>;
  /** 蒙层是否拦截交互（`true` 时蒙层可点，不穿透）。 */
  disabledInteraction?: boolean;
  /** 浮层对齐完成后的回调（rc-trigger 的 `onPopupAlign` 同构）。 */
  onPopupAlign?: (element: HTMLElement, align: TriggerAlign) => void;
  /** 根元素额外类名（在 ConfigProvider 的 `className` 之后）。 */
  rootClassName?: string;
  /** 落在根元素上。 */
  className?: string;
  /** 落在根元素上；`root`/`mask` 相关的值会同时落到蒙层（antd 的 `useSemanticRootStyle`）。 */
  style?: CSSProperties;
  /** 语义化类名（对象或函数）。 */
  classNames?: TourSemanticValue<TourSemanticClassNames>;
  /** 语义化样式（对象或函数）。 */
  styles?: TourSemanticValue<TourSemanticStyles>;
}

// ---------------------------------------------------------------------------
// Emits / Slots
// ---------------------------------------------------------------------------

/** 事件面。`v-model:open` / `v-model:current` 与语义事件**同时**发出（规则 C11）。 */
export interface TourEmits {
  /** `v-model:open` —— 打开态变化。 */
  (e: 'update:open', open: boolean): void;
  /** `v-model:current` —— 当前步骤变化。 */
  (e: 'update:current', current: number): void;
  /** 步骤变化（与 `update:current` 同时发出）。 */
  (e: 'change', current: number): void;
  /** 关闭（含 `Esc` / 关闭按钮 / 蒙层点击），携带关闭时的步骤下标。 */
  (e: 'close', current: number): void;
  /** 最后一步点「完成」。 */
  (e: 'finish'): void;
}

/**
 * 插槽面（规则 C8-R2：VNode 一律走 slot）。
 *
 * `title` / `description` / `cover` / `nextButton` / `prevButton` 的 slot **优先于**
 * 同名 `string` prop。`indicators` / `actions` 是 antd 两个 render prop 的 scoped slot。
 */
export interface TourSlots {
  /** 标题（优先于 `steps[].title`）。 */
  title?: (props: { step: TourStepProps; current: number; total: number }) => VNodeChild;
  /** 描述（优先于 `steps[].description`）。 */
  description?: (props: { step: TourStepProps; current: number; total: number }) => VNodeChild;
  /** 封面（优先于 `steps[].cover`）。 */
  cover?: (props: { step: TourStepProps; current: number; total: number }) => VNodeChild;
  /** 关闭图标（优先于 `closeIcon` prop）。 */
  closeIcon?: () => VNodeChild;
  /** 下一步按钮内容（优先于 `nextButtonProps.children`）。 */
  nextButton?: (props: { step: TourStepProps; current: number; total: number }) => VNodeChild;
  /** 上一步按钮内容（优先于 `prevButtonProps.children`）。 */
  prevButton?: (props: { step: TourStepProps; current: number; total: number }) => VNodeChild;
  /** 自定义指示器（对应 antd `indicatorsRender`）。 */
  indicators?: (props: { current: number; total: number }) => VNodeChild;
  /**
   * 自定义操作区（对应 antd `actionsRender`）。
   * `originNode` 是默认的「上一步 / 下一步」按钮组。
   */
  actions?: (props: { current: number; total: number; originNode: VNodeChild }) => VNodeChild;
}

// ---------------------------------------------------------------------------
// PurePanel / locale 再导出
// ---------------------------------------------------------------------------

/** `_InternalPanelDoNotUseOrYouWillBeFired` 的 props（= `TourStepProps`）。 */
export type TourPurePanelProps = TourStepProps;

export type { TourLocale };
