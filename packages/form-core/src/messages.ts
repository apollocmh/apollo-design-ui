/**
 * 校验消息模板。
 *
 * 契约来源：`@rc-component/async-validator@6.0.0/es/messages.js`（55 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.3。
 *
 * ⚠️⚠️ **所有文案都是逐字的，不要"顺手"改得更通顺**。两个具体例子：
 *
 * - `types.array` / `types.object` / `types.integer` 用的是 `'%s is not an %s'`
 *   （`an` 而不是 `a`）—— 上游就这样。
 * - `types.method` 是 `'%s is not a %s (function)'`，比其它类型多一个后缀。
 *
 * 这些字符串会**原样出现在用户界面上**，改一个字母就是与 antd 的可见差异。
 *
 * ⚠️ `clone()` 用 `JSON.parse(JSON.stringify(this))` 实现 —— 所以 messages 里
 * **不能放函数**（会被序列化掉）。`ValidateMessage` 类型允许函数，但 `clone()` 会丢它们；
 * 上游同样如此，我们不"修"这个行为（`clone` 只用于产出可安全 deepMerge 的副本）。
 */

import type { InternalValidateMessages } from './types';

/**
 * 产出一份**全新**的默认模板。
 *
 * ⭐ 每次调用返回新对象（而不是共享一个常量）—— 因为 `Schema.messages()` 会
 * `deepMerge` 到它上面，共享会导致跨实例污染。见契约 §4.1.4 的
 * `messages === defaultMessages` 那道防线。
 */
export function newMessages(): InternalValidateMessages {
  return {
    default: 'Validation error on field %s',
    required: '%s is required',
    enum: '%s must be one of %s',
    whitespace: '%s cannot be empty',
    date: {
      format: '%s date %s is invalid for format %s',
      parse: '%s date could not be parsed, %s is invalid ',
      invalid: '%s date %s is invalid',
    },
    types: {
      string: '%s is not a %s',
      method: '%s is not a %s (function)',
      array: '%s is not an %s',
      object: '%s is not an %s',
      number: '%s is not a %s',
      date: '%s is not a %s',
      boolean: '%s is not a %s',
      integer: '%s is not an %s',
      float: '%s is not a %s',
      regexp: '%s is not a valid %s',
      email: '%s is not a valid %s',
      tel: '%s is not a valid %s',
      url: '%s is not a valid %s',
      hex: '%s is not a valid %s',
    },
    string: {
      len: '%s must be exactly %s characters',
      min: '%s must be at least %s characters',
      max: '%s cannot be longer than %s characters',
      range: '%s must be between %s and %s characters',
    },
    number: {
      len: '%s must equal %s',
      min: '%s cannot be less than %s',
      max: '%s cannot be greater than %s',
      range: '%s must be between %s and %s',
    },
    array: {
      len: '%s must be exactly %s in length',
      min: '%s cannot be less than %s in length',
      max: '%s cannot be greater than %s in length',
      range: '%s must be between %s and %s in length',
    },
    pattern: {
      mismatch: '%s value %s does not match pattern %s',
    },
    clone() {
      const cloned = JSON.parse(JSON.stringify(this)) as InternalValidateMessages;
      cloned.clone = this.clone;
      return cloned;
    },
  };
}

/**
 * 模块级默认模板。
 *
 * ⚠️ 它是**共享单例**。`Schema` 实例的 `_messages` 初始指向它，
 * 但 `Schema.messages(m)` 一定会先 `newMessages()` 再合并（见 `schema.ts`），
 * 所以这条共享路径不会被写坏。别在任何地方直接改它。
 */
export const messages = newMessages();
