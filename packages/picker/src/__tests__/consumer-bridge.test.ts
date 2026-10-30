import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import DatePicker from '../../../ui/src/date-picker/DatePicker.vue';
import RangePicker from '../../../ui/src/date-picker/RangePicker.vue';
import { PickerPanel } from '../picker-panel';

describe('Picker DatePicker bridge', () => {
  it('keeps a pending value through both clicks and double click confirmation', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        open: true,
        needConfirm: true,
        defaultValue: dayjs('2026-09-10'),
        defaultPickerValue: dayjs('2026-09-01'),
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    const engine = wrapper.getComponent(PickerPanel);
    const cell = engine.get('td[title="2026-09-15"]');
    await cell.trigger('click');
    expect(wrapper.getComponent(PickerPanel).vm.$.uid).toBe(engine.vm.$.uid);
    expect(engine.get('td[title="2026-09-15"]').element).toBe(cell.element);
    await cell.trigger('click');
    expect(engine.emitted('select')).toHaveLength(2);
    await cell.trigger('dblclick');
    expect(engine.emitted('cellDblClick')).toHaveLength(1);
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual(dayjs('2026-09-15'));
    expect(wrapper.emitted('openChange')?.at(-1)?.[0]).toBe(false);
    wrapper.unmount();
  });

  it.each(['single', 'range'])(
    'forwards conditional %s cell slots through an open popup',
    async (kind) => {
      const enabled = ref(false);
      const empty = ref(false);
      const Host = defineComponent({
        setup: () => () => {
          const slots = enabled.value
            ? {
                cellRender: () =>
                  empty.value ? [] : h('span', { class: 'current-cell' }, 'custom'),
              }
            : {};
          return kind === 'single'
            ? h(DatePicker, { open: true }, slots)
            : h(RangePicker, { open: true }, slots);
        },
      });
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await nextTick();
      const engine = wrapper.getComponent(PickerPanel);
      const first = engine.get('td.apollo-picker-cell').element;
      enabled.value = true;
      await nextTick();
      await nextTick();
      expect(engine.find('.current-cell').exists()).toBe(true);
      expect(engine.get('td.apollo-picker-cell').element).toBe(first);
      empty.value = true;
      await nextTick();
      expect(engine.get('td.apollo-picker-cell').text()).toBe('');
      enabled.value = false;
      await nextTick();
      await nextTick();
      expect(engine.get('td.apollo-picker-cell').text()).not.toBe('');
      expect(engine.find('.current-cell').exists()).toBe(false);
      wrapper.unmount();
    },
  );
});
