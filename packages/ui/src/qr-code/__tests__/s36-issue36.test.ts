/**
 * Issue #36 · [QRCode] canvas 的 CSS width/height 与上游逐字对拍
 *
 * ⚠️ Issue 报告的结论（「canvas 用 `style:{width:size,height:size}`，Vue 不补 px」）
 *    经真浏览器探针复核后**前提有误**：antd 6.6.4 传给 rc 的 `QRCodeCanvas` 是
 *
 *     ```js
 *     style: { width: style?.width, height: style?.height }   // es/qr-code/index.js
 *     ```
 *
 *    而 rc 内部是 `canvasStyle = { height: size, width: size, ...style }` ⇒
 *    **调用方没传 style 时，width/height 被 undefined 覆盖掉** ⇒ 渲染出的
 *    `<canvas height="160" width="160" role="img">` **没有任何内联样式**
 *    （两侧探针实测 DOM 逐字相同，computed 134×134 = 容器内容宽）。
 *
 *    ⇒ 「给 `size` 补 px」是**错的**（会把 canvas 从 134px 撑到 160px，L6 立刻 6 张红）。
 *
 * 真正同族的缺陷在**调用方显式传 `style` 的那条路径**：
 *   ① 本仓 canvas 完全没有下传调用方的 `style.width/height`（antd 会下传）；
 *   ② 传数字时 Vue 不会像 React 那样自动补 `px` ⇒ 裸数字被 CSSOM 丢弃。
 *   两者都让「`<QrCode :style="{ width: 200 }" />`」在两侧渲染不一致。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QrCode } from '../index';

const mountQr = (props: Record<string, unknown>) =>
  mount(QrCode, { props: props as never, attachTo: document.body });

describe('QrCode · Issue #36 canvas 的 CSS 尺寸（对照 antd 6.6.4）', () => {
  beforeEach(() => {
    // jsdom 没有 2d 上下文实现；绘制有 `if (!ctx) return` 守卫，桩成 null 即可
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('[A] 默认（调用方没传 style）⇒ canvas 无内联样式（与 antd 逐字：size 不下传）', () => {
    const w = mountQr({ value: 'apollo' });
    const canvas = w.find('canvas').element;
    expect(canvas.getAttribute('style')).toBeNull();
    expect(canvas.style.width).toBe('');
    expect(canvas.style.height).toBe('');
    // 尺寸由 HTML 属性 + CSS（width/height:100%）决定，与 antd 同构
    expect(canvas.getAttribute('width')).toBe('160');
    expect(canvas.getAttribute('height')).toBe('160');
    w.unmount();
  });

  it('[B] 调用方传对象 style（数字）⇒ canvas 内联样式带 px（核心回归）', () => {
    const w = mountQr({ value: 'apollo', style: { width: 200, height: 180 } });
    const canvas = w.find('canvas').element;
    expect(canvas.style.width).toBe('200px');
    expect(canvas.style.height).toBe('180px');
    // 根元素同样带 px（既有行为，未回归）
    expect((w.element as HTMLElement).style.width).toBe('200px');
    w.unmount();
  });

  it('[C] 调用方传带单位的字符串 ⇒ 原样下传（不重复补 px）', () => {
    const w = mountQr({ value: 'apollo', style: { width: '50%', height: '120px' } });
    const canvas = w.find('canvas').element;
    expect(canvas.style.width).toBe('50%');
    expect(canvas.style.height).toBe('120px');
    w.unmount();
  });

  it('[D] 守卫：只给 width 时 height 不落回 size（antd 的 `style?.height` 语义）', () => {
    const w = mountQr({ value: 'apollo', style: { width: 96 } });
    const canvas = w.find('canvas').element;
    expect(canvas.style.width).toBe('96px');
    expect(canvas.style.height).toBe('');
    // HTML 属性仍是 size（画布坐标尺寸，与 CSS 无关）
    expect(canvas.getAttribute('height')).toBe('160');
    w.unmount();
  });

  it('[E] HTML width/height 属性恒为 size（画布缓冲尺寸，不受 style 影响）', () => {
    const plain = mountQr({ value: 'apollo', size: 128 });
    expect(plain.find('canvas').element.getAttribute('width')).toBe('128');
    plain.unmount();

    const styled = mountQr({ value: 'apollo', size: 128, style: { width: 300 } });
    expect(styled.find('canvas').element.getAttribute('width')).toBe('128');
    expect(styled.find('canvas').element.style.width).toBe('300px');
    styled.unmount();
  });

  it('[F] size 运行时更新：HTML 属性跟着变；无 style 时内联仍为空', async () => {
    const w = mountQr({ value: 'apollo', size: 160 });
    await w.setProps({ size: 96 });
    const canvas = w.find('canvas').element;
    expect(canvas.getAttribute('width')).toBe('96');
    expect(canvas.getAttribute('height')).toBe('96');
    expect(canvas.getAttribute('style')).toBeNull();
    w.unmount();
  });

  it('[H] 根的其它 style 键保留，width/height 仍带 px（合并顺序守卫）', () => {
    const w = mountQr({ value: 'apollo', style: { padding: '4px', width: 200 } });
    const root = w.element as HTMLElement;
    expect(root.style.padding).toBe('4px');
    expect(root.style.width).toBe('200px');
    // height 没给 ⇒ 落回 size 并补 px
    expect(root.style.height).toBe('160px');
    w.unmount();
  });

  it('[G] 守卫：SVG 分支不受影响', () => {
    const w = mountQr({ value: 'apollo', type: 'svg', size: 120 });
    expect(w.find('canvas').exists()).toBe(false);
    expect(w.find('svg').element.getAttribute('width')).toBe('120');
    w.unmount();
  });
});
