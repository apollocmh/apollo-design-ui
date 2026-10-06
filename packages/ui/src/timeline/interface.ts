/**
 * Timeline 的类型面（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/timeline/Timeline.d.ts`。
 * **逐字段对齐**（名称、可选性、`@deprecated` 标记）。有意差异见
 * `packages/ui/src/timeline/README.md` §2 与 `docs/analysis/timeline.md` §5。
 *
 * ── 🚨 本组件的类型面**继承自 `Steps`** ────────────────────────────────────────
 *
 * `Timeline` 是 `Steps` 的薄壳（见分析 §0），所以它的三处类型直接复用 Steps 的：
 *
 * | 上游 | 本仓 |
 * |---|---|
 * | `StepsProps['variant']` | `StepsVariant` |
 * | `GetProp<StepsProps, 'items'>[number]['classNames']` | `StepItem['classNames']` |
 * | `StepsSemanticType` 去掉 `itemSubtitle` | `Omit<StepsSemanticClassNames, 'itemSubtitle'>` |
 *
 * ── 与 antd 类型面的三处**有据可查**的差异 ────────────────────────────────────
 *
 * 1. `children` 不在 `TimelineProps` 里（规则 C19）—— antd 的 `React.ReactNode` 在 Vue 侧
 *    是默认插槽 `TimelineSlot`。⚠️ 且本仓**不支持** `children` 形态的内容（上游读
 *    `element.props`，Vue 插槽没有这个语义）⇒ 见 README §2 的 PLATFORM 差异。
 * 2. `React.Key` → `string | number`；`React.ReactNode` → `VNodeChild`；
 *    `React.CSSProperties` → Vue 的 `CSSProperties`（规则 C16 / C18）。
 * 3. `TimelineRef.nativeElement` 声明为**可空**（上游无 ref —— 它没有自己的根 DOM；
 *    本仓取 **`Steps` 的根元素**，因此类型是 `HTMLElement | null`）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';
import type {
  StepItem,
  StepsOrientation,
  StepsSemanticClassNames,
  StepsSemanticStyles,
  StepsVariant,
} from '../steps/interface';

// ---------------------------------------------------------------------------
// 基础联合
// ---------------------------------------------------------------------------

/** 项的位置。⚠️ `'left'` / `'right'` 已废弃（用 `'start'` / `'end'`）。 */
export type ItemPosition = 'left' | 'right' | 'start' | 'end';

/** 项的排布侧。 */
export type ItemPlacement = 'start' | 'end';

/** 整体模式。 */
export type TimelineMode = ItemPosition | 'alternate';

/** 预设颜色。⚠️ 上游是 `LiteralUnion<Color>` ⇒ 本仓放宽成 `string`（见 `TimelineItemType.color`）。 */
export type TimelineColor = 'blue' | 'red' | 'green' | 'gray';

// ---------------------------------------------------------------------------
// 项
// ---------------------------------------------------------------------------

/**
 * `Timeline` 的一项。逐字段对齐上游 `TimelineItemType`。
 *
 * ⚠️ `classNames` / `styles` 复用 **Steps 的项级语义槽**
 * （上游是 `GetProp<StepsProps, 'items'>[number]['classNames']`）。
 */
export interface TimelineItemType {
  /** 预设色（`blue` / `red` / `green` / `gray`）落类；**其余任意色值**落内联 CSS 变量。 */
  color?: TimelineColor | string;
  /** 落在项元素上。 */
  className?: string;
  /** 项元素的内联样式。 */
  style?: CSSProperties;
  /** 项级语义化类名（复用 Steps 的槽名）。 */
  classNames?: StepItem['classNames'];
  /** 项级语义化样式（复用 Steps 的槽名）。 */
  styles?: StepItem['styles'];

  /** 排布侧。不传时按 `mode` 推导（`alternate` 时按奇偶）。 */
  placement?: ItemPlacement;
  /** @deprecated 请用 `placement`。 */
  position?: ItemPosition;
  /** 加载中。⇒ `status: 'process'` + 默认 `LoadingOutlined` 图标。 */
  loading?: boolean;

  /** 行 key。 */
  key?: string | number;
  /** 标题。 */
  title?: VNodeChild;
  /** 内容。 */
  content?: VNodeChild;
  /** @deprecated 请用 `title`。 */
  label?: VNodeChild;
  /** @deprecated 请用 `content`。 */
  children?: VNodeChild;

  /** 自定义图标（取代默认的圆点）。 */
  icon?: VNodeChild;
  /** @deprecated 请用 `icon`。 */
  dot?: VNodeChild;
}

// ---------------------------------------------------------------------------
// 语义化槽（去掉 `itemSubtitle`）
// ---------------------------------------------------------------------------

/**
 * `Timeline` 的语义化类名。与上游 `TimelineSemanticType['classNames']` 同构 ——
 * **`Steps` 的十槽去掉 `itemSubtitle`**（时间轴没有副标题槽）。
 *
 * ⚠️ 用 `Omit` 而不是 `GenerateSemantic` 条件类型（与 `space` / `empty` 同判，
 * 见 D36）：条件类型无法被泛型函数体证明，最终必须写双重断言。
 */
export type TimelineSemanticClassNames = Omit<StepsSemanticClassNames, 'itemSubtitle'>;

/** `Timeline` 的语义化样式。同上。 */
export type TimelineSemanticStyles = Omit<StepsSemanticStyles, 'itemSubtitle'>;

/**
 * 语义化槽的**值形态**：直接给对象，或给一个按 `props` 动态返回的函数。
 *
 * 与 `card` 的 `CardSemanticValue` 同判（上游是 `GenerateSemantic` 条件类型，
 * 本仓手写 —— 见 D36：条件类型无法被泛型函数体证明）。
 */
export type TimelineSemanticValue<T> = T | ((info: { props: TimelineProps }) => T);

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/**
 * `Timeline` 的 props。逐字段对齐上游 `TimelineProps`。
 *
 * ⚠️ 上游的 `children?: React.ReactNode` 在 Vue 侧是**默认插槽**（`TimelineSlot`）；
 *    但本仓**不支持** children 形态的**内容**（见文件头差异 1）。
 */
export interface TimelineProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-timeline`。 */
  prefixCls?: string;
  /** 语义化类名（十槽去掉 `itemSubtitle`）。支持函数形态。 */
  classNames?: TimelineSemanticValue<TimelineSemanticClassNames>;
  /** 语义化样式（同上）。支持函数形态。 */
  styles?: TimelineSemanticValue<TimelineSemanticStyles>;

  /** 变体。透传给 `Steps`。 */
  variant?: StepsVariant;
  /** 模式。`'left'` / `'right'` 已废弃 ⇒ 归一到 `'start'` / `'end'`。 */
  mode?: TimelineMode;
  /** 方向。`'horizontal'` 落 `-horizontal` 类。 */
  orientation?: StepsOrientation;
  /** 标题栏占比。数字 ⇒ 24 栅格的格数；字符串 ⇒ 百分比。 */
  titleSpan?: string | number;

  /** 项列表。**唯一的内容入口**。 */
  items?: TimelineItemType[];

  /** @deprecated 请直接在 `items` 里加一项 pending 节点。 */
  pending?: VNodeChild;
  /** @deprecated 请直接在 `items` 里加一项 pending 节点。 */
  pendingDot?: VNodeChild;
  /** 反转项顺序（`[...items].reverse()`）。 */
  reverse?: boolean;
}

/**
 * `Timeline` 暴露的实例。
 *
 * ⚠️ 上游**没有** ref（`Timeline` 没有自己的根 DOM）。本仓按「可观测的根元素」定义：
 * 取 **`Steps` 的根元素**（`ol` 或 `div`）。
 */
export interface TimelineRef {
  nativeElement: HTMLElement | null;
}

/** `Timeline` 的默认插槽。⚠️ 本仓**不支持** children 形态的内容（见文件头差异 1）。 */
export type TimelineSlot = () => VNodeChild;

// ---------------------------------------------------------------------------
// ConfigProvider 上的配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `timeline` 配置。
 *
 * ⚠️ 与 `card` 同判：`ComponentStyleConfig`（`className` / `style`）**加上**两个语义化槽
 * —— `CardConfig = ComponentStyleConfig & Pick<CardProps,'classNames'|'styles'>`
 * 是同一条写法。⚠️ `Timeline` 的语义化槽是**十槽去掉 `itemSubtitle`**（见上面的类型）。
 *
 * 与 anchor / masonry / card / avatar / list 一致：走 (B) 通道，**类型未提升**
 * （运行时可用，只是 `components` 的类型宽）。
 */
export type TimelineConfig = ComponentStyleConfig & Pick<TimelineProps, 'classNames' | 'styles'>;
