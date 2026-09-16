/**
 * L2 交互测试 —— `measureAlign` 的**副作用生命周期**。
 *
 * 与 `measure.test.ts` 的分工：那边断言「算出来的数字对不对」，
 * 这边断言「动过的 DOM 有没有还原干净」。
 *
 * 为什么这一层必须单独存在：`measureAlign` 是全包唯一会**改写 DOM** 的函数
 * （临时把浮层归零、插占位元素）。数字算错只会摆错位置，还原不干净则会把
 * `left:0 / right:0 / overflow:hidden` 永久留在浮层上，或者在容器里
 * 累积一堆占位 div —— 症状出现在**下一次**布局，非常难查。
 *
 * 钉住的四条不变量：
 *   1. 7 个 inline 样式键原样还原（含「从未被改写」的 overflowX / overflowY）
 *   2. 早退路径（scale 为 0 / target 不可见）**同样**要还原
 *   3. 抛异常路径也要还原 —— 这是与 antd 的**有意**差异，见 `measure.ts`
 *   4. placeholder 的插入时机在读取 `offsetLeft` **之前**（antd 117–123 的顺序）
 */

import { afterEach, describe, expect, it } from 'vitest';
import { measureAlign } from '../index';
import { buildRig, CONTAINER, POPUP_SIZE, resetDom, stubEle } from './measure-rig';

afterEach(resetDom);

/** 需要逐项还原的 inline 样式键 —— 必须与 `measure.ts` 的 RESTORE_KEYS 一致。 */
const RESTORE_KEYS = [
  'left',
  'top',
  'right',
  'bottom',
  'overflow',
  'overflowX',
  'overflowY',
] as const;

function readInline(el: HTMLElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of RESTORE_KEYS) {
    out[key] = el.style[key];
  }
  return out;
}

/** 捕获容器上所有被 append 的节点 —— placeholder 会被移除，只能这样拿到它。 */
function captureAppended(container: HTMLElement): Node[] {
  const appended: Node[] = [];
  const original = container.appendChild.bind(container);
  container.appendChild = <T extends Node>(node: T): T => {
    appended.push(node);
    return original(node);
  };
  return appended;
}

describe('measureAlign · inline 样式还原', () => {
  it('成功路径：7 个键全部原样还原', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      const before = {
        left: '20px',
        top: '30px',
        right: '5px',
        bottom: '6px',
        overflow: 'auto',
        overflowX: 'scroll',
        overflowY: 'hidden',
      };
      Object.assign(popup.style, before);
      expect(readInline(popup)).toEqual(before);

      expect(measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] })).not.toBeNull();
      expect(readInline(popup)).toEqual(before);
    } finally {
      restoreDoc();
    }
  });

  it('还原的是**原值**而不是清空 —— 原本有 right 的浮层不会丢失它', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      popup.style.right = '7px';
      popup.style.bottom = '8px';
      measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });
      expect(popup.style.right).toBe('7px');
      expect(popup.style.bottom).toBe('8px');
    } finally {
      restoreDoc();
    }
  });

  it('原本没有 inline 样式时还原为空串，而不是 "auto" 之类的残留', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });
      expect(readInline(popup)).toEqual({
        left: '',
        top: '',
        right: '',
        bottom: '',
        overflow: '',
        overflowX: '',
        overflowY: '',
      });
    } finally {
      restoreDoc();
    }
  });

  it('早退路径同样还原 —— scale 为 0 时返回 null，但样式必须已经复原', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      popup.style.left = '20px';
      popup.style.overflow = 'auto';
      // 实测宽 0 而 CSS 声明 80px ⇒ scaleX = 0 ⇒ 早退
      popup.getBoundingClientRect = () => new DOMRect(0, 0, 0, 40);

      expect(measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] })).toBeNull();
      expect(popup.style.left).toBe('20px');
      expect(popup.style.overflow).toBe('auto');
    } finally {
      restoreDoc();
    }
  });

  it('抛异常路径也要还原 —— antd 没有 try/finally，这里是有意加强', () => {
    const { popup, restoreDoc, container } = buildRig();
    const appended = captureAppended(container);
    try {
      popup.style.left = '33px';
      let calls = 0;
      popup.getBoundingClientRect = () => {
        calls += 1;
        if (calls >= 2) throw new Error('mirror measure failed');
        return new DOMRect(CONTAINER.x, CONTAINER.y, POPUP_SIZE.width, POPUP_SIZE.height);
      };

      expect(() => measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] })).toThrow(
        'mirror measure failed',
      );
      // 异常照常向上抛（不吞异常），但 DOM 必须是干净的
      expect(popup.style.left).toBe('33px');
      expect(appended).toHaveLength(1);
      expect(container.contains(appended[0] as Node)).toBe(false);
    } finally {
      restoreDoc();
    }
  });
});

describe('measureAlign · placeholder 生命周期', () => {
  it('测量结束后容器里只剩浮层，不残留占位元素', () => {
    const { popup, container, restoreDoc } = buildRig();
    try {
      measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });
      expect(container.children).toHaveLength(1);
      expect(container.firstElementChild).toBe(popup);
    } finally {
      restoreDoc();
    }
  });

  it('placeholder 复制了浮层的定位与尺寸，用来顶住布局', () => {
    const { popup, container, restoreDoc } = buildRig();
    const appended = captureAppended(container);
    try {
      Object.defineProperty(popup, 'offsetLeft', { value: 12, configurable: true });
      Object.defineProperty(popup, 'offsetTop', { value: 34, configurable: true });
      Object.defineProperty(popup, 'offsetWidth', { value: 80, configurable: true });
      Object.defineProperty(popup, 'offsetHeight', { value: 40, configurable: true });

      measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });

      const placeholder = appended[0] as HTMLElement;
      expect(placeholder).toBeInstanceOf(HTMLElement);
      expect(placeholder.style.left).toBe('12px');
      expect(placeholder.style.top).toBe('34px');
      expect(placeholder.style.width).toBe('80px');
      expect(placeholder.style.height).toBe('40px');
      // position 取自**改动之前**的 computed style（antd 99–101）
      expect(placeholder.style.position).toBe('absolute');
    } finally {
      restoreDoc();
    }
  });

  it('插入发生在读取 offsetLeft 之前 —— antd 117–123 的顺序，不可调换', () => {
    const { popup, container, restoreDoc } = buildRig();
    try {
      let siblingsWhenOffsetRead = -1;
      Object.defineProperty(popup, 'offsetLeft', {
        configurable: true,
        get: () => {
          // 插入前容器只有浮层（1 个）；插入后是浮层 + placeholder（2 个）
          siblingsWhenOffsetRead = container.childElementCount;
          return 12;
        },
      });

      measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });

      // 若实现写成「先设样式再插入」，这里会是 1，读到的 offsetLeft 就与 antd 不同
      expect(siblingsWhenOffsetRead).toBe(2);
    } finally {
      restoreDoc();
    }
  });

  it('浮层没有父元素时不创建占位元素，也不抛错', () => {
    const { restoreDoc } = buildRig();
    // ⚠️ 不能用 `cloneNode` —— 它只复制属性，**不复制**挂在实例上的
    //    `getBoundingClientRect` 桩，克隆体的 rect 会退回 jsdom 的恒 0，
    //    进而让 scaleX = 0 走早退分支，测的就不是「无父元素」这件事了。
    const orphan = stubEle({
      rect: { x: 100, y: 200, width: 80, height: 40 },
      css: { width: '80px', height: '40px' },
    });
    orphan.remove();
    try {
      expect(orphan.parentElement).toBeNull();
      const result = measureAlign({ popupEle: orphan, target: [0, 0], scrollers: [] });
      expect(result).not.toBeNull();
      // 没有父元素 ⇒ 占位元素无处可插，也不该被插到别处
      expect(orphan.parentElement).toBeNull();
    } finally {
      restoreDoc();
    }
  });
});
