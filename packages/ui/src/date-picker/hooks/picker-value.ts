/**
 * 值状态机（G4 · S1）—— 上游 `@rc-component/picker` 的
 * `PickerInput/hooks/useRangeValue.js`（254 行）的 Vue 移植。
 *
 * 契约文档：`docs/analysis/date-picker.md` §6。判定细节**已固化在**
 * `@apollo-design/picker` 的 `range.ts`（`isSameDates` / `orderDates` /
 * `validateRangeSubmit`）—— 本文件只做**调度**，不重复判定。
 *
 * ── 上游把这件事拆成两层，为什么要跟 ────────────────────────────────────────
 *
 * ```
 * ① useInnerValue  ：值 = 受控 value / 非受控 innerValue；
 *                    另有 calendarValue（**界面上的临时值**）与它同步。
 *                    triggerCalendarChange 只改 calendarValue + 发 onCalendarChange。
 * ② useRangeValue  ：submitValue（待提交值）+ triggerSubmit
 *                    （四道校验后 setInnerValue + onChange）。
 * ```
 *
 * 「日历值」与「提交值」分离是**确认制的根基**：`needConfirm` 时点面板只动
 * `calendarValue`，点「确定」才 `triggerSubmit`。
 *
 * ── 🚨 三条移植时必须注意的语义翻转 ──────────────────────────────────────────
 *
 * 1. 🚨🚨 **比较必须在写入之前取快照**。上游写的是
 *    ```js
 *    if (allPassed) {
 *      setInnerValue(clone);
 *      const [isSameMergedDates] = isSameDates(clone, mergedValue);  // ← 闭包里的旧值
 *      if (onChange && !isSameMergedDates) onChange(…);
 *    }
 *    ```
 *    `mergedValue` 是**本次渲染的闭包常量**（旧值）。Vue 里 `mergedValue` 是
 *    `ComputedRef`（**活读**）⇒ 若照字面顺序写，`setInnerValue` 之后立刻读回的
 *    就是 `clone` ⇒ 比较恒为「相同」⇒ **`onChange` 永不触发**。
 *    ⇒ 本文件的纪律：`triggerSubmit` **入口先取 `prevMerged` 快照**。
 *    （`picker` 面板流踩过同一个坑，PITFALLS 207。）
 * 2. ⚠️ **`useSyncState` 的 getter 是函数**（`calendarValue()` / `submitValue()`），
 *    不是值。Vue 里用 `ref` + `.value` 等价 —— 但**别换成 `computed`**：
 *    那会让「写入后读回」立刻拿到新值，又回到第 1 条的坑。
 *    `calendarValue` 必须**可写**（面板点选直接写它）。
 * 3. ⚠️ **受控的「空」是 `null`，不是 `undefined`**：本组件里
 *    `value === undefined` ⇒ 非受控；`value === null` ⇒ 受控且为空。
 *    归一（`toDateArray`）在调用方给的 `getValue` 里做。
 *
 * ── 上游的 `EMPTY_VALUE` 共享常量 ────────────────────────────────────────────
 *
 * `const EMPTY_VALUE = []`，空值时 `mergedValue` 返回**同一个引用**（下游有
 * 基于引用的判断）。本仓同样共享一个**冻结**数组 —— 不冻结的话会被下游 `push` 污染
 * （受控值来自外部，污染它是 A 级 bug）。
 */

import { isSameDates, orderDates, validateRangeSubmit } from '@apollo-design/picker';
import { type ComputedRef, computed, type Ref, ref, watch } from 'vue';
import type { DatePickerDate, DatePickerMode, RangeValue } from '../interface';
import type { GenerateConfig, RcPickerLocale } from './picker-types';

/** 上游 `EMPTY_VALUE`：空值时共享的同一个数组（冻结，防下游污染受控值）。 */
export const EMPTY_VALUE: readonly DatePickerDate[] = Object.freeze(
  [],
) as readonly DatePickerDate[];

/**
 * 把「对外值」归一成内部的数组形态（`null` / `undefined` ⇒ 空数组）。
 *
 * 🚨 **元素级**的 `null` / `undefined` 一律收成 `null`（`?? null`）。
 *
 * 为什么需要这一步：范围的对外值 `RangeValue` 允许元素是 `undefined`
 * （「该端尚未选择」，与 `null`「用户清空了该端」语义不同，见 `interface.ts`），
 * 而**内部槽位**只有 `ValueSlot = DatePickerDate | null`。
 *
 * ⚠️ 这不是行为变更 —— 内部本来就区分不了它们，上游两处都把它们归一：
 *  - `isSameDates` 用 `prev = source[i] || null` 比较；
 *  - `triggerCalendarChange` 做 `clone[i] = clone[i] || null`。
 * 且上游 `onChange` 的**声明类型**就是 `NoUndefinedRangeValue`（不许 `undefined`）
 * ⇒ 这里只是把「运行时与声明一致」这件事在边界上说清楚。
 *
 * ⚠️ 单值路径不受影响：`SingleValue` 的元素本来就没有 `null` / `undefined`。
 */
export function toDateArray(
  value: DatePickerDate | DatePickerDate[] | RangeValue | null | undefined,
): ValueSlot[] {
  if (value === null || value === undefined) {
    return [];
  }
  const list: readonly (DatePickerDate | null | undefined)[] = Array.isArray(value)
    ? value
    : [value];
  return list.map((item) => item ?? null);
}

/** 一个槽位的值（`null` = 该槽位空）。 */
export type ValueSlot = DatePickerDate | null;

export interface UseInnerValueOptions {
  generateConfig: ComputedRef<GenerateConfig<DatePickerDate>>;
  /** 把值列表格式化成文本（`dateString`）。由调用方按已归一的 `format` 提供。 */
  getDateTexts: (dates: ValueSlot[]) => string[];
  /** 上游 `rangeValue`：`true` ⇒ 恒定两个槽位（RangePicker）。 */
  rangeValue: boolean;
  /** 仅 `multiple` 用：变化时按时间排序。 */
  order: ComputedRef<boolean>;
  /** 非受控初值（已归一成数组）。⚠️ `ValueSlot[]` 而不是 `DatePickerDate[]` —— 范围的空端是 `null`。 */
  defaultValue: ValueSlot[];
  /** 受控值；`undefined` ⇒ 非受控（**`null` 是「受控且为空」**）。 */
  getValue: () => ValueSlot[] | undefined;
  onCalendarChange?: (
    dates: ValueSlot[],
    texts: string[],
    info: { range?: 'start' | 'end' },
  ) => void;
  onOk?: (dates: ValueSlot[]) => void;
}

export interface InnerValueResult {
  /** 渲染一律用这个（上游注释：`It should always use mergedValue in render logic`）。 */
  mergedValue: ComputedRef<ValueSlot[]>;
  /** 写根值（受控时写 inner，父级未回传前渲染仍读受控值）。 */
  setInnerValue: (next: ValueSlot[]) => void;
  /** 界面上的临时值。**可写**（面板点选直接写它），别换成 computed。 */
  calendarValue: Ref<ValueSlot[]>;
  /** 改 `calendarValue` 并（值真变了才）发 `onCalendarChange`。 */
  triggerCalendarChange: (next: ValueSlot[]) => void;
  /** 发 `onOk`（带当前 `calendarValue`）。 */
  triggerOk: () => void;
}

/**
 * 上游 `useInnerValue`。
 *
 * ⚠️ 返回的 `calendarValue` 是 **`Ref` 而不是 `ComputedRef`** —— 它要被
 * 「面板点选」直接写，且**写入后不回流到受控值**。这是「临时值」语义。
 */
export function useInnerValue(options: UseInnerValueOptions): InnerValueResult {
  const { rangeValue, getValue, defaultValue, generateConfig: g } = options;

  // ── ① 根值：受控 `value` / 非受控 `innerValue` ──
  //
  // 与 `useControlledValue` 同构，但**手写而非复用**，理由有二：
  //   a. `useControlledValue` 的 `setValue` 会**回调 onChange**，而本组件里
  //      `onChange` 只在 `triggerSubmit` 校验通过后发（发早了会破坏确认制）；
  //   b. 受控/非受控的归一（`null` ⇒ `[]`、单值 ⇒ 单元素数组）要发生在 `getValue` 里，
  //      那是本 hook 的契约而非 `useControlledValue` 的。
  const inner = ref<ValueSlot[]>([...defaultValue]);
  const mergedValue = computed<ValueSlot[]>(() => {
    const controlled = getValue();
    return controlled !== undefined ? controlled : inner.value;
  });

  // 非首次的受控值变化 → 同步回 inner（对齐 `useControlledState` 的
  // 「control → un-control 时重置为 undefined」行为）
  watch(
    () => getValue(),
    (next) => {
      inner.value = next as ValueSlot[];
    },
  );

  const setInnerValue = (next: ValueSlot[]): void => {
    inner.value = next;
  };

  // ── ② calendarValue：初始 = mergedValue，随 mergedValue 变化重新同步 ──
  //
  // 上游 `useSyncState(mergedValue)` + `useEffect([mergedValue], syncWithValue)`。
  // ⚠️ 浅拷贝：上游传同一个引用，但那样「面板改了 calendarValue」会连带改到
  //    受控值数组（同一个引用）—— 本仓用拷贝隔断。
  const calendarValue = ref<ValueSlot[]>([...mergedValue.value]);
  watch(mergedValue, (next) => {
    calendarValue.value = [...next];
  });

  // ── ③ triggerCalendarChange ──
  const triggerCalendarChange = (nextCalendarValues: ValueSlot[]): void => {
    let clone: ValueSlot[] = [...nextCalendarValues];

    if (rangeValue) {
      // 范围恒定两个槽位（缺的补 null）
      for (let i = 0; i < 2; i += 1) {
        clone[i] = clone[i] || null;
      }
    } else if (options.order.value) {
      // 仅 `multiple`：过滤空值后按时间排序
      clone = orderDates(
        clone.filter((date): date is DatePickerDate => Boolean(date)),
        g.value,
      );
    }

    // 🚨 快照在写之前（见文件头第 1 条）
    const [isSameMergedDates, isSameStart] = isSameDates(g.value, calendarValue.value, clone);

    if (!isSameMergedDates) {
      calendarValue.value = clone;

      if (options.onCalendarChange) {
        // ⚠️ `isSameStart === true` ⇒ diffIndex === 0 ⇒ 变的是 start ⇒ 报 `'end'`
        options.onCalendarChange(clone, options.getDateTexts(clone), {
          range: isSameStart ? 'end' : 'start',
        });
      }
    }
  };

  const triggerOk = (): void => {
    options.onOk?.(calendarValue.value);
  };

  return { mergedValue, setInnerValue, calendarValue, triggerCalendarChange, triggerOk };
}

// ---------------------------------------------------------------------------
// ② 提交层（上游 `useRangeValue`）
// ---------------------------------------------------------------------------

export interface UseRangeValueOptions {
  generateConfig: ComputedRef<GenerateConfig<DatePickerDate>>;
  /** 面板侧的 locale（= antd locale 的 `locale.lang`，上游就是这样传的 —— `generateSinglePicker.js` 里 `locale: locale.lang`）。 */
  locale: ComputedRef<RcPickerLocale>;
  picker: ComputedRef<DatePickerMode>;
  /** `[允许 start 空, 允许 end 空]`；未给 ⇒ 两个都必须有值。 */
  allowEmpty: ComputedRef<readonly [boolean, boolean] | undefined>;
  order: ComputedRef<boolean>;
  /** 两个槽位各自的 disabled。 */
  disabledSlots: ComputedRef<readonly [boolean, boolean]>;
  /** 禁用的日期判定（上游 `isInvalidateDate`）。`activeIndex` 由本 hook 传。 */
  isInvalidateDate: (
    date: DatePickerDate,
    info: { from?: DatePickerDate; activeIndex: number },
  ) => boolean;
  onChange?: (dates: ValueSlot[] | null, texts: string[] | null) => void;
  getDateTexts: (dates: ValueSlot[]) => string[];
  inner: InnerValueResult;
}

export interface RangeValueResult {
  /** 待提交值（上游 `submitValue`）。 */
  submitValue: Ref<ValueSlot[]>;
  /** 把某个槽位从 `calendarValue` 落进 `submitValue`（`needTriggerChange` 时顺带提交）。 */
  flushSubmit: (index: number, needTriggerChange: boolean) => void;
  /**
   * 提交：四道校验通过则写根值 + 发 `onChange`。返回值 = 是否通过。
   *
   * ⚠️ 入参允许槽位是 `undefined` —— `toggleDates`（上游 `useToggleDates`）的返回
   * 类型就是 `(DateType | null | undefined)[]`，而 `presets` / 「此刻」那条路径
   * 正是把它的产物直接喂进来（上游 `onPresetSubmit`）。入口统一收成 `null`
   * （同 `toDateArray` 的元素级归一）。
   */
  triggerSubmit: (nextValue?: readonly (DatePickerDate | null | undefined)[] | null) => boolean;
  /** 回滚到根值（`index` 未给 ⇒ 全量回滚）。 */
  resetValue: (index?: number) => void;
}

/** 上游 `useRangeValue`。 */
export function useRangeValue(options: UseRangeValueOptions): RangeValueResult {
  const { inner, generateConfig: g } = options;
  const { getDateTexts } = options;

  const submitValue = ref<ValueSlot[]>([...inner.mergedValue.value]);
  watch(inner.mergedValue, (next) => {
    submitValue.value = [...next];
  });

  const triggerSubmit = (
    nextValue?: readonly (DatePickerDate | null | undefined)[] | null,
  ): boolean => {
    // 🚨 入口快照：入口时 `mergedValue` 就是「本次变更之前的值」
    //    （上游读的是闭包常量，语义相同）。**写在任何 setInnerValue 之前。**
    const prevMerged = [...inner.mergedValue.value];

    const isNullValue = nextValue === null;
    // 元素级归一：`undefined` ⇒ `null`（见 `triggerSubmit` 的说明）
    let clone: ValueSlot[] = [...(nextValue ?? submitValue.value)].map((date) => date ?? null);

    // 清除时把「非 disabled」的槽位补成 null
    if (isNullValue) {
      const maxLen = Math.max(options.disabledSlots.value.length, clone.length);
      for (let i = 0; i < maxLen; i += 1) {
        if (!options.disabledSlots.value[i]) {
          clone[i] = null;
        }
      }
    }

    // 两个槽位都有值时才排序（上游：`orderOnChange` 会被任一 disabled 关掉）
    const orderOnChange = options.disabledSlots.value.some((d) => d) ? false : options.order.value;
    if (orderOnChange && clone[0] && clone[1]) {
      clone = orderDates(clone as DatePickerDate[], g.value);
    }

    inner.triggerCalendarChange(clone);

    const [start, end] = clone;
    const allowEmpty = options.allowEmpty.value;
    const { passed } = validateRangeSubmit(
      {
        generateConfig: g.value,
        locale: options.locale.value,
        picker: options.picker.value,
        ...(allowEmpty ? { allowEmpty } : {}),
        order: options.order.value,
        disabled: options.disabledSlots.value,
        nullValue: isNullValue,
      },
      start,
      end,
      options.isInvalidateDate,
    );

    if (passed) {
      inner.setInnerValue(clone);
      // 🚨 与 `prevMerged`（入口快照）比，不是与活读的 `mergedValue` 比
      const [isSameMergedDates] = isSameDates(g.value, clone, prevMerged);

      if (options.onChange && !isSameMergedDates) {
        const everyEmpty = clone.every((val) => !val);
        // 全部为空时 `onChange` 直接给 `null`（上游逐字）
        options.onChange(
          isNullValue && everyEmpty ? null : clone,
          everyEmpty ? null : getDateTexts(clone),
        );
      }
    }

    return passed;
  };

  const flushSubmit = (index: number, needTriggerChange: boolean): void => {
    const nextSubmitValue = [...submitValue.value];
    nextSubmitValue[index] = inner.calendarValue.value[index] ?? null;
    submitValue.value = nextSubmitValue;
    if (needTriggerChange) {
      triggerSubmit();
    }
  };

  const resetValue = (index?: number): void => {
    if (index === undefined) {
      inner.triggerCalendarChange(inner.mergedValue.value);
      submitValue.value = [...inner.mergedValue.value];
      return;
    }
    const nextCalendar = [...inner.calendarValue.value];
    nextCalendar[index] = inner.mergedValue.value[index] ?? null;
    inner.triggerCalendarChange(nextCalendar);

    const nextSubmit = [...submitValue.value];
    nextSubmit[index] = inner.mergedValue.value[index] ?? null;
    submitValue.value = nextSubmit;
  };

  return { submitValue, flushSubmit, triggerSubmit, resetValue };
}
