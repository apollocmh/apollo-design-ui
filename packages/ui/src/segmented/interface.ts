/**
 * Segmented 的类型定义。
 *
 * 契约来源：antd 6.6.4 的 `es/segmented/index.d.ts`（薄壳）+
 * `@rc-component/segmented@1.4.0` 的 `es/index.d.ts`（内核）。
 * 按 AGENTS.md H3 重新定义 —— 不复制上游源码。
 *
 * 与 antd 的差异（COMPATIBILITY.md §1.3 的 INTENDED）：
 *   - `onChange` 不进 emits（PITFALLS 35）：antd 是 props 回调，本仓统一走 attrs，
 *     与 `update:value` 同时发出（COMPATIBILITY.md 规则 C11）。
 *   - `value` 支持 `v-model:value`（emits `update:value`）。
 */

import type { Orientation } from '../_internal/use-orientation';
import type { TooltipProps } from '../tooltip';

/** 选项值类型。与 antd 的 `SegmentedValue` 同构（string | number）。 */
export type SegmentedValue = string | number;

/** 原始选项（antd 的 `SegmentedRawOption`）：任意可作为值的基本类型。 */
export type SegmentedRawOption = SegmentedValue;

/** 带 icon 的选项：`label` 可省略，`icon` 必填。 */
export interface SegmentedLabeledOptionWithIcon {
  /** 选项值。 */
  value: SegmentedValue;
  /** 选项图标（必填时 label 可省）。 */
  icon: unknown;
  /** 选项文本 / 渲染内容。 */
  label?: unknown;
  /** 禁用该选项。 */
  disabled?: boolean;
  /** 原生 title 属性；未传时对非对象 label 自动取 `label.toString()`（rc 判据）。 */
  title?: string;
  /** 选项级类名（rc 透传到 label 元素）。 */
  className?: string;
  /** 选项级 id（rc 透传到 label 元素）。 */
  id?: string;
  /** 悬浮提示：字符串或完整 Tooltip props。 */
  tooltip?: string | Omit<TooltipProps, 'children'>;
}

/** 无 icon 的选项：`label` 必填。 */
export interface SegmentedLabeledOptionWithoutIcon {
  /** 选项值。 */
  value: SegmentedValue;
  /** 选项文本 / 渲染内容。 */
  label: unknown;
  /** 禁用该选项。 */
  disabled?: boolean;
  /** 原生 title 属性；未传时对非对象 label 自动取 `label.toString()`（rc 判据）。 */
  title?: string;
  /** 选项级类名（rc 透传到 label 元素）。 */
  className?: string;
  /** 选项级 id（rc 透传到 label 元素）。 */
  id?: string;
  /** 悬浮提示：字符串或完整 Tooltip props。 */
  tooltip?: string | Omit<TooltipProps, 'children'>;
}

/** 对象形态选项（两种形态的并集）。 */
export type SegmentedLabeledOption =
  | SegmentedLabeledOptionWithIcon
  | SegmentedLabeledOptionWithoutIcon;

/**
 * options 数组元素：原始值或对象选项。
 * 原始值（string/number）经 `normalizeOptions` 转成 `{ label, title, value }`。
 */
export type SegmentedOption = SegmentedRawOption | SegmentedLabeledOption;

/** options 类型。 */
export type SegmentedOptions = SegmentedOption[];

/** 语义化类名键（antd 的 `SegmentedSemanticType.classNames`）。 */
export interface SegmentedSemanticClassNames {
  root?: string;
  icon?: string;
  label?: string;
  item?: string;
}

/** 语义化样式键（antd 的 `SegmentedSemanticType.styles`）。 */
export interface SegmentedSemanticStyles {
  root?: Record<string, unknown>;
  icon?: Record<string, unknown>;
  label?: Record<string, unknown>;
  item?: Record<string, unknown>;
}

/**
 * 语义化的**运行时输入**（对象 | 函数两形态）。
 *
 * ⚠️ 为什么单列一个类型（照 `ModalSemanticTypeInput` 的范式，PITFALLS 185 的同族）：
 *   `classNames` / `styles` 的**公开类型**（`SegmentedSemanticClassNames` 等）刻意只有
 *   **对象形态**；但组件运行时**接受函数形态**（`classNamesAndFn` / `stylesAndFn`，
 *   裁决 `empty-semantic-fn = B`），`style-class` demo 也在传函数。
 *   只声明对象形态会让模板里的 `:styles="fn"` 被判「不可赋值」（TS2560），
 *   而文档注释还写着「支持函数式」—— 类型与文档、与 demo 三方不一致。
 *
 * 入参用 `Record<string, unknown>` 而不是 `SegmentedProps`：要能直接喂给
 * `useMergeSemantic` 的 `SemanticInput`（它要求 `(info: SemanticInfo<P>) => …`，
 * `P` 由调用方选）；传 `SegmentedProps` 会因**参数逆变**不可赋值。
 */
export interface SegmentedSemanticTypeInput {
  classNames?:
    | SegmentedSemanticClassNames
    | ((info: { props: Record<string, unknown> }) => SegmentedSemanticClassNames);
  styles?:
    | SegmentedSemanticStyles
    | ((info: { props: Record<string, unknown> }) => SegmentedSemanticStyles);
}

/** Segmented 的 ref（antd 是 `HTMLDivElement`）。 */
export interface SegmentedRef {
  nativeElement: HTMLDivElement | null;
}

export interface SegmentedProps {
  /** 自动生成前缀。 */
  prefixCls?: string;
  /**
   * 选项集合。原始值或对象（可带 icon / disabled / tooltip）。
   * `undefined` 时按 antd 默认空数组处理。
   */
  options?: SegmentedOptions;
  /** 禁用整个控件。 */
  disabled?: boolean;
  /** 默认选中值；未传时取第一个可用选项（rc 判据，见 README）。 */
  defaultValue?: SegmentedValue;
  /** 受控选中值。 */
  value?: SegmentedValue;
  /** 原生 radio input 的 name；未传时 `useId()` 自动生成（antd 判据）。 */
  name?: string;
  /** 占满父容器宽度。 */
  block?: boolean;
  /** 尺寸。 */
  size?: 'small' | 'middle' | 'large';
  /** 纵向布局（旧 API，优先级低于 orientation）。 */
  vertical?: boolean;
  /** 布局方向（新 API，优先级最高）。 */
  orientation?: Orientation;
  /** 形状：`round` 时根与 item / thumb 全圆角。 */
  shape?: 'default' | 'round';
  /** 语义化类名（root/icon/label/item），**对象 | 函数**两形态。 */
  classNames?: SegmentedSemanticTypeInput['classNames'];
  /** 语义化样式（root/icon/label/item），**对象 | 函数**两形态。 */
  styles?: SegmentedSemanticTypeInput['styles'];
}
