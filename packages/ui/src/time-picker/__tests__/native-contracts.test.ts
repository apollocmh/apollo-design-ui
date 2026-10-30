import type { TimePickerLocale } from '@apollo-design/locale';
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import DateRangePicker from '../../date-picker/RangePicker.vue';
import type { TimePickerSlots } from '../interface';
import TimePicker from '../TimePicker.vue';
import TimeRangePicker from '../TimeRangePicker.vue';

const value = dayjs('2026-10-20 10:15:20');

describe('TimePicker current wrapper contracts', () => {
  it('merges the current timePicker semantic configuration once', async () => {
    const name = ref('current');
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: {
              timePicker: {
                classNames: { root: name.value, popup: { root: `${name.value}-popup` } },
              },
            },
          },
          () => h(TimePicker, { open: true }),
        ),
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    expect(
      wrapper
        .get('.apollo-picker')
        .classes()
        .filter((item) => item === 'current'),
    ).toHaveLength(1);
    expect(
      document
        .querySelector('.apollo-picker-dropdown')
        ?.className.split(' ')
        .filter((item) => item === 'current-popup'),
    ).toHaveLength(1);
    name.value = 'next';
    await nextTick();
    expect(wrapper.get('.apollo-picker').classes()).not.toContain('current');
    expect(document.querySelector('.apollo-picker-dropdown')?.className).toContain('next-popup');
    wrapper.unmount();
  });

  it('keeps TimeRangePicker configuration independent of date and range picker defaults', async () => {
    const name = ref('time');
    const variant = ref<'filled' | 'underlined'>('filled');
    const enabled = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: {
              timePicker: enabled.value
                ? {
                    className: `${name.value}-root`,
                    style: { width: '400px' },
                    variant: variant.value,
                    separator: 'TIME',
                    suffixIcon: 'T',
                  }
                : {},
              datePicker: { className: 'date-root', separator: 'DATE', suffixIcon: 'D' },
              rangePicker: {
                className: 'range-root',
                style: { width: '600px' },
                variant: 'borderless',
                separator: 'RANGE',
              },
            },
          },
          () => h(TimeRangePicker, { defaultValue: [value, value.hour(12)] }),
        ),
    });
    const wrapper = mount(Host);
    const root = wrapper.get<HTMLElement>('.apollo-picker');
    expect(root.classes()).toContain('time-root');
    expect(root.classes()).not.toContain('range-root');
    expect(root.classes()).not.toContain('date-root');
    expect(root.classes()).toContain('apollo-picker-filled');
    expect(root.element.style.width).toBe('400px');
    expect(wrapper.get('.apollo-picker-separator').text()).toBe('TIME');
    name.value = 'next';
    variant.value = 'underlined';
    await nextTick();
    expect(root.classes()).toContain('next-root');
    expect(root.classes()).toContain('apollo-picker-underlined');
    enabled.value = false;
    await nextTick();
    expect(root.classes()).not.toContain('next-root');
    expect(root.classes()).not.toContain('range-root');
    expect(root.classes()).toContain('apollo-picker-outlined');
    expect(root.element.style.width).toBe('');
    expect(wrapper.get('.apollo-picker-separator').text()).not.toBe('RANGE');
    wrapper.unmount();
  });

  it('preserves ordinary DateRangePicker ownership when time configuration changes or is withdrawn', async () => {
    const enabled = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: {
              timePicker: enabled.value
                ? { className: 'time-root', variant: 'filled', separator: 'TIME' }
                : {},
              rangePicker: {
                className: 'date-range-root',
                style: { width: '600px' },
                variant: 'underlined',
                separator: 'DATE RANGE',
              },
            },
          },
          () => h(DateRangePicker, { defaultValue: [value, value.hour(12)] }),
        ),
    });
    const wrapper = mount(Host);
    const root = wrapper.get<HTMLElement>('.apollo-picker');
    expect(root.classes()).toContain('date-range-root');
    expect(root.classes()).toContain('apollo-picker-underlined');
    expect(root.element.style.width).toBe('600px');
    expect(wrapper.get('.apollo-picker-separator').text()).toBe('DATE RANGE');
    enabled.value = false;
    await nextTick();
    expect(root.classes()).toContain('date-range-root');
    expect(root.classes()).toContain('apollo-picker-underlined');
    expect(wrapper.get('.apollo-picker-separator').text()).toBe('DATE RANGE');
    wrapper.unmount();
  });

  it('forwards every applicable content and decoration slot, with actual primitive time scopes', async () => {
    const renderSlots: TimePickerSlots = {
      prefix: () => h('b', { class: 'slot-prefix' }, 'P'),
      suffixIcon: () => h('b', { class: 'slot-suffix' }, 'S'),
      clearIcon: () => h('b', { class: 'slot-clear' }, 'C'),
      panelRender: ({ originPanel }) => h('section', { class: 'slot-panel' }, [originPanel]),
      extraFooter: () => [],
      cellRender: ({ current, info }) =>
        h('span', { class: 'slot-cell', 'data-subtype': info.subType }, String(current)),
      presetRender: ({ preset, index }) =>
        h('span', { class: 'slot-preset' }, `${index}:${String(preset.label)}`),
    };
    const wrapper = mount(TimePicker, {
      props: { open: true, defaultValue: value, presets: [{ label: 'Original', value }] },
      slots: { ...renderSlots },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    expect(wrapper.find('.slot-prefix').exists()).toBe(true);
    expect(wrapper.find('.slot-suffix').exists()).toBe(true);
    expect(wrapper.find('.slot-clear').exists()).toBe(true);
    expect(document.querySelector('.slot-panel')).toBeTruthy();
    expect(document.querySelector('.slot-cell[data-subtype="hour"]')?.textContent).toBe('0');
    expect(document.querySelector('.slot-preset')?.textContent).toBe('0:Original');
    expect(document.querySelector('.apollo-picker-footer-extra')?.textContent).toBe('');
    wrapper.unmount();
    const range = mount(TimeRangePicker, { slots: { separator: () => 'UNTIL' } });
    expect(range.get('.apollo-picker-separator').text()).toBe('UNTIL');
    range.unmount();
  });

  it('keeps rejected controlled model proposals out of the later uncontrolled state', async () => {
    const wrapper = mount(TimePicker, { props: { value, open: false, pickerValue: value } });
    await wrapper.get('.apollo-picker-clear').trigger('click');
    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('change')).toHaveLength(1);
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('10:15:20');
    await wrapper.get('input').trigger('focus');
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('false');
    await wrapper.setProps({ value: undefined, open: undefined, pickerValue: undefined });
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('10:15:20');
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('consumes current TimePicker language hints independently for both entries', async () => {
    const hint = ref('Current time');
    const language = computed<TimePickerLocale>(() => ({
      placeholder: hint.value,
      rangePlaceholder: [`${hint.value} start`, `${hint.value} end`],
    }));
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            locale: {
              locale: 'en_US',
              TimePicker: language.value,
            },
          },
          () => [h(TimePicker), h(TimeRangePicker)],
        ),
    });
    const wrapper = mount(Host);
    const inputs = wrapper.findAll('input');
    expect(inputs[0]?.attributes('placeholder')).toBe('Current time');
    expect(inputs[1]?.attributes('placeholder')).toBe('Current time start');
    expect(inputs[2]?.attributes('placeholder')).toBe('Current time end');
    hint.value = 'Next time';
    await nextTick();
    expect(inputs[0]?.attributes('placeholder')).toBe('Next time');
    expect(inputs[2]?.attributes('placeholder')).toBe('Next time end');
    wrapper.unmount();
  });

  it('forwards current attrs, slots and owned events once without remounting the input', async () => {
    const visible = ref(true);
    const label = ref('first');
    let changes = 0;
    const Host = defineComponent({
      setup: () => () =>
        h(
          TimePicker,
          {
            defaultValue: value,
            open: true,
            class: label.value,
            style: label.value === 'first' ? 'width:120px' : [{ width: '220px' }],
            'aria-label': label.value,
            onChange: () => {
              changes += 1;
            },
          },
          visible.value
            ? {
                prefix: () => h('span', { class: 'native-prefix' }, label.value),
                extraFooter: () => [],
                cellRender: ({
                  info,
                }: Parameters<
                  NonNullable<import('../interface').TimePickerSlots['cellRender']>
                >[0]) => info.originNode,
              }
            : {},
        ),
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const input = wrapper.get<HTMLInputElement>('input');
    await nextTick();
    expect(document.querySelector('.apollo-picker-footer-extra')?.textContent).toBe('');
    label.value = 'next';
    visible.value = false;
    await nextTick();
    expect(wrapper.get('input').element).toBe(input.element);
    expect(input.attributes('aria-label')).toBe('next');
    expect(wrapper.get<HTMLElement>('.apollo-picker').element.style.width).toBe('220px');
    expect(wrapper.find('.native-prefix').exists()).toBe(false);
    await input.setValue('12:30:45');
    await input.trigger('keydown', { key: 'Enter' });
    expect(changes).toBe(1);
    wrapper.unmount();
    expect(document.querySelector('.apollo-picker-dropdown')).toBeNull();
  });
});
