/**
 * 掩码格式（S3）—— 上游 `PickerInput/Selector/MaskFormat.js`（**81 行**）的移植。
 *
 * 读源码作规格（**重新定义**，不搬运实现，H2）。上游是一个 `class`，
 * 本仓改成**工厂函数 + 接口**（与本仓「纯函数优先」的形态一致）——
 * 行为逐字对齐，`__tests__/mask-format.test.ts` 用 node 环境覆盖。
 *
 * ── 它是什么 ────────────────────────────────────────────────────────────────
 *
 * `format={{ format: 'YYYY-MM-DD', type: 'mask' }}` 时，输入框变成**分段掩码**：
 *
 * ```
 * 模板   顧顧顧顧-顧顧-顧顧      ← 字段位被替换成占位字符（分隔符保留）
 * 字段   [YYYY] [-] [MM] [-] [DD]
 *        0..4    4..5  5..7 7..8 8..10   ← [start, end) 的选择区间
 * ```
 *
 * ⇒ 键盘输入被约束在**当前字段**内；方向键在字段间跳；上下键改字段值（`offsetCellValue`）。
 *
 * ── 🚨 三处「读源码才知道」的判据 ────────────────────────────────────────────
 *
 * 1. **占位字符是汉字 `顧`**（上游注释：*Use Chinese character to avoid conflict with
 *    the mask format*）—— `YYYY` / `MM` 都是 ASCII，用汉字才不会与用户格式串撞车。
 * 2. **正则的交替顺序 = `FORMAT_KEYS` 的顺序**，而 `SSS` 排在 `ss` **之后**。
 *    顺序变了匹配结果就变（`MM` 必须先于单字母？本表里都是双字母起，无歧义；
 *    但 `MM` 与 `mm` 只差大小写 ⇒ **大小写敏感**，别加 `i` 标志）。
 * 3. **`match()` 只做「前缀检查」**：它只扫到 `maskFormat.length` 为止
 *    ⇒ 更长的文本也算匹配。这是上游形态，不要「顺手」改成严格等长。
 */

/** 可被掩码的字段（上游 `FORMAT_KEYS`，逐字 —— **顺序即正则交替顺序**）。 */
export const MASK_FORMAT_KEYS = ['YYYY', 'MM', 'DD', 'HH', 'mm', 'ss', 'SSS'] as const;

/**
 * 掩码占位字符（上游 `REPLACE_KEY`）。
 *
 * ⚠️ 是**汉字**（上游注释：避免与用户的格式串冲突）。改成 `*` / `X` 之类会与
 * 用户自定义格式串（如 `YYYY[年]MM[月]` 里的字面量）撞车。
 */
export const MASK_REPLACE_KEY = '顧';

/** 一个「段」：字段（`mask: true`）或分隔符（`mask: false`）。 */
export interface MaskCell {
  /** 该段的原始文本（字段是 `YYYY` 这种 key，分隔符是 `-` / `[年]` 这类字面量）。 */
  text: string;
  /** 是不是**可输入**的字段。 */
  mask: boolean;
  /** 段起点（含）。 */
  start: number;
  /** 段终点（**不含**）。 */
  end: number;
}

export interface MaskFormat {
  /** 原格式串。 */
  format: string;
  /** 字段位被替换成占位字符的模板。 */
  maskFormat: string;
  /** 全部段（含分隔符），按出现顺序。 */
  cells: MaskCell[];
  /** 只有可输入字段。 */
  maskCells: MaskCell[];
  /**
   * 第 `maskCellIndex` 个字段的 `[start, end)` 选择区间。
   *
   * ⚠️ 下标越界时给 `[0, 0]`（上游 `this.maskCells[i] || {}` 之后 `start || 0`）。
   * `null` 也走同一支 —— 上游 `getSelection(null)` 就是越界。
   */
  getSelection: (maskCellIndex: number | null) => [number, number];
  /** 文本是否与模板匹配（字段位任意字符、分隔符必须逐字相同，**只查前缀**）。 */
  match: (text: string) => boolean;
  /** 字段个数。 */
  size: () => number;
  /** 离 `anchorIndex` 最近的字段下标（优先「包含它」的那个）。 */
  getMaskCellIndex: (anchorIndex: number) => number;
}

/** 上游 `new MaskFormat(format)` 的等价物。 */
export function createMaskFormat(format: string): MaskFormat {
  // ===================== ① 模板 =====================
  // 上游：`FORMAT_KEYS.map(key => \`(${key})\`).join('|')` + 全局替换
  const replaceReg = new RegExp(MASK_FORMAT_KEYS.map((key) => `(${key})`).join('|'), 'g');
  const maskFormat = format.replace(replaceReg, (key) => MASK_REPLACE_KEY.repeat(key.length));

  // ===================== ② 分段 =====================
  // ⚠️ `split` 的**捕获组**会把命中的 key 也留在结果里（这正是我们要的）；
  //    上游这个正则**没有 `g`** —— 有 `g` 时 `split` 的行为一致，但别改。
  const cellReg = new RegExp(`(${MASK_FORMAT_KEYS.join('|')})`);
  const strCells = format.split(cellReg).filter((text) => text !== '');

  let offset = 0;
  const cells: MaskCell[] = strCells.map((text) => {
    const mask = (MASK_FORMAT_KEYS as readonly string[]).includes(text);
    const start = offset;
    const end = offset + text.length;
    offset = end;
    return { text, mask, start, end };
  });
  const maskCells = cells.filter((cell) => cell.mask);

  return {
    format,
    maskFormat,
    cells,
    maskCells,

    getSelection(maskCellIndex) {
      const cell = maskCellIndex === null ? undefined : maskCells[maskCellIndex];
      // 上游 `[start || 0, end || 0]` —— `0` 与 `undefined` 都落到 `0`
      return [cell?.start ?? 0, cell?.end ?? 0];
    },

    match(text) {
      for (let i = 0; i < maskFormat.length; i += 1) {
        const maskChar = maskFormat[i];
        const textChar = text[i];
        // ⚠️ 只扫到模板长度 ⇒ **更长的文本也算匹配**（见文件头判据 3）
        if (!textChar || (maskChar !== MASK_REPLACE_KEY && maskChar !== textChar)) {
          return false;
        }
      }
      return true;
    },

    size() {
      return maskCells.length;
    },

    getMaskCellIndex(anchorIndex) {
      let closestDist = Number.MAX_SAFE_INTEGER;
      let closestIndex = 0;
      for (let i = 0; i < maskCells.length; i += 1) {
        const { start, end } = maskCells[i] as MaskCell;
        if (anchorIndex >= start && anchorIndex <= end) {
          return i;
        }
        const dist = Math.min(Math.abs(anchorIndex - start), Math.abs(anchorIndex - end));
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      }
      return closestIndex;
    },
  };
}
