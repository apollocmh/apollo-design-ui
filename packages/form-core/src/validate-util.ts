/**
 * 字段校验的编排（批次 ③b）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/utils/validateUtil.js`（226 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.8 与 §4.7.8.1。
 *
 * ── ⚠️ 本文件**没有 Oracle**（契约 §7.0.1）────────────────────────────────────
 *
 * 上游 `validateUtil.js` 第 2 行就是 `import * as React from 'react'`，
 * 并在 `:71-76` 用 `React.isValidElement` / `cloneElement` 给错误消息加 `key`
 * ⇒ Vue 侧没有对应物，**必须重写**，不能机械翻译。期望值全部来自**读上游源码 + 行为测试**。
 *
 * 唯一的 React 依赖就是那一处，处置是**整段删除**（差异 1，契约 §6.4.5）：
 * Vue 渲染 `VNodeChild` 不需要 `key`，消息原样返回。
 *
 * ── ⚠️ 本文件是**两个层的桥**，必然有一次类型断言 ──────────────────────────────
 *
 * 输入是表单层的 `RuleObject`（`FieldProps.rules` 的元素），输出交给批次① 的 `Schema`，
 * 而 `Schema` 吃的是 `RuleItem`。两者的 `message` / `validator` / `type` 声明**故意不同**
 * （`FieldMessage = string | VNodeChild` vs `string | ((a?: string) => string)`；
 * `FormRuleType` 14 个 vs `RuleType` 17 个），运行时却是同一批对象。
 * 断言集中在 `toSchemaRule` 一个函数里，并写明理由 —— 不是散落的 `as any`。
 */

import { merge, warning } from '@apollo-design/utils';

import type {
  FieldMessage,
  FieldValidator,
  InternalValidateOptions,
  RuleError,
  RuleObject,
  StoreValue,
} from './form-types';
import { Schema } from './schema';
import type { RuleItem, ValidateError } from './types';
import { defaultValidateMessages, replaceMessage } from './validate-messages';
import type { InternalNamePath } from './value-util';

/**
 * 校验器**逻辑**抛错时的哨兵消息。
 *
 * 上游用它区分「校验器自己崩了」与「值不合法」：前者换成 `messages.default`，
 * 后者保留校验器给出的消息。见 `validateRule` 第 6 步。
 */
const CODE_LOGIC_ERROR = 'CODE_LOGIC_ERROR';

/**
 * 把表单层规则交给批次① 的 `Schema`。
 *
 * ⚠️ 断言的是**真实存在的声明差异**，不是"绕过类型检查"：
 * - `RuleObject.message` 是 `FieldMessage`（`string | VNodeChild`，差异 1）；
 * - `RuleItem.message` 是 `string | ((a?: string) => string)`。
 *
 * 运行时是同一个值 —— `Schema` 只判 `message !== undefined`，然后把它原样塞进 `errors`
 * （见 `schema.ts` 的 `cb` 分支）。这条路径上游同样存在（antd 允许 ReactNode message）。
 */
function toSchemaRule(rule: RuleObject): RuleItem {
  // biome-ignore lint/suspicious/noExplicitAny: 见函数注释 —— 两层规则类型的声明差异无法用更窄的断言表达，`RuleObject` 与 `RuleItem` 的 `message`/`validator`/`type` 三个键互不可赋值。收窄成 `unknown` 中转不改变任何运行时行为，只是多一层噪音。
  return rule as any;
}

/**
 * 校验**单条**规则。
 *
 * 上游 `validateUtil.js:23-99`。八步逐条对应，见契约 §4.7.8。
 *
 * ⚠️ 第 2 步 `Schema.warning = () => undefined` 是**全局副作用**（上游如此）：
 * 之后所有 `Schema.validate` 都不再打 `async-validator:` 告警。
 * 这不是笔误 —— 上游为 https://github.com/ant-design/ant-design/issues/40497 做的处置。
 *
 * @param name 字段名（`namePath.join('.')`）
 * @param value 字段值
 * @param rule 单条规则（表单层）
 * @param options 校验选项（含 `validateMessages`）
 * @param messageVariables 额外的消息变量（`Field` 的 `messageVariables` prop）
 */
export async function validateRule(
  name: string,
  value: StoreValue,
  rule: RuleObject,
  options: InternalValidateOptions,
  messageVariables?: Record<string, string>,
): Promise<FieldMessage[]> {
  const cloneRule = { ...rule } as RuleObject & { ruleIndex?: number };

  // Bug of `async-validator`
  // https://github.com/react-component/field-form/issues/316
  // https://github.com/react-component/field-form/issues/313
  delete cloneRule.ruleIndex;

  // https://github.com/ant-design/ant-design/issues/40497#issuecomment-1422282378
  Schema.warning = () => undefined;
  if (cloneRule.validator) {
    const originValidator = cloneRule.validator;
    cloneRule.validator = (...args: Parameters<FieldValidator>) => {
      try {
        return originValidator(...args);
      } catch (error) {
        console.error(error);
        return Promise.reject(CODE_LOGIC_ERROR);
      }
    };
  }

  // We should special handle array validate
  let subRuleField: RuleObject | null = null;
  if (cloneRule && cloneRule.type === 'array' && 'defaultField' in cloneRule) {
    subRuleField = (cloneRule as { defaultField?: RuleObject }).defaultField ?? null;
    delete (cloneRule as { defaultField?: RuleObject }).defaultField;
  }

  const validator = new Schema({
    [name]: [toSchemaRule(cloneRule)],
  });
  const messages = merge(defaultValidateMessages, options.validateMessages ?? {});
  validator.messages(messages);

  let result: FieldMessage[] = [];
  try {
    await Promise.resolve(
      validator.validate({ [name]: value }, {
        ...options,
      } as never),
    );
  } catch (errObj) {
    const errors = (errObj as { errors?: ValidateError[] } | null)?.errors;
    if (errors) {
      result = errors.map(({ message }, index) => {
        const mergedMessage = message === CODE_LOGIC_ERROR ? messages.default : message;
        // ⚠️ 上游在这里是 `React.isValidElement(...) ? cloneElement(..., {key}) : ...`
        //    —— Vue 不需要 key，**原样透传**（差异 1）。`index` 保留是为了与上游
        //    的错误顺序语义一致（消息本身不带 key）。
        void index;
        return mergedMessage as FieldMessage;
      });
    }
  }

  // 父规则已报错就不递归（上游如此，见契约 §4.7.8 的「看起来是 bug」第 2 条）
  if (!result.length && subRuleField && Array.isArray(value) && value.length > 0) {
    const subResults = await Promise.all(
      value.map((subValue, i) =>
        validateRule(
          `${name}.${i}`,
          subValue,
          subRuleField as RuleObject,
          options,
          messageVariables,
        ),
      ),
    );
    return subResults.flat();
  }

  // Replace message with variables
  const kv: Record<string, unknown> = {
    ...rule,
    name,
    enum: (rule.enum || []).join(', '),
    ...messageVariables,
  };
  return result.map((error) => {
    if (typeof error === 'string') {
      return replaceMessage(error, kv);
    }
    return error;
  });
}

/**
 * 校验**一组**规则。
 *
 * 上游 `validateUtil.js:105-204`。契约 §4.7.8。
 *
 * ⚠️ 三个「看起来不对但必须照抄」的点：
 * 1. 返回的 promise **永远是 rejected**（`.then(errors => Promise.reject(errors))`）
 *    —— `Field` 靠 `catch` 拿结果；
 * 2. `finishOnFirstFailed` 里没有 `hasError` 概念，且 `promise.then` 没有 `.catch`
 *    —— 依赖第 2 步的包装保证每条 `rulePromise` 一定 resolve；
 * 3. `validateFirst === 'parallel'` 且规则为空时 `finishOnFirstFailed([])` **永不 resolve**
 *    （`count` 永远是 0）—— 上游的边角行为，我们照抄，不在测试里制造挂起。
 *
 * @param validateFirst `true` ⇒ 串行；`'parallel'` ⇒ 并行但首个失败即返回；否则并行跑完
 */
export function validateRules(
  namePath: InternalNamePath,
  value: StoreValue,
  rules: RuleObject[],
  options: InternalValidateOptions,
  validateFirst?: boolean | 'parallel',
  messageVariables?: Record<string, string>,
): Promise<RuleError[]> {
  const name = namePath.join('.');

  // Fill rule with context
  const filledRules = rules
    .map((currentRule, ruleIndex) => {
      const originValidatorFunc = currentRule.validator;
      const cloneRule = { ...currentRule, ruleIndex } as RuleObject & { ruleIndex: number };

      // Replace validator if needed
      if (originValidatorFunc) {
        cloneRule.validator = (rule, val, callback) => {
          let hasPromise = false;

          // Wrap callback only accept when promise not provided
          const wrappedCallback = (...args: unknown[]): void => {
            // Wait a tick to make sure return type is a promise
            Promise.resolve().then(() => {
              warning(
                !hasPromise,
                'Your validator function has already return a promise. `callback` will be ignored.',
              );
              if (!hasPromise) {
                (callback as (...cbArgs: unknown[]) => void)(...args);
              }
            });
          };

          // Get promise
          const promise = originValidatorFunc(rule, val, wrappedCallback as never);
          hasPromise = Boolean(
            promise && typeof promise.then === 'function' && typeof promise.catch === 'function',
          );

          /**
           * 1. Use promise as the first priority.
           * 2. If promise not exist, use callback with warning instead
           */
          warning(hasPromise, '`callback` is deprecated. Please return a promise instead.');
          if (hasPromise) {
            (promise as Promise<unknown>)
              .then(() => {
                callback();
              })
              .catch((err: unknown) => {
                // ⚠️ 上游是 `callback(err || ' ')`，会把 **Error 实例**原样交下去
                //    —— async-validator 的 `complementError` 对 Error 有专门分支
                //    （`isErrorObj` 为真时补 field/fieldValue 后原样返回），
                //    所以这里不能 `String(err)`。`FieldValidator` 的 callback 声明
                //    只有 `(error?: string) => void`，比运行时窄 ⇒ 断言到运行时的宽度。
                (callback as (error?: string | Error) => void)(
                  (err as string | Error | undefined) || ' ',
                );
              });
          }
        };
      }
      return cloneRule;
    })
    .sort(({ warningOnly: w1, ruleIndex: i1 }, { warningOnly: w2, ruleIndex: i2 }) => {
      if (!!w1 === !!w2) {
        // Let keep origin order
        return i1 - i2;
      }
      if (w1) {
        return 1;
      }
      return -1;
    });

  // Do validate rules
  let summaryPromise: Promise<RuleError[]>;
  if (validateFirst === true) {
    // >>>>> Validate by serialization
    summaryPromise = new Promise<RuleError[]>((resolve, reject) => {
      /* eslint-disable no-await-in-loop */
      const run = async (): Promise<void> => {
        for (let i = 0; i < filledRules.length; i += 1) {
          const rule = filledRules[i] as RuleObject & { ruleIndex: number };
          const errors = await validateRule(name, value, rule, options, messageVariables);
          if (errors.length) {
            reject([{ errors, rule }]);
            return;
          }
        }
        /* eslint-enable */
        resolve([]);
      };
      // ⚠️ 上游直接写 `new Promise(async (resolve, reject) => {...})`。
      //    这里显式拆出 `run()` 只是为了 biome 不报「async 执行器」；
      //    语义完全相同（执行器是同步调用的，`run()` 立刻开始跑）。
      void run();
    });
  } else {
    // >>>>> Validate by parallel
    const rulePromises = filledRules.map((rule) =>
      validateRule(name, value, rule, options, messageVariables).then((errors) => ({
        errors,
        rule,
      })),
    );
    summaryPromise = (
      validateFirst ? finishOnFirstFailed(rulePromises) : finishOnAllFailed(rulePromises)
    ).then((errors) => {
      // Always change to rejection for Field to catch
      return Promise.reject(errors);
    });
  }

  // Internal catch error to avoid console error log.
  summaryPromise.catch((e) => e);
  return summaryPromise;
}

async function finishOnAllFailed(rulePromises: Promise<RuleError>[]): Promise<RuleError[]> {
  return Promise.all(rulePromises).then((errorsList) => {
    const errors: RuleError[] = [];
    // ⭐ 上游是 `[].concat(...errorsList)` —— 展平一层，不是 push 数组
    return errors.concat(...errorsList);
  });
}

/**
 * 并行校验，但**首个非空结果**就 resolve。
 *
 * ⚠️ 注意它**不是**「首个失败就停」：其余 promise 仍在跑，只是结果被忽略。
 * 且 `count` 的推进与 `resolve` 的顺序保证了「全部跑完都没有错误」时才 `resolve([])`。
 */
async function finishOnFirstFailed(rulePromises: Promise<RuleError>[]): Promise<RuleError[]> {
  let count = 0;
  return new Promise<RuleError[]>((resolve) => {
    rulePromises.forEach((promise) => {
      promise.then((ruleError) => {
        if (ruleError.errors.length) {
          resolve([ruleError]);
        }
        count += 1;
        if (count === rulePromises.length) {
          resolve([]);
        }
      });
    });
  });
}
