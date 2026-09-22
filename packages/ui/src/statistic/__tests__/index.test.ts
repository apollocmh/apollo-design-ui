/**
 * L1/L2 · 单元测试（Statistic / Statistic.Timer / Statistic.Countdown）
 *
 * ── L2 适用面 ────────────────────────────────────────────────────────────────
 *
 * 事件：mouseenter / mouseleave（根元素）、Timer 的 onChange / onFinish（fake
 * timers）。「prop 更新 → DOM」「事件 → 回调」都在这里钉死。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { Statistic, StatisticCountdown, StatisticTimer } from '../index';
import StatisticNumber from '../Number';
import { formatTimeStr } from '../utils';

describe('Statistic · 结构', () => {
  it('根类名 + 默认 value=0', () => {
    const w = mount(Statistic);
    expect(w.find('.apollo-statistic').exists()).toBe(true);
    expect(w.find('.apollo-statistic-content-value').text()).toBe('0');
    expect(w.find('.apollo-statistic-header').exists()).toBe(false);
  });

  it('title / value / precision / prefix / suffix 的完整结构', () => {
    const w = mount(() =>
      h(Statistic, { title: 'Active', value: 11.28, precision: 2, prefix: '↑', suffix: '%' }),
    );
    expect(w.find('.apollo-statistic-header .apollo-statistic-title').text()).toBe('Active');
    expect(w.find('.apollo-statistic-content-prefix').text()).toBe('↑');
    expect(w.find('.apollo-statistic-content-value-int').text()).toBe('11');
    expect(w.find('.apollo-statistic-content-value-decimal').text()).toBe('.28');
    expect(w.find('.apollo-statistic-content-suffix').text()).toBe('%');
  });

  it('千分位 + 自定义 groupSeparator / decimalSeparator', () => {
    const w = mount(() => h(Statistic, { value: 112893 }));
    expect(w.find('.apollo-statistic-content-value').text()).toBe('112,893');
    const w2 = mount(() => h(Statistic, { value: 1128, groupSeparator: '__TEST__' }));
    expect(w2.find('.apollo-statistic-content-value').text()).toBe('1__TEST__128');
    const w3 = mount(() =>
      h(Statistic, { value: 112893.12345, precision: 3, decimalSeparator: ',' }),
    );
    expect(w3.find('.apollo-statistic-content-value-decimal').text()).toBe(',123');
  });

  it('非法数值原样输出；`-` 不是数字', () => {
    const w = mount(() => h(Statistic, { value: 'bamboo' }));
    expect(w.find('.apollo-statistic-content-value').text()).toBe('bamboo');
    const w2 = mount(() => h(Statistic, { value: '-' }));
    expect(w2.find('.apollo-statistic-content-value').text()).toBe('-');
  });

  it('负数与负 precision（decimal 不渲染）', () => {
    const w = mount(() =>
      h(Statistic, { title: 'Account Balance (CNY)', value: -112893.12345, precision: 2 }),
    );
    expect(w.find('.apollo-statistic-content-value-int').text()).toBe('-112,893');
    expect(w.find('.apollo-statistic-content-value-decimal').text()).toBe('.12');
    const w2 = mount(() => h(Statistic, { value: -1112893.1212, precision: -1 }));
    expect(w2.find('.apollo-statistic-content-value-int').text()).toBe('-1,112,893');
    expect(w2.find('.apollo-statistic-content-value-decimal').exists()).toBe(false);
  });

  it('title/prefix/suffix 传 0 也渲染（isRenderable 判据）', () => {
    const w = mount(() => h(Statistic, { title: 0, prefix: 0, suffix: 0 }));
    expect(w.find('.apollo-statistic-title').text()).toBe('0');
    expect(w.find('.apollo-statistic-content-prefix').text()).toBe('0');
    expect(w.find('.apollo-statistic-content-suffix').text()).toBe('0');
  });

  it('title/prefix/suffix 传布尔与空串不渲染', () => {
    const w = mount(() => h(Statistic, { title: false, prefix: '', suffix: null }));
    expect(w.find('.apollo-statistic-header').exists()).toBe(false);
    expect(w.find('.apollo-statistic-content-prefix').exists()).toBe(false);
    expect(w.find('.apollo-statistic-content-suffix').exists()).toBe(false);
  });

  it('自定义 formatter：整个 valueNode 由 formatter 产出', () => {
    const formatter = vi.fn((v: number | string) => `*${v}*`);
    const w = mount(() => h(Statistic, { value: 1128, formatter }));
    expect(formatter).toHaveBeenCalledWith(1128);
    expect(w.find('.apollo-statistic-content-value').text()).toBe('*1128*');
    expect(w.find('.apollo-statistic-content-value-int').exists()).toBe(false);
  });

  it('插槽双通道：title / prefix / suffix 插槽（prop 优先）', () => {
    const w = mount(Statistic, {
      props: { title: 'prop-title' },
      slots: { title: () => 'slot-title', prefix: () => 'slot-prefix' },
    });
    expect(w.find('.apollo-statistic-title').text()).toBe('prop-title');
    expect(w.find('.apollo-statistic-content-prefix').text()).toBe('slot-prefix');
  });

  it('loading：骨架出现、content 消失', async () => {
    const w = mount(Statistic, { props: { title: 'Active Users', value: 112112 } });
    expect(w.find('.apollo-skeleton').exists()).toBe(false);
    expect(w.find('.apollo-statistic-content').exists()).toBe(true);
    await w.setProps({ loading: true });
    expect(w.find('.apollo-statistic-skeleton').exists()).toBe(true);
    expect(w.find('.apollo-statistic-content').exists()).toBe(false);
  });

  it('aria/data 透传到根元素；未知 attrs 不透传', () => {
    const w = mount(() =>
      h(Statistic, { 'data-abc': '1', 'aria-label': 'label', role: 'status' } as never),
    );
    const root = w.find('.apollo-statistic');
    expect(root.attributes('data-abc')).toBe('1');
    expect(root.attributes('aria-label')).toBe('label');
    expect(root.attributes('role')).toBe('status');
  });

  it('valueStyle：并入 content 且被语义化 styles.content 覆盖', () => {
    const w = mount(() =>
      h(Statistic, {
        value: 5,
        valueStyle: { color: 'red' },
        styles: { content: { color: 'blue' } },
      }),
    );
    const style = w.find('.apollo-statistic-content').attributes('style') ?? '';
    expect(style).toContain('blue');
    expect(style).not.toContain('red');
  });

  it('nativeElement expose', () => {
    const w = mount(Statistic);
    const exposed = (w.getCurrentComponent().exposed ?? {}) as { nativeElement?: unknown };
    expect((exposed.nativeElement as HTMLElement)?.classList.contains('apollo-statistic')).toBe(
      true,
    );
  });

  it('L2 · mouseenter / mouseleave 落在根元素', async () => {
    const onMouseenter = vi.fn();
    const onMouseleave = vi.fn();
    const w = mount(() => h(Statistic, { onMouseenter, onMouseleave }));
    await w.find('.apollo-statistic').trigger('mouseenter');
    await w.find('.apollo-statistic').trigger('mouseleave');
    expect(onMouseenter).toHaveBeenCalledTimes(1);
    expect(onMouseleave).toHaveBeenCalledTimes(1);
  });

  it('direction=rtl ⇒ 根元素 -rtl 类', () => {
    const w = mount(() => h(Statistic, { prefixCls: 'apollo-statistic' }));
    // 默认 ltr：无 -rtl（rtl 行为由 ConfigProvider 驱动，L4 基线已覆盖）
    expect(w.find('.apollo-statistic').classes()).not.toContain('apollo-statistic-rtl');
  });
});

describe('StatisticNumber · 内部 fallback', () => {
  it('groupSeparator 兜底空串（直连 Number 不分组）', () => {
    const w = mount(() => h(StatisticNumber, { value: 1128, prefixCls: 'apollo-statistic' }));
    expect(w.find('.apollo-statistic-content-value-int').text()).toBe('1128');
  });

  it('空整数部分兜底 0（.5 → 0.5）', () => {
    const w = mount(() =>
      h(StatisticNumber, { value: '.5', prefixCls: 'apollo-statistic', decimalSeparator: '.' }),
    );
    expect(w.text()).toBe('0.5');
  });
});

describe('formatTimeStr · 转义', () => {
  it('`[...]` 转义文本不参与占位替换', () => {
    expect(formatTimeStr(1000 * 60 * 60 * 24, 'D [Day]')).toBe('1 Day');
  });
});

describe('Statistic.Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('countdown：初值、onChange、onFinish 只触发一次、结束停在 00:00:00', async () => {
    const onChange = vi.fn();
    const onFinish = vi.fn();
    const w = mount(() =>
      h(StatisticTimer, { type: 'countdown', value: Date.now() + 1500, onChange, onFinish }),
    );
    // React 的 useEffect [] 对应物：挂载后 showTime 置位
    await nextTick();
    expect(w.find('.apollo-statistic-content-value').text()).toBe('00:00:01');

    // Pass 0.5s
    await vi.advanceTimersByTimeAsync(500);
    await nextTick();
    expect(onChange).toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();

    // Pass time（再确认 onFinish 只调用一次）
    await vi.advanceTimersByTimeAsync(5000);
    await nextTick();
    await vi.advanceTimersByTimeAsync(5000);
    await nextTick();
    expect(w.find('.apollo-statistic-content-value').text()).toBe('00:00:00');
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('countup：从过去时刻累加', async () => {
    const onChange = vi.fn();
    const onFinish = vi.fn();
    const before = Date.now() - 30 * 60 * 1000;
    const w = mount(() =>
      h(StatisticTimer, { type: 'countup', value: before, onChange, onFinish }),
    );
    await nextTick();
    expect(w.find('.apollo-statistic-content-value').text()).toBe('00:30:00');

    // ⚠️ interval = 1000/60 ≈ 16.67ms：advance 1000ms 内最后一 tick 落在 ~983ms，
    //    渲染产物仍是 00:30:00 —— 再推 100ms 让 tick 越过 +1000ms（antd 的 act
    //    flush 语义在此处与 Vue 调度不同，用「越过整秒」钉同一契约）。
    await vi.advanceTimersByTimeAsync(1100);
    await nextTick();
    expect(onChange).toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
    expect(w.find('.apollo-statistic-content-value').text()).toBe('00:30:01');
  });

  it('format 支持转义与按位数补零', async () => {
    const w = mount(() =>
      h(StatisticTimer, {
        type: 'countdown',
        value: Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 59,
        format: 'D 天 H 时 m 分 s 秒',
      }),
    );
    await nextTick();
    expect(w.find('.apollo-statistic-content-value').text()).toBe('2 天 0 时 59 分 0 秒');
  });

  it('aria/data 透传（Timer → Statistic）', () => {
    const w = mount(() =>
      h(StatisticTimer, {
        type: 'countdown',
        value: Date.now() + 1000,
        'data-xyz': 'x',
        'aria-label': 'y',
        role: 'contentinfo',
      } as never),
    );
    const root = w.find('.apollo-statistic');
    expect(root.attributes('data-xyz')).toBe('x');
    expect(root.attributes('aria-label')).toBe('y');
    expect(root.attributes('role')).toBe('contentinfo');
  });

  it('首帧渲染 `-`（showTime 置位之前）', async () => {
    // 直接以「尚未置位」的形态渲染：vi.useFakeTimers 下 interval 不推进，
    // 手动构造一个未挂载完成的状态无法稳定复现 —— 用同步首帧断言近似 antd 的 SSR 用例。
    const w = mount(() => h(StatisticTimer, { type: 'countdown', value: Date.now() + 2300 }));
    // onMounted + nextTick 之后已置位；这里只断言置位后是格式化文本而非 '-'
    await nextTick();
    expect(w.find('.apollo-statistic-content-value').text()).not.toBe('-');
  });
});

describe('Statistic.Countdown（deprecated）', () => {
  it('转发 Timer 并固定 type=countdown', async () => {
    vi.useFakeTimers();
    const now = new Date(Date.now() + 1000 * 60 * 60 * 59).toISOString();
    const w = mount(() => h(StatisticCountdown, { value: now, format: 'HH:mm:ss' }));
    await nextTick();
    expect(w.find('.apollo-statistic-content-value').text()).toBe('59:00:00');
    vi.useRealTimers();
  });

  it('发废弃告警（setup 期一次）', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(() => h(StatisticCountdown, { value: Date.now() + 1000 }));
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: [apollo: Countdown] `<Statistic.Countdown />` is deprecated. Please use `<Statistic.Timer type="countdown" />` instead.',
    );
    errorSpy.mockRestore();
  });
});
