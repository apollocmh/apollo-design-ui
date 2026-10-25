/**
 * 焦点工具：可聚焦元素列表、聚焦并定位光标、焦点锁定。
 *
 * 契约来源：`@rc-component/util/Dom/focus`。
 *
 * 每个所属文档独立协调多层锁定：同文档后锁者生效，跨文档不争抢状态或监听。
 */

import {
  getCurrentInstance,
  type MaybeRefOrGetter,
  nextTick,
  onBeforeUpdate,
  onMounted,
  onScopeDispose,
  onUpdated,
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

interface FocusEntry {
  id: string;
  element: HTMLElement;
  state: FocusDocumentState;
  parent: Node | null;
}
interface FocusDocumentState {
  doc: Document;
  view: NonNullable<Document['defaultView']>;
  entries: FocusEntry[];
  lastFocusElement: Element | null;
  sync: () => void;
  keydown: (event: KeyboardEvent) => void;
  observer: MutationObserver;
}

const documentStates = new WeakMap<Document, FocusDocumentState>();
// Only active locks retain their document until the final release/reset.
const activeStates = new Set<FocusDocumentState>();
const ignoredElementMap = new Map<string, HTMLElement>();

function isIgnoredElement(state: FocusDocumentState, element: Element | null): boolean {
  const entry = state.entries.at(-1);
  const ignored = entry && ignoredElementMap.get(entry.id);
  return !!element && !!ignored && (ignored === element || ignored.contains(element));
}

function syncFocus(state: FocusDocumentState): void {
  const entry = state.entries.at(-1);
  const active = state.doc.activeElement;
  if (!entry || isIgnoredElement(state, active)) return;
  if (entry.element === active || entry.element.contains(active)) {
    state.lastFocusElement = active;
    return;
  }
  const nodes = getFocusNodeList(entry.element);
  const target = nodes.find((node) => node === state.lastFocusElement) ?? nodes[0] ?? entry.element;
  target.focus({ preventScroll: true });
}

function onWindowKeyDown(state: FocusDocumentState, event: KeyboardEvent): void {
  if (event.key !== 'Tab' || event.defaultPrevented) return;
  const entry = state.entries.at(-1);
  if (!entry || isIgnoredElement(state, state.doc.activeElement)) return;
  const nodes = getFocusNodeList(entry.element);
  const first = nodes[0];
  const last = nodes.at(-1);
  const target = !nodes.length
    ? entry.element
    : event.shiftKey && state.doc.activeElement === first
      ? last
      : !event.shiftKey && state.doc.activeElement === last
        ? first
        : undefined;
  if (target) {
    event.preventDefault();
    state.lastFocusElement = target;
    target.focus({ preventScroll: true });
  }
}

function getDocumentState(
  doc: Document,
  view: NonNullable<Document['defaultView']>,
): FocusDocumentState {
  let state = documentStates.get(doc);
  if (!state) {
    const created: FocusDocumentState = {
      doc,
      view,
      entries: [],
      lastFocusElement: null,
      sync: () => syncFocus(created),
      keydown: (event) => onWindowKeyDown(created, event),
      observer: new view.MutationObserver((records) => {
        const remembered = created.lastFocusElement;
        for (const entry of [...created.entries]) {
          const nextDocument = entry.element.ownerDocument;
          const nextView = nextDocument.defaultView;
          const moved =
            entry.parent !== entry.element.parentNode ||
            records.some((record) =>
              [...record.removedNodes].some(
                (node) => node === entry.element || node.contains(entry.element),
              ),
            );
          entry.parent = entry.element.parentNode;
          if (nextDocument === created.doc) {
            if (
              moved &&
              entry.element.isConnected &&
              created.entries.at(-1) === entry &&
              created.doc.activeElement === created.doc.body
            )
              syncFocus(created);
            continue;
          }
          if (!nextView) continue;
          removeEntry(entry);
          const next = getDocumentState(nextDocument, nextView);
          entry.state = next;
          addEntry(entry);
          if (remembered && entry.element.contains(remembered)) {
            next.lastFocusElement = remembered;
            if (
              next.doc.activeElement === next.doc.body ||
              next.doc.activeElement === entry.element
            ) {
              getFocusNodeList(entry.element, true)
                .find((node) => node === remembered)
                ?.focus({ preventScroll: true });
            }
          }
          syncFocus(next);
        }
      }),
    };
    state = created;
    documentStates.set(doc, state);
  }
  return state;
}

function detach(state: FocusDocumentState): void {
  state.observer.disconnect();
  state.view.removeEventListener('focusin', state.sync);
  state.view.removeEventListener('keydown', state.keydown);
  activeStates.delete(state);
  if (documentStates.get(state.doc) === state) documentStates.delete(state.doc);
}

function removeEntry(entry: FocusEntry): void {
  const state = entry.state;
  state.entries = state.entries.filter((existing) => existing !== entry);
  state.lastFocusElement = null;
  if (!state.entries.length) detach(state);
}

function addEntry(entry: FocusEntry): void {
  const state = entry.state;
  state.entries = state.entries.filter(
    (existing) => existing.id !== entry.id && existing.element !== entry.element,
  );
  state.entries.push(entry);
  if (!activeStates.has(state)) {
    activeStates.add(state);
    state.view.addEventListener('focusin', state.sync);
    state.view.addEventListener('keydown', state.keydown);
    // Teleport can adopt the same node without changing any Vue ref. One native
    // observer per active document tracks ownership, including ancestor moves.
    state.observer.observe(state.doc, { childList: true, subtree: true });
  }
}

/**
 * Lock focus in the element's own document. Later locks in that document take
 * priority. Ownership follows native DOM adoption; the release always removes
 * this registration from its current window, including after a Teleport move.
 */
export function lockFocus(element: HTMLElement, id: string): () => void {
  const view = element.ownerDocument.defaultView;
  if (!view) return () => {};
  const state = getDocumentState(element.ownerDocument, view);
  const entry: FocusEntry = { id, element, state, parent: element.parentNode };
  addEntry(entry);
  syncFocus(state);

  return () => {
    if (!entry.state.entries.includes(entry)) return;
    removeEntry(entry);
    ignoredElementMap.delete(id);
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
  let disposed = false;

  const release = (): void => {
    cleanup?.();
    cleanup = undefined;
  };

  const run = (): void => {
    if (disposed) return;
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
    let focusedBeforeUpdate: HTMLElement | undefined;
    onBeforeUpdate(() => {
      const element = toValue(getElement);
      focusedBeforeUpdate =
        element && toValue(lock)
          ? getFocusNodeList(element, true).find(
              (node) => node === element.ownerDocument.activeElement,
            )
          : undefined;
    });
    onUpdated(() => {
      const element = toValue(getElement);
      const previous = focusedBeforeUpdate;
      focusedBeforeUpdate = undefined;
      if (
        previous?.isConnected &&
        element?.contains(previous) &&
        toValue(lock) &&
        (element.ownerDocument.activeElement === element.ownerDocument.body ||
          element.ownerDocument.activeElement === element)
      ) {
        previous.focus({ preventScroll: true });
      }
    });
    onMounted(restart);
  } else {
    restart();
  }

  watch(() => toValue(lock), restart, { flush: 'post' });
  // 元素来源本身变化时重新锁定：覆盖「lock 已为 true，但容器晚一个 tick 才挂载」。
  // 传普通 getter 时这里几乎不会触发（闭包里的非响应式变量变化不产生依赖），与 React 行为一致。
  watch(() => toValue(getElement), restart, { flush: 'post' });

  // ⚠️ 必须用 onScopeDispose 而不是 onUnmounted：composable 可能被用在 effectScope 里
  onScopeDispose(() => {
    disposed = true;
    release();
    ignoredElementMap.delete(id);
  });

  const ignoreElement = (ele: HTMLElement): void => {
    if (ele && !disposed) {
      // 每个锁定实例只能忽略一个元素，后写覆盖
      ignoredElementMap.set(id, ele);
    }
  };

  return [ignoreElement];
}

/** 测试辅助：清空锁定状态。生产代码不应调用。 */
export function resetFocusLock(): void {
  for (const state of activeStates) {
    state.entries = [];
    state.lastFocusElement = null;
    detach(state);
  }
  ignoredElementMap.clear();
}
