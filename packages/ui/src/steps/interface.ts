/**
 * Steps 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/steps/index.tsx` 的 `StepItem` / `BaseStepsProps`
 * + `@rc-component/steps@1.2.3` 的 `Steps.d.ts`。从类型面**重新定义**（H2），不复制。
 *
 * C8-R2 映射：`iconRender` / `itemRender` / `itemWrapperRender` / 函数形态
 * `progressDot` 是 React render props —— 一律 scoped slot（`#iconRender` /
 * `#itemRender` / `#itemWrapperRender` / `#progressDot`），**不**保留同名 prop。
 * `items` 数组字段（title/content/icon/subTitle）是数据 API（同 select 的 options），
 * 程序化上下文，VNodeChild 合法。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { SizeType } from '../config-provider/size-context';

// ---------------------------------------------------------------------------
// 基础
// ---------------------------------------------------------------------------

export type StepsStatus = 'error' | 'finish' | 'process' | 'wait';

export type StepsType = 'default' | 'navigation' | 'inline' | 'panel' | 'dot';

export type StepsOrientation = 'horizontal' | 'vertical';

export type StepsVariant = 'filled' | 'outlined';

/** `size` 不含 `large`（antd 逐字）；`default` deprecated ⇒ medium。 */
export type StepsSize = Exclude<SizeType, 'large'> | 'default';

// ---------------------------------------------------------------------------
// items 数据项（数据 API：VNodeChild 合法）
// ---------------------------------------------------------------------------

export interface StepItem {
  key?: string | number;
  className?: string;
  style?: CSSProperties;
  classNames?: Partial<Record<StepsItemSemanticName, string>>;
  styles?: Partial<Record<StepsItemSemanticName, CSSProperties>>;
  /** @deprecated 请用 `content`。 */
  description?: VNodeChild;
  content?: VNodeChild;
  icon?: VNodeChild;
  onClick?: (e: MouseEvent) => void;
  status?: StepsStatus;
  disabled?: boolean;
  title?: VNodeChild;
  subTitle?: VNodeChild;
}

export type StepsItemSemanticName =
  | 'root'
  | 'wrapper'
  | 'header'
  | 'title'
  | 'subtitle'
  | 'section'
  | 'content'
  | 'icon'
  | 'rail';

// ---------------------------------------------------------------------------
// 语义槽（与 antd StepsSemanticType 一致）
// ---------------------------------------------------------------------------

export type StepsSemanticName =
  | 'root'
  | 'item'
  | 'itemWrapper'
  | 'itemHeader'
  | 'itemTitle'
  | 'itemSubtitle'
  | 'itemSection'
  | 'itemContent'
  | 'itemIcon'
  | 'itemRail';

export interface StepsSemanticClassNames extends Partial<Record<StepsSemanticName, string>> {}

export interface StepsSemanticStyles extends Partial<Record<StepsSemanticName, CSSProperties>> {}

// ---------------------------------------------------------------------------
// render 信息（scoped slot 的入参，对应 rc 的 RenderInfo）
// ---------------------------------------------------------------------------

export interface StepsRenderInfo {
  index: number;
  active: boolean;
  item: StepItem;
}

/** `#iconRender` 的 slot props（rc iconRender 第二参的 Vue 形态）。 */
export interface StepsIconRenderSlotProps extends StepsRenderInfo {
  /** rc 默认产出的 icon 节点（含 status 图标/序号/进度环）。 */
  iconNode: VNodeChild;
}

/** `#itemRender` 的 slot props。 */
export interface StepsItemRenderSlotProps extends StepsRenderInfo {
  itemNode: VNodeChild;
}

/** `#itemWrapperRender` 的 slot props。 */
export interface StepsItemWrapperRenderSlotProps {
  itemNode: VNodeChild;
}

/** `#progressDot` 的 slot props（deprecated progressDot 函数形态的 Vue 形态）。 */
export interface StepsProgressDotSlotProps {
  iconNode: VNodeChild;
  index: number;
  status: StepsStatus;
  title: VNodeChild;
  /** @deprecated 请用 `content`。 */
  description: VNodeChild;
  content: VNodeChild;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StepsProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  /**
   * 语义化类名（十个槽）。
   *
   * ⚠️ **支持函数形态**（antd 的 `StepsSemanticAllType['classNamesAndFn']`）——
   * 函数式变体拿到的 `info.props` 是**解析后**的 props（`orientation` / `titlePlacement` /
   * `type` / `size` / `variant` / `percent` 都已是合并后的值）。
   * 2026-10-01 修正：原先只声明了静态对象形态（运行时早已支持函数形态）⇒
   * 补 L4 契约时被 `lint:types` 抓到。
   */
  classNames?:
    | StepsSemanticClassNames
    | ((info: { props: StepsProps }) => StepsSemanticClassNames)
    | undefined;
  /** 语义化样式（十个槽）。⚠️ 同样支持函数形态（见上）。 */
  styles?: StepsSemanticStyles | ((info: { props: StepsProps }) => StepsSemanticStyles) | undefined;
  style?: CSSProperties;

  variant?: StepsVariant;
  /** `default` deprecated ⇒ `medium`（v7 移除）。 */
  size?: StepsSize;

  // ---- 布局 ----
  type?: StepsType;
  /** @deprecated 请用 `orientation`。 */
  direction?: StepsOrientation;
  orientation?: StepsOrientation;
  /** @deprecated 请用 `titlePlacement`。 */
  labelPlacement?: StepsOrientation;
  titlePlacement?: StepsOrientation;
  /** @deprecated 请用 `type="dot"` + `#progressDot` 插槽（函数形态走 scoped slot）。 */
  progressDot?: boolean;
  responsive?: boolean;
  ellipsis?: boolean;
  /** 最大显示步数（≥3），隐藏区段折叠为禁用省略步。 */
  maxCount?: number;
  /** inline 类型的偏移步数。 */
  offset?: number;

  // ---- 数据 ----
  current?: number;
  initial?: number;
  items?: StepItem[];
  percent?: number;
  status?: StepsStatus;

  // ---- 事件 ----
  onChange?: (current: number) => void;
}

// ---------------------------------------------------------------------------
// Slots（C8-R2：render fn → scoped slot）
// ---------------------------------------------------------------------------

export interface StepsSlots {
  default?: () => unknown;
  iconRender?: (props: StepsIconRenderSlotProps) => unknown;
  itemRender?: (props: StepsItemRenderSlotProps) => unknown;
  itemWrapperRender?: (props: StepsItemWrapperRenderSlotProps) => unknown;
  progressDot?: (props: StepsProgressDotSlotProps) => unknown;
}
