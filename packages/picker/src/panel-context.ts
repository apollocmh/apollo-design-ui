/**
 * 面板层的三组注入上下文（`provide` / `inject`）与面板组件共用的类型。
 *
 * Vue 映射：上游 `es/PickerPanel/context.js` 的三个 React Context
 * （`SharedPanelContext` / `PanelContext` / `PickerHackContext`）。
 *
 * ⚠️ 与 React 版的**唯一结构差异**：`PanelContext` 的值在 Vue 里是
 * `ComputedRef<PanelInfo>`（React 里是每次渲染现算的对象）。原因：
 * 面板的 `info` 由 props 派生，而 props 是响应式的 —— 用 `computed` 才能让
 * 「`pickerValue` 变了 ⇒ 表头与格子的 class 一起变」，同时避免每帧重建对象。
 * 消费方一律写 `usePanelInfo().value.xxx`。
 *
 * ── 为什么组件层用 `Dayjs` 而不是泛型 ─────────────────────────────────────────
 *
 * 纯函数层是**对 `DateType` 泛型**的（`GenerateConfig<DateType>`，契约 §9 P2 刻意保住了
 * 「可与上游逐位对拍」这条唯一强证据）。但**组件层套不住泛型**：
 * `InjectionKey<T>` 的 `T` 必须在 `provide` 那一刻确定，`defineComponent` 的 props
 * 也无法参数化。用 `never` 占位会把「传值」变成不可能
 * （`PropType<never>` 解出来的 prop 值类型是 `never`，调用方一个参数都传不进来）。
 *
 * ⇒ 组件层直接落在 `Dayjs` 上。这不是放弃日期库无关性：本包的 `peerDependencies`
 * 本来只有 dayjs（`package.json`）；组件层从不 import dayjs 的**API**，只用它的**类型**；
 * 泛型能力在运行期仍完整保留（`generateConfig` 是按值传进来的）。
 */

import type { Dayjs } from 'dayjs';
import {
  type ComputedRef,
  computed,
  type InjectionKey,
  inject,
  provide,
  type VNodeChild,
} from 'vue';
import type { DisabledDate, GenerateConfig, PanelMode, PickerLocale } from './types';

/** 组件层的日期类型（见文件头）。 */
export type PanelDateType = Dayjs;

/** 面板的语义化类名槽（与 antd `classNames.popup.*` 的键一致）。 */
export interface PanelSemanticClassNames {
  root?: string;
  header?: string;
  body?: string;
  content?: string;
  item?: string;
  footer?: string;
  container?: string;
}

/** 面板的语义化样式槽。 */
export interface PanelSemanticStyles {
  root?: Record<string, string | number>;
  header?: Record<string, string | number>;
  body?: Record<string, string | number>;
  content?: Record<string, string | number>;
  item?: Record<string, string | number>;
  footer?: Record<string, string | number>;
  container?: Record<string, string | number>;
}

/**
 * 「跨层级共享」的语义槽（上游 `SharedPanelContext`）。
 *
 * ⚠️ 上游 `PickerPanel` 的取值是 `pickerClassNames?.popup ?? panelClassNames ?? {}`，
 * 即 **`ui` 层 Context 里的 `classNames.popup` 优先于本组件自己的 `classNames`**。
 * 这层优先级由 `PickerPanel` 实现，不在这里。
 */
export interface PanelSharedContext {
  classNames: PanelSemanticClassNames;
  styles: PanelSemanticStyles;
}

/**
 * 面板内部的「逃生通道」（上游 `PickerHackContext`，名字就说明它不体面）。
 *
 * - `hideHeader` / `hidePrev` / `hideNext`：RangePicker 用双面板时藏掉重复表头与中间那侧的
 *   箭头（置 `visibility: hidden` 而不是 `display: none`，**保留占位**）；
 * - `onCellDblClick`：双击格子（RangePicker 用它做「选完两段就关面板」）。
 */
export interface PanelHackContext {
  hideHeader?: boolean;
  hidePrev?: boolean;
  hideNext?: boolean;
  onCellDblClick?: () => void;
}

/** `cellRender` 的第二个参数（上游 `CellRenderInfo`）。 */
export interface PanelCellRenderInfo {
  prefixCls: string;
  /** 默认渲染出来的那个节点（`<div class="${cellPrefixCls}-inner">文字</div>`） */
  originNode: VNodeChild;
  /** "今天"（date 面板用来打 `-cell-today`） */
  today: PanelDateType;
  type: PanelMode;
  /** 只在时间列上出现：`'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem'` */
  subType?: string;
  locale: PickerLocale;
}

/** 自定义格子渲染。返回 `undefined` / `null` 会渲染成空（与上游一致）。 */
export type PanelCellRender = (date: PanelDateType, info: PanelCellRenderInfo) => VNodeChild;

/**
 * 单个面板的完整上下文（上游 `useInfo` 的返回值 `info`）。
 *
 * ⚠️ 上游的 `useInfo` 从**自己那一份 props** 里取这些字段（源码里那句
 * `// TODO: this is not good to get from each props.` 说的就是这件事）——
 * 于是每个面板组件源码里都有一遍解构。本仓保留同样的数据流（面板自己建 `info`），
 * 但把它收进一个 `computed`。
 */
export interface PanelInfo {
  now: PanelDateType;
  /** 当前值列表（多选时多于一个；未选时可能是空数组） */
  values: readonly PanelDateType[];
  /** 面板当前浏览值 */
  pickerValue: PanelDateType;
  prefixCls: string;
  classNames: PanelSemanticClassNames;
  styles: PanelSemanticStyles;
  disabledDate?: DisabledDate<PanelDateType>;
  minDate?: PanelDateType;
  maxDate?: PanelDateType;
  cellRender?: PanelCellRender;
  hoverValue?: readonly PanelDateType[] | null;
  hoverRangeValue?: readonly [PanelDateType, PanelDateType] | null;
  onHover?: (date: PanelDateType | null) => void;
  locale: PickerLocale;
  generateConfig: GenerateConfig<PanelDateType>;
  onSelect: (date: PanelDateType) => void;
  /** 面板粒度 —— `isSame(…, type)` 的第三个参数 */
  panelType: PanelMode;
  prevIcon?: VNodeChild;
  nextIcon?: VNodeChild;
  superPrevIcon?: VNodeChild;
  superNextIcon?: VNodeChild;
}

export const PANEL_SHARED_KEY: InjectionKey<PanelSharedContext> = Symbol('apolloPickerPanelShared');
export const PANEL_INFO_KEY: InjectionKey<ComputedRef<PanelInfo>> = Symbol('apolloPickerPanelInfo');
export const PANEL_HACK_KEY: InjectionKey<PanelHackContext> = Symbol('apolloPickerPanelHack');

export const DEFAULT_PANEL_SHARED: PanelSharedContext = { classNames: {}, styles: {} };

/** `provide` 一个面板的 `info`（由**面板组件自己**在 `setup()` 里调用）。 */
export function providePanelInfo(info: ComputedRef<PanelInfo>): void {
  provide(PANEL_INFO_KEY, info);
}

/**
 * 取当前面板的 `info`。
 *
 * ⚠️ 用 `inject(..., undefined)` + 兜底「抛错的 computed」而不是在这里就抛：
 * `inject` 必须在 `setup()` 同步阶段调用，而 `PanelHeader` / `PanelBody` 的 `setup`
 * 是同步的 —— 找不到时**留到渲染期**再抛，报错信息才能带上组件栈。
 */
export function usePanelInfo(): ComputedRef<PanelInfo> {
  const info = inject(PANEL_INFO_KEY, undefined);
  if (info) {
    return info;
  }
  return computed(() => {
    throw new Error('[picker] PanelHeader / PanelBody 必须在某个面板组件的子树内使用');
  });
}

/** 取共享语义槽（不存在时给空对象）。 */
export function usePanelShared(): PanelSharedContext {
  return inject(PANEL_SHARED_KEY, DEFAULT_PANEL_SHARED);
}

/** 取逃生通道上下文。 */
export function usePanelHack(): PanelHackContext {
  return inject(PANEL_HACK_KEY, {});
}

/** `visibility: hidden` —— 藏起来但**保留占位**（上游 `HIDDEN_STYLE`）。 */
export function hiddenStyleWhen(condition: boolean | undefined): Record<string, string> {
  return condition ? { visibility: 'hidden' } : {};
}
