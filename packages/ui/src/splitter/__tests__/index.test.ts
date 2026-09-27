/**
 * L1/L2 · 单元与交互 —— Splitter（引擎语义逐条转断言）
 *
 * 判据：antd 6.6.4 `es/splitter/hooks/`（sizeUtil / useResize / useResizable /
 * useSizes / useItems）+ SplitBar（aria / 双击抑制 / lazy）——行为判据，非 DOM
 * 判据（DOM 由 L4 钉）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { MockResizeObserver } from '../../../../../vitest.setup';
import { autoPtgSizes, getPtg } from '../hooks/sizeUtil';
import { getCollapsible } from '../hooks/useItems';
import { Splitter } from '../index';

// ============================== sizeUtil ==============================

describe('Splitter · sizeUtil（百分比归一化）', () => {
  it("getPtg：'50%' ⇒ 0.5", () => {
    expect(getPtg('50%')).toBe(0.5);
  });

  it('全 undefined ⇒ 均分', () => {
    expect(autoPtgSizes([undefined, undefined], [0, 0], [1, 1])).toEqual([0.5, 0.5]);
  });

  it('有定义 + undefined ⇒ 快速均分（落在 min/max 区间内）', () => {
    // rest = 1 - 0.6 = 0.4 ⇒ 每个均 0.2，limitMin 0 <= 0.2 <= limitMax 1
    expect(autoPtgSizes([0.6, undefined, undefined], [0, 0, 0], [1, 1, 1])).toEqual([
      0.6, 0.2, 0.2,
    ]);
  });

  it('全定义但和≠1 ⇒ 缩放 + fit（受 min/max 夹取分摊）', () => {
    // [0.6, 0.6] 缩放 ⇒ [0.5, 0.5]
    expect(autoPtgSizes([0.6, 0.6], [0, 0], [1, 1])).toEqual([0.5, 0.5]);
  });

  it('全 0 ⇒ 均分', () => {
    expect(autoPtgSizes([0, 0, 0], [0, 0, 0], [1, 1, 1])).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it('有定义 + undefined：restAvg 落在区间 ⇒ 快速填充（0.2 的浮点残差用 closeTo）', () => {
    const out = autoPtgSizes([0.8, undefined], [0, 0], [1, 1]);
    expect(out[0]).toBe(0.8);
    expect(out[1]).toBeCloseTo(0.2, 12);
  });

  it('快速均分不可行（restAvg < min）⇒ 贪婪填充（受 min/max 约束，浮点残差 closeTo）', () => {
    const out = autoPtgSizes([0.7, undefined], [0, 0.5], [1, 1]);
    expect(out[0]).toBeCloseTo(0.7, 12);
    expect(out[1]).toBeCloseTo(0.3, 12);
  });

  it('sumMax>1 ⇒ 不是均分兜底，走贪婪（上游原样产出 0.2/0.8）', () => {
    const out = autoPtgSizes([undefined, undefined], [0.8, 0.8], [0.9, 0.9]);
    expect(out[0]).toBeCloseTo(0.2, 12);
    expect(out[1]).toBeCloseTo(0.8, 12);
  });
});

// ============================== getCollapsible ==============================

describe('Splitter · getCollapsible（归一化）', () => {
  it('boolean ⇒ 双向折叠 + auto 图标', () => {
    expect(getCollapsible(true)).toEqual({ start: true, end: true, showCollapsibleIcon: 'auto' });
    expect(getCollapsible(false)).toEqual({
      start: false,
      end: false,
      showCollapsibleIcon: 'auto',
    });
  });

  it('对象 ⇒ 补 showCollapsibleIcon 缺省', () => {
    expect(getCollapsible({ start: true })).toEqual({
      start: true,
      end: false,
      showCollapsibleIcon: 'auto',
    });
    expect(getCollapsible({ showCollapsibleIcon: true })).toMatchObject({
      showCollapsibleIcon: true,
    });
  });
});

// ============================== 组件行为 ==============================

describe('Splitter · 组件（SSR 语义 / SSR 尺寸）', () => {
  const makeSplitter = (props: Record<string, unknown> = {}, panels?: unknown[]) =>
    mount(Splitter, {
      props: { style: { height: '200px' }, ...props },
      slots: {
        default: () =>
          panels ?? [h(Splitter.Panel, null, () => 'Left'), h(Splitter.Panel, null, () => 'Right')],
      },
    });

  it('SSR：容器未测量 ⇒ 面板 flex-basis:auto + flexGrow:1；dragger 有 separator 角色', () => {
    const w = makeSplitter();
    const panels = w.findAll('.apollo-splitter-panel');
    expect(panels).toHaveLength(2);
    expect(panels[0]?.attributes('style')).toContain('flex-basis: auto');
    const dragger = w.find('.apollo-splitter-bar-dragger');
    expect(dragger.attributes('role')).toBe('separator');
    expect(dragger.attributes('aria-orientation')).toBe('vertical'); // horizontal 布局 ⇒ aria vertical
    expect(dragger.attributes('aria-valuenow')).toBe('50');
  });

  it('orientation=vertical ⇒ 根 -vertical 类；aria-orientation=horizontal', () => {
    const w = makeSplitter({ orientation: 'vertical' });
    expect(w.find('.apollo-splitter-vertical').exists()).toBe(true);
    expect(w.find('.apollo-splitter-bar-dragger').attributes('aria-orientation')).toBe(
      'horizontal',
    );
  });

  it('layout（deprecated）仍生效并告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const w = makeSplitter({ layout: 'vertical' });
    expect(w.find('.apollo-splitter-vertical').exists()).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('受控/非受控混用且无 onResize ⇒ dev 告警', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    makeSplitter({}, [
      h(Splitter.Panel, { size: '40%' }, () => 'Left'),
      h(Splitter.Panel, null, () => 'Right'),
    ]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('size 的数字 px 形态：SSR（未测量）保留开发者原值', () => {
    const w = makeSplitter({ onResize: () => {} }, [
      h(Splitter.Panel, { size: 100 }, () => 'Left'),
      h(Splitter.Panel, null, () => 'Right'),
    ]);
    expect(w.findAll('.apollo-splitter-panel')[0]?.attributes('style')).toContain(
      'flex-basis: 100px;',
    );
  });

  it('collapsible + 容器未测量（pxSizes 全 0）⇒ 有 min 的相邻面板不可拖（对齐 L4 基线）', () => {
    const w = makeSplitter({}, [
      h(Splitter.Panel, { collapsible: true, min: '20%', defaultSize: '40%' }, () => 'L'),
      h(Splitter.Panel, { collapsible: true }, () => 'R'),
    ]);
    // prevSize=0 且有 min ⇒ 不可拖；pxSizes 全 0 ⇒ 折叠按钮不渲染
    expect(w.find('.apollo-splitter-bar-dragger').attributes('aria-disabled')).toBe('true');
    expect(w.find('.apollo-splitter-bar-collapse-bar').exists()).toBe(false);
  });

  it('容器测量后（ResizeObserver 桩）⇒ 面板 ptg 尺寸生效 + dragger enabled', async () => {
    const w = makeSplitter({}, [
      h(Splitter.Panel, { defaultSize: '40%' }, () => 'L'),
      h(Splitter.Panel, null, () => 'R'),
    ]);
    // jsdom 无布局：桩根元素 offsetWidth，再显式 trigger ResizeObserver
    const root = w.find('.apollo-splitter').element as HTMLElement;
    Object.defineProperty(root, 'offsetWidth', { value: 500, configurable: true });
    for (const observer of MockResizeObserver.instances) {
      observer.trigger();
    }
    await nextTick();
    await nextTick();
    // defaultSize 40% × 500px = 200px；第二格 60%
    const dragger = w.find('.apollo-splitter-bar-dragger');
    expect(dragger.attributes('aria-disabled')).toBe('false');
    expect(dragger.attributes('aria-valuenow')).toBe('40');
  });

  it('attrs 透传到根节点（data-*）与 exposes 形状', () => {
    const w = makeSplitter({ 'data-probe': '1' } as Record<string, unknown>);
    expect(w.find('.apollo-splitter').attributes('data-probe')).toBe('1');
    // expose 的 nativeElement 是 ref ⇒ 通过 VM 代理取到元素
    const exposed = (w.vm as unknown as { nativeElement?: HTMLElement | null }).nativeElement;
    expect(exposed).toBeInstanceOf(HTMLElement);
  });

  it('onDraggerDoubleClick 事件经 emit 透传', async () => {
    const onDraggerDoubleClick = vi.fn();
    const w = mount(Splitter, {
      props: { onDraggerDoubleClick },
      slots: {
        default: () => [h(Splitter.Panel, null, () => 'L'), h(Splitter.Panel, null, () => 'R')],
      },
    });
    await w.find('.apollo-splitter-bar-dragger').trigger('dblclick');
    expect(onDraggerDoubleClick).toHaveBeenCalledWith(0);
  });

  it('attrs 透传到根节点（id / data-*）', () => {
    const w = makeSplitter({ id: 'x' } as Record<string, unknown>);
    expect(w.find('.apollo-splitter').attributes('id')).toBe('x');
  });

  it('onResizeStart / onResize / onResizeEnd 通过 emit 可达（拖拽起点）', async () => {
    const onResizeStart = vi.fn();
    const w = mount(Splitter, {
      props: { onResizeStart },
      slots: {
        default: () => [h(Splitter.Panel, null, () => 'L'), h(Splitter.Panel, null, () => 'R')],
      },
    });
    // mousedown 不触发 resize-start（要拖动 window mousemove）—— 但 onOffsetStart 在
    // mousedown 即触发（resizable=true 且非双击窗口）
    await w.find('.apollo-splitter-bar-dragger').trigger('mousedown', { pageX: 0, pageY: 0 });
    await nextTick();
    expect(onResizeStart).toHaveBeenCalledWith([0, 0]);
    // 清理：mouseup 释放
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
  });
});
