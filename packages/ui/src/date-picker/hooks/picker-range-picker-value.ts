/**
 * 范围选择器的**浏览值**（上游 `PickerInput/hooks/useRangePickerValue.js`，157 行）。
 *
 * ── 它管什么 ─────────────────────────────────────────────────────────────────
 *
 * 「两个面板各自在看哪一段」—— 与**选中值**（`calendarValue`）是两回事。
 * 两个独立的「受控 / 非受控」值（上游两个 `useControlledState`）：
 *
 * | 值 | 受控 prop | 非受控初值 |
 * |---|---|---|
 * | 左面板浏览值 | `pickerValue[0]` | `defaultPickerValue[0] ?? calendarValue[0] ?? now` |
 * | 右面板浏览值 | `pickerValue[1]` | `defaultPickerValue[1] ?? calendarValue[1] ?? now` |
 *
 * 只有**当前活动端**（`activeIndex`）那一个会被读写 —— 另一个只在
 * 「强切换」时被读（见下面 effect 1 的第 2 支）。
 *
 * ── 🚨 四条「读源码才知道」的判据 ─────────────────────────────────────────────
 *
 * 1. **`activeIndex` 为 `null` 时按 `0` 算**（`activeIndex || 0`）——
 *    不这么做会取到 `undefined` 的浏览值，面板直接空白。
 * 2. **时间值要 `fillTime` 合并**（`:56`）：`pickerValue` 只给「哪一天」，
 *    时间部分从 `showTime.defaultValue` 借。**纯时间选择器例外**（它本身就是时间）。
 * 3. 🚨 **effect 1 的四段优先级**（`:111-120`）—— 「打开时该跳到哪一屏」：
 *    ```
 *    ① 从另一个 field 切过来（preserveOnFieldChange） ⇒ **保持不动**（用对面那一个）
 *    ② 当前端有值                                     ⇒ 用它（右端还要过 getEndDatePickerValue）
 *    ③ 当前端没值但对面有                             ⇒ 用对面的
 *    ④ 都没有                                         ⇒ now
 *    ```
 *    ① **优先于** ② —— 这条最容易写反（直觉上「有值就用值」更合理，但那会让
 *    「切到另一端」时面板猛地跳走）。
 * 4. 🚨 **`minDate` / `maxDate` 的夹取要看 `multiplePanel`**（`:130-133`）：
 *    双面板下夹取要**多留一屏**（`offsetPanelDate(…, ±1)`），否则右面板会越界。
 *    单面板直接用边界值。
 *
 * ⚠️ `getEndDatePickerValue` / `offsetPanelDate` 是 `@apollo-design/picker` 的
 * **纯函数**（S5 前置已导出并测过），本文件只做调度。
 */
import {
  fillTime,
  type GenerateConfig,
  getEndDatePickerValue,
  isSame,
  offsetPanelDate,
  type PickerMode,
} from '@apollo-design/picker';
import { type ComputedRef, computed, ref, watch } from 'vue';
import type { DatePickerDate, DatePickerPanelMode } from '../interface';

/** 浏览值变化的来源（上游 `source`）。 */
export type PickerValueSource = 'panel' | 'reset';

export interface RangePickerValueChangeInfo {
  source: PickerValueSource;
  range: 'start' | 'end';
  mode: readonly DatePickerPanelMode[];
}

export interface UseRangePickerValueOptions {
  generateConfig: GenerateConfig<DatePickerDate>;
  locale: () => { locale: string };
  calendarValue: () => readonly (DatePickerDate | null | undefined)[];
  /** 两端的面板粒度（上游的 `modes`）。 */
  modes: () => readonly DatePickerPanelMode[];
  open: () => boolean;
  /** 上游 `preserveOnFieldChange`（范围恒为 `true`）。 */
  preserveOnFieldChange: () => boolean;
  activeIndex: () => number | null;
  pickerMode: () => PickerMode | undefined;
  multiplePanel: () => boolean;
  defaultPickerValue: () => readonly (DatePickerDate | null | undefined)[] | undefined;
  pickerValue: () => readonly (DatePickerDate | null | undefined)[] | undefined;
  /** `showTime.defaultValue`（本仓 `RangeTimeProps.defaultOpenValue`）。 */
  timeDefaultValue: () => readonly (DatePickerDate | null | undefined)[] | undefined;
  onPickerValueChange:
    | ((values: (DatePickerDate | null)[], info: RangePickerValueChangeInfo) => void)
    | undefined;
  minDate: () => DatePickerDate | undefined;
  maxDate: () => DatePickerDate | undefined;
}

export interface UseRangePickerValueResult {
  /** 当前活动端的浏览值（已合并时间）。 */
  currentPickerValue: ComputedRef<DatePickerDate | null>;
  /** 写浏览值（`source` 默认 `'panel'`）。 */
  setCurrentPickerValue: (next: DatePickerDate, source?: PickerValueSource) => void;
}

export function useRangePickerValue(
  options: UseRangePickerValueOptions,
): UseRangePickerValueResult {
  const g = options.generateConfig;
  const isTimePicker = (): boolean => options.pickerMode() === 'time';

  /** 上游 `mergedActiveIndex`：`activeIndex || 0`（判据 1）。 */
  const mergedActiveIndex = computed(() => options.activeIndex() ?? 0);

  // ======================== 非受控初值 ========================
  const getDefaultPickerValue = (index: number): DatePickerDate => {
    let now = g.getNow();
    if (isTimePicker()) {
      now = fillTime(g, now);
    }
    const values = options.calendarValue();
    const calendarDate = values[index];
    const dpv = options.defaultPickerValue();
    return (
      (dpv?.[index] as DatePickerDate | null) || (calendarDate as DatePickerDate | null) || now
    );
  };

  const innerStart = ref<DatePickerDate>(getDefaultPickerValue(0));
  const innerEnd = ref<DatePickerDate>(getDefaultPickerValue(1));

  /** 受控值（`undefined` ⇒ 非受控）。 */
  const startControlled = computed(() => options.pickerValue()?.[0]);
  const endControlled = computed(() => options.pickerValue()?.[1]);

  const mergedStart = computed<DatePickerDate>(
    () => (startControlled.value as DatePickerDate | null) ?? innerStart.value,
  );
  const mergedEnd = computed<DatePickerDate>(
    () => (endControlled.value as DatePickerDate | null) ?? innerEnd.value,
  );

  // ======================== 当前浏览值 ========================
  const currentPickerValue = computed<DatePickerDate | null>(() => {
    const index = mergedActiveIndex.value;
    const current = index === 0 ? mergedStart.value : mergedEnd.value;
    // 判据 2：时间值合并（纯时间选择器例外）
    return isTimePicker()
      ? current
      : fillTime(g, current, options.timeDefaultValue()?.[index] ?? undefined);
  });

  const setCurrentPickerValue = (
    next: DatePickerDate,
    source: PickerValueSource = 'panel',
  ): void => {
    const index = mergedActiveIndex.value;
    // 受控 ⇒ 只发事件，不写内部状态（`useControlledState` 的语义）
    if (index === 0) {
      if (startControlled.value === undefined) {
        innerStart.value = next;
      }
    } else if (endControlled.value === undefined) {
      innerEnd.value = next;
    }

    const clone: (DatePickerDate | null)[] = [mergedStart.value, mergedEnd.value];
    clone[index] = next;

    const locale = options.locale();
    const pickerMode = (options.pickerMode() ?? 'date') as PickerMode;
    if (
      options.onPickerValueChange &&
      (!isSame(g, locale, mergedStart.value, clone[0] as DatePickerDate, pickerMode) ||
        !isSame(g, locale, mergedEnd.value, clone[1] as DatePickerDate, pickerMode))
    ) {
      options.onPickerValueChange(clone, {
        source,
        range: index === 1 ? 'end' : 'start',
        mode: options.modes(),
      });
    }
  };

  // ======================== Effect 1：打开时定位 ========================
  /** 上一轮的 `activeIndex`（只在**一次连续的聚焦会话**里有效，见 effect 2）。 */
  const prevActiveIndex = ref<number | null>(null);

  watch(
    () => [
      options.open(),
      options.preserveOnFieldChange(),
      mergedActiveIndex.value,
      options.calendarValue()[mergedActiveIndex.value],
    ],
    () => {
      if (!options.open()) {
        return;
      }
      const index = mergedActiveIndex.value;
      const dpv = options.defaultPickerValue();
      if (dpv?.[index]) {
        return;
      }
      const values = options.calendarValue();
      const activeCalendarValue = values[index];
      const inactiveCalendarValue = values[index === 0 ? 1 : 0];

      let nextPickerValue: DatePickerDate | null = isTimePicker() ? null : g.getNow();

      // 判据 3 的①：从另一个 field 切过来 ⇒ 保持不动
      if (
        options.preserveOnFieldChange() &&
        prevActiveIndex.value !== null &&
        prevActiveIndex.value !== index
      ) {
        nextPickerValue = (index === 0 ? mergedEnd.value : mergedStart.value) as DatePickerDate;
      } else if (activeCalendarValue) {
        // ② 当前端有值
        nextPickerValue =
          index === 0
            ? (activeCalendarValue as DatePickerDate)
            : (getEndDatePickerValue(
                g,
                options.locale(),
                (options.pickerMode() ?? 'date') as PickerMode,
                options.multiplePanel(),
                values[0] as DatePickerDate | null,
                values[1] as DatePickerDate | null,
              ) as DatePickerDate | null);
      } else if (inactiveCalendarValue) {
        // ③ 当前端没值但对面有
        nextPickerValue = inactiveCalendarValue as DatePickerDate;
      }

      if (!nextPickerValue) {
        return;
      }

      // 判据 4：min / max 夹取（双面板多留一屏）
      const pickerMode = (options.pickerMode() ?? 'date') as PickerMode;
      const multiplePanel = options.multiplePanel();
      const minDate = options.minDate();
      if (minDate && g.isAfter(minDate, nextPickerValue)) {
        nextPickerValue = minDate;
      }
      const offsetPickerValue = multiplePanel
        ? offsetPanelDate(g, pickerMode, nextPickerValue, 1)
        : nextPickerValue;
      const maxDate = options.maxDate();
      if (maxDate && g.isAfter(offsetPickerValue, maxDate)) {
        nextPickerValue = multiplePanel ? offsetPanelDate(g, pickerMode, maxDate, -1) : maxDate;
      }

      setCurrentPickerValue(nextPickerValue, 'reset');
    },
    { immediate: true, flush: 'post' },
  );

  // ======================== Effect 2：记录上一轮的活动端 ========================
  watch(
    () => [options.open(), options.preserveOnFieldChange(), mergedActiveIndex.value],
    () => {
      if (options.open() && options.preserveOnFieldChange()) {
        prevActiveIndex.value = mergedActiveIndex.value;
      } else {
        prevActiveIndex.value = null;
      }
    },
    { immediate: true },
  );

  // ======================== Effect 3：defaultPickerValue 同步 ========================
  watch(
    () => [options.open(), mergedActiveIndex.value],
    () => {
      if (!options.open()) {
        return;
      }
      const dpv = options.defaultPickerValue();
      const value = dpv?.[mergedActiveIndex.value];
      if (value) {
        setCurrentPickerValue(value as DatePickerDate, 'reset');
      }
    },
    { flush: 'post' },
  );

  return { currentPickerValue, setCurrentPickerValue };
}
