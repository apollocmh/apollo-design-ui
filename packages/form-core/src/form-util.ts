/**
 * 表单层的小工具（批次 ③）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/utils/typeUtil.js`（8 行）。
 * ⚠️ 该文件里的 `toArray` **不在这里** —— 它在批次② 已按 namePath 语义实现于
 * `value-util.ts`（`PITFALLS.md` 第 70 条：与 `utils` 的 children 版 `toArray`
 * 同名不同义）。
 */

import type { InternalFormInstance } from './form-types';

/**
 * 判断一个值是不是 `FormStore.getForm()` 产出的表单实例。
 *
 * ⭐ 判据是 `_init`（`getForm()` 里写死的 `true`）—— 上游如此。
 * 用 `_init` 而不是 `instanceof FormStore` 的原因：`getForm()` 返回的是**普通对象**
 * （不是 FormStore 实例），而且用户可以从别处拿到同形状的实例。
 */
export function isFormInstance(form: unknown): boolean {
  return Boolean(form && (form as InternalFormInstance)._init);
}
