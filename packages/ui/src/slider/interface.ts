/**
 * Slider 的类型契约（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/slider/index.d.ts` + rc 内核 `@rc-component/slider@1.1.1`
 * 的 `es/Slider.d.ts` / `es/interface.d.ts`（**重新定义**，不搬运，H2）。
 * 判据逐条见 `docs/analysis/slider.md`。
 *
 * ── Vue 化映射（COMPATIBILITY.md 的规则）───────────────────────────────────────
 *
 * | React | Vue | 规则 |
 * |---|---|---|
 * | `value` + `onChange` | `v-model:value`（同时发 `change`，C11） | §3 |
 * | `onChangeComplete` / `onBeforeChange` / `onFocus` / `onBlur` | emits | C5 |
 * | `handleRender` / `activeHandleRender` | **scoped slot** `#handle` / `#activeHandle` | C8 |
 * | `SliderRef`（focus/blur） | `expose` | §4 |
 * | `marks` 的 value（`ReactNode`） | `VNodeChild` | §6 |
 * | `SliderInternalContext` | `provide/inject`（antd 内部给 icon-slider demo 用） | C4 |
 *
 * ⚠️ 三处 Boolean prop 必须显式 `default: undefined`（PITFALLS 2 / D21）：
 *    `included`（默认 true，「未传 ≠ false」的语义要保住）、`dots`、`keyboard`。
 *    另有 `disabled` 的**数组形态** —— `type: [Boolean, Array]`（PITFALLS 2 同族）。
 *
 * ⚠️ 本文件不含任何实现：G4 之前 `Slider.vue` 只有空壳。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { TooltipPlacement, TooltipProps } from '../tooltip';

// ---------------------------------------------------------------------------
// 值域与方向
// ---------------------------------------------------------------------------

/** 单值（单把手）或值数组（range）。 */
export type SliderValue = number | number[];

/** 朝向。antd 6 起 `orientation` 是新写法，`vertical` 保留（见 `SliderProps`）。 */
export type SliderOrientation = 'horizontal' | 'vertical';

/** 内部方向（四值）：`vertical ? (reverse ? ttb : btt) : (reverse ? rtl : ltr)`。 */
export type SliderDirection = 'ltr' | 'rtl' | 'ttb' | 'btt';

/** `range` 的对象形态（rc 的 `RangeConfig`）。 */
export interface SliderRangeConfig {
  /** 可增删节点（键盘 Backspace/Delete、拖拽删除）。 */
  editable?: boolean;
  /** 可拖整条已选轨道（⚠️ 与 `editable` 互斥，且 `step === null` 时被强制关闭）。 */
  draggableTrack?: boolean;
  /** `editable` 时的最少节点数。 */
  minCount?: number;
  /** `editable` 时的最多节点数。 */
  maxCount?: number;
}

/** `range` 的三形态：`true`（双把手）/ 对象 / 未传（单把手）。 */
export type SliderRange = boolean | SliderRangeConfig;

// ---------------------------------------------------------------------------
// marks / dots
// ---------------------------------------------------------------------------

/** `marks` 的对象形态（rc 的 `MarkObj`）。 */
export interface SliderMarkObject {
  /** 标记文案。⚠️ `0` 合法（判据是 `label || typeof label === 'number'`）。 */
  label?: VNodeChild;
  /** 标记样式。 */
  style?: CSSProperties;
}

/**
 * 刻度标记。
 *
 * ⚠️ key 是**字符串化的数值**（`'0'` / `'50'`），内部按 `Number(key)` 解析并**升序排序**；
 *    label 为 falsy 且非 number 的项会被过滤掉。
 */
export type SliderMarks = Record<string | number, VNodeChild | SliderMarkObject>;

/** 刻度点的样式：常量或按值求值。 */
export type SliderDotStyle = CSSProperties | ((dotValue: number) => CSSProperties);

// ---------------------------------------------------------------------------
// 语义槽（5 个；比 rc 多一个 root —— antd 追加）
// ---------------------------------------------------------------------------

export interface SliderSemanticClassNames {
  root?: string;
  tracks?: string;
  track?: string;
  rail?: string;
  handle?: string;
}

export interface SliderSemanticStyles {
  root?: CSSProperties;
  tracks?: CSSProperties;
  track?: CSSProperties;
  rail?: CSSProperties;
  handle?: CSSProperties;
}

// ---------------------------------------------------------------------------
// tooltip
// ---------------------------------------------------------------------------

/** 提示文案格式化：`null` ⇒ **永不显示** tooltip（判据 `mergedTipFormatter !== null`）。 */
export type SliderFormatter = ((value?: number) => VNodeChild) | null;

/**
 * `tooltip` prop。
 *
 * antd 的 `SliderTooltipProps extends AbstractTooltipProps`，壳只挑几项用；
 * 本仓按「本仓 Tooltip 的 props 子集 + slider 专有项」重新定义（不搬 antd 的继承链）。
 */
export interface SliderTooltipProps
  extends Omit<TooltipProps, 'title' | 'children' | 'prefixCls' | 'open' | 'placement'> {
  /** 提示前缀（默认取 `tooltip` 组件前缀）。 */
  prefixCls?: string;
  /** 受控开合：`false` ⇒ **永不显示**（lockOpen）。 */
  open?: boolean;
  /** 位置。未传 ⇒ 横向 `top`；纵向 `isRTL ? 'left' : 'right'`。 */
  placement?: TooltipPlacement;
  /** 挂载容器（fallback：ConfigProvider 的 `getPopupContainer`）。 */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** 文案格式化。 */
  formatter?: SliderFormatter;
  /** ⚠️ 内部通道：当前把手的值（antd 的 `SliderTooltip` 注入，用户不必传）。 */
  value?: number;
  /** ⚠️ 内部通道：本次拖拽是「拖拽删除」（决定 tooltip 的隐藏时机）。 */
  draggingDelete?: boolean;
}

// ---------------------------------------------------------------------------
// 把手 slot（替代 handleRender / activeHandleRender）
// ---------------------------------------------------------------------------

/** 单个把手的渲染信息（rc 的 `HandleGeneratorInfo` + `prefixCls`）。 */
export interface SliderHandleInfo {
  /** 把手索引（从 0 起）。 */
  index: number;
  /** 当前值。 */
  value?: number;
  /** 是否正在拖拽。 */
  dragging?: boolean;
  /** 是否处于「拖拽删除」态。 */
  draggingDelete?: boolean;
  /** 组件前缀（rc 也回传，便于自定义结构复用类名）。 */
  prefixCls?: string;
}

/** 无障碍的把手值文案格式化。 */
export type SliderAriaValueFormat = (value: number) => string;

// ---------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------

/**
 * 两种模式共有的 props。
 *
 * ⚠️ 与 antd 的差别只在**类型来源**：antd 从 rc 的 `SliderProps<number|number[]>` 派生，
 *    本仓直接从 rc 的 .d.ts 重新定义（H2），字段集合逐条对应。
 */
export interface SliderBaseProps {
  prefixCls?: string;
  id?: string;
  /** 禁用：布尔（整体）或**数组**（逐把手）。 */
  disabled?: boolean | boolean[];
  /** 键盘可操作（默认 `true`）。⚠️ `false` 时把手仍可聚焦，但不响应方向键。 */
  keyboard?: boolean;
  autoFocus?: boolean;
  /** 允许把手交叉（默认 `true`；`false` 时相邻把手互相挤）。 */
  allowCross?: boolean;
  /** 推挤间距：`true` ⇒ 等于 `step`；数字 ⇒ 该间距；`false` ⇒ 不推挤。 */
  pushable?: boolean | number;
  /** 反向（横向即从右往左；`vertical` 时自下而上）。 */
  reverse?: boolean;
  /** ⚠️ 已废弃，请用 `orientation`。 */
  vertical?: boolean;
  /** 朝向（antd 6 新增）。 */
  orientation?: SliderOrientation;
  /** 是否显示已选轨道（默认 `true`；`false` 时只画 rail）。 */
  included?: boolean;
  /** 已选轨道的起点值（默认取 `min`）。 */
  startPoint?: number;
  marks?: SliderMarks;
  dots?: boolean;
  /** 刻度点样式。 */
  dotStyle?: SliderDotStyle;
  /** 选中刻度点样式。 */
  activeDotStyle?: SliderDotStyle;
  /** `false` ⇒ 不渲染已选轨道（只留 rail）。 */
  track?: boolean;
  /** 是否隐藏 tooltip（`null` 恒不显示）。 */
  formatter?: SliderFormatter;
  tooltip?: SliderTooltipProps;
  tabIndex?: number | number[];
  ariaLabelForHandle?: string | string[];
  ariaLabelledByForHandle?: string | string[];
  ariaRequired?: boolean;
  /** ⚠️ 逐把手取值（数组或单值）。 */
  ariaValueTextFormatterForHandle?: SliderAriaValueFormat | SliderAriaValueFormat[];
  classNames?: SliderSemanticClassNames;
  styles?: SliderSemanticStyles;
  /** ⚠️ 已废弃，请用 `styles.track`。 */
  trackStyle?: CSSProperties | CSSProperties[];
  /** ⚠️ 已废弃，请用 `styles.handle`。 */
  handleStyle?: CSSProperties | CSSProperties[];
  /** ⚠️ 已废弃，请用 `styles.rail`。 */
  railStyle?: CSSProperties;
}

/** 单把手值域（形态对齐 antd 的 `SliderSingleProps`，只用于文档与类型测试）。 */
export interface SliderSingleProps extends SliderBaseProps {
  range?: false;
  value?: number;
  defaultValue?: number;
}

/** 多把手值域（形态对齐 antd 的 `SliderRangeProps`）。 */
export interface SliderRangeProps extends SliderBaseProps {
  range: true | SliderRangeConfig;
  value?: number[];
  defaultValue?: number[];
}

/**
 * `Slider` 的 props（单一形状）。
 *
 * ⚠️ 用「单一形状 + 联合值类型」而不是 `SliderSingleProps | SliderRangeProps`：
 *    Vue 的 props 是运行时对象，TS 联合会在 `defineComponent` 的推断里塌成 `never`
 *    （PITFALLS 185 同族）。模式判定交给 `range` 字段（实现里按 `useRange` 归一）。
 *    `SliderSingleProps` / `SliderRangeProps` 保留给类型测试与文档。
 */
export interface SliderProps extends SliderBaseProps {
  range?: SliderRange;
  value?: SliderValue;
  defaultValue?: SliderValue;
  /** ⚠️ 已废弃，请用 `range.minCount` / `range.maxCount`。 */
  count?: number;
}

// ---------------------------------------------------------------------------
// emits / slots / expose
// ---------------------------------------------------------------------------

/**
 * 事件。
 *
 * ⚠️ `value` 的载荷形状随模式而变：单把手 `number`、range `number[]`
 *    （rc 的 `getTriggerValue`）。类型上取并集，运行时由实现保证。
 */
export interface SliderEmits {
  /** v-model:value（C11：与 `change` 同时发）。 */
  'update:value': [value: SliderValue];
  /** 值变化（与 `update:value` 同时发）。 */
  change: [value: SliderValue];
  /** 拖拽/键盘结束（rc 的 `onChangeComplete`）。 */
  changeComplete: [value: SliderValue];
  /** 变化开始前（rc 的 `onBeforeChange`）。 */
  beforeChange: [value: SliderValue];
  /** 把手获得焦点（原生事件 + 把手索引 —— rc 的 onFocus 签名）。 */
  focus: [event: FocusEvent, index: number];
  /** 把手失焦。 */
  blur: [event: FocusEvent, index: number];
}

/** 插槽。 */
export interface SliderSlots {
  /** 自定义把手（替代 rc 的 `handleRender`）。 */
  handle?: (info: SliderHandleInfo) => VNodeChild;
  /**
   * 自定义「跟随当前把手」的 tooltip
   * （替代 rc 的 `activeHandleRender`：range 且未锁定 open 时生效）。
   */
  activeHandle?: (info: SliderHandleInfo) => VNodeChild;
}

/** expose（antd 的 `SliderRef`）。 */
export interface SliderRef {
  /** 聚焦第一个把手。 */
  focus: () => void;
  /** 若焦点在组件内则失焦。 */
  blur: () => void;
}
