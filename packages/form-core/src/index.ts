/**
 * @apollo-design/form-core
 *
 * 表单状态机 + 字段校验引擎。替代 `@rc-component/form` 与 `@rc-component/async-validator`。
 *
 * 契约文档：`docs/foundation/form-core-contract.md`（**先于实现存在**）。
 *
 * ── ⚠️ 分批实现，本文件当前只导出**批次 ①（校验引擎）** ──────────────────────
 *
 * | 批次 | 内容 | 状态 |
 * |---|---|---|
 * | ① | 校验引擎：`Schema` + util + messages + 7 rule + 17 validator | ✅ 已实现 |
 * | ② | 取值工具：namePath 的 get/set/比较、`NameMap`、`validateMessages` 默认模板 | ✅ 已实现 |
 * | ③ | 状态机：`FormStore` + `useForm` + `Field` 注册与联动 + 三个 Context | ⬜ 待做 |
 *
 * 分批理由见契约 §3。**批次 ③ 开工前必须先有 `ui/src/form` 的骨架**，
 * 否则会重复 `overlay` 的处境（契约封了但无人消费，API 形状无从校验）。
 *
 * ── 边界 ──────────────────────────────────────────────────────────────────────
 *
 * 本包**不产出任何 UI**（`Form.Item` 的布局、错误展示属 `ui`），
 * 不定义颜色/圆角/阴影，不产 CSS（R4）。
 */

// ---------------------------------------------------------------------------
// 消息模板
// ---------------------------------------------------------------------------
export { messages, newMessages } from './messages';
// ---------------------------------------------------------------------------
// 批次② 取值工具（namePath / NameMap / validateMessages）
// ---------------------------------------------------------------------------
export { NameMap } from './name-map';
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
export type { InternalNamePath, NamePath } from './value-util';
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

// ---------------------------------------------------------------------------
// 默认导出
// ---------------------------------------------------------------------------
import { Schema } from './schema';

export default Schema;
