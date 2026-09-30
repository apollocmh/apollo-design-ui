/**
 * `format` 的归一与 `dateString`（G4 · S1）。
 *
 * 契约来源：rc 的 `PickerInput/hooks/useFieldFormat.js`（**重新定义**，不搬运）。
 *
 * ```js
 * const rawFormat = getRowFormat(picker, locale, format);   // ① 原样传，可能返回数组/对象
 * const formatList = toArray(rawFormat);                    // ② 列表化
 * const firstFormat = formatList[0];                        // ③ 可能是对象
 * const maskFormat = typeof firstFormat === 'object' && firstFormat.type === 'mask'
 *                      ? firstFormat.format : null;          // ④ mask 只看**第一个**
 * return [formatList.map(c => typeof c === 'string' || typeof c === 'function'
 *                             ? c : c.format), maskFormat];
 * ```
 *
 * ⇒ 三件事：
 *   1. `format` 没给时按 `picker` 取 locale 的 `fieldXxxFormat`（`getRowFormat`，
 *      **已在 `@apollo-design/picker`**，含 `'datetime'` 那条独立分支）；
 *   2. 归一成**列表**（`toArray`，**也已在 picker 包**）；
 *   3. 从列表的第一个里挑出 `type: 'mask'` 的格式（S3 消费）。
 *
 * ── 🚨 ① 必须把整个 `format` 原样交给 `getRowFormat` ─────────────────────────
 *
 * 不能先「取第一个」—— `getRowFormat` 的判据只有 `if (format) return format`，
 * 数组 / 对象会**原样透传**，列表化是 ② 的事。
 * （初稿在这里先取了第一个 ⇒ 数组形态被压成一项、对象形态的 `type: 'mask'` 也丢了
 * —— 由本文件的 4 条 L1 用例抓到。）
 *
 * ── ⚠️ 一处**刻意的行为差异**（本仓的 `toArray` 与 rc 不同）──────────────────
 *
 * rc 的 `toArray`：`Array.isArray(v) ? v : [v]` ⇒ `toArray(undefined)` = `[undefined]`，
 * 随后 `.map(c => c.format)` 会在 `undefined.format` 上**抛 TypeError**。
 * 本仓 `@apollo-design/picker` 的 `toArray`：**`null` / `undefined` ⇒ `[]`**
 * （它自己的注释写明了这条）⇒ 同样的输入得到 `formatList: []`、`firstFormat: undefined`，
 * **不抛错**。
 *
 * ⇒ 当 locale 缺 `fieldXxxFormat` 时：上游**崩**，本仓**降级**。
 * 这是更好的行为，登记在 README §2（分类 INTENDED），由 L1 的一条用例钉住。
 *
 * ── ⚠️ 另一个欠账（跨包）────────────────────────────────────────────────────
 *
 * 本仓当前**不支持**函数形态的 `format`（上游 `FormatType<DateType> = string | CustomFormat<DateType>`）。
 * `PickerFormat` 要加回 `DateType` 泛型 + `CustomFormat`，登记在 `README §5.2` 与 PITFALLS 214。
 * 类型面已按上游写全（`interface.ts` 的 `CustomFormat`），这里对函数形态**保留位置**
 * （函数形态会在 `.format` 处拿到 `undefined`），S2 随键入解析一起落地。
 */

import { getRowFormat, type InternalMode, toArray } from '@apollo-design/picker';
import { type ComputedRef, computed } from 'vue';
import type { DatePickerFormat, DatePickerMode, MaskFormatConfig } from '../interface';
import type { RcPickerLocale } from './picker-types';

/** 归一后的 `format` 面。 */
export interface MergedFormat {
  /** 归一后的格式列表（**每个元素都是字符串**）。列表可能为空（locale 缺字段时）。 */
  formatList: string[];
  /** 第一个格式（`formatValue` 用它）。locale 缺字段时为 `undefined`。 */
  firstFormat: string | undefined;
  /** 掩码格式（`format.type === 'mask'` 时才有）—— S3 消费。 */
  maskFormat: string | null;
}

/**
 * 由 `picker` 与 `showTime` 推出内部模式。
 *
 * ⚠️ `@apollo-design/picker` 的 `picker-panel.ts` 里有一份**同判**的私有实现
 * （未导出）。这里是第二份 —— 只有两处、且逻辑是 4 行稳定判据，
 * 所以**没有**为它加导出（跨包改动要单独过 picker 的 L1/L3 门禁）。
 * 若出现第三个消费者，就该提升到 picker 包的导出面。
 *
 * 判据：`base === 'date' && showTime` ⇒ `'datetime'`（其余原样）。
 */
export function toInternalMode(
  picker: DatePickerMode | undefined,
  showTime: unknown,
): InternalMode {
  const base = picker ?? 'date';
  if (base === 'date' && showTime) {
    return 'datetime';
  }
  return base;
}

/** 把「一条 format 配置」读成字符串（字符串原样；对象取 `.format`；undefined ⇒ undefined）。 */
function toFormatString(config: string | MaskFormatConfig | undefined): string | undefined {
  if (config === undefined) {
    return undefined;
  }
  return typeof config === 'string' ? config : config.format;
}

/** 上游 `useFieldFormat` 的归一（纯函数，可直接 L1 测）。 */
export function mergeFormat(
  picker: InternalMode,
  locale: RcPickerLocale,
  format: DatePickerFormat | undefined,
): MergedFormat {
  // ① 原样传。`getRowFormat` 的第三参类型声明是 `string | undefined`（上游也这样），
  //    但它运行时只做 `if (format) return format` ⇒ 形状透传。
  //    这里**故意**传更宽的形态，用注释 + 单次断言表达意图（不用 `as any`，H10）。
  const rawFormat = getRowFormat(
    picker,
    locale,
    format as unknown as string | undefined,
  ) as unknown as DatePickerFormat | undefined;

  // ② 列表化（本仓 `toArray`：null / undefined ⇒ []）
  const rawList = toArray(rawFormat);

  // ③④ mask 只看**原始**第一个条目（可能是对象）
  const firstRaw = rawList[0] as string | MaskFormatConfig | undefined;

  return {
    formatList: rawList.map((config) =>
      typeof config === 'string' ? config : (config as MaskFormatConfig).format,
    ),
    firstFormat: toFormatString(firstRaw),
    maskFormat:
      typeof firstRaw === 'object' &&
      firstRaw !== null &&
      (firstRaw as MaskFormatConfig).type === 'mask'
        ? (firstRaw as MaskFormatConfig).format
        : null,
  };
}

/**
 * `format` 的响应式包装。
 *
 * ⚠️ 依赖三样：`picker` / `locale` / `format` —— 上游 `useMemo` 的依赖数组就是这三个。
 */
export function useMergedFormat(
  picker: ComputedRef<InternalMode>,
  locale: ComputedRef<RcPickerLocale>,
  format: ComputedRef<DatePickerFormat | undefined>,
): ComputedRef<MergedFormat> {
  return computed(() => mergeFormat(picker.value, locale.value, format.value));
}
