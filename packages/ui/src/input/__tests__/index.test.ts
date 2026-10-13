/**
 * Input 的 L1 冒烟（G5 进行中）—— 先钉住渲染链路与 DOM 结构。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, nextTick, provide, ref, shallowRef } from 'vue';
import { formItemInputContextKey, useFormItemInputContext } from '../../form/context';
import type { InputStatus } from '../../space/statusUtils';
import { Input, InputGroup, InputPassword, TextArea } from '../index';

describe('Input · L1 渲染', () => {
  it('裸 input：根是 input.{p}', () => {
    const wrapper = mount(Input, { props: { defaultValue: 'abc' } });
    expect(wrapper.find('input').classes()).toContain('apollo-input');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('abc');
  });

  it('prefix ⇒ affix-wrapper + prefix span', () => {
    const wrapper = mount(Input, { props: { prefix: 'P' } });
    expect(wrapper.find('.apollo-input-affix-wrapper').exists()).toBe(true);
    expect(wrapper.find('.apollo-input-prefix').text()).toBe('P');
  });

  it('allowClear ⇒ clear 按钮（有值时可见）', () => {
    const wrapper = mount(Input, { props: { allowClear: true, defaultValue: 'x' } });
    const clear = wrapper.find('.apollo-input-clear-icon');
    expect(clear.exists()).toBe(true);
    expect(clear.attributes('type')).toBe('button');
    expect(clear.classes()).not.toContain('apollo-input-clear-icon-hidden');
  });

  it('addon ⇒ group-wrapper/wrapper/group-addon 三层', () => {
    const wrapper = mount(Input, {
      props: { addonBefore: 'B', addonAfter: 'A' },
    });
    expect(wrapper.find('.apollo-input-group-wrapper').exists()).toBe(true);
    expect(wrapper.find('.apollo-input-group').exists()).toBe(true);
    expect(wrapper.findAll('.apollo-input-group-addon').length).toBe(2);
  });

  it('size ⇒ input 上 -sm/-lg（classNames.input）', () => {
    expect(
      mount(Input, { props: { size: 'small' } })
        .find('input')
        .classes(),
    ).toContain('apollo-input-sm');
    expect(
      mount(Input, { props: { size: 'large' } })
        .find('input')
        .classes(),
    ).toContain('apollo-input-lg');
  });

  it('TextArea：textarea + autoSize 量测不抛错', () => {
    const wrapper = mount(TextArea, { props: { defaultValue: 'hello' } });
    expect(wrapper.find('textarea').exists()).toBe(true);
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('hello');
  });

  it('Password：type=password + 图标 role=button', () => {
    const wrapper = mount(InputPassword, { props: { defaultValue: 'pw' } });
    expect(wrapper.find('input').attributes('type')).toBe('password');
    const icon = wrapper.find('.apollo-input-password-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('role')).toBe('button');
    expect(icon.attributes('aria-pressed')).toBe('false');
  });

  it('Group：转发到 Space.Compact', () => {
    const wrapper = mount(InputGroup, { slots: { default: () => 'x' } });
    expect(wrapper.find('.apollo-space-compact').exists()).toBe(true);
  });
});

describe('Input · 值同步语义（React onChange = 原生 input，§1.12）', () => {
  it('Input 的 v-model:value 在每次击键时同步（不等失焦）', async () => {
    const onUpdate = vi.fn((v: string) => wrapper.setProps({ value: v }));
    const wrapper = mount(Input, { props: { value: '', 'onUpdate:value': onUpdate } });
    const input = wrapper.find('input');
    const el = input.element as HTMLInputElement;

    el.value = 'a';
    await input.trigger('input');
    expect(onUpdate).toHaveBeenCalledWith('a');
    await wrapper.setProps({ value: 'a' });
    expect(el.value).toBe('a');

    el.value = 'ab';
    await input.trigger('input');
    expect(onUpdate).toHaveBeenLastCalledWith('ab');
  });

  it('TextArea 的 v-model:value 在每次击键时同步（不等失焦）', async () => {
    const onUpdate = vi.fn((v: string) => wrapper.setProps({ value: v }));
    const wrapper = mount(TextArea, { props: { value: '', 'onUpdate:value': onUpdate } });
    const textarea = wrapper.find('textarea');
    const el = textarea.element as HTMLTextAreaElement;

    el.value = 'he';
    await textarea.trigger('input');
    expect(onUpdate).toHaveBeenCalledWith('he');
  });

  it('用户自己的 @input 不被内部实现吞掉', async () => {
    const onInput = vi.fn();
    const wrapper = mount(Input, { attrs: { onInput } });
    const el = wrapper.find('input').element as HTMLInputElement;
    el.value = 'x';
    await wrapper.find('input').trigger('input');
    expect(onInput).toHaveBeenCalledTimes(1);
  });
});

describe('Input · IME 与计数（registry 备注：不可简化）', () => {
  // ⚠️ 本用例在修 §1.12 之前断言「组合态期间 onChange **不**触发」——
  // 那条断言编码的是 **Vue 的事件名巧合**（`onChange` 落在原生元素上 = 原生
  // `change`，而本用例派发的是 `input` ⇒ 根本没有 handler 被调用），
  // **不是** React/antd 的语义。判据 `@rc-component/input/es/Input.js`：
  // `React.createElement('input', { onChange: onInternalChange, … })` —— React 的
  // `onChange` 在文本控件上就是**原生 input**，组合态期间照常触发，
  // 只是 `getExceedValue(currentValue, compositionRef.current)` 让裁剪让路。
  it('组合态期间不裁剪（但照常触发 change）、组合结束时裁剪并再触发一次', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Input, {
      props: {
        defaultValue: '',
        maxLength: 5,
        count: { max: 5, exceedFormatter: (v: string) => v.slice(0, 5) },
        onChange,
      },
    });
    const input = wrapper.find('input');
    const el = input.element as HTMLInputElement;

    // 组合输入中：写入 8 个字符（超过 max=5）
    await input.trigger('compositionstart');
    el.value = '12345678';
    await input.trigger('input');
    // React 语义：组合中的每次 input 都会触发 onChange，且**不裁剪**
    expect(onChange).toHaveBeenCalledTimes(1);
    const composingEvent = onChange.mock.calls[0]?.[0] as { target: { value: string } };
    expect(composingEvent.target.value).toBe('12345678');

    await input.trigger('compositionend');
    // compositionend：裁剪到 5 并再触发一次（currentValue !== cutValue ⇒ 不去重）
    expect(onChange).toHaveBeenCalledTimes(2);
    const endEvent = onChange.mock.calls[1]?.[0] as { target: { value: string } };
    expect(endEvent.target.value).toBe('12345');
  });

  it('Enter 的 IME 保护：isComposing 时不触发 onPressEnter', () => {
    const onPressEnter = vi.fn();
    const wrapper = mount(Input, { props: { onPressEnter } });
    const el = wrapper.find('input').element as HTMLInputElement;
    const composing = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(composing, 'isComposing', { value: true });
    el.dispatchEvent(composing);
    expect(onPressEnter).not.toHaveBeenCalled();
  });

  it('清空：值置空 + change 的 target.value 是空串', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Input, { props: { defaultValue: 'abc', allowClear: true, onChange } });
    await wrapper.find('.apollo-input-clear-icon').trigger('click');
    expect(onChange).toHaveBeenCalledTimes(1);
    const event = onChange.mock.calls[0]?.[0] as { target: { value: string } };
    expect(event.target.value).toBe('');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });

  it('showCount 渲染计数节点', () => {
    const wrapper = mount(Input, {
      props: { defaultValue: 'abc', showCount: true, maxLength: 10 },
    });
    expect(wrapper.find('.apollo-input-show-count-suffix').text()).toBe('3 / 10');
  });
});

// ===========================================================================
// Issue #3 · 响应性与 API 契约
// ===========================================================================

describe('Input · allowClear / clearIcon 的运行时更新（Issue #3.1）', () => {
  it('★ Input：allowClear false → true → false 即时生效', async () => {
    const allowClear = ref(false);
    const Host = defineComponent({
      name: 'AAllowClearHost',
      setup: () => () => h(Input, { allowClear: allowClear.value, defaultValue: 'x' }),
    });
    const w = mount(Host);
    await nextTick();
    expect(w.find('.apollo-input-clear-icon').exists()).toBe(false);

    allowClear.value = true;
    await nextTick();
    expect(w.find('.apollo-input-clear-icon').exists()).toBe(true);

    allowClear.value = false;
    await nextTick();
    expect(w.find('.apollo-input-clear-icon').exists()).toBe(false);
  });

  it('★ Input：`allowClear.clearIcon` 换成另一个节点 ⇒ DOM 跟着换', async () => {
    // ⚠️ `VNodeChild` 是递归类型 ⇒ `ref<T>` 的深展开会 TS2589（PITFALLS 86），用 shallowRef
    const icon = shallowRef(h('i', { class: 'ic-1' }));
    const Host = defineComponent({
      name: 'AClearIconHost',
      setup: () => () => h(Input, { allowClear: { clearIcon: icon.value }, defaultValue: 'x' }),
    });
    const w = mount(Host);
    await nextTick();
    expect(w.find('.apollo-input-clear-icon .ic-1').exists()).toBe(true);

    icon.value = h('i', { class: 'ic-2' });
    await nextTick();
    expect(w.find('.apollo-input-clear-icon .ic-2').exists()).toBe(true);
    expect(w.find('.apollo-input-clear-icon .ic-1').exists()).toBe(false);
  });

  it('★ TextArea：同一条路径（allowClear 动态开关）', async () => {
    const allowClear = ref(false);
    const Host = defineComponent({
      name: 'ATextAreaAllowClearHost',
      setup: () => () => h(TextArea, { allowClear: allowClear.value, defaultValue: 'x' }),
    });
    const w = mount(Host);
    await nextTick();
    expect(w.find('.apollo-input-clear-icon').exists()).toBe(false);
    allowClear.value = true;
    await nextTick();
    expect(w.find('.apollo-input-clear-icon').exists()).toBe(true);
  });

  it('清空仍然可用（动态打开之后）', async () => {
    const allowClear = ref(true);
    const onChange = vi.fn();
    const Host = defineComponent({
      name: 'AClearEventHost',
      setup: () => () => h(Input, { allowClear: allowClear.value, defaultValue: 'abc', onChange }),
    });
    const w = mount(Host);
    await nextTick();
    await w.find('.apollo-input-clear-icon').trigger('click');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((w.find('input').element as HTMLInputElement).value).toBe('');
  });
});

describe('Input · 函数式 classNames / styles 拿到当前 props（Issue #3.2）', () => {
  it('★ 函数式 `classNames` 随 `disabled` 变化重算', async () => {
    const disabled = ref(false);
    const Host = defineComponent({
      name: 'AFnClassNamesHost',
      setup: () => () =>
        h(Input, {
          disabled: disabled.value,
          classNames: (info: { props: { disabled?: boolean } }) => ({
            root: info.props.disabled ? 'is-disabled' : 'is-enabled',
          }),
        } as never),
    });
    const w = mount(Host);
    await nextTick();
    expect(w.find('input').classes()).toContain('is-enabled');

    disabled.value = true;
    await nextTick();
    expect(w.find('input').classes()).toContain('is-disabled');
    expect(w.find('input').classes()).not.toContain('is-enabled');
  });

  it('★ 函数式 `styles` 随 `variant` 变化重算', async () => {
    const variant = ref<'outlined' | 'filled'>('outlined');
    const Host = defineComponent({
      name: 'AFnStylesHost',
      setup: () => () =>
        h(Input, {
          variant: variant.value,
          styles: (info: { props: { variant?: string } }) => ({
            root: { color: info.props.variant === 'filled' ? 'red' : 'blue' },
          }),
        } as never),
    });
    const w = mount(Host);
    await nextTick();
    expect((w.find('input').element as HTMLInputElement).style.color).toBe('blue');

    variant.value = 'filled';
    await nextTick();
    expect((w.find('input').element as HTMLInputElement).style.color).toBe('red');
  });

  it('★ TextArea / Password 同判（函数式 classNames 跟随 disabled）', async () => {
    const disabled = ref(false);
    const mk = (component: unknown) => {
      const Host = defineComponent({
        name: 'AFnSemanticHost',
        setup: () => () =>
          h(component as never, {
            disabled: disabled.value,
            classNames: (info: { props: { disabled?: boolean } }) => ({
              root: info.props.disabled ? 'is-disabled' : 'is-enabled',
            }),
          }),
      });
      return mount(Host);
    };

    for (const component of [TextArea, InputPassword]) {
      disabled.value = false;
      const w = mk(component);
      await nextTick();
      // ⚠️ 只断言「类名出现在产物里」而不是绑某个具体元素：TextArea 的
      //    `classNames.root` 落在引擎的外层包裹节点上，Password 落在内层 input 上，
      //    本用例要证明的是**函数式拿到的是当前 props**，不是类名落点。
      expect(w.html()).toContain('is-enabled');
      expect(w.html()).not.toContain('is-disabled');

      disabled.value = true;
      await nextTick();
      expect(w.html()).toContain('is-disabled');
      expect(w.html()).not.toContain('is-enabled');
      w.unmount();
    }
  });
});

describe('Input.Password · 顶层 `action`（Issue #3.3）', () => {
  const iconOf = (w: ReturnType<typeof mount>) => w.find('.apollo-input-password-icon');
  const typeOf = (w: ReturnType<typeof mount>) => w.find('input').attributes('type');

  it('★ 默认 `click`：点击切换显隐', async () => {
    const w = mount(InputPassword, { props: { defaultValue: 'pw' } });
    expect(typeOf(w)).toBe('password');
    await iconOf(w).trigger('click');
    expect(typeOf(w)).toBe('text');
  });

  it('★ 顶层 `action="hover"`：mouseover 切换、click **不**切换', async () => {
    const w = mount(InputPassword, { props: { action: 'hover', defaultValue: 'pw' } });
    expect(typeOf(w)).toBe('password');

    await iconOf(w).trigger('click');
    expect(typeOf(w), 'hover 模式下 click 不应切换').toBe('password');

    await iconOf(w).trigger('mouseover');
    expect(typeOf(w)).toBe('text');
    await iconOf(w).trigger('mouseover');
    expect(typeOf(w)).toBe('password');
  });

  it('本仓扩展 `visibilityToggle.action` 仍然生效', async () => {
    const w = mount(InputPassword, {
      props: { visibilityToggle: { action: 'hover' }, defaultValue: 'pw' },
    });
    await iconOf(w).trigger('click');
    expect(typeOf(w)).toBe('password');
    await iconOf(w).trigger('mouseover');
    expect(typeOf(w)).toBe('text');
  });

  it('★ 两者同时给出时**顶层 `action` 优先**', async () => {
    const w = mount(InputPassword, {
      props: { action: 'click', visibilityToggle: { action: 'hover' }, defaultValue: 'pw' },
    });
    await iconOf(w).trigger('mouseover');
    expect(typeOf(w), '顶层 click 应压过 visibilityToggle.action=hover').toBe('password');
    await iconOf(w).trigger('click');
    expect(typeOf(w)).toBe('text');
  });

  it('disabled 时两种模式都不切换（受控判据在最前）', async () => {
    const hover = mount(InputPassword, {
      props: { action: 'hover', disabled: true, defaultValue: 'pw' },
    });
    await iconOf(hover).trigger('mouseover');
    expect(typeOf(hover)).toBe('password');
    const click = mount(InputPassword, {
      props: { action: 'click', disabled: true, defaultValue: 'pw' },
    });
    await iconOf(click).trigger('click');
    expect(typeOf(click)).toBe('password');
  });
});

describe('Input.Group · Form.Item 上下文是**响应式**的（Issue #3.5）', () => {
  const Probe = defineComponent({
    name: 'AGroupContextProbe',
    setup() {
      const ctx = useFormItemInputContext();
      return () =>
        h('i', {
          class: [
            'probe',
            `probe-status-${String(ctx.value.status)}`,
            `probe-is-form-item-${String(ctx.value.isFormItemInput)}`,
          ],
        });
    },
  });

  it('★ 父级 status 变化能传导；且 group 内 `isFormItemInput` 恒为 false', async () => {
    const status = ref<InputStatus>('error');
    const Host = defineComponent({
      name: 'AGroupContextHost',
      setup() {
        provide(
          formItemInputContextKey,
          computed(() => ({ status: status.value, hasFeedback: true, isFormItemInput: true })),
        );
        return () => h(InputGroup, null, { default: () => h(Probe) });
      },
    });
    const w = mount(Host);
    await nextTick();
    const probe = () => w.find('.probe');
    expect(probe().classes()).toContain('probe-status-error');
    // group 的降级判据：不能是 true
    expect(probe().classes()).toContain('probe-is-form-item-false');

    status.value = 'success';
    await nextTick();
    expect(probe().classes()).toContain('probe-status-success');
    expect(probe().classes()).not.toContain('probe-status-error');
    // 降级不因更新而丢失
    expect(probe().classes()).toContain('probe-is-form-item-false');
  });

  it('★ group 内的真实 Input 会吃到最新的 status 类名', async () => {
    const status = ref<InputStatus>('error');
    const Host = defineComponent({
      name: 'AGroupStatusHost',
      setup() {
        provide(
          formItemInputContextKey,
          computed(() => ({ status: status.value, isFormItemInput: true })),
        );
        return () =>
          h(InputGroup, null, { default: () => h(Input, { prefixCls: 'apollo-input' }) });
      },
    });
    const w = mount(Host);
    await nextTick();
    expect(w.find('input').classes()).toContain('apollo-input-status-error');

    status.value = 'warning';
    await nextTick();
    expect(w.find('input').classes()).toContain('apollo-input-status-warning');
    expect(w.find('input').classes()).not.toContain('apollo-input-status-error');
  });
});
