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

describe('Input · IME 与计数（registry 备注：不可简化）', () => {
  it('组合态期间不裁剪、组合结束时触发一次 change', async () => {
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
    // 组合态下不裁剪
    expect(onChange).not.toHaveBeenCalled();

    await input.trigger('compositionend');
    expect(onChange).toHaveBeenCalledTimes(1);
    const event = onChange.mock.calls[0]?.[0] as { target: { value: string } };
    expect(event.target.value).toBe('12345');
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
