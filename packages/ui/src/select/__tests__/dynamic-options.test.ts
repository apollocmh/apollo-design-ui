/** F02: option slots must be evaluated during rendering, including conditional slot functions. */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import AutoComplete from '../../auto-complete/AutoComplete';
import { SelectOptGroup, SelectOption } from '../index';
import type { DefaultOptionType } from '../interface';
import Select from '../Select';

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
const options = () => Array.from(document.querySelectorAll('.apollo-select-item-option'));
const labels = () =>
  options().map(
    (option) => option.querySelector('.apollo-select-item-option-content')?.textContent,
  );

function conditionalSelect() {
  const show = ref(false);
  const label = ref('Alpha');
  const value = ref('a');
  const disabled = ref(false);
  const Host = defineComponent({
    components: { Select, SelectOption },
    setup: () => ({ show, label, value, disabled }),
    template: `<Select open :virtual="false"><template v-if="show" #default><SelectOption :value="value" :disabled="disabled">{{ label }}</SelectOption></template></Select>`,
  });
  return { show, label, value, disabled, Host };
}

describe('F02 · dynamic option slots', () => {
  it('updates 0→1→0→1 without replacing the input or leaving stale options', async () => {
    const { Host, show } = conditionalSelect();
    const warn = vi.spyOn(console, 'warn');
    const w = mount(Host, { attachTo: document.body });
    try {
      await settle();
      const input = w.get('input').element;
      expect(labels()).toEqual([]);
      for (const visible of [true, false, true]) {
        show.value = visible;
        await settle();
        expect(labels()).toEqual(visible ? ['Alpha'] : []);
        expect(w.get('input').element).toBe(input);
      }
      expect(warn.mock.calls.flat().join(' ')).not.toMatch(
        /outside of the render|recursive updates/i,
      );
    } finally {
      w.unmount();
      warn.mockRestore();
    }
  });

  it('updates conditional default slots through AutoComplete as well', async () => {
    const show = ref(false);
    const w = mount(
      defineComponent({
        components: { AutoComplete, SelectOption, SelectOptGroup },
        setup: () => ({ show }),
        template: `<AutoComplete open :virtual="false"><template v-if="show" #default><SelectOptGroup label="Group"><SelectOption value="a">Alpha</SelectOption></SelectOptGroup></template></AutoComplete>`,
      }),
      { attachTo: document.body },
    );
    try {
      await settle();
      expect(labels()).toEqual([]);
      show.value = true;
      await settle();
      expect(labels()).toEqual(['Alpha']);
      show.value = false;
      await settle();
      expect(labels()).toEqual([]);
    } finally {
      w.unmount();
    }
  });

  it('updates values, labels, disabled state and selected labels, retaining removed-option cache', async () => {
    const show = ref(false);
    const label = ref('Alpha');
    const value = ref('a');
    const disabled = ref(false);
    const change = vi.fn();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Select,
            {
              open: true,
              virtual: false,
              defaultValue: 'a',
              onChange: change,
            },
            show.value
              ? {
                  default: () =>
                    h(
                      SelectOption,
                      { value: value.value, disabled: disabled.value },
                      () => label.value,
                    ),
                }
              : {},
          ),
      }),
      { attachTo: document.body },
    );
    try {
      await settle();
      show.value = true;
      await settle();
      expect(w.get('.apollo-select-content').text()).toBe('Alpha');
      label.value = 'Updated';
      disabled.value = true;
      await settle();
      expect(labels()).toEqual(['Updated']);
      expect(options()[0]?.classList.contains('apollo-select-item-option-disabled')).toBe(true);
      expect(w.get('.apollo-select-content').text()).toBe('Updated');
      show.value = false;
      await settle();
      expect(labels()).toEqual([]);
      expect(w.get('.apollo-select-content').text()).toBe('Updated');
      show.value = true;
      value.value = 'b';
      disabled.value = false;
      await settle();
      expect(labels()).toEqual(['Updated']);
      options()[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await settle();
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0]?.[0]).toBe('b');
    } finally {
      w.unmount();
    }
  });

  it('normalizes v-if comments, v-for fragments and grouped options', async () => {
    const show = ref(false);
    const items = ref([
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]);
    const w = mount(
      defineComponent({
        components: { Select, SelectOption, SelectOptGroup },
        setup: () => ({ show, items }),
        template: `<Select open :virtual="false"><SelectOptGroup label="Group"><SelectOption v-if="show" value="c">Gamma</SelectOption><SelectOption v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</SelectOption></SelectOptGroup></Select>`,
      }),
      { attachTo: document.body },
    );
    try {
      await settle();
      expect(labels()).toEqual(['Alpha', 'Beta']);
      show.value = true;
      items.value = [{ value: 'd', label: 'Delta' }];
      await settle();
      expect(labels()).toEqual(['Gamma', 'Delta']);
    } finally {
      w.unmount();
    }
  });

  it('keeps options data ahead of slots, including an empty array and a dynamic switch of channels', async () => {
    const data = ref<DefaultOptionType[] | undefined>([]);
    const slot = vi.fn(() => h(SelectOption, { value: 'slot' }, () => 'Slot'));
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Select, { options: data.value, open: true, virtual: false }, { default: slot }),
      }),
      { attachTo: document.body },
    );
    try {
      await settle();
      expect(labels()).toEqual([]);
      expect(slot).not.toHaveBeenCalled();
      data.value = [{ value: 'data', label: 'Data' }];
      await settle();
      expect(labels()).toEqual(['Data']);
      data.value = undefined;
      await settle();
      expect(labels()).toEqual(['Slot']);
      data.value = [];
      await settle();
      expect(labels()).toEqual([]);
    } finally {
      w.unmount();
    }
  });

  it('filters and selects the current virtualized slot options by keyboard', async () => {
    const show = ref(false);
    const change = vi.fn();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Select,
            {
              open: true,
              showSearch: true,
              optionFilterProp: 'children',
              onChange: change,
            },
            show.value
              ? {
                  default: () =>
                    Array.from({ length: 100 }, (_, i) =>
                      h(SelectOption, { value: `v${i}` }, () => `Label ${i}`),
                    ),
                }
              : {},
          ),
      }),
      { attachTo: document.body },
    );
    try {
      await settle();
      show.value = true;
      await settle();
      expect(options().length).toBeGreaterThan(0);
      expect(options().length).toBeLessThan(100);
      await w.get('input').setValue('Label 99');
      await settle();
      expect(labels()).toEqual(['Label 99']);
      await w.get('input').trigger('keydown', { key: 'ArrowDown', keyCode: 40 });
      await w.get('input').trigger('keydown', { key: 'Enter', keyCode: 13 });
      await settle();
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0]?.[0]).toBe('v99');
    } finally {
      w.unmount();
    }
  });

  it('renders the selected slot label during SSR without invoking slots outside render', async () => {
    const warn = vi.spyOn(console, 'warn');
    try {
      const html = await renderToString(
        h(
          Select,
          { value: 'a' },
          { default: () => h(SelectOption, { value: 'a' }, () => 'SSR Alpha') },
        ),
      );
      expect(html).toContain('SSR Alpha');
      expect(warn.mock.calls.flat().join(' ')).not.toMatch(/outside of the render/i);
    } finally {
      warn.mockRestore();
    }
  });
});
