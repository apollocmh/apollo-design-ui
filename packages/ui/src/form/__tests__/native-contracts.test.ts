import { FormStore } from '@apollo-design/form-core';
import { mount, type VueWrapper } from '@vue/test-utils';
import scrollIntoView from 'scroll-into-view-if-needed';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, effectScope, Fragment, h, nextTick, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Input } from '../../input';
import ErrorList from '../ErrorList';
import Form from '../Form.vue';
import FormItem from '../FormItem.vue';
import { useDebounce } from '../hooks/use-debounce';
import { useForm, useFormInstance } from '../hooks/use-form';
import type { FormSemanticProps, FormSlots } from '../interface';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn() }));

const mounted: VueWrapper[] = [];
afterEach(() => {
  mounted.forEach((wrapper) => {
    wrapper.unmount();
  });
  mounted.length = 0;
  document.body.innerHTML = '';
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('actual UI form instances', () => {
  it('reuses an existing UI instance', () => {
    const [form] = useForm();
    const [same] = useForm(form);
    expect(same).toBe(form);
  });

  it('a raw external store and repeated UI consumers share the same actual instance', () => {
    const raw = new FormStore(() => {}).getForm();
    const [first] = useForm(raw);
    const [second] = useForm(raw);
    const wrapper = mount(Form, {
      props: { form: raw, name: 'external' },
      slots: { default: () => h(FormItem, { name: 'title' }, { default: () => h(Input) }) },
      attachTo: document.body,
    });
    mounted.push(wrapper);
    expect(first).toBe(raw);
    expect(second).toBe(first);
    expect(first.getFieldInstance?.('title')).toBe(second.getFieldInstance?.('title'));
    second.focusField?.('title');
    expect(document.activeElement).toBe(wrapper.get('input').element);
  });

  it('useFormInstance reads the nearest existing form and has no implicit outside store', () => {
    const [form] = useForm();
    const seen: unknown[] = [];
    const Probe = defineComponent({
      setup() {
        seen.push(useFormInstance());
        return () => h('span');
      },
    });
    const outside = mount(Probe);
    const wrapper = mount(Form, { props: { form }, slots: { default: () => h(Probe) } });
    mounted.push(outside, wrapper);
    expect(seen).toEqual([undefined, form]);
  });

  it('registers a named Input, focuses it and removes it on unmount', () => {
    const [form] = useForm();
    const wrapper = mount(Form, {
      props: { form, name: 'profile' },
      slots: { default: () => h(FormItem, { name: 'title' }, { default: () => h(Input) }) },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    mounted.push(wrapper);
    expect(form.getFieldInstance?.('title')).toBeTruthy();
    form.focusField?.('title');
    expect(document.activeElement).toBe(wrapper.get('input').element);
    wrapper.unmount();
    expect(form.getFieldInstance?.('title')).toBeUndefined();
  });

  it('keeps a custom expose with no focus method as the same actual ref object', () => {
    const [form] = useForm();
    const control = shallowRef<object | null>(null);
    const Control = defineComponent({
      setup(_props, { expose }) {
        expose({ marker: 'actual control' });
        return () => h('input');
      },
    });
    const wrapper = mount(Form, {
      props: { form },
      slots: {
        default: () =>
          h(FormItem, { name: 'title' }, { default: () => h(Control, { ref: control }) }),
      },
    });
    mounted.push(wrapper);
    expect(control.value).toHaveProperty('marker', 'actual control');
    expect(form.getFieldInstance?.('title')).toBe(control.value);
  });

  it('focuses the requested form when separate forms use the same field id', () => {
    const [first] = useForm();
    const [second] = useForm();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            'div',
            [first, second].map((form) =>
              h(
                Form,
                { form },
                {
                  default: () => h(FormItem, { name: 'title' }, { default: () => h(Input) }),
                },
              ),
            ),
          ),
      }),
      { attachTo: document.body },
    );
    mounted.push(wrapper);
    second.focusField?.('title');
    expect(document.activeElement).toBe(wrapper.findAll('input')[1]?.element);
  });

  it('scrollToFirstError=false does not request a scroll', async () => {
    const [form] = useForm();
    const failed = vi.fn();
    const wrapper = mount(Form, {
      props: { form, scrollToFirstError: false, onFinishFailed: failed },
      slots: {
        default: () =>
          h(FormItem, { name: 'title', rules: [{ required: true }] }, { default: () => h(Input) }),
      },
      attachTo: document.body,
    });
    mounted.push(wrapper);
    form.submit();
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('current ownership and content', () => {
  it('ErrorList owns visibleChanged once and forwards native attrs/style to the actual help root', async () => {
    const visible = vi.fn();
    const click = vi.fn();
    const wrapper = mount(ErrorList, {
      props: { help: 'Visible help', onVisibleChanged: visible },
      attrs: {
        id: 'native-help',
        class: { 'native-help-class': true },
        style: [{ paddingTop: '3px' }, { paddingTop: '5px' }],
        onClick: click,
      },
    });
    mounted.push(wrapper);
    await vi.waitFor(() => expect(wrapper.find('.apollo-form-item-explain').exists()).toBe(true));
    const help = wrapper.get('.apollo-form-item-explain');
    expect(help.attributes('id')).toBe('native-help');
    expect(help.classes()).toContain('native-help-class');
    expect(help.attributes('class')).not.toContain('[object');
    expect(help.attributes('style')).toContain('padding-top: 5px');
    await help.trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(visible).toHaveBeenCalledWith(true));
    await wrapper.setProps({ help: undefined });
    await vi.waitFor(() => expect(visible).toHaveBeenCalledWith(false));
    expect(visible.mock.calls).toEqual([[true], [false]]);
    expect(wrapper.emitted('visibleChanged')).toEqual([[true], [false]]);
  });

  it('ErrorList keeps duplicate arbitrary message strings distinct through replacement', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(ErrorList, {
      props: { errors: ['__proto__', '__proto__', '__proto__-fallback-0'] },
    });
    mounted.push(wrapper);
    try {
      await vi.waitFor(() =>
        expect(
          wrapper.findAll('.apollo-form-item-explain-error').map((node) => node.text()),
        ).toEqual(['__proto__', '__proto__', '__proto__-fallback-0']),
      );
      await wrapper.setProps({ errors: ['__proto__-fallback-0', '__proto__'] });
      await vi.waitFor(() =>
        expect(
          wrapper.findAll('.apollo-form-item-explain-error').map((node) => node.text()),
        ).toEqual(['__proto__-fallback-0', '__proto__']),
      );
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('binds the single real control through a Fragment even with shouldUpdate=false', async () => {
    const [form] = useForm<{ title: string }>();
    const wrapper = mount(Form, {
      props: { form, initialValues: { title: 'initial' } },
      slots: {
        default: () =>
          h(
            FormItem,
            { name: 'title', shouldUpdate: false },
            {
              default: () => h(Fragment, [h(Input, { 'aria-label': 'Fragment control' })]),
            },
          ),
      },
    });
    mounted.push(wrapper);
    expect(wrapper.get('input').element.value).toBe('initial');
    await wrapper.get('input').setValue('current');
    await nextTick();
    expect(form.getFieldValue('title')).toBe('current');
    expect(form.getFieldInstance?.('title')).toBeTruthy();
  });

  it('keeps distinct noStyle error paths when a literal key contains the former separator', async () => {
    const [form] = useForm();
    const shown = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Form,
            { form },
            {
              default: () =>
                h(
                  FormItem,
                  { label: 'Combined' },
                  {
                    default: () => [
                      h(
                        FormItem,
                        { name: 'a__SPLIT__a__SPLIT__b', noStyle: true },
                        { default: () => h(Input) },
                      ),
                      shown.value
                        ? h(
                            FormItem,
                            { name: ['a', 'b'], noStyle: true },
                            { default: () => h(Input) },
                          )
                        : null,
                    ],
                  },
                ),
            },
          ),
      }),
    );
    mounted.push(wrapper);
    form.setFields([
      { name: 'a__SPLIT__a__SPLIT__b', errors: ['Literal error'] },
      { name: ['a', 'b'], errors: ['Nested error'] },
    ]);
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Literal error');
      expect(wrapper.text()).toContain('Nested error');
    });
    shown.value = false;
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Literal error');
      expect(wrapper.text()).not.toContain('Nested error');
    });
  });

  it('supports numeric responsive label spans and stops columns at the nested layout boundary', () => {
    const wrapper = mount(Form, {
      props: { labelCol: { xs: 6, sm: { span: 8 } }, wrapperCol: { xs: 12, sm: { span: 10 } } },
      slots: {
        default: () =>
          h(
            FormItem,
            { label: null },
            {
              default: () =>
                h(FormItem, { label: 'Nested', name: 'title' }, { default: () => h(Input) }),
            },
          ),
      },
    });
    mounted.push(wrapper);
    const columns = wrapper.findAll('.apollo-form-item-control');
    expect(columns[0]?.classes()).toEqual(
      expect.arrayContaining([
        'apollo-col-xs-12',
        'apollo-col-xs-offset-6',
        'apollo-col-sm-10',
        'apollo-col-sm-offset-8',
      ]),
    );
    expect(
      columns[1]
        ?.classes()
        .some((name) => name.startsWith('apollo-col-xs-') || name.startsWith('apollo-col-sm-')),
    ).toBe(false);
  });

  it('provides disabled and explicit false to real descendant controls', async () => {
    const disabled = ref<boolean | undefined>(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { componentDisabled: true },
            {
              default: () =>
                h(
                  Form,
                  { disabled: disabled.value },
                  {
                    default: () => h(FormItem, { name: 'title' }, { default: () => h(Input) }),
                  },
                ),
            },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    mounted.push(wrapper);
    expect(wrapper.get('input').element.disabled).toBe(true);
    disabled.value = false;
    await nextTick();
    expect(wrapper.get('input').element.disabled).toBe(false);
  });

  it('routes a named Item native attrs and label/help/extra slots to their owners', async () => {
    const wrapper = mount(Form, {
      slots: {
        default: () =>
          h(
            FormItem,
            {
              name: 'title',
              label: 'old label',
              help: 'old help',
              extra: 'old extra',
              class: 'native-item',
              style: { paddingTop: '7px' },
              'data-item': 'owned',
            },
            {
              default: () => h(Input),
              label: () => [0, h('b', 'slot label')],
              help: () => h('b', 'slot help'),
              extra: () => h('b', 'slot extra'),
            },
          ),
      },
    });
    mounted.push(wrapper);
    expect(wrapper.get('.apollo-form-item').classes()).toContain('native-item');
    expect(wrapper.get('.apollo-form-item').attributes('data-item')).toBe('owned');
    const itemElement = wrapper.get('.apollo-form-item').element;
    if (!(itemElement instanceof HTMLElement)) throw new Error('Missing HTML Item root');
    expect(itemElement.style.paddingTop).toBe('7px');
    expect(wrapper.get('label').text()).toBe('0slot label');
    await vi.waitFor(() => expect(wrapper.get('#title_help').text()).toBe('slot help'));
    expect(wrapper.get('#title_extra').text()).toBe('slot extra');
    expect(wrapper.get('.apollo-form-item-control-input-content').text()).not.toContain(
      'slot help',
    );
  });

  it('respects Item htmlFor and preserves native describedby alongside field help', async () => {
    const wrapper = mount(Form, {
      slots: {
        default: () =>
          h(
            FormItem,
            {
              name: 'title',
              id: 'actual-title',
              htmlFor: 'actual-title',
              label: 'Title',
              help: 'Help',
            },
            {
              default: () => h(Input, { 'aria-describedby': 'user-help' }),
            },
          ),
      },
    });
    mounted.push(wrapper);
    expect(wrapper.get('input').attributes('id')).toBe('actual-title');
    expect(wrapper.get('label').attributes('for')).toBe('actual-title');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('user-help actual-title_help');
  });

  it('keeps an intentional empty label slot and gives numeric help its real describedby target', async () => {
    const wrapper = mount(Form, {
      props: {
        class: { 'native-form': true },
        style: [{ paddingTop: '3px' }, { paddingTop: '5px' }],
      },
      slots: {
        default: () =>
          h(
            FormItem,
            { name: 'title', label: 'Fallback label', help: 0, extra: 0 },
            {
              default: () => h(Input),
              label: () => [],
            },
          ),
      },
    });
    mounted.push(wrapper);
    expect(wrapper.get('form').classes()).toContain('native-form');
    expect(wrapper.get('form').attributes('style')).toContain('padding-top: 5px');
    expect(wrapper.get('label').text()).toBe('');
    await vi.waitFor(() => expect(wrapper.get('#title_help').text()).toBe('0'));
    expect(wrapper.get('#title_extra').text()).toBe('0');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('title_help title_extra');
  });

  it('installs current component token variables at Form and standalone Item roots', () => {
    const theme = {
      components: {
        Form: {
          labelRequiredMarkColor: 'red',
          labelColor: 'purple',
          labelFontSize: 17,
          labelHeight: 38,
          verticalLabelHeight: 41,
          labelColonMarginInlineStart: 5,
          labelColonMarginInlineEnd: 9,
          itemMarginBottom: 31,
          verticalLabelPadding: '1px 2px',
          verticalLabelMargin: 3,
          inlineItemMarginBottom: 6,
        },
      },
    };
    const wrapper = mount(ConfigProvider, {
      props: { theme },
      slots: {
        default: () =>
          h('section', [
            h(
              Form,
              {},
              {
                default: () =>
                  h(FormItem, { name: 'title', label: 'Title' }, { default: () => h(Input) }),
              },
            ),
            h(FormItem, { label: 'Standalone' }),
          ]),
      },
      global: { stubs: { teleport: false } },
    });
    mounted.push(wrapper);
    for (const item of wrapper.findAll('.apollo-form-item')) {
      const element = item.element;
      if (!(element instanceof HTMLElement)) throw new Error('Missing HTML Item root');
      expect(element.style.getPropertyValue('--apollo-form-label-font-size')).toBe('17px');
      expect(element.style.getPropertyValue('--apollo-form-item-margin-bottom')).toBe('31px');
      expect(element.style.getPropertyValue('--apollo-form-inline-item-margin-bottom')).toBe('6px');
    }
  });

  it('scoped required marks reuse a stable label component and feedback slots prefer the Item', async () => {
    const ownFeedback = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Form,
            {},
            {
              requiredMark: ({
                label: Label,
                required,
              }: Parameters<NonNullable<FormSlots['requiredMark']>>[0]) =>
                h('span', { 'data-mark': String(required) }, [h(Label), 'custom mark']),
              feedbackIcon: ({ status }: Parameters<NonNullable<FormSlots['feedbackIcon']>>[0]) =>
                h('i', { 'data-feedback': 'form' }, status),
              default: () =>
                h(
                  FormItem,
                  {
                    name: 'title',
                    label: 'Title',
                    required: true,
                    hasFeedback: true,
                    validateStatus: 'error',
                  },
                  {
                    default: () => h(Input),
                    ...(ownFeedback.value
                      ? {
                          feedbackIcon: () =>
                            h('i', { 'data-feedback': 'item' }, 'custom feedback'),
                        }
                      : {}),
                  },
                ),
            },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    mounted.push(wrapper);
    expect(wrapper.get('[data-mark]').text()).toBe('Titlecustom mark');
    expect(wrapper.get('[data-mark]').attributes('data-mark')).toBe('true');
    expect(wrapper.get('[data-feedback]').attributes('data-feedback')).toBe('item');
    ownFeedback.value = false;
    await nextTick();
    expect(wrapper.get('[data-feedback]').attributes('data-feedback')).toBe('form');
    expect(wrapper.get('[data-feedback]').text()).toBe('error');
  });

  it('resolved Provider semantic classes/styles reach the current label, content and help', async () => {
    const disabled = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: {
                form: {
                  classNames: { label: 'provider-label' },
                  styles: {
                    content: { paddingInlineStart: '9px' },
                    help: { color: 'rgb(10, 20, 30)' },
                  },
                },
              },
            },
            {
              default: () =>
                h(
                  Form,
                  {
                    disabled: disabled.value,
                    classNames: ({ props }: { props: FormSemanticProps }) => ({
                      label: props.disabled ? 'local-disabled' : 'local-enabled',
                    }),
                  },
                  {
                    default: () =>
                      h(
                        FormItem,
                        { name: 'title', label: 'Title', help: 'Help' },
                        { default: () => h(Input) },
                      ),
                  },
                ),
            },
          ),
      }),
      {
        global: { stubs: { teleport: false } },
      },
    );
    mounted.push(wrapper);
    expect(wrapper.get('label').classes()).toEqual(
      expect.arrayContaining(['provider-label', 'local-enabled']),
    );
    expect(wrapper.get('.apollo-form-item-control-input-content').attributes('style')).toContain(
      'padding-inline-start: 9px',
    );
    await vi.waitFor(() =>
      expect(wrapper.get('#title_help').attributes('style')).toContain('color: rgb(10, 20, 30)'),
    );
    disabled.value = true;
    await nextTick();
    expect(wrapper.get('label').classes()).toContain('local-disabled');
    expect(wrapper.get('label').classes()).not.toContain('local-enabled');
  });

  it('the debounce watch releases its timer when its effect scope stops', () => {
    vi.useFakeTimers();
    const scope = effectScope();
    scope.run(() => useDebounce(() => ['error']));
    expect(vi.getTimerCount()).toBe(1);
    scope.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
