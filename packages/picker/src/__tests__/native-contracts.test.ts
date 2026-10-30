import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { DatePanel } from '../date-panel';
import { dayjsGenerateConfig } from '../generate/dayjs';
import type { PanelCellRenderScope } from '../panel-context';
import { PickerPanel } from '../picker-panel';
import { generateUnits } from '../time-units';

const date = dayjs('2026-10-20 00:10:20');
const locale = { locale: 'en_US', yearFormat: 'YYYY', monthFormat: 'MMM' };
const base = { locale, generateConfig: dayjsGenerateConfig, defaultPickerValue: date };

afterEach(() => vi.useRealTimers());

describe('Picker native contracts', () => {
  it('does not overflow large time steps into an endless unit loop', () => {
    expect(generateUnits(0, 23, 2 ** 32)).toEqual([{ value: 0, label: '00', disabled: false }]);
    expect(generateUnits(0, 23, Number.POSITIVE_INFINITY)).toEqual([
      { value: 0, label: '00', disabled: false },
    ]);
  });

  it('follows a replacement picker only while panel mode is uncontrolled', async () => {
    const wrapper = mount(PickerPanel, { props: base });
    await wrapper.setProps({ picker: 'time' });
    expect(wrapper.find('.apollo-picker-time-panel').exists()).toBe(true);
    await wrapper.setProps({ mode: 'month', picker: 'year' });
    expect(wrapper.find('.apollo-picker-month-panel').exists()).toBe(true);
    wrapper.unmount();
  });
  it('uses the current time format, steps and disabled callbacks, including milliseconds', async () => {
    const wrapper = mount(PickerPanel, {
      props: { ...base, picker: 'time', value: [date], format: 'HH:mm' },
    });
    expect(wrapper.findAll('[data-type="hour"] li')).toHaveLength(24);
    await wrapper.setProps({
      format: 'hh:mm:ss.SSS A',
      hourStep: 6,
      hideDisabledOptions: true,
      disabledTime: () => ({ disabledHours: () => [6] }),
      disabledMilliseconds: () => [0],
    });
    expect(wrapper.find('[data-type="meridiem"]').exists()).toBe(true);
    expect(wrapper.find('[data-type="second"]').exists()).toBe(true);
    expect(
      wrapper.findAll('[data-type="hour"] li').map((item) => item.attributes('data-value')),
    ).toEqual(['0']);
    expect(wrapper.find('[data-type="millisecond"] [data-value="0"]').exists()).toBe(false);
    await wrapper.setProps({
      format: 'HH:mm',
      hourStep: undefined,
      hideDisabledOptions: false,
      disabledTime: undefined,
    });
    expect(wrapper.findAll('[data-type="hour"] li')).toHaveLength(24);
    expect(wrapper.find('[data-type="meridiem"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('updates semantic styles and header controls without replacing the panel', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const wrapper = mount(PickerPanel, { props: { ...base, onCellDblClick: first } });
    const panel = wrapper.element;
    await wrapper.setProps({
      classNames: { item: 'current-item', header: 'current-header' },
      styles: { item: { color: 'red' } },
      hideNext: true,
      onCellDblClick: second,
    });
    expect(wrapper.find<HTMLElement>('.current-item').element.style.color).toBe('red');
    expect(wrapper.find('.current-header').exists()).toBe(true);
    expect(
      wrapper.get<HTMLElement>('.apollo-picker-header-next-btn').element.style.visibility,
    ).toBe('hidden');
    await wrapper.get('td.apollo-picker-cell-in-view').trigger('dblclick');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ hideHeader: true });
    expect(wrapper.find('.apollo-picker-header').exists()).toBe(false);
    await wrapper.setProps({
      hideHeader: false,
      hideNext: false,
      classNames: undefined,
      styles: undefined,
    });
    expect(
      wrapper.get<HTMLElement>('.apollo-picker-header-next-btn').element.style.visibility,
    ).toBe('');
    expect(wrapper.find('.current-item').exists()).toBe(false);
    expect(wrapper.element).toBe(panel);
    wrapper.unmount();
  });

  it('selects with the default picker and emits each model proposal once', async () => {
    const select = vi.fn();
    const wrapper = mount(PickerPanel, {
      props: { ...base, defaultValue: [date], onSelect: select },
    });
    await wrapper.get('td[title="2026-10-05"]').trigger('click');
    const proposal = wrapper.emitted('update:value')?.[0]?.[0];
    expect(proposal).toEqual([date.date(5)]);
    expect(wrapper.emitted('change')).toHaveLength(1);
    expect(wrapper.emitted('update:pickerValue')).toHaveLength(1);
    expect(wrapper.get('.apollo-picker-cell-selected').attributes('title')).toBe('2026-10-05');
    await wrapper.get('td[title="2026-10-05"]').trigger('click');
    expect(wrapper.emitted('change')).toHaveLength(1);
    wrapper.element.dispatchEvent(new Event('select', { bubbles: true }));
    expect(select).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('retains the last accepted initial and replacement controlled values when released', async () => {
    const wrapper = mount(PickerPanel, {
      props: { ...base, value: [date], pickerValue: date, picker: 'month', mode: 'month' },
    });
    await wrapper.setProps({ value: undefined, pickerValue: undefined, mode: undefined });
    expect(wrapper.find('.apollo-picker-month-panel').exists()).toBe(true);
    expect(wrapper.get('.apollo-picker-cell-selected').text()).toBe('Oct');
    const next = date.year(2028).month(2);
    await wrapper.setProps({ value: [next], pickerValue: next, mode: 'year' });
    await wrapper.setProps({ value: undefined, pickerValue: undefined, mode: undefined });
    expect(wrapper.find('.apollo-picker-year-panel').exists()).toBe(true);
    expect(wrapper.get('.apollo-picker-cell-selected').text()).toBe('2028');
    wrapper.unmount();
  });

  it('reads scoped slot presence during render, preserves empty content and exposes real time values', async () => {
    const enabled = ref(true);
    const empty = ref(false);
    const time = ref(false);
    const scopes: PanelCellRenderScope[] = [];
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            PickerPanel,
            {
              ...base,
              picker: time.value ? 'time' : 'date',
              mode: time.value ? 'time' : 'date',
              value: [date],
              use12Hours: time.value,
            },
            enabled.value
              ? {
                  cellRender: (scope: PanelCellRenderScope) => {
                    scopes.push(scope);
                    return empty.value
                      ? []
                      : h('span', { class: 'slot-cell' }, String(scope.current));
                  },
                }
              : {},
          );
      },
    });
    const wrapper = mount(Host);
    expect(scopes.some((scope) => dayjs.isDayjs(scope.current))).toBe(true);
    expect(wrapper.find('.slot-cell').exists()).toBe(true);
    empty.value = true;
    await nextTick();
    expect(wrapper.get('td.apollo-picker-cell-in-view').text()).toBe('');
    enabled.value = false;
    await nextTick();
    expect(wrapper.get('td.apollo-picker-cell-in-view').text()).toBe('1');
    empty.value = false;
    enabled.value = true;
    time.value = true;
    await nextTick();
    expect(scopes.some((scope) => scope.info.subType === 'hour' && scope.current === 0)).toBe(true);
    expect(
      scopes.some((scope) => scope.info.subType === 'meridiem' && scope.current === 'pm'),
    ).toBe(true);
    wrapper.unmount();
  });

  it('cancels a pending scroll selection when changeOnScroll is disabled', async () => {
    vi.useFakeTimers();
    const select = vi.fn();
    const wrapper = mount(PickerPanel, {
      props: { ...base, picker: 'time', changeOnScroll: true, onSelect: select },
    });
    await nextTick();
    await wrapper.get('[data-type="hour"]').trigger('scroll');
    await wrapper.setProps({ changeOnScroll: false });
    await vi.advanceTimersByTimeAsync(350);
    expect(select).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('keeps a direct DatePanel mode and business events current', async () => {
    const select = vi.fn();
    const wrapper = mount(DatePanel, {
      props: {
        locale,
        generateConfig: dayjsGenerateConfig,
        pickerValue: date,
        values: [date],
        onSelect: select,
      },
    });
    await wrapper.setProps({ mode: 'week' });
    expect(wrapper.find('.apollo-picker-cell-selected').exists()).toBe(false);
    await wrapper.get('td.apollo-picker-cell-in-view').trigger('click');
    expect(wrapper.emitted('select')).toHaveLength(1);
    wrapper.element.dispatchEvent(new Event('select', { bubbles: true }));
    expect(select).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('emits one browsing proposal when a higher panel selects its next mode', async () => {
    const wrapper = mount(PickerPanel, { props: { ...base, picker: 'date', mode: 'year' } });
    await wrapper.get('td[title="2026"]').trigger('click');
    expect(wrapper.emitted('update:mode')).toEqual([['month']]);
    expect(wrapper.emitted('update:pickerValue')).toHaveLength(1);
    expect(wrapper.emitted('pickerValueChange')).toHaveLength(1);
    expect(wrapper.emitted('panelChange')).toHaveLength(1);
    wrapper.unmount();
  });

  it('does not leak a rejected controlled selection when value is released', async () => {
    const wrapper = mount(PickerPanel, { props: { ...base, value: [date], pickerValue: date } });
    await wrapper.get('td[title="2026-10-05"]').trigger('click');
    expect(wrapper.emitted('update:value')).toEqual([[[date.date(5)]]]);
    expect(wrapper.get('.apollo-picker-cell-selected').attributes('title')).toBe('2026-10-20');
    await wrapper.setProps({ value: undefined, pickerValue: undefined });
    expect(wrapper.get('.apollo-picker-cell-selected').attributes('title')).toBe('2026-10-20');
    expect(wrapper.vm.nativeElement).toBe(wrapper.element);
    wrapper.unmount();
    expect(wrapper.vm.nativeElement).toBeNull();
  });

  it('clears hover when leaving a time cell and ignores disabled time cells', async () => {
    const wrapper = mount(PickerPanel, {
      props: { ...base, picker: 'time', disabledHours: () => [5] },
    });
    await wrapper.get('[data-type="hour"] [data-value="1"]').trigger('mouseenter');
    await wrapper.get('[data-type="hour"] [data-value="1"]').trigger('mouseleave');
    expect(wrapper.emitted('hover')?.[1]).toEqual([null]);
    await wrapper.get('[data-type="hour"] [data-value="5"]').trigger('mouseenter');
    expect(wrapper.emitted('hover')).toHaveLength(2);
    wrapper.unmount();
  });

  it('renders time slots during SSR without starting browser effects', async () => {
    const frames = vi.spyOn(globalThis, 'requestAnimationFrame');
    const html = await renderToString(
      h(
        PickerPanel,
        { ...base, picker: 'time' },
        {
          cellRender: ({ current }: PanelCellRenderScope) =>
            h('span', { class: 'ssr-cell' }, String(current)),
        },
      ),
    );
    expect(html).toContain('ssr-cell');
    expect(frames).not.toHaveBeenCalled();
    frames.mockRestore();
  });
});
