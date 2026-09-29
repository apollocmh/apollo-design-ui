// biome-ignore-all lint/suspicious/noExplicitAny: 本文件是上游 `interface.d.ts`（276 行）
// + `Field.d.ts` / `Form.d.ts` / `List.d.ts` / `FormContext.d.ts` / `ListContext.d.ts` /
// `useForm.d.ts` 的**逐条映射**。上游多处用 `any` 表达「任意值 / 任意形态」：
//   - `StoreValue = any` —— `transform` / `normalize` 可以把任何东西变成任何东西；
//   - `NamePath<T> = DeepNamePath<T>` 的默认泛型是 `any`（分布语义，见 name-path-type.ts）；
//   - `getFieldsValue` 是三种重载的交集，后两种返回 `any`；
//   - `ChildProps` 是动态受控 props 的索引签名。
// 收紧成 `unknown` 会让上述位置的合法用法编译失败（**那是放宽标准而不是遵守 H10**）。
// 逐条理由见各处的行内注释与 `docs/foundation/form-core-contract.md` §6.4。

/**
 * 批次 ③（状态机）的类型契约。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/interface.d.ts`（276 行）
 * + `es/Field.d.ts`（54）+ `es/Form.d.ts`（22）+ `es/List.d.ts`（23）
 * + `es/FormContext.d.ts`（27）+ `es/ListContext.d.ts`（8）+ `es/hooks/useForm.d.ts`（105）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7 与 §6.4。
 *
 * ── ⚠️ 与上游 .d.ts 的**命名冲突**（本包是单包，上游是分层）────────────────────
 *
 * 上游 `@rc-component/form` 与 `@rc-component/async-validator` 是两个包，
 * 各有一个 `Rule` / `RuleType` / `Validator`。本包合并到一个导出面会撞键，
 * 所以**表单层的三个名字加前缀**（仅命名，运行时语义不变）：
 *
 * | 上游（form 层） | 我们 | 与批次① 的谁撞 |
 * |---|---|---|
 * | `Rule` = `RuleObject \| RuleRender` | `FormRule` | `Rule` = `RuleItem \| RuleItem[]` |
 * | `RuleType`（14 个） | `FormRuleType` | `RuleType`（17 个，含 `pattern`/`any`） |
 * | `Validator`（callback 式） | `FieldValidator` | `Validator`（`ExecuteValidator \| …`） |
 *
 * ⚠️ 表单层的 `ValidateMessages` 与批次① 的**同名同构**（差别只在模板文本用
 * `${name}` 还是 `%s`，契约 §4.6.5）⇒ 本文件只 re-export，不再定义第二份。
 *
 * ── ⚠️ 与上游 .d.ts 的**类型修正**（运行时不变，只把声明写对）──────────────────
 *
 * 1. `InternalHooks.registerField` 上游声明 `(entity) => () => void`，运行时返回的注销函数
 *    **接受三个参数**（`Field.js:99`）⇒ 改成 `FieldCancelRegister`。
 * 2. `FieldEntity.props` 上游只列 4 个键，实际还会读 `preserve`/`isListField`/`isList` ⇒ 补齐。
 * 3. 错误消息上游声明 `string[]`，运行时允许 ReactElement（`validateUtil.js:71-76`）⇒
 *    `FieldMessage = string | VNodeChild`（与运行时一致，§6.4.5 差异 1）。
 * 4. `Field` 的 `children`（render prop / 单元素 clone）与 `fieldContext` 在 Vue 侧
 *    由 **scoped slot** 与 **inject** 取代 ⇒ 不在这两个 interface 里（§6.4.5 差异 2）。
 */

import type { Component, VNodeChild } from 'vue';

import type { DeepNamePath } from './name-path-type';
import type { InternalNamePath } from './value-util';

// ---------------------------------------------------------------------------
// 基础
// ---------------------------------------------------------------------------

/**
 * 内部统一形态的路径：键的数组。
 *
 * ⭐ **全包只有一份定义**（在 `value-util.ts`，即上游 `utils/valueUtil.js` 那一层），
 * 这里 import 后再 re-export。
 *
 * ⚠️ 上游 `interface.d.ts` 自己也写了一遍同名类型 —— 但那是「同一个结构在两个文件里
 * 各声明一次」。我们不照抄这个重复：两份**同名不同源**的类型在 `expectTypeOf`
 * 与 IDE 提示里是两个人，改一处漏一处不会有任何编译错误。收敛成一处更安全，
 * 且 `form-store.ts` / `watcher-center.ts` 从本文件 import 的写法不受影响。
 */
export type { InternalNamePath };

/**
 * 用户书写的路径：单个键、数组，或（`Values` 泛型存在时）深度推导出的合法路径。
 *
 * ⭐⭐ **公开的 `NamePath` 是这个（深推导），不是 `value-util` 里那个简单联合。**
 *
 * 依据：上游 `es/index.d.ts` 是 `export type { … NamePath … } from './interface'`，
 * 而 `es/interface.d.ts` 里正是 `NamePath<T = any> = DeepNamePath<T>`；
 * 反过来 `es/utils/valueUtil.d.ts` 是 `import type { NamePath } from '../interface'`
 * —— 即上游**只有一份**，且以 `interface` 为准。
 *
 * 我们批次② 在 `value-util.ts` 里写的 `NamePath = string | number | InternalNamePath`
 * 是**对 `toArray`/`getNamePath` 两个形参的刻意收紧**（保留，它更安全、更精确），
 * 但它**不是公开 API**：`index.ts` 只从本文件导出 `NamePath`。
 * ⚠️ 两者是**不同**的类型，不要互相 import 混用。
 */
export type NamePath<T = any> = DeepNamePath<T>;

/** 表单值。 */
export type StoreValue = any;

export type Store = Record<string, StoreValue>;

/** 校验错误消息。⭐ 上游声明 `string`，运行时允许元素 ⇒ 按运行时写。 */
export type FieldMessage = string | VNodeChild;

export interface Meta {
  touched: boolean;
  validating: boolean;
  errors: FieldMessage[];
  warnings: FieldMessage[];
  name: InternalNamePath;
  validated: boolean;
}

export interface InternalFieldData extends Meta {
  value: StoreValue;
}

/** `setFields` 的入参。 */
export interface FieldData<Values = any> extends Partial<Omit<InternalFieldData, 'name'>> {
  name: NamePath<Values>;
}

// ---------------------------------------------------------------------------
// 规则
// ---------------------------------------------------------------------------

/** ⭐ 上游表单层的 `RuleType` 只有 14 个（**没有** `pattern` / `any`）。 */
export type FormRuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email'
  | 'tel';

/**
 * callback 式校验器（表单层）。
 *
 * ⚠️ 上游返回 `Promise<void | any> | void`，即 `Promise<any> | void`；
 * 写成 `Promise<unknown> | void` 不改变任何合法用法（`Field` 只判 `.then`/`.catch`）。
 */
export type FieldValidator = (
  rule: RuleObject,
  value: StoreValue,
  callback: (error?: string) => void,
  // biome-ignore lint/suspicious/noConfusingVoidType: 上游 interface.d.ts 逐字契约 —— callback 式 validator 返回 void（Field 只判 .then/.catch），换 undefined 会破坏该形态
) => Promise<unknown> | void;

export type RuleRender = (form: FormInstance) => RuleObject;

export interface ValidatorRule {
  warningOnly?: boolean;
  message?: FieldMessage;
  validator: FieldValidator;
}

interface BaseRule {
  warningOnly?: boolean;
  enum?: StoreValue[];
  len?: number;
  max?: number;
  message?: FieldMessage;
  min?: number;
  pattern?: RegExp;
  required?: boolean;
  transform?: (value: StoreValue) => StoreValue;
  type?: FormRuleType;
  whitespace?: boolean;
  /** 规则级 `validateTrigger`，必须是 Field 级 `validateTrigger` 的子集。 */
  validateTrigger?: string | string[];
}

type AggregationRule = BaseRule & Partial<ValidatorRule>;

interface ArrayRule extends Omit<AggregationRule, 'type'> {
  type: 'array';
  defaultField?: RuleObject;
}

export type RuleObject = AggregationRule | ArrayRule;

/** ⚠️ 上游同名 `Rule` 是 `RuleObject | RuleRender`；本包改名 `FormRule`（见文件头）。 */
export type FormRule = RuleObject | RuleRender;

// ---------------------------------------------------------------------------
// 校验结果与选项
// ---------------------------------------------------------------------------

export interface ValidateErrorEntity<Values = any> {
  message: FieldMessage;
  values: Values;
  errorFields: { name: InternalNamePath; errors: FieldMessage[] }[];
  outOfDate: boolean;
}

export interface FieldError {
  name: InternalNamePath;
  errors: FieldMessage[];
  warnings: FieldMessage[];
}

export interface RuleError {
  errors: FieldMessage[];
  rule: RuleObject;
}

export interface ValidateOptions {
  /** 只校验、不更新 UI 与 Field 状态。 */
  validateOnly?: boolean;
  /** 递归校验：`[['a']]` 会连带校验 `['a','b']`、`['a',1]`。 */
  recursive?: boolean;
  /** 只校验「脏」字段（touched 或已校验过）。 */
  dirty?: boolean;
}

export type ValidateFields<Values = any> = {
  (opt?: ValidateOptions): Promise<Values>;
  (nameList?: NamePath[], opt?: ValidateOptions): Promise<Values>;
};

export interface InternalValidateOptions extends ValidateOptions {
  triggerName?: string;
  validateMessages?: ValidateMessages;
  delayFrame?: boolean;
}

export type InternalValidateFields<Values = any> = {
  (options?: InternalValidateOptions): Promise<Values>;
  (nameList?: NamePath[], options?: InternalValidateOptions): Promise<Values>;
};

// ---------------------------------------------------------------------------
// 通知
// ---------------------------------------------------------------------------

interface ValueUpdateInfo {
  type: 'valueUpdate';
  source: 'internal' | 'external';
}
interface ValidateFinishInfo {
  type: 'validateFinish';
}
interface ResetInfo {
  type: 'reset';
}
interface RemoveInfo {
  type: 'remove';
}
interface SetFieldInfo {
  type: 'setField';
  data: FieldData;
}
interface DependenciesUpdateInfo {
  type: 'dependenciesUpdate';
  /** 所有相关路径。`a <- b <- c`：改 `a` ⇒ `relatedFields = [a, b, c]`。 */
  relatedFields: InternalNamePath[];
}

export type NotifyInfo =
  | ValueUpdateInfo
  | ValidateFinishInfo
  | ResetInfo
  | RemoveInfo
  | SetFieldInfo
  | DependenciesUpdateInfo;

export type ValuedNotifyInfo = NotifyInfo & { store: Store };

export interface Callbacks<Values = any> {
  onValuesChange?: (changedValues: Partial<Values>, values: Values) => void;
  onFieldsChange?: (changedFields: FieldData[], allFields: FieldData[]) => void;
  onFinish?: (values: Values) => void;
  onFinishFailed?: (errorInfo: ValidateErrorEntity<Values>) => void;
}

export type WatchCallBack = (
  values: Store,
  allValues: Store,
  namePathList: InternalNamePath[],
) => void;

export interface WatchOptions<Form extends FormInstance = FormInstance> {
  form?: Form;
  preserve?: boolean;
}

/**
 * `useWatch` 的依赖声明。
 *
 * ⚠️ **不是「路径数组」**：上游 `hooks/useWatch.d.ts` 的 9 个重载里，
 * `dependencies: [TDependencies1, TDependencies2]` 是**嵌套路径的元组**
 * （等价于 `['a', 'b']` ⇒ `values.a.b`），不是「同时监听 a 和 b」。
 * 唯一的「多项」形态是 `dependencies: []`（空路径 ⇒ 整个 store）。
 * 所以这里没有 `NamePath[]` 这一支 —— 契约 §6.4.4 已同步订正。
 *
 * ⚠️ 上游那 9 个重载的返回类型要从 `validateFields` 的泛型反推
 * （`GetGeneric<TForm>`）。Vue 侧 `useWatch` 返回 `Ref`，反推链断在返回类型上，
 * 照抄只会得到一堆推导失败后退化成 `any` 的分支。故采用这一版简化签名
 * —— **INTENDED 的收窄**，已登记为 §6.4.5 差异 5 的一部分。
 */
export type WatchDependencies<Values = any> = NamePath<Values> | ((values: Store) => unknown);

// ---------------------------------------------------------------------------
// Field 实体
// ---------------------------------------------------------------------------

export interface FieldEntityProps<Values = any> {
  name?: NamePath<Values>;
  rules?: FormRule[];
  dependencies?: NamePath<Values>[];
  initialValue?: StoreValue;
  /** ⚠️ 上游 .d.ts 未列，但 store 经 `isPreserve()` 读到（见文件头修正 2）。 */
  preserve?: boolean;
  isListField?: boolean;
  isList?: boolean;
}

export interface FieldEntity {
  onStoreChange: (
    store: Store,
    namePathList: InternalNamePath[] | null,
    info: ValuedNotifyInfo,
  ) => void;
  isFieldTouched: () => boolean;
  isFieldDirty: () => boolean;
  isFieldValidating: () => boolean;
  isListField: () => boolean;
  isList: () => boolean;
  /**
   * ⚠️ **上游声明 `() => boolean`，运行时返回 `this.props.preserve`（可能是 `undefined`）**
   * ⇒ 按运行时写（`Field.js:408`）。
   *
   * 这不是无意义的放宽：`FormStore.isMergedPreserve` 用 `fieldPreserve !== undefined`
   * 区分「字段级 `preserve`」与「表单级 `preserve`」。若这里把 `undefined` 压成 `false`，
   * 字段级就会**覆盖**表单级，把表单的 `preserve` 整个关掉（契约 §4.7.7）。
   */
  isPreserve: () => boolean | undefined;
  validateRules: (options?: InternalValidateOptions) => Promise<RuleError[]>;
  getMeta: () => Meta;
  getNamePath: () => InternalNamePath;
  getErrors: () => FieldMessage[];
  getWarnings: () => FieldMessage[];
  props: FieldEntityProps;
  /** 标记为「已失效」：Field 已被移除但本次渲染还没更新到。 */
  INVALIDATE_NAME_PATH?: InternalNamePath;
}

/**
 * ⭐ `registerField` 返回的注销函数。
 *
 * ⚠️ 上游 .d.ts 声明 `() => void`，运行时却接受三个参数（`Field.js:99`）⇒ 把声明改对。
 */
export type FieldCancelRegister = (
  isListField?: boolean,
  preserve?: boolean,
  subNamePath?: InternalNamePath,
) => void;

// ---------------------------------------------------------------------------
// 内部 hooks
// ---------------------------------------------------------------------------

interface UpdateAction {
  type: 'updateValue';
  namePath: InternalNamePath;
  value: StoreValue;
}
interface ValidateAction {
  type: 'validateField';
  namePath: InternalNamePath;
  triggerName: string;
}
export type ReducerAction = UpdateAction | ValidateAction;

export interface InternalHooks {
  dispatch: (action: ReducerAction) => void;
  initEntityValue: (entity: FieldEntity) => void;
  registerField: (entity: FieldEntity) => FieldCancelRegister;
  useSubscribe: (subscribable: boolean) => void;
  /**
   * ⚠️ 形参含 `undefined`（③c 的声明订正）：唯一的调用点 `Form.js:80` 传的是
   * `props.initialValues`（可缺省），而 `FormStore.setInitialValues` 的第一行就是
   * `this.initialValues = initialValues || {}` —— 运行时本来就接受 `undefined`。
   */
  setInitialValues: (values: Store | undefined, init: boolean) => void;
  destroyForm: (clearOnDestroy?: boolean) => void;
  setCallbacks: (callbacks: Callbacks) => void;
  registerWatch: (callback: WatchCallBack) => () => void;
  getFields: (namePathList?: InternalNamePath[]) => FieldData[];
  setValidateMessages: (validateMessages: ValidateMessages) => void;
  setPreserve: (preserve?: boolean) => void;
  getInitialValue: (namePath: InternalNamePath) => StoreValue;
}

// ---------------------------------------------------------------------------
// FormInstance
// ---------------------------------------------------------------------------

/** `filter` 回调的入参：`INVALIDATE_NAME_PATH` 的假实体拿到 `null`。 */
export type FilterFunc = (meta: Meta | null) => boolean;

export interface GetFieldsValueConfig {
  /** @deprecated 已不再生效（上游保留仅为兼容）。 */
  strict?: boolean;
  filter?: FilterFunc;
}

export interface FormInstance<Values = any> {
  getFieldValue: (name: NamePath<Values>) => StoreValue;
  getFieldsValue: (() => Values) &
    ((nameList: NamePath<Values>[] | true, filterFunc?: FilterFunc) => any) &
    ((config: GetFieldsValueConfig) => any);
  getFieldError: (name: NamePath<Values>) => FieldMessage[];
  getFieldsError: (nameList?: NamePath<Values>[]) => FieldError[];
  getFieldWarning: (name: NamePath<Values>) => FieldMessage[];
  isFieldsTouched: ((nameList?: NamePath<Values>[], allFieldsTouched?: boolean) => boolean) &
    ((allFieldsTouched?: boolean) => boolean);
  isFieldTouched: (name: NamePath<Values>) => boolean;
  isFieldValidating: (name: NamePath<Values>) => boolean;
  isFieldsValidating: (nameList?: NamePath<Values>[]) => boolean;
  resetFields: (fields?: NamePath<Values>[]) => void;
  setFields: (fields: FieldData<Values>[]) => void;
  setFieldValue: (name: NamePath<Values>, value: StoreValue) => void;
  setFieldsValue: (values: RecursivePartial<Values> | Partial<Values>) => void;
  validateFields: ValidateFields<Values>;
  submit: () => void;
  /**
   * ⭐ antd 壳层补丁（`es/form/hooks/useForm.js`）：rc 无、antd 在 useForm 里加。
   * 由 `@apollo-design/ui` 的 `useForm` 注入实现；form-core 的裸 store 未实现
   * （调用即告警桩），保持接口完整以便消费方按 antd 形状编程。
   */
  scrollToField?: (name: NamePath<Values>, options?: ScrollOptions) => void;
  focusField?: (name: NamePath<Values>) => void;
  getFieldInstance?: (name: NamePath<Values>) => { focus?: () => void } | undefined;
}

/** antd `ScrollFocusOptions` 的最小面（scroll-into-view-if-needed 的 options + focus）。 */
export interface ScrollOptions {
  focus?: boolean;
  block?: 'start' | 'center' | 'end' | 'nearest';
  [key: string]: unknown;
}

export type FormRef<Values = any> = FormInstance<Values> & {
  nativeElement?: HTMLElement;
};

export type InternalFormInstance = Omit<FormInstance, 'validateFields'> & {
  validateFields: InternalValidateFields;
  /** 由 `FieldContext` 注入（`Form.List` 用）。 */
  prefixName?: InternalNamePath;
  validateTrigger?: string | string[] | false;
  /** 内部挂钩入口，用 `HOOK_MARK` 当钥匙，避免用户误调。 */
  getInternalHooks: (secret: string) => InternalHooks | null;
  /** @private 内部使用，勿在生产代码里依赖。 */
  _init?: boolean;
};

/** 事件回调的参数包。 */
export type EventArgs = any[];

/**
 * ⭐ 递归可选。
 *
 * ⚠️ `Date` / `RegExp` / `Function` / `Map` / `Set` 直接返回原类型 ——
 * 否则 `RecursivePartial<{d: Date}>` 会把 `Date` 的方法也变成可选。
 */
export type RecursivePartial<T> = T extends
  | Date
  | RegExp
  // biome-ignore lint/complexity/noBannedTypes: 这里要匹配**一切可调用对象**。换成 `(...args: never[]) => unknown` 会漏掉带构造签名/重载的类型（见 PITFALLS 69 的逆变讨论），而本判据的目的是「别把函数的方法也变可选」。
  | Function
  | Map<unknown, unknown>
  | Set<unknown>
  ? T
  : T extends (infer U)[]
    ? RecursivePartial<U>[]
    : T extends readonly (infer U)[]
      ? readonly RecursivePartial<U>[]
      : T extends object
        ? { [P in keyof T]?: RecursivePartial<T[P]> }
        : T;

// ---------------------------------------------------------------------------
// Field 组件（`Field.d.ts`）
// ---------------------------------------------------------------------------

export type ShouldUpdate<Values = any> =
  | boolean
  | ((prevValues: Values, nextValues: Values, info: { source?: string }) => boolean);

export interface ChildProps {
  [name: string]: any;
}

export type MetaEvent = Meta & { destroy?: boolean };

export interface InternalFieldProps<Values = any> {
  /**
   * ⚠️ 上游是 React 的 render prop / 单元素 clone；Vue 侧对应物是 **scoped slot**
   * （`FieldSlots.default`）⇒ 这里**没有** `children` 键（§6.4.5 差异 2）。
   */
  /** 依赖字段：依赖项更新且本字段已 touched 时触发校验与重渲染。 */
  dependencies?: NamePath<Values>[];
  getValueFromEvent?: (...args: EventArgs) => StoreValue;
  name?: InternalNamePath;
  normalize?: (value: StoreValue, prevValue: StoreValue, allValues: Store) => StoreValue;
  rules?: FormRule[];
  shouldUpdate?: ShouldUpdate<Values>;
  trigger?: string;
  validateTrigger?: string | string[] | false;
  /** 配置的毫秒数之后才触发校验。 */
  validateDebounce?: number;
  /** ⭐ 取值是 `boolean | 'parallel'`（`Field.d.ts:31`），不是布尔。 */
  validateFirst?: boolean | 'parallel';
  valuePropName?: string;
  getValueProps?: (value: StoreValue) => Record<string, unknown>;
  messageVariables?: Record<string, string>;
  initialValue?: StoreValue;
  onReset?: () => void;
  onMetaChange?: (meta: MetaEvent) => void;
  preserve?: boolean;
  /** @private 由 `Form.List` 传入。 */
  isListField?: boolean;
  /** @private 由 `Form.List` 传入。 */
  isList?: boolean;
}

/** Field 的公共 props（Vue 版）。 */
export interface FieldProps<Values = any> extends Omit<InternalFieldProps<Values>, 'name'> {
  name?: NamePath<Values>;
}

/** ⭐ Vue 的 scoped slot —— 上游 `children` render prop 的对应物。 */
export interface FieldSlots<Values = any> {
  default?: (control: ChildProps, meta: Meta, form: FormInstance<Values>) => VNodeChild;
}

export interface FieldState {
  resetCount: number;
}

// ---------------------------------------------------------------------------
// Form 组件（`Form.d.ts`）
// ---------------------------------------------------------------------------

export interface FormProps<Values = any> {
  initialValues?: Store;
  form?: FormInstance<Values>;
  /**
   * ⚠️ 上游是 `false | string | React.ComponentType`；Vue 侧容器组件用 `Component` 表达。
   * HTML 属性（`onReset` 等）不经 props 声明 —— Vue 由 `$attrs` 透传（§6.4.5）。
   */
  component?: false | string | Component;
  fields?: FieldData[];
  name?: string;
  validateMessages?: ValidateMessages;
  onValuesChange?: Callbacks<Values>['onValuesChange'];
  onFieldsChange?: Callbacks<Values>['onFieldsChange'];
  onFinish?: Callbacks<Values>['onFinish'];
  onFinishFailed?: Callbacks<Values>['onFinishFailed'];
  validateTrigger?: string | string[] | false;
  preserve?: boolean;
  clearOnDestroy?: boolean;
}

/** Form 的默认插槽：`(values, form) => VNodeChild`（上游 render props）。 */
export interface FormSlots<Values = any> {
  default?: (values: Store, form: FormInstance<Values>) => VNodeChild;
}

// ---------------------------------------------------------------------------
// FormContext（`FormContext.d.ts`）
// ---------------------------------------------------------------------------

export type Forms = Record<string, FormInstance>;

export interface FormChangeInfo {
  changedFields: FieldData[];
  forms: Forms;
}

export interface FormFinishInfo {
  values: Store;
  forms: Forms;
}

export interface FormProviderProps {
  validateMessages?: ValidateMessages;
  onFormChange?: (name: string, info: FormChangeInfo) => void;
  onFormFinish?: (name: string, info: FormFinishInfo) => void;
}

export interface FormContextProps extends FormProviderProps {
  triggerFormChange: (name: string, changedFields: FieldData[]) => void;
  triggerFormFinish: (name: string, values: Store) => void;
  registerForm: (name: string, form: FormInstance) => void;
  unregisterForm: (name: string) => void;
}

export interface FormProviderSlots {
  default?: () => VNodeChild;
}

// ---------------------------------------------------------------------------
// List 组件（`List.d.ts`）
// ---------------------------------------------------------------------------

export interface ListField {
  name: number;
  key: number;
  isListField: boolean;
}

export interface ListOperations {
  add: (defaultValue?: StoreValue, index?: number) => void;
  remove: (index: number | number[]) => void;
  move: (from: number, to: number) => void;
}

export interface ListProps<Values = any> {
  name: NamePath<Values>;
  rules?: ValidatorRule[];
  validateTrigger?: string | string[] | false;
  initialValue?: StoreValue[];
  /** @private 由 `Form.List` 传入。 */
  isListField?: boolean;
}

// biome-ignore lint/correctness/noUnusedVariables: `Values` 是**有意保留**的泛型位 —— 与 `FieldSlots<Values>` 对称，③c 落地 `List` 时 slot 的 `fields` 会按 `Values` 推导（契约 §6.4.3）。现在删掉等于将来再加一次。
export interface ListSlots<Values = any> {
  default?: (fields: ListField[], operations: ListOperations, meta: Meta) => VNodeChild;
}

// ---------------------------------------------------------------------------
// ListContext（`ListContext.d.ts`）
// ---------------------------------------------------------------------------

export interface ListContextProps {
  getKey: (namePath: InternalNamePath) => [InternalNamePath[number], InternalNamePath];
}

// ---------------------------------------------------------------------------
// 复用批次① 的 ValidateMessages（同名同构，见文件头）
// ---------------------------------------------------------------------------

export type { ValidateMessage, ValidateMessages } from './types';

import type { ValidateMessages } from './types';
