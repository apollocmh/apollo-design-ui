/**
 * `useAccessibility` —— rc-menu `hooks/useAccessibility.js` 的 Vue 版。
 *
 * roving tabindex 键盘导航：ArrowUp/Down/Left/Right、Home/End、Enter/Space、
 * Esc。依赖 DOM 查询（`data-menu-id` 协议：`{uuid}-{key}`）。
 *
 * 与 rc 的差异：
 * - raf 用 requestAnimationFrame（取消用 cancelAnimationFrame）；
 * - activeKey 经 ref 读写（rc 用 useRef + forceUpdate，Vue 响应式即等价）。
 */
import { onScopeDispose, type Ref, ref } from 'vue';
import { isEditableMenuTarget } from './native-actions';

// rc-util 的 KeyCode 子集（menu 用到的）
export const KeyCode = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  ENTER: 13,
  ESC: 27,
  HOME: 36,
  END: 35,
  SPACE: 32,
};

const ARROW_KEYS = [KeyCode.UP, KeyCode.DOWN, KeyCode.LEFT, KeyCode.RIGHT];
const NATIVE_KEY_CODES: Record<string, number> = {
  ArrowLeft: KeyCode.LEFT,
  ArrowUp: KeyCode.UP,
  ArrowRight: KeyCode.RIGHT,
  ArrowDown: KeyCode.DOWN,
  Enter: KeyCode.ENTER,
  Escape: KeyCode.ESC,
  Home: KeyCode.HOME,
  End: KeyCode.END,
  ' ': KeyCode.SPACE,
};

/**
 * rc 读 `event.which`（React 合成事件把 `keyCode` 规范化进 `which`）。原生
 * `KeyboardEvent` 在 **jsdom 里 `which` 恒为 0**（只有 `keyCode` 有值）⇒ 键盘导航在
 * jsdom 下等价于全失效、也就无从回归。浏览器两者都有值 ⇒ 兜底不改变真实行为。
 */
export function getEventKeyCode(event: KeyboardEvent): number {
  return event.which || event.keyCode || NATIVE_KEY_CODES[event.key] || 0;
}

type OffsetOp = { offset: number; sibling: boolean } | { inlineTrigger: true } | null;

/** 供 oracle 测试使用（rc 内私有；键位矩阵是行为契约的一部分）。 */
export function getOffset(
  mode: 'inline' | 'horizontal' | 'vertical',
  isRootLevel: boolean,
  isRtl: boolean,
  which: number,
): OffsetOp {
  if (mode === 'inline' && which === KeyCode.ENTER) {
    return { inlineTrigger: true };
  }
  const inline: Record<number, string> = {
    [KeyCode.UP]: 'prev',
    [KeyCode.DOWN]: 'next',
  };
  const horizontal: Record<number, string> = {
    [KeyCode.LEFT]: isRtl ? 'next' : 'prev',
    [KeyCode.RIGHT]: isRtl ? 'prev' : 'next',
    [KeyCode.DOWN]: 'children',
    [KeyCode.ENTER]: 'children',
  };
  const vertical: Record<number, string> = {
    [KeyCode.UP]: 'prev',
    [KeyCode.DOWN]: 'next',
    [KeyCode.ENTER]: 'children',
    [KeyCode.ESC]: 'parent',
    [KeyCode.LEFT]: isRtl ? 'children' : 'parent',
    [KeyCode.RIGHT]: isRtl ? 'parent' : 'children',
  };
  const offsets: Record<string, Record<number, string>> = {
    inline,
    horizontal,
    vertical,
    inlineSub: inline,
    horizontalSub: vertical,
    verticalSub: vertical,
  };
  const type = offsets[`${mode}${isRootLevel ? '' : 'Sub'}`]?.[which];
  switch (type) {
    case 'prev':
      return { offset: -1, sibling: true };
    case 'next':
      return { offset: 1, sibling: true };
    case 'parent':
      return { offset: -1, sibling: false };
    case 'children':
      return { offset: 1, sibling: false };
    default:
      return null;
  }
}

function findContainerUL(element: Element | null): HTMLElement | null {
  let current: Element | null = element;
  while (current) {
    if (current.getAttribute('data-menu-list')) {
      return current as HTMLElement;
    }
    current = current.parentElement;
  }
  return null;
}

interface ElementMaps {
  elements: Set<Element>;
  key2element: Map<string, Element>;
  element2key: Map<Element, string>;
}

/** rc `refreshElements`：按 keys 收集当前 DOM 里存在的元素映射。 */
export function refreshElements(keys: string[], id: string): ElementMaps {
  const elements = new Set<Element>();
  const key2element = new Map<string, Element>();
  const element2key = new Map<Element, string>();
  for (const key of keys) {
    const element = document.querySelector(`[data-menu-id='${getMenuId(id, key)}']`);
    if (element) {
      elements.add(element);
      element2key.set(element, key);
      key2element.set(key, element);
    }
  }
  return { elements, key2element, element2key };
}

/** rc `getMenuId`：`{uuid}-{key}`。 */
export function getMenuId(uuid: string, eventKey: string): string {
  return `${uuid}-${eventKey}`;
}

/** rc-util `focusable` 的元素集合（nodeName / contenteditable / a[href]）。 */
const FOCUSABLE_TAGS = ['input', 'select', 'textarea', 'button'];

/**
 * 🚨 rc 的候选集是 `getFocusNodeList(container, true)` ⇒ `focusable(node, includePositive=true)`
 *    ⇒ **tabindex 为负也要收**（菜单项就是 roving `tabindex="-1"`）。写成
 *    `[tabindex]:not([tabindex="-1"])` 会把所有菜单项全部排除，ArrowUp/Down、Home/End
 *    一个都找不到目标（Issue #22.2）。
 *
 * ⚠️ rc 的「可见性」用 `offsetParent / getBBox / getBoundingClientRect`（真实布局），
 *    jsdom 下恒 false ⇒ 这里退化成 computed style 的「显式隐藏」判定（display:none /
 *    visibility:hidden），语义等价且可测。
 */
function isMenuNodeVisible(node: Element): boolean {
  const view = node.ownerDocument?.defaultView;
  const style = view?.getComputedStyle?.(node as HTMLElement);
  if (!style) return true;
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function focusable(node: Element, includePositive = true): boolean {
  if (!isMenuNodeVisible(node)) return false;
  const htmlNode = node as HTMLElement & { isContentEditable?: boolean; disabled?: boolean };
  const nodeName = node.nodeName.toLowerCase();
  const isFocusableElement =
    FOCUSABLE_TAGS.includes(nodeName) ||
    htmlNode.isContentEditable === true ||
    (nodeName === 'a' && !!node.getAttribute('href'));

  const tabIndexAttr = node.getAttribute('tabindex');
  const tabIndexNum = Number(tabIndexAttr);
  let tabIndex: number | null = null;
  if (tabIndexAttr && !Number.isNaN(tabIndexNum)) {
    tabIndex = tabIndexNum;
  } else if (isFocusableElement && tabIndex === null) {
    tabIndex = 0;
  }
  // 禁用态的原生可聚焦元素不参与（rc 逐字）
  if (isFocusableElement && htmlNode.disabled) {
    tabIndex = null;
  }
  return tabIndex !== null && (tabIndex >= 0 || (includePositive && tabIndex < 0));
}

function getFocusableElements(container: Element | null, elements: Set<Element>): Element[] {
  if (!container) return [];
  const list = Array.from(container.querySelectorAll<HTMLElement>('*')).filter((child) =>
    focusable(child, true),
  );
  if (focusable(container, true)) {
    list.unshift(container as HTMLElement);
  }
  return list.filter((ele) => elements.has(ele));
}

function getFocusElement(activeElement: Element | null, elements: Set<Element>): Element | null {
  let current: Element | null = activeElement ?? document.activeElement;
  while (current) {
    if (elements.has(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getNextFocusElement(
  parentQueryContainer: Element | null,
  elements: Set<Element>,
  focusMenuElement: Element | null,
  offset = 1,
): Element | null {
  if (!parentQueryContainer) {
    return null;
  }
  const sameLevelFocusableMenuElementList = getFocusableElements(parentQueryContainer, elements);
  const count = sameLevelFocusableMenuElementList.length;
  let focusIndex = sameLevelFocusableMenuElementList.indexOf(focusMenuElement as Element);
  if (offset < 0) {
    focusIndex = focusIndex === -1 ? count - 1 : focusIndex - 1;
  } else if (offset > 0) {
    focusIndex += 1;
  }
  focusIndex = (focusIndex + count) % count;
  return sameLevelFocusableMenuElementList[focusIndex] ?? null;
}

export interface AccessibilityHandlers {
  triggerActiveKey: (key: string | undefined) => void;
  /** rc `triggerAccessibilityOpen(key, open?)`。 */
  triggerOpen: (key: string, open?: boolean) => void;
}

export interface UseAccessibilityOptions {
  mode: Ref<'horizontal' | 'vertical' | 'inline'>;
  activeKey: Ref<string | undefined>;
  isRtl: Ref<boolean>;
  id: Ref<string>;
  containerRef: Ref<HTMLElement | null>;
  getKeys: () => string[];
  getKeyPath: (eventKey: string, includeOverflow?: boolean) => string[];
  onActive: (key: string) => void;
  triggerOpen: (key: string, open?: boolean) => void;
  originOnKeyDown?: (e: KeyboardEvent) => void;
}

/** rc `useAccessibility(...)` 返回的 keydown 处理器。 */
export function useAccessibility(options: UseAccessibilityOptions) {
  const rafRef = ref<number | undefined>(undefined);
  const activeRef: Ref<string | undefined> = ref(undefined);
  // rc：activeRef.current = activeKey（每次渲染同步）；Vue 在读取时对齐
  activeRef.value = options.activeKey.value;

  const cleanRaf = (): void => {
    if (rafRef.value !== undefined) cancelAnimationFrame(rafRef.value);
    rafRef.value = undefined;
  };
  onScopeDispose(cleanRaf);

  const tryFocus = (
    menuElement: Element | null | undefined,
    element2key: Map<Element, string>,
  ): void => {
    if (menuElement) {
      let focusTargetElement = menuElement as HTMLElement;
      const link = menuElement.querySelector('a');
      if (link?.getAttribute('href')) {
        focusTargetElement = link as HTMLElement;
      }
      const targetKey = element2key.get(menuElement);
      if (targetKey !== undefined) options.onActive(targetKey);

      cleanRaf();
      rafRef.value = requestAnimationFrame(() => {
        // ⚠️ rc 的 `activeRef.current` 是**每次渲染**跟着 activeKey 走（render 体里赋值）
        //    ⇒ `onActive(targetKey)` 触发重渲染后它就等于 targetKey。本仓在 setup 里只
        //    对齐一次 ⇒ 永远不等于 targetKey ⇒ 焦点一次都不落（Issue #22.2 的下半段）。
        //    ⇒ 直接对齐**实时** activeKey（语义等价：目标没被后续导航顶掉才 focus）。
        if (options.activeKey.value === targetKey) {
          focusTargetElement.focus();
        }
      });
    }
  };

  return (e: KeyboardEvent): void => {
    if (e.defaultPrevented || isEditableMenuTarget(e.target)) {
      options.originOnKeyDown?.(e);
      return;
    }
    const which = getEventKeyCode(e);
    activeRef.value = options.activeKey.value;
    if ([...ARROW_KEYS, KeyCode.ENTER, KeyCode.ESC, KeyCode.HOME, KeyCode.END].includes(which)) {
      const keys = options.getKeys();
      let refreshedElements = refreshElements(keys, options.id.value);
      const { elements, key2element, element2key } = refreshedElements;

      const activeElement = key2element.get(options.activeKey.value ?? '') ?? null;
      const focusMenuElement = getFocusElement(activeElement, elements);
      const focusMenuKey = focusMenuElement ? (element2key.get(focusMenuElement) ?? '') : '';

      const offsetObj = getOffset(
        options.mode.value,
        options.getKeyPath(focusMenuKey, true).length === 1,
        options.isRtl.value,
        which,
      );

      if (!offsetObj && which !== KeyCode.HOME && which !== KeyCode.END) {
        return;
      }

      if (ARROW_KEYS.includes(which) || [KeyCode.HOME, KeyCode.END].includes(which)) {
        e.preventDefault();
      }

      if (
        [KeyCode.HOME, KeyCode.END].includes(which) ||
        (offsetObj && 'sibling' in offsetObj && offsetObj.sibling) ||
        !focusMenuElement
      ) {
        // ========================== Sibling ==========================
        let parentQueryContainer: HTMLElement | null;
        if (!focusMenuElement || options.mode.value === 'inline') {
          parentQueryContainer = options.containerRef.value;
        } else {
          parentQueryContainer = findContainerUL(focusMenuElement);
        }

        let targetElement: Element | null;
        const focusableElements = getFocusableElements(parentQueryContainer, elements);
        if (which === KeyCode.HOME) {
          targetElement = focusableElements[0] ?? null;
        } else if (which === KeyCode.END) {
          targetElement = focusableElements[focusableElements.length - 1] ?? null;
        } else {
          targetElement = getNextFocusElement(
            parentQueryContainer,
            elements,
            focusMenuElement,
            offsetObj && 'offset' in offsetObj ? offsetObj.offset : 1,
          );
        }
        tryFocus(targetElement, element2key);
      } else if (offsetObj && 'inlineTrigger' in offsetObj) {
        // ======================= InlineTrigger =======================
        options.triggerOpen(focusMenuKey);
      } else if (offsetObj && 'offset' in offsetObj && offsetObj.offset > 0) {
        // =========================== Level ===========================
        const popup = focusMenuElement?.getAttribute('aria-haspopup');
        if (popup !== 'true' && popup !== 'menu') {
          options.originOnKeyDown?.(e);
          return;
        }
        options.triggerOpen(focusMenuKey, true);
        cleanRaf();
        rafRef.value = requestAnimationFrame(() => {
          refreshedElements = refreshElements(keys, options.id.value);
          const controlId = focusMenuElement?.getAttribute('aria-controls');
          const subQueryContainer = controlId ? document.getElementById(controlId) : null;
          const targetElement = getNextFocusElement(
            subQueryContainer,
            refreshedElements.elements,
            null,
          );
          tryFocus(targetElement, refreshedElements.element2key);
        });
      } else if (offsetObj && 'offset' in offsetObj && offsetObj.offset < 0) {
        const keyPath = options.getKeyPath(focusMenuKey, true);
        const parentKey = keyPath[keyPath.length - 2] ?? '';
        const parentMenuElement = key2element.get(parentKey);

        options.triggerOpen(parentKey, false);
        tryFocus(parentMenuElement, element2key);
      }
    }

    options.originOnKeyDown?.(e);
  };
}
