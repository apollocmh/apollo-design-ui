/**
 * `isEqual` —— 深比较两个值。
 *
 * 契约来源：`@rc-component/util/isEqual`。
 *
 * ⚠️ 这个实现有一个**必须保留的 quirk**（依据：docs/foundation/rc-util-contract.md §6.2）：
 *
 *   `refSet` 在整个顶层调用内**共享**，每次进入 `deepEqual(a, …)` 都把 `a` 加进去。
 *   因此「同一个对象在一棵树里出现两次」（非环，只是共享引用）会被判为**不相等**：
 *
 *     const shared = { x: 1 };
 *     isEqual({ a: shared, b: shared }, { a: { x: 1 }, b: { x: 1 } })  // → false
 *
 *   看起来像 bug，但 antd 用它比较 theme / classNames 配置，这些配置里共享子对象是常态。
 *   改成"正确"的按路径追踪会让某些配置从「不等」变成「相等」，
 *   从而**少触发**一次主题重算 —— 那是更难排查的问题。
 *
 * 其它边界（全部与 rc-util 一致，测试会覆盖）：
 *   - `isEqual(NaN, NaN) === false`（走不到 `a === b` 分支）
 *   - `isEqual(new Date(0), new Date(0)) === false`（非数组非普通对象 → 直接 false）
 *   - `isEqual([1], {0: 1}) === false`（类型不同）
 *   - 检测到环时**告警并返回 false**
 */

import warningOnce from './warning';

function isEqual(obj1: unknown, obj2: unknown, shallow = false): boolean {
  const refSet = new Set<unknown>();

  function deepEqual(a: unknown, b: unknown, level = 1): boolean {
    const circular = refSet.has(a);
    // 注意用 warningOnce（rc-util 的 isEqual 导入的是 warning 模块的默认导出）：
    // 环检测告警文本固定，全局只打一次。用 warning 会让深层大对象刷屏。
    warningOnce(!circular, 'Warning: There may be circular references');
    if (circular) {
      return false;
    }
    if (a === b) {
      return true;
    }
    if (shallow && level > 1) {
      return false;
    }

    refSet.add(a);
    const nextLevel = level + 1;

    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i += 1) {
        if (!deepEqual(a[i], b[i], nextLevel)) {
          return false;
        }
      }
      return true;
    }

    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const keys = Object.keys(a);
      if (keys.length !== Object.keys(b).length) {
        return false;
      }
      return keys.every((key) =>
        deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
          nextLevel,
        ),
      );
    }

    return false;
  }

  return deepEqual(obj1, obj2);
}

export default isEqual;
