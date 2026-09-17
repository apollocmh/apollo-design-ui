/**
 * `useTypeahead` —— 敲字符快速跳到匹配项（Select / Tree / Menu）。
 *
 * ⚠️ **上游没有对应实现**（antd 与 rc-* 全量搜索 `typeahead` 零命中），
 *    语义由本项目定义，见契约文档 §3.9。因此本文件的每一条判据都写清了理由。
 *
 * 规则：
 *   1. 只有可打印字符参与（`isTypeaheadKey`）
 *   2. 两次按键间隔超过 `resetDelay` ⇒ 重新起头
 *   3. 从当前项**下一项**开始全表找一圈
 *   4. ⭐ 累积串没命中时**退化成单字符再找一次** —— 这就是「连按同一个键在匹配项之间循环」
 *      的实现：按 `a` 命中第 0 项，再按 `a` 时 buffer 是 `"aa"`（通常无命中），
 *      于是退回 `"a"` 从第 0 项之后继续找 ⇒ 第 1 项。
 *      不做这一步的话，第二次按同一个键会「什么都不发生」。
 */

import { type MaybeRefOrGetter, type Ref, ref, toValue } from 'vue';
import type { TypeaheadState } from './combobox';
import {
  findTypeaheadIndex,
  INITIAL_TYPEAHEAD_STATE,
  isTypeaheadKey,
  pushTypeaheadChar,
} from './combobox';
import { NO_ACTIVE_INDEX } from './roving';

export interface UseTypeaheadOptions {
  /** 候选项的文本（响应式） */
  labels: MaybeRefOrGetter<readonly string[]>;
  /** 当前项下标；`-1` / `undefined` 表示还没有 */
  activeIndex?: MaybeRefOrGetter<number | undefined>;
  /** 超时阈值，默认 `DEFAULT_TYPEAHEAD_RESET_DELAY` */
  resetDelay?: number;
  /** 命中时通知（通常是 `roving.setActive(index)`） */
  onMatch?: (index: number) => void;
  /** 时间源，便于测试注入；默认 `Date.now` */
  now?: () => number;
}

export interface UseTypeaheadReturn {
  /** 当前累积的搜索串（只读用途，例如显示在状态栏） */
  buffer: Ref<string>;
  /** 处理一个键盘事件；返回是否命中并消费了它 */
  onKeyDown(event: KeyboardEvent): boolean;
  /** 清空缓冲区（例如失焦时） */
  reset(): void;
}

export function useTypeahead(options: UseTypeaheadOptions): UseTypeaheadReturn {
  let state: TypeaheadState = INITIAL_TYPEAHEAD_STATE;
  const buffer = ref('');
  const clock = options.now ?? (() => Date.now());

  const reset = (): void => {
    state = INITIAL_TYPEAHEAD_STATE;
    buffer.value = '';
  };

  const onKeyDown = (event: KeyboardEvent): boolean => {
    if (!isTypeaheadKey(event)) {
      return false;
    }

    const labels = toValue(options.labels);
    const from = toValue(options.activeIndex) ?? NO_ACTIVE_INDEX;
    const accumulated = pushTypeaheadChar(state, event.key, clock(), options.resetDelay);

    let index = findTypeaheadIndex(labels, accumulated.buffer, from);
    if (index === NO_ACTIVE_INDEX) {
      // 规则 4：退化到单字符，并把 buffer 收回到这个字符
      index = findTypeaheadIndex(labels, event.key, from);
      state =
        index === NO_ACTIVE_INDEX ? accumulated : { buffer: event.key, lastAt: accumulated.lastAt };
    } else {
      state = accumulated;
    }
    buffer.value = state.buffer;

    if (index === NO_ACTIVE_INDEX) {
      return false;
    }

    options.onMatch?.(index);
    return true;
  };

  return { buffer, onKeyDown, reset };
}
