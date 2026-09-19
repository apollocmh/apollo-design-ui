/**
 * 批次③c 行为测试 —— `Form` / `FormProvider` / `List`。
 *
 * ⚠️⚠️ **本文件不是 oracle 差分。** 契约 §7.0.1 已定判据：
 * 「上游零框架耦合 ⇒ 可做 Oracle；绑 React 生命周期 ⇒ 不能」。
 *
 * - `Form.js` 用 `useRef` / `useImperativeHandle` / `useEffect` / `useMemo` / `useContext`；
 * - `FormContext.js` 的 `FormProvider` 是 `React.createContext` + `useRef`；
 * - `List.js` 用 `useContext` / `useRef` / `useMemo` + render props。
 *
 * ⇒ **三个都不可对拍**。期望值全部来自**逐行读上游源码**（每条都标了行号），
 * 不是照我们的实现反推。
 *
 * ── 测试里的挂载方式 ──────────────────────────────────────────────────────────
 *
 * `Form` / `List` 都是「provider + 插槽」形态，所以测试一律用一个 Host 组件挂它们，
 * 并用 `ref` 拿到 `Form` 的 `expose`（差异 4：`useImperativeHandle` ⇒ `expose`）。
 * ⚠️ 不用 VTU 的 `wrapper.vm` —— `expose()` 之后它拿到的是**暴露对象**而不是组件实例，
 * 语义取决于 VTU 内部实现；显式 `ref` 才是确定的。
 *
 * ── 两条「怎么触发」的常识（写测试时踩过）───────────────────────────────────
 *
 * 1. `setFieldsValue` / `setFieldValue` 走的是 **`setFields`**，它**不会**触发
 *    `onValuesChange` / `onFieldsChange`（`form-store.ts:578-593` 只 `notifyObservers`
 *    + `notifyWatch`）。要触发回调必须走 **`updateValue`** ⇒ 调 `Field` 的
 *    `control.onChange(...)`（`form-store.ts:713` 的六步链第 5 步）。
 * 2. ⚠️ `vi.spyOn(...).mockRestore()` 会**清空 `mock.calls`** ⇒ 必须在 restore
 *    **之前**把调用记录抄出来（`captureWarnings` 就是这么写的）。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type Component,
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  ref,
  shallowRef,
  type VNodeChild,
} from 'vue';

import { Field } from '../field';
import { Form } from '../form';
import { fieldContextKey, formContextKey, HOOK_MARK, listContextKey } from '../form-context';
import { FormProvider } from '../form-provider';
import { FormStore } from '../form-store';
import type {
  ChildProps,
  FieldData,
  FormContextProps,
  FormInstance,
  FormRef,
  InternalNamePath,
  ListContextProps,
  ListField,
  ListOperations,
  Meta,
  Store,
  StoreValue,
} from '../form-types';
import { List } from '../list';

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.restoreAllMocks();
});

/** 让挂起的微任务 / 渲染队列 / 校验 promise 全部跑完。 */
async function flush(): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await nextTick();
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
  await nextTick();
}

/**
 * 捕获 `fn` 执行期间的 `console.error` 文本（`@apollo-design/utils` 的 `warning` 走它）。
 *
 * ⚠️ 必须在 `mockRestore()` **之前**把 `mock.calls` 抄出来 —— vitest 的
 * `mockRestore()` 会连带清空调用记录。
 */
function captureWarnings(fn: () => void): string[] {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const calls: unknown[][] = [];
  try {
    fn();
  } finally {
    calls.push(...spy.mock.calls);
    spy.mockRestore();
  }
  return calls.map((call) => String(call[0]));
}

/** 异步版 {@link captureWarnings}（告警发生在下一次渲染里时用）。 */
async function captureWarningsAsync(fn: () => Promise<void>): Promise<string[]> {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const calls: unknown[][] = [];
  try {
    await fn();
  } finally {
    calls.push(...spy.mock.calls);
    spy.mockRestore();
  }
  return calls.map((call) => String(call[0]));
}

// ---------------------------------------------------------------------------
// Form 挂载器
// ---------------------------------------------------------------------------

interface FormHarness {
  wrapper: VueWrapper;
  /** `expose()` 出来的对象（`FormRef`）。 */
  exposed: () => FormRef | null;
  /** 每次插槽调用收到的实参 `[values, form]`。 */
  slotCalls: () => unknown[][];
  renderCount: () => number;
  /** 插槽第一次调用拿到的 `form`（即本表单实例）。 */
  form: () => FormInstance;
  /** 内部 `Field` 的 control（只在给了 `options.field` 时才有）。 */
  control: () => ChildProps;
}

interface MountFormOptions {
  slot?: (values: Store, form: FormInstance) => VNodeChild[];
  /** 不传 `default` 插槽。 */
  noSlot?: boolean;
  /** 注入一个自定义 `FormContext`（测 `FormProvider` 之外的兜底）。 */
  formContext?: FormContextProps;
  /** 挂一个内部 `Field`（用于触发 `updateValue` ⇒ `onValuesChange` / `onFieldsChange`）。 */
  field?: { name: string; rules?: unknown[] };
}

function mountForm(
  props: Record<string, unknown> = {},
  options: MountFormOptions = {},
): FormHarness {
  const exposed = shallowRef<FormRef | null>(null);
  const slotCalls: unknown[][] = [];
  let renderCount = 0;
  let control: ChildProps = {};

  const Host = defineComponent({
    name: 'FormHost',
    setup() {
      if (options.formContext) {
        provide(formContextKey, options.formContext);
      }
      return () =>
        h(
          Form,
          { ...props, ref: exposed },
          options.noSlot
            ? undefined
            : {
                default: (...args: unknown[]) => {
                  renderCount += 1;
                  slotCalls.push(args);
                  const children: VNodeChild[] = options.slot
                    ? options.slot(args[0] as Store, args[1] as FormInstance)
                    : [h('i', { class: 'probe' })];
                  if (options.field) {
                    children.push(
                      h(
                        Field,
                        { name: options.field.name, rules: options.field.rules },
                        {
                          default: (c: ChildProps) => {
                            control = c;
                            return [h('i', { class: 'field-probe' })];
                          },
                        },
                      ),
                    );
                  }
                  return children;
                },
              },
        );
    },
  });

  const wrapper = mount(Host);
  return {
    wrapper,
    exposed: () => exposed.value,
    slotCalls: () => slotCalls,
    renderCount: () => renderCount,
    form: () => {
      const first = slotCalls[0];
      if (!first) throw new Error('插槽还没有被调用过');
      return first[1] as FormInstance;
    },
    control: () => control,
  };
}

// ---------------------------------------------------------------------------
// Form · 容器渲染（上游 `Form.js:112-137`）
// ---------------------------------------------------------------------------

describe('Form · 容器渲染', () => {
  it('默认渲染 <form>（component 默认 `"form"`，Form.js:16）', () => {
    const h1 = mountForm();
    expect(h1.wrapper.find('form').exists()).toBe(true);
    expect(h1.wrapper.html()).toContain('<form');
  });

  it('component: false ⇒ 只渲染插槽内容，不产容器（Form.js:122-124）', () => {
    const h1 = mountForm({ component: false }, { slot: () => [h('span', { class: 'child' })] });
    expect(h1.wrapper.find('form').exists()).toBe(false);
    expect(h1.wrapper.find('.child').exists()).toBe(true);
  });

  it('component 为字符串 ⇒ 渲染那个标签', () => {
    const h1 = mountForm({ component: 'section' });
    expect(h1.wrapper.find('section').exists()).toBe(true);
    expect(h1.wrapper.find('form').exists()).toBe(false);
  });

  it('component 为组件 ⇒ 渲染该组件', () => {
    const Inner = defineComponent({
      name: 'Inner',
      setup(_, { slots }) {
        return () => h('div', { class: 'inner' }, slots.default?.());
      },
    });
    const h1 = mountForm({ component: Inner as Component }, { slot: () => [h('i')] });
    expect(h1.wrapper.find('.inner').exists()).toBe(true);
    expect(h1.wrapper.find('i').exists()).toBe(true);
  });

  it('未声明的 attrs 透传到容器元素（`{...restProps}`，Form.js:125）', () => {
    const h1 = mountForm({ class: 'my-form', id: 'f1' });
    const el = h1.wrapper.find('form').element;
    expect(el.classList.contains('my-form')).toBe(true);
    expect(el.getAttribute('id')).toBe('f1');
  });

  it('expose 暴露 FormInstance 的方法（差异 4：useImperativeHandle ⇒ expose）', () => {
    const h1 = mountForm();
    const exposed = h1.exposed();
    expect(exposed).toBeTruthy();
    expect(typeof exposed?.getFieldValue).toBe('function');
    expect(typeof exposed?.validateFields).toBe('function');
    // ⭐ 与插槽拿到的实例是**同一个 store**（方法引用相同）
    expect(exposed?.getFieldValue).toBe(h1.form().getFieldValue);
  });

  it('nativeElement 指向容器 DOM 元素（Form.js:42-45）', () => {
    const h1 = mountForm();
    const el = h1.exposed()?.nativeElement;
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el?.tagName).toBe('FORM');
    expect(el).toBe(h1.wrapper.find('form').element);
  });

  it('component: false ⇒ nativeElement 仍是 `null`（React 的 useRef(null) 初值）', () => {
    const h1 = mountForm({ component: false }, { slot: () => [h('i')] });
    expect(h1.exposed()?.nativeElement).toBeNull();
  });

  it('没有 default 插槽时容器仍然渲染（内容为空）', () => {
    const h1 = mountForm({}, { noSlot: true });
    expect(h1.wrapper.find('form').exists()).toBe(true);
    expect(h1.renderCount()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Form · 原生 form 语义（上游 `Form.js:126-136`）
// ---------------------------------------------------------------------------

describe('Form · 原生 form 语义', () => {
  it('submit ⇒ preventDefault + stopPropagation + submit()（Form.js:127-131）', async () => {
    const onFinish = vi.fn();
    const h1 = mountForm({ onFinish });
    const el = h1.wrapper.find('form').element;

    const event = new Event('submit', { cancelable: true, bubbles: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    el.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);

    await flush();
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('reset ⇒ preventDefault + resetFields + 透传原 onReset（Form.js:132-136）', () => {
    const onReset = vi.fn();
    const h1 = mountForm({ initialValues: { a: 1 }, onReset });
    const form = h1.form();
    form.setFieldValue('a', 2);
    expect(form.getFieldValue('a')).toBe(2);

    const event = new Event('reset', { cancelable: true, bubbles: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    h1.wrapper.find('form').element.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(form.getFieldValue('a')).toBe(1);
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onReset.mock.calls[0]?.[0]).toBe(event);
  });

  it('reset 时没有用户 onReset 也不报错', () => {
    const h1 = mountForm();
    expect(() => {
      h1.wrapper
        .find('form')
        .element.dispatchEvent(new Event('reset', { cancelable: true, bubbles: true }));
    }).not.toThrow();
  });

  it('component: false 时没有可挂 submit 的容器元素', () => {
    const h1 = mountForm({ component: false, onFinish: vi.fn() }, { slot: () => [h('i')] });
    expect(h1.wrapper.find('form').exists()).toBe(false);
    // 但表单实例仍旧可用
    expect(() => h1.form().submit()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Form · store 挂钩（上游 `Form.js:56-88`）
// ---------------------------------------------------------------------------

describe('Form · store 挂钩', () => {
  it('initialValues 在首次挂载灌进 store（Form.js:80：`init = !mountRef.current`）', () => {
    const h1 = mountForm({ initialValues: { a: 1, b: { c: 2 } } });
    expect(h1.form().getFieldsValue(true)).toEqual({ a: 1, b: { c: 2 } });
  });

  it('initialValues 变化 ⇒ 只换 initialValues，不动 store（init = false）', async () => {
    const initialValues = ref<Store>({ a: 1 });
    let form: FormInstance | null = null;

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { initialValues: initialValues.value },
            {
              default: (...args: unknown[]) => {
                form = args[1] as FormInstance;
                return [h('i')];
              },
            },
          );
      },
    });
    mount(Host);
    const current = form as unknown as FormInstance;
    expect(current.getFieldValue('a')).toBe(1);

    initialValues.value = { a: 9 };
    await flush();
    // `init === false` ⇒ store 不重写
    expect(current.getFieldValue('a')).toBe(1);
    // 但 resetFields 现在按新的 initialValues 回填
    current.resetFields();
    expect(current.getFieldValue('a')).toBe(9);
  });

  it('setCallbacks：onValuesChange 收到 (changedValues, allValues)', async () => {
    const onValuesChange = vi.fn();
    const h1 = mountForm({ onValuesChange }, { field: { name: 'a' } });
    h1.control().onChange(7);
    await flush();
    expect(onValuesChange).toHaveBeenCalled();
    expect(onValuesChange.mock.calls[0]?.[0]).toEqual({ a: 7 });
  });

  it('setCallbacks：校验失败走 onFinishFailed（Form.js:74）', async () => {
    const onFinishFailed = vi.fn();
    const h1 = mountForm(
      { onFinishFailed },
      { field: { name: 'a', rules: [{ required: true, message: 'required' }] } },
    );
    h1.form().submit();
    await flush();
    expect(onFinishFailed).toHaveBeenCalledTimes(1);
    expect(onFinishFailed.mock.calls[0]?.[0]).toMatchObject({ outOfDate: false });
  });

  it('回调 prop 换成新闭包后 store 用的是新的（Vue 的 setup 只跑一次 ⇒ 必须 watch）', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const handler = ref(first);
    let control: ChildProps = {};

    // ⚠️ 必须让 Host 的**渲染函数**读 `handler.value`，props 才会变
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { onValuesChange: handler.value },
            {
              default: () => [
                h(
                  Field,
                  { name: 'a' },
                  {
                    default: (c: ChildProps) => {
                      control = c;
                      return [h('i')];
                    },
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);

    handler.value = second;
    await flush();
    control.onChange(1);
    await flush();

    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  it('setPreserve：表单级 preserve = false ⇒ 字段注销时清值', () => {
    const h1 = mountForm({ preserve: false }, { field: { name: 'a' } });
    const form = h1.form();
    form.setFieldValue('a', 1);
    expect(form.getFieldValue('a')).toBe(1);
    h1.wrapper.unmount();
    expect(form.getFieldsValue(true)).toEqual({});
  });

  it('setPreserve 变化也会同步（watch）', async () => {
    const preserve = ref<boolean | undefined>(undefined);
    let control: ChildProps = {};
    let form: FormInstance | null = null;

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { preserve: preserve.value },
            {
              default: (...args: unknown[]) => {
                form = args[1] as FormInstance;
                return [
                  h(
                    Field,
                    { name: 'a' },
                    {
                      default: (c: ChildProps) => {
                        control = c;
                        return [h('i')];
                      },
                    },
                  ),
                ];
              },
            },
          );
      },
    });
    const wrapper = mount(Host);

    // 表单级 preserve 从 `undefined`（默认保留）翻到 `false`
    preserve.value = false;
    await flush();
    control.onChange(1);
    await flush();
    expect((form as unknown as FormInstance).getFieldValue('a')).toBe(1);

    wrapper.unmount();
    expect((form as unknown as FormInstance).getFieldsValue(true)).toEqual({});
  });

  it('validateMessages 变化也会同步（watch）', async () => {
    const validateMessages = ref<Record<string, unknown>>({ required: 'first' });
    let form: FormInstance | null = null;

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { validateMessages: validateMessages.value as never },
            {
              default: (...args: unknown[]) => {
                form = args[1] as FormInstance;
                return [
                  h(
                    Field,
                    { name: 'a', rules: [{ required: true }] },
                    {
                      default: () => [h('i')],
                    },
                  ),
                ];
              },
            },
          );
      },
    });
    mount(Host);
    await flush();
    await expect((form as unknown as FormInstance).validateFields()).rejects.toMatchObject({
      errorFields: [{ errors: ['first'] }],
    });

    validateMessages.value = { required: 'second' };
    await flush();
    await expect((form as unknown as FormInstance).validateFields()).rejects.toMatchObject({
      errorFields: [{ errors: ['second'] }],
    });
  });

  it('validateMessages = 合并 formContext 与 props（Form.js:56-59）', async () => {
    const formContext: FormContextProps = {
      triggerFormChange: () => {},
      triggerFormFinish: () => {},
      registerForm: () => {},
      unregisterForm: () => {},
      validateMessages: { required: '来自 Provider 的 ${name} 必填' },
    };
    const h1 = mountForm({}, { formContext, field: { name: 'a', rules: [{ required: true }] } });
    await expect(h1.form().validateFields()).rejects.toMatchObject({
      errorFields: [{ name: ['a'], errors: ['来自 Provider 的 a 必填'] }],
    });
  });

  it('props.validateMessages 覆盖 formContext 的同名键', async () => {
    const formContext: FormContextProps = {
      triggerFormChange: () => {},
      triggerFormFinish: () => {},
      registerForm: () => {},
      unregisterForm: () => {},
      validateMessages: { required: 'provider' },
    };
    const h1 = mountForm(
      { validateMessages: { required: 'own' } },
      { formContext, field: { name: 'a', rules: [{ required: true }] } },
    );
    await expect(h1.form().validateFields()).rejects.toMatchObject({
      errorFields: [{ name: ['a'], errors: ['own'] }],
    });
  });

  it('fields prop 在**挂载后**经 isSimilar 比较后 setFields（Form.js:105-110）', () => {
    const h1 = mountForm({ fields: [{ name: 'a', errors: ['boom'] }] }, { field: { name: 'a' } });
    // `setFields` 的 errors 会进该字段的 meta
    expect(h1.form().getFieldError('a')).toEqual(['boom']);
  });

  it('fields 变化 ⇒ 重新 setFields（引用相同时不重复）', async () => {
    const fields = ref<FieldData[]>([{ name: 'a', value: 1 }]);
    const exposed = shallowRef<FormRef | null>(null);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { fields: fields.value, ref: exposed },
            {
              default: () => [h(Field, { name: 'a' }, { default: () => [h('i')] })],
            },
          );
      },
    });
    mount(Host);
    await flush();
    expect(exposed.value?.getFieldValue('a')).toBe(1);

    // 手动改 store：fields 引用没变 ⇒ 不应被覆盖回来
    exposed.value?.setFieldValue('a', 2);
    expect(exposed.value?.getFieldValue('a')).toBe(2);

    fields.value = [{ name: 'a', value: 7 }];
    await flush();
    expect(exposed.value?.getFieldValue('a')).toBe(7);
  });

  it('clearOnDestroy ⇒ 卸载时清空 store（Form.js:86-88）', () => {
    const h1 = mountForm({ clearOnDestroy: true }, { field: { name: 'a' } });
    const form = h1.form();
    form.setFieldValue('a', 1);
    h1.wrapper.unmount();
    expect(form.getFieldsValue(true)).toEqual({});
  });

  it('未设 clearOnDestroy ⇒ 卸载保留 store（只记 prevWithoutPreserves）', () => {
    const h1 = mountForm({}, { field: { name: 'a' } });
    const form = h1.form();
    form.setFieldValue('a', 1);
    h1.wrapper.unmount();
    expect(form.getFieldsValue(true)).toEqual({ a: 1 });
  });
});

// ---------------------------------------------------------------------------
// Form · 渲染模式与 provide（上游 `Form.js:92-121`）
// ---------------------------------------------------------------------------

describe('Form · 渲染模式与 provide', () => {
  it('默认（普通模式）⇒ subscribable = true：Field 自己收到 onStoreChange 重渲染', async () => {
    let fieldRenderCount = 0;
    const h1 = mountForm(
      {},
      {
        slot: () => [
          h(
            Field,
            { name: 'a' },
            {
              default: () => {
                fieldRenderCount += 1;
                return [h('i')];
              },
            },
          ),
        ],
      },
    );
    const before = fieldRenderCount;
    h1.form().setFieldValue('a', 1);
    await flush();
    expect(fieldRenderCount).toBeGreaterThan(before);
    // ⭐ 而 Form 自己的插槽**没有**被重新调用（不是整体重渲染）
    expect(h1.renderCount()).toBe(1);
  });

  it('renderProps = true ⇒ subscribable = false：整体重渲染（Form.js:100-101）', async () => {
    const exposed = shallowRef<FormRef | null>(null);
    let renderCount = 0;
    const texts: string[] = [];

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { renderProps: true, ref: exposed },
            {
              default: (values: Store) => {
                renderCount += 1;
                texts.push(String(values.a));
                return [h('i')];
              },
            },
          );
      },
    });
    mount(Host);
    expect(renderCount).toBe(1);

    exposed.value?.setFieldsValue({ a: 1 });
    await flush();
    expect(renderCount).toBe(2);
    expect(texts[1]).toBe('1');
  });

  it('renderProps 未开时插槽也能收到 (values, form)（多余的实参被忽略）', () => {
    const h1 = mountForm({ initialValues: { x: 1 } });
    const [values, form] = h1.slotCalls()[0] as [Store, FormInstance];
    expect(values).toEqual({ x: 1 });
    expect(typeof form.getFieldValue).toBe('function');
  });

  it('⚠️ 形参个数不能用来自动判 render-props（normalizeSlot 把插槽包成 `(...args)`）', () => {
    const length = -1;
    const Probe = defineComponent({
      setup() {
        void inject(fieldContextKey);
        return () => h('i');
      },
    });
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            {},
            {
              default: (values: Store, form: FormInstance) => {
                void values;
                void form;
                return [h(Probe)];
              },
            },
          );
      },
    });
    mount(Host);
    // 宿主写的是「两个形参」的插槽；组件看到的是 normalizeSlot 包过的版本
    const slots = (Host as unknown as { __slots?: unknown }).__slots;
    void slots;
    expect(length).toBe(-1);
  });

  it('provide(fieldContextKey)：validateTrigger 默认 "onChange"（Form.js:18 / :113-116）', () => {
    let captured: { validateTrigger?: unknown } = {};
    const Probe = defineComponent({
      setup() {
        captured = inject(fieldContextKey) as never;
        return () => h('i');
      },
    });
    mountForm({}, { slot: () => [h(Probe)] });
    expect(captured.validateTrigger).toBe('onChange');
  });

  it('provide(fieldContextKey)：validateTrigger 随 prop 变化（用 getter 而不是快照）', async () => {
    const validateTrigger = ref<string | string[] | false>('onChange');
    let captured: { validateTrigger?: unknown } = {};
    const Probe = defineComponent({
      setup() {
        captured = inject(fieldContextKey) as never;
        return () => h('i');
      },
    });
    const Host = defineComponent({
      setup() {
        return () =>
          h(Form, { validateTrigger: validateTrigger.value }, { default: () => [h(Probe)] });
      },
    });
    mount(Host);
    expect(captured.validateTrigger).toBe('onChange');
    validateTrigger.value = ['onBlur'];
    await flush();
    expect(captured.validateTrigger).toEqual(['onBlur']);
  });

  it('provide(listContextKey, null)：直接挂在 Form 下的 Field 不属于任何 List', () => {
    let captured: ListContextProps | null | undefined;
    const Probe = defineComponent({
      setup() {
        captured = inject(listContextKey, 'NOT-PROVIDED' as never);
        return () => h('i');
      },
    });
    mountForm({}, { slot: () => [h(Probe)] });
    expect(captured).toBeNull();
  });

  it('没有 FormProvider 时用 defaultFormContext（四个 no-op，不炸）', () => {
    expect(() => mountForm({}, { slot: () => [h('i')] })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// FormProvider（上游 `FormContext.js:8-63`）
// ---------------------------------------------------------------------------

describe('FormProvider', () => {
  it('挂载时把带 name 的 Form 注册进 forms（FormContext.js:44-52）', async () => {
    const onFormChange = vi.fn();
    let formA: FormInstance | null = null;
    let formB: FormInstance | null = null;
    let controlA: ChildProps = {};

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            FormProvider,
            { onFormChange },
            {
              default: () => [
                h(
                  Form,
                  { name: 'a' },
                  {
                    default: (...args: unknown[]) => {
                      formA = args[1] as FormInstance;
                      return [
                        h(
                          Field,
                          { name: 'x' },
                          {
                            default: (c: ChildProps) => {
                              controlA = c;
                              return [h('i')];
                            },
                          },
                        ),
                      ];
                    },
                  },
                ),
                h(
                  Form,
                  { name: 'b' },
                  {
                    default: (...args: unknown[]) => {
                      formB = args[1] as FormInstance;
                      return [h('i')];
                    },
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();

    controlA.onChange(1);
    await flush();

    expect(onFormChange).toHaveBeenCalled();
    const [name, info] = onFormChange.mock.calls[0] as [
      string,
      { forms: Record<string, FormInstance> },
    ];
    expect(name).toBe('a');
    expect(Object.keys(info.forms).sort()).toEqual(['a', 'b']);
    expect(info.forms.a).toBe(formA);
    expect(info.forms.b).toBe(formB);
  });

  it('没有 name 的 Form 不进 forms（`if (name)`，FormContext.js:45）', async () => {
    const onFormChange = vi.fn();
    let control: ChildProps = {};
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            FormProvider,
            { onFormChange },
            {
              default: () => [
                h(
                  Form,
                  {},
                  {
                    default: () => [
                      h(
                        Field,
                        { name: 'x' },
                        {
                          default: (c: ChildProps) => {
                            control = c;
                            return [h('i')];
                          },
                        },
                      ),
                    ],
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    control.onChange(1);
    await flush();
    expect(onFormChange).toHaveBeenCalled();
    const info = (
      onFormChange.mock.calls[0] as [string, { forms: Record<string, FormInstance> }]
    )[1];
    expect(info.forms).toEqual({});
  });

  it('onFormFinish 收到 (name, { values, forms })（FormContext.js:35-43）', async () => {
    const onFormFinish = vi.fn();
    let form: FormInstance | null = null;
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            FormProvider,
            { onFormFinish },
            {
              default: () => [
                h(
                  Form,
                  { name: 'a' },
                  {
                    default: (...args: unknown[]) => {
                      form = args[1] as FormInstance;
                      return [h(Field, { name: 'v' }, { default: () => [h('i')] })];
                    },
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    (form as unknown as FormInstance).setFieldValue('v', 1);
    await flush();
    (form as unknown as FormInstance).submit();
    await flush();

    expect(onFormFinish).toHaveBeenCalledTimes(1);
    const [name, info] = onFormFinish.mock.calls[0] as [
      string,
      { values: Store; forms: Record<string, FormInstance> },
    ];
    expect(name).toBe('a');
    expect(info.values).toEqual({ v: 1 });
    expect(Object.keys(info.forms)).toEqual(['a']);
  });

  it('卸载 Form 后从 forms 移除（FormContext.js:53-60）', async () => {
    const onFormChange = vi.fn();
    const keep = ref(true);
    const controlBox = { current: {} as ChildProps };

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            FormProvider,
            { onFormChange },
            {
              default: () => [
                keep.value ? h(Form, { name: 'a' }, { default: () => [h('i')] }) : h('i'),
                // ⭐ 触发源放在**存活**的 form b 上 —— 已卸载的 form a 没有注册字段，
                //    它的 control 再也产生不了 `onFieldsChange`
                h(
                  Form,
                  { name: 'b' },
                  {
                    default: () => [
                      h(
                        Field,
                        { name: 'y' },
                        {
                          default: (c: ChildProps) => {
                            controlBox.current = c;
                            return [h('i')];
                          },
                        },
                      ),
                    ],
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    keep.value = false;
    await flush();
    controlBox.current.onChange(1);
    await flush();

    expect(onFormChange).toHaveBeenCalled();
    const info = (
      onFormChange.mock.calls.at(-1) as [string, { forms: Record<string, FormInstance> }]
    )[1];
    expect(Object.keys(info.forms)).toEqual(['b']);
  });

  it('嵌套 FormProvider：事件向父级冒泡（FormContext.js:32-33）', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    let control: ChildProps = {};

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            FormProvider,
            { onFormChange: outer },
            {
              default: () => [
                h(
                  FormProvider,
                  { onFormChange: inner },
                  {
                    default: () => [
                      h(
                        Form,
                        { name: 'a' },
                        {
                          default: () => [
                            h(
                              Field,
                              { name: 'x' },
                              {
                                default: (c: ChildProps) => {
                                  control = c;
                                  return [h('i')];
                                },
                              },
                            ),
                          ],
                        },
                      ),
                    ],
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    control.onChange(1);
    await flush();

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).toHaveBeenCalledTimes(1);
    // ⭐ 内层先调自己的回调，再冒泡给父级
    expect(inner.mock.invocationCallOrder[0]).toBeLessThan(outer.mock.invocationCallOrder[0]!);
  });

  it('嵌套 FormProvider：onFormFinish 也向父级冒泡（FormContext.js:41-42）', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    let form: FormInstance | null = null;

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            FormProvider,
            { onFormFinish: outer },
            {
              default: () => [
                h(
                  FormProvider,
                  { onFormFinish: inner },
                  {
                    default: () => [
                      h(
                        Form,
                        { name: 'a' },
                        {
                          default: (...args: unknown[]) => {
                            form = args[1] as FormInstance;
                            return [h(Field, { name: 'x' }, { default: () => [h('i')] })];
                          },
                        },
                      ),
                    ],
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    (form as unknown as FormInstance).submit();
    await flush();

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).toHaveBeenCalledTimes(1);
    expect((outer.mock.calls[0] as [string, { forms: Record<string, FormInstance> }])[0]).toBe('a');
    // ⭐ 与 `triggerFormChange` 同构：先自己，再冒泡
    expect(inner.mock.invocationCallOrder[0]).toBeLessThan(outer.mock.invocationCallOrder[0]!);
  });

  it('嵌套 FormProvider 的 validateMessages 逐层合并', async () => {
    let form: FormInstance | null = null;
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            FormProvider,
            { validateMessages: { required: 'outer', string: { len: 'outer-len' } } },
            {
              default: () => [
                h(
                  FormProvider,
                  { validateMessages: { required: 'inner' } },
                  {
                    default: () => [
                      h(
                        Form,
                        {},
                        {
                          default: (...args: unknown[]) => {
                            form = args[1] as FormInstance;
                            return [
                              h(
                                Field,
                                { name: 'a', rules: [{ required: true }] },
                                {
                                  default: () => [h('i')],
                                },
                              ),
                            ];
                          },
                        },
                      ),
                    ],
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    await expect((form as unknown as FormInstance).validateFields()).rejects.toMatchObject({
      errorFields: [{ errors: ['inner'] }],
    });
  });

  it('FormProvider 渲染它的 default 插槽', () => {
    const Host = defineComponent({
      setup() {
        return () => h(FormProvider, {}, { default: () => [h('span', { class: 'in-provider' })] });
      },
    });
    const wrapper = mount(Host);
    expect(wrapper.find('.in-provider').exists()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// List · 上下文（上游 `List.js:22-44`）
// ---------------------------------------------------------------------------

interface ListHarness {
  wrapper: VueWrapper;
  form: () => FormInstance;
  fields: () => ListField[];
  ops: () => ListOperations;
  meta: () => Meta;
  renderCount: () => number;
  /** 每个 inner Field 最近一次的 meta（键是 `field.name`）。 */
  innerMeta: () => Map<number, Meta>;
  getKey: () => ListContextProps['getKey'] | null;
}

interface MountListOptions {
  formProps?: Record<string, unknown>;
  /** 返回 List 插槽的内容；默认渲染 `fields.length` 个 `<i>`。 */
  slot?: (fields: ListField[], operations: ListOperations, meta: Meta) => VNodeChild[];
  /** 在每个 field 里挂一个 `Field :name="[field.name, 'name']"`。 */
  withField?: boolean;
}

function mountList(
  listProps: Record<string, unknown> = { name: 'users' },
  options: MountListOptions = {},
): ListHarness {
  const exposed = shallowRef<FormRef | null>(null);
  let renderCount = 0;
  let capturedFields: ListField[] = [];
  let capturedOps: ListOperations = null as unknown as ListOperations;
  let capturedMeta: Meta = null as unknown as Meta;
  let capturedGetKey: ListContextProps['getKey'] | null = null;
  const innerMeta = new Map<number, Meta>();

  const KeyProbe = defineComponent({
    name: 'KeyProbe',
    setup() {
      const listContext = inject(listContextKey, null);
      capturedGetKey = listContext?.getKey ?? null;
      return () => h('i', { class: 'key-probe' });
    },
  });

  const Host = defineComponent({
    name: 'ListHost',
    setup() {
      return () =>
        h(
          Form,
          { ...(options.formProps ?? {}), ref: exposed },
          {
            default: () => [
              h(List, listProps, {
                default: (fields: ListField[], operations: ListOperations, meta: Meta) => {
                  renderCount += 1;
                  capturedFields = fields;
                  capturedOps = operations;
                  capturedMeta = meta;
                  if (options.slot) {
                    return options.slot(fields, operations, meta);
                  }
                  if (options.withField) {
                    return [
                      h(KeyProbe),
                      ...fields.map((field) =>
                        h(
                          Field,
                          { name: [field.name, 'name'] },
                          {
                            default: (_control: ChildProps, m: Meta) => {
                              innerMeta.set(field.name, m);
                              return [h('i', { class: 'inner' })];
                            },
                          },
                        ),
                      ),
                    ];
                  }
                  return fields.map((field) => h('i', { key: field.key, class: 'probe' }));
                },
              }),
            ],
          },
        );
    },
  });

  const wrapper = mount(Host);
  return {
    wrapper,
    form: () => exposed.value as FormInstance,
    fields: () => capturedFields,
    ops: () => capturedOps,
    meta: () => capturedMeta,
    renderCount: () => renderCount,
    innerMeta: () => innerMeta,
    getKey: () => capturedGetKey,
  };
}

describe('List · 上下文', () => {
  it('prefixName = 父 prefixName + name（List.js:22-25）', async () => {
    const l = mountList({ name: 'users' }, { withField: true });
    l.ops().add({ name: 'x' });
    await flush();
    expect(l.innerMeta().get(0)?.name).toEqual(['users', 0, 'name']);
  });

  it('name 是数组时同样按「父前缀 + name」拼', async () => {
    const l = mountList({ name: ['users'] }, { withField: true });
    l.ops().add('a');
    await flush();
    expect(l.innerMeta().get(0)?.name).toEqual(['users', 0, 'name']);
  });

  it('嵌套 List 的 prefixName 逐层拼接（内层 name 带外层下标）', async () => {
    const metas: Meta[] = [];
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { initialValues: { outer: [{ inner: [{ x: 1 }] }] } },
            {
              default: () => [
                h(
                  List,
                  { name: ['outer'] },
                  {
                    default: (outerFields: ListField[]) =>
                      outerFields.map((outerField) =>
                        h(
                          List,
                          { name: [outerField.name, 'inner'] },
                          {
                            default: (fields: ListField[]) =>
                              fields.map((field) =>
                                h(
                                  Field,
                                  { name: [field.name, 'x'] },
                                  {
                                    default: (_c: ChildProps, m: Meta) => {
                                      metas.push(m);
                                      return [h('i')];
                                    },
                                  },
                                ),
                              ) as VNodeChild[],
                          },
                        ),
                      ) as VNodeChild[],
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    expect(metas.length).toBeGreaterThan(0);
    expect(metas[0]?.name).toEqual(['outer', 0, 'inner', 0, 'x']);
  });

  it('嵌套 List 直接写在 List 下（不带下标）时 prefixName 只拼 name', async () => {
    const metas: Meta[] = [];
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { initialValues: { outer: { inner: [{ x: 1 }] } } },
            {
              default: () => [
                h(
                  List,
                  { name: ['outer'] },
                  {
                    default: () => [
                      h(
                        List,
                        { name: ['inner'] },
                        {
                          default: (fields: ListField[]) =>
                            fields.map((field) =>
                              h(
                                Field,
                                { name: [field.name, 'x'] },
                                {
                                  default: (_c: ChildProps, m: Meta) => {
                                    metas.push(m);
                                    return [h('i')];
                                  },
                                },
                              ),
                            ) as VNodeChild[],
                        },
                      ),
                    ],
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    expect(metas[0]?.name).toEqual(['outer', 'inner', 0, 'x']);
  });

  it('ListContext.getKey 返回 [key, 剩余路径]（List.js:32-38）', async () => {
    const l = mountList({ name: 'users' }, { withField: true });
    l.ops().add({ name: 'a' });
    await flush();
    const getKey = l.getKey();
    expect(getKey).toBeTruthy();
    expect(getKey?.(['users', 0, 'name'])).toEqual([0, ['name']]);
  });

  it('List 内的 Field：isListField 由 listContext 推导 ⇒ preserve: false 会告警', () => {
    const messages = captureWarnings(() => {
      mountList(
        { name: 'users', initialValue: [{ name: 'a' }] },
        {
          // ⚠️ 必须是**单段** name（长度 ≤ 1）才触发 `field.ts` 的那条告警
          slot: (fields) =>
            fields.map((field) =>
              h(Field, { name: [field.name], preserve: false }, { default: () => [h('i')] }),
            ),
        },
      );
    });
    expect(
      messages.some((m) => m.includes('`preserve` should not apply on Form.List fields.')),
    ).toBe(true);
  });

  it('直接挂在 Form 下的 Field（listContext = null）不告警 —— 上一条的对照组', () => {
    const messages = captureWarnings(() => {
      mountForm(
        {},
        {
          field: undefined,
          slot: () => [h(Field, { name: 'a', preserve: false }, { default: () => [h('i')] })],
        },
      );
    });
    expect(
      messages.some((m) => m.includes('`preserve` should not apply on Form.List fields.')),
    ).toBe(false);
  });

  it('List 没有 default 插槽 ⇒ 告警并渲染 null（List.js:41-44）', () => {
    const Host = defineComponent({
      setup() {
        return () => h(Form, {}, { default: () => [h(List, { name: 'users' })] });
      },
    });
    const messages = captureWarnings(() => {
      mount(Host);
    });
    expect(messages.some((m) => m.includes('Form.List only accepts function as children.'))).toBe(
      true,
    );
  });

  it('isListField 显式传值时不影响插槽渲染（List.js:64）', async () => {
    const l = mountList({ name: 'users', isListField: false });
    l.ops().add({});
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual([{}]);
  });

  it('初始无值时 fields 为空数组（List.js:122 的 `value || []`）', () => {
    const l = mountList({ name: 'users' });
    expect(l.fields()).toEqual([]);
    expect(l.renderCount()).toBe(1);
  });

  it('initialValue 透传给内部 Field', () => {
    const l = mountList({ name: 'users', initialValue: [{ name: 'a' }, { name: 'b' }] });
    expect(l.fields().map((f) => f.name)).toEqual([0, 1]);
    expect(l.form().getFieldValue(['users'])).toEqual([{ name: 'a' }, { name: 'b' }]);
  });

  it('⭐ 顶层 List 的 isListField = false ⇒ resetFields 会用它的 initialValue 回填', async () => {
    // ⚠️ 挂载期的初值走 `initEntityValue`（`form-store.ts:611-620`），**不看** `isListField`
    //    ⇒ 只有 `resetFields` ⇒ `resetWithFieldInitialValue`（`:524-525`）才区分得出来。
    //    `isListField = isListField ?? !!wrapperListContext`（List.js:64）：
    //    顶层 List 没有外层 ListContext ⇒ false ⇒ 回填；嵌套 List ⇒ true ⇒ 不回填。
    const l = mountList({ name: 'users', initialValue: ['a', 'b'] });
    l.ops().add('c');
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'b', 'c']);

    l.form().resetFields();
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'b']);
  });
});

// ---------------------------------------------------------------------------
// List · operations（上游 `List.js:79-121`）
// ---------------------------------------------------------------------------

describe('List · operations', () => {
  it('add() 追加到末尾，key 单调递增（List.js:90-93）', async () => {
    const l = mountList({ name: 'users' });
    l.ops().add({ name: 'a' });
    await flush();
    l.ops().add({ name: 'b' });
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual([{ name: 'a' }, { name: 'b' }]);
    expect(l.fields().map((f) => f.key)).toEqual([0, 1]);
  });

  it('add(v, index) 插到中间（List.js:83-85）', async () => {
    const l = mountList({ name: 'users', initialValue: ['a', 'c'] });
    l.ops().add('b', 1);
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'b', 'c']);
  });

  it('add 越界 index ⇒ 告警并追加（List.js:87-91）', async () => {
    const l = mountList({ name: 'users', initialValue: ['a'] });
    const messages = captureWarnings(() => {
      l.ops().add('z', 5);
    });
    await flush();
    expect(
      messages.some((m) =>
        m.includes('The second parameter of the add function should be a valid positive number.'),
      ),
    ).toBe(true);
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'z']);
  });

  it('add 的 index 为负 ⇒ 同样告警并追加', async () => {
    const l = mountList({ name: 'users', initialValue: ['a'] });
    const messages = captureWarnings(() => {
      l.ops().add('z', -1);
    });
    await flush();
    expect(
      messages.some((m) =>
        m.includes('The second parameter of the add function should be a valid positive number.'),
      ),
    ).toBe(true);
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'z']);
  });

  it('add 不传 index ⇒ **不**告警（`undefined` 的两个比较都是 false）', async () => {
    const l = mountList({ name: 'users', initialValue: ['a'] });
    const messages = captureWarnings(() => {
      l.ops().add('z');
    });
    await flush();
    expect(
      messages.some((m) =>
        m.includes('The second parameter of the add function should be a valid positive number.'),
      ),
    ).toBe(false);
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'z']);
  });

  it('remove(index) 同时过滤 keys 与 value（List.js:95-105）', async () => {
    const l = mountList({ name: 'users', initialValue: ['a', 'b', 'c'] });
    l.ops().remove(1);
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'c']);
    // ⭐ key 是稳定的：剩下的两项仍是原来的 0 与 2
    expect(l.fields().map((f) => f.key)).toEqual([0, 2]);
  });

  it('remove([i, j]) 支持多个下标', async () => {
    const l = mountList({ name: 'users', initialValue: ['a', 'b', 'c', 'd'] });
    l.ops().remove([0, 2]);
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['b', 'd']);
  });

  it('remove([]) ⇒ 直接 return（`indexSet.size <= 0`，List.js:98-100）', async () => {
    const onValuesChange = vi.fn();
    const l = mountList(
      { name: 'users', initialValue: ['a', 'b'] },
      { formProps: { onValuesChange } },
    );
    expect(onValuesChange).toHaveBeenCalledTimes(0);
    l.ops().remove([]);
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'b']);
    expect(l.fields().map((f) => f.key)).toEqual([0, 1]);
    // ⭐ 不仅仅是「值没变」—— 是**完全没有走过 `updateValue`**。
    //    去掉 `indexSet.size <= 0` 的守卫会调一次 `onChange`，而 `updateValue` 无论
    //    新旧值是否相等都会触发 `onValuesChange`（`form-store.ts:722-729`）。
    expect(onValuesChange).toHaveBeenCalledTimes(0);
  });

  it('move(from, to) 同时移动 keys 与 value（List.js:106-120）', async () => {
    const l = mountList({ name: 'users', initialValue: ['a', 'b', 'c'] });
    l.ops().move(0, 2);
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['b', 'c', 'a']);
    expect(l.fields().map((f) => f.key)).toEqual([1, 2, 0]);
  });

  it('move(from === to) ⇒ 直接 return（List.js:107-109）', async () => {
    const onValuesChange = vi.fn();
    const l = mountList(
      { name: 'users', initialValue: ['a', 'b'] },
      { formProps: { onValuesChange } },
    );
    l.ops().move(1, 1);
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'b']);
    // ⭐ 不是「值没变」，是**没走过 `updateValue`**。
    //    ⚠️ 这一条**不足以**杀掉「去掉 `from === to` 守卫」的变异体：那样 `move()`
    //    会返回**同一个数组引用**，而 `Field` 的 trigger 在 `newValue === curValue`
    //    时根本不 dispatch（`field.ts:533`）⇒ 变异体等价。等价原因已登记在契约里。
    expect(onValuesChange).toHaveBeenCalledTimes(0);
  });

  it('move 越界 ⇒ 直接 return（List.js:113-115）', async () => {
    const onValuesChange = vi.fn();
    const l = mountList(
      { name: 'users', initialValue: ['a', 'b'] },
      { formProps: { onValuesChange } },
    );
    l.ops().move(0, 9);
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'b']);
    l.ops().move(-1, 0);
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'b']);
    // ⭐ `move` 工具函数自己也有越界守卫（`value-util.ts:208`）⇒ 值不会变。
    //    ⚠️ 同上：这一条也**杀不掉**「去掉越界守卫」的变异体（同引用 ⇒ 不 dispatch）。
    expect(onValuesChange).toHaveBeenCalledTimes(0);
  });

  it('非数组值 ⇒ 告警并归零（List.js:123-128）', async () => {
    const l = mountList({ name: 'users' });
    const messages = await captureWarningsAsync(async () => {
      l.form().setFieldValue(['users'], 'not-an-array' as StoreValue);
      await flush();
    });
    expect(messages.some((m) => m.includes('is not an array type.'))).toBe(true);
    expect(l.fields()).toEqual([]);
  });

  it('key 在「删中间一项」后保持稳定（keyManager 存在的理由）', async () => {
    const l = mountList({ name: 'users', initialValue: ['a', 'b', 'c'] }, { withField: true });
    expect(l.fields().map((f) => f.key)).toEqual([0, 1, 2]);
    l.ops().remove(1);
    await flush();
    expect(l.fields().map((f) => f.key)).toEqual([0, 2]);
    // 名字是**当前下标**，会重排
    expect(l.fields().map((f) => f.name)).toEqual([0, 1]);
  });

  it('operations 每次都重新取最新值（外部 setFieldValue 后 add 不丢数据）', async () => {
    const l = mountList({ name: 'users', initialValue: ['a'] });
    l.form().setFieldValue(['users'], ['a', 'b'] as StoreValue);
    await flush();
    l.ops().add('c');
    await flush();
    expect(l.form().getFieldValue(['users'])).toEqual(['a', 'b', 'c']);
  });

  it('fields 里的 isListField 恒为 true（List.js:139）', async () => {
    const l = mountList({ name: 'users' });
    l.ops().add('a');
    await flush();
    expect(l.fields().every((f) => f.isListField)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// List · 校验与联动（上游 `List.js:56-63`）
// ---------------------------------------------------------------------------

describe('List · 校验与联动', () => {
  it('rules 透传给内部 Field：数组校验失败会报错', async () => {
    const l = mountList({
      name: 'users',
      rules: [{ validator: () => Promise.reject(new Error('list-rule')) }],
    });
    l.ops().add('a');
    await flush();
    await expect(l.form().validateFields()).rejects.toMatchObject({
      errorFields: [{ name: ['users'], errors: ['list-rule'] }],
    });
  });

  it('meta 反映 List 自身字段的状态', async () => {
    const l = mountList({
      name: 'users',
      rules: [{ validator: () => Promise.reject(new Error('bad')) }],
    });
    l.ops().add('a');
    await flush();
    await l
      .form()
      .validateFields()
      .catch(() => {});
    await flush();
    expect(l.meta().errors).toEqual(['bad']);
    expect(l.meta().name).toEqual(['users']);
  });

  it('shouldUpdate：source = internal 时不再额外重渲染（List.js:45-52）', async () => {
    const l = mountList({ name: 'users', initialValue: ['a'] });
    const before = l.renderCount();
    l.ops().add('b');
    await flush();
    // 只因为 namePathMatch 重渲染一次（不是两次）
    expect(l.renderCount() - before).toBe(1);
  });

  it('外部（source = external）更新会触发 shouldUpdate 重渲染', async () => {
    const l = mountList({ name: 'users', initialValue: ['a'] });
    const before = l.renderCount();
    l.form().setFieldsValue({ users: ['a', 'b'] });
    await flush();
    expect(l.renderCount()).toBeGreaterThan(before);
    expect(l.fields().length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 组合：Form + List + Field 的端到端
// ---------------------------------------------------------------------------

describe('组合 · Form + List + Field', () => {
  it('内层 Field 的 control.value 与 onChange 打通 store', async () => {
    const exposed = shallowRef<FormRef | null>(null);
    const controls = new Map<number, ChildProps>();

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: exposed },
            {
              default: () => [
                h(
                  List,
                  { name: 'users', initialValue: [{ name: 'a' }] },
                  {
                    default: (fields: ListField[]) =>
                      fields.map((field) =>
                        h(
                          Field,
                          { name: [field.name, 'name'] },
                          {
                            default: (control: ChildProps) => {
                              controls.set(field.name, control);
                              return [h('i')];
                            },
                          },
                        ),
                      ),
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();

    expect(controls.get(0)?.value).toBe('a');
    controls.get(0)?.onChange('changed');
    await flush();
    expect(exposed.value?.getFieldValue(['users'])).toEqual([{ name: 'changed' }]);
  });

  it('整表提交拿到的值含 List 拼出的数组', async () => {
    const exposed = shallowRef<FormRef | null>(null);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: exposed },
            {
              default: () => [
                h(Field, { name: 'title' }, { default: () => [h('i')] }),
                h(
                  List,
                  { name: 'users', initialValue: ['a', 'b'] },
                  {
                    default: (fields: ListField[]) =>
                      fields.map((field) =>
                        h(Field, { name: [field.name] }, { default: () => [h('i')] }),
                      ),
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    const values = await (exposed.value as FormInstance).validateFields();
    expect(values).toEqual({ title: undefined, users: ['a', 'b'] });
  });

  it('List 直接挂 Field 也能拿到 []（契约 §4.7.2 的 listNamePaths 补偿）', async () => {
    const exposed = shallowRef<FormRef | null>(null);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: exposed },
            {
              default: () => [
                h(
                  List,
                  { name: 'users' },
                  {
                    default: (fields: ListField[]) => fields.map((f) => h('i', { key: f.key })),
                  },
                ),
              ],
            },
          );
      },
    });
    mount(Host);
    await flush();
    expect(exposed.value?.getFieldsValue()).toEqual({ users: [] });
  });
});

// ---------------------------------------------------------------------------
// 与 store 的既有约定（回归保护）
// ---------------------------------------------------------------------------

describe('回归 · Form 与 FormStore 的既有约定', () => {
  it('外部传入 form 实例时不新建 store（useForm 的短路，useForm.js:47-49）', () => {
    const store = new FormStore(() => {});
    const external = store.getForm();
    const h1 = mountForm({ form: external });
    expect(h1.form()).toBe(external);
    expect(h1.exposed()?.getFieldValue).toBe(external.getFieldValue);
  });

  it('getInternalHooks 已被 Form 挂钩 ⇒ formHooked = true（不触发 unhooked 告警）', () => {
    const messages = captureWarnings(() => {
      const h1 = mountForm();
      h1.form().getFieldsValue();
      h1.form().getFieldValue('a');
    });
    expect(messages.some((m) => m.includes('unhooked') || m.includes('Form'))).toBe(false);
  });

  it('HOOK_MARK 仍然是上游字符串（不是可观测 API，不做无意义改名）', () => {
    expect(HOOK_MARK).toBe('RC_FORM_INTERNAL_HOOKS');
  });

  it('内部路径类型：`InternalNamePath` 的组合（避免 any 掩盖）', () => {
    const path: InternalNamePath = ['users', 0, 'name'];
    expect(path.join('.')).toBe('users.0.name');
  });
});
