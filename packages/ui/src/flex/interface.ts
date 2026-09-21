/**
 * Flex 的类型面。
 *
 * 契约来源：antd 6.6.4 的 `es/flex/interface.d.ts`。**逐字段对齐**，包括可选性。
 * 有意差异见 `packages/ui/src/flex/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * ── 与 antd 类型面的差异 ─────────────────────────────────────────────────────
 *
 * 1. `children` 不在 Props 里（规则 C19）—— antd 的 `children?: React.ReactNode`
 *    在 Vue 侧是默认插槽。
 * 2. `React.CSSProperties` → Vue 的 `CSSProperties`（规则 C16）。
 * 3. `CustomComponent<P>` → Vue 的 `Component | string`（`component :is` 的合法值）。
 * 4. antd 的 `LiteralUnion<SizeType>` 拍平为 `SizeType | string | number` ——
 *    `(string & {})` 会让 SFC 编译器把运行时 prop 推成 `String | Object`，
 *    挂 Number 时触发开发期告警（见 `gap` 字段的注释）。
 */

import type { Component, CSSProperties } from 'vue';
import type { Orientation } from '../_internal/use-orientation';
import type { ComponentStyleConfig } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';

export type { Orientation };

/** `wrap` 的合法值集合。与 antd 的 `React.CSSProperties['flexWrap']` 一致。 */
export type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';

/** `justify` 的合法值集合。与 antd 的 `React.CSSProperties['justifyContent']` 一致。 */
export type FlexJustify =
  | 'flex-start'
  | 'flex-end'
  | 'start'
  | 'end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch'
  | 'normal'
  | 'left'
  | 'right';

/** `align` 的合法值集合。与 antd 的 `React.CSSProperties['alignItems']` 一致。 */
export type FlexAlign =
  | 'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'self-start'
  | 'self-end'
  | 'baseline'
  | 'normal'
  | 'stretch';

/** 根元素的自定义标签。React 的 `CustomComponent<P>` ≈ Vue 的 `Component | string`。 */
export type FlexComponent = Component | string;

export interface FlexProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-flex`。 */
  prefixCls?: string;
  /** 也落在根元素上（在 `className` **之后**，与 antd 的合并顺序一致）。 */
  rootClassName?: string;
  /** 落在根元素上（在 ConfigProvider 的 `className` 之后）。 */
  className?: string;
  /** 根元素的内联样式。会覆盖 ConfigProvider 的 `style`。 */
  style?: CSSProperties;
  /**
   * flex 主轴是否垂直（`flex-direction: column`）。
   *
   * ⚠️ 与 `orientation` 同时配置时以 `orientation` 优先；**未传时必须保持
   * `undefined`**（D21：`typeof vertical === 'boolean'` 是合并判据，
   * Vue 的 Boolean 转换会破坏 context 回落 —— 见 `Flex.vue` 的 `withDefaults`）。
   */
  vertical?: boolean;
  /** 主轴的方向类型。优先级高于 `vertical`。 */
  orientation?: Orientation;
  /** 单行还是多行显示。`true` 等价 `'wrap'`。 */
  wrap?: boolean | FlexWrap;
  /** 主轴对齐。只产生类名，**不透传到 DOM**（antd 的 `omit`）。 */
  justify?: FlexJustify;
  /** 交叉轴对齐。只产生类名，**不透传到 DOM**；缺省且垂直时产生 `-align-stretch`。 */
  align?: FlexAlign;
  /**
   * flex CSS 简写属性，内联到 `style.flex`。
   *
   * ⚠️ 刻意写成 `string | number` 而不是 `CSSProperties['flex']`：
   * 后者索引出 csstype 的 `Property.Flex<TLength>` 泛型，vue-tsc 报 TS2742
   * （类型不可命名）。取值集合与 antd 的 `React.CSSProperties['flex']` 等价。
   */
  flex?: string | number;
  /**
   * 元素间隙。预设串（`small` / `medium` / `middle` / `large`）产生 `-gap-{v}` 类名；
   * 其它值（含 `0`）内联到 `style.gap`。
   *
   * ⚠️ 刻意**不用** `LiteralUnion<SizeType>`：`(string & {})` 交叉类型会让
   * SFC 编译器把运行时 prop 类型推成 `String | Object`，挂载 Number 时产生
   * 「Invalid prop」开发期告警（demo.test 的「不产生告警」是硬约束）。
   * 拍平为 `SizeType | string | number`，运行时推断为 `[String, Number]`。
   */
  gap?: SizeType | string | number;
  /** 自定义根元素类型。 */
  component?: FlexComponent;
}

/**
 * Flex 在 ConfigProvider 上的组件配置。
 *
 * 与 antd 的 `ComponentStyleConfig & { vertical?: boolean }` 对齐
 * （`vertical` 支持全局配置，见官方 API 表的「全局配置 5.10.0」列）。
 */
export interface FlexConfig extends ComponentStyleConfig {
  /** 全局默认的主轴方向。仅当 `vertical` / `orientation` 都未传时生效。 */
  vertical?: boolean;
}

/** ref 暴露面。与 antd 的 `RefAttributes<HTMLElement>` 对应。 */
export interface FlexRef {
  nativeElement: HTMLElement | null;
}

/** 默认插槽内容。与 antd 的 `children?: React.ReactNode` 对应。 */
export type FlexSlot = () => unknown;
