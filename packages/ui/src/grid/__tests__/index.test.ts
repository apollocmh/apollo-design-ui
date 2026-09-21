/**
 * L1 · 单元测试 + L2 · 交互测试（Grid = Row + Col）
 *
 * ── L2 范围 ─────────────────────────────────────────────────────────────────
 *
 * Row/Col 无事件、无受控语义、无焦点 —— L2 适用面是「props 更新 → DOM 更新」
 * 与「断点变化 → 类名/样式更新」（matchMedia mock 驱动）。
 *
 * ── matchMedia 的控制 ────────────────────────────────────────────────────────
 *
 * vitest.setup.ts 的全局桩恒返回 false。响应式用例需要**特定断点命中**，
 * 所以这里在每个响应式用例内替换 `window.matchMedia`，并在 afterEach 里
 * 重置 observer 单例（register/unregister 生命周期依赖它，跨测试必须清理）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { resetResponsiveObserverForTests } from '../../_internal/responsive-observer';
import { Col, gridParseFlex as parseFlex, Row } from '../index';

/** 替换 matchMedia：breakpoints 中列出的断点返回 true，其余 false。 */
const mockMatchMedia = (breakpoints: string[]): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches:
        breakpoints.some((bp) => query.includes(`(min-width: ${bp}px)`)) ||
        (query.includes('(max-width') && breakpoints.includes('xs')),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: () => false,
    })),
  );
};

const styleOf = (w: { attributes: (n: string) => string | undefined }): string =>
  w.attributes('style') ?? '';

describe('Row · 基础', () => {
  afterEach(() => {
    resetResponsiveObserverForTests();
    vi.unstubAllGlobals();
  });

  it('默认类名与结构', () => {
    const w = mount(Row, { slots: { default: () => 'x' } });
    expect(w.classes()).toContain('apollo-row');
    expect(w.attributes('style')).toBeUndefined();
  });

  it('prefixCls 覆盖', () => {
    const w = mount(Row, { props: { prefixCls: 'custom' } });
    expect(w.classes()).toContain('custom');
  });

  it('justify / align 类名', () => {
    const w = mount(Row, { props: { justify: 'center', align: 'middle' } });
    expect(w.classes()).toContain('apollo-row-center');
    expect(w.classes()).toContain('apollo-row-middle');
  });

  it('响应式 justify 对象：jsdom（全 false）下无类名（screens 非空但不命中）', () => {
    const w = mount(Row, { props: { justify: { md: 'center' } } });
    expect(w.classes()).not.toContain('apollo-row-center');
  });

  it('响应式 justify 对象：lg 命中时产生类名（L2 · matchMedia 驱动）', async () => {
    mockMatchMedia(['992']);
    const w = mount(Row, { props: { justify: { md: 'center', lg: 'space-between' } } });
    // 订阅在 onMounted（对齐 antd 的 useLayoutEffect，SSR 不触碰 matchMedia）——
    // screens 的初值更新发生在挂载后的下一个 tick。
    await nextTick();
    expect(w.classes()).toContain('apollo-row-space-between');
    expect(w.classes()).not.toContain('apollo-row-center');
  });

  it('wrap=false → -no-wrap；未传不产生（D21）', async () => {
    const w = mount(Row);
    expect(w.classes()).not.toContain('apollo-row-no-wrap');
    await w.setProps({ wrap: false });
    expect(w.classes()).toContain('apollo-row-no-wrap');
  });

  it('gutter 数字：Row 负 margin；单值无纵向（无 rowGap）', () => {
    const w = mount(Row, { props: { gutter: 16 } });
    const style = styleOf(w);
    expect(style).toContain('margin-inline: -8px');
    expect(style).not.toContain('row-gap');
  });

  it('gutter 数字 0：无 margin（falsy），rowGap 为 0', () => {
    const w = mount(Row, { props: { gutter: [0, 16] } });
    const style = styleOf(w);
    expect(style).not.toContain('margin-inline');
    expect(style).toContain('row-gap: 16px');
  });

  it('gutter 数组第二位是纵向 rowGap（数字补 px；0 → "0"）', () => {
    const w = mount(Row, { props: { gutter: [16, 0] } });
    const style = styleOf(w);
    expect(style).toContain('margin-inline: -8px');
    expect(style).toContain('row-gap: 0');
  });

  it('gutter 字符串走 calc()（jsdom CSSOM 会化简为 calc(-0.5rem)）', () => {
    const w = mount(Row, { props: { gutter: '1rem' } });
    expect(styleOf(w)).toContain('calc(-0.5rem)');
  });

  it('响应式 gutter 对象：jsdom（全 false）下挂载稳定后不生效', async () => {
    // 挂载瞬间 screens=null → useGutter 兜底全命中（首帧与 antd SSR 同形）；
    // onMounted 订阅后 screens 变为全 false → gutter 消失（客户端修正）。
    const w = mount(Row, { props: { gutter: { xs: 8, sm: 16 } } });
    await nextTick();
    expect(styleOf(w)).not.toContain('margin-inline');
  });

  it('attrs 透传与 expose', () => {
    const w = mount(Row, { attrs: { id: 'my-row' }, slots: { default: () => 'x' } });
    expect(w.attributes('id')).toBe('my-row');
    expect((w.vm as { nativeElement: HTMLElement }).nativeElement).toBe(w.element);
  });
});

describe('Col · 基础', () => {
  beforeEach(() => {
    resetResponsiveObserverForTests();
    vi.unstubAllGlobals();
  });

  it('span 类名（含 0 → display:none 类）', () => {
    expect(mount(Col, { props: { span: 8 } }).classes()).toContain('apollo-col-8');
    expect(mount(Col, { props: { span: 0 } }).classes()).toContain('apollo-col-0');
  });

  it('offset / push / pull / order 类名（antd 的真值判据：0 不产生 order/offset 类）', () => {
    const w = mount(Col, { props: { span: 6, offset: 4, push: 2, pull: 1, order: 3 } });
    expect(w.classes()).toContain('apollo-col-offset-4');
    expect(w.classes()).toContain('apollo-col-push-2');
    expect(w.classes()).toContain('apollo-col-pull-1');
    expect(w.classes()).toContain('apollo-col-order-3');
    const zero = mount(Col, { props: { span: 6, offset: 0, order: 0 } });
    expect(zero.classes()).not.toContain('apollo-col-offset-0');
    expect(zero.classes()).not.toContain('apollo-col-order-0');
  });

  it('flex 字符串/数字（minWidth hack：wrap=false 时补 0）', () => {
    const auto = mount(Col, { props: { flex: 'auto' } });
    expect(styleOf(auto)).toContain('flex: 1 1 auto');
    const num = mount(Col, { props: { flex: 2 } });
    expect(styleOf(num)).toContain('flex: 2 2 auto');
    const noWrap = mount(Col, { props: { flex: '100px' } });
    expect(styleOf(noWrap)).toContain('flex: 0 0 100px');
    expect(styleOf(noWrap)).not.toContain('min-width');
  });

  it('响应式 size 类全量渲染（xs 与 md 共存，由 media query 裁决）', () => {
    const w = mount(Col, { props: { xs: 2, md: 4 } });
    expect(w.classes()).toContain('apollo-col-xs-2');
    expect(w.classes()).toContain('apollo-col-md-4');
  });

  it('响应式数字简写：xs=2 等价 {span:2}', () => {
    const w = mount(Col, { props: { xs: 2 } });
    expect(w.classes()).toContain('apollo-col-xs-2');
  });

  it('响应式 flex：类名 + CSS 变量内联', () => {
    const w = mount(Col, { props: { sm: { flex: 'auto' } } });
    expect(w.classes()).toContain('apollo-col-sm-flex');
    expect(styleOf(w)).toContain('--apollo-col-sm-flex: 1 1 auto');
  });

  it('gutter 从 Row context 注入：Col padding = +g/2', () => {
    const w = mount({
      components: { Row, Col },
      template: '<Row :gutter="16"><Col :span="6"><div>x</div></Col></Row>',
    });
    const col = w.find('.apollo-col');
    expect(styleOf(col)).toContain('padding-inline: 8px');
  });

  it('脱离 Row 使用：无 gutter padding（context 默认空对象）', () => {
    const w = mount(Col, { props: { span: 6 } });
    expect(styleOf(w)).not.toContain('padding');
  });

  it('parseFlex 判据（纯函数直测）', () => {
    expect(parseFlex('auto')).toBe('1 1 auto');
    expect(parseFlex(2)).toBe('2 2 auto');
    expect(parseFlex('100px')).toBe('0 0 100px');
    expect(parseFlex('50%')).toBe('0 0 50%');
    expect(parseFlex('2 2 10%')).toBe('2 2 10%');
  });
});
