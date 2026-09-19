/**
 * 校验状态 → 类名。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/statusUtils.js` 的 `getStatusClassNames`
 * （逐字对齐，包括五个键的**固定顺序**）。
 *
 * ── 为什么在本组件目录里 ───────────────────────────────────────────────────────
 *
 * antd 的 `_util/statusUtils.ts` 同时服务 Input / Select / Form.Item / Space.Addon
 * 等十几个组件，其中 `getMergedStatus` 依赖 `form/FormItem` 的 `ValidateStatus`。
 * 我们目前只有 `Space.Addon` 一个消费者（`form-core` 的 `ValidateStatus` 尚未落地），
 * 所以按「三次法则」先落在本目录，等 `Input` 落地时再提升。
 *
 * ── 类型上的两处取舍 ───────────────────────────────────────────────────────────
 *
 * 1. antd 的 `status` 参数类型是 `ValidateStatus`（来自 `form/FormItem`），
 *    `InputStatus` 是它自己的一份联合。两者**字面量完全相同**：
 *    `'' | 'success' | 'warning' | 'error' | 'validating'`。
 *    我们没有 form 包，所以直接声明 `InputStatus` 并用它当参数类型 ——
 *    这是结构等价而不是放宽：少了一个不可能出现的类型来源。
 *
 * 2. `hasFeedback` 参数保留了（antd 的签名有它），但 `Space.Addon` 不传 ——
 *    与 antd 一致（`Addon.tsx:36` 只传两个参数）。留着是为了将来
 *    `Form.Item` 复用同一个函数时不必再改签名。
 */

/** 校验状态。与 antd 的 `_InputStatuses` 逐字相同（含空串）。 */
const INPUT_STATUSES = ['warning', 'error', '', 'success', 'validating'] as const;

export type InputStatus = (typeof INPUT_STATUSES)[number];

/**
 * 状态 → 类名（空格分隔；无匹配时返回空串）。
 *
 * ⚠️ 判据是 `status === 'success'` 这类**等值**比较，不是真值判断 ——
 *    所以 `status=''`（`InputStatus` 的合法取值之一）不产生任何类名，
 *    而它确实是「显式传了一个空状态」，不是「没传」。
 */
export function getStatusClassNames(
  prefixCls: string,
  status?: InputStatus,
  hasFeedback?: boolean,
): string {
  const names: string[] = [];
  if (status === 'success') names.push(`${prefixCls}-status-success`);
  if (status === 'warning') names.push(`${prefixCls}-status-warning`);
  if (status === 'error') names.push(`${prefixCls}-status-error`);
  if (status === 'validating') names.push(`${prefixCls}-status-validating`);
  if (hasFeedback) names.push(`${prefixCls}-has-feedback`);
  return names.join(' ');
}
