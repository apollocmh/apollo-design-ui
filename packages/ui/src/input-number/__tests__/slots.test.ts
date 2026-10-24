/** F04: prefix/suffix templates survive both wrapper paths and remain reactive. */
import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, provide, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { formItemInputContextKey } from '../../form/context';
import { InputNumber } from '../index';

it('F04: named slots override content props and retain semantic wrappers', () => {
  const w = mount(InputNumber, {
    props: {
      prefix: 'prop-prefix',
      suffix: 'prop-suffix',
      classNames: { prefix: 'custom-prefix', suffix: 'custom-suffix' },
    },
    slots: { prefix: () => h('strong', '¥'), suffix: () => h('em', '元') },
  });
  expect(w.get('.apollo-input-number-prefix').html()).toContain('<strong>¥</strong>');
  expect(w.get('.apollo-input-number-suffix').html()).toContain('<em>元</em>');
  expect(w.get('.custom-prefix').text()).toBe('¥');
  expect(w.get('.custom-suffix').text()).toBe('元');
  expect(w.text()).not.toContain('prop-');
  w.unmount();
});

it('F04: an intentionally empty slot suppresses its prop, preserving feedback', () => {
  const w = mount(
    defineComponent({
      setup() {
        provide(formItemInputContextKey, {
          hasFeedback: true,
          feedbackIcon: h('i', { class: 'feedback' }, 'valid'),
        });
        return () =>
          h(
            InputNumber,
            { prefix: 'old-prefix', suffix: 'old-suffix' },
            { prefix: () => [], suffix: () => [] },
          );
      },
    }),
  );
  expect(w.get('.apollo-input-number-prefix').text()).toBe('');
  expect(w.get('.apollo-input-number-suffix').text()).toBe('valid');
  expect(w.find('.feedback').exists()).toBe(true);
  w.unmount();
});

it('F04: conditional slots and text update without replacing the input or duplicating change', async () => {
  const show = ref(false);
  const text = ref('USD');
  const value = ref(1);
  const change = vi.fn();
  const w = mount(
    defineComponent({
      components: { InputNumber },
      setup: () => ({ show, text, value, change }),
      template: `<InputNumber v-model:value="value" prefix="$" suffix="fallback" @change="change"><template v-if="show" #prefix><strong>{{ text }}</strong></template><template v-if="show" #suffix><em>{{ text }}</em></template></InputNumber>`,
    }),
  );
  const input = w.get('input');
  expect(w.get('.apollo-input-number-prefix').text()).toBe('$');
  show.value = true;
  await nextTick();
  expect(w.get('.apollo-input-number-prefix').text()).toBe('USD');
  expect(w.get('.apollo-input-number-suffix').text()).toBe('USD');
  text.value = 'CNY';
  await nextTick();
  expect(w.get('.apollo-input-number-prefix').text()).toBe('CNY');
  await input.setValue('12');
  expect(value.value).toBe(12);
  expect(change).toHaveBeenCalledTimes(1);
  show.value = false;
  await nextTick();
  expect(w.get('.apollo-input-number-prefix').text()).toBe('$');
  expect(w.get('.apollo-input-number-suffix').text()).toBe('fallback');
  expect(w.get('input').element).toBe(input.element);
  w.unmount();
});

it('F04: slots are forwarded inside the legacy addon/Compact path', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const w = mount(InputNumber, {
    props: { addonBefore: 'before', addonAfter: 'after' },
    slots: { prefix: () => h('strong', 'Prefix'), suffix: () => h('strong', 'Suffix') },
  });
  try {
    expect(w.get('.apollo-input-number-prefix').text()).toBe('Prefix');
    expect(w.get('.apollo-input-number-suffix').text()).toBe('Suffix');
    expect(w.findAll('.apollo-input-number-addon').map((addon) => addon.text())).toEqual([
      'before',
      'after',
    ]);
    expect(error.mock.calls.flat().join(' ')).toContain('deprecated');
  } finally {
    w.unmount();
    error.mockRestore();
  }
});

it('F04: SSR renders prefix/input/suffix in order', async () => {
  const html = await renderToString(
    h(
      InputNumber,
      { value: 3 },
      { prefix: () => h('strong', 'Prefix'), suffix: () => h('em', 'Suffix') },
    ),
  );
  expect(html).toContain('<strong>Prefix</strong>');
  expect(html).toContain('<em>Suffix</em>');
  expect(html.indexOf('<strong>')).toBeLessThan(html.indexOf('<input'));
  expect(html.indexOf('<input')).toBeLessThan(html.indexOf('<em>'));
});
