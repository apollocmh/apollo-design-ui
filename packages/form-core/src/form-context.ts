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

const missingFormMessage = 'Can not find FormContext. Please make sure you wrap Field under Form.';

function warnMissingForm(): void {
  warning(false, missingFormMessage);
}

function emptyList(): [] {
  warnMissingForm();
  return [];
}

function emptyValue(): undefined {
  warnMissingForm();
  return undefined;
}

function untouched(): false {
  warnMissingForm();
  return false;
}

/**
 * 找不到 `FieldContext` 时的兜底实例：**所有方法都告警**。
 */
export const defaultFieldContext: InternalFormInstance = {
  getFieldValue: emptyValue,
  getFieldsValue: () => {
    warnMissingForm();
    return {};
  },
  getFieldError: emptyList,
  getFieldWarning: emptyList,
  getFieldsError: emptyList,
  isFieldsTouched: untouched,
  isFieldTouched: untouched,
  isFieldValidating: untouched,
  isFieldsValidating: untouched,
  resetFields: warnMissingForm,
  setFields: warnMissingForm,
  setFieldValue: warnMissingForm,
  setFieldsValue: warnMissingForm,
  validateFields: () => {
    warnMissingForm();
    return Promise.reject(new Error(missingFormMessage));
  },
  submit: warnMissingForm,
  getInternalHooks: () => {
    warnMissingForm();
    return null;
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
