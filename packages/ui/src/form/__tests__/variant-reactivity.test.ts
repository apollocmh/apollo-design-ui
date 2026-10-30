import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import ConfigProvider from '../../config-provider';
import Input from '../../input';
import Select from '../../select';

describe('current component variant defaults', () => {
  for (const entry of [
    { key: 'input', render: () => h(Input), selector: '.apollo-input' },
    { key: 'select', render: () => h(Select), selector: '.apollo-select' },
  ]) {
    it(`${entry.key} follows replacement and removal of its Provider config`, async () => {
      const components = shallowRef({ [entry.key]: { variant: 'filled' } });
      const Host = defineComponent(
        () => () => h(ConfigProvider, { components: components.value }, { default: entry.render }),
      );
      const wrapper = mount(Host);
      try {
        expect(wrapper.get(entry.selector).classes()).toContain(
          `${entry.selector.slice(1)}-filled`,
        );
        components.value = { [entry.key]: { variant: 'borderless' } };
        await nextTick();
        expect(wrapper.get(entry.selector).classes()).toContain(
          `${entry.selector.slice(1)}-borderless`,
        );
        components.value = {};
        await nextTick();
        expect(wrapper.get(entry.selector).classes()).toContain(
          `${entry.selector.slice(1)}-outlined`,
        );
      } finally {
        wrapper.unmount();
      }
    });
  }
});
