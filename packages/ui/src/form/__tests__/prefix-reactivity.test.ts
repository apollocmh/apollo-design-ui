import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { h } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Form, FormItem } from '../index';

it('F03: updates FormItem classes when the provider prefix changes without remounting', async () => {
  const wrapper = mount(ConfigProvider, {
    props: { prefixCls: 'f1' },
    slots: {
      default: () =>
        h(
          Form,
          { layout: 'vertical' },
          {
            default: () =>
              h(
                FormItem,
                { label: 'Name', help: 'Required', validateStatus: 'error', hasFeedback: true },
                {
                  default: () => h('input', { 'aria-label': 'Name' }),
                },
              ),
          },
        ),
    },
  });
  const input = wrapper.get('input').element;
  try {
    for (const prefixCls of ['f1', 'f2', 'f1']) {
      await wrapper.setProps({ prefixCls });
      const prefix = `${prefixCls}-form-item`;
      expect(wrapper.find(`.${prefix}`).exists()).toBe(true);
      for (const suffix of ['row', 'vertical', 'with-help', 'has-error', 'has-feedback']) {
        expect(wrapper.find(`.${prefix}-${suffix}`).exists(), suffix).toBe(true);
      }
      const previous = prefixCls === 'f1' ? 'f2' : 'f1';
      expect(wrapper.find(`[class*="${previous}-form-item"]`).exists()).toBe(false);
      expect(wrapper.get('input').element).toBe(input);
    }
  } finally {
    wrapper.unmount();
  }
});
