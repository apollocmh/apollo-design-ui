// biome-ignore-all lint/suspicious/noTemplateCurlyInString: 本文件**故意**在普通字符串里写
// `${name}` —— 它们是给用户覆盖的**模板字面量文本**（由 replaceMessage 在运行时替换），
// 不是 JS 模板。改成反引号会被立即求值，反而全错。上游 `es/utils/messages.js` 同样如此。

/**
 * `validateMessages` 的默认模板 + 占位符替换。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/utils/messages.js`（48 行）
 * 与 `es/utils/validateUtil.js:13-21` 的 `replaceMessage`。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.6。
 *
 * ── ⚠️⚠️ 这是**第二套**模板，与 `schema.ts` 用的那套完全不同 ─────────────────
 *
 * | | 本文件（antd / rc-form 层） | `messages.ts`（async-validator 层） |
 * |---|---|---|
 * | 占位符 | `${name}` / `${type}` / `${min}` … | `%s` / `%d` / `%j` |
 * | 引号 | 自带（`"'${name}' is required"`） | 无 |
 * | 谁替换 | **我们**（`replaceMessage`） | async-validator 的 `format()` |
 * | 来源 | 用户通过 ConfigProvider 覆盖 | Schema 内部 |
 *
 * 两套的桥是 `replaceMessage`：`Schema` 用 `%s` 填出**带占位符的字符串**，
 * 再由 `replaceMessage` 把 `${name}` 之类换成实际值。
 *
 * ⚠️ 所以「用户覆盖 validateMessages」这条路**必须经过 replaceMessage** ——
 * 直接把本文件的对象交给 `Schema.messages()` 是错的（`Schema` 只认 `%s`）。
 */

/**
 * `types.*` 共用的模板。
 *
 * ⭐ 与 async-validator 的 `messages.ts` 不同：那边 14 个类型各有各的措辞
 * （`is not a` / `is not an` / `is not a valid` / 带 `(function)` 后缀），
 * 而**这里是同一个模板**。antd 层的文案更统一。
 */
const typeTemplate = "'${name}' is not a valid ${type}";

/**
 * antd `validateMessages` 的默认值。
 *
 * ⚠️ **逐字照抄**，包括单引号（`"'${name}' is required"` 里的 `'` 是文案的一部分，
 * 会原样出现在界面上）。
 */
export const defaultValidateMessages = {
  default: "Validation error on field '${name}'",
  required: "'${name}' is required",
  enum: "'${name}' must be one of [${enum}]",
  whitespace: "'${name}' cannot be empty",
  date: {
    format: "'${name}' is invalid for format date",
    parse: "'${name}' could not be parsed as date",
    invalid: "'${name}' is invalid date",
  },
  types: {
    string: typeTemplate,
    method: typeTemplate,
    array: typeTemplate,
    object: typeTemplate,
    number: typeTemplate,
    date: typeTemplate,
    boolean: typeTemplate,
    integer: typeTemplate,
    float: typeTemplate,
    regexp: typeTemplate,
    email: typeTemplate,
    tel: typeTemplate,
    url: typeTemplate,
    hex: typeTemplate,
  },
  string: {
    len: "'${name}' must be exactly ${len} characters",
    min: "'${name}' must be at least ${min} characters",
    max: "'${name}' cannot be longer than ${max} characters",
    range: "'${name}' must be between ${min} and ${max} characters",
  },
  number: {
    len: "'${name}' must equal ${len}",
    min: "'${name}' cannot be less than ${min}",
    max: "'${name}' cannot be greater than ${max}",
    range: "'${name}' must be between ${min} and ${max}",
  },
  array: {
    len: "'${name}' must be exactly ${len} in length",
    min: "'${name}' cannot be less than ${min} in length",
    max: "'${name}' cannot be greater than ${max} in length",
    range: "'${name}' must be between ${min} and ${max} in length",
  },
  pattern: {
    mismatch: "'${name}' does not match pattern ${pattern}",
  },
};

/**
 * 占位符匹配：`${name}` 形态。
 *
 * ⭐ `\\?` 那一段是**转义支持**：`\${name}` 表示"字面输出 `${name}`"（不替换）。
 * 见下面的分支。
 */
const TEMPLATE_RE = /\\?\$\{\w+\}/g;

/**
 * 把模板里的 `${key}` 替换成 `kv[key]`。
 *
 * ⭐ 两条语义：
 * 1. `\${name}`（带反斜杠）⇒ 去掉反斜杠、**原样输出** `${name}`（不替换）；
 * 2. `${name}` ⇒ 取 `kv.name`。
 *
 * ⚠️ `kv` 里没有的键会得到 `undefined`，被 `String.replace` 转成字符串 `'undefined'`。
 * 上游同样如此 —— 这不是 bug，是"用户写了未提供的变量"时的可见信号。
 *
 * @param template 模板（可能是用户从 `validateMessages` 传进来的任意字符串）
 * @param kv 变量表
 */
export function replaceMessage(template: string, kv: Record<string, unknown>): string {
  return template.replace(TEMPLATE_RE, (str) => {
    if (str.startsWith('\\')) {
      return str.slice(1);
    }
    const key = str.slice(2, -1);
    return kv[key] as string;
  });
}
