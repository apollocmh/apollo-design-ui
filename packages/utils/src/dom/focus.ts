/**
 * 焦点工具：可聚焦元素列表、聚焦并定位光标、焦点锁定。
 *
 * 契约来源：`@rc-component/util/Dom/focus`。
 *
 * ⚠️ 模块级单例状态：`lockFocus` 用四个模块级变量协调「多层锁定」。
 *    这是 rc-util 的真实设计（后锁者生效），不是可以"优化"成 per-instance 的东西 ——
 *    因为它的目的是让**后打开的浮层**接管 Tab 循环，前一个浮层的监听仍然存在但不生效。
 */

import {
  getCurrentInstance,
  type MaybeRefOrGetter,
  nextTick,
  onMounted,
  onScopeDispose,
  toValue,
  watch,
} from 'vue';
import { useId } from '../hooks/use-id';
import isVisible from './is-visible';

/** 判定单个节点是否可被 Tab 聚焦。 */
function focusable(node: HTMLElement, includePositive = false): boolean {
  if (!isVisible(node)) {
    return false;
  }

  const nodeName = node.nodeName.toLowerCase();
  const isFocusableElement =
    ['input', 'select', 'textarea', 'button'].includes(nodeName) ||
    node.isContentEditable ||
    (nodeName === 'a' && !!node.getAttribute('href'));

  const tabIndexAttr = node.getAttribute('tabindex');
  const tabIndexNum = Number(tabIndexAttr);

  let tabIndex: number | null = null;
  if (tabIndexAttr && !Number.isNaN(tabIndexNum)) {
    tabIndex = tabIndexNum;
  } else if (isFocusableElement) {
    tabIndex = 0;
  }

  // 被禁用的控件即使有 tabindex 也不可聚焦
  if (isFocusableElement && (node as HTMLButtonElement).disabled) {
    tabIndex = null;
  }

  return tabIndex !== null && (tabIndex >= 0 || (includePositive && tabIndex < 0));
}

/**
 * 取容器内全部可聚焦元素，**文档顺序**；容器自身可聚焦时放在**队首**。
 *
 * 顺序很关键：`lockFocus` 的 Tab 循环依赖「第一个」和「最后一个」。
 */
export function getFocusNodeList(node: HTMLElement, includePositive = false): HTMLElement[] {
  const res = [...node.querySelectorAll('*')].filter((child) =>
    focusable(child as HTMLElement, includePositive),
  ) as HTMLElement[];
  if (focusable(node, includePositive)) {
    res.unshift(node);
  }
  return res;
}

export interface InputFocusOptions extends FocusOptions {
  /** 聚焦后把光标放到哪里。`start` / `end` / 其它（等价 `all`）。 */
  cursor?: 'start' | 'end' | 'all';
}

/** 聚焦元素；若是 input/textarea 且指定了 `cursor`，同时设置选区。 */
export function triggerFocus(element?: HTMLElement | null, option?: InputFocusOptions): void {
  if (!element) return;
  element.focus(option);

  const { cursor } = option ?? {};
  if (cursor && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    const len = element.value.length;
    switch (cursor) {
      case 'start':
        element.setSelectionRange(0, 0);
        break;
      case 'end':
        element.setSelectionRange(len, len);
        break;
      default:
        element.setSelectionRange(0, len);
    }
  }
}

// ===========================================================================
// 焦点锁定
// ===========================================================================

/** 上一次被观察到的活动元素。Tab 循环用它决定"跳到队首还是队尾"。 */
let lastFocusElement: Element | null = null;
/** 锁定栈：末尾的元素生效。 */
let focusElements: HTMLElement[] = [];
/** 稳定 id → 锁定元素。 */
const idToElementMap = new Map<string, HTMLElement>();
/** 稳定 id → 允许逃逸的元素（如浮层内弹出的第二个浮层）。 */
const ignoredElementMap = new Map<string, HTMLElement>();

function getLastElement(): HTMLElement | undefined {
  return focusElements[focusElements.length - 1];
}

function isIgnoredElement(element: Element | null): boolean {
  const lastElement = getLastElement();
  if (!element || !lastElement) {
    return false;
  }
  let lockId: string | undefined;
  for (const [id, ele] of idToElementMap.entries()) {
    if (ele === lastElement) {
      lockId = id;
      break;
    }
  }
  const ignoredEle = lockId === undefined ? undefined : ignoredElementMap.get(lockId);
  return !!ignoredEle && (ignoredEle === element || ignoredEle.contains(element));
}

function hasFocus(element: HTMLElement): boolean {
  const { activeElement } = document;
  return element === activeElement || element.contains(activeElement);
}

/** `focusin` 处理：焦点逃出锁定区域就拉回来。 */
function syncFocus(): void {
  const lastElement = getLastElement();
  const { activeElement } = document;

  if (isIgnoredElement(activeElement)) {
    return;
  }

  if (lastElement && !hasFocus(lastElement)) {
    const focusableList = getFocusNodeList(lastElement);
    // 优先回到"上次待过的"那个元素，否则回到队首
    const matchElement = focusableList.includes(lastFocusElement as HTMLElement)
      ? (lastFocusElement as HTMLElement)
      : focusableList[0];
    matchElement?.focus({ preventScroll: true });
  } else {
    lastFocusElement = activeElement;
  }
}

/** `keydown` 处理（capture）：在锁定区域的边界处循环 Tab。 */
function onWindowKeyDown(e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;

  const { activeElement } = document;
  const lastElement = getLastElement();
  if (!lastElement) return;

  const focusableList = getFocusNodeList(lastElement);
  const last = focusableList[focusableList.length - 1];

  if (e.shiftKey && activeElement === focusableList[0]) {
    // 队首反向 Tab → 跳到队尾
    lastFocusElement = last ?? null;
  } else if (!e.shiftKey && activeElement === last) {
    // 队尾正向 Tab → 跳到队首
    lastFocusElement = focusableList[0] ?? null;
  }
}

/**
 * 把焦点锁定在 `element` 内。焦点离开时会被强制拉回。
 *
 * @param id 稳定 id（同一逻辑锁定多次调用时用同一个 id）
 * @returns 解除锁定的函数。**必须调用**，否则会残留全局监听。
 */
export function lockFocus(element: HTMLElement, id: string): () => void {
  if (element) {
    idToElementMap.set(id, element);

    // 已在栈中则先移除再 push —— 保证"最后调用者生效"
    focusElements = focusElements.filter((ele) => ele !== element);
    focusElements.push(element);

    // addEventListener 天然去重，重复添加同一个函数引用不会叠加
    window.addEventListener('focusin', syncFocus);
    window.addEventListener('keydown', onWindowKeyDown, true);
    syncFocus();
  }

  return () => {
    lastFocusElement = null;
    focusElements = focusElements.filter((ele) => ele !== element);
    idToElementMap.delete(id);
    ignoredElementMap.delete(id);
    if (focusElements.length === 0) {
      window.removeEventListener('focusin', syncFocus);
      window.removeEventListener('keydown', onWindowKeyDown, true);
    }
  };
}

/**
 * 组合式封装：`lock` 为真时锁定 `getElement` 指向的元素。
 *
 * 元素来源接受 `MaybeRefOrGetter<HTMLElement | null>` —— 这是 Vue 侧对 React `() => ref.current`
 * 的**严格超集**：
 *   - 传 getter（`() => containerRef.value`）→ 与 React 写法一致，行为完全等价
 *   - 传 ref（`containerRef`）→ 额外获得「元素晚于 lock 就绪」的自动响应
 *
 * 为什么必须支持 ref：浮层场景里「open 变 true」和「容器挂载」经常不在同一个 tick
 * （Teleport / 过渡动画 / 嵌套组件的 mounted 顺序）。只靠重试覆盖不到，需要一个响应式来源。
 *
 * Vue 侧的 retry 机制（对应 React 版的 `useRetryEffect`）：
 *   元素可能还没挂载（例如浮层在 Teleport 里、或首次渲染时 ref 还是 null）。
 *   React 版用「重跑一次 effect」处理，我们用「`nextTick` 后再试一次」。
 *   重试上限同样是 **1 次** —— 无限重试会掩盖真正的"ref 永远不会就绪"的 bug。
 *
 * @returns `[ignoreElement]` —— 把一个元素标记为允许逃逸（用于嵌套浮层）
 */
export function useLockFocus(
  lock: MaybeRefOrGetter<boolean>,
  getElement: MaybeRefOrGetter<HTMLElement | null>,
): [(ele: HTMLElement) => void] {
  const id = useId();
  let cleanup: (() => void) | undefined;
  let retried = false;

  const release = (): void => {
    cleanup?.();
    cleanup = undefined;
  };

  const run = (): void => {
    release();
    if (!toValue(lock)) return;

    const element = toValue(getElement);
    if (element) {
      cleanup = lockFocus(element, id);
      return;
    }
    if (!retried) {
      retried = true;
      void nextTick(run);
    }
  };

  const restart = (): void => {
    retried = false;
    run();
  };

  // 首次在挂载后执行（此时 ref 已就绪）；非组件上下文则立即执行
  if (getCurrentInstance()) {
    onMounted(restart);
  } else {
    restart();
  }

  watch(() => toValue(lock), restart, { flush: 'post' });
  // 元素来源本身变化时重新锁定：覆盖「lock 已为 true，但容器晚一个 tick 才挂载」。
  // 传普通 getter 时这里几乎不会触发（闭包里的非响应式变量变化不产生依赖），与 React 行为一致。
  watch(() => toValue(getElement), restart, { flush: 'post' });

  // ⚠️ 必须用 onScopeDispose 而不是 onUnmounted：composable 可能被用在 effectScope 里
  onScopeDispose(release);

  const ignoreElement = (ele: HTMLElement): void => {
    if (ele) {
      // 每个锁定实例只能忽略一个元素，后写覆盖
      ignoredElementMap.set(id, ele);
    }
  };

  return [ignoreElement];
}

/** 测试辅助：清空锁定状态。生产代码不应调用。 */
export function resetFocusLock(): void {
  lastFocusElement = null;
  focusElements = [];
  idToElementMap.clear();
  ignoredElementMap.clear();
}
