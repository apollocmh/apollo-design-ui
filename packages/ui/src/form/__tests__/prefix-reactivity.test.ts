import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import { Input } from '../../input';
import { Form, FormItem } from '../index';
import type { FormLayout, ValidateStatus } from '../interface';

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

const fixtureStyle = document.createElement('style');
fixtureStyle.textContent = `
  .f1-form-item { margin-bottom: 24px; }
  .f2-form-item { margin-bottom: 40px; }
  .f1-form-item-vertical { margin-bottom: 32px; }
  .f2-form-item-vertical { margin-bottom: 48px; }
  .f1-form-item-inline { margin-bottom: 12px; }
  .f2-form-item-inline { margin-bottom: 20px; }
`;
afterEach(() => fixtureStyle.remove());

it.each<FormLayout>(['horizontal', 'vertical', 'inline'])(
  'F03: real Input feedback and help follow provider prefixes in %s layout',
  async (layout) => {
    document.head.appendChild(fixtureStyle);
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { prefixCls: 'f1' },
      slots: {
        default: () =>
          h(Form, { layout }, () =>
            h(
              FormItem,
              {
                label: 'Name',
                help: 'Required',
                validateStatus: 'error',
                hasFeedback: true,
              },
              () => h(Input, { id: 'prefix-name', 'aria-label': 'Name', value: 'typed' }),
            ),
          ),
      },
    });
    const input = w.get('input').element;
    for (const prefix of ['f1', 'f2', 'f1']) {
      await w.setProps({ prefixCls: prefix });
      expect(
        w.get(`.${prefix}-input-suffix .${prefix}-form-item-feedback-icon-error`).element.tagName,
      ).toBe('SPAN');
      expect(w.get(`.${prefix}-form-item-explain-error`).text()).toBe('Required');
      expect(w.get(`.${prefix}-form-item-row`).element.tagName).toBe('DIV');
      expect(w.find(`[class*="${prefix === 'f1' ? 'f2' : 'f1'}-form-item"]`).exists()).toBe(false);
      expect(w.find('[class*="apollo-form-item"]').exists()).toBe(false);
      expect(w.get('input').element).toBe(input);
    }
  },
);

it('F03: measured margin offset refreshes for prefix and inherited layout changes', async () => {
  document.head.appendChild(fixtureStyle);
  const prefix = ref('f1');
  const layout = ref<FormLayout>('horizontal');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { prefixCls: prefix.value }, () =>
          h(Form, { layout: layout.value }, () =>
            h(FormItem, { help: 'Required', validateStatus: 'error' }, () => h(Input)),
          ),
        ),
    }),
    { attachTo: document.body },
  );
  const input = w.get('input').element;
  for (const [nextPrefix, nextLayout, margin] of [
    ['f1', 'horizontal', 24],
    ['f2', 'horizontal', 40],
    ['f2', 'vertical', 48],
    ['f1', 'vertical', 32],
    ['f1', 'inline', 12],
  ] as const) {
    prefix.value = nextPrefix;
    layout.value = nextLayout;
    await nextTick();
    expect(w.get(`.${nextPrefix}-form-item-margin-offset`).attributes('style')).toContain(
      `margin-bottom: -${margin}px`,
    );
    expect(w.get(`.${nextPrefix}-form-item-additional`).attributes('style')).toContain(
      `min-height: ${margin}px`,
    );
    expect(w.get('input').element).toBe(input);
  }
});

it('F03: custom FormItem prefix updates explanation, feedback, status and layout without replacing Input', async () => {
  const prefix = ref('custom-a-form');
  const status = ref<ValidateStatus>('error');
  const layout = ref<'horizontal' | 'vertical'>('horizontal');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(Form, null, () =>
          h(
            FormItem,
            {
              prefixCls: prefix.value,
              layout: layout.value,
              label: 'Name',
              help: 'Details',
              validateStatus: status.value,
              hasFeedback: true,
            },
            () => h(Input, { 'aria-label': 'Name' }),
          ),
        ),
    }),
  );
  const input = w.get('input').element;
  for (const nextStatus of ['error', 'warning', 'success', 'validating'] as const) {
    prefix.value = prefix.value === 'custom-a-form' ? 'custom-b-form' : 'custom-a-form';
    status.value = nextStatus;
    layout.value = layout.value === 'horizontal' ? 'vertical' : 'horizontal';
    await nextTick();
    expect(w.get(`.${prefix.value}-item-feedback-icon-${nextStatus}`).element.tagName).toBe('SPAN');
    expect(w.get(`.${prefix.value}-item-explain-${nextStatus}`).text()).toBe('Details');
    expect(w.get(`.${prefix.value}-item`).classes()).toContain(
      `${prefix.value}-item-${layout.value}`,
    );
    expect(w.get('input').element).toBe(input);
  }
});

it('F03: standalone and Form.List ErrorList prefix contexts stay reactive', async () => {
  const prefix = ref('f1');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { prefixCls: prefix.value }, () => [
          h(Form.ErrorList, { help: 'Standalone', helpStatus: 'error' }),
          h(Form, { initialValues: { rows: [] } }, () =>
            h(Form.List, { name: 'rows', prefixCls: `${prefix.value}-list-form` }, () =>
              h(Form.ErrorList, { help: 'List error', helpStatus: 'error' }),
            ),
          ),
        ]),
    }),
  );
  for (const nextPrefix of ['f1', 'f2', 'f1']) {
    prefix.value = nextPrefix;
    await nextTick();
    expect(w.get(`.${nextPrefix}-form-item-explain-error`).text()).toBe('Standalone');
    expect(w.get(`.${nextPrefix}-list-form-item-explain-error`).text()).toBe('List error');
  }
});

it('F03: SSR hydration retains the real input and updates feedback/help prefixes', async () => {
  document.head.appendChild(fixtureStyle);
  const prefix = ref('f1');
  const App = defineComponent({
    setup: () => () =>
      h(ConfigProvider, { prefixCls: prefix.value }, () => [
        h(Form, { layout: 'vertical' }, () =>
          h(FormItem, { help: 'Required', validateStatus: 'error', hasFeedback: true }, () =>
            h(Input, { id: 'hydrated-prefix', value: 'typed' }),
          ),
        ),
        h(Form.ErrorList, { help: 'Standalone', helpStatus: 'error' }),
      ]),
  });
  const container = document.createElement('div');
  container.innerHTML = await renderToString(createSSRApp(App));
  document.body.appendChild(container);
  expect(container.querySelector('.f1-form-item-feedback-icon-error')).not.toBeNull();
  expect(container.querySelector('.f1-form-item-explain-error')?.textContent).toBe('Standalone');
  const input = container.querySelector('input');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const app = createSSRApp(App);
  try {
    app.mount(container);
    await nextTick();
    prefix.value = 'f2';
    await nextTick();
    expect(container.querySelector('input')).toBe(input);
    expect(container.querySelectorAll('.f2-form-item-explain-error')).toHaveLength(2);
    expect(container.querySelector('.f2-form-item-feedback-icon-error')).not.toBeNull();
    expect(container.querySelector('[class*="f1-form-item"]')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    container.remove();
    warn.mockRestore();
    error.mockRestore();
  }
});
