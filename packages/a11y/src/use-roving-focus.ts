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

import { type MaybeRefOrGetter, type Ref, ref, toValue, watch } from 'vue';
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
  /** 受控的当前项；不传则是非受控。`-1` / `undefined` 表示还没有当前项 */
  activeIndex?: MaybeRefOrGetter<number | undefined>;
  /** 默认 `'vertical'` */
  orientation?: MaybeRefOrGetter<RovingOrientation>;
  /** 默认 `false`；`horizontal` 下左右互换 */
  rtl?: MaybeRefOrGetter<boolean>;
  /** 是否环绕。默认 `true`（与 rc-menu 一致） */
  loop?: MaybeRefOrGetter<boolean>;
  /** 取第 `index` 个元素，用于真正移动焦点。不传则只改状态 */
  getItem?: (index: number) => HTMLElement | null;
  /** 当前项变化时通知（受控用法里由调用方 setProps） */
  onChange?: (index: number) => void;
  /** 默认 `true`：移动后调 `getItem(index)?.focus()`。传 `false` 可只改状态 */
  focusOnMove?: MaybeRefOrGetter<boolean>;
}

export interface UseRovingFocusReturn {
  /** 当前项下标；`-1` 表示还没有当前项 */
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
   * @returns 是否被本组合式消费 —— 调用方据此决定要不要 `preventDefault` / 继续冒泡
   */
  onKeyDown(event: KeyboardEvent): boolean;
}

export function useRovingFocus(options: UseRovingFocusOptions): UseRovingFocusReturn {
  const internal = ref(toValue(options.activeIndex) ?? NO_ACTIVE_INDEX);

  // 受控：外部值变化时同步进来。`undefined` 视为「不管」，避免非受控用法被覆盖。
  watch(
    () => toValue(options.activeIndex),
    (value) => {
      if (value !== undefined) {
        internal.value = value;
      }
    },
  );

  const getCount = (): number => Math.max(0, Math.trunc(toValue(options.count)));

  const setActive = (index: number, focus = true): void => {
    const count = getCount();
    const next = count === 0 ? NO_ACTIVE_INDEX : Math.min(Math.max(index, 0), count - 1);
    internal.value = next;
    options.onChange?.(next);
    // `focusOnMove` 默认 true；显式传 false 时只改状态（用于「受控方自己负责移动焦点」）
    if (focus && toValue(options.focusOnMove) !== false && next !== NO_ACTIVE_INDEX) {
      options.getItem?.(next)?.focus();
    }
  };

  const move = (offset: number): void => {
    setActive(moveRovingIndex(internal.value, offset, getCount(), toValue(options.loop) ?? true));
  };

  const onKeyDown = (event: KeyboardEvent): boolean => {
    if (event.key === 'Home') {
      setActive(resolveRovingHome(getCount()));
      return true;
    }
    if (event.key === 'End') {
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
    activeIndex: internal,
    getTabIndex: (index: number) => getRovingTabIndex(internal.value, index),
    setActive,
    move,
    moveHome: () => setActive(resolveRovingHome(getCount())),
    moveEnd: () => setActive(resolveRovingEnd(getCount())),
    onKeyDown,
  };
}
