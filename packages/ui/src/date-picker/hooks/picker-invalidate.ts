/**
 * 「这个日期能不能选」的两层判定（上游 `useDisabledBoundary.js` 19 行 +
 * `useInvalidate.js` 57 行）。
 *
 * ── 为什么两层 ───────────────────────────────────────────────────────────────
 *
 * | 层 | 输入 | 产出 | 谁用 |
 * |---|---|---|---|
 * | ① `useDisabledBoundary` | `disabledDate` + `minDate` + `maxDate` | **合并后**的禁用判定 | 面板的 `disabledDate` / 提交校验的输入 |
 * | ② `useInvalidate` | ① + `generateConfig.isValidate` + `showTime.disabledTime` | 「这个值**无效**」 | `OK` 按钮禁用 / 提交校验 |
 *
 * 上游 `useFilledProps.js:115-118` 就是这两行连着写的，且 ① 的产物
 * **同时**被用作 `mergedProps.disabledDate`（`:125`）—— 所以面板拿到的不是
 * 用户裸的 `disabledDate`，而是**合并了 min/max 的**那一个。
 *
 * ── 🚨 三条「读源码才知道」的判据 ─────────────────────────────────────────────
 *
 * 1. **① 的 min/max 判定带 `isSame` 例外**：`minDate > date` 时还要再确认
 *    「不是同一个粒度单位」才算越界 —— 即 `minDate` 那一天**本身可选**
 *    （`useDisabledBoundary.js:11-15`）。少了这个例外，`minDate={今天}` 会把今天也禁掉。
 * 2. **② 传给用户 `disabledDate` 的 `info` 里 `activeIndex` 被删掉**
 *    （`useInvalidate.js:12` 的 `delete outsideInfo.activeIndex`）——
 *    面板路径（`useRangeDisabledDate`）会传 `activeIndex`，校验路径**不传**。
 * 3. 🚨 **② 的 `type` 是 `props.picker`（原始），不是 `internalPicker`** ——
 *    `useFilledProps.js:118` 传的是解构出来的 `picker`。所以 `date + showTime`
 *    下用户收到的是 **`'date'`**，不是 `'datetime'`。
 *    ⚠️ 这与「`info.type` 是当前面板粒度」（`interface.ts` 的注释）**不矛盾**：
 *    面板路径传的是面板粒度，校验路径传的是组件粒度 —— 两条路径本来就不一样。
 *    ⚠️ 而 `useInvalidate.js:20` 的 `picker === 'date' || picker === 'time'`
 *    正是在利用「`props.picker` 不含 datetime」这一点：`date + showTime` 会走到
 *    `showTime.disabledTime` 那一支（因为原始 picker 就是 `'date'`）。
 */

import { type GenerateConfig, isSame } from '@apollo-design/picker';
import type {
  DatePickerDate,
  DatePickerPanelMode,
  DisabledDate,
  DisabledTimes,
} from '../interface';

/** 判定上下文（上游 `useInvalidate` 的 `info`）。 */
export interface InvalidateInfo {
  /** 面板粒度（校验路径传的是**组件粒度**，见文件头第 3 条）。 */
  type?: DatePickerPanelMode;
  /** 区间选择的「另一端」值。 */
  from?: DatePickerDate;
  /** 区间选择时是哪一端（**只在面板路径出现**，见文件头第 2 条）。 */
  activeIndex?: number;
}

/** 上游 `DisabledTimes`（`showTime.disabledTime` 的返回形状）。 */
export type { DisabledTimes };

export interface UseDisabledBoundaryOptions {
  generateConfig: GenerateConfig<DatePickerDate>;
  locale: () => { locale: string };
  disabledDate: () => DisabledDate | undefined;
  minDate: () => DatePickerDate | undefined;
  maxDate: () => DatePickerDate | undefined;
}

/**
 * ① 把 `disabledDate` 与 `minDate` / `maxDate` 合并成**一个**判定
 * （上游 `useDisabledBoundary.js`）。
 *
 * ⚠️ 返回的是**普通函数**（不是 `computed` 的产物）：它会被传给面板、状态机、
 * 校验器三处，各处调用时机不同。上游用 `useEvent` 只为「引用稳定」，
 * 本仓不需要（没有把它放进依赖数组的地方）。
 */
export function useDisabledBoundary(
  options: UseDisabledBoundaryOptions,
): (date: DatePickerDate, info: InvalidateInfo) => boolean {
  return (date, info) => {
    const disabledDate = options.disabledDate();
    if (disabledDate?.(date, info as never)) {
      return true;
    }
    const locale = options.locale();
    const minDate = options.minDate();
    // 🚨 带 `isSame` 例外（文件头第 1 条）：`minDate` 那一天本身**可选**
    if (
      minDate &&
      options.generateConfig.isAfter(minDate, date) &&
      !isSame(options.generateConfig, locale, minDate, date, (info.type ?? 'date') as never)
    ) {
      return true;
    }
    const maxDate = options.maxDate();
    if (
      maxDate &&
      options.generateConfig.isAfter(date, maxDate) &&
      !isSame(options.generateConfig, locale, maxDate, date, (info.type ?? 'date') as never)
    ) {
      return true;
    }
    return false;
  };
}

export interface UseInvalidateOptions extends UseDisabledBoundaryOptions {
  /**
   * 🚨 **原始** `picker`（不是 `internalMode`）—— 见文件头第 3 条。
   * 它同时决定「要不要查 `showTime.disabledTime`」。
   *
   * ⚠️ 用 `DatePickerPanelMode` 而不是 `string`：`mergedPicker` 就是
   * `PickerMode`（`props.picker ?? 'date'`），收窄后 `outsideInfo.type`
   * 不需要任何断言。见 `useInvalidate` 里 `outsideInfo` 的写法。
   */
  picker: () => DatePickerPanelMode | undefined;
  /** 合并后的 `showTime`（含 `disabledTime` 与三个 legacy 通道）。 */
  showTime: () => Record<string, unknown> | undefined;
  /** ① 的产物。 */
  boundaryDate: (date: DatePickerDate, info: InvalidateInfo) => boolean;
}

/**
 * ② 「这个值**无效**」（上游 `useInvalidate.js`）。
 *
 * 三支，**任一命中即为无效**：
 * 1. 日期对象本身非法（`generateConfig.isValidate` 为假）；
 * 2. 被 ① 判为禁用；
 * 3. `picker` 是 `'date'` / `'time'` **且**配了 `showTime` 时，落在
 *    `disabledTime` / legacy `disabledHours` 三兄弟的禁用项里。
 *
 * ⚠️ 第 3 支**不覆盖 `picker: 'month' / 'year' / …`** —— 上游就是这么写的
 * （`useInvalidate.js:20`），本仓照抄。
 */
export function useInvalidate(
  options: UseInvalidateOptions,
): (date: DatePickerDate, info: InvalidateInfo) => boolean {
  return (date, info) => {
    const generateConfig = options.generateConfig;
    const picker = options.picker();

    // ① 日期对象本身非法
    if (!generateConfig.isValidate(date)) {
      return true;
    }

    // ② 禁用（含 disabledDate + min/max）
    //    🚨 传给用户函数的 `info` **不含 activeIndex**（文件头第 2 条）
    //
    //    写法逐字对齐上游 `const outsideInfo = { type: picker, ...info }`：
    //    `type` 只是**兜底**，`info.type` 一旦存在（哪怕是显式的 `undefined`）
    //    就会被 spread 覆盖回去。这不是笔误 —— 上游就是这么写的。
    const outsideInfo: InvalidateInfo = { type: picker, ...info };
    delete outsideInfo.activeIndex;
    if (options.boundaryDate(date, outsideInfo)) {
      return true;
    }

    // ③ 时间禁用
    const showTime = options.showTime();
    if ((picker === 'date' || picker === 'time') && showTime) {
      const range: 'start' | 'end' = info.activeIndex === 1 ? 'end' : 'start';
      const from = outsideInfo.from;
      const timeDisabled = (
        showTime.disabledTime as
          | ((d: DatePickerDate, r: 'start' | 'end', i: { from?: DatePickerDate }) => DisabledTimes)
          | undefined
      )?.(date, range, { from });

      const mergedDisabledHours =
        timeDisabled?.disabledHours ?? (showTime.disabledHours as (() => number[]) | undefined);
      const mergedDisabledMinutes =
        timeDisabled?.disabledMinutes ??
        (showTime.disabledMinutes as ((hour: number) => number[]) | undefined);
      const mergedDisabledSeconds =
        timeDisabled?.disabledSeconds ??
        (showTime.disabledSeconds as ((hour: number, minute: number) => number[]) | undefined);
      // ⚠️ `disabledMilliseconds` **没有** legacy 通道（上游如此）
      const disabledMilliseconds = timeDisabled?.disabledMilliseconds;

      const hour = generateConfig.getHour(date);
      const minute = generateConfig.getMinute(date);
      const second = generateConfig.getSecond(date);
      const millisecond = generateConfig.getMillisecond(date);

      if (mergedDisabledHours?.().includes(hour)) {
        return true;
      }
      if (mergedDisabledMinutes?.(hour).includes(minute)) {
        return true;
      }
      if (mergedDisabledSeconds?.(hour, minute).includes(second)) {
        return true;
      }
      if (disabledMilliseconds?.(hour, minute, second).includes(millisecond)) {
        return true;
      }
    }

    return false;
  };
}
