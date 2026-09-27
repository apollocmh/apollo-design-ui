/**
 * Statistic 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的
 * `es/statistic/{Statistic,Number,Timer,Countdown,utils}.d.ts`。
 * **逐字段对齐**（名称、可选性、默认值、`@deprecated` 标记）。
 *
 * ── 与 antd 类型面的**有据可查**的差异 ────────────────────────────────────────
 *
 * 1. `React.CSSProperties` → Vue 的 `CSSProperties`，`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）；`React.VNode`（valueRender 的入参）→ Vue 的 `VNode`。
 * 2. `valueRender` 的入参/返回是**同一个节点类型**（上游签名
 *    `(node: React.ReactNode) => React.ReactNode`，运行时收到的必是 StatisticNumber
 *    的元素）——我们按真实情况声明为 `(node: VNode) => VNodeChild`。
 * 3. `StatisticSemanticAllType` 是**手写**接口而不是 `GenerateSemantic<...>` 展开
 *    （empty / divider / skeleton 同一条理由与形态）。
 * 4. `onMouseEnter` / `onMouseLeave` 是 antd 的显式 props（不是 DOM 透传），
 *    保留同样的显式声明（Vue 侧以 `onMouseenter` / `onMouseleave` 触发）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Statistic 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `statistic` 配置。与 antd 的
 * `StatisticConfig = ComponentStyleConfig & Pick<StatisticProps,'classNames'|'styles'>` 一致。
 */
export interface StatisticConfig
  extends ComponentStyleConfig,
    Pick<StatisticProps, 'classNames' | 'styles'> {}

// ---------------------------------------------------------------------------
// utils.d.ts（FormatConfig 一族）
// ---------------------------------------------------------------------------

/** 数值类型。与 antd 的 `valueType` 一致。 */
export type ValueType = number | string;

/** 与 antd 的 `countdownValueType` 一致（历史别名，逐字保留）。 */
export type CountdownValueType = number | string;

/**
 * 格式化器。与 antd 的 `Formatter` 一致。
 *
 * ⚠️ 实现只消费**函数**形态：`false` / `'number'` / `'countdown'` 都走内部数字格式化
 *    （antd 的 `isFunction(formatter)` 判据逐字保留；字符串枚举是类型面的历史遗留）。
 */
export type StatisticFormatter =
  | false
  | 'number'
  | 'countdown'
  | ((value: ValueType, config?: StatisticFormatConfig) => VNodeChild);

/** 与 antd 的 `FormatConfig` 一致。 */
export interface StatisticFormatConfig {
  formatter?: StatisticFormatter;
  decimalSeparator?: string;
  groupSeparator?: string;
  precision?: number;
}

/** 与 antd 的 `CountdownFormatConfig` 一致。 */
export interface CountdownFormatConfig extends StatisticFormatConfig {
  format?: string;
}

// ---------------------------------------------------------------------------
// 语义化（Statistic.d.ts 的 StatisticSemanticType）
// ---------------------------------------------------------------------------

export interface StatisticSemanticClassNames {
  /** 根 `<div class="{prefixCls}">`。 */
  root?: string;
  /** 头部 `<div class="{prefixCls}-header">`。 */
  header?: string;
  /** 标题 `<div class="{prefixCls}-title">`。 */
  title?: string;
  /** 内容 `<div class="{prefixCls}-content">`。 */
  content?: string;
  /** 数值 `<span class="{prefixCls}-content-value">`。 */
  value?: string;
  /** 前缀 `<span class="{prefixCls}-content-prefix">`。 */
  prefix?: string;
  /** 后缀 `<span class="{prefixCls}-content-suffix">`。 */
  suffix?: string;
}

export interface StatisticSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  title?: CSSProperties;
  content?: CSSProperties;
  value?: CSSProperties;
  prefix?: CSSProperties;
  suffix?: CSSProperties;
}

/**
 * 语义化输入：对象或函数（对应 antd `GenerateSemantic<StatisticSemanticType,
 * StatisticProps>` 的 `classNamesAndFn` / `stylesAndFn`）。
 */
export type StatisticSemanticValue<T> = T | ((info: { props: StatisticProps }) => T);

/** antd 的 `StatisticSemanticAllType`（手写形态，skeleton 同条）。 */
export interface StatisticSemanticAllType {
  classNames: StatisticSemanticClassNames;
  classNamesAndFn: StatisticSemanticValue<StatisticSemanticClassNames>;
  styles: StatisticSemanticStyles;
  stylesAndFn: StatisticSemanticValue<StatisticSemanticStyles>;
}

// ---------------------------------------------------------------------------
// Statistic.d.ts（StatisticProps / StatisticRef）
// ---------------------------------------------------------------------------

/**
 * `Statistic` 的 props。逐字段对齐 antd 的 `StatisticReactProps`。
 *
 * ── 默认值（antd 解构默认）────────────────────────────────────────────────────
 *
 * `value = 0`、`decimalSeparator = '.'`、`groupSeparator = ','`、`loading = false`。
 */
export interface StatisticProps extends StatisticFormatConfig {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 落在根元素上（在 ConfigProvider 的 `className` **之后**）。 */
  className?: string;
  /** 也落在根元素上（在 `className` **之后**、语义化 root **之前**）。 */
  rootClassName?: string;
  /** 根元素的内联样式（参与语义化合并，包成 `{root: …}` 形态）。 */
  style?: CSSProperties;
  /** 数值。 */
  value?: ValueType;
  /**
   * @deprecated 请用 `styles.content`。
   *
   * 仍生效：并入 content 的内联样式（在语义化 content **之前** ⇒ 被覆盖）。
   * 传值时发开发期废弃告警。
   */
  valueStyle?: CSSProperties;
  /** 包裹 valueNode（Timer 靠它去掉克隆节点上的 title）。 */
  // ⚠️ C8-R2：`valueRender(node)`（render fn）已删除 → 作用域插槽 `#valueRender="{ node }"`。
  /** 标题。`0` 渲染、`null` / `undefined` / 布尔不渲染（isReactRenderable 判据）。 */
  /** 文本标题（富内容用 `#title` 插槽，slot 优先）。 */
  title?: string;
  /** 前缀（判据同 title）。 */
  /** 文本前缀（富内容用 `#prefix` 插槽，slot 优先）。 */
  prefix?: string;
  /** 后缀（判据同 title）。 */
  /** 文本后缀（富内容用 `#suffix` 插槽，slot 优先）。 */
  suffix?: string;
  /** 为真时渲染 Skeleton 骨架、content 消失。 */
  loading?: boolean;
  /** 落在根元素上的 mouseenter。 */
  onMouseenter?: (e: MouseEvent) => void;
  /** 落在根元素上的 mouseleave。 */
  onMouseleave?: (e: MouseEvent) => void;
  /** 语义化类名。 */
  classNames?: StatisticSemanticValue<StatisticSemanticClassNames>;
  /** 语义化样式。 */
  styles?: StatisticSemanticValue<StatisticSemanticStyles>;
}

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的 `StatisticRef` 有一处差异（PLATFORM）：antd 声明
 *    `nativeElement: HTMLDivElement`，但首次渲染前它同样是 `null`，只是类型没体现。
 *    我们按真实情况声明为可空（Divider / SkeletonRef 同一条理由）。
 */
export interface StatisticRef {
  nativeElement: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// Timer.d.ts / Countdown.d.ts
// ---------------------------------------------------------------------------

/** Timer 的类型。与 antd 的 `TimerType` 一致。 */
export type TimerType = 'countdown' | 'countup';

/**
 * `Statistic.Timer` 的 props。与 antd 的 `StatisticTimerProps` 一致
 * （extends FormatConfig + StatisticProps —— `type` 为必填）。
 */
export interface StatisticTimerProps extends StatisticFormatConfig, StatisticProps {
  /** 计时方向。 */
  type: TimerType;
  /**
   * 展示格式（`HH:mm:ss` 等，支持 `[...]` 转义与 `X+` 按位数补零）。
   * @default 'HH:mm:ss'
   */
  format?: string;
  /** 倒计时结束回调（**仅** countdown 会触发，且只触发一次）。 */
  onFinish?: () => void;
  /** 每帧回调（入参为时间差：countdown 为剩余、countup 为已过）。 */
  onChange?: (value?: ValueType) => void;
}

/**
 * `Statistic.Countdown`（@deprecated → `Statistic.Timer type="countdown"`）的 props。
 * 与 antd 的 `CountdownProps = StatisticTimerProps`（type 由实现固定注入）一致。
 */
export type CountdownProps = Omit<StatisticTimerProps, 'type'>;
