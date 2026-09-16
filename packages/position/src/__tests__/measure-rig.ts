/**
 * `measure.ts` 测试的共享桩替工具。
 *
 * 被 `measure.test.ts`（L1，逐项公式）与 `measure-session.test.ts`（L2，副作用生命周期）
 * 共同使用 —— 两处需要的是**同一套** DOM 度量桩，各写一份会各自漂移（TESTING.md T2）。
 *
 * ⚠️ 文件名不带 `.test.ts`，因此不会被 vitest 当成用例收集；
 *    又因为在 `__tests__/` 下，也不会被计入覆盖率。
 *
 * 为什么需要这些桩：jsdom 没有布局引擎 ——
 *   `getBoundingClientRect()` 恒 0、`offsetWidth/clientWidth` 恒 0、
 *   `clientWidth/scrollWidth` 恒 0。不桩替的话任何公式都退化成 0，
 *   退化后的断言证明不了任何事。
 */

interface StubMetrics {
  /** `getBoundingClientRect()` 的返回值 */
  rect?: { x: number; y: number; width: number; height: number };
  /** 含滚动条与边框的外框尺寸 */
  offset?: { width: number; height: number };
  /** 不含滚动条、含 padding 的内框尺寸 */
  client?: { width: number; height: number };
  /** 四条边框宽度（px） */
  border?: { top?: number; bottom?: number; left?: number; right?: number };
  /** 额外 inline 样式，会传导到 computed style（jsdom 已实测支持） */
  css?: Record<string, string>;
}

/**
 * 造一个度量值可控的元素。
 *
 * ⚠️ 四条边框**必须显式给出**（缺省 0）。jsdom 的 `getComputedStyle().borderTopWidth`
 *    对未设置的元素返回 **"16px"** —— 既不是 CSS 初始值 `medium`(3px)，也不是 0。
 *    不显式归零，公式里就会混进这个 16，断言会变得无法解释。
 *
 * ⚠️ 元素被挂进 `document.body`：jsdom 对 detached 元素的 `getComputedStyle`
 *    行为不稳，而 `getWin` 又依赖 `ownerDocument.defaultView`。
 */
export function stubEle(m: StubMetrics = {}): HTMLElement {
  const el = document.createElement('div');
  const border = m.border ?? {};

  el.style.borderTopWidth = `${border.top ?? 0}px`;
  el.style.borderBottomWidth = `${border.bottom ?? 0}px`;
  el.style.borderLeftWidth = `${border.left ?? 0}px`;
  el.style.borderRightWidth = `${border.right ?? 0}px`;

  for (const [prop, value] of Object.entries(m.css ?? {})) {
    el.style.setProperty(prop, value);
  }

  const r = m.rect ?? { x: 0, y: 0, width: 0, height: 0 };
  el.getBoundingClientRect = () => new DOMRect(r.x, r.y, r.width, r.height);

  Object.defineProperty(el, 'offsetWidth', {
    value: m.offset?.width ?? r.width,
    configurable: true,
  });
  Object.defineProperty(el, 'offsetHeight', {
    value: m.offset?.height ?? r.height,
    configurable: true,
  });
  Object.defineProperty(el, 'clientWidth', {
    value: m.client?.width ?? r.width,
    configurable: true,
  });
  Object.defineProperty(el, 'clientHeight', {
    value: m.client?.height ?? r.height,
    configurable: true,
  });

  document.body.appendChild(el);
  return el;
}

/**
 * 临时改写 `documentElement` 的尺寸属性。
 *
 * jsdom 的 `clientWidth` / `scrollWidth` 等恒为 0，不桩替的话
 * `getViewportArea` 与 `getScrollArea` 永远返回 `{0,0,0,0}`，测不出区别。
 *
 * @returns 还原函数 —— 用 `Reflect.deleteProperty` 而不是 `delete el[key]`，
 *          后者在 TS 下会因为索引表达式不是已知键而报错。
 */
export function stubDocEl(props: Record<string, number>): () => void {
  const el = document.documentElement;
  const saved = new Map<string, PropertyDescriptor | undefined>();

  for (const [key, value] of Object.entries(props)) {
    saved.set(key, Object.getOwnPropertyDescriptor(el, key));
    Object.defineProperty(el, key, { value, configurable: true });
  }

  return () => {
    for (const [key, descriptor] of saved) {
      if (descriptor) {
        Object.defineProperty(el, key, descriptor);
      } else {
        Reflect.deleteProperty(el, key);
      }
    }
  };
}

/** 每个用例之后必须调用：清掉挂在 document 上的桩，否则会串味到别的用例。 */
export function resetDom(): void {
  document.body.removeAttribute('style');
  document.documentElement.removeAttribute('style');
  document.body.innerHTML = '';
}

/** 模拟的容器：`getPopupContainer` 返回的那个元素，在视口 (100,200)，尺寸 300×200。 */
export const CONTAINER = { x: 100, y: 200, width: 300, height: 200 };

/** 模拟的浮层尺寸。 */
export const POPUP_SIZE = { width: 80, height: 40 };

export interface Rig {
  container: HTMLElement;
  popup: HTMLElement;
  restoreDoc: () => void;
}

/**
 * 造一套「容器 + 浮层」，并让浮层的 rect **随 inline 定位变化**。
 *
 * 这是 jsdom 里唯一能表达「`left: 0` 意味着贴容器左缘」的方式 ——
 * 也是 `position-contract.md` §3.1（归零不变量）能被真正测到的前提。
 *
 * @param popupSize 允许覆盖浮层尺寸，用于构造 scale 为 0 之类的退化场景
 */
export function buildRig(popupSize: { width: number; height: number } = POPUP_SIZE): Rig {
  const container = stubEle({
    rect: CONTAINER,
    css: { width: '300px', height: '200px' },
  });
  const popup = stubEle({ css: { width: '80px', height: '40px', position: 'absolute' } });
  container.appendChild(popup);

  popup.getBoundingClientRect = () => {
    const s = popup.style;
    let x = CONTAINER.x;
    let y = CONTAINER.y;
    if (s.left && s.left !== 'auto') x = CONTAINER.x + Number.parseFloat(s.left);
    if (s.top && s.top !== 'auto') y = CONTAINER.y + Number.parseFloat(s.top);
    if (s.right && s.right !== 'auto') {
      x = CONTAINER.x + CONTAINER.width - popupSize.width - Number.parseFloat(s.right);
    }
    if (s.bottom && s.bottom !== 'auto') {
      y = CONTAINER.y + CONTAINER.height - popupSize.height - Number.parseFloat(s.bottom);
    }
    return new DOMRect(x, y, popupSize.width, popupSize.height);
  };

  const restoreDoc = stubDocEl({
    clientWidth: 800,
    clientHeight: 600,
    scrollWidth: 2000,
    scrollHeight: 1500,
    scrollLeft: 20,
    scrollTop: 10,
  });

  return { container, popup, restoreDoc };
}
