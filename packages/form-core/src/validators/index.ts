/**
 * 17 个组合校验器。
 *
 * 契约来源：`@rc-component/async-validator@6.0.0/es/validator/*.js`（共 287 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.5。
 *
 * ── 统一模式 ─────────────────────────────────────────────────────────────────
 *
 * ```js
 * const x = (rule, value, callback, source, options) => {
 *   const errors = [];
 *   const validate = rule.required || (!rule.required && source.hasOwnProperty(rule.field));
 *   if (validate) {
 *     if (isEmptyValue(value, <type>) && !rule.required) return callback();   // 空值早退
 *     rules.required(rule, value, source, errors, options, <type>);
 *     if (!isEmptyValue(value, <type>)) { /* 组合 rules.type / range / pattern / enum *\/ }
 *   }
 *   callback(errors);
 * };
 * ```
 *
 * ⭐ 三处**逐字照抄**、不能"优化"的地方：
 *
 * 1. `validate` 的双条件 —— 非必填且 `source` 上没有该键 ⇒ **整个跳过**
 *    （连 `required` 都不跑）。这是「未注册的字段不参与校验」的实现方式。
 * 2. 空值早退用的 `isEmptyValue` 的 **type 参数**决定 `''` 算不算空。
 * 3. 每个 validator 的 `type` 参数各不相同（见下表），别统一成 `rule.type`。
 *
 * ── 差异表（⚠️ 这是本文件最容易写错的地方） ──────────────────────────────────
 *
 * | validator | 空值判定 | 早退后调用的 rules |
 * |---|---|---|
 * | `any` | `isEmptyValue(value)` | required |
 * | `array` | ⭐ `value === undefined \|\| value === null`（**不用 isEmptyValue**） | required('array'), type, range |
 * | `boolean` | `isEmptyValue(value)` | required, type |
 * | `date` | `isEmptyValue(value, 'date')` | required, type(Date 对象), range(getTime()) |
 * | `float` / `integer` | `isEmptyValue(value)` | required, type, range |
 * | `method` / `object` / `regexp` | `isEmptyValue(value)` | required, type |
 * | `number` | `isEmptyValue(value)` + ⭐ `'' ⇒ undefined` | required, type, range |
 * | `pattern` | `isEmptyValue(value, 'string')` | required, pattern |
 * | `required` | — | required（type 由值推导） |
 * | `string` | `isEmptyValue(value, 'string')` | required, type, range, pattern, whitespace? |
 * | `type` | `isEmptyValue(value, rule.type)` | required, type |
 * | `enum` | `isEmptyValue(value)` | required, enum |
 */

import rules from '../rules';
import type { ExecuteValidator, InternalRuleItem, Value, Values } from '../types';
import { isEmptyValue } from '../util';

/**
 * 全部校验器共用的「该不该校验」判据。
 *
 * 上游写的是 `rule.required || (!rule.required && source.hasOwnProperty(rule.field))` ——
 * ⭐ 对 `required` 用的是 **truthy** 判断（不是 `=== true`），所以 `required: 1` 也生效。
 */
function shouldValidate(rule: InternalRuleItem, source: Values): boolean {
  return Boolean(rule.required) || Object.hasOwn(source, rule.field as string);
}

// ---------------------------------------------------------------------------
// any / required
// ---------------------------------------------------------------------------

/** `any` —— 只跑必填。 */
export const any: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
  }
  callback(errors);
};

/**
 * `required` —— ⭐ 空值判定用的 type 是**从值推导**的
 * （`Array.isArray(value) ? 'array' : typeof value`），不是 `rule.type`。
 */
export const required: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const type = Array.isArray(value) ? 'array' : typeof value;
  rules.required(rule, value, source, errors, options, type);
  callback(errors);
};

// ---------------------------------------------------------------------------
// 标量类型
// ---------------------------------------------------------------------------

export const string: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value, 'string') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, 'string');
    if (!isEmptyValue(value, 'string')) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
      rules.pattern(rule, value, source, errors, options);
      if (rule.whitespace === true) {
        rules.whitespace(rule, value, source, errors, options);
      }
    }
  }
  callback(errors);
};

export const number: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    // ⭐ 空串归一成 undefined —— 否则 '' 会被当成「有值」去跑 type 检查
    let normalized: Value = value;
    if (normalized === '') {
      normalized = undefined;
    }
    if (isEmptyValue(normalized) && !rule.required) {
      return callback();
    }
    rules.required(rule, normalized, source, errors, options);
    if (normalized !== undefined) {
      rules.type(rule, normalized, source, errors, options);
      rules.range(rule, normalized, source, errors, options);
    }
  }
  callback(errors);
};

export const boolean: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export const method: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export const object: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export const regexp: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value)) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export const integer: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export const float: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

/**
 * `array`。
 *
 * ⭐⭐ **唯一一个不用 `isEmptyValue` 的**：空判定是
 * `value === undefined || value === null`。
 * 所以**空数组在非必填时不会早退**，会继续跑 `required` + `type` + `range`。
 * 这让 `type: 'array', min: 1` 对 `[]` 能正确报错 —— 如果用 `isEmptyValue` 就静默通过了。
 */
export const array: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if ((value === undefined || value === null) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, 'array');
    if (value !== undefined && value !== null) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

/**
 * `date`。
 *
 * ⭐ 与其它 validator 的两处不同：
 * 1. `type` 检查传的是**转好的 Date 对象**（不是原值）；
 * 2. `range` 传的是 `dateObject.getTime()`（毫秒数）—— 所以 `min`/`max` 是时间戳。
 */
export const date: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value, 'date') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value, 'date')) {
      const dateObject = value instanceof Date ? value : new Date(value);
      rules.type(rule, dateObject, source, errors, options);
      if (dateObject) {
        rules.range(rule, dateObject.getTime(), source, errors, options);
      }
    }
  }
  callback(errors);
};

// ---------------------------------------------------------------------------
// enum / pattern / type
// ---------------------------------------------------------------------------

export const enumerable: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules.enum(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export const pattern: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value, 'string') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value, 'string')) {
      rules.pattern(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

/**
 * `type` —— ⭐ `url` / `hex` / `email` / `tel` **共用它**。
 *
 * 这四个类型的差异全在 `rules/type.ts` 的 `types[]` 里（正则不同），
 * 组合逻辑完全一致。
 */
export const type: ExecuteValidator = (rule, value, callback, source, options) => {
  const ruleType = rule.type as string;
  const errors: string[] = [];
  if (shouldValidate(rule, source)) {
    if (isEmptyValue(value, ruleType) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, ruleType);
    if (!isEmptyValue(value, ruleType)) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

// ---------------------------------------------------------------------------
// 注册表
// ---------------------------------------------------------------------------

/**
 * 类型名 → 校验器。
 *
 * ⚠️ **这是模块级可变对象** —— `Schema.register(type, validator)` 会改它，
 * 且影响所有 `Schema` 实例（上游同样如此，裁决见契约 §8 P4）。
 */
const validators: Record<string, ExecuteValidator> = {
  string,
  method,
  number,
  boolean,
  regexp,
  integer,
  float,
  array,
  object,
  enum: enumerable,
  pattern,
  date,
  url: type,
  hex: type,
  email: type,
  tel: type,
  required,
  any,
};

export default validators;
