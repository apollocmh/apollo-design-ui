/**
 * 键盘导航的**数值**部分。
 *
 * ⚠️ 范围限定（契约 §3.5）：`@rc-component/picker@1.12.2` 的键盘导航**全部在输入框的
 * mask-format 层**（`es/PickerInput/Selector/Input.js:189-269`），而输入框按本包 README
 * 的边界属于 `ui` 层。这里只提供与面板无关、可纯函数化的两块：
 * 掩码区间表与「上下键改值」的环绕算式。
 *
 * ⚠️ 顺带一条**实测结论**：1.12.2 里**没有** PageUp / PageDown / Home / End。
 * 本包 README 的「必须遵守的契约」里写了这几个键，那是更早期 rc-picker 的形态
 * （契约 §9 的 P1）。
 */

/** `[start, end]` 或 `[start, end, default]`。`default` 只在 `YYYY` 上有。 */
export type MaskRange = readonly [number, number, number?];

/** 除 `YYYY` 外的固定区间（上游 `PickerInput/Selector/util.js` 的 `PresetRange`）。 */
const PRESET_RANGE: Record<string, MaskRange> = {
  MM: [1, 12],
  DD: [1, 31],
  HH: [0, 23],
  mm: [0, 59],
  ss: [0, 59],
  SSS: [0, 999],
};

/**
 * 掩码字段的取值范围。
 *
 * ⚠️ `YYYY` 的 third 项是**当前年份**，上游在每次调用时现算
 * （`new Date().getFullYear()`）。这里同样现算 —— 做成模块级常量会在跨年时给出旧值。
 */
export function getMaskRange(key: string): MaskRange | undefined {
  if (key === 'YYYY') {
    return [0, 9999, new Date().getFullYear()];
  }
  return PRESET_RANGE[key];
}

/**
 * 上下键改一个掩码字段的值（上游 `Input.js:219-229`）。
 *
 * 三态：
 *  1. `cellFormat` 不在预设表里 ⇒ `undefined`（调用方应忽略这次按键）；
 *  2. 当前文本不是数字 ⇒ 给 `default`（没有 default 时：`offset > 0` 给下界、否则给上界）；
 *  3. 否则**取模环绕**：`start + (size + num - start) % size`。
 *
 * ⚠️ 两条容易被「顺手修正」的地方：
 *  - `Number('')` 是 `0` 不是 `NaN`，所以空文本走第 3 态（按 0 起算）；
 *  - 环绕算式**只取一次模**。极端负值（如用户键入 `-20`）会得到越界结果，
 *    那是上游的形态；补一次 `(x % size + size) % size` 会与 antd 分叉。
 */
export function offsetCellValue(
  currentText: string,
  cellFormat: string,
  offset: number,
): string | undefined {
  const range = getMaskRange(cellFormat);
  if (!range) {
    return undefined;
  }
  const rangeStart = range[0];
  const rangeEnd = range[1];
  const rangeDefault = range[2];

  const currentTextNum = Number(currentText);
  if (Number.isNaN(currentTextNum)) {
    if (rangeDefault !== undefined) {
      return String(rangeDefault);
    }
    return String(offset > 0 ? rangeStart : rangeEnd);
  }

  const num = currentTextNum + offset;
  const size = rangeEnd - rangeStart + 1;
  return String(rangeStart + ((size + num - rangeStart) % size));
}
