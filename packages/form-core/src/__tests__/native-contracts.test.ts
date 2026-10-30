import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { defineComponent, h, nextTick, provide, reactive, ref } from 'vue';

import { Field } from '../field';
import { Form } from '../form';
import { fieldContextKey, HOOK_MARK } from '../form-context';
import { FormProvider } from '../form-provider';
import { FormStore } from '../form-store';
import type {
  FieldData,
  FieldSlots,
  FormChangeInfo,
  FormRef,
  ListSlots,
  MetaEvent,
} from '../form-types';
import { List } from '../list';
import WatcherCenter, { macroTask } from '../watcher-center';

const mounted: VueWrapper[] = [];

afterEach(() => {
  mounted.forEach((wrapper) => {
    wrapper.unmount();
  });
  mounted.length = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function createStore() {
  const store = new FormStore(() => {});
  const form = store.getForm();
  const hooks = store.getInternalHooks(HOOK_MARK);
  if (!hooks) throw new Error('FormStore internal hooks unavailable');
  return { store, form, hooks };
}

describe('Vue public contracts', () => {
  it('Form, Field and List slots receive named scope objects', () => {
    const { form } = createStore();
    const scopes: unknown[] = [];
    const wrapper = mount(Form, {
      props: { form, initialValues: { title: 'Apollo', users: ['Ada'] } },
      slots: {
        default: (scope: unknown) => {
          scopes[0] = scope;
          return [
            h(
              Field,
              { name: 'title' },
              {
                default: (fieldScope: unknown) => {
                  scopes[1] = fieldScope;
                  return h('span');
                },
              },
            ),
            h(
              List,
              { name: 'users' },
              {
                default: (listScope: unknown) => {
                  scopes[2] = listScope;
                  return h('span');
                },
              },
            ),
          ];
        },
      },
    });
    mounted.push(wrapper);
    expect(scopes[0]).toMatchObject({ values: { title: 'Apollo' }, form });
    expect(scopes[1]).toMatchObject({
      control: { value: 'Apollo' },
      meta: { name: ['title'] },
      form,
    });
    expect(scopes[2]).toMatchObject({
      fields: [{ name: 0 }],
      operations: { add: expect.any(Function) },
      meta: { name: ['users'] },
    });
  });

  it('Form and FormProvider own exactly one notification emit', async () => {
    const { store, form } = createStore();
    const valuesChange = vi.fn();
    const formChange = vi.fn();
    const wrapper = mount(FormProvider, {
      props: { onFormChange: formChange },
      slots: {
        default: () =>
          h(
            Form,
            { name: 'profile', form, onValuesChange: valuesChange },
            {
              default: () => h(Field, { name: 'title' }),
            },
          ),
      },
    });
    mounted.push(wrapper);
    store.dispatch({ type: 'updateValue', namePath: ['title'], value: 'Apollo' });
    await nextTick();
    expect(valuesChange).toHaveBeenCalledTimes(1);
    expect(formChange).toHaveBeenCalledTimes(1);
    expect(wrapper.getComponent(Form).emitted('valuesChange')).toEqual([
      [{ title: 'Apollo' }, { title: 'Apollo' }],
    ]);
    expect(wrapper.emitted('formChange')).toHaveLength(1);
  });

  it('Field owns reset and metaChange emits', () => {
    const { form } = createStore();
    const reset = vi.fn();
    const metaChange = vi.fn();
    const Host = defineComponent({
      setup() {
        provide(fieldContextKey, form);
        return () => h(Field, { name: 'title', onReset: reset, onMetaChange: metaChange });
      },
    });
    const wrapper = mount(Host);
    mounted.push(wrapper);
    form.setFieldValue('title', 'Apollo');
    form.resetFields();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(wrapper.getComponent(Field).emitted('reset')).toEqual([[]]);
    expect(wrapper.getComponent(Field).emitted('metaChange')?.length).toBe(
      metaChange.mock.calls.length,
    );
  });

  it('Form registry follows a changed name and unregisters the accepted name', async () => {
    const { store, form } = createStore();
    const observer = createStore();
    const name = ref('before');
    const show = ref(true);
    const changes: FormChangeInfo[] = [];
    const wrapper = mount(FormProvider, {
      props: { onFormChange: (_name: string, info: FormChangeInfo) => changes.push(info) },
      slots: {
        default: () => [
          show.value
            ? h(
                Form,
                { form, name: name.value },
                {
                  default: () => h(Field, { name: 'title' }),
                },
              )
            : h('span'),
          h(
            Form,
            { form: observer.form, name: 'observer' },
            {
              default: () => h(Field, { name: 'title' }),
            },
          ),
        ],
      },
    });
    mounted.push(wrapper);
    name.value = 'after';
    await nextTick();
    store.dispatch({ type: 'updateValue', namePath: ['title'], value: 'Apollo' });
    expect(Object.keys(changes[0]?.forms ?? {}).sort()).toEqual(['after', 'observer']);
    show.value = false;
    await nextTick();
    observer.store.dispatch({ type: 'updateValue', namePath: ['title'], value: 'remaining' });
    expect(Object.keys(changes.at(-1)?.forms ?? {})).toEqual(['observer']);
  });

  it('controlled fields update in place without replacing the array', async () => {
    const { form } = createStore();
    const fields: FieldData[] = reactive([{ name: 'title', value: 'first' }]);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Form, { form, fields }, { default: () => h(Field, { name: 'title' }) }),
      }),
    );
    mounted.push(wrapper);
    expect(form.getFieldValue('title')).toBe('first');
    const field = fields[0];
    if (!field) throw new Error('Missing title field');
    field.value = 'second';
    await nextTick();
    expect(form.getFieldValue('title')).toBe('second');
  });

  it('renderProps can switch from field subscription to form subscription', async () => {
    const { form } = createStore();
    const renderProps = ref(false);
    const render = vi.fn(() => h('span'));
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(Form, { form, renderProps: renderProps.value }, { default: render }),
      }),
    );
    mounted.push(wrapper);
    renderProps.value = true;
    await nextTick();
    const before = render.mock.calls.length;
    form.setFieldsValue({ title: 'Apollo' });
    await nextTick();
    expect(render.mock.calls.length).toBe(before + 1);
  });

  it('a List accepts a default slot added after mount', async () => {
    const { form } = createStore();
    const show = ref(false);
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Form,
            { form },
            {
              default: () =>
                h(List, { name: 'users' }, show.value ? { default: () => h('span', 'ready') } : {}),
            },
          ),
      }),
    );
    mounted.push(wrapper);
    expect(warn).toHaveBeenCalled();
    show.value = true;
    await nextTick();
    expect(wrapper.text()).toBe('ready');
  });

  it('nested Lists read the current form validation trigger', async () => {
    const { form } = createStore();
    const trigger = ref('onBlur');
    const validator = vi.fn(() => Promise.resolve());
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Form,
            { form, validateTrigger: trigger.value, initialValues: { users: [{ title: '' }] } },
            {
              default: () =>
                h(
                  List,
                  { name: 'users' },
                  {
                    default: ({ fields }: Parameters<NonNullable<ListSlots['default']>>[0]) =>
                      fields.map((field) =>
                        h(
                          Field,
                          {
                            key: field.key,
                            name: [field.name, 'title'],
                            trigger: 'onInput',
                            rules: [{ validator }],
                          },
                          {
                            default: ({
                              control,
                            }: Parameters<NonNullable<FieldSlots['default']>>[0]) =>
                              h('input', control),
                          },
                        ),
                      ),
                  },
                ),
            },
          ),
      }),
    );
    mounted.push(wrapper);
    trigger.value = 'onChange';
    await nextTick();
    await wrapper.get('input').trigger('blur');
    expect(validator).not.toHaveBeenCalled();
    await wrapper.get('input').trigger('change');
    await vi.waitFor(() => expect(validator).toHaveBeenCalledTimes(1));
  });

  it('the Form ref exposes public methods and the actual custom host element', () => {
    const formRef = ref<FormRef | null>(null);
    const Host = defineComponent({
      setup:
        (_props, { slots }) =>
        () =>
          h('section', slots.default?.()),
    });
    const wrapper = mount(
      defineComponent({ setup: () => () => h(Form, { component: Host, ref: formRef }) }),
    );
    mounted.push(wrapper);
    expect(formRef.value?.nativeElement).toBe(wrapper.get('section').element);
    expect(formRef.value).not.toHaveProperty('getInternalHooks');
    expect(formRef.value).not.toHaveProperty('_init');
  });

  it('native reset keeps merged listeners and runs them after the store reset', async () => {
    const { form } = createStore();
    const calls: unknown[] = [];
    const first = () => calls.push(['first', form.getFieldValue('title')]);
    const second = () => calls.push(['second', form.getFieldValue('title')]);
    const wrapper = mount(Form, {
      props: { form, initialValues: { title: 'initial' } },
      attrs: { onReset: [first, second] },
    });
    mounted.push(wrapper);
    form.setFieldValue('title', 'edited');
    await wrapper.get('form').trigger('reset');
    expect(calls).toEqual([
      ['first', 'initial'],
      ['second', 'initial'],
    ]);
  });
});

describe('resource and asynchronous boundaries', () => {
  it('a superseded root subscription only disposes its own listener', () => {
    const { form, hooks } = createStore();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = hooks.useSubscribe(false, first);
    const stopSecond = hooks.useSubscribe(false, second);
    stopFirst();
    form.setFieldsValue({ title: 'accepted' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    stopSecond();
    form.setFieldsValue({ title: 'disposed' });
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('unmount clears the active validation debounce timer', async () => {
    vi.useFakeTimers();
    const { form } = createStore();
    const validator = vi.fn(() => Promise.resolve());
    const wrapper = mount(Form, {
      props: { form },
      slots: {
        default: () =>
          h(
            Field,
            {
              name: 'title',
              trigger: 'onInput',
              validateTrigger: 'onInput',
              validateDebounce: 60_000,
              rules: [{ validator }],
            },
            {
              default: ({ control }: Parameters<NonNullable<FieldSlots['default']>>[0]) =>
                h('input', control),
            },
          ),
      },
    });
    mounted.push(wrapper);
    await wrapper.get('input').setValue('typed');
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(1);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
    await Promise.resolve();
    expect(validator).not.toHaveBeenCalled();
  });

  it('a completed macro task closes both MessageChannel ports', async () => {
    const channels: MessageChannel[] = [];
    const closeCalls: MockInstance<() => void>[] = [];
    class TrackedChannel extends MessageChannel {
      constructor() {
        super();
        channels.push(this);
        closeCalls.push(vi.spyOn(this.port1, 'close'), vi.spyOn(this.port2, 'close'));
      }
    }
    vi.stubGlobal('MessageChannel', TrackedChannel);
    try {
      const run = vi.fn();
      macroTask(run);
      await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1));
      expect(closeCalls).toHaveLength(2);
      expect(closeCalls.every((close) => close.mock.calls.length === 1)).toBe(true);
    } finally {
      channels.forEach((channel) => {
        channel.port1.close();
        channel.port2.close();
      });
    }
  });

  it('unmount invalidates a pending validation before its result can emit meta', async () => {
    const { form } = createStore();
    const show = ref(true);
    let rejectValidation: (reason: Error) => void = () => {
      throw new Error('Validator did not start');
    };
    const pending = new Promise<void>((_resolve, reject) => {
      rejectValidation = reject;
    });
    const metas: MetaEvent[] = [];
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Form,
            { form },
            {
              default: () =>
                show.value
                  ? h(Field, {
                      name: 'title',
                      rules: [{ validator: () => pending }],
                      onMetaChange: (meta: MetaEvent) => metas.push(meta),
                    })
                  : h('span'),
            },
          ),
      }),
    );
    mounted.push(wrapper);
    const validation = form.validateFields().catch((error: unknown) => error);
    await nextTick();
    show.value = false;
    await nextTick();
    expect(metas.at(-1)?.destroy).toBe(true);
    const before = metas.length;
    rejectValidation(new Error('late error'));
    await validation;
    await nextTick();
    expect(metas).toHaveLength(before);
  });

  it('unmount during the deferred frame skips the validator', async () => {
    const { form } = createStore();
    const validator = vi.fn(() => Promise.resolve());
    const wrapper = mount(Form, {
      props: { form },
      slots: { default: () => h(Field, { name: 'title', rules: [{ validator }] }) },
    });
    const validation = form.validateFields({ delayFrame: true });
    await nextTick();
    wrapper.unmount();
    await validation.catch((error: unknown) => error);
    expect(validator).not.toHaveBeenCalled();
  });

  it('a watcher write retains its own path for the following batch', async () => {
    const { store } = createStore();
    const center = new WatcherCenter(store);
    const paths: string[][] = [];
    center.register((_values, _allValues, namePaths) => {
      paths.push(namePaths.map((path) => path.join('.')));
      if (paths.length === 1) center.notify([['second']]);
    });
    center.notify([['first']]);
    await vi.waitFor(() => expect(paths).toHaveLength(2));
    expect(paths).toEqual([['first'], ['second']]);
  });

  it('a submit settled after Form unmount does not send a stale notification', async () => {
    const { form } = createStore();
    const finish = vi.fn();
    const finishFailed = vi.fn();
    const providerFinish = vi.fn();
    const show = ref(true);
    let resolveValidation: () => void = () => {
      throw new Error('Validator did not start');
    };
    const pending = new Promise<void>((resolve) => {
      resolveValidation = resolve;
    });
    const wrapper = mount(FormProvider, {
      props: { onFormFinish: providerFinish },
      slots: {
        default: () =>
          show.value
            ? h(
                Form,
                { form, onFinish: finish, onFinishFailed: finishFailed },
                {
                  default: () => h(Field, { name: 'title', rules: [{ validator: () => pending }] }),
                },
              )
            : h('span'),
      },
    });
    mounted.push(wrapper);
    form.submit();
    await nextTick();
    show.value = false;
    await nextTick();
    resolveValidation();
    await pending;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(finish).not.toHaveBeenCalled();
    expect(finishFailed).not.toHaveBeenCalled();
    expect(providerFinish).not.toHaveBeenCalled();
  });
});
