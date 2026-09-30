/**
 * 键入解析（**S2 的第一步**）—— 把输入框里的文本解析成日期。
 *
 * 契约来源：`@rc-component/picker` 的
 * `PickerInput/Selector/hooks/useInputProps.js:46-81`（**逐字**）：
 *
 * ```js
 * const parseDate = (str, formatStr) => {
 *   const parsed = generateConfig.locale.parse(locale.locale, str, [formatStr]);
 *   return parsed && generateConfig.isValidate(parsed) ? parsed : null;
 * };
 *
 * const validateFormat = text => {
 *   for (let i = 0; i < format.length; i += 1) {
 *     const singleFormat = format[i];
 *     // Only support string type
 *     if (typeof singleFormat === 'string') {
 *       const parsed = parseDate(text, singleFormat);
 *       if (parsed) return parsed;
 *     }
 *   }
 *   return false;
 * };
 * ```
 *
 * ── 三条必须记住的判据 ──────────────────────────────────────────────────────
 *
 * 1. **逐个 `formatList` 尝试** —— 这正是「`format` 传数组」的意义：
 *    用户可以输入 `2026-09-30` 或 `2026/09/30`，命中哪一个都算合法。
 * 2. **只尝试字符串形态**（上游注释 `// Only support string type`）——
 *    `format` 的**函数形态与掩码对象形态都不参与解析**。
 *    函数形态的理由很直接：**没法从一个函数反推日期**（它只做「日期 → 文本」）。
 *    掩码形态属 S3，那时走另一条路径。
 * 3. **失败返回 `false`**（不是 `null`）—— 上游如此。调用方靠真值判断区分
 *    「解析出了日期」与「都没命中」。
 *
 * ── 为什么这两条是纯函数、单独一个文件 ───────────────────────────────────────
 *
 * 解析是「文本 → 日期」的**纯计算**，不依赖 DOM、不依赖 Vue 生命周期
 * ⇒ 可以用 `--project unit` 的 **node 环境**直接测（不需要 jsdom）。
 * 而 S2 的**接线**（输入事件 → 解析 → 提交时机）必须用 jsdom，
 * 在当前环境（jsdom 冷加载 3:39、worker 60s 上限）跑不了 ⇒ 先把能验证的做对。
 */

import type { GenerateConfig } from '@apollo-design/picker';
import type { DatePickerDate } from '../interface';

/** 解析所需的上下文（与 `MergedFormat` / locale 的产物对齐）。 */
export interface ParseContext {
  /** 语言包的 `locale` 字段（dayjs 的 locale 名，如 `'en'` / `'zh-cn'`）。 */
  locale: string;
  /** 已归一的格式列表（**每个元素都是字符串**，见 `MergedFormat.formatList`）。 */
  formatList: readonly string[];
  /** 日期库适配层。 */
  generateConfig: GenerateConfig<DatePickerDate>;
}

/**
 * 用**单个**格式串解析（上游 `parseDate`）。
 *
 * 上游两步都要过：`locale.parse(...)` 得到日期，再 `isValidate(date)`。
 *
 * 🚨 **关于第二步的必要性 —— 我先前写错了一次，这里如实记录**：
 *
 * 起草本文档时我断言「dayjs 的 `locale.parse` 在格式不匹配时会返回**当前时间**
 * （而不是 `null`），所以 `isValidate` 不可省」。**实测推翻了它**：
 *
 * ```js
 * dayjsGenerateConfig.locale.parse('en', '乱写的东西', ['YYYY-MM-DD'])  // ⇒ null
 * ```
 *
 * 即**不匹配时本来就返回 `null`**。那 `isValidate` 挡的是什么？
 * 是 **Invalid Date** —— dayjs 在某些输入（如 `'not-a-date'`）下会给出一个
 * `Invalid Date` 实例而**不是** `null`（见 `generate-dayjs.oracle.test.ts` 的
 * 「`isAfter` / `isValidate` 逐位一致」用例，那里就有 `dayjs('not-a-date')`）。
 *
 * ⇒ 结论：这一步是**双保险**，在「`locale.parse` 已返回 `null`」的路径上是冗余的，
 * 但**与上游逐字一致**，且对「返回 Invalid Date」的路径是必需的。**保留**。
 * （教训：注释里的「为什么」也是断言，要跑一遍再写。）
 */
export function parseTextWithFormat(
  text: string,
  format: string,
  context: ParseContext,
): DatePickerDate | null {
  const parsed = context.generateConfig.locale.parse(context.locale, text, [format]);
  return parsed && context.generateConfig.isValidate(parsed) ? parsed : null;
}

/**
 * 逐个格式尝试（上游 `validateFormat`）。
 *
 * ⚠️ 返回 `DatePickerDate | false`（**不是 `| null`**）—— 与上游一致，
 * 调用方用真值判断即可（日期对象恒为真、`false` 恒为假）。
 *
 * ⚠️ `typeof singleFormat === 'string'` 这个检查**保留**：
 * 本仓的 `MergedFormat.formatList` 虽然已归一成 `string[]`，但
 *   - 上游此处**逐字**有这个检查（对着源码读的人不该看到差异），
 *   - 且它是**防御性的**（将来若 `formatList` 的类型放宽，这里不会静默把
 *     函数当格式串传下去 —— 那会让 `locale.parse` 收到非字符串而抛错）。
 */
export function validateFormat(text: string, context: ParseContext): DatePickerDate | false {
  for (const singleFormat of context.formatList) {
    if (typeof singleFormat !== 'string') {
      continue;
    }
    const parsed = parseTextWithFormat(text, singleFormat, context);
    if (parsed) {
      return parsed;
    }
  }
  return false;
}
