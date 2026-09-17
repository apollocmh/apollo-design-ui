/**
 * 焦点恢复 —— 浮层打开时记住「焦点原本在哪」，关闭时还回去。
 *
 * 契约来源：`@rc-component/dialog@1.10.0/es/Dialog/index.js:53-95`
 * （`saveLastOutSideActiveElementRef` / `focusDialogContent` / `doClose`）。
 *
 * 陷阱本身在 `@apollo-design/utils`（`lockFocus` / `useLockFocus`）—— 见契约文档 §1.1，
 * 本文件只补上游 dialog 里那三条**恢复**的门控判据。
 */

import { contains } from '@apollo-design/utils';
import { type MaybeRefOrGetter, onScopeDispose, toValue } from 'vue';

export interface FocusRestoreOptions {
  /**
   * 对应 rc-dialog 的 `mask`。
   *
   * ⚠️ 上游把「是否恢复焦点」额外门控在 `mask` 上 —— 无遮罩的 dialog **不恢复**。
   * 这看起来像 bug，但它是可观察行为，别顺手修（契约文档 §3.5 第 2 条）。
   * 默认 `true`。
   */
  mask?: MaybeRefOrGetter<boolean>;
  /** 对应 rc-dialog 的 `focusTriggerAfterClose`。默认 `true`。 */
  enabled?: MaybeRefOrGetter<boolean>;
}

export interface FocusRestoreHandle {
  /** 浮层**打开前**调用：记住当前焦点（仅当焦点不在容器内） */
  save(): void;
  /** 浮层打开后调用：焦点若还在外面，就移到容器上 */
  focusContent(): void;
  /** 浮层关闭时调用：把焦点还给 `save()` 记住的元素（只生效一次） */
  restore(): void;
}

/**
 * `Element` 基类上没有 `focus()`（`HTMLElement` / `SVGElement` 才有），
 * 而 antd 直接对 `document.activeElement` 调 `.focus()`。
 * 这里做一次窄化 + 可选调用，避免在 SVG 元素上炸掉。
 */
type MaybeFocusable = Element & { focus?: (options?: FocusOptions) => void };

function focusElement(element: Element | null, options?: FocusOptions): void {
  (element as MaybeFocusable | null)?.focus?.(options);
}

export function useFocusRestore(
  getContainer: () => HTMLElement | null,
  options: FocusRestoreOptions = {},
): FocusRestoreHandle {
  let saved: Element | null = null;

  const getActiveElement = (): Element | null => {
    const container = getContainer();
    const doc = container?.ownerDocument ?? (typeof document !== 'undefined' ? document : null);
    return doc?.activeElement ?? null;
  };

  const save = (): void => {
    const active = getActiveElement();
    // 门 1：焦点已在容器内 ⇒ 不覆盖。否则嵌套浮层会把「外层浮层内的元素」
    //      记成「外部焦点」，关闭内层时焦点跳到外层的某个控件上。
    if (!contains(getContainer(), active)) {
      saved = active;
    }
  };

  const focusContent = (): void => {
    const active = getActiveElement();
    // 门 2：与 save 同一个门 —— 焦点已在容器内就不动它（避免抢走用户刚点的东西）
    if (!contains(getContainer(), active)) {
      // 上游这里是裸的 `contentRef.current?.focus()`，没有 preventScroll
      focusElement(getContainer());
    }
  };

  const restore = (): void => {
    const mask = toValue(options.mask) ?? true;
    const enabled = toValue(options.enabled) ?? true;

    // 门 3：无遮罩 ⇒ 不恢复。见 `FocusRestoreOptions.mask` 的注释。
    if (!mask || !enabled || !saved) {
      return;
    }

    try {
      focusElement(saved, { preventScroll: true });
    } catch {
      // antd 原样吞掉异常：要恢复的元素可能已经被从文档里移除。
      // 这里什么都不做 —— 焦点保持在 body 上是可接受的降级。
    }

    // 只恢复一次。上游在 try/catch **之后**置 null，所以异常时同样会置。
    saved = null;
  };

  onScopeDispose(() => {
    saved = null;
  });

  return { save, focusContent, restore };
}
