/**
 * @apollo-design/form-core
 *
 * 表单状态机 + 字段校验引擎。替代 `@rc-component/form` 与 `@rc-component/async-validator`。
 *
 * 契约文档：`docs/foundation/form-core-contract.md`（**先于实现存在**）。
 *
 * ── ⚠️ 分批实现，本文件当前导出**批次 ①（校验引擎）+ ②（取值工具）+ ③a（状态机内核）** ──
 *
 * | 批次 | 内容 | 状态 |
 * |---|---|---|
 * | ① | 校验引擎：`Schema` + util + messages + 7 rule + 17 validator | ✅ 已实现 |
 * | ② | 取值工具：namePath 的 get/set/比较、`NameMap`、`validateMessages` 默认模板 | ✅ 已实现 |
 * | ③a | 状态机内核：`FormStore` + `useForm` + `useWatch` + `WatcherCenter` + 三个 Context | ✅ 已实现 |
 * | ③b | 字段编排：`validateRule`/`validateRules`（内部）+ `Field`（renderless） | ✅ 已实现 |
 * | ③c | 表单容器：`Form` + `FormProvider` + `List` | ✅ 已实现 |
 *
 * 分批理由见契约 §3。批次 ③ 的子批次拆分（③a/③b/③c）见 §3 的第二张表 ——
 * **每个子批次独立收口**，不合并验收。
 *
 * ⚠️ 批次 ③ **没有 Oracle**（契约 §7.0.1）：上游 `FormStore`/`useWatch`/`Field`
 * 都绑在 React 生命周期上，唯一能对拍的只有 `utils/asyncUtil.js` 的
 * `allPromiseFinish`（纯函数，见 §7.5）。其余全部是「读源码 + 行为测试」。
 *
 * ── 边界 ──────────────────────────────────────────────────────────────────────
 *
 * 本包**不产出任何 UI**（`Form.Item` 的布局、错误展示属 `ui`），
 * 不定义颜色/圆角/阴影，不产 CSS（R4）。
 */

// ---------------------------------------------------------------------------
// 批次③a 状态机内核
// ---------------------------------------------------------------------------
export { allPromiseFinish } from './async-util';
export { default as delayFrame } from './delay-frame';
// ---------------------------------------------------------------------------
// 批次③b 字段编排
// ---------------------------------------------------------------------------
// ⚠️ `validateRule` / `validateRules` **不导出** —— 上游 `es/index.d.ts` 也没有它们
//    （它们是 `Field` 的内部编排，契约 §4.7.8）。测试从 `../validate-util` 直接 import。
export { Field } from './field';
export { Form } from './form';
export {
  defaultFieldContext,
  defaultFormContext,
  fieldContextKey,
  formContextKey,
  HOOK_MARK,
  listContextKey,
} from './form-context';
export { FormProvider } from './form-provider';
export { FormStore } from './form-store';
// ---------------------------------------------------------------------------
// 批次③ 类型契约（上游 `interface.d.ts` + 各组件 `.d.ts` 的逐条映射）
// ⚠️ `ValidateMessages` / `ValidateMessage` 不在这里 —— 它们是批次① 的（同名同构），
//    已从 `./types` 导出；重复导出会撞键。
// ⚠️ `InternalNamePath` 同理，从 `./value-util` 导出（`form-types` 只是 re-export）。
// ---------------------------------------------------------------------------
export type {
  Callbacks,
  ChildProps,
  EventArgs,
  FieldCancelRegister,
  FieldData,
  FieldEntity,
  FieldEntityProps,
  FieldError,
  FieldMessage,
  FieldProps,
  FieldSlots,
  FieldState,
  FieldValidator,
  FilterFunc,
  FormChangeInfo,
  FormContextProps,
  FormFinishInfo,
  FormInstance,
  FormProps,
  FormProviderProps,
  FormProviderSlots,
  FormRef,
  FormRule,
  FormRuleType,
  FormSlots,
  Forms,
  GetFieldsValueConfig,
  InternalFieldData,
  InternalFieldProps,
  InternalFormInstance,
  InternalHooks,
  InternalValidateFields,
  InternalValidateOptions,
  ListContextProps,
  ListField,
  ListOperations,
  ListProps,
  ListSlots,
  Meta,
  MetaEvent,
  NamePath,
  NotifyInfo,
  RecursivePartial,
  ReducerAction,
  RuleError,
  RuleObject,
  RuleRender,
  ShouldUpdate,
  Store,
  StoreValue,
  ValidateErrorEntity,
  ValidateFields,
  ValidateOptions,
  ValidatorRule,
  ValuedNotifyInfo,
  WatchCallBack,
  WatchDependencies,
  WatchOptions,
} from './form-types';
export { isFormInstance } from './form-util';
export { List } from './list';
// ---------------------------------------------------------------------------
// 消息模板
// ---------------------------------------------------------------------------
export { messages, newMessages } from './messages';
// ---------------------------------------------------------------------------
// 批次② 取值工具（namePath / NameMap / validateMessages）
// ---------------------------------------------------------------------------
export { NameMap } from './name-map';
// ---------------------------------------------------------------------------
// ⭐ 公开的 NamePath 是**深推导**那个（`form-types.ts`），不是 value-util 里的简单联合
//    —— 依据是上游 `index.d.ts` 从 `interface.d.ts` 导出（见 form-types.ts 的注释）。
// ---------------------------------------------------------------------------
export type { DeepNamePath } from './name-path-type';
// ---------------------------------------------------------------------------
// 原子规则（7 个）
// ---------------------------------------------------------------------------
export {
  enumerable,
  getUrlRegex,
  patternRule,
  range,
  required as requiredRule,
  rules,
  type as typeRule,
  whitespace,
} from './rules';
// ---------------------------------------------------------------------------
// 主类
// ---------------------------------------------------------------------------
export { Schema } from './schema';
// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------
export type {
  ExecuteRule,
  ExecuteValidator,
  InternalRuleItem,
  InternalValidateMessages,
  Rule,
  RuleItem,
  Rules,
  RuleType,
  RuleValuePackage,
  SyncErrorType,
  SyncValidateResult,
  ValidateCallback,
  ValidateError,
  ValidateFieldsError,
  ValidateMessage,
  ValidateMessages,
  ValidateOption,
  ValidateResult,
  Validator,
  Value,
  Values,
} from './types';
export { useForm } from './use-form';
export { stringify, useWatch } from './use-watch';
// ---------------------------------------------------------------------------
// 纯工具
// ---------------------------------------------------------------------------
export {
  AsyncValidationError,
  asyncMap,
  complementError,
  convertFieldsError,
  deepMerge,
  format,
  isEmptyObject,
  isEmptyValue,
  warning,
} from './util';
export { defaultValidateMessages, replaceMessage } from './validate-messages';
// ---------------------------------------------------------------------------
// 组合校验器（17 个）
// ---------------------------------------------------------------------------
export { default as validators } from './validators';
export type { InternalNamePath } from './value-util';
export {
  cloneByNamePathList,
  containsNamePath,
  defaultGetValueFromEvent,
  getNamePath,
  getValue,
  isSimilar,
  matchNamePath,
  move,
  setValue,
  toArray as toNamePathArray,
} from './value-util';
export type { WatchFormProvider } from './watcher-center';
export { default as WatcherCenter, macroTask } from './watcher-center';

// ---------------------------------------------------------------------------
// 默认导出
// ---------------------------------------------------------------------------
import { Schema } from './schema';

export default Schema;
