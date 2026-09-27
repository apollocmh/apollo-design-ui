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
import { type Ref, ref } from 'vue';

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

function getFocusableElements(container: Element | null, elements: Set<Element>): Element[] {
  if (!container) return [];
  const list = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ),
  );
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
        if (activeRef.value === targetKey) {
          focusTargetElement.focus();
        }
      });
    }
  };

  return (e: KeyboardEvent): void => {
    const { which } = e;
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
