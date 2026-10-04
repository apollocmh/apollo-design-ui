/**
 * L1 · 单元测试 + L2 · 交互测试（Badge = Badge + ScrollNumber/SingleNumber + Ribbon）
 *
 * ── L2 范围 ─────────────────────────────────────────────────────────────────
 *
 * Badge 无事件/受控语义/焦点。L2 适用面是「props 更新 → DOM 更新」
 * （count/dot/status 切换）与「值变化 → 数字滚动单元重渲染」。
 * motion 动画的时间线（zoom appear/leave）不在 jsdom 断言面里 —— B8 SSR
 * 与 L6 视觉覆盖可见形态。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { isPresetColor } from '../../_internal/preset-color';
import { Badge, Badge as BadgeNamed, Ribbon } from '../index';

const box = () => h('div', { class: 'box' }, 'x');

import { h } from 'vue';

describe('Badge · 判据链（Badge.js 逐条）', () => {
  it('wrapper 模式：根 apollo-badge + 子 apollo-scroll-number/apollo-badge-count', () => {
    const w = mount(Badge, { props: { count: 5 }, slots: { default: box } });
    expect(w.classes()).toContain('apollo-badge');
    expect(w.classes()).not.toContain('apollo-badge-not-a-wrapper');
    const sn = w.find('.apollo-scroll-number');
    expect(sn.exists()).toBe(true);
    expect(sn.classes()).toContain('apollo-badge-count');
    // 整数拆位：5 → bdi + 5 个 only-unit
    expect(sn.find('bdi').exists()).toBe(true);
    expect(sn.findAll('.apollo-scroll-number-only-unit')).toHaveLength(1);
    expect(sn.text()).toContain('5');
  });

  it('封顶：count > overflowCount → "99+"（字符串不拆位）', () => {
    const w = mount(Badge, { props: { count: 100, overflowCount: 99 }, slots: { default: box } });
    const sn = w.find('.apollo-scroll-number');
    expect(sn.text()).toBe('99+');
    expect(sn.find('bdi').exists()).toBe(false);
    // 多字符 → -multiple-words
    expect(sn.classes()).toContain('apollo-badge-multiple-words');
  });

  it('count=0：默认隐藏（CSSMotion removeOnLeave → 不渲染）；showZero 显示', () => {
    const hidden = mount(Badge, { props: { count: 0 }, slots: { default: box } });
    expect(hidden.find('.apollo-scroll-number').exists()).toBe(false);
    const shown = mount(Badge, { props: { count: 0, showZero: true }, slots: { default: box } });
    expect(shown.find('.apollo-scroll-number').exists()).toBe(true);
    // ⚠️ 上游事实：antd 的拆位判据是 `count && Number(count) % 1 === 0`（count 真值）——
    // 0 走原样文本，不拆位（无 bdi）。逐字对齐，不「顺手修」。
    expect(shown.find('.apollo-scroll-number').find('bdi').exists()).toBe(false);
    expect(shown.find('.apollo-scroll-number').text()).toBe('0');
  });

  it('dot 模式：-dot 类且 count 不渲染', () => {
    const w = mount(Badge, { props: { count: 5, dot: true }, slots: { default: box } });
    const sn = w.find('.apollo-scroll-number');
    expect(sn.classes()).toContain('apollo-badge-dot');
    expect(sn.classes()).not.toContain('apollo-badge-count');
    expect(sn.text()).toBe('');
  });

  it('size=small → -count-sm（size=default 走 medium）', () => {
    const sm = mount(Badge, { props: { count: 5, size: 'small' }, slots: { default: box } });
    expect(sm.find('.apollo-scroll-number').classes()).toContain('apollo-badge-count-sm');
    const md = mount(Badge, { props: { count: 5, size: 'medium' }, slots: { default: box } });
    expect(md.find('.apollo-scroll-number').classes()).not.toContain('apollo-badge-count-sm');
  });

  it('title：默认回落 count；null/false 显式禁用', () => {
    const fallback = mount(Badge, { props: { count: 5 }, slots: { default: box } });
    expect(fallback.find('.apollo-scroll-number').attributes('title')).toBe('5');
    const off = mount(Badge, { props: { count: 5, title: null }, slots: { default: box } });
    expect(off.find('.apollo-scroll-number').attributes('title')).toBeUndefined();
    const custom = mount(Badge, { props: { count: 5, title: 'custom' }, slots: { default: box } });
    expect(custom.find('.apollo-scroll-number').attributes('title')).toBe('custom');
  });

  it('offset：数字补 px（insetInlineEnd 取负 + marginTop 直补）', () => {
    const w = mount(Badge, { props: { count: 5, offset: [10, 10] }, slots: { default: box } });
    const style = w.find('.apollo-scroll-number').attributes('style') ?? '';
    expect(style).toContain('inset-inline-end: -10px');
    expect(style).toContain('margin-top: 10px');
  });

  it('borderColor 旧用法 → box-shadow inset', () => {
    const w = mount(Badge, {
      props: { count: 5, style: { borderColor: '#d9d9d9', background: '#fff' } as never },
      slots: { default: box },
    });
    const style = w.find('.apollo-scroll-number').attributes('style') ?? '';
    expect(style).toContain('box-shadow: 0 0 0 1px #d9d9d9 inset');
  });
});

describe('Badge · 状态点分支', () => {
  it('status 独立分支：-status + -status-{key} + -not-a-wrapper，无 scroll-number', () => {
    const w = mount(Badge, { props: { status: 'success' } });
    expect(w.classes()).toContain('apollo-badge-status');
    expect(w.classes()).toContain('apollo-badge-not-a-wrapper');
    expect(w.find('.apollo-badge-status-dot').exists()).toBe(true);
    expect(w.find('.apollo-badge-status-success').exists()).toBe(true);
    expect(w.find('.apollo-scroll-number').exists()).toBe(false);
  });

  it('status + text：文本在 -status-text；text=0 受 showZero 控制', () => {
    const w = mount(Badge, { props: { status: 'success', text: 'ok' } });
    expect(w.find('.apollo-badge-status-text').text()).toBe('ok');
    const zero = mount(Badge, { props: { status: 'success', text: 0 } });
    expect(zero.find('.apollo-badge-status-text').exists()).toBe(false);
    const zeroShown = mount(Badge, { props: { status: 'success', text: 0, showZero: true } });
    expect(zeroShown.find('.apollo-badge-status-text').exists()).toBe(true);
  });

  it('自定义 color：非预设走内联（color+background），预设走类名', () => {
    const custom = mount(Badge, { props: { status: 'success', color: '#2db7f5' } });
    const dot = custom.find('.apollo-badge-status-dot');
    expect(dot.classes()).not.toContain('apollo-badge-color-#2db7f5');
    expect(dot.attributes('style')).toContain('color: rgb(45, 183, 245)');
    expect(dot.attributes('style')).toContain('background: rgb(45, 183, 245)');

    const preset = mount(Badge, { props: { status: 'success', color: 'blue' } });
    expect(preset.find('.apollo-badge-status-dot').classes()).toContain('apollo-badge-color-blue');
  });

  it('count 与 status 互斥：有 count 时 hasStatus=false（ignoreCount=false）', () => {
    const w = mount(Badge, { props: { count: 5, status: 'success' }, slots: { default: box } });
    expect(w.classes()).not.toContain('apollo-badge-status');
    expect(w.find('.apollo-scroll-number').classes()).toContain('apollo-badge-status-success');
  });
});

describe('Badge · ScrollNumber', () => {
  it('字符串 count（如 99+）不拆位；符号原样', () => {
    const w = mount(Badge, { props: { count: '99+' }, slots: { default: box } });
    const sn = w.find('.apollo-scroll-number');
    expect(sn.find('bdi').exists()).toBe(false);
    expect(sn.text()).toBe('99+');
  });

  it('值变化 → only-unit 重渲染（数字滚动链路的 L2 面）', async () => {
    const w = mount(Badge, { props: { count: 5 }, slots: { default: box } });
    expect(w.find('.apollo-scroll-number').text()).toContain('5');
    await w.setProps({ count: 6 });
    await nextTick();
    // 过渡中显示的是新值 + 过渡单元（翻译到文本层即包含 6）
    expect(w.find('.apollo-scroll-number').text()).toContain('6');
  });
});

describe('Badge · Ribbon', () => {
  it('结构：wrapper > ribbon(-placement-end) > content + corner', () => {
    const w = mount(Ribbon, { props: { text: 'hippo' }, slots: { default: box } });
    expect(w.classes()).toContain('apollo-ribbon-wrapper');
    const r = w.find('.apollo-ribbon');
    expect(r.classes()).toContain('apollo-ribbon-placement-end');
    expect(w.find('.apollo-ribbon-content').text()).toBe('hippo');
    expect(w.find('.apollo-ribbon-corner').exists()).toBe(true);
  });

  it('预设色走类名；自定义色 corner 吃 color（经 brightness 滤镜变暗）', () => {
    const preset = mount(Ribbon, { props: { text: 't', color: 'green' }, slots: { default: box } });
    expect(preset.find('.apollo-ribbon').classes()).toContain('apollo-ribbon-color-green');
    const custom = mount(Ribbon, {
      props: { text: 't', color: '#2db7f5' },
      slots: { default: box },
    });
    expect(custom.find('.apollo-ribbon').classes()).not.toContain('apollo-ribbon-color-#2db7f5');
    expect(custom.find('.apollo-ribbon').attributes('style')).toContain(
      'background: rgb(45, 183, 245)',
    );
    expect(custom.find('.apollo-ribbon-corner').attributes('style')).toContain(
      'color: rgb(45, 183, 245)',
    );
  });

  it('placement=start → -placement-start', () => {
    const w = mount(Ribbon, { props: { text: 't', placement: 'start' }, slots: { default: box } });
    expect(w.find('.apollo-ribbon').classes()).toContain('apollo-ribbon-placement-start');
  });

  it('Badge.Ribbon 复合挂载（antd 用法）与 expose', () => {
    expect(BadgeNamed.Ribbon).toBeDefined();
    const w = mount(Ribbon, { props: { text: 't' }, slots: { default: box } });
    expect((w.vm as { nativeElement: HTMLElement }).nativeElement).toBe(w.element);
  });
});

describe('Badge · 其它', () => {
  it('isPresetColor 判据（共享层直测）', () => {
    expect(isPresetColor('blue')).toBe(true);
    expect(isPresetColor('geekblue')).toBe(true);
    expect(isPresetColor('#2db7f5')).toBe(false);
    expect(isPresetColor('blue-inverse')).toBe(true);
    expect(isPresetColor('blue-inverse', false)).toBe(false);
  });

  it('废弃告警：size=default 触发 deprecated（props 判据用 !== undefined）', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(Badge, { props: { count: 5, size: 'default' }, slots: { default: box } });
    await nextTick();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('attrs 透传与 expose（wrapper 分支）', () => {
    const w = mount(Badge, {
      attrs: { id: 'my-badge' },
      props: { count: 5 },
      slots: { default: box },
    });
    expect(w.attributes('id')).toBe('my-badge');
  });
});

describe('Badge · count 为 VNode 的克隆分支（2026-10-04 补钉）', () => {
  // antd Badge.js:122（displayNode cloneElement，合并 offset/indicator style）
  // + ScrollNumber.js:55（children cloneElement，注入 `-custom-component` + motion 类）。
  // 「组件子节点内嵌两字的空间插入」在 antd 6.6.4 已不存在（仅剩 CSS `-multiple-words`，
  // 我们同样有）—— 原登记的 gap 是 v4 时代遗留，本轮对拍证伪关闭。
  it('count 为 VNode：cloneVNode 注入 `-custom-component` 且保留原类名/样式', () => {
    const w = mount(Badge, {
      props: {
        count: h('span', { class: 'my-count', style: { fontSize: '12px' } }, '确定'),
      },
      slots: { default: box },
    });
    const node = w.find('.my-count');
    expect(node.exists()).toBe(true);
    expect(node.classes()).toContain('apollo-scroll-number-custom-component');
    expect(node.attributes('style')).toContain('font-size: 12px');
  });
});
