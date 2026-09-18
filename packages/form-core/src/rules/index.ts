/**
 * 7 个原子规则。
 *
 * 契约来源：`@rc-component/async-validator@6.0.0/es/rule/*.js`。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.4。
 *
 * ⭐ 这些是**原子检查**：各自只往 `errors` 里 push 消息字符串，不做类型分派、
 * 不做空值早退。类型分派在 `validators/`（组合校验器）里。
 */

import type { InternalRuleItem, ValidateOption, Value, Values } from '../types';
import { format, isEmptyValue } from '../util';
import getUrlRegex from './url';

/** 供 `rule/type.ts` 的 `types.url` 使用。 */
export { default as getUrlRegex } from './url';

/**
 * 必填检查。
 *
 * ⭐ 判据是 `!source.hasOwnProperty(rule.field) || isEmptyValue(...)` ——
 * **键不存在也算空**。所以 `{a: undefined}` 与 `{}` 在必填下都会报错。
 */
export const required = (
  rule: InternalRuleItem,
  value: Value,
  source: Values,
  errors: string[],
  options: ValidateOption,
  type?: string,
): void => {
  if (
    rule.required &&
    (!Object.hasOwn(source, rule.field as string) || isEmptyValue(value, type || rule.type))
  ) {
    errors.push(format(options.messages?.required as string, rule.fullField));
  }
};

/**
 * 空白检查。
 *
 * ⭐ 空串**也**报（`value === ''` 是第二个条件）—— 它比 `required` 更严：
 * `required` 在 `type: 'number'` 时不把 `''` 当空，但 `whitespace` 会报。
 */
export const whitespace = (
  rule: InternalRuleItem,
  value: Value,
  _source: Values,
  errors: string[],
  options: ValidateOption,
): void => {
  if (/^\s+$/.test(value) || value === '') {
    errors.push(format(options.messages?.whitespace as string, rule.fullField));
  }
};

// ---------------------------------------------------------------------------
// type
// ---------------------------------------------------------------------------

/** `type` rule 用的两个正则。⚠️ `tel` 里的 `\u2011` 是不换行连字符，别删。 */
const pattern = {
  // http://emailregex.com/
  email:
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/,
  tel: /^(\+[0-9]{1,3}[-\s\u2011]?)?(\([0-9]{1,4}\)[-\s\u2011]?)?([0-9]+[-\s\u2011]?)*[0-9]+$/,
  hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
};

/** 12 个「自定义」类型的判定。其余类型走 `typeof` 兜底。 */
const types: Record<string, (value: Value) => boolean> = {
  integer(value) {
    return types.number?.(value) === true && Number.parseInt(value, 10) === value;
  },
  float(value) {
    return types.number?.(value) === true && !types.integer?.(value);
  },
  array(value) {
    return Array.isArray(value);
  },
  regexp(value) {
    if (value instanceof RegExp) {
      return true;
    }
    try {
      return !!new RegExp(value);
    } catch {
      return false;
    }
  },
  date(value) {
    return (
      typeof value.getTime === 'function' &&
      typeof value.getMonth === 'function' &&
      typeof value.getYear === 'function' &&
      !Number.isNaN(value.getTime())
    );
  },
  number(value) {
    if (Number.isNaN(value)) {
      return false;
    }
    return typeof value === 'number';
  },
  object(value) {
    return typeof value === 'object' && !types.array?.(value);
  },
  method(value) {
    return typeof value === 'function';
  },
  email(value) {
    return typeof value === 'string' && value.length <= 320 && !!value.match(pattern.email);
  },
  tel(value) {
    return typeof value === 'string' && value.length <= 32 && !!value.match(pattern.tel);
  },
  url(value) {
    return typeof value === 'string' && value.length <= 2048 && !!value.match(getUrlRegex());
  },
  hex(value) {
    return typeof value === 'string' && !!value.match(pattern.hex);
  },
};

/** 需要走 `types[]` 的自定义类型清单（顺序与上游一致）。 */
const CUSTOM_TYPES = [
  'integer',
  'float',
  'array',
  'regexp',
  'object',
  'method',
  'email',
  'tel',
  'number',
  'date',
  'url',
  'hex',
];

/**
 * 类型检查。
 *
 * ⭐ `required && value === undefined` ⇒ 转交 `required` 并 **return**（不做类型判定）。
 */
export const type = (
  rule: InternalRuleItem,
  value: Value,
  source: Values,
  errors: string[],
  options: ValidateOption,
): void => {
  if (rule.required && value === undefined) {
    required(rule, value, source, errors, options);
    return;
  }

  const ruleType = rule.type as string;
  const messages = options.messages?.types as Record<string, string>;

  if (CUSTOM_TYPES.indexOf(ruleType) > -1) {
    if (!types[ruleType]?.(value)) {
      errors.push(format(messages[ruleType] as string, rule.fullField, rule.type));
    }
  } else if (ruleType && typeof value !== rule.type) {
    errors.push(format(messages[ruleType] as string, rule.fullField, rule.type));
  }
};

// ---------------------------------------------------------------------------
// range
// ---------------------------------------------------------------------------

/**
 * 长度/大小区间检查。
 *
 * ⭐ 只支持 `number` / `string` / `array` 三种值类型，**其他类型直接静默 return**
 * （不报错、不 push）。所以 `type: 'boolean'` + `min` 是无声无息的。
 *
 * ⭐ 字符串用 `spRegexp` 把补充平面字符（U+010000 以上）算作 1 ——
 * 否则 `'𠮷𠮷𠮷'.length` 是 6 而不是 3。
 */
export const range = (
  rule: InternalRuleItem,
  value: Value,
  _source: Values,
  errors: string[],
  options: ValidateOption,
): void => {
  // ⚠️ 先取到局部常量再判 —— TS 的窄化不会穿过 `else if` 链，
  //    直接用 `rule.min` 会报 "possibly undefined"。
  const lenVal = rule.len;
  const minVal = rule.min;
  const maxVal = rule.max;

  const len = typeof lenVal === 'number';
  const min = typeof minVal === 'number';
  const max = typeof maxVal === 'number';

  const spRegexp = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

  let val = value;
  let key: string | null = null;

  const num = typeof value === 'number';
  const str = typeof value === 'string';
  const arr = Array.isArray(value);

  if (num) {
    key = 'number';
  } else if (str) {
    key = 'string';
  } else if (arr) {
    key = 'array';
  }

  if (!key) {
    return;
  }

  if (arr) {
    val = value.length;
  }
  if (str) {
    val = value.replace(spRegexp, '_').length;
  }

  const messages = options.messages as Record<string, Record<string, string>>;

  if (len) {
    if (val !== lenVal) {
      errors.push(format(messages[key]?.len as string, rule.fullField, lenVal));
    }
  } else if (min && !max && (val as number) < (minVal as number)) {
    errors.push(format(messages[key]?.min as string, rule.fullField, minVal));
  } else if (max && !min && (val as number) > (maxVal as number)) {
    errors.push(format(messages[key]?.max as string, rule.fullField, maxVal));
  } else if (
    min &&
    max &&
    ((val as number) < (minVal as number) || (val as number) > (maxVal as number))
  ) {
    errors.push(format(messages[key]?.range as string, rule.fullField, minVal, maxVal));
  }
};

// ---------------------------------------------------------------------------
// enum
// ---------------------------------------------------------------------------

const ENUM = 'enum';

/**
 * 枚举成员检查。
 *
 * ⚠️ **会写回 `rule.enum`** —— 非数组时被置成 `[]`。
 * 传同一个规则对象跑两次，第二次看到的 `rule.enum` 已经被改过了。
 */
export const enumerable = (
  rule: InternalRuleItem,
  value: Value,
  _source: Values,
  errors: string[],
  options: ValidateOption,
): void => {
  const ruleEnum = rule as unknown as Record<string, unknown>;
  ruleEnum[ENUM] = Array.isArray(ruleEnum[ENUM]) ? ruleEnum[ENUM] : [];
  const list = ruleEnum[ENUM] as unknown[];
  if (list.indexOf(value) === -1) {
    errors.push(format(options.messages?.enum as string, rule.fullField, list.join(', ')));
  }
};

// ---------------------------------------------------------------------------
// pattern
// ---------------------------------------------------------------------------

/**
 * 正则匹配检查。
 *
 * ⭐ `RegExp` 实例时**先重置 `lastIndex = 0`** —— 带 `g` 标志的正则是有状态的，
 * 不重置会出现「同一个值第一次通过、第二次失败」的诡异行为。
 *
 * ⭐ 字符串形式的 pattern 每次 `new RegExp`（无标志）。
 */
export const patternRule = (
  rule: InternalRuleItem,
  value: Value,
  _source: Values,
  errors: string[],
  options: ValidateOption,
): void => {
  if (!rule.pattern) {
    return;
  }

  const mismatch = (options.messages?.pattern as Record<string, string>)?.mismatch;

  if (rule.pattern instanceof RegExp) {
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(value)) {
      errors.push(format(mismatch as string, rule.fullField, value, rule.pattern));
    }
  } else if (typeof rule.pattern === 'string') {
    const _pattern = new RegExp(rule.pattern);
    if (!_pattern.test(value)) {
      errors.push(format(mismatch as string, rule.fullField, value, rule.pattern));
    }
  }
};

/** 原子规则的集合。⭐ 键名与上游 `rule/index.js` 一致（`pattern` 而非 `patternRule`）。 */
export const rules = {
  required,
  whitespace,
  type,
  range,
  enum: enumerable,
  pattern: patternRule,
};

export default rules;
