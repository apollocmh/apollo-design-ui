/**
 * Issue #37 · [QRCode] 前景色 / 背景色变化未触发 canvas 重绘
 *
 * 上游 rc `QRCodeCanvas` 的绘制挂在 **`React.useEffect(() => {...})`（无依赖数组）**
 * ⇒ **每次渲染后都重绘**，颜色 / size / cells / 图片加载任一变化都会落到画布上。
 *
 * 本仓写的是 `watch([qr, imageLoaded], …, {flush:'post'})` —— `qr` 只覆盖
 * 「值 / 纠错级 / margin / size / icon」这些**几何输入**，而 `drawCanvas` 里读的
 * `props.bgColor` / `color` 不在依赖里 ⇒ 只改颜色时画布保留旧像素（Issue #37.1）。
 */

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_FRONT_COLOR } from '../engine/utils';
import { QrCode } from '../index';

/** 记录每次绘制写入的 fillStyle 序列（bg → fg），以及画布缓冲尺寸。 */
const makeCtx = () => {
  const fills: string[] = [];
  const ctx = {
    fills,
    buffered: [] as number[],
    globalAlpha: 1,
    scale: vi.fn(),
    fillRect: vi.fn(),
    fill: vi.fn(),
    drawImage: vi.fn(),
    get fillStyle(): string {
      return fills[fills.length - 1] ?? '';
    },
    set fillStyle(v: string) {
      fills.push(v);
    },
  };
  return ctx;
};

let ctx: ReturnType<typeof makeCtx>;

const mountQr = (props: Record<string, unknown> = {}) =>
  mount(QrCode, { props: { value: 'apollo', ...props } as never });

/** 一次完整绘制的 fillStyle 序列（bg, fg） */
const lastPair = () => ctx.fills.slice(-2);
const drawCount = () => Math.floor(ctx.fills.length / 2);

describe('QrCode · Issue #37 颜色变化必须重绘 canvas', () => {
  beforeEach(() => {
    ctx = makeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
  });

  it('[A] 守卫：挂载即绘制一次（bg 默认 transparent + 前景走主题 colorText）', () => {
    const w = mountQr();
    expect(drawCount()).toBe(1);
    // `bgColor` 的 prop 默认值是 'transparent'；未传 color ⇒ 走主题 colorText
    expect(ctx.fills[0]).toBe('transparent');
    expect(ctx.fills[1]).toBeTruthy();
    w.unmount();
  });

  it('[B] 只改前景色 color ⇒ 用新色重绘（核心回归）', async () => {
    const w = mountQr({ color: '#000000' });
    expect(lastPair()).toEqual(['transparent', '#000000']);

    await w.setProps({ color: '#1677ff' });
    expect(lastPair()).toEqual(['transparent', '#1677ff']);
    expect(drawCount()).toBe(2);
    w.unmount();
  });

  it('[C] 只改背景色 bgColor ⇒ 用新色重绘（核心回归）', async () => {
    const w = mountQr({ bgColor: '#ffffff' });
    const fg = ctx.fills[1];
    await w.setProps({ bgColor: '#f0f5ff' });
    expect(lastPair()).toEqual(['#f0f5ff', fg]);
    expect(drawCount()).toBe(2);
    w.unmount();
  });

  it('[D] 颜色往返变化每次都重绘（不是只认首次）', async () => {
    const w = mountQr({ color: '#111111' });
    await w.setProps({ color: '#222222' });
    await w.setProps({ color: '#333333' });
    expect(ctx.fills).toEqual([
      'transparent',
      '#111111',
      'transparent',
      '#222222',
      'transparent',
      '#333333',
    ]);
    w.unmount();
  });

  it('[E] size 变化 ⇒ 重绘且画布缓冲尺寸跟着变', async () => {
    const w = mountQr({ size: 160 });
    const canvas = w.find('canvas').element;
    // jsdom 的 devicePixelRatio 恒为 1
    expect(canvas.width).toBe(160);

    await w.setProps({ size: 96 });
    expect(canvas.width).toBe(96);
    expect(canvas.height).toBe(96);
    expect(drawCount()).toBe(2);
    w.unmount();
  });

  it('[F] icon 载入（imageLoaded 置真）后重绘', async () => {
    const w = mountQr({ icon: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
    const before = drawCount();
    await w.find('img').trigger('load');
    expect(drawCount()).toBeGreaterThan(before);
    w.unmount();
  });

  it('[G] 守卫：color / bgColor 显式 falsy 时落回默认色', async () => {
    const w = mountQr({ color: '#000000', bgColor: '#000000' });
    await w.setProps({ color: '', bgColor: '' });
    expect(lastPair()).toEqual([DEFAULT_BACKGROUND_COLOR, DEFAULT_FRONT_COLOR]);
    w.unmount();
  });
});
