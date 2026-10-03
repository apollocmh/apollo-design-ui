/**
 * Input 的 L1 冒烟（G5 进行中）—— 先钉住渲染链路与 DOM 结构。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
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
