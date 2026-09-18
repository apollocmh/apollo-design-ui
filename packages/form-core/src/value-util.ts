/**
 * namePath 的取值 / 赋值 / 比较工具。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/utils/valueUtil.js`（114 行）
 * + `es/utils/typeUtil.js`（8 行）。逐条对照见
 * `docs/foundation/form-core-contract.md` §4.6。
 *
 * ⚠️⚠️ **`toArray` 同名不同义，不要复用 `@apollo-design/utils` 的那个**。
 *
 * `utils` 的 `toArray(children)` 是**为 Vue children 设计**的（展平 vnode、
 * 拆 Fragment、返回 `VNode[]`）；而这里的 `toArray(namePath)` 是
 * **为 namePath 设计**的（`undefined`/`null` ⇒ `[]`，其余包成数组，
 * 返回 `(string | number)[]`）。两者只是名字撞了。
 *
 * ⚠️ 而 `get` / `set` **可以**复用 —— `utils` 的 `object.ts` 就是
 * `@rc-component/util` 的 `get` / `set` 的移植（含「中途遇到 null/undefined
 * 立即返回 undefined」那条语义）。上游 `valueUtil.js` 本身就是从
 * `@rc-component/util` re-export 这两个函数（第 1 行），所以这里是**同一个来源**。
 */

import { get, set } from '@apollo-design/utils';

import type { DeepNamePath } from './name-path-type';

export { get as getValue, set as setValue };

/**
 * 用户书写的路径：单个键、键的数组，**或深推导路径**（`DeepNamePath<T>`）。
 *
 * ⭐ 为什么必须把 `DeepNamePath<T>` 并进来：`form-types.ts` 里**公开**的
 * `NamePath<T>` 就是它，而 `getNamePath` / `toArray` 要能接受那个类型
 * —— 上游 `utils/valueUtil.d.ts` 正是 `import type { NamePath } from '../interface'`，
 * 即两边本来就是**同一个**类型。
 *
 * ⚠️ 泛型默认值取 **`never`** 而不是 `any`：`DeepNamePath<never>` 化简为 `never`，
 * 于是**不给泛型参数时**这个别名与批次② 收口时完全一致
 * （`string | number | InternalNamePath`）—— 既不悄悄放宽已收口的两个函数，
 * 又让「开放泛型」的调用方可以显式写 `getNamePath<Values>(deepPath)` 通过。
 */
export type NamePath<T = never> = string | number | InternalNamePath | DeepNamePath<T>;

/** 内部统一形态：键的数组。 */
export type InternalNamePath = (string | number)[];

/**
 * namePath 版的 `toArray`。
 *
 * `undefined` / `null` ⇒ `[]`；已经是数组则原样返回（**不拷贝**）；
 * 其余（含 `0` 与 `''`）⇒ `[value]`。
 *
 * ⚠️ 形参带 `| null`：运行时本来就把 `null` 当空路径（上游签名
 * `getNamePath(path: NamePath | null)` 也允许），之前漏写导致测试里要写
 * `null as never` 才编得过 —— 那是**声明没跟上运行时**，不是运行时的问题。
 */
export function toArray<T = never>(value?: NamePath<T> | null): InternalNamePath {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? (value as InternalNamePath) : ([value] as InternalNamePath);
}

/**
 * `a` / `123` / `['a', 123]` 都归一成 `['a']` / `[123]` / `['a', 123]`。
 */
export function getNamePath<T = never>(path?: NamePath<T> | null): InternalNamePath {
  return toArray<T>(path);
}

/**
 * 从 `store` 里抽出 `namePathList` 指到的那些值，组成一个新对象。
 *
 * ⭐ 用途：`validateFields(['a.b'])` 时只需要把被校验的字段摘出来。
 * 实现是「逐个 get 再逐个 set」，所以**中间层级会被创建**（`set` 的默认行为）。
 */
export function cloneByNamePathList(
  store: Record<string, unknown>,
  namePathList: InternalNamePath[],
): Record<string, unknown> {
  let newStore: Record<string, unknown> = {};
  namePathList.forEach((namePath) => {
    const value = get(store, namePath);
    newStore = set(newStore, namePath, value) as Record<string, unknown>;
  });
  return newStore;
}

/**
 * `namePathList` 里有没有匹配 `namePath` 的项。
 *
 * @param partialMatch 为 `true` 时 `[a, b]` 能匹配 `[a, b, c]`
 */
export function containsNamePath(
  namePathList: InternalNamePath[] | undefined | null,
  namePath: InternalNamePath,
  partialMatch = false,
): boolean | null | undefined {
  // ⭐⭐ **不要**写成 `!!namePathList && ...`。
  //
  // 上游是 `namePathList && namePathList.some(...)` —— 短路时返回的是
  // `namePathList` **本身**（`null` / `undefined`），不是 `false`。
  // 所以返回类型是 `boolean | null | undefined` 三态。
  //
  // 这个差异是 **Oracle 抓出来的**：`containsNamePath(null, ['a'])` 上游得 `null`，
  // 加 `!!` 后我们得 `false`。手写断言几乎不可能注意到（两者都是 falsy）。
  return namePathList && namePathList.some((path) => matchNamePath(namePath, path, partialMatch));
}

/**
 * `namePath` 是不是 `subNamePath` 的「超集或相等」。
 *
 * ⭐ 两个细节：
 * 1. `!namePath || !subNamePath` ⇒ `false`（空路径不匹配任何东西）；
 * 2. 非 `partialMatch` 时长度必须相等 —— 所以 `['a']` **不**匹配 `['a','b']`。
 *
 * ⚠️ 参数顺序容易写反：第一个是**待比较的**（父），第二个是**被包含的**（子）。
 */
export function matchNamePath(
  namePath: InternalNamePath | null | undefined,
  subNamePath: InternalNamePath | null | undefined,
  partialMatch = false,
): boolean {
  if (!namePath || !subNamePath) {
    return false;
  }
  if (!partialMatch && namePath.length !== subNamePath.length) {
    return false;
  }
  return subNamePath.every((nameUnit, i) => namePath[i] === nameUnit);
}

/**
 * 浅比较，但**跳过函数**（两个函数永远视为相等）。
 *
 * ⭐ 为什么跳过函数：这个函数用在「值有没有变」的判定上，而
 * `onChange` 之类的回调每次渲染都是新引用 —— 比较它们会导致**无意义的
 * 重渲染**。上游注释写得很清楚：`we not check the data which may cause re-render`。
 *
 * ⚠️ 注意它的宽松程度：`{a: 1}` 与 `{a: 1, b: 2}` 会因为 `b` 只在一侧而
 * `undefined === undefined`？不 —— `sourceValue`/`targetValue` 取的是同一个 key，
 * 缺失的一侧得到 `undefined`，与另一侧的值比较。所以 `{a: 1}` vs `{a: 1, b: 2}`
 * ⇒ `b` 上 `undefined !== 2` ⇒ `false` ✓
 */
export function isSimilar(
  source: Record<string, unknown> | null | undefined,
  target: Record<string, unknown> | null | undefined,
): boolean {
  if (source === target) {
    return true;
  }
  // ⚠️ 上游写的是 `!source && target || source && !target` —— 等价于「只有一侧为假值」
  if ((!source && target) || (source && !target)) {
    return false;
  }
  if (!source || !target || typeof source !== 'object' || typeof target !== 'object') {
    return false;
  }

  const sourceKeys = Object.keys(source);
  const targetKeys = Object.keys(target);
  const keys = new Set([...sourceKeys, ...targetKeys]);

  return [...keys].every((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (typeof sourceValue === 'function' && typeof targetValue === 'function') {
      return true;
    }
    return sourceValue === targetValue;
  });
}

/**
 * 从事件对象里取值（`getValueFromEvent` 的默认实现）。
 *
 * ⭐ 判据是 `valuePropName in event.target` —— 用 `in` 而不是 `!== undefined`，
 * 所以 `value={undefined}` 的表单控件也能正确取到 `undefined`。
 *
 * ⚠️ 其余参数（`...args`）**被忽略** —— 上游签名里有，但实现只用了 `args[0]`。
 * 保留形参是为了与调用方的签名兼容。
 */
export function defaultGetValueFromEvent(valuePropName: string, ...args: unknown[]): unknown {
  const event = args[0] as { target?: Record<string, unknown> } | null | undefined;
  if (event?.target && typeof event.target === 'object' && valuePropName in event.target) {
    return event.target[valuePropName];
  }
  return event;
}

/**
 * 把数组里的一项从 `moveIndex` 移到 `toIndex`。
 *
 * ⭐ **纯函数** —— 返回新数组，不改入参。
 *
 * ⚠️ 三个边界（上游都返回**原数组引用**，不是副本）：
 * 1. `moveIndex` 或 `toIndex` 越界（含负数）⇒ 原样返回；
 * 2. 两个下标相等 ⇒ 原样返回；
 * 3. 入参不是数组 ⇒ 会在读 `.length` 时抛（上游同样如此，不加防御）。
 */
export function move<T>(array: T[], moveIndex: number, toIndex: number): T[] {
  const { length } = array;
  if (moveIndex < 0 || moveIndex >= length || toIndex < 0 || toIndex >= length) {
    return array;
  }

  const item = array[moveIndex] as T;
  const diff = moveIndex - toIndex;

  if (diff > 0) {
    // 向左移
    return [
      ...array.slice(0, toIndex),
      item,
      ...array.slice(toIndex, moveIndex),
      ...array.slice(moveIndex + 1, length),
    ];
  }
  if (diff < 0) {
    // 向右移
    return [
      ...array.slice(0, moveIndex),
      ...array.slice(moveIndex + 1, toIndex + 1),
      item,
      ...array.slice(toIndex + 1, length),
    ];
  }
  return array;
}
