<script setup lang="ts">
/**
 * TimeRangePicker —— antd `time-picker/index.tsx` 的 `RangePicker`（**只有 3 行**）的 Vue 版。
 *
 * ```jsx
 * const RangePicker = forwardRef((props, ref) => (
 *   <InternalRangePicker {...props} picker="time" mode={undefined} ref={ref} />
 * ));
 * ```
 *
 * ── 🚨 它与单个 `TimePicker` 的**三处**关键差别（都实测过，见分析 §2.2 / §2.4）────
 *
 * 1. **外层不解构任何 prop** ⇒ `bordered` / `popupClassName` / `popupStyle` /
 *    `onSelect` **全部原样透传**给内层，由内层（命名空间 `DatePicker.RangePicker`）
 *    发废弃告警。
 *    ⚠️ 这与单个 `TimePicker` **正好相反**（那边必须吞掉那三个）—— 是本组件最容易
 *    「顺手照抄单个的写法」而写错的一处，L1 有断言钉住。
 * 2. **没有 `variant` 合并** —— 内层 `RangePicker.vue` 用
 *    `useVariant({ component: 'rangePicker' })`，读的是 `components.rangePicker`。
 * 3. **`separator` 读 `rangePicker.separator`**（内层自己处理），与 `timePicker` 无关。
 *
 * ── 仍然要改道的两件事 ────────────────────────────────────────────────────────
 *
 * - **配置键**：内层 `RangePicker.vue` 的 `pickerType = picker === TIME ? 'timePicker' : 'datePicker'`
 *   ⇒ 传了 `picker="time"` 之后它读 `timePicker` 那份语义配置。本仓内层是硬编码的
 *   ⇒ 用 `pickerHostContextKey` 把配置键改成 `timePicker`。
 * - **`picker="time"`**：上游写在 `{...props}` **之后**（用户传的 `picker` 会被覆盖）；
 *   `TimeRangePickerProps` 本来就 `Omit<'picker'>`，所以本仓靠「不声明该 prop」
 *   让它落进 `attrs`，再由显式的 `picker: 'time'`（放在 `...attrs` **之后**）覆盖。
 * - **`mode` 丢弃**：上游 `mode={undefined}`；本仓 `RangePicker.vue` 的 `mode`
 *   不在 `withDefaults` 里 ⇒ 不转发就等于 `undefined`。
 *
 * ⚠️ **不覆盖 `warningName`** —— 实测 `TimePicker.RangePicker` 的废弃告警前缀仍是
 * `[antd: DatePicker.RangePicker]`（不是 `[antd: TimePicker]`）。
 */

import { computed, provide, useAttrs, useSlots } from 'vue';
import { pickerHostContextKey } from '../_internal/picker-host-context';
import RangePicker from '../date-picker/RangePicker.vue';
import type { TimeRangePickerProps } from './interface';

defineOptions({ name: 'ATimeRangePicker', inheritAttrs: false });

/**
 * 🚨 与 `TimePicker.vue` 同一判据（PLAN.md 避坑清单第 5 条）：Boolean prop 未传时
 * Vue 会强制成 `false` ⇒ `bordered` 变 `false` ⇒ 默认渲染成 `-borderless`。
 * 清单与 `RangePicker.vue` 逐项对齐（去掉本组件没有的 `showTime`）。
 */
const props = withDefaults(defineProps<TimeRangePickerProps>(), {
  open: undefined,
  defaultOpen: undefined,
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
  allowEmpty: undefined,
  previewValue: undefined,
  presets: undefined,
  ranges: undefined,
});
const attrs = useAttrs();
const slots = useSlots();

// ============================== 宿主上下文改道 ==============================
/** ⚠️ **只改 `configKey`** —— 告警命名空间恒为内层的 `'DatePicker.RangePicker'`（实测）。 */
provide(pickerHostContextKey, { configKey: 'timePicker' });

// ============================== 转发给内层 ==============================
/**
 * 上游的 `{...props} picker="time" mode={undefined}`。
 *
 * - `mode` 解构掉（= `undefined`，见文件头）；
 * - `picker: 'time'` 写在**最后** ⇒ 压过 `attrs` 里用户可能传的 `picker`；
 * - `attrs` 在 `picker` **之前** ⇒ 事件监听（`onChange` / `onOk` / …）与
 *   `class` / `style` 原样进去，而 `picker` 不被用户覆盖。
 */
const forwardProps = computed<Record<string, unknown>>(() => {
  const { mode: _mode, ...rest } = props;
  return {
    ...rest,
    // ⚠️ `attrs` 必须转发（本组件不声明 `defineEmits`，见文件头）——
    //    用户传的 `onChange` / `onOk` / … 全在这里；`picker` 写在**最后**压过它。
    ...attrs,
    picker: 'time',
  };
});

/** 插槽转发（与单个 `TimePicker` 同一份清单，见那边的说明）。 */
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

/** 实际提供了的插槽名（见 `TimePicker.vue` 的同名说明：`v-slots` 是 JSX-only 的）。 */
const forwardedSlotNames = computed(() => FORWARDED_SLOTS.filter((name) => Boolean(slots[name])));
</script>

<template>
  <RangePicker v-bind="forwardProps">
    <template v-for="name in forwardedSlotNames" :key="name" #[name]="slotProps">
      <component :is="slots[name]" v-bind="slotProps ?? {}" />
    </template>
  </RangePicker>
</template>
