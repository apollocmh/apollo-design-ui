/**
 * 八个面板组件**共用**的那一组 props，以及「由 props 建 `info` 并 provide」的辅助。
 *
 * 上游对应物是 `SharedPanelProps` 接口 + 每个面板里那段 `useInfo(props, panelType)`。
 * 上游自己在源码里留了 TODO：*"this is not good to get from each props. Should move to
 * `SharedPanelContext` instead."* —— 本仓照抄数据流（面板自己建 `info`），
 * 但把「同一份 props 声明」收敛成一个对象字面量，避免 8 份复制粘贴。
 */

import type { PropType, VNodeChild } from 'vue';
import { type ComputedRef, computed, provide } from 'vue';
import { formatValue } from './date-util';
import {
  PANEL_HACK_KEY,
  type PanelCellRender,
  type PanelDateType,
  type PanelHackContext,
  type PanelInfo,
  providePanelInfo,
  usePanelShared,
} from './panel-context';
import type { TimePanelConfig } from './time-config';
import type { DisabledDate, GenerateConfig, PanelMode, PickerLocale } from './types';

/** `sharedPanelProps` 解出来的形状。 */
export interface SharedPanelProps {
  prefixCls: string;
  locale: PickerLocale;
  generateConfig: GenerateConfig<PanelDateType>;
  /** 面板当前浏览值（受控：改它只能靠 `onPickerValueChange`） */
  pickerValue: PanelDateType;
  onPickerValueChange?: (next: PanelDateType) => void;
  /** 标题按钮（年 / 月 / 十年）切换面板粒度 */
  onModeChange?: (mode: PanelMode, viewDate?: PanelDateType) => void;
  onSelect?: (date: PanelDateType) => void;
  /** hover 了某个值（`null` = 离开） */
  onHover?: (date: PanelDateType | null) => void;
  values: PanelDateType[];
  hoverValue?: PanelDateType[];
  hoverRangeValue?: PanelDateType[];
  cellRender?: PanelCellRender;
  disabledDate?: DisabledDate<PanelDateType>;
  minDate?: PanelDateType;
  maxDate?: PanelDateType;
  prevIcon?: VNodeChild;
  nextIcon?: VNodeChild;
  superPrevIcon?: VNodeChild;
  superNextIcon?: VNodeChild;
}

/**
 * 面板组件共用的 props（在 `defineComponent({ props: { ...sharedPanelProps, … } })` 里展开）。
 *
 * ⚠️ 三条反复踩过的声明规矩：
 *  1. **`VNodeChild` 类 prop 必须显式 `default: undefined`**（跨包判据 2）；
 *  2. 日期对象与图标都没有可靠的运行时构造器 ⇒ 用 `type: null`（**仓内惯例**，
 *     见 `packages/ui/src/tabs/TabPane.ts` 的 `children`），不要用
 *     `PropType<unknown>`（那会让该 prop 推断成 `undefined`，PITFALLS 13）；
 *  3. 含 `Boolean` 的类型列表会让「未传」变成 `false`（PITFALLS 46）⇒
 *     `showTime` 显式给 `default: undefined`。
 *
 * 🚨 4. **`required: true` 必须写 `as const`**：不写时 TS 把 `required` 推成 `boolean`，
 *    `ExtractPropTypes` 于是判不出「必填」⇒ 该 prop 在组件内变成 `X | undefined`。
 *    对 `locale` / `generateConfig` / `pickerValue` 这三个「面板处处都在用」的值来说，
 *    后果是全包几十处 `| undefined` 报错。**这是本轮实测踩到的**（2026-09-30）。
 */
export const sharedPanelProps = {
  prefixCls: { type: String, default: 'apollo-picker' },
  locale: { type: Object as PropType<PickerLocale>, required: true as const },
  generateConfig: {
    type: Object as PropType<GenerateConfig<PanelDateType>>,
    required: true as const,
  },
  pickerValue: {
    type: null as unknown as PropType<PanelDateType>,
    required: true as const,
  },
  onPickerValueChange: {
    type: Function as PropType<((next: PanelDateType) => void) | undefined>,
    default: undefined,
  },
  onModeChange: {
    type: Function as PropType<((mode: PanelMode, viewDate?: PanelDateType) => void) | undefined>,
    default: undefined,
  },
  onSelect: {
    type: Function as PropType<((date: PanelDateType) => void) | undefined>,
    default: undefined,
  },
  onHover: {
    type: Function as PropType<((date: PanelDateType | null) => void) | undefined>,
    default: undefined,
  },
  values: { type: Array as PropType<PanelDateType[]>, default: () => [] },
  hoverValue: { type: Array as PropType<PanelDateType[] | undefined>, default: undefined },
  hoverRangeValue: {
    type: Array as PropType<PanelDateType[] | undefined>,
    default: undefined,
  },
  cellRender: {
    type: Function as PropType<PanelCellRender | undefined>,
    default: undefined,
  },
  disabledDate: {
    type: Function as PropType<DisabledDate<PanelDateType> | undefined>,
    default: undefined,
  },
  minDate: { type: null as unknown as PropType<PanelDateType | undefined>, default: undefined },
  maxDate: { type: null as unknown as PropType<PanelDateType | undefined>, default: undefined },
  prevIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  nextIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  superPrevIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  superNextIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
};

/**
 * 由 props 建 `info` 并 `provide`，**返回那个 computed 供调用方直接用**。
 *
 * 🚨 **面板组件自己必须用返回值，不能用 `usePanelInfo()`**（2026-09-30 实测踩到）。
 * Vue 的 `inject` 读的是 **`instance.parent.provides`**（不是 `instance.provides`）——
 * 「自己 provide 的东西自己 inject 不到」。上游的心智模型不同：它的 `useInfo(props, type)`
 * 是「**从自己的 props 建 info 并返回**」，返回的那个对象直接用于本组件渲染，
 * `PanelContext.Provider` 只是把它**顺带**交给子组件。
 * ⇒ 本仓照抄这个数据流：`const info = providePanelInfoFromProps(props, mode)`，
 * 然后 `info.value` 就是自己的上下文。
 * 症状（踩到时）：`[picker] PanelHeader / PanelBody 必须在某个面板组件的子树内使用`，
 * 而组件栈指向的却是**面板自己**。
 *
 * ⚠️ `now` 上游是**每帧重算**（`generateConfig.getNow()` 直接写在组件体里）；
 * 本仓放进 `computed` ⇒ 只在其它依赖变化时才刷新。
 * 对 `-cell-today` 而言两者等价（`today` 在同一天内不变），差异只出现在
 * 「面板开着跨过午夜」这种场景，而那一帧的 `today` 本来就无对错可言。
 */
export function providePanelInfoFromProps(
  props: SharedPanelProps,
  panelType: PanelMode,
): ComputedRef<PanelInfo> {
  const shared = usePanelShared();
  const info = computed<PanelInfo>(() => ({
    now: props.generateConfig.getNow(),
    values: props.values,
    pickerValue: props.pickerValue,
    prefixCls: props.prefixCls,
    classNames: shared.classNames,
    styles: shared.styles,
    disabledDate: props.disabledDate,
    minDate: props.minDate,
    maxDate: props.maxDate,
    cellRender: props.cellRender,
    hoverValue: props.hoverValue,
    hoverRangeValue: props.hoverRangeValue as PanelInfo['hoverRangeValue'],
    onHover: props.onHover,
    locale: props.locale,
    generateConfig: props.generateConfig,
    onSelect: props.onSelect ?? (() => undefined),
    panelType,
    prevIcon: props.prevIcon,
    nextIcon: props.nextIcon,
    superPrevIcon: props.superPrevIcon,
    superNextIcon: props.superNextIcon,
  }));
  providePanelInfo(info);
  return info;
}

/** `provide` 逃生通道（只有 `PickerPanel` 用；面板子树里的 `PanelBody` / `PanelHeader` 读它）。 */
export function providePanelHack(hack: PanelHackContext): void {
  provide(PANEL_HACK_KEY, hack);
}

/**
 * `formatValue` 的薄封装。
 *
 * 面板里大量出现「按某个 locale 格式串渲染」，每次都要拼
 * `{ generateConfig, locale, format }` 三件套；`format` 可能是 `undefined`
 * （locale 未补齐时），上游在那种情况下也会走到 `formatValue` 并得到 `''`。
 */
export function formatWith(
  generateConfig: GenerateConfig<PanelDateType>,
  locale: PickerLocale,
  format: string | undefined,
  date: PanelDateType,
): string {
  return formatValue(date, { generateConfig, locale, format: format ?? '' });
}

/** `showTime` 在面板层的形状（`TimePanel` / `DateTimePanel` 用）。 */
export type PanelShowTime = boolean | TimePanelConfig<PanelDateType>;
