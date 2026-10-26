/**
 * Issue #36 regression scenarios retained under the native root/graphic contract.
 * Root CSS dimensions no longer copy React style fields into the canvas. All
 * eight original cases retain root sizing, logical buffer and mode assertions;
 * actual inner geometry is checked in qrcode-contract-audit.mjs.
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StyleValue } from 'vue';
import { QrCode } from '../index';
import type { QRCodeProps } from '../interface';

const mountQr = (props: QRCodeProps & { style?: StyleValue }) =>
  mount(QrCode, { props, attachTo: document.body });
const rootStyle = (wrapper: ReturnType<typeof mountQr>) => wrapper.get('div').element.style;

describe('QrCode · Issue #36 canvas 的 CSS 尺寸（对照 antd 6.6.4）', () => {
  beforeEach(() => {
    // jsdom 没有 2d 上下文实现；绘制有 `if (!ctx) return` 守卫，桩成 null 即可
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('[A] 默认尺寸留根，canvas由内部区域布局', () => {
    const w = mountQr({ value: 'apollo' });
    const canvas = w.find('canvas').element;
    expect(canvas.getAttribute('style')).toBeNull();
    expect(canvas.style.width).toBe('');
    expect(canvas.style.height).toBe('');
    // size定义逻辑缓冲；CSS按根内部区域布局。
    expect(canvas.getAttribute('width')).toBe('160');
    expect(canvas.getAttribute('height')).toBe('160');
    w.unmount();
  });

  it('[B] 原生数字宽高只作用根，逻辑缓冲不变', () => {
    const w = mountQr({ value: 'apollo', style: { width: 200, height: 180 } });
    const canvas = w.find('canvas').element;
    expect(canvas.style.width).toBe('');
    expect(canvas.style.height).toBe('');
    expect(rootStyle(w).height).toBe('180px');
    // 根元素同样带 px（既有行为，未回归）
    expect(rootStyle(w).width).toBe('200px');
    w.unmount();
  });

  it('[C] 带单位的宽高留在根，图像不复制根的百分比', () => {
    const w = mountQr({ value: 'apollo', style: { width: '50%', height: '120px' } });
    const canvas = w.find('canvas').element;
    expect(canvas.style.width).toBe('');
    expect(rootStyle(w).width).toBe('50%');
    expect(canvas.style.height).toBe('');
    expect(rootStyle(w).height).toBe('120px');
    w.unmount();
  });

  it('[D] 只给根width时，根height与逻辑缓冲保持size', () => {
    const w = mountQr({ value: 'apollo', style: { width: 96 } });
    const canvas = w.find('canvas').element;
    expect(canvas.style.width).toBe('');
    expect(rootStyle(w).width).toBe('96px');
    expect(rootStyle(w).height).toBe('160px');
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
    expect(styled.find('canvas').element.style.width).toBe('');
    expect(rootStyle(styled).width).toBe('300px');
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
    const root = w.get('div').element;
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
