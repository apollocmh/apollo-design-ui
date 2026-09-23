/**
 * 光标位置记录/恢复 —— rc-input-number `hooks/useCursor.js` 的自建等价物。
 *
 * 为什么需要：formatter 会改写输入文本（如 `1234 → ¥1,234`），Vue 的 value patch
 * 会把光标挤到末尾。记录改写前的 selection 锚点，改写后按「前缀相同 → 后缀相同 →
 * 前一字符索引」的顺序恢复。
 */

import { warning } from '@apollo-design/utils';
import type { Ref } from 'vue';

interface SelectionRecord {
  start: number | null;
  end: number | null;
  value: string;
  beforeTxt: string;
  afterTxt: string;
}

export function useCursor(inputRef: Ref<HTMLInputElement | null>, focused: Ref<boolean>) {
  let selectionRef: SelectionRecord | null = null;

  function recordCursor(): void {
    try {
      const input = inputRef.value;
      if (!input) return;
      const { selectionStart: start, selectionEnd: end, value } = input;
      const beforeTxt = value.substring(0, start ?? 0);
      const afterTxt = value.substring(end ?? 0);
      selectionRef = { start, end, value, beforeTxt, afterTxt };
    } catch {
      // Chrome 某些场景读 selectionStart 会抛（input type=number 等），上游同样吞掉
    }
  }

  function restoreCursor(): void {
    const input = inputRef.value;
    if (input && selectionRef && focused.value) {
      try {
        const { value } = input;
        const { beforeTxt, afterTxt, start } = selectionRef;
        let startPos = value.length;
        if (value.startsWith(beforeTxt)) {
          startPos = beforeTxt.length;
        } else if (value.endsWith(afterTxt)) {
          startPos = value.length - selectionRef.afterTxt.length;
        } else {
          const beforeLastChar = beforeTxt[start ?? 0];
          if (beforeLastChar === undefined) return;
          const newIndex = value.indexOf(beforeLastChar, (start ?? 1) - 1);
          if (newIndex !== -1) {
            startPos = newIndex + 1;
          }
        }
        input.setSelectionRange(startPos, startPos);
      } catch (error) {
        warning(false, `Something warning of cursor restore: ${(error as Error).message}`);
      }
    }
  }

  return [recordCursor, restoreCursor] as const;
}
