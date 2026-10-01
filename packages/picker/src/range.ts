/**
 * 区间选择的**纯判定**部分。
 *
 * ⚠️ **没有 Oracle**：上游 `es/PickerInput/hooks/useRangeValue.js` 绑
 * `useSyncState` / `useEffect` / `useControlledState` ⇒ 不能对拍。
 * 这里是把它的**判定逻辑**抽成纯函数，调度（`flushSubmit` 只同步一个槽位等）
 * 仍属 `ui` 层。依据见契约 §3.6。
 */

import { isSame, isSameTimestamp } from './date-util';
import type { GenerateConfig, PanelMode, PickerLocale, PickerMode } from './types';

/**
 * 把浏览值按**当前粒度**推一个面板宽。
 *
 * 上游 `useRangePickerValue.js:4-19`（逐字）。用于双面板：右面板的浏览值 =
 * 左面板的浏览值 `offset = 1`。
 *
 * ⚠️ 映射关系是「一个面板占多少」而不是「一个单位」：
 * 日/周面板一屏是**月**、月/季面板一屏是**年**、年面板一屏是**十年**、
 * 十年面板一屏是**百年**。写成「+1 天 / +1 月」会让两个面板叠在同一个月上。
 *
 * ⚠️ `default` 分支（`time` 之外的未知粒度）**原样返回**，
 * 所以纯时间选择器上双面板不会偏移 —— 上游如此。
 *
 * ⚠️ 参数类型是 **`PanelMode`（不是 `PickerMode`）**：`PickerMode` 是
 * `Exclude<PanelMode, 'decade'>`（见 `types.ts:19`，decade 只是中间层、不能被直接选取），
 * 而上游这个 switch **明确覆盖了 `'decade'`**。用 `PickerMode` 会让那一支变成
 * TS 眼里的死分支（`TS2678`），运行时却仍可能被传进来。
 * 传 `PickerMode` 的调用方照样合法（它是 `PanelMode` 的子集）。
 */
export function offsetPanelDate<DateType>(
  generateConfig: GenerateConfig<DateType>,
  picker: PanelMode,
  date: DateType,
  offset: number,
): DateType {
  switch (picker) {
    case 'date':
    case 'week':
      return generateConfig.addMonth(date, offset);
    case 'month':
    case 'quarter':
      return generateConfig.addYear(date, offset);
    case 'year':
      return generateConfig.addYear(date, offset * 10);
    case 'decade':
      return generateConfig.addYear(date, offset * 100);
    default:
      return date;
  }
}

/**
 * 两个日期是否落在**同一屏面板**里（上游 `useRangePickerValue.js:75-81`）。
 *
 * ⚠️ 年粒度要按**十年**比较（`Math.floor(year / 10)`），不是按年 ——
 * 年面板一屏是十年。
 * ⚠️ 日/周按**月**比，月/季按**年**比（`panelMode` 那一行）。
 */
export function isSamePanel<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: PickerLocale,
  pickerMode: PickerMode,
  date1: DateType,
  date2: DateType,
): boolean {
  if (pickerMode === 'year') {
    return (
      Math.floor(generateConfig.getYear(date1) / 10) ===
      Math.floor(generateConfig.getYear(date2) / 10)
    );
  }
  const panelMode = pickerMode === 'month' || pickerMode === 'quarter' ? 'year' : 'month';
  return isSame(generateConfig, locale, date1, date2, panelMode);
}

/**
 * 右面板该浏览到哪一天（上游 `useRangePickerValue.js:86-93`，逐字）。
 *
 * 规则：**尽量让两个值同时出现在双面板里**。
 *   - 单面板 / 没有 start ⇒ 原样返回 `endDate`；
 *   - `end` 已经在「start 那一屏」或「start +1 屏」里 ⇒ 右面板就用 `start`（两值同屏）；
 *   - 否则把右面板**退一屏**（`endDate` 的 `-1`）——让 end 出现在右面板上。
 *
 * ⚠️ 第三步是 `-1` 而不是 `endDate` 本身：右面板的浏览值语义是「右面板**左边界**
 * 那一屏」，直接用 `endDate` 会让 end 落到**再下一屏**、右面板上根本看不到它。
 */
export function getEndDatePickerValue<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: PickerLocale,
  pickerMode: PickerMode,
  multiplePanel: boolean,
  startDate: DateType | null | undefined,
  endDate: DateType | null | undefined,
): DateType | null | undefined {
  // ⚠️ **对上游的一处有意加强**：上游只守 `multiplePanel` 与 `startDate` 两道
  //    （`useRangePickerValue.js:87`），**不守 `endDate`**。本仓多守一道 `endDate`，理由两条：
  //      1. **行为上不可达**：唯一的调用点在 `else if (activeCalendarValue)` 分支里，
  //         而 `activeIndex === 1` 时 `activeCalendarValue` 就是 `endDate`
  //         ⇒ 走到这里时 end 必有值；
  //      2. **类型上必须**：不守的话 TS 会把 `isSamePanel` 的泛型推成
  //         `DateType | null | undefined`，进而要求 `generateConfig` 也放宽 ——
  //         那会让 `getYear` 收到 `null`（`GenerateConfig.getYear` 只接受 `DateType`）。
  //    ⇒ 这是「不可达路径上的防御」，不是行为差异；已在 README §2 登记。
  if (!multiplePanel || !startDate || !endDate) {
    return endDate;
  }
  const nextPanelDate = offsetPanelDate(generateConfig, pickerMode, startDate, 1);
  const endInPanels =
    isSamePanel(generateConfig, locale, pickerMode, startDate, endDate) ||
    isSamePanel(generateConfig, locale, pickerMode, nextPanelDate, endDate);
  return endInPanels ? startDate : offsetPanelDate(generateConfig, pickerMode, endDate, -1);
}

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
  isInvalidateDate: (date: DateType, info: { from?: DateType; activeIndex: number }) => boolean,
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
    (disabled[1] || !end || !isInvalidateDate(end, { from: start as DateType, activeIndex: 1 }));

  return {
    passed: input.nullValue || (emptyOk && orderOk && datesOk),
    emptyOk,
    orderOk,
    datesOk,
  };
}
