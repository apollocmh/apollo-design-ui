/**
 * 三个 Context 的配对（批次 ③）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/{FieldContext,FormContext,ListContext}.js`。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7 与 §6.4.2。
 *
 * React 的 `React.createContext` → Vue 的 `InjectionKey` + `provide`/`inject`。
 * ⚠️ 与 React 的一处**语义差异**：`React.useContext` 返回 Provider 的**当前值**
 * （Provider 更新会让消费者重渲染），而 Vue 的 `provide/inject` **只沿父链解析一次**
 * —— 但 Vue 的 `provide` 值本身是响应式的（如果传 ref/reactive）。
 * 这里三个 Context 的值都是**普通对象**（不含响应式容器），因为
 * 「谁该重渲染」由 `FormStore` 的显式订阅决定，不由 Vue 的依赖追踪决定（§6.4.1）。
 */

import { warning } from '@apollo-design/utils';
import type { InjectionKey } from 'vue';

import type { FormContextProps, InternalFormInstance, ListContextProps } from './form-types';

/** ⭐ 保持上游字符串（不是可观测 API，不做无意义改名）。 */
export const HOOK_MARK = 'RC_FORM_INTERNAL_HOOKS';

/**
 * 默认值里的「告警桩」。
 *
 * ⚠️ 返回类型必须声明成 **`never`**，不能写 `void`/`undefined`：
 * TS 的可赋值性规则只允许「返回 `void` 的函数」赋给「返回 `void` 的函数类型」，
 * 而这里的方法签名是 `getFieldError(): FieldMessage[]` / `validateFields(): Promise<X>`
 * 等**有返回值**的形态。`never` 可赋给一切，是表达「这个桩永远给不出值」的标准写法。
 *
 * ⚠️ 运行时它**真的返回 `undefined`（不抛错）** —— 与上游一致：
 * 字段脱离 `Form` 使用时只告警并静默返回，让「组件先渲染、Form 后挂载」的时序不炸。
 * 唯一用到的类型层面手段是末尾那个 `as never`（不是 `as any`，也不放宽任何断言）。
 */
function warnStub(): never {
  warning(false, 'Can not find FormContext. Please make sure you wrap Field under Form.');
  return undefined as never;
}

/**
 * 找不到 `FieldContext` 时的兜底实例：**所有方法都告警**。
 */
export const defaultFieldContext: InternalFormInstance = {
  getFieldValue: warnStub,
  getFieldsValue: warnStub,
  getFieldError: warnStub,
  getFieldWarning: warnStub,
  getFieldsError: warnStub,
  isFieldsTouched: warnStub,
  isFieldTouched: warnStub,
  isFieldValidating: warnStub,
  isFieldsValidating: warnStub,
  resetFields: warnStub,
  setFields: warnStub,
  setFieldValue: warnStub,
  setFieldsValue: warnStub,
  validateFields: warnStub,
  submit: warnStub,
  getInternalHooks: () => {
    warnStub();
    return {
      dispatch: warnStub,
      initEntityValue: warnStub,
      registerField: warnStub,
      useSubscribe: warnStub,
      setInitialValues: warnStub,
      destroyForm: warnStub,
      setCallbacks: warnStub,
      registerWatch: warnStub,
      getFields: warnStub,
      setValidateMessages: warnStub,
      setPreserve: warnStub,
      getInitialValue: warnStub,
    };
  },
};

/**
 * 找不到 `FormContext` 时的兜底：四个 no-op。
 *
 * ⭐ 注意 `validateMessages` 是 `undefined`（不是 `{}`）—— `Form` 合并时用
 * `{...formContext.validateMessages, ...validateMessages}`，`undefined` 展开是空，
 * 与上游一致。
 */
export const defaultFormContext: FormContextProps = {
  triggerFormChange: () => {},
  triggerFormFinish: () => {},
  registerForm: () => {},
  unregisterForm: () => {},
};

export const fieldContextKey: InjectionKey<InternalFormInstance> = Symbol(
  'apollo-form-field-context',
);

export const formContextKey: InjectionKey<FormContextProps> = Symbol('apollo-form-context');

export const listContextKey: InjectionKey<ListContextProps | null> = Symbol(
  'apollo-form-list-context',
);
