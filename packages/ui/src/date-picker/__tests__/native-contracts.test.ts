import { PickerPanel } from '@apollo-design/picker';
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick, ref, type VNodeChild } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import TimePicker from '../../time-picker/TimePicker.vue';
import DatePicker from '../DatePicker.vue';
import { dayjsConfig } from '../hooks/dayjs-config';
import type { ValueSlot } from '../hooks/picker-value';
import { useInnerValue } from '../hooks/picker-value';
import RangePicker from '../RangePicker.vue';

const value = dayjs('2026-10-20');

describe('DatePicker native wrapper contracts', () => {
  it('keeps the accepted initial model and rejects hidden controlled writes on release', async () => {
    const controlled = ref<ValueSlot[] | undefined>([value]);
    let read: () => ValueSlot[] = () => [];
    let propose: (next: ValueSlot[]) => void = () => {};
    const Host = defineComponent({
      setup() {
        const inner = useInnerValue({
          generateConfig: computed(() => dayjsConfig),
          rangeValue: false,
          order: computed(() => false),
          getDateTexts: (dates) => dates.map((date) => date?.format('YYYY-MM-DD') ?? ''),
          defaultValue: [],
          getValue: () => controlled.value,
        });
        read = () => inner.mergedValue.value;
        propose = inner.setInnerValue;
        return () => null;
      },
    });
    const wrapper = mount(Host);
    propose([value.date(5)]);
    expect(read()).toEqual([value]);
    controlled.value = undefined;
    await nextTick();
    expect(read()).toEqual([value]);
    wrapper.unmount();
  });

  it('keeps an ordinary input draft while the date is still incomplete', async () => {
    const wrapper = mount(DatePicker, { props: { open: false } });
    const input = wrapper.get<HTMLInputElement>('input');
    let draft = '';
    for (const character of '2026-11-09') {
      draft += character;
      input.element.value = draft;
      await input.trigger('input');
      expect(input.element.value).toBe(draft);
    }
    wrapper.unmount();
  });

  it('lets the native keydown listener cancel submission before any state action', async () => {
    const wrapper = mount(DatePicker, {
      props: { defaultValue: value, open: false, onKeydown: (event) => event.preventDefault() },
    });
    const input = wrapper.get<HTMLInputElement>('input');
    await input.setValue('2026-11-09');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('openChange')).toBeUndefined();
    expect(wrapper.emitted('keydown')?.[0]).toHaveLength(1);
    wrapper.unmount();
  });

  it('keeps readonly masked text unchanged when native editing keys arrive', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        defaultValue: value,
        inputReadOnly: true,
        format: { format: 'YYYY-MM-DD', type: 'mask' },
      },
    });
    const input = wrapper.get<HTMLInputElement>('input');
    await input.trigger('focus');
    await input.trigger('keydown', { key: 'ArrowUp' });
    expect(input.element.value).toBe('2026-10-20');
    expect(wrapper.emitted('calendarChange')).toBeUndefined();
    wrapper.unmount();
  });

  it('marks invalid text only on the range input that owns it', async () => {
    const wrapper = mount(RangePicker, { props: { open: false } });
    const inputs = wrapper.findAll('input');
    await inputs[0]?.setValue('invalid');
    expect(inputs[0]?.attributes('aria-invalid')).toBe('true');
    expect(inputs[1]?.attributes('aria-invalid')).toBe('false');
    wrapper.unmount();
  });

  it('keeps accepted open and browsing values when their control is removed', async () => {
    const wrapper = mount(DatePicker, {
      props: { open: true, pickerValue: value.year(2028) },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    await wrapper.setProps({ open: undefined, pickerValue: undefined });
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('true');
    expect(document.querySelector('.apollo-picker-year-btn')?.textContent).toContain('2028');
    wrapper.unmount();
  });

  it('renders declared wrapper slots, including an empty footer, from current presence', async () => {
    const visible = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(
          DatePicker,
          { open: true, defaultValue: value, presets: [{ label: 'Preset', value }] },
          visible.value
            ? {
                prefix: () => h('span', { class: 'native-prefix' }, 'prefix'),
                suffixIcon: () => h('span', { class: 'native-suffix' }, 'suffix'),
                clearIcon: () => h('span', { class: 'native-clear' }, 'clear'),
                extraFooter: () => [],
                panelRender: ({ originPanel }: { originPanel: VNodeChild }) =>
                  h('section', { class: 'native-panel' }, [originPanel]),
                presetRender: () => h('span', { class: 'native-preset' }, 'preset'),
              }
            : {},
        ),
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    expect(wrapper.find('.native-prefix').exists()).toBe(true);
    expect(wrapper.find('.native-suffix').exists()).toBe(true);
    expect(wrapper.find('.native-clear').exists()).toBe(true);
    expect(document.querySelector('.native-panel')).toBeTruthy();
    expect(document.querySelector('.native-preset')).toBeTruthy();
    expect(document.querySelector('.apollo-picker-footer-extra')?.textContent).toBe('');
    visible.value = false;
    await nextTick();
    await nextTick();
    expect(wrapper.find('.native-prefix').exists()).toBe(false);
    expect(document.querySelector('.native-panel')).toBeNull();
    wrapper.unmount();
  });

  it('enters the real readonly date panel, skips disabled dates and restores focus on Escape', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        defaultValue: value,
        inputReadOnly: true,
        disabledDate: (date) => date.date() === 21,
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.focus();
    await input.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    const cell = document.activeElement;
    expect(cell?.getAttribute('title')).toBe('2026-10-20');
    cell?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(document.activeElement?.getAttribute('title')).toBe('2026-10-22');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(document.activeElement).toBe(input.element);
    expect(input.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('selects a readonly time from real column focus with native keys', async () => {
    const wrapper = mount(TimePicker, {
      props: { defaultValue: value.hour(10), inputReadOnly: true, disabledHours: () => [11] },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.focus();
    await input.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(document.activeElement?.getAttribute('data-value')).toBe('10');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(document.activeElement?.getAttribute('data-value')).toBe('12');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(dayjs.isDayjs(wrapper.emitted('select')?.at(-1)?.[0])).toBe(true);
    const selected = wrapper.emitted('select')?.at(-1)?.[0];
    expect(dayjs.isDayjs(selected) ? selected.hour() : undefined).toBe(12);
    const confirm = document.querySelector<HTMLButtonElement>('.apollo-picker-ok button');
    expect(confirm?.disabled).toBe(false);
    confirm?.click();
    await nextTick();
    const changed = wrapper.emitted('change')?.at(-1)?.[0];
    expect(dayjs.isDayjs(changed) ? changed.hour() : undefined).toBe(12);
    wrapper.unmount();
  });

  it('keeps rejected value and open proposals separate from accepted models on release', async () => {
    const wrapper = mount(DatePicker, {
      props: { value, open: false, pickerValue: value, mode: 'date' },
    });
    await wrapper.get('.apollo-picker-clear').trigger('click');
    expect(wrapper.emitted('update:value')?.at(-1)?.[0]).toBeNull();
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('2026-10-20');
    await wrapper.get('input').trigger('focus');
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true]);
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('false');
    await wrapper.setProps({ value: undefined, open: undefined });
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('2026-10-20');
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('uses current format and disabled time configuration at submission', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        picker: 'time',
        defaultValue: value.hour(10),
        open: false,
        format: 'HH:mm',
        disabledHours: () => [12],
      },
    });
    const input = wrapper.get<HTMLInputElement>('input');
    await input.setValue('12:30');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('change')).toBeUndefined();
    await wrapper.setProps({ disabledHours: () => [], format: 'HH:mm:ss' });
    await input.setValue('12:30:45');
    await input.trigger('keydown', { key: 'Enter' });
    const changed = wrapper.emitted('change')?.at(-1)?.[0];
    expect(dayjs.isDayjs(changed) ? changed.format('HH:mm:ss') : undefined).toBe('12:30:45');
    wrapper.unmount();
  });

  it('keeps IME drafts until composition ends and resets invalid text on blur', async () => {
    const wrapper = mount(DatePicker, { props: { defaultValue: value, open: false } });
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.value = '2026-11-09';
    input.element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await nextTick();
    expect(wrapper.emitted('calendarChange')).toBeUndefined();
    input.element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await nextTick();
    expect(dayjs.isDayjs(wrapper.emitted('calendarChange')?.at(-1)?.[0])).toBe(true);
    await input.setValue('invalid');
    expect(input.attributes('aria-invalid')).toBe('true');
    await input.trigger('blur');
    expect(input.attributes('aria-invalid')).toBe('false');
    expect(input.element.value).not.toBe('invalid');
    wrapper.unmount();
  });

  it('allows readonly range selection through each field and preserves disabled endpoints on clear', async () => {
    const wrapper = mount(RangePicker, {
      props: {
        defaultValue: [value, value.date(24)],
        inputReadOnly: true,
        disabled: [true, false],
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const input = wrapper.get<HTMLInputElement>('input[date-range="end"]');
    input.element.focus();
    await input.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(document.activeElement?.getAttribute('title')).toBeTruthy();
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await nextTick();
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await nextTick();
    const changed = wrapper.emitted('change')?.at(-1)?.[0];
    expect(
      Array.isArray(changed) && dayjs.isDayjs(changed[0]) ? changed[0].date() : undefined,
    ).toBe(20);
    await wrapper.get('.apollo-picker-clear').trigger('click');
    const cleared = wrapper.emitted('change')?.at(-1)?.[0];
    expect(
      Array.isArray(cleared) && dayjs.isDayjs(cleared[0]) ? cleared[0].date() : undefined,
    ).toBe(20);
    expect(Array.isArray(cleared) ? cleared[1] : undefined).toBeNull();
    wrapper.unmount();
  });

  it('validates a lone range end with its true index and current disabledTime configuration', async () => {
    const observed: ('start' | 'end')[] = [];
    const wrapper = mount(RangePicker, {
      props: {
        open: true,
        picker: 'time',
        defaultValue: [null, value.hour(12)],
        allowEmpty: [true, false],
        disabledTime: (_date, range) => {
          observed.push(range);
          return { disabledHours: () => (range === 'end' ? [12] : []) };
        },
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    expect(observed).toContain('end');
    expect(document.querySelector<HTMLButtonElement>('.apollo-picker-ok button')?.disabled).toBe(
      true,
    );
    await wrapper.setProps({ disabledTime: () => ({ disabledHours: () => [] }) });
    expect(document.querySelector<HTMLButtonElement>('.apollo-picker-ok button')?.disabled).toBe(
      false,
    );
    wrapper.unmount();
  });

  it('updates native root attrs and isolates popup identity and focus between instances', async () => {
    const cls = ref('first');
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h(DatePicker, {
            class: cls.value,
            style: cls.value === 'first' ? 'width:100px' : [{ width: '200px' }],
            defaultValue: value,
            inputReadOnly: true,
          }),
          h(DatePicker, { defaultValue: value.date(23), inputReadOnly: true }),
        ]),
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const inputs = wrapper.findAll<HTMLInputElement>('input');
    inputs[0]?.element.focus();
    await inputs[0]?.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    const firstControls = inputs[0]?.attributes('aria-controls');
    cls.value = 'next';
    await nextTick();
    expect(wrapper.findAll('.apollo-picker')[0]?.classes()).toContain('next');
    expect(wrapper.findAll<HTMLElement>('.apollo-picker')[0]?.element.style.width).toBe('200px');
    inputs[1]?.element.focus();
    await inputs[1]?.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(inputs[1]?.attributes('aria-controls')).not.toBe(firstControls);
    const panels = wrapper.findAllComponents(PickerPanel);
    expect(panels.length).toBeGreaterThan(0);
    wrapper.unmount();
    expect(document.querySelector('.apollo-picker-dropdown')).toBeNull();
  });

  it('projects current component tokens to both trigger and popup and honors local direction', async () => {
    const theme = ref({ components: { DatePicker: { cellHeight: 39, zIndexPopup: 1800 } } });
    const Host = defineComponent({
      setup: () => () =>
        h(ConfigProvider, { theme: theme.value, direction: 'ltr' }, () =>
          h(DatePicker, {
            open: true,
            direction: 'rtl',
            defaultValue: value,
          }),
        ),
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    const trigger = wrapper.get<HTMLElement>('.apollo-picker');
    expect(trigger.classes()).toContain('apollo-picker-rtl');
    expect(trigger.element.style.getPropertyValue('--apollo-date-picker-cell-height')).toBe('39px');
    const popup = document.querySelector<HTMLElement>('.apollo-picker-dropdown');
    expect(popup?.style.getPropertyValue('--apollo-date-picker-cell-height')).toBe('39px');
    expect(popup?.style.zIndex).toBe('1800');
    theme.value = { components: { DatePicker: { cellHeight: 45, zIndexPopup: 1900 } } };
    await nextTick();
    expect(trigger.element.style.getPropertyValue('--apollo-date-picker-cell-height')).toBe('45px');
    expect(popup?.style.zIndex).toBe('1900');
    wrapper.unmount();
  });
});
