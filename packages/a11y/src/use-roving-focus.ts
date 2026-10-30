/**
 * `useRovingFocus` —— roving tabindex 的组合式封装（Menu / Tabs / Radio.Group / Toolbar）。
 *
 * 纯逻辑在 `roving.ts`，这里只负责三件事：
 *   1. 把「当前项」做成响应式状态（支持受控 / 非受控）
 *   2. 把键盘事件翻译成移动
 *   3. 移动之后真的 `focus()` 到目标元素
 *
 * 本文件**不注册任何全局监听** —— 键盘事件由调用方在自己的容器上绑定后转发进来，
 * 这样「谁响应方向键」的边界是显式的，不会像全局监听那样误吞外部的方向键。
 */

import { useControlledValue } from '@apollo-design/utils';
import { computed, type MaybeRefOrGetter, type Ref, toValue, watch } from 'vue';
import {
  getRovingOffset,
  getRovingTabIndex,
  moveRovingIndex,
  NO_ACTIVE_INDEX,
  type RovingOrientation,
  resolveRovingEnd,
  resolveRovingHome,
} from './roving';

export interface UseRovingFocusOptions {
  /** 项数。响应式 —— 列表增删后不用重建组合式 */
  count: MaybeRefOrGetter<number>;
  /** 受控当前项；`-1` 表示无当前项，undefined 撤控并保留最后接收的值。 */
  activeIndex?: MaybeRefOrGetter<number | undefined>;
  /** 默认 `'vertical'` */
  orientation?: MaybeRefOrGetter<RovingOrientation>;
  /** 默认 `false`；`horizontal` 下左右互换 */
  rtl?: MaybeRefOrGetter<boolean>;
  /** 是否环绕。默认 `true`（与 rc-menu 一致） */
  loop?: MaybeRefOrGetter<boolean>;
  /** 取第 `index` 个元素，用于真正移动焦点。不传则只改状态 */
  getItem?: (index: number) => HTMLElement | null;
  /** 提议当前项；受控用法由调用方接受，拒绝时不提前改状态或焦点。 */
  onChange?: (index: number) => void;
  /** 默认 `true`：移动后调 `getItem(index)?.focus()`。传 `false` 可只改状态 */
  focusOnMove?: MaybeRefOrGetter<boolean>;
}

export interface UseRovingFocusReturn {
  /** 当前项下标；写入同 setActive，`-1` 表示还没有当前项。 */
  activeIndex: Ref<number>;
  /** 第 `index` 项该挂的 `tabindex` */
  getTabIndex(index: number): 0 | -1;
  setActive(index: number, focus?: boolean): void;
  /** 相对移动 */
  move(offset: number): void;
  moveHome(): void;
  moveEnd(): void;
  /**
   * 处理一个键盘事件。
   * @returns 是否已消费并 preventDefault；调用方据此决定是否继续派发。
   */
  onKeyDown(event: KeyboardEvent): boolean;
}

export function useRovingFocus(options: UseRovingFocusOptions): UseRovingFocusReturn {
  const getCount = (): number => Math.max(0, Math.trunc(toValue(options.count)));
  const normalizeIndex = (index: number): number => {
    const count = getCount();
    return count === 0 || index === NO_ACTIVE_INDEX
      ? NO_ACTIVE_INDEX
      : Math.min(Math.max(index, 0), count - 1);
  };
  const [state, setState] = useControlledValue<number>({
    getValue: () => toValue(options.activeIndex),
    defaultValue: NO_ACTIVE_INDEX,
    onChange: (index) => options.onChange?.(index),
  });
  const activeIndex = computed({
    get: () => normalizeIndex(state.value),
    set: (index: number) => setActive(index),
  });
  let pendingFocus: number | undefined;

  const focusAcceptedItem = (): void => {
    if (pendingFocus === undefined || pendingFocus !== activeIndex.value) return;
    if (pendingFocus === NO_ACTIVE_INDEX || toValue(options.focusOnMove) === false) {
      pendingFocus = undefined;
      return;
    }
    const item = options.getItem?.(pendingFocus);
    if (item) {
      pendingFocus = undefined;
      item.focus();
    }
  };

  function setActive(index: number, focus = true): void {
    const next = normalizeIndex(index);
    pendingFocus = focus && toValue(options.focusOnMove) !== false ? next : undefined;
    setState(next);
    focusAcceptedItem();
  }

  // A controlled parent or a newly rendered item can accept a request on the
  // following Vue update. External changes without a request never steal focus.
  watch(
    activeIndex,
    (index) => {
      if (pendingFocus !== undefined && pendingFocus !== index) pendingFocus = undefined;
      focusAcceptedItem();
    },
    { flush: 'post' },
  );
  watch(
    getCount,
    () => {
      pendingFocus = undefined;
      const next = normalizeIndex(state.value);
      if (next !== state.value) setState(next);
    },
    { flush: 'sync' },
  );

  const move = (offset: number): void => {
    if (offset === 0) return;
    setActive(
      moveRovingIndex(activeIndex.value, offset, getCount(), toValue(options.loop) ?? true),
    );
  };

  const onKeyDown = (event: KeyboardEvent): boolean => {
    if (event.defaultPrevented || event.isComposing || getCount() === 0) return false;
    if (event.key === 'Home') {
      event.preventDefault();
      setActive(resolveRovingHome(getCount()));
      return true;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActive(resolveRovingEnd(getCount()));
      return true;
    }

    const offset = getRovingOffset(
      toValue(options.orientation) ?? 'vertical',
      toValue(options.rtl) ?? false,
      event.key,
    );
    if (offset === null) {
      return false;
    }

    // 只有真的要移动时才阻止默认 —— 方向键的默认行为是滚动页面，必须拦。
    // 未参与导航的键（例如 vertical 下的左右键）**不能**拦，否则会把别处的导航吃掉。
    event.preventDefault();
    move(offset);
    return true;
  };

  return {
    activeIndex,
    getTabIndex: (index: number) => getRovingTabIndex(activeIndex.value, index),
    setActive,
    move,
    moveHome: () => setActive(resolveRovingHome(getCount())),
    moveEnd: () => setActive(resolveRovingEnd(getCount())),
    onKeyDown,
  };
}
