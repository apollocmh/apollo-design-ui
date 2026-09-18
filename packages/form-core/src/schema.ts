/**
 * `Schema` —— 校验引擎的主类。
 *
 * 契约来源：`@rc-component/async-validator@6.0.0/es/index.js`（273 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.1。
 *
 * ── 一个必须写下来的结论 ──────────────────────────────────────────────────────
 *
 * 上游是**纯 JS**（无 React 耦合），所以本文件是**逐行移植**而不是"Vue 化改写"。
 * `AGENTS.md` 的 H3（禁止机械翻译）约束的是 React→Vue 的改写；
 * 对无框架耦合的纯逻辑，照抄就是正确做法（与 `utils` 移植 rc-util 同理）。
 *
 * ── `validate` 的双通道（契约 §8 P1） ────────────────────────────────────────
 *
 * ⭐ 失败时 **callback 被调用 _且_ 返回的 Promise reject**（`AsyncValidationError`）。
 * 调用方 `await schema.validate(...)` 会抛；`schema.validate(...).catch(...)` 也能拿到。
 * 别只处理一边 —— 只 await 不 catch 会踩 `unhandledRejection`。
 */

import { messages as defaultMessages, newMessages } from './messages';
import type {
  InternalRuleItem,
  Rule,
  RuleItem,
  Rules,
  RuleValuePackage,
  ValidateCallback,
  ValidateError,
  ValidateFieldsError,
  ValidateMessages,
  ValidateOption,
  Value,
  Values,
} from './types';
import { asyncMap, complementError, convertFieldsError, deepMerge, format, warning } from './util';
import validators from './validators';

/** 校验器可接受的返回值。 */
type ValidatorReturn = unknown;

export class Schema {
  // ========================= 静态 =========================

  /**
   * 注册自定义类型的校验器。
   *
   * ⚠️ **全局副作用** —— `validators` 是模块级对象，注册会影响所有 `Schema` 实例。
   * antd 的 `Form` 用它扩展 `enum` 等类型。裁决见契约 §8 P4。
   */
  static register(type: string, validator: unknown): void {
    if (typeof validator !== 'function') {
      throw new Error('Cannot register a validator by type, validator is not a function');
    }
    validators[type] = validator as never;
  }

  static warning = warning;
  static messages = defaultMessages;
  static validators = validators;

  // ========================= 实例 =========================

  rules: Record<string, RuleItem[]> | null = null;
  private _messages: ValidateMessages = defaultMessages;

  constructor(descriptor?: Rules) {
    this.define(descriptor);
  }

  define(rules?: Rules): void {
    if (!rules) {
      throw new Error('Cannot configure a schema with no rules');
    }
    if (typeof rules !== 'object' || Array.isArray(rules)) {
      throw new Error('Rules must be an object');
    }
    this.rules = {};
    Object.keys(rules).forEach((name) => {
      const item = rules[name] as Rule;
      // ⭐ 每条规则归一化成数组
      (this.rules as Record<string, RuleItem[]>)[name] = Array.isArray(item) ? item : [item];
    });
  }

  messages(messages?: Partial<ValidateMessages>): ValidateMessages {
    if (messages) {
      this._messages = deepMerge(newMessages(), messages) as unknown as ValidateMessages;
    }
    return this._messages;
  }

  // ========================= validate =========================

  // ⭐ 三种形态都来自上游的 `validate(source, o = {}, oc = () => {})`
  validate(source: Values): Promise<Values>;
  validate(source: Values, callback: ValidateCallback): Promise<Values>;
  validate(source: Values, options: ValidateOption, callback: ValidateCallback): Promise<Values>;
  // ⚠️ 参数名照抄上游的 `o` / `oc` —— 下面会把它们重绑成 `options` / `callback`
  validate(
    source: Values,
    o?: ValidateOption | ValidateCallback,
    oc?: ValidateCallback,
  ): Promise<Values> {
    let source_: Values = source;
    let options: ValidateOption = {};
    let callback: ValidateCallback = () => {};

    if (typeof o === 'function') {
      callback = o as ValidateCallback;
    } else {
      options = (o as ValidateOption) || {};
      callback = oc || (() => {});
    }

    // -------- 早退 --------
    if (!this.rules || Object.keys(this.rules).length === 0) {
      if (callback) {
        callback(null, source_);
      }
      return Promise.resolve(source_);
    }

    const theRules = this.rules;

    function complete(results: (ValidateError | ValidateError[])[]): void {
      let errors: ValidateError[] = [];
      function add(e: ValidateError | ValidateError[]): void {
        if (Array.isArray(e)) {
          // ⭐ 展平用的是 concat(...e)，不是 push(e)
          errors = errors.concat(...e);
        } else {
          errors.push(e);
        }
      }
      for (let i = 0; i < results.length; i++) {
        add(results[i] as ValidateError | ValidateError[]);
      }
      if (!errors.length) {
        callback(null, source_);
      } else {
        callback(errors, convertFieldsError(errors) as ValidateFieldsError);
      }
    }

    // -------- messages 解析 --------
    if (options.messages) {
      let msgs = this.messages() as unknown as Record<string, unknown>;
      // ⭐ 防线：`_messages` 初始就指向模块级 defaultMessages，
      //    直接 deepMerge 会污染全局默认值
      if (msgs === (defaultMessages as unknown as Record<string, unknown>)) {
        msgs = newMessages() as unknown as Record<string, unknown>;
      }
      deepMerge(msgs, options.messages as object);
      options.messages = msgs as unknown as Partial<ValidateMessages>;
    } else {
      options.messages = this.messages() as Partial<ValidateMessages>;
    }

    // -------- 构建 series --------
    const series: Record<string, RuleValuePackage[]> = {};
    const keys = options.keys || Object.keys(theRules);

    keys.forEach((z) => {
      const arr = theRules[z] as RuleItem[];
      const value = source_[z];

      arr.forEach((r) => {
        let rule = r as InternalRuleItem;
        let currentValue = value;

        if (typeof (rule as RuleItem).transform === 'function') {
          // ⭐ 首次 transform 时浅拷贝 source，避免污染入参
          if (source_ === source) {
            source_ = { ...source_ };
          }
          const transformed = (rule as RuleItem).transform?.(currentValue) as Value;
          currentValue = transformed;
          source_[z] = transformed;
          if (transformed !== undefined && transformed !== null) {
            // ⚠️ `typeof` 可能返回 'bigint'/'symbol'/'function'（不在 RuleType 里）——
            //    上游是 JS 无类型，这里断言即可（运行时行为完全一致）
            rule.type =
              rule.type ||
              ((Array.isArray(transformed) ? 'array' : typeof transformed) as RuleItem['type']);
          }
        }

        if (typeof rule === 'function') {
          rule = { validator: rule as unknown as RuleItem['validator'] } as InternalRuleItem;
        } else {
          // ⭐ 复制，不改调用方的规则对象
          rule = { ...rule };
        }

        rule.validator = this.getValidationMethod(rule) as InternalRuleItem['validator'];
        if (!rule.validator) {
          // ⭐ 没有可用的校验方法 ⇒ 静默跳过这条规则
          return;
        }

        rule.field = z;
        rule.fullField = rule.fullField || z;
        rule.type = this.getType(rule) as RuleItem['type'];

        series[z] = series[z] || [];
        series[z].push({ rule, value: currentValue, source: source_, field: z });
      });
    });

    // -------- 执行 --------
    const errorFields: Record<string, number> = {};

    return asyncMap(
      series,
      options,
      (data, doIt) => {
        const rule = data.rule;
        const ruleType = rule.type;

        let deep =
          (ruleType === 'object' || ruleType === 'array') &&
          (typeof rule.fields === 'object' || typeof rule.defaultField === 'object');
        deep = deep && (rule.required || (!rule.required && data.value));

        rule.field = data.field;

        function addFullField(key: string, schema: RuleItem): InternalRuleItem {
          return {
            ...schema,
            fullField: `${rule.fullField}.${key}`,
            fullFields: rule.fullFields ? [...rule.fullFields, key] : [key],
          } as InternalRuleItem;
        }

        function cb(e: ValidateError[] | string | Error = []): void {
          let errorList: ValidateError[] = Array.isArray(e) ? e : [e as ValidateError];

          if (!options.suppressWarning && errorList.length) {
            Schema.warning('async-validator:', errorList);
          }

          // ⭐ 自定义 message 覆盖所有校验器产出的消息
          if (errorList.length && rule.message !== undefined && rule.message !== null) {
            errorList = ([] as ValidateError[]).concat(rule.message as unknown as ValidateError);
          }

          let filledErrors = errorList.map(complementError(rule, data.source));

          if (options.first && filledErrors.length) {
            errorFields[rule.field as string] = 1;
            doIt(filledErrors);
            return;
          }

          if (!deep) {
            doIt(filledErrors);
            return;
          }

          // -------- 嵌套：required 且无值 ⇒ 不再往下 --------
          if (rule.required && !data.value) {
            if (rule.message !== undefined) {
              filledErrors = ([] as ValidateError[])
                .concat(rule.message as unknown as ValidateError)
                .map(complementError(rule, data.source));
            } else if (options.error) {
              filledErrors = [
                options.error(rule, format(options.messages?.required as string, rule.field)),
              ];
            }
            doIt(filledErrors);
            return;
          }

          // -------- 嵌套：合成子 schema --------
          let fieldsSchema: Record<string, Rule> = {};
          if (rule.defaultField) {
            Object.keys(data.value).forEach((key) => {
              fieldsSchema[key] = rule.defaultField as Rule;
            });
          }
          fieldsSchema = { ...fieldsSchema, ...(rule.fields as Record<string, Rule>) };

          // ⚠️ 用 InternalRuleItem[] —— 子规则带上了 fullField/fullFields，
          //    与 RuleItem[] 不是同一个类型（validator 的签名更宽）
          const paredFieldsSchema: Record<string, InternalRuleItem[]> = {};
          Object.keys(fieldsSchema).forEach((field) => {
            const fieldSchema = fieldsSchema[field] as Rule;
            const fieldSchemaList = Array.isArray(fieldSchema) ? fieldSchema : [fieldSchema];
            paredFieldsSchema[field] = fieldSchemaList.map(addFullField.bind(null, field));
          });

          const schema = new Schema(paredFieldsSchema as Rules);
          schema.messages(options.messages);
          if (rule.options) {
            rule.options.messages = options.messages;
            rule.options.error = options.error;
          }

          schema.validate(data.value, rule.options || options, (errs) => {
            const finalErrors: ValidateError[] = [];
            if (filledErrors?.length) {
              finalErrors.push(...filledErrors);
            }
            if (errs?.length) {
              finalErrors.push(...errs);
            }
            doIt(finalErrors.length ? finalErrors : null);
          });
        }

        let res: ValidatorReturn;

        if (rule.asyncValidator) {
          res = rule.asyncValidator(
            rule,
            data.value,
            cb as unknown as (error?: string | Error) => void,
            data.source,
            options,
          );
        } else if (rule.validator) {
          try {
            res = (rule.validator as (...args: unknown[]) => ValidatorReturn)(
              rule,
              data.value,
              cb,
              data.source,
              options,
            );
          } catch (error) {
            console.error?.(error);
            // ⭐ 异步重抛：让「校验器写错」不被静默吞掉（生产环境不重抛）
            if (!options.suppressValidatorError) {
              setTimeout(() => {
                throw error;
              }, 0);
            }
            cb((error as Error).message);
          }

          if (res === true) {
            cb();
          } else if (res === false) {
            cb(
              typeof rule.message === 'function'
                ? rule.message(rule.fullField || rule.field)
                : rule.message || `${rule.fullField || rule.field} fails`,
            );
          } else if (Array.isArray(res)) {
            cb(res as ValidateError[]);
          } else if (res instanceof Error) {
            cb(res.message);
          }
        }

        // ⭐ thenable 也支持（asyncValidator 常返回 Promise）
        if (res && (res as Promise<unknown>).then) {
          (res as Promise<unknown>).then(
            () => cb(),
            (err) => cb(err as ValidateError[]),
          );
        }
      },
      (results) => {
        complete(results as (ValidateError | ValidateError[])[]);
      },
      source_,
    );
  }

  // ========================= 内部 =========================

  getType(rule: InternalRuleItem): string {
    if (rule.type === undefined && rule.pattern instanceof RegExp) {
      rule.type = 'pattern';
    }
    if (
      typeof rule.validator !== 'function' &&
      rule.type &&
      !Object.hasOwn(validators, rule.type)
    ) {
      throw new Error(format('Unknown rule type %s', rule.type));
    }
    // ⭐ 默认类型是 string，不是 any
    return rule.type || 'string';
  }

  getValidationMethod(rule: InternalRuleItem): unknown {
    if (typeof rule.validator === 'function') {
      return rule.validator;
    }

    const keys = Object.keys(rule);
    const messageIndex = keys.indexOf('message');
    if (messageIndex !== -1) {
      keys.splice(messageIndex, 1);
    }

    // ⭐ 只有 required 一个键（message 不算）⇒ 用不做类型检查的 required
    if (keys.length === 1 && keys[0] === 'required') {
      return validators.required;
    }

    return validators[this.getType(rule)] || undefined;
  }
}

export default Schema;
