/**
 * 区间选择的**纯判定**部分。
 *
 * ⚠️ **没有 Oracle**：上游 `es/PickerInput/hooks/useRangeValue.js` 绑
 * `useSyncState` / `useEffect` / `useControlledState` ⇒ 不能对拍。
 * 这里是把它的**判定逻辑**抽成纯函数，调度（`flushSubmit` 只同步一个槽位等）
 * 仍属 `ui` 层。依据见契约 §3.6。
 */

import { isSame, isSameTimestamp } from './date-util';
import type {
  GenerateConfig,
  PickerLocale,
  PickerMode,
} from './types';

/**
 * 按时间先后排序。
 *
 * ⚠️ 比较函数**只返回 1 或 -1，永不返回 0**（上游 `useRangeValue.js:52-54`）——
 * 相等时给 -1。照抄：改成 `0` 会改变某些引擎下相等元素的相对顺序。
 */
export function orderDates<DateType>(
  dates: readonly DateType[],
  generateConfig: GenerateConfig<DateType>,
): DateType[] {
  return [...dates].sort((a, b) => (generateConfig.isAfter(a, b) ? 1 : -1));
}

/**
 * 逐位比较两个值数组。
 *
 * 返回 `[全同, 起止位没变]`：
 *  - 第一个值决定要不要触发 `onChange`；
 *  - 第二个值决定 `onCalendarChange` 的 `info.range` 是 `'end'` 还是 `'start'`
 *    （`diffIndex === 0` ⇒ 变的是 start ⇒ 报 `'end'`）。
 */
export function isSameDates<DateType>(
  generateConfig: GenerateConfig<DateType>,
  source: readonly (DateType | null | undefined)[],
  target: readonly (DateType | null | undefined)[],
): [boolean, boolean] {
  const maxLen = Math.max(source.length, target.length);
  let diffIndex = -1;
  for (let i = 0; i < maxLen; i += 1) {
    const prev = source[i] || null;
    const next = target[i] || null;
    if (prev !== next && !isSameTimestamp(generateConfig, prev, next)) {
      diffIndex = i;
      break;
    }
  }
  return [diffIndex < 0, diffIndex !== 0];
}

export interface RangeSubmitInput<DateType> {
  generateConfig: GenerateConfig<DateType>;
  locale: PickerLocale;
  picker: PickerMode;
  /** `[允许 start 为空, 允许 end 为空]`。未给 ⇒ 两个都必须有值 */
  allowEmpty?: readonly [boolean, boolean];
  order: boolean;
  /** 两个输入框各自的 disabled 状态 */
  disabled: readonly [boolean, boolean];
  /** 点的是「清除」按钮（上游 `nextValue === null`）⇒ 直接放行 */
  nullValue: boolean;
}

export interface RangeValidateResult {
  passed: boolean;
  emptyOk: boolean;
  orderOk: boolean;
  datesOk: boolean;
}

/**
 * 提交前的四道校验（上游 `useRangeValue.js:177-208`）。
 *
 * ⚠️ 校验 end 时会把 `from: start` 传给 `isInvalidateDate` ——
 * 这是 `disabledDate` 的 `info.from` 的**唯一**来源，别省。
 */
export function validateRangeSubmit<DateType>(
  input: RangeSubmitInput<DateType>,
  start: DateType | null | undefined,
  end: DateType | null | undefined,
  isInvalidateDate: (
    date: DateType,
    info: { from?: DateType; activeIndex: number },
  ) => boolean,
): RangeValidateResult {
  const { generateConfig: g, locale, picker, allowEmpty, order, disabled } = input;

  const startEmpty = !start;
  const endEmpty = !end;

  const emptyOk = allowEmpty
    ? (!startEmpty || allowEmpty[0]) && (!endEmpty || allowEmpty[1])
    : true;

  const orderOk =
    !order ||
    startEmpty ||
    endEmpty ||
    isSame(g, locale, start, end, picker) ||
    g.isAfter(end as DateType, start as DateType);

  const datesOk =
    (disabled[0] || !start || !isInvalidateDate(start, { activeIndex: 0 })) &&
    (disabled[1] ||
      !end ||
      !isInvalidateDate(end, { from: start as DateType, activeIndex: 1 }));

  return {
    passed: input.nullValue || (emptyOk && orderOk && datesOk),
    emptyOk,
    orderOk,
    datesOk,
  };
}
