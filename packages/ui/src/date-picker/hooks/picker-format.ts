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
 * ⚠️ 判据 ② 里有一个**极易写错**的点：`map` 的回调是
 * `typeof c === 'string' || typeof c === 'function' ? c : c.format`
 * —— **函数形态要原样保留**（它只参与格式化、不参与解析）。
 * 漏掉 `typeof c === 'function'` 那一支会让函数被读成 `undefined`
 * （函数没有 `.format`）⇒ 输入框显示空、`input[size]` 也退化。
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
 * ⚠️ **2026-10-01 起这条差异实际上走不到了**：`DatePicker.vue` 现在会先把 locale
 * 补齐（`hooks/picker-filled.ts`）⇒ `fieldDateFormat` 恒存在。用例仍保留
 * （`mergeFormat` 本身仍可能被直接以未补齐的 locale 调用）。
 *
 * ── ✅ 函数形态（`CustomFormat`）已支持（2026-10-01，S2）──────────────────────
 *
 * 本仓此前**丢掉**函数形态（`.map` 少写一支 ⇒ 读成 `undefined`），
 * 虽然 `interface.ts` 的类型面早就允许它（`PickerFormat` 的 `FormatType` 含
 * `CustomFormat`）。现已按上游逐字补上：
 *   - `MergedFormat.formatList` / `firstFormat` 的类型放宽成 `FormatType`（含函数）；
 *   - 函数**只参与格式化**（`formatValue` 直接调用它），**不参与解析**
 *     （`picker-typing.ts` 的 `typeof === 'string'` 检查会跳过它）—— 上游如此。
 */

import { getRowFormat, type InternalMode, toArray } from '@apollo-design/picker';
import { type ComputedRef, computed } from 'vue';
import type { DatePickerFormat, DatePickerMode, FormatType, MaskFormatConfig } from '../interface';
import type { RcPickerLocale } from './picker-types';

/**
 * 归一后的单个格式项。
 *
 * ⚠️ **可能是函数**（`CustomFormat`）—— 上游的 `useFieldFormat` 返回的就是
 * `FormatType[]`。函数形态**只参与格式化、不参与解析**（见文件头）。
 */
export type MergedFormatEntry = FormatType;

/**
 * `toArray` 拆一层后可能的**条目**形态 = `PickerFormat` 去掉「数组」那一支。
 *
 * ⚠️ `MaskFormatConfig` 严格来说**不在**数组支的类型面里（上游的类型只允许
 * 「单独给一个 mask 对象」）—— 但代码路径可达（`mergeFormat` 只看第一个条目的形状），
 * L1 有一条用例专门钉这件事。
 */
type FormatEntry = FormatType | MaskFormatConfig;

/** 归一后的 `format` 面。 */
export interface MergedFormat {
  /** 归一后的格式列表。列表可能为空（locale 缺字段且用户没给 `format` 时）。 */
  formatList: MergedFormatEntry[];
  /** 第一个格式（`formatValue` / `input[size]` 用它）。列表为空时为 `undefined`。 */
  firstFormat: MergedFormatEntry | undefined;
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

/**
 * 把「一条 format 配置」读成归一后的条目。
 *
 * 上游 `useFieldFormat.js:11` 的判据逐字：
 * `typeof config === 'string' || typeof config === 'function' ? config : config.format`
 *
 * ⚠️ **函数那一支不能漏**：函数没有 `.format`，漏了会读成 `undefined`
 * ⇒ 输入框显示空串、`input[size]` 退化到默认值。
 *
 * ⚠️ `undefined` 条目返回 `undefined`（调用方会把它滤掉）—— 这是本仓
 * 「降级不抛」那条 INTENDED 差异的一部分（上游会在这里 `undefined.format` 抛错，
 * 见文件头）。`toArray` 对 `null` / `undefined` 已经给 `[]`，
 * 所以只有「用户显式传了含 `undefined` 的数组」才走得到这一支。
 */
function toFormatEntry(config: FormatEntry | undefined): MergedFormatEntry | undefined {
  if (config === undefined) {
    return undefined;
  }
  // 函数形态原样保留（只参与格式化，见文件头）
  if (typeof config === 'string' || typeof config === 'function') {
    return config;
  }
  return config.format;
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
  //
  // 🚨 **必须显式给 `toArray` 的类型参数**。不写时 TS 会去推断 `T`，而在
  // `DatePickerFormat`（= `PickerFormat<ui 的 Dayjs>`）与 picker 自己的
  // `PickerFormat<picker 的 Dayjs>` 之间**推断失败**：
  //
  //   `CustomFormat<DateType> = (value: DateType) => string` 的参数在**逆变**位置，
  //   而 pnpm 的严格 `node_modules` 让两个包**各有一份 dayjs 声明**
  //   ⇒ 即使 `Dayjs` 结构等价，逆变位置也**不兼容**（比 TS2742 那条可移植性警告更硬）。
  //
  // 运行时两边是同一个对象（见 `hooks/dayjs-config.ts` 的同款说明）⇒
  // 这里用**显式泛型实参**（不是断言）把类型钉成 ui 侧的形态，最干净。
  //
  // ⚠️ 代价：TS 于是认为元素也可能是**数组**（`PickerFormat` 的数组支）。
  //    运行时不可能是 —— `toArray` 只拆一层，而 `PickerFormat` 的数组支是
  //    `readonly FormatType[]`（**不嵌套**）⇒ 用一次带说明的断言把元素收成
  //    「条目」（`FormatEntry`），让 `toFormatEntry` 的入参精确。
  const rawList = toArray<DatePickerFormat>(rawFormat) as unknown as FormatEntry[];

  // ③④ mask 只看**原始**第一个条目（可能是对象；**函数不是对象** ⇒ 天然跳过）
  const firstRaw = rawList[0];

  return {
    // 函数形态原样保留（上游 `typeof === 'string' || typeof === 'function'`）
    formatList: rawList
      .map((config) => toFormatEntry(config))
      .filter((entry): entry is MergedFormatEntry => entry !== undefined),
    firstFormat: toFormatEntry(firstRaw),
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
