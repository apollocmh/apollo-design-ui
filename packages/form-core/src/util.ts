/**
 * 校验引擎的纯工具。
 *
 * 契约来源：`@rc-component/async-validator@6.0.0/es/util.js`（221 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.2。
 */

import { canUseDom, isDev } from '@apollo-design/utils';
import type {
  InternalRuleItem,
  RuleValuePackage,
  ValidateError,
  ValidateFieldsError,
  ValidateOption,
  Value,
  Values,
} from './types';

// ---------------------------------------------------------------------------
// 告警
// ---------------------------------------------------------------------------

/**
 * 校验失败时的告警。
 *
 * 上游的启用条件是「非 production **且** 有 window/document **且** 未定义全局
 * `ASYNC_VALIDATOR_NO_WARNING`」（`util.js:7-15`）。我们保留前两条，
 * 第三条（那个全局变量是上游给测试用的开关）**不移植** —— 我们的测试用
 * `vi.spyOn(console, 'warn')` 直接断言，不需要污染全局。登记为差异。
 */
export function warning(type: string, errors: ValidateError[]): void {
  // ⚠️ `isDev` 是 utils 里的**布尔常量**（模块加载时求值），不是函数；`canUseDom` 才是函数
  if (!isDev || !canUseDom()) {
    return;
  }
  // ⭐ 只在「错误全是字符串」时输出 —— 上游如此。有些错误对象带循环引用，
  //    直接 console.warn 会把控制台刷爆。
  if (errors.every((e) => typeof e === 'string')) {
    console.warn(type, errors);
  }
}

// ---------------------------------------------------------------------------
// 错误聚合
// ---------------------------------------------------------------------------

/** 按 `error.field` 分组。空输入 ⇒ `null`（不是 `{}`）。 */
export function convertFieldsError(
  errors: ValidateError[] | null | undefined,
): ValidateFieldsError | null {
  if (!errors?.length) {
    return null;
  }
  const fields: ValidateFieldsError = {};
  errors.forEach((error) => {
    const field = error.field as string;
    fields[field] = fields[field] || [];
    fields[field].push(error);
  });
  return fields;
}

function isErrorObj(obj: unknown): obj is ValidateError {
  return !!(obj && typeof obj === 'object' && (obj as ValidateError).message !== undefined);
}

function getValue(value: Value, path: string[]): Value {
  let v = value;
  for (let i = 0; i < path.length; i++) {
    if (v === undefined || v === null) {
      return v;
    }
    v = v[path[i] as string];
  }
  return v;
}

/**
 * 把校验器产出的「裸消息」补成完整的错误对象。
 *
 * 返回**闭包**（上游也是），因为 `rule` / `source` 要在 `map` 时才能确定。
 *
 * ⭐ `fieldValue` 的取法分两种：
 * - 有 `fullFields`（嵌套字段）⇒ 按路径从 source 里取；
 * - 否则 ⇒ `source[oe.field || rule.fullField]`。
 */
export function complementError(
  rule: InternalRuleItem,
  source: Values,
): (oe: unknown) => ValidateError {
  return (oe: unknown) => {
    let fieldValue: Value;
    if (rule.fullFields) {
      fieldValue = getValue(source, rule.fullFields);
    } else {
      fieldValue = source[((oe as ValidateError).field || rule.fullField) as string];
    }

    if (isErrorObj(oe)) {
      oe.field = oe.field || rule.fullField;
      oe.fieldValue = fieldValue;
      return oe;
    }

    return {
      message: typeof oe === 'function' ? (oe as () => string)() : (oe as string),
      fieldValue,
      field: (oe as ValidateError).field || rule.fullField,
    };
  };
}

// ---------------------------------------------------------------------------
// 模板格式化
// ---------------------------------------------------------------------------

const formatRegExp = /%[sdj%]/g;

/**
 * `%s` / `%d` / `%j` / `%%` 的极简格式化。
 *
 * ⭐ 三条容易漏的：
 * 1. `template` 是**函数**时直接 `apply(args)`（不是当模板用）；
 * 2. 参数不够时**原样保留占位符**（`return x`），不抛错、不填空串；
 * 3. `%j` 遇到循环引用返回 `'[Circular]'`。
 */
// ⚠️ 函数形态的参数写成 `never[]` 而不是 `unknown[]`：
//    严格函数参数逆变下，`(a: string, b: string) => string` **不能**赋给
//    `(...args: unknown[]) => string`（unknown 不能赋给 string），
//    而 `never[]` 可以（never 可赋给一切）。上游是 JS，没有这个问题。
export function format(
  template: string | ((...args: never[]) => string),
  ...args: unknown[]
): string {
  let i = 0;
  const len = args.length;

  if (typeof template === 'function') {
    // `never[]` 与 `unknown[]` 的逆变差异导致 apply 需要一次断言（见上面的注释）
    return (template as (...a: unknown[]) => string).apply(null, args);
  }

  if (typeof template === 'string') {
    return template.replace(formatRegExp, (x) => {
      if (x === '%%') {
        return '%';
      }
      if (i >= len) {
        return x;
      }
      switch (x) {
        case '%s':
          return String(args[i++]);
        case '%d':
          return String(Number(args[i++]));
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch {
            return '[Circular]';
          }
        default:
          return x;
      }
    });
  }

  return template as unknown as string;
}

// ---------------------------------------------------------------------------
// 空值判定
// ---------------------------------------------------------------------------

/**
 * 哪些类型把「空字符串」视为空值。
 *
 * ⭐ 这是 `isEmptyValue` 的全部秘密：只有这 7 种类型下 `''` 才算空。
 * 所以 `type: 'number'` 时 `''` **不算空**（`number` validator 里有单独一行把它归一成 `undefined`）。
 */
function isNativeStringType(type: string | undefined): boolean {
  return (
    type === 'string' ||
    type === 'url' ||
    type === 'hex' ||
    type === 'email' ||
    type === 'date' ||
    type === 'pattern' ||
    type === 'tel'
  );
}

export function isEmptyValue(value: Value, type?: string): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (type === 'array' && Array.isArray(value) && !value.length) {
    return true;
  }
  if (isNativeStringType(type) && typeof value === 'string' && !value) {
    return true;
  }
  return false;
}

export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

// ---------------------------------------------------------------------------
// 合并
// ---------------------------------------------------------------------------

/**
 * ⭐ **不是深合并** —— 只展开一层。
 *
 * 上游的实现是 `target[s] = { ...target[s], ...value }`，
 * 所以三层嵌套的 `{a: {b: {c: 1}}}` 合并 `{a: {b: {d: 2}}}` 得到
 * `{a: {b: {d: 2}}}` —— `c` **被丢掉了**。这是既有行为，别"修"。
 */
export function deepMerge<T extends object>(target: T, source?: object): T {
  if (source) {
    const t = target as Record<string, unknown>;
    for (const s in source) {
      if (Object.hasOwn(source, s)) {
        const value = (source as Record<string, unknown>)[s];
        if (typeof value === 'object' && typeof t[s] === 'object') {
          t[s] = { ...(t[s] as object), ...(value as object) };
        } else {
          t[s] = value;
        }
      }
    }
  }
  return target;
}

// ---------------------------------------------------------------------------
// 异步编排
// ---------------------------------------------------------------------------

/** 校验失败时 reject 的错误类型。带 `errors` 与 `fields` 两个字段。 */
export class AsyncValidationError extends Error {
  errors: ValidateError[];
  fields: ValidateFieldsError | null;

  constructor(errors: ValidateError[], fields: ValidateFieldsError | null) {
    super('Async Validation Error');
    this.errors = errors;
    this.fields = fields;
  }
}

/** 全部并行：等最后一个完成（不管中间有没有错）。 */
function asyncParallelArray(
  arr: RuleValuePackage[],
  func: (data: RuleValuePackage, doIt: (errors?: ValidateError[] | null) => void) => void,
  callback: (results: ValidateError[]) => void,
): void {
  const results: ValidateError[] = [];
  let total = 0;
  const arrLength = arr.length;

  function count(errors?: ValidateError[] | null): void {
    results.push(...(errors || []));
    total++;
    if (total === arrLength) {
      callback(results);
    }
  }

  arr.forEach((a) => {
    func(a, count);
  });
}

/** 串行：**遇错立即停**，不再执行后续。 */
function asyncSerialArray(
  arr: RuleValuePackage[],
  func: (data: RuleValuePackage, doIt: (errors?: ValidateError[] | null) => void) => void,
  callback: (results: ValidateError[]) => void,
): void {
  let index = 0;
  const arrLength = arr.length;

  function next(errors?: ValidateError[] | null): void {
    if (errors?.length) {
      callback(errors);
      return;
    }
    const original = index;
    index = index + 1;
    if (original < arrLength) {
      func(arr[original] as RuleValuePackage, next);
    } else {
      callback([]);
    }
  }

  next([]);
}

function flattenObjArr(objArr: Record<string, RuleValuePackage[]>): RuleValuePackage[] {
  const ret: RuleValuePackage[] = [];
  Object.keys(objArr).forEach((k) => {
    ret.push(...(objArr[k] || []));
  });
  return ret;
}

/**
 * 按 `option.first` / `option.firstFields` 编排校验。
 *
 * ⭐ 两种策略：
 * - `first: true` ⇒ 全部展平成一条链**串行**，遇错即停（用 `asyncSerialArray`）；
 * - 否则 ⇒ 按字段分组，`firstFields` 里列出的字段串行、其余并行。
 *
 * ⭐ `pending.catch(e => e)` 是上游的写法：**吞掉 unhandled rejection**，
 * 但返回的 promise 仍然是 rejected 的 —— 所以 `await` 会抛，`.catch()` 能拿到。
 * 见契约 §6.2 的警告。
 */
export function asyncMap(
  objArr: Record<string, RuleValuePackage[]>,
  option: ValidateOption,
  func: (data: RuleValuePackage, doIt: (errors?: ValidateError[] | null) => void) => void,
  callback: (results: ValidateError[]) => void,
  source: Values,
): Promise<Values> {
  if (option.first) {
    const pending = new Promise<Values>((resolve, reject) => {
      const next = (errors: ValidateError[]): void => {
        callback(errors);
        if (errors.length) {
          reject(new AsyncValidationError(errors, convertFieldsError(errors)));
        } else {
          resolve(source);
        }
      };
      const flattenArr = flattenObjArr(objArr);
      asyncSerialArray(flattenArr, func, next as (errors: ValidateError[]) => void);
    });
    pending.catch((e) => e);
    return pending;
  }

  const firstFields = option.firstFields === true ? Object.keys(objArr) : option.firstFields || [];
  const objArrKeys = Object.keys(objArr);
  const objArrLength = objArrKeys.length;
  let total = 0;
  const results: ValidateError[] = [];

  const pending = new Promise<Values>((resolve, reject) => {
    const next = (errors: ValidateError[]): void => {
      results.push(...errors);
      total++;
      if (total === objArrLength) {
        callback(results);
        if (results.length) {
          reject(new AsyncValidationError(results, convertFieldsError(results)));
        } else {
          resolve(source);
        }
      }
    };

    if (!objArrKeys.length) {
      callback(results);
      resolve(source);
    }

    objArrKeys.forEach((key) => {
      const arr = objArr[key] as RuleValuePackage[];
      if (firstFields.indexOf(key) !== -1) {
        asyncSerialArray(arr, func, next);
      } else {
        asyncParallelArray(arr, func, next);
      }
    });
  });

  pending.catch((e) => e);
  return pending;
}
