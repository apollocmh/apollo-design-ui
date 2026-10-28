/** Timeline data, native item slots and semantic style contracts. */
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
 * Timeline item data. Semantic targets match the rendered item regions;
 * Timeline has no subtitle region.
 */
export interface TimelineItemType {
  /** 预设色（`blue` / `red` / `green` / `gray`）落类；**其余任意色值**落内联 CSS 变量。 */
  color?: TimelineColor | string;
  /** 落在项元素上。 */
  className?: string;
  /** 项元素的内联样式。 */
  style?: CSSProperties;
  /** 项级语义化类名（复用 Steps 的槽名）。 */
  classNames?: Omit<NonNullable<StepItem['classNames']>, 'subtitle'>;
  /** 项级语义化样式（复用 Steps 的槽名）。 */
  styles?: Omit<NonNullable<StepItem['styles']>, 'subtitle'>;

  /** 排布侧。不传时按 `mode` 推导（`alternate` 时按奇偶）。 */
  placement?: ItemPlacement;
  /** @deprecated 请用 `placement`。left/right 分别归一为 start/end。 */
  position?: ItemPosition;
  /** 加载中；未提供 icon/dot 时使用默认 LoadingOutlined 图标。 */
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
 * Native itemTitle/itemContent/itemIcon slots customize item data.
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

  /** Item data; customize content with native scoped item slots. */
  items?: TimelineItemType[];

  /** @deprecated 请改用 items。false/null/undefined 关闭；0/空字符串仍创建条目。 */
  pending?: VNodeChild;
  /** @deprecated 请直接在 `items` 里加一项 pending 节点。 */
  pendingDot?: VNodeChild;
  /** 反转项顺序（`[...items].reverse()`）。 */
  reverse?: boolean;
}

/**
 * `Timeline` 暴露的实例。
 *
 * The native ordered-list root, or null before mount/after unmount.
 */
export interface TimelineRef {
  nativeElement: HTMLElement | null;
}

/** Current source item and display index (after reverse, including pending position). */
export interface TimelineItemSlotProps {
  item: TimelineItemType;
  index: number;
}

/** Present slots override matching item data, including empty slots. */
export interface TimelineSlots {
  itemTitle?: (props: TimelineItemSlotProps) => VNodeChild;
  itemContent?: (props: TimelineItemSlotProps) => VNodeChild;
  itemIcon?: (props: TimelineItemSlotProps) => VNodeChild;
}

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
export type TimelineConfig = {
  className?: ComponentStyleConfig['className'];
  style?: ComponentStyleConfig['style'];
  classNames?: TimelineProps['classNames'];
  styles?: TimelineProps['styles'];
};
