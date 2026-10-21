/**
 * Input.Search / Input.OTP 的 L1+L2 回归（2026-10-21 补齐）。
 *
 * 钉住上游最容易漏的行为：
 *  - Search：Enter 触发 `onSearch(value, e, { source: 'input' })`；按钮点击同样触发；
 *    `loading` 时 Enter 被拦截；`enterButton` 文本 / `-with-button` 类名。
 *  - OTP：分格渲染、输入推进、全填满才 `onChange`、`onInput` 数组、mask/separator/
 *    formatter、方向键移动焦点、受控 `value`。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { InputOTP, InputSearch } from '../index';

describe('Input.Search · 渲染与搜索', () => {
  it('根是 Compact + input type=search + 默认搜索按钮', () => {
    const wrapper = mount(InputSearch);
    expect(wrapper.find('.apollo-input-search').exists()).toBe(true);
    expect(wrapper.find('input').attributes('type')).toBe('search');
    expect(wrapper.find('.apollo-input-search-btn').exists()).toBe(true);
    expect(wrapper.find('.apollo-input-search-with-button').exists()).toBe(false);
  });

  it('Enter 触发 onSearch(value, event, { source: "input" })', async () => {
    const onSearch = vi.fn();
    const wrapper = mount(InputSearch, { props: { onSearch } });
    const input = wrapper.find('input');
    await input.setValue('hello');
    await input.trigger('keydown', { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0]![0]).toBe('hello');
    expect(onSearch.mock.calls[0]![2]).toEqual({ source: 'input' });
  });

  it('loading 时 Enter 不触发 onSearch', async () => {
    const onSearch = vi.fn();
    const wrapper = mount(InputSearch, { props: { loading: true, onSearch } });
    const input = wrapper.find('input');
    await input.setValue('hello');
    await input.trigger('keydown', { key: 'Enter' });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('点击搜索按钮触发 onSearch；enterButton 文本渲染为按钮内容', async () => {
    const onSearch = vi.fn();
    const wrapper = mount(InputSearch, { props: { enterButton: 'Go', onSearch } });
    expect(wrapper.find('.apollo-input-search-with-button').exists()).toBe(true);
    const btn = wrapper.find('.apollo-input-search-btn');
    expect(btn.text()).toContain('Go');
    await wrapper.find('input').setValue('abc');
    await btn.trigger('click');
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0]![0]).toBe('abc');
  });

  it('清空按钮触发 onSearch(value, event, { source: "clear" })', async () => {
    const onSearch = vi.fn();
    const wrapper = mount(InputSearch, {
      props: { allowClear: true, defaultValue: 'abc', onSearch },
    });
    await wrapper.find('.apollo-input-clear-icon').trigger('click');
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0]![0]).toBe('');
    expect(onSearch.mock.calls[0]![2]).toEqual({ source: 'clear' });
  });

  it('v-model:value 在击键时同步（Search 转发 Input 的值）', async () => {
    const value = ref('');
    const wrapper = mount(InputSearch, {
      props: {
        value: value.value,
        'onUpdate:value': (next: string) => {
          value.value = next;
          void wrapper.setProps({ value: next });
        },
      },
    });
    await wrapper.find('input').setValue('v-model');
    expect(value.value).toBe('v-model');
  });

  it('classNames / styles 的 root 与 button 语义槽生效', () => {
    const wrapper = mount(InputSearch, {
      props: {
        classNames: { root: 'search-root', button: { root: 'search-btn' } },
        styles: { root: { marginTop: '3px' }, button: { root: { color: 'red' } } },
      },
    });
    expect(wrapper.find('.apollo-input-search').classes()).toContain('search-root');
    expect(wrapper.find('.apollo-input-search-btn').classes()).toContain('search-btn');
    expect((wrapper.find('.apollo-input-search').element as HTMLElement).style.marginTop).toBe(
      '3px',
    );
  });
});

describe('Input.OTP · 分格、输入与键盘', () => {
  it('按 length 渲染输入格，受控 value 落到各格', () => {
    const wrapper = mount(InputOTP, { props: { value: '12' } });
    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(6);
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('1');
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('2');
    expect((inputs[2]!.element as HTMLInputElement).value).toBe('');
    expect(wrapper.find('.apollo-otp').attributes('role')).toBe('group');
  });

  it('输入推进到下一格；全填满时才触发 onChange 与 update:value', async () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    const wrapper = mount(InputOTP, {
      props: { defaultValue: '12345', onInput, onChange, 'onUpdate:value': onUpdate },
    });
    const inputs = wrapper.findAll('input');
    await inputs[5]!.setValue('6');
    expect(onInput).toHaveBeenCalled();
    expect(onInput.mock.calls.at(-1)?.[0]).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(onChange).toHaveBeenCalledWith('123456');
    expect(onUpdate).toHaveBeenCalledWith('123456');
  });

  it('未填满时不触发 onChange', async () => {
    const onChange = vi.fn();
    const wrapper = mount(InputOTP, { props: { defaultValue: '12', onChange } });
    await wrapper.findAll('input')[2]!.setValue('3');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('mask / separator / formatter 按上游语义渲染', () => {
    const wrapper = mount(InputOTP, {
      props: {
        defaultValue: 'ab',
        mask: true,
        separator: '-',
        formatter: (v: string) => v.toUpperCase(),
      },
    });
    const inputs = wrapper.findAll('input');
    expect(inputs[0]!.attributes('type')).toBe('password');
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('A');
    expect(wrapper.findAll('.apollo-otp-mask-icon').length).toBe(2);
    expect(wrapper.findAll('.apollo-otp-separator').length).toBe(5);
  });

  it('方向键左右移动焦点', async () => {
    const wrapper = mount(InputOTP, { props: { defaultValue: '12' }, attachTo: document.body });
    const inputs = wrapper.findAll('input');
    (inputs[0]!.element as HTMLInputElement).focus();
    await inputs[0]!.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(inputs[1]!.element);
    await inputs[1]!.trigger('keydown', { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(inputs[0]!.element);
    wrapper.unmount();
  });

  it('classNames / styles 的 root / input / separator 语义槽生效', () => {
    const wrapper = mount(InputOTP, {
      props: {
        separator: '-',
        classNames: { root: 'otp-root', input: 'otp-cell', separator: 'otp-sep' },
        styles: { root: { marginTop: '4px' }, input: { color: 'red' } },
      },
    });
    expect(wrapper.find('.apollo-otp').classes()).toContain('otp-root');
    expect(wrapper.findAll('input')[0]!.classes()).toContain('otp-cell');
    expect(wrapper.find('.apollo-otp-separator').classes()).toContain('otp-sep');
    expect((wrapper.find('.apollo-otp').element as HTMLElement).style.marginTop).toBe('4px');
  });
});
