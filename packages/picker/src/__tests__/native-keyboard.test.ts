import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { dayjsGenerateConfig } from '../generate/dayjs';
import { PickerPanel } from '../picker-panel';

const value = dayjs('2026-10-20');
const locale = { locale: 'en_US' };

describe('PickerPanel native focus and keyboard', () => {
  it('moves dates across the rendered page and selects only on Enter', async () => {
    const wrapper = mount(PickerPanel, {
      props: {
        locale,
        generateConfig: dayjsGenerateConfig,
        defaultPickerValue: value,
        disabledDate: (date) => date.date() === 21,
      },
      attachTo: document.body,
    });
    wrapper.vm.focus(value);
    expect(document.activeElement?.getAttribute('title')).toBe('2026-10-20');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(document.activeElement?.getAttribute('title')).toBe('2026-10-22');
    expect(wrapper.emitted('select')).toBeUndefined();
    wrapper.vm.focus(dayjs('2026-11-07'));
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    await nextTick();
    await nextTick();
    expect(document.activeElement?.getAttribute('title')).toBe('2026-11-14');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(wrapper.emitted('select')).toHaveLength(1);
    wrapper.unmount();
  });

  it.each(['month', 'quarter', 'year'] as const)(
    'focuses %s cells and follows native mode drilldown',
    async (picker) => {
      const wrapper = mount(PickerPanel, {
        props: { locale, generateConfig: dayjsGenerateConfig, picker, defaultPickerValue: value },
        attachTo: document.body,
      });
      wrapper.vm.focus();
      expect(document.activeElement?.tagName).toBe('TD');
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
      await nextTick();
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
      );
      expect(wrapper.emitted('select')).toHaveLength(1);
      wrapper.unmount();
    },
  );

  it('uses current RTL direction and moves focus off newly disabled time units', async () => {
    const wrapper = mount(PickerPanel, {
      props: {
        locale,
        generateConfig: dayjsGenerateConfig,
        direction: 'rtl',
        defaultPickerValue: value,
      },
      attachTo: document.body,
    });
    wrapper.vm.focus();
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(document.activeElement?.getAttribute('title')).toBe('2026-10-19');
    await wrapper.setProps({ picker: 'time', value: [value.hour(10)], disabledHours: () => [10] });
    wrapper.vm.focus();
    expect(document.activeElement?.getAttribute('data-value')).toBe('0');
    await wrapper.setProps({ disabledHours: () => [0, 10] });
    expect(document.activeElement?.getAttribute('data-value')).toBe('1');
    wrapper.unmount();
  });
});
