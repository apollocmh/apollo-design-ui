/**
 * position 的类型契约。
 *
 * 这些类型全部是**纯数据**：矩形、区域、点、对齐配置。
 *
 * ⚠️ 旧注释写的是「不含任何 DOM 类型 —— 测量由调用方完成后以 Rect 传入」，
 *    **这是错的**（2026-09-17 改正）。它与两处更高优先级的事实来源冲突：
 *      · `registry/dependencies.json` 里 position 的 `purpose` 是「纯几何 **+ 尺寸测量**」
 *      · `ARCHITECTURE.md` §9.1 明确要求「别把 DOM 测量外壳误派给 overlay」
 *    DOM 测量就在本包的 `measure.ts`。本文件保持纯数据是对的 —— 测量的**输出**
 *    正是这里的 `Rect` / `Area`，测量过程只是不被这些类型描述而已。
 *
 * 这样切分正好让 AR1 可以被验证：几何内核（`align.ts`）只认这些纯数据类型，
 * 能被差分测试穷举；测量外壳（`measure.ts`）单独承担不可纯化的 DOM 副作用。
 */

/** 与 DOMRect 同构的最小矩形。x/y 是视口坐标（等价于 getBoundingClientRect 的 left/top）。 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 一个矩形区域，用于溢出判定。 */
export interface Area {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** 上/中/下 */
export type VerticalPoint = 't' | 'c' | 'b';
/** 左/中/右 */
export type HorizontalPoint = 'l' | 'c' | 'r';

/** 两个字符的对齐点，如 'tl'（左上）、'cc'（中心）。 */
export type AlignPoint = `${VerticalPoint}${HorizontalPoint}`;

/**
 * antd 的 12 个 placement。
 * 顺序与 antd `es/_util/placements.js` 的 `PlacementAlignMap` 一致，不要重排。
 */
export type Placement =
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'topLeft'
  | 'leftTop'
  | 'topRight'
  | 'rightTop'
  | 'bottomRight'
  | 'rightBottom'
  | 'bottomLeft'
  | 'leftBottom';

/** offset 支持数字与百分比字符串；百分比相对**自身**尺寸。 */
export type OffsetType = number | `${number}%`;

export interface OverflowConfig {
  /** 溢出时在 X 方向翻转 */
  adjustX?: boolean | number;
  /** 溢出时在 Y 方向翻转 */
  adjustY?: boolean | number;
  /** 溢出时在 X 方向平移（true 等价于 0） */
  shiftX?: boolean | number;
  /** 溢出时在 Y 方向平移（true 等价于 0） */
  shiftY?: boolean | number;
}

/**
 * 对齐配置，字段与 antd `AlignType` 一一对应。
 *
 * 有意**不实现**的 antd 字段（DOM/渲染相关，不属于几何）：
 * `useCssRight` / `useCssBottom` / `useCssTransform` / `ignoreShake` / `_experimental`
 */
export interface AlignType {
  /** [浮层点, 目标点]，如 ['tc','bc'] 表示浮层上边缘中点对齐目标下边缘中点 */
  points?: readonly [string, string];
  /** 浮层自身偏移；百分比相对浮层尺寸 */
  offset?: readonly OffsetType[];
  /** 目标偏移；百分比相对目标尺寸 */
  targetOffset?: readonly OffsetType[];
  overflow?: OverflowConfig;
  /** 是否自动调整箭头位置 */
  autoArrow?: boolean;
  htmlRegion?: 'visible' | 'scroll' | 'visibleFirst';
  /** 自动选择 top/bottom 内缩 */
  dynamicInset?: boolean;
}

/**
 * 翻转记忆。
 *
 * antd 用 `prevFlipRef` 在多次对齐之间**粘住**翻转结果：一旦翻转过，
 * 即使后续尺寸变化导致不再溢出，也会保持翻转，避免在临界点抖动。
 * 这里把它显式建模为输入+输出，使核心函数保持纯函数。
 */
export interface FlipMemory {
  /** bottom → top */
  bt?: boolean;
  /** top → bottom */
  tb?: boolean;
  /** right → left */
  rl?: boolean;
  /** left → right */
  lr?: boolean;
}

/**
 * 一次对齐的全部输入。
 *
 * 两个区域都按滚动容器裁剪过，由调用方（overlay 包）测量后传入：
 * - `visible` 视口可视区 —— 平移（shift）与 `visibleFirst` 的翻转判定用它
 * - `scroll`  文档滚动区 —— `htmlRegion='scroll'` 的判定用它
 */
export interface AlignContext {
  target: Rect;
  popup: Rect;
  /** 视口可视区 */
  visible: Area;
  /** 文档滚动区 */
  scroll: Area;
  /** CSS 缩放。1 表示无缩放；由 computedStyle 与 rect 的比值测得。 */
  scaleX?: number;
  scaleY?: number;
}

/** 对齐结果。offsetX/offsetY 是相对浮层**当前**位置的位移增量。 */
export interface AlignResult {
  offsetX: number;
  offsetY: number;
  /** 箭头中心相对浮层左边的距离 */
  arrowX: number;
  /** 箭头中心相对浮层上边的距离 */
  arrowY: number;
  /** 实际生效的对齐点（翻转后会变化） */
  points: [string, string];
  /** 本次对齐后的翻转状态，需由调用方保存并在下次对齐时传回 */
  flip: FlipMemory;
}

/** 构造 getPlacements 的参数，与 antd `getPlacements(config)` 对齐。 */
export interface PlacementConfig {
  /** 箭头宽度（正方形边长） */
  arrowWidth: number;
  /** 箭头与目标的间距 */
  offset: number;
  /** 浮层圆角，影响 arrowOffsetHorizontal */
  borderRadius: number;
  /** false 时完全关闭自动调整；对象时覆盖默认值 */
  autoAdjustOverflow?: boolean | OverflowConfig;
  /** 箭头是否指向目标中心（改变 8 个角 placement 的 points） */
  arrowPointAtCenter?: boolean;
  /** 是否优先保证视口内可见 */
  visibleFirst?: boolean;
}
