/**
 * 校验引擎的类型契约。
 *
 * 契约来源：`@rc-component/async-validator@6.0.0/es/interface.d.ts`（136 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.1。
 *
 * ⚠️ 这里的类型是**逐字**映射上游的，包括 `Value = any` 这种看起来"不严格"的地方 ——
 * 上游的规则值是任意类型（`transform` 可以把任何东西变成任何东西），
 * 收紧成 `unknown` 会让 `rule.transform` 的签名无法表达。
 */

/** 17 种规则类型。⭐ 默认是 `string`（不是 `any`），见契约 §4.1.5。 */
export type RuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'array'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email'
  | 'tel'
  | 'pattern'
  | 'any';

/** 任意值。上游就是 `any`，见文件头注释。 */
// biome-ignore lint/suspicious/noExplicitAny: 与上游 interface.d.ts 逐字一致
export type Value = any;

export type Values = Record<string, Value>;

export interface ValidateOption {
  suppressWarning?: boolean;
  suppressValidatorError?: boolean;
  /** ⭐ 串行模式：遇第一个错误即停（`asyncMap` 的 `first` 分支）。 */
  first?: boolean;
  /** ⭐ `true` ⇒ 所有字段都串行；数组 ⇒ 列出的字段串行、其余并行。 */
  firstFields?: boolean | string[];
  messages?: Partial<ValidateMessages>;
  /** 只校验这些字段；留空 ⇒ 校验全部。 */
  keys?: string[];
  /** 自定义错误构造（嵌套 `required` 失败时用）。 */
  error?: (rule: InternalRuleItem, message: string) => ValidateError;
}

export type SyncErrorType = Error | string;
export type SyncValidateResult = boolean | SyncErrorType | SyncErrorType[];
export type ValidateResult = void | Promise<void> | SyncValidateResult;

export interface RuleItem {
  type?: RuleType;
  required?: boolean;
  pattern?: RegExp | string;
  min?: number;
  max?: number;
  len?: number;
  enum?: (string | number | boolean | null | undefined)[];
  whitespace?: boolean;
  fields?: Record<string, Rule>;
  options?: ValidateOption;
  defaultField?: Rule;
  transform?: (value: Value) => Value;
  message?: string | ((a?: string) => string);
  asyncValidator?: (
    rule: InternalRuleItem,
    value: Value,
    callback: (error?: string | Error) => void,
    source: Values,
    options: ValidateOption,
  ) => void | Promise<void>;
  validator?: (
    rule: InternalRuleItem,
    value: Value,
    callback: (error?: string | Error) => void,
    source: Values,
    options: ValidateOption,
    // ⚠️ 这里必须是 `void` 不能是 `undefined`：上游 interface.d.ts 就是
    //   `SyncValidateResult | void`；`void` 在返回位置表示「返回值被忽略」，因此
    //   「返回 void 的 callback 式 validator」可以赋值给它。改成 `undefined` 会让
    //   所有 callback 式 validator 编译失败（实测 schema.oracle.test.ts 直接 TS2322）。
    // biome-ignore lint/suspicious/noConfusingVoidType: 见上 —— antd 逐字契约
  ) => SyncValidateResult | void;
}

export type Rule = RuleItem | RuleItem[];
export type Rules = Record<string, Rule>;

/** 原子规则（`rule/*.js` 的签名）。⭐ `type` 是第 6 个参数，只有部分 rule 用。 */
export type ExecuteRule = (
  rule: InternalRuleItem,
  value: Value,
  source: Values,
  errors: string[],
  options: ValidateOption,
  type?: string,
) => void;

/** 组合校验器（`validator/*.js` 的签名）。 */
export type ExecuteValidator = (
  rule: InternalRuleItem,
  value: Value,
  callback: (error?: string[]) => void,
  source: Values,
  options: ValidateOption,
) => void;

export type ValidateMessage<T extends unknown[] = unknown[]> = string | ((...args: T) => string);
type FullField = string | undefined;
type EnumString = string | undefined;
type Pattern = string | RegExp | undefined;
type Range = number | undefined;
type Type = string | undefined;

/**
 * 「校验器」的联合形态。
 *
 * ⭐ 上游没有这个名字 —— 它有两套签名（`ExecuteValidator` 与 `RuleItem['validator']`），
 * 我们把「注册表里能放什么」这个联合显式命名，供 `Schema.register` 与
 * `Schema.validators` 的类型使用。
 */
export type Validator = ExecuteValidator | NonNullable<RuleItem['validator']>;

export interface ValidateMessages {
  default?: ValidateMessage;
  required?: ValidateMessage<[FullField]>;
  enum?: ValidateMessage<[FullField, EnumString]>;
  whitespace?: ValidateMessage<[FullField]>;
  date?: {
    format?: ValidateMessage;
    parse?: ValidateMessage;
    invalid?: ValidateMessage;
  };
  types?: {
    string?: ValidateMessage<[FullField, Type]>;
    method?: ValidateMessage<[FullField, Type]>;
    array?: ValidateMessage<[FullField, Type]>;
    object?: ValidateMessage<[FullField, Type]>;
    number?: ValidateMessage<[FullField, Type]>;
    date?: ValidateMessage<[FullField, Type]>;
    boolean?: ValidateMessage<[FullField, Type]>;
    integer?: ValidateMessage<[FullField, Type]>;
    float?: ValidateMessage<[FullField, Type]>;
    regexp?: ValidateMessage<[FullField, Type]>;
    email?: ValidateMessage<[FullField, Type]>;
    tel?: ValidateMessage<[FullField, Type]>;
    url?: ValidateMessage<[FullField, Type]>;
    hex?: ValidateMessage<[FullField, Type]>;
  };
  string?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  number?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  array?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  pattern?: {
    mismatch?: ValidateMessage<[FullField, Value, Pattern]>;
  };
}

/** 内部使用的 messages —— 多一个 `clone`（`messages.js:49-53`）。 */
export interface InternalValidateMessages extends ValidateMessages {
  clone: () => InternalValidateMessages;
}

export interface ValidateError {
  message?: string;
  fieldValue?: Value;
  field?: string;
}

export type ValidateFieldsError = Record<string, ValidateError[]>;

export type ValidateCallback = (
  errors: ValidateError[] | null,
  fields: ValidateFieldsError | Values,
) => void;

export interface RuleValuePackage {
  rule: InternalRuleItem;
  value: Value;
  source: Values;
  field: string;
}

export interface InternalRuleItem extends Omit<RuleItem, 'validator'> {
  field?: string;
  fullField?: string;
  fullFields?: string[];
  validator?: RuleItem['validator'] | ExecuteValidator;
}
