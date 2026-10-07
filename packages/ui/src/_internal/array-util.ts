/**
 * 键集合的增删（`rc-tree` `util.js` 里 `arrDel` / `arrAdd` 的逐字移植）。
 *
 * ── 为什么在 `_internal/` 而不是留在 `tree/utils/util.ts` ──────────────────────
 *
 * 裁决 `early-extract-table-core-tree-core` = **C**（2026-10-07）：它有 **≥2 个消费者**
 * —— `tree` 与 `table`（`use-selection.ts` 用它增删选中行 key）。
 * 而它跟「树」没有任何关系，只是「键数组」的通用操作 ⇒ 放在组件目录里会让
 * `table` 去 import `tree/`，违反「组件间不得互相 import 组件目录」。
 *
 * ⚠️ 泛型是**有意放宽**：原来签名写死 `TreeKey[]`，`table` 那边拿到的是
 * `SafeKey`（行 key）。改成 `<T>` 后两侧都不需要断言 —— 这不是放宽类型，
 * 而是把本来就成立的多态写出来（H10 禁的是 `any`，不是泛型）。
 *
 * 语义（逐字保持 rc 的行为，别「顺手优化」）：
 *   - 都**不改原数组**（先 `slice()` 克隆）；
 *   - `arrDel` 在 `list` 为 `null` / `undefined` 时返回 **`[]`**；
 *   - `arrAdd` **去重**（已存在则不再追加）。
 */

/** 从 `list` 里移除 `value`（不存在则原样返回副本）。`list` 为空时返回 `[]`。 */
export function arrDel<T>(list: T[] | undefined | null, value: T): T[] {
  if (!list) return [];
  const clone = list.slice();
  const index = clone.indexOf(value);
  if (index >= 0) {
    clone.splice(index, 1);
  }
  return clone;
}

/** 把 `value` 追加进 `list`（已存在则不追加）。`list` 为空时按空数组处理。 */
export function arrAdd<T>(list: T[] | undefined | null, value: T): T[] {
  const clone = (list || []).slice();
  if (clone.indexOf(value) === -1) {
    clone.push(value);
  }
  return clone;
}
