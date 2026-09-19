/**
 * `time-util` 对 `@rc-component/picker@1.12.2` 的
 * `es/PickerPanel/TimePanel/TimePanelBody/util.js` 差分。
 *
 * 上游该文件 **零 import** ⇒ 可对拍。
 *
 * ⚠️ `findValidateTime` 的档位表是**调用方传进来的**，本包不生产档位表
 * （那是 `disabledTime` → units 的换算，属 `ui` 层）。所以这里对拍的是
 * 「给定档位表时的对齐算法」，不是「档位表本身」。
 */

import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { findValidateTime } from '../time-util';
import { dayjsGenerateConfig as ourG } from '../generate/dayjs';
import upGenerateConfig from '../../oracle/upstream/generate-dayjs.js';
import { findValidateTime as upFindValidateTime } from '../../oracle/upstream/timePanelUtil.js';

/** 造一份档位表：`disabled` 由谓词决定。 */
function units(count: number, isDisabled: (value: number) => boolean) {
  const list: { value: number; disabled: boolean }[] = [];
  for (let i = 0; i < count; i += 1) {
    list.push({ value: i, disabled: isDisabled(i) });
  }
  return list;
}

/** 几种有代表性的禁用形状。 */
const SHAPES: ((value: number) => boolean)[] = [
  () => false,
  (v) => v % 2 === 1, // 隔一个禁一个
  (v) => v < 10, // 前段全禁
  (v) => v > 20, // 后段全禁
  () => true, // 全禁（走 `validateUnits[0]` 兜底）
];

const DATES: Dayjs[] = [
  dayjs(new Date(2026, 8, 19, 0, 0, 0, 0)),
  dayjs(new Date(2026, 8, 19, 13, 45, 30, 500)),
  dayjs(new Date(2026, 0, 1, 23, 59, 59, 999)),
  dayjs(new Date(1999, 5, 15, 7, 3, 2, 1)),
];

describe('time-util · Oracle 差分（@rc-component/picker@1.12.2）', () => {
  it('findValidateTime 逐位一致（5 种禁用形状 × 4 个日期）', () => {
    let compared = 0;
    for (const shape of SHAPES) {
      for (const date of DATES) {
        const hourUnits = () => units(24, shape);
        const minuteUnits = () => units(60, shape);
        const secondUnits = () => units(60, shape);
        const millisecondUnits = () => units(1000, shape);

        const ours = findValidateTime(
          date,
          hourUnits,
          minuteUnits,
          secondUnits,
          millisecondUnits,
          ourG,
        );
        const theirs = upFindValidateTime(
          date,
          hourUnits,
          minuteUnits,
          secondUnits,
          millisecondUnits,
          upGenerateConfig,
        );
        expect(ours.valueOf()).toBe(theirs.valueOf());
        compared += 1;
      }
    }
    expect(compared).toBe(SHAPES.length * DATES.length);
  });

  it('「后一级档位表依赖前一级结果」这条顺序契约被真的执行了', () => {
    const seen: number[] = [];
    const date = dayjs(new Date(2026, 8, 19, 13, 45, 30, 500));
    findValidateTime(
      date,
      () => units(24, () => false),
      (hour) => {
        seen.push(hour);
        return units(60, () => false);
      },
      () => units(60, () => false),
      () => units(1000, () => false),
      ourG,
    );
    // 小时没有被禁用 ⇒ 仍是 13
    expect(seen).toEqual([13]);
  });

  it('全禁时落到第一个可用档位（没有可用档位则原样返回）', () => {
    const date = dayjs(new Date(2026, 8, 19, 13, 45, 30, 500));
    const allDisabled = () => units(24, () => true);
    const ours = findValidateTime(
      date,
      allDisabled,
      () => units(60, () => true),
      () => units(60, () => true),
      () => units(1000, () => true),
      ourG,
    );
    // 四级都找不到可用档位 ⇒ 各级都不改，日期原样
    expect(ours.valueOf()).toBe(date.valueOf());
  });

  it('「反向第一个 ≤ 当前值」而不是「向上找最近」', () => {
    const date = dayjs(new Date(2026, 8, 19, 0, 0, 0, 0));
    // 小时档位里 0 被禁，只有 5 与 9 可用 ⇒ 反向第一个 ≤ 0 不存在 ⇒ 取第一个可用 5
    const ours = findValidateTime(
      date,
      () => [
        { value: 0, disabled: true },
        { value: 5, disabled: false },
        { value: 9, disabled: false },
      ],
      () => units(60, () => false),
      () => units(60, () => false),
      () => units(1000, () => false),
      ourG,
    );
    expect(ourG.getHour(ours)).toBe(5);

    // 反过来：当前值是 7，可用档位 5 / 9 ⇒ 反向第一个 ≤ 7 的是 5（不是 9）
    const seven = dayjs(new Date(2026, 8, 19, 7, 0, 0, 0));
    const ours7 = findValidateTime(
      seven,
      () => [
        { value: 5, disabled: false },
        { value: 7, disabled: true },
        { value: 9, disabled: false },
      ],
      () => units(60, () => false),
      () => units(60, () => false),
      () => units(1000, () => false),
      ourG,
    );
    expect(ourG.getHour(ours7)).toBe(5);
  });
});
