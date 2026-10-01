/**
 * 范围选择器的**焦点锁定**（上游 `PickerInput/hooks/useFocusLock.js`，45 行）。
 *
 * ── 它解决什么 ───────────────────────────────────────────────────────────────
 *
 * 范围选择器有两个输入框，而「当前在编辑哪一端」是一个**独立于 DOM 焦点**的
 * 状态（`activeIndex`）。两者会不同步：
 *   - 用户点面板格子 ⇒ DOM 焦点跑到面板上，但 `activeIndex` 不变；
 *   - 用户 `Tab` / 点另一个输入框 ⇒ DOM 焦点换了，但 `activeIndex` 可能还没跟过来。
 *
 * ⇒ 两个副作用，一强一弱：
 *
 * | 副作用 | 触发 | 行为 |
 * |---|---|---|
 * | **强切换** | `index !== null && forceFocus` | **主动开浮层 + 把 DOM 焦点搬过去** |
 * | **弱校正** | 每次渲染后 | 焦点**跑到了另一个 field** 上 ⇒ 把它抢回 `index` |
 *
 * 🚨 **「弱」那一条是上游注释里点名的**：
 * ```
 * // Only a strong transition actively opens the Picker and moves DOM focus.
 * // Weak transitions keep the expected index without stealing external focus.
 * ```
 * ⇒ 弱校正**不会**去抢外部元素的焦点（只在「焦点在**本组件另一个输入框**上」时才动手）。
 * 写成「`index` 变了就 focus」会让「用户 Tab 到页面上别的控件」被强行拽回来。
 *
 * ── 三条实现判据 ─────────────────────────────────────────────────────────────
 *
 * 1. **焦点读取要优先走 input 自己的 `getRootNode()`**（上游注释）：
 *    `document.activeElement` 在 Shadow DOM 里只会返回 **host**，
 *    拿它跟 input 比会永远不等 ⇒ 弱校正失效。先问 input 所在的 root。
 * 2. **焦点已经在浮层里 ⇒ 直接返回**（不校正）—— 否则点面板格子会被拽回输入框。
 * 3. ⚠️ 上游用「无依赖数组的 `useLayoutEffect`」= **每次渲染后**都跑；
 *    本仓用 `onMounted` + `onUpdated`（Vue 的对应物）。
 *    ⚠️ **不能用 `watch(..., {flush:'post'})`** —— `document.activeElement`
 *    不是响应式的，watch 只在依赖变化时跑，会漏掉「index 没变但焦点变了」这种情况
 *    （而那正是弱校正存在的理由）。
 */
import { onMounted, onUpdated, watch } from 'vue';
import { isTargetInContainers } from '../components/picker-shared';

/** `Selector` 暴露的命令面（见 `components/Selector.ts` 的 `expose`）。 */
export interface FocusLockSelectorRef {
  focus: (options?: number | { index?: number; preventScroll?: boolean }) => void;
  startInput: () => HTMLInputElement | null;
  endInput: () => HTMLInputElement | null;
}

export interface UseFocusLockOptions {
  /** 当前活动端（`null` = 不在任何一端）。 */
  index: () => number | null;
  /** 是否「强切换」（由提交时机状态机给出）。 */
  forceFocus: () => boolean;
  selectorRef: () => FocusLockSelectorRef | null;
  popupRef: () => HTMLElement | null;
  /** 开浮层（上游的 `triggerOpen`）。 */
  triggerOpen: (open: boolean) => void;
}

export function useFocusLock(options: UseFocusLockOptions): void {
  // ======================== 强切换 ========================
  watch([() => options.index(), () => options.forceFocus()], () => {
    const index = options.index();
    if (index !== null && options.forceFocus()) {
      options.triggerOpen(true);
      options.selectorRef()?.focus(index);
    }
  });

  // ======================== 弱校正 ========================
  const correct = (): void => {
    const index = options.index();
    if (index === null) {
      return;
    }
    // ⚠️ SSR / 非浏览器环境没有 `document`（上游是客户端 hook，不会有这个问题）
    if (typeof document === 'undefined') {
      return;
    }
    const selector = options.selectorRef();
    if (!selector) {
      return;
    }
    const inputFields = [selector.startInput(), selector.endInput()];
    // 🚨 优先读 input 自己的 root（判据 1）
    const inputRoot = inputFields[index]?.getRootNode() as
      | (Document | ShadowRoot)
      | null
      | undefined;
    const activeElement = inputRoot?.activeElement ?? document.activeElement;

    // 🚨 焦点在浮层里 ⇒ 不管（判据 2）
    if (isTargetInContainers(activeElement, [options.popupRef()])) {
      return;
    }

    const focusInOtherField = inputFields.some(
      (field, fieldIndex) =>
        fieldIndex !== index && isTargetInContainers(activeElement, [field as HTMLElement | null]),
    );
    if (focusInOtherField) {
      inputFields[index]?.focus();
    }
  };

  onMounted(correct);
  onUpdated(correct);
}
