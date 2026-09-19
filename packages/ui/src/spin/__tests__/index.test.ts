/**
 * L1 · 单元测试 + **L2 · 交互测试**
 *
 * ── 为什么这个文件必须有 L2（与 divider / empty 的关键区别）─────────────────────
 *
 * `divider` 与 `empty` 都是纯展示组件，`interactionStatus` 判 `n/a`，
 * 于是**组件侧的 L2 层从来没有被任何一个组件真正验证过**。Spin 是第一个：
 *
 *   - `spinning` 是**受控但有内部延迟态**的 prop —— 「prop 变了 DOM 同步变」在这里
 *     是**假**的，中间必然存在一个 `delay` 时间窗（antd 的 `should be controlled by
 *     spinning` / `should close immediately` 两条用例就是在钉这件事）；
 *   - `delay` 有「开要等、关不等」「重新计时」「卸载要 cancel」三条独立语义；
 *   - `percent="auto"` 是一条**时间驱动**的状态机（200ms 一档、渐近逼近 100）；
 *   - `fullscreen` / `tip` / `setDefaultIndicator` 都有「切换前后」的可观测差异。
 *
 * 所以下面 `describe('L2 · 交互')` 里的每一条都是**真的交互**（改 prop → 等时间 →
 * 断言 DOM），不是 `expect(exists()).toBe(true)` 凑格子（反模式 A1）。
 *
 * ── 时间怎么等（不用 `sleep`，反模式 A3）────────────────────────────────────────
 *
 * 全部用 `vi.useFakeTimers()` + `advance(ms)`。`advance` 内部是
 * 「nextTick（让 watchEffect 注册定时器）→ advanceTimersByTimeAsync → nextTick」。
 * 直接 `advanceTimersByTime` 会漏掉「watchEffect 还没跑、定时器根本没注册」这一拍
 * —— 那正是 `delay` 最容易假通过的地方。
 *
 * ── 前缀约定 ────────────────────────────────────────────────────────────────────
 * 默认不传 `prefixCls`，走兜底 `apollo-spin`（`getPrefixCls('spin')`）。
 *
 * ── 这个文件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明与 antd 的 DOM 一致（那是 L4，见 `semantic.test.ts`）
 *   - 没证明像素一致（那是 L6，见 `tests/visual`）
 *   - 没证明 `size` 会读 ConfigProvider 的 `componentSize`（`useSize` 未落地，
 *     缺口登记在 `README.md` §7）
 */

import { captureWarnings, flushAll, mountTest, resetWarned } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ComputedRef, defineComponent, effectScope, h, nextTick, ref } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { setDefaultIndicator } from '../defaultIndicator';
import { Spin } from '../index';
import type { SpinPercent } from '../interface';
import { AUTO_INTERVAL, usePercent } from '../usePercent';

/** 兜底前缀 —— 不传 `prefixCls` 时 `getPrefixCls('spin')` 的结果。 */
const P = 'apollo-spin';

const mountSpin = (props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) =>
  mount(Spin, {
    props,
    ...(slots ? { slots } : {}),
  });

const withChildren = (props: Record<string, unknown> = {}, node: unknown = 'content') =>
  mountSpin(props, { default: () => node as never });

/** 带 ConfigProvider 上下文挂载（Vue 侧对应物是 `provide`）。 */
const mountWithConfig = (
  componentConfig: Record<string, unknown>,
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
) =>
  mount(Spin, {
    props,
    ...(slots ? { slots } : {}),
    global: {
      provide: {
        [configContextKey as unknown as string]: {
          ...DEFAULT_CONFIG_CONTEXT,
          components: { spin: componentConfig },
        },
      },
    },
  });

/**
 * 推进时间轴。
 *
 * 三步缺一不可：
 *   1. `nextTick()` —— 让 `watchEffect` 跑起来，把 debounce / interval **注册**进假队列
 *   2. `advanceTimersByTimeAsync(ms)` —— 推进时间轴（异步版才会冲刷微任务链）
 *   3. `nextTick()` —— 让定时器回调触发的响应式更新落到 DOM
 */
async function advance(ms: number): Promise<void> {
  await nextTick();
  await vi.advanceTimersByTimeAsync(ms);
  await nextTick();
}

/** 采集一次渲染过程中产生的全部告警文本。 */
async function warningsOf(run: () => void): Promise<string[]> {
  resetWarned();
  const capture = captureWarnings();
  try {
    run();
    await flushAll();
  } finally {
    capture.restore();
  }
  return capture.texts();
}

mountTest('Spin', { render: () => h(Spin) });

/** `setDefaultIndicator` 是**模块级**单例，必须还原，否则会污染同进程的其它测试文件。 */
afterEach(() => {
  setDefaultIndicator(undefined);
});

describe('Spin · 基本结构', () => {
  it('默认渲染：`spinning` 默认为 true，非嵌套时根元素自己就是 section', () => {
    const w = mountSpin();
    expect(w.element.tagName).toBe('DIV');
    expect(w.classes()).toContain(P);
    expect(w.classes()).toContain(`${P}-spinning`);
    // isNested = false ⇒ `-section` 落在根上
    expect(w.classes()).toContain(`${P}-section`);
    expect(w.attributes('aria-live')).toBe('polite');
    expect(w.attributes('aria-busy')).toBe('true');
  });

  it('默认指示器：dot-holder > dot > 4 个 dot-item', () => {
    const w = mountSpin();
    expect(w.findAll(`.${P}-dot-holder`)).toHaveLength(1);
    expect(w.findAll(`.${P}-dot-spin`)).toHaveLength(1);
    expect(w.findAll(`.${P}-dot-item`)).toHaveLength(4);
  });

  it('spinning=false：既没有 -spinning 类名，也不渲染指示器', () => {
    const w = mountSpin({ spinning: false });
    expect(w.classes()).not.toContain(`${P}-spinning`);
    expect(w.attributes('aria-busy')).toBe('false');
    expect(w.find(`.${P}-dot-holder`).exists()).toBe(false);
  });

  it('有 children：根元素让出 -section，改由内层 div 承担，并渲染 -container', () => {
    const w = withChildren();
    expect(w.classes()).not.toContain(`${P}-section`);
    const section = w.find(`.${P}-section`);
    expect(section.exists()).toBe(true);
    // 内层 section 是**子元素**，不是根
    expect(section.element).not.toBe(w.element);
    expect(w.find(`.${P}-container`).text()).toBe('content');
  });

  it('★ fullscreen 即使没有 children 也算嵌套（isNested = hasChildren || fullscreen）', () => {
    const w = mountSpin({ fullscreen: true });
    expect(w.classes()).toContain(`${P}-fullscreen`);
    expect(w.classes()).not.toContain(`${P}-section`);
    const section = w.find(`.${P}-section`);
    expect(section.exists()).toBe(true);
    expect(section.element).not.toBe(w.element);
    // 没有 children ⇒ 没有 container
    expect(w.find(`.${P}-container`).exists()).toBe(false);
  });

  it('★ fullscreen 的根元素不带 `pointer-events: none`（antd `right style when fullscreen`）', () => {
    const w = mountSpin({ fullscreen: true, spinning: true });
    const style = w.attributes('style') ?? '';
    expect(style).not.toContain('pointer-events');
  });

  it('尺寸：small / large 追加 -sm / -lg，medium 与 default 都不追加', async () => {
    expect(mountSpin({ size: 'small' }).classes()).toContain(`${P}-sm`);
    expect(mountSpin({ size: 'large' }).classes()).toContain(`${P}-lg`);
    expect(mountSpin({ size: 'medium' }).classes()).not.toContain(`${P}-sm`);
    expect(mountSpin({ size: 'medium' }).classes()).not.toContain(`${P}-lg`);
    // `size="default"` 会告警，所以要包在采集里 —— 告警本身由「废弃 API」一节断言
    await warningsOf(() => {
      expect(mountSpin({ size: 'default' }).classes()).not.toContain(`${P}-sm`);
      expect(mountSpin({ size: 'default' }).classes()).not.toContain(`${P}-lg`);
    });
  });

  it('★ `description ?? tip`：两者同时给时 description 胜', async () => {
    // `tip` 会告警（由「废弃 API」一节断言），这里只关心合并结果，所以包在采集里
    await warningsOf(() => {
      expect(mountSpin({ description: 'A', tip: 'B' }).find(`.${P}-description`).text()).toBe('A');
      expect(mountSpin({ tip: 'B' }).find(`.${P}-description`).text()).toBe('B');
    });
  });

  it('★ 不传 description / tip 时**不**渲染文案块（PITFALLS 46 的回归防护）', () => {
    // 少了 `withDefaults` 里的 `undefined`，Vue 的 Boolean 转换会把它们变成 `false`，
    // 而 `false` 是 falsy —— 表现为「文案不出现」而不是报错，极易漏。
    expect(mountSpin().find(`.${P}-description`).exists()).toBe(false);
  });

  it('嵌套 <Spin> 上的 style 只作用于根元素（antd `should only affect the spin element`）', () => {
    const w = withChildren({ style: { padding: '20px' } });
    expect(w.attributes('style')).toContain('padding: 20px');
  });

  it('should render 0：children 为数字 0 时 container 里是文本 "0"', () => {
    const w = withChildren({}, 0);
    expect(w.find(`.${P}-container`).text()).toBe('0');
  });

  it('暴露 nativeElement，指向根元素', () => {
    const w = mountSpin();
    expect((w.vm as unknown as { nativeElement: HTMLDivElement | null }).nativeElement).toBe(
      w.element,
    );
  });

  it('rtl：context 的 direction 为 rtl 时追加 -rtl', () => {
    const w = mount(Spin, {
      global: {
        provide: {
          [configContextKey as unknown as string]: {
            ...DEFAULT_CONFIG_CONTEXT,
            direction: 'rtl',
          },
        },
      },
    });
    expect(w.classes()).toContain(`${P}-rtl`);
  });

  it('用户传的 aria-live / aria-busy 会覆盖组件自己写的值（antd 的展开顺序）', () => {
    const w = mount(Spin, { attrs: { 'aria-live': 'off', 'aria-busy': 'false' } });
    expect(w.attributes('aria-live')).toBe('off');
    expect(w.attributes('aria-busy')).toBe('false');
  });
});

describe('Spin · 指示器', () => {
  it('自定义指示器：VNode 被克隆并追加 `-dot` 与语义化类名', () => {
    const w = mountSpin({ indicator: h('div', { class: 'custom-indicator' }) });
    const el = w.find('.custom-indicator');
    expect(el.exists()).toBe(true);
    expect(el.classes()).toContain(`${P}-dot`);
    // 用了自定义指示器就不该再出现默认的四点
    expect(w.find(`.${P}-dot-holder`).exists()).toBe(false);
  });

  it('★ indicator=null 回落到默认 Looper（`??` 而不是 `||`，`null` 与 `undefined` 都回落）', () => {
    const w = mountSpin({ indicator: null });
    expect(w.findAll(`.${P}-dot-item`)).toHaveLength(4);
  });

  it('★ 自定义指示器能收到 percent（把它声明成 prop 而不是靠 attrs 继承）', () => {
    const MyIndicator = defineComponent({
      name: 'MyIndicator',
      props: { percent: { type: Number, default: undefined } },
      setup(props) {
        return () => h('div', { class: 'custom-indicator' }, String(props.percent));
      },
    });
    const w = mountSpin({ indicator: h(MyIndicator), percent: 23 });
    expect(w.find('.custom-indicator').text()).toBe('23');
  });

  it('★ setDefaultIndicator 是**非响应式**的：只影响之后挂载的实例', async () => {
    const before = mountSpin();
    expect(before.find('.custom-spinner').exists()).toBe(false);

    setDefaultIndicator(h('em', { class: 'custom-spinner' }));
    await nextTick();
    // 已挂载的实例**不**重新渲染 —— 与 antd 的模块级 `let` 同语义，不是 bug
    expect(before.find('.custom-spinner').exists()).toBe(false);

    const after = mountSpin();
    expect(after.find('.custom-spinner').exists()).toBe(true);
  });

  it('★ 优先级：indicator > ConfigProvider > setDefaultIndicator', () => {
    setDefaultIndicator(h('em', { class: 'from-default' }));
    expect(mountSpin().find('.from-default').exists()).toBe(true);
    expect(
      mountWithConfig({ indicator: h('em', { class: 'from-config' }) })
        .find('.from-config')
        .exists(),
    ).toBe(true);
    expect(
      mountWithConfig(
        { indicator: h('em', { class: 'from-config' }) },
        {
          indicator: h('em', { class: 'from-prop' }),
        },
      )
        .find('.from-prop')
        .exists(),
    ).toBe(true);
  });

  it('ConfigProvider 的 spin.indicator（antd `should support ConfigProvider indicator`）', () => {
    const w = mountWithConfig({ indicator: h('div', { class: 'custom-indicator' }) });
    expect(w.find('.custom-indicator').exists()).toBe(true);
  });
});

describe('Spin · 语义化 classNames / styles', () => {
  it('classNames 落在对应槽位上', () => {
    const w = mountSpin({ classNames: { root: 'custom-root', indicator: 'custom-indicator' } });
    expect(w.classes()).toContain('custom-root');
    expect(w.find('.custom-indicator').exists()).toBe(true);
  });

  it('★ styles.indicator 落在 **dot-holder** 上（不是内层 -dot），styles.root 落在根', () => {
    const w = mountSpin({
      styles: { root: { background: 'rgb(255, 0, 0)' }, indicator: { color: 'rgb(0, 0, 255)' } },
    });
    expect(w.attributes('style')).toContain('background: rgb(255, 0, 0)');
    // 上游 `Looper` 把 `style` 写在 holder 上（`classNames.indicator` 同理）—
    // 用 `.apollo-spin-dot` 去断言会拿到 `undefined`，那是**选择器错**不是实现错。
    expect(w.find(`.${P}-dot-holder`).attributes('style')).toContain('color: rgb(0, 0, 255)');
    expect(w.find(`.${P}-dot`).attributes('style')).toBeUndefined();
  });

  it('★ styles.mask 只在 fullscreen 时并入根元素', async () => {
    const mask = { mask: { background: 'rgb(0, 255, 0)' } };
    await warningsOf(() => {
      expect(mountSpin({ styles: mask }).attributes('style') ?? '').not.toContain('rgb(0, 255, 0)');
      expect(mountSpin({ styles: mask, fullscreen: true }).attributes('style') ?? '').toContain(
        'rgb(0, 255, 0)',
      );
    });
  });

  it('★ styles.section：非嵌套落在根上，嵌套落在内层 div 上（根不吃）', () => {
    const style = { section: { background: 'rgb(1, 2, 3)' } };
    const flat = mountSpin({ styles: style });
    expect(flat.attributes('style') ?? '').toContain('rgb(1, 2, 3)');

    const nested = withChildren({ styles: style });
    expect(nested.attributes('style') ?? '').not.toContain('rgb(1, 2, 3)');
    expect(nested.find(`.${P}-section`).attributes('style') ?? '').toContain('rgb(1, 2, 3)');
  });

  it('函数式 styles 拿到的 info.props 是合并后的（size 可用）', () => {
    const stylesFn = (info: { props: { size?: string } }) =>
      info.props.size === 'small'
        ? { indicator: { color: 'rgb(114, 46, 209)' } }
        : { indicator: { color: 'rgb(0, 212, 255)' } };
    expect(
      mountSpin({ size: 'small', styles: stylesFn }).find(`.${P}-dot-holder`).attributes('style'),
    ).toContain('rgb(114, 46, 209)');
    expect(mountSpin({ styles: stylesFn }).find(`.${P}-dot-holder`).attributes('style')).toContain(
      'rgb(0, 212, 255)',
    );
  });
});

describe('Spin · 废弃 API 告警', () => {
  it('tip', async () => {
    const texts = await warningsOf(() => {
      withChildren({ tip: 'Loading...' });
    });
    expect(texts.join('\n')).toContain('[apollo: Spin]');
    expect(texts.join('\n')).toContain('`tip` is deprecated');
  });

  it('classNames.tip / styles.tip', async () => {
    const texts = await warningsOf(() => {
      mountSpin({ classNames: { tip: 'custom-tip' }, styles: { tip: { color: 'blue' } } });
    });
    const all = texts.join('\n');
    expect(all).toContain('`classNames.tip and styles.tip` is deprecated');
  });

  it('classNames.mask / styles.mask', async () => {
    const texts = await warningsOf(() => {
      mountSpin({ classNames: { mask: 'custom-mask' }, styles: { mask: { background: 'red' } } });
    });
    expect(texts.join('\n')).toContain('`classNames.mask and styles.mask` is deprecated');
  });

  it('wrapperClassName', async () => {
    const texts = await warningsOf(() => {
      withChildren({ wrapperClassName: 'custom-wrapper' });
    });
    expect(texts.join('\n')).toContain('`wrapperClassName` is deprecated');
  });

  it('size="default"', async () => {
    const texts = await warningsOf(() => {
      mountSpin({ size: 'default' });
    });
    expect(texts.join('\n')).toContain('`size="default"` is deprecated');
  });

  it('★ 配置来自 ConfigProvider 时也要告警（看的是合并后的值，不是 props）', async () => {
    const texts = await warningsOf(() => {
      mountWithConfig({ classNames: { tip: 'cfg-tip' } });
    });
    expect(texts.join('\n')).toContain('`classNames.tip and styles.tip` is deprecated');
  });

  it('合法用法不产生任何告警', async () => {
    const texts = await warningsOf(() => {
      withChildren({ description: 'Loading...' });
    });
    expect(texts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// L2 · 交互
// ---------------------------------------------------------------------------

describe('L2 · 交互 · spinning 受控', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('★ false → true：prop 变了 DOM 不会同步变，要等一个宏任务（delay=0 也要）', async () => {
    const w = mountSpin({ spinning: false });
    expect(w.classes()).not.toContain(`${P}-spinning`);

    await w.setProps({ spinning: true });
    // 此刻 watchEffect 已跑、debounce(0) 已注册，但定时器还没触发
    expect(w.classes()).not.toContain(`${P}-spinning`);

    await advance(0);
    expect(w.classes()).toContain(`${P}-spinning`);
    expect(w.attributes('aria-busy')).toBe('true');
  });

  it('★ true → false：立即生效，不走 debounce（should close immediately）', async () => {
    const w = mountSpin({ spinning: true });
    expect(w.classes()).toContain(`${P}-spinning`);

    await w.setProps({ spinning: false });
    expect(w.classes()).not.toContain(`${P}-spinning`);
    expect(w.find(`.${P}-dot-holder`).exists()).toBe(false);
  });

  it('指示器随 spinning 挂载 / 卸载（不是靠 CSS 隐藏）', async () => {
    const w = mountSpin({ spinning: false });
    expect(w.find(`.${P}-dot-holder`).exists()).toBe(false);
    await w.setProps({ spinning: true });
    await advance(0);
    expect(w.find(`.${P}-dot-holder`).exists()).toBe(true);
  });
});

describe('L2 · 交互 · delay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('★ 挂载时 spinning=true 且带 delay：首帧**不**转', () => {
    const w = mountSpin({ spinning: true, delay: 500 });
    expect(w.classes()).not.toContain(`${P}-spinning`);
    expect(w.attributes('aria-busy')).toBe('false');
  });

  it('★ 推进完 delay 之后才转', async () => {
    const w = mountSpin({ spinning: true, delay: 100 });
    expect(w.classes()).not.toContain(`${P}-spinning`);
    await advance(99);
    expect(w.classes()).not.toContain(`${P}-spinning`);
    await advance(1);
    expect(w.classes()).toContain(`${P}-spinning`);
  });

  it('★ 关不等：delay 期间 spinning 变 false，之后**不会**再补上', async () => {
    const w = mountSpin({ spinning: true, delay: 500 });
    await advance(300);
    await w.setProps({ spinning: false });
    await advance(500);
    expect(w.classes()).not.toContain(`${P}-spinning`);
  });

  it('★ delay 是重新计时，不是「至少显示这么久」', async () => {
    const w = mountSpin({ spinning: true, delay: 500 });
    await advance(300);
    // 300ms 时关掉再打开 ⇒ 定时器被 cancel 后重新排 500ms
    await w.setProps({ spinning: false });
    await w.setProps({ spinning: true });
    await advance(200); // 累计 500ms，但重新计时后只过了 200ms
    expect(w.classes()).not.toContain(`${P}-spinning`);
    await advance(300); // 累计 800ms = 重新计时的 500ms
    expect(w.classes()).toContain(`${P}-spinning`);
  });

  it('★ delay=0 与 delay=NaN 都走立即显示（`!!delay` 与 `!Number.isNaN` 两条判据）', () => {
    expect(mountSpin({ spinning: true, delay: 0 }).classes()).toContain(`${P}-spinning`);
    expect(mountSpin({ spinning: true, delay: Number.NaN }).classes()).toContain(`${P}-spinning`);
  });

  it('★ 卸载会 cancel 掉待执行的 debounce（antd delay.test 的 cancel 断言）', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    try {
      const w = mountSpin({ spinning: true, delay: 500 });
      await nextTick();
      const before = clearSpy.mock.calls.length;
      w.unmount();
      expect(clearSpy.mock.calls.length).toBeGreaterThan(before);
      // 推进到原定触发时刻也不该有任何反应
      await vi.advanceTimersByTimeAsync(600);
      expect(w.classes()).not.toContain(`${P}-spinning`);
    } finally {
      clearSpy.mockRestore();
    }
  });

  it('★ delay 期间接到 delay 变化会重新计时', async () => {
    const w = mountSpin({ spinning: true, delay: 1000 });
    await advance(500);
    await w.setProps({ delay: 200 });
    await advance(199); // 累计 699，重新计时后只过了 199
    expect(w.classes()).not.toContain(`${P}-spinning`);
    await advance(1);
    expect(w.classes()).toContain(`${P}-spinning`);
  });
});

describe('L2 · 交互 · percent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('★ percent=0 时**永不**渲染进度环（连 svg 都不出现）', async () => {
    const w = mountSpin({ percent: 0 });
    await flushAll();
    expect(w.find('[role="progressbar"]').exists()).toBe(false);
  });

  it('★ percent 非 0：挂载后的第二帧才补上 svg（与 React 的 useLayoutEffect 同构）', async () => {
    const w = mountSpin({ percent: 23 });
    // 首帧没有 —— 这一条是 L4 里「子节点数不同 1 vs 2」的根因，从实现层对齐，没加豁免
    expect(w.find('[role="progressbar"]').exists()).toBe(false);
    await flushAll();
    const bar = w.find('[role="progressbar"]');
    expect(bar.exists()).toBe(true);
    expect(Number(bar.attributes('aria-valuenow'))).toBe(23);
  });

  it('aria-valuenow 被钳到 [0, 100]（150 → 100，-50 → 0）', async () => {
    const w = mountSpin({ percent: 150 });
    await flushAll();
    expect(Number(w.find('[role="progressbar"]').attributes('aria-valuenow'))).toBe(100);
    await w.setProps({ percent: -50 });
    await flushAll();
    expect(Number(w.find('[role="progressbar"]').attributes('aria-valuenow'))).toBe(0);
  });

  it('有进度时四点 holder 被 -hidden 隐藏，让位给进度环', async () => {
    const w = mountSpin({ percent: 40 });
    await flushAll();
    expect(w.find(`.${P}-dot-holder-hidden`).exists()).toBe(true);
  });

  it('★ percent="auto"：每 200ms 渐近推进，永远到不了 100', async () => {
    const w = mountSpin({ percent: 'auto' });
    await flushAll();
    // 起点是 0 ⇒ 首帧不渲染（与 percent=0 同判据）
    expect(w.find('[role="progressbar"]').exists()).toBe(false);

    await advance(AUTO_INTERVAL);
    const first = Number(w.find('[role="progressbar"]').attributes('aria-valuenow'));
    expect(first).toBeGreaterThanOrEqual(1);

    await advance(AUTO_INTERVAL * 3);
    const later = Number(w.find('[role="progressbar"]').attributes('aria-valuenow'));
    expect(later).toBeGreaterThan(first);
    expect(later).toBeLessThan(100);

    // 再推很久也只是无限逼近
    await advance(AUTO_INTERVAL * 100);
    const much = Number(w.find('[role="progressbar"]').attributes('aria-valuenow'));
    expect(much).toBeGreaterThan(later);
    expect(much).toBeLessThan(100);
  });

  it('★ percent="auto" 且 spinning=false 时定时器被清掉（不再推进）', async () => {
    const w = mountSpin({ percent: 'auto', spinning: false, delay: 0 });
    await advance(AUTO_INTERVAL * 5);
    expect(w.find('[role="progressbar"]').exists()).toBe(false);
  });

  it('★ auto 再次变真时会**重置**为 0（watchEffect 重新执行 `mockPercent = 0`）', async () => {
    const w = mountSpin({ percent: 'auto' });
    await advance(AUTO_INTERVAL * 2);
    expect(Number(w.find('[role="progressbar"]').attributes('aria-valuenow'))).toBeGreaterThan(0);

    await w.setProps({ spinning: false });
    await advance(AUTO_INTERVAL);
    await w.setProps({ spinning: true });
    await advance(AUTO_INTERVAL - 1);
    // 重置后重新计时：不足一个 AUTO_INTERVAL 时仍是 0 ⇒ 进度环尚未出现
    expect(w.find('[role="progressbar"]').exists()).toBe(false);
    await advance(1);
    expect(Number(w.find('[role="progressbar"]').attributes('aria-valuenow'))).toBeGreaterThan(0);
  });

  /**
   * 「停止后保留最后一跳」这条契约在**组件层不可观测**：整个指示器块都在
   * `v-if="spinning"` 里，`spinning` 为假时根本不渲染。所以只能在 hook 层钉住
   * —— 用 `usePercent` 自己驱动，而不是删掉这条断言（契约是真的，只是观测点不同）。
   */
  it('★ usePercent：停止只 clearInterval，不重置 mockPercent（hook 层断言）', async () => {
    const spinning = ref(true);
    const percent = ref<SpinPercent>('auto');
    const scope = effectScope();
    let merged: ComputedRef<number | undefined> | undefined;

    scope.run(() => {
      merged = usePercent(spinning, percent);
    });
    try {
      expect(merged?.value).toBe(0);
      await advance(AUTO_INTERVAL * 2);
      const stopped = merged?.value ?? 0;
      expect(stopped).toBeGreaterThan(0);

      spinning.value = false;
      await advance(AUTO_INTERVAL * 3);
      // 1) 不再推进  2) 也没有被重置成 0
      expect(merged?.value).toBe(stopped);
    } finally {
      scope.stop();
    }
  });

  it('usePercent：非 auto 原样透传（不做钳制，钳制在 Progress 里）', () => {
    const scope = effectScope();
    let merged: ComputedRef<number | undefined> | undefined;
    scope.run(() => {
      merged = usePercent(true, () => 150);
    });
    try {
      expect(merged?.value).toBe(150);
    } finally {
      scope.stop();
    }
  });
});

describe('L2 · 交互 · 其它状态切换', () => {
  it('fullscreen 切换会改变 isNested，从而改变 -section 的落点', async () => {
    const w = mountSpin();
    expect(w.classes()).toContain(`${P}-section`);
    await w.setProps({ fullscreen: true });
    expect(w.classes()).toContain(`${P}-fullscreen`);
    expect(w.classes()).not.toContain(`${P}-section`);
    expect(w.find(`.${P}-section`).element).not.toBe(w.element);
  });

  it('description 从无到有、从有到无', async () => {
    const w = mountSpin();
    expect(w.find(`.${P}-description`).exists()).toBe(false);
    await w.setProps({ description: 'Loading...' });
    expect(w.find(`.${P}-description`).text()).toBe('Loading...');
    await w.setProps({ description: undefined });
    expect(w.find(`.${P}-description`).exists()).toBe(false);
  });

  it('size 切换会换掉 -sm / -lg', async () => {
    const w = mountSpin({ size: 'small' });
    expect(w.classes()).toContain(`${P}-sm`);
    await w.setProps({ size: 'large' });
    expect(w.classes()).not.toContain(`${P}-sm`);
    expect(w.classes()).toContain(`${P}-lg`);
  });

  it('indicator 从默认切到自定义', async () => {
    const w = mountSpin();
    expect(w.findAll(`.${P}-dot-item`)).toHaveLength(4);
    await w.setProps({ indicator: h('div', { class: 'custom-indicator' }) });
    expect(w.findAll(`.${P}-dot-item`)).toHaveLength(0);
    expect(w.find('.custom-indicator').exists()).toBe(true);
  });

  it('★ nesting 的两种来源：`fullscreen` 关掉且有 children 时仍然是嵌套', async () => {
    const w = withChildren({ fullscreen: true });
    expect(w.classes()).not.toContain(`${P}-section`);
    await w.setProps({ fullscreen: false });
    // children 还在 ⇒ isNested 仍为真 ⇒ 根元素依旧不吃 -section
    expect(w.classes()).not.toContain(`${P}-section`);
    expect(w.find(`.${P}-container`).exists()).toBe(true);
  });
});
