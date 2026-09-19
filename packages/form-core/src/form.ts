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
 * | `setValidateMessages(...)` | `setup()` 里调一次 | 合并源是 `props.validateMessages` 与**注入的** `formContext`（普通对象，非响应式）⇒ 一次即可 |
 * | `setCallbacks({...})` | `setup()` 里一次 + 四个回调的 `watch` | 回调 prop 是父组件可能换掉的闭包 ⇒ 必须 watch |
 * | `setPreserve(preserve)` | `setup()` 里一次 + `watch` | 同上（表单级 `preserve` 影响字段注销行为） |
 * | `setInitialValues(v, !mountRef)` | `setup()` 里 `init=true` 一次 + `watch` 补 `init=false` | 上游有 `mountRef` 判「是否首次渲染」 |
 * | `isSimilar(prevFields, fields)` ⇒ `setFields` | `onMounted` 里跑首次 + `watch(flush:'post')` | 上游是 `useEffect`（**挂载后**执行），所以首次也必须是挂载后 |
 *
 * ── 两处 Vue-native 的对应物 ──────────────────────────────────────────────────
 *
 * - `React.useImperativeHandle(ref, () => ({...formInstance, nativeElement}))`
 *   ⇒ `expose()`（差异 4）。`nativeElement` 用 **getter** 表达「读的时候是当前元素」，
 *   因为 `expose()` 也只做一次，而 `ref` 是挂载后才填上的。
 * - `FieldContext.Provider value={{...formInstance, validateTrigger}}`
 *   ⇒ `provide()` + **getter**（`validateTrigger` 是 prop，可能变）。
 */

import type { Component, PropType } from 'vue';
import {
  defineComponent,
  h,
  inject,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  watch,
} from 'vue';

import {
  defaultFormContext,
  fieldContextKey,
  formContextKey,
  HOOK_MARK,
  listContextKey,
} from './form-context';
import type {
  Callbacks,
  FieldData,
  FormInstance,
  InternalFormInstance,
  Store,
  ValidateMessages,
} from './form-types';
import { useForm } from './use-form';
import { isSimilar } from './value-util';

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
  /** ⚠️ 以下四个含 `Boolean` ⇒ **必须**显式 `default: undefined`（PITFALLS 46）。 */
  preserve: { type: Boolean, default: undefined },
  clearOnDestroy: { type: Boolean, default: undefined },
  onValuesChange: { type: Function as PropType<Callbacks['onValuesChange']>, default: undefined },
  onFieldsChange: { type: Function as PropType<Callbacks['onFieldsChange']>, default: undefined },
  onFinish: { type: Function as PropType<Callbacks['onFinish']>, default: undefined },
  onFinishFailed: { type: Function as PropType<Callbacks['onFinishFailed']>, default: undefined },
} as const;

/**
 * `Form` —— 表单容器（provider + 原生 `<form>` 语义）。
 *
 * 用法（契约 §6.4.3）：
 *
 * ```vue
 * <Form :form="form" :initial-values="{ a: 1 }" @finish="onFinish">
 *   <Field :name="['a']" v-slot="(control)"><input v-bind="control" /></Field>
 * </Form>
 * ```
 *
 * ⭐ `component: false` ⇒ 不产容器元素（只渲染插槽内容 + 两个 `provide`）。
 */
export const Form = defineComponent({
  name: 'AForm',
  inheritAttrs: false,
  props: formProps,
  setup(props, { slots, attrs, expose }) {
    const formContext = inject(formContextKey, defaultFormContext);

    // ⭐ `useForm` 的 `forceRootUpdate` 落在**本实例**的 `$forceUpdate()` 上
    //    （契约 §6.4.1 的订正）—— render-props 模式下全量重渲染靠它。
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
    const hooks = internalForm.getInternalHooks(HOOK_MARK)!;

    /** `useImperativeHandle` 里的 `nativeElementRef.current`（差异 4）。 */
    const nativeElement = shallowRef<HTMLElement | null>(null);

    /**
     * 上游允许 `name` 为 `undefined`（`registerForm(undefined, form)` 是 no-op，
     * `FormProvider` 的 `if (name)` 守卫会跳过）。Vue 侧的类型是 `string`，
     * 用 `''` 表达「无名」—— 两处的判据都是真值，语义一致。
     */
    const formName = (): string => props.name ?? '';

    // ── 把 props 灌进 store（上游 `Form.js:56-76`）─────────────────────────────

    const syncCallbacks = (): void => {
      hooks.setCallbacks({
        onValuesChange: props.onValuesChange,
        onFieldsChange: (changedFields, ...rest) => {
          formContext.triggerFormChange(formName(), changedFields);
          props.onFieldsChange?.(changedFields, ...rest);
        },
        onFinish: (values) => {
          formContext.triggerFormFinish(formName(), values);
          props.onFinish?.(values);
        },
        onFinishFailed: props.onFinishFailed,
      });
    };

    hooks.setValidateMessages({ ...formContext.validateMessages, ...props.validateMessages });
    syncCallbacks();
    hooks.setPreserve(props.preserve);

    watch(
      () => [props.onValuesChange, props.onFieldsChange, props.onFinish, props.onFinishFailed],
      syncCallbacks,
    );
    watch(
      () => props.preserve,
      (preserve) => hooks.setPreserve(preserve),
    );
    watch(
      () => props.validateMessages,
      () =>
        hooks.setValidateMessages({ ...formContext.validateMessages, ...props.validateMessages }),
    );

    // ── 初值（上游 `Form.js:79-83` 的 `mountRef`）──────────────────────────────
    // 首次 `init = true`（把初值灌进 store）；之后 `init = false`（只换 `initialValues`）。
    hooks.setInitialValues(props.initialValues, true);
    watch(
      () => props.initialValues,
      (initialValues) => hooks.setInitialValues(initialValues, false),
    );

    // ── `fields` prop（上游 `Form.js:104-110` 的 `useEffect`）──────────────────
    // ⚠️ 上游是 effect ⇒ **挂载后**才跑首次。Vue 侧对应 `onMounted` + `flush:'post'`。
    let prevFields: FieldData[] | undefined;
    const applyFields = (fields: FieldData[] | undefined): void => {
      if (!isSimilar(prevFields ?? [], fields ?? [])) {
        formInstance.setFields(fields ?? []);
      }
      prevFields = fields;
    };
    onMounted(() => {
      applyFields(props.fields);
    });
    watch(() => props.fields, applyFields, { flush: 'post' });

    // ── 注册进 FormContext（上游 `Form.js:48-53` 的 `useEffect`）───────────────
    onMounted(() => {
      formContext.registerForm(formName(), formInstance);
    });
    onUnmounted(() => {
      formContext.unregisterForm(formName());
    });

    // ── 卸载（上游 `Form.js:86-88`）───────────────────────────────────────────
    onUnmounted(() => {
      hooks.destroyForm(props.clearOnDestroy);
    });

    // ── 渲染模式（上游 `Form.js:92-101` 的 `typeof children === 'function'`）───
    // ⚠️ 无法自动判定（差异 13），只能看 `renderProps` prop。
    const childrenRenderProps = props.renderProps === true;
    hooks.useSubscribe(!childrenRenderProps);

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

    expose({
      ...formInstance,
      get nativeElement() {
        return nativeElement.value;
      },
    });

    return () => {
      // ⭐ 无论哪种模式都把 `(values, form)` 传下去：非 render-props 的插槽
      //    忽略多余实参，代价为零；而 SFC 的 `v-slot` 拿不到形参个数（差异 13）
      //    ⇒ 「只在 render-props 模式传参」会让那种写法收到 `undefined`。
      const values = formInstance.getFieldsValue(true);
      const children = slots.default?.(values, formInstance) ?? [];

      if (props.component === false) {
        return children;
      }

      return h(
        props.component,
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
            (attrs.onReset as ((e: Event) => void) | undefined)?.(event);
          },
        },
        children,
      );
    };
  },
});

export default Form;
