/**
 * L1/L2 · 单元与交互测试（Switch）
 *
 * 上游测试转断言：`switch/__tests__/index.test.tsx`（antd 6.6.4）+ `@rc-component/switch`
 * 的运行时语义。每条用例的注释标明它来自上游哪一条。
 *
 * ⚠️ L4（DOM 契约）只投影 tag / class / role / aria-* / data-*，
 *    `checked` / `disabled` / 键盘 / 点击语义只能在这里钉。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Switch } from '../index';

afterEach(() => {
  vi.restoreAllMocks();
});

const findButton = (w: ReturnType<typeof mount>) => w.find('button');

/**
 * 派发一个带 `which` 的键盘事件并等待 Vue 的重渲染。
 *
 * ⚠️ 必须 `await nextTick()`：`dispatchEvent` 是同步的，但 `aria-checked` 的更新要等
 *    Vue 的调度器冲刷（用 `trigger()` 时它内部会 await，手写 dispatch 不会）。
 */
const keydown = async (el: Element, which: number) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'which', { value: which });
  el.dispatchEvent(event);
  await nextTick();
};

describe('Switch · 受控 / 非受控', () => {
  // 上游：should be uncontrolled by defaultValue
  it('非受控（defaultChecked）：click ⇒ 变 false + onChange(false, event)', async () => {
    const onChange = vi.fn();
    const w = mount(Switch, { attrs: { onChange }, props: { defaultChecked: true } });

    expect(findButton(w).attributes('aria-checked')).toBe('true');
    await findButton(w).trigger('click');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe(false);
    expect(onChange.mock.calls[0]?.[1]).toBeInstanceOf(Event);
    expect(findButton(w).attributes('aria-checked')).toBe('false');
    expect(w.find('button').classes()).not.toContain('apollo-switch-checked');
  });

  it('非受控（defaultValue 别名）：click 后状态变化', async () => {
    const onChange = vi.fn();
    const w = mount(Switch, { attrs: { onChange }, props: { defaultValue: true } });
    expect(findButton(w).attributes('aria-checked')).toBe('true');
    await findButton(w).trigger('click');
    expect(findButton(w).attributes('aria-checked')).toBe('false');
    expect(onChange.mock.calls[0]?.[0]).toBe(false);
  });

  // 上游：should be controlled by value
  it('受控（value 别名）：click 只发事件，状态由父级决定', async () => {
    const onChange = vi.fn();
    const w = mount(Switch, { attrs: { onChange }, props: { value: true } });

    await findButton(w).trigger('click');

    expect(onChange).toHaveBeenCalledWith(false, expect.anything());
    // 受控 ⇒ 点击后仍然选中
    expect(findButton(w).attributes('aria-checked')).toBe('true');
  });

  it('受控（checked）：父级回传后才变', async () => {
    const checked = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            checked: checked.value,
            onChange: (v: boolean) => {
              checked.value = v;
            },
          });
      },
    });
    const w = mount(App);
    await findButton(w).trigger('click');
    await nextTick();
    expect(findButton(w).attributes('aria-checked')).toBe('true');
    checked.value = false;
    await nextTick();
    expect(findButton(w).attributes('aria-checked')).toBe('false');
  });

  it('无任何 checked 来源 ⇒ 默认 false', () => {
    const w = mount(Switch);
    expect(findButton(w).attributes('aria-checked')).toBe('false');
    expect(w.find('button').classes()).not.toContain('apollo-switch-checked');
  });
});

describe('Switch · disabled 与 loading', () => {
  it('disabled：click 不改状态、不发 onChange', async () => {
    const onChange = vi.fn();
    const w = mount(Switch, { attrs: { onChange }, props: { disabled: true } });
    await findButton(w).trigger('click');
    expect(onChange).not.toHaveBeenCalled();
    expect(findButton(w).attributes('aria-checked')).toBe('false');
    expect(w.find('button').classes()).toContain('apollo-switch-disabled');
  });

  it('loading ⇒ 强制 disabled（`||` 判据）', async () => {
    const onChange = vi.fn();
    const w = mount(Switch, { attrs: { onChange }, props: { loading: true } });
    const button = findButton(w).element as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(w.find('button').classes()).toContain('apollo-switch-loading');
    expect(w.find('button').classes()).toContain('apollo-switch-disabled');
    await findButton(w).trigger('click');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disabled=false 能显式关闭 ConfigProvider 的 componentDisabled', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              ConfigProvider,
              { componentDisabled: true },
              {
                default: () => h(Switch, { disabled: false }),
              },
            );
        },
      }),
    );
    expect((w.find('button').element as HTMLButtonElement).disabled).toBe(false);
  });

  it('未传 disabled ⇒ 听 ConfigProvider', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () => h(ConfigProvider, { componentDisabled: true }, { default: () => h(Switch) });
        },
      }),
    );
    expect((w.find('button').element as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('Switch · 键盘与点击', () => {
  it('ArrowRight ⇒ true、ArrowLeft ⇒ false', async () => {
    const onChange = vi.fn();
    const w = mount(Switch, { attrs: { onChange } });
    const el = findButton(w).element;

    await keydown(el, 39); // KeyCode.RIGHT
    expect(onChange).toHaveBeenLastCalledWith(true, expect.anything());
    expect(findButton(w).attributes('aria-checked')).toBe('true');

    await keydown(el, 37); // KeyCode.LEFT
    expect(onChange).toHaveBeenLastCalledWith(false, expect.anything());
    expect(findButton(w).attributes('aria-checked')).toBe('false');
  });

  it('其它键不触发 onChange', async () => {
    const onChange = vi.fn();
    const w = mount(Switch, { attrs: { onChange } });
    await keydown(findButton(w).element, 13); // Enter
    expect(onChange).not.toHaveBeenCalled();
  });

  it('onKeyDown 照常转发（在内部处理之后）', async () => {
    const onKeyDown = vi.fn();
    const w = mount(Switch, { attrs: { onKeyDown } });
    await keydown(findButton(w).element, 39);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('onClick 收到的是**结果值**（不是原生事件），且 disabled 时仍触发', async () => {
    const onClick = vi.fn();
    const w = mount(Switch, { attrs: { onClick } });
    await findButton(w).trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0]?.[0]).toBe(true);
    expect(onClick.mock.calls[0]?.[1]).toBeInstanceOf(Event);

    // ⚠️ disabled 的 button 由浏览器**抑制** click 的派发，所以要走 `dispatchEvent`
    //    才能观测到「处理器本身是无条件的」这条 rc-switch 语义。
    const onClickDisabled = vi.fn();
    const w2 = mount(Switch, { attrs: { onClick: onClickDisabled }, props: { disabled: true } });
    findButton(w2).element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClickDisabled).toHaveBeenCalledTimes(1);
    expect(onClickDisabled.mock.calls[0]?.[0]).toBe(false);
  });
});

describe('Switch · DOM 与类名', () => {
  it('三层结构恒存在（-handle / -inner-checked / -inner-unchecked）', () => {
    const w = mount(Switch);
    expect(w.find('.apollo-switch-handle').exists()).toBe(true);
    expect(w.find('.apollo-switch-inner').exists()).toBe(true);
    expect(w.find('.apollo-switch-inner-checked').exists()).toBe(true);
    expect(w.find('.apollo-switch-inner-unchecked').exists()).toBe(true);
    // 未 loading 时 handle 里没有图标
    expect(w.find('.apollo-switch-loading-icon').exists()).toBe(false);
  });

  it('loading 时 handle 里出现 loading 图标', () => {
    const w = mount(Switch, { props: { loading: true } });
    const icon = w.find('.apollo-switch-loading-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('apollo-icon');
    expect(icon.attributes('aria-label')).toBe('loading');
  });

  it('size="small" ⇒ -small 类；medium / default 不加', () => {
    expect(
      mount(Switch, { props: { size: 'small' } })
        .find('button')
        .classes(),
    ).toContain('apollo-switch-small');
    expect(
      mount(Switch, { props: { size: 'medium' } })
        .find('button')
        .classes(),
    ).not.toContain('apollo-switch-small');
  });

  it('direction=rtl ⇒ -rtl 类', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () => h(ConfigProvider, { direction: 'rtl' }, { default: () => h(Switch) });
        },
      }),
    );
    expect(w.find('button').classes()).toContain('apollo-switch-rtl');
  });

  it('children：字符串 / 数字（含 0）都渲染到对应槽位', () => {
    const w = mount(Switch, { props: { checkedChildren: 'On', unCheckedChildren: 'Off' } });
    expect(w.find('.apollo-switch-inner-checked').text()).toBe('On');
    expect(w.find('.apollo-switch-inner-unchecked').text()).toBe('Off');

    const w2 = mount(Switch, {
      props: { checked: true },
      slots: { checkedChildren: () => 1, unCheckedChildren: () => 0 },
    });
    expect(w2.find('.apollo-switch-inner-checked').text()).toBe('1');
    expect(w2.find('.apollo-switch-inner-unchecked').text()).toBe('0');
  });

  it('attrs 透传到 button（title / id / tabIndex / autoFocus）', () => {
    const w = mount(Switch, { props: { title: 't', id: 'x', tabIndex: 3, autoFocus: true } });
    const button = findButton(w);
    expect(button.attributes('title')).toBe('t');
    expect(button.attributes('id')).toBe('x');
    expect(button.attributes('tabindex')).toBe('3');
    expect(button.attributes('autofocus')).toBeDefined();
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('role')).toBe('switch');
  });

  it('aria-* / data-* 透传', () => {
    const w = mount(Switch, { attrs: { 'aria-label': 'switch', 'data-x': '1' } });
    expect(findButton(w).attributes('aria-label')).toBe('switch');
    expect(findButton(w).attributes('data-x')).toBe('1');
  });

  it('语义化三槽：root 落 button、content 落两个 inner span、indicator 落 handle', () => {
    const w = mount(Switch, {
      props: {
        checkedChildren: 'On',
        unCheckedChildren: 'Off',
        classNames: {
          root: 'custom-root',
          content: 'custom-content',
          indicator: 'custom-indicator',
        },
        styles: {
          root: { margin: '4px' },
          content: { fontStyle: 'italic' },
          indicator: { top: '1px' },
        },
      },
    });
    expect(findButton(w).classes()).toContain('custom-root');
    expect(findButton(w).attributes('style')).toContain('margin: 4px');
    expect(w.find('.apollo-switch-handle').classes()).toContain('custom-indicator');
    expect(w.find('.apollo-switch-handle').attributes('style')).toContain('top: 1px');
    for (const sel of ['.apollo-switch-inner-checked', '.apollo-switch-inner-unchecked']) {
      expect(w.find(sel).classes()).toContain('custom-content');
      expect(w.find(sel).attributes('style')).toContain('font-style: italic');
    }
  });

  it('函数形态语义化（按合并后的 size 分支）', async () => {
    const size = ref<'small' | 'medium'>('small');
    const App = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            size: size.value,
            styles: ({ props }: { props: { size?: string } }) =>
              props.size === 'small' ? { root: { opacity: '0.5' } } : { root: { opacity: '1' } },
          });
      },
    });
    const w = mount(App);
    expect(findButton(w).attributes('style')).toContain('opacity: 0.5');
    size.value = 'medium';
    await nextTick();
    expect(findButton(w).attributes('style')).toContain('opacity: 1');
  });

  it('静态标记 __ANT_SWITCH', () => {
    expect(Switch.__ANT_SWITCH).toBe(true);
  });

  it('expose：nativeElement / focus / blur', () => {
    const w = mount(Switch);
    const vm = w.vm as unknown as {
      nativeElement: HTMLButtonElement | null;
      focus: () => void;
      blur: () => void;
    };
    expect(vm.nativeElement?.tagName).toBe('BUTTON');
    expect(() => vm.focus()).not.toThrow();
    expect(() => vm.blur()).not.toThrow();
  });
});

describe('Switch · 告警与 v-model', () => {
  it('size="default" ⇒ deprecation 告警（提示改用 medium）', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(Switch, { props: { size: 'default' } });
    await nextTick();
    expect(
      spy.mock.calls.some((call) => String(call[0]).includes('`size="default"` is deprecated')),
    ).toBe(true);
    spy.mockRestore();
  });

  it('v-model:checked 与 onChange 同时发出', async () => {
    const onChange = vi.fn();
    const checked = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            checked: checked.value,
            'onUpdate:checked': (v: boolean) => {
              checked.value = v;
            },
            onChange,
          });
      },
    });
    const w = mount(App);
    await findButton(w).trigger('click');
    await nextTick();
    expect(checked.value).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(findButton(w).attributes('aria-checked')).toBe('true');
  });

  it('v-model:value 与 onChange 同时发出（别名通道）', async () => {
    const onChange = vi.fn();
    const value = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            value: value.value,
            'onUpdate:value': (v: boolean) => {
              value.value = v;
            },
            onChange,
          });
      },
    });
    const w = mount(App);
    await findButton(w).trigger('click');
    await nextTick();
    expect(value.value).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('disabled 时不发 update:checked', async () => {
    const onUpdate = vi.fn();
    const w = mount(Switch, { props: { disabled: true }, attrs: { 'onUpdate:checked': onUpdate } });
    await findButton(w).trigger('click');
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
