/**
 * InputNumber 的 L1 单元测试（G5）。
 *
 * 行为判据来自 antd 仓库测试（components/input-number/__tests__）+ rc 引擎规格
 * （docs/analysis/input-number.md §2）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { InputNumber } from '../index';

describe('InputNumber · L1 基础渲染', () => {
  it('默认渲染：根类名 + role=spinbutton + 非受控初值', () => {
    const wrapper = mount(InputNumber, {
      props: { defaultValue: 3 },
    });
    expect(wrapper.find('.apollo-input-number').exists()).toBe(true);
    expect(wrapper.find('input').attributes('role')).toBe('spinbutton');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('3');
    expect(wrapper.find('.apollo-input-number-actions').exists()).toBe(true);
  });

  it('controls=false ⇒ 无 actions 且根有 -without-controls', () => {
    const wrapper = mount(InputNumber, { props: { controls: false } });
    expect(wrapper.find('.apollo-input-number-actions').exists()).toBe(false);
    expect(wrapper.find('.apollo-input-number-without-controls').exists()).toBe(true);
  });

  it('disabled ⇒ -disabled 且不渲染 actions（antd mergedControls 判据）', () => {
    const wrapper = mount(InputNumber, { props: { disabled: true } });
    expect(wrapper.find('.apollo-input-number-disabled').exists()).toBe(true);
    expect(wrapper.find('.apollo-input-number-actions').exists()).toBe(false);
  });

  it('mode=spinner ⇒ down 在前 up 在后、无 actions 容器', () => {
    const wrapper = mount(InputNumber, { props: { mode: 'spinner', defaultValue: 1 } });
    expect(wrapper.find('.apollo-input-number-actions').exists()).toBe(false);
    const spans = wrapper.findAll('.apollo-input-number-action');
    expect(spans.length).toBe(2);
    expect(spans[0]?.classes()).toContain('apollo-input-number-action-down');
    expect(spans[1]?.classes()).toContain('apollo-input-number-action-up');
  });

  it('prefix / suffix 节点渲染', () => {
    const wrapper = mount(InputNumber, {
      props: { prefix: '$', suffix: 'kg', defaultValue: 1 },
    });
    expect(wrapper.find('.apollo-input-number-prefix').text()).toBe('$');
    expect(wrapper.find('.apollo-input-number-suffix').text()).toBe('kg');
  });

  it('aria-valuenow 受控同步；aria-valuemax/min 原样透传', async () => {
    const wrapper = mount(InputNumber, {
      props: { value: 5, min: 1, max: 10 },
    });
    const input = wrapper.find('input');
    expect(input.attributes('aria-valuenow')).toBe('5');
    expect(input.attributes('aria-valuemin')).toBe('1');
    expect(input.attributes('aria-valuemax')).toBe('10');
  });
});

describe('InputNumber · L1 值逻辑', () => {
  it('空输入 blur ⇒ change(null)（上游 issue 13896）', async () => {
    const onChange = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { defaultValue: '1', onChange },
    });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = '';
    await input.trigger('input');
    await input.trigger('focusout');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('受控超界不回弹但标 -out-of-range（antd index.test 同款）', async () => {
    const onChange = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { min: 1, max: 10, value: 1, onChange, 'onUpdate:value': onChange },
    });
    await wrapper.setProps({ value: 99 });
    expect(wrapper.find('.apollo-input-number-out-of-range').exists()).toBe(true);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('99');
  });

  it('键入 1. 不被立即格式化成 1（userTyping 闸门）', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 1 } });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = '1.';
    await input.trigger('input');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1.');
  });

  it('precision 格式化在 blur 时生效', async () => {
    const wrapper = mount(InputNumber, {
      props: { defaultValue: '1.234', precision: 2 },
    });
    const input = wrapper.find('input');
    await input.trigger('focusout');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1.23');
  });

  it('min/max 钳制：blur 时超界值回正并触发 change', async () => {
    const onChange = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { defaultValue: 8, min: 1, max: 5, onChange },
    });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = '99';
    await input.trigger('input');
    // 真实语义：input blur ⇒ focusout 冒泡到根（React onBlur 同为 focusout 合成）
    await input.trigger('focusout');
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('stringMode ⇒ change 返回字符串', async () => {
    const onChange = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { defaultValue: '1', stringMode: true, onChange },
    });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = '2';
    await input.trigger('input');
    expect(onChange).toHaveBeenLastCalledWith('2');
  });

  it('v-model:value 双通道：update:value 与 onChange 同时发（C11）', async () => {
    const onChange = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { defaultValue: 1, onChange, 'onUpdate:value': vi.fn() },
    });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = '3';
    await input.trigger('input');
    expect(onChange).toHaveBeenLastCalledWith(3);
  });
});

describe('InputNumber · L1 步进', () => {
  it('onStep：mousedown up/down（emitter=handler）', async () => {
    const onStep = vi.fn();
    const wrapper = mount(InputNumber, { props: { defaultValue: 1, onStep } });
    await wrapper.find('.apollo-input-number-action-up').trigger('mousedown');
    expect(onStep).toHaveBeenLastCalledWith(2, { emitter: 'handler', offset: 1, type: 'up' });
    await wrapper.find('.apollo-input-number-action-down').trigger('mousedown');
    expect(onStep).toHaveBeenLastCalledWith(1, { emitter: 'handler', offset: 1, type: 'down' });
  });

  it('键盘 ArrowUp 步进（emitter=keyboard）并 preventDefault', () => {
    const onStep = vi.fn();
    const wrapper = mount(InputNumber, { props: { defaultValue: 1, onStep } });
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
    wrapper.find('input').element.dispatchEvent(event);
    expect(onStep).toHaveBeenLastCalledWith(2, { emitter: 'keyboard', offset: 1, type: 'up' });
    expect(event.defaultPrevented).toBe(true);
  });

  it('keyboard=false 关闭键盘步进', () => {
    const onStep = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { defaultValue: 1, onStep, keyboard: false },
    });
    wrapper
      .find('input')
      .element.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
      );
    expect(onStep).not.toHaveBeenCalled();
  });

  it('shift + 步进 = ×10（getDecupleSteps）', () => {
    const onStep = vi.fn();
    const wrapper = mount(InputNumber, { props: { defaultValue: 1, onStep } });
    wrapper.find('input').element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    // ⚠️ rc 的 offset 就是 getDecupleSteps 的返回值 —— step=1 时是**字符串** '10'
    expect(onStep).toHaveBeenLastCalledWith(11, { emitter: 'keyboard', offset: '10', type: 'up' });
  });

  it('min 边界：down 在边界时不步进', async () => {
    const onStep = vi.fn();
    const wrapper = mount(InputNumber, { props: { defaultValue: 1, min: 1, onStep } });
    await wrapper.find('.apollo-input-number-action-down').trigger('mousedown');
    expect(onStep).not.toHaveBeenCalled();
  });
});

describe('InputNumber · deprecated', () => {
  it('bordered / addonBefore / addonAfter 告警', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(InputNumber, { props: { bordered: false, addonBefore: 'x', addonAfter: 'y' } });
    expect(errorSpy).toHaveBeenCalledTimes(3);
    expect(errorSpy.mock.calls[0]?.[0]).toContain('`bordered` is deprecated');
    errorSpy.mockRestore();
  });
});
