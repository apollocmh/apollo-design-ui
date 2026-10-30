import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import { STEP_DELAY, STEP_INTERVAL } from '../engine/StepHandler';
import { InputNumber } from '../index';

afterEach(() => {
  vi.useRealTimers();
});

describe('InputNumber native event contracts', () => {
  it('declares step and pressEnter once through both component layers', async () => {
    const step = vi.fn();
    const stepOnce = vi.fn();
    const pressEnter = vi.fn();
    const pressEnterOnce = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { defaultValue: '1', stringMode: true },
      attrs: {
        onStep: step,
        onStepOnce: stepOnce,
        onPressEnter: pressEnter,
        onPressEnterOnce: pressEnterOnce,
      },
    });
    try {
      const input = wrapper.get('input');
      await input.trigger('keydown', { key: 'ArrowUp' });
      await input.trigger('keydown', { key: 'ArrowUp' });
      await input.trigger('keydown', { key: 'Enter' });
      await input.trigger('keydown', { key: 'Enter' });
      expect(wrapper.emitted('step')).toEqual([
        ['2', { offset: 1, type: 'up', emitter: 'keyboard' }],
        ['3', { offset: 1, type: 'up', emitter: 'keyboard' }],
      ]);
      expect(step).toHaveBeenCalledTimes(2);
      expect(stepOnce).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('pressEnter')).toHaveLength(2);
      expect(pressEnter).toHaveBeenCalledTimes(2);
      expect(pressEnterOnce).toHaveBeenCalledTimes(1);
      expect(pressEnter.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
      expect(input.attributes('onsteponce')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('uses Vue listener arrays for semantic events', async () => {
    const firstStep = vi.fn();
    const secondStep = vi.fn();
    const firstEnter = vi.fn();
    const secondEnter = vi.fn();
    const wrapper = mount(InputNumber, {
      attrs: { onStep: [firstStep, secondStep], onPressEnter: [firstEnter, secondEnter] },
    });
    try {
      await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' });
      await wrapper.get('input').trigger('keydown', { key: 'Enter' });
      expect(firstStep).toHaveBeenCalledTimes(1);
      expect(secondStep).toHaveBeenCalledTimes(1);
      expect(firstEnter).toHaveBeenCalledTimes(1);
      expect(secondEnter).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
    }
  });

  it('routes standard Vue mouse listeners to the container, including arrays and once', async () => {
    const targets: EventTarget[] = [];
    const record = (event: MouseEvent) => {
      if (event.currentTarget) targets.push(event.currentTarget);
    };
    const down = vi.fn(record);
    const secondDown = vi.fn(record);
    const up = vi.fn(record);
    const leave = vi.fn(record);
    const upOnce = vi.fn(record);
    const wrapper = mount(InputNumber, {
      attrs: {
        onMousedown: [down, secondDown],
        onMouseup: up,
        onMouseleave: leave,
        onMouseupOnce: upOnce,
      },
    });
    try {
      const root = wrapper.get('.apollo-input-number');
      await root.trigger('mousedown');
      await root.trigger('mouseup');
      await root.trigger('mouseup');
      await root.trigger('mouseleave');
      expect(down).toHaveBeenCalledTimes(1);
      expect(secondDown).toHaveBeenCalledTimes(1);
      expect(up).toHaveBeenCalledTimes(2);
      expect(upOnce).toHaveBeenCalledTimes(1);
      expect(leave).toHaveBeenCalledTimes(1);
      expect(targets.every((target) => target === root.element)).toBe(true);
    } finally {
      wrapper.unmount();
    }
  });

  it('respects a prevented native keydown and does not step a readonly input', async () => {
    const wrapper = mount(InputNumber, {
      props: { defaultValue: 2 },
      attrs: { onKeydown: (event: KeyboardEvent) => event.preventDefault() },
    });
    try {
      await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' });
      expect(wrapper.emitted('step')).toBeUndefined();
      expect(wrapper.emitted('change')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }

    const readonly = mount(InputNumber, { props: { defaultValue: 2, readOnly: true } });
    try {
      await readonly.get('input').trigger('keydown', { key: 'ArrowUp' });
      expect(readonly.emitted('step')).toBeUndefined();
      expect(readonly.emitted('change')).toBeUndefined();
    } finally {
      readonly.unmount();
    }
  });

  it('does not flush or emit pressEnter during IME composition', async () => {
    const change = vi.fn();
    const enter = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { defaultValue: 1 },
      attrs: { onChange: change, onPressEnter: enter },
    });
    try {
      const input = wrapper.get('input');
      await input.trigger('compositionstart');
      await input.setValue('12');
      await input.trigger('keydown', { key: 'Enter', isComposing: true });
      expect(change).not.toHaveBeenCalled();
      expect(enter).not.toHaveBeenCalled();
      await input.trigger('compositionend');
      expect(change).toHaveBeenCalledExactlyOnceWith(12);
      await input.trigger('keydown', { key: 'Enter' });
      expect(enter).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
    }
  });
});

describe('InputNumber controlled value and display contracts', () => {
  it('treats controlled null as empty even when defaultValue is provided', () => {
    const wrapper = mount(InputNumber, { props: { value: null, defaultValue: 7 } });
    try {
      expect(wrapper.get('input').element.value).toBe('');
      expect(wrapper.get('input').attributes('aria-valuenow')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('retains the last received controlled value after rejecting a proposal and releasing control', async () => {
    const wrapper = mount(InputNumber, { props: { value: 2, defaultValue: 7 } });
    try {
      const input = wrapper.get('input');
      await input.trigger('keydown', { key: 'ArrowUp' });
      expect(wrapper.emitted('update:value')).toEqual([[3]]);
      expect(input.attributes('aria-valuenow')).toBe('2');
      await wrapper.setProps({ value: 5 });
      await input.setValue('9');
      expect(input.attributes('aria-valuenow')).toBe('5');
      await wrapper.setProps({ value: undefined, defaultValue: 11 });
      expect(input.element.value).toBe('5');
      expect(input.attributes('aria-valuenow')).toBe('5');
      await input.trigger('keydown', { key: 'ArrowUp' });
      expect(input.element.value).toBe('6');
      expect(wrapper.emitted('update:value')).toEqual([[3], [9], [6]]);
    } finally {
      wrapper.unmount();
    }
  });

  it('refreshes a changed decimal separator without changing the value', async () => {
    const wrapper = mount(InputNumber, { props: { value: 1.25 } });
    try {
      await wrapper.setProps({ decimalSeparator: ',' });
      expect(wrapper.get('input').element.value).toBe('1,25');
      await wrapper.setProps({ decimalSeparator: undefined });
      expect(wrapper.get('input').element.value).toBe('1.25');
      expect(wrapper.emitted('change')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('restores the caret after the formatter updates the input DOM', async () => {
    const wrapper = mount(InputNumber, {
      props: {
        defaultValue: 123,
        formatter: (value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      },
      attachTo: document.body,
    });
    try {
      const input = wrapper.get('input');
      input.element.focus();
      await nextTick();
      input.element.value = '$ 1243';
      input.element.setSelectionRange(5, 5);
      await input.trigger('input');
      expect(input.element.value).toBe('$ 1,243');
      expect(input.element.selectionStart).toBe(6);
      expect(input.element.selectionEnd).toBe(6);
    } finally {
      wrapper.unmount();
    }
  });
});

describe('InputNumber attrs, Provider and lifecycle', () => {
  it('reacts to replacement and removal of the Provider component variant', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { components: { inputNumber: { variant: 'filled' } }, variant: 'underlined' },
      slots: { default: () => h(InputNumber) },
    });
    try {
      const root = wrapper.get('.apollo-input-number');
      expect(root.classes()).toContain('apollo-input-number-filled');
      await wrapper.setProps({ components: { inputNumber: { variant: 'borderless' } } });
      expect(root.classes()).toContain('apollo-input-number-borderless');
      expect(root.classes()).not.toContain('apollo-input-number-filled');
      await wrapper.setProps({ components: undefined });
      expect(root.classes()).toContain('apollo-input-number-underlined');
    } finally {
      wrapper.unmount();
    }
  });

  it('passes the effective Provider variant to semantic callbacks', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { variant: 'filled' },
      slots: {
        default: () =>
          h(InputNumber, {
            classNames: ({ props }) => ({ root: `effective-${props.variant}` }),
          }),
      },
    });
    try {
      const root = wrapper.get('.apollo-input-number');
      expect(root.classes()).toContain('effective-filled');
      await wrapper.setProps({ variant: 'underlined' });
      expect(root.classes()).toContain('effective-underlined');
      expect(root.classes()).not.toContain('effective-filled');
    } finally {
      wrapper.unmount();
    }
  });

  it('exposes the actual native root and typed focus/blur methods', async () => {
    const wrapper = mount(InputNumber, {
      props: { defaultValue: 123 },
      attachTo: document.body,
    });
    try {
      const input = wrapper.get('input');
      expect(wrapper.vm.nativeElement).toBe(wrapper.get('.apollo-input-number').element);
      wrapper.vm.focus({ cursor: 'all' });
      await nextTick();
      expect(document.activeElement).toBe(input.element);
      expect(input.element.selectionStart).toBe(0);
      expect(input.element.selectionEnd).toBe(3);
      wrapper.vm.blur();
      await nextTick();
      expect(document.activeElement).not.toBe(input.element);
    } finally {
      wrapper.unmount();
    }
  });

  it('updates and removes native root style without resetting the input', async () => {
    const style = ref<unknown>([{ width: '240px' }, 'color: red']);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(InputNumber, {
            style: style.value,
            defaultValue: 2,
            id: 'quantity',
            name: 'quantity',
            'aria-label': 'Quantity',
            'aria-valuenow': '999',
            role: 'textbox',
            tabindex: 3,
          }),
      }),
    );
    try {
      const root = wrapper.get<HTMLDivElement>('.apollo-input-number');
      const input = wrapper.get('input');
      expect(root.element.style.width).toBe('240px');
      expect(root.element.style.color).toBe('red');
      expect(root.attributes('id')).toBeUndefined();
      expect(input.attributes()).toMatchObject({
        id: 'quantity',
        name: 'quantity',
        'aria-label': 'Quantity',
        tabindex: '3',
        role: 'spinbutton',
        'aria-valuenow': '2',
      });
      style.value = { width: '300px' };
      await nextTick();
      expect(root.element.style.width).toBe('300px');
      expect(root.element.style.color).toBe('');
      style.value = undefined;
      await nextTick();
      expect(root.element.style.width).toBe('');
      expect(wrapper.get('input').element).toBe(input.element);
    } finally {
      wrapper.unmount();
    }
  });

  it('uses the current Provider style and semantic config, with native style taking precedence', async () => {
    const wrapper = mount(ConfigProvider, {
      props: {
        components: {
          inputNumber: {
            className: 'provider-first',
            style: { color: 'red', width: '120px' },
            styles: { input: { fontWeight: '700' } },
          },
        },
      },
      slots: { default: () => h(InputNumber, { style: 'width: 200px' }) },
    });
    try {
      const root = wrapper.get<HTMLDivElement>('.apollo-input-number');
      expect(root.classes()).toContain('provider-first');
      expect(root.element.style.color).toBe('red');
      expect(root.element.style.width).toBe('200px');
      expect(wrapper.get('input').element.style.fontWeight).toBe('700');
      await wrapper.setProps({
        components: { inputNumber: { className: 'provider-second', style: { color: 'blue' } } },
      });
      expect(root.classes()).not.toContain('provider-first');
      expect(root.classes()).toContain('provider-second');
      expect(root.element.style.color).toBe('blue');
      expect(wrapper.get('input').element.style.fontWeight).toBe('');
      await wrapper.setProps({ components: undefined });
      expect(root.classes()).not.toContain('provider-second');
      expect(root.element.style.color).toBe('');
    } finally {
      wrapper.unmount();
    }
  });

  it('releases repeating steps on mouseup and when the component is removed', async () => {
    vi.useFakeTimers();
    const step = vi.fn();
    const wrapper = mount(InputNumber, { props: { defaultValue: 0, onStep: step } });
    await wrapper.get('.apollo-input-number-action-up').trigger('mousedown');
    await vi.advanceTimersByTimeAsync(STEP_DELAY + STEP_INTERVAL);
    expect(step).toHaveBeenCalledTimes(3);
    await wrapper.get('.apollo-input-number-action-up').trigger('mouseup');
    await vi.advanceTimersByTimeAsync(STEP_DELAY + STEP_INTERVAL);
    expect(step).toHaveBeenCalledTimes(3);
    await wrapper.get('.apollo-input-number-action-up').trigger('mousedown');
    expect(step).toHaveBeenCalledTimes(4);
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(STEP_DELAY + STEP_INTERVAL);
    expect(step).toHaveBeenCalledTimes(4);
  });

  it('releases the non-passive wheel listener for readonly, disabled, opt-out and unmount', async () => {
    const change = vi.fn();
    const wrapper = mount(InputNumber, {
      props: { defaultValue: 1, changeOnWheel: true, onChange: change },
      attachTo: document.body,
    });
    const input = wrapper.get('input');
    const wheel = () => {
      const event = new WheelEvent('wheel', { deltaY: -1, bubbles: true, cancelable: true });
      input.element.dispatchEvent(event);
      return event;
    };
    try {
      input.element.focus();
      await nextTick();
      expect(wheel().defaultPrevented).toBe(true);
      expect(change).toHaveBeenCalledExactlyOnceWith(2);
      await wrapper.setProps({ readOnly: true });
      expect(wheel().defaultPrevented).toBe(false);
      await wrapper.setProps({ readOnly: false, disabled: true });
      expect(wheel().defaultPrevented).toBe(false);
      await wrapper.setProps({ disabled: false, changeOnWheel: false });
      expect(wheel().defaultPrevented).toBe(false);
      await wrapper.setProps({ changeOnWheel: true });
      wrapper.unmount();
      expect(wheel().defaultPrevented).toBe(false);
      expect(change).toHaveBeenCalledTimes(1);
    } finally {
      if (wrapper.exists()) wrapper.unmount();
    }
  });
});
