/**
 * 对象路径读写与深合并。
 *
 * 契约来源：`@rc-component/util/utils/get` + `utils/set`。
 * antd 的 `form` 重度依赖（`get` / `set` 各 1 处直接导入，但内部通过 `_util` 间接使用更多），
 * `calendar` / `config-provider` / `date-picker` 用 `merge`。
 *
 * 核心不变式：**全部不可变**。`set` / `merge` 返回新对象，原对象永远不被修改。
 * 这是 React 生态的强约定；在 Vue 里同样重要 —— 就地修改会绕过响应式追踪。
 */

export type Path = (string | number | symbol)[];

/**
 * 按路径取值。中途遇到 `null` / `undefined` 立即返回 `undefined`（不抛错）。
 */
export default function get(entity: unknown, path: readonly (string | number | symbol)[]): unknown {
  let current: unknown = entity;
  for (let i = 0; i < path.length; i += 1) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string | number | symbol, unknown>)[path[i] as string];
  }
  return current;
}

function internalSet(
  entity: unknown,
  paths: Path,
  value: unknown,
  removeIfUndefined: boolean,
): unknown {
  if (!paths.length) {
    return value;
  }

  const [path, ...restPath] = paths as [string | number | symbol, ...(string | number | symbol)[]];

  let clone: Record<string | number | symbol, unknown> | unknown[];
  if (!entity && typeof path === 'number') {
    // 没有父对象、且当前路径是数字 → 建数组（而不是 `{0: ...}`）
    clone = [];
  } else if (Array.isArray(entity)) {
    clone = [...entity];
  } else {
    clone = { ...(entity as Record<string | number | symbol, unknown>) };
  }

  if (removeIfUndefined && value === undefined && restPath.length === 1) {
    // ⚠️ quirk（与 rc-util 一致，必须保留）：这里改的是 clone 里**共享的子对象**，
    //    因为上面的拷贝是浅的。测试会锁定这个行为。
    const parent = (
      clone as Record<string | number | symbol, Record<string | number | symbol, unknown>>
    )[path];
    const leaf = restPath[0] as string | number | symbol;
    if (parent) {
      delete parent[leaf];
    }
  } else {
    (clone as Record<string | number | symbol, unknown>)[path] = internalSet(
      (clone as Record<string | number | symbol, unknown>)[path],
      restPath,
      value,
      removeIfUndefined,
    );
  }

  return clone;
}

/**
 * 按路径写值，返回**新**对象。
 *
 * @param removeIfUndefined 为 `true` 时，写 `undefined` 等价于删除该键；
 *        并且当父路径不存在时直接原样返回 `entity`（不凭空创建中间层级）。
 */
export function set<Entity = unknown, Output = Entity, Value = unknown>(
  entity: Entity,
  paths: Path,
  value: Value,
  removeIfUndefined = false,
): Output {
  if (
    paths.length &&
    removeIfUndefined &&
    value === undefined &&
    !get(entity, paths.slice(0, -1))
  ) {
    return entity as unknown as Output;
  }
  return internalSet(entity, paths, value, removeIfUndefined) as Output;
}

export type MergeFn = (current: unknown, next: unknown) => unknown;

/** 「纯对象」判定：原型链直接指向 `Object.prototype`。数组 / Date / Map / class 实例都不算。 */
function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

function createEmpty(source: unknown): Record<string, unknown> | unknown[] {
  return Array.isArray(source) ? [] : {};
}

const ownKeys: (obj: object) => (string | symbol)[] =
  typeof Reflect === 'undefined'
    ? (Object.keys as unknown as (obj: object) => (string | symbol)[])
    : Reflect.ownKeys;

/**
 * 合并多个对象。支持自定义数组合并策略。
 *
 * 默认行为：**数组整体替换**（`prepareArray` 默认返回 `[]`，随后由源数组覆盖）。
 * 这与 `Object.assign` 的浅合并不同：它会递归进纯对象，但不会递归进数组。
 */
export function mergeWith<T extends object>(
  sources: T[],
  config: { prepareArray?: MergeFn } = {},
): T {
  const prepareArray = config.prepareArray ?? (() => []);

  let clone: Record<string, unknown> | unknown[] = createEmpty(sources[0]);

  for (const src of sources) {
    const internalMerge = (path: Path, parentLoopSet: Set<unknown>): void => {
      const loopSet = new Set(parentLoopSet);
      const value = get(src, path);
      const isArr = Array.isArray(value);

      if (isArr || isObject(value)) {
        // 环检测：同一引用在本次合并路径上已经出现过 → 跳过整棵子树
        if (loopSet.has(value)) return;
        loopSet.add(value);

        const originValue = get(clone, path);
        if (isArr) {
          clone = set(clone, path, prepareArray(originValue, value)) as
            | Record<string, unknown>
            | unknown[];
        } else if (!originValue || typeof originValue !== 'object') {
          // 目标位置还没有容器 → 建一个同类型的空容器
          clone = set(clone, path, createEmpty(value)) as Record<string, unknown> | unknown[];
        }

        for (const key of ownKeys(value as object)) {
          if (Object.getOwnPropertyDescriptor(value as object, key)?.enumerable) {
            internalMerge([...path, key], loopSet);
          }
        }
        return;
      }

      clone = set(clone, path, value) as Record<string, unknown> | unknown[];
    };

    internalMerge([], new Set());
  }

  return clone as T;
}

/** 合并多个对象为一个新对象。数组默认被整体替换。 */
export function merge<T extends object>(...sources: T[]): T {
  return mergeWith(sources);
}
