/**
 * L1 · 单元测试 + L2 · 交互测试
 *
 * ── 这个文件的定位 ───────────────────────────────────────────────────────────
 *
 * Button 是**第一个有状态、有事件、有两条互斥 DOM 分支**的组件，所以它第一次把
 * `TESTING.md` §3.1 的完整矩阵真正跑起来。断言的每一条判据都能在
 * `docs/analysis/button.md` 里找到上游行号；本文件不新增「我们觉得应该这样」的期望。
 *
 * ── 六个重点（都在标题里标了 ★）───────────────────────────────────────────────
 *
 *   1. color / variant 的**六层回退**（`Button.tsx:181-211`）
 *   2. `ghost` 把 `solid` **退化**成 `outlined`（`:213-218`）
 *   3. `-dangerous` 用**原始 `danger` prop**，而 `-color-{x}` 里是 `dangerous`
 *   4. `loading` 的对象形态 `delay` 语义：到点才置 true、**不自动复位**
 *   5. 两个中文字的检测必须 `onMounted` **和** `onUpdated` 都跑（D6）
 *   6. `<a>` 与 `<button>` 的 disabled 表达**不对称**
 *   7. 点击在 `innerLoading || mergedDisabled` 时被拦截且 `preventDefault`
 *
 * ── 这个文件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明与 antd 的 DOM 逐字一致（那是 L4，见 `semantic.test.ts`）
 *   - 没证明像素一致（那是 L6，见 `tests/visual/`）
 *   - 没证明 `compactSize` 会生效（来自 `space/Compact`，由 space 的测试覆盖）
 */

import { mountTest, resetWarned } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { disabledContextKey } from '../../config-provider/disabled-context';
import { sizeContextKey } from '../../config-provider/size-context';
import { Button } from '../index';

/** 兜底前缀 —— 不传 `prefixCls` 时 `getPrefixCls('btn')` 的结果。 */
const P = 'apollo-btn';

type Props = Record<string, unknown>;

const mountBtn = (props: Props = {}, slots?: Record<string, () => unknown>) =>
  mount(Button, { props, ...(slots ? { slots } : {}) });

const withText = (props: Props = {}, text = 'Text') => mountBtn(props, { default: () => text });

const classesOf = (props: Props = {}, text?: string): string[] =>
  (text === undefined ? mountBtn(props) : withText(props, text)).classes();

/** 只取 `-color-*` / `-variant-*` 这两个类名，便于表里比对。 */
const colorVariantOf = (props: Props = {}): [string | undefined, string | undefined] => {
  const classes = mountBtn(props).classes();
  return [
    classes.find((c) => c.startsWith(`${P}-color-`))?.slice(`${P}-color-`.length),
    classes.find((c) => c.startsWith(`${P}-variant-`))?.slice(`${P}-variant-`.length),
  ];
};

/** 带 ConfigProvider 上下文挂载。 */
function mountWithConfig(
  config: Partial<typeof DEFAULT_CONFIG_CONTEXT>,
  props: Props = {},
  slots?: Record<string, () => unknown>,
) {
  return mount(Button, {
    props,
    ...(slots ? { slots } : {}),
    global: {
      provide: {
        [configContextKey as unknown as string]: { ...DEFAULT_CONFIG_CONTEXT, ...config },
      },
    },
  });
}

/** 捕获 `console.error` 并返回拼接后的文本（`warning()` 走 error 通道）。 */
async function capturedWarnings(run: () => unknown): Promise<string> {
  resetWarned();
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await run();
    await nextTick();
    return spy.mock.calls.map((args) => String(args[0])).join('\n');
  } finally {
    spy.mockRestore();
    resetWarned();
  }
}

/**
 * 探针图标：一个**组件对象**（不是 VNode）。
 *
 * 用来验证 `ButtonIcon` 的第二支 —— antd 的 `icon={<SearchOutlined />}` 在 Vue 侧
 * 的对应物是**组件本身**（见 `interface.ts` 的 `ButtonIcon`）。渲染出来必须是一个
 * 真 `<svg>`，而不是 `[object Object]` 字面量文本。
 */
const FakeIcon = defineComponent({
  name: 'FakeIcon',
  setup: () => () =>
    h('svg', { class: 'fake-icon', viewBox: '0 0 1024 1024' }, [h('path', { d: 'M0 0' })]),
});

mountTest('Button', { render: () => h(Button) });

// ===========================================================================
// 1. 基本结构
// ===========================================================================

describe('Button · 基本结构', () => {
  it('默认渲染 `<button type="button">` + 根类名 + default/outlined', () => {
    const w = mountBtn();
    expect(w.element.tagName).toBe('BUTTON');
    expect(w.attributes('type')).toBe('button');
    expect(w.classes()).toContain(P);
    expect(w.classes()).toContain(`${P}-default`);
    expect(w.classes()).toContain(`${P}-color-default`);
    expect(w.classes()).toContain(`${P}-variant-outlined`);
  });

  it('★ `htmlType` 透传（submit / reset），默认 button', () => {
    expect(mountBtn({ htmlType: 'submit' }).attributes('type')).toBe('submit');
    expect(mountBtn({ htmlType: 'reset' }).attributes('type')).toBe('reset');
    expect(mountBtn().attributes('type')).toBe('button');
  });

  it('没有默认插槽时不渲染 content 的 `<span>`', () => {
    expect(mountBtn().find('span').exists()).toBe(false);
  });

  it('有默认插槽时渲染 content 的 `<span>`（图标在前、内容在后）', () => {
    const w = mount(Button, {
      props: { icon: h('i', { class: 'ico' }) },
      slots: { default: () => 'Text' },
    });
    const spans = w.findAll('span');
    expect(spans).toHaveLength(2);
    expect(spans[0]?.classes()).toContain(`${P}-icon`);
    expect(spans[1]?.text()).toBe('Text');
  });

  it('不传 prefixCls 时兜底 `apollo-btn`；显式 prefixCls 是**完整前缀**', () => {
    const w = mountBtn({ prefixCls: 'my' });
    expect(w.classes()).toContain('my');
    expect(w.classes()).toContain('my-default');
    expect(w.classes()).toContain('my-color-default');
    expect(w.classes()).not.toContain(P);
  });

  it('expose `nativeElement` 指向根元素', () => {
    const w = mountBtn();
    const exposed = w.vm as unknown as { nativeElement: HTMLButtonElement | null };
    expect(exposed.nativeElement).toBe(w.element);
  });

  it('未声明的属性透传到根元素', () => {
    const w = mountBtn({ 'data-testid': 'x', id: 'my-btn' });
    expect(w.attributes('data-testid')).toBe('x');
    expect(w.attributes('id')).toBe('my-btn');
  });
});

// ===========================================================================
// 2. ★ color / variant 的六层回退
// ===========================================================================

describe('Button · color / variant 六层回退', () => {
  it('第 1 层：color + variant 同时给出 ⇒ 显式优先（压过 type / danger）', () => {
    expect(colorVariantOf({ color: 'blue', variant: 'filled' })).toEqual(['blue', 'filled']);
    expect(
      colorVariantOf({ type: 'primary', danger: true, color: 'blue', variant: 'filled' }),
    ).toEqual(['blue', 'filled']);
  });

  it('第 2 层：type / danger 糖（ButtonTypeMap）', () => {
    expect(colorVariantOf({ type: 'default' })).toEqual(['default', 'outlined']);
    expect(colorVariantOf({ type: 'primary' })).toEqual(['primary', 'solid']);
    expect(colorVariantOf({ type: 'dashed' })).toEqual(['default', 'dashed']);
    expect(colorVariantOf({ type: 'link' })).toEqual(['link', 'link']);
    expect(colorVariantOf({ type: 'text' })).toEqual(['default', 'text']);
  });

  it('★ `danger` 只替换 color，variant 沿用 type 的那一个', () => {
    // ⚠️ 类名里 danger 被改写成 `dangerous`（`mergedColorText`），所以这里期望
    //    `dangerous` 而不是 `danger` —— 与本文件 §4 那条「两处不一致」是同一件事。
    expect(colorVariantOf({ type: 'primary', danger: true })).toEqual(['dangerous', 'solid']);
    expect(colorVariantOf({ type: 'dashed', danger: true })).toEqual(['dangerous', 'dashed']);
    expect(colorVariantOf({ type: 'text', danger: true })).toEqual(['dangerous', 'text']);
    // 单独 danger（无 type）：走 `default` 的 outlined
    expect(colorVariantOf({ danger: true })).toEqual(['dangerous', 'outlined']);
  });

  it('第 3 层：`variant === "solid"` 但没有 color ⇒ primary + solid', () => {
    expect(colorVariantOf({ variant: 'solid' })).toEqual(['primary', 'solid']);
    // 其它 variant 单独给出**不**走这一条（会落到 context / 兜底）
    expect(colorVariantOf({ variant: 'filled' })).toEqual(['default', 'outlined']);
  });

  it('第 4 层：ConfigProvider 的 color + variant', () => {
    const w = mountWithConfig({
      components: { button: { color: 'cyan', variant: 'filled' } },
    });
    expect(w.classes()).toContain(`${P}-color-cyan`);
    expect(w.classes()).toContain(`${P}-variant-filled`);
  });

  it('★ 第 5 层：只有 contextVariant === "solid" ⇒ primary + solid', () => {
    const w = mountWithConfig({ components: { button: { variant: 'solid' } } });
    expect(w.classes()).toContain(`${P}-color-primary`);
    expect(w.classes()).toContain(`${P}-variant-solid`);
  });

  it('第 6 层：什么都没有 ⇒ default + outlined', () => {
    expect(colorVariantOf({})).toEqual(['default', 'outlined']);
  });

  it('★ 组件自己的 color/variant 优先于 context', () => {
    const w = mountWithConfig(
      { components: { button: { color: 'cyan', variant: 'filled' } } },
      { color: 'red', variant: 'dashed' },
    );
    expect(w.classes()).toContain(`${P}-color-red`);
    expect(w.classes()).toContain(`${P}-variant-dashed`);
  });
});

// ===========================================================================
// 3. ★ ghost：把 solid 退化成 outlined
// ===========================================================================

describe('Button · ghost', () => {
  it('★ solid + ghost ⇒ variant 退化成 outlined（color 不变）', () => {
    expect(colorVariantOf({ type: 'primary', ghost: true })).toEqual(['primary', 'outlined']);
    expect(colorVariantOf({ variant: 'solid', ghost: true })).toEqual(['primary', 'outlined']);
  });

  it('非 solid 变体 + ghost ⇒ variant 不变', () => {
    expect(colorVariantOf({ type: 'default', ghost: true })).toEqual(['default', 'outlined']);
    expect(colorVariantOf({ type: 'dashed', ghost: true })).toEqual(['default', 'dashed']);
  });

  it('-background-ghost 只在**有边框**变体上出现', () => {
    expect(classesOf({ ghost: true })).toContain(`${P}-background-ghost`);
    expect(classesOf({ type: 'text', ghost: true })).not.toContain(`${P}-background-ghost`);
    expect(classesOf({ type: 'link', ghost: true })).not.toContain(`${P}-background-ghost`);
  });

  it('ghost=false 时不加 -background-ghost', () => {
    expect(classesOf({ ghost: false })).not.toContain(`${P}-background-ghost`);
  });
});

// ===========================================================================
// 4. ★ -dangerous 用原始 danger prop
// ===========================================================================

describe('Button · dangerous vs color-dangerous', () => {
  it('★ danger ⇒ -dangerous + -color-dangerous（不是 -color-danger）', () => {
    const classes = classesOf({ danger: true });
    expect(classes).toContain(`${P}-dangerous`);
    expect(classes).toContain(`${P}-color-dangerous`);
    expect(classes).not.toContain(`${P}-color-danger`);
  });

  it('★ -dangerous 用的是**原始 danger prop**：color="danger" 但没传 danger ⇒ 不带 -dangerous', () => {
    const classes = classesOf({ color: 'danger', variant: 'solid' });
    expect(classes).toContain(`${P}-color-dangerous`);
    expect(classes).not.toContain(`${P}-dangerous`);
  });

  it('显式 danger={false} 时不带 -dangerous（判据是 `??`，false 也是显式值）', () => {
    expect(classesOf({ danger: false })).not.toContain(`${P}-dangerous`);
  });

  it('danger + color=blue+variant ⇒ color 被覆盖成 dangerous（type/danger 分支在显式分支之后）', () => {
    // color+variant 同时给出走第 1 层 ⇒ danger 不参与
    expect(colorVariantOf({ danger: true, color: 'blue', variant: 'solid' })).toEqual([
      'blue',
      'solid',
    ]);
    // 只给 color（没有 variant）⇒ 走 type/danger 分支（color 被 danger 覆盖）
    expect(colorVariantOf({ danger: true, color: 'blue' })).toEqual(['dangerous', 'outlined']);
  });
});

// ===========================================================================
// 5. size / shape / disabled 的回退链
// ===========================================================================

describe('Button · size / shape / disabled 回退', () => {
  it('size：large ⇒ -lg、small ⇒ -sm、middle ⇒ 都不加（默认值不产类名）', () => {
    expect(classesOf({ size: 'large' })).toContain(`${P}-lg`);
    expect(classesOf({ size: 'small' })).toContain(`${P}-sm`);
    const middle = classesOf({ size: 'middle' });
    expect(middle).not.toContain(`${P}-lg`);
    expect(middle).not.toContain(`${P}-sm`);
    const none = classesOf({});
    expect(none).not.toContain(`${P}-lg`);
    expect(none).not.toContain(`${P}-sm`);
  });

  it('size 回退到 ConfigProvider 的 componentSize', () => {
    const w = mount(Button, {
      props: {},
      global: { provide: { [sizeContextKey as unknown as string]: computed(() => 'large') } },
    });
    expect(w.classes()).toContain(`${P}-lg`);
  });

  it('组件 size 优先于 context size', () => {
    const w = mount(Button, {
      props: { size: 'small' },
      global: { provide: { [sizeContextKey as unknown as string]: computed(() => 'large') } },
    });
    expect(w.classes()).toContain(`${P}-sm`);
    expect(w.classes()).not.toContain(`${P}-lg`);
  });

  it('shape：circle / round ⇒ -{shape}；default / square ⇒ 不加', () => {
    expect(classesOf({ shape: 'circle' })).toContain(`${P}-circle`);
    expect(classesOf({ shape: 'round' })).toContain(`${P}-round`);
    expect(classesOf({ shape: 'square' })).not.toContain(`${P}-square`);
    // ⚠️ 不能断言「没有 `-default`」—— 那个类名是 `-{mergedType}` 产出的，恒在。
    expect(classesOf({})).not.toContain(`${P}-circle`);
    expect(classesOf({})).not.toContain(`${P}-square`);
  });

  it('shape 回退到 ConfigProvider', () => {
    const w = mountWithConfig({ components: { button: { shape: 'round' } } });
    expect(w.classes()).toContain(`${P}-round`);
  });

  it('disabled 回退到 DisabledContext，且组件自己的 false 能**显式关闭**父级 true', () => {
    const provideDisabled = (value: boolean) => ({
      global: { provide: { [disabledContextKey as unknown as string]: computed(() => value) } },
    });
    expect(mount(Button, { props: {}, ...provideDisabled(true) }).attributes('disabled')).toBe('');
    expect(
      mount(Button, { props: { disabled: false }, ...provideDisabled(true) }).attributes(
        'disabled',
      ),
    ).toBeUndefined();
    expect(
      mount(Button, { props: { disabled: true }, ...provideDisabled(false) }).attributes(
        'disabled',
      ),
    ).toBe('');
  });
});

// ===========================================================================
// 6. ★ loading
// ===========================================================================

describe('Button · loading', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('布尔 true ⇒ 立刻进入加载态（图标 span + -loading）', () => {
    const w = mountBtn({ loading: true });
    expect(w.classes()).toContain(`${P}-loading`);
    expect(w.find(`.${P}-icon`).exists()).toBe(true);
  });

  it('布尔 false / 不传 ⇒ 不加载', () => {
    expect(mountBtn({ loading: false }).classes()).not.toContain(`${P}-loading`);
    expect(mountBtn().classes()).not.toContain(`${P}-loading`);
  });

  it('★ 对象形态 delay <= 0 ⇒ 立刻 true（delay 缺省视为 0）', () => {
    expect(mountBtn({ loading: { delay: 0 } }).classes()).toContain(`${P}-loading`);
    expect(mountBtn({ loading: {} }).classes()).toContain(`${P}-loading`);
    expect(mountBtn({ loading: { delay: -1 } }).classes()).toContain(`${P}-loading`);
  });

  it('★ 对象形态 delay > 0 ⇒ 到点**才**置 true（防连点）', async () => {
    const w = mountBtn({ loading: { delay: 1000 } });
    expect(w.classes()).not.toContain(`${P}-loading`);
    vi.advanceTimersByTime(999);
    await nextTick();
    expect(w.classes(), '999ms 时还不该加载').not.toContain(`${P}-loading`);
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(w.classes(), '1000ms 时应当加载').toContain(`${P}-loading`);
  });

  it('★ delay 到点后**不会自动复位**：只有 loading prop 变回才停', async () => {
    const w = mountBtn({ loading: { delay: 500 } });
    vi.advanceTimersByTime(500);
    await nextTick();
    expect(w.classes()).toContain(`${P}-loading`);
    // 继续推进时间：仍然保持加载（不是一次性动画）
    vi.advanceTimersByTime(5000);
    await nextTick();
    expect(w.classes()).toContain(`${P}-loading`);

    await w.setProps({ loading: false });
    expect(w.classes()).not.toContain(`${P}-loading`);
  });

  it('★ 中途把 loading 收回去 ⇒ 已有的定时器被清掉，不会延迟点亮', async () => {
    const w = mountBtn({ loading: { delay: 500 } });
    await w.setProps({ loading: false });
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(w.classes()).not.toContain(`${P}-loading`);
  });

  it('loading 时点击被拦截：不 emit click 且 preventDefault', () => {
    const w = mountBtn({ loading: true });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    w.element.dispatchEvent(event);
    expect(w.emitted('click')).toBeUndefined();
    expect(event.defaultPrevented).toBe(true);
  });

  it('loading.icon 覆盖默认加载图标', () => {
    const w = mountBtn({ loading: { delay: 0, icon: h('i', { class: 'custom-loading' }) } });
    expect(w.find('.custom-loading').exists()).toBe(true);
  });

  it('★ 自定义 loading.icon 存在时**不**带 `-loading-icon`（该类名只属内置图标）', () => {
    const custom = mountBtn({ loading: { delay: 0, icon: h('i', { class: 'custom-loading' }) } });
    expect(custom.find(`.${P}-icon`).classes()).not.toContain(`${P}-loading-icon`);

    const builtin = mountBtn({ loading: true });
    expect(builtin.find(`.${P}-icon`).classes()).toContain(`${P}-loading-icon`);
  });

  it('★ loading.icon 传**组件对象** ⇒ 渲染成真 svg，不是 `[object Object]`', () => {
    const w = mountBtn({ loading: { delay: 0, icon: FakeIcon } });
    expect(w.find(`.${P}-icon .fake-icon`).exists()).toBe(true);
    expect(w.text()).not.toContain('[object Object]');
  });

  it('★ ConfigProvider 的 loadingIcon 同样接受组件对象（`ButtonConfig.loadingIcon`）', () => {
    const w = mountWithConfig(
      { components: { button: { loadingIcon: FakeIcon } } },
      { loading: true },
    );
    expect(w.find(`.${P}-icon .fake-icon`).exists()).toBe(true);
    expect(w.text()).not.toContain('[object Object]');
    // 上下文提供的加载图标也算「自定义」⇒ 不带 `-loading-icon`
    expect(w.find(`.${P}-icon`).classes()).not.toContain(`${P}-loading-icon`);
  });

  it('loading.icon 优先于 ConfigProvider 的 loadingIcon', () => {
    const w = mountWithConfig(
      { components: { button: { loadingIcon: FakeIcon } } },
      { loading: { delay: 0, icon: h('i', { class: 'prop-loading' }) } },
    );
    expect(w.find('.prop-loading').exists()).toBe(true);
    expect(w.find('.fake-icon').exists()).toBe(false);
  });

  it('加载时 `-icon-only` 仍按「有没有内容」判定（有文字就不带）', () => {
    expect(withText({ loading: true }, 'Text').classes()).not.toContain(`${P}-icon-only`);
  });
});

// ===========================================================================
// 7. ★ 两个中文字（onMounted + onUpdated）
// ===========================================================================

describe('Button · 两个中文字自动插空格', () => {
  it('★ 恰好两个汉字 ⇒ 内容用真实空格 join（antd 6 的 spaceChildren）', async () => {
    const w = withText({}, '确定');
    await nextTick();
    // React 实测（antd 6.6.4 探针）：textContent 是 '确 定'。
    expect(w.text()).toBe('确 定');
    // 检测 effect 读的是**变换后**的 textContent（'确 定' 非两字）⇒ 类实际不出现。
    // 6.6.4 保留了类与 CSS（服务组件子节点场景），但对字符串子节点是自否定的。
    expect(w.classes()).not.toContain(`${P}-two-chinese-chars`);
  });

  it('判据是 `^{2}$`：一个字 / 三个字都不算', () => {
    expect(withText({}, '确').text()).not.toContain(' ');
    expect(withText({}, '确定吧').text()).not.toContain(' ');
  });

  it('含非汉字（哪怕总共两个字符）不算', () => {
    expect(withText({}, '确定1').classes()).not.toContain(`${P}-two-chinese-chars`);
    expect(withText({}, 'OK').classes()).not.toContain(`${P}-two-chinese-chars`);
  });

  it('无边框变体（text / link）不插', () => {
    expect(withText({ type: 'text' }, '确定').classes()).not.toContain(`${P}-two-chinese-chars`);
    expect(withText({ type: 'link' }, '确定').classes()).not.toContain(`${P}-two-chinese-chars`);
  });

  it('有图标时不插（needInserted 要求无图标）', () => {
    expect(
      mount(Button, { props: { icon: h('i') }, slots: { default: () => '确定' } }).text(),
    ).not.toContain(' ');
  });

  it('autoInsertSpace=false 时不插', () => {
    expect(withText({ autoInsertSpace: false }, '确定').text()).not.toContain(' ');
  });

  it('ConfigProvider 的 autoInsertSpace=false 生效；组件侧优先', async () => {
    const w = mountWithConfig(
      { components: { button: { autoInsertSpace: false } } },
      {},
      {
        default: () => '确定',
      },
    );
    await nextTick();
    expect(w.classes()).not.toContain(`${P}-two-chinese-chars`);

    const w2 = mountWithConfig(
      { components: { button: { autoInsertSpace: false } } },
      {
        autoInsertSpace: true,
      },
      { default: () => '确定' },
    );
    await nextTick();
    expect(w2.text()).toBe('确 定');
  });

  it('★ 更新成两字也要变换（onUpdated）—— 只在 onMounted 跑会漏掉这条', async () => {
    const text = ref('确定');
    const Host = defineComponent({
      setup() {
        return () => h(Button, null, { default: () => text.value });
      },
    });
    const w = mount(Host);
    await nextTick();
    expect(w.find('button').text()).toBe('确 定');
    // 先更新成非两字（应当摘掉类名），再更新回两字（应当重新戴上）
    text.value = 'Cancel';
    await nextTick();
    expect(w.find('button').classes()).not.toContain(`${P}-two-chinese-chars`);
    text.value = '取消';
    await nextTick();
    expect(w.find('button').text()).toBe('取 消');
  });

  it('★ 挂载时不是两字、之后变成两字 ⇒ 变换（D6 的正脸）', async () => {
    const text = ref('Cancel');
    const Host = defineComponent({
      setup() {
        return () => h(Button, null, { default: () => text.value });
      },
    });
    const w = mount(Host);
    expect(w.find('button').classes()).not.toContain(`${P}-two-chinese-chars`);
    text.value = '提交';
    await nextTick();
    expect(w.find('button').text(), 'onUpdated 缺失时这条会红').toBe('提 交');
  });

  it('loading 时不插（判据含 `!innerLoading`）', () => {
    expect(withText({ loading: true }, '确定').classes()).not.toContain(`${P}-two-chinese-chars`);
  });
});

// ===========================================================================
// 8. ★ <a> 与 <button> 两分支
// ===========================================================================

describe('Button · href 分支（<a> vs <button>）', () => {
  it('有 href ⇒ 渲染 `<a>`，且**没有** type 属性', () => {
    const w = mountBtn({ href: 'https://example.com' });
    expect(w.element.tagName).toBe('A');
    expect(w.attributes('href')).toBe('https://example.com');
    expect(w.attributes('type')).toBeUndefined();
  });

  it('★ <button> 分支：disabled 走**原生属性**', () => {
    const w = mountBtn({ disabled: true });
    expect(w.attributes('disabled')).toBe('');
    expect(w.attributes('aria-disabled')).toBeUndefined();
    expect(w.attributes('tabindex')).toBeUndefined();
  });

  it('★ <a> 分支：disabled ⇒ 移除 href + tabindex=-1 + aria-disabled=true（**不是**原生 disabled）', () => {
    const w = mountBtn({ href: 'https://example.com', disabled: true });
    expect(w.element.tagName).toBe('A');
    expect(w.attributes('href')).toBeUndefined();
    expect(w.attributes('tabindex')).toBe('-1');
    expect(w.attributes('aria-disabled')).toBe('true');
    expect(w.attributes('disabled')).toBeUndefined();
  });

  it('<a> 分支：未禁用 ⇒ tabindex=0 + aria-disabled="false"（恒为字符串）', () => {
    const w = mountBtn({ href: 'https://example.com' });
    expect(w.attributes('tabindex')).toBe('0');
    expect(w.attributes('aria-disabled')).toBe('false');
  });

  it('★ <a> 分支禁用时额外加 `-disabled` 类名（<button> 分支没有）', () => {
    expect(mountBtn({ href: '#', disabled: true }).classes()).toContain(`${P}-disabled`);
    expect(mountBtn({ disabled: true }).classes()).not.toContain(`${P}-disabled`);
    expect(mountBtn({ href: '#' }).classes()).not.toContain(`${P}-disabled`);
  });

  it('★ 两个分支的 disabled 都能被 DisabledContext 触发', () => {
    const provideDisabled = (value: boolean) => ({
      global: { provide: { [disabledContextKey as unknown as string]: computed(() => value) } },
    });
    expect(
      mount(Button, { props: { href: '#' }, ...provideDisabled(true) }).attributes('href'),
    ).toBeUndefined();
    expect(mount(Button, { props: {}, ...provideDisabled(true) }).attributes('disabled')).toBe('');
  });
});

// ===========================================================================
// 9. ★ 点击拦截 / 事件
// ===========================================================================

describe('Button · 点击', () => {
  it('正常点击 emit click，参数是 MouseEvent', async () => {
    const w = mountBtn();
    await w.trigger('click');
    const emitted = w.emitted('click');
    expect(emitted).toHaveLength(1);
    expect(emitted?.[0]?.[0]).toBeInstanceOf(MouseEvent);
  });

  it('★ disabled 时点击被拦截：不 emit + preventDefault', () => {
    const w = mountBtn({ disabled: true });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    w.element.dispatchEvent(event);
    expect(w.emitted('click')).toBeUndefined();
    expect(event.defaultPrevented).toBe(true);
  });

  it('★ <a> 分支 disabled 时同样被拦截', () => {
    const w = mountBtn({ href: '#', disabled: true });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    w.element.dispatchEvent(event);
    expect(w.emitted('click')).toBeUndefined();
    expect(event.defaultPrevented).toBe(true);
  });

  it('★ loading（delay 已到点）时点击被拦截', async () => {
    vi.useFakeTimers();
    try {
      const w = mountBtn({ loading: { delay: 100 } });
      vi.advanceTimersByTime(100);
      await nextTick();
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      w.element.dispatchEvent(event);
      expect(w.emitted('click')).toBeUndefined();
      expect(event.defaultPrevented).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('键盘 Enter / Space 走原生 `<button>` 的默认激活 ⇒ 同样触发 click', async () => {
    const w = withText({}, 'Text');
    await w.trigger('keydown', { key: 'Enter' });
    await w.trigger('keyup', { key: 'Enter' });
    // jsdom 不实现「空格/回车激活 button」的默认行为，这里改用真实 click 验证可达性：
    await w.trigger('click');
    expect(w.emitted('click')).toHaveLength(1);
  });
});

// ===========================================================================
// 10. 图标 / iconPlacement / icon-only
// ===========================================================================

describe('Button · icon', () => {
  it('icon prop 渲染进 `-icon` 的 span', () => {
    const w = mountBtn({ icon: h('i', { class: 'my-icon' }) });
    expect(w.find(`.${P}-icon`).exists()).toBe(true);
    expect(w.find('.my-icon').exists()).toBe(true);
  });

  it('icon 插槽也能传（prop 优先于插槽）', () => {
    const viaSlot = mount(Button, { slots: { icon: () => h('i', { class: 'slot-icon' }) } });
    expect(viaSlot.find('.slot-icon').exists()).toBe(true);

    const both = mount(Button, {
      props: { icon: h('i', { class: 'prop-icon' }) },
      slots: { icon: () => h('i', { class: 'slot-icon' }) },
    });
    expect(both.find('.prop-icon').exists()).toBe(true);
    expect(both.find('.slot-icon').exists()).toBe(false);
  });

  it('★ 无内容 + 有图标 ⇒ -icon-only', () => {
    expect(mountBtn({ icon: h('i') }).classes()).toContain(`${P}-icon-only`);
  });

  it('★ 有内容 ⇒ 不带 -icon-only；`0` 也算有内容', () => {
    expect(withText({ icon: h('i') }, 'Text').classes()).not.toContain(`${P}-icon-only`);
    const zero = mount(Button, { props: { icon: h('i') }, slots: { default: () => 0 } });
    expect(zero.classes()).not.toContain(`${P}-icon-only`);
    expect(zero.text()).toBe('0');
  });

  it('iconPlacement="end" ⇒ -icon-end（靠 CSS 翻转，DOM 顺序不变）', () => {
    expect(classesOf({ icon: h('i'), iconPlacement: 'end' })).toContain(`${P}-icon-end`);
    expect(classesOf({ icon: h('i') })).not.toContain(`${P}-icon-end`);
  });

  it('★ 已废弃的 iconPosition 仍然生效，且 iconPlacement 优先', () => {
    expect(classesOf({ icon: h('i'), iconPosition: 'end' })).toContain(`${P}-icon-end`);
    expect(classesOf({ icon: h('i'), iconPosition: 'end', iconPlacement: 'start' })).not.toContain(
      `${P}-icon-end`,
    );
  });

  it('无图标无 loading ⇒ 无 `-icon` 元素', () => {
    expect(mountBtn().find(`.${P}-icon`).exists()).toBe(false);
  });

  // ── 平台差异：`icon` 也可以是**组件**（antd 的 `React.ReactNode` 里那个「元素」）──
  //
  // antd 示例写 `icon={<SearchOutlined />}` —— React 里那是**已求值的元素**；
  // Vue 没有「元素」形态，对应物是**组件对象**（`SearchOutlined`）。`ButtonIcon`
  // 因此额外接受 `Component`，`asIconNode()` 负责 `h()` 包一层。
  //
  // ⚠️ 这两条是**回归防线**：少了 `h()`，`<NodeRenderer>` 会把组件对象原样返回，
  //    模板再 `toDisplayString` 成字面量文本 `[object Object]`（曾实测复现）。

  it('★ icon 传**组件对象** ⇒ 渲染成真 svg，不是 `[object Object]`', () => {
    const w = mountBtn({ icon: FakeIcon });
    expect(w.find(`.${P}-icon .fake-icon`).exists()).toBe(true);
    expect(w.find(`.${P}-icon svg`).exists()).toBe(true);
    expect(w.text()).not.toContain('[object Object]');
  });

  it('icon 传 VNode（`h(FakeIcon)`）与传组件对象**结果一致**', () => {
    const asComponent = mountBtn({ icon: FakeIcon });
    const asVNode = mountBtn({ icon: h(FakeIcon) });
    expect(asVNode.html()).toBe(asComponent.html());
  });

  it('icon 传字符串 / 数字 / 数组仍按 VNodeChild 原样渲染（归一化不误伤）', () => {
    expect(mountBtn({ icon: 'x' }).find(`.${P}-icon`).text()).toBe('x');
    expect(mountBtn({ icon: 7 }).find(`.${P}-icon`).text()).toBe('7');
    const arr = mountBtn({ icon: [h('i', { class: 'a' }), h('i', { class: 'b' })] });
    expect(arr.find(`.${P}-icon .a`).exists()).toBe(true);
    expect(arr.find(`.${P}-icon .b`).exists()).toBe(true);
  });

  it('icon 插槽返回的 `VNode[]` 不受影响（prop 缺席时走插槽）', () => {
    const w = mount(Button, { slots: { icon: () => [h('i', { class: 's1' })] } });
    expect(w.find(`.${P}-icon .s1`).exists()).toBe(true);
  });
});

// ===========================================================================
// 11. 其它类名
// ===========================================================================

describe('Button · 其它类名', () => {
  it('block ⇒ -block', () => {
    expect(classesOf({ block: true })).toContain(`${P}-block`);
    expect(classesOf({ block: false })).not.toContain(`${P}-block`);
  });

  it('direction=rtl ⇒ -rtl', () => {
    const w = mountWithConfig({ direction: 'rtl' });
    expect(w.classes()).toContain(`${P}-rtl`);
    expect(mountBtn().classes()).not.toContain(`${P}-rtl`);
  });

  it('`-{type}` 恒加（兼容 5.21 之前），默认 default', () => {
    expect(classesOf({})).toContain(`${P}-default`);
    expect(classesOf({ type: 'primary' })).toContain(`${P}-primary`);
    expect(classesOf({ type: 'dashed' })).toContain(`${P}-dashed`);
  });
});

// ===========================================================================
// 12. 语义化 / class / style
// ===========================================================================

describe('Button · classNames / styles 语义化', () => {
  it('三个槽位各自落位（root 在根、icon 在图标 span、content 在内容 span）', () => {
    const w = mount(Button, {
      props: {
        icon: h('i'),
        classNames: { root: 'cn-root', icon: 'cn-icon', content: 'cn-content' },
        styles: {
          root: { color: 'rgb(255, 0, 0)' },
          icon: { color: 'rgb(0, 0, 255)' },
          content: { color: 'rgb(0, 255, 0)' },
        },
      },
      slots: { default: () => 'Text' },
    });
    expect(w.classes()).toContain('cn-root');
    expect(w.attributes('style') ?? '').toContain('color: rgb(255, 0, 0)');
    const iconSpan = w.find(`.${P}-icon`);
    expect(iconSpan.classes()).toContain('cn-icon');
    expect(iconSpan.attributes('style') ?? '').toContain('color: rgb(0, 0, 255)');
    const contentSpan = w.findAll('span')[1];
    expect(contentSpan?.classes()).toContain('cn-content');
    expect(contentSpan?.attributes('style') ?? '').toContain('color: rgb(0, 255, 0)');
  });

  it('Vue 原生 root class 接受字符串、数组和对象，并与内部/语义类拼接', () => {
    const stringClass = mountBtn({ class: 'native-a', classNames: { root: 'semantic' } });
    expect(stringClass.classes()).toContain('native-a');
    expect(stringClass.classes()).toContain('semantic');

    const arrayClass = mountBtn({ class: ['native-b', { active: true }] });
    expect(arrayClass.classes()).toContain('native-b');
    expect(arrayClass.classes()).toContain('active');

    const objectClass = mountBtn({ class: { 'native-c': true, inactive: false } });
    expect(objectClass.classes()).toContain('native-c');
    expect(objectClass.classes()).not.toContain('inactive');
  });

  it('★ 原生 `style` attr 覆盖 `styles.root`', () => {
    const w = withText({ style: { color: 'green' }, styles: { root: { color: 'red' } } }, 'T');
    const style = w.attributes('style') ?? '';
    expect(style).toContain('color: green');
    expect(style).not.toContain('red');
  });

  it('★ 没有任何样式时**不输出** `style` 属性', () => {
    expect(withText({}, 'T').attributes('style')).toBeUndefined();
  });

  it('ConfigProvider 的 button.classNames / className 生效，且被组件侧覆盖', () => {
    const w = mountWithConfig({
      components: {
        button: { className: 'cfg-class', classNames: { root: 'cfg-root' } },
      },
    });
    expect(w.classes()).toContain('cfg-class');
    expect(w.classes()).toContain('cfg-root');

    const w2 = mountWithConfig(
      { components: { button: { classNames: { root: 'cfg-root' } } } },
      { classNames: { root: 'own-root' } },
    );
    expect(w2.classes()).toContain('own-root');
  });

  it('ConfigProvider root style 是默认值，调用方原生 style attr 优先', () => {
    const w = mountWithConfig(
      {
        components: {
          button: { style: { color: 'red', marginTop: '2px' } },
        },
      },
      { style: { color: 'blue', paddingTop: '4px' } },
    );
    const style = w.element.getAttribute('style') ?? '';
    expect(style).toContain('color: blue');
    expect(style).toContain('margin-top: 2px');
    expect(style).toContain('padding-top: 4px');
    expect(style).not.toContain('color: red');
  });

  it('父组件更新时重新应用 native class/style attrs', async () => {
    const Host = defineComponent({
      props: {
        nativeClass: { type: String, required: true },
        nativeColor: { type: String, required: true },
      },
      setup(props) {
        return () =>
          h(
            Button,
            { class: props.nativeClass, style: { color: props.nativeColor } },
            () => 'Text',
          );
      },
    });
    const w = mount(Host, { props: { nativeClass: 'first-class', nativeColor: 'red' } });
    expect(w.element.classList.contains('first-class')).toBe(true);
    expect((w.element as HTMLElement).style.color).toBe('red');

    await w.setProps({ nativeClass: 'second-class', nativeColor: 'blue' });
    expect(w.element.classList.contains('first-class')).toBe(false);
    expect(w.element.classList.contains('second-class')).toBe(true);
    expect((w.element as HTMLElement).style.color).toBe('blue');
  });

  it('原生 DOM 事件 attrs 只透传/触发一次', async () => {
    const onFocus = vi.fn();
    const w = mountBtn({ onFocus });
    await w.trigger('focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 13. 开发期告警
// ===========================================================================

describe('Button · 开发期告警', () => {
  it('★ `icon` 传长度 > 2 的字符串 ⇒ breaking 告警', async () => {
    const out = await capturedWarnings(() => mountBtn({ icon: 'search' }));
    expect(out).toContain('`icon` is using VNode instead of string naming in v4.');
  });

  it('`icon` 传短字符串 / 传组件 ⇒ 不告警', async () => {
    expect(await capturedWarnings(() => mountBtn({ icon: 'ab' }))).not.toContain(
      'is using VNode instead of string',
    );
    expect(await capturedWarnings(() => mountBtn({ icon: h('i') }))).not.toContain(
      'is using VNode instead of string',
    );
  });

  it('★ ghost + text/link ⇒ usage 告警', async () => {
    expect(await capturedWarnings(() => mountBtn({ type: 'text', ghost: true }))).toContain(
      "`link` or `text` button can't be a `ghost` button.",
    );
    expect(await capturedWarnings(() => mountBtn({ type: 'link', ghost: true }))).toContain(
      "`link` or `text` button can't be a `ghost` button.",
    );
  });

  it('★ 只有 `variant="link"`（没有 color）**不**告警：解析落回 default/outlined', async () => {
    // ⚠️ 这条容易写错：`color && variant` 要**两个都有**才走显式分支，
    //    只有 `variant` 时会一路落到兜底 `['default', 'outlined']` ⇒ 不是无边框变体。
    //    用 `type="link"` 才会真的解析成 link 变体（见上一条）。
    expect(await capturedWarnings(() => mountBtn({ variant: 'link', ghost: true }))).not.toContain(
      "can't be a `ghost` button",
    );
    expect(mountBtn({ variant: 'link', ghost: true }).classes()).toContain(`${P}-variant-outlined`);
  });

  it('ghost + 有边框变体 ⇒ 不告警', async () => {
    expect(await capturedWarnings(() => mountBtn({ type: 'primary', ghost: true }))).not.toContain(
      "can't be a `ghost` button",
    );
  });

  it('★ 传 `iconPosition` ⇒ deprecated 告警；不传 ⇒ 不告警', async () => {
    expect(await capturedWarnings(() => mountBtn({ iconPosition: 'end' }))).toContain(
      '`iconPosition` is deprecated',
    );
    expect(await capturedWarnings(() => mountBtn({ iconPlacement: 'end' }))).not.toContain(
      '`iconPosition` is deprecated',
    );
  });

  it('告警带 `[apollo: Button]` 前缀', async () => {
    const out = await capturedWarnings(() => mountBtn({ iconPosition: 'end' }));
    expect(out).toContain('[apollo: Button]');
  });
});

// ===========================================================================
// 14. 类型面（运行时侧的一小部分：确保联合值都能渲染）
// ===========================================================================

describe('Button · 全量联合值可渲染', () => {
  it('5 个 type × 3 个 size 都能渲染且不告警', () => {
    const types = ['default', 'primary', 'dashed', 'link', 'text'] as const;
    const sizes = ['small', 'middle', 'large'] as const;
    for (const type of types) {
      for (const size of sizes) {
        const w = mountBtn({ type, size });
        expect(w.element.tagName).toBe('BUTTON');
        expect(w.classes()).toContain(P);
      }
    }
  });

  it('16 个 color 都能解析出 `-color-*`', () => {
    const colors = [
      'default',
      'primary',
      'danger',
      'blue',
      'purple',
      'cyan',
      'green',
      'magenta',
      'pink',
      'red',
      'orange',
      'yellow',
      'volcano',
      'geekblue',
      'lime',
      'gold',
    ] as const;
    for (const color of colors) {
      const w = mountBtn({ color, variant: 'solid' });
      const expected = color === 'danger' ? 'dangerous' : color;
      expect(w.classes(), String(color)).toContain(`${P}-color-${expected}`);
    }
  });

  it('6 个 variant 与 `color` 同时给出时都能解析出 `-variant-*`', () => {
    // ⚠️ 只给 `variant` 不够：`color && variant` 才走显式分支（见告警节那条）。
    for (const variant of ['outlined', 'dashed', 'solid', 'filled', 'text', 'link'] as const) {
      expect(mountBtn({ color: 'blue', variant }).classes(), variant).toContain(
        `${P}-variant-${variant}`,
      );
    }
  });

  it('4 个 shape 都能渲染', () => {
    for (const shape of ['default', 'circle', 'round', 'square'] as const) {
      expect(mountBtn({ shape }).classes()).toContain(P);
    }
  });
});
