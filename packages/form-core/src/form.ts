/**
 * `Form` —— 表单容器（批次 ③c）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/Form.js`（138 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.11。
 *
 * ── ⚠️ 本文件**没有 Oracle**（契约 §7.0.1）────────────────────────────────────
 *
 * 上游用 `useRef` / `useImperativeHandle` / `useEffect` / `useMemo` / `useContext`，
 * 全部绑 React；期望值来自**读上游源码 + 行为测试**，每条都标了行号。
 *
 * ── 三处「上游每次渲染重算，Vue 只算一次」的处置（⭐ 本文件最需要解释的部分）────
 *
 * React 的函数组件体**每次渲染都重跑**，所以上游把「把 props 灌进 store」写成
 * 渲染体里的裸调用（`Form.js:56-76`）。Vue 的 `setup()` **一个实例只跑一次**
 * ⇒ 必须有对应的处置，否则「父组件换了一个 inline 回调」这种合法用法会拿到旧闭包。
 *
 * | 上游（渲染体里每次跑） | 我们 | 理由 |
 * |---|---|---|
 * | `setValidateMessages(...)` | `watchEffect` 跟踪全部合并源 | 父级消息 getter、props 替换及深更新都需要同步到同一表单 store |
 * | `setCallbacks({...})` | 一次登记 Vue emit 桥 | Vue emit 每次读取当前事件监听器 |
 * | `setPreserve(preserve)` | `setup()` 里一次 + `watch` | 同上（表单级 `preserve` 影响字段注销行为） |
 * | `setInitialValues(v, !mountRef)` | `setup()` 里 `init=true` 一次 + `watch` 补 `init=false` | 上游有 `mountRef` 判「是否首次渲染」 |
 * | `fields` ⇒ `setFields` | `onMounted` 首次 + `watch(deep:true, flush:'post')` | 首次在字段登记后应用，原地字段更新也同步 |
 *
 * ── 两处 Vue-native 的对应物 ──────────────────────────────────────────────────
 *
 * - `React.useImperativeHandle(ref, () => ({...formInstance, nativeElement}))`
 *   ⇒ `expose()`（差异 4）。`nativeElement` 用 **getter** 表达「读的时候是当前元素」，
 *   因为 `expose()` 也只做一次，而 `ref` 是挂载后才填上的。
 * - `FieldContext.Provider value={{...formInstance, validateTrigger}}`
 *   ⇒ `provide()` + **getter**（`validateTrigger` 是 prop，可能变）。
 */

import type { Component, ComponentPublicInstance, PropType, SlotsType } from 'vue';
import {
  defineComponent,
  h,
  inject,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowRef,
  watch,
  watchEffect,
} from 'vue';

import {
  defaultFormContext,
  fieldContextKey,
  formContextKey,
  HOOK_MARK,
  listContextKey,
} from './form-context';
import type {
  FieldData,
  FormInstance,
  FormRef,
  FormSlots,
  InternalFormInstance,
  Store,
  ValidateErrorEntity,
  ValidateMessages,
} from './form-types';
import { useForm } from './use-form';

const formProps = {
  name: { type: String, default: undefined },
  initialValues: { type: Object as PropType<Store>, default: undefined },
  fields: { type: Array as PropType<FieldData[]>, default: undefined },
  form: { type: Object as PropType<FormInstance>, default: undefined },
  component: {
    type: [String, Boolean, Object, Function] as PropType<false | string | Component>,
    default: 'form',
  },
  validateMessages: { type: Object as PropType<ValidateMessages>, default: undefined },
  validateTrigger: {
    type: [String, Array, Boolean] as PropType<string | string[] | false>,
    default: 'onChange',
  },
  /**
   * ⭐ 上游 `typeof children === 'function'` 的**显式替代**（差异 13）。
   *
   * `React` 能直接判「children 是不是函数」；Vue 的插槽**永远**是函数，
   * 而且拿不到「它声明了几个形参」：
   *
   * - `normalizeSlot()` 会把**每一个**插槽包成 `(...args) => normalizeSlotValue(rawSlot(...args))`
   *   （`@vue/runtime-core@3.5.42` `runtime-core.cjs.js:5340-5354`，已核对）；
   * - `withCtx()` 的包装体同样是 `(...args) => ...`（同文件 `:696`）。
   *
   * ⇒ `slots.default.length` **恒为 0**，「看形参个数」这条路完全走不通。
   * 于是 render-props 模式只能**显式声明**（默认 `false` = 普通子组件模式，
   * 逐字段订阅，是更安全的一侧）。
   */
  renderProps: { type: Boolean, default: undefined },
  /** 含 `Boolean` ⇒ 显式 `default: undefined`，保留继承语义。 */
  preserve: { type: Boolean, default: undefined },
  clearOnDestroy: { type: Boolean, default: undefined },
} as const;

/**
 * `Form` —— 表单容器（provider + 原生 `<form>` 语义）。
 *
 * 用法（契约 §6.4.3）：
 *
 * ```vue
 * <Form :form="form" :initial-values="{ a: 1 }" @finish="onFinish">
 *   <Field :name="['a']" v-slot="{ control }"><input v-bind="control" /></Field>
 * </Form>
 * ```
 *
 * ⭐ `component: false` ⇒ 不产容器元素（只渲染插槽内容 + 两个 `provide`）。
 */
export const Form = defineComponent({
  name: 'AForm',
  inheritAttrs: false,
  props: formProps,
  slots: Object as SlotsType<FormSlots>,
  emits: {
    valuesChange: (_changedValues: Store, _values: Store) => true,
    fieldsChange: (_changedFields: FieldData[], _allFields: FieldData[]) => true,
    finish: (_values: Store) => true,
    finishFailed: (_errorInfo: ValidateErrorEntity) => true,
  },
  setup(props, { slots, attrs, expose, emit }) {
    const formContext = inject(formContextKey, defaultFormContext);

    // 表单实例可以从外部创建；当前根通过下方版本 Ref 独立订阅。
    const [formInstance] = useForm(props.form);

    /**
     * `useForm` 的公开签名是 `FormInstance`（与上游同构，`useForm.d.ts`），
     * 而 `getInternalHooks` 只在 `InternalFormInstance` 上。`Form` 是**唯一**
     * 需要内部挂钩的官方消费方 —— 用 `HOOK_MARK` 取，取不到就已经先告警了。
     */
    const internalForm = formInstance as InternalFormInstance;
    // ⚠️ `getInternalHooks` 只在钥匙**不是** `HOOK_MARK` 时返回 `null`（并告警）。
    //    这里传的就是 `HOOK_MARK` ⇒ 非空是**构造保证**，不是假设。
    //    写成 `if (!hooks) throw` 会多出一条永不可达的分支（覆盖率假象），故用 `!`。
    // biome-ignore lint/style/noNonNullAssertion: HOOK_MARK 钥匙下 getInternalHooks 非空是构造保证（见上注释）；加 if (!hooks) throw 会多出永不可达分支（覆盖率假象）
    const hooks = internalForm.getInternalHooks(HOOK_MARK)!;

    /** `useImperativeHandle` 里的 `nativeElementRef.current`（差异 4）。 */
    const nativeElement = shallowRef<Element | ComponentPublicInstance | null>(null);
    const version = shallowRef(0);

    /**
     * 上游允许 `name` 为 `undefined`（`registerForm(undefined, form)` 是 no-op，
     * `FormProvider` 的 `if (name)` 守卫会跳过）。Vue 侧的类型是 `string`，
     * 用 `''` 表达「无名」—— 两处的判据都是真值，语义一致。
     */
    const formName = (): string => props.name ?? '';

    // ── 把 props 灌进 store（上游 `Form.js:56-76`）─────────────────────────────

    hooks.setCallbacks({
      onValuesChange: (changedValues, values) => emit('valuesChange', changedValues, values),
      onFieldsChange: (changedFields, allFields) => {
        formContext.triggerFormChange(formName(), changedFields);
        emit('fieldsChange', changedFields, allFields);
      },
      onFinish: (values) => {
        formContext.triggerFormFinish(formName(), values);
        emit('finish', values);
      },
      onFinishFailed: (errorInfo) => emit('finishFailed', errorInfo),
    });
    hooks.setPreserve(props.preserve);
    watch(
      () => props.preserve,
      (preserve) => hooks.setPreserve(preserve),
    );
    watchEffect(() => {
      hooks.setValidateMessages({ ...formContext.validateMessages, ...props.validateMessages });
    });

    // ── 初值（上游 `Form.js:79-83` 的 `mountRef`）──────────────────────────────
    // 首次 `init = true`（把初值灌进 store）；之后 `init = false`（只换 `initialValues`）。
    hooks.setInitialValues(props.initialValues, true);
    watch(
      () => props.initialValues,
      (initialValues) => hooks.setInitialValues(initialValues, false),
    );

    // ── `fields` prop（上游 `Form.js:104-110` 的 `useEffect`）──────────────────
    // ⚠️ 上游是 effect ⇒ **挂载后**才跑首次。Vue 侧对应 `onMounted` + `flush:'post'`。
    const applyFields = (fields: FieldData[] | undefined): void => {
      formInstance.setFields(fields ?? []);
    };
    onMounted(() => {
      applyFields(props.fields);
    });
    watch(() => props.fields, applyFields, { deep: true, flush: 'post' });

    // ── 注册进 FormContext（上游 `Form.js:48-53` 的 `useEffect`）───────────────
    onMounted(() => {
      formContext.registerForm(formName(), formInstance);
    });
    watch(
      () => props.name,
      (name, previousName) => {
        formContext.unregisterForm(previousName ?? '');
        formContext.registerForm(name ?? '', formInstance);
      },
      { flush: 'post' },
    );
    onBeforeUnmount(() => {
      formContext.unregisterForm(formName());
    });

    // ── 卸载（上游 `Form.js:86-88`）───────────────────────────────────────────
    let cancelRootSubscription: (() => void) | undefined;
    onBeforeUnmount(() => {
      cancelRootSubscription?.();
      hooks.destroyForm(props.clearOnDestroy);
    });

    // ── 渲染模式（上游 `Form.js:92-101` 的 `typeof children === 'function'`）───
    // ⚠️ 无法自动判定（差异 13），只能看 `renderProps` prop。
    watch(
      () => props.renderProps,
      (renderProps) => {
        cancelRootSubscription?.();
        cancelRootSubscription = hooks.useSubscribe(renderProps !== true, () => {
          version.value += 1;
        });
      },
      { immediate: true, flush: 'sync' },
    );

    // ── 两个 provide（上游 `Form.js:113-121` 的两层 Provider）─────────────────
    const fieldContextValue: InternalFormInstance = {
      ...internalForm,
      /** `useMemo(..., [formInstance, validateTrigger])` ⇒ getter。 */
      get validateTrigger() {
        return props.validateTrigger;
      },
    };
    provide(fieldContextKey, fieldContextValue);
    // ⭐ `Form` 重置 `ListContext` —— 直接挂在 `Form` 下的 `Field` 不属于任何 List。
    provide(listContextKey, null);

    const exposed: FormRef = {
      getFieldValue: formInstance.getFieldValue,
      getFieldsValue: formInstance.getFieldsValue,
      getFieldError: formInstance.getFieldError,
      getFieldWarning: formInstance.getFieldWarning,
      getFieldsError: formInstance.getFieldsError,
      isFieldsTouched: formInstance.isFieldsTouched,
      isFieldTouched: formInstance.isFieldTouched,
      isFieldValidating: formInstance.isFieldValidating,
      isFieldsValidating: formInstance.isFieldsValidating,
      resetFields: formInstance.resetFields,
      setFields: formInstance.setFields,
      setFieldValue: formInstance.setFieldValue,
      setFieldsValue: formInstance.setFieldsValue,
      validateFields: formInstance.validateFields,
      submit: formInstance.submit,
      scrollToField: formInstance.scrollToField,
      focusField: formInstance.focusField,
      getFieldInstance: formInstance.getFieldInstance,
      get nativeElement() {
        const instance = nativeElement.value;
        const element: unknown = instance && '$el' in instance ? instance.$el : instance;
        return typeof HTMLElement !== 'undefined' && element instanceof HTMLElement
          ? element
          : null;
      },
    };
    expose(exposed);

    return () => {
      void version.value;
      // 两种订阅模式使用相同的具名作用域；renderProps 仅决定更新范围。
      const values = formInstance.getFieldsValue(true);
      const children = slots.default?.({ values, form: formInstance }) ?? [];

      if (props.component === false) {
        return children;
      }

      return h(
        props.component,
        mergeProps(
          {
            ...attrs,
            ref: nativeElement,
            onSubmit: (event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              formInstance.submit();
            },
            onReset: (event: Event) => {
              event.preventDefault();
              formInstance.resetFields();
            },
          },
          { onReset: attrs.onReset },
        ),
        typeof props.component === 'string' ? children : { default: () => children },
      );
    };
  },
});

export default Form;
