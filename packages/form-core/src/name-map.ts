/**
 * `NameMap` —— 用 `string[]` 当键的 Map。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/utils/NameMap.js`（75 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.6。
 *
 * ── 为什么要它 ────────────────────────────────────────────────────────────────
 *
 * `Map` 用**引用相等**比较键，而 `['a', 'b'] !== ['a', 'b']` —— 每次调用
 * `getFieldValue(['a','b'])` 都传新数组，直接当键会永远 miss。
 * 所以先把 namePath 编码成**字符串**（`normalize`），再拿字符串当 Map 的键。
 *
 * ── ⭐ 编码方案（这是本文件最需要小心的地方） ────────────────────────────────
 *
 * ```js
 * ['a', 1]  ⇒  'string:a__@field_split__number:1'
 * ```
 *
 * 每个单元编码成 `` `${typeof cell}:${cell}` ``，用 `__@field_split__` 连接。
 * 加 `typeof` 前缀是为了区分 `1`（number）与 `'1'`（string）——
 * 否则 `['a', 1]` 与 `['a', '1']` 会撞键。
 *
 * ⚠️ 编码是**有损**的：如果某个键**字面**含有 `__@field_split__` 或形如 `xxx:`，
 * 就会与别的路径撞键。上游接受这个限制（正常表单字段名不会这么写）。
 * 我们不"修"它 —— 改了会让 `map()` 的反解逻辑与上游不一致。
 */

/** ⚠️ 这个分隔符是**协议的一部分** —— `getAsPrefix` 与 `map` 的反解都依赖它。 */
const SPLIT = '__@field_split__';

/**
 * 把 namePath 编码成字符串键。
 *
 * ⭐ 每个单元带 `typeof` 前缀 ⇒ `1` 与 `'1'` 不会撞。
 */
function normalize(namePath: (string | number)[]): string {
  return (
    namePath
      .map((cell) => `${typeof cell}:${cell}`)
      // Magic split
      .join(SPLIT)
  );
}

/** `map()` 反解时用：把 `'number:1'` 还原成 `1`。 */
const CELL_RE = /^([^:]*):(.*)$/;

export class NameMap<V> {
  private kvs = new Map<string, V>();

  set(key: (string | number)[], value: V): void {
    this.kvs.set(normalize(key), value);
  }

  get(key: (string | number)[]): V | undefined {
    return this.kvs.get(normalize(key));
  }

  /**
   * 取「`key` 本身 + 所有以 `key` 为前缀的项」。
   *
   * ⭐ 两条容易漏的：
   * 1. **`key` 自己也算**（`current !== undefined` 时先 push 它）；
   * 2. 前缀判定是 `itemKey.startsWith(normalizedKey + SPLIT)` —— **必须带 SPLIT**，
   *    否则 `['a']` 会错误地匹配 `['ab']`（`'string:a'` 是 `'string:ab'` 的前缀）。
   *
   * ⚠️ 顺序：`key` 自己在前，其余按 Map 的插入顺序 —— 上游如此，别排序。
   */
  getAsPrefix(key: (string | number)[]): V[] {
    const normalizedKey = normalize(key);
    const normalizedPrefix = normalizedKey + SPLIT;
    const results: V[] = [];

    const current = this.kvs.get(normalizedKey);
    if (current !== undefined) {
      results.push(current);
    }

    this.kvs.forEach((value, itemNormalizedKey) => {
      if (itemNormalizedKey.startsWith(normalizedPrefix)) {
        results.push(value);
      }
    });

    return results;
  }

  /**
   * 用 `updater` 更新一项。
   *
   * ⭐ **`updater` 返回假值 ⇒ 删除该项**（不是"写假值"）。
   * 所以 `update(key, () => undefined)` 与 `delete(key)` 等价。
   */
  update(key: (string | number)[], updater: (origin: V | undefined) => V | undefined): void {
    const origin = this.get(key);
    const next = updater(origin);
    if (!next) {
      this.delete(key);
    } else {
      this.set(key, next);
    }
  }

  delete(key: (string | number)[]): void {
    this.kvs.delete(normalize(key));
  }

  /**
   * 遍历（**主要给测试与调试用**）。
   *
   * ⭐ 会把字符串键**反解回 namePath**：`'string:a__@field_split__number:1'`
   * ⇒ `['a', 1]`。数字单元被还原成 `number`（靠 `typeof` 前缀）。
   */
  map<T>(callback: (item: { key: (string | number)[]; value: V }) => T): T[] {
    return [...this.kvs.entries()].map(([key, value]) => {
      const cells = key.split(SPLIT);
      return callback({
        key: cells.map((cell) => {
          const matched = cell.match(CELL_RE);
          // ⚠️ 上游直接解构 `const [, type, unit] = cell.match(...)` ——
          //    匹配失败会抛。这里显式处理成「原样返回」，行为差异见契约 §4.6 的登记。
          if (!matched) {
            return cell;
          }
          const [, type, unit] = matched;
          return type === 'number' ? Number(unit) : (unit as string);
        }),
        value,
      });
    });
  }

  /** 转成 `{ 'a.b': value }` 形态（键用 `.` 连接）。 */
  toJSON(): Record<string, V> {
    const json: Record<string, V> = {};
    this.map(({ key, value }) => {
      json[key.join('.')] = value;
      return null;
    });
    return json;
  }
}

export default NameMap;
