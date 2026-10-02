<script setup lang="ts">
/**
 * TimePicker —— antd `time-picker/index.tsx`（174 行）的 Vue 版：**`DatePicker` 的薄壳**。
 *
 * 契约与实测证据：`docs/analysis/time-picker.md`；告警矩阵与上下文路由的可复现探针：
 * `node tests/visual/debug/probe-time-picker-antd.mjs`。
 *
 * ## 文件头判据
 *
 * 1. 🚨 **零自有样式** —— antd 的 `es/time-picker/` 里没有一句样式代码（138 个「文件」
 *    里 136 个是 dayjs 语言包）⇒ 观感 100% 来自 `date-picker` 的 `-picker-*`。
 *    本组件**没有** `style/`，`tokenStatus` / `styleStatus` 在 registry 里是 `n/a`。
 *
 * 2. 🚨 **配置键是 `timePicker`，不是 `datePicker`** —— 内层
 *    `DatePicker.TimePicker` 的 `pickerType` 由**入口组件名**决定
 *    （`displayName === 'TimePicker' ? 'timePicker' : 'datePicker'`），
 *    **不是**由 `picker` 模式决定。所以 `<DatePicker picker="time"/>` 读 `datePicker`，
 *    而本组件读 `timePicker`。改道靠 `_internal/picker-host-context.ts` 的注入
 *    （`DatePicker.vue` / `RangePicker.vue` 从注入值取配置键与告警命名空间）。
 *
 * 3. 🚨 **`popupClassName` / `popupStyle` / `bordered` 必须「吞掉」** —— 实测：
 *    这三个 prop 在**单个** TimePicker 上**不发**废弃告警（上游外层解构掉了），
 *    而在 `TimePicker.RangePicker` 上**发**（那边的外层 `{...props}` 原样透传）。
 *    所以这里**解构掉**它们（前两个合并进语义槽、`bordered` 只用来算 `variant`），
 *    **不能**顺手转发 —— 一转发就会多出 antd 没有的告警（L1 有断言钉住）。
 *
 * 4. 🚨 **`mode` 必须被丢掉** —— 上游 `<InternalTimePicker {...restProps} mode={undefined} />`
 *    把用户传的 `mode` 覆盖成 `undefined`（时间轴没有面板粒度）。
 *
 * 5. **不声明 `defineEmits`**（与 `auto-complete/AutoComplete.ts` 同判，PITFALLS 35）：
 *    声明了会把同名 `onXxx` 从 `attrs` 摘掉 ⇒ 必须逐个手工中继，且漏一个就静默失效。
 *    这里让回调**留在 `attrs` 里原样转发**给内层 —— Vue 的 `emit` 读的是
 *    `vnode.props`，所以内层 `emit('change')` 会直接调到用户传的 `onChange`。
 *    ⚠️ 代价：`@change` 的载荷不做 `vue-tsc` 校验。`TimePickerEmits` 仍是**对外导出的类型契约**。
 *
 * 6. **`addon` 与 `renderExtraFooter` 是函数 prop，不是插槽**（上游同判）；
 *    优先级 `renderExtraFooter ?? addon`（上游 `useMemo` 的两分支）。
 */

import { useDevWarning } from '@apollo-design/utils';
import { computed, provide, useAttrs, useSlots } from 'vue';
import { pickerHostContextKey } from '../_internal/picker-host-context';
import { useComponentConfig } from '../config-provider/context';
import DatePicker from '../date-picker/DatePicker.vue';
import { useMergedPickerSemantic } from '../date-picker/hooks/use-picker-semantic';
import type {
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
} from '../date-picker/interface';
import { useVariant } from '../form/hooks/useVariants';
import type { TimePickerProps } from './interface';

defineOptions({ name: 'ATimePicker', inheritAttrs: false });

/**
 * 🚨 **`withDefaults` 里给 `undefined` 不是冗余，是语义的一部分**（PLAN.md 避坑清单第 5 条）：
 * Vue 对 `type: Boolean` 的 prop 在**未传时**会强制成 `false` ⇒
 * `bordered` 会变成 `false` ⇒ `useVariant` 判成 `'borderless'` ⇒
 * 默认渲染成 `apollo-picker-borderless`（**实测踩到**：应为 `-outlined`）。
 *
 * ⚠️ 清单与 `DatePicker.vue` 逐项对齐（去掉本组件没有的 `picker` / `showTime`）。
 */
const props = withDefaults(defineProps<TimePickerProps>(), {
  open: undefined,
  defaultOpen: undefined,
  multiple: undefined,
  showWeek: undefined,
  showNow: undefined,
  showToday: undefined,
  inputReadOnly: undefined,
  preserveInvalidOnBlur: undefined,
  needConfirm: undefined,
  changeOnBlur: undefined,
  order: undefined,
  disabled: undefined,
  bordered: undefined,
  required: undefined,
  prefix: undefined,
  suffixIcon: undefined,
  clearIcon: undefined,
  separator: undefined,
  prevIcon: undefined,
  nextIcon: undefined,
  superPrevIcon: undefined,
  superNextIcon: undefined,
  removeIcon: undefined,
  pickerValue: undefined,
  defaultPickerValue: undefined,
  defaultOpenValue: undefined,
  allowClear: undefined,
  previewValue: undefined,
});
const attrs = useAttrs();
const slots = useSlots();

// ============================== 宿主上下文改道 ==============================
/**
 * 必须在 `setup()` 同步阶段 `provide`（内层 `DatePicker.vue` 的 `inject` 发生在
 * 它的 setup 里，晚于这里）。
 *
 * ⚠️ 本组件是 `DatePicker.vue` 的**直接父组件** ⇒ 不存在「中间层自己 provide
 * 同族键」的遮蔽问题（那是 PITFALLS 256 的形态）。
 */
provide(pickerHostContextKey, { configKey: 'timePicker', warningName: 'TimePicker' });

// ============================== 废弃 prop 告警 ==============================
/**
 * 上游 `time-picker/index.tsx:107-111`：
 *
 * ```js
 * if (process.env.NODE_ENV !== 'production') {
 *   const warning = devUseWarning('TimePicker');
 *   warning.deprecated(!addon, 'addon', 'renderExtraFooter');
 * }
 * ```
 *
 * ⚠️ 判据从 `!addon` 改成 `props.addon === undefined` —— 理由同 `DatePicker.vue`
 * 的 `DEPRECATED_PROPS`：Vue 的 `props` 恒含所有声明过的键（未传是 `undefined`）。
 */
const devWarning = useDevWarning('TimePicker');
devWarning.deprecated(props.addon === undefined, 'addon', 'renderExtraFooter');

// ============================== variant ==============================
/**
 * 🚨 外层用 **`'timePicker'`** 那份配置（`components.timePicker.variant`）；
 * 内层 `DatePicker.vue` 的 `useVariant({ component: 'datePicker' })` 会拿到
 * **合并后**的 `variant` prop ⇒ `variant` 有值时直接胜出，配置键的差别不体现。
 */
const { variant: mergedVariant } = useVariant({
  component: 'timePicker',
  variant: () => props.variant,
  legacyBordered: () => props.bordered,
});

// ============================== renderExtraFooter ==============================
/** 上游 `useMemo`：`renderExtraFooter` 优先，其次 `addon`，都没有就是 `undefined`。 */
const internalRenderExtraFooter = computed(() => props.renderExtraFooter ?? props.addon);

// ============================== 语义槽 ==============================
const timePickerContext = useComponentConfig('timePicker');

/**
 * `ConfigProvider` 里 `components.timePicker` 的配置。
 *
 * ⚠️ `useComponentConfig` 的默认泛型是 `Record<string, unknown>`（它只负责搬运，
 * 值的类型由消费方给出）⇒ 这里显式收窄。**不收窄会让 `context.classNames` /
 * `context.styles` 都是 `unknown`**，进不了 `useMergedPickerSemantic` 的入参
 * —— 与 `DatePicker.vue` 同一处取舍（那边也这么写）。
 */
interface TimePickerComponentConfig {
  classNames?: DatePickerSemanticClassNames;
  styles?: DatePickerSemanticStyles;
}
const pickerContext = timePickerContext as unknown as TimePickerComponentConfig;

/**
 * 给函数式语义槽的 `info.props`。
 *
 * 上游每次渲染都新建 `mergedProps = { ...props, variant: mergedVariant }`；
 * 本仓的 hook 把 `info.props` 存成**引用**（`DatePicker.vue` 传的就是 `props` 本身），
 * 所以这里用 `Proxy` 把 `variant` 换成合并值、其余键直通 —— 既保住**响应式**
 * （`Reflect.get` 打在 reactive 的 `props` 上，`computed` 能追踪），
 * 又保住「函数形态看到的是合并后的 variant」这条上游语义。
 */
const semanticProps = new Proxy(props, {
  get: (target, key, receiver) =>
    key === 'variant' ? mergedVariant.value : Reflect.get(target, key, receiver),
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergedPickerSemantic({
  contextClassNames: () => pickerContext.classNames,
  classNames: () => props.classNames,
  contextStyles: () => pickerContext.styles,
  styles: () => props.styles,
  popupClassName: () => props.popupClassName,
  // ⚠️ 与 `DatePicker.vue` 同一处收窄：`CSSProperties` 没有索引签名，
  //    而 hook 的入参是 `Record<string, string | number>`（`popupStyle` 的语义面）。
  popupStyle: () => props.popupStyle as Record<string, string | number> | undefined,
  // ⚠️ `as never`：本仓既有约定，用于「跨组件 props 表逐字同形但 TS 逆变判定过严」
  //    （PITFALLS 137 同族，`DatePicker.vue` 用的是同一个写法）。
  //    这里的具体冲突是 `onSelect`：本组件按上游收窄成单值 `(value: Dayjs) => void`，
  //    而 hook 的 `PickerCommonProps` 是 `(date: Dayjs | Dayjs[]) => void`。
  props: semanticProps as never,
});

// ============================== 转发给内层 ==============================
/**
 * 上游 `<InternalTimePicker {...restProps} mode={undefined} … />` 的 `restProps`
 * —— 即「除 `addon` / `renderExtraFooter` / `variant` / `bordered` / `classNames` /
 * `styles` / `popupClassName` / `popupStyle` 之外的一切」。
 *
 * 🚨 解构掉的这 8 个键**都不是随手剔的**：前两个并入 `renderExtraFooter`、
 * `variant` 已合并、后三个是「必须吞掉」的那组（见文件头第 3 条）、
 * `classNames` / `styles` 换成合并结果从模板显式传。
 * `mode` 额外丢弃（文件头第 4 条）。
 *
 * ⚠️ `attrs` 放**最后** —— 事件监听（`onChange` / `onOk` / …）与 `class` / `style`
 * 都在里面，后写者胜。
 */
const forwardProps = computed<Record<string, unknown>>(() => {
  const {
    addon: _addon,
    renderExtraFooter: _renderExtraFooter,
    variant: _variant,
    bordered: _bordered,
    classNames: _classNames,
    styles: _styles,
    popupClassName: _popupClassName,
    popupStyle: _popupStyle,
    mode: _mode,
    defaultValue,
    ...rest
  } = props;
  return {
    ...rest,
    // `attrs` 必须转发 —— 用户传的 `onChange` / `onOk` / `onOpenChange` … 全在这里。
    // ⚠️ 本组件**不声明 `defineEmits`**（见文件头第 5 条），所以内层的 `emit('change')`
    //    要靠它出现在内层的 `vnode.props` 里，才会调到用户的 `onChange`。
    ...attrs,
    // 🚨 `defaultValue` 单独处理：上游的类型是 `Dayjs | null`，而本仓
    //    `DatePickerProps['defaultValue']` 只收 `Dayjs | Dayjs[]`（不含 `null`）。
    //    `null` 的语义就是「没有初值」⇒ 归一成 `undefined`（**不**塞 `null`，
    //    否则 `toDateArray(null)` 会拿到一个非法值）。
    defaultValue: defaultValue ?? undefined,
    // 🚨 **`picker: 'time'` 必须显式补上** —— `TimePickerProps` 把 `picker` 剔除了
    //    （上游同判），所以它**不在** `props` 里、`forwardProps` 自然带不上；
    //    而内层 `DatePicker.vue` 的默认是 `'date'` ⇒ 不补这一行，本组件会渲染成
    //    **日期面板**（G5 的 L1 用例抓到的真 bug：`.apollo-picker-time-panel` 不存在）。
    //    ⚠️ 放在**最后**：万一将来 `TimePickerProps` 收回了 `picker`，也不许用户覆盖。
    picker: 'time',
  };
});

/**
 * 插槽转发。
 *
 * ⚠️ **上游没有插槽**（`addon` / `renderExtraFooter` 都是函数 prop），
 * 但本仓的 `date-picker` 为每个函数 prop 提供了插槽等价物
 * （见 `DatePickerSlots`）⇒ 显式列出**已知的 9 个**，
 * 不 `v-bind="slots"` —— 那样会把用户误传的 `default` 一并灌进去。
 */
const FORWARDED_SLOTS = [
  'panelRender',
  'extraFooter',
  'cellRender',
  'tagRender',
  'prefix',
  'suffixIcon',
  'clearIcon',
  'separator',
  'presetRender',
] as const;

const forwardSlots = computed(() => {
  const result: Record<string, unknown> = {};
  for (const name of FORWARDED_SLOTS) {
    const slot = slots[name];
    if (slot) result[name] = slot;
  }
  return result;
});
</script>

<template>
  <DatePicker
    v-bind="forwardProps"
    v-slots="forwardSlots"
    :variant="mergedVariant"
    :class-names="mergedClassNames"
    :styles="mergedStyles"
    :render-extra-footer="internalRenderExtraFooter"
  />
</template>
