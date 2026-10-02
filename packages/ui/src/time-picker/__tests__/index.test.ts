/**
 * L1 单元 + L2 交互（G5/G6）。
 *
 * 契约来源：antd 6.6.4 的 `components/time-picker/__tests__/`（`index.test.tsx` 250 行 +
 * `legacy.test.tsx` 37 行 + `semantic.test.tsx` 78 行）与 `docs/analysis/time-picker.md`
 * 的两张**实测表**（告警矩阵 §2.4 / 上下文路由 §4.2）。
 *
 * ── 本组件是薄壳，所以本文件的重点不是「行为」而是「接线」────────────────────
 *
 * 值 / 开合 / 面板 / 格式化全部由 `date-picker` 承担（它的 L1/L2 是
 * `date-picker/__tests__/index.test.ts` 的 434 条）。本文件只钉**四件薄壳才有的事**：
 *
 * 1. **`picker='time'` 真的传到了内层** —— 判据是**面板类型**（`.apollo-picker-time-panel`），
 *    不是「props 传过去了」（PITFALLS 300：透传类代码必须断言**效果**）。
 * 2. 🚨 **告警矩阵**（§2.4）：单个 TimePicker **只**对 `addon` / `onSelect` /
 *    `dropdownClassName` 发告警，**不**对 `popupClassName` / `popupStyle` / `bordered` 发；
 *    `TimePicker.RangePicker` 对后三个**也发**（命名空间 `DatePicker.RangePicker`）。
 * 3. 🚨 **上下文路由**（§4.2）：`components.timePicker.*` 生效（且**合并两次** ⇒ 类名重复）、
 *    `components.datePicker.*` **不泄漏**；`<DatePicker picker="time"/>` 则**相反**。
 * 4. **`mode` 被丢弃**、**`renderExtraFooter ?? addon`**、**`variant` 解析链**。
 */

import { resetWarned } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import DatePicker from '../../date-picker/DatePicker.vue';
import TimePicker from '../TimePicker.vue';
import TimeRangePicker from '../TimeRangePicker.vue';

/** 内层的根类名前缀（与 `date-picker` 相同：`getPrefixCls('picker')`）。 */
const P = 'apollo-picker';

const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

/**
 * 🚨 **必须在每个用例后清 DOM**：断言失败会跳过 `w.unmount()`，
 * 残留的 `.apollo-picker` 会让后面用 `document.querySelector` 的用例读到**上一个**元素
 * （本轮实测：一条失败级联出三条假失败）。
 */
afterEach(() => {
  document.body.innerHTML = '';
});

/** 断言「`console.error` 里出现了某个子串」，并返回全部消息方便调试。 */
const warnings = (): string[] => errorSpy.mock.calls.map((call) => String(call[0]));

const mountTimePicker = (props: Record<string, unknown> = {}) =>
  mount(TimePicker, { props, attachTo: document.body });

const mountTimeRangePicker = (props: Record<string, unknown> = {}) =>
  mount(TimeRangePicker, { props, attachTo: document.body });

/** 取根的类名（`document.body` 下第一个 `.<P>`）。 */
const rootClassOf = (): string => document.querySelector(`.${P}`)?.className ?? '';

describe('TimePicker · 接线（薄壳的四件正事）', () => {
  it('渲染的是 picker 的根（`apollo-picker`），**没有** `-time-picker` 后缀', () => {
    const w = mountTimePicker();
    // 上游产物：`ant-picker ant-picker-outlined …` —— 类名完全来自 date-picker，
    // 「time」只体现在**面板类型**上。
    expect(w.find(`.${P}`).exists()).toBe(true);
    expect(w.find('.apollo-time-picker').exists()).toBe(false);
    w.unmount();
  });

  it("🚨 `picker='time'` 真的传到了内层（判据是**面板类型**，不是 props）", async () => {
    const w = mountTimePicker({ open: true });
    await w.vm.$nextTick();
    // 时间面板是 `-time-panel`（日期面板是 `-date-panel`）—— 这条断言如果只写
    // 「`props.picker === 'time'`」是抓不到「没传下去」的。
    expect(document.querySelector(`.${P}-time-panel`)).not.toBeNull();
    expect(document.querySelector(`.${P}-date-panel`)).toBeNull();
    w.unmount();
  });

  it('🚨 `mode` 被丢弃（上游 `mode={undefined}`）', async () => {
    const w = mountTimePicker({ open: true, mode: 'month' });
    await w.vm.$nextTick();
    // `mode='month'` 在日期面板里会切到月粒度；时间轴必须无视它。
    expect(document.querySelector(`.${P}-time-panel`)).not.toBeNull();
    expect(document.querySelector(`.${P}-month-panel`)).toBeNull();
    w.unmount();
  });

  it('`variant` / deprecated `bordered` 落到根类名', () => {
    const a = mountTimePicker({ variant: 'filled' });
    expect(rootClassOf()).toContain(`${P}-filled`);
    a.unmount();

    const b = mountTimePicker({ bordered: false });
    expect(rootClassOf()).toContain(`${P}-borderless`);
    b.unmount();
  });

  it('`renderExtraFooter ?? addon` —— 两者都渲染到页脚', async () => {
    const w = mountTimePicker({
      open: true,
      renderExtraFooter: () => h('span', { class: 'from-footer' }, 'F'),
      addon: () => h('span', { class: 'from-addon' }, 'A'),
    });
    await w.vm.$nextTick();
    // `renderExtraFooter` 优先 ⇒ 只出现它。
    expect(document.querySelector('.from-footer')).not.toBeNull();
    expect(document.querySelector('.from-addon')).toBeNull();
    w.unmount();

    const w2 = mountTimePicker({
      open: true,
      addon: () => h('span', { class: 'from-addon' }, 'A'),
    });
    await w2.vm.$nextTick();
    expect(document.querySelector('.from-addon')).not.toBeNull();
    w2.unmount();
  });

  it('`TimePicker.RangePicker` 渲染范围根（`-range`）', () => {
    const w = mountTimeRangePicker();
    expect(document.querySelector(`.${P}-range`)).not.toBeNull();
    w.unmount();
  });

  it("🚨 `TimePicker.RangePicker` 的 `picker='time'` 也生效", async () => {
    const w = mountTimeRangePicker({ open: true });
    await w.vm.$nextTick();
    expect(document.querySelectorAll(`.${P}-time-panel`).length).toBeGreaterThan(0);
    expect(document.querySelector(`.${P}-date-panel`)).toBeNull();
    w.unmount();
  });
});

describe('TimePicker · 告警矩阵（实测表 §2.4）', () => {
  it('`addon` 发告警，命名空间是 `TimePicker`', () => {
    resetWarned();
    errorSpy.mockClear();
    const w = mountTimePicker({ addon: () => h('span') });
    expect(warnings().join('\n')).toContain('`addon` is deprecated');
    expect(warnings().join('\n')).toContain('[apollo: TimePicker]');
    w.unmount();
  });

  it('`onSelect` 发告警，命名空间是 `TimePicker`（**不是** `DatePicker`）', () => {
    resetWarned();
    errorSpy.mockClear();
    const w = mountTimePicker({ onSelect: () => {} });
    const text = warnings().join('\n');
    expect(text).toContain('`onSelect` is deprecated');
    expect(text).toContain('[apollo: TimePicker]');
    expect(text).not.toContain('[apollo: DatePicker]');
    w.unmount();
  });

  it('`dropdownClassName` 发告警（它**不在**外层的解构名单里）', () => {
    resetWarned();
    errorSpy.mockClear();
    const w = mountTimePicker({ dropdownClassName: 'x' });
    expect(warnings().join('\n')).toContain('`dropdownClassName` is deprecated');
    w.unmount();
  });

  it.each([
    ['popupClassName', { popupClassName: 'x' }],
    ['popupStyle', { popupStyle: { color: 'red' } }],
    ['bordered', { bordered: false }],
  ])('🚨 单个 TimePicker 的 `%s` **不发**废弃告警（外层解构掉了）', (_label, props) => {
    resetWarned();
    errorSpy.mockClear();
    const w = mountTimePicker(props);
    const text = warnings().join('\n');
    expect(text).not.toContain('is deprecated');
    w.unmount();
  });

  it.each([
    ['bordered', { bordered: false }, '`bordered` is deprecated'],
    ['popupClassName', { popupClassName: 'x' }, '`popupClassName` is deprecated'],
    ['onSelect', { onSelect: () => {} }, '`onSelect` is deprecated'],
  ])('🚨 范围版 `%s` **发**告警，命名空间是 `DatePicker.RangePicker`', (_label, props, frag) => {
    resetWarned();
    errorSpy.mockClear();
    const w = mountTimeRangePicker(props);
    const text = warnings().join('\n');
    expect(text).toContain(frag);
    expect(text).toContain('[apollo: DatePicker.RangePicker]');
    w.unmount();
  });
});

describe('TimePicker · 上下文路由（实测表 §4.2）', () => {
  /**
   * ⚠️ **本组用 `suffixIcon` 作探针，而不是 `classNames.root`** ——
   * `classNames.root` 在本仓的 `date-picker` 里**根本没接到根元素上**
   * （`components/root-class.ts` 的 `getRootClassNames` 没有这个入参、
   * `Selector` 也不消费它），那是 **`date-picker` 的既有缺口**（登记在
   * `time-picker/README.md` §5），与本次的配置键改道无关。
   *
   * `suffixIcon` 走的是**同一条** `useComponentConfig(configKey)` 通道，
   * 足以证明「本组件读的是 `timePicker`、不是 `datePicker`」。
   */
  const suffix = (label: string) => h('i', { class: label }, 'S');

  const withConfig = (configKey: string, config: Record<string, unknown>, child: unknown) =>
    mount(ConfigProvider, {
      // ⚠️ `components` 是 `Record<string, ComponentConfigLike>`，而这里用**计算键**
      //    ⇒ TS 无法把它对应到具体组件类型（与 `useComponentConfig` 的动态键查询同源）。
      //    `as never` 是本仓对「动态键查组件配置」的既有写法。
      props: { components: { [configKey]: config } as never },
      slots: { default: () => child },
      attachTo: document.body,
    });

  const hasSuffix = (label: string) => document.querySelector(`.${P}-suffix .${label}`) !== null;

  it('🚨 `components.timePicker.suffixIcon` 生效', () => {
    const w = withConfig('timePicker', { suffixIcon: suffix('tp-suffix') }, h(TimePicker));
    expect(hasSuffix('tp-suffix')).toBe(true);
    w.unmount();
  });

  it('🚨 `components.datePicker.suffixIcon` **不泄漏**进 TimePicker', () => {
    const w = withConfig('datePicker', { suffixIcon: suffix('dp-suffix') }, h(TimePicker));
    expect(hasSuffix('dp-suffix')).toBe(false);
    w.unmount();
  });

  it('🚨 反向对照：`<DatePicker picker="time"/>` 读 `datePicker`、**不读** `timePicker`', () => {
    const a = withConfig(
      'datePicker',
      { suffixIcon: suffix('dp-suffix') },
      h(DatePicker, { picker: 'time' }),
    );
    expect(hasSuffix('dp-suffix')).toBe(true);
    a.unmount();

    const b = withConfig(
      'timePicker',
      { suffixIcon: suffix('tp-suffix') },
      h(DatePicker, { picker: 'time' }),
    );
    expect(hasSuffix('tp-suffix')).toBe(false);
    b.unmount();
  });

  it('🚨 语义槽**合并两次**（外层一次 + 内层一次）⇒ 类名在浮层上重复出现', async () => {
    // `classNames.root` 那条通道本仓未接（见上），改用**确实接了**的
    // `classNames.popup.root`（落到 `.apollo-picker-dropdown`）。
    // 上游的重复来自「外层合并一次、内层再合并一次」，本仓结构同构 ⇒ 应当同样重复。
    const w = withConfig(
      'timePicker',
      { classNames: { popup: { root: 'ctx-popup' } } },
      h(TimePicker, { open: true }),
    );
    await w.vm.$nextTick();
    const dropdown = document.querySelector(`.${P}-dropdown`);
    expect(dropdown).not.toBeNull();
    const cls = dropdown?.className ?? '';
    expect(cls.split(' ').filter((c) => c === 'ctx-popup')).toHaveLength(2);
    w.unmount();
  });
});

describe('TimePicker · 默认形态（Boolean prop 的 `undefined` 语义）', () => {
  it('🚨 不传任何 prop 时是 `-outlined`（**不是** `-borderless`）', () => {
    // 判据：Vue 对 `type: Boolean` 的 prop 在未传时会强制成 `false` ⇒
    // 少了 `withDefaults(..., { bordered: undefined })` 时 `useVariant` 会判成
    // `'borderless'`，默认渲染成 `-borderless`（本轮实测踩到）。
    const w = mountTimePicker();
    expect(rootClassOf()).toContain(`${P}-outlined`);
    expect(rootClassOf()).not.toContain(`${P}-borderless`);
    w.unmount();
  });

  it('🚨 范围版同理', () => {
    const w = mountTimeRangePicker();
    expect(rootClassOf()).toContain(`${P}-outlined`);
    expect(rootClassOf()).not.toContain(`${P}-borderless`);
    w.unmount();
  });
});
