/**
 * `omit` —— 浅拷贝并删除指定键。
 *
 * 契约来源：`@rc-component/util/omit`。
 *
 * ⚠️ 三个容易被"顺手优化掉"的行为，必须保留：
 *   1. **浅拷贝**：嵌套对象仍是同一引用。`omit` 不是深拷贝工具。
 *   2. `fields` 不是数组时**不删任何键**，只返回浅拷贝（原实现的 `Array.isArray` 守卫）。
 *      这不是 bug，而是「宽容入参」；`fields` 常来自 `Object.keys()` 结果或字面量数组。
 *   3. 用 `delete` 而非重建对象 —— 保留键的插入顺序，且不触发 getter 求值。
 *
 * 为什么不用 `Object.fromEntries(Object.entries(obj).filter(...))` 这种"更函数式"的写法：
 *   它会丢失原型链上的可枚举属性（`Object.assign` 会拷贝它们），行为不等价。
 */
export default function omit<T extends object, K extends keyof T>(
  obj: T,
  fields: K[] | readonly K[],
): Omit<T, K> {
  const clone = Object.assign({}, obj) as Record<string, unknown>;
  if (Array.isArray(fields)) {
    for (const key of fields) {
      delete clone[key as string];
    }
  }
  return clone as Omit<T, K>;
}
