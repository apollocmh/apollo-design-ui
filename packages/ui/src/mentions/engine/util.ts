/**
 * `@rc-component/mentions@1.12.0` 的 `es/util.js`（78 行）—— **纯函数，逐条行为等价**。
 *
 * 这 6 个函数是整个引擎里**唯一能在 jsdom 里被完整验证**的部分（没有布局、没有时序）
 * ⇒ L1 把它们逐条钉死，包括边界（见 `__tests__/engine.test.ts`）。
 *
 * ⚠️ 与上游的**唯一**形态差异：上游的 `getBeforeSelectionText` 读 `input.selectionStart`
 *    （可能是 `null`）；本仓参数类型显式收 `number`，由调用点保证已判空
 *    （`HTMLTextAreaElement.selectionStart` 在 jsdom 里恒为 number，但 TS 类型是 `number | null`）。
 */

/** 命中前缀的位置与前缀本身。 */
export interface MeasureIndex {
  location: number;
  prefix: string;
}

/** 从光标位置把输入值切成两半，返回**光标前**的那一半。 */
export function getBeforeSelectionText(input: { value: string; selectionStart: number }): string {
  const { selectionStart } = input;
  return input.value.slice(0, selectionStart);
}

/**
 * 找**最靠右**的一次前缀命中。
 *
 * 判据（上游逐字）：`lastIndex > lastMatch.location` —— **严格大于**，
 * 所以 `prefix` 数组里位置相同的两个前缀，**先出现的那个赢**
 * （`['@', '@']` 恒命中第一个；`['@@', '@']` 在同一位置时也命中第一个）。
 */
export function getLastMeasureIndex(text: string, prefix: readonly string[]): MeasureIndex {
  return prefix.reduce<MeasureIndex>(
    (lastMatch, prefixStr) => {
      const lastIndex = text.lastIndexOf(prefixStr);
      if (lastIndex > lastMatch.location) {
        return { location: lastIndex, prefix: prefixStr };
      }
      return lastMatch;
    },
    { location: -1, prefix: '' },
  );
}

/** 小写（`undefined` 安全 —— 上游 `(char || '').toLowerCase()`）。 */
function lower(char: string | undefined): string {
  return (char || '').toLowerCase();
}

/**
 * 削掉 `text` 开头与 `targetText` 重复的部分（**大小写不敏感**）。
 *
 * 三条上游判据：
 *  1. `text` 首字符为空或等于 `split` ⇒ 原样返回（**不削**）。
 *  2. 逐字符比较，第一个不同处**从那里切开**（保留剩余）。
 *  3. 全部相同 ⇒ 切掉 `targetText.length` 个字符。
 *  ⚠️ `targetText` 比 `text` 长时，`restText[i]` 是 `undefined` ⇒ `lower` 返回 `''`
 *     ⇒ 与 `targetText[i]` 不同 ⇒ 从 `i` 切开（等价于保留剩下的全部）。
 */
function reduceText(text: string, targetText: string, split: string): string {
  const firstChar = text[0];
  if (!firstChar || firstChar === split) {
    return text;
  }

  let restText = text;
  const targetTextLen = targetText.length;
  for (let i = 0; i < targetTextLen; i += 1) {
    if (lower(restText[i]) !== lower(targetText[i])) {
      restText = restText.slice(i);
      break;
    } else if (i === targetTextLen - 1) {
      restText = restText.slice(targetTextLen);
    }
  }
  return restText;
}

export interface ReplaceMeasureConfig {
  measureLocation: number;
  prefix: string;
  targetText: string;
  selectionStart: number;
  split: string;
}

export interface ReplaceMeasureResult {
  text: string;
  /** 回填后光标应当落在的位置（= 已连接前缀文本的长度）。 */
  selectionLocation: number;
}

/**
 * 把选中的候选项**回填**进文本，并算出光标位置。
 *
 * 例子（上游注释）：`text='little@litest'`，`targetText='light'` ⇒ `little @light test`
 *
 * 四步：
 *  ① `beforeMeasureText` = 前缀之前的部分；若它的末尾已经是 `split` 就削掉一个。
 *  ② 若它非空 ⇒ 补一个 `split`（保证候选词与前文分隔）。
 *  ③ `restText` = 光标之后的文本，用 `reduceText` 削掉与 `targetText` 尾部重复的开头；
 *     结果若以 `split` 开头再削一个。
 *  ④ 拼接 `beforeMeasureText + prefix + targetText + split + restText`。
 */
export function replaceWithMeasure(
  text: string,
  measureConfig: ReplaceMeasureConfig,
): ReplaceMeasureResult {
  const { measureLocation, prefix, targetText, selectionStart, split } = measureConfig;

  let beforeMeasureText = text.slice(0, measureLocation);
  if (beforeMeasureText[beforeMeasureText.length - split.length] === split) {
    beforeMeasureText = beforeMeasureText.slice(0, beforeMeasureText.length - split.length);
  }
  if (beforeMeasureText) {
    beforeMeasureText = `${beforeMeasureText}${split}`;
  }

  let restText = reduceText(
    text.slice(selectionStart),
    targetText.slice(selectionStart - measureLocation - prefix.length),
    split,
  );
  if (restText.slice(0, split.length) === split) {
    restText = restText.slice(split.length);
  }
  const connectedStartText = `${beforeMeasureText}${prefix}${targetText}${split}`;
  return {
    text: `${connectedStartText}${restText}`,
    selectionLocation: connectedStartText.length,
  };
}

/**
 * 设置光标并把输入框重新聚焦（**先 blur 再 focus** —— 上游注释：把光标带回视野）。
 *
 * ⚠️ `blur()` 会触发引擎的 `onInternalBlur`（它用 `setTimeout(0)` 延迟处理）
 *    ⇒ 紧随其后的 `focus()` 在同一个 tick 里把 `focusRef` 的定时器清掉。
 *    这一对调用的顺序是**契约**，不要「优化」掉 `blur`。
 */
export function setInputSelection(
  input: {
    setSelectionRange: (start: number, end: number) => void;
    blur: () => void;
    focus: () => void;
  },
  location: number,
): void {
  input.setSelectionRange(location, location);
  input.blur();
  input.focus();
}

/** 搜索串是否合法：不含 `split`（`split` 为空串时恒合法）。 */
export function validateSearch(text: string, split: string): boolean {
  return !split || text.indexOf(split) === -1;
}

/** 默认候选过滤：`option.value` 是否**包含**输入串（大小写不敏感）。 */
export function filterOption(input: string, option: { value?: string }): boolean {
  const lowerCase = input.toLowerCase();
  return (option.value ?? '').toLowerCase().indexOf(lowerCase) !== -1;
}
