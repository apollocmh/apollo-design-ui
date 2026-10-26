/**
 * 焦点恢复 —— 浮层打开时记住「焦点原本在哪」，关闭时还回去。
 *
 * 契约来源：`@rc-component/dialog@1.10.0/es/Dialog/index.js:53-95`
 * （`saveLastOutSideActiveElementRef` / `focusDialogContent` / `doClose`）。
 *
 * 陷阱本身在 `@apollo-design/utils`（`lockFocus` / `useLockFocus`）—— 见契约文档 §1.1，
 * 本文件只补上游 dialog 里那三条**恢复**的门控判据。
 */

import { containsComposed as contains, getActiveElement } from '@apollo-design/utils';
import { type MaybeRefOrGetter, nextTick, onScopeDispose, toValue } from 'vue';

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
  /** 打开前保存当前外部焦点；已知封闭根可显式传目标，null表示不保存。 */
  save(target?: Element | null): void;
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
function focusElement(element: Element | null, options?: FocusOptions): void {
  if (element && 'focus' in element && typeof element.focus === 'function') element.focus(options);
}

interface RestoreEntry {
  getContainer: () => HTMLElement | null;
  targets: Element[];
}

interface DocumentRestores {
  entries: Set<RestoreEntry>;
  saveVersion: number;
}

// Entries exist only while a helper owns an actual outside return target. A weak
// document key keeps independent documents isolated and never registers SSR scopes.
const documentRestores = new WeakMap<Document, DocumentRestores>();

function restoreConnectedTarget(targets: Element[]): Element | null {
  const target = targets.find((element) => element.isConnected);
  if (!target) return null;
  try {
    focusElement(target, { preventScroll: true });
    return target;
  } catch {
    // A target may have become unusable since save(). Restoration stays best effort.
    return null;
  }
}

export function useFocusRestore(
  getContainer: () => HTMLElement | null,
  options: FocusRestoreOptions = {},
): FocusRestoreHandle {
  const entry: RestoreEntry = { getContainer, targets: [] };
  let registered: DocumentRestores | null = null;

  const clearSaved = (): void => {
    registered?.entries.delete(entry);
    registered = null;
    entry.targets = [];
  };

  const getCurrentActiveElement = (): Element | null => {
    const container = getContainer();
    const doc = container?.ownerDocument ?? (typeof document !== 'undefined' ? document : null);
    return getActiveElement(container ?? doc);
  };

  const save = (target?: Element | null): void => {
    const active = target === undefined ? getCurrentActiveElement() : target;
    // 门 1：焦点已在容器内 ⇒ 不覆盖。否则嵌套浮层会把「外层浮层内的元素」
    //      记成「外部焦点」，关闭内层时焦点跳到外层的某个控件上。
    if (contains(getContainer(), active)) return;
    clearSaved();
    if (!active) return;

    const doc = active.ownerDocument;
    let state = documentRestores.get(doc);
    if (!state) {
      state = { entries: new Set(), saveVersion: 0 };
      documentRestores.set(doc, state);
    }
    // Even a layer starting from body cancels older deferred restoration. It may
    // receive its Portal content and initial focus on the following Vue tick.
    state.saveVersion++;
    if (!active.isConnected || active === doc.body || active === doc.documentElement) return;

    let owner: RestoreEntry | undefined;
    let ownerContainer: HTMLElement | null = null;
    for (const candidate of state.entries) {
      const container = candidate.getContainer();
      if (
        container &&
        contains(container, active) &&
        (!ownerContainer || contains(ownerContainer, container))
      ) {
        owner = candidate;
        ownerContainer = container;
      }
    }
    // Copy the nearest layer's chain now: its scope and DOM may disappear before
    // this layer closes. No reference to the owning helper is retained.
    entry.targets = [...new Set([active, ...(owner?.targets ?? [])])];
    registered = state;
    state.entries.add(entry);
  };

  const focusContent = (): void => {
    const active = getCurrentActiveElement();
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
    if (!mask || !enabled || !entry.targets.length) {
      return;
    }

    const targets = entry.targets;
    const doc = targets[0]?.ownerDocument;
    const state = registered;
    const saveVersion = state?.saveVersion;
    clearSaved();
    const target = restoreConnectedTarget(targets);
    if (!target || !doc || getActiveElement(target) === target) return;

    // A later layer can synchronously redirect this attempt before its own scope
    // releases its lock. Retry once after teardown only if focus fell to body;
    // a user choice or a new opening layer always takes priority.
    void nextTick(() => {
      if (getActiveElement(target) === doc.body && state?.saveVersion === saveVersion) {
        restoreConnectedTarget(targets);
      }
    });
  };

  onScopeDispose(clearSaved);

  return { save, focusContent, restore };
}
