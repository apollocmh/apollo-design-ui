/**
 * `FormProvider` —— 跨表单协调（批次 ③c）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/FormContext.js`（64 行，`FormProvider` 在 `:8-63`）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.11。
 *
 * ── ⚠️ 本文件**没有 Oracle**（契约 §7.0.1）────────────────────────────────────
 *
 * 上游用 `React.createContext` + `useRef({})` + `useContext`；期望值全部来自
 * **读上游源码 + 行为测试**，每条都标了行号。
 *
 * ── 两处「上游每次渲染重算，Vue 只算一次」的处置 ──────────────────────────────
 *
 * 1. **Provider value**：上游在**渲染体里**新建对象（每次渲染都是新引用）。
 *    Vue 的 `provide` 在 `setup()` 里只做一次，值本身也不是响应式容器
 *    （§6.4.1：谁该重渲染由 store 的显式订阅决定，不由 Vue 依赖追踪决定）。
 *    ⇒ 用 **getter** 保住「读的时候是最新值」这条语义（见下 `validateMessages`）。
 * 2. **`formsRef`**：上游用 `useRef` 存一个**对象**，`registerForm` 时整体替换
 *    （`formsRef.current = {...formsRef.current, [name]: form}`）。
 *    Vue 侧用 `let forms: Forms` 闭包变量 + 同样的整体替换 —— 回调里读到的
 *    都是**调用时**的 `forms`，与上游一致。
 *
 * ⚠️ 注意 `forms` 是**可变对象引用**：`onFormChange` 收到的 `info.forms` 是调用
 * 那一刻的快照对象（上游如此），不是实时视图。
 */

import type { PropType } from 'vue';
import { defineComponent, inject, provide } from 'vue';

import { defaultFormContext, formContextKey } from './form-context';
import type {
  FieldData,
  FormChangeInfo,
  FormFinishInfo,
  FormInstance,
  Forms,
  Store,
  ValidateMessages,
} from './form-types';

const formProviderProps = {
  validateMessages: { type: Object as PropType<ValidateMessages>, default: undefined },
  onFormChange: {
    type: Function as PropType<(name: string, info: FormChangeInfo) => void>,
    default: undefined,
  },
  onFormFinish: {
    type: Function as PropType<(name: string, info: FormFinishInfo) => void>,
    default: undefined,
  },
} as const;

/**
 * `FormProvider` —— 把多个 `Form` 的变更/完成事件**广播**到同一个回调。
 *
 * 用法（契约 §6.4.3）：
 *
 * ```vue
 * <FormProvider @form-change="onChange" @form-finish="onFinish">
 *   <Form name="a" />
 *   <Form name="b" />
 * </FormProvider>
 * ```
 *
 * ⭐ 只有**带 `name`** 的 `Form` 会进 `info.forms`（上游 `if (name)` 守卫，`FormContext.js:45`）。
 */
export const FormProvider = defineComponent({
  name: 'AFormProvider',
  inheritAttrs: false,
  props: formProviderProps,
  setup(props, { slots }) {
    const parentContext = inject(formContextKey, defaultFormContext);

    /**
     * ⭐ 上游用 `useRef({})` 且**整体替换**（`FormContext.js:46-51` / `:53-58`）。
     * 用 `let` + 整体替换保持同一语义：回调闭包读的是变量，不是某个快照。
     */
    let forms: Forms = {};

    const contextValue = {
      ...parentContext,

      /**
       * 上游在**每次渲染**重建这个对象（`FormContext.js:19-22`）。
       * Vue 侧 `provide` 只做一次 ⇒ 改用 getter，让 `props.validateMessages` /
       * 祖先 `validateMessages` 的变化仍能被**后挂载**的 `Form` 读到。
       */
      get validateMessages() {
        return { ...parentContext.validateMessages, ...props.validateMessages };
      },

      triggerFormChange: (name: string, changedFields: FieldData[]): void => {
        props.onFormChange?.(name, { changedFields, forms });
        parentContext.triggerFormChange(name, changedFields);
      },

      triggerFormFinish: (name: string, values: Store): void => {
        props.onFormFinish?.(name, { values, forms });
        parentContext.triggerFormFinish(name, values);
      },

      registerForm: (name: string, form: FormInstance): void => {
        if (name) {
          forms = { ...forms, [name]: form };
        }
        parentContext.registerForm(name, form);
      },

      unregisterForm: (name: string): void => {
        const nextForms = { ...forms };
        delete nextForms[name];
        forms = nextForms;
        parentContext.unregisterForm(name);
      },
    };

    provide(formContextKey, contextValue);

    return () => slots.default?.();
  },
});

export default FormProvider;
